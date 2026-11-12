<?php

namespace App\Modules\Documents\Infrastructure\Http;

use App\Models\AcademicStructure\University;
use App\Models\Student\AcademicAudit;
use App\Models\Student\AcademicEnrollment;
use App\Models\Student\AcademicResultDocument;
use App\Models\Student\OfficialDocument;
use App\Models\Student\OfficialDocumentTemplate;
use App\Models\Student\OfficialDocumentType;
use App\Models\Student\ServiceRequest;
use App\Modules\Documents\Application\DocumentAccess;
use App\Modules\Documents\Application\DocumentArchives;
use App\Modules\Documents\Application\DocumentCatalog;
use App\Modules\Documents\Application\DocumentFacts;
use App\Modules\Documents\Application\DocumentPdf;
use App\Modules\Documents\Application\DocumentQueries;
use App\Modules\Documents\Application\DocumentWorkflow;
use App\Modules\Documents\Infrastructure\Jobs\IssueOfficialDocument;
use App\Modules\Student\Application\Services\AcademicStaffScope;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

final class OfficialDocumentController
{
    public function __construct(private DocumentAccess $access, private DocumentCatalog $catalog, private DocumentWorkflow $workflow, private DocumentQueries $queries) {}

    public function index(Request $request)
    {
        $actor = $request->user();
        $this->access->staff($actor);
        $filters = $request->validate(['academic' => 'nullable|integer|min:1', 'type' => 'nullable|integer|min:1',
            'status' => 'nullable|in:open,reviewed,correction,approved,refused,issued', 'q' => 'nullable|string|max:100', 'kind' => 'nullable|in:card,enrollment,schooling,success,diploma',
            'archive' => 'nullable|in:print,delivery,issued,revoked,replaced']);
        $faculties = $actor->academicFaculties()->pluck('faculties.id');
        $types = OfficialDocumentType::query()->when($faculties->isNotEmpty(), fn ($q) => $q->whereIn('faculty_id', $faculties))
            ->when(! isset($filters['type']) && isset($filters['kind']), fn ($q) => $q->where('kind', $filters['kind']));
        $type = isset($filters['type']) ? OfficialDocumentType::query()
            ->when($faculties->isNotEmpty(), fn ($q) => $q->whereIn('faculty_id', $faculties))->findOrFail($filters['type']) : null;
        if ($type) {
            $filters['kind'] = $type->kind;
            $types->where('kind', $type->kind);
        }
        $entries = AcademicStaffScope::apply(AcademicEnrollment::query(), $actor);
        $entry = isset($filters['academic']) ? (clone $entries)->with(['profile.user', 'academicYear', 'level.faculty'])->findOrFail($filters['academic']) : null;
        $scopedTypes = (clone $types)->when($type, fn ($q) => $q->whereKey($type->id))->select('id');
        $base = ServiceRequest::whereIn('official_document_type_id', clone $scopedTypes)
            ->when($entry, fn ($q) => $q->where('academic_enrollment_id', $entry->id))
            ->when($filters['q'] ?? null, fn ($q, $term) => $q->whereHas('enrollment', fn ($e) => $e->where('matricule', 'like', '%'.$term.'%')));
        $documents = OfficialDocument::with('type')->whereIn('official_document_type_id', clone $scopedTypes)
            ->when($entry, fn ($q) => $q->where('academic_enrollment_id', $entry->id));
        $undelivered = (clone $documents)->where('status', 'issued')->whereNull('delivered_at')
            ->where(fn ($q) => $q->whereNull('expires_at')->orWhere('expires_at', '>=', now()));
        $printQueue = (clone $undelivered)->whereNull('printed_at')->whereHas('type', fn ($q) => $q->where('kind', 'card'));
        $deliveryQueue = (clone $undelivered)->where(fn ($q) => $q->whereNotNull('printed_at')
            ->orWhereHas('type', fn ($type) => $type->where('kind', '!=', 'card')));
        $archiveQuery = match ($filters['archive'] ?? null) {
            'print' => $printQueue,
            'delivery' => $deliveryQueue,
            'issued', 'revoked', 'replaced' => (clone $documents)->where('status', $filters['archive']),
            default => $documents,
        };
        $results = AcademicResultDocument::with('run')->when($faculties->isNotEmpty(), fn ($q) => $q->whereHas('run.rule.version', fn ($v) => $v->where(function ($scope) use ($faculties) {
            foreach ($faculties as $faculty) {
                $scope->orWhereJsonContains('program_snapshot->faculty_id', (int) $faculty);
            }
        })))->when($entry, fn ($q) => $q->whereHas('result', fn ($r) => $r->where('academic_enrollment_id', $entry->id)));

        return Inertia::render('dashboard/officialDocuments/Administration', [
            'filters' => $filters, 'actor' => $actor->id, 'permissions' => [
                'manage' => $actor->can(DocumentAccess::MANAGE), 'approve' => $actor->can(DocumentAccess::APPROVE), 'issue' => $actor->can(DocumentAccess::ISSUE),
            ],
            'counts' => (clone $base)->selectRaw('status, count(*) as total')->groupBy('status')->pluck('total', 'status'),
            'archive_counts' => [
                'print' => (clone $printQueue)->count(),
                'delivery' => (clone $deliveryQueue)->count(),
                'issued' => (clone $documents)->where('status', 'issued')->count(),
                'revoked' => (clone $documents)->where('status', 'revoked')->count(),
                'replaced' => (clone $documents)->where('status', 'replaced')->count(),
            ],
            'universities' => University::where('is_active', true)->with(['faculties' => fn ($q) => $q->when($faculties->isNotEmpty(), fn ($q) => $q->whereKey($faculties))])
                ->orderBy('name')->get()->map(fn ($row) => $row->only(['id', 'name']) + ['faculties' => $row->faculties->map->only(['id', 'name'])]),
            'types' => $types->orderBy('name')->paginate(20, ['*'], 'types_page')->withQueryString(),
            'type' => $type,
            'templates' => $type?->templates()->with('signer:id,first_name,last_name,post_name')->orderByDesc('version')->paginate(12, ['*'], 'templates_page')->withQueryString()
                ->through(fn ($row) => $row->toArray() + ['assets' => array_keys($row->layout['assets'] ?? [])]),
            'entry' => $entry ? ['id' => $entry->id, 'name' => $entry->profile->user->full_name, 'matricule' => $entry->matricule, 'year' => $entry->academicYear->title,
                'types' => OfficialDocumentType::where('faculty_id', $entry->level->faculty_id)->where('active', true)->get(['id', 'name'])] : null,
            'requests' => (clone $base)->with(['documentType', 'documentTemplate'])->when($filters['status'] ?? null, fn ($q, $value) => $q->where('status', $value))
                ->latest('id')->paginate(20, ['*'], 'requests_page')->withQueryString()->through(fn ($row) => $this->queries->request($row) + ['reason' => $row->body]),
            'documents' => (clone $archiveQuery)->latest('id')->paginate(20, ['*'], 'documents_page')->withQueryString()->through(fn ($document) => $this->queries->row($document)),
            'audit' => $entry ? AcademicAudit::where(function ($q) use ($base, $documents) {
                $q->where(fn ($e) => $e->where('entity_type', 'student_service_requests')->whereIn('entity_id', (clone $base)->select('id')))
                    ->orWhere(fn ($e) => $e->where('entity_type', 'official_documents')->whereIn('entity_id', (clone $documents)->select('id')));
            })->latest('id')->limit(30)->get(['id', 'actor_id', 'action', 'reason', 'created_at']) : [],
            'result_archives' => ! $type && ! isset($filters['kind']) ? $results->latest('id')->paginate(15, ['*'], 'archives_page')->withQueryString()
                ->through(fn ($row) => ['id' => $row->id, 'reference' => $row->reference, 'kind' => explode(':', $row->document_key)[0], 'revoked_at' => $row->document_revoked_at, 'year' => $row->run->context['year']]) : null,
        ]);
    }

    public function type(DocumentCommandRequest $request)
    {
        $type = $this->catalog->createType($request->user(), $request->validated());

        return to_route('dashboard.admin.official-documents.index', ['type' => $type->id], 303);
    }

    public function activate(DocumentCommandRequest $request, OfficialDocumentType $type)
    {
        $this->catalog->activate($request->user(), $type, $request->boolean('active'), $request->validated('reason'));

        return back(303);
    }

    public function template(DocumentCommandRequest $request, OfficialDocumentType $type)
    {
        $this->catalog->template($request->user(), $type, $request->validated());

        return back(303);
    }

    public function templateAsset(Request $request, OfficialDocumentTemplate $template, string $asset)
    {
        $this->access->staff($request->user(), $template->type->faculty_id);
        $file = $template->layout['assets'][$asset] ?? null;
        abort_unless($file, 404);
        $bytes = Storage::disk('local')->get($file['path']);
        abort_unless(is_string($bytes) && hash_equals($file['hash'], hash('sha256', $bytes)), 503);

        return response($bytes, 200, ['Content-Type' => 'image/png', 'Cache-Control' => 'private, no-store', 'X-Content-Type-Options' => 'nosniff']);
    }

    public function templateState(DocumentCommandRequest $request, OfficialDocumentTemplate $template)
    {
        $this->catalog->templateState($request->user(), $template, $request->validated('action'), $request->validated('reason'));

        return back(303);
    }

    public function submit(DocumentCommandRequest $request, AcademicEnrollment $entry)
    {
        $this->workflow->submit($entry, OfficialDocumentType::findOrFail($request->validated('type_id')), $request->user(), $request->validated(), false);

        return back(303);
    }

    public function transition(DocumentCommandRequest $request, ServiceRequest $ticket)
    {
        $this->workflow->transition($ticket, $request->user(), $request->validated());

        return back(303);
    }

    public function preview(Request $request, ServiceRequest $ticket, DocumentFacts $facts, DocumentPdf $pdf)
    {
        abort_unless($ticket->documentType, 404);
        $this->access->staff($request->user(), $ticket->documentType->faculty_id);

        return $pdf->download($pdf->official($ticket, $facts->snapshot($ticket)), 'apercu-provisoire.pdf');
    }

    public function issue(DocumentCommandRequest $request, ServiceRequest $ticket)
    {
        abort_unless($ticket->documentType, 404);
        $this->access->staff($request->user(), $ticket->documentType->faculty_id, DocumentAccess::ISSUE);
        $revision = (int) $request->validated('revision');
        if (config('official-documents.queue_issuance')) {
            DocumentAccess::check($ticket->status === 'approved' && $ticket->document_revision === $revision, 'status', 'Approuvez la version actuelle avant de lancer l’émission.');
            IssueOfficialDocument::dispatch($ticket->id, $request->user()->id, $revision);

            return back(303)->with('success', 'Émission mise en file.');
        }
        $this->workflow->issue($ticket, $request->user(), $revision);

        return back(303)->with('success', 'Document émis.');
    }

    public function lifecycle(DocumentCommandRequest $request, OfficialDocument $document)
    {
        $this->workflow->lifecycle($document, $request->user(), $request->validated('action'), $request->validated('reason'));

        return back(303);
    }

    public function download(Request $request, OfficialDocument $document, DocumentArchives $archives)
    {
        $this->access->staff($request->user(), $document->type->faculty_id);

        return $archives->download($document);
    }

    public function revokeResult(DocumentCommandRequest $request, AcademicResultDocument $archive, DocumentArchives $archives)
    {
        $archives->revokeResult($archive, $request->user(), $request->validated('reason'));

        return back(303);
    }
}
