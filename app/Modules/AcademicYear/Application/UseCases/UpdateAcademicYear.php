<?php

namespace App\Modules\AcademicYear\Application\UseCases;

use App\Models\AcademicCalendarEvent;
use App\Models\AcademicYear as YearModel;
use App\Models\Student\AcademicSemester;
use App\Models\Student\AcademicSession;
use App\Modules\AcademicYear\Domain\Entities\AcademicYear;
use App\Modules\AcademicYear\Domain\Repositories\AcademicYearRepository;
use DomainException;
use Illuminate\Support\Facades\DB;

final class UpdateAcademicYear
{
    public function __construct(private AcademicYearRepository $repo) {}

    public function execute(
        int $id,
        string $title,
        \DateTimeImmutable $startDate,
        \DateTimeImmutable $endDate
    ): AcademicYear {
        return DB::transaction(function () use ($id, $title, $startDate, $endDate) {
            YearModel::orderBy('id')->lockForUpdate()->get();
            $year = $this->repo->findById($id);

            if (! $year) {
                throw new DomainException('Année académique introuvable.');
            }

            if ($endDate <= $startDate) {
                throw new DomainException('La fin doit être postérieure au début de l’année académique.');
            }
            $start = $startDate->format('Y-m-d');
            $end = $endDate->format('Y-m-d');
            $outside = AcademicSemester::where('academic_year_id', $id)->where(fn ($query) => $query->whereDate('start_date', '<', $start)->orWhereDate('end_date', '>', $end))->exists();
            $sessions = AcademicSession::whereHas('offering', fn ($query) => $query->where('academic_year_id', $id))->where(fn ($query) => $query->where('starts_at', '<', \Carbon\CarbonImmutable::parse($start, 'Africa/Kinshasa')->utc())->orWhere('ends_at', '>', \Carbon\CarbonImmutable::parse($end, 'Africa/Kinshasa')->addDay()->utc()))->exists();
            if ($outside || $sessions) {
                throw new DomainException('Les semestres et séances existants doivent rester compris dans les dates de l’année académique.');
            }
            if (AcademicCalendarEvent::where('academic_year_id', $id)->where(fn ($query) => $query->whereDate('start_date', '<', $start)->orWhereDate('end_date', '>', $end))->exists()) {
                throw new DomainException('Les événements du calendrier doivent rester compris dans les dates de l’année académique.');
            }
            $year->update($title, $startDate, $endDate);

            return $this->repo->save($year);
        }, 3);
    }
}
