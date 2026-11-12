<?php

namespace App\Modules\Teaching\Application\Services;

use App\Models\AcademicYear;
use App\Models\Professor;
use App\Models\Student\AcademicOffering;
use App\Models\Student\AcademicSession;
use App\Models\User;
use App\Modules\Student\Application\Services\Audit;
use Carbon\CarbonInterface;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final class TeachingTeam
{
    /** Called under the shared calendar lock; old pointer fields remain compatible. */
    public function synchronizePointers(AcademicOffering $offering, array $previous, ?int $actorId): void
    {
        foreach (['lead' => 'professor_id', 'primary_assistant' => 'assistant_professor_id'] as $role => $field) {
            $before = $previous[$field] ?? null;
            $after = $offering->$field;
            if ((int) $before === (int) $after) {
                continue;
            }
            $hadHistory = $offering->assignments()->where('role', $role)->exists();
            $assignment = $offering->assignments()->where('role', $role)->whereNull('ends_at')->first();
            if ($assignment) {
                $assignment->update(['ends_at' => now(), 'active_key' => null]);
            } elseif ($before) {
                $offering->assignments()->create(['professor_id' => $before, 'role' => $role, 'ends_at' => now(), 'assigned_by' => $actorId]);
            }
            if ($after) {
                $offering->assignments()->create([
                    'professor_id' => $after, 'role' => $role, 'starts_at' => $hadHistory || $before ? now() : null,
                    'active_key' => $offering->id.':'.$role, 'assigned_by' => $actorId,
                ]);
            }
        }
    }

    public function ensureAvailable(AcademicOffering $offering, int $professorId): void
    {
        if (! $offering->exists) {
            return;
        }
        // Use one correlated query instead of loading every session in the institution.
        $conflict = AcademicSession::where('academic_offering_id', $offering->id)->whereNull('cancelled_at')
            ->when($offering->curriculum_item_id, fn ($q) => $q->where('starts_at', '>=', now()))
            ->whereExists(function ($other) use ($offering, $professorId) {
                $other->selectRaw('1')->from('academic_sessions as other_session')
                    ->join('academic_offerings as other_offer', 'other_offer.id', '=', 'other_session.academic_offering_id')
                    ->where('other_offer.id', '!=', $offering->id)->whereNull('other_offer.archived_at')->whereNull('other_session.cancelled_at')
                    ->whereColumn('other_session.starts_at', '<', 'academic_sessions.ends_at')
                    ->whereColumn('other_session.ends_at', '>', 'academic_sessions.starts_at')
                    ->where(fn ($q) => $q->where('other_offer.professor_id', $professorId)->orWhere('other_offer.assistant_professor_id', $professorId)
                        ->orWhereExists(fn ($assignment) => $assignment->selectRaw('1')->from('academic_teaching_assignments as team')
                            ->whereColumn('team.academic_offering_id', 'other_offer.id')->where('team.professor_id', $professorId)->whereNull('team.ends_at')));
            })->exists();
        $blocked = AcademicSession::where('academic_offering_id', $offering->id)->whereNull('cancelled_at')->where('starts_at', '>=', now())
            ->whereExists(fn ($block) => $block->selectRaw('1')->from('academic_resource_blocks as b')
                ->where('b.professor_id', $professorId)->whereNull('b.released_at')
                ->whereColumn('b.starts_at', '<', 'academic_sessions.ends_at')->whereColumn('b.ends_at', '>', 'academic_sessions.starts_at'))->exists();
        if ($blocked) {
            throw ValidationException::withMessages(['professor_id' => 'Cet enseignant est indisponible sur un créneau à venir de l’offre.']);
        }
        if ($conflict) {
            throw ValidationException::withMessages(['professor_id' => 'Cette personne est déjà affectée à une séance sur l’un des créneaux à venir.']);
        }
    }

    public function change(AcademicOffering $offering, User $actor, array $data): void
    {
        TeachingScope::authorize($actor, (int) $offering->level->faculty_id);
        DB::transaction(function () use ($offering, $actor, $data) {
            AcademicYear::orderBy('id')->lockForUpdate()->firstOrFail();
            $offering = AcademicOffering::lockForUpdate()->findOrFail($offering->id);
            $professor = Professor::lockForUpdate()->findOrFail($data['professor_id']);
            if ($offering->archived_at || ! in_array($offering->academicYear->status, ['draft', 'open'], true)) {
                throw ValidationException::withMessages(['offering' => 'Cette offre ne peut plus recevoir de nouvelles affectations.']);
            }
            $role = $data['role'];
            $field = match ($role) {
                'lead' => 'professor_id', 'primary_assistant' => 'assistant_professor_id', default => null
            };
            $remove = ($data['action'] ?? 'assign') === 'end';
            if ($field) {
                $before = $offering->only(['professor_id', 'assistant_professor_id']);
                if ($remove || (int) $offering->$field === $professor->id) {
                    if (! $remove || (int) $offering->$field !== $professor->id) {
                        return;
                    }
                    if ($role === 'lead' && $offering->is_published) {
                        throw ValidationException::withMessages(['professor_id' => 'Remplacez le responsable de l’offre publiée.']);
                    }
                }
                if (! $remove) {
                    $this->validateMember($offering, $professor, $role);
                }
                $offering->update([$field => $remove ? null : $professor->id]);
                $this->synchronizePointers($offering, $before, $actor->id);
            } else {
                $key = $offering->id.':'.$role.':'.$professor->id;
                $assignment = $offering->assignments()->where('active_key', $key)->first();
                if ($remove && $assignment) {
                    $assignment->update(['ends_at' => now(), 'active_key' => null]);
                } elseif (! $remove && ! $assignment) {
                    $this->validateMember($offering, $professor, $role);
                    $offering->assignments()->create(['professor_id' => $professor->id, 'role' => $role, 'active_key' => $key, 'starts_at' => now(), 'assigned_by' => $actor->id]);
                } else {
                    return;
                }
            }
            Audit::record($actor->id, $remove ? 'teaching_assignment_ended' : 'teaching_member_assigned', $offering, $data['reason'], [
                'role' => $role, 'professor_id' => $professor->id, 'previous_professor_id' => $field ? $before[$field] : null,
            ]);
        }, 3);
    }

    private function validateMember(AcademicOffering $offering, Professor $professor, string $role): void
    {
        $pointerConflict = ($role !== 'lead' && (int) $offering->professor_id === $professor->id)
            || ($role !== 'primary_assistant' && (int) $offering->assistant_professor_id === $professor->id);
        if (! $professor->is_active || $pointerConflict
            || $offering->assignments()->where('professor_id', $professor->id)->where('role', '!=', $role)->whereNull('ends_at')->exists()) {
            throw ValidationException::withMessages(['professor_id' => 'Choisissez un enseignant actif sans autre rôle sur cette offre.']);
        }
        $this->ensureAvailable($offering, $professor->id);
    }

    public static function idsAt(AcademicOffering $offering, CarbonInterface $at): array
    {
        $offering->loadMissing('assignments');
        $history = $offering->assignments;
        $ids = $history->filter(fn ($assignment) => (! $assignment->starts_at || $assignment->starts_at <= $at)
            && (! $assignment->ends_at || $assignment->ends_at > $at))->pluck('professor_id')->all();
        foreach (['lead' => 'professor_id', 'primary_assistant' => 'assistant_professor_id'] as $role => $field) {
            if ($offering->$field && ! $history->contains('role', $role)) {
                $ids[] = $offering->$field;
            }
        }

        return array_unique($ids);
    }

    public static function leadNameAt(AcademicOffering $offering, CarbonInterface $at): ?string
    {
        $offering->loadMissing('assignments.professor', 'professor');
        $history = $offering->assignments->where('role', 'lead');

        return $history->isEmpty() ? $offering->professor?->full_name : $history
            ->first(fn ($row) => (! $row->starts_at || $row->starts_at <= $at) && (! $row->ends_at || $row->ends_at > $at))?->professor?->full_name;
    }
}
