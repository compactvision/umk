<?php

namespace App\Modules\Documents\Application;

use App\Models\Student\ServiceRequest;
use App\Notifications\OfficialDocumentNotice;
use Ramsey\Uuid\Uuid;
use Throwable;

final class DocumentNotices
{
    public function send(ServiceRequest $request, string $event): void
    {
        $user = $request->enrollment->profile->user;
        $notice = new OfficialDocumentNotice($request->academic_enrollment_id, $event, $request->documentType->kind === 'card' ? 'card' : 'documents');
        $notice->id = (string) Uuid::uuid5('f2802677-8a33-4a8d-8a43-2f583fbf254c', "$event:{$request->id}:{$request->document_revision}");
        try {
            if (! $user->notifications()->whereKey($notice->id)->exists()) {
                config('official-documents.queue_notices') ? $user->notify($notice) : $user->notifyNow($notice);
            }
        } catch (Throwable $error) {
            report($error);
        }
    }
}
