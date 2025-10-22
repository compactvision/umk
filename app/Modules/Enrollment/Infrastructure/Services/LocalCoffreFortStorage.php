<?php

namespace App\Modules\Enrollment\Infrastructure\Services;


use App\Modules\Enrollment\Domain\Services\CoffreFortStorage;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Str;


final class LocalCoffreFortStorage implements CoffreFortStorage
{
    public function store(int $enrollmentId, UploadedFile $file, ?string $forceExt = null): array
    {
        $disk = 'private';
        $ext = $forceExt ?: $file->getClientOriginalExtension();
        $uuid = (string) Str::uuid();
        $path = "enrollments/" . date('Y') . "/{$enrollmentId}/{$uuid}.{$ext}";
        $file->storeAs(dirname($path), basename($path), $disk);
        return [
            'disk' => $disk,
            'path' => $path,
            'sha256' => hash_file('sha256', storage_path("app/{$disk}/{$path}")),
            'size' => $file->getSize(),
            'mime' => $file->getMimeType(),
        ];
    }


    public function download(string $disk, string $path)
    {
        return response()->file(storage_path("app/{$disk}/{$path}"));
    }
}
