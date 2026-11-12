<?php

namespace App\Modules\LevelDetail\Application\Services;

use App\Models\Courses;
use App\Models\Level;
use App\Models\LevelDetail;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CourseCatalog
{
    public function save(int $levelId, array $data, ?int $courseId = null): Courses
    {
        return DB::transaction(function () use ($levelId, $data, $courseId) {
            Level::whereKey($levelId)->lockForUpdate()->firstOrFail();
            $limit = LevelDetail::where('level_id', $levelId)->value('credit_required');
            if ($limit === null) {
                throw ValidationException::withMessages(['credits' => 'Configurez le plafond de crédits du niveau avant d’ajouter des cours.']);
            }
            $course = $courseId ? Courses::where('level_id', $levelId)->findOrFail($courseId) : new Courses;
            if ($courseId && $course->catalog_status === 'archived') {
                throw ValidationException::withMessages(['course' => 'Une matière archivée ne peut plus être modifiée.']);
            }
            $used = (int) Courses::where('level_id', $levelId)->when($courseId, fn ($query) => $query->where('id', '!=', $courseId))->sum('credits');
            if ($used + (int) $data['credits'] > (int) $limit) {
                throw ValidationException::withMessages(['credits' => "Le plafond de {$limit} crédits serait dépassé. Crédits disponibles : ".max(0, $limit - $used).'.']);
            }
            if (array_key_exists('code', $data) || ! $courseId) {
                $code = trim((string) ($data['code'] ?? ''));
                $normalized = mb_strtolower($code);
                if (! $courseId || $normalized !== mb_strtolower(trim((string) $course->code))) {
                    if ($normalized !== '' && Courses::where('level_id', $levelId)->when($courseId, fn ($query) => $query->whereKeyNot($courseId))
                        ->whereNotNull('code')->pluck('code')->contains(fn ($value) => mb_strtolower(trim($value)) === $normalized)) {
                        throw ValidationException::withMessages(['code' => 'Ce code existe déjà dans le catalogue de ce niveau.']);
                    }
                    $data['catalog_code_key'] = $normalized === '' ? null : hash('sha256', $levelId.':'.$normalized);
                }
                $data['code'] = $code === '' ? null : $code;
            }
            $course->forceFill($data + ['level_id' => $levelId])->save();

            return $course;
        });
    }
}
