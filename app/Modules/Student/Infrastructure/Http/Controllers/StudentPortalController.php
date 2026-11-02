<?php

namespace App\Modules\Student\Infrastructure\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Student\AcademicEnrollment;
use App\Models\Student\AcademicResource;
use App\Models\Student\AcademicSubmission;
use App\Models\Student\ServiceRequest;
use App\Modules\Student\Application\Services\AcademicAccessService;
use App\Modules\Student\Application\Services\Audit;
use App\Modules\Student\Application\Services\StudentFinanceService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
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
        $query = $profile->enrollments()->whereHas('application')->with(['profile.user', 'application', 'level.faculty', 'level.detail', 'academicYear', 'group.intake']);
        if ($request->query('academic')) {
            $query->where('academic_enrollments.id', $request->query('academic'));
        }
        if ($request->query('application')) {
            $query->whereHas('application', fn ($q) => $q->where('uuid', $request->query('application')));
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
        $resource = AcademicResource::where('is_published', true)->findOrFail($id);
        abort_unless($this->access->offerings($entry)->whereKey($resource->academic_offering_id)->exists(), 404);
        abort_unless($resource->kind !== 'result' || $resource->student_profile_id === $entry->student_profile_id, 404);
        abort_unless(! $resource->student_profile_id || $resource->student_profile_id === $entry->student_profile_id, 404);

        return $resource;
    }

    public function acknowledgeWelcome(Request $request)
    {
        $entry = $this->context($request);
        $entry->profile->newQuery()->whereKey($entry->student_profile_id)->whereNull('welcome_seen_at')->update(['welcome_seen_at' => now()]);

        return back(303);
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
        $this->requireFeature($entry, $feature);
        $offerings = $permissions['courses_view']['allowed'] ? $this->access->offerings($entry)->with(['course', 'professor'])->get() : collect();
        $courses = $this->access->courses($entry);
        $submissions = AcademicSubmission::with('resource:id,title')->where('academic_enrollment_id', $entry->id)->get()->keyBy('academic_resource_id');
        $kindForSection = ['materials' => 'material', 'assignments' => 'assignment', 'evaluations' => 'evaluation', 'results' => 'result', 'announcements' => 'announcement', 'documents' => 'document'][$section] ?? null;
        $resources = collect();
        if ($offerings->isNotEmpty() && ($section === 'overview' || $kindForSection !== null)) {
            $resources = AcademicResource::with('offering.course')->whereIn('academic_offering_id', $offerings->pluck('id'))->where('is_published', true)->when($kindForSection, fn ($q, $kind) => $q->where('kind', $kind))->where(fn ($q) => $q->whereNull('student_profile_id')->orWhere('student_profile_id', $entry->student_profile_id))->where(fn ($q) => $q->where('kind', '!=', 'result')->orWhere('student_profile_id', $entry->student_profile_id))->get()->map(function ($r) use ($entry, $permissions, $submissions, $section) {
                $feature = match ($r->kind) {
                    'material' => 'materials_download','evaluation' => 'evaluations_participate','result' => 'results_view','document' => 'documents_request',default => 'courses_view'
                };
                if (($permissions[$feature]['visible'] ?? true) === false) {
                    return null;
                }
                $allowed = $permissions[$feature]['allowed'];
                $submission = $submissions->get($r->id);

                return ['id' => $r->id, 'kind' => $r->kind, 'title' => $r->kind === 'result' && ! $allowed ? 'Résultat publié (accès soumis à une règle administrative)' : $r->title, 'body' => $allowed && $section !== 'overview' ? $r->body : null, 'course' => $r->offering->course->title, 'allowed' => $allowed, 'reason' => $permissions[$feature]['reason'], 'download_url' => $r->path && $allowed ? '/dashboard/student/resources/'.$r->id.'/download?academic='.$entry->id : null, 'opens_at' => $r->opens_at, 'closes_at' => $r->closes_at, 'submission' => $submission ? ['body' => $submission->body, 'version' => $submission->version, 'submitted_at' => $submission->updated_at, 'filename' => $submission->filename, 'download_url' => $submission->path ? '/dashboard/student/submissions/'.$submission->id.'/download?academic='.$entry->id : null] : null];
            })->filter()->values();
        }
        $weekInput = $section === 'schedule' ? $request->validate(['week' => 'nullable|date_format:Y-m-d']) : [];
        $scheduleWeek = \Carbon\CarbonImmutable::parse($weekInput['week'] ?? now('Africa/Kinshasa')->toDateString(), 'Africa/Kinshasa')->startOfWeek();
        $sessionsQuery = \App\Models\Student\AcademicSession::with(['offering.course', 'offering.professor'])
            ->whereIn('academic_offering_id', $offerings->pluck('id'))->where('is_published', true);
        if ($section === 'schedule') {
            $sessionsQuery->where('starts_at', '<', $scheduleWeek->addWeek()->utc())->where('ends_at', '>', $scheduleWeek->utc());
        } else {
            $sessionsQuery->where('ends_at', '>=', now('Africa/Kinshasa')->startOfWeek()->utc())->limit(50);
        }
        $sessions = $sessionsQuery->orderBy('starts_at')->get()->map(fn ($s) => [
            'id' => $s->id, 'course' => $s->offering->course->title, 'starts_at' => $s->starts_at, 'ends_at' => $s->ends_at, 'room' => $s->room,
            'teacher' => $s->offering->professor?->full_name ?? $s->offering->course->teacher, 'level_id' => $s->offering->level_id,
        ]);
        $detail = $entry->level->detail;
        $payments = $entry->payments()->latest()->get()->map(fn ($p) => ['id' => $p->id, 'uuid' => $p->uuid, 'reference' => $p->reference, 'amount_cents' => $p->amount_cents, 'status' => $p->status, 'method' => $p->method, 'created_at' => $p->created_at, 'confirmed_at' => $p->confirmed_at, 'receipt_url' => $p->confirmed_at ? '/dashboard/student/payments/'.$p->uuid.'/receipt?academic='.$entry->id : null]);

        $balance = $this->finance->balance($entry);
        $photoUrl = $entry->profile->photo_path ? '/dashboard/student/profile/photo?academic='.$entry->id.'&v='.$entry->profile->updated_at->timestamp : null;
        if (! $photoUrl) {
            $photo = $entry->application->documents()->where('key', 'like', '%photo%')->where('review_status', 'accepted')->where('mime', 'like', 'image/%')->first();
            $photoUrl = $photo ? route('dashboard.enrollments.documents.preview', $photo->uuid) : null;
        }

        return Inertia::render('dashboard/student/Portal', [
            'overview' => $section === 'overview' ? app(\App\Modules\Student\Application\Services\StudentOverviewService::class)->summary($entry, $permissions, $balance) : null,
            'profile_form' => $section === 'profile' ? ['values' => array_merge(array_fill_keys(config('student_profile.detail_fields'), null), $entry->profile->personal_details ?? [], $entry->profile->user->only(['first_name', 'last_name', 'post_name', 'gender', 'email'])), 'provinces' => config('student_profile.provinces')] : null,
            'welcome_pending' => $entry->profile->welcome_seen_at === null,
            'section' => $section, 'academic' => ['id' => $entry->id, 'application_uuid' => $entry->application->uuid, 'reference' => $entry->application->reference, 'matricule' => $entry->matricule ?? $entry->profile->matricule, 'application_status' => $entry->application->status->value, 'student_status' => $entry->profile->student_status, 'enrollment_status' => $entry->enrollment_status, 'level' => $entry->level->title, 'faculty' => $entry->level->faculty->name, 'year' => $entry->academicYear->title, 'group' => $entry->group?->intake?->name, 'fee_category' => $entry->fee_category, 'name' => implode(' ', array_filter([$entry->profile->user->first_name, $entry->profile->user->post_name, $entry->profile->user->last_name])), 'email' => $entry->profile->user->email, 'phone' => $entry->profile->personal_details['phone'] ?? null, 'photo_url' => $photoUrl],
            'contexts' => $entry->profile->enrollments()->with(['level.faculty', 'academicYear'])->get()->map(fn ($e) => ['id' => $e->id, 'label' => $e->level->title.' · '.$e->level->faculty->name.' · '.$e->academicYear->title]),
            'permissions' => $permissions, 'balance' => $balance, 'obligations' => $entry->obligations()->get(['id', 'title', 'amount_cents', 'due_at', 'installment']),
            'tariffs' => ['national' => [$detail?->price_national_first, $detail?->price_national_second], 'foreign' => [$detail?->price_foreign_first, $detail?->price_foreign_second]],
            'work_archive' => $section === 'documents' ? $submissions->values()->map(fn ($work) => ['id' => $work->id, 'title' => $work->resource->title, 'body' => $work->body, 'version' => $work->version, 'submitted_at' => $work->updated_at, 'filename' => $work->filename, 'download_url' => $work->path ? '/dashboard/student/submissions/'.$work->id.'/download?academic='.$entry->id : null]) : [],
            'payments' => $payments, 'adjustments' => $this->finance->activeAdjustments($entry)->map(fn ($a) => $a->only(['id', 'type', 'amount_cents', 'feature', 'starts_at', 'expires_at', 'schedule'])),
            'schedule_week' => $scheduleWeek->toDateString(),
            'courses' => $courses, 'sessions' => $sessions, 'upcoming_sessions' => $sessions->filter(fn ($session) => $session['ends_at']->gte(now()))->values(), 'resources' => $resources,
            'requests' => ServiceRequest::where('academic_enrollment_id', $entry->id)->latest()->get(['id', 'category', 'subject', 'body', 'status', 'response', 'created_at']),
            'success' => session('success'),
        ]);
    }

    public function download(Request $request, int $resource)
    {
        $entry = $this->context($request);
        $resource = $this->resource($entry, $resource);
        $feature = match ($resource->kind) {
            'material' => 'materials_download','evaluation' => 'evaluations_participate','result' => 'results_view','document' => 'documents_request',default => 'courses_view'
        };
        $this->requireFeature($entry, $feature);
        abort_unless($resource->path && Storage::disk($resource->disk)->exists($resource->path), 404);

        return Storage::disk($resource->disk)->download($resource->path, $resource->filename, ['Cache-Control' => 'private, no-store', 'X-Content-Type-Options' => 'nosniff']);
    }

    public function submit(Request $request, int $resource)
    {
        $entry = $this->context($request);
        $resource = $this->resource($entry, $resource);
        abort_unless(in_array($resource->kind, ['assignment', 'evaluation']), 404);
        $feature = $resource->kind === 'evaluation' ? 'evaluations_participate' : 'assignments_submit';
        $this->requireFeature($entry, $feature);
        abort_if(($resource->opens_at && now()->lt($resource->opens_at)) || ($resource->closes_at && now()->gt($resource->closes_at)), 403, 'La période de dépôt n’est pas ouverte.');
        $data = $request->validate(['body' => 'required_without:file|nullable|string|max:20000', 'file' => 'nullable|file|mimes:pdf,jpg,jpeg,png,webp|max:'.\App\Support\DocumentUploadLimit::kilobytes()]);
        $path = null;
        try {
            DB::transaction(function () use ($request, $entry, $resource, $data, &$path) {
                $locked = AcademicEnrollment::lockForUpdate()->findOrFail($entry->id);
                $this->requireFeature($locked, $resource->kind === 'evaluation' ? 'evaluations_participate' : 'assignments_submit');
                $submission = AcademicSubmission::firstOrNew(['academic_enrollment_id' => $entry->id, 'academic_resource_id' => $resource->id]);
                $previous = $submission->only(['body', 'path', 'filename', 'version']);
                if ($submission->exists) {
                    $submission->version++;
                }
                if ($request->hasFile('file')) {
                    $path = $request->file('file')->store('student-work/'.$entry->id, 'local');
                    abort_unless($path, 500);
                }

                $submission->body = $data['body'] ?? null;
                if ($path) {
                    $submission->path = $path;
                    $submission->filename = $request->file('file')->getClientOriginalName();
                }
                $submission->save();
                Audit::record($request->user()->id, 'academic_work_submitted', $submission, null, ['previous' => $previous]);
            });
        } catch (\Throwable $e) {
            if ($path) {
                Storage::disk('local')->delete($path);
            } throw $e;
        }

        return back()->with('success', 'Votre travail a été transmis.');
    }

    public function downloadSubmission(Request $request, int $submission)
    {
        $entry = $this->context($request);
        $work = AcademicSubmission::where('academic_enrollment_id', $entry->id)->findOrFail($submission);
        abort_unless($work->path && Storage::disk('local')->exists($work->path), 404);

        return Storage::disk('local')->download($work->path, $work->filename, ['Cache-Control' => 'private, no-store', 'X-Content-Type-Options' => 'nosniff']);
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
