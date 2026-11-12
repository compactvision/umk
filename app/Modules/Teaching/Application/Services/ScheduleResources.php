<?php

namespace App\Modules\Teaching\Application\Services;

use App\Models\Student\AcademicOffering;
use App\Models\Student\AcademicResourceBlock;
use App\Models\Student\AcademicRoom;
use App\Models\Student\AcademicSession;
use Carbon\CarbonInterface;
use Illuminate\Validation\ValidationException;

final class ScheduleResources
{
    public function room(AcademicOffering $offering, ?int $id, string $label): ?AcademicRoom
    {
        $university = $offering->academicYear->university_id ?? $offering->level->faculty->university_id;
        $rooms = AcademicRoom::where(fn ($q) => $q->whereNull('university_id')->orWhere('university_id', $university));
        if ($id !== null) {
            $room = $rooms->find($id);
            if (! $room) {
                throw ValidationException::withMessages(['academic_room_id' => 'La salle ne relève pas de cet établissement.']);
            }

            return $room;
        }
        if ($label === '') {
            return null;
        }
        $key = ScheduleService::roomKey($label);
        $matches = $rooms->where(fn ($q) => $q->whereRaw('LOWER(name) = ?', [$key])->orWhereRaw('LOWER(code) = ?', [$key]))->limit(2)->get();
        if ($matches->count() > 1) {
            throw ValidationException::withMessages(['academic_room_id' => 'Plusieurs salles portent ce nom. Sélectionnez leur code.']);
        }

        return $matches->first();
    }

    public function assertAvailable(AcademicOffering $offering, ?AcademicRoom $room, CarbonInterface $from, CarbonInterface $to, array $teachers): void
    {
        if ($room) {
            $audience = app(CourseAudience::class);
            $expected = $audience->roster($offering, $from)->count();
            if ($offering->curriculum_item_id && ! $offering->is_optional && $from >= now()) {
                $expected = max($expected, $audience->candidates($offering)->count());
            }
            if (! $room->is_active || $expected > $room->capacity) {
                throw ValidationException::withMessages(['academic_room_id' => 'Salle inactive ou capacité insuffisante pour le public prévu.']);
            }
        }
        $blocked = AcademicResourceBlock::whereNull('released_at')->where('starts_at', '<', $to->utc())->where('ends_at', '>', $from->utc())
            ->where(fn ($q) => $q->whereIn('professor_id', $teachers)->when($room, fn ($q) => $q->orWhere('academic_room_id', $room->id)))->exists();
        if ($blocked) {
            throw ValidationException::withMessages(['starts_at' => 'Une ressource ou un enseignant est indisponible pendant ce créneau.']);
        }
    }

    public function sameRoom(?AcademicRoom $room, string $label, AcademicSession $other): bool
    {
        if ($room && $other->academic_room_id) {
            return $room->id === $other->academic_room_id;
        }

        $key = ScheduleService::roomKey($room?->name ?? $label);
        $otherKey = ScheduleService::roomKey($other->room);

        return $key !== '' && ($key === $otherKey || ($room && ScheduleService::roomKey($room->code) === $otherKey)
            || ($other->registeredRoom && $key === ScheduleService::roomKey($other->registeredRoom->code)));
    }
}
