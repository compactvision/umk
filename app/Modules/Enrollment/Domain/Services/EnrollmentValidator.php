<?php

namespace App\Modules\Enrollment\Domain\Services;

use App\Models\Enrollment;
use App\Modules\Enrollment\Domain\Exceptions\InvalidEnrollmentStateException;

class EnrollmentValidator
{
    /**
     * Vérifie qu'une inscription peut être soumise
     * 
     * @throws InvalidEnrollmentStateException
     */
    public function canSubmit(Enrollment $enrollment): void
    {
        $snapshot = $enrollment->form_snapshot ?? [];
        
        // Vérifier les champs obligatoires de base
        if (empty($snapshot['faculty_id'])) {
            throw new InvalidEnrollmentStateException('La faculté doit être sélectionnée');
        }
        
        if (empty($snapshot['level_id'])) {
            throw new InvalidEnrollmentStateException('Le niveau doit être sélectionné');
        }
        
        if (empty($snapshot['year_id'])) {
            throw new InvalidEnrollmentStateException('L\'année académique doit être sélectionnée');
        }
        
        if (empty($snapshot['name'])) {
            throw new InvalidEnrollmentStateException('Le nom complet est requis');
        }
        
        if (empty($snapshot['email'])) {
            throw new InvalidEnrollmentStateException('L\'adresse email est requise');
        }
        
        if (empty($snapshot['program'])) {
            throw new InvalidEnrollmentStateException('Le programme d\'études est requis');
        }
        
        // Vérifier la confirmation
        if (empty($snapshot['isConfirmed'])) {
            throw new InvalidEnrollmentStateException('Vous devez confirmer l\'exactitude des informations');
        }
    }
}
