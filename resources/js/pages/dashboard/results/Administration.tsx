import Pagination from '@/components/admin/Pagination';
import Dashboard from '@/components/layouts/Dashboard/Dashboard';
import AcademicForm, { type Field, type FormSpec } from '@/pages/dashboard/studentAcademic/AcademicForm';
import { dateTime } from '@/pages/dashboard/teaching/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import '../../../../css/dashboard/student-academic.css';
import '../../../../css/student-portal.css';

type Page<T> = { data: T[]; total: number };
type Rule = {
    id: number;
    code: string;
    level_id: number;
    reference: string;
    session_code: string;
    approved_at: string | null;
    configuration?: object;
};
type Run = {
    id: number;
    reference: string;
    edition: number;
    state: string;
    revision: number;
    meeting_at: string;
    minutes_volumes: number;
    context: { year: string; program: string; level: string; session: string; decisions: Record<string, { label: string }> };
    jury: { chair: number; secretary: number; members: Record<string, string> };
    attendance: number[] | null;
};
type Dossier = {
    id: number;
    reference: string;
    academic_enrollment_id: number;
    student: string;
    matricule: string | null;
    annual: string | null;
    credits: { earned: number; planned: number };
    decision: string | null;
    anomalies: string[];
    eliminatory: boolean;
    decision_reason?: string | null;
    eligible_decisions?: string[];
    snapshot?: {
        units: {
            id: number;
            name: string;
            grade: string | null;
            status: string;
            items: { id: number; name: string; grade: string | null; selected?: string; status: string }[];
        }[];
    };
};
type Appeal = {
    id: number;
    reference: string;
    run_id: number;
    body: string;
    status: string;
    result_target: string;
    response: string | null;
    url: string | null;
    result_revision: number;
    assigned_to: number | null;
};
type Props = {
    filters: Record<string, string | number | undefined>;
    actor: number;
    permissions: { manage: boolean; publish: boolean; jury: boolean };
    members: { id: number; name: string }[];
    versions: Page<{ id: number; title: string }>;
    version: { id: number; code: string } | null;
    levels: { level_id: number; level_title: string }[];
    items: { id: number; title: string; level_id: number }[];
    assessments: Page<{ id: number; title: string; ec: number; session: string; state: string }> | null;
    rules: Page<Rule>;
    rule: Rule | null;
    runs: Page<Run>;
    run: Run | null;
    dossiers: Page<Dossier> | null;
    result: Dossier | null;
    undecided: number | null;
    pending_appeals: number;
    appeals: Page<Appeal> | null;
};
const prefix = 'dashboard.admin.results.';
const states: Record<string, string> = { prepared: 'Préparé', open: 'Ouvert', approved: 'Approuvé', published: 'Publié', abandoned: 'Abandonné' };
const results: Record<string, string> = {
    passed: 'Validé',
    compensated: 'Compensé',
    recognized: 'Reconnu',
    failed: 'Non validé',
    incomplete: 'Incomplet',
    eliminatory: 'Éliminatoire',
};
const appealStates: Record<string, string> = {
    open: 'Déposé',
    under_review: 'En vérification',
    admissible: 'Recevable',
    investigating: 'En instruction',
    accepted: 'Accepté',
    rejected: 'Rejeté',
    inadmissible: 'Irrecevable',
};
const reason: Field = { name: 'reason', label: 'Motif', type: 'textarea', required: true };
const credits = (value: number) => new Intl.NumberFormat('fr', { maximumFractionDigits: 2 }).format(value / 100);

function RuleForm({ version, levels }: { version: number; levels: Props['levels'] }) {
    const form = useForm({ level_id: '', code: '', session_code: '', effective_on: '', reference: '', configuration: '' });
    const [error, setError] = useState('');
    return (
        <details>
            <summary>Créer une version de règlement</summary>
            <p>
                Renseignez le règlement approuvé par l’établissement. Les seuils sont en centièmes, les poids en points de base. L’aide de
                configuration décrit les champs requis.
            </p>
            <form
                className="portal-form"
                onSubmit={(event) => {
                    event.preventDefault();
                    try {
                        const configuration: unknown = JSON.parse(form.data.configuration);
                        if (!configuration || typeof configuration !== 'object' || Array.isArray(configuration)) throw new Error();
                        setError('');
                        form.transform((data) => ({ ...data, configuration }));
                        form.post(route(prefix + 'store-rule', version), { preserveScroll: true });
                    } catch {
                        setError('Saisissez un objet JSON valide.');
                    }
                }}
            >
                <label>
                    Niveau{' '}
                    <select required value={form.data.level_id} onChange={(e) => form.setData('level_id', e.target.value)}>
                        <option value="">Choisir le niveau</option>
                        {levels.map((level) => (
                            <option key={level.level_id} value={level.level_id}>
                                {level.level_title}
                            </option>
                        ))}
                    </select>
                </label>
                <label>
                    Code de version <input required value={form.data.code} onChange={(e) => form.setData('code', e.target.value)} />
                </label>
                <label>
                    Code de session <input required value={form.data.session_code} onChange={(e) => form.setData('session_code', e.target.value)} />
                </label>
                <label>
                    Applicable à partir du{' '}
                    <input required type="date" value={form.data.effective_on} onChange={(e) => form.setData('effective_on', e.target.value)} />
                </label>
                <label>
                    Référence réglementaire <input required value={form.data.reference} onChange={(e) => form.setData('reference', e.target.value)} />
                </label>
                <label>
                    Configuration du règlement{' '}
                    <textarea
                        required
                        rows={14}
                        spellCheck={false}
                        value={form.data.configuration}
                        onChange={(e) => form.setData('configuration', e.target.value)}
                    />
                </label>
                {error && <p role="alert">{error}</p>}
                {Object.values(form.errors).map((message, index) => (
                    <p key={index} role="alert">
                        {message}
                    </p>
                ))}
                <button className="admin-primary" disabled={form.processing}>
                    Soumettre pour approbation
                </button>
            </form>
            <details>
                <summary>Aide de configuration</summary>
                <ul>
                    <li>
                        Barème et calcul. scale, precision, rounding (half_up, half_even, down), weighting (uniform, credits, coefficients), ec_pass
                        et ue_pass.
                    </li>
                    <li>
                        Crédits et compensation. credit_label, allow_equivalence, compensation (none, unit, period), compensation_floor et period_pass
                        si applicables, eliminatory_below si prévu.
                    </li>
                    <li>
                        Sources. items associe chaque identifiant d’EC à des identifiants d’évaluation pondérés. La somme des poids doit être 10 000
                        pour chaque EC calculé.
                    </li>
                    <li>
                        Rattrapage. base_rule_id, resit_policy (replace, best, keep), resit_eligibility (failed_ec, failed_unit, all_registered),
                        missing_resit (retain, incomplete).
                    </li>
                    <li>
                        Jury et recours. quorum, appeal_days et decisions. Pour chaque code de décision, fournir label, permits_incomplete,
                        permits_eliminatory, progression (none, same, next, conditional) et minimum_credits si applicable. retake accepte
                        unacquired_units ou whole_year pour le redoublement. Le passage conditionnel exige unacquired_units. Pour la fin de cursus,
                        renseigner completion_credits en centièmes, éventuellement completion_evidence et completion_alignment (exact_version ou
                        identical_units).
                    </li>
                </ul>
            </details>
        </details>
    );
}

function PrepareForm({ rule, members }: { rule: Rule; members: Props['members'] }) {
    const form = useForm({
        meeting_at: '',
        chair: '',
        secretary: '',
        members: [] as number[],
        previous_id: '',
        appeal_id: '',
        equivalences: '',
        reason: '',
    });
    const [error, setError] = useState('');
    return (
        <details>
            <summary>Préparer une délibération</summary>
            <form
                className="portal-form"
                onSubmit={(event) => {
                    event.preventDefault();
                    try {
                        const equivalences: unknown = form.data.equivalences ? JSON.parse(form.data.equivalences) : [];
                        if (!Array.isArray(equivalences)) throw new Error();
                        setError('');
                        form.transform((data) => ({ ...data, equivalences }));
                        form.post(route(prefix + 'prepare', rule.id), { preserveScroll: true });
                    } catch {
                        setError('Les équivalences doivent former un tableau JSON.');
                    }
                }}
            >
                <label>
                    Date du jury (Kinshasa){' '}
                    <input type="datetime-local" required value={form.data.meeting_at} onChange={(e) => form.setData('meeting_at', e.target.value)} />
                </label>
                <label>
                    Président{' '}
                    <select required value={form.data.chair} onChange={(e) => form.setData('chair', e.target.value)}>
                        <option value="">Choisir</option>
                        {members.map((member) => (
                            <option key={member.id} value={member.id}>
                                {member.name}
                            </option>
                        ))}
                    </select>
                </label>
                <label>
                    Secrétaire{' '}
                    <select required value={form.data.secretary} onChange={(e) => form.setData('secretary', e.target.value)}>
                        <option value="">Choisir</option>
                        {members.map((member) => (
                            <option key={member.id} value={member.id}>
                                {member.name}
                            </option>
                        ))}
                    </select>
                </label>
                <fieldset>
                    <legend>Membres du jury</legend>
                    {members.map((member) => (
                        <label key={member.id}>
                            <input
                                type="checkbox"
                                checked={form.data.members.includes(member.id)}
                                onChange={(e) =>
                                    form.setData(
                                        'members',
                                        e.target.checked ? [...form.data.members, member.id] : form.data.members.filter((id) => id !== member.id),
                                    )
                                }
                            />{' '}
                            {member.name}
                        </label>
                    ))}
                </fieldset>
                <label>
                    Publication à rectifier (identifiant){' '}
                    <input type="number" min={1} value={form.data.previous_id} onChange={(e) => form.setData('previous_id', e.target.value)} />
                </label>
                <label>
                    Recours accepté (identifiant, si applicable){' '}
                    <input type="number" min={1} value={form.data.appeal_id} onChange={(e) => form.setData('appeal_id', e.target.value)} />
                </label>
                <label>
                    Équivalences autorisées (tableau JSON avec enrollment, item et reference){' '}
                    <textarea value={form.data.equivalences} onChange={(e) => form.setData('equivalences', e.target.value)} />
                </label>
                <label>
                    Motif <textarea required minLength={5} value={form.data.reason} onChange={(e) => form.setData('reason', e.target.value)} />
                </label>
                {error && <p role="alert">{error}</p>}
                {Object.values(form.errors).map((message, index) => (
                    <p key={index} role="alert">
                        {message}
                    </p>
                ))}
                <button className="admin-primary" disabled={form.processing}>
                    Calculer les dossiers
                </button>
            </form>
        </details>
    );
}

function OpenJury({ run }: { run: Run }) {
    const form = useForm({ action: 'open', revision: run.revision, attendance: [] as number[], reason: '' });
    return (
        <details>
            <summary>Faire l’appel et ouvrir le jury</summary>
            <form
                className="portal-form"
                onSubmit={(event) => {
                    event.preventDefault();
                    form.post(route(prefix + 'transition', run.id), { preserveScroll: true });
                }}
            >
                <fieldset>
                    <legend>Membres présents</legend>
                    {Object.entries(run.jury.members).map(([id, member]) => (
                        <label key={id}>
                            <input
                                type="checkbox"
                                checked={form.data.attendance.includes(Number(id))}
                                onChange={(e) =>
                                    form.setData(
                                        'attendance',
                                        e.target.checked
                                            ? [...form.data.attendance, Number(id)]
                                            : form.data.attendance.filter((memberId) => memberId !== Number(id)),
                                    )
                                }
                            />{' '}
                            {member}
                        </label>
                    ))}
                </fieldset>
                <label>
                    Motif <input required minLength={5} value={form.data.reason} onChange={(e) => form.setData('reason', e.target.value)} />
                </label>
                {Object.values(form.errors).map((error, index) => (
                    <p key={index} role="alert">
                        {error}
                    </p>
                ))}
                <button className="admin-primary" disabled={form.processing}>
                    Ouvrir la délibération
                </button>
            </form>
        </details>
    );
}

export default function Administration(props: Props) {
    const { version, rule, run, result, filters, permissions, actor } = props;
    const [modal, setModal] = useState<FormSpec | null>(null);
    const [message, setMessage] = useState('');
    const open = (title: string, url: string, values: FormSpec['values'], fields: Field[] = [reason]) =>
        setModal({ title, description: 'Vérifiez le dossier avant de confirmer.', action: url, values, fields });
    const transition = (action: string, title: string) =>
        run &&
        open(
            title,
            route(prefix + 'transition', run.id),
            { action, revision: run.revision },
            action === 'publish' ? [reason, { name: 'notify', type: 'checkbox', label: 'Notifier les étudiants autorisés' }] : [reason],
        );
    const index = route(prefix + 'index');
    return (
        <Dashboard hideAppsNavigation>
            <Head title="Résultats et délibérations" />
            {modal && (
                <AcademicForm
                    spec={modal}
                    onClose={() => setModal(null)}
                    onSuccess={(feedback) => {
                        setModal(null);
                        setMessage(feedback);
                    }}
                />
            )}
            <main className="student-portal academic-administration">
                <header className="directory-heading">
                    <div>
                        <h1>Résultats et délibérations</h1>
                        <p>Règlements, dossiers de jury, publications et recours.</p>
                    </div>
                    <Link href={route('dashboard.admin.assessments.index')}>Évaluations et corrections pédagogiques</Link>
                </header>
                {message && (
                    <p role="status" className="portal-alert">
                        {message}
                    </p>
                )}
                <section className="portal-panel">
                    <h2>Maquettes et règlements</h2>
                    <form
                        className="schedule-filters"
                        onSubmit={(event) => {
                            event.preventDefault();
                            const year = new FormData(event.currentTarget).get('year');
                            router.get(index, year ? { year: String(year) } : {});
                        }}
                    >
                        <label>
                            Identifiant de l’année <input name="year" type="number" min={1} defaultValue={filters.year} />
                        </label>
                        <button className="admin-secondary">Filtrer</button>
                    </form>
                    {props.versions.data.length ? (
                        <ul data-dashboard-panel="year versions_page">
                            {props.versions.data.map((row) => (
                                <li key={row.id}>
                                    <Link href={route(prefix + 'index', { version: row.id })}>{row.title}</Link>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p data-dashboard-panel="year versions_page">Aucune maquette publiée dans ce périmètre.</p>
                    )}
                    <Pagination value={props.versions} />
                    {version && permissions.manage && <RuleForm key={version.id} version={version.id} levels={props.levels} />}
                    {version && (
                        <details>
                            <summary>Identifiants des EC et des évaluations</summary>
                            <ul>
                                {props.items.map((item) => (
                                    <li key={item.id}>
                                        EC {item.id} · {item.title} · niveau {item.level_id}
                                    </li>
                                ))}
                            </ul>
                            <ul data-dashboard-panel="version sources_page">
                                {props.assessments?.data.map((item) => (
                                    <li key={item.id}>
                                        Évaluation {item.id} · {item.title} · EC {item.ec} · {item.session} · {item.state}
                                    </li>
                                ))}
                            </ul>
                            <Pagination value={props.assessments} />
                        </details>
                    )}
                    <ul data-dashboard-panel="version rule rules_page">
                        {props.rules.data.map((row) => (
                            <li key={row.id}>
                                <Link href={route(prefix + 'index', { rule: row.id })}>
                                    {row.code} · {row.reference} · {row.session_code}
                                </Link>{' '}
                                · {row.approved_at ? 'Approuvé' : 'À approuver'}
                            </li>
                        ))}
                    </ul>
                    <Pagination value={props.rules} />
                    {rule && (
                        <>
                            <h3>
                                {rule.code} · {rule.reference}
                            </h3>
                            {rule.configuration && (
                                <details>
                                    <summary>Voir le règlement enregistré</summary>
                                    <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(rule.configuration, null, 2)}</pre>
                                </details>
                            )}
                            {!rule.approved_at && permissions.publish && (
                                <button
                                    className="admin-primary"
                                    onClick={() => open('Approuver le règlement', route(prefix + 'approve-rule', rule.id), {})}
                                >
                                    Approuver
                                </button>
                            )}
                            {rule.approved_at && permissions.manage && <PrepareForm key={rule.id} rule={rule} members={props.members} />}
                        </>
                    )}
                </section>
                <section className="portal-panel">
                    <h2>Délibérations</h2>
                    <nav className="student-dossier-links" aria-label="État du jury">
                        <Link href={route(prefix + 'index', { rule: rule?.id })}>Toutes</Link>
                        {Object.entries(states).map(([key, label]) => (
                            <Link key={key} href={route(prefix + 'index', { rule: rule?.id, state: key })}>
                                {label}
                            </Link>
                        ))}
                    </nav>
                    {props.runs.data.length ? (
                        <ul data-dashboard-panel="rule state runs_page">
                            {props.runs.data.map((row) => (
                                <li key={row.id}>
                                    <Link href={route(prefix + 'index', { run: row.id })}>
                                        {row.context.program} · {row.context.level} · {row.context.year} · {row.context.session}
                                    </Link>{' '}
                                    · {states[row.state]} · Édition {row.edition} · n°{row.id}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p data-dashboard-panel="rule state runs_page">Aucune délibération dans cette vue.</p>
                    )}
                    <Pagination value={props.runs} />
                </section>
                {run && (
                    <section className="portal-panel">
                        <h2>
                            {run.context.program} · {run.context.level}
                        </h2>
                        <p>
                            {states[run.state]} · Session {run.context.session} · Édition {run.edition} · Jury prévu le {dateTime(run.meeting_at)}
                        </p>
                        <p>{props.undecided ?? 0} dossier(s) sans décision.</p>
                        <div className="student-dossier-links">
                            {(permissions.publish || run.jury.members[String(actor)]) &&
                                run.state !== 'abandoned' &&
                                Array.from({ length: run.minutes_volumes }, (_, index) => (
                                    <a key={index} href={route(prefix + 'minutes', { run: run.id, volume: index + 1 })}>
                                        {['approved', 'published'].includes(run.state) ? 'Procès-verbal approuvé' : 'Procès-verbal provisoire'}
                                        {run.minutes_volumes > 1 && ` · Volume ${index + 1}`}
                                    </a>
                                ))}
                            {run.state === 'published' && permissions.publish && (
                                <a href={route(prefix + 'export', run.id)}>Exporter les résultats publiés (CSV)</a>
                            )}
                            {run.state === 'open' && actor === run.jury.chair && permissions.jury && (
                                <button className="admin-primary" onClick={() => transition('approve', 'Approuver les décisions')}>
                                    Approuver
                                </button>
                            )}
                            {run.state === 'approved' && permissions.publish && (
                                <button className="admin-primary" onClick={() => transition('publish', 'Publier tous les résultats du jury')}>
                                    Publier la session
                                </button>
                            )}
                            {!['published', 'abandoned'].includes(run.state) && permissions.manage && (
                                <button className="admin-secondary" onClick={() => transition('abandon', 'Abandonner cette préparation')}>
                                    Abandonner
                                </button>
                            )}
                        </div>
                        {run.state === 'prepared' && actor === run.jury.chair && permissions.jury && <OpenJury key={run.id} run={run} />}
                        <form
                            className="schedule-filters"
                            onSubmit={(event) => {
                                event.preventDefault();
                                router.get(index, { run: run.id, q: String(new FormData(event.currentTarget).get('q') || '') });
                            }}
                        >
                            <label>
                                Nom ou matricule <input name="q" defaultValue={filters.q} />
                            </label>
                            <button className="admin-secondary">Rechercher</button>
                        </form>
                        <div style={{ overflowX: 'auto' }} data-dashboard-panel="run q dossiers_page">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Dossier</th>
                                        <th>Moyenne</th>
                                        <th>Crédits</th>
                                        <th>Décision</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {props.dossiers?.data.map((row) => (
                                        <tr key={row.id}>
                                            <td>
                                                <Link href={route(prefix + 'index', { run: run.id, result: row.id })}>
                                                    {row.student} · {row.matricule ?? row.academic_enrollment_id}
                                                </Link>
                                            </td>
                                            <td>{row.annual ?? '—'}</td>
                                            <td>
                                                {credits(row.credits.earned)} / {credits(row.credits.planned)}
                                            </td>
                                            <td>
                                                {row.decision ? run.context.decisions[row.decision].label : 'En attente'}
                                                {row.anomalies.length > 0 && ' · Incomplet'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <Pagination value={props.dossiers} />
                    </section>
                )}
                {run && result && (
                    <section className="portal-panel">
                        <h2>{result.student}</h2>
                        <p>
                            Moyenne {result.annual ?? 'indisponible'} · {credits(result.credits.earned)} crédits acquis.
                        </p>
                        {result.anomalies.length > 0 && (
                            <ul>
                                {result.anomalies.map((anomaly, index) => (
                                    <li key={index}>{anomaly}</li>
                                ))}
                            </ul>
                        )}
                        {result.eliminatory && <p>Le dossier contient une note éliminatoire.</p>}
                        {result.decision_reason && <p>{result.decision_reason}</p>}
                        {result.snapshot?.units.map((unit) => (
                            <details key={unit.id}>
                                <summary>
                                    {unit.name} · {unit.grade ?? '—'} · {results[unit.status]}
                                </summary>
                                <ul>
                                    {unit.items.map((item) => (
                                        <li key={item.id}>
                                            {item.name} · {item.grade ?? '—'} · {results[item.status]}
                                            {item.selected === 'ordinary' && ' · Session ordinaire'}
                                        </li>
                                    ))}
                                </ul>
                            </details>
                        ))}
                        {run.state === 'open' && run.attendance?.includes(actor) && permissions.jury && (
                            <button
                                className="admin-primary"
                                onClick={() =>
                                    open('Décision du jury', route(prefix + 'decision', [run.id, result.id]), { revision: run.revision }, [
                                        {
                                            name: 'decision',
                                            label: 'Décision réglementaire',
                                            type: 'select',
                                            value: result.decision,
                                            required: true,
                                            options: Object.entries(run.context.decisions)
                                                .filter(([value]) => result.eligible_decisions?.includes(value))
                                                .map(([value, decision]) => ({
                                                    value,
                                                    label: decision.label,
                                                })),
                                        },
                                        reason,
                                    ])
                                }
                            >
                                Enregistrer une décision
                            </button>
                        )}
                    </section>
                )}
                {props.appeals && (
                    <section className="portal-panel" id="recours">
                        <h2>Recours sur résultats officiels</h2>
                        <p>{props.pending_appeals} recours en cours.</p>
                        {props.appeals.data.map((appeal) => (
                            <article key={appeal.id} className="portal-ticket">
                                <h3>
                                    Recours n°{appeal.id} · {appealStates[appeal.status]}
                                </h3>
                                <p>
                                    {appeal.result_target} ·{' '}
                                    <Link href={route(prefix + 'index', { run: appeal.run_id })}>Publication de référence</Link>
                                </p>
                                <p style={{ whiteSpace: 'pre-wrap' }}>{appeal.body}</p>
                                {appeal.assigned_to && <p>Instruit par le compte n°{appeal.assigned_to}.</p>}
                                {appeal.response && <p>{appeal.response}</p>}
                                {appeal.url && <a href={appeal.url}>Télécharger la pièce</a>}
                                <div className="student-dossier-links">
                                    {[
                                        ['open', 'review', 'Vérifier', permissions.manage],
                                        ['under_review', 'admit', 'Déclarer recevable', permissions.manage],
                                        ['under_review', 'inadmissible', 'Déclarer irrecevable', permissions.publish],
                                        ['admissible', 'investigate', 'Affecter à l’instruction', permissions.manage],
                                        ['investigating', 'accept', 'Accepter', permissions.publish],
                                        ['investigating', 'reject', 'Rejeter', permissions.publish],
                                    ].map(
                                        ([status, action, label, allowed]) =>
                                            allowed &&
                                            status === appeal.status && (
                                                <button
                                                    className="admin-secondary"
                                                    key={String(action)}
                                                    onClick={() =>
                                                        open(
                                                            String(label),
                                                            route(prefix + 'review', appeal.id),
                                                            { action: String(action), revision: appeal.result_revision },
                                                            action === 'investigate'
                                                                ? [
                                                                      {
                                                                          name: 'assigned_to',
                                                                          label: 'Compte gestionnaire (identifiant)',
                                                                          type: 'number',
                                                                          required: true,
                                                                      },
                                                                      reason,
                                                                  ]
                                                                : [reason],
                                                        )
                                                    }
                                                >
                                                    {label}
                                                </button>
                                            ),
                                    )}
                                </div>
                            </article>
                        ))}
                        <Pagination value={props.appeals} />
                    </section>
                )}
            </main>
        </Dashboard>
    );
}
