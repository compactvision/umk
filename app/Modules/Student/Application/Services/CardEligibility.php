<?php

namespace App\Modules\Student\Application\Services;

use App\Models\Student\AcademicEnrollment;
use Illuminate\Database\Eloquent\Builder;

class CardEligibility
{
    public function query(): Builder
    {
        return AcademicEnrollment::with(['academicYear', 'profile.user', 'profile.cardPhotoReviews', 'level'])
            ->select('academic_enrollments.*')->selectRaw("(
                SELECT COALESCE(SUM(p.amount_cents - COALESCE((SELECT SUM(r.amount_cents) FROM student_payment_refunds r WHERE r.student_payment_id=p.id AND r.status='executed'),0)),0)
                FROM student_payments p WHERE p.academic_enrollment_id=academic_enrollments.id AND p.kind='tuition' AND p.status='confirmed' AND p.currency=academic_enrollments.currency
            ) + (
                SELECT COALESCE(SUM(a.amount_cents - COALESCE((SELECT SUM(ra.amount_cents) FROM student_refund_allocations ra WHERE ra.student_payment_allocation_id=a.id),0)),0)
                FROM student_payment_allocations a JOIN student_payments p ON p.id=a.student_payment_id JOIN student_obligations o ON o.id=a.student_obligation_id
                WHERE p.academic_enrollment_id=academic_enrollments.id AND p.kind='unallocated' AND p.status='confirmed' AND p.currency=academic_enrollments.currency AND o.kind='tuition'
            ) AS confirmed_tuition_cents")->withMin(['obligations as first_installment_cents' => fn ($query) => $query->where('kind', 'tuition')->where('installment', 1)], 'amount_cents');
    }

    public function summary(AcademicEnrollment $entry): array
    {
        $version = $entry->profile?->cardPhotoVersion();
        $card = $version ? $entry->profile->cardPhotoReviews->firstWhere('photo_version', $version) : null;
        $photo = ! $version ? 'none' : ($card?->status ?? 'pending');
        $required = $entry->first_installment_cents === null ? null : (int) $entry->first_installment_cents;
        $paid = (int) $entry->confirmed_tuition_cents;
        $reasons = array_values(array_filter([
            $entry->academicYear?->status !== 'open' ? 'L’année académique n’est pas ouverte.' : null,
            $entry->profile?->student_status !== 'active' ? 'Le dossier étudiant est inactif.' : null,
            $entry->enrollment_status !== 'confirmed' ? 'L’inscription annuelle n’est pas confirmée.' : null,
            ! filled($entry->matricule ?? $entry->profile?->matricule) ? 'Aucun matricule attribué.' : null,
            match ($photo) {
                'none' => 'Photo de profil manquante.',
                'pending' => 'Photo à vérifier.',
                'refused' => 'Photo de profil à remplacer.',
                default => null,
            },
            $required === null ? 'Première tranche non définie.' : ($paid < $required ? 'Première tranche non réglée.' : null),
        ]));

        return [
            'ready' => $reasons === [],
            'reasons' => $reasons,
            'photo_status' => $photo,
            'decision_note' => $card?->decision_note,
            'fees' => ['required' => $required, 'paid' => $paid, 'currency' => $entry->currency],
        ];
    }
}
