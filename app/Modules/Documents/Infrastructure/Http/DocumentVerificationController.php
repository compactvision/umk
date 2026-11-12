<?php

namespace App\Modules\Documents\Infrastructure\Http;

use App\Modules\Documents\Application\DocumentArchives;
use Illuminate\Database\QueryException;
use Illuminate\Support\Str;

final class DocumentVerificationController
{
    public function __invoke(string $reference, DocumentArchives $archives)
    {
        $unavailable = false;
        try {
            $record = Str::isUuid($reference) ? $archives->verify(strtolower($reference)) : null;
        } catch (QueryException) {
            $record = null;
            $unavailable = true;
        }

        return response()->view('official-documents.verify', compact('record', 'unavailable'), $unavailable ? 503 : ($record ? 200 : 404))
            ->header('Cache-Control', 'private, no-store')->header('Referrer-Policy', 'no-referrer')->header('X-Robots-Tag', 'noindex, nofollow');
    }
}
