<?php

namespace App\Modules\Teaching\Application\Services;

use App\Models\AcademicYear;
use App\Models\Student\AcademicAttendance;
use App\Models\Student\AcademicSession;
use App\Models\User;
use App\Modules\Student\Application\Services\Audit;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final class SessionLifecycle
{
    public function __construct(private ScheduleService $schedule, private ScheduleNotices $notices) {}

    public function apply(AcademicSession $session, User $actor, array $input, bool $requireReview = true): void
    {
        DB::transaction(function () use ($session, $actor, $input, $requireReview) {
            AcademicYear::orderBy('id')->lockForUpdate()->firstOrFail();
            $session = AcademicSession::with('offering.level', 'offering.academicYear')->lockForUpdate()->findOrFail($session->id);
            TeachingScope::authorize($actor, (int) $session->offering->level->faculty_id);
            $action = $input['action'];
            $reason = $input['reason'];
            if ($action === 'close_attendance') {
                if ($session->attendance_closed_at) {
                    return;
                }
                if (! $session->is_published || $session->cancelled_at || $session->ends_at > now()
                    || ! AcademicAttendance::where('academic_session_id', $session->id)->exists()) {
                    throw ValidationException::withMessages(['action' => 'Clôturez une séance terminée avec un appel enregistré.']);
                }
                $session->update(['attendance_closed_at' => now()]);
                Audit::record($actor->id, 'attendance_closed', $session, $reason);

                return;
            }
            if ($session->cancelled_at) {
                $replacement = $session->successor()->first();
                if ($action === 'cancel' && ! $replacement && $session->change_reason === $reason) {
                    return;
                }
                if ($action === 'reschedule' && $replacement && $session->change_reason === $reason
                    && $replacement->starts_at->equalTo(CarbonImmutable::parse($input['starts_at'], 'Africa/Kinshasa'))
                    && $replacement->ends_at->equalTo(CarbonImmutable::parse($input['ends_at'], 'Africa/Kinshasa'))
                    && (int) $replacement->academic_room_id === (int) ($input['academic_room_id'] ?? $session->academic_room_id)
                    && ($replacement->academic_room_id || $replacement->room === trim($input['room'] ?? $session->room))) {
                    return;
                }
                throw ValidationException::withMessages(['action' => 'Cette séance a déjà été annulée ou reportée.']);
            }
            if ($session->offering->archived_at || ! in_array($session->offering->academicYear->status, ['draft', 'open'], true)) {
                throw ValidationException::withMessages(['action' => 'Cette offre appartient à un historique clôturé.']);
            }
            if (in_array($action, ['validate', 'publish'], true)) {
                if ($session->is_published || ($action === 'validate' && $session->validated_at)) {
                    return;
                }
                if ($action === 'publish' && $requireReview && ! $session->validated_at) {
                    throw ValidationException::withMessages(['action' => 'Validez la séance avant sa publication.']);
                }
                $this->schedule->save($this->values($session) + ['is_published' => $action === 'publish', 'reason' => $reason], $actor->id, $session->id);
                if ($action === 'validate') {
                    $session->update(['validated_at' => now()]);
                }
            } elseif (in_array($action, ['cancel', 'reschedule'], true)) {
                if ($session->starts_at <= now() || AcademicAttendance::where('academic_session_id', $session->id)->exists()) {
                    throw ValidationException::withMessages(['action' => 'La séance a commencé ou possède un appel enregistré.']);
                }
                $session->update(['cancelled_at' => now(), 'change_reason' => $reason]);
                if ($action === 'reschedule') {
                    if (CarbonImmutable::parse($input['starts_at'], 'Africa/Kinshasa') <= now()) {
                        throw ValidationException::withMessages(['starts_at' => 'Choisissez un créneau à venir.']);
                    }
                    $values = array_replace($this->values($session), array_intersect_key($input, array_flip(['starts_at', 'ends_at', 'academic_room_id', 'room'])));
                    if (! isset($input['academic_room_id']) && isset($input['room']) && $input['room'] !== $session->room) {
                        $values['academic_room_id'] = null;
                    }
                    if ($values['starts_at'] === $this->values($session)['starts_at'] && $values['ends_at'] === $this->values($session)['ends_at']
                        && (int) $values['academic_room_id'] === (int) $session->academic_room_id
                        && ScheduleService::roomKey($values['room'] ?? '') === ScheduleService::roomKey($session->room)) {
                        throw ValidationException::withMessages(['action' => 'Changez l’horaire ou la salle de la séance.']);
                    }
                    $this->schedule->save($values + ['replaces_session_id' => $session->id, 'is_published' => $session->is_published, 'reason' => $reason], $actor->id);
                    $replacement = $session->successor()->firstOrFail();
                    if ($session->is_published) {
                        $this->notices->session($replacement, 'rescheduled', $session);
                    }
                } elseif ($session->is_published) {
                    $this->notices->session($session, 'cancelled');
                }
            } else {
                throw ValidationException::withMessages(['action' => 'Transition inconnue.']);
            }
            Audit::record($actor->id, 'session_'.$action, $session, $reason, ['replacement_id' => $replacement->id ?? null]);
        }, 3);
    }

    private function values(AcademicSession $session): array
    {
        return [
            'academic_offering_id' => $session->academic_offering_id, 'academic_room_id' => $session->academic_room_id,
            'starts_at' => $session->starts_at->copy()->timezone('Africa/Kinshasa')->format('Y-m-d\TH:i'),
            'ends_at' => $session->ends_at->copy()->timezone('Africa/Kinshasa')->format('Y-m-d\TH:i'),
            'room' => $session->room, 'activity_type' => $session->activity_type, 'recurrence_id' => $session->recurrence_id,
        ];
    }
}
