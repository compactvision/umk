import Pagination from '@/components/admin/Pagination';
import { formatDate } from '@/lib/studentEnrollment';
import { Link, useForm } from '@inertiajs/react';

type Period = { name: string; grade: string | null; units: number[] };
type Item = {
    id: number;
    name: string;
    code: string | null;
    grade: string | null;
    credits: number | null;
    coefficient: number | null;
    status: string;
    selected?: string;
};
type Unit = Item & { items: Item[]; earned_credits: number };
type Summary = {
    reference: string;
    edition: number;
    published_at: string;
    decision: string;
    annual: string | null;
    ordinary_reference: string | null;
    context: { year: string; program: string; level: string; session: string; scale: number; credit_label: string };
};
type Selected = Summary & {
    periods: Record<string, Period>;
    units: Unit[];
    credits: { earned: number; planned: number; registered: number; compensated: number; recognized: number; remaining: number };
    deadline: string | null;
    can_appeal: boolean;
    appeals: { id: number; result_target: string; status: string; response: string | null }[];
};
export type OfficialResultsProps = { items: { data: Summary[] } | null; selected: Selected | null };
const statuses: Record<string, string> = {
    passed: 'Validé',
    compensated: 'Compensé',
    recognized: 'Reconnu',
    incomplete: 'Incomplet',
    failed: 'Non validé',
    eliminatory: 'Éliminatoire',
};
const appeals: Record<string, string> = {
    open: 'Déposé',
    under_review: 'En vérification',
    admissible: 'Recevable',
    investigating: 'En instruction',
    accepted: 'Accepté',
    rejected: 'Rejeté',
    inadmissible: 'Irrecevable',
};
const quantity = (value: number, divisor = 100) => new Intl.NumberFormat('fr', { maximumFractionDigits: 3 }).format(value / divisor);

function AppealForm({ result, academic }: { result: Selected; academic: number }) {
    const form = useForm({ target: '', body: '', file: null as File | null });
    const filed = new Set(result.appeals.map((appeal) => appeal.result_target));
    const targets = [
        { code: 'decision', label: 'Décision du jury' },
        ...result.units.flatMap((unit) => unit.items.map((item) => ({ code: `ec:${item.id}`, label: item.name }))),
    ].filter((item) => !filed.has(item.code));
    if (!targets.length) return null;
    return (
        <details>
            <summary>Déposer un recours</summary>
            <form
                className="portal-form"
                onSubmit={(event) => {
                    event.preventDefault();
                    form.post(route('dashboard.student.results.appeal', { reference: result.reference, academic }), {
                        forceFormData: true,
                        preserveScroll: true,
                        onSuccess: () => form.reset(),
                    });
                }}
            >
                <label>
                    Résultat concerné{' '}
                    <select required value={form.data.target} onChange={(e) => form.setData('target', e.target.value)}>
                        <option value="">Choisir</option>
                        {targets.map((item) => (
                            <option value={item.code} key={item.code}>
                                {item.label}
                            </option>
                        ))}
                    </select>
                </label>
                <label>
                    Motif du recours{' '}
                    <textarea
                        required
                        minLength={10}
                        maxLength={6000}
                        value={form.data.body}
                        onChange={(e) => form.setData('body', e.target.value)}
                    />
                </label>
                <label>
                    Pièce facultative (PDF ou image){' '}
                    <input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={(e) => form.setData('file', e.target.files?.[0] ?? null)} />
                </label>
                {Object.values(form.errors).map((error, index) => (
                    <p key={index} role="alert">
                        {error}
                    </p>
                ))}
                <button className="portal-primary" disabled={form.processing}>
                    Transmettre mon recours
                </button>
            </form>
        </details>
    );
}

export default function OfficialResults({ data, academic }: { data: OfficialResultsProps; academic: number }) {
    const selected = data.selected;
    if (!data.items) return null;
    const url = (reference: string) => route('dashboard.student.index', { section: 'results', academic, official: reference });
    return (
        <section className="portal-panel">
            <h2>Résultats officiels</h2>
            {!selected && <p>Aucune édition officielle n’a été publiée pour cette inscription.</p>}
            {selected && (
                <>
                    <p>
                        {selected.context.program} · {selected.context.level} · {selected.context.year} · Session {selected.context.session}
                    </p>
                    <p>
                        Édition {selected.edition} publiée le {formatDate(selected.published_at, true)} · {selected.decision}
                    </p>
                    <p>
                        Moyenne annuelle {selected.annual ?? 'indisponible'} / {quantity(selected.context.scale)}
                    </p>
                    <p>
                        {quantity(selected.credits.earned)} / {quantity(selected.credits.planned)} {selected.context.credit_label} acquis ·{' '}
                        {quantity(selected.credits.registered)} inscrits · {quantity(selected.credits.remaining)} à acquérir.
                    </p>
                    <p>
                        {quantity(selected.credits.compensated)} compensés · {quantity(selected.credits.recognized)} reconnus.
                    </p>
                    {selected.ordinary_reference && (
                        <p>
                            <Link href={url(selected.ordinary_reference)}>Consulter l’édition ordinaire de référence</Link>
                        </p>
                    )}
                    {Object.entries(selected.periods).map(([key, period]) => (
                        <section key={key}>
                            <h3>
                                {period.name} · Moyenne {period.grade ?? '—'}
                            </h3>
                            <div style={{ overflowX: 'auto' }}>
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>UE et EC</th>
                                            <th>Note</th>
                                            <th>Crédits</th>
                                            <th>Coefficient</th>
                                            <th>Situation</th>
                                        </tr>
                                    </thead>
                                    {selected.units
                                        .filter((unit) => period.units.includes(unit.id))
                                        .map((unit) => (
                                            <tbody key={unit.id}>
                                                <tr>
                                                    <th scope="row">{unit.name}</th>
                                                    <td>{unit.grade ?? '—'}</td>
                                                    <td>{quantity(unit.earned_credits)}</td>
                                                    <td>—</td>
                                                    <td>{statuses[unit.status]}</td>
                                                </tr>
                                                {unit.items.map((item) => (
                                                    <tr key={item.id}>
                                                        <td>
                                                            {item.name}
                                                            {item.selected === 'ordinary' && ' · Ordinaire'}
                                                        </td>
                                                        <td>{item.grade ?? '—'}</td>
                                                        <td>{item.credits === null ? '—' : quantity(item.credits)}</td>
                                                        <td>{item.coefficient === null ? '—' : quantity(item.coefficient, 1000)}</td>
                                                        <td>{statuses[item.status]}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        ))}
                                </table>
                            </div>
                        </section>
                    ))}
                    <div className="student-dossier-links">
                        <a href={route('dashboard.student.results.document', { reference: selected.reference, kind: 'report', academic })}>
                            Télécharger le bulletin (PDF)
                        </a>
                        <a href={route('dashboard.student.results.document', { reference: selected.reference, kind: 'transcript', academic })}>
                            Télécharger le relevé annuel (PDF)
                        </a>
                    </div>
                    <h3>Recours</h3>
                    {selected.deadline && <p>Dépôt possible jusqu’au {formatDate(selected.deadline, true)}.</p>}
                    {selected.can_appeal && <AppealForm key={selected.reference} result={selected} academic={academic} />}
                    {selected.appeals.length > 0 && (
                        <ul>
                            {selected.appeals.map((appeal) => (
                                <li key={appeal.id}>
                                    Recours n°{appeal.id} · {appeals[appeal.status]} {appeal.response && <p>{appeal.response}</p>}
                                </li>
                            ))}
                        </ul>
                    )}
                </>
            )}
            {data.items.data.length > 0 && (
                <>
                    <h3>Éditions publiées</h3>
                    <ul>
                        {data.items.data.map((item) => (
                            <li key={item.reference}>
                                <Link href={url(item.reference)} aria-current={selected?.reference === item.reference ? 'page' : undefined}>
                                    {item.context.session} · Édition {item.edition} · {formatDate(item.published_at, true)}
                                </Link>
                            </li>
                        ))}
                    </ul>
                    <Pagination value={data.items} />
                </>
            )}
        </section>
    );
}
