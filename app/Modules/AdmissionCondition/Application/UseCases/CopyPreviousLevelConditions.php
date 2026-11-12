<?php

namespace App\Modules\AdmissionCondition\Application\UseCases;

use App\Models\Level;
use Illuminate\Support\Facades\DB;

final class CopyPreviousLevelConditions
{
    public function source(Level $target): ?Level
    {
        if (! preg_match('/^([LMD])([2-9])$/i', trim($target->code), $parts)) {
            return null;
        }

        return Level::where('faculty_id', $target->faculty_id)
            ->whereRaw('UPPER(code) = ?', [strtoupper($parts[1]).((int) $parts[2] - 1)])
            ->first();
    }

    public function execute(Level $target): int
    {
        return DB::transaction(function () use ($target) {
            $target = Level::lockForUpdate()->findOrFail($target->id);
            $source = $this->source($target);

            if (! $source) {
                return 0;
            }

            $conditions = $source->admissionConditions()
                ->where(fn ($query) => $query->where('faculty_id', $target->faculty_id)->orWhereNull('faculty_id'))
                ->orderBy('id')->get();

            $added = 0;
            foreach ($conditions as $condition) {
                $alreadyPresent = $target->admissionConditions()
                    ->where(fn ($query) => $query->where('faculty_id', $target->faculty_id)->orWhereNull('faculty_id'))
                    ->where('title', $condition->title)
                    ->where('section', $condition->section)
                    ->exists();

                if (! $alreadyPresent) {
                    $target->admissionConditions()->create($condition->only(['title', 'description', 'section', 'is_required']) + [
                        'faculty_id' => $target->faculty_id,
                    ]);
                    $added++;
                }
            }

            return $added;
        });
    }
}
