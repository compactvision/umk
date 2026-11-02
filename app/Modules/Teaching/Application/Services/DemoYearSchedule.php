<?php

namespace App\Modules\Teaching\Application\Services;

use App\Models\AcademicYear;
use App\Models\Student\AcademicOffering;
use App\Models\Student\AcademicSemester;
use App\Models\Student\AcademicSession;
use App\Modules\Student\Application\Services\Audit;
use Carbon\CarbonImmutable as Date;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use RuntimeException;

/** Generates proposed recurring slots; existing sessions are never changed. */
class DemoYearSchedule
{
    private array $reserved = [];

    private array $busy = [];

    public function generate(AcademicYear $year, Collection $offerings, int $actor): int
    {
        return DB::transaction(function () use ($year, $offerings, $actor) {
            AcademicYear::orderBy('id')->lockForUpdate()->firstOrFail();

            return $this->generateLocked($year, $offerings, $actor);
        });
    }

    private function generateLocked(AcademicYear $year, Collection $offerings, int $actor): int
    {
        $this->reserved = $this->busy = [];
        foreach (AcademicSession::with('offering')->where('starts_at', '<', Date::parse($year->end_date, 'Africa/Kinshasa')->addDay()->utc())->where('ends_at', '>', Date::parse($year->start_date, 'Africa/Kinshasa')->utc())->get() as $session) {
            $this->remember($session->offering, $session->starts_at->getTimestamp(), $session->ends_at->getTimestamp(), $session->room);
        }
        $loads = $offerings->countBy('professor_id');
        $added = 0;
        foreach ($offerings->sortByDesc(fn ($offering) => $loads[$offering->professor_id]) as $offering) {
            $period = AcademicSemester::where('academic_year_id', $year->id)->where('number', $offering->course->semester)->firstOrFail();
            $hours = (int) $offering->course->cmi_hours + (int) $offering->course->td_hours + (int) $offering->course->tp_hours;
            $existing = $offering->sessions()->get();
            $scheduledMinutes = $existing->sum(fn ($session) => ($session->ends_at->getTimestamp() - $session->starts_at->getTimestamp()) / 60);
            $minutes = max(0, $hours * 60 - (int) round($scheduledMinutes));
            if ($minutes === 0) {
                continue;
            }
            $first = Date::parse($period->start_date->toDateString(), 'Africa/Kinshasa');
            $last = Date::parse($period->end_date->toDateString(), 'Africa/Kinshasa');
            if ($first->toDateString() < $year->start_date || $last->toDateString() > $year->end_date || $last < $first) {
                throw new RuntimeException('Le semestre doit rester dans les dates de l’année académique.');
            }
            if (! $offering->professor_id || ! $offering->professor?->is_active) {
                throw new RuntimeException('Affectez un enseignant actif avant de générer les séances.');
            }
            if ($existing->contains(fn ($session) => $session->starts_at->getTimestamp() < $first->getTimestamp() || $session->ends_at->getTimestamp() > $last->addDay()->getTimestamp())) {
                throw new RuntimeException('Une séance existante sort de la période de son semestre. Corrigez cette séance avant de compléter le planning.');
            }
            $weekCount = max(1, (int) ceil(($first->diffInDays($last) + 1) / 7));
            $needed = max(2, (int) ceil($minutes / ($weekCount * 120)));
            $room = 'DÉMO '.$offering->level->faculty->code.'-'.$offering->level->code;
            $slots = [];
            // Four teaching blocks per day, Monday to Saturday; lunch remains free.
            $candidates = [];
            foreach ([8, 10, 13, 15] as $hour) {
                foreach (range(1, 6) as $weekday) {
                    $candidates[] = [$weekday, $hour];
                }
            }
            foreach ($candidates as [$weekday, $hour]) {
                $key = $period->number.':'.$weekday.':'.$hour;
                $group = $year->id.':'.$offering->level_id;
                if (isset($this->reserved['teacher:'.$offering->professor_id][$key]) || isset($this->reserved['group:'.$group][$key])) {
                    continue;
                }
                $dates = [];
                for ($date = $first; $date <= $last; $date = $date->addDay()) {
                    if ($date->dayOfWeekIso !== $weekday) {
                        continue;
                    }
                    $from = $date->setTime($hour, 0);
                    if ($this->conflict($offering, $from->getTimestamp(), $from->addHours(2)->getTimestamp(), $room)) {
                        $dates = [];
                        break;
                    }
                    $dates[] = $from;
                }
                if (! $dates) {
                    continue;
                }
                $slots[] = ['key' => $key, 'dates' => $dates];
                if (count($slots) >= $needed) {
                    break;
                }
            }
            $dates = collect($slots)->flatMap(fn ($slot) => $slot['dates'])->sortBy(fn ($date) => $date->getTimestamp())->values();
            $sessions = (int) ceil($minutes / 120);
            if ($dates->count() < $sessions) {
                throw new RuntimeException('Créneaux insuffisants sans conflit pour '.$offering->course->title.'. Les données existantes sont conservées ; ajustez la période ou les réservations.');
            }
            foreach ($slots as $slot) {
                $this->reserved['teacher:'.$offering->professor_id][$slot['key']] = true;
                $this->reserved['group:'.$group][$slot['key']] = true;
            }
            $rows = [];
            for ($index = 0, $remaining = $minutes; $index < $sessions; $index++) {
                // Spread occurrences over the semester rather than packing them into the first weeks.
                $position = $sessions === 1 ? 0 : (int) round($index * ($dates->count() - 1) / ($sessions - 1));
                $from = $dates[$position];
                $duration = min(120, $remaining);
                $to = $from->addMinutes($duration);
                $rows[] = ['academic_offering_id' => $offering->id, 'starts_at' => $from->utc()->format('Y-m-d H:i:s'), 'ends_at' => $to->utc()->format('Y-m-d H:i:s'), 'room' => $room, 'is_published' => true, 'created_at' => now(), 'updated_at' => now()];
                $this->remember($offering, $from->getTimestamp(), $to->getTimestamp(), $room);
                $remaining -= $duration;
                $added++;
            }
            DB::table('academic_sessions')->insert($rows);
            Audit::record($actor, 'demo_schedule_generated', $offering, 'Scénario fictif sans suppression des séances existantes.', ['sessions' => count($rows), 'minutes' => $minutes]);
        }

        return $added;
    }

    private function remember(AcademicOffering $offering, int $from, int $to, string $room): void
    {
        $this->busy[] = ['from' => $from, 'to' => $to, 'room' => mb_strtolower($room), 'teacher' => $offering->professor_id, 'level' => $offering->level_id, 'year' => $offering->academic_year_id];
    }

    private function conflict(AcademicOffering $offering, int $from, int $to, string $room): bool
    {
        foreach ($this->busy as $busy) {
            if ($busy['from'] < $to && $busy['to'] > $from && ($busy['room'] === mb_strtolower($room) || ($offering->professor_id && $busy['teacher'] === $offering->professor_id) || ($busy['level'] === $offering->level_id && $busy['year'] === $offering->academic_year_id))) {
                return true;
            }
        }

        return false;
    }
}
