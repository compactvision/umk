<?php

namespace App\Modules\Student\Infrastructure\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\AcademicStructure\AcademicProgram;
use App\Models\AcademicStructure\AcademicPromotion;
use App\Models\AcademicStructure\CurriculumVersion;
use App\Models\AcademicYear;
use App\Models\Classes;
use App\Models\Faculty;
use App\Models\Level;
use App\Models\Student\AcademicEnrollment;
use App\Models\Student\AcademicProgression;
use App\Models\Student\EnrollmentChange;
use App\Models\Student\ServiceRequest;
use App\Models\Student\StudentProfile;
use App\Modules\Student\Application\Services\AcademicEnrollmentReadService;
use App\Modules\Student\Application\Services\AcademicEnrollmentService;
use App\Modules\Student\Application\Services\AcademicProgressionService;
use App\Modules\Student\Application\Services\AnnualEnrollmentClosure;
use App\Modules\Student\Application\Services\StudentFinanceService;
use App\Modules\Student\Infrastructure\Http\Requests\ChangeAcademicEnrollmentRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

final class EnrollmentManagementController extends Controller
{
    public function index(Request $request, StudentFinanceService $finance, AcademicEnrollmentReadService $read)
    {
        Gate::authorize('viewAny', StudentProfile::class);
        $filters = $request->validate([
            'q' => 'nullable|string|max:150', 'year' => 'nullable|integer|exists:academic_years,id',
            'status' => ['nullable', Rule::in(array_keys(AcademicEnrollmentService::TRANSITIONS))], 'academic' => 'nullable|integer',
            'faculty' => 'nullable|integer|exists:faculties,id', 'program' => 'nullable|integer|exists:academic_programs,id',
            'level' => 'nullable|integer|exists:levels,id', 'promotion' => 'nullable|integer|exists:academic_promotions,id', 'group' => 'nullable|integer|exists:classes,id',
        ]);
        $entries = $read->query($request->user(), $filters);
        $selected = isset($filters['academic']) ? AcademicEnrollment::with(['profile.user', 'level.faculty', 'academicYear', 'curriculumVersion', 'promotion.program', 'admissionCohort.program', 'group.intake', 'group.promotion'])->findOrFail($filters['academic']) : null;
        if ($selected) {
            Gate::authorize('view', $selected);
        }
        $canManage = $selected ? Gate::allows('manage', $selected) : false;
        $versionQuery = CurriculumVersion::where('status', 'published')->with('program:id,name,faculty_id')->orderBy('name');
        if ($request->user()->academicFaculties()->exists()) {
            $versionQuery->whereHas('program', fn ($q) => $q->whereIn('faculty_id', $request->user()->academicFaculties()->select('faculties.id')));
        }

        $faculties = $request->user()->academicFaculties()->exists()
            ? $request->user()->academicFaculties()->select('faculties.id', 'faculties.name')
            : Faculty::query()->select('id', 'name');
        $facultyIds = (clone $faculties)->pluck('id');
        $filterOptions = [
            'faculties' => $faculties->orderBy('name')->get(),
            'programs' => AcademicProgram::whereIn('faculty_id', $facultyIds)->orderBy('name')->get(['id', 'name', 'faculty_id']),
            'levels' => Level::whereIn('faculty_id', $facultyIds)->orderBy('title')->get(['id', 'title', 'faculty_id']),
            'promotions' => AcademicPromotion::whereHas('program', fn ($q) => $q->whereIn('faculty_id', $facultyIds))->orderBy('name')->get(['id', 'name', 'level_id', 'academic_year_id', 'academic_program_id']),
            'groups' => Classes::with('intake:id,name')->whereIn('faculty_id', $facultyIds)->orderBy('id')->get(['id', 'intake_id', 'level_id', 'academic_promotion_id']),
        ];

        return Inertia::render('dashboard/studentAcademic/EnrollmentManagement', [
            'entries' => $entries->latest('id')->paginate(20)->withQueryString()->through(fn ($entry) => $read->row($entry)),
            'filterOptions' => $filterOptions,
            'enrollmentPolicy' => ['automatic' => (bool) config('student.enrollment_auto_confirmation'), 'firstInstallment' => (bool) config('student.enrollment_requires_first_installment')],
            'statuses' => array_keys(AcademicEnrollmentService::TRANSITIONS),
            'canClose' => $request->user()->can('manage academic access') && ! $request->user()->academicFaculties()->exists(),
            'openRequests' => $canManage ? ServiceRequest::where('academic_enrollment_id', $selected->id)->where('status', 'open')->latest('id')->get(['id', 'subject', 'category']) : [],
            'filters' => $filters, 'years' => AcademicYear::orderByDesc('start_date')->get(['id', 'title', 'status']),
            'selected' => $selected ? $read->row($selected) : null,
            'changes' => $selected && $request->user()->can('manage academic access') ? $selected->changes()->with('actor:id,first_name,last_name')->latest('id')->paginate(15, ['*'], 'history_page')->withQueryString() : null,
            'balance' => $selected && $request->user()->can('manage academic finance') ? $finance->balance($selected) : null,
            'transitions' => $canManage && $selected->academicYear->status === 'open' && ! in_array($selected->enrollment_status, ['completed', 'cancelled', 'transferred'], true) ? array_values(array_unique(array_merge([$selected->enrollment_status], AcademicEnrollmentService::TRANSITIONS[$selected->enrollment_status] ?? []))) : [],
            'departments' => $canManage ? $selected->level->departmentOptions()->where('is_active', true)->get(['academic_departments.id', 'name']) : [],
            'groups' => $canManage ? Classes::with('intake:id,name')->where('level_id', $selected->level_id)->get(['id', 'intake_id', 'capacity']) : [],
            'versions' => $canManage && $request->user()->can('publish academic content') ? $versionQuery->where(fn ($q) => $q->where('academic_year_id', $selected->academic_year_id)->orWhereNull('academic_year_id'))->with('units:id,curriculum_version_id,level_id,level_title')->get(['id', 'academic_program_id', 'code', 'name']) : [],
        ]);
    }

    public function transition(ChangeAcademicEnrollmentRequest $request, AcademicEnrollment $academic, AcademicEnrollmentService $service)
    {
        $service->transition($academic, $request->user(), $request->validated());

        return back(303)->with('success', 'Décision administrative enregistrée.');
    }

    public function transfer(Request $request, AcademicEnrollment $academic, AcademicEnrollmentService $service)
    {
        Gate::authorize('manage', $academic);
        $data = $request->validate([
            'expected_status' => 'required|string|max:40',
            'expected_context' => 'sometimes|string|size:64',
            'service_request_id' => 'nullable|integer|exists:student_service_requests,id',
            'student_response' => 'required_with:service_request_id|nullable|string|min:5|max:6000',
            'operation_key' => 'required|uuid', 'reason' => 'required|string|min:10|max:1000',
            'level_id' => 'required|integer|exists:levels,id', 'curriculum_version_id' => 'required|integer|exists:curriculum_versions,id',
            'class_id' => 'nullable|integer|exists:classes,id',
        ]);
        $target = $service->transfer($academic, $request->user(), $data);

        return redirect()->route('dashboard.admin.student-academic.administration', ['academic' => $target->id], 303)
            ->with('success', 'Transfert enregistré. Les écritures financières restent sur leur inscription d’origine.');
    }

    public function closure(Request $request, AnnualEnrollmentClosure $closure)
    {
        abort_unless($request->user()->hasRole('admin') && $request->user()->can('manage academic access'), 403);
        // Closing an institution-wide year cannot be delegated to a faculty-scoped agent.
        abort_if($request->user()->academicFaculties()->exists(), 403);
        $data = $request->validate(['year' => 'nullable|integer|exists:academic_years,id']);
        $year = isset($data['year']) ? AcademicYear::findOrFail($data['year']) : AcademicYear::orderByDesc('start_date')->first();

        return Inertia::render('dashboard/studentAcademic/Closure', [
            'years' => AcademicYear::orderByDesc('start_date')->get(['id', 'title', 'status']),
            'year' => $year, 'report' => $year ? $closure->report($year->id) : null,
            'canReopen' => $request->user()->can('configure settings'),
        ]);
    }

    public function student(Request $request, AcademicEnrollmentReadService $read, AcademicProgressionService $progressions)
    {
        abort_unless($request->user()->hasRole('student'), 403);
        $profile = $request->user()->studentProfile;
        abort_unless($profile, 403);
        $entries = $profile->enrollments()->with(['profile.user', 'academicYear', 'level.faculty', 'curriculumVersion', 'promotion.program', 'admissionCohort.program', 'group.intake', 'group.promotion'])
            ->withCount(['serviceRequests as open_requests_count' => fn ($q) => $q->where('status', 'open')])
            ->orderByDesc(AcademicYear::select('start_date')->whereColumn('academic_years.id', 'academic_enrollments.academic_year_id'))
            ->orderByDesc('id')->paginate(15)->withQueryString();
        $decisions = AcademicProgression::with(['level', 'academicYear', 'target'])
            ->whereIn('source_enrollment_id', $entries->getCollection()->pluck('id'))->get()->keyBy('source_enrollment_id');
        $entries->through(function ($entry) use ($read, $decisions, $profile, $progressions) {
            $decision = $decisions->get($entry->id);
            $requirements = array_values(array_filter([
                in_array($entry->enrollment_status, ['pending_confirmation', 'under_review', 'correction_required'], true) ? 'Contrôle et confirmation par le service des inscriptions.' : null,
                in_array($entry->enrollment_status, ['suspended', 'on_leave', 'withdrawn'], true) ? 'Une décision de reprise par la scolarité est nécessaire. Consultez les conditions communiquées dans vos demandes administratives.' : null,
                $entry->curriculum_version_id === null ? 'Rattachement de la maquette à vérifier par la scolarité.' : null,
                $entry->open_requests_count > 0 ? $entry->open_requests_count.' demande(s) en cours auprès de l’administration.' : null,
            ]));

            return $read->row($entry) + [
                'requirements' => $requirements,
                'renewal' => $decision ? [
                    'id' => $decision->id, 'level' => $decision->level->title, 'year' => $decision->academicYear->title,
                    'target_id' => $decision->target_enrollment_id,
                    'can_start' => $decision->target_enrollment_id === null && $decision->academicYear->status === 'open'
                        && $profile->student_status === 'active' && $decision->level->is_active
                        && ($decision->kind === 'resumption' || $progressions->eligible($entry))
                        && ! \App\Modules\Progression\Application\AcademicLifecycle::interrupted($entry),
                ] : null,
            ];
        });

        return Inertia::render('dashboard/studentAcademic/MyEnrollments', [
            'entries' => $entries,
            'changes' => EnrollmentChange::whereIn('academic_enrollment_id', $profile->enrollments()->select('id'))
                ->latest('id')->paginate(15, ['id', 'academic_enrollment_id', 'action', 'after', 'effective_at', 'ends_at'], 'changes_page')->withQueryString(),
        ]);
    }
}
