import AdminModal from '@/components/admin/AdminModal';
import { useForm } from '@inertiajs/react';
import { BookOpen, Building2, Clock3, GraduationCap, Info } from 'lucide-react';
import type { FormEvent } from 'react';
import '../../../css/dashboard/level-forms.css';
type Faculty = { id: number; name?: string; code?: string; description?: string; duration_years?: number; is_active?: boolean };
type FacultyForm = { name: string; code: string; description: string; duration_years: number | ''; is_active: boolean };
export default function CreateFacultyPopup({ isEdit, closeModal, faculty }: { isEdit: boolean; closeModal: () => void; faculty?: Faculty | null }) {
    const { data, setData, errors, post, put, processing } = useForm<FacultyForm>({
        name: isEdit ? (faculty?.name ?? '') : '',
        code: isEdit ? (faculty?.code ?? '') : '',
        description: isEdit ? (faculty?.description ?? '') : '',
        duration_years: isEdit ? (faculty?.duration_years ?? '') : '',
        is_active: isEdit ? (faculty?.is_active ?? true) : true,
    });
    const error = (field: keyof FacultyForm) =>
        errors[field] ? (
            <p className="lf-error" id={`faculty-${field}-error`} role="alert">
                {errors[field]}
            </p>
        ) : null;
    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const options = { preserveScroll: true, onSuccess: closeModal };
        if (isEdit && faculty) put(route('dashboard.admin.faculties.update', faculty.id), options);
        else post(route('dashboard.admin.faculties.store'), options);
    };
    return (
        <AdminModal
            wide
            className="level-form-modal lf-faculty-modal"
            title={isEdit ? 'Affiner votre faculté.' : 'Une nouvelle faculté.'}
            description="Donnez une identité claire à votre faculté et structurez son offre de formation."
            onClose={closeModal}
            formId="faculty-form"
            submitLabel={isEdit ? 'Enregistrer les modifications' : 'Créer la faculté'}
            busy={processing}
            errors={errors}
        >
            <form id="faculty-form" onSubmit={submit} className="admin-modal-form lf-faculty-layout">
                <fieldset className="lf-fields" disabled={processing}>
                    <section className="lf-form-section">
                        <div className="lf-section-title">
                            <span>01</span>
                            <div>
                                <h3>L’identité de la faculté</h3>
                                <p>Un nom et un code pour identifier son domaine d’enseignement.</p>
                            </div>
                        </div>
                        <label className="lf-label" htmlFor="faculty-name">
                            Nom de la faculté <span>*</span>
                        </label>
                        <input
                            id="faculty-name"
                            name="name"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            placeholder="Ex. : Faculté de Médecine"
                            maxLength={255}
                            required
                            aria-invalid={!!errors.name}
                            aria-describedby={errors.name ? 'faculty-name-error' : undefined}
                        />
                        {error('name')}
                        <div className="lf-create-two-fields">
                            <div>
                                <label className="lf-label" htmlFor="faculty-code">
                                    Code de la faculté <span>*</span>
                                </label>
                                <input
                                    id="faculty-code"
                                    name="code"
                                    value={data.code}
                                    onChange={(e) => setData('code', e.target.value.toUpperCase())}
                                    placeholder="Ex. : MED"
                                    maxLength={10}
                                    required
                                    aria-invalid={!!errors.code}
                                    aria-describedby="faculty-code-help"
                                />
                                <p id="faculty-code-help" className="lf-help">
                                    10 caractères maximum, en majuscules.
                                </p>
                                {error('code')}
                            </div>
                            <div>
                                <label className="lf-label" htmlFor="faculty-duration">
                                    Durée du cursus <span>*</span>
                                </label>
                                <div className="lf-value-input">
                                    <input
                                        id="faculty-duration"
                                        name="duration_years"
                                        type="number"
                                        min={1}
                                        max={10}
                                        step={1}
                                        value={data.duration_years}
                                        onChange={(e) => setData('duration_years', e.target.value === '' ? '' : Number(e.target.value))}
                                        placeholder="Ex. : 5"
                                        required
                                        aria-invalid={!!errors.duration_years}
                                        aria-describedby="faculty-duration-help"
                                    />
                                    <span>années</span>
                                </div>
                                <p id="faculty-duration-help" className="lf-help">
                                    Une durée comprise entre 1 et 10 ans.
                                </p>
                                {error('duration_years')}
                            </div>
                        </div>
                    </section>
                    <section className="lf-form-section">
                        <div className="lf-section-title">
                            <span>02</span>
                            <div>
                                <h3>La présentation de la faculté</h3>
                                <p>Présentez sa vocation et les perspectives qu’elle ouvre.</p>
                            </div>
                        </div>
                        <div className="lf-label-row">
                            <label className="lf-label" htmlFor="faculty-description">
                                Description
                            </label>
                            <span>Facultatif</span>
                        </div>
                        <textarea
                            id="faculty-description"
                            name="description"
                            rows={6}
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            placeholder="Décrivez les domaines d’enseignement, la mission et les orientations de cette faculté…"
                            maxLength={1000}
                            aria-invalid={!!errors.description}
                            aria-describedby="faculty-description-help"
                        />
                        <div className="lf-description-meta">
                            <p id="faculty-description-help" className="lf-help">
                                Une présentation concise et accessible.
                            </p>
                            <span>{data.description.length} / 1 000 caractères</span>
                        </div>
                        {error('description')}
                    </section>
                    <section className="lf-form-section">
                        <div className="lf-section-title">
                            <span>03</span>
                            <div>
                                <h3>La disponibilité de la faculté</h3>
                                <p>Définissez son statut dans votre organisation académique.</p>
                            </div>
                        </div>
                        <label className="lf-switch-card" htmlFor="faculty-active">
                            <span className="lf-switch-copy">
                                <strong>Faculté active</strong>
                                <small>
                                    {data.is_active ? 'Cette faculté est marquée comme active.' : 'Cette faculté est marquée comme inactive.'}
                                </small>
                            </span>
                            <input
                                id="faculty-active"
                                type="checkbox"
                                role="switch"
                                checked={data.is_active}
                                onChange={(e) => setData('is_active', e.target.checked)}
                            />
                            <span className="lf-switch-track" aria-hidden="true" />
                        </label>
                        {error('is_active')}
                    </section>
                </fieldset>
                <aside className="lf-faculty-preview">
                    <span className="lf-eyebrow">APERÇU DE LA FACULTÉ</span>
                    <div className="lf-faculty-preview-mark">
                        <Building2 size={45} strokeWidth={1.2} />
                        <span>UNIVERSITÉ SIMON KIMBANGU</span>
                    </div>
                    <span className="lf-faculty-code">{data.code.trim() || 'CODE'}</span>
                    <h3>{data.name.trim() || 'Le nom de votre faculté'}</h3>
                    <p className="lf-faculty-description">
                        {data.description.trim() || 'La présentation de votre faculté apparaîtra ici au fil de votre saisie.'}
                    </p>
                    <div className="lf-faculty-preview-meta">
                        <span>
                            <Clock3 size={15} />
                            {data.duration_years ? `${data.duration_years} an${data.duration_years > 1 ? 's' : ''} de cursus` : 'Durée à préciser'}
                        </span>
                        <span className={`lf-status ${data.is_active ? 'lf-active-status' : ''}`}>{data.is_active ? 'Active' : 'Inactive'}</span>
                    </div>
                    <div className="lf-preview-note">
                        <Info size={16} />
                        <p>
                            {isEdit
                                ? 'Les modifications seront appliquées après l’enregistrement.'
                                : 'Après la création, ajoutez les niveaux de formation associés à cette faculté.'}
                        </p>
                    </div>
                    <div className="lf-faculty-signature">
                        <GraduationCap size={17} strokeWidth={1.4} />
                        <span>
                            STRUCTURER LES SAVOIRS
                            <br />
                            <strong>Ouvrir les perspectives.</strong>
                        </span>
                        <BookOpen size={16} strokeWidth={1.3} />
                    </div>
                </aside>
            </form>
        </AdminModal>
    );
}
