<?php

namespace App\Modules\Teaching\Application\Services;

use App\Models\AcademicYear;
use App\Models\Student\AcademicSemester;
use App\Models\Student\AcademicSession;
use App\Modules\Student\Application\Services\Audit;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class SemesterService
{
    public function save(array $data, int $actor): AcademicSemester
    {
        return DB::transaction(function () use ($data, $actor) {
            AcademicYear::orderBy('id')->lockForUpdate()->firstOrFail();
            $year = AcademicYear::findOrFail($data['academic_year_id']);
            $start = CarbonImmutable::parse($data['start_month'].'-01', 'Africa/Kinshasa');
            $end = CarbonImmutable::parse($data['end_month'].'-01', 'Africa/Kinshasa')->endOfMonth()->startOfDay();
            $yearStart = CarbonImmutable::parse($year->start_date, 'Africa/Kinshasa')->startOfDay();
            $yearEnd = CarbonImmutable::parse($year->end_date, 'Africa/Kinshasa')->startOfDay();
            if ($end < $start || $start->startOfMonth() < $yearStart->startOfMonth() || $end->startOfMonth() > $yearEnd->startOfMonth()) {
                throw ValidationException::withMessages(['start_month' => 'Les mois du semestre doivent être compris dans l’année académique et dans l’ordre chronologique.']);
            }
            // Clip partial first/last months to the exact academic-year boundaries.
            $start = $start->max($yearStart);
            $end = $end->min($yearEnd);
            $other = AcademicSemester::where('academic_year_id', $year->id)->where('number', '!=', $data['number'])->first();
            if ($other && (((int) $data['number'] === 1 && $end->toDateString() >= $other->start_date->toDateString()) || ((int) $data['number'] === 2 && $start->toDateString() <= $other->end_date->toDateString()))) {
                throw ValidationException::withMessages(['start_month' => 'Le 1er semestre doit se terminer avant le début du 2e semestre. Les périodes ne peuvent pas se chevaucher.']);
            }
            $sessions = AcademicSession::whereNull('cancelled_at')->whereHas('offering', fn ($q) => $q->where('academic_year_id', $year->id)->where(fn ($q) => $q->whereHas('academicSemester', fn ($s) => $s->where('number', $data['number']))->orWhere(fn ($legacy) => $legacy->whereNull('curriculum_item_id')->whereHas('course', fn ($c) => $c->where('semester', $data['number'])))));
            if ($sessions->where(fn ($q) => $q->where('starts_at', '<', $start->utc())->orWhere('ends_at', '>', $end->addDay()->utc()))->exists()) {
                throw ValidationException::withMessages(['end_month' => 'Des séances de ce semestre sont déjà planifiées hors de cette période. Ajustez les séances avant de réduire la période.']);
            }
            $semester = AcademicSemester::updateOrCreate(['academic_year_id' => $year->id, 'number' => $data['number']], ['start_date' => $start, 'end_date' => $end]);
            Audit::record($actor, 'academic_semester_saved', $semester);
            return $semester;
        });
    }
}
