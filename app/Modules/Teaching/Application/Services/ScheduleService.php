<?php

namespace App\Modules\Teaching\Application\Services;

use App\Models\AcademicYear;
use App\Models\Student\AcademicOffering;
use App\Models\Student\AcademicSession;
use App\Modules\Student\Application\Services\Audit;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ScheduleService
{
    public function save(array $data, int $actorId, ?int $sessionId = null): int
    {
        return DB::transaction(function () use ($data, $actorId, $sessionId) {
            // A shared calendar lock serializes reservations across levels and academic years.
            AcademicYear::orderBy('id')->lockForUpdate()->firstOrFail();
            $offering = AcademicOffering::with(['academicYear', 'professor', 'course'])->findOrFail($data['academic_offering_id']);
            $period = \App\Models\Student\AcademicSemester::where('academic_year_id', $offering->academic_year_id)->where('number', $offering->course->semester)->first();
            if (!$period && !$sessionId) {
                throw ValidationException::withMessages(['academic_offering_id' => 'Définissez d’abord la période du semestre de ce cours dans l’année académique.']);
            }
            $session = $sessionId ? AcademicSession::lockForUpdate()->findOrFail($sessionId) : null;
            $start = CarbonImmutable::parse($data['starts_at'], 'Africa/Kinshasa')->setTimezone('Africa/Kinshasa');
            $end = CarbonImmutable::parse($data['ends_at'], 'Africa/Kinshasa')->setTimezone('Africa/Kinshasa');
            if ($end->lessThanOrEqualTo($start)) {
                throw ValidationException::withMessages(['ends_at' => 'La fin doit être postérieure au début.']);
            }
            $room = preg_replace('/\s+/u', ' ', trim($data['room']));
            if (!$room) throw ValidationException::withMessages(['room' => 'Indiquez une salle ou un lieu.']);
            $count = $sessionId ? 1 : (int) ($data['repeat_count'] ?? 1);
            if ($count < 1 || $count > 26) throw ValidationException::withMessages(['repeat_count' => 'Choisissez entre 1 et 26 semaines.']);
            for ($week = 0; $week < $count; $week++) {
                $from = $start->addWeeks($week);
                $to = $end->addWeeks($week);
                if ($from->toDateString() < $offering->academicYear->start_date || $to->toDateString() > $offering->academicYear->end_date) {
                    throw ValidationException::withMessages(['starts_at' => 'Toutes les séances doivent être comprises dans les dates de l’année académique.']);
                }
                if ($period && ($from < CarbonImmutable::parse($period->start_date->toDateString(), 'Africa/Kinshasa') || $to > CarbonImmutable::parse($period->end_date->toDateString(), 'Africa/Kinshasa')->addDay())) {
                    throw ValidationException::withMessages(['starts_at' => 'Toutes les séances doivent rester dans la période enregistrée du semestre.']);
                }
                $overlaps = AcademicSession::with('offering.course')->where('starts_at', '<', $to->utc())
                    ->where('ends_at', '>', $from->utc())->when($sessionId, fn ($q) => $q->where('id', '!=', $sessionId))->get();
                foreach ($overlaps as $other) {
                    $sameRoom = mb_strtolower($other->room) === mb_strtolower($room);
                    $sameTeacher = $offering->professor_id && $offering->professor_id === $other->offering->professor_id;
                    $sameGroup = $offering->level_id === $other->offering->level_id
                        && $offering->academic_year_id === $other->offering->academic_year_id
                        && (!$offering->class_id || !$other->offering->class_id || $offering->class_id === $other->offering->class_id);
                    if ($sameRoom || $sameTeacher || $sameGroup) {
                        $reason = $sameRoom ? "la salle {$room}" : ($sameTeacher ? 'l’enseignant' : 'le niveau ou le groupe');
                        throw ValidationException::withMessages(['starts_at' => 'Conflit le '.$from->format('d/m/Y à H:i').' : '.$reason.' est déjà réservé pour « '.$other->offering->course->title.' ».']);
                    }
                }
                $values = ['academic_offering_id' => $offering->id, 'starts_at' => $from->utc(), 'ends_at' => $to->utc(), 'room' => $room, 'is_published' => $data['is_published'] ?? false];
                $entity = $session ?? new AcademicSession;
                $entity->fill($values)->save();
                Audit::record($actorId, $sessionId ? 'session_updated' : 'session_created', $entity);
            }
            return $count;
        });
    }

    public function semester(array $data, int $actorId): int
    {
        return DB::transaction(function () use ($data, $actorId) {
            AcademicYear::orderBy('id')->lockForUpdate()->firstOrFail();
            $offering = AcademicOffering::with(['course', 'academicYear'])->findOrFail($data['academic_offering_id']);
            $semester = \App\Models\Student\AcademicSemester::findOrFail($data['semester_id']);
            if ($semester->academic_year_id != $offering->academic_year_id || (int) $offering->course->semester !== $semester->number) {
                throw ValidationException::withMessages(['academic_offering_id' => 'Ce cours n’appartient pas au semestre sélectionné.']);
            }
            $first = CarbonImmutable::parse($semester->start_date->toDateString(), 'Africa/Kinshasa');
            $last = CarbonImmutable::parse($semester->end_date->toDateString(), 'Africa/Kinshasa');
            if ($first->toDateString() < $offering->academicYear->start_date || $last->toDateString() > $offering->academicYear->end_date) {
                throw ValidationException::withMessages(['period_start' => 'La période du semestre doit rester dans les dates de l’année académique.']);
            }
            if ($first->diffInDays($last) > 366) {
                throw ValidationException::withMessages(['period_end' => 'La période ne peut pas dépasser une année.']);
            }
            $slots = $data['slots'] ?? array_map(fn ($day) => ['weekday' => (int) $day, 'start_time' => $data['start_time'], 'end_time' => $data['end_time'], 'room' => $data['room']], $data['weekdays']);
            $count = 0;
            $slotCounts = array_fill(0, count($slots), 0);
            for ($day = $first; $day->lessThanOrEqualTo($last); $day = $day->addDay()) {
                foreach ($slots as $index => $slot) {
                    if ($day->dayOfWeekIso !== (int) $slot['weekday']) continue;
                    try {
                        $this->save([
                            'academic_offering_id' => $offering->id,
                            'starts_at' => $day->toDateString().'T'.$slot['start_time'],
                            'ends_at' => $day->toDateString().'T'.$slot['end_time'],
                            'room' => $slot['room'], 'is_published' => $data['is_published'], 'repeat_count' => 1,
                        ], $actorId);
                    } catch (ValidationException $error) {
                        if (!isset($data['slots'])) throw $error;
                        throw ValidationException::withMessages(["slots.{$index}.start_time" => 'Créneau '.($index + 1).' : '.implode(' ', \Illuminate\Support\Arr::flatten($error->errors()))]);
                    }
                    $slotCounts[$index]++;
                    $count++;
                }
            }
            foreach ($slotCounts as $index => $occurrences) {
                if (!$occurrences) throw ValidationException::withMessages([isset($data['slots']) ? "slots.{$index}.weekday" : 'weekdays' => 'Le jour choisi pour ce créneau ne figure pas dans la période du semestre.']);
            }
            return $count;
        });
    }

    public function delete(int $sessionId, int $actorId): void
    {
        DB::transaction(function () use ($sessionId, $actorId) {
            AcademicYear::orderBy('id')->lockForUpdate()->firstOrFail();
            $session = AcademicSession::lockForUpdate()->findOrFail($sessionId);
            Audit::record($actorId, 'session_deleted', $session, null, $session->only(['academic_offering_id', 'starts_at', 'ends_at', 'room']));
            $session->delete();
        });
    }
}
