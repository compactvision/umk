<?php

namespace App\Modules\Student\Application\Services;

use App\Models\Student\AcademicAudit;
use Illuminate\Database\Eloquent\Model;

final class Audit
{
    public static function record(?int $actor, string $action, Model $entity, ?string $reason = null, array $data = []): void
    {
        AcademicAudit::create(['actor_id' => $actor, 'action' => $action, 'entity_type' => $entity->getTable(), 'entity_id' => $entity->id, 'reason' => $reason, 'data' => $data]);
    }
}
