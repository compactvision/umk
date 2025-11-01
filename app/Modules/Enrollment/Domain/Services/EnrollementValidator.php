<?php

namespace App\Modules\Enrollment\Domain\Services;

use App\Models\Enrollment;
use App\Modules\Enrollment\Domain\Exceptions\InvalidEnrollmentStateException;

class EnrollmentValidator
{
    public function canSubmit(Enrollment $enrollment): void
    {
        $errors = [];
        
        // Vérifier les champs obligatoires
        if (empty($enrollment->level_id)) {
            $errors[] = "Le niveau est obligatoire";
        }
        
        if (empty($enrollment->academic_year_id)) {
            $errors[] = "L'année académique est obligatoire";
        }
        
        $snapshot = $enrollment->form_snapshot ?? [];
        
        if (empty($snapshot['name'])) {
            $errors[] = "Le nom est obligatoire";
        }
        
        if (empty($snapshot['email'])) {
            $errors[] = "L'email est obligatoire";
        }
        
        // Vérifier les documents obligatoires
        $requiredDocs = $this->getRequiredDocuments($enrollment);
        $uploadedDocs = array_keys($snapshot['documents'] ?? []);
        
        foreach ($requiredDocs as $docKey) {
            if (!in_array($docKey, $uploadedDocs)) {
                $errors[] = "Document manquant: {$docKey}";
            }
        }
        
        if (!empty($errors)) {
            throw InvalidEnrollmentStateException::cannotSubmitDraft(implode(', ', $errors));
        }
    }
    
    private function getRequiredDocuments(Enrollment $enrollment): array
    {
        // Logique pour déterminer les documents requis selon le niveau
        return ['id_card', 'photo']; // Exemple basique
    }
}