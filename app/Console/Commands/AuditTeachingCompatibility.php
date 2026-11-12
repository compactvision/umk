<?php

namespace App\Console\Commands;

use App\Models\AcademicStructure\CurriculumItem;
use App\Models\AcademicYear;
use App\Models\Student\AcademicOffering;
use Illuminate\Console\Command;

final class AuditTeachingCompatibility extends Command
{
    protected $signature = 'academic:teaching-audit {--year= : Identifiant de l’année} {--details : Afficher les identifiants des offres et des EC candidats}';

    protected $description = 'Analyse en lecture seule les offres historiques sans rattacher de maquette automatiquement.';

    public function handle(): int
    {
        $year = $this->option('year');
        if ($year !== null && (! ctype_digit($year) || ! AcademicYear::whereKey($year)->exists())) {
            $this->error('Année académique introuvable.');

            return self::FAILURE;
        }
        $counts = ['sans_candidat' => 0, 'candidat_unique_a_verifier' => 0, 'ambigu' => 0];
        AcademicOffering::whereNull('curriculum_item_id')->when($year, fn ($q) => $q->where('academic_year_id', $year))
            ->with(['group.promotion', 'academicYear', 'level'])->chunkById(200, function ($offers) use (&$counts) {
                $items = CurriculumItem::whereIn('source_course_id', $offers->pluck('course_id')->unique())
                    ->whereHas('unit.version', fn ($q) => $q->whereNotNull('published_at'))
                    ->with('unit.version.program', 'unit.version.cohort.academicYear')->get()->groupBy('source_course_id');
                foreach ($offers as $offer) {
                    $candidates = $items->get($offer->course_id, collect())->filter(function ($item) use ($offer) {
                        $version = $item->unit->version;
                        $program = $version->program;
                        $promotion = $offer->group?->promotion;

                        return (int) $item->unit->level_id === (int) $offer->level_id
                            && (int) $program->faculty_id === (int) $offer->level->faculty_id
                            && ($version->academic_year_id === null || (int) $version->academic_year_id === (int) $offer->academic_year_id)
                            && (! $version->cohort || $version->cohort->academicYear->start_date <= $offer->academicYear->start_date)
                            && (int) $program->academic_department_id === (int) $offer->academic_department_id
                            && (! $promotion || ((int) $promotion->academic_program_id === (int) $program->id && (int) $promotion->academic_year_id === (int) $offer->academic_year_id));
                    })->pluck('id')->values();
                    $bucket = match ($candidates->count()) {
                        0 => 'sans_candidat', 1 => 'candidat_unique_a_verifier', default => 'ambigu'
                    };
                    $counts[$bucket]++;
                    if ($this->option('details')) {
                        $this->line('Offre '.$offer->id.' · '.$bucket.' · EC '.$candidates->join(', '));
                    }
                }
            });
        foreach ($counts as $state => $count) {
            $this->line($state.': '.$count);
        }
        $this->info('Lecture seule : aucun rattachement ni historique modifié.');

        return self::SUCCESS;
    }
}
