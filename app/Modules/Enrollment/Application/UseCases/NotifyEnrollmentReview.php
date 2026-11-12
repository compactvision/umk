<?php

namespace App\Modules\Enrollment\Application\UseCases;

use App\Mail\EnrollmentReviewUpdated;
use App\Models\Enrollment;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

final class NotifyEnrollmentReview
{
    public function afterCommit(int $id, string $kind, array $remarks = []): void
    {
        DB::afterCommit(function () use ($id, $kind, $remarks) {
            $enrollment = Enrollment::with(['student', 'level'])->find($id);
            if (! $enrollment?->student) {
                return;
            }
            try {
                Mail::to($enrollment->student->email)->send(new EnrollmentReviewUpdated($enrollment, $kind, $remarks));
                $event = 'email_sent';
            } catch (\Throwable $exception) {
                Log::error('Échec de notification du dossier', ['enrollment_id' => $id, 'kind' => $kind]);
                $event = 'email_failed';
            }
            $enrollment->events()->create(['event' => $event, 'payload' => ['notification' => $kind], 'occurred_at' => now()]);
        });
    }
}
