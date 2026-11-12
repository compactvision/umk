import type { FormData, Requirements } from '../types';
export function validateStep(
    step: number,
    formData: FormData,
    requirements: Requirements,
    noLevelsForSelectedFaculty: boolean,
    isConfirmed: boolean,
    availableProgramCount = 0,
) {
    const errors: Record<string, string> = {};
    const validateDocuments = (documents: Requirements['personal_info']) => {
        documents
            .filter((doc) => doc.required)
            .forEach((doc) => {
                const value = formData.documents[doc.key];
                if (!value?.uuid && !value?.temp?.token) errors[doc.key] = `Ajoutez le document « ${doc.label} » pour continuer.`;
            });
    };
    if (step === 1) {
        if (availableProgramCount > 1 && !formData.academic_program_id) errors.academic_program_id = 'Choisissez votre programme officiel.';
        if (!formData.faculty_id) errors.faculty_id = 'Choisissez une faculté.';
        if (!formData.level_id || noLevelsForSelectedFaculty) errors.level_id = 'Choisissez un niveau disponible.';
        if (!formData.year_id) errors.year_id = 'Choisissez une année académique.';
    }
    if (step === 2) {
        if (!formData.name.trim()) errors.name = 'Indiquez votre nom complet.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) errors.email = 'Indiquez une adresse email valide.';
        validateDocuments(requirements.personal_info);
    }
    if (step === 3) {
        if (!formData.program.trim()) errors.program = 'Indiquez votre programme d’études.';
        validateDocuments(requirements.academic_info);
    }
    if (step === 4 && !isConfirmed) errors.confirmed = 'Confirmez l’exactitude des informations avant de soumettre votre dossier.';
    return errors;
}
