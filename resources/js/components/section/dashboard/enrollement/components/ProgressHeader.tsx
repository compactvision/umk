import { Check } from 'lucide-react';
const steps = ['Formation', 'Identité', 'Parcours', 'Vérification'];
export default function ProgressHeader({ step, onStepChange }: { step: number; onStepChange?: (step: number) => void }) {
    return (
        <nav className="enrollment-stepper" aria-label="Étapes de votre inscription">
            <ol>
                {steps.map((label, index) => (
                    <li
                        key={label}
                        className={step === index + 1 ? 'is-current' : step > index + 1 ? 'is-complete' : ''}
                        aria-current={step === index + 1 ? 'step' : undefined}
                    >
                        <button type="button" disabled={index + 1 > step} onClick={() => onStepChange?.(index + 1)}>
                            <span>{step > index + 1 ? <Check size={18} /> : `0${index + 1}`}</span>
                            <div>
                                <small>ÉTAPE {index + 1}</small>
                                <strong>{label}</strong>
                            </div>
                        </button>
                    </li>
                ))}
            </ol>
        </nav>
    );
}
