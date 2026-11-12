<?php

namespace App\Modules\Teaching\Application\Services;

use App\Models\AcademicCalendarEvent;
use App\Models\AcademicStructure\CurriculumVersion;
use App\Models\AcademicYear;
use App\Models\Student\AcademicOffering;
use App\Models\Student\AcademicSemester;
use App\Models\Student\AcademicSession;
use App\Modules\Student\Application\Services\Audit;
use Carbon\CarbonImmutable as Date;
use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;

class DraftCurriculumSchedule
{
    private const ZONE = 'Africa/Kinshasa';

    /** The caller holds the shared calendar lock until all proposed sessions are saved. */
    public function generate(CurriculumVersion $version, AcademicYear $year, int $actor, array $selectedRooms = []): array
    {
        $subjects = $version->units()->with('items')->get()->flatMap->items->keyBy('source_course_id');
        $offerings = AcademicOffering::whereNull('curriculum_item_id')->whereNull('archived_at')->where('academic_year_id', $year->id)->whereIn('course_id', $subjects->keys())
            ->when($version->program->academic_department_id, fn ($query, $department) => $query->where(
                fn ($audience) => $audience->whereNull('academic_department_id')->orWhere('academic_department_id', $department)
            ))
            ->with(['course', 'professor'])->orderBy('id')->get()->groupBy('course_id');

        $first = Date::parse($year->start_date, self::ZONE);
        $last = Date::parse($year->end_date, self::ZONE);
        $periods = AcademicSemester::where('academic_year_id', $year->id)->get()->keyBy('number');
        $sessions = AcademicSession::whereNull('cancelled_at')->whereHas('offering', fn ($q) => $q->whereNull('archived_at'))->where('starts_at', '<', $last->addDay()->utc())->where('ends_at', '>', $first->utc())
            ->with('offering.assignments', 'registeredRoom')->orderBy('id')->get();
        $rooms = collect($selectedRooms ?: AcademicSession::whereHas('offering', fn ($query) => $query
            ->whereNull('delivery_mode')->orWhere('delivery_mode', '!=', 'online'))->distinct()->pluck('room')->all())
            ->map(fn ($room) => preg_replace('/\s+/u', ' ', trim($room)))
            ->filter(fn ($room) => $room !== '' && ! str_starts_with(mb_strtolower($room), 'démo '))
            ->keyBy(fn ($room) => ScheduleService::roomKey($room))->sortKeys();

        $busy = [];
        $minutesByOffering = [];
        foreach ($sessions as $session) {
            $start = $session->starts_at->toImmutable()->setTimezone(self::ZONE);
            $end = $session->ends_at->toImmutable()->setTimezone(self::ZONE);
            $minutesByOffering[$session->academic_offering_id] = ($minutesByOffering[$session->academic_offering_id] ?? 0)
                + (int) floor($start->diffInSeconds($end) / 60);
            $booking = [$start, $end, $session];
            for ($day = $start->startOfDay()->max($first); $day < $end && $day <= $last; $day = $day->addDay()) {
                $busy[$day->toDateString()][] = $booking;
            }
        }

        $issues = [];
        $created = 0;
        foreach ($subjects as $subject) {
            $minutes = ((int) $subject->cmi_hours + (int) $subject->td_hours + (int) $subject->tp_hours) * 60;
            if ($minutes === 0) {
                $issues[] = $subject->name.' · volume horaire à renseigner.';

                continue;
            }
            $assignments = $offerings->get($subject->source_course_id, collect());
            if ($assignments->isEmpty()) {
                $issues[] = $subject->name.' · aucun enseignement affecté pour cette année.';
            }
            foreach ($assignments as $offering) {
                $remaining = max(0, $minutes - ($minutesByOffering[$offering->id] ?? 0));
                if ($remaining === 0) {
                    continue;
                }
                $period = $periods->get($offering->course->semester);
                $problem = match (true) {
                    ! $offering->professor?->is_active => 'enseignant actif à affecter',
                    $period === null => 'période du semestre à configurer',
                    $offering->delivery_mode === 'online' => 'créneau à définir pour l’enseignement à distance',
                    $rooms->isEmpty() => 'aucune salle disponible dans le référentiel de planning',
                    default => null,
                };
                if ($problem !== null) {
                    $issues[] = $subject->name.' · '.$problem.'.';

                    continue;
                }
                $from = Date::parse($period->start_date->toDateString(), self::ZONE)->max($first);
                $to = Date::parse($period->end_date->toDateString(), self::ZONE)->min($last);
                $added = $this->plan($offering, $from, $to, $remaining, $rooms, $busy);
                if ($added['rows']) {
                    foreach (array_chunk($added['rows'], 250) as $rows) {
                        AcademicSession::insert($rows);
                    }
                    $count = count($added['rows']);
                    $created += $count;
                    Audit::record($actor, 'curriculum_schedule_generated', $offering, 'Génération des séances en brouillon.', ['sessions' => $count]);
                }
                if ($added['remaining'] > 0) {
                    $issues[] = $subject->name.' · '.$added['remaining'].' min restent à planifier pour l’enseignement #'.$offering->id.'.';
                }
            }
        }

        return ['sessions' => $created, 'issues' => $issues];
    }

    private function plan(AcademicOffering $offering, Date $first, Date $last, int $remaining, Collection $rooms, array &$busy): array
    {
        $rows = [];
        $timestamp = now();
        $resources = app(ScheduleResources::class);
        $holidays = AcademicCalendarEvent::where('academic_year_id', $offering->academic_year_id)->where('category', 'holiday')->get();
        $availableRooms = $rooms->map(function ($label) use ($offering, $resources) {
            try {
                return ['label' => $label, 'room' => $resources->room($offering, null, $label)];
            } catch (ValidationException) {
                return null;
            }
        })->filter();
        foreach ([8, 10, 13, 15] as $hour) {
            foreach (range(1, 6) as $weekday) {
                $offset = ($weekday - $first->dayOfWeekIso + 7) % 7;
                for ($day = $first->addDays($offset); $day <= $last && $remaining > 0; $day = $day->addWeek()) {
                    $start = $day->setTime($hour, 0);
                    $duration = min(120, $remaining);
                    $end = $start->addMinutes($duration);
                    $key = $day->toDateString();
                    if ($holidays->contains(fn ($holiday) => $key >= $holiday->start_date->toDateString() && $key <= $holiday->end_date->toDateString())) {
                        continue;
                    }
                    $overlaps = array_filter($busy[$key] ?? [], fn ($booking) => $booking[0] < $end && $booking[1] > $start);
                    $teachers = TeachingTeam::idsAt($offering, $start);
                    foreach ($overlaps as [$from, , $other]) {
                        if ($offering->audienceOverlaps($other->offering) || array_intersect($teachers, TeachingTeam::idsAt($other->offering, $from))) {
                            continue 2;
                        }
                    }
                    foreach ($availableRooms as ['label' => $label, 'room' => $room]) {
                        foreach ($overlaps as [, , $other]) {
                            if ($resources->sameRoom($room, $label, $other)) {
                                continue 2;
                            }
                        }
                        try {
                            $resources->assertAvailable($offering, $room, $start, $end, $teachers);
                        } catch (ValidationException) {
                            continue;
                        }
                        $label = $room?->name ?? $label;
                        $row = [
                            'academic_offering_id' => $offering->id, 'starts_at' => $start->utc()->toDateTimeString(),
                            'ends_at' => $end->utc()->toDateTimeString(), 'room' => $label, 'academic_room_id' => $room?->id, 'is_published' => false,
                            'created_at' => $timestamp, 'updated_at' => $timestamp,
                        ];
                        $rows[] = $row;
                        $booking = new AcademicSession($row);
                        $booking->setRelation('offering', $offering)->setRelation('registeredRoom', $room);
                        $busy[$key][] = [$start, $end, $booking];
                        $remaining -= $duration;
                        break;
                    }
                }
            }
        }

        return ['rows' => $rows, 'remaining' => $remaining];
    }
}
