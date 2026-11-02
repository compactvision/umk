import { FileCheck2 } from 'lucide-react';
import type { FormData, Requirements } from '../../types';
export default function Step4Payment({
    isConfirmed,
    setIsConfirmed,
    errors,
    requirements,
    formData,
    formation,
    onEdit,
}: {
    isConfirmed: boolean;
    setIsConfirmed: (checked: boolean) => void;
    errors: Record<string, string>;
    requirements: Requirements;
    formData: FormData;
    formation: { faculty: string; level: string; year: string };
    onEdit: (step: number) => void;
}) {
    return (
        <div className="enrollment-fields">
            {[
                {
                    title: 'Votre formation',
                    step: 1,
                    rows: [
                        ['Faculté', formation.faculty],
                        ['Niveau', formation.level],
                        ['Année académique', formation.year],
                    ],
                },
                {
                    title: 'Votre identité',
                    step: 2,
                    rows: [
                        ['Nom complet', formData.name],
                        ['Email', formData.email],
                    ],
                },
                {
                    title: 'Votre parcours',
                    step: 3,
                    rows: [
                        ['Programme', formData.program],
                        ['Pièces jointes', `${Object.values(formData.documents).filter(Boolean).length} document(s)`],
                    ],
                },
            ].map((section) => (
                <section key={section.title} className="enrollment-review">
                    <header>
                        <h3>{section.title}</h3>
                        <button type="button" onClick={() => onEdit(section.step)}>
                            Modifier
                        </button>
                    </header>
                    <dl>
                        {section.rows.map(([label, value]) => (
                            <div key={label}>
                                <dt>{label}</dt>
                                <dd>{value || '—'}</dd>
                            </div>
                        ))}
                    </dl>
                </section>
            ))}
            {requirements.payment && requirements.payment.amount > 0 && (
                <div className="enrollment-info">
                    <FileCheck2 size={21} />
                    <div>
                        <strong>
                            Frais indiqués : {new Intl.NumberFormat('fr-FR').format(requirements.payment.amount)} {requirements.payment.currency}
                        </strong>
                        <p>
                            La soumission de ce dossier ne déclenche aucun paiement. Contactez le service des inscriptions pour les modalités de
                            règlement.
                        </p>
                    </div>
                </div>
            )}
            <label className="enrollment-confirm">
                <input
                    id="confirmed"
                    type="checkbox"
                    checked={isConfirmed}
                    onChange={(e) => setIsConfirmed(e.target.checked)}
                    aria-invalid={!!errors.confirmed}
                    aria-describedby={errors.confirmed ? 'confirmed-error' : undefined}
                />
                <span>
                    <strong>Je certifie l’exactitude de mes informations.</strong>
                    <small>J’ai relu mon dossier et vérifié les documents joints avant de le transmettre à l’université.</small>
                </span>
            </label>
            {errors.confirmed && (
                <p id="confirmed-error" className="enrollment-field-error" role="alert">
                    {errors.confirmed}
                </p>
            )}
        </div>
    );
}
