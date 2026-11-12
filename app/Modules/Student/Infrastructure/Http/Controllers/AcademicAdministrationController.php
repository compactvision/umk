<?php

namespace App\Modules\Student\Infrastructure\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Student\AcademicAudit;
use App\Models\Student\AcademicEnrollment;
use App\Models\Student\AcademicOffering;
use App\Models\Student\AcademicProgression;
use App\Models\Student\AcademicResource;
use App\Models\Student\AcademicSession;
use App\Models\Student\AcademicSubmission;
use App\Models\Student\AccessRule;
use App\Models\Student\CourseException;
use App\Models\Student\FinancialAdjustment;
use App\Models\Student\ServiceRequest;
use App\Models\Student\StudentPayment;
use App\Modules\Assessment\Application\AssessmentCopies;
use App\Modules\Student\Application\Services\AcademicProgressionService;
use App\Modules\Student\Application\Services\AcademicRuleService;
use App\Modules\Student\Application\Services\Audit;
use App\Modules\Student\Application\Services\StudentFinanceService;
use App\Modules\Student\Application\Services\StudentDossierService;
use App\Modules\Teaching\Application\Services\LearningContent;
use App\Modules\Teaching\Application\Services\TeachingScope;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class AcademicAdministrationController extends Controller
{
    private const SUBMISSION_ROUTES = 'dashboard.admin.student-academic.submissions.';

    public function __construct(private StudentFinanceService $finance) {}

    private function authorizeStaff(Request $r, string $permission): void
    {
        abort_unless($r->user()->can($permission), 403);
    }

    public function index(Request $r)
    {
        abort_unless($r->user()->canAny(['manage academic access', 'manage academic finance', 'publish academic content']), 403);
        \Illuminate\Support\Facades\Gate::authorize('viewAny', \App\Models\Student\StudentProfile::class);
        $filters = $r->validate([
            'academic' => 'nullable|integer', 'q' => 'nullable|string|max:150', 'faculty' => 'nullable|integer|exists:faculties,id',
            'department' => 'nullable|integer|exists:academic_departments,id', 'level' => 'nullable|integer|exists:levels,id',
            'view' => 'nullable|in:table,grid', 'tab' => 'nullable|in:students,finance,rules,teaching,requests',
            'history' => 'nullable|in:1', 'year' => 'nullable|integer|exists:academic_years,id',
            'program' => 'nullable|integer|exists:academic_programs,id',
            'enrollment_status' => ['nullable', Rule::in(array_keys(\App\Modules\Student\Application\Services\AcademicEnrollmentService::TRANSITIONS))],
        ]);
        $tabPermission = match ($filters['tab'] ?? 'students') {
            'finance' => 'manage academic finance',
            'teaching' => 'publish academic content',
            'rules', 'requests' => 'manage academic access',
            default => null,
        };
        if ($tabPermission !== null) {
            $this->authorizeStaff($r, $tabPermission);
        }

        $directory = AcademicEnrollment::with(['profile.user', 'level.faculty', 'academicYear', 'department:id,name', 'curriculumVersion.program'])
            ->when($filters['enrollment_status'] ?? null, fn ($q, $status) => $q->where('academic_enrollments.enrollment_status', $status))
            ->when($filters['program'] ?? null, fn ($q, $id) => $q->whereHas('curriculumVersion', fn ($v) => $v->where('academic_program_id', $id)))
            ->when($filters['year'] ?? null, fn ($q, $id) => $q->where('academic_enrollments.academic_year_id', $id))
            ->when($filters['faculty'] ?? null, fn ($q, $id) => $q->whereHas('level', fn ($level) => $level->where('faculty_id', $id)))
            ->when($filters['department'] ?? null, fn ($q, $id) => $q->where('academic_enrollments.academic_department_id', $id))
            ->when($filters['level'] ?? null, fn ($q, $id) => $q->where('academic_enrollments.level_id', $id))
            ->when($filters['q'] ?? null, fn ($q, $term) => $q->where(fn ($s) => $s->where('academic_enrollments.matricule', 'like', "%{$term}%")
                ->orWhereHas('profile', fn ($p) => $p->where('matricule', 'like', "%{$term}%"))
                ->orWhereHas('profile.user', fn ($u) => $u->where('first_name', 'like', "%{$term}%")->orWhere('last_name', 'like', "%{$term}%")->orWhere('post_name', 'like', "%{$term}%")->orWhere('email', 'like', "%{$term}%"))));
        \App\Modules\Student\Application\Services\AcademicStaffScope::apply($directory, $r->user());
        if (!isset($filters['history']) && !isset($filters['enrollment_status']) && !isset($filters['year']) && ($filters['tab'] ?? 'students') === 'students') {
            $directory->whereNotExists(fn ($newer) => $newer->selectRaw('1')->from('academic_enrollments as newer')
                ->join('academic_years as newer_year', 'newer_year.id', '=', 'newer.academic_year_id')
                ->join('academic_years as current_year', 'current_year.id', '=', 'academic_enrollments.academic_year_id')
                ->whereColumn('newer.student_profile_id', 'academic_enrollments.student_profile_id')
                ->where(fn ($later) => $later->whereColumn('newer_year.start_date', '>', 'current_year.start_date')
                    ->orWhere(fn ($same) => $same->whereColumn('newer_year.start_date', 'current_year.start_date')->whereColumn('newer.id', '>', 'academic_enrollments.id'))));
        }

        if (isset($filters['history'])) {
            $directory->select('academic_enrollments.*')
                ->join('academic_years', 'academic_years.id', '=', 'academic_enrollments.academic_year_id')
                ->orderByDesc('academic_years.start_date')
                ->orderByDesc('academic_enrollments.id');
        } elseif (($filters['tab'] ?? 'students') === 'students') {
            $directory->select('academic_enrollments.*')
                ->join('levels', 'levels.id', '=', 'academic_enrollments.level_id')
                ->join('faculties', 'faculties.id', '=', 'levels.faculty_id')
                ->leftJoin('academic_departments', 'academic_departments.id', '=', 'academic_enrollments.academic_department_id')
                ->join('student_profiles', 'student_profiles.id', '=', 'academic_enrollments.student_profile_id')
                ->join('users', 'users.id', '=', 'student_profiles.user_id')
                ->orderBy('faculties.name')->orderBy('faculties.id')
                ->orderByRaw("COALESCE(academic_departments.name, '')")
                ->orderBy('levels.title')->orderBy('levels.id')
                ->orderBy('users.last_name')->orderBy('users.first_name')->orderBy('academic_enrollments.id');
        } else {
            $directory->latest();
        }
        $students = $directory->paginate(15)->withQueryString();
        $students->through(fn ($e) => [
            'id' => $e->id, 'name' => trim(implode(' ', array_filter([$e->profile->user->last_name, $e->profile->user->post_name, $e->profile->user->first_name]))), 'matricule' => $e->matricule,
            'program' => $e->curriculumVersion?->program_snapshot['name'] ?? null, 'account_status' => $e->profile->user->email_verified_at ? 'Vérifié' : 'Email à vérifier',
            'faculty' => $e->level->faculty->name, 'level' => $e->level->title, 'department' => $e->department?->name,
            'year' => $e->academicYear->title, 'status' => $e->enrollment_status, 'student_status' => $e->profile->student_status,
            'photo_url' => $e->profile->photo_path ? route('dashboard.admin.student-academic.photo', ['academic' => $e->id, 'v' => $e->profile->updated_at->timestamp], false) : null,
        ]);
        $entry = isset($filters['academic']) ? AcademicEnrollment::with(['profile.user', 'level.detail', 'level.faculty', 'academicYear'])->findOrFail($filters['academic']) : null;
        $finance = $r->user()->can('manage academic finance');
        $publish = $r->user()->can('publish academic content');
        $access = $r->user()->can('manage academic access');

        $allowedEntries = \App\Modules\Student\Application\Services\AcademicStaffScope::apply(AcademicEnrollment::query(), $r->user());
        $scoped = $r->user()->academicFaculties()->exists();
        $teachingScope = \App\Modules\Teaching\Application\Services\TeachingScope::offerings($r->user());
        $auditQuery = AcademicAudit::with('actor:id,first_name,last_name');
        if (!$finance) $auditQuery->whereNotIn('action', ['fees_assessed', 'additional_fee_created', 'payment_recorded', 'payment_confirmed', 'payment_cancelled', 'payment_refunded', 'financial_adjustment_approved', 'financial_adjustment_revoked']);
        if ($scoped) $auditQuery->where('entity_type', 'academic_enrollments')->whereIn('entity_id', (clone $allowedEntries)->select('academic_enrollments.id'));

        if (! $access) {
            $auditQuery->whereIn('action', ['fees_assessed', 'additional_fee_created', 'payment_recorded', 'payment_confirmed', 'payment_cancelled', 'payment_refunded', 'financial_adjustment_approved', 'financial_adjustment_revoked', 'academic_enrollment_confirmed']);
        }

        return Inertia::render('dashboard/studentAcademic/Index', [
            'programs' => \App\Models\AcademicStructure\AcademicProgram::orderBy('name')->get(['id', 'name']),
            'departments' => \App\Models\AcademicStructure\AcademicDepartment::with('faculty:id,name')->orderBy('name')->get(['id', 'name', 'faculty_id']),
            'students' => $students, 'filters' => $filters, 'selected' => $entry ? ['id' => $entry->id, 'profile_id' => $entry->student_profile_id, 'name' => trim($entry->profile->user->first_name.' '.$entry->profile->user->last_name), 'matricule' => $entry->matricule, 'level_id' => $entry->level_id, 'year_id' => $entry->academic_year_id, 'class_id' => $entry->class_id, 'status' => $entry->enrollment_status, 'student_status' => $entry->profile->student_status, 'category' => $entry->fee_category] : null,
            'balance' => $entry && $finance ? $this->finance->balance($entry) : null, 'obligations' => $entry && $finance ? $entry->obligations()->get() : [],
            'fee_kinds' => \App\Models\Student\StudentObligation::distinct()->pluck('kind')->push('tuition')->unique()->values(),
            'payments' => $entry && $finance ? $entry->payments()->latest()->get()->map(fn ($p) => $p->only(['id', 'reference', 'amount_cents', 'currency', 'status', 'method', 'confirmed_at'])) : [],
            'adjustments' => $entry && $finance ? $entry->adjustments()->latest()->get() : [],
            'rules' => $access ? AccessRule::where('is_active', true)->latest()->get() : [],
            'levels' => \App\Models\Level::with(['faculty:id,name', 'departmentOptions' => fn ($q) => $q->where('is_active', true)->orderBy('name')])->get(['id', 'faculty_id', 'title']),
            'years' => \App\Models\AcademicYear::orderByDesc('start_date')->get(['id', 'title']),
            'groups' => $entry ? \App\Models\Classes::with('intake')->where('level_id', $entry->level_id)->where('faculty_id', $entry->level->faculty_id)->get() : [],
            'courses' => $publish ? \App\Models\Courses::orderBy('title')->get(['id', 'level_id', 'title']) : [],
            'professors' => $publish ? \App\Models\Professor::where('is_active', true)->get(['id', 'first_name', 'last_name']) : [],
            'offerings' => ($publish || $access) ? (clone $teachingScope)->with(['course', 'professor', 'department:id,name'])->latest()->limit(100)->get() : [],
            'resources' => $publish ? AcademicResource::whereIn('academic_offering_id', (clone $teachingScope)->select('id'))->select(['id', 'academic_offering_id', 'kind', 'title', 'is_published', 'student_profile_id'])->withExists('assessment')->latest()->limit(100)->get() : [],
            'sessions' => $publish ? AcademicSession::whereIn('academic_offering_id', (clone $teachingScope)->select('id'))->with(['offering.course', 'offering.department:id,name'])->orderByDesc('starts_at')->limit(50)->get() : [],
            'requests' => $access ? ServiceRequest::with('enrollment.profile.user')->whereNull('academic_official_result_id')->whereNull('official_document_type_id')->whereIn('academic_enrollment_id', (clone $allowedEntries)->select('academic_enrollments.id'))->when($entry, fn ($q) => $q->where('academic_enrollment_id', $entry->id))->latest()->limit(50)->get()->map(fn ($ticket) => array_merge($ticket->only(['id', 'academic_enrollment_id', 'category', 'subject', 'body', 'status', 'response', 'created_at']), ['student_name' => \App\Mail\TransactionalEmail::recipientName($ticket->enrollment->profile->user)])) : [],
            'submissions' => $entry && $publish && ($filters['tab'] ?? null) === 'teaching' ? AcademicSubmission::with('resource')
                ->where('academic_enrollment_id', $entry->id)
                ->whereHas('resource', fn ($q) => $q->whereIn('academic_offering_id', (clone $teachingScope)->select('id')))
                ->latest()->get()->map(fn (AcademicSubmission $work) => [
                    'id' => $work->id,
                    'title' => $work->resource->title,
                    'body' => $work->body,
                    'filename' => $work->filename,
                    'version' => $work->version,
                    'submitted_at' => $work->updated_at,
                    'version_url' => route(self::SUBMISSION_ROUTES.'version', ['submission' => $work->id, 'version' => $work->version]),
                    'download_url' => $work->path ? route(self::SUBMISSION_ROUTES.'download', ['submission' => $work->id]) : null,
                ]) : [],
            'audit' => $access || $finance ? $auditQuery->latest()->limit(30)->get(['id', 'actor_id', 'action', 'entity_type', 'entity_id', 'reason', 'created_at'])->map(fn ($event) => array_merge($event->only(['id', 'actor_id', 'action', 'entity_type', 'entity_id', 'reason', 'created_at']), ['actor_name' => $event->actor ? \App\Mail\TransactionalEmail::recipientName($event->actor) : 'Système'])) : [],
            'abilities' => ['finance' => $finance, 'access' => $access, 'publish' => $publish], 'success' => session('success'),
        ]);
    }

    public function show(Request $r, AcademicEnrollment $academic, StudentDossierService $dossier, AcademicProgressionService $progressions)
    {
        abort_unless($r->user()->canAny(['manage academic access', 'manage academic finance', 'publish academic content']), 403);
        \Illuminate\Support\Facades\Gate::authorize('view', $academic->profile);
        $validated = $r->validate([
            'section' => ['nullable', Rule::in(['Résumé', 'Identité', 'Admission', 'Parcours', 'Académique', 'Présences', 'Finances', 'Stages et mémoire', 'Documents', 'Demandes', 'Historique', 'Compte et sécurité'])],
            'records_page' => 'nullable|integer|min:1|max:100000',
            'enrollments_page' => 'nullable|integer|min:1|max:100000',
        ]);
        $section = $validated['section'] ?? 'Résumé';
        $profile = $academic->profile()->with('user:id,first_name,last_name,post_name,email,email_verified_at')->firstOrFail();
        $access = $r->user()->can('manage academic access');
        $directoryFilters = array_filter($r->only(['q', 'faculty', 'department', 'level', 'view', 'page', 'enrollment_status', 'history', 'year', 'program']), 'is_scalar');
        $enrollmentRow = fn (AcademicEnrollment $entry) => [
            'id' => $entry->id, 'faculty' => $entry->level->faculty->name, 'level' => $entry->level->title,
            'department' => $entry->department?->name, 'year' => $entry->academicYear->title,
            'group' => $entry->group?->intake?->name, 'status' => $entry->enrollment_status,
            'program' => $entry->curriculumVersion?->program_snapshot['name'] ?? $entry->promotion?->program?->name ?? $entry->admissionCohort?->program?->name,
            'cohort' => $entry->admissionCohort?->name,
            'promotion' => $entry->promotion?->name ?? $entry->group?->promotion?->name,
            'curriculum' => $entry->curriculumVersion?->only(['id', 'name', 'code', 'status']),
        ];
        $enrollmentRelations = ['level.faculty', 'department', 'academicYear', 'group.intake', 'group.promotion', 'curriculumVersion', 'promotion.program', 'admissionCohort.program'];
        $enrollmentsPage = \App\Modules\Student\Application\Services\AcademicStaffScope::apply($profile->enrollments()->getQuery(), $r->user())
            ->with($enrollmentRelations)
            ->orderByDesc(\App\Models\AcademicYear::select('start_date')->whereColumn('academic_years.id', 'academic_enrollments.academic_year_id'))
            ->orderByDesc('id')->simplePaginate(20, ['*'], 'enrollments_page', $validated['enrollments_page'] ?? 1);

        $enrollments = collect($enrollmentsPage->items())->map($enrollmentRow);

        $decision = AcademicProgression::with(['level:id,title', 'academicYear:id,title', 'target:id,enrollment_status'])
            ->where('source_enrollment_id', $academic->id)->first();
        $canSeeResults = $r->user()->canAny(['publish academic content', 'manage academic results', 'publish official results']);
        $official = $canSeeResults ? app(\App\Modules\Results\Application\ResultInputs::class)->latest($academic) : null;
        $progressionMode = $official ? $official->run->context['decisions'][$official->decision]['progression'] : null;
        $canDecide = $r->user()->can('publish academic content') && $progressions->eligible($academic) && $progressionMode !== 'none'
            && ($academic->curriculum_version_id === null || $official !== null)
            && ! \App\Modules\Progression\Application\AcademicLifecycle::interrupted($academic)
            && (! $decision || ($decision->target_enrollment_id === null && $official && $decision->academic_official_result_id !== $official->id));
        $history = $canSeeResults && in_array($section, ['Académique', 'Parcours'], true)
            ? \App\Models\Student\AcademicOfficialResult::published()->where('academic_enrollment_id', $academic->id)->with('run')->latest('id')->limit(25)->get()->map(fn ($row) => [
                'reference' => $row->reference, 'session' => $row->run->context['session'], 'edition' => $row->run->edition,
                'decision' => $row->run->context['decisions'][$row->decision]['label'], 'average' => $row->snapshot['annual'],
                'earned' => $row->snapshot['credits']['earned'], 'run_id' => $row->academic_deliberation_id, 'id' => $row->id,
            ]) : [];

        $lifecycleHistory = $section === 'Parcours' && $r->user()->canAny(['manage academic access', 'publish academic content', 'manage academic progression', 'approve academic progression'])
            ? \App\Models\Student\AcademicLifecycleCase::whereIn('academic_enrollment_id',
                \App\Modules\Student\Application\Services\AcademicStaffScope::apply($profile->enrollments()->getQuery(), $r->user())->select('academic_enrollments.id'))
                ->whereIn('status', ['approved', 'refused'])->latest('decided_at')->latest('id')->limit(20)
                ->get(['reference', 'academic_enrollment_id', 'kind', 'status', 'decided_at'])
            : [];
        $documentAccess = app(\App\Modules\Documents\Application\DocumentAccess::class);
        $canSeeDocuments = $section === 'Documents' && $r->user()->canAny([$documentAccess::MANAGE, $documentAccess::APPROVE, $documentAccess::ISSUE])
            && \App\Modules\Student\Application\Services\AcademicStaffScope::apply(AcademicEnrollment::query(), $r->user())->whereKey($academic->id)->exists();

        return Inertia::render('dashboard/studentAcademic/Show', [
            'documentRegistry' => $canSeeDocuments ? [
                'url' => route('dashboard.admin.official-documents.index', ['academic' => $academic->id]),
                'rows' => \App\Models\Student\OfficialDocument::with('type')->where('academic_enrollment_id', $academic->id)
                    ->latest('id')->limit(15)->get()->map(fn ($document) => app(\App\Modules\Documents\Application\DocumentQueries::class)->row($document)),
            ] : null,
            'student' => [
                'name' => trim(implode(' ', array_filter([$profile->user->last_name, $profile->user->post_name, $profile->user->first_name]))),
                'photo_url' => $profile->photo_path ? route('dashboard.admin.student-academic.photo', $academic) : null,
                'matricule' => $academic->matricule ?? $profile->matricule,
                'email' => $access ? $profile->user->email : null,
                'status' => $profile->student_status,
            ],
            'lifecycleHistory' => $lifecycleHistory,
            'lifecycleUrl' => $r->user()->canAny(['manage academic progression', 'approve academic progression', 'manage academic access', 'publish academic content'])
                ? route('dashboard.admin.progression.index', ['academic' => $academic->id]) : null,
            'progression' => $decision ? [
                'kind' => $decision->kind, 'due_on' => $decision->decision_snapshot['due_on'] ?? null,
                'retakes' => $decision->decision_snapshot['retakes'] ?? [],
                'level' => $decision->level->title, 'year' => $decision->academicYear->title,
                'reason' => $decision->reason, 'target_id' => $decision->target_enrollment_id, 'status' => $decision->target?->enrollment_status,
            ] : null,
            'officialHistory' => $history,
            'progressionOptions' => $canDecide ? [
                'officialResultId' => $official?->id, 'mode' => $progressionMode,
                'levels' => $progressions->levels($academic)->when($progressionMode === 'same', fn ($q) => $q->whereKey($academic->level_id))
                    ->when(in_array($progressionMode, ['next', 'conditional'], true), fn ($q) => $q->where('levels.id', '!=', $academic->level_id))->get(['id', 'title']),
                'years' => $progressions->years($academic)->get(['id', 'title']),
            ] : null,
            'academicId' => $academic->id,
            'enrollments' => $enrollments,
            'currentEnrollment' => $enrollmentRow($academic->loadMissing($enrollmentRelations)),
            'enrollmentPagination' => ['page' => $enrollmentsPage->currentPage(), 'more' => $enrollmentsPage->hasMorePages()],
            'directoryFilters' => $directoryFilters,
            'section' => $section,
            'financialSummary' => $section === 'Résumé' && $r->user()->can('manage academic finance') ? $this->finance->balance($academic) : null,
            'account' => $access ? ['email' => $profile->user->email, 'verified' => $profile->user->hasVerifiedEmail(), 'linked' => true, 'canManage' => $r->user()->can('manage users'), 'canRevoke' => $r->user()->can('manage users') && config('session.driver') === 'database'] : null,
            'card' => $access ? ['request' => $academic->cardRequest?->only(['status', 'decision_note']), 'issuance' => $academic->cardIssuance?->only(['printed_at', 'collected_at']), 'photo' => (bool) $profile->photo_path, 'matricule' => filled($profile->matricule), 'identity' => filled($profile->user->first_name) && filled($profile->user->last_name)] : null,
            'dossier' => $dossier->details($academic, $r->user(), $section, $validated['records_page'] ?? 1),
            'teachingSubmissionsUrl' => $section === 'Académique' && $r->user()->can('publish academic content')
                ? route('dashboard.admin.student-academic.index', ['tab' => 'teaching', 'academic' => $academic->id])
                : null,
            'abilities' => ['access' => $access, 'finance' => $r->user()->can('manage academic finance')],
        ]);
    }

    public function downloadDocument(Request $request, AcademicEnrollment $academic, AcademicResource $resource)
    {
        \Illuminate\Support\Facades\Gate::authorize('view', $academic->profile);
        abort_unless($request->user()->canAny(['manage academic access', 'publish academic content']), 403);
        abort_unless($resource->student_profile_id === $academic->student_profile_id
            && $resource->kind === 'document' && $resource->is_published
            && $resource->offering->academic_year_id === $academic->academic_year_id
            && $resource->offering->level_id === $academic->level_id, 404);
        abort_unless($resource->path && Storage::disk('local')->exists($resource->path), 404);

        return Storage::disk('local')->download($resource->path, $resource->filename, ['Cache-Control' => 'private, no-store', 'X-Content-Type-Options' => 'nosniff']);
    }

    public function renewals(Request $r)
    {
        abort_unless($r->user()->canAny(['manage academic access', 'manage academic finance', 'publish academic content']), 403);
        $decisions = AcademicProgression::whereIn('source_enrollment_id', \App\Modules\Student\Application\Services\AcademicStaffScope::apply(AcademicEnrollment::query(), $r->user())->select('academic_enrollments.id'))->with(['source.profile.user', 'source.level', 'level', 'academicYear', 'target'])
            ->latest('id')->paginate(20)->through(fn (AcademicProgression $decision) => [
                'id' => $decision->id, 'source_id' => $decision->source_enrollment_id, 'target_id' => $decision->target_enrollment_id,
                'student' => trim($decision->source->profile->user->first_name.' '.$decision->source->profile->user->last_name),
                'source_level' => $decision->source->level->title, 'level' => $decision->level->title,
                'year' => $decision->academicYear->title, 'status' => $decision->target?->enrollment_status,
            ]);

        return Inertia::render('dashboard/studentAcademic/Renewals', ['decisions' => $decisions, 'canFinance' => $r->user()->can('manage academic finance')]);
    }

    public function decideProgression(Request $r, AcademicEnrollment $academic, AcademicProgressionService $progressions)
    {
        $this->authorizeStaff($r, 'publish academic content');
        $data = $r->validate(['level_id' => 'required|integer', 'academic_year_id' => 'required|integer', 'academic_official_result_id' => 'nullable|integer|min:1', 'due_on' => 'nullable|date_format:Y-m-d', 'target_curriculum_version_id' => 'nullable|integer|min:1', 'reason' => 'required|string|min:5|max:1000']);
        $progressions->decide($academic, $r->user(), $data);

        return back(303)->with('success', 'Décision de passage publiée dans l’espace étudiant.');
    }

    public function saveUnitResult(Request $r, int $academic, int $unit, StudentDossierService $dossier)
    {
        $this->authorizeStaff($r, 'publish academic content');
        $data = $r->validate(['score' => 'required|numeric|between:0,20|decimal:0,2', 'validated' => 'required|boolean']);
        $dossier->saveUnitResult($academic, $unit, $data, $r->user()->id);

        return back()->with('success', 'Résultat de l’UE enregistré.');
    }

    public function assess(Request $r, int $academic)
    {
        $this->authorizeStaff($r, 'manage academic finance');
        $data = $r->validate(['category' => 'required|in:national,foreign', 'first_due' => 'nullable|date', 'second_due' => ['nullable', 'date', Rule::when($r->filled('first_due'), 'after_or_equal:first_due')], 'reason' => 'required|string|min:5|max:1000']);
        $this->finance->assess(AcademicEnrollment::findOrFail($academic), $r->user(), $data['category'], [$data['first_due'] ?? null, $data['second_due'] ?? null], $data['reason']);

        return back()->with('success', 'Les frais ont été établis à partir du barème du niveau.');
    }

    public function obligation(Request $r, int $academic)
    {
        $this->authorizeStaff($r, 'manage academic finance');
        $data = $r->validate(['kind' => 'required|string|max:50|regex:/^[a-z][a-z0-9_]*$/', 'title' => 'required|string|max:180', 'installment' => 'required|integer|min:1|max:24', 'amount' => 'required|numeric|gt:0', 'due_at' => 'nullable|date', 'reason' => 'required|string|min:10|max:1000']);
        $this->finance->addObligation(AcademicEnrollment::findOrFail($academic), $r->user(), $data);

        return back()->with('success', 'Obligation complémentaire enregistrée avec sa justification.');
    }

    public function payment(Request $r, int $academic)
    {
        $this->authorizeStaff($r, 'manage academic finance');
        $data = $r->validate(['kind' => 'required|string|max:50|regex:/^[a-z][a-z0-9_]*$/', 'amount' => 'required|numeric|gt:0', 'method' => 'required|in:cash,bank_transfer,other', 'reference' => 'required|string|max:180', 'note' => 'required|string|min:5|max:1000']);
        $this->finance->record(AcademicEnrollment::findOrFail($academic), $r->user(), $data);

        return back()->with('success', 'Versement enregistré en attente de confirmation comptable.');
    }

    public function paymentStatus(Request $r, int $payment)
    {
        $this->authorizeStaff($r, 'manage academic finance');
        $data = $r->validate(['status' => 'required|in:confirmed,cancelled,refunded', 'reason' => 'required|string|min:10|max:1000']);
        $this->finance->transition(StudentPayment::findOrFail($payment), $r->user(), $data['status'], $data['reason']);

        return back()->with('success', 'Écriture comptable mise à jour. Les droits sont recalculés à partir des versements confirmés.');
    }

    public function adjustment(Request $r, int $academic)
    {
        $this->authorizeStaff($r, 'manage academic finance');
        $data = $r->validate(['fee_kind' => 'required|string|max:50|regex:/^[a-z][a-z0-9_]*$/', 'type' => 'required|in:exemption,scholarship,reduction,plan,override', 'percentage' => 'nullable', 'funding_source' => 'nullable|in:institution,third_party', 'stackable' => 'sometimes|boolean', 'operation_key' => 'nullable|uuid', 'feature' => ['nullable', Rule::in(['materials_download', 'assignments_submit', 'evaluations_participate', 'documents_request', 'results_view'])], 'amount' => 'nullable|numeric|gt:0', 'starts_at' => 'nullable|date', 'expires_at' => ['nullable', 'date', Rule::when($r->filled('starts_at'), 'after_or_equal:starts_at')], 'reason' => 'required|string|min:10|max:2000', 'schedule' => 'nullable|array|max:24', 'schedule.*.due_at' => 'required|date', 'schedule.*.amount' => 'required|numeric|gt:0']);
        if ($data['type'] === 'override') {
            $r->validate(['feature' => 'required', 'expires_at' => 'required|date|after_or_equal:today']);
        }
        $this->finance->adjust(AcademicEnrollment::findOrFail($academic), $r->user(), $data);

        return back()->with('success', 'Autorisation financière enregistrée et tracée.');
    }

    public function revoke(Request $r, int $adjustment)
    {
        $this->authorizeStaff($r, 'manage academic finance');
        $data = $r->validate(['reason' => 'required|string|min:10|max:1000']);
        $this->finance->revokeAdjustment(FinancialAdjustment::findOrFail($adjustment), $r->user(), $data['reason']);

        return back()->with('success', 'Autorisation révoquée.');
    }

    public function rule(Request $r, AcademicRuleService $service)
    {
        $this->authorizeStaff($r, 'manage academic access');
        $data = $r->validate(['fee_kind' => 'required|string|max:50|regex:/^[a-z][a-z0-9_]*$/', 'feature' => 'required|in:materials_download,assignments_submit,evaluations_participate,documents_request,results_view', 'academic_year_id' => 'nullable|integer|exists:academic_years,id', 'level_id' => 'nullable|integer|exists:levels,id', 'mode' => 'required|in:open,full,minimum,first_installment,exemption,hidden', 'minimum' => 'required_if:mode,minimum|nullable|numeric|gt:0', 'allow_plan' => 'boolean', 'allow_exemption' => 'boolean', 'regulation_reference' => 'nullable|string|max:2000', 'regulation_confirmed' => 'boolean', 'reason' => 'required|string|min:10|max:2000']);
        $service->save($r->user(), $data);

        return back()->with('success', 'Nouvelle règle enregistrée. Les droits sont recalculés à chaque accès.');
    }

    public function deactivateRule(Request $r, int $rule)
    {
        $this->authorizeStaff($r, 'manage academic access');
        $data = $r->validate(['reason' => 'required|string|min:10|max:1000']);
        DB::transaction(function () use ($r, $rule, $data) {
            $entity = AccessRule::lockForUpdate()->findOrFail($rule);
            $entity->update(['is_active' => false]);
            Audit::record($r->user()->id, 'academic_access_rule_disabled', $entity, $data['reason']);
        });

        return back()->with('success', 'Règle désactivée. Le périmètre hérite des autres règles applicables.');
    }

    public function status(Request $r, int $academic, \App\Modules\Student\Application\Services\AcademicEnrollmentService $service)
    {
        $this->authorizeStaff($r, 'manage academic access');
        $data = $r->validate([
            'student_status' => 'required|in:active,suspended,graduated,archived',
            'enrollment_status' => ['required', Rule::in(array_keys($service::TRANSITIONS))],
            'class_id' => 'nullable|integer|exists:classes,id', 'reason' => 'required|string|min:10|max:1000',
            'operation_key' => 'nullable|uuid',
        ]);
        $data['operation_key'] ??= (string) \Illuminate\Support\Str::uuid();
        $service->transition(AcademicEnrollment::findOrFail($academic), $r->user(), $data);
        return back(303)->with('success', 'Situation académique mise à jour et historisée.');
    }

    public function offering(Request $r)
    {
        $this->authorizeStaff($r, 'publish academic content');
        $data = $r->validate(['course_id' => 'required|integer|exists:courses,id', 'academic_year_id' => 'required|integer|exists:academic_years,id', 'class_id' => 'nullable|integer|exists:classes,id', 'academic_department_id' => 'nullable|integer|exists:academic_departments,id', 'professor_id' => 'nullable|integer|exists:professors,id', 'semester' => 'nullable|string|max:80', 'is_optional' => 'boolean', 'is_published' => 'boolean']);
        app(\App\Modules\Teaching\Application\Services\TeachingAssignmentService::class)->save(
            $data + ['is_published' => false], $r->user()->id
        );

        return back()->with('success', 'Enseignement enregistré pour cette année académique.');
    }

    public function publish(Request $r, string $type, int $id)
    {
        $this->authorizeStaff($r, 'publish academic content');
        $data = $r->validate(['is_published' => 'required|boolean', 'reason' => 'required|string|min:5|max:1000']);
        $model = match ($type) {
            'offerings' => AcademicOffering::class,'resources' => AcademicResource::class,'sessions' => AcademicSession::class,default => abort(404)
        };
        $entity = $model::findOrFail($id);
        $offering = $entity instanceof AcademicOffering ? $entity : $entity->offering;
        \App\Modules\Teaching\Application\Services\TeachingScope::authorize($r->user(), (int) $offering->level->faculty_id);
        if ($entity instanceof AcademicOffering && $entity->curriculum_item_id) {
            throw \Illuminate\Validation\ValidationException::withMessages(['offering' => 'Utilisez la publication des offres versionnées.']);
        }
        abort_if($offering->archived_at || ($offering->curriculum_item_id && ! in_array($offering->academicYear->status, ['draft', 'open'], true)), 422, 'Une offre archivée ou dans une année clôturée ne peut plus être modifiée.');
        abort_if($offering->curriculum_item_id && $entity instanceof AcademicSession && $entity->is_published && $entity->starts_at <= now(), 422, 'Une séance passée publiée reste dans l’historique.');
        if ($entity instanceof AcademicSession) {
            if (! $data['is_published'] && ! $entity->is_published) {
                return back()->with('success', 'La séance est en brouillon.');
            }
            app(\App\Modules\Teaching\Application\Services\SessionLifecycle::class)->apply($entity, $r->user(), [
                'action' => $data['is_published'] ? 'publish' : 'cancel', 'reason' => $data['reason'],
            ], false);
            return back()->with('success', 'Publication mise à jour.');
        }
        if ($entity instanceof AcademicResource && $entity->assessment()->exists()) {
            throw \Illuminate\Validation\ValidationException::withMessages(['resource' => 'Utilisez le workflow Évaluations pour ce contenu.']);
        }
        if ($entity instanceof AcademicResource && $entity->student_profile_id === null && in_array($entity->kind, AcademicResource::CONTENT_KINDS, true)) {
            app(LearningContent::class)->transition($entity, $r->user(), [
                'action' => $data['is_published'] ? 'publish' : 'withdraw', 'reason' => $data['reason'], 'revision' => $entity->revision,
            ]);

            return back()->with('success', 'Publication mise à jour.');
        }
        $entity->update(['is_published' => $data['is_published']]);
        Audit::record($r->user()->id, 'academic_publication_changed', $entity, $data['reason'], ['is_published' => $data['is_published']]);

        return back()->with('success', 'Publication mise à jour.');
    }

    public function session(Request $r)
    {
        $this->authorizeStaff($r, 'publish academic content');
        $data = $r->validate(['academic_offering_id' => 'required|integer|exists:academic_offerings,id', 'starts_at' => 'required|date', 'ends_at' => 'required|date|after:starts_at', 'room' => 'required|string|max:180', 'is_published' => 'boolean']);
        app(\App\Modules\Teaching\Application\Services\ScheduleService::class)->save($data, $r->user()->id);

        return back()->with('success', 'Séance enregistrée.');
    }

    public function resource(Request $r)
    {
        $this->authorizeStaff($r, 'publish academic content');
        $data = $r->validate(['academic_offering_id' => 'required|integer|exists:academic_offerings,id', 'kind' => 'required|in:material,assignment,evaluation,result,announcement,document,online,video', 'student_profile_id' => 'required_if:kind,result,document|nullable|integer|exists:student_profiles,id', 'url' => 'required_if:kind,online,video|nullable|url:http,https|max:2000', 'title' => 'required|string|max:180', 'body' => 'nullable|string|max:30000', 'opens_at' => 'nullable|date', 'closes_at' => ['nullable', 'date', Rule::when($r->filled('opens_at'), 'after:opens_at')], 'is_published' => 'boolean', 'file' => 'nullable|file|mimes:pdf,jpg,jpeg,png,webp,doc,docx,ppt,pptx,xls,xlsx|max:'.\App\Support\DocumentUploadLimit::kilobytes()]);
        $offering = AcademicOffering::findOrFail($data['academic_offering_id']);
        \App\Modules\Teaching\Application\Services\TeachingScope::authorize($r->user(), (int) $offering->level->faculty_id);
        abort_if($offering->archived_at || ($offering->curriculum_item_id && ! in_array($offering->academicYear->status, ['draft', 'open'], true)), 422, 'Une offre archivée ou dans une année clôturée ne peut plus recevoir de ressources.');
        if ($offering->curriculum_item_id && ($data['student_profile_id'] ?? null)) {
            abort_unless(app(\App\Modules\Teaching\Application\Services\CourseAudience::class)->roster($offering)->where('student_profile_id', $data['student_profile_id'])->exists(), 422, 'Le destinataire doit avoir une inscription pédagogique active.');
        }
        if ($data['student_profile_id'] ?? null) {
            abort_unless(AcademicEnrollment::where('student_profile_id', $data['student_profile_id'])->where('level_id', $offering->level_id)->where('academic_year_id', $offering->academic_year_id)->when($offering->academic_department_id, fn ($q, $department) => $q->where('academic_department_id', $department))->when($offering->class_id, fn ($q, $group) => $q->where('class_id', $group))->exists(), 422, 'Le destinataire doit appartenir à cet enseignement.');
        }
        if (! ($data['student_profile_id'] ?? null) && in_array($data['kind'], AcademicResource::CONTENT_KINDS, true)) {
            app(LearningContent::class)->create($offering, $r->user(), $data + [
                'publish' => (bool) ($data['is_published'] ?? false), 'operation_key' => (string) Str::uuid(),
            ], $r->file('file'));

            return back()->with('success', 'Ressource enregistrée.');
        }
        foreach (['opens_at', 'closes_at'] as $key) {
            if (! empty($data[$key])) {
                $data[$key] = \Carbon\Carbon::parse($data[$key], 'Africa/Kinshasa')->utc();
            }
        }
        $path = null;
        unset($data['file']);
        try {
            DB::transaction(function () use ($r, $data, &$path) {
                $fields = $data;
                if ($r->hasFile('file')) {
                    $path = $r->file('file')->store('academic-resources', 'local');
                    abort_unless($path, 500);
                    $fields += ['path' => $path, 'filename' => $r->file('file')->getClientOriginalName(), 'mime' => $r->file('file')->getMimeType()];
                }$entity = AcademicResource::create($fields);
                Audit::record($r->user()->id, 'academic_resource_created', $entity);
            });
        } catch (\Throwable $e) {
            if ($path) {
                Storage::disk('local')->delete($path);
            }throw $e;
        }

        return back()->with('success', 'Ressource enregistrée. Seules les ressources publiées sont visibles aux étudiants concernés.');
    }

    public function courseException(Request $r, int $academic)
    {
        $this->authorizeStaff($r, 'manage academic access');
        $data = $r->validate(['academic_offering_id' => 'required|integer|exists:academic_offerings,id', 'action' => 'required|in:include,exclude', 'reason' => 'required|string|min:10|max:1000']);
        $entry = AcademicEnrollment::findOrFail($academic);
        $offering = AcademicOffering::findOrFail($data['academic_offering_id']);
        abort_if($offering->curriculum_item_id || $offering->archived_at, 422, 'Utilisez les inscriptions pédagogiques pour cette offre.');
        abort_unless($entry->level_id === $offering->level_id && $entry->academic_year_id === $offering->academic_year_id, 422);
        abort_unless(! $offering->academic_department_id || $offering->academic_department_id === $entry->academic_department_id, 422, 'Cet enseignement appartient à un autre département.');
        $entity = CourseException::updateOrCreate(['academic_enrollment_id' => $academic, 'academic_offering_id' => $offering->id], ['action' => $data['action'], 'reason' => $data['reason'], 'authorized_by' => $r->user()->id]);
        Audit::record($r->user()->id, 'course_exception_changed', $entity, $data['reason']);

        return back()->with('success', 'Affectation individuelle enregistrée.');
    }

    public function downloadSubmission(Request $r, int $submission, AssessmentCopies $copies)
    {
        $work = $this->staffSubmission($r, $submission);
        $data = $r->validate(['version' => 'nullable|integer|min:1']);

        return $copies->download($work, isset($data['version']) ? (int) $data['version'] : null);
    }

    public function submissionVersion(Request $r, int $submission, int $version, AssessmentCopies $copies)
    {
        $work = $this->staffSubmission($r, $submission);
        $current = (int) $work->version;
        abort_unless($version >= 1 && $version <= $current, 404);
        $edition = $copies->snapshot($work, $version);
        $parameters = ['submission' => $work->id];

        return Inertia::render('dashboard/student/SubmissionVersion', [
            'title' => $work->resource->title,
            'number' => $version,
            'current' => $current,
            'body' => $edition['body'],
            'late' => $edition['late'],
            'received_at' => $edition['received_at'],
            'download_url' => $edition['path'] ? route(self::SUBMISSION_ROUTES.'download', $parameters + ['version' => $version]) : null,
            'previous_url' => $version > 1 ? route(self::SUBMISSION_ROUTES.'version', $parameters + ['version' => $version - 1]) : null,
            'next_url' => $version < $current ? route(self::SUBMISSION_ROUTES.'version', $parameters + ['version' => $version + 1]) : null,
            'return_url' => route('dashboard.admin.student-academic.index', ['tab' => 'teaching', 'academic' => $work->academic_enrollment_id]),
            'administrative' => true,
        ]);
    }

    private function staffSubmission(Request $r, int $submission): AcademicSubmission
    {
        $this->authorizeStaff($r, 'publish academic content');
        $work = AcademicSubmission::with('resource.offering.level')->findOrFail($submission);
        TeachingScope::authorize($r->user(), (int) $work->resource->offering->level->faculty_id);

        return $work;
    }

    public function respond(Request $r, int $ticket)
    {
        $this->authorizeStaff($r, 'manage academic access');
        $data = $r->validate(['response' => 'required|string|min:5|max:6000', 'status' => 'required|in:open,resolved']);
        app(\App\Modules\Student\Application\Services\StudentRequestService::class)->respond(ServiceRequest::findOrFail($ticket), $r->user(), $data);

        return back()->with('success', 'Réponse publiée dans l’espace de l’étudiant.');
    }
}
