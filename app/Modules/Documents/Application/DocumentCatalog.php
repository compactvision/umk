<?php

namespace App\Modules\Documents\Application;

use App\Models\AcademicStructure\AcademicProgram;
use App\Models\AcademicStructure\University;
use App\Models\Student\OfficialDocumentTemplate;
use App\Models\Student\OfficialDocumentType;
use App\Models\User;
use App\Modules\Student\Application\Services\Audit;
use App\Modules\Teaching\Application\Services\LearningFiles;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Throwable;

final class DocumentCatalog
{
    private const VARIABLES = ['student', 'matricule', 'institution', 'faculty', 'level', 'program', 'year', 'number', 'issued_on'];

    private const ACADEMIC_VARIABLES = ['decision', 'credits', 'session', 'degree'];

    public function __construct(private DocumentAccess $access) {}

    public function createType(User $actor, array $input): OfficialDocumentType
    {
        $this->access->staff($actor, (int) $input['faculty_id'], DocumentAccess::MANAGE);
        $institution = University::where('is_active', true)->findOrFail($input['university_id']);
        DocumentAccess::check($institution->faculties()->whereKey($input['faculty_id'])->exists(), 'faculty_id', 'Sélectionnez une faculté de l’établissement.');
        $isAcademic = in_array($input['kind'], ['success', 'diploma'], true);
        $decisions = array_values(array_filter(preg_split('/[\s,]+/', $input['decisions'] ?? '') ?: []));
        DocumentAccess::check(! $isAcademic || $decisions !== [], 'decisions', 'Renseignez les codes de décision autorisés.');
        $program = $input['program_id'] ?? null;
        if ($input['kind'] === 'card') {
            DocumentAccess::check(! empty($input['valid_days']), 'valid_days', 'Indiquez la durée de validité approuvée pour cette carte.');
        }
        if ($input['kind'] === 'diploma') {
            DocumentAccess::check($program && ! empty($input['minimum_credits']) && ! empty($input['regulation']),
                'regulation', 'Un diplôme exige un programme, des crédits certifiés et une référence réglementaire.');
        }
        if ($program) {
            DocumentAccess::check(AcademicProgram::where('faculty_id', $input['faculty_id'])->whereKey($program)->exists(),
                'program_id', 'Sélectionnez un programme de la faculté.');
        }

        return DB::transaction(function () use ($input, $actor, $decisions, $program) {
            University::lockForUpdate()->findOrFail($input['university_id']);
            DocumentAccess::check(! OfficialDocumentType::where('faculty_id', $input['faculty_id'])->where('code', strtoupper($input['code']))->exists(),
                'code', 'Ce code documentaire existe déjà dans cette faculté.');
            $type = OfficialDocumentType::create([
                'university_id' => $input['university_id'], 'faculty_id' => $input['faculty_id'], 'code' => strtoupper($input['code']),
                'name' => $input['name'], 'kind' => $input['kind'], 'policy' => [
                    'student_request' => $input['kind'] !== 'diploma' && (bool) $input['student_request'],
                    'download' => (bool) $input['download'], 'print' => $input['kind'] === 'card' || (bool) $input['print'],
                    'copies' => (bool) $input['copies'], 'financial_gate' => (bool) $input['financial_gate'],
                    'valid_days' => (int) ($input['valid_days'] ?? 0), 'decision_codes' => $decisions,
                    'minimum_credits' => (int) ($input['minimum_credits'] ?? 0), 'program_id' => $program ? (int) $program : null,
                    'regulation' => $input['regulation'] ?? null, 'retention' => $input['retention'] ?? null,
                ],
            ]);
            Audit::record($actor->id, 'official_document_type_created', $type, $input['reason']);

            return $type;
        });
    }

    public function activate(User $actor, OfficialDocumentType $type, bool $active, string $reason): void
    {
        $this->access->staff($actor, $type->faculty_id, DocumentAccess::APPROVE);
        DB::transaction(function () use ($actor, $type, $active, $reason) {
            University::lockForUpdate()->findOrFail($type->university_id);
            $type = OfficialDocumentType::lockForUpdate()->findOrFail($type->id);
            if ($type->active === $active) {
                return;
            }
            DocumentAccess::check(! $active || $type->templates()->whereNotNull('approved_at')->whereNull('withdrawn_at')->exists(),
                'type', 'Approuvez un modèle avant d’activer ce type.');
            DocumentAccess::check(! $active || $type->kind !== 'card' || ! OfficialDocumentType::where('faculty_id', $type->faculty_id)
                ->where('kind', 'card')->where('active', true)->whereKeyNot($type->id)->exists(), 'type', 'Une seule filière de carte peut être active par faculté.');
            $type->update(['active' => $active]);
            Audit::record($actor->id, $active ? 'official_document_type_activated' : 'official_document_type_disabled', $type, $reason);
        });
    }

    public function template(User $actor, OfficialDocumentType $type, array $input): OfficialDocumentTemplate
    {
        $this->access->staff($actor, $type->faculty_id, DocumentAccess::MANAGE);
        $signer = User::whereNotNull('email_verified_at')->findOrFail($input['signer_id']);
        $this->assertSigner($signer, $type);
        preg_match_all('/\{\{\s*([a-z_]+)\s*\}\}/', $input['body'], $matches);
        $variables = in_array($type->kind, ['success', 'diploma'], true) ? [...self::VARIABLES, ...self::ACADEMIC_VARIABLES] : self::VARIABLES;
        $remaining = preg_replace('/\{\{\s*[a-z_]+\s*\}\}/', '', $input['body']);
        DocumentAccess::check(array_diff($matches[1], $variables) === [] && ! str_contains($remaining, '{{') && ! str_contains($remaining, '}}'),
            'body', 'Le texte contient une variable inconnue.');
        $layout = Arr::only($input, ['width_mm', 'height_mm', 'margin_mm', 'color']);
        if ($type->kind === 'card') {
            DocumentAccess::check(isset($layout['width_mm'], $layout['height_mm'], $layout['margin_mm'], $layout['color'])
                && 2 * $layout['margin_mm'] + 35 <= $layout['height_mm'] && 2 * $layout['margin_mm'] + 55 <= $layout['width_mm'],
                'margin_mm', 'Renseignez un format et des marges laissant une zone utile suffisante.');
            DocumentAccess::check(mb_strlen($input['body']) <= 280 && mb_strlen($input['title']) <= 60, 'body', 'Réduisez le texte du verso et le titre de la carte.');
        }
        $written = [];
        try {
            return DB::transaction(function () use ($actor, $type, $input, $layout, &$written) {
                $type = OfficialDocumentType::lockForUpdate()->findOrFail($type->id);
                foreach (['logo', 'signature', 'stamp'] as $name) {
                    if (isset($input[$name])) {
                        $files = app(LearningFiles::class);
                        $image = $files->inspect($input[$name], 'material');
                        DocumentAccess::check($image['mime'] === 'image/png', $name, 'Utilisez une image PNG approuvée.');
                        $written[$name] = null;
                        $files->store($input[$name], $image, $written[$name], 'official-document-assets/'.$type->id);
                        $layout['assets'][$name] = ['path' => $written[$name], 'mime' => $image['mime'], 'hash' => $image['sha256']];
                    }
                }
                $template = $type->templates()->create([
                    'version' => (int) $type->templates()->max('version') + 1,
                    'title' => $input['title'], 'body' => $input['body'], 'signer_id' => $input['signer_id'],
                    'capacity' => $input['capacity'], 'author_id' => $actor->id, 'layout' => $layout,
                ]);
                Audit::record($actor->id, 'official_document_template_created', $template, $input['reason']);

                return $template;
            });
        } catch (Throwable $error) {
            Storage::disk('local')->delete(array_values(array_filter($written)));
            throw $error;
        }
    }

    public function templateState(User $actor, OfficialDocumentTemplate $template, string $action, string $reason): void
    {
        $this->access->staff($actor, $template->type->faculty_id, DocumentAccess::APPROVE);
        DB::transaction(function () use ($actor, $template, $action, $reason) {
            $template = OfficialDocumentTemplate::lockForUpdate()->findOrFail($template->id);
            if ($action === 'approve') {
                $this->assertSigner($actor, $template->type);
                abort_unless($template->signer_id === $actor->id && $template->author_id !== $actor->id, 403);
                DocumentAccess::check($template->withdrawn_at === null && $template->approved_at === null, 'template', 'Cette édition ne peut plus être approuvée.');
                $template->update(['approved_at' => now()]);
            } else {
                DocumentAccess::check($template->withdrawn_at === null, 'template', 'Ce modèle a déjà été retiré.');
                $template->update(['withdrawn_at' => now()]);
            }
            Audit::record($actor->id, 'official_document_template_'.$action, $template, $reason);
        });
    }

    public function assertSigner(User $actor, OfficialDocumentType $type): void
    {
        $this->access->staff($actor, $type->faculty_id, DocumentAccess::APPROVE);
        abort_if($type->kind === 'diploma' && ! $actor->can(DocumentAccess::DIPLOMA), 403);
    }
}
