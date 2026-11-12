<?php

namespace App\Modules\Student\Infrastructure\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\AcademicCalendarEvent;
use App\Models\Level;
use App\Models\Student\AcademicEnrollment;
use App\Models\Student\AssessmentRecord;
use App\Modules\Assessment\Application\AssessmentAccess;
use App\Modules\Assessment\Application\AssessmentCopies;
use App\Modules\Assessment\Application\AssessmentStudent;
use App\Modules\Assessment\Application\AssessmentSubmissions;
use App\Models\Student\AcademicProgression;
use App\Models\Student\AcademicResource;
use App\Models\Student\AcademicSubmission;
use App\Models\Student\ServiceRequest;
use App\Modules\Student\Application\Services\AcademicAccessService;
use App\Modules\Student\Application\Services\AcademicProgressionService;
use App\Modules\Student\Application\Services\Audit;
use App\Modules\Student\Application\Services\StudentFinanceService;
use App\Modules\Teaching\Application\Services\LearningAccess;
use App\Modules\Teaching\Application\Services\LearningFiles;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class StudentPortalController extends Controller
{
    public function __construct(private AcademicAccessService $access, private StudentFinanceService $finance) {}

    public function context(Request $request): AcademicEnrollment
    {
        abort_unless($request->user()->hasRole('student'), 403);
        $profile = $request->user()->studentProfile;
        abort_unless($profile, 403, 'Votre profil étudiant n’est pas encore activé.');
        $request->validate(['academic' => 'nullable|integer', 'application' => 'nullable|uuid']);
        $query = $profile->enrollments()->whereHas('application')->with(['profile.user', 'application', 'level.faculty', 'level.detail', 'academicYear', 'group.intake', 'department:id,name']);
        if ($request->query('academic')) {
            $query->where('academic_enrollments.id', $request->query('academic'));
        }
        if ($request->query('application')) {
            $query->whereHas('application', fn ($q) => $q->where('uuid', $request->query('application')))->orderBy('academic_enrollments.id');
        }

        return $query->join('academic_years', 'academic_years.id', '=', 'academic_enrollments.academic_year_id')->orderByDesc('academic_years.start_date')->orderByDesc('academic_enrollments.id')->select('academic_enrollments.*')->firstOrFail();
    }

    private function requireFeature(AcademicEnrollment $entry, string $feature): void
    {
        $decision = $this->access->decision($entry, $feature);
        abort_unless($decision['allowed'], 403, $decision['reason'] ?? 'Accès refusé.');
    }

    private function resource(AcademicEnrollment $entry, int $id): AcademicResource
    {
        $this->requireFeature($entry, 'courses_view');
        $resource = AcademicResource::visible()->forStudent($entry)->with('supplementaryFor:id,kind')->findOrFail($id);
        abort_unless($this->access->offerings($entry)->whereKey($resource->academic_offering_id)->exists(), 404);

        return $resource;
    }

    public function acknowledgeWelcome(Request $request)
    {
        $entry = $this->context($request);
        $entry->profile->newQuery()->whereKey($entry->student_profile_id)->whereNull('welcome_seen_at')->update(['welcome_seen_at' => now()]);

        return back(303);
    }

    private function canChooseDepartment(AcademicEnrollment $entry): bool
    {
        return $entry->enrollment_status === 'confirmed'
            && $entry->profile->student_status === 'active'
            && $entry->academicYear->status === 'open';
    }

    public function chooseDepartment(Request $request)
    {
        $context = $this->context($request);
        $data = $request->validate(['academic_department_id' => 'required|integer']);
        $departmentId = (int) $data['academic_department_id'];

        DB::transaction(function () use ($request, $context, $departmentId) {
            $level = Level::lockForUpdate()->findOrFail($context->level_id);
            $entry = AcademicEnrollment::where('student_profile_id', $context->student_profile_id)
                ->lockForUpdate()->findOrFail($context->id);
            abort_unless($this->canChooseDepartment($entry), 403);
            if ((int) $entry->academic_department_id === $departmentId && $entry->academic_department_id !== null) {
                return;
            }
            if ($entry->academic_department_id !== null) {
                throw ValidationException::withMessages(['academic_department_id' => 'Le département de cette inscription a déjà été confirmé.']);
            }
            if (! $level->departmentOptions()->where('faculty_id', $level->faculty_id)->where('is_active', true)->whereKey($departmentId)->exists()) {
                throw ValidationException::withMessages(['academic_department_id' => 'Ce département ne fait pas partie des choix de votre niveau.']);
            }
            $entry->update(['academic_department_id' => $departmentId]);
            Audit::record($request->user()->id, 'student_department_selected', $entry, data: ['academic_department_id' => $departmentId]);
        });

        return redirect()->route('dashboard.student.index', ['section' => 'overview', 'academic' => $context->id]);
    }

    public function startRenewal(Request $request, AcademicProgression $progression, AcademicProgressionService $progressions)
    {
        $entry = $this->context($request);
        $target = $progressions->start($progression, $entry->profile);

        return redirect()->route('dashboard.student.index', ['section' => 'fees', 'academic' => $target->id], 303)
            ->with('success', 'Réinscription enregistrée.');
    }

    public function show(Request $request, string $section = 'overview')
    {
        $entry = $this->context($request);
        $permissions = $this->access->permissions($entry);
        $sectionFeature = ['materials' => 'materials_download', 'assignments' => 'assignments_submit', 'evaluations' => 'evaluations_participate', 'results' => 'results_view'][$section] ?? null;
        if ($sectionFeature && ($permissions[$sectionFeature]['visible'] ?? true) === false) {
            abort(403, 'Ce service n’est pas proposé pour votre parcours.');
        }
        $feature = match ($section) {
            'courses','materials','assignments','evaluations','announcements' => 'courses_view','schedule' => 'schedule_view','results' => 'results_view',default => 'dashboard_view'
        };
        abort_unless($permissions[$feature]['allowed'], 403, $permissions[$feature]['reason'] ?? 'Accès refusé.');
        $courses = $this->access->courses($entry);
        $submissions = $section === 'documents'
            ? AcademicSubmission::with('resource:id,title')->where('academic_enrollment_id', $entry->id)->get()->keyBy('academic_resource_id')
            : collect();
        $kindForSection = ['materials' => 'material', 'assignments' => 'assignment', 'evaluations' => 'evaluation', 'results' => 'result', 'announcements' => 'announcement', 'documents' => 'document'][$section] ?? null;
        $offerings = $permissions['courses_view']['allowed'] && ($kindForSection !== null || in_array($section, ['overview', 'schedule'], true))
            ? $this->access->offerings($entry)->get(['id'])
            : collect();
        $resources = collect();
        $workPagination = null;
        $workSection = in_array($section, ['assignments', 'evaluations'], true);
        $workFilter = $workSection ? $request->validate(['activity' => 'nullable|in:available,upcoming,submitted,grading,corrected', 'work' => 'nullable|integer|min:1']) : [];
        $assessmentStudent = app(AssessmentStudent::class);
        if ($offerings->isNotEmpty() && ($section === 'overview' || $kindForSection !== null)) {
            $query = AcademicResource::visible()->forStudent($entry)->forLearningPermissions($permissions)
                ->with('offering.course')->whereIn('academic_offering_id', $offerings->pluck('id'));
            $query->when($kindForSection, fn ($q, $kind) => $kind === 'material' ? $q->whereIn('kind', ['material', 'syllabus', 'audio']) : $q->where('kind', $kind));
            if ($workSection) {
                $own = fn ($row) => $row->where('academic_enrollment_id', $entry->id);
                $attempt = fn ($row) => $own($row)->whereIn('participation', ['submitted', 'late_submission']);
                $released = fn ($row) => $own($row)->whereNotNull('released_at');
                $query->when($workFilter['work'] ?? null, fn ($q, $id) => $q->whereKey($id));
                match ($workFilter['activity'] ?? null) {
                    'upcoming' => $query->where('opens_at', '>', now()),
                    'available' => $query->where(fn ($q) => $q->whereNull('opens_at')->orWhere('opens_at', '<=', now()))
                        ->where(fn ($q) => $q->where(fn ($legacy) => $legacy->whereDoesntHave('assessment')
                            ->where(fn ($period) => $period->whereNull('closes_at')->orWhere('closes_at', '>=', now())))
                            ->orWhereHas('assessment', fn ($item) => $item->where('state', 'published')->where('modality', 'submission')
                                ->where('accepts_until', '>=', now())->where(fn ($group) => $group->where('group_work', false)
                                    ->orWhereHas('records.group', fn ($membership) => $membership->where('leader_enrollment_id', $entry->id)))))
                        ->whereDoesntHave('assessment.records', $attempt)->whereDoesntHave('submissions', $own),
                    'submitted' => $query->where(fn ($q) => $q->whereHas('assessment.records', $attempt)->orWhereHas('submissions', $own)),
                    'grading' => $query->whereHas('assessment', fn ($q) => $q->where('state', 'closed')->whereDoesntHave('records', $released)),
                    'corrected' => $permissions['results_view']['allowed'] ? $query->whereHas('assessment.records', $released) : $query->whereRaw('1 = 0'),
                    default => null,
                };
                $page = $query->orderByDesc('id')->paginate(25, ['*'], 'work_page')->withQueryString();
                $workPagination = ['links' => $page->linkCollection()];
                $rows = $page->getCollection();
                [$participants, $groupCopies] = $assessmentStudent->context($rows, $entry);
            } else {
                $rows = $query->get();
                $participants = $groupCopies = collect();
            }
            if ($workSection) {
                $submissions = AcademicSubmission::where('academic_enrollment_id', $entry->id)->whereIn('academic_resource_id', $rows->modelKeys())
                    ->get()->keyBy('academic_resource_id');
            }
            $availableKinds = $permissions['materials_download']['allowed'] ? AcademicResource::CONTENT_KINDS : ['online', 'video'];
            $workSupports = $workSection && $permissions[$section === 'assignments' ? 'assignments_submit' : 'evaluations_participate']['allowed']
                ? AcademicResource::visible()->forStudent($entry)->whereIn('supplementary_for_id', $rows->modelKeys())
                    ->whereIn('kind', $availableKinds)->orderBy('position')->orderBy('id')->get(['id', 'kind', 'title', 'path', 'supplementary_for_id'])
                    ->groupBy('supplementary_for_id')
                : collect();
            $resources = $rows->map(function ($r) use ($entry, $permissions, $submissions, $section, $workSupports, $workSection, $participants, $groupCopies, $assessmentStudent) {
                $feature = $workSection ? AssessmentAccess::feature($r) : LearningAccess::fileFeature($r);
                if (($permissions[$feature]['visible'] ?? true) === false) {
                    return null;
                }
                $allowed = $permissions[$feature]['allowed'];
                $submission = $groupCopies->get($r->id) ?? $submissions->get($r->id);
                $participant = $workSection && $r->assessment ? $participants->get($r->assessment->id) : null;
                $mayReadResults = $permissions['results_view']['allowed'];
                $assessment = $workSection && $r->assessment && ($allowed || $participant?->released_at && $mayReadResults)
                    ? $assessmentStudent->row($r, $entry, $participant, $submission, $allowed, $mayReadResults) : null;
                if ($workSection && ! $allowed && ! $assessment && $r->assessment) {
                    $submission = null;
                }


                return ['id' => $r->id, 'kind' => $r->kind, 'title' => $r->kind === 'result' && ! $allowed ? 'Résultat publié (accès soumis à une règle administrative)' : $r->title, 'body' => $allowed && $section !== 'overview' ? $r->body : null, 'course' => $this->access->reference($entry, $r->offering->course)['title'], 'allowed' => $allowed, 'reason' => $permissions[$feature]['reason'], 'download_url' => $r->path && $allowed ? '/dashboard/student/resources/'.$r->id.'/download?academic='.$entry->id : null, 'opens_at' => $r->opens_at, 'closes_at' => $r->closes_at, 'assessment' => $assessment, 'supports' => $workSupports->get($r->id, collect())->map(fn ($item) => [
                    'id' => $item->id, 'title' => $item->title,
                    'url' => route('dashboard.student.courses.show', ['course' => $r->offering->course_id, 'section' => match ($item->kind) { 'online' => 'online', 'video' => 'videos', default => 'files' }, 'academic' => $entry->id, 'support' => $item->id]),
                    'download_url' => $item->path ? route('dashboard.student.resources.download', ['resource' => $item->id, 'academic' => $entry->id]) : null,
                ]), 'submission' => $submission ? ['id' => $submission->id, 'body' => $submission->body, 'version' => $submission->version, 'submitted_at' => $submission->updated_at, 'filename' => $submission->filename, 'download_url' => $submission->path ? '/dashboard/student/submissions/'.$submission->id.'/download?academic='.$entry->id : null] : null];
            })->filter()->values();
        }
        $weekInput = in_array($section, ['schedule', 'overview'], true) ? $request->validate(['week' => 'nullable|date_format:Y-m-d']) : [];
        $scheduleWeek = \Carbon\CarbonImmutable::parse($weekInput['week'] ?? now('Africa/Kinshasa')->toDateString(), 'Africa/Kinshasa')->startOfWeek();
        $calendarEvents = in_array($section, ['schedule', 'overview'], true) && $permissions['schedule_view']['allowed']
            ? AcademicCalendarEvent::where('academic_year_id', $entry->academic_year_id)
                ->whereIn('category', ['exam', 'resit'])
                ->where('start_date', '<', $scheduleWeek->addWeek()->toDateString())
                ->where('end_date', '>=', $scheduleWeek->toDateString())
                ->orderBy('start_date')->orderBy('id')
                ->get(['id', 'title', 'category', 'start_date', 'end_date'])
                ->map(fn (AcademicCalendarEvent $event) => $event->toArray() + ['category_label' => AcademicCalendarEvent::CATEGORIES[$event->category]])
            : [];
        $sessionsQuery = $this->access->sessions($entry)->with(['successor:id,replaces_session_id,starts_at', 'offering.course', 'offering.professor', 'offering.assignments.professor']);
        if ($section === 'schedule') {
            $sessionsQuery->where('starts_at', '<', $scheduleWeek->addWeek()->utc())->where('ends_at', '>', $scheduleWeek->utc());
        } else {
            $sessionsQuery->whereNull('cancelled_at')->where('ends_at', '>=', now('Africa/Kinshasa')->startOfWeek()->utc())->limit(50);
        }
        $sessions = in_array($section, ['overview', 'schedule'], true) ? $sessionsQuery->orderBy('starts_at')->get() : collect();
        $sessionContent = $offerings->isNotEmpty() && $sessions->isNotEmpty()
            ? AcademicResource::visible()->forStudent($entry)->forLearningPermissions($permissions)->whereIn('academic_offering_id', $offerings->pluck('id'))
                ->whereIn('kind', $permissions['materials_download']['allowed'] ? AcademicResource::CONTENT_KINDS : ['online', 'video'])
                ->whereIn('academic_session_id', $sessions->pluck('id'))->distinct()->pluck('academic_session_id')->flip()
            : collect();
        $sessions = $sessions->map(fn ($s) => [
            'id' => $s->id, 'course' => $this->access->reference($entry, $s->offering->course)['title'], 'starts_at' => $s->starts_at, 'ends_at' => $s->ends_at, 'room' => $s->room,
            'resource_url' => $sessionContent->has($s->id) ? route('dashboard.student.courses.show', ['course' => $s->offering->course_id, 'section' => 'online', 'academic' => $entry->id, 'session' => $s->id]) : null,
            'status' => $s->cancelled_at ? ($s->successor ? 'rescheduled' : 'cancelled') : 'published',
            'teacher' => \App\Modules\Teaching\Application\Services\TeachingTeam::leadNameAt($s->offering, $s->starts_at) ?? $s->offering->course->teacher, 'level_id' => $s->offering->level_id,
        ]);
        $detail = $entry->level->detail;
        $paymentsPage = $section === 'transactions'
            ? $entry->payments()->withSum(['refunds as refunded_cents' => fn ($q) => $q->where('status', 'executed')], 'amount_cents')->latest('id')->paginate(20, ['*'], 'payments_page')->withQueryString()
            : null;
        $payments = ($paymentsPage?->getCollection() ?? collect())->map(fn ($p) => ['id' => $p->id, 'uuid' => $p->uuid, 'reference' => $p->reference, 'amount_cents' => $p->amount_cents, 'currency' => $p->currency, 'refunded_cents' => (int) $p->refunded_cents, 'status' => $p->status, 'method' => $p->method, 'created_at' => $p->created_at, 'confirmed_at' => $p->confirmed_at, 'receipt_url' => $p->confirmed_at ? '/dashboard/student/payments/'.$p->uuid.'/receipt?academic='.$entry->id : null]);

        $statement = $this->finance->statement($entry);
        $balance = $statement['balance'];
        $photoUrl = $entry->profile->photo_path ? '/dashboard/student/profile/photo?academic='.$entry->id.'&v='.$entry->profile->updated_at->timestamp : null;
        if (! $photoUrl) {
            $photo = $entry->application->documents()->where('key', 'like', '%photo%')->where('review_status', 'accepted')->where('mime', 'like', 'image/%')->first();
            $photoUrl = $photo ? route('dashboard.enrollments.documents.preview', $photo->uuid) : null;
        }

        $progression = in_array($section, ['overview', 'academics', 'fees'], true)
            ? AcademicProgression::with(['level:id,title', 'academicYear:id,title,status', 'target:id,enrollment_status'])
                ->where(fn ($q) => $q->where('source_enrollment_id', $entry->id)->orWhere('target_enrollment_id', $entry->id))
                ->orderByDesc('id')->first()
            : null;

        $lifecycle = $section === 'academics' ? \App\Models\Student\AcademicLifecycleCase::where('academic_enrollment_id', $entry->id)
            ->whereIn('status', ['approved', 'refused'])->latest('decided_at')->latest('id')->limit(20)
            ->get()->map(fn ($case) => $case->only(['reference', 'kind', 'status', 'decided_at'])) : [];
        $officialProgress = $section === 'academics' && $permissions['results_view']['allowed']
            ? app(\App\Modules\Results\Application\ResultInputs::class)->latest($entry) : null;

        return Inertia::render('dashboard/student/Portal', [
            'lifecycle' => $lifecycle,
            'progression_credits' => $officialProgress ? [
                'earned' => $officialProgress->snapshot['credits']['earned'], 'remaining' => $officialProgress->snapshot['credits']['remaining'],
                'reference' => $officialProgress->reference,
            ] : null,
            'progression' => $progression ? [
                'kind' => $progression->kind, 'due_on' => $progression->decision_snapshot['due_on'] ?? null,
                'retakes' => $progression->decision_snapshot['retakes'] ?? [],
                'id' => $progression->id, 'level' => $progression->level->title, 'year' => $progression->academicYear->title,
                'target_id' => $progression->target_enrollment_id, 'status' => $progression->target?->enrollment_status,
                'can_start' => $progression->target_enrollment_id === null && $progression->academicYear->status === 'open'
                    && $entry->profile->student_status === 'active'
                    && ($entry->enrollment_status === 'completed' || $progression->kind === 'resumption')
                    && ! \App\Modules\Progression\Application\AcademicLifecycle::interrupted($entry),
            ] : null,
            'department' => $entry->department?->only(['id', 'name']),
            'department_options' => $entry->academic_department_id === null && $this->canChooseDepartment($entry)
                ? $entry->level->departmentOptions()->where('faculty_id', $entry->level->faculty_id)->where('is_active', true)->orderBy('name')->get(['academic_departments.id', 'name'])->makeHidden('pivot')
                : [],
            'curriculum' => $this->access->curriculumContext($entry),
            'overview' => $section === 'overview' ? app(\App\Modules\Student\Application\Services\StudentOverviewService::class)->summary($entry, $permissions, $balance, $scheduleWeek) : null,
            'card_eligibility' => $section === 'card' ? (function () use ($entry) {
                $eligibility = app(\App\Modules\Student\Application\Services\CardEligibility::class);

                return $eligibility->summary($eligibility->query()->findOrFail($entry->id));
            })() : null,
            'profile_form' => $section === 'profile' ? ['values' => array_merge(array_fill_keys(config('student_profile.detail_fields'), null), $entry->profile->personal_details ?? [], $entry->profile->user->only(['first_name', 'last_name', 'post_name', 'gender', 'email'])), 'provinces' => config('student_profile.provinces')] : null,
            'welcome_pending' => $entry->profile->welcome_seen_at === null,
            'section' => $section, 'academic' => ['id' => $entry->id, 'application_uuid' => $entry->application->uuid, 'reference' => $entry->application->reference, 'matricule' => $entry->matricule ?? $entry->profile->matricule, 'application_status' => $entry->application->status->value, 'student_status' => $entry->profile->student_status, 'enrollment_status' => $entry->enrollment_status, 'level' => $entry->level->title, 'faculty' => $entry->level->faculty->name, 'year' => $entry->academicYear->title, 'group' => $entry->group?->intake?->name, 'fee_category' => $entry->fee_category, 'name' => implode(' ', array_filter([$entry->profile->user->first_name, $entry->profile->user->post_name, $entry->profile->user->last_name])), 'email' => $entry->profile->user->email, 'phone' => $entry->profile->personal_details['phone'] ?? null, 'photo_url' => $photoUrl],
            'contexts' => $entry->profile->enrollments()->with(['level.faculty', 'academicYear'])->get()->map(fn ($e) => ['id' => $e->id, 'label' => $e->level->title.' · '.$e->level->faculty->name.' · '.$e->academicYear->title]),
            'finance_schedule' => $section === 'fees' ? collect($statement['schedules'])->flatten(1)->values() : [],
            'payments_pagination' => ['links' => $paymentsPage?->linkCollection() ?? []],
            'permissions' => $permissions, 'balance' => $balance, 'obligations' => $entry->obligations()->get(['id', 'title', 'amount_cents', 'due_at', 'installment']),
            'tariffs' => collect(['national' => [$detail?->price_national_first, $detail?->price_national_second], 'foreign' => [$detail?->price_foreign_first, $detail?->price_foreign_second]])->map(fn ($values) => array_map(fn ($value) => $value !== null && $entry->currency === config('student.currency') ? \App\Modules\Student\Application\Services\Money::cents($value) : null, $values)),
            'official_results' => $section === 'results' ? app(\App\Modules\Results\Infrastructure\Http\StudentResultsController::class)->presentation($request, $entry) : null,
            'document_center' => in_array($section, ['documents', 'card'], true)
                ? app(\App\Modules\Documents\Application\DocumentQueries::class)->student($entry, $section) : null,
            'work_archive' => $section === 'documents' ? $submissions->values()->map(fn ($work) => ['id' => $work->id, 'title' => $work->resource->title, 'body' => $work->body, 'version' => $work->version, 'submitted_at' => $work->updated_at, 'filename' => $work->filename, 'download_url' => $work->path ? '/dashboard/student/submissions/'.$work->id.'/download?academic='.$entry->id : null]) : [],
            'payments' => $payments, 'adjustments' => $this->finance->activeAdjustments($entry)->map(fn ($a) => $a->only(['id', 'type', 'amount_cents', 'funding_source', 'feature', 'starts_at', 'expires_at', 'schedule'])),
            'schedule_week' => $scheduleWeek->toDateString(),
            'calendar_events' => $calendarEvents,
            'courses' => $courses, 'sessions' => $sessions, 'upcoming_sessions' => $sessions->filter(fn ($session) => $session['ends_at']->gte(now()))->values(), 'resources' => $resources, 'work_pagination' => $workPagination, 'activity_filter' => $workFilter['activity'] ?? null,
            'requests' => $section === 'requests' ? ServiceRequest::where('academic_enrollment_id', $entry->id)->latest()->get(['id', 'category', 'subject', 'body', 'status', 'response', 'created_at']) : [],
            'success' => session('success'),
        ]);
    }

    public function download(Request $request, int $resource, LearningFiles $files)
    {
        return $this->serveResource($request, $resource, $files, false);
    }

    public function preview(Request $request, int $resource, LearningFiles $files)
    {
        return $this->serveResource($request, $resource, $files, true);
    }

    private function serveResource(Request $request, int $id, LearningFiles $files, bool $inline)
    {
        $entry = $this->context($request);
        $resource = $this->resource($entry, $id);
        $this->requireFeature($entry, LearningAccess::fileFeature($resource));
        if ($feature = LearningAccess::parentFeature($resource)) {
            $this->requireFeature($entry, $feature);
        }
        if ($inline) {
            abort_unless(in_array($resource->kind, AcademicResource::CONTENT_KINDS, true), 404);
        }
        $response = $files->stream($resource->only(AcademicResource::EDITION_FIELDS), $inline);
        if (! $inline && $request->isMethod('GET') && ! $request->headers->has('Range')
            && in_array($resource->kind, AcademicResource::CONTENT_KINDS, true)) {
            DB::table('academic_resources')->where('id', $resource->id)->increment('download_count');
        }

        return $response;
    }

    public function submit(Request $request, int $resource, AssessmentSubmissions $submissions)
    {
        $entry = $this->context($request);
        $resource = $this->resource($entry, $resource);
        abort_unless(in_array($resource->kind, ['assignment', 'evaluation'], true), 404);
        $this->requireFeature($entry, AssessmentAccess::feature($resource));
        $data = $request->validate([
            'body' => 'required_without:file|nullable|string|max:20000',
            'file' => 'nullable|file|extensions:pdf,jpg,jpeg,png,webp|max:'.\App\Support\DocumentUploadLimit::kilobytes(),
            'operation_key' => 'nullable|uuid', 'expected_version' => 'nullable|integer|min:0',
        ]);
        $submissions->submit($entry, $resource, $data, $request->file('file'), $request->user()->id);

        return back()->with('success', 'Votre travail a été transmis.');
    }

    public function downloadSubmission(Request $request, int $submission, AssessmentAccess $access, AssessmentCopies $copies)
    {
        $work = $this->ownSubmission($request, $submission, $access);
        $data = $request->validate(['version' => 'nullable|integer|min:1']);

        return $copies->download($work, isset($data['version']) ? (int) $data['version'] : null);
    }

    public function submissionVersion(Request $request, int $submission, int $version, AssessmentAccess $access, AssessmentCopies $copies)
    {
        $work = $this->ownSubmission($request, $submission, $access);
        $edition = $copies->snapshot($work, $version);
        $parameters = ['submission' => $work->id, 'academic' => $request->query('academic')];

        return Inertia::render('dashboard/student/SubmissionVersion', [
            'title' => $work->resource->title, 'number' => $version, 'current' => (int) $work->version,
            'body' => $edition['body'], 'late' => $edition['late'], 'received_at' => $edition['received_at'],
            'download_url' => $edition['path'] ? route('dashboard.student.submissions.download', $parameters + ['version' => $version]) : null,
            'previous_url' => $version > 1 ? route('dashboard.student.submissions.version', $parameters + ['version' => $version - 1]) : null,
            'next_url' => $version < $work->version ? route('dashboard.student.submissions.version', $parameters + ['version' => $version + 1]) : null,
            'return_url' => route('dashboard.student.index', ['section' => $work->resource->kind === 'evaluation' ? 'evaluations' : 'assignments',
                'academic' => $request->query('academic'), 'work' => $work->academic_resource_id]),
        ]);
    }

    private function ownSubmission(Request $request, int $submission, AssessmentAccess $access): AcademicSubmission
    {
        $entry = $this->context($request);
        $work = AcademicSubmission::with('resource.assessment')->findOrFail($submission);
        $assessment = $work->resource->assessment;
        if ($assessment) {
            abort_unless($access->canReadWork($entry, $work->resource), 404);
        }
        if ($work->academic_enrollment_id !== $entry->id) {
            abort_unless($assessment && $assessment->records()->where('academic_enrollment_id', $entry->id)
                ->whereHas('group', fn ($group) => $group->where('leader_enrollment_id', $work->academic_enrollment_id))->exists(), 404);
        }

        return $work;
    }

    public function assessmentFeedback(Request $request, int $resource, AssessmentAccess $access, LearningFiles $files)
    {
        $entry = $this->context($request);
        $assessment = $this->resource($entry, $resource)->assessment()->firstOrFail();
        abort_unless($access->canReadFeedback($entry, $assessment), 404);
        $record = $assessment->records()->where('academic_enrollment_id', $entry->id)->whereNotNull('released_at')->firstOrFail();

        return $files->stream(['path' => $record->feedback_path, 'filename' => $record->feedback_filename]);
    }

    public function requestAssessmentReview(Request $request, int $resource, AssessmentAccess $access)
    {
        $entry = $this->context($request);
        $data = $request->validate(['body' => 'required|string|min:10|max:6000']);
        $assessment = $this->resource($entry, $resource)->assessment()->firstOrFail();
        DB::transaction(function () use ($entry, $assessment, $access, $request, $data) {
            $assessment = $assessment->newQuery()->sharedLock()->findOrFail($assessment->id);
            abort_unless($access->canReadFeedback($entry, $assessment), 404);
            $record = $assessment->records()->where('academic_enrollment_id', $entry->id)->whereNotNull('released_at')->lockForUpdate()->firstOrFail();
            if ($record->review_requested_revision === $record->revision) {
                return;
            }
            $ticket = ServiceRequest::create([
                'academic_enrollment_id' => $entry->id, 'category' => 'appeal',
                'subject' => 'Révision pédagogique · Évaluation '.$assessment->id.' · Correction '.$record->revision,
                'body' => $data['body'],
            ]);
            $record->update(['review_requested_revision' => $record->revision]);
            Audit::record($request->user()->id, 'assessment_review_requested', $record, null, ['ticket_id' => $ticket->id, 'revision' => $record->revision]);
        });

        return back(303)->with('success', 'Demande de révision enregistrée.');
    }

    public function receipt(Request $request, string $payment)
    {
        $entry = $this->context($request);
        $record = $entry->payments()->where('uuid', $payment)->whereNotNull('confirmed_at')->firstOrFail();

        return response()->view('student.receipt', ['payment' => $record, 'academic' => $entry])->header('Cache-Control', 'private, no-store');
    }

    public function requestService(Request $request)
    {
        $entry = $this->context($request);
        $data = $request->validate(['category' => 'required|in:support,appeal,document,finance', 'subject' => 'required|string|max:180', 'body' => 'required|string|min:10|max:6000']);
        if ($data['category'] === 'document') {
            $this->requireFeature($entry, 'documents_request');
        }
        $ticket = ServiceRequest::create($data + ['academic_enrollment_id' => $entry->id]);
        Audit::record($request->user()->id, 'student_request_created', $ticket);

        return back()->with('success', 'Votre demande a été transmise à l’administration.');
    }
}
