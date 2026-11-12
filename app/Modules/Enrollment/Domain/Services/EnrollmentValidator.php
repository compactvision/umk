<?php

namespace App\Modules\Enrollment\Domain\Services;

use App\Models\AcademicStructure\AdmissionCampaign;
use App\Models\Enrollment;
use App\Modules\AdmissionCondition\Application\UseCases\GetRequirementsFor;
use App\Modules\Enrollment\Domain\Exceptions\InvalidEnrollmentStateException;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class EnrollmentValidator
{
    public function canSubmit(Enrollment $enrollment): array
    {
        $snapshot = $enrollment->form_snapshot ?? [];
        $fields = Validator::make($snapshot, [
            'faculty_id' => 'required|integer|min:1', 'level_id' => 'required|integer|min:1', 'year_id' => 'required|integer|min:1',
            'name' => 'required|string|max:255', 'email' => 'required|email|max:254', 'program' => 'required|string|max:255',
            'isConfirmed' => 'accepted',
        ]);
        if ($fields->fails()) {
            throw new InvalidEnrollmentStateException('Vérifiez la formation, les coordonnées et la confirmation du dossier.');
        }
        if ((int) $snapshot['faculty_id'] !== (int) $enrollment->level?->faculty_id
            || (int) $snapshot['level_id'] !== (int) $enrollment->level_id
            || (int) $snapshot['year_id'] !== (int) $enrollment->academic_year_id) {
            throw new InvalidEnrollmentStateException('Le niveau, la faculté et l’année ne correspondent pas au dossier.');
        }
        $program = $this->available($enrollment);
        $requirements = $this->requiredDocuments($enrollment, $program);

        $documents = $enrollment->documents()->get()->keyBy('key');
        foreach ($requirements as $key => $label) {
            $document = $documents->get($key);
            if (! $document || ! Storage::disk($document->disk)->exists($document->path)) {
                throw new InvalidEnrollmentStateException('Une pièce obligatoire est manquante : '.$label.'.');
            }
        }

        return ['program' => $program, 'documents' => $requirements];
    }

    public function available(Enrollment $enrollment, bool $checkCampaignWindow = true): ?int
    {
        $level = $enrollment->level;
        $year = $enrollment->academicYear;
        if (! $year || $year->status !== 'open') {
            throw new InvalidEnrollmentStateException('Cette année académique ne reçoit plus de candidatures.');
        }
        if (! $level || ! $level->is_active || ! $level->faculty?->is_active
            || ($year->university_id !== null && $level->faculty->university_id !== null
                && (int) $year->university_id !== (int) $level->faculty->university_id)) {
            throw new InvalidEnrollmentStateException('Ce niveau ou cette faculté ne reçoit plus de candidatures pour cette année.');
        }

        $choice = $enrollment->form_snapshot['academic_program_id'] ?? null;
        if ($choice !== null && $choice !== '' && filter_var($choice, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]) === false) {
            throw new InvalidEnrollmentStateException('Le programme sélectionné est invalide.');
        }
        $programs = $level->programs()->openForAdmission()->pluck('academic_programs.id');
        if (($level->programs()->exists() && $programs->isEmpty()) || ($choice && ! $programs->contains((int) $choice))) {
            throw new InvalidEnrollmentStateException('Le programme choisi n’est pas ouvert pour ce niveau.');
        }
        if ($programs->count() > 1 && ! $choice) {
            if (! $checkCampaignWindow && empty($enrollment->meta['submitted_at'])) {
                return null; // A historical dossier can be reviewed without guessing its program.
            }
            throw new InvalidEnrollmentStateException('Choisissez explicitement le programme officiel pour ce niveau.');
        }

        $programId = $choice ? (int) $choice : $programs->first();
        if ($checkCampaignWindow && $programId !== null) {
            $campaign = AdmissionCampaign::forContext($programId, $year->id, $level->id);
            if ($campaign && ! $campaign->acceptsApplications()) {
                throw new InvalidEnrollmentStateException('La campagne de ce programme n’est pas ouverte pour cette année et ce niveau.');
            }
        }

        return $programId;
    }

    public function requiredDocuments(Enrollment $enrollment, ?int $programId = null): array
    {
        $requirements = app(GetRequirementsFor::class)((int) $enrollment->level_id, null, $enrollment->academic_year_id, $programId ?? ($enrollment->form_snapshot['academic_program_id'] ?? null));

        return collect([...$requirements['personal_info'], ...$requirements['academic_info']])
            ->where('required', true)->pluck('label', 'key')->all();
    }
}
