<?php

namespace App\Modules\Assessment\Application;

use App\Models\Student\AcademicEnrollment;
use App\Models\Student\AcademicResource;
use App\Notifications\AcademicAssessmentNotice;
use Illuminate\Support\Facades\DB;
use Ramsey\Uuid\Uuid;
use Throwable;

final class AssessmentNotices
{
    public static function send(AcademicEnrollment $entry, AcademicResource $resource, string $event, string $key): void
    {
        $user = $entry->profile?->user;
        if (! $user) {
            return;
        }
        $notice = new AcademicAssessmentNotice($entry->id, $resource->id, $resource->kind, $event);
        $notice->id = (string) Uuid::uuid5('2f70299d-4f81-4fd8-91b8-e84df6ca3aa1', "$event:$key:".$entry->id);
        if (config('assessment.queue_notices')) {
            DB::afterCommit(function () use ($user, $notice) {
                try {
                    $user->notify($notice);
                } catch (Throwable $error) {
                    report($error);
                }
            });

            return;
        }
        $user->notifyNow($notice);
    }
}
