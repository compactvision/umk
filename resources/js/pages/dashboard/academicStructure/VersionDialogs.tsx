import AdminModal from '@/components/admin/AdminModal';
import { useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { messages, type Props, type ScheduleGeneration, type Version } from './types';

const parseRooms = (rooms: string) =>
    rooms
        .split(/\r?\n/)
        .map((room) => room.trim())
        .filter(Boolean);

function ScheduleRooms({ value, onChange }: { value: string; onChange: (value: string) => void }) {
    return (
        <label className="admin-field">
            Salles autorisées (facultatif, une par ligne)
            <textarea rows={3} value={value} onChange={(event) => onChange(event.target.value)} />
            <small>Si ce champ est vide, les salles déjà utilisées dans le planning seront proposées.</small>
        </label>
    );
}

export function ScheduleReport({ result }: { result: ScheduleGeneration }) {
    return (
        <div className="as-note">
            <p>
                {result.sessions} séance{result.sessions === 1 ? '' : 's'} ajoutée{result.sessions === 1 ? '' : 's'} en brouillon
            </p>
            {result.issues.length > 0 && (
                <details>
                    <summary>
                        {result.issues.length} point{result.issues.length === 1 ? '' : 's'} à traiter
                    </summary>
                    <ul>
                        {result.issues.map((issue, index) => (
                            <li key={`${index}-${issue}`}>{issue}</li>
                        ))}
                    </ul>
                </details>
            )}
        </div>
    );
}

export function GenerateSchedule({ version, onClose }: { version: Version; onClose: () => void }) {
    const form = useForm({ rooms: '' });
    return (
        <AdminModal
            title="Compléter l’horaire de la maquette"
            description="Les séances manquantes sont proposées dans les périodes configurées, selon les réservations du planning."
            onClose={onClose}
            formId="curriculum-generate-schedule"
            submitLabel="Générer les séances"
            busy={form.processing}
            errors={messages(form.errors)}
        >
            <form
                id="curriculum-generate-schedule"
                className="admin-modal-form"
                onSubmit={(event) => {
                    event.preventDefault();
                    form.transform(({ rooms }) => ({ rooms: parseRooms(rooms) }));
                    form.post(route('dashboard.admin.academic-structure.versions.schedule', version.id), {
                        preserveScroll: true,
                        onSuccess: onClose,
                    });
                }}
            >
                <ScheduleRooms value={form.data.rooms} onChange={(value) => form.setData('rooms', value)} />
            </form>
        </AdminModal>
    );
}

export function AnnualDrafts({ years, onClose }: { years: Props['years']; onClose: () => void }) {
    const form = useForm({ academic_year_id: '', rooms: '' });

    return (
        <AdminModal
            title="Générer les brouillons de l’année"
            description="Les brouillons sont préparés par faculté et par niveau à partir des cours existants. Les séances sont proposées selon les affectations et les salles disponibles."
            onClose={onClose}
            formId="curriculum-annual-batch"
            submitLabel="Générer les brouillons"
            busy={form.processing}
            errors={messages(form.errors)}
        >
            <form
                id="curriculum-annual-batch"
                className="admin-modal-form"
                onSubmit={(event) => {
                    event.preventDefault();
                    form.transform(({ rooms, ...data }) => ({ ...data, rooms: parseRooms(rooms) }));
                    form.post(route('dashboard.admin.academic-structure.versions.annual-batch'), { onSuccess: onClose });
                }}
            >
                <label className="admin-field">
                    Année académique
                    <select required value={form.data.academic_year_id} onChange={(event) => form.setData('academic_year_id', event.target.value)}>
                        <option value="">Choisir une année</option>
                        {years.map((year) => (
                            <option key={year.id} value={year.id}>
                                {year.title}
                            </option>
                        ))}
                    </select>
                </label>
                <ScheduleRooms value={form.data.rooms} onChange={(value) => form.setData('rooms', value)} />
            </form>
        </AdminModal>
    );
}

export function NewVersion({ context, clone, onClose }: { context: Props; clone?: Version; onClose: () => void }) {
    const form = useForm({
        academic_program_id: context.selectedProgram?.id ?? '',
        code: '',
        name: '',
        academic_year_id: '',
        admission_cohort_id: '',
        clone_id: clone?.id ?? null,
        reason: '',
    });
    const [yearScope, cohortScope] = [Boolean(form.data.academic_year_id), Boolean(form.data.admission_cohort_id)];
    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.post(route('dashboard.admin.academic-structure.versions.store'), { preserveScroll: true, onSuccess: onClose });
    };
    return (
        <AdminModal
            title={clone ? `Nouvelle version depuis ${clone.code}` : 'Préparer une maquette'}
            description={
                clone
                    ? 'Le brouillon reprend les matières et les réglages de la version sélectionnée.'
                    : 'Les matières, crédits et heures du catalogue sont repris pour chaque niveau du programme.'
            }
            onClose={onClose}
            formId="curriculum-create"
            submitLabel="Créer le brouillon"
            busy={form.processing}
            errors={messages(form.errors)}
        >
            <form id="curriculum-create" className="admin-modal-form" onSubmit={submit}>
                <label className="admin-field">
                    Code de version
                    <input required maxLength={60} value={form.data.code} onChange={(event) => form.setData('code', event.target.value)} />
                </label>
                <label className="admin-field">
                    Nom
                    <input required maxLength={255} value={form.data.name} onChange={(event) => form.setData('name', event.target.value)} />
                </label>
                <label className="admin-field">
                    Applicable à une année
                    <select
                        disabled={cohortScope}
                        value={form.data.academic_year_id}
                        onChange={(event) => form.setData('academic_year_id', event.target.value)}
                    >
                        <option value="">Aucune année choisie</option>
                        {context.years.map((year) => (
                            <option key={year.id} value={year.id}>
                                {year.title}
                            </option>
                        ))}
                    </select>
                </label>
                <label className="admin-field">
                    Ou à une cohorte
                    <select
                        disabled={yearScope}
                        value={form.data.admission_cohort_id}
                        onChange={(event) => form.setData('admission_cohort_id', event.target.value)}
                    >
                        <option value="">Aucune cohorte choisie</option>
                        {context.cohorts.map((cohort) => (
                            <option key={cohort.id} value={cohort.id}>
                                {cohort.name}
                            </option>
                        ))}
                    </select>
                </label>
                <label className="admin-field">
                    Motif
                    <textarea
                        required
                        minLength={5}
                        maxLength={1000}
                        value={form.data.reason}
                        onChange={(event) => form.setData('reason', event.target.value)}
                    />
                </label>
            </form>
        </AdminModal>
    );
}

export function Transition({
    context,
    version,
    action,
    onClose,
}: {
    context: Props;
    version: Version;
    action: 'validate' | 'reopen' | 'publish' | 'archive';
    onClose: () => void;
}) {
    const titles = {
        validate: 'Valider la maquette',
        reopen: 'Reprendre le brouillon',
        publish: 'Publier la maquette',
        archive: 'Archiver la maquette',
    };
    const form = useForm({ action, revision: version.revision, reason: '', replace_id: '' });
    const current = context.activeVersions.filter(
        (item) =>
            item.id !== version.id && item.academic_year_id === version.academic_year_id && item.admission_cohort_id === version.admission_cohort_id,
    );
    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.post(route('dashboard.admin.academic-structure.versions.transition', version.id), { preserveScroll: true, onSuccess: onClose });
    };
    return (
        <AdminModal
            title={titles[action]}
            description={
                action === 'publish'
                    ? 'La publication rend les séances approuvées visibles dans l’horaire des étudiants concernés.'
                    : 'Les inscriptions déjà rattachées conservent leur version. Cette décision est enregistrée dans l’historique.'
            }
            onClose={onClose}
            formId="curriculum-transition"
            submitLabel="Confirmer la décision"
            busy={form.processing}
            errors={messages(form.errors)}
        >
            <form id="curriculum-transition" className="admin-modal-form" onSubmit={submit}>
                <p>
                    {version.code} · {version.name}
                </p>
                {action === 'publish' && current.length > 0 && (
                    <label className="admin-field">
                        Version publiée à remplacer
                        <select required value={form.data.replace_id} onChange={(event) => form.setData('replace_id', event.target.value)}>
                            <option value="">Confirmer explicitement le remplacement</option>
                            {current.map((item) => (
                                <option key={item.id} value={item.id}>
                                    {item.code} · {item.name}
                                </option>
                            ))}
                        </select>
                    </label>
                )}
                <label className="admin-field">
                    Motif officiel
                    <textarea
                        required
                        minLength={5}
                        maxLength={1000}
                        value={form.data.reason}
                        onChange={(event) => form.setData('reason', event.target.value)}
                    />
                </label>
            </form>
        </AdminModal>
    );
}
