<?php

namespace App\Modules\Documents\Application;

use App\Models\Student\OfficialDocument;
use App\Models\Student\ServiceRequest;
use BaconQrCode\Renderer\GDLibRenderer;
use BaconQrCode\Writer;
use Dompdf\Dompdf;
use Dompdf\Options;
use Illuminate\Support\Facades\Storage;

final class DocumentPdf
{
    public function verificationUrl(string $reference): string
    {
        $base = rtrim((string) config('app.url'), '/');
        abort_unless(filter_var($base, FILTER_VALIDATE_URL) && in_array(parse_url($base, PHP_URL_SCHEME), ['http', 'https'], true)
            && (! app()->environment('production') || str_starts_with($base, 'https://')), 503, 'L’adresse du registre est indisponible.');

        return $base.route('official-documents.verify', ['reference' => $reference], false);
    }

    public function qr(string $url): string
    {
        return 'data:image/png;base64,'.base64_encode((new Writer(new GDLibRenderer(384)))->writeString($url));
    }

    public function render(string $html, string|array $paper = 'A4', bool $pageNumbers = false, ?int $expectedPages = null): string
    {
        $pdf = new Dompdf(new Options([
            'isRemoteEnabled' => false, 'isPhpEnabled' => false, 'isJavascriptEnabled' => false, 'defaultFont' => 'DejaVu Sans',
        ]));
        $pdf->loadHtml($html, 'UTF-8');
        $pdf->setPaper($paper);
        $pdf->render();
        DocumentAccess::check($expectedPages === null || $pdf->getCanvas()->get_page_count() === $expectedPages,
            'template', 'Le contenu dépasse le format recto verso. Raccourcissez le modèle avant émission.');
        if ($pageNumbers) {
            $pdf->getCanvas()->page_text(490, 807, '{PAGE_NUM} / {PAGE_COUNT}', $pdf->getFontMetrics()->getFont('DejaVu Sans'), 8);
        }

        return $pdf->output();
    }

    public function official(ServiceRequest $request, array $snapshot, ?OfficialDocument $document = null): string
    {
        $template = $request->documentTemplate;
        $layout = $template->layout;
        $values = $snapshot + [
            'number' => $document?->number ?? 'Provisoire',
            'issued_on' => $document?->issued_at?->copy()->timezone('Africa/Kinshasa')->format('d/m/Y') ?? 'À déterminer',
        ];
        $body = preg_replace_callback('/\{\{\s*([a-z_]+)\s*\}\}/', fn ($match) => (string) ($values[$match[1]] ?? ''), $template->body);
        $card = $request->documentType->kind === 'card';
        $url = $document ? $this->verificationUrl($document->reference) : null;
        $qr = $url ? $this->qr($url) : null;
        $photo = isset($snapshot['photo']) ? $this->embeddedImage($snapshot['photo']) : null;
        $images = collect($layout['assets'] ?? [])->filter(fn ($file, $kind) => ! $card && ($document || $kind === 'logo'))->map(fn ($file) => $this->embeddedImage($file));
        $html = view('official-documents.pdf', compact('template', 'layout', 'values', 'body', 'card', 'document', 'url', 'qr', 'photo', 'images'))->render();
        $paper = $card ? [0, 0, $layout['width_mm'] * 72 / 25.4, $layout['height_mm'] * 72 / 25.4] : 'A4';

        return $this->render($html, $paper, ! $card, $card ? 2 : null);
    }

    public function download(string $bytes, string $name)
    {
        return response($bytes, 200, [
            'Content-Type' => 'application/pdf', 'Cache-Control' => 'private, no-store',
            'Content-Disposition' => 'attachment; filename="'.$name.'"', 'X-Content-Type-Options' => 'nosniff',
        ]);
    }

    private function embeddedImage(array $file): string
    {
        $data = Storage::disk('local')->get($file['path']);
        abort_unless(is_string($data) && hash_equals($file['hash'], hash('sha256', $data)), 503, 'Une image validée du document est indisponible.');

        return 'data:'.$file['mime'].';base64,'.base64_encode($data);
    }
}
