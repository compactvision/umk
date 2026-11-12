import Pagination from '@/components/admin/Pagination';
import Dashboard from '@/components/layouts/Dashboard/Dashboard';
import { dateTime } from '@/pages/dashboard/teaching/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { ArrowDown, ArrowRight, BookOpen, CalendarDays, ClipboardCheck, ClipboardList, FileText, Plus, Search } from 'lucide-react';
import { useState } from 'react';
import '../../../../css/dashboard/assessments.css';
import '../../../../css/dashboard/student-academic.css';
import '../../../../css/student-portal.css';
import AcademicForm, { type Field, type FormSpec } from '../studentAcademic/AcademicForm';

type Page<T> = { data: T[]; total: number };
type Option = { id: number; title: string };
type Session = { id: number; room: string; starts_at: string; is_published: boolean };
type Summary = {
    resource_id: number;
    offering_id: number;
    title: string;
    course: string;
    state: string;
    category: string;
    modality: string;
    session_code: string;
    opens_at: string | null;
    closes_at: string | null;
    revision: number;
};
type Details = Summary & {
    body: string | null;
    objectives: string | null;
    attempt_limit: number;
    late_minutes: number;
    maximum_points: number | null;
    weight: string | null;
    group_work: boolean;
    feedback_policy: string;
    academic_session_id: number | null;
    academic_content_section_id: number | null;
    rubric: { label: string; maximum: number }[];
    session: (Session & { ends_at: string; cancelled_at: string | null }) | null;
};
type Participant = {
    id: number;
    name: string | null;
    academic_enrollment_id: number;
    group: string | null;
    group_points: number | null;
    participation: string;
    correction_state: string;
    revision: number;
    points: number | null;
    adjustment: number | null;
    criterion_points: number[] | null;
    feedback: string | null;
    feedback_filename: string | null;
    released_at: string | null;
};
type Group = { id: number; label: string; revision: number; shared_points: number | null; feedback: string | null; leader_enrollment_id: number };
type Props = {
    prefix: string;
    admin: boolean;
    canEdit: boolean;
    offering: number | null;
    filters: Record<string, string | number | undefined>;
    categories: Record<string, string>;
    participation: string[];
    offers: Page<Option>;
    sessions: Page<Session> | null;
    sections: Option[];
    items: Page<Summary>;
    selected: Details | null;
    groups: Page<Group> | null;
    records: Page<Participant> | null;
    candidates: Page<{ id: number; name: string | null }> | null;
    record: Participant | null;
    copy: {
        version: number;
        current_version: number;
        body: string | null;
        received_at: string | null;
        late: boolean | null;
        download_url: string | null;
    } | null;
    history: Page<{
        revision: number;
        created_at: string;
        snapshot: Pick<Participant, 'participation' | 'correction_state' | 'points' | 'feedback'>;
        file_url: string | null;
    }> | null;
    state_counts: Record<string, number>;
    upcoming_count: number;
    open_count: number;
    work_counts: Record<string, number>;
};
const states: Record<string, string> = {
    draft: 'Brouillon',
    published: 'Publié',
    closed: 'Clôturé',
    cancelled: 'Annulé',
    finalized: 'Finalisé',
    validated: 'Validé',
};
const participationLabels: Record<string, string> = {
    unassessed: 'À qualifier',
    submitted: 'Remis',
    late_submission: 'Remis en retard',
    not_submitted: 'Non remis',
    present: 'Présent',
    late: 'Arrivé en retard',
    absent: 'Absent',
    excused: 'Absence justifiée',
    exempt: 'Dispensé',
    interrupted: 'Interrompu',
    invalidated: 'Invalidé',
};
const points = (value: number | null | undefined) => (value == null ? '' : (value / 100).toFixed(2));
const reason: Field = { name: 'reason', label: 'Motif', type: 'textarea', required: true };
const checkNotice: Field = { name: 'notify', label: 'Notifier les étudiants concernés', type: 'checkbox' };
const zone = 'Africa/Kinshasa';
function dateInput(value: string | null | undefined) {
    if (!value) return '';
    return new Intl.DateTimeFormat('sv-SE', {
        timeZone: zone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
    })
        .format(new Date(value))
        .replace(' ', 'T');
}

function Errors({ errors }: { errors: Record<string, string> }) {
    return (
        <>
            {Object.values(errors).map((error, index) => (
                <p role="alert" className="portal-error" key={index}>
                    {error}
                </p>
            ))}
        </>
    );
}

function DraftForm({ props, item, onClose }: { props: Props; item?: Details; onClose: () => void }) {
    const form = useForm({
        title: item?.title ?? '',
        body: item?.body ?? '',
        objectives: item?.objectives ?? '',
        category: item?.category ?? 'assignment',
        session_code: item?.session_code ?? 'ordinaire',
        modality: item?.modality ?? 'submission',
        opens_at: dateInput(item?.opens_at),
        closes_at: dateInput(item?.closes_at),
        academic_session_id: item?.academic_session_id?.toString() ?? '',
        academic_content_section_id: item?.academic_content_section_id?.toString() ?? '',
        maximum_points: points(item?.maximum_points),
        weight: item?.weight ?? '',
        attempt_limit: item?.attempt_limit ?? 1,
        late_minutes: item?.late_minutes ?? 0,
        group_work: item?.group_work ?? false,
        feedback_policy: item?.feedback_policy ?? 'validated',
        rubric: item?.rubric?.map((row) => ({ label: row.label, maximum: points(row.maximum) })) ?? [],
        revision: item?.revision,
        reason: '',
    });
    const title = item ? 'Modifier le brouillon' : 'Nouvelle évaluation';
    const course = item?.course ?? props.offers.data.find((offer) => offer.id === props.offering)?.title;
    const submission = form.data.modality === 'submission';

    return (
        <section className="assessment-draft" aria-label={title}>
            <header className="assessment-draft-heading">
                <span className="assessments-icon">
                    <ClipboardList size={20} aria-hidden="true" />
                </span>
                <div>
                    <h2>{title}</h2>
                    {course && <p>{course}</p>}
                </div>
            </header>
            <form
                className="assessment-draft-form"
                onSubmit={(event) => {
                    event.preventDefault();
                    form.transform((data) => ({ ...data, group_work: submission && data.group_work }));
                    form.post(item ? route(props.prefix + 'edit', item.resource_id) : route(props.prefix + 'store', props.offering!), {
                        preserveScroll: true,
                        onSuccess: onClose,
                    });
                }}
            >
                <fieldset className="assessment-draft-fields">
                    <legend>Informations générales</legend>
                    <label className="assessment-field-wide">
                        Titre{' '}
                        <input
                            placeholder="Ex. Contrôle d’algorithmique"
                            required
                            maxLength={180}
                            value={form.data.title}
                            onChange={(e) => form.setData('title', e.target.value)}
                        />
                    </label>
                    <label>
                        Consignes{' '}
                        <textarea rows={3} maxLength={20000} value={form.data.body} onChange={(e) => form.setData('body', e.target.value)} />
                    </label>
                    <label>
                        Objectifs{' '}
                        <textarea
                            rows={3}
                            maxLength={5000}
                            value={form.data.objectives}
                            onChange={(e) => form.setData('objectives', e.target.value)}
                        />
                    </label>
                    <label>
                        Catégorie{' '}
                        <select value={form.data.category} onChange={(e) => form.setData('category', e.target.value)}>
                            {Object.entries(props.categories).map(([key, value]) => (
                                <option key={key} value={key}>
                                    {value}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label>
                        Session{' '}
                        <input
                            required
                            maxLength={60}
                            placeholder="ordinaire ou rattrapage"
                            value={form.data.session_code}
                            onChange={(e) => form.setData('session_code', e.target.value)}
                        />
                    </label>
                    <label>
                        Section du cours{' '}
                        <select
                            value={form.data.academic_content_section_id}
                            onChange={(e) => form.setData('academic_content_section_id', e.target.value)}
                        >
                            <option value="">Aucune</option>
                            {props.sections.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.title}
                                </option>
                            ))}
                        </select>
                    </label>
                </fieldset>
                <fieldset className="assessment-draft-fields">
                    <legend>Modalité et calendrier</legend>
                    <div className="assessment-modality assessment-field-wide" role="radiogroup" aria-label="Modalité">
                        {[
                            {
                                value: 'submission',
                                label: 'Remise de travail',
                                detail: 'Les étudiants déposent leur travail en ligne.',
                                icon: FileText,
                            },
                            {
                                value: 'in_person',
                                label: 'Épreuve en présentiel',
                                detail: 'L’évaluation est liée à une séance du planning.',
                                icon: CalendarDays,
                            },
                        ].map(({ value, label, detail, icon: Icon }) => (
                            <label key={value}>
                                <input
                                    type="radio"
                                    name="assessment-modality"
                                    value={value}
                                    checked={form.data.modality === value}
                                    onChange={() => form.setData('modality', value)}
                                />
                                <Icon size={20} aria-hidden="true" />
                                <span>
                                    <strong>{label}</strong>
                                    <small>{detail}</small>
                                </span>
                            </label>
                        ))}
                    </div>
                    <label className="assessment-field-wide">
                        {submission ? 'Séance du planning (facultatif)' : 'Séance du planning'}{' '}
                        <select
                            required={form.data.modality === 'in_person'}
                            value={form.data.academic_session_id}
                            onChange={(e) => form.setData('academic_session_id', e.target.value)}
                        >
                            <option value="">{submission ? 'Aucune' : 'Choisir une séance'}</option>
                            {item?.academic_session_id && !props.sessions?.data.some((s) => s.id === item.academic_session_id) && (
                                <option value={item.academic_session_id}>Séance n°{item.academic_session_id}</option>
                            )}
                            {props.sessions?.data.map((s) => (
                                <option value={s.id} key={s.id}>
                                    {dateTime(s.starts_at)} · {s.room} · {s.is_published ? 'Publiée' : 'À publier'}
                                </option>
                            ))}
                        </select>
                    </label>
                    {submission && (
                        <>
                            <label>
                                Ouverture (Kinshasa){' '}
                                <input
                                    type="datetime-local"
                                    required
                                    value={form.data.opens_at}
                                    onChange={(e) => form.setData('opens_at', e.target.value)}
                                />
                            </label>
                            <label>
                                Échéance (Kinshasa){' '}
                                <input
                                    type="datetime-local"
                                    required
                                    value={form.data.closes_at}
                                    onChange={(e) => form.setData('closes_at', e.target.value)}
                                />
                            </label>
                            <label>
                                Nombre maximal de remises{' '}
                                <input
                                    type="number"
                                    min={1}
                                    max={20}
                                    required
                                    value={form.data.attempt_limit}
                                    onChange={(e) => form.setData('attempt_limit', Number(e.target.value))}
                                />
                            </label>
                            <label>
                                Tolérance de retard en minutes{' '}
                                <input
                                    type="number"
                                    min={0}
                                    max={10080}
                                    value={form.data.late_minutes}
                                    onChange={(e) => form.setData('late_minutes', Number(e.target.value))}
                                />
                            </label>
                            <label className="assessment-draft-check assessment-field-wide">
                                <input
                                    type="checkbox"
                                    checked={form.data.group_work}
                                    onChange={(e) => form.setData('group_work', e.target.checked)}
                                />{' '}
                                Travail de groupe
                            </label>
                        </>
                    )}
                </fieldset>
                <fieldset className="assessment-draft-fields">
                    <legend>Barème et appréciations</legend>
                    <label>
                        Barème maximal
                        <small>Laissez vide pour une appréciation qualitative.</small>
                        <input
                            inputMode="decimal"
                            value={form.data.maximum_points}
                            onChange={(e) => form.setData('maximum_points', e.target.value)}
                        />
                    </label>
                    <label>
                        Pondération indicative en pourcentage{' '}
                        <input inputMode="decimal" value={form.data.weight} onChange={(e) => form.setData('weight', e.target.value)} />
                    </label>
                    <label>
                        Autoriser la diffusion du feedback{' '}
                        <select value={form.data.feedback_policy} onChange={(e) => form.setData('feedback_policy', e.target.value)}>
                            <option value="validated">Après validation pédagogique</option>
                            <option value="finalized">Après finalisation</option>
                        </select>
                    </label>
                    <div className="assessment-rubric assessment-field-wide" role="group" aria-label="Grille de critères facultative">
                        <strong>
                            Grille de critères <small>Facultative</small>
                        </strong>
                        {form.data.rubric.map((row, index) => (
                            <div className="assessment-rubric-row" key={index}>
                                <label>
                                    Critère {index + 1}{' '}
                                    <input
                                        required
                                        value={row.label}
                                        onChange={(e) =>
                                            form.setData(
                                                'rubric',
                                                form.data.rubric.map((r, i) => (i === index ? { ...r, label: e.target.value } : r)),
                                            )
                                        }
                                    />
                                </label>
                                <label>
                                    Maximum{' '}
                                    <input
                                        required
                                        inputMode="decimal"
                                        value={row.maximum}
                                        onChange={(e) =>
                                            form.setData(
                                                'rubric',
                                                form.data.rubric.map((r, i) => (i === index ? { ...r, maximum: e.target.value } : r)),
                                            )
                                        }
                                    />
                                </label>
                                <button
                                    className="admin-secondary"
                                    type="button"
                                    onClick={() =>
                                        form.setData(
                                            'rubric',
                                            form.data.rubric.filter((_, i) => i !== index),
                                        )
                                    }
                                >
                                    Retirer
                                </button>
                            </div>
                        ))}
                        <button
                            className="admin-secondary"
                            type="button"
                            disabled={form.data.rubric.length >= 20}
                            onClick={() => form.setData('rubric', [...form.data.rubric, { label: '', maximum: '' }])}
                        >
                            <Plus size={16} aria-hidden="true" /> Ajouter un critère
                        </button>
                    </div>
                </fieldset>
                {item && (
                    <label>
                        Motif <textarea required minLength={5} value={form.data.reason} onChange={(e) => form.setData('reason', e.target.value)} />
                    </label>
                )}
                <Errors errors={form.errors} />
                <footer className="assessment-draft-footer">
                    <span>{item ? 'Modification du brouillon' : 'Le brouillon sera visible ici avant publication.'}</span>
                    <div>
                        <button className="admin-secondary" type="button" onClick={onClose} disabled={form.processing}>
                            Fermer
                        </button>
                        <button className="admin-primary" disabled={form.processing}>
                            {form.processing ? 'Enregistrement…' : 'Enregistrer le brouillon'}
                        </button>
                    </div>
                </footer>
            </form>
        </section>
    );
}

function GroupForm({ props, item }: { props: Props; item: Details }) {
    const form = useForm({ label: '', leader: '', members: '', reason: '', revision: item.revision });
    return (
        <details>
            <summary>Constituer un groupe</summary>
            <p>Le responsable désigné dépose le travail. La composition est conservée pour cette évaluation.</p>
            {props.candidates?.data.map((candidate) => (
                <p key={candidate.id}>
                    {candidate.name} · dossier n°{candidate.id}
                </p>
            ))}
            <Pagination value={props.candidates} />
            <form
                className="portal-form"
                onSubmit={(e) => {
                    e.preventDefault();
                    form.transform((data) => ({ ...data, members: data.members.split(/[\s,]+/).filter(Boolean) }));
                    form.post(route(props.prefix + 'group', item.resource_id), { preserveScroll: true, onSuccess: () => form.reset() });
                }}
            >
                <label>
                    Nom du groupe <input required value={form.data.label} onChange={(e) => form.setData('label', e.target.value)} />
                </label>
                <label>
                    Numéro du dossier du responsable{' '}
                    <input type="number" required value={form.data.leader} onChange={(e) => form.setData('leader', e.target.value)} />
                </label>
                <label>
                    Numéros des dossiers séparés par des virgules{' '}
                    <input required value={form.data.members} onChange={(e) => form.setData('members', e.target.value)} />
                </label>
                <label>
                    Motif <textarea required minLength={5} value={form.data.reason} onChange={(e) => form.setData('reason', e.target.value)} />
                </label>
                <Errors errors={form.errors} />
                <button disabled={form.processing} className="admin-primary">
                    Constituer le groupe
                </button>
            </form>
        </details>
    );
}

function CorrectionForm({ props, item, row }: { props: Props; item: Details; row: Participant }) {
    const form = useForm({
        participation: row.participation,
        points: row.adjustment == null && !row.criterion_points?.length ? points(row.points) : '',
        adjustment: points(row.adjustment),
        criteria: item.rubric.map((_, index) => points(row.criterion_points?.[index])),
        feedback: row.feedback ?? '',
        file: null as File | null,
        revision: row.revision,
        reason: '',
    });
    const graded = ['submitted', 'late_submission', 'present', 'late'].includes(form.data.participation);
    return (
        <form
            className="portal-form"
            onSubmit={(e) => {
                e.preventDefault();
                form.transform((data) => ({
                    ...data,
                    points: graded ? data.points : null,
                    adjustment: graded ? data.adjustment : null,
                    criteria: graded && data.criteria.some(Boolean) ? data.criteria : null,
                }));
                form.post(route(props.prefix + 'correct', [item.resource_id, row.id]), { forceFormData: true, preserveScroll: true });
            }}
        >
            <label>
                Participation{' '}
                <select value={form.data.participation} onChange={(e) => form.setData('participation', e.target.value)}>
                    {props.participation.map((status) => (
                        <option key={status} value={status}>
                            {participationLabels[status]}
                        </option>
                    ))}
                </select>
            </label>
            {graded && item.maximum_points !== null && (
                <>
                    {!item.rubric.length && (
                        <label>
                            Note sur {points(item.maximum_points)}{' '}
                            <input inputMode="decimal" value={form.data.points} onChange={(e) => form.setData('points', e.target.value)} />
                        </label>
                    )}
                    {item.rubric.map((criterion, index) => (
                        <label key={criterion.label}>
                            {criterion.label} sur {points(criterion.maximum)}{' '}
                            <input
                                inputMode="decimal"
                                value={form.data.criteria[index]}
                                onChange={(e) =>
                                    form.setData(
                                        'criteria',
                                        form.data.criteria.map((v, i) => (i === index ? e.target.value : v)),
                                    )
                                }
                            />
                        </label>
                    ))}
                    {row.group_points !== null && (
                        <label>
                            Ajustement par rapport à la note collective de {points(row.group_points)} (laisser la grille et la note vides){' '}
                            <input inputMode="decimal" value={form.data.adjustment} onChange={(e) => form.setData('adjustment', e.target.value)} />
                        </label>
                    )}
                </>
            )}
            <label>
                Appréciation privée <textarea value={form.data.feedback} onChange={(e) => form.setData('feedback', e.target.value)} />
            </label>
            <label>
                Fichier corrigé <input type="file" onChange={(e) => form.setData('file', e.target.files?.[0] ?? null)} />
            </label>
            <label>
                Motif <textarea required minLength={5} value={form.data.reason} onChange={(e) => form.setData('reason', e.target.value)} />
            </label>
            {form.progress && <progress value={form.progress.percentage} max={100} aria-label="Envoi de la correction" />}
            <Errors errors={form.errors} />
            <button className="admin-primary" disabled={form.processing}>
                Enregistrer la correction
            </button>
        </form>
    );
}

export default function Assessments(props: Props) {
    const { prefix, selected, record, filters, canEdit, offering, admin } = props;
    const [modal, setModal] = useState<FormSpec | null>(null);
    const [draft, setDraft] = useState<{ mode: 'create' | 'edit'; id: number } | null>(null);
    const [status, setStatus] = useState('');
    const index = route(prefix + 'index');
    const link = (updates: Record<string, number | string | undefined>) => route(prefix + 'index', { ...filters, ...updates });
    const action = (title: string, path: string, values: FormSpec['values'], fields: Field[] = [reason]) =>
        setModal({ title, description: 'Vérifiez le contexte et confirmez cette opération pédagogique.', action: path, fields, values });
    const batch = (kind: string, title: string) =>
        selected &&
        action(
            title,
            route(prefix + 'batch', selected.resource_id),
            { action: kind, revision: selected.revision },
            kind === 'release' ? [reason, checkNotice] : [reason],
        );
    const lifecycle = (kind: string, title: string) =>
        selected &&
        action(
            title,
            route(prefix + 'lifecycle', selected.resource_id),
            { action: kind, revision: selected.revision },
            kind === 'close' ? [reason] : [reason, checkNotice],
        );
    const state = (kind: string, title: string) =>
        selected && record && action(title, route(prefix + 'record', [selected.resource_id, record.id]), { action: kind, revision: record.revision });
    return (
        <Dashboard hideAppsNavigation>
            <Head title="Évaluations et corrections" />
            {modal && (
                <AcademicForm
                    spec={modal}
                    onClose={() => setModal(null)}
                    onSuccess={(message) => {
                        setModal(null);
                        setStatus(message);
                    }}
                />
            )}
            <main className="student-portal academic-administration assessments-workspace">
                <header className="assessments-heading">
                    <div>
                        <Link
                            className="assessments-back"
                            href={route(admin ? 'dashboard.admin.teaching.index' : 'dashboard.teaching.index', offering ? { offering } : {})}
                        >
                            <BookOpen size={16} aria-hidden="true" /> Enseignements
                        </Link>
                        <h1>Évaluations et corrections</h1>
                    </div>
                    {canEdit && offering ? (
                        <button className="admin-primary assessments-action" onClick={() => setDraft({ mode: 'create', id: offering })}>
                            <Plus size={17} aria-hidden="true" /> Créer une évaluation
                        </button>
                    ) : (
                        <a className="admin-secondary assessments-action" href="#assessment-courses">
                            Choisir un cours <ArrowDown size={16} aria-hidden="true" />
                        </a>
                    )}
                </header>
                {status && (
                    <p className="portal-alert" role="status">
                        {status}
                    </p>
                )}
                <section className="assessments-metrics" aria-label="Indicateurs des évaluations">
                    <div>
                        <span className="assessments-icon">
                            <FileText size={18} aria-hidden="true" />
                        </span>
                        <p className="assessments-metric-label">Brouillons</p>
                        <strong className="assessments-metric-value">{props.state_counts.draft ?? 0}</strong>
                        <span className="assessments-metric-note">
                            {props.state_counts.published ?? 0} publiées · {props.state_counts.closed ?? 0} clôturées
                        </span>
                    </div>
                    <div>
                        <span className="assessments-icon">
                            <CalendarDays size={18} aria-hidden="true" />
                        </span>
                        <p className="assessments-metric-label">Évaluations ouvertes</p>
                        <strong className="assessments-metric-value">{props.open_count}</strong>
                        <span className="assessments-metric-note">{props.upcoming_count} à venir</span>
                    </div>
                    <div>
                        <span className="assessments-icon">
                            <ClipboardCheck size={18} aria-hidden="true" />
                        </span>
                        <p className="assessments-metric-label">Corrections à traiter</p>
                        <strong className="assessments-metric-value">{props.work_counts.draft ?? 0}</strong>
                        <span className="assessments-metric-note">
                            {props.work_counts.finalized ?? 0} à valider · {props.work_counts.validated ?? 0} validées
                            {selected ? ' pour cette évaluation' : ''}
                        </span>
                    </div>
                </section>
                {canEdit && draft?.mode === 'create' && draft.id === offering && (
                    <DraftForm key={offering} props={props} onClose={() => setDraft(null)} />
                )}
                <div className="assessments-grid">
                    <section className="assessments-panel" aria-labelledby="assessment-list-heading">
                        <div className="assessments-panel-heading">
                            <h2 id="assessment-list-heading">Évaluations</h2>
                            <span className="assessments-count">
                                {props.items.total} résultat{props.items.total === 1 ? '' : 's'}
                            </span>
                        </div>
                        <form
                            className="assessments-filters"
                            key={JSON.stringify(filters)}
                            onSubmit={(event) => {
                                event.preventDefault();
                                const data = new FormData(event.currentTarget);
                                router.get(
                                    index,
                                    Object.fromEntries([...data].filter(([, value]) => value !== '').map(([key, value]) => [key, String(value)])),
                                );
                            }}
                        >
                            {offering && <input type="hidden" name="offering" value={offering} />}
                            <label>
                                Titre{' '}
                                <input name="q" type="search" maxLength={180} placeholder="Rechercher une évaluation" defaultValue={filters.q} />
                            </label>
                            <label>
                                Année (identifiant) <input name="year" type="number" min={1} defaultValue={filters.year} />
                            </label>
                            <label>
                                État{' '}
                                <select name="state" defaultValue={filters.state}>
                                    <option value="">Tous</option>
                                    {Object.entries(states)
                                        .slice(0, 4)
                                        .map(([k, v]) => (
                                            <option key={k} value={k}>
                                                {v}
                                            </option>
                                        ))}
                                </select>
                            </label>
                            <label>
                                Catégorie{' '}
                                <select name="category" defaultValue={filters.category}>
                                    <option value="">Toutes</option>
                                    {Object.entries(props.categories).map(([k, v]) => (
                                        <option key={k} value={k}>
                                            {v}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <div className="assessments-filter-actions">
                                <button className="admin-primary assessments-action">
                                    <Search size={16} aria-hidden="true" /> Filtrer
                                </button>
                                {(offering || filters.q || filters.year || filters.state || filters.category) && (
                                    <Link href={index}>Réinitialiser</Link>
                                )}
                            </div>
                        </form>
                        {props.items.data.length ? (
                            <ul className="assessments-list">
                                {props.items.data.map((item) => (
                                    <li key={item.resource_id}>
                                        <Link
                                            className="assessments-row"
                                            aria-current={selected?.resource_id === item.resource_id ? 'true' : undefined}
                                            href={`${link({
                                                offering: item.offering_id,
                                                resource: item.resource_id,
                                                record: undefined,
                                                copy_version: undefined,
                                            })}#assessment-detail`}
                                        >
                                            <span className="assessments-icon">
                                                <ClipboardList size={18} aria-hidden="true" />
                                            </span>
                                            <span className="assessments-row-main">
                                                <strong>{item.title}</strong>
                                                <small>
                                                    {item.course} · {props.categories[item.category] ?? item.category}
                                                </small>
                                                {item.opens_at && <small>Ouverture · {dateTime(item.opens_at)}</small>}
                                            </span>
                                            <span className="assessments-badge" data-state={item.state}>
                                                {states[item.state] ?? item.state}
                                            </span>
                                            <ArrowRight className="assessments-row-arrow" size={17} aria-hidden="true" />
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="assessments-empty">
                                <span className="assessments-icon">
                                    <ClipboardList size={20} aria-hidden="true" />
                                </span>
                                <strong>Aucune évaluation dans cette vue</strong>
                                <p>Modifiez les filtres ou choisissez une offre de cours pour créer une évaluation.</p>
                            </div>
                        )}
                        <Pagination value={props.items} />
                    </section>
                    <aside className="assessments-panel assessments-courses" id="assessment-courses" aria-labelledby="assessment-courses-heading">
                        <div className="assessments-panel-heading">
                            <h2 id="assessment-courses-heading">Offres de cours</h2>
                            <span className="assessments-count">{props.offers.total}</span>
                        </div>
                        <p className="assessments-muted">Sélectionnez une offre pour consulter ses évaluations.</p>
                        {props.offers.data.length ? (
                            <ul className="assessments-list assessments-course-list">
                                {props.offers.data.map((offer) => (
                                    <li key={offer.id}>
                                        <Link
                                            className="assessments-course"
                                            aria-current={offering === offer.id ? 'true' : undefined}
                                            href={link({ offering: offer.id, resource: undefined, record: undefined, copy_version: undefined })}
                                        >
                                            <BookOpen size={16} aria-hidden="true" />
                                            <span>{offer.title}</span>
                                            <ArrowRight size={15} aria-hidden="true" />
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="assessments-muted">Aucune offre de cours dans cette vue.</p>
                        )}
                        <Pagination value={props.offers} />
                        {canEdit && props.sessions && (
                            <details>
                                <summary>Créneaux disponibles pour le formulaire</summary>
                                <Pagination value={props.sessions} />
                            </details>
                        )}
                        {admin && (
                            <a className="assessments-export" href={route(prefix + 'handoff')}>
                                <FileText size={16} aria-hidden="true" /> Flux JSON des résultats validés
                            </a>
                        )}
                    </aside>
                </div>
                {selected && (
                    <section className="portal-panel assessments-detail" id="assessment-detail">
                        <div className="assessments-panel-heading">
                            <h2>{selected.title}</h2>
                            <span className="assessments-badge" data-state={selected.state}>
                                {states[selected.state] ?? selected.state}
                            </span>
                        </div>
                        <p>
                            {selected.course}
                            {selected.session_code && ` · ${selected.session_code}`}
                        </p>
                        <p>
                            {selected.opens_at && dateTime(selected.opens_at)} {selected.closes_at && `– ${dateTime(selected.closes_at)}`}
                        </p>
                        {selected.session && (
                            <p>
                                {selected.session.room} · {dateTime(selected.session.starts_at)} – {dateTime(selected.session.ends_at)}{' '}
                                {selected.session.cancelled_at && '· Séance annulée'}
                            </p>
                        )}
                        {selected.body && <p style={{ whiteSpace: 'pre-wrap' }}>{selected.body}</p>}
                        {selected.objectives && <p>{selected.objectives}</p>}
                        <p>
                            {selected.maximum_points == null ? 'Appréciation qualitative' : `Barème sur ${points(selected.maximum_points)}`}{' '}
                            {selected.weight && ` · Pondération indicative ${selected.weight} %`}
                        </p>
                        <div className="student-dossier-links">
                            <Link href={route(admin ? 'dashboard.admin.learning.index' : 'dashboard.teaching.learning.index', { offering })}>
                                Supports du cours
                            </Link>
                            {canEdit && selected.state === 'draft' && (
                                <>
                                    <button className="admin-secondary" onClick={() => setDraft({ mode: 'edit', id: selected.resource_id })}>
                                        Modifier le brouillon
                                    </button>
                                    <button className="admin-primary" onClick={() => lifecycle('publish', 'Publier l’évaluation')}>
                                        Publier
                                    </button>
                                </>
                            )}
                            {canEdit && selected.state === 'published' && (
                                <button className="admin-primary" onClick={() => lifecycle('close', 'Clôturer l’évaluation')}>
                                    Clôturer
                                </button>
                            )}
                            {canEdit && ['draft', 'published'].includes(selected.state) && (
                                <button className="admin-secondary" onClick={() => lifecycle('cancel', 'Annuler l’évaluation')}>
                                    Annuler
                                </button>
                            )}
                            {canEdit && selected.state === 'closed' && (
                                <>
                                    {admin && (
                                        <button className="admin-primary" onClick={() => batch('validate', 'Valider et transmettre les corrections')}>
                                            Valider les corrections
                                        </button>
                                    )}
                                    <button className="admin-secondary" onClick={() => batch('release', 'Publier les appréciations autorisées')}>
                                        Publier les appréciations
                                    </button>
                                </>
                            )}
                        </div>
                        {canEdit && selected.state === 'draft' && draft?.mode === 'edit' && draft.id === selected.resource_id && (
                            <DraftForm key={selected.resource_id} props={props} item={selected} onClose={() => setDraft(null)} />
                        )}
                        {selected.group_work && (
                            <>
                                <h3>Groupes de travail</h3>
                                {canEdit && ['draft', 'published'].includes(selected.state) && (
                                    <GroupForm key={selected.revision} props={props} item={selected} />
                                )}
                                <ul>
                                    {props.groups?.data.map((group) => (
                                        <li key={group.id}>
                                            {group.label} · Responsable n°{group.leader_enrollment_id}
                                            {group.shared_points !== null && ` · Note collective ${points(group.shared_points)}`}
                                            {canEdit && selected.state === 'closed' && (
                                                <button
                                                    className="admin-secondary"
                                                    onClick={() =>
                                                        action(
                                                            'Correction collective',
                                                            route(prefix + 'group-score', [selected.resource_id, group.id]),
                                                            { revision: group.revision },
                                                            [
                                                                { name: 'points', label: 'Note collective', value: points(group.shared_points) },
                                                                {
                                                                    name: 'feedback',
                                                                    label: 'Appréciation collective',
                                                                    type: 'textarea',
                                                                    value: group.feedback,
                                                                },
                                                                reason,
                                                            ],
                                                        )
                                                    }
                                                >
                                                    Corriger le groupe
                                                </button>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                                <Pagination value={props.groups} />
                            </>
                        )}
                        {selected.modality === 'in_person' && selected.session?.is_published && !selected.session.cancelled_at && (
                            <p>
                                <Link
                                    href={route(admin ? 'dashboard.admin.schedule.attendance' : 'dashboard.teaching.attendance', selected.session.id)}
                                >
                                    Consulter l’appel dans le planning
                                </Link>
                            </p>
                        )}
                        <h3>Participants et corrections</h3>
                        <p>
                            {props.work_counts.draft ?? 0} à traiter · {props.work_counts.finalized ?? 0} finalisée(s) ·{' '}
                            {props.work_counts.validated ?? 0} validée(s)
                        </p>
                        <form
                            className="assessments-filters"
                            onSubmit={(e) => {
                                e.preventDefault();
                                const data = new FormData(e.currentTarget);
                                router.get(index, {
                                    offering,
                                    resource: selected.resource_id,
                                    correction: String(data.get('correction') || ''),
                                    participation: String(data.get('participation') || ''),
                                });
                            }}
                        >
                            <label>
                                Correction{' '}
                                <select name="correction" defaultValue={filters.correction}>
                                    <option value="">Toutes</option>
                                    {['draft', 'finalized', 'validated'].map((s) => (
                                        <option key={s} value={s}>
                                            {states[s]}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label>
                                Participation{' '}
                                <select name="participation" defaultValue={filters.participation}>
                                    <option value="">Toutes</option>
                                    {props.participation.map((s) => (
                                        <option key={s} value={s}>
                                            {participationLabels[s]}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <div className="assessments-filter-actions">
                                <button className="admin-secondary">Filtrer les participants</button>
                            </div>
                        </form>
                        {props.records?.data.length ? (
                            <ul className="assessments-list assessments-participants">
                                {props.records.data.map((row) => (
                                    <li key={row.id}>
                                        <Link
                                            href={link({
                                                offering: offering ?? undefined,
                                                resource: selected.resource_id,
                                                record: row.id,
                                                copy_version: undefined,
                                            })}
                                        >
                                            {row.name ?? `Dossier ${row.academic_enrollment_id}`}
                                        </Link>
                                        {' · '}
                                        {participationLabels[row.participation]} · {states[row.correction_state]}
                                        {row.group && ` · ${row.group}`}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="assessments-empty">Aucun participant dans cette vue.</p>
                        )}
                        <Pagination value={props.records} />
                    </section>
                )}
                {selected && record && (
                    <section className="portal-panel">
                        <h2>Correction de {record.name ?? `dossier ${record.academic_enrollment_id}`}</h2>
                        <p>
                            {participationLabels[record.participation]} · {states[record.correction_state]}{' '}
                            {record.released_at && '· Feedback publié'}
                        </p>
                        {record.points !== null && (
                            <p>
                                Note pédagogique {points(record.points)} / {points(selected.maximum_points)}
                            </p>
                        )}
                        {record.feedback && <p style={{ whiteSpace: 'pre-wrap' }}>{record.feedback}</p>}
                        {record.feedback_filename && (
                            <a href={route(prefix + 'feedback', [selected.resource_id, record.id])}>Télécharger le fichier corrigé</a>
                        )}
                        {props.copy && (
                            <div>
                                <h3>
                                    Copie · Version {props.copy.version} sur {props.copy.current_version}
                                </h3>
                                {props.copy.received_at && (
                                    <p>
                                        {dateTime(props.copy.received_at)} {props.copy.late && '· Remise tardive'}
                                    </p>
                                )}
                                {props.copy.body && <p style={{ whiteSpace: 'pre-wrap' }}>{props.copy.body}</p>}
                                {props.copy.download_url && <a href={props.copy.download_url}>Télécharger cette version</a>}
                                <div className="student-dossier-links">
                                    {props.copy.version > 1 && <Link href={link({ copy_version: props.copy.version - 1 })}>Version précédente</Link>}
                                    {props.copy.version < props.copy.current_version && (
                                        <Link href={link({ copy_version: props.copy.version + 1 })}>Version suivante</Link>
                                    )}
                                </div>
                            </div>
                        )}
                        {canEdit && selected.state === 'closed' && record.correction_state === 'draft' && (
                            <>
                                <CorrectionForm key={`${record.id}-${record.revision}`} props={props} item={selected} row={record} />
                                <button className="admin-secondary" onClick={() => state('finalize', 'Finaliser la correction')}>
                                    Finaliser la correction
                                </button>
                            </>
                        )}
                        {canEdit && admin && record.correction_state !== 'draft' && (
                            <button className="admin-secondary" onClick={() => state('reopen', 'Rouvrir la correction')}>
                                Rouvrir la correction
                            </button>
                        )}
                        <h3>Historique de correction</h3>
                        <ul>
                            {props.history?.data.map((version) => (
                                <li key={version.revision}>
                                    <details>
                                        <summary>
                                            Révision {version.revision} · {states[version.snapshot.correction_state]} · {dateTime(version.created_at)}
                                        </summary>
                                        {version.snapshot.points !== null && <p>Note {points(version.snapshot.points)}</p>}
                                        {version.snapshot.feedback && <p>{version.snapshot.feedback}</p>}
                                        {version.file_url && <a href={version.file_url}>Fichier de cette révision</a>}
                                    </details>
                                </li>
                            ))}
                        </ul>
                        <Pagination value={props.history} />
                    </section>
                )}
            </main>
        </Dashboard>
    );
}
