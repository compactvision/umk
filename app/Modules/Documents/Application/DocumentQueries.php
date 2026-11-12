<?php

namespace App\Modules\Documents\Application;

use App\Models\Student\AcademicEnrollment;
use App\Models\Student\AcademicOfficialResult;
use App\Models\Student\OfficialDocument;
use App\Models\Student\OfficialDocumentType;
use App\Models\Student\ServiceRequest;
use App\Modules\Student\Application\Services\AcademicAccessService;

final class DocumentQueries
{
    public function __construct(private AcademicAccessService $access) {}

    public function student(AcademicEnrollment $entry, string $section): array
    {
        $allowed = $this->access->decision($entry, 'documents_request')['allowed'];
        $resultsAllowed = $this->access->decision($entry, 'results_view')['allowed'];
        $cards = $section === 'card';
        $types = OfficialDocumentType::where('faculty_id', $entry->level->faculty_id)->where('active', true)
            ->when($cards, fn ($q) => $q->where('kind', 'card'))
            ->when($cards === false, fn ($q) => $q->where('kind', '!=', 'card'));
        $requests = $entry->serviceRequests()->whereHas('documentType', fn ($q) => $q->where('kind', $cards ? '=' : '!=', 'card'));
        $documents = OfficialDocument::with(['type', 'request'])->where('academic_enrollment_id', $entry->id)
            ->whereHas('type', fn ($q) => $q->where('kind', $cards ? '=' : '!=', 'card'));
        $params = ['academic' => $entry->id];
        $resultLinks = $resultsAllowed && ! $cards ? AcademicOfficialResult::published()->where('academic_enrollment_id', $entry->id)
            ->with('run')->latest('id')->limit(12)->get()->map(fn ($row) => [
                'reference' => $row->reference, 'session' => $row->run->context['session'], 'edition' => $row->run->edition,
                'report' => route('dashboard.student.results.document', $params + ['reference' => $row->reference, 'kind' => 'report']),
                'transcript' => route('dashboard.student.results.document', $params + ['reference' => $row->reference, 'kind' => 'transcript']),
            ]) : [];

        return [
            'can_request' => $allowed,
            'types' => $allowed ? $types->get()->filter(fn ($type) => $type->policy['student_request'])->values()->map(fn ($type) => [
                'id' => $type->id, 'name' => $type->name, 'kind' => $type->kind,
                'copies' => $type->policy['copies'], 'financial_gate' => $type->policy['financial_gate'],
            ]) : [],
            'requests' => $requests->with(['documentType', 'documentTemplate'])->latest('id')->paginate(15, ['*'], 'document_requests_page')->withQueryString()
                ->through(fn ($row) => $this->request($row)),
            'documents' => $documents->latest('id')->paginate(15, ['*'], 'official_documents_page')->withQueryString()->through(fn ($document) => $this->row($document) + [
                'download' => $document->type->policy['download'] && $document->status === 'issued' &&
                    (! $document->type->policy['financial_gate'] || $allowed) && (! $document->request->document_source_result_id || $resultsAllowed)
                    ? route('dashboard.student.official-documents.download', $params + ['document' => $document->reference]) : null,
            ]),
            'results' => $resultLinks,
        ];
    }

    public function request(ServiceRequest $request): array
    {
        return $request->only(['id', 'subject', 'status', 'response', 'document_revision', 'document_action', 'academic_enrollment_id', 'created_at']) + [
            'kind' => $request->documentType->kind, 'resubmit_allowed' => $request->documentType->policy['student_request'], 'type_id' => $request->official_document_type_id,
            'template_id' => $request->official_document_template_id,
            'signer_id' => $request->documentTemplate?->signer_id,
        ];
    }

    public function row(OfficialDocument $document): array
    {
        return $document->only(['id', 'number', 'reference', 'official_document_type_id', 'previous_id', 'academic_enrollment_id', 'issued_at', 'expires_at', 'printed_at', 'delivered_at']) + [
            'name' => $document->type->name, 'kind' => $document->type->kind, 'validity' => $document->validity(),
            'copies' => $document->type->policy['copies'], 'status' => $document->status, 'printable' => $document->type->policy['print'],
            'verify' => route('official-documents.verify', $document->reference),
        ];
    }
}
