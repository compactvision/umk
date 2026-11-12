<?php

namespace App\Modules\Results\Application;

use App\Models\Student\AcademicDeliberation;
use App\Models\Student\AcademicOfficialResult;
use App\Models\Student\AcademicResultDocument;
use App\Models\User;
use App\Modules\Documents\Application\DocumentPdf;
use App\Modules\Student\Application\Services\Audit;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Throwable;

final class ResultDocuments
{
    private const MINUTES_ROWS_PER_VOLUME = 250;

    public function __construct(private DocumentPdf $pdf) {}

    public static function volumeCount(int $rows): int
    {
        return max(1, intdiv($rows + self::MINUTES_ROWS_PER_VOLUME - 1, self::MINUTES_ROWS_PER_VOLUME));
    }

    public function issue(AcademicDeliberation $run, User $actor, string $kind, ?AcademicOfficialResult $result = null, int $volume = 1)
    {
        $volumes = $kind === 'minutes' ? self::volumeCount($run->results()->count()) : 1;
        abort_unless($volume >= 1 && $volume <= $volumes, 404);
        $draft = $kind === 'minutes' && ! in_array($run->state, ['approved', 'published'], true);
        abort_unless($kind === 'minutes' || ($run->state === 'published' && $result?->academic_deliberation_id === $run->id), 404);
        abort_if($draft && $run->state === 'abandoned', 404);
        if ($draft) {
            return $this->pdf->download($this->render($run, $kind, $run->reference, true, null, $volume, $volumes), $kind.'-provisoire.pdf');
        }

        $key = $kind.':'.($result?->id ?? $run->id).':'.$volume;
        $existing = AcademicResultDocument::where('document_key', $key)->first();
        if ($existing) {
            return $this->saved($existing, $kind);
        }

        $reference = (string) Str::uuid();
        $bytes = $this->render($run, $kind, $reference, false, $result, $volume, $volumes);
        $written = null;
        try {
            $document = DB::transaction(function () use ($run, $actor, $kind, $result, $key, $reference, $bytes, &$written) {
                if ($result) {
                    AcademicOfficialResult::lockForUpdate()->findOrFail($result->id);
                } else {
                    AcademicDeliberation::lockForUpdate()->findOrFail($run->id);
                }
                $existing = AcademicResultDocument::where('document_key', $key)->first();
                if ($existing) {
                    return $existing;
                }
                $written = "official-results/$reference.pdf";
                abort_unless(Storage::disk('local')->put($written, $bytes, 'private'), 503, 'Le document ne peut pas être archivé.');
                $document = AcademicResultDocument::create([
                    'academic_deliberation_id' => $run->id, 'academic_official_result_id' => $result?->id,
                    'document_key' => $key, 'reference' => $reference, 'sha256' => hash('sha256', $bytes),
                ]);
                Audit::record($actor->id, 'official_result_document_issued', $document, data: ['kind' => $kind, 'edition' => $run->edition]);

                return $document;
            });
        } catch (Throwable $error) {
            if ($written) {
                Storage::disk('local')->delete($written);
            }
            throw $error;
        }

        return $this->saved($document, $kind);
    }

    private function render(AcademicDeliberation $run, string $kind, string $reference, bool $draft, ?AcademicOfficialResult $result, int $volume, int $volumes): string
    {
        $rows = $result ? collect([$result]) : $run->results()->orderBy('id')->forPage($volume, self::MINUTES_ROWS_PER_VOLUME)->cursor();
        $verificationUrl = $draft ? null : $this->pdf->verificationUrl($reference);
        $qr = $verificationUrl ? $this->pdf->qr($verificationUrl) : null;
        $html = view('results.document', compact('run', 'kind', 'reference', 'draft', 'rows', 'volume', 'volumes', 'qr', 'verificationUrl'))->render();

        return $this->pdf->render($html, pageNumbers: true);
    }

    private function saved(AcademicResultDocument $document, string $kind)
    {
        $file = Storage::disk('local')->get("official-results/{$document->reference}.pdf");
        abort_unless(is_string($file) && hash_equals($document->sha256, hash('sha256', $file)), 503, 'L’archive du document est indisponible.');

        return $this->pdf->download($file, "$kind-{$document->reference}.pdf");
    }
}
