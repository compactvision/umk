<?php

namespace App\Modules\Enrollment\Infrastructure\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use App\Models\Enrollment;
use App\Models\EnrollmentDocument;
use App\Models\Faculty;
use App\Modules\Enrollment\Application\UseCases\RejectEnrollmentUseCase;
use App\Modules\Enrollment\Application\UseCases\ValidateEnrollmentUseCase;
use App\Modules\Enrollment\Domain\Enums\EnrollmentStatus;
use App\Modules\Enrollment\Domain\Exceptions\InvalidEnrollmentStateException;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class EnrollmentManagementController extends Controller
{
    public function __construct(private readonly ValidateEnrollmentUseCase $validateUseCase, private readonly RejectEnrollmentUseCase $rejectUseCase) {}

    public function index(Request $request)
    {
        $filters = $request->validate([
            'q' => 'nullable|string|max:150',
            'reexamination' => 'nullable|boolean',
            'status' => ['nullable', Rule::in(array_column(EnrollmentStatus::cases(), 'value'))],
            'faculty_id' => 'nullable|integer|exists:faculties,id',
            'year_id' => 'nullable|integer|exists:academic_years,id',
        ]);
        $query = Enrollment::with(['student:id,first_name,last_name,post_name,email', 'level.faculty', 'academicYear'])->withCount(['documents', 'documents as reexamination_count' => fn ($q) => $q->where('version', '>', 1)->where('review_status', 'pending')->whereHas('enrollment', fn ($entry) => $entry->where('status', 'pending'))]);
        if ($filters['reexamination'] ?? false) {
            $query->where('status', 'pending')->whereHas('documents', fn ($q) => $q->where('version', '>', 1)->where('review_status', 'pending'));
        }
        if ($filters['status'] ?? null) {
            $query->where('status', $filters['status']);
        }
        if ($filters['faculty_id'] ?? null) {
            $query->whereHas('level', fn ($q) => $q->where('faculty_id', $filters['faculty_id']));
        }
        if ($filters['year_id'] ?? null) {
            $query->where('academic_year_id', $filters['year_id']);
        }
        if ($term = trim($filters['q'] ?? '')) {
            $referenceId = preg_match('/^USK-(\d+)$/i', $term, $matches) ? (int) $matches[1] : -1;
            $query->where(fn ($q) => $q->where('uuid', 'like', "%{$term}%")->orWhere('matricule', 'like', "%{$term}%")->orWhere('id', $referenceId)
                ->orWhereHas('student', function ($student) use ($term) {
                    foreach (preg_split('/\s+/', $term, -1, PREG_SPLIT_NO_EMPTY) as $word) {
                        $student->where(fn ($part) => $part->where('first_name', 'like', "%{$word}%")->orWhere('last_name', 'like', "%{$word}%")->orWhere('post_name', 'like', "%{$word}%")->orWhere('email', 'like', "%{$word}%"));
                    }
                }));
        }
        $counts = Enrollment::selectRaw('status, COUNT(*) as total')->groupBy('status')->pluck('total', 'status');
        $enrollments = $query->orderByDesc('reexamination_count')->latest('created_at')->orderByDesc('id')->paginate(15)->withQueryString();
        $enrollments->through(fn ($entry) => Arr::only($entry->toArray(), ['id', 'uuid', 'reference', 'matricule', 'status', 'status_label', 'created_at', 'documents_count', 'reexamination_count', 'student', 'level', 'academic_year']));

        return Inertia::render('dashboard/adminEnrollments/Index', [
            'enrollments' => $enrollments, 'filters' => $filters,
            'faculties' => Faculty::orderBy('name')->get(['id', 'name']),
            'years' => AcademicYear::orderByDesc('start_date')->get(['id', 'title']),
            'reexamination_total' => Enrollment::where('status', 'pending')->whereHas('documents', fn ($q) => $q->where('version', '>', 1)->where('review_status', 'pending'))->count(),
            'stats' => ['pending' => (int) ($counts['submitted'] ?? 0) + (int) ($counts['pending'] ?? 0), 'validated' => (int) ($counts['validated'] ?? 0), 'rejected' => (int) ($counts['rejected'] ?? 0), 'total' => (int) $counts->sum()],
            'success' => session('success'),
        ]);
    }

    public function show(Request $request, int $id)
    {
        $entry = Enrollment::with(['student:id,first_name,last_name,post_name,email', 'level.faculty', 'academicYear', 'documents', 'events.actor:id,first_name,last_name'])->findOrFail($id);
        $data = Arr::only($entry->toArray(), ['id', 'uuid', 'reference', 'matricule', 'status', 'status_label', 'payment_status_label', 'created_at', 'enrolled_at', 'student', 'level', 'academic_year']);
        $selected = $request->query('document');
        if ($selected !== null) {
            abort_unless(is_string($selected) && $entry->documents->contains('uuid', $selected), 404);
        }
        $data['selected_document_uuid'] = $selected;
        if ($entry->academicEnrollment) {
            $state = app(\App\Modules\Student\Application\Services\StudentFinanceService::class)->balance($entry->academicEnrollment)['financial_clearance_status'];
            $data['payment_status_label'] = ['unassessed' => 'Tarif à confirmer', 'unpaid' => 'Non payé', 'partial' => 'Partiellement payé', 'cleared' => 'Solde réglé', 'exempted' => 'Exonération', 'overdue' => 'Échéance dépassée'][$state] ?? 'À confirmer';
        }
        $data['snapshot'] = Arr::only($entry->form_snapshot ?? [], ['name', 'email', 'program', 'isConfirmed']);
        $data['analysis_started_at'] = $entry->meta['analysis_started_at'] ?? null;
        $data['analysis_completed_at'] = $entry->meta['analysis_completed_at'] ?? null;
        $data['corrections_requested_at'] = $entry->meta['corrections_requested_at'] ?? null;
        $data['decision_reason'] = $entry->meta['rejection_reason'] ?? null;
        $data['documents'] = $entry->documents->sortByDesc(fn ($doc) => $doc->version > 1 && $doc->review_status === 'pending')->values()->map(fn ($doc) => [
            'uuid' => $doc->uuid, 'key' => $doc->key, 'filename' => $doc->filename, 'mime' => $doc->mime,
            'needs_reexamination' => $entry->status === EnrollmentStatus::PENDING && $doc->version > 1 && $doc->review_status === 'pending',
            'review_status' => $doc->review_status, 'review_comment' => $doc->comment, 'reviewed_at' => $doc->verified_at, 'version' => $doc->version,
            'size_human' => $doc->size_human, 'created_at' => $doc->created_at, 'verified' => $doc->verified,
            'preview_url' => route('dashboard.admin.enrollments.documents.preview', $doc->uuid),
            'download_url' => route('dashboard.admin.enrollments.documents.download', $doc->uuid),
        ]);
        $data['events'] = $entry->events->sortByDesc('occurred_at')->values()->map(fn ($event) => [
            'id' => $event->id, 'event' => $event->event, 'reason' => $event->payload['reason'] ?? null,
            'document_name' => $event->payload['document_name'] ?? null, 'verdict' => $event->payload['verdict'] ?? null, 'notification' => $event->payload['notification'] ?? null,
            'occurred_at' => $event->occurred_at, 'actor' => $event->actor ? trim($event->actor->first_name.' '.$event->actor->last_name) : null,
        ]);

        return Inertia::render('dashboard/adminEnrollments/Show', ['enrollment' => $data, 'success' => session('success')]);
    }

    public function startAnalysis(Request $request, int $id, \App\Modules\Enrollment\Application\UseCases\ReviewEnrollment $review)
    {
        try {
            $started = $review->start($id, $request->user()->id);

            return back()->with('success', $started ? 'Analyse commencée. Une notification est envoyée à l’étudiant ; son résultat figure dans l’historique.' : 'L’analyse de ce dossier a déjà commencé.');
        } catch (InvalidEnrollmentStateException $exception) {
            return back()->withErrors(['review' => $exception->getMessage()]);
        }
    }

    public function reviewDocument(Request $request, int $id, string $uuid, \App\Modules\Enrollment\Application\UseCases\ReviewEnrollment $review)
    {
        $data = $request->validate(['verdict' => 'required|in:pending,accepted,rejected,correction_requested', 'reason' => 'nullable|string|max:1000']);
        try {
            $review->document($id, $uuid, $request->user()->id, $data['verdict'], $data['reason'] ?? null);

            return back()->with('success', 'L’examen de cette pièce a été enregistré.');
        } catch (InvalidEnrollmentStateException $exception) {
            return back()->withErrors(['review' => $exception->getMessage()]);
        }
    }

    public function requestCorrections(Request $request, int $id, \App\Modules\Enrollment\Application\UseCases\ReviewEnrollment $review)
    {
        try {
            $sent = $review->requestCorrections($id, $request->user()->id);

            return back()->with('success', $sent ? 'La demande de corrections est enregistrée et sa notification est envoyée à l’étudiant.' : 'Cette demande de corrections a déjà été communiquée.');
        } catch (InvalidEnrollmentStateException $exception) {
            return back()->withErrors(['review' => $exception->getMessage()]);
        }
    }

    public function validate(Request $request, int $id)
    {
        try {
            $this->validateUseCase->execute($id, $request->user()->id);

            return back()->with('success', 'Le dossier a été validé. La décision est visible dans l’espace étudiant.');
        } catch (InvalidEnrollmentStateException $e) {
            return back()->withErrors(['decision' => $e->getMessage()]);
        }
    }

    public function reject(Request $request, int $id)
    {
        $validated = $request->validate(['reason' => 'required|string|min:3|max:1000']);
        try {
            $this->rejectUseCase->execute($id, $request->user()->id, $validated['reason']);

            return back()->with('success', 'Le dossier a été rejeté. Le motif est visible dans l’espace étudiant.');
        } catch (InvalidEnrollmentStateException $e) {
            return back()->withErrors(['decision' => $e->getMessage()]);
        }
    }

    public function preview(string $uuid)
    {
        return $this->documentResponse($uuid, true);
    }

    public function download(string $uuid)
    {
        return $this->documentResponse($uuid, false);
    }

    private function documentResponse(string $uuid, bool $inline)
    {
        $document = EnrollmentDocument::with('enrollment')->where('uuid', $uuid)->firstOrFail();
        abort_unless($document->enrollment, 404);
        $disk = Storage::disk($document->disk);
        abort_unless($disk->exists($document->path), 404, 'Ce fichier est indisponible.');
        $mime = $disk->mimeType($document->path);
        $previewable = in_array($mime, ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/gif'], true);
        $headers = ['Cache-Control' => 'private, no-store', 'X-Content-Type-Options' => 'nosniff'];
        if ($inline && $previewable) {
            return $disk->response($document->path, $document->filename, $headers + ['Content-Type' => $mime, 'Content-Security-Policy' => "frame-ancestors 'self'"], 'inline');
        }

        return $disk->download($document->path, $document->filename, $headers);
    }
}
