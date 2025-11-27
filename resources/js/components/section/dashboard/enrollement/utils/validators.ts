// resources/js/pages/enrollment/utils/validators.ts
import { FormData, PaymentStage, Requirements } from '../types';

export function validateStep(
    step: number,
    formData: FormData,
    requirements: Requirements,
    noLevelsForSelectedFaculty: boolean,
    isConfirmed: boolean,
    paymentStage: PaymentStage,
    isFree: boolean = false,
) {
    const errors: Record<string, string> = {};

    switch (step) {
        // ... cases 1, 2, 3 unchanged

        case 4:
            if (!isConfirmed) errors.confirmed = "Veuillez confirmer l'exactitude des informations";
            // Si payant et à l'étape de paiement, on valide la carte
            if (paymentStage === 'pay' && !isFree) {
                if (!formData.cardNumber) errors.cardNumber = 'Veuillez entrer votre numéro de carte';
                else if (!/^\d{16}$/.test(formData.cardNumber.replace(/\s/g, ''))) errors.cardNumber = 'Numéro de carte invalide';

                if (!formData.cvv) errors.cvv = 'Veuillez entrer votre code CVV';
                else if (!/^\d{3}$/.test(formData.cvv)) errors.cvv = 'Code CVV invalide';
            }
            break;
    }

    return errors;
}
