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
            $used = (int) Courses::where('level_id', $levelId)->when($courseId, fn ($query) => $query->where('id', '!=', $courseId))->sum('credits');
            if ($used + (int) $data['credits'] > (int) $limit) {
                throw ValidationException::withMessages(['credits' => "Le plafond de {$limit} crédits serait dépassé. Crédits disponibles : ".max(0, $limit - $used).'.']);
            }
            $course->forceFill($data + ['level_id' => $levelId])->save();
            return $course;
        });
    }
}
