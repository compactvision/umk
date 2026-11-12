import AdminModal from '@/components/admin/AdminModal';
import { formatPrice, hasPrice, paymentCategories, paymentTotal } from '@/lib/levelPricing';
import {
    Award,
    Banknote,
    BookOpen,
    BriefcaseBusiness,
    Clock3,
    Coins,
    ImageIcon,
    Info,
    Languages,
    Layers3,
    Pencil,
    Target,
    Upload,
    Users,
} from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import '../../../../../css/dashboard/level-forms.css';
import { getFieldLabel, illustrationUrl } from '../utils/levelUtils';
type FieldValue = string | number | boolean | string[] | File | null | undefined;
type LevelDataHook = ReturnType<typeof import('../hooks/useLevelData').useLevelData>;
const fieldDetails = {
    credit_required: { icon: Layers3, hint: 'Le nombre de crédits à valider pour ce niveau.', placeholder: 'Ex. : 60', unit: 'crédits' },
    duration_years: { icon: Clock3, hint: 'La durée totale du parcours, exprimée en années.', placeholder: 'Ex. : 3', unit: 'années' },
    courses_number: { icon: BookOpen, hint: 'Le nombre de cours proposés dans le programme.', placeholder: 'Ex. : 12', unit: 'cours' },
    student_number: { icon: Users, hint: 'L’effectif étudiant associé à ce niveau.', placeholder: 'Ex. : 120', unit: 'étudiants' },
    price: { icon: Banknote, hint: 'Le tarif de la formation pour les étudiants nationaux, en dollars.', placeholder: 'Ex. : 250', unit: 'USD' },
    price_foreign: {
        icon: Banknote,
        hint: 'Le tarif de la formation pour les étudiants étrangers, en dollars.',
        placeholder: 'Ex. : 350',
        unit: 'USD',
    },
    fees: { icon: Coins, hint: 'Les frais complémentaires, exprimés en dollars.', placeholder: 'Ex. : 50', unit: 'USD' },
    language: { icon: Languages, hint: 'La langue utilisée pour les enseignements du parcours.', placeholder: 'Ex. : Français', unit: '' },
    has_certificate: { icon: Award, hint: 'Précisez si une certification est délivrée à l’issue du parcours.', placeholder: '', unit: '' },
    options: {
        icon: BriefcaseBusiness,
        hint: 'Présentez les débouchés accessibles à l’issue de cette formation.',
        placeholder: 'Ex. : Chargé de projet, Consultant, Chercheur',
        unit: '',
    },
    course_objective: {
        icon: Target,
        hint: 'Décrivez les connaissances et les compétences à acquérir.',
        placeholder: 'À l’issue de ce parcours, les étudiants seront capables de…',
        unit: '',
    },
    illustration_image: { icon: ImageIcon, hint: 'Choisissez un visuel qui représente le programme.', placeholder: '', unit: '' },
};
export default function EditModal({
    isOpen,
    editField,
    levelDataHook,
    onClose,
    onSave,
    saving = false,
    saveErrors = {},
}: {
    isOpen: boolean;
    editField: string;
    levelDataHook: LevelDataHook;
    onClose: () => void;
    onSave: (hook: LevelDataHook) => void;
    saving?: boolean;
    saveErrors?: Record<string, string | undefined>;
}) {
    const [preview, setPreview] = useState('');
    const [fileError, setFileError] = useState('');
    const value = levelDataHook.getFieldValue(editField);
    const image = editField === 'illustration_image' ? levelDataHook.draft.illustration_image : undefined;
    useEffect(() => {
        setFileError('');
        if (image instanceof File) {
            const url = URL.createObjectURL(image);
            setPreview(url);
            return () => URL.revokeObjectURL(url);
        }
        setPreview(illustrationUrl(image));
    }, [image, isOpen]);
    if (!isOpen) return null;
    const detail = fieldDetails[editField as keyof typeof fieldDetails] || {
        icon: Pencil,
        hint: 'Ajustez cette information du programme.',
        placeholder: 'Saisissez la nouvelle valeur…',
        unit: '',
    };
    const numeric = ['credit_required', 'duration_years', 'courses_number', 'price', 'price_foreign', 'fees', 'student_number'].includes(editField);
    const textArea = ['description', 'options', 'course_objective'].includes(editField);
    const pricing = ['price', 'price_foreign'].includes(editField);
    const label = pricing ? 'Tarifs de la formation' : getFieldLabel(editField);
    const error = fileError || saveErrors[editField];
    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!fileError) onSave(levelDataHook);
    };
    return (
        <AdminModal
            title="Affiner le programme."
            description="Une information précise pour un parcours bien défini."
            onClose={onClose}
            formId="level-edit-field-form"
            submitLabel="Enregistrer la modification"
            busy={saving}
            errors={saveErrors}
            className="level-form-modal lf-edit-modal"
        >
            <form id="level-edit-field-form" onSubmit={submit} className="admin-modal-form lf-edit-form">
                <fieldset className="lf-fields" disabled={saving}>
                    <div className="lf-edit-context">
                        <span className="lf-context-icon">
                            <detail.icon size={25} strokeWidth={1.4} />
                        </span>
                        <div>
                            <span className="lf-eyebrow">INFORMATION DU PARCOURS</span>
                            <h3>{label}</h3>
                            <p>{pricing ? 'Définissez les montants en dollars pour chaque catégorie d’étudiant.' : detail.hint}</p>
                        </div>
                    </div>
                    {editField === 'has_certificate' ? (
                        <label className="lf-switch-card" htmlFor="level-edit-field">
                            <span className="lf-switch-copy">
                                <strong>Délivrer un certificat</strong>
                                <small>
                                    {value ? 'Une certification est prévue à l’issue du parcours.' : 'Ce parcours ne prévoit pas de certificat.'}
                                </small>
                            </span>
                            <input
                                id="level-edit-field"
                                type="checkbox"
                                role="switch"
                                checked={!!value}
                                onChange={(e) => levelDataHook.updateField(editField, e.target.checked)}
                            />
                            <span className="lf-switch-track" aria-hidden="true" />
                        </label>
                    ) : pricing ? (
                        <div className="lf-pricing-fields">
                            {paymentCategories.map((category) => {
                                const first = levelDataHook.getFieldValue(category.first);
                                const second = levelDataHook.getFieldValue(category.second);
                                const oldTotal = levelDataHook.getFieldValue(category.total);
                                const amount = (value: FieldValue) => (typeof value === 'number' || typeof value === 'string' ? value : null);
                                return (
                                    <section className="lf-payment-category" key={category.total}>
                                        <h4>Étudiants {category.label.toLocaleLowerCase('fr')}</h4>
                                        {[
                                            { field: category.first, label: 'Première tranche' },
                                            { field: category.second, label: 'Deuxième tranche' },
                                        ].map((part) => {
                                            const value = levelDataHook.getFieldValue(part.field);
                                            return (
                                                <div className="lf-payment-input" key={part.field}>
                                                    <label className="lf-label" htmlFor={`level-tariff-${part.field}`}>
                                                        {part.label}
                                                    </label>
                                                    <div className="lf-value-input">
                                                        <input
                                                            id={`level-tariff-${part.field}`}
                                                            type="number"
                                                            min="0"
                                                            max="99999999.99"
                                                            step="0.01"
                                                            value={amount(value) ?? ''}
                                                            onChange={(event) =>
                                                                levelDataHook.updateField(
                                                                    part.field,
                                                                    event.target.value === '' ? '' : Number(event.target.value),
                                                                )
                                                            }
                                                            placeholder="Montant"
                                                            aria-invalid={!!saveErrors[part.field]}
                                                        />
                                                        <span>USD</span>
                                                    </div>
                                                    {saveErrors[part.field] && (
                                                        <p className="lf-error" role="alert">
                                                            {saveErrors[part.field]}
                                                        </p>
                                                    )}
                                                </div>
                                            );
                                        })}
                                        <div className="lf-payment-total">
                                            <span>Total calculé</span>
                                            <output aria-live="polite">
                                                {formatPrice(paymentTotal(amount(first), amount(second), amount(oldTotal)))}
                                            </output>
                                        </div>
                                        {!hasPrice(amount(first)) && !hasPrice(amount(second)) && Number(oldTotal) > 0 && (
                                            <p className="lf-help">Total existant conservé ; répartition en tranches à renseigner.</p>
                                        )}
                                        <p className="lf-help">Renseignez les deux tranches, ou laissez-les toutes deux vides.</p>
                                    </section>
                                );
                            })}
                        </div>
                    ) : editField === 'illustration_image' ? (
                        <div className="lf-upload-section">
                            <input
                                id="level-edit-field"
                                className="lf-file-input"
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                aria-label="Choisir une illustration du programme"
                                aria-describedby="level-field-help"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 2 * 1024 * 1024) {
                                        setFileError('Choisissez une image JPG, PNG ou WebP de 2 Mo maximum.');
                                        e.target.value = '';
                                        return;
                                    }
                                    setFileError('');
                                    levelDataHook.updateField(editField, file);
                                }}
                            />
                            <label className="lf-upload" htmlFor="level-edit-field">
                                <Upload size={28} strokeWidth={1.4} />
                                <strong>{image instanceof File ? image.name : 'Choisir une illustration'}</strong>
                                <span>Cliquez pour sélectionner un fichier</span>
                            </label>
                            <p id="level-field-help" className="lf-help">
                                JPG, PNG ou WebP · 2 Mo maximum
                            </p>
                            {preview && (
                                <figure className="lf-image-preview">
                                    <img src={preview} alt="Aperçu de l’illustration du programme" />
                                    <figcaption>
                                        {image instanceof File
                                            ? 'Nouvelle illustration · Aperçu avant enregistrement'
                                            : 'Illustration actuelle du programme'}
                                    </figcaption>
                                </figure>
                            )}
                        </div>
                    ) : (
                        <div>
                            <label className="lf-label" htmlFor="level-edit-field">
                                {label}
                            </label>
                            {textArea ? (
                                <textarea
                                    id="level-edit-field"
                                    rows={editField === 'course_objective' ? 7 : 5}
                                    value={Array.isArray(value) ? value.join(', ') : String(value ?? '')}
                                    onChange={(e) => levelDataHook.updateField(editField, e.target.value)}
                                    placeholder={detail.placeholder}
                                    aria-invalid={!!error}
                                    aria-describedby="level-field-help"
                                />
                            ) : (
                                <div className="lf-value-input">
                                    <input
                                        id="level-edit-field"
                                        type={numeric ? 'number' : 'text'}
                                        value={typeof value === 'number' || typeof value === 'string' ? value : ''}
                                        min={numeric ? 0 : undefined}
                                        required={editField === 'duration_years'}
                                        step={['price', 'price_foreign'].includes(editField) ? '0.01' : numeric ? '1' : undefined}
                                        maxLength={editField === 'language' ? 50 : undefined}
                                        onChange={(e) =>
                                            levelDataHook.updateField(
                                                editField,
                                                numeric ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value,
                                            )
                                        }
                                        placeholder={detail.placeholder}
                                        aria-invalid={!!error}
                                        aria-describedby="level-field-help"
                                    />
                                    {detail.unit && <span>{detail.unit}</span>}
                                </div>
                            )}
                            <p id="level-field-help" className="lf-help">
                                {editField === 'options'
                                    ? 'Séparez chaque opportunité par une virgule.'
                                    : numeric
                                      ? 'Saisissez une valeur positive ou égale à zéro.'
                                      : detail.hint}
                            </p>
                        </div>
                    )}
                    {error && (
                        <p className="lf-error" role="alert">
                            {error}
                        </p>
                    )}
                    <div className="lf-edit-note">
                        <Info size={16} strokeWidth={1.6} />
                        <p>La modification sera appliquée au niveau après l’enregistrement.</p>
                    </div>
                </fieldset>
            </form>
        </AdminModal>
    );
}
