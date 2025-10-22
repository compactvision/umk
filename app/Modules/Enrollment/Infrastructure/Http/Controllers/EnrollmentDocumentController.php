<?php

namespace App\Modules\Enrollment\Infrastructure\Http\Controllers;


use App\Http\Controllers\Controller;
use App\Models\Enrollment;
use App\Models\EnrollmentDocument;
use App\Modules\Enrollment\Application\DTO\UploadDocumentDTO;
use App\Modules\Enrollment\Application\UseCases\UploadDocument;
use App\Modules\Enrollment\Domain\Repositories\EnrollmentDocumentRepository;
use App\Modules\Enrollment\Interfaces\Http\Requests\UploadDocumentRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Symfony\Component\HttpFoundation\StreamedResponse;

class EnrollmentDocumentController extends Controller
{
    public function __construct(
        private UploadDocument $upload,
        private EnrollmentDocumentRepository $docRepo,
    ) {}


    public function store(UploadDocumentRequest $request, int $enrollment)
    {
        $dto = new UploadDocumentDTO(
            enrollmentId: $enrollment,
            type: $request->string('type'),
            file: $request->file('file'),
            actorId: $request->user()->id,
        );
        $this->upload->handle($dto);
        return back()->with('success', 'Document uploaded');
    }


    public function download(string $uuid)
    {
        $doc = $this->docRepo->findByUuid($uuid);
        // $this->authorize('download', $doc->enrollment); // policy
        return response()->download(storage_path("app/{$doc->disk}/{$doc->path}"), $doc->filename);
    }

    /**
     * Afficher le brouillon actuel
     */
    public function showDraft(Request $req)
    {
        try {
            $draft = Enrollment::query()
                ->where('student_id', Auth::user()->id)
                ->where('status', 'draft')
                ->latest('updated_at')
                ->first();

            if (!$draft) {
                return response()->json(['ok' => true, 'draft' => null]);
            }

            $docs = $draft->documents()->where('is_temp', true)->get(['id', 'key', 'filename', 'path', 'disk', 'uuid']);

            return response()->json([
                'ok' => true,
                'draft' => [
                    'form_snapshot' => $draft->form_snapshot,
                    'last_step' => $draft->last_step,
                    'documents' => $docs->map(fn($d) => [
                        'id' => $d->id,
                        'key' => $d->key,
                        'filename' => $d->filename,
                        'url' => null, // privé → pas d'URL publique
                        'uuid' => $d->uuid,
                    ])->values(),
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Erreur showDraft: ' . $e->getMessage(), [
                'user_id' => Auth::user()->id ?? null,
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'ok' => false,
                'error' => 'Erreur lors de la récupération du brouillon'
            ], 500);
        }
    }

    /**
     * Sauvegarder le brouillon
     */
    public function saveDraft(Request $req)
    {
        try {
            $data = $req->validate([
                'form_snapshot' => ['array'],
                'last_step'     => ['nullable', 'integer', 'min:1', 'max:4'],
            ]);

            if (!Auth::check()) {
                return response()->json(['ok' => false, 'error' => 'Utilisateur non authentifié'], 401);
            }

            $userId   = Auth::id();
            $snapshot = $data['form_snapshot'] ?? [];
            $lastStep = (int)($data['last_step'] ?? 1);

            // Le front envoie "year_id". La BDD utilise "academic_year_id".
            // On supporte les deux clés pour être robuste.
            $levelId = $snapshot['level_id'] ?? null;
            $yearId  = $snapshot['academic_year_id'] ?? ($snapshot['year_id'] ?? null);

            if (!$levelId || !$yearId) {
                return response()->json([
                    'ok' => false,
                    'error' => 'Données insuffisantes : le niveau et l’année académique sont requis pour créer un brouillon.',
                ], 422);
            }

            // Chercher un enregistrement existant pour la paire (student, level, academic_year)
            $existing = Enrollment::query()
                ->where('student_id', $userId)
                ->where('level_id', $levelId)
                ->where('academic_year_id', $yearId)
                ->whereNull('deleted_at')
                ->latest('id')
                ->first();

            if ($existing) {
                if ($existing->status === 'draft') {
                    // ➜ Autosave du draft existant
                    $existing->form_snapshot = array_merge($existing->form_snapshot ?? [], $snapshot);
                    $existing->last_step     = max((int)($existing->last_step ?? 1), $lastStep);
                    $existing->draft_expires_at = now()->addDays(30);

                    // Assurer la cohérence des IDs au cas où ils arrivent plus tard
                    $existing->level_id = (int)$levelId;
                    if (Schema::hasColumn('enrollments', 'academic_year_id')) {
                        $existing->academic_year_id = (int)$yearId;
                    }

                    // Optionnel : persister des métadonnées non structurées
                    if (Schema::hasColumn('enrollments', 'meta')) {
                        $meta = array_intersect_key($snapshot, array_flip(['name', 'email', 'program', 'faculty_id']));
                        $existing->meta = array_merge($existing->meta ?? [], $meta);
                    }

                    $existing->save();

                    return response()->json(['ok' => true, 'created' => false, 'draft_id' => $existing->id]);
                }

                // ➜ Il existe déjà une inscription non-draft pour cette paire
                return response()->json([
                    'ok'    => false,
                    'error' => "Une inscription sur ce niveau est déjà disponible pour cette année.",
                    'code'  => 'ALREADY_REGISTERED',
                ], 409);
            }

            // ➜ Aucun enregistrement : créer un nouveau draft
            $draft = new Enrollment();
            $draft->uuid             = Str::uuid()->toString();
            $draft->student_id       = $userId;
            $draft->status           = 'draft';
            $draft->level_id         = (int)$levelId;
            if (Schema::hasColumn('enrollments', 'academic_year_id')) {
                $draft->academic_year_id = (int)$yearId;
            }
            $draft->form_snapshot    = $snapshot;
            $draft->last_step        = $lastStep;
            $draft->draft_expires_at = now()->addDays(30);

            // Optionnel : stocker des infos libres dans meta (si la colonne existe)
            if (Schema::hasColumn('enrollments', 'meta')) {
                $meta = array_intersect_key($snapshot, array_flip(['name', 'email', 'program', 'faculty_id']));
                $draft->meta = $meta;
            }

            $draft->save();

            return response()->json(['ok' => true, 'created' => true, 'draft_id' => $draft->id]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'ok' => false,
                'error' => 'Données de validation invalides',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Throwable $e) {
            Log::error('Erreur saveDraft: ' . $e->getMessage(), [
                'user_id' => Auth::id(),
                'data'    => $req->all(),
                'trace'   => $e->getTraceAsString(),
            ]);

            return response()->json([
                'ok' => false,
                'error' => 'Erreur lors de la sauvegarde du brouillon',
            ], 500);
        }
    }

    /**
     * Upload d'un document pour le brouillon
     */
    public function uploadDraft(Request $req)
    {
        try {
            $req->validate([
                'key'  => ['required', 'string', 'max:120'],
                'file' => ['required', 'file', 'max:5120'], // 5MB
            ]);

            // Vérifier que l'utilisateur est authentifié
            if (!Auth::check()) {
                return response()->json([
                    'ok' => false,
                    'error' => 'Utilisateur non authentifié'
                ], 401);
            }

            $draft = Enrollment::firstOrCreate(
                ['student_id' => Auth::user()->id, 'status' => 'draft'],
                ['uuid' => Str::uuid()->toString()]
            );

            $file   = $req->file('file');
            $uuid   = Str::uuid()->toString();
            $disk   = 'private';
            $ext    = $file->getClientOriginalExtension();
            $path   = "enrollments/" . now()->year . "/{$draft->id}/{$uuid}.{$ext}";
            $mime   = $file->getClientMimeType();
            $size   = $file->getSize();
            $sha256 = hash_file('sha256', $file->getRealPath());
            $type   = $req->string('key')->toString(); // mapping simple; adapte si besoin

            // version = dernière version + 1 (temp, même key)
            $lastVersion = EnrollmentDocument::where('enrollment_id', $draft->id)
                ->where('key', $req->key)
                ->max('version') ?? 0;

            Storage::disk($disk)->put($path, file_get_contents($file->getRealPath()));

            $doc = EnrollmentDocument::updateOrCreate(
                ['enrollment_id' => $draft->id, 'key' => $req->key, 'is_temp' => true],
                [
                    'uuid'       => $uuid,
                    'type'       => $type,
                    'disk'       => $disk,
                    'path'       => $path,
                    'filename'   => $file->getClientOriginalName(),
                    'mime'       => $mime,
                    'size_bytes' => $size,
                    'sha256'     => $sha256,
                    'version'    => $lastVersion + 1,
                ]
            );

            return response()->json([
                'ok' => true,
                'document' => [
                    'id' => $doc->id,
                    'key' => $doc->key,
                    'filename' => $doc->filename,
                    'uuid' => $doc->uuid,
                ]
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'ok' => false,
                'error' => 'Données de validation invalides',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Erreur uploadDraft: ' . $e->getMessage(), [
                'user_id' => Auth::user()->id ?? null,
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'ok' => false,
                'error' => 'Erreur lors de l\'upload du document'
            ], 500);
        }
    }

    /**
     * Supprimer le brouillon
     */
    public function discardDraft()
    {
        try {
            if (!Auth::check()) {
                return response()->json([
                    'ok' => false,
                    'error' => 'Utilisateur non authentifié'
                ], 401);
            }

            $draft = Enrollment::where('student_id', Auth::user()->id)
                ->where('status', 'draft')
                ->first();

            if ($draft) {
                foreach ($draft->documents()->where('is_temp', true)->get() as $doc) {
                    Storage::disk($doc->disk)->delete($doc->path);
                    $doc->delete();
                }
                $draft->delete();
            }

            return response()->json(['ok' => true]);
        } catch (\Exception $e) {
            Log::error('Erreur discardDraft: ' . $e->getMessage(), [
                'user_id' => Auth::user()->id ?? null,
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'ok' => false,
                'error' => 'Erreur lors de la suppression du brouillon'
            ], 500);
        }
    }

    public function stream(string $uuid)
    {
        $doc = EnrollmentDocument::where('uuid', $uuid)->firstOrFail();
        // $this->authorize('view', $doc);

        $disk = Storage::disk($doc->disk);
        abort_unless($disk->exists($doc->path), 404);

        $mime = $doc->mime ?: 'application/octet-stream';
        $filename = $doc->filename;

        return new StreamedResponse(function () use ($disk, $doc) {
            $stream = $disk->readStream($doc->path);
            fpassthru($stream);
            if (is_resource($stream)) {
                fclose($stream);
            }
        }, 200, [
            'Content-Type'              => $mime,
            'Content-Length'            => (string) $doc->size_bytes,
            'Content-Disposition'       => 'inline; filename="'.addslashes($filename).'"', // inline = aperçu navigateur
            'Cache-Control'             => 'private, max-age=86400',
            'ETag'                      => $doc->sha256,
            'X-Content-Type-Options'    => 'nosniff',
        ]);
    }

    // Méthodes héritées pour compatibilité (à supprimer après migration)
    public function show(Request $req)
    {
        return $this->showDraft($req);
    }

    public function save(Request $req)
    {
        return $this->saveDraft($req);
    }

    public function upload(Request $req)
    {
        return $this->uploadDraft($req);
    }

    public function discard()
    {
        return $this->discardDraft();
    }
}
