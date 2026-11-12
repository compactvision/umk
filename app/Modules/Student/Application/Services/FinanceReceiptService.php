<?php

namespace App\Modules\Student\Application\Services;

use App\Models\AcademicStructure\University;
use App\Models\Student\AcademicEnrollment;
use App\Models\Student\StudentPayment;

final class FinanceReceiptService
{
    public function capture(StudentPayment $payment, AcademicEnrollment $entry): void
    {
        if ($payment->receipt_snapshot || ! $payment->confirmed_at) {
            return;
        }
        FinanceMutation::run(fn () => $payment->update(['receipt_snapshot' => [
            'reference' => $payment->reference, 'uuid' => $payment->uuid, 'amount_cents' => (int) $payment->amount_cents, 'currency' => $payment->currency, 'method' => $payment->method,
            'name' => trim(implode(' ', array_filter([$entry->profile->user->last_name, $entry->profile->user->post_name, $entry->profile->user->first_name]))),
            'matricule' => $entry->profile->matricule ?? $entry->matricule, 'faculty' => $entry->level->faculty->name, 'level' => $entry->level->title, 'year' => $entry->academicYear->title,
            'institution' => University::where('context_key', 'current')->value('name') ?? config('app.name'), 'confirmed_at' => $payment->confirmed_at->toIso8601String(), 'confirmed_by' => $payment->confirmed_by,
        ]]));
    }
}
