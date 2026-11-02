import AdminModal from '@/components/admin/AdminModal';
import { Check, ClipboardCheck, FileCheck2, FolderOpen, GraduationCap, Info, UserRound } from 'lucide-react';
import type { FormEvent } from 'react';
import '../../../../../css/dashboard/level-forms.css';
type ConditionData = { title?: string; description?: string; section?: string; is_required?: boolean };
type Props = {
    isOpen: boolean;
    conditionMode: string;
    conditionData: ConditionData;
    onClose: () => void;
    onSave: (event: FormEvent<HTMLFormElement>) => void;
    setConditionData: (key: keyof ConditionData, value: string | boolean) => void;
    conditionProcessing: boolean;
    conditionErrors?: Record<string, string | undefined>;
};
const categories = [
    { value: 'personal_info', label: 'Dossier personnel', hint: 'Identité et pièces personnelles', icon: UserRound },
    { value: 'academic_info', label: 'Parcours académique', hint: 'Diplômes et prérequis', icon: GraduationCap },
    { value: 'other', label: 'Autres conditions', hint: 'Exigences complémentaires', icon: FolderOpen },
];
export default function ConditionModal({
    isOpen,
    conditionMode,
    conditionData,
    onClose,
    onSave,
    setConditionData,
    conditionProcessing,
    conditionErrors = {},
}: Props) {
    if (!isOpen) return null;
    const category = categories.find((item) => item.value === conditionData.section);
    const error = (field: string) =>
        conditionErrors[field] ? (
            <p id={`condition-${field}-error`} className="lf-error" role="alert">
                {conditionErrors[field]}
            </p>
        ) : null;
    return (
        <AdminModal
            title={conditionMode === 'add' ? 'Une nouvelle condition.' : 'Affiner cette condition.'}
            description="Définissez les attentes du parcours pour guider chaque candidature."
            onClose={onClose}
            formId="condition-form"
            submitLabel={conditionMode === 'add' ? 'Ajouter la condition' : 'Enregistrer les modifications'}
            busy={conditionProcessing}
            errors={conditionErrors}
            wide
            className="level-form-modal lf-condition-modal"
        >
            <form id="condition-form" onSubmit={onSave} className="admin-modal-form lf-condition-layout">
                <fieldset disabled={conditionProcessing} className="lf-fields">
                    <section className="lf-form-section">
                        <div className="lf-section-title">
                            <span>01</span>
                            <div>
                                <h3>La condition attendue</h3>
                                <p>Un intitulé précis, une consigne facile à comprendre.</p>
                            </div>
                        </div>
                        <label className="lf-label" htmlFor="condition-title">
                            Intitulé de la condition <span>*</span>
                        </label>
                        <input
                            id="condition-title"
                            type="text"
                            value={conditionData.title || ''}
                            onChange={(e) => setConditionData('title', e.target.value)}
                            placeholder="Ex. : Présenter le diplôme d’État"
                            maxLength={255}
                            required
                            aria-invalid={!!conditionErrors.title}
                            aria-describedby={conditionErrors.title ? 'condition-title-error' : undefined}
                        />
                        {error('title')}
                        <div className="lf-label-row">
                            <label className="lf-label" htmlFor="condition-description">
                                Précisions pour le candidat
                            </label>
                            <span>Facultatif</span>
                        </div>
                        <textarea
                            id="condition-description"
                            value={conditionData.description || ''}
                            onChange={(e) => setConditionData('description', e.target.value)}
                            placeholder="Précisez le document à fournir, son format ou les critères à respecter…"
                            rows={4}
                            aria-invalid={!!conditionErrors.description}
                            aria-describedby="condition-description-help"
                        />
                        <p id="condition-description-help" className="lf-help">
                            Une description claire aide le candidat à préparer son dossier.
                        </p>
                        {error('description')}
                    </section>
                    <section className="lf-form-section">
                        <div className="lf-section-title">
                            <span>02</span>
                            <div>
                                <h3>Le classement du dossier</h3>
                                <p>Choisissez la catégorie qui correspond à cette condition.</p>
                            </div>
                        </div>
                        <fieldset className="lf-category-group">
                            <legend className="lf-label">
                                Catégorie <span>*</span>
                            </legend>
                            <div className="lf-category-options">
                                {categories.map((item) => (
                                    <label className="lf-category" key={item.value}>
                                        <input
                                            type="radio"
                                            name="condition-category"
                                            value={item.value}
                                            checked={conditionData.section === item.value}
                                            onChange={() => setConditionData('section', item.value)}
                                            required
                                            aria-invalid={!!conditionErrors.section}
                                        />
                                        <span className="lf-category-card">
                                            <item.icon size={21} strokeWidth={1.5} />
                                            <span>
                                                <strong>{item.label}</strong>
                                                <small>{item.hint}</small>
                                            </span>
                                            <span className="lf-radio-check">
                                                <Check size={12} />
                                            </span>
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </fieldset>
                        {error('section')}
                    </section>
                    <section className="lf-form-section">
                        <div className="lf-section-title">
                            <span>03</span>
                            <div>
                                <h3>Le niveau d’exigence</h3>
                                <p>Indiquez si cette condition est indispensable à l’admission.</p>
                            </div>
                        </div>
                        <label className="lf-switch-card" htmlFor="condition-required">
                            <span className="lf-switch-copy">
                                <strong>Condition obligatoire</strong>
                                <small>
                                    {conditionData.is_required
                                        ? 'Le candidat doit remplir cette condition.'
                                        : 'Cette condition est facultative pour le candidat.'}
                                </small>
                            </span>
                            <input
                                id="condition-required"
                                type="checkbox"
                                role="switch"
                                checked={!!conditionData.is_required}
                                onChange={(e) => setConditionData('is_required', e.target.checked)}
                            />
                            <span className="lf-switch-track" aria-hidden="true" />
                        </label>
                        {error('is_required')}
                    </section>
                </fieldset>
                <aside className="lf-preview">
                    <span className="lf-eyebrow">APERÇU DE LA CONDITION</span>
                    <div className="lf-preview-icon">
                        <ClipboardCheck size={30} strokeWidth={1.3} />
                    </div>
                    <span className="lf-preview-category">{category?.label || 'Catégorie à choisir'}</span>
                    <h3>{conditionData.title?.trim() || 'Votre condition prend forme ici.'}</h3>
                    <p className="lf-preview-description">
                        {conditionData.description?.trim() || 'Les précisions destinées au candidat apparaîtront ici.'}
                    </p>
                    <span className={`lf-status ${conditionData.is_required ? 'is-required' : ''}`}>
                        <FileCheck2 size={13} />
                        {conditionData.is_required ? 'Obligatoire' : 'Facultatif'}
                    </span>
                    <div className="lf-preview-note">
                        <Info size={16} />
                        <p>Cette condition sera rattachée au niveau en cours et affichée dans sa catégorie.</p>
                    </div>
                </aside>
            </form>
        </AdminModal>
    );
}
