<?php

namespace App\Modules\Teaching\Application\Services;

use App\Support\DocumentUploadLimit;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use League\Flysystem\AwsS3V3\AwsS3V3Adapter;
use Symfony\Component\HttpFoundation\ResponseHeaderBag;
use ZipArchive;

final class LearningFiles
{
    private const DOCUMENTS = ['pdf', 'docx', 'pptx', 'xlsx', 'txt', 'jpg', 'jpeg', 'png', 'webp'];

    private const MIME_TYPES = [
        'pdf' => ['application/pdf'],
        'docx' => ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/zip'],
        'pptx' => ['application/vnd.openxmlformats-officedocument.presentationml.presentation', 'application/zip'],
        'xlsx' => ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/zip'],
        'txt' => ['text/plain'],
        'jpg' => ['image/jpeg'],
        'jpeg' => ['image/jpeg'],
        'png' => ['image/png'],
        'webp' => ['image/webp'],
        'mp4' => ['video/mp4'],
        'webm' => ['video/webm'],
        'mp3' => ['audio/mpeg'],
        'ogg' => ['audio/ogg', 'application/ogg'],
        'wav' => ['audio/wav', 'audio/x-wav', 'audio/vnd.wave'],
    ];

    private const PREVIEWS = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm', 'audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/x-wav', 'audio/vnd.wave'];

    public function inspect(UploadedFile $file, string $kind): array
    {
        $allowed = match ($kind) {
            'video' => ['mp4', 'webm'],
            'audio' => ['mp3', 'ogg', 'wav'],
            'online' => [],
            default => self::DOCUMENTS,
        };
        $ext = strtolower($file->getClientOriginalExtension());
        if (! in_array($ext, $allowed, true)) {
            throw ValidationException::withMessages(['file' => 'Extension non autorisée pour ce type de ressource.']);
        }
        Validator::make(['file' => $file], ['file' => ['required', 'file', 'max:'.DocumentUploadLimit::kilobytes()]])->validate();
        $mime = (new \finfo(FILEINFO_MIME_TYPE))->file($file->getRealPath());
        if (! in_array($mime, self::MIME_TYPES[$ext], true)) {
            throw ValidationException::withMessages(['file' => 'Le type réel du fichier ne correspond pas à son extension.']);
        }
        if (in_array($ext, ['docx', 'pptx', 'xlsx'], true)) {
            $this->office($file, $ext);
        }
        $hash = hash_file('sha256', $file->getRealPath());
        if ($hash === false) {
            throw ValidationException::withMessages(['file' => 'Le fichier est illisible.']);
        }

        return [
            'disk' => 'local', 'filename' => $this->filename($file->getClientOriginalName()), 'mime' => $mime,
            'size_bytes' => $file->getSize(), 'sha256' => $hash, 'extension' => $ext,
        ];
    }

    private function office(UploadedFile $file, string $ext): void
    {
        $zip = class_exists(ZipArchive::class) ? new ZipArchive : null;
        if (! $zip || $zip->open($file->getRealPath(), ZipArchive::RDONLY) !== true) {
            throw ValidationException::withMessages(['file' => 'Ce document bureautique ne peut pas être contrôlé.']);
        }
        try {
            $entry = ['docx' => 'word/document.xml', 'pptx' => 'ppt/presentation.xml', 'xlsx' => 'xl/workbook.xml'][$ext];
            if ($zip->locateName('[Content_Types].xml') === false || $zip->locateName($entry) === false || $zip->numFiles > 10000) {
                throw ValidationException::withMessages(['file' => 'Structure du document bureautique invalide.']);
            }
            $expanded = 0;
            for ($i = 0; $i < $zip->numFiles; $i++) {
                $part = $zip->statIndex($i);
                if ($part === false || preg_match('#vbaProject|(?:^|/)(?:embeddings|activeX)/|(?:^|/)\.\.(?:/|$)#i', $part['name'])) {
                    throw ValidationException::withMessages(['file' => 'Macros et objets incorporés sont exclus des supports.']);
                }
                $expanded += $part['size'];
                if ($expanded > 100 * 1024 * 1024) {
                    throw ValidationException::withMessages(['file' => 'Le document décompressé est trop volumineux.']);
                }
            }
        } finally {
            $zip->close();
        }
    }

    public function store(UploadedFile $file, array $facts, ?string &$written, string $directory = 'learning-content'): array
    {
        $name = Str::uuid().'.'.$facts['extension'];
        $written = $directory.'/'.$name;
        if ($file->storeAs($directory, $name, ['disk' => 'local', 'visibility' => 'private']) !== $written) {
            throw ValidationException::withMessages(['file' => 'Le fichier n’a pas pu être enregistré. Réessayez.']);
        }
        unset($facts['extension']);

        return $facts + ['path' => $written];
    }

    public function stream(array $file, bool $inline = false)
    {
        $name = $this->filename($file['filename'] ?? 'support');
        $path = $file['path'] ?? null;
        $disk = $file['disk'] ?? 'local';
        abort_unless($this->validPath($path), 404);
        $headers = ['Cache-Control' => 'private, no-store', 'X-Content-Type-Options' => 'nosniff', 'Referrer-Policy' => 'no-referrer'];
        if ($disk === 's3') {
            abort_unless(! $inline && config('learning-content.direct_s3_downloads')
                && class_exists(AwsS3V3Adapter::class), 404);
            $storage = Storage::disk('s3');
            abort_unless($storage->exists($path), 404);
            $disposition = (new ResponseHeaderBag)->makeDisposition('attachment', $name, $this->fallback($name));

            return redirect()->away($storage->temporaryUrl($path, now()->addMinutes(2), [
                'ResponseContentDisposition' => $disposition,
                'ResponseContentType' => 'application/octet-stream',
                'ResponseCacheControl' => 'private, no-store',
            ]), 302, $headers);
        }
        $resolved = $this->resolveLocal($disk, $path);
        abort_unless($resolved, 404);
        $mime = $file['mime'] ?? null;
        abort_if($inline && (! in_array($mime, self::PREVIEWS, true) || (new \finfo(FILEINFO_MIME_TYPE))->file($resolved) !== $mime), 404);
        $headers['Content-Type'] = $inline ? $mime : 'application/octet-stream';
        if ($inline) {
            $headers['Content-Security-Policy'] = "sandbox; default-src 'none'; media-src 'self'; img-src 'self'";
        }

        $response = response()->file($resolved, $headers)->setPrivate()
            ->setContentDisposition($inline ? 'inline' : 'attachment', $name, $this->fallback($name));
        $response->headers->set('Cache-Control', 'private, no-store');

        return $response;
    }

    public function status(array $file): string
    {
        $path = $file['path'] ?? null;
        if (! $this->validPath($path)) {
            return 'missing';
        }
        $disk = $file['disk'] ?? 'local';
        if ($disk === 's3') {
            return config('learning-content.direct_s3_downloads') && class_exists(AwsS3V3Adapter::class)
                && Storage::disk('s3')->exists($path) ? 'available' : 'unavailable';
        }

        return $this->resolveLocal($disk, $path) ? 'available' : 'missing';
    }

    private function validPath(?string $path): bool
    {
        return $path !== null && $path !== '' && ! str_starts_with($path, '/') && ! str_contains($path, chr(92))
            && ! preg_match('#(?:^|/)\.\.(?:/|$)|[\x00-\x1f]#', $path);
    }

    private function resolveLocal(string $disk, string $path): ?string
    {
        if (! in_array($disk, ['local', 'private'], true)) {
            return null;
        }
        $storage = Storage::disk($disk);
        $root = realpath($storage->path(''));
        $resolved = realpath($storage->path($path));

        return $root && $resolved && str_starts_with($resolved, $root.DIRECTORY_SEPARATOR)
            && is_file($resolved) && is_readable($resolved) ? $resolved : null;
    }

    public static function previewable(?string $disk, ?string $mime): bool
    {
        return in_array($disk, ['local', 'private'], true) && in_array($mime, self::PREVIEWS, true);
    }

    private function filename(string $name): string
    {
        $clean = preg_replace('/[\x00-\x1f\x7f]/u', '', basename(str_replace('\\', '/', $name)));

        return mb_strcut(trim($clean ?? '', '. ') !== '' ? $clean : 'support', 0, 180);
    }

    private function fallback(string $name): string
    {
        return str_replace('%', '_', Str::ascii($name)) ?: 'support';
    }
}
