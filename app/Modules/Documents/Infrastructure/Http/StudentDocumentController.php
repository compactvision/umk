<?php

namespace App\Modules\Documents\Infrastructure\Http;

use App\Models\Student\OfficialDocument;
use App\Models\Student\OfficialDocumentType;
use App\Models\Student\ServiceRequest;
use App\Modules\Documents\Application\DocumentArchives;
use App\Modules\Documents\Application\DocumentWorkflow;
use App\Modules\Student\Application\Services\AcademicAccessService;
use App\Modules\Student\Infrastructure\Http\Controllers\StudentPortalController;
use Illuminate\Http\Request;

final class StudentDocumentController
{
    public function submit(DocumentCommandRequest $request, StudentPortalController $portal, DocumentWorkflow $workflow)
    {
        $entry = $portal->context($request);
        $workflow->submit($entry, OfficialDocumentType::findOrFail($request->validated('type_id')), $request->user(), $request->validated(), true);

        return back(303)->with('success', 'Demande documentaire enregistrée.');
    }

    public function transition(DocumentCommandRequest $request, ServiceRequest $ticket, StudentPortalController $portal, DocumentWorkflow $workflow)
    {
        $entry = $portal->context($request);
        abort_unless($request->validated('action') === 'resubmit' && $ticket->academic_enrollment_id === $entry->id, 404);
        abort_unless($ticket->documentType?->policy['student_request'], 403);
        $workflow->transition($ticket, $request->user(), $request->validated());

        return back(303);
    }

    public function download(Request $request, OfficialDocument $document, StudentPortalController $portal, AcademicAccessService $access, DocumentArchives $archives)
    {
        $entry = $portal->context($request);
        abort_unless($document->academic_enrollment_id === $entry->id && $document->status === 'issued', 404);
        abort_unless($document->type->policy['download']
            && (! $document->type->policy['financial_gate'] || $access->decision($entry, 'documents_request')['allowed'])
            && (! $document->request->document_source_result_id || $access->decision($entry, 'results_view')['allowed']), 403);

        return $archives->download($document);
    }
}
