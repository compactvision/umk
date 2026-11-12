<?php

namespace App\Modules\Progression\Application;

use App\Models\Student\AcademicEnrollment;
use App\Notifications\AcademicEnrollmentChanged;
use Illuminate\Support\Facades\DB;
use Throwable;

final class ProgressionNotice
{
    public static function publish(AcademicEnrollment $entry, string $event, string $reference): void
    {
        DB::afterCommit(function () use ($entry, $event, $reference) {
            try {
                $entry->profile->user->notify(new AcademicEnrollmentChanged([
                    'academic_enrollment_id' => $entry->id, 'reference' => $reference,
                    'status' => $event, 'progression' => true,
                ]));
            } catch (Throwable $error) {
                report($error);
            }
        });
    }
}
