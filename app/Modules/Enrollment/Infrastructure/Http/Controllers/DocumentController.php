<?php

namespace App\Modules\Enrollment\Infrastructure\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Enrollment\Application\UseCases\UploadDocumentUseCase;
use App\Modules\Enrollment\Domain\Exceptions\DocumentException;
use App\Modules\Enrollment\Domain\Repositories\DocumentRepositoryInterface;
use Illuminate\Http\Request;
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
            'file' => ['required', 'file', 'max:10240'], // 10 Mo (ex.)
            'key' => ['required', 'string', 'max:100'],
            // 'enrollment_uuid' => ['nullable','uuid'], // optionnel
        ]);

        $file = $data['file'];

        // On stocke dans un disque/dossier temporaire
        // configure `filesystems.disks.temp` (storage/app/temp)
        $tempToken = (string) Str::uuid();
        $ext = $file->getClientOriginalExtension();
        $basename = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);

        $tempPath = "enrollments/tmp/{$tempToken}/{$basename}.".($ext ?: 'bin');
        Storage::disk('temp')->put($tempPath, file_get_contents($file->getRealPath()));

        return response()->json([
            'ok' => true,
            'temp' => [
                'token' => $tempToken,
                'path' => $tempPath,
                'filename' => $file->getClientOriginalName(),
                'mime' => $file->getClientMimeType(),
                'size_bytes' => $file->getSize(),
                'key' => $data['key'],
            ],
        ]);
    }

    public function replaceReviewed(Request $request, string $uuid, \App\Modules\Enrollment\Application\UseCases\ReplaceReviewedDocument $replace)
    {
        $request->validate(['file' => ['required', 'file', 'mimes:pdf,jpg,jpeg,png,webp', 'max:'.\App\Support\DocumentUploadLimit::kilobytes()]]);
        $replace->execute($uuid, $request->user()->id, $request->file('file'));

        return back()->with('success', 'Votre nouveau justificatif a été transmis pour examen.');
    }

    public function preview(Request $request, string $uuid)
    {
        $document = \App\Models\EnrollmentDocument::with('enrollment')->where('uuid', $uuid)->firstOrFail();
        abort_unless($document->enrollment, 404);
        abort_unless($document->enrollment->student_id === $request->user()->id || $request->user()->hasRole('admin'), 403);
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
            if ($document->enrollment->student_id !== $request->user()->id && ! $request->user()->hasRole('admin')) {
                abort(403, 'Accès non autorisé');
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

            // Vérifier les permissions
            if ($document->enrollment->student_id !== $request->user()->id) {
                abort(403, 'Accès non autorisé');
            }

            abort_unless($document->enrollment->status === \App\Modules\Enrollment\Domain\Enums\EnrollmentStatus::DRAFT, 403, 'Les pièces d’un dossier soumis doivent être conservées pour son examen.');

            // Supprimer le fichier physique
            Storage::disk($document->disk)->delete($document->path);

            // Supprimer l'entrée en base
            $this->documentRepository->delete($document);

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
