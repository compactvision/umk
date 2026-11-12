<?php

namespace App\Modules\Results\Application;

use App\Models\Student\AcademicDeliberation;
use App\Models\Student\AcademicEnrollment;
use App\Modules\Student\Application\Services\AcademicAccessService;
use App\Notifications\OfficialResultNotice;
use Ramsey\Uuid\Uuid;
use Throwable;

final class ResultNotices
{
    public function __construct(private AcademicAccessService $access) {}

    public function publication(AcademicDeliberation $run): void
    {
        $run->results()->with(['enrollment.profile.user', 'enrollment.application', 'enrollment.academicYear'])->eachById(function ($result) use ($run) {
            if ($this->access->decision($result->enrollment, 'results_view')['allowed']) {
                $this->send($result->enrollment, 'published', (string) $run->id);
            }
        }, 100);
    }

    public function send(AcademicEnrollment $entry, string $event, string $key): void
    {
        $user = $entry->profile->user;
        $notice = new OfficialResultNotice($entry->id, $event);
        $notice->id = (string) Uuid::uuid5('29eed9cb-8072-4994-88bf-298f3286d851', "$event:$key:".$entry->id);
        try {
            if (! $user->notifications()->whereKey($notice->id)->exists()) {
                config('results.queue_notices') ? $user->notify($notice) : $user->notifyNow($notice);
            }
        } catch (Throwable $error) {
            report($error);
        }
    }
}
