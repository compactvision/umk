<?php

namespace App\Modules\Student\Application\Services;

use App\Models\Student\StudentPayment;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final class FinanceReconciliationService
{
    public function __construct(private StudentFinanceService $finance) {}

    public function preview(User $actor, string $csv): array
    {
        abort_unless($actor->hasRole('admin') && $actor->can('manage academic finance'), 403);
        $stream = fopen('php://temp', 'w+');
        fwrite($stream, $csv);
        rewind($stream);
        $header = fgetcsv($stream, 0, ',', '"', '');
        if ($header !== ['bank_reference', 'payment_reference', 'amount', 'currency', 'date']) {
            throw ValidationException::withMessages(['file' => 'Colonnes attendues : bank_reference,payment_reference,amount,currency,date.']);
        }
        $rows = [];
        $seen = [];
        try {
            while (($line = fgetcsv($stream, 0, ',', '"', '')) !== false) {
                if ($line === [null]) {
                    continue;
                }
                if (count($rows) >= config('finance.max_import_rows') || count($line) !== 5) {
                    throw ValidationException::withMessages(['file' => 'Format CSV invalide ou limite de lignes dépassée.']);
                }
                $row = array_combine($header, $line);
                validator($row, ['bank_reference' => 'required|string|max:180', 'payment_reference' => 'required|string|max:180', 'currency' => 'required|regex:/^[A-Z]{3}$/', 'date' => 'required|date_format:Y-m-d'])->validate();
                $row['amount_cents'] = Money::cents($row['amount']);
                $payment = StudentPayment::where('reference', $row['payment_reference'])->first();
                $allowed = $payment && $actor->can('view', $payment->enrollment);
                $row['state'] = isset($seen[$row['bank_reference']]) ? 'duplicate' : (! $allowed ? 'unmatched' : (($payment->currency !== $row['currency'] || (int) $payment->amount_cents !== $row['amount_cents'] || ! in_array($payment->status, ['pending', 'confirmed'], true)) ? 'mismatch' : 'match'));
                $row['payment_id'] = $allowed && $row['state'] === 'match' ? $payment->id : null;
                $seen[$row['bank_reference']] = true;
                $rows[] = $row;
            }
        } finally {
            fclose($stream);
        }
        if (! $rows) {
            throw ValidationException::withMessages(['file' => 'Le fichier ne contient aucune opération.']);
        }

        return $rows;
    }

    public function commit(User $actor, string $account, array $rows, string $reason): void
    {
        DB::transaction(function () use ($actor, $account, $rows, $reason) {
            foreach ($rows as $row) {
                if ($row['state'] !== 'match') {
                    throw ValidationException::withMessages(['rows' => 'Sélectionnez uniquement des correspondances exactes.']);
                }
                $payment = StudentPayment::lockForUpdate()->findOrFail($row['payment_id']);
                $this->finance->authorize($payment->enrollment, $actor);
                if ($payment->reference !== $row['payment_reference'] || $payment->currency !== $row['currency'] || (int) $payment->amount_cents !== $row['amount_cents']) {
                    throw ValidationException::withMessages(['rows' => 'L’écriture a changé depuis la prévisualisation.']);
                }
                $old = DB::table('finance_bank_lines')->where('account', $account)->where('bank_reference', $row['bank_reference'])->first();
                if ($old) {
                    if ((int) $old->student_payment_id === (int) $payment->id && (int) $old->amount_cents === $row['amount_cents'] && $old->currency === $row['currency'] && $old->operation_date === $row['date']) {
                        continue;
                    }
                    throw ValidationException::withMessages(['rows' => 'Cette opération bancaire est déjà rapprochée avec une autre écriture.']);
                }
                $this->finance->transition($payment, $actor, 'confirmed', $reason);
                $id = DB::table('finance_bank_lines')->insertGetId(['account' => $account, 'bank_reference' => $row['bank_reference'], 'payment_reference' => $row['payment_reference'], 'amount_cents' => $row['amount_cents'], 'currency' => $row['currency'], 'operation_date' => $row['date'], 'student_payment_id' => $payment->id, 'reconciled_by' => $actor->id, 'created_at' => now()]);
                Audit::record($actor->id, 'payment_reconciled', $payment, $reason, ['bank_line_id' => $id]);
            }
        }, 3);
    }
}
