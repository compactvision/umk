// resources/js/pages/enrollment/utils/validators.ts
import { FormData, PaymentStage, Requirements } from '../types';

export function validateStep(
    step: number,
    formData: FormData,
    requirements: Requirements,
    noLevelsForSelectedFaculty: boolean,
    isConfirmed: boolean,
    paymentStage: PaymentStage,
) {
    const errors: Record<string, string> = {};

    switch (step) {
        case 1:
            if (!formData.faculty_id) errors.faculty_id = 'Veuillez sélectionner une faculté';
            if (!formData.year_id) errors.year_id = 'Veuillez sélectionner une année';
            if (!noLevelsForSelectedFaculty && !formData.level_id) errors.level_id = 'Veuillez sélectionner un niveau';
            break;

        case 2:
            if (!formData.name) errors.name = 'Veuillez entrer votre nom complet';
            if (!formData.email) errors.email = 'Veuillez entrer votre adresse email';
            else if (!/^\S+@\S+\.\S+$/.test(formData.email)) errors.email = 'Veuillez entrer une adresse email valide';
            requirements.personal_info.forEach((d) => {
                if (d.required && !formData.documents[d.key]) errors[d.key] = `Veuillez télécharger ${d.label}`;
            });
            break;

        case 3:
            if (!formData.program) errors.program = "Veuillez entrer votre programme d'études";
            requirements.academic_info.forEach((d) => {
                if (d.required && !formData.documents[d.key]) errors[d.key] = `Veuillez télécharger ${d.label}`;
            });
            break;

        case 4:
            if (!isConfirmed) errors.confirmed = "Veuillez confirmer l'exactitude des informations";
            if (paymentStage === 'pay') {
                if (!formData.cardNumber) errors.cardNumber = 'Veuillez entrer votre numéro de carte';
                else if (!/^\d{16}$/.test(formData.cardNumber.replace(/\s/g, ''))) errors.cardNumber = 'Numéro de carte invalide';

                if (!formData.cvv) errors.cvv = 'Veuillez entrer votre code CVV';
                else if (!/^\d{3}$/.test(formData.cvv)) errors.cvv = 'Code CVV invalide';
            }
            break;
    }

    return errors;
}
