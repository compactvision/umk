<?php

namespace App\Modules\Documents\Application;

use App\Models\Student\AcademicDeliberation;
use App\Models\Student\AcademicResultDocument;
use App\Models\Student\OfficialDocument;
use App\Models\User;
use App\Modules\Student\Application\Services\Audit;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

final class DocumentArchives
{
    public function __construct(private DocumentAccess $access, private DocumentPdf $pdf) {}

    public function download(OfficialDocument $document)
    {
        $bytes = Storage::disk('local')->get("official-documents/{$document->reference}.pdf");
        abort_unless(is_string($bytes) && is_string($document->sha256) && hash_equals($document->sha256, hash('sha256', $bytes)),
            503, 'L’archive officielle est indisponible.');

        return $this->pdf->download($bytes, $document->number.'.pdf');
    }

    public function verify(string $reference): ?array
    {
        $document = OfficialDocument::with('type')->where('reference', $reference)->first();
        if ($document) {
            return [
                'type' => $document->type->name, 'institution' => $document->snapshot['institution'],
                'number' => $document->number, 'issued_at' => $document->issued_at, 'expires_at' => $document->expires_at,
                'status' => $document->validity(),
            ];
        }
        $result = AcademicResultDocument::with('run')->where('reference', $reference)->first();
        if (! $result) {
            return null;
        }
        $run = $result->run;
        $kind = explode(':', $result->document_key, 2)[0];
        $newer = AcademicDeliberation::where('scope_key', $run->scope_key)->where('edition', '>', $run->edition)->where('state', 'published')->exists();

        return [
            'type' => ['minutes' => 'Procès-verbal', 'report' => 'Bulletin', 'transcript' => 'Relevé annuel'][$kind] ?? 'Résultat officiel',
            'institution' => $run->context['university'], 'number' => $result->reference, 'issued_at' => $result->created_at, 'expires_at' => null,
            'status' => $result->document_revoked_at || ! in_array($run->state, ['approved', 'published'], true) ? 'revoked' : ($newer ? 'replaced' : 'valid'),
        ];
    }

    public function revokeResult(AcademicResultDocument $document, User $actor, string $reason): void
    {
        $this->access->staff($actor, $document->run->context['faculty_id'], DocumentAccess::ISSUE);
        DB::transaction(function () use ($document, $actor, $reason) {
            $document = AcademicResultDocument::lockForUpdate()->findOrFail($document->id);
            if ($document->document_revoked_at) {
                return;
            }
            $document->update(['document_revoked_at' => now()]);
            Audit::record($actor->id, 'official_result_document_revoked', $document, $reason);
        });
    }
}
