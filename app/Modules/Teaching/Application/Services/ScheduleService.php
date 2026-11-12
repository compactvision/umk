<?php

namespace App\Modules\Teaching\Application\Services;

use App\Models\AcademicCalendarEvent;
use App\Models\AcademicYear;
use App\Models\Student\AcademicAttendance;
use App\Models\Student\AcademicOffering;
use App\Models\Student\AcademicSemester;
use App\Models\Student\AcademicSession;
use App\Models\User;
use App\Modules\Student\Application\Services\Audit;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class ScheduleService
{
    public static function roomKey(string $room): string
    {
        return mb_strtolower(preg_replace('/\s+/u', ' ', trim($room)));
    }

    public function save(array $data, int $actorId, ?int $sessionId = null): int
    {
        return DB::transaction(function () use ($data, $actorId, $sessionId) {
            // A shared calendar lock serializes reservations across levels and academic years.
            AcademicYear::orderBy('id')->lockForUpdate()->firstOrFail();
            $offering = AcademicOffering::with(['academicYear', 'professor', 'course'])->findOrFail($data['academic_offering_id']);
            TeachingScope::authorize(User::findOrFail($actorId), (int) $offering->level->faculty_id);
            $period = $offering->curriculum_item_id ? $offering->academicSemester : AcademicSemester::where('academic_year_id', $offering->academic_year_id)->where('number', $offering->course->semester)->first();
            if ($offering->archived_at || ($offering->curriculum_item_id && ! in_array($offering->academicYear->status, ['draft', 'open'], true))) {
                throw ValidationException::withMessages(['academic_offering_id' => 'Une offre archivée ou dans une année clôturée ne peut plus être planifiée.']);
            }
            if (! $period && ! $sessionId && ! $offering->curriculum_item_id) {
                throw ValidationException::withMessages(['academic_offering_id' => 'Définissez d’abord la période du semestre de ce cours dans l’année académique.']);
            }
            $session = $sessionId ? AcademicSession::with('offering.level')->lockForUpdate()->findOrFail($sessionId) : null;
            if ($session) {
                if ($session->cancelled_at || ($session->is_published && $session->starts_at <= now()) || AcademicAttendance::where('academic_session_id', $session->id)->exists()) {
                    throw ValidationException::withMessages(['session' => 'Cette séance appartient à l’historique ou possède un appel enregistré.']);
                }
                TeachingScope::authorize(User::findOrFail($actorId), (int) $session->offering->level->faculty_id);
                if ($session->academic_offering_id !== $offering->id && ($session->offering->curriculum_item_id || $offering->curriculum_item_id)) {
                    throw ValidationException::withMessages(['academic_offering_id' => 'L’offre d’une séance versionnée ne peut pas être changée.']);
                }
            }
            $start = CarbonImmutable::parse($data['starts_at'], 'Africa/Kinshasa')->setTimezone('Africa/Kinshasa');
            $end = CarbonImmutable::parse($data['ends_at'], 'Africa/Kinshasa')->setTimezone('Africa/Kinshasa');
            if ($end->lessThanOrEqualTo($start)) {
                throw ValidationException::withMessages(['ends_at' => 'La fin doit être postérieure au début.']);
            }
            $room = preg_replace('/\s+/u', ' ', trim($data['room'] ?? ''));
            $resources = app(ScheduleResources::class);
            $roomId = array_key_exists('academic_room_id', $data) ? $data['academic_room_id'] : ($session?->room === $room ? $session?->academic_room_id : null);
            $registered = $resources->room($offering, $roomId ? (int) $roomId : null, $room);
            $room = $registered?->name ?? $room;
            $published = (bool) ($data['is_published'] ?? $session?->is_published ?? false);
            if ($published && $offering->curriculum_item_id && (! $offering->is_published || ! $offering->professor?->is_active)) {
                throw ValidationException::withMessages(['is_published' => 'Publiez d’abord l’offre versionnée et vérifiez son responsable.']);
            }
            if ($session?->is_published && ! $published) {
                throw ValidationException::withMessages(['is_published' => 'Utilisez l’annulation motivée d’une séance publiée.']);
            }
            $series = $data['recurrence_id'] ?? $session?->recurrence_id;
            if (! $sessionId && ($data['repeat_count'] ?? 1) > 1 && ! $series) {
                $series = (string) Str::uuid();
            }
            $count = $sessionId ? 1 : (int) ($data['repeat_count'] ?? 1);
            if ($count < 1 || $count > 26) {
                throw ValidationException::withMessages(['repeat_count' => 'Choisissez entre 1 et 26 semaines.']);
            }
            $saved = 0;
            $skip = $count > 1 ? $this->excludedDays($offering, $data['excluded_dates'] ?? []) : [];
            for ($week = 0; $week < $count; $week++) {
                $from = $start->addWeeks($week);
                $to = $end->addWeeks($week);
                if (isset($skip[$from->toDateString()])) {
                    continue;
                }
                $generationKey = $sessionId || isset($data['replaces_session_id']) ? null : hash('sha256', json_encode([
                    $offering->id, $from->utc()->toDateTimeString(), $to->utc()->toDateTimeString(), $registered?->id, $room, $data['activity_type'] ?? null, $published,
                ], JSON_THROW_ON_ERROR));
                if ($generationKey && AcademicSession::where('generation_key', $generationKey)->exists()) {
                    $saved++;

                    continue;
                }
                if ($to > $from->addDay()) {
                    throw ValidationException::withMessages(['ends_at' => 'Une séance ne peut pas dépasser 24 heures.']);
                }
                if ($from->toDateString() < $offering->academicYear->start_date || $to->toDateString() > $offering->academicYear->end_date) {
                    throw ValidationException::withMessages(['starts_at' => 'Toutes les séances doivent être comprises dans les dates de l’année académique.']);
                }
                $periodStart = $period?->start_date->toDateString() ?? $offering->starts_on;
                $periodEnd = $period?->end_date->toDateString() ?? $offering->ends_on;
                if ($periodStart && $periodEnd && ($from < CarbonImmutable::parse($periodStart, 'Africa/Kinshasa') || $to > CarbonImmutable::parse($periodEnd, 'Africa/Kinshasa')->addDay())) {
                    throw ValidationException::withMessages(['starts_at' => 'Toutes les séances doivent rester dans la période enregistrée du semestre.']);
                }
                $teacherIds = TeachingTeam::idsAt($offering, $from);
                $resources->assertAvailable($offering, $registered, $from, $to, $teacherIds);
                $overlaps = AcademicSession::with('offering.course', 'offering.assignments', 'registeredRoom')->whereNull('cancelled_at')->whereHas('offering', fn ($q) => $q->whereNull('archived_at'))->where('starts_at', '<', $to->utc())
                    ->where('ends_at', '>', $from->utc())->when($sessionId, fn ($q) => $q->where('id', '!=', $sessionId))->get();
                foreach ($overlaps as $other) {
                    $sameRoom = $resources->sameRoom($registered, $room, $other);
                    $sameTeacher = array_intersect($teacherIds, TeachingTeam::idsAt($other->offering, $other->starts_at)) !== [];
                    $sameGroup = $offering->audienceOverlaps($other->offering);
                    if ($sameRoom || $sameTeacher || $sameGroup) {
                        $reason = $sameRoom ? "la salle {$room}" : ($sameTeacher ? 'l’enseignant' : 'le niveau ou le groupe');
                        throw ValidationException::withMessages(['starts_at' => 'Conflit le '.$from->format('d/m/Y à H:i').' : '.$reason.' est déjà réservé pour « '.$other->offering->course->title.' ».']);
                    }
                }
                $entity = $session ?? new AcademicSession;
                $before = $session?->replicate(['id']);
                $values = [
                    'academic_offering_id' => $offering->id, 'starts_at' => $from->utc(), 'ends_at' => $to->utc(),
                    'room' => $room, 'academic_room_id' => $registered?->id, 'is_published' => $published,
                    'activity_type' => array_key_exists('activity_type', $data) ? $data['activity_type'] : $session?->activity_type,
                    'recurrence_id' => $series,
                    'validated_at' => $session?->validated_at,
                    'published_at' => $published ? ($session?->published_at ?? now()) : null,
                ];
                if (! $session) {
                    $values += ['generation_key' => $generationKey, 'replaces_session_id' => $data['replaces_session_id'] ?? null];
                }
                $entity->fill($values);
                $rescheduled = $entity->isDirty(['starts_at', 'ends_at', 'academic_room_id', 'room', 'academic_offering_id', 'activity_type']);
                $notify = $published && (! $before?->is_published || $rescheduled);
                if ($session && $rescheduled) {
                    $entity->validated_at = null;
                }
                if ($published) {
                    $entity->validated_at ??= now();
                }
                if ($entity->isDirty()) {
                    $entity->save();
                    Audit::record($actorId, $sessionId ? 'session_updated' : 'session_created', $entity, $data['reason'] ?? null, [
                        'before' => $before?->only(['starts_at', 'ends_at', 'room', 'is_published', 'academic_offering_id']),
                        'after' => $entity->only(['starts_at', 'ends_at', 'room', 'is_published', 'academic_offering_id']),
                    ]);
                    if ($notify && ! isset($data['replaces_session_id'])) {
                        app(ScheduleNotices::class)->session($entity, $before?->is_published ? 'changed' : 'published', $before?->is_published ? $before : null);
                    }
                }
                $saved++;
            }
            if ($saved === 0) {
                throw ValidationException::withMessages(['starts_at' => 'Aucune occurrence ne reste après les exclusions.']);
            }

            return $saved;
        });
    }

    public function updateWeeklySlot(int $sessionId, array $data, int $actorId): int
    {
        return DB::transaction(function () use ($sessionId, $data, $actorId) {
            AcademicYear::orderBy('id')->lockForUpdate()->firstOrFail();
            $session = AcademicSession::with('offering.course', 'offering.level')->lockForUpdate()->findOrFail($sessionId);
            TeachingScope::authorize(User::findOrFail($actorId), (int) $session->offering->level->faculty_id);
            $zone = 'Africa/Kinshasa';
            $original = $session->starts_at->setTimezone($zone);
            $start = CarbonImmutable::parse($data['starts_at'], $zone);
            $end = CarbonImmutable::parse($data['ends_at'], $zone);
            if ($start->toDateString() !== $original->toDateString() || $end > $start->startOfDay()->addDay()) {
                throw ValidationException::withMessages(['starts_at' => 'Pour modifier le créneau hebdomadaire, choisissez des heures sur le jour de la séance.']);
            }

            $matches = $this->weeklySlotSessions($session)->filter(fn ($candidate) => $candidate->starts_at > now() && ! $candidate->cancelled_at);
            if ($matches->isEmpty()) {
                throw ValidationException::withMessages(['scope' => 'Aucune occurrence à venir dans cette série.']);
            }
            foreach ($matches as $candidate) {
                $days = (int) $original->startOfDay()->diffInDays($candidate->starts_at->setTimezone($zone)->startOfDay(), false);
                if ($start->addDays($days) <= now()) {
                    throw ValidationException::withMessages(['starts_at' => 'La nouvelle heure doit rester à venir.']);
                }
                $this->save([
                    'academic_offering_id' => $session->academic_offering_id,
                    'starts_at' => $start->addDays($days)->format('Y-m-d\TH:i'),
                    'ends_at' => $end->addDays($days)->format('Y-m-d\TH:i'),
                    'room' => $data['room'] ?? $candidate->room,
                    'academic_room_id' => $data['academic_room_id'] ?? (($data['room'] ?? $candidate->room) === $candidate->room ? $candidate->academic_room_id : null),
                    'activity_type' => array_key_exists('activity_type', $data) ? $data['activity_type'] : $candidate->activity_type,
                    'reason' => $data['reason'] ?? null,
                ], $actorId, $candidate->id);
            }

            return $matches->count();
        });
    }

    public function semester(array $data, int $actorId): int
    {
        return DB::transaction(function () use ($data, $actorId) {
            AcademicYear::orderBy('id')->lockForUpdate()->firstOrFail();
            $offering = AcademicOffering::with(['course', 'academicYear'])->findOrFail($data['academic_offering_id']);
            $semester = $offering->curriculum_item_id ? $offering->academicSemester : (isset($data['semester_id'])
                ? AcademicSemester::findOrFail($data['semester_id'])
                : AcademicSemester::where('academic_year_id', $offering->academic_year_id)->where('number', $offering->course->semester)->first());
            if (isset($data['semester_id']) && (int) $data['semester_id'] !== (int) $semester?->id
                || $semester && ((int) $semester->academic_year_id !== (int) $offering->academic_year_id || (! $offering->curriculum_item_id && (int) $offering->course->semester !== $semester->number))) {
                throw ValidationException::withMessages(['academic_offering_id' => 'Ce cours n’appartient pas au semestre sélectionné.']);
            }
            $firstDate = $semester?->start_date->toDateString() ?? $offering->starts_on;
            $lastDate = $semester?->end_date->toDateString() ?? $offering->ends_on;
            if (! $firstDate || ! $lastDate) {
                throw ValidationException::withMessages(['academic_offering_id' => 'Définissez d’abord la période de ce cours.']);
            }
            $first = CarbonImmutable::parse($firstDate, 'Africa/Kinshasa');
            $last = CarbonImmutable::parse($lastDate, 'Africa/Kinshasa');
            if ($first->toDateString() < $offering->academicYear->start_date || $last->toDateString() > $offering->academicYear->end_date) {
                throw ValidationException::withMessages(['period_start' => 'La période du semestre doit rester dans les dates de l’année académique.']);
            }
            if ($first->diffInDays($last) > 366) {
                throw ValidationException::withMessages(['period_end' => 'La période ne peut pas dépasser une année.']);
            }
            $slots = $data['slots'] ?? array_map(fn ($day) => ['weekday' => (int) $day, 'start_time' => $data['start_time'], 'end_time' => $data['end_time'], 'room' => $data['room'] ?? null], $data['weekdays']);
            $skip = $this->excludedDays($offering, $data['excluded_dates'] ?? []);
            $series = array_map(fn () => (string) Str::uuid(), $slots);
            $count = 0;
            $slotCounts = array_fill_keys(array_keys($slots), 0);
            for ($day = $first; $day->lessThanOrEqualTo($last); $day = $day->addDay()) {
                foreach ($slots as $index => $slot) {
                    if ($day->dayOfWeekIso !== (int) $slot['weekday'] || isset($skip[$day->toDateString()])) {
                        continue;
                    }
                    try {
                        $this->save([
                            'academic_offering_id' => $offering->id,
                            'starts_at' => $day->toDateString().'T'.$slot['start_time'],
                            'ends_at' => $day->toDateString().'T'.$slot['end_time'],
                            'room' => $slot['room'] ?? null, 'academic_room_id' => $slot['academic_room_id'] ?? $data['academic_room_id'] ?? null,
                            'activity_type' => $data['activity_type'] ?? null, 'recurrence_id' => $series[$index],
                            'is_published' => $data['is_published'], 'repeat_count' => 1,
                        ], $actorId);
                    } catch (ValidationException $error) {
                        if (! isset($data['slots'])) {
                            throw $error;
                        }
                        throw ValidationException::withMessages(["slots.{$index}.start_time" => 'Créneau '.($index + 1).' : '.implode(' ', Arr::flatten($error->errors()))]);
                    }
                    $slotCounts[$index]++;
                    $count++;
                }
            }
            foreach ($slotCounts as $index => $occurrences) {
                if (! $occurrences) {
                    throw ValidationException::withMessages([isset($data['slots']) ? "slots.{$index}.weekday" : 'weekdays' => 'Le jour choisi pour ce créneau ne figure pas dans la période du semestre.']);
                }
            }

            return $count;
        });
    }

    public function delete(int $sessionId, int $actorId, bool $wholeSemester = false): int
    {
        return DB::transaction(function () use ($sessionId, $actorId, $wholeSemester) {
            AcademicYear::orderBy('id')->lockForUpdate()->firstOrFail();
            $session = AcademicSession::with('offering.level')->lockForUpdate()->findOrFail($sessionId);
            TeachingScope::authorize(User::findOrFail($actorId), (int) $session->offering->level->faculty_id);
            $sessions = $wholeSemester ? $this->weeklySlotSessions($session) : [$session];

            if (AcademicAttendance::whereIn('academic_session_id', collect($sessions)->pluck('id'))->exists()) {
                throw ValidationException::withMessages(['session' => 'Une séance avec des présences enregistrées ne peut pas être supprimée.']);
            }
            foreach ($sessions as $candidate) {
                if ($candidate->is_published || $candidate->published_at || $candidate->cancelled_at || $candidate->replaces_session_id) {
                    throw ValidationException::withMessages(['session' => 'Une séance publiée reste dans l’historique. Utilisez une annulation motivée.']);
                }
                Audit::record($actorId, 'session_deleted', $candidate, null, $candidate->only(['academic_offering_id', 'starts_at', 'ends_at', 'room']));
                $candidate->delete();
            }

            return count($sessions);
        });
    }

    private function excludedDays(AcademicOffering $offering, array $exceptions): array
    {
        $excluded = array_fill_keys($exceptions, true);
        $holidays = AcademicCalendarEvent::where('academic_year_id', $offering->academic_year_id)->where('category', 'holiday')->get();
        foreach ($holidays as $holiday) {
            for ($day = $holiday->start_date; $day <= $holiday->end_date; $day = $day->addDay()) {
                $excluded[$day->toDateString()] = true;
            }
        }

        return $excluded;
    }

    private function weeklySlotSessions(AcademicSession $session): Collection
    {
        $offering = $session->offering;
        if ($session->recurrence_id) {
            return $offering->sessions()->where('recurrence_id', $session->recurrence_id)->orderBy('starts_at')->get();
        }
        $period = AcademicSemester::where('academic_year_id', $offering->academic_year_id)
            ->where('number', $offering->course->semester)->first();
        if (! $period) {
            throw ValidationException::withMessages(['scope' => 'Configurez d’abord les dates du semestre de ce cours.']);
        }
        $zone = 'Africa/Kinshasa';
        $original = $session->starts_at->setTimezone($zone);
        $first = CarbonImmutable::parse($period->start_date->toDateString(), $zone);
        $last = CarbonImmutable::parse($period->end_date->toDateString(), $zone)->addDay();
        if ($original < $first || $original >= $last) {
            throw ValidationException::withMessages(['scope' => 'Cette séance doit appartenir à une période de semestre configurée.']);
        }
        $duration = $session->starts_at->diffInSeconds($session->ends_at);

        return $offering->sessions()->where('starts_at', '>=', $first->utc())->where('starts_at', '<', $last->utc())
            ->orderBy('starts_at')->get()->filter(function (AcademicSession $candidate) use ($original, $duration, $zone) {
                // The original weekday, time and duration identify an existing weekly slot.
                return $candidate->starts_at->setTimezone($zone)->format('N H:i:s') === $original->format('N H:i:s')
                    && $candidate->starts_at->diffInSeconds($candidate->ends_at) === $duration;
            });
    }
}
