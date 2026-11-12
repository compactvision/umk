<?php

namespace App\Modules\Documents\Application;

use App\Models\AcademicYear;
use App\Models\Student\AcademicEnrollment;
use App\Models\Student\OfficialDocument;
use App\Models\Student\OfficialDocumentType;
use App\Models\Student\ServiceRequest;
use App\Models\Student\StudentProfile;
use App\Models\User;
use App\Modules\Student\Application\Services\Audit;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use League\Flysystem\FilesystemException;
use Throwable;

final class DocumentWorkflow
{
    public function __construct(private DocumentAccess $access, private DocumentCatalog $catalog, private DocumentFacts $facts, private DocumentPdf $pdf, private DocumentNotices $notices) {}

    public function submit(AcademicEnrollment $entry, OfficialDocumentType $type, User $actor, array $data, bool $student): ServiceRequest
    {
        $student ? $this->access->owner($actor, $entry) : $this->access->staff($actor, $type->faculty_id, DocumentAccess::MANAGE);
        abort_if($student && ! $type->policy['student_request'], 403);
        $request = DB::transaction(function () use ($entry, $type, $actor, $data, $student) {
            $entry = AcademicEnrollment::lockForUpdate()->findOrFail($entry->id);
            $existing = $entry->serviceRequests()->where('document_operation_key', $data['operation_key'])->first();
            if ($existing) {
                DocumentAccess::check($existing->official_document_type_id === $type->id && $existing->document_action === $data['action']
                    && (int) $existing->document_previous_id === (int) ($data['previous_id'] ?? 0), 'operation_key', 'Cette opération concerne une autre demande.');

                return $existing;
            }
            $result = $this->facts->eligible($entry, $type, $student);
            $pending = $entry->id.':'.$type->id;
            DocumentAccess::check(! $entry->serviceRequests()->where('document_pending_key', $pending)->exists(), 'type', 'Une demande de ce type est déjà en traitement.');
            $template = $type->templates()->whereNotNull('approved_at')->whereNull('withdrawn_at')->orderByDesc('version')->first();
            DocumentAccess::check($template !== null, 'type', 'Aucun modèle approuvé pour ce document.');
            $documents = OfficialDocument::where('academic_enrollment_id', $entry->id)->where('official_document_type_id', $type->id);
            $prior = isset($data['previous_id']) ? (clone $documents)->findOrFail($data['previous_id']) : null;
            if ($data['action'] === 'initial') {
                DocumentAccess::check(! $student || $type->kind !== 'card' || ! $entry->cardIssuance()->exists(),
                    'action', 'Adressez-vous au service des cartes pour remplacer une carte déjà imprimée.');
                DocumentAccess::check(! $prior && ! $documents->exists(), 'action', 'Utilisez le duplicata ou le remplacement pour un document déjà émis.');
            } else {
                DocumentAccess::check($type->policy['copies'] && $prior !== null && $prior->status !== 'replaced',
                    'action', 'Le document précédent ou cette opération est indisponible.');
                DocumentAccess::check($data['action'] !== 'duplicate' || ($type->kind !== 'card' && $prior->status === 'issued'
                    && $prior->snapshot['official_result_reference'] === $result?->reference), 'action', 'Utilisez une rectification pour ce document.');
            }
            $request = $entry->serviceRequests()->create([
                'category' => 'document', 'status' => 'open', 'subject' => $type->name, 'body' => $data['reason'],
                'official_document_type_id' => $type->id, 'official_document_template_id' => $template->id,
                'document_source_result_id' => $result?->id, 'document_previous_id' => $prior?->id,
                'document_action' => $data['action'], 'document_pending_key' => $pending, 'document_operation_key' => $data['operation_key'],
            ]);
            Audit::record($actor->id, 'official_document_requested', $request, data: ['type_id' => $type->id, 'previous_id' => $prior?->id]);

            return $request;
        }, 3);
        if ($request->wasRecentlyCreated) {
            $this->notices->send($request, 'received');
        }

        return $request;
    }

    public function transition(ServiceRequest $request, User $actor, array $data): void
    {
        abort_unless($request->documentType, 404);
        $action = $data['action'];
        $state = DB::transaction(function () use ($request, $actor, $data, $action) {
            $entry = AcademicEnrollment::lockForUpdate()->findOrFail($request->academic_enrollment_id);
            $request = ServiceRequest::lockForUpdate()->findOrFail($request->id);
            $type = $request->documentType;
            $before = $request->status;
            $changes = match ($action) {
                'review' => [['open'], 'reviewed'],
                'correct' => [['open', 'reviewed'], 'correction'],
                'resubmit' => [['correction'], 'open'],
                'refuse' => [['open', 'reviewed', 'correction', 'approved'], 'refused'],
                'approve' => [['reviewed'], 'approved'],
                'recheck' => [['approved'], 'reviewed'],
            };
            if ($action === 'resubmit' && $actor->hasRole('student') && ! $actor->hasRole('admin')) {
                $this->access->owner($actor, $entry);
                abort_unless($type->policy['student_request'], 403);
            } else {
                $this->access->staff($actor, $type->faculty_id, $action === 'approve' ? DocumentAccess::APPROVE : DocumentAccess::MANAGE);
            }
            DocumentAccess::check($request->document_revision === (int) $data['revision'] && in_array($before, $changes[0], true),
                'status', 'La demande a changé ou cette transition est indisponible.');
            $request->fill(['status' => $changes[1], 'document_revision' => $request->document_revision + 1]);
            if ($action === 'approve') {
                $this->catalog->assertSigner($actor, $type);
                abort_unless($request->documentTemplate->signer_id === $actor->id && $request->responded_by !== $actor->id, 403);
                $request->document_mandate = $data['mandate'] ?? null;
                $request->document_fingerprint = $this->fingerprint($this->facts->snapshot($request));
                $request->document_approved_by = $actor->id;
            }
            if ($action === 'resubmit') {
                $request->fill(['body' => $data['reason'], 'response' => null, 'responded_by' => null]);
            } else {
                $request->fill(['response' => $data['reason'], 'responded_by' => $actor->id]);
            }
            if ($action === 'refuse') {
                $request->document_pending_key = null;
            }
            if ($action === 'recheck') {
                $request->fill(['document_fingerprint' => null, 'document_approved_by' => null]);
            }
            $request->save();
            Audit::record($actor->id, 'official_document_request_'.$action, $request, $data['reason'], ['previous' => $before, 'status' => $request->status]);

            return $request->status;
        }, 3);
        if (in_array($state, ['approved', 'correction', 'refused'], true)) {
            $this->notices->send($request->fresh(), $state);
        }
    }

    public function issue(ServiceRequest $request, User $actor, int $revision): OfficialDocument
    {
        $type = $request->documentType;
        abort_unless($type, 404);
        $this->access->staff($actor, $type->faculty_id, DocumentAccess::ISSUE);
        $written = null;
        try {
            $document = DB::transaction(function () use ($request, $actor, $revision, &$written) {
                // Results publication and corrections use the same year lock.
                if ($request->document_source_result_id !== null) {
                    AcademicYear::orderBy('id')->lockForUpdate()->firstOrFail();
                }
                $entry = AcademicEnrollment::lockForUpdate()->findOrFail($request->academic_enrollment_id);
                StudentProfile::lockForUpdate()->findOrFail($entry->student_profile_id);
                $request = ServiceRequest::lockForUpdate()->findOrFail($request->id);
                $existing = $request->document()->first();
                if ($existing) {
                    return $existing;
                }
                DocumentAccess::check($request->status === 'approved' && $request->document_revision === $revision, 'status', 'Approuvez la version actuelle avant émission.');
                $type = OfficialDocumentType::sharedLock()->findOrFail($request->official_document_type_id);
                $template = $type->templates()->sharedLock()->findOrFail($request->official_document_template_id);
                $request->setRelation('documentType', $type)->setRelation('documentTemplate', $template)->setRelation('enrollment', $entry);
                $this->catalog->assertSigner($template->signer, $type);
                DocumentAccess::check($request->document_approved_by === $template->signer_id, 'status', 'L’approbation du signataire est manquante.');
                $snapshot = $this->facts->snapshot($request);
                DocumentAccess::check(hash_equals($request->document_fingerprint, $this->fingerprint($snapshot)), 'status', 'Les données approuvées ont changé. Demandez un nouveau contrôle.');
                $prior = $request->document_previous_id ? OfficialDocument::lockForUpdate()->findOrFail($request->document_previous_id) : null;
                DocumentAccess::check(! $prior || ($prior->status !== 'replaced' && ($request->document_action !== 'duplicate' || $prior->status === 'issued')),
                    'status', 'Le document précédent ne peut plus être utilisé.');
                $now = now();
                $expires = $type->policy['valid_days'] > 0 ? $now->copy()->addDays($type->policy['valid_days']) : null;
                if ($request->document_action === 'duplicate' && $prior?->expires_at && (! $expires || $expires->gt($prior->expires_at))) {
                    $expires = $prior->expires_at;
                }
                $document = $request->document()->create([
                    'academic_enrollment_id' => $entry->id, 'official_document_type_id' => $type->id,
                    'official_document_template_id' => $template->id, 'previous_id' => $prior?->id,
                    'reference' => (string) Str::uuid(), 'snapshot' => $snapshot, 'issued_at' => $now,
                    'expires_at' => $expires, 'issued_by' => $actor->id,
                ]);
                $document->number = sprintf('%s-%s-%08d', $type->code, $now->copy()->timezone('Africa/Kinshasa')->year, $document->id);
                $bytes = $this->pdf->official($request, $snapshot, $document);
                $written = "official-documents/{$document->reference}.pdf";
                abort_unless(Storage::disk('local')->put($written, $bytes, 'private'), 503, 'L’archive officielle est indisponible.');
                $document->fill(['sha256' => hash('sha256', $bytes)])->save();
                if ($prior && $request->document_action === 'replace') {
                    $prior->update(['status' => 'replaced']);
                    Audit::record($actor->id, 'official_document_replaced', $prior, $request->body, ['successor' => $document->id]);
                }
                if ($type->kind === 'card' && ! $prior) {
                    $legacy = $entry->cardIssuance()->whereNull('replaced_by_official_id')->lockForUpdate()->first();
                    if ($legacy) {
                        $legacy->update(['replaced_by_official_id' => $document->id]);
                        Audit::record($actor->id, 'legacy_card_replaced', $legacy, $request->body, ['successor' => $document->id]);
                    }
                }
                $request->update(['status' => 'issued', 'document_pending_key' => null, 'document_revision' => $revision + 1]);
                Audit::record($actor->id, 'official_document_issued', $document, data: ['request_id' => $request->id, 'approval' => $request->document_approved_by, 'number' => $document->number]);

                return $document;
            });
        } catch (Throwable $error) {
            if ($written) {
                try {
                    Storage::disk('local')->delete($written);
                } catch (FilesystemException $cleanupError) {
                    report($cleanupError);
                }
            }
            if ($error instanceof FilesystemException) {
                report($error);
                abort(503, 'L’archive officielle est indisponible.');
            }
            throw $error;
        }
        $this->notices->send($request->fresh(), 'issued');

        return $document;
    }

    public function lifecycle(OfficialDocument $document, User $actor, string $action, string $reason): void
    {
        $this->access->staff($actor, $document->type->faculty_id, DocumentAccess::ISSUE);
        DB::transaction(function () use ($document, $actor, $action, $reason) {
            AcademicEnrollment::lockForUpdate()->findOrFail($document->academic_enrollment_id);
            $document = OfficialDocument::lockForUpdate()->findOrFail($document->id);
            DocumentAccess::check($document->status === 'issued' && ($action === 'revoke' || ! $document->expires_at?->isPast()),
                'status', 'Ce document ne peut plus changer de statut.');
            $fields = match ($action) {
                'print' => ['printed_at' => now()],
                'deliver' => ['delivered_at' => now()],
                'revoke' => ['status' => 'revoked', 'revoked_at' => now()],
            };
            if ($action === 'print') {
                DocumentAccess::check($document->type->policy['print'] && $document->printed_at === null, 'status', 'L’impression n’est pas disponible.');
            }
            if ($action === 'deliver') {
                DocumentAccess::check($document->delivered_at === null && ($document->type->kind !== 'card' || $document->printed_at !== null),
                    'status', 'La carte doit être imprimée avant la remise.');
            }
            $document->update($fields);
            Audit::record($actor->id, 'official_document_'.$action, $document, $reason, ['number' => $document->number, 'status' => $document->validity()]);
        });
        if ($action !== 'print') {
            $this->notices->send($document->request, $action);
        }
    }

    private function fingerprint(array $snapshot): string
    {
        return hash('sha256', json_encode($snapshot, JSON_THROW_ON_ERROR));
    }
}
