<?php

namespace App\Modules\Enrollment\Application\UseCases;

use App\Mail\EnrollmentDocumentReplaced;
use App\Models\Enrollment;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

final class NotifyDocumentReplacement
{
    public function afterCommit(int $id, array $document): void
    {
        DB::afterCommit(function () use ($id, $document) {
            $entry = Enrollment::with(['student', 'level'])->find($id);
            if (! $entry) {
                return;
            }
            try {
                Mail::to(config('mail.admissions_address'))->send(new EnrollmentDocumentReplaced($entry, $document));
                $event = 'email_sent';
            } catch (\Throwable $exception) {
                Log::error('Échec de notification administrative du justificatif', ['enrollment_id' => $id, 'document_uuid' => $document['uuid'], 'error' => $exception->getMessage()]);
                $event = 'email_failed';
            }
            $entry->events()->create(['event' => $event, 'payload' => ['notification' => 'document_replaced_admin', 'document_uuid' => $document['uuid'], 'document_name' => $document['filename'], 'version' => $document['version']], 'occurred_at' => now()]);
        });
    }
}
