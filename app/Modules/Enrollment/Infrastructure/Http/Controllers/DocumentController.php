<?php

namespace App\Modules\Enrollment\Infrastructure\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Enrollment;
use App\Models\EnrollmentDocument;
use App\Modules\Enrollment\Application\UseCases\ReplaceReviewedDocument;
use App\Modules\Enrollment\Application\UseCases\UploadDocumentUseCase;
use App\Modules\Enrollment\Domain\Enums\EnrollmentStatus;
use App\Modules\Enrollment\Domain\Exceptions\DocumentException;
use App\Modules\Enrollment\Domain\Repositories\DocumentRepositoryInterface;
use App\Support\DocumentUploadLimit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class DocumentController extends Controller
{
    public function __construct(
        private readonly UploadDocumentUseCase $uploadDocumentUseCase,
        private readonly DocumentRepositoryInterface $documentRepository
    ) {}

    public function upload(Request $request)
    {
        $data = $request->validate([
            'file' => ['required', 'file', 'mimes:pdf,jpg,jpeg,png,webp', 'max:'.DocumentUploadLimit::kilobytes()],
            'key' => ['required', 'string', 'max:100'],
            // 'enrollment_uuid' => ['nullable','uuid'], // optionnel
        ]);

        $file = $data['file'];

        // On stocke dans un disque/dossier temporaire
        // configure `filesystems.disks.temp` (storage/app/temp)
        $tempToken = (string) Str::uuid();
        $ext = $file->getClientOriginalExtension();
        $basename = 'document';

        $tempPath = "enrollments/tmp/{$request->user()->id}/{$tempToken}/{$basename}.".($ext ?: 'bin');
        $stream = fopen($file->getRealPath(), 'rb');
        abort_unless($stream, 503, 'Fichier temporairement indisponible.');
        try {
            abort_unless(Storage::disk('temp')->put($tempPath, $stream), 503, 'Stockage temporairement indisponible.');
        } finally {
            fclose($stream);
        }

        return response()->json([
            'ok' => true,
            'temp' => [
                'token' => $tempToken,
                'path' => $tempPath,
                'filename' => $file->getClientOriginalName(),
                'mime' => $file->getMimeType(),
                'size_bytes' => $file->getSize(),
                'key' => $data['key'],
            ],
        ]);
    }

    public function replaceReviewed(Request $request, string $uuid, ReplaceReviewedDocument $replace)
    {
        $request->validate(['file' => ['required', 'file', 'mimes:pdf,jpg,jpeg,png,webp', 'max:'.DocumentUploadLimit::kilobytes()]]);
        $replace->execute($uuid, $request->user()->id, $request->file('file'));

        return back()->with('success', 'Votre nouveau justificatif a été transmis pour examen.');
    }

    public function preview(Request $request, string $uuid)
    {
        $document = EnrollmentDocument::with('enrollment')->where('uuid', $uuid)->firstOrFail();
        abort_unless($document->enrollment, 404);
        abort_unless($document->enrollment->student_id === $request->user()->id || ($request->user()->hasRole('admin') && $request->user()->can('manage academic access')), 403);
        if ($document->enrollment->student_id !== $request->user()->id && $request->user()->academicFaculties()->exists()) {
            abort_unless($request->user()->academicFaculties()->whereKey($document->enrollment->level->faculty_id)->exists(), 403);
        }
        $disk = Storage::disk($document->disk);
        abort_unless($disk->exists($document->path), 404, 'Ce fichier est indisponible.');
        $mime = $disk->mimeType($document->path);
        $headers = ['Cache-Control' => 'private, no-store', 'X-Content-Type-Options' => 'nosniff'];
        if (in_array($mime, ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/gif'], true)) {
            return $disk->response($document->path, $document->filename, $headers + ['Content-Type' => $mime, 'Content-Security-Policy' => "frame-ancestors 'self'"], 'inline');
        }

        return $disk->download($document->path, $document->filename, $headers);
    }

    public function download(Request $request, string $uuid)
    {
        try {
            $document = $this->documentRepository->findByUuidOrFail($uuid);

            abort_unless($document->enrollment, 404);

            // Vérifier que l'utilisateur a le droit d'accéder au document
            if ($document->enrollment->student_id !== $request->user()->id && ! ($request->user()->hasRole('admin') && $request->user()->can('manage academic access'))) {
                abort(403, 'Accès non autorisé');
            }

            if ($document->enrollment->student_id !== $request->user()->id && $request->user()->academicFaculties()->exists()) {
            abort_unless($request->user()->academicFaculties()->whereKey($document->enrollment->level->faculty_id)->exists(), 403);
        }
        $disk = Storage::disk($document->disk);
            abort_unless($disk->exists($document->path), 404, 'Ce fichier est indisponible.');

            return $disk->download($document->path, $document->filename, ['Cache-Control' => 'private, no-store', 'X-Content-Type-Options' => 'nosniff']);
        } catch (DocumentException $e) {
            abort(404, $e->getMessage());
        }
    }

    public function delete(Request $request, string $uuid)
    {
        try {
            $document = $this->documentRepository->findByUuidOrFail($uuid);

            DB::transaction(function () use ($document, $uuid, $request) {
                $entry = Enrollment::lockForUpdate()->findOrFail($document->enrollment_id);
                abort_unless($entry->student_id === $request->user()->id, 403);
                abort_unless($entry->status === EnrollmentStatus::DRAFT && ! $entry->isExpired(), 403, 'Les pièces d’un dossier transmis ou expiré sont conservées.');
                $document = $entry->documents()->where('uuid', $uuid)->lockForUpdate()->firstOrFail();
                $disk = $document->disk;
                $path = $document->path;
                $document->key = 'removed-'.$document->uuid;
                $document->save();
                $this->documentRepository->delete($document);
                $snapshot = $entry->form_snapshot ?? [];
                $snapshot['documents'] = array_filter($snapshot['documents'] ?? [], fn ($item) => ($item['uuid'] ?? null) !== $uuid);
                $entry->update(['form_snapshot' => $snapshot]);
                DB::afterCommit(function () use ($disk, $path) {
                    try {
                        Storage::disk($disk)->delete($path);
                    } catch (\Throwable) {
                        Log::warning('Document cleanup requires retry.');
                    }
                });
            });

            return response()->json([
                'ok' => true,
                'message' => 'Document supprimé',
            ]);
        } catch (DocumentException $e) {
            return response()->json([
                'ok' => false,
                'message' => $e->getMessage(),
            ], 404);
        }
    }
}
