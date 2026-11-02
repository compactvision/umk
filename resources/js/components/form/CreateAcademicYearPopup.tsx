import AdminModal from '@/components/admin/AdminModal';
import { useForm } from '@inertiajs/react';
import { ArrowDown, CalendarDays, CalendarRange, Clock3, Info } from 'lucide-react';
import type { FormEvent } from 'react';
import '../../../css/dashboard/academic-years.css';
import '../../../css/dashboard/level-forms.css';
type AcademicYear = { id?: number; title: string; start_date: string; end_date: string; status?: 'draft' | 'open' | 'closed' };
const format = (value: string) => {
    if (!value) return 'Date à choisir';
    const parsed = new Date(`${value}T12:00:00`);
    return Number.isNaN(parsed.getTime()) ? 'Date à choisir' : parsed.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
};
export default function CreateOrEditAcademicYearPopup({
    closeModal,
    academicYear = null,
}: {
    closeModal: () => void;
    academicYear?: AcademicYear | null;
}) {
    const form = useForm({
        title: academicYear?.title || '',
        start_date: academicYear?.start_date?.slice(0, 10) || '',
        end_date: academicYear?.end_date?.slice(0, 10) || '',
    });
    const isEdit = !!academicYear;
    const error = (key: keyof typeof form.data) =>
        form.errors[key] ? (
            <p id={`academic-${key}-error`} className="lf-error" role="alert">
                {form.errors[key]}
            </p>
        ) : null;
    const minimumEnd = form.data.start_date ? new Date(`${form.data.start_date}T00:00:00Z`) : null;
    if (minimumEnd) minimumEnd.setUTCDate(minimumEnd.getUTCDate() + 1);
    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const options = { preserveScroll: true, onSuccess: closeModal };
        if (academicYear) form.put(route('dashboard.admin.academic-years.update', academicYear.id), options);
        else form.post(route('dashboard.admin.academic-years.store'), options);
    };
    const status = academicYear?.status || 'draft';
    return (
        <AdminModal
            wide
            className="level-form-modal ay-form-modal"
            title={isEdit ? 'Affiner le calendrier.' : 'Une nouvelle année.'}
            description="Définissez une période claire pour organiser la vie académique."
            onClose={closeModal}
            formId="academic-year-form"
            submitLabel={isEdit ? 'Enregistrer les modifications' : 'Créer l’année'}
            busy={form.processing}
            errors={form.errors}
        >
            <form id="academic-year-form" onSubmit={submit} className="admin-modal-form ay-form-layout">
                <fieldset className="lf-fields" disabled={form.processing}>
                    <section className="lf-form-section">
                        <div className="lf-section-title">
                            <span>01</span>
                            <div>
                                <h3>L’identité de l’année</h3>
                                <p>Un intitulé facile à retrouver dans votre calendrier.</p>
                            </div>
                        </div>
                        <label className="lf-label" htmlFor="academic-title">
                            Titre de l’année <span>*</span>
                        </label>
                        <input
                            id="academic-title"
                            name="title"
                            value={form.data.title}
                            onChange={(event) => form.setData('title', event.target.value)}
                            placeholder="Ex. : 2026–2027"
                            required
                            maxLength={255}
                            aria-invalid={!!form.errors.title}
                            aria-describedby={form.errors.title ? 'academic-title-error' : undefined}
                        />
                        {error('title')}
                    </section>
                    <section className="lf-form-section">
                        <div className="lf-section-title">
                            <span>02</span>
                            <div>
                                <h3>La période académique</h3>
                                <p>Choisissez les dates de début et de fin du cursus annuel.</p>
                            </div>
                        </div>
                        <div className="ay-form-dates">
                            <div>
                                <label className="lf-label" htmlFor="academic-start_date">
                                    Date de début <span>*</span>
                                </label>
                                <input
                                    id="academic-start_date"
                                    type="date"
                                    name="start_date"
                                    required
                                    value={form.data.start_date}
                                    onChange={(event) => form.setData('start_date', event.target.value)}
                                    aria-invalid={!!form.errors.start_date}
                                    aria-describedby={form.errors.start_date ? 'academic-start_date-error' : undefined}
                                />
                                {error('start_date')}
                            </div>
                            <div>
                                <label className="lf-label" htmlFor="academic-end_date">
                                    Date de fin <span>*</span>
                                </label>
                                <input
                                    id="academic-end_date"
                                    type="date"
                                    name="end_date"
                                    required
                                    min={minimumEnd && !Number.isNaN(minimumEnd.getTime()) ? minimumEnd.toISOString().slice(0, 10) : undefined}
                                    value={form.data.end_date}
                                    onChange={(event) => form.setData('end_date', event.target.value)}
                                    aria-invalid={!!form.errors.end_date}
                                    aria-describedby="academic-date-help"
                                />
                                {error('end_date')}
                            </div>
                        </div>
                        <p className="lf-help" id="academic-date-help">
                            La date de fin doit être postérieure à la date de début.
                        </p>
                    </section>
                    <div className="lf-edit-note">
                        <Info size={17} />
                        <p>
                            {isEdit
                                ? 'Les modifications du calendrier ne changent pas le statut de l’année.'
                                : 'L’année sera créée en brouillon. Ouvrez ensuite les inscriptions depuis sa fiche ou la liste des années.'}
                        </p>
                    </div>
                </fieldset>
                <aside className="ay-calendar-preview">
                    <span className="lf-eyebrow">APERÇU DU CALENDRIER</span>
                    <div className="ay-preview-icon">
                        <CalendarRange size={37} strokeWidth={1.2} />
                    </div>
                    <h3>{form.data.title.trim() || 'Votre année académique'}</h3>
                    <span className={`ay-badge is-${status}`}>
                        <Clock3 size={12} />
                        {status === 'open' ? 'Ouverte' : status === 'closed' ? 'Clôturée' : 'Brouillon'}
                    </span>
                    <div className="ay-preview-period">
                        <div>
                            <CalendarDays size={18} />
                            <p>
                                <span>Premier jour</span>
                                <strong>{format(form.data.start_date)}</strong>
                            </p>
                        </div>
                        <ArrowDown size={15} />
                        <div>
                            <CalendarDays size={18} />
                            <p>
                                <span>Dernier jour</span>
                                <strong>{format(form.data.end_date)}</strong>
                            </p>
                        </div>
                    </div>
                    <p className="ay-preview-note">Un calendrier bien défini accompagne chaque étape du parcours étudiant.</p>
                </aside>
            </form>
        </AdminModal>
    );
}
