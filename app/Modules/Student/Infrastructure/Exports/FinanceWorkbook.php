<?php

namespace App\Modules\Student\Infrastructure\Exports;

use App\Models\AcademicStructure\AcademicProgram;
use App\Models\AcademicYear;
use App\Models\Faculty;
use App\Models\Level;
use App\Models\User;
use App\Modules\Student\Application\Services\FinanceReportingService;
use Carbon\CarbonImmutable;

final class FinanceWorkbook
{
    public function __construct(private FinanceReportingService $reports) {}

    public function contents(User $actor, array $filters): string
    {
        $totals = array_map(static function (array $row): array {
            $row['covered_cents'] = max(0, $row['due_cents'] - $row['balance_cents']);
            $row['coverage'] = $row['due_cents'] > 0 ? $row['covered_cents'] / $row['due_cents'] : null;

            return $row;
        }, $this->reports->totals($actor, $filters));
        $cashflow = $this->reports->cashflow($actor, $filters);
        $months = [];
        foreach ($cashflow['series'] as $series) {
            foreach ($series['months'] as $month) {
                $months[] = ['currency' => $series['currency'], ...$month];
            }
        }

        $breakdowns = $this->reports->breakdowns($actor, $filters);
        $currency = ['Devise', 12];
        $billing = [
            'billed_cents' => ['Facturé brut', 19, 'amount'],
            'waived_cents' => ['Aides déduites', 19, 'amount'],
            'due_cents' => ['Frais nets', 19, 'amount'],
            'covered_cents' => ['Frais couverts', 19, 'amount'],
            'balance_cents' => ['Reste dû', 19, 'amount'],
            'overdue_cents' => ['Échu non réglé', 19, 'amount'],
        ];
        $sheets = [
            [
                'name' => 'Synthèse',
                'title' => 'Finances universitaires',
                'note' => 'Montants en unités de la devise. Encaissements nets après remboursements exécutés et contrepassations historiques.',
                'columns' => [
                    'currency' => $currency,
                    ...$billing,
                    'coverage' => ['Taux de couverture', 16, 'percent'],
                    'gross_cents' => ['Versements confirmés', 20, 'amount'],
                    'refunded_cents' => ['Remboursements exécutés', 22, 'amount'],
                    'legacy_reversal_cents' => ['Contrepassations historiques', 23, 'amount'],
                    'net_cents' => ['Encaissements nets', 21, 'amount'],
                    'pending_cents' => ['En vérification', 19, 'amount'],
                    'cancelled_cents' => ['Écritures annulées', 20, 'amount'],
                ],
                'rows' => $totals,
                'freeze' => 1,
            ],
            [
                'name' => 'Flux mensuels',
                'title' => 'Encaissements et remboursements',
                'note' => 'Période du '.$cashflow['start_month'].' au '.$cashflow['end_month'].' (Kinshasa). Confirmation des versements et exécution des remboursements datés.',
                'columns' => [
                    'currency' => $currency,
                    'month' => ['Mois', 18, 'month'],
                    'gross_cents' => ['Versements confirmés', 25, 'amount'],
                    'refunded_cents' => ['Remboursements exécutés', 26, 'amount'],
                    'net_cents' => ['Flux net', 21, 'amount'],
                ],
                'rows' => $months,
                'freeze' => 2,
                'bar' => 'gross_cents',
            ],
            [
                'name' => 'Par faculté',
                'title' => 'Recouvrement par faculté',
                'note' => 'Les montants se lisent par devise. Les barres indiquent le reste dû au sein de chaque devise.',
                'columns' => ['faculty_name' => ['Faculté', 44], 'currency' => $currency, ...$billing],
                'rows' => $breakdowns['faculties'],
                'freeze' => 2,
                'bar' => 'balance_cents',
            ],
            [
                'name' => 'Par type de frais',
                'title' => 'Recouvrement par type de frais',
                'note' => 'Les montants se lisent par devise. Les catégories reprennent les codes de facturation enregistrés.',
                'columns' => ['kind' => ['Type de frais', 30], 'currency' => $currency, ...$billing],
                'rows' => $breakdowns['fee_kinds'],
                'freeze' => 2,
                'bar' => 'balance_cents',
            ],
        ];

        return (new FinanceXlsx)->package($sheets, $this->scope($actor, $filters));
    }

    private function scope(User $actor, array $filters): string
    {
        $faculties = $actor->academicFaculties();
        $restricted = $faculties->exists();
        $facultyIds = $faculties->select('faculties.id');
        $year = isset($filters['year']) ? AcademicYear::whereKey($filters['year'])->value('title') : null;
        $faculty = isset($filters['faculty']) ? Faculty::whereKey($filters['faculty'])
            ->when($restricted, fn ($query) => $query->whereIn('id', clone $facultyIds))->value('name') : null;
        $program = isset($filters['program']) ? AcademicProgram::whereKey($filters['program'])
            ->when($restricted, fn ($query) => $query->whereIn('faculty_id', clone $facultyIds))->value('name') : null;
        $level = isset($filters['level']) ? Level::whereKey($filters['level'])
            ->when($restricted, fn ($query) => $query->whereIn('faculty_id', clone $facultyIds))->value('title') : null;

        $parts = [
            $year ? 'Année '.$year : 'Toutes les années académiques',
            isset($filters['faculty']) ? 'Faculté '.($faculty ?? 'hors périmètre') : 'Facultés autorisées',
        ];
        if (isset($filters['program'])) {
            $parts[] = 'Programme '.($program ?? 'hors périmètre');
        }
        if (isset($filters['level'])) {
            $parts[] = 'Niveau '.($level ?? 'hors périmètre');
        }
        if (filled($filters['q'] ?? null)) {
            $parts[] = 'Recherche appliquée';
        }

        return implode(' · ', $parts).' · Exporté le '.CarbonImmutable::now('Africa/Kinshasa')->format('d/m/Y à H:i');
    }
}
