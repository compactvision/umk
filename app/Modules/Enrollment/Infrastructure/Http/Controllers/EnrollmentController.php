<?php

namespace App\Modules\Enrollment\Infrastructure\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\AcademicStructure\AcademicProgram;
use App\Models\AcademicYear;
use App\Models\Faculty;
use App\Models\Level;
use App\Modules\Enrollment\Application\UseCases\GetDraftUseCase;
use App\Modules\Enrollment\Domain\Enums\EnrollmentStatus;
use App\Modules\Student\Application\Services\StudentFinanceService;
use App\Support\DocumentUploadLimit;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class EnrollmentController extends Controller
{
    public function __construct(
        private readonly GetDraftUseCase $getDraftUseCase
    ) {}

    public function index(Request $request)
    {
        $filters = $request->validate([
            'q' => 'nullable|string|max:150',
            'status' => ['nullable', Rule::in(array_column(EnrollmentStatus::cases(), 'value'))],
        ]);
        $base = $request->user()->enrollments();
        $counts = (clone $base)->selectRaw('status, COUNT(*) as total')->groupBy('status')->pluck('total', 'status');
        $query = (clone $base)->with(['level.faculty', 'academicYear', 'academicEnrollment:academic_enrollments.id,academic_enrollments.application_id'])->withCount([
            'documents',
            'documents as accepted_documents_count' => fn ($q) => $q->where('review_status', 'accepted'),
            'documents as correction_documents_count' => fn ($q) => $q->whereIn('review_status', ['rejected', 'correction_requested']),
        ]);
        if ($filters['status'] ?? null) {
            $query->where('status', $filters['status']);
        }
        if ($term = trim($filters['q'] ?? '')) {
            $referenceId = preg_match('/^USK-(\d+)$/i', $term, $matches) ? (int) $matches[1] : -1;
            $query->where(fn ($q) => $q->where('id', $referenceId)->orWhere('matricule', 'like', "%{$term}%")
                ->orWhereHas('level', fn ($level) => $level->where('title', 'like', "%{$term}%")->orWhereHas('faculty', fn ($faculty) => $faculty->where('name', 'like', "%{$term}%")))
                ->orWhereHas('academicYear', fn ($year) => $year->where('title', 'like', "%{$term}%")));
        }
        $enrollments = $query->latest()->orderByDesc('id')->paginate(9)->withQueryString();
        $enrollments->through(function ($entry) {
            $data = Arr::only($entry->toArray(), ['id', 'uuid', 'reference', 'matricule', 'status', 'payment_status', 'created_at', 'enrolled_at', 'level', 'academic_year', 'documents_count', 'accepted_documents_count', 'correction_documents_count']);
            $data['academic_portal_url'] = $entry->academicEnrollment ? '/dashboard/student?application='.$entry->uuid : null;
            $data['analysis_started_at'] = $entry->meta['analysis_started_at'] ?? null;
            $data['analysis_completed_at'] = $entry->meta['analysis_completed_at'] ?? null;
            $data['corrections_requested_at'] = $entry->meta['corrections_requested_at'] ?? null;

            return $data;
        });

        return Inertia::render('dashboard/enrollments/Index', [
            'enrollments' => $enrollments, 'filters' => $filters,
            'stats' => ['total' => (int) $counts->sum(), 'draft' => (int) ($counts['draft'] ?? 0), 'in_progress' => (int) ($counts['submitted'] ?? 0) + (int) ($counts['pending'] ?? 0), 'validated' => (int) ($counts['validated'] ?? 0)],
            'success' => session('success'),
        ]);
    }

    public function create(Request $request)
    {
        $faculties = Faculty::with(['levels' => fn ($q) => $q->admissible()])->get();
        $years = AcademicYear::where('status', 'open')->get();

        // Charger les niveaux groupés par faculté
        $levelsByFaculty = Level::with(['faculty', 'programs' => fn ($q) => $q->openForAdmission()->select('academic_programs.id', 'academic_programs.name', 'academic_programs.code')])
            ->admissible()
            ->get()
            ->groupBy('faculty_id')
            ->map(fn ($levels) => $levels->values());

        // Récupérer le brouillon existant si disponible
        // $draft = $this->getDraftUseCase->execute($request->user()->id);

        return Inertia::render('dashboard/enrollments/Enrollment', [
            'faculties' => $faculties,
            'years' => $years,
            'levelsByFaculty' => $levelsByFaculty,
            'draft' => null, // Toujours commencer avec un formulaire vide
        ]);
    }

    public function edit(Request $request, string $uuid)
    {
        $enrollment = $request->user()
            ->enrollments()
            ->where('uuid', $uuid)
            ->where('status', 'draft')
            ->where(fn ($query) => $query->whereNull('draft_expires_at')->orWhere('draft_expires_at', '>', now()))
            ->firstOrFail();

        $faculties = Faculty::with(['levels' => fn ($q) => $q->admissible()])->get();
        $years = AcademicYear::where('status', 'open')->get();

        $levelsByFaculty = Level::with(['faculty', 'programs' => fn ($q) => $q->openForAdmission()->select('academic_programs.id', 'academic_programs.name', 'academic_programs.code')])
            ->where(fn ($q) => $q->admissible()->orWhere('id', $enrollment->level_id))
            ->get()
            ->groupBy('faculty_id')
            ->map(fn ($levels) => $levels->values());

        return Inertia::render('dashboard/enrollments/Enrollment', [
            'faculties' => $faculties,
            'years' => $years,
            'levelsByFaculty' => $levelsByFaculty,
            'draft' => [
                'uuid' => $enrollment->uuid,
                'last_step' => $enrollment->last_step,
                'form_snapshot' => $enrollment->form_snapshot,
            ],
        ]);
    }

    public function withdraw(Request $request, string $uuid)
    {
        DB::transaction(function () use ($request, $uuid) {
            $entry = $request->user()->enrollments()->where('uuid', $uuid)->lockForUpdate()->firstOrFail();
            $status = $entry->status->value;
            if ($status === 'cancelled') {
                return;
            }
            if (! in_array($status, ['draft', 'submitted', 'pending'], true)) {
                throw ValidationException::withMessages(['withdrawal' => 'Ce dossier a déjà fait l’objet d’une décision.']);
            }
            $entry->update(['status' => 'cancelled']);
            $entry->events()->create(['event' => 'cancelled', 'actor_id' => $request->user()->id,
                'payload' => ['from' => $status, 'reason' => 'Retrait demandé par le candidat.'], 'occurred_at' => now()]);
        });

        return back()->with('success', 'Votre candidature a été retirée. Son historique reste accessible.');
    }

    public function show(Request $request, string $uuid)
    {
        $enrollment = $request->user()
            ->enrollments()
            ->with(['level.faculty', 'academicYear', 'documents', 'student', 'events'])
            ->where('uuid', $uuid)
            ->firstOrFail();

        $data = Arr::only($enrollment->toArray(), [
            'id', 'uuid', 'reference', 'matricule', 'status', 'payment_status', 'created_at', 'updated_at', 'enrolled_at', 'notes', 'level', 'academic_year',
        ]);
        $selected = $request->query('document');
        if ($selected !== null) {
            abort_unless(is_string($selected) && $enrollment->documents->contains('uuid', $selected), 404);
        }
        $data['selected_document_uuid'] = $selected;
        $data['academic_portal_url'] = $enrollment->academicEnrollment ? '/dashboard/student?application='.$enrollment->uuid : null;
        if ($enrollment->academicEnrollment) {
            $financial = app(StudentFinanceService::class)->balance($enrollment->academicEnrollment);
            $data['payment_status'] = match ($financial['financial_clearance_status']) {
                'cleared' => 'paid',default => $financial['financial_clearance_status']
            };
            $data['financial_portal_url'] = '/dashboard/student/fees?application='.$enrollment->uuid;
        }
        $data['submitted_at'] = $enrollment->meta['submitted_at'] ?? null;
        $data['requested_program'] = AcademicProgram::whereKey($enrollment->form_snapshot['academic_program_id'] ?? null)->value('name') ?? ($enrollment->form_snapshot['program'] ?? null);
        $data['declared_name'] = $enrollment->form_snapshot['name'] ?? null;
        $data['declared_email'] = $enrollment->form_snapshot['email'] ?? null;
        $data['student'] = $enrollment->student->only(['first_name', 'last_name', 'post_name', 'email']);
        $data['document_upload_max_kb'] = DocumentUploadLimit::kilobytes();
        $data['analysis_started_at'] = $enrollment->meta['analysis_started_at'] ?? null;
        $data['analysis_completed_at'] = $enrollment->meta['analysis_completed_at'] ?? null;
        $data['corrections_requested_at'] = $enrollment->meta['corrections_requested_at'] ?? null;
        $data['rejection_reason'] = $enrollment->meta['rejection_reason'] ?? null;
        $data['documents'] = $enrollment->documents->map(fn ($doc) => [
            'id' => $doc->id, 'type' => $doc->type, 'name' => $doc->filename,
            'verified' => $doc->verified, 'size_human' => $doc->size_human,
            'uuid' => $doc->uuid, 'review_status' => $doc->review_status, 'review_comment' => $doc->comment, 'version' => $doc->version,
            'can_replace' => $enrollment->status->value === 'pending' && in_array($doc->review_status, ['rejected', 'correction_requested'], true),
            'preview_url' => route('dashboard.enrollments.documents.preview', $doc->uuid),
            'label' => Str::headline($doc->key ?: $doc->type),
            'url' => route('dashboard.enrollments.documents.download', $doc->uuid),
            'uploaded_at' => $doc->created_at, 'verified_at' => $doc->verified_at,
        ]);
        $data['status_history'] = $enrollment->events->whereIn('event', ['submitted', 'analysis_started', 'analysis_completed', 'corrections_requested', 'document_reviewed', 'document_replaced', 'validated', 'rejected', 'cancelled'])->sortByDesc('occurred_at')->values()->map(fn ($event) => [
            'id' => $event->id, 'status' => $event->event, 'created_at' => $event->occurred_at,
            'notes' => $event->payload['reason'] ?? null,
            'document_name' => $event->payload['document_name'] ?? null, 'verdict' => $event->payload['verdict'] ?? null,
            'user' => ['name' => $event->actor_id === $enrollment->student_id ? 'Vous' : 'Administration USK'],
        ]);

        return Inertia::render('dashboard/enrollments/Show', ['enrollment' => $data, 'success' => session('success')]);
    }
}
