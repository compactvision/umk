<?php

namespace Database\Seeders;

use App\Models\Courses;
use App\Models\Level;
use App\Models\LevelDetail;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ProposedCurriculaSeeder extends Seeder
{
    public function run(?array $levelIds = null): void
    {
        // Editorial proposals, not an official accredited curriculum.
        $programs = json_decode(file_get_contents(__DIR__.'/data/proposed-curricula.json'), true, flags: JSON_THROW_ON_ERROR);
        DB::transaction(function () use ($programs, $levelIds) {
            foreach (Level::with('faculty')->when($levelIds !== null, fn ($query) => $query->whereKey($levelIds))->orderBy('id')->get() as $level) {
                $semesters = $programs[$level->faculty->code][$level->code] ?? null;
                if (! $semesters) {
                    throw new \RuntimeException("Programme absent pour le niveau {$level->id}.");
                }
                Level::whereKey($level->id)->lockForUpdate()->firstOrFail();
                $detail = LevelDetail::firstOrCreate(['level_id' => $level->id]);
                if ($detail->credit_required === null) {
                    $detail->credit_required = 60;
                    $detail->save();
                }
                $weights = [6, 6, 5, 5, 4, 4];
                $missing = [];
                foreach ($semesters as $index => $titles) {
                    foreach ($titles as $position => $title) {
                        $code = $level->faculty->code.'-'.$level->code.'-'.($index + 1).str_pad((string) ($position + 1), 2, '0', STR_PAD_LEFT);
                        if (Courses::where('level_id', $level->id)->where(fn ($q) => $q->where('code', $code)->orWhere('title', $title))->exists()) {
                            continue;
                        }
                        $missing[] = ['level_id' => $level->id, 'title' => $title, 'code' => $code, 'semester' => $index + 1, 'credits' => $weights[$position], 'description' => 'Proposition pédagogique à valider par la faculté.'];
                    }
                }
                $used = (int) Courses::where('level_id', $level->id)->sum('credits');
                if ($used + array_sum(array_column($missing, 'credits')) > $detail->credit_required) {
                    throw new \RuntimeException("Le programme proposé dépasse le plafond du niveau {$level->id}. Aucun cours n’a été ajouté.");
                }
                foreach ($missing as $data) {
                    (new Courses)->forceFill($data)->save();
                }
                $detail->update(['courses_number' => Courses::where('level_id', $level->id)->count()]);
            }
        });
    }
}
