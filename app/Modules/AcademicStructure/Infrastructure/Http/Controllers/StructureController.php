<?php

namespace App\Modules\AcademicStructure\Infrastructure\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\AcademicStructure\AcademicCycle;
use App\Models\AcademicStructure\AcademicDepartment;
use App\Models\AcademicStructure\AcademicProgram;
use App\Models\AcademicStructure\AcademicPromotion;
use App\Models\AcademicStructure\AdmissionCohort;
use App\Models\AcademicStructure\CurriculumVersion;
use App\Models\AcademicStructure\University;
use App\Models\AcademicYear;
use App\Models\Classes;
use App\Models\Courses;
use App\Models\Faculty;
use App\Models\Level;
use App\Models\Site;
use App\Models\Student\AcademicAudit;
use App\Models\Student\AcademicEnrollment;
use App\Models\Student\AcademicSemester;
use App\Modules\AcademicStructure\Application\Services\CurriculumService;
use App\Modules\AcademicStructure\Application\Services\StructureService;
use App\Modules\AcademicStructure\Infrastructure\Http\Requests\SaveStructureRequest;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class StructureController extends Controller
{
    public function __construct(private StructureService $structure, private CurriculumService $curricula) {}

    public function index(Request $request)
    {
        Gate::authorize('viewAny', AcademicProgram::class);
        $filters = $request->validate(['tab' => 'nullable|in:institution,faculties,programs,curriculum', 'year' => 'nullable|integer', 'program' => 'nullable|integer', 'version' => 'nullable|integer', 'level' => 'nullable|integer', 'compare' => 'nullable|integer', 'q' => 'nullable|string|max:100', 'student_q' => 'nullable|string|max:100']);
        if (($filters['tab'] ?? null) === 'faculties') {
            return redirect()->route('dashboard.admin.faculties.index');
        }

        $institution = University::with('site')->where('context_key', 'current')->first();
        $scope = fn ($q) => $q->where('university_id', $institution?->id ?? -1);
        $program = ! empty($filters['program']) ? $this->structure->program($filters['program']) : null;
        $version = ! empty($filters['version']) ? $this->curricula->owned($filters['version'])->load('units.items') : null;
        if ($version) {
            abort_unless(! $program || $program->id === $version->academic_program_id, 404);
            $program ??= $this->structure->program($version->academic_program_id);
        }
        abort_if($program && ! \App\Modules\Teaching\Application\Services\TeachingScope::allows($request->user(), (int) $program->faculty_id), 403);
        $years = AcademicYear::where(fn ($q) => $q->whereNull('university_id')->orWhere('university_id', $institution?->id ?? -1))
            ->orderByDesc('start_date')->get(['id', 'title', 'university_id']);
        $packYear = $version?->academic_year_id ?? ($filters['year'] ?? $years->first()?->id);
        $scheduleYear = $version?->academic_year_id ?? $version?->cohort?->academic_year_id;
        $facultyPack = $institution && $years->contains('id', $packYear) && (($filters['tab'] ?? null) === 'curriculum' || $version)
            ? $this->curricula->annualFacultyPack($institution, (int) $packYear)
            : [];

        $manage = Gate::allows('manage', AcademicProgram::class);
        $programs = AcademicProgram::with(['faculty:id,name', 'cycle:id,name', 'levels:id,title,code'])->withCount('versions')->whereHas('faculty', $scope)
            ->when($request->user()->academicFaculties()->exists(), fn ($q) => $q->whereIn('faculty_id', $request->user()->academicFaculties()->select('faculties.id')))
            ->when($filters['q'] ?? null, fn ($q, $search) => $q->where(fn ($q) => $q->where('name', 'like', '%'.$search.'%')->orWhere('code', 'like', '%'.$search.'%')))->orderBy('name')->paginate(20, ['*'], 'programs_page')->withQueryString();
        $studentQuery = fn () => \App\Modules\Student\Application\Services\AcademicStaffScope::apply(AcademicEnrollment::query(), $request->user())->with(['profile.user:id,first_name,last_name', 'level:id,title', 'academicYear:id,title'])
            ->when($filters['student_q'] ?? null, fn ($q, $value) => $q->where(fn ($q) => $q->where('matricule', 'like', '%'.$value.'%')->orWhereHas('profile.user', fn ($q) => $q->where('first_name', 'like', '%'.$value.'%')->orWhere('last_name', 'like', '%'.$value.'%'))))
            ->whereHas('level.faculty', fn ($q) => $q->whereNull('university_id')->orWhere('university_id', $institution?->id ?? -1));

        return Inertia::render('dashboard/academicStructure/Index', [
            'institution' => $institution, 'sites' => Site::get(['id', 'site_name', 'address', 'contact_email', 'contact_phone']),
            'faculties' => Faculty::where(fn ($q) => $q->whereNull('university_id')->orWhere('university_id', $institution?->id ?? -1))->orderBy('name')->get(['id', 'name', 'university_id']),
            'years' => $years, 'packYear' => $packYear === null ? null : (int) $packYear, 'facultyPack' => $facultyPack,
            'levels' => Level::whereHas('faculty', fn ($q) => $q->whereNull('university_id')->orWhere('university_id', $institution?->id ?? -1))->orderBy('title')->get(['id', 'faculty_id', 'title', 'code']),
            'departments' => AcademicDepartment::whereHas('faculty', $scope)->orderBy('name')->get(),
            'cycles' => AcademicCycle::where('university_id', $institution?->id ?? -1)->orderBy('name')->get(),
            'programs' => $programs, 'selectedProgram' => $program,
            'cohorts' => $program ? AdmissionCohort::where('academic_program_id', $program->id)->orderBy('name')->get() : [],
            'groups' => $program ? Classes::with('intake:id,name')->where('faculty_id', $program->faculty_id)->whereIn('level_id', $program->levels->pluck('id'))->get()->map(fn ($group) => ['id' => $group->id, 'level_id' => $group->level_id, 'name' => ($group->intake?->name ?? 'Groupe '.$group->id), 'academic_promotion_id' => $group->academic_promotion_id]) : [],
            'promotions' => $program ? AcademicPromotion::where('academic_program_id', $program->id)->with(['level:id,title', 'academicYear:id,title'])->orderBy('name')->get() : [],
            'versions' => $program ? $program->versions()->withCount('enrollments')->latest()->paginate(10, ['*'], 'versions_page')->withQueryString() : null,
            'selectedVersion' => $version,
            'levelWorkspace' => $version && $program ? $this->curricula->levelWorkspace($version, $program) : [],
            'scheduleSemesters' => $scheduleYear ? AcademicSemester::where('academic_year_id', $scheduleYear)->orderBy('number')
                ->get(['id', 'number', 'start_date', 'end_date']) : [],
            'activeVersions' => $program ? $program->versions()->where('status', 'published')->get() : [],
            'catalog' => $program ? Courses::where('catalog_status', 'active')->whereIn('level_id', $program->levels->pluck('id'))->orderBy('title')->get(['id', 'level_id', 'code', 'title', 'credits', 'cmi_hours', 'td_hours', 'tp_hours', 'semester']) : [],
            'comparison' => $version && ! empty($filters['compare']) ? $this->curricula->compare($version->id, $filters['compare']) : null,
            'affected' => $version && $manage ? $studentQuery()->where('curriculum_version_id', $version->id)->orderBy('id')->paginate(20, ['*'], 'students_page')->withQueryString() : null,
            'unmapped' => $manage ? $studentQuery()->whereNull('curriculum_version_id')->orderBy('id')->paginate(20, ['*'], 'unmapped_page')->withQueryString() : null,
            'audit' => $version ? AcademicAudit::where('entity_type', 'curriculum_versions')->where('entity_id', $version->id)->latest()->limit(20)->get(['id', 'actor_id', 'action', 'reason', 'created_at']) : [],
            'abilities' => ['manage' => $manage, 'curriculum' => Gate::allows('curriculum', AcademicProgram::class)],
            'filters' => $filters, 'success' => session('success'), 'annualBatch' => session('annualBatch'), 'scheduleGeneration' => session('scheduleGeneration'),
        ]);
    }

    public function reference(SaveStructureRequest $request, string $kind, ?int $id = null)
    {
        try {
            $model = $this->structure->save($kind, $request->validated(), $request->user(), $id);
        } catch (UniqueConstraintViolationException $exception) {
            throw ValidationException::withMessages(['code' => 'Ce code ou ce contexte existe déjà. Rechargez le référentiel.']);
        }

        if (in_array($kind, ['department', 'faculty-context'], true)) {
            return redirect()->route('dashboard.admin.faculties.index', [
                'faculty' => $kind === 'department' ? $model->faculty_id : $model->id,
            ]);
        }

        $destination = match ($kind) {
            'university' => ['tab' => 'institution'],
            'year-context' => ['tab' => 'programs'],
            'program' => ['program' => $model->id],
            default => [],
        };

        return redirect()->route('dashboard.admin.academic-structure.index', $destination)->with('success', $kind === 'university' ? 'Informations de l’établissement enregistrées.' : 'Référentiel enregistré.');
    }

    public function annualDrafts(Request $request)
    {
        Gate::authorize('curriculum', AcademicProgram::class);
        $data = $request->validate(['academic_year_id' => 'required|integer|exists:academic_years,id']);
        $result = $this->curricula->draftAnnualBatch($data['academic_year_id'], $request->user(), $this->scheduleRooms($request));

        return redirect()->route('dashboard.admin.academic-structure.index', ['tab' => 'curriculum', 'year' => $data['academic_year_id']])->with('annualBatch', $result);
    }

    public function draft(Request $request)
    {
        try {
            $version = $this->curricula->draft($request->all(), $request->user());
        } catch (UniqueConstraintViolationException $exception) {
            throw ValidationException::withMessages(['code' => 'Ce code de version existe déjà dans le programme.']);
        }

        return $this->versionRedirect($version)
            ->with('scheduleGeneration', $this->curricula->scheduleDraft($version->id, $request->user()));
    }

    public function draftSchedule(Request $request, int $version)
    {
        $result = $this->curricula->scheduleDraft($version, $request->user(), $this->scheduleRooms($request));
        if ($result === null) {
            throw ValidationException::withMessages(['rooms' => 'Reprenez le brouillon avant de compléter son horaire.']);
        }

        return $this->versionRedirect($this->curricula->owned($version))->with('scheduleGeneration', $result);
    }

    private function scheduleRooms(Request $request): array
    {
        $data = $request->validate(['rooms' => 'nullable|array|max:150', 'rooms.*' => 'required|string|max:180']);

        return $data['rooms'] ?? [];
    }

    public function save(Request $request, int $version)
    {
        try {
            $saved = $this->curricula->saveDraft($version, $request->all(), $request->user());
        } catch (UniqueConstraintViolationException $exception) {
            throw ValidationException::withMessages(['units' => 'Deux unités possèdent le même code dans un même niveau et une même période.']);
        }

        return $this->versionRedirect($saved);
    }

    public function approveLevel(Request $request, int $version, int $level)
    {
        $data = $request->validate(['revision' => 'required|integer|min:0', 'signature' => 'required|string|size:64']);
        $saved = $this->curricula->approveLevel($version, $level, $data['revision'], $data['signature'], $request->user());

        return $this->versionRedirect($saved)->with('success', 'Niveau validé.');
    }

    public function transition(Request $request, int $version)
    {
        $data = $request->validate(['action' => 'required|in:validate,reopen,publish,archive', 'revision' => 'required|integer|min:0', 'reason' => 'required|string|min:5|max:1000', 'replace_id' => 'nullable|integer']);
        $saved = $this->curricula->transition($version, $data['action'], $data['revision'], $data['reason'], $request->user(), $data['replace_id'] ?? null);

        return $this->versionRedirect($saved);
    }

    public function bind(Request $request, int $version)
    {
        $data = $request->validate(['enrollment_id' => 'required|integer', 'reason' => 'required|string|min:5|max:1000']);
        $this->curricula->bind($version, $data['enrollment_id'], $request->user(), $data['reason']);

        return $this->versionRedirect($this->curricula->owned($version));
    }

    private function versionRedirect(CurriculumVersion $version)
    {
        return redirect()->route('dashboard.admin.academic-structure.index', ['program' => $version->academic_program_id, 'version' => $version->id])->with('success', 'Maquette enregistrée.');
    }
}
