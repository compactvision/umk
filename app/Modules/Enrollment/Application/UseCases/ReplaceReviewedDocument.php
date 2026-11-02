<?php

namespace App\Modules\Enrollment\Application\UseCases;

use App\Models\Enrollment;
use App\Models\EnrollmentDocument;
use App\Modules\Enrollment\Domain\Enums\EnrollmentStatus;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

final class ReplaceReviewedDocument
{
    public function execute(string $uuid, int $studentId, UploadedFile $file): void
    {
        $createdPath = null;
        try {
            $notification = DB::transaction(function () use ($uuid, $studentId, $file, &$createdPath) {
                $document = EnrollmentDocument::where('uuid', $uuid)->firstOrFail();
                $entry = Enrollment::lockForUpdate()->findOrFail($document->enrollment_id);
                abort_unless($entry->student_id === $studentId, 403);
                $document = $entry->documents()->where('uuid', $uuid)->lockForUpdate()->firstOrFail();
                if ($entry->status !== EnrollmentStatus::PENDING
                    || ! in_array($document->review_status, ['rejected', 'correction_requested'], true)) {
                    throw ValidationException::withMessages(['file' => 'Le remplacement de cette pièce n’est pas autorisé à ce stade du dossier.']);
                }
                $old = $document->only(['path', 'disk', 'sha256', 'version', 'filename', 'comment']);
                $disk = 'local';
                $createdPath = $file->storeAs('enrollments/'.$entry->uuid.'/revisions', Str::uuid().'.'.$file->extension(), $disk);
                if (! $createdPath || ! Storage::disk($disk)->exists($createdPath)) {
                    throw ValidationException::withMessages(['file' => 'Le fichier n’a pas pu être enregistré. Veuillez réessayer.']);
                }
                $document->fill([
                    'disk' => $disk, 'path' => $createdPath, 'filename' => $file->getClientOriginalName(),
                    'mime' => $file->getMimeType(), 'size_bytes' => $file->getSize(), 'sha256' => hash_file('sha256', $file->getRealPath()),
                    'version' => $document->version + 1, 'is_temp' => false,
                    'review_status' => 'pending', 'verified' => false, 'verified_by' => null, 'verified_at' => null, 'comment' => null,
                ])->save();
                $entry->meta = array_merge($entry->meta ?? [], ['analysis_completed_at' => null]);
                $entry->save();
                // Retain the prior private evidence for the administrative audit trail.
                $entry->events()->create(['event' => 'document_replaced', 'actor_id' => $studentId, 'payload' => ['document_uuid' => $uuid, 'document_name' => $document->filename, 'version' => $document->version, 'previous_document' => $old, 'reason' => 'Une nouvelle version du justificatif a été transmise pour examen.'], 'occurred_at' => now()]);

                $notice = new \App\Notifications\EnrollmentDocumentReplacement([
                    'enrollment_id' => $entry->id, 'reference' => $entry->reference,
                    'student_name' => \App\Mail\TransactionalEmail::recipientName($entry->student),
                    'document_uuid' => $document->uuid, 'filename' => $document->filename, 'version' => $document->version,
                ]);
                \App\Models\User::whereHas('roles', fn ($query) => $query->where('name', 'admin')->where('guard_name', 'web'))
                    ->each(fn ($admin) => $admin->notify($notice));

                return ['id' => $entry->id, 'document' => $document->only(['uuid', 'filename', 'version'])];
            });
        } catch (\Throwable $exception) {
            if ($createdPath) {
                Storage::disk('local')->delete($createdPath);
            }
            throw $exception;
        }
        app(NotifyDocumentReplacement::class)->afterCommit($notification['id'], $notification['document']);
    }
}
