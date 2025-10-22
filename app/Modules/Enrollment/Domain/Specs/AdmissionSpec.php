<?php

namespace App\Modules\Enrollment\Domain\Specs;


use App\Models\Enrollment;
use App\Modules\Enrollment\Domain\Enums\EnrollmentStatus;
use App\Modules\Enrollment\Domain\Services\RequiredDocumentProvider;


final class AdmissionSpec
{
    public static function canSubmit(Enrollment $enrollment, RequiredDocumentProvider $provider): bool
    {
        if ($enrollment->status !== EnrollmentStatus::DRAFT) {
            return false;
        }
        
        $required = $provider->listForLevel($enrollment->level_id);
        $present = $enrollment->documents()->pluck('type')->unique()->all();
        foreach ($required as $code) {
            if (!in_array($code, $present, true)) return false;
        }
        return true;
    }
}
