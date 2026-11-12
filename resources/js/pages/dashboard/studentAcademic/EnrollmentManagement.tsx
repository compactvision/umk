import Pagination from '@/components/admin/Pagination';
import Dashboard from '@/components/layouts/Dashboard/Dashboard';
import { labels, money, type Balance } from '@/components/student/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { ArrowDown, ArrowUpRight, CalendarCheck, ClipboardList, Search, SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';
import '../../../../css/dashboard/enrollment-management.css';
import '../../../../css/dashboard/student-academic.css';
import '../../../../css/student-portal.css';

type Entry = {
    id: number;
    name: string;
    matricule: string | null;
    year: string;
    status: string;
    level: string;
    program: string | null;
    curriculum: string | null;
    group_id: number | null;
    department_id: number | null;
    context_token: string;
    faculty: string;
    promotion: string | null;
    cohort: string | null;
    group: string | null;
    created_at: string | null;
};
type Version = { id: number; name: string; code: string; program: { name: string }; units: { level_id: number; level_title: string }[] };
type Props = {
    entries: { data: Entry[]; total: number };
    filters: {
        q?: string;
        year?: number;
        status?: string;
        academic?: number;
        faculty?: number;
        program?: number;
        level?: number;
        promotion?: number;
        group?: number;
    };
    enrollmentPolicy: { automatic: boolean; firstInstallment: boolean };
    statuses: string[];
    canClose: boolean;
    openRequests: { id: number; subject: string; category: string }[];
    filterOptions: {
        faculties: { id: number; name: string }[];
        programs: { id: number; name: string; faculty_id: number }[];
        levels: { id: number; title: string; faculty_id: number }[];
        promotions: { id: number; name: string; level_id: number; academic_year_id: number; academic_program_id: number }[];
        groups: { id: number; level_id: number; academic_promotion_id: number | null; intake: { name: string } | null }[];
    };
    years: { id: number; title: string }[];
    selected: Entry | null;
    changes: {
        data: {
            id: number;
            action: string;
            reason: string;
            effective_at: string;
            ends_at: string | null;
            before: { enrollment_status?: string; class_id?: number };
            after: { enrollment_status?: string; class_id?: number };
            actor: { first_name: string; last_name: string };
        }[];
    } | null;
    departments: { id: number; name: string }[];
    transitions: string[];
    groups: { id: number; intake: { name: string } | null; capacity: number | null }[];
    versions: Version[];
    balance: Balance | null;
};
export default function EnrollmentManagement(props: Props) {
    const [draft, setDraft] = useState(() => ({ ...props.filters, academic: undefined }));
    const base = route('dashboard.admin.student-academic.administration');
    const dependencies: Partial<Record<keyof typeof draft, (keyof typeof draft)[]>> = {
        faculty: ['program', 'level', 'promotion', 'group'],
        year: ['promotion', 'group'],
        program: ['promotion', 'group'],
        level: ['promotion', 'group'],
        promotion: ['group'],
    };
    const setFilter = (name: keyof typeof draft, value: string) => {
        setDraft((previous) => ({
            ...previous,
            ...Object.fromEntries((dependencies[name] ?? []).map((key) => [key, undefined])),
            [name]: value || undefined,
        }));
    };
    const extraFilters = [
        { name: 'faculty', label: 'Faculté', options: props.filterOptions.faculties.map((item) => [item.id, item.name]) },
        {
            name: 'program',
            label: 'Programme',
            options: props.filterOptions.programs
                .filter((item) => !draft.faculty || item.faculty_id === Number(draft.faculty))
                .map((item) => [item.id, item.name]),
        },
        {
            name: 'level',
            label: 'Niveau',
            options: props.filterOptions.levels
                .filter((item) => !draft.faculty || item.faculty_id === Number(draft.faculty))
                .map((item) => [item.id, item.title]),
        },
        {
            name: 'promotion',
            label: 'Promotion',
            options: props.filterOptions.promotions
                .filter(
                    (item) =>
                        (!draft.year || item.academic_year_id === Number(draft.year)) &&
                        (!draft.level || item.level_id === Number(draft.level)) &&
                        (!draft.program || item.academic_program_id === Number(draft.program)),
                )
                .map((item) => [item.id, item.name]),
        },
        {
            name: 'group',
            label: 'Groupe',
            options: props.filterOptions.groups
                .filter(
                    (item) =>
                        (!draft.level || item.level_id === Number(draft.level)) &&
                        (!draft.promotion || item.academic_promotion_id === Number(draft.promotion)),
                )
                .map((item) => [item.id, item.intake?.name ?? `Groupe ${item.id}`]),
        },
        { name: 'status', label: 'Statut', options: props.statuses.map((status) => [status, labels[status] || status]) },
    ];
    return (
        <Dashboard hideAppsNavigation>
            <Head title="Inscriptions et situations administratives" />
            <main className="student-portal academic-administration enrollment-management">
                <header className="em-hero">
                    <div className="em-hero-copy">
                        <p>
                            <ClipboardList size={16} aria-hidden="true" /> Scolarité
                        </p>
                        <h1>Inscriptions et situations administratives</h1>
                        <p>Suivez les inscriptions annuelles, les affectations et les changements de cursus.</p>
                    </div>
                    {props.canClose && (
                        <Link className="em-button em-hero-link" href={route('dashboard.admin.student-academic.closure')}>
                            <CalendarCheck size={17} aria-hidden="true" /> Préparer la clôture annuelle
                        </Link>
                    )}
                </header>
                <form
                    className="portal-panel portal-form em-filters"
                    aria-labelledby="em-filters-title"
                    onSubmit={(event) => {
                        event.preventDefault();
                        router.get(base, { ...draft, q: draft.q?.trim() || undefined, page: 1 }, { preserveScroll: true });
                    }}
                >
                    <div className="em-panel-heading">
                        <span className="em-heading-icon">
                            <SlidersHorizontal size={19} aria-hidden="true" />
                        </span>
                        <h2 id="em-filters-title">Filtres des inscriptions</h2>
                    </div>
                    <label className="em-search">
                        Rechercher un étudiant
                        <span>
                            <Search size={18} aria-hidden="true" />
                            <input
                                type="search"
                                value={draft.q ?? ''}
                                onChange={(event) => setFilter('q', event.target.value)}
                                placeholder="Matricule, nom, postnom ou prénom"
                            />
                        </span>
                    </label>
                    <div className="em-filter-grid">
                        <label>
                            Année académique
                            <select value={draft.year ?? ''} onChange={(event) => setFilter('year', event.target.value)}>
                                <option value="">Toutes les années</option>
                                {props.years.map((year) => (
                                    <option key={year.id} value={year.id}>
                                        {year.title}
                                    </option>
                                ))}
                            </select>
                        </label>
                        {extraFilters.map(({ name, label, options }) => (
                            <label key={name}>
                                {label}
                                <select
                                    value={draft[name as keyof typeof draft] ?? ''}
                                    onChange={(event) => setFilter(name as keyof typeof draft, event.target.value)}
                                >
                                    <option value="">Tous</option>
                                    {options.map(([id, value]) => (
                                        <option key={id} value={id}>
                                            {value}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        ))}
                    </div>
                    <div className="em-filter-actions">
                        <Link className="em-button em-secondary" href={base}>
                            Réinitialiser
                        </Link>
                        <button className="em-button em-primary">
                            <Search size={16} aria-hidden="true" /> Appliquer les filtres
                        </button>
                    </div>
                </form>
                <section className="portal-panel em-results" aria-labelledby="em-results-title">
                    <div className="em-results-heading">
                        <h2 id="em-results-title">Inscriptions annuelles</h2>
                        <span className="em-count">
                            {props.entries.total.toLocaleString('fr-FR')} résultat{props.entries.total !== 1 ? 's' : ''}
                        </span>
                    </div>
                    <div className="academic-table-scroll">
                        <table className="academic-table">
                            <thead>
                                <tr>
                                    {['Étudiant', 'Année', 'Parcours et promotion', 'Statut', 'Création', 'Action'].map((label) => (
                                        <th key={label}>{label}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody data-dashboard-panel="page q year status faculty program level promotion group">
                                {props.entries.data.map((entry) => (
                                    <tr key={entry.id} data-selected={props.selected?.id === entry.id || undefined}>
                                        <td>
                                            <strong>{entry.name}</strong>
                                            <small>{entry.matricule}</small>
                                        </td>
                                        <td>{entry.year}</td>
                                        <td>
                                            {entry.program ?? 'Programme non rattaché'} · {entry.level}
                                            <small>
                                                {entry.faculty} · {entry.promotion ?? 'Promotion non affectée'} · {entry.group ?? 'Sans groupe'}
                                            </small>
                                        </td>
                                        <td>
                                            <span className="em-status" data-status={entry.status}>
                                                {labels[entry.status] || entry.status}
                                            </span>
                                        </td>
                                        <td>
                                            {entry.created_at
                                                ? new Date(entry.created_at).toLocaleDateString('fr-FR', { timeZone: 'Africa/Kinshasa' })
                                                : 'Non datée'}
                                        </td>
                                        <td>
                                            <Link
                                                className="em-row-link"
                                                href={base}
                                                data={{ ...props.filters, academic: entry.id }}
                                                preserveScroll
                                                preserveState
                                                onSuccess={() => {
                                                    requestAnimationFrame(() => {
                                                        const panel = document.getElementById('inscription-selectionnee');
                                                        if (panel?.dataset.enrollmentId !== String(entry.id)) return;

                                                        panel.querySelector('h2')?.focus({ preventScroll: true });
                                                        panel.scrollIntoView({
                                                            block: 'start',
                                                            behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
                                                                ? 'instant'
                                                                : 'smooth',
                                                        });
                                                    });
                                                }}
                                            >
                                                Consulter <ArrowDown size={14} aria-hidden="true" />
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {!props.entries.data.length && (
                        <p className="em-empty" data-dashboard-panel="page q year status faculty program level promotion group">
                            Aucune inscription ne correspond à la recherche.
                        </p>
                    )}
                    <Pagination value={props.entries} />
                </section>
                {props.selected && (
                    <section
                        id="inscription-selectionnee"
                        className="portal-panel em-selected"
                        aria-labelledby="em-selected-title"
                        data-enrollment-id={props.selected.id}
                    >
                        <div className="em-selected-heading">
                            <div>
                                <p>Inscription sélectionnée · {props.selected.matricule ?? props.selected.year}</p>
                                <h2 id="em-selected-title" tabIndex={-1}>
                                    {props.selected.name}
                                </h2>
                                <span className="em-status" data-status={props.selected.status}>
                                    {labels[props.selected.status] || props.selected.status}
                                </span>
                            </div>
                            <Link className="em-button em-secondary" href={route('dashboard.admin.student-academic.show', props.selected.id)}>
                                Dossier étudiant 360° <ArrowUpRight size={16} aria-hidden="true" />
                            </Link>
                        </div>
                        <dl className="em-facts">
                            <div>
                                <dt>Année et niveau</dt>
                                <dd>
                                    {props.selected.year} · {props.selected.level}
                                </dd>
                            </div>
                            <div>
                                <dt>Cohorte d’admission</dt>
                                <dd>{props.selected.cohort ?? 'Non rattachée'}</dd>
                            </div>
                            <div>
                                <dt>Promotion annuelle</dt>
                                <dd>{props.selected.promotion ?? 'Non affectée'}</dd>
                            </div>
                            <div>
                                <dt>Maquette</dt>
                                <dd>{props.selected.curriculum ?? 'Non rattachée'}</dd>
                            </div>
                            {props.balance && (
                                <div>
                                    <dt>Solde financier</dt>
                                    <dd>{money(props.balance.balance_cents, props.balance.currency)}</dd>
                                </div>
                            )}
                        </dl>
                        {props.transitions.length > 0 && (
                            <TransitionForm
                                key={`transition-${props.selected.id}-${props.selected.context_token}`}
                                entry={props.selected}
                                transitions={props.transitions}
                                groups={props.groups}
                                openRequests={props.openRequests}
                                departments={props.departments}
                            />
                        )}
                        {props.transitions.length > 0 && props.groups.length > 0 && (
                            <GroupCapacity key={`capacity-${props.selected.id}`} groups={props.groups} />
                        )}
                        {props.versions.length > 0 && ['confirmed', 'suspended', 'on_leave'].includes(props.selected.status) && (
                            <TransferForm
                                key={`transfer-${props.selected.id}-${props.selected.context_token}`}
                                entry={props.selected}
                                versions={props.versions}
                                openRequests={props.openRequests}
                            />
                        )}
                    </section>
                )}
                {props.changes && (
                    <section className="portal-panel em-history">
                        <h2>Décisions et affectations historisées</h2>
                        {props.changes.data.map((change) => (
                            <article key={change.id}>
                                <strong>{change.action === 'transfer' ? 'Transfert de cursus' : 'Décision administrative'}</strong>
                                <p>
                                    {labels[change.before.enrollment_status ?? ''] || change.before.enrollment_status} →{' '}
                                    {labels[change.after.enrollment_status ?? ''] || change.after.enrollment_status} · Groupe{' '}
                                    {change.before.class_id ?? '—'} → {change.after.class_id ?? '—'}
                                </p>
                                <p>{change.reason}</p>
                                <small>
                                    {change.actor.first_name} {change.actor.last_name} ·{' '}
                                    {new Date(change.effective_at).toLocaleString('fr-FR', { timeZone: 'Africa/Kinshasa' })}
                                    {change.ends_at && ` · Fin prévue : ${new Date(change.ends_at).toLocaleDateString('fr-FR')}`}
                                </small>
                            </article>
                        ))}
                        {!props.changes.data.length && (
                            <p>Aucune décision enregistrée dans ce registre. Les événements antérieurs restent dans l’historique du dossier 360°.</p>
                        )}
                        <Pagination value={props.changes} />
                    </section>
                )}
                <details className="portal-panel em-policy">
                    <summary>Conditions institutionnelles de confirmation</summary>
                    <p>
                        {props.enrollmentPolicy.firstInstallment
                            ? 'La première tranche doit être couverte selon les écritures et aides du module Finance.'
                            : 'La confirmation administrative est indépendante du paiement initial.'}
                    </p>
                    <p>
                        {props.enrollmentPolicy.automatic && props.enrollmentPolicy.firstInstallment
                            ? 'Une inscription en attente peut être confirmée automatiquement lorsque les conditions financières sont remplies.'
                            : 'La confirmation exige une décision du service des inscriptions.'}
                    </p>
                </details>
            </main>
        </Dashboard>
    );
}
function TransitionForm({
    entry,
    transitions,
    groups,
    departments,
    openRequests,
}: {
    entry: Entry;
    transitions: string[];
    groups: Props['groups'];
    departments: Props['departments'];
    openRequests: Props['openRequests'];
}) {
    const form = useForm({
        expected_context: entry.context_token,
        service_request_id: '',
        student_response: '',
        expected_status: entry.status,
        operation_key: crypto.randomUUID(),
        enrollment_status: entry.status,
        class_id: String(entry.group_id ?? ''),
        academic_department_id: String(entry.department_id ?? ''),
        reason: '',
        ends_at: '',
    });
    return (
        <form
            className="portal-form"
            onSubmit={(event) => {
                event.preventDefault();
                form.transform((data) => ({
                    ...data,
                    class_id: data.class_id ? Number(data.class_id) : null,
                    academic_department_id: data.academic_department_id ? Number(data.academic_department_id) : null,
                    ends_at: data.ends_at || null,
                    service_request_id: data.service_request_id || null,
                }));
                form.post(route('dashboard.admin.student-academic.transition', entry.id), {
                    preserveScroll: true,
                    onSuccess: () => {
                        form.reset('reason', 'service_request_id', 'student_response');
                        form.setData('operation_key', crypto.randomUUID());
                    },
                });
            }}
        >
            <h3>Décision administrative</h3>
            <RequestDecision fields={form.data} requests={openRequests} set={(field, value) => form.setData(field, value)} />
            <label>
                Situation cible
                <select value={form.data.enrollment_status} onChange={(event) => form.setData('enrollment_status', event.target.value)}>
                    {transitions
                        .filter((value) => value !== 'transferred')
                        .map((value) => (
                            <option key={value} value={value}>
                                {labels[value] || value}
                            </option>
                        ))}
                </select>
            </label>
            <label>
                Groupe
                <select value={form.data.class_id} onChange={(event) => form.setData('class_id', event.target.value)}>
                    <option value="">Sans groupe</option>
                    {groups.map((group) => (
                        <option key={group.id} value={group.id}>
                            {group.intake?.name ?? `Groupe ${group.id}`} · capacité {group.capacity ?? 'non limitée'}
                        </option>
                    ))}
                </select>
            </label>
            <label>
                Département autorisé
                <select value={form.data.academic_department_id} onChange={(event) => form.setData('academic_department_id', event.target.value)}>
                    <option value="">Tronc commun</option>
                    {departments.map((department) => (
                        <option key={department.id} value={department.id}>
                            {department.name}
                        </option>
                    ))}
                </select>
            </label>
            <label>
                Fin prévue du congé ou de la suspension
                <input type="datetime-local" value={form.data.ends_at} onChange={(event) => form.setData('ends_at', event.target.value)} />
            </label>
            <label>
                Motif et conditions de reprise
                <textarea
                    required
                    minLength={10}
                    maxLength={1000}
                    value={form.data.reason}
                    onChange={(event) => form.setData('reason', event.target.value)}
                />
            </label>
            <p>
                Les suspensions et congés ne prennent pas fin automatiquement. La reprise exige une nouvelle décision. Les séances, travaux et
                paiements existants sont conservés.
            </p>
            {Object.values(form.errors).map((error) => (
                <p role="alert" key={error}>
                    {error}
                </p>
            ))}
            <button className="portal-primary" disabled={form.processing}>
                Enregistrer la décision
            </button>
        </form>
    );
}
function TransferForm({ entry, versions, openRequests }: { entry: Entry; versions: Version[]; openRequests: Props['openRequests'] }) {
    const form = useForm({
        expected_context: entry.context_token,
        service_request_id: '',
        student_response: '',
        expected_status: entry.status,
        operation_key: crypto.randomUUID(),
        curriculum_version_id: '',
        level_id: '',
        reason: '',
    });
    const units = versions.find((version) => String(version.id) === form.data.curriculum_version_id)?.units ?? [];
    const levels = [...new Map(units.map((unit) => [unit.level_id, unit.level_title])).entries()];
    return (
        <form
            className="portal-form"
            onSubmit={(event) => {
                event.preventDefault();
                form.post(route('dashboard.admin.student-academic.transfer', entry.id));
            }}
        >
            <h3>Transfert ou réorientation autorisée</h3>
            <RequestDecision fields={form.data} requests={openRequests} set={(field, value) => form.setData(field, value)} />
            <p>
                La décision crée un nouveau contexte annuel. Les paiements, résultats et activités restent sur l’inscription source. La comptabilité
                examine séparément la nouvelle situation financière.
            </p>
            <label>
                Maquette du programme de destination
                <select
                    required
                    value={form.data.curriculum_version_id}
                    onChange={(event) => {
                        form.setData('curriculum_version_id', event.target.value);
                        form.setData('level_id', '');
                    }}
                >
                    <option value="">Choisir une maquette publiée</option>
                    {versions.map((version) => (
                        <option key={version.id} value={version.id}>
                            {version.program.name} · {version.code}
                        </option>
                    ))}
                </select>
            </label>
            <label>
                Niveau
                <select required value={form.data.level_id} onChange={(event) => form.setData('level_id', event.target.value)}>
                    <option value="">Choisir un niveau</option>
                    {levels.map(([id, title]) => (
                        <option key={id} value={id}>
                            {title}
                        </option>
                    ))}
                </select>
            </label>
            <label>
                Référence de décision et motif
                <textarea
                    required
                    minLength={10}
                    maxLength={1000}
                    value={form.data.reason}
                    onChange={(event) => form.setData('reason', event.target.value)}
                />
            </label>
            {Object.values(form.errors).map((error) => (
                <p role="alert" key={error}>
                    {error}
                </p>
            ))}
            <button className="portal-primary" disabled={form.processing}>
                Autoriser le transfert
            </button>
        </form>
    );
}

function RequestDecision({
    fields,
    requests,
    set,
}: {
    fields: { service_request_id: string; student_response: string };
    requests: Props['openRequests'];
    set: (field: 'service_request_id' | 'student_response', value: string) => void;
}) {
    return (
        <>
            {requests.length > 0 && (
                <label>
                    Demande examinée
                    <select value={fields.service_request_id} onChange={(event) => set('service_request_id', event.target.value)}>
                        <option value="">Décision administrative sans demande liée</option>
                        {requests.map((request) => (
                            <option key={request.id} value={request.id}>
                                {request.subject}
                            </option>
                        ))}
                    </select>
                </label>
            )}
            {fields.service_request_id && (
                <label>
                    Réponse destinée à l’étudiant
                    <textarea
                        required
                        minLength={5}
                        maxLength={6000}
                        value={fields.student_response}
                        onChange={(event) => set('student_response', event.target.value)}
                    />
                </label>
            )}
        </>
    );
}

function GroupCapacity({ groups }: { groups: Props['groups'] }) {
    const form = useForm({ group: String(groups[0].id), capacity: groups[0].capacity === null ? '' : String(groups[0].capacity), reason: '' });
    return (
        <details>
            <summary>Configurer la capacité d’un groupe</summary>
            <form
                className="portal-form"
                onSubmit={(event) => {
                    event.preventDefault();
                    form.transform(({ capacity, reason }) => ({ capacity: capacity === '' ? null : Number(capacity), reason }));
                    form.post(route('dashboard.admin.student-academic.groups.capacity', form.data.group), {
                        preserveScroll: true,
                        onSuccess: () => form.reset('reason'),
                    });
                }}
            >
                <label>
                    Groupe
                    <select
                        value={form.data.group}
                        onChange={(event) => {
                            form.setData('group', event.target.value);
                            const selected = groups.find((group) => String(group.id) === event.target.value)!;
                            form.setData('capacity', selected.capacity === null ? '' : String(selected.capacity));
                        }}
                    >
                        {groups.map((group) => (
                            <option key={group.id} value={group.id}>
                                {group.intake?.name ?? `Groupe ${group.id}`}
                            </option>
                        ))}
                    </select>
                </label>
                <label>
                    Capacité maximale
                    <input
                        type="number"
                        min={0}
                        max={100000}
                        value={form.data.capacity}
                        onChange={(event) => form.setData('capacity', event.target.value)}
                    />
                </label>
                <p>Une valeur vide conserve une capacité non limitée. Les affectations existantes sont protégées.</p>
                <label>
                    Justification
                    <textarea
                        required
                        minLength={10}
                        maxLength={1000}
                        value={form.data.reason}
                        onChange={(event) => form.setData('reason', event.target.value)}
                    />
                </label>
                {Object.values(form.errors).map((error) => (
                    <p role="alert" key={error}>
                        {error}
                    </p>
                ))}
                <button className="portal-primary" disabled={form.processing}>
                    Enregistrer la capacité
                </button>
            </form>
        </details>
    );
}
