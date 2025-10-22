<?php

namespace App\Modules\Enrollment\Infrastructure\Services;


use App\Modules\Enrollment\Domain\Services\RequiredDocumentProvider;
use Illuminate\Support\Facades\DB;


final class ConditionRequiredDocumentProvider implements RequiredDocumentProvider
{
    public function listForLevel(int $levelId): array
    {
        // Suppose une table admission_conditions: level_id, doc_type
        return DB::table('admission_conditions')
            ->where('level_id', $levelId)
            ->pluck('doc_type')
            ->unique()
            ->values()
            ->all();
    }
}
