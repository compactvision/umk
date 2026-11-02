<?php

namespace App\Modules\Student\Infrastructure\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Student\AcademicAudit;
use App\Models\Student\AcademicEnrollment;
use App\Models\Student\AcademicOffering;
use App\Models\Student\AcademicResource;
use App\Models\Student\AcademicSession;
use App\Models\Student\AccessRule;
use App\Models\Student\CourseException;
use App\Models\Student\FinancialAdjustment;
use App\Models\Student\ServiceRequest;
use App\Models\Student\StudentPayment;
use App\Modules\Student\Application\Services\AcademicRuleService;
use App\Modules\Student\Application\Services\Audit;
use App\Modules\Student\Application\Services\StudentFinanceService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class AcademicAdministrationController extends Controller
{
    public function __construct(private StudentFinanceService $finance) {}

    private function authorizeStaff(Request $r, string $permission): void
    {
        abort_unless($r->user()->can($permission), 403);
    }

    public function index(Request $r)
    {
        abort_unless($r->user()->canAny(['manage academic access', 'manage academic finance', 'publish academic content']), 403);
        $filters = $r->validate(['academic' => 'nullable|integer', 'q' => 'nullable|string|max:150', 'tab' => 'nullable|in:students,finance,rules,teaching,requests']);
        $students = AcademicEnrollment::with(['profile.user', 'level.faculty', 'academicYear'])->when($filters['q'] ?? null, fn ($q, $term) => $q->where(fn ($s) => $s->where('matricule', 'like', "%{$term}%")->orWhereHas('profile.user', fn ($u) => $u->where('first_name', 'like', "%{$term}%")->orWhere('last_name', 'like', "%{$term}%")->orWhere('email', 'like', "%{$term}%"))))->latest()->paginate(15)->withQueryString();
        $students->through(fn ($e) => ['id' => $e->id, 'name' => trim($e->profile->user->first_name.' '.$e->profile->user->last_name), 'matricule' => $e->matricule, 'faculty' => $e->level->faculty->name, 'level' => $e->level->title, 'year' => $e->academicYear->title, 'status' => $e->enrollment_status, 'student_status' => $e->profile->student_status]);
        $entry = isset($filters['academic']) ? AcademicEnrollment::with(['profile.user', 'level.detail', 'level.faculty', 'academicYear'])->findOrFail($filters['academic']) : null;
        $finance = $r->user()->can('manage academic finance');
        $publish = $r->user()->can('publish academic content');
        $access = $r->user()->can('manage academic access');

        $auditQuery = AcademicAudit::with('actor:id,first_name,last_name');
        if (! $access) {
            $auditQuery->whereIn('action', ['fees_assessed', 'additional_fee_created', 'payment_recorded', 'payment_confirmed', 'payment_cancelled', 'payment_refunded', 'financial_adjustment_approved', 'financial_adjustment_revoked']);
        }

        return Inertia::render('dashboard/studentAcademic/Index', [
            'students' => $students, 'filters' => $filters, 'selected' => $entry ? ['id' => $entry->id, 'profile_id' => $entry->student_profile_id, 'name' => trim($entry->profile->user->first_name.' '.$entry->profile->user->last_name), 'matricule' => $entry->matricule, 'level_id' => $entry->level_id, 'year_id' => $entry->academic_year_id, 'class_id' => $entry->class_id, 'status' => $entry->enrollment_status, 'student_status' => $entry->profile->student_status, 'category' => $entry->fee_category] : null,
            'balance' => $entry && $finance ? $this->finance->balance($entry) : null, 'obligations' => $entry && $finance ? $entry->obligations()->get() : [],
            'fee_kinds' => \App\Models\Student\StudentObligation::distinct()->pluck('kind')->push('tuition')->unique()->values(),
            'payments' => $entry && $finance ? $entry->payments()->latest()->get()->map(fn ($p) => $p->only(['id', 'reference', 'amount_cents', 'currency', 'status', 'method', 'confirmed_at'])) : [],
            'adjustments' => $entry && $finance ? $entry->adjustments()->latest()->get() : [],
            'rules' => $access ? AccessRule::where('is_active', true)->latest()->get() : [],
            'levels' => \App\Models\Level::with('faculty:id,name')->get(['id', 'faculty_id', 'title']),
            'years' => \App\Models\AcademicYear::orderByDesc('start_date')->get(['id', 'title']),
            'groups' => $entry ? \App\Models\Classes::with('intake')->where('level_id', $entry->level_id)->where('faculty_id', $entry->level->faculty_id)->get() : [],
            'courses' => $publish ? \App\Models\Courses::orderBy('title')->get(['id', 'level_id', 'title']) : [],
            'professors' => $publish ? \App\Models\Professor::where('is_active', true)->get(['id', 'first_name', 'last_name']) : [],
            'offerings' => ($publish || $access) ? AcademicOffering::with(['course', 'professor'])->latest()->limit(100)->get() : [],
            'resources' => $publish ? AcademicResource::latest()->limit(100)->get(['id', 'academic_offering_id', 'kind', 'title', 'is_published', 'student_profile_id']) : [],
            'sessions' => $publish ? AcademicSession::with('offering.course')->orderByDesc('starts_at')->limit(50)->get() : [],
            'requests' => $access ? ServiceRequest::with('enrollment.profile.user')->when($entry, fn ($q) => $q->where('academic_enrollment_id', $entry->id))->latest()->limit(50)->get()->map(fn ($ticket) => array_merge($ticket->only(['id', 'academic_enrollment_id', 'category', 'subject', 'body', 'status', 'response', 'created_at']), ['student_name' => \App\Mail\TransactionalEmail::recipientName($ticket->enrollment->profile->user)])) : [],
            'submissions' => $entry && $publish ? \App\Models\Student\AcademicSubmission::with('resource')->where('academic_enrollment_id', $entry->id)->latest()->get()->map(fn ($work) => ['id' => $work->id, 'title' => $work->resource->title, 'body' => $work->body, 'filename' => $work->filename, 'version' => $work->version, 'submitted_at' => $work->updated_at, 'download_url' => $work->path ? '/dashboard/admin/student-academic/submissions/'.$work->id.'/download' : null]) : [],
            'audit' => $access || $finance ? $auditQuery->latest()->limit(30)->get(['id', 'actor_id', 'action', 'entity_type', 'entity_id', 'reason', 'created_at'])->map(fn ($event) => array_merge($event->only(['id', 'actor_id', 'action', 'entity_type', 'entity_id', 'reason', 'created_at']), ['actor_name' => $event->actor ? \App\Mail\TransactionalEmail::recipientName($event->actor) : 'Système'])) : [],
            'abilities' => ['finance' => $finance, 'access' => $access, 'publish' => $publish], 'success' => session('success'),
        ]);
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
        $data = $r->validate(['kind' => 'required|string|max:50|regex:/^[a-z][a-z0-9_]*$/', 'amount' => 'required|numeric|gt:0', 'method' => 'required|in:cash,bank_transfer,other', 'reference' => 'required|string|max:180|unique:student_payments,reference', 'note' => 'required|string|min:5|max:1000']);
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
        $data = $r->validate(['fee_kind' => 'required|string|max:50|regex:/^[a-z][a-z0-9_]*$/', 'type' => 'required|in:exemption,scholarship,plan,override', 'feature' => ['nullable', Rule::in(['materials_download', 'assignments_submit', 'evaluations_participate', 'documents_request', 'results_view'])], 'amount' => 'nullable|numeric|gt:0', 'starts_at' => 'nullable|date', 'expires_at' => ['nullable', 'date', Rule::when($r->filled('starts_at'), 'after_or_equal:starts_at')], 'reason' => 'required|string|min:10|max:2000', 'schedule' => 'nullable|array|max:24', 'schedule.*.due_at' => 'required|date', 'schedule.*.amount' => 'required|numeric|gt:0']);
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
        DB::transaction(function () use ($r, $adjustment, $data) {
            $a = FinancialAdjustment::lockForUpdate()->findOrFail($adjustment);
            $a->update(['is_active' => false]);
            Audit::record($r->user()->id, 'financial_adjustment_revoked', $a, $data['reason']);
        });

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

    public function status(Request $r, int $academic)
    {
        $this->authorizeStaff($r, 'manage academic access');
        $data = $r->validate(['student_status' => 'required|in:active,suspended,graduated,archived', 'enrollment_status' => 'required|in:pending_confirmation,confirmed,suspended,completed,cancelled', 'class_id' => 'nullable|integer|exists:classes,id', 'reason' => 'required|string|min:10|max:1000']);
        DB::transaction(function () use ($r, $academic, $data) {
            $entry = AcademicEnrollment::lockForUpdate()->findOrFail($academic);
            if ($data['class_id'] ?? null) {
                abort_unless(\App\Models\Classes::whereKey($data['class_id'])->where('level_id', $entry->level_id)->where('faculty_id', $entry->level->faculty_id)->exists(), 422, 'La promotion doit appartenir au niveau concerné.');
            }$entry->profile->update(['student_status' => $data['student_status']]);
            $updates = ['enrollment_status' => $data['enrollment_status']];
            if (array_key_exists('class_id', $data)) {
                $updates['class_id'] = $data['class_id'];
            }
            $entry->update($updates);
            Audit::record($r->user()->id, 'academic_status_changed', $entry, $data['reason'], $data);
        });

        return back()->with('success', 'Situation académique mise à jour.');
    }

    public function offering(Request $r)
    {
        $this->authorizeStaff($r, 'publish academic content');
        $data = $r->validate(['course_id' => 'required|integer|exists:courses,id', 'academic_year_id' => 'required|integer|exists:academic_years,id', 'class_id' => 'nullable|integer|exists:classes,id', 'professor_id' => 'nullable|integer|exists:professors,id', 'semester' => 'nullable|string|max:80', 'is_optional' => 'boolean', 'is_published' => 'boolean']);
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
        if ($data['student_profile_id'] ?? null) {
            abort_unless(AcademicEnrollment::where('student_profile_id', $data['student_profile_id'])->where('level_id', $offering->level_id)->where('academic_year_id', $offering->academic_year_id)->when($offering->class_id, fn ($q, $group) => $q->where('class_id', $group))->exists(), 422, 'Le destinataire doit appartenir à cet enseignement.');
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
        abort_unless($entry->level_id === $offering->level_id && $entry->academic_year_id === $offering->academic_year_id, 422);
        $entity = CourseException::updateOrCreate(['academic_enrollment_id' => $academic, 'academic_offering_id' => $offering->id], ['action' => $data['action'], 'reason' => $data['reason'], 'authorized_by' => $r->user()->id]);
        Audit::record($r->user()->id, 'course_exception_changed', $entity, $data['reason']);

        return back()->with('success', 'Affectation individuelle enregistrée.');
    }

    public function downloadSubmission(Request $r, int $submission)
    {
        $this->authorizeStaff($r, 'publish academic content');
        $work = \App\Models\Student\AcademicSubmission::findOrFail($submission);
        abort_unless($work->path && Storage::disk('local')->exists($work->path), 404);

        return Storage::disk('local')->download($work->path, $work->filename, ['Cache-Control' => 'private, no-store', 'X-Content-Type-Options' => 'nosniff']);
    }

    public function respond(Request $r, int $ticket)
    {
        $this->authorizeStaff($r, 'manage academic access');
        $data = $r->validate(['response' => 'required|string|min:5|max:6000', 'status' => 'required|in:open,resolved']);
        $entity = ServiceRequest::findOrFail($ticket);
        $entity->update($data + ['responded_by' => $r->user()->id]);
        Audit::record($r->user()->id, 'student_request_answered', $entity);

        return back()->with('success', 'Réponse publiée dans l’espace de l’étudiant.');
    }
}
