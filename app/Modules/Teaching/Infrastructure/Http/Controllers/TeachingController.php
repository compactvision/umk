<?php

namespace App\Modules\Teaching\Infrastructure\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\AcademicStructure\AcademicProgram;
use App\Models\AcademicStructure\CurriculumItem;
use App\Models\AcademicStructure\CurriculumUnit;
use App\Models\AcademicStructure\CurriculumVersion;
use App\Models\AcademicYear;
use App\Models\Classes;
use App\Models\Professor;
use App\Models\Student\AcademicEnrollment;
use App\Models\Student\AcademicOffering;
use App\Models\Student\AcademicSemester;
use App\Models\Student\CourseRegistration;
use App\Modules\Teaching\Application\Services\CourseAudience;
use App\Modules\Teaching\Application\Services\CourseRegistrationService;
use App\Modules\Teaching\Application\Services\TeachingOfferingService;
use App\Modules\Teaching\Application\Services\TeachingScope;
use App\Modules\Teaching\Application\Services\TeachingTeam;
use Illuminate\Http\Request;
use Inertia\Inertia;

final class TeachingController extends Controller
{
    private const REASON = 'required|string|min:10|max:1000';

    public function index(Request $request, CourseAudience $audience)
    {
        $actor = $request->user();
        abort_unless($actor->canAny(['publish academic content', 'manage academic access']), 403);
        $filters = $request->validate([
            'year' => 'nullable|integer|exists:academic_years,id', 'program' => 'nullable|integer|exists:academic_programs,id',
            'version' => 'nullable|integer|exists:curriculum_versions,id', 'offering' => 'nullable|integer',
            'q' => 'nullable|string|max:100', 'status' => 'nullable|in:draft,published,archived', 'student' => 'nullable|string|max:100',
        ]);
        $scope = TeachingScope::offerings($actor);
        $query = (clone $scope)->when($filters['year'] ?? null, fn ($q, $id) => $q->where('academic_year_id', $id))
            ->when($filters['program'] ?? null, fn ($q, $id) => $q->whereHas('curriculumItem.unit.version', fn ($v) => $v->where('academic_program_id', $id)))
            ->when($filters['version'] ?? null, fn ($q, $id) => $q->whereHas('curriculumItem', fn ($i) => $i->where('curriculum_version_id', $id)))
            ->when($filters['q'] ?? null, fn ($q, $term) => $q->whereHas('course', fn ($c) => $c->where(fn ($s) => $s->where('title', 'like', '%'.$term.'%')->orWhere('code', 'like', '%'.$term.'%'))))
            ->when($filters['status'] ?? null, fn ($q, $status) => $status === 'archived' ? $q->whereNotNull('archived_at') : $q->whereNull('archived_at')->where('is_published', $status === 'published'));
        $relations = ['course', 'level.faculty', 'academicYear', 'academicSemester', 'curriculumItem.unit.version.program', 'requiredUnit', 'group.intake', 'group.promotion', 'department', 'professor', 'assistant'];
        $selected = isset($filters['offering']) ? (clone $scope)->with($relations)->findOrFail($filters['offering']) : null;
        $programs = AcademicProgram::query()->when($actor->academicFaculties()->exists(), fn ($q) => $q->whereIn('faculty_id', $actor->academicFaculties()->select('faculties.id')));
        $versions = CurriculumVersion::whereIn('academic_program_id', (clone $programs)->select('id'))
            ->when($filters['program'] ?? null, fn ($q, $id) => $q->where('academic_program_id', $id))
            ->when($filters['year'] ?? null, fn ($q, $id) => $q->where(fn ($s) => $s->whereNull('academic_year_id')->orWhere('academic_year_id', $id)));
        $version = isset($filters['version']) ? (clone $versions)->with('program')->findOrFail($filters['version']) : null;
        $year = $filters['year'] ?? null;
        $canPublish = $actor->can('publish academic content');
        $canRegister = $actor->can('manage academic access');
        $students = $selected ? $audience->roster($selected)->with('profile.user')->orderBy('academic_enrollments.id')->paginate(20, ['*'], 'students_page')->withQueryString()->through(self::student(...)) : null;
        $candidates = $selected?->curriculum_item_id && $canRegister ? $audience->candidates($selected)
            ->when($filters['student'] ?? null, fn ($q, $term) => $q->where(fn ($s) => $s->where('matricule', 'like', '%'.$term.'%')
                ->orWhereHas('profile.user', fn ($u) => $u->where('last_name', 'like', '%'.$term.'%')->orWhere('first_name', 'like', '%'.$term.'%'))))
            ->with('profile.user')->orderBy('academic_enrollments.id')->limit(40)->get()->map(self::student(...)) : [];

        return Inertia::render('dashboard/teaching/Index', [
            'filters' => $filters, 'canPublish' => $canPublish, 'canRegister' => $canRegister,
            'offerings' => $query->with($relations)->withCount(['sessions', 'resources', 'registrations as active_students_count' => fn ($q) => $q->whereNull('withdrawn_at')])
                ->latest('id')->paginate(20)->withQueryString()->through(self::row(...)),
            'summary' => ['total' => (clone $query)->count(), 'published' => (clone $query)->whereNull('archived_at')->where('is_published', true)->count(), 'archived' => (clone $query)->whereNotNull('archived_at')->count()],
            'selected' => $selected ? self::row($selected) : null, 'students' => $students, 'candidates' => $candidates,
            'assignments' => $selected?->assignments()->with('professor:id,first_name,last_name')->latest('id')->paginate(15, ['*'], 'team_page')->withQueryString(),
            'registrations' => $selected?->registrations()->with('enrollment.profile.user')->latest('id')->paginate(15, ['*'], 'registrations_page')->withQueryString()->through(fn ($r) => [
                'id' => $r->id, 'student' => self::student($r->enrollment), 'mode' => $r->mode, 'registered_at' => $r->registered_at, 'withdrawn_at' => $r->withdrawn_at,
            ]),
            'sessions' => $selected?->sessions()->latest('starts_at')->paginate(15, ['id', 'starts_at', 'ends_at', 'room', 'is_published'], 'sessions_page')->withQueryString(),
            'resources' => $selected?->resources()->whereNull('student_profile_id')->latest('id')->paginate(15, ['id', 'kind', 'title', 'is_published'], 'resources_page')->withQueryString(),
            'professors' => $selected && $canPublish ? Professor::where('is_active', true)->orderBy('last_name')->get(['id', 'first_name', 'last_name']) : [],
            'years' => AcademicYear::orderByDesc('start_date')->get(['id', 'title']),
            'programs' => $programs->orderBy('name')->get(['id', 'name']),
            'versions' => isset($filters['program']) ? $versions->orderByDesc('id')->get(['id', 'code', 'name', 'status']) : [],
            'items' => $version && $version->status === 'published' && $canPublish ? CurriculumItem::where('curriculum_version_id', $version->id)
                ->whereHas('sourceCourse', fn ($q) => $q->where('catalog_status', 'active'))->with('unit:id,code,name,level_id,level_title,period_code')->orderBy('name')
                ->get(['id', 'curriculum_unit_id', 'name', 'source_course_id', 'is_optional']) : [],
            'groups' => $version && $year ? Classes::whereHas('promotion', fn ($q) => $q->where('academic_program_id', $version->academic_program_id)->where('academic_year_id', $year))
                ->with('intake:id,name')->orderBy('id')->get(['id', 'level_id', 'intake_id', 'academic_promotion_id']) : [],
            'semesters' => $year ? AcademicSemester::where('academic_year_id', $year)->orderBy('number')->get() : [],
            'units' => $version && $canPublish ? CurriculumUnit::whereHas('version', fn ($q) => $q->where('academic_program_id', $version->academic_program_id)->whereNotNull('published_at'))
                ->with('version:id,code')->orderBy('name')->get(['id', 'curriculum_version_id', 'code', 'name']) : [],
        ]);
    }

    public static function row(AcademicOffering $offering): array
    {
        $item = $offering->curriculumItem;
        $version = $item?->unit->version;

        return [
            'id' => $offering->id, 'title' => $item?->name ?? $offering->course->title, 'code' => $item?->code ?? $offering->course->code,
            'year' => $offering->academicYear->title, 'year_id' => $offering->academic_year_id, 'level' => $offering->level->title, 'faculty' => $offering->level->faculty->name,
            'program' => $version ? ($version->program_snapshot['name'] ?? $version->program->name) : null, 'version' => $version?->code, 'unit' => $item?->unit->name, 'item_id' => $item?->id, 'unit_id' => $item?->curriculum_unit_id,
            'semester' => $item?->unit->period_name ?? $offering->semester, 'starts_on' => $offering->academicSemester?->start_date->toDateString() ?? $offering->starts_on,
            'ends_on' => $offering->academicSemester?->end_date->toDateString() ?? $offering->ends_on, 'group' => $offering->group?->intake?->name,
            'promotion' => $offering->group?->promotion?->name, 'department' => $offering->department?->name,
            'teacher' => $offering->professor?->full_name, 'teacher_id' => $offering->professor_id, 'assistant' => $offering->assistant?->full_name,
            'assistant_id' => $offering->assistant_professor_id, 'credits' => $item?->credits, 'coefficient' => $item?->coefficient,
            'optional' => $offering->is_optional, 'prerequisite' => $offering->requiredUnit?->name,
            'status' => $offering->archived_at ? 'archived' : ($offering->is_published ? 'published' : 'draft'),
            'sessions_count' => $offering->sessions_count, 'resources_count' => $offering->resources_count, 'active_students_count' => $offering->active_students_count,
        ];
    }

    public static function student(AcademicEnrollment $entry): array
    {
        return ['id' => $entry->id, 'name' => $entry->profile->user->full_name, 'matricule' => $entry->matricule ?? $entry->profile->matricule];
    }

    public function store(Request $request, TeachingOfferingService $service)
    {
        $data = $request->validate([
            'curriculum_item_id' => 'required|integer|exists:curriculum_items,id', 'academic_year_id' => 'required|integer|exists:academic_years,id',
            'academic_semester_id' => 'nullable|integer|exists:academic_semesters,id', 'class_id' => 'nullable|integer|exists:classes,id',
            'required_unit_id' => 'nullable|integer|exists:curriculum_units,id', 'starts_on' => 'nullable|date_format:Y-m-d',
            'ends_on' => 'nullable|date_format:Y-m-d', 'reason' => self::REASON,
        ]);
        $offering = $service->create($request->user(), $data);

        return to_route('dashboard.admin.teaching.index', ['offering' => $offering->id], 303)->with('success', 'Offre préparée.');
    }

    public function status(Request $request, AcademicOffering $offering, TeachingOfferingService $service)
    {
        $data = $request->validate(['action' => 'required|in:publish,archive', 'reason' => self::REASON]);
        $service->transition($offering, $request->user(), $data['action'], $data['reason']);

        return back(303)->with('success', 'État de l’offre enregistré.');
    }

    public function team(Request $request, AcademicOffering $offering, TeachingTeam $team)
    {
        $data = $request->validate(['professor_id' => 'required|integer|exists:professors,id', 'role' => 'required|in:lead,primary_assistant,instructor,assistant', 'action' => 'required|in:assign,end', 'reason' => self::REASON]);
        $team->change($offering, $request->user(), $data);

        return back(303)->with('success', 'Équipe pédagogique enregistrée.');
    }

    public function register(Request $request, AcademicOffering $offering, CourseRegistrationService $service)
    {
        $data = $request->validate(['academic_enrollment_id' => 'required|integer|exists:academic_enrollments,id', 'mode' => 'required|in:mandatory,elective,repeat,derogation', 'reason' => self::REASON]);
        $service->register($offering, AcademicEnrollment::findOrFail($data['academic_enrollment_id']), $request->user(), $data['mode'], $data['reason']);

        return back(303)->with('success', 'Inscription pédagogique enregistrée.');
    }

    public function sync(Request $request, AcademicOffering $offering, CourseRegistrationService $service)
    {
        $data = $request->validate(['reason' => self::REASON]);
        $summary = $service->sync($offering, $request->user(), $data['reason']);

        return back(303)->with('success', sprintf('%d inscrits, %d hors du public retirés, %d prérequis non satisfaits.', $summary['registered'], $summary['withdrawn'], $summary['skipped_prerequisite']));
    }

    public function withdraw(Request $request, CourseRegistration $registration, CourseRegistrationService $service)
    {
        $data = $request->validate(['reason' => self::REASON]);
        $service->withdraw($registration, $request->user(), $data['reason']);

        return back(303)->with('success', 'Retrait enregistré et historique conservé.');
    }
}
