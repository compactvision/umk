import AdminModal from '@/components/admin/AdminModal';
import Pagination from '@/components/admin/Pagination';
import Dashboard from '@/components/layouts/Dashboard/Dashboard';
import { labels, money, type Balance } from '@/components/student/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowRight, CalendarDays, Download, FileSpreadsheet, Filter, Landmark, ShieldCheck, Users } from 'lucide-react';
import { useState } from 'react';
import '../../../../css/dashboard/finance.css';
import '../../../../css/dashboard/student-academic.css';
import '../../../../css/student-portal.css';
import AcademicForm, { type Field, type FormSpec } from '../studentAcademic/AcademicForm';
import type { FinanceBreakdowns } from './FinanceCharts';
import FinanceOverview, { financeReportQuery, type Cashflow, type FinanceTotal } from './FinanceOverview';

type Payment = {
    id: number;
    reference: string;
    amount_cents: number;
    currency: string;
    kind: string;
    method: string;
    status: string;
    confirmed_at: string | null;
};
type Tariff = {
    id: number;
    title: string;
    version: number;
    scope_key: string;
    currency: string;
    category: string;
    kind: string;
    status: string;
    schedule: { amount_cents: number; due_at: string }[];
};
type Entry = { id: number; name: string; matricule: string | null; year: string; faculty: string; level: string; program: string | null };
type Refund = {
    id: number;
    student_payment_id: number;
    amount_cents: number;
    status: string;
    reason: string;
    execution_reference: string | null;
    executed_at: string | null;
};
type Paginated<T> = { data: T[]; links: { url: string | null; label: string; active: boolean }[]; total?: number };
type Props = {
    entries: Paginated<Entry>;
    selected: Entry | null;
    filters: { q?: string; year?: number; faculty?: number; program?: number; level?: number; academic?: number };
    statement: {
        balance: Balance;
        schedules: Record<string, { id: string | number; title: string; due_at: string | null; remaining_cents: number; status: string }[]>;
        kinds: Record<string, Balance>;
    } | null;
    totals: FinanceTotal[];
    cashflow: Cashflow;
    breakdowns: FinanceBreakdowns;
    obligations: { id: number; title: string; kind: string; amount_cents: number; due_at: string | null }[];
    adjustments: Paginated<{
        id: number;
        type: string;
        fee_kind: string;
        amount_cents: number | null;
        funding_source: string;
        reason: string;
        is_active: boolean;
    }> | null;
    payments: Paginated<Payment> | null;
    refunds: Paginated<Refund> | null;
    tariffs: Paginated<Tariff>;
    years: { id: number; title: string }[];
    faculties: { id: number; name: string }[];
    programs: { id: number; name: string; faculty_id: number }[];
    levels: { id: number; title: string; faculty_id: number; faculty: { name: string } }[];
    cycles: { id: number; name: string }[];
    currencies: string[];
    methods: string[];
    dualControl: boolean;
    preview: {
        account: string;
        rows: { bank_reference: string; payment_reference: string; amount_cents: number; currency: string; date: string; state: string }[];
    } | null;
};
const reason: Field = { name: 'reason', label: 'Justification', required: true, type: 'textarea' };
const statusLabel = (value: string) =>
    labels[value] ||
    ({
        requested: 'Demandé',
        approved: 'Autorisé',
        executed: 'Décaissement exécuté',
        draft: 'Brouillon',
        match: 'Correspondance exacte',
        mismatch: 'Écart',
        duplicate: 'Doublon',
        unmatched: 'Sans correspondance autorisée',
        unallocated: 'Non affecté',
    }[value] ??
        value);
export default function Finance(props: Props) {
    const [spec, setSpec] = useState<FormSpec | null>(null);
    const [allocating, setAllocating] = useState<Payment | null>(null);
    const search = useForm({
        q: props.filters.q ?? '',
        year: String(props.filters.year ?? ''),
        faculty: String(props.filters.faculty ?? ''),
        program: String(props.filters.program ?? ''),
        level: String(props.filters.level ?? ''),
        academic: props.selected?.id ?? '',
    });
    const year = props.years.find((item) => item.id === Number(props.filters.year));
    const faculty = props.faculties.find((item) => item.id === Number(props.filters.faculty));
    const entriesCount = props.entries.total ?? props.entries.data.length;
    const programs = props.programs.filter((item) => !search.data.faculty || String(item.faculty_id) === search.data.faculty);
    const levels = props.levels.filter((item) => !search.data.faculty || String(item.faculty_id) === search.data.faculty);
    const base = route('dashboard.admin.finance.index');
    const staffBase = '/dashboard/admin/student-academic';
    const show = (
        title: string,
        action: string,
        fields: Field[],
        values: FormSpec['values'] = {},
        description = 'Les valeurs officielles sont contrôlées côté serveur et l’opération est auditée.',
    ) => setSpec({ title, action, fields, values, description, submitLabel: 'Enregistrer après contrôle' });
    const feeKinds = [...new Set(props.obligations.map((o) => o.kind))];
    const kindField: Field = {
        name: 'fee_kind',
        label: 'Frais concernés',
        type: 'select',
        required: true,
        options: feeKinds.map((kind) => ({ value: kind, label: kind })),
    };
    const actionReason = (status: string): Field[] => [
        reason,
        ...(status === 'executed'
            ? [
                  {
                      name: 'method',
                      label: 'Méthode du décaissement exécuté',
                      type: 'select',
                      required: true,
                      options: props.methods.map((value) => ({ value, label: value })),
                  },
                  { name: 'execution_reference', label: 'Référence du décaissement confirmé', required: true },
              ]
            : []),
    ];
    return (
        <Dashboard hideAppsNavigation>
            <Head title="Gestion financière universitaire" />
            {spec && <AcademicForm spec={spec} onClose={() => setSpec(null)} onSuccess={() => setSpec(null)} />}
            {allocating && <Allocation payment={allocating} obligations={props.obligations} close={() => setAllocating(null)} />}
            <div className="student-portal academic-administration finance-workspace">
                <header className="finance-hero">
                    <Landmark className="finance-hero-watermark" size={224} strokeWidth={0.65} aria-hidden="true" />
                    <div className="finance-hero-copy">
                        <h1>Finances universitaires</h1>
                        <p>Encaissements, échéances et comptes étudiants par devise.</p>
                        <div className="finance-hero-context">
                            <span>
                                <CalendarDays size={16} aria-hidden="true" /> {year?.title ?? 'Toutes les années'}
                            </span>
                            {faculty && (
                                <span>
                                    <Landmark size={16} aria-hidden="true" /> {faculty.name}
                                </span>
                            )}
                            <span>
                                <Users size={16} aria-hidden="true" /> {entriesCount.toLocaleString('fr-FR')}{' '}
                                {entriesCount === 1 ? 'compte' : 'comptes'}
                            </span>
                        </div>
                    </div>
                    <div className="finance-export-actions">
                        <a className="finance-export finance-export-xlsx" href={route('dashboard.admin.finance.export-xlsx', props.filters)}>
                            <FileSpreadsheet size={19} aria-hidden="true" /> Exporter le rapport Excel
                        </a>
                        <a className="finance-export finance-export-csv" href={route('dashboard.admin.finance.export', props.filters)}>
                            <Download size={17} aria-hidden="true" /> Exporter les totaux CSV
                        </a>
                    </div>
                </header>
                <nav className="finance-section-links" aria-label="Sections financières">
                    <a href="#reports">Suivi financier</a>
                    {props.totals.length > 0 && <a href="#finance-faculties">Recouvrement par faculté</a>}
                    <a href="#comptes">Comptes étudiants</a>
                    {props.selected && <a href="#compte">Compte ouvert</a>}
                    <a href="#tariffs">Barèmes</a>
                    <a href="#reconciliation">Rapprochement</a>
                </nav>
                <form
                    id="finance-filters"
                    className="portal-form finance-filters"
                    onSubmit={(event) => {
                        event.preventDefault();
                        search.transform((data) => Object.fromEntries(Object.entries(data).filter(([, value]) => value !== '')));
                        search.get(base, { preserveScroll: true, preserveState: true });
                    }}
                >
                    <div className="finance-section-heading">
                        <h2>
                            <Filter size={18} aria-hidden="true" /> Périmètre du rapport
                        </h2>
                        <Link href={base} preserveScroll>
                            Réinitialiser
                        </Link>
                    </div>
                    <label className="finance-search-field">
                        Rechercher un étudiant
                        <input value={search.data.q} onChange={(e) => search.setData('q', e.target.value)} placeholder="Matricule, nom ou email" />
                    </label>
                    <label>
                        Année
                        <select value={search.data.year} onChange={(e) => search.setData('year', e.target.value)}>
                            <option value="">Toutes</option>
                            {props.years.map((v) => (
                                <option key={v.id} value={v.id}>
                                    {v.title}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label>
                        Faculté
                        <select
                            value={search.data.faculty}
                            onChange={(e) => search.setData({ ...search.data, faculty: e.target.value, program: '', level: '' })}
                        >
                            <option value="">Toutes</option>
                            {props.faculties.map((v) => (
                                <option key={v.id} value={v.id}>
                                    {v.name}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label>
                        Programme
                        <select value={search.data.program} onChange={(e) => search.setData('program', e.target.value)}>
                            <option value="">Tous</option>
                            {programs.map((v) => (
                                <option key={v.id} value={v.id}>
                                    {v.name}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label>
                        Niveau / faculté
                        <select value={search.data.level} onChange={(e) => search.setData('level', e.target.value)}>
                            <option value="">Tous</option>
                            {levels.map((v) => (
                                <option key={v.id} value={v.id}>
                                    {v.faculty.name} · {v.title}
                                </option>
                            ))}
                        </select>
                    </label>
                    <button type="submit" className="portal-primary" disabled={search.processing} aria-busy={search.processing || undefined}>
                        Filtrer <ArrowRight size={16} aria-hidden="true" />
                    </button>
                </form>
                <section id="reports" className="finance-report" aria-labelledby="finance-report-title">
                    <FinanceOverview
                        totals={props.totals}
                        cashflow={props.cashflow}
                        breakdowns={props.breakdowns}
                        preferredCurrency={props.currencies[0]}
                        facultyHref={(id) => {
                            if (props.filters.faculty !== undefined && Number(props.filters.faculty) === id) return;
                            const filters = { ...props.filters, faculty: id };
                            delete filters.academic;
                            return route('dashboard.admin.finance.index', filters);
                        }}
                    />
                </section>
                <section id="comptes" className="portal-panel finance-operational-panel">
                    <div className="finance-section-heading">
                        <div>
                            <h2>Comptes étudiants</h2>
                            <p>Obligations, versements et décisions par compte.</p>
                        </div>
                    </div>
                    <div className="academic-table-scroll">
                        <table className="academic-table">
                            <thead>
                                <tr>
                                    <th>Étudiant</th>
                                    <th>Année</th>
                                    <th>Parcours</th>
                                    <th>Compte</th>
                                </tr>
                            </thead>
                            <tbody data-dashboard-panel={`${financeReportQuery} page`}>
                                {props.entries.data.map((entry) => (
                                    <tr key={entry.id}>
                                        <td>
                                            {entry.name}
                                            <small>{entry.matricule}</small>
                                        </td>
                                        <td>{entry.year}</td>
                                        <td>
                                            {entry.faculty} · {entry.program ?? entry.level}
                                        </td>
                                        <td>
                                            <Link
                                                className="finance-account-link"
                                                href={base}
                                                preserveScroll
                                                data={{ ...props.filters, academic: entry.id }}
                                                onSuccess={() => {
                                                    requestAnimationFrame(() => {
                                                        const title = document.getElementById('finance-account-title');
                                                        title?.focus({ preventScroll: true });
                                                        title?.scrollIntoView({ block: 'start' });
                                                    });
                                                }}
                                            >
                                                Ouvrir le suivi financier <ArrowRight size={15} aria-hidden="true" />
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                                {props.entries.data.length === 0 && (
                                    <tr>
                                        <td colSpan={4}>Aucun compte ne correspond à ces filtres.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <Pagination value={props.entries} preserveScroll preserveState />
                </section>
                {props.selected && (
                    <section id="compte" className="portal-panel finance-operational-panel finance-account" data-dashboard-panel="academic">
                        <div className="finance-section-heading">
                            <div>
                                <h2 id="finance-account-title" tabIndex={-1}>
                                    {props.selected.name} · {props.selected.year}
                                </h2>
                                <p>{[props.selected.matricule, props.selected.level].filter(Boolean).join(' · ')}</p>
                            </div>
                            <Link
                                className="finance-account-link"
                                href={route('dashboard.admin.student-academic.show', { academic: props.selected.id, section: 'Finances' })}
                            >
                                Dossier étudiant 360° <ArrowRight size={15} aria-hidden="true" />
                            </Link>
                        </div>
                        {props.statement && (
                            <dl className="finance-account-balances">
                                {[
                                    ['Obligations nettes', props.statement.balance.due_cents],
                                    ['Réglé', props.statement.balance.paid_cents],
                                    ['Reste dû', props.statement.balance.balance_cents],
                                    ['Crédit / non affecté', props.statement.balance.credit_cents],
                                ].map(([title, amount]) => (
                                    <div key={title}>
                                        <dt>{title}</dt>
                                        <dd>{money(Number(amount), props.statement!.balance.currency)}</dd>
                                    </div>
                                ))}
                            </dl>
                        )}
                        {props.dualControl && (
                            <p className="finance-control">
                                <ShieldCheck size={16} aria-hidden="true" /> La confirmation exige un agent distinct de l’auteur de saisie.
                            </p>
                        )}
                        <div className="student-dossier-links">
                            <button
                                className="admin-secondary"
                                onClick={() =>
                                    show('Émettre les obligations du barème', route('dashboard.admin.finance.bill', props.selected!.id), [
                                        {
                                            name: 'tariff_id',
                                            label: 'Version active à appliquer',
                                            type: 'select',
                                            required: true,
                                            options: props.tariffs.data
                                                .filter((v) => v.status === 'active')
                                                .map((v) => ({ value: v.id, label: `${v.title} · V${v.version} · ${v.category} · ${v.currency}` })),
                                        },
                                        reason,
                                    ])
                                }
                            >
                                Facturer un barème actif
                            </button>
                            <button
                                className="admin-secondary"
                                onClick={() =>
                                    show('Enregistrer un versement en vérification', `${staffBase}/${props.selected!.id}/payments`, [
                                        {
                                            name: 'kind',
                                            label: 'Destination du versement',
                                            type: 'select',
                                            required: true,
                                            options: [...feeKinds, 'unallocated'].map((value) => ({
                                                value,
                                                label: value === 'unallocated' ? 'À affecter à plusieurs frais après confirmation' : value,
                                            })),
                                        },
                                        { name: 'amount', label: 'Montant décimal', required: true },
                                        {
                                            name: 'method',
                                            label: 'Mode',
                                            type: 'select',
                                            required: true,
                                            options: props.methods.map((value) => ({ value, label: value })),
                                        },
                                        { name: 'reference', label: 'Référence unique réelle', required: true },
                                        { name: 'note', label: 'Pièce ou justification du versement', type: 'textarea', required: true },
                                    ])
                                }
                            >
                                Saisir un versement
                            </button>
                            <button
                                className="admin-secondary"
                                disabled={!feeKinds.length}
                                onClick={() =>
                                    show(
                                        'Bourse, réduction ou exonération',
                                        `${staffBase}/${props.selected!.id}/adjustments`,
                                        [
                                            kindField,
                                            {
                                                name: 'type',
                                                label: 'Décision',
                                                type: 'select',
                                                required: true,
                                                options: [
                                                    { value: 'scholarship', label: 'Bourse' },
                                                    { value: 'reduction', label: 'Réduction' },
                                                    { value: 'exemption', label: 'Exonération' },
                                                ],
                                            },
                                            {
                                                name: 'funding_source',
                                                label: 'Financement',
                                                type: 'select',
                                                value: 'institution',
                                                options: [
                                                    { value: 'institution', label: 'Institution — réduction des frais dus' },
                                                    { value: 'third_party', label: 'Tiers — financement attendu, non encaissé' },
                                                ],
                                            },
                                            { name: 'amount', label: 'Montant fixe (laisser vide pour pourcentage / exonération)' },
                                            { name: 'percentage', label: 'Pourcentage (à la place du montant fixe)' },
                                            { name: 'starts_at', label: 'Début', type: 'date' },
                                            { name: 'expires_at', label: 'Fin', type: 'date' },
                                            { name: 'stackable', label: 'Cumul expressément autorisé avec les aides compatibles', type: 'checkbox' },
                                            reason,
                                        ],
                                        { operation_key: crypto.randomUUID() },
                                    )
                                }
                            >
                                Accorder une aide
                            </button>
                            <button
                                className="admin-secondary"
                                disabled={!feeKinds.length}
                                onClick={() =>
                                    show(
                                        'Échéancier / moratoire approuvé',
                                        `${staffBase}/${props.selected!.id}/adjustments`,
                                        [
                                            kindField,
                                            {
                                                name: 'schedule',
                                                label: 'Échéances couvrant exactement les frais nets',
                                                type: 'schedule',
                                                required: true,
                                            },
                                            reason,
                                        ],
                                        { type: 'plan', operation_key: crypto.randomUUID() },
                                    )
                                }
                            >
                                Réaménager les échéances
                            </button>
                        </div>
                        {props.statement && (
                            <div>
                                <h3>Échéancier applicable</h3>
                                {Object.values(props.statement.schedules)
                                    .flat()
                                    .map((line) => (
                                        <p key={line.id}>
                                            {line.title} · {line.due_at ?? 'Sans date'} · Reste{' '}
                                            {money(line.remaining_cents, props.statement!.balance.currency)} · {statusLabel(line.status)}
                                        </p>
                                    ))}
                            </div>
                        )}
                        <h3>Aides et décisions financières</h3>
                        {props.adjustments?.data.map((a) => (
                            <article key={a.id}>
                                <p>
                                    {a.type} · {a.fee_kind} ·{' '}
                                    {a.funding_source === 'third_party' ? 'Financement attendu d’un tiers' : 'Décision de l’institution'} ·{' '}
                                    {a.amount_cents !== null
                                        ? money(a.amount_cents, props.statement!.balance.currency)
                                        : 'Voir échéancier / périmètre'}{' '}
                                    · {a.is_active ? 'Active (selon dates)' : 'Révoquée ou remplacée'}
                                </p>
                                <p>{a.reason}</p>
                                {a.is_active && (
                                    <button
                                        className="academic-link-button"
                                        onClick={() =>
                                            show('Révoquer la décision en conservant son historique', `${staffBase}/adjustments/${a.id}/revoke`, [
                                                reason,
                                            ])
                                        }
                                    >
                                        Révoquer avec justification
                                    </button>
                                )}
                            </article>
                        ))}
                        <Pagination value={props.adjustments} preserveScroll preserveState />
                        <h3>Paiements et affectations</h3>
                        <div className="academic-table-scroll">
                            <table className="academic-table">
                                <thead>
                                    <tr>
                                        <th>Référence</th>
                                        <th>Montant</th>
                                        <th>État</th>
                                        <th>Actions autorisées</th>
                                    </tr>
                                </thead>
                                <tbody data-dashboard-panel="payments_page">
                                    {props.payments?.data.map((p) => (
                                        <tr key={p.id}>
                                            <td>
                                                {p.reference}
                                                <small>
                                                    {p.kind} · {p.method}
                                                </small>
                                            </td>
                                            <td>{money(p.amount_cents, p.currency)}</td>
                                            <td>{statusLabel(p.status)}</td>
                                            <td>
                                                {p.status === 'pending' && (
                                                    <button
                                                        className="academic-link-button"
                                                        onClick={() =>
                                                            show(
                                                                'Confirmer après contrôle réel du versement',
                                                                `${staffBase}/payments/${p.id}/status`,
                                                                [reason],
                                                                { status: 'confirmed' },
                                                            )
                                                        }
                                                    >
                                                        Confirmer
                                                    </button>
                                                )}
                                                {['pending', 'confirmed'].includes(p.status) && (
                                                    <button
                                                        className="academic-link-button"
                                                        onClick={() =>
                                                            show(
                                                                'Annuler l’écriture sans la supprimer',
                                                                `${staffBase}/payments/${p.id}/status`,
                                                                [reason],
                                                                { status: 'cancelled' },
                                                                'Cette contrepassation est auditée. Elle ne réalise aucun transfert bancaire.',
                                                            )
                                                        }
                                                    >
                                                        Annuler l’écriture
                                                    </button>
                                                )}
                                                {p.status === 'confirmed' && (
                                                    <>
                                                        <button
                                                            className="academic-link-button"
                                                            onClick={() =>
                                                                show(
                                                                    'Demander un remboursement',
                                                                    route('dashboard.admin.finance.refund', p.id),
                                                                    [{ name: 'amount', label: 'Montant demandé', required: true }, reason],
                                                                    { operation_key: crypto.randomUUID() },
                                                                    'La demande ne constitue pas un décaissement. Une autorisation puis une référence d’exécution sont nécessaires.',
                                                                )
                                                            }
                                                        >
                                                            Demander un remboursement
                                                        </button>
                                                        {p.kind === 'unallocated' && (
                                                            <button className="academic-link-button" onClick={() => setAllocating(p)}>
                                                                Affecter à plusieurs obligations
                                                            </button>
                                                        )}
                                                    </>
                                                )}
                                                {p.confirmed_at && (
                                                    <a href={route('dashboard.admin.finance.receipt', p.id)} target="_blank" rel="noreferrer">
                                                        Reçu et état actuel
                                                    </a>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <Pagination value={props.payments} preserveScroll preserveState />
                        <h3>Autorisations et décaissements</h3>
                        {props.refunds?.data.map((refund) => (
                            <article key={refund.id}>
                                <p>
                                    Paiement #{refund.student_payment_id} · {money(refund.amount_cents, props.statement!.balance.currency)} ·{' '}
                                    {statusLabel(refund.status)}
                                </p>
                                <p>{refund.reason}</p>
                                {refund.execution_reference && <p>Exécution : {refund.execution_reference}</p>}
                                {['requested', 'approved'].includes(refund.status) && (
                                    <div className="student-dossier-links">
                                        <button
                                            className="admin-secondary"
                                            onClick={() =>
                                                show(
                                                    refund.status === 'requested'
                                                        ? 'Autoriser le remboursement'
                                                        : 'Attester le décaissement réellement exécuté',
                                                    route('dashboard.admin.finance.refunds.status', refund.id),
                                                    actionReason(refund.status === 'requested' ? 'approved' : 'executed'),
                                                    { status: refund.status === 'requested' ? 'approved' : 'executed' },
                                                    'Cette action engage votre validation et est auditée. Ne confirmez une exécution qu’après contrôle du décaissement.',
                                                )
                                            }
                                        >
                                            {refund.status === 'requested' ? 'Autoriser' : 'Confirmer le décaissement exécuté'}
                                        </button>
                                        <button
                                            className="admin-secondary"
                                            onClick={() =>
                                                show(
                                                    'Annuler la demande de remboursement',
                                                    route('dashboard.admin.finance.refunds.status', refund.id),
                                                    [reason],
                                                    { status: 'cancelled' },
                                                )
                                            }
                                        >
                                            Annuler la demande
                                        </button>
                                    </div>
                                )}
                            </article>
                        ))}
                        <Pagination value={props.refunds} preserveScroll preserveState />
                    </section>
                )}
                <section className="portal-panel finance-operational-panel" id="tariffs">
                    <h2>Barèmes versionnés</h2>
                    <button
                        className="admin-secondary"
                        onClick={() =>
                            show('Nouvelle version de barème', route('dashboard.admin.finance.tariffs'), [
                                { name: 'title', label: 'Libellé', required: true },
                                {
                                    name: 'academic_year_id',
                                    label: 'Année',
                                    type: 'select',
                                    required: true,
                                    options: props.years.map((v) => ({ value: v.id, label: v.title })),
                                },
                                {
                                    name: 'academic_program_id',
                                    label: 'Programme (vide : tous)',
                                    type: 'select',
                                    options: props.programs.map((v) => ({ value: v.id, label: v.name })),
                                },
                                {
                                    name: 'level_id',
                                    label: 'Niveau (vide : tous)',
                                    type: 'select',
                                    options: props.levels.map((v) => ({ value: v.id, label: `${v.faculty.name} · ${v.title}` })),
                                },
                                {
                                    name: 'academic_cycle_id',
                                    label: 'Cycle (vide : tous)',
                                    type: 'select',
                                    options: props.cycles.map((v) => ({ value: v.id, label: v.name })),
                                },
                                { name: 'category', label: 'Catégorie configurée (national, foreign…)', required: true },
                                { name: 'kind', label: 'Catégorie de frais (tuition ou autre code)', required: true },
                                {
                                    name: 'currency',
                                    label: 'Devise',
                                    type: 'select',
                                    required: true,
                                    options: props.currencies.map((v) => ({ value: v, label: v })),
                                },
                                { name: 'valid_from', label: 'Début de validité', type: 'date', required: true },
                                { name: 'valid_until', label: 'Fin de validité', type: 'date' },
                                { name: 'schedule', label: 'Échéances du barème', type: 'schedule', required: true },
                                reason,
                            ])
                        }
                    >
                        Créer une version
                    </button>
                    <div className="academic-table-scroll">
                        <table className="academic-table">
                            <thead>
                                <tr>
                                    <th>Barème</th>
                                    <th>Périmètre</th>
                                    <th>État</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody data-dashboard-panel="tariffs_page">
                                {props.tariffs.data.map((t) => (
                                    <tr key={t.id}>
                                        <td>
                                            {t.title} · V{t.version}
                                        </td>
                                        <td>
                                            {t.category} · {t.kind} · {t.currency}
                                        </td>
                                        <td>{statusLabel(t.status)}</td>
                                        <td>
                                            {t.status === 'draft' && (
                                                <button
                                                    className="academic-link-button"
                                                    onClick={() =>
                                                        show('Activer cette version', route('dashboard.admin.finance.tariffs.activate', t.id), [
                                                            {
                                                                name: 'replace_id',
                                                                label: 'Version active à remplacer si chevauchement',
                                                                type: 'select',
                                                                options: props.tariffs.data
                                                                    .filter((v) => v.scope_key === t.scope_key && v.status === 'active')
                                                                    .map((v) => ({ value: v.id, label: `${v.title} · V${v.version}` })),
                                                            },
                                                            reason,
                                                        ])
                                                    }
                                                >
                                                    Activer après contrôle
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <Pagination value={props.tariffs} preserveScroll preserveState />
                </section>
                <Reconciliation preview={props.preview} />
                <section className="portal-panel finance-operational-panel" id="settings">
                    <h2>Paramètres financiers appliqués</h2>
                    <p>
                        Devises suivies séparément : {props.currencies.join(', ')}. Modes disponibles : {props.methods.join(', ')}.
                    </p>
                    <p>
                        Double contrôle : {props.dualControl ? 'activé' : 'désactivé'}. Les règles d’accès académique restent configurées dans
                        l’administration académique.
                    </p>
                </section>
            </div>
        </Dashboard>
    );
}
function Allocation({ payment, obligations, close }: { payment: Payment; obligations: Props['obligations']; close: () => void }) {
    const form = useForm({ amounts: Object.fromEntries(obligations.map((o) => [String(o.id), ''])), reason: '' });
    return (
        <AdminModal
            title="Affecter le versement confirmé"
            description={`${payment.reference} · ${money(payment.amount_cents, payment.currency)}`}
            formId="finance-allocation"
            submitLabel="Affecter après contrôle"
            busy={form.processing}
            errors={form.errors}
            onClose={close}
        >
            <form
                id="finance-allocation"
                className="portal-form"
                onSubmit={(event) => {
                    event.preventDefault();
                    form.transform((data) => ({
                        reason: data.reason,
                        allocations: Object.entries(data.amounts)
                            .filter(([, amount]) => amount !== '')
                            .map(([id, amount]) => ({ obligation_id: Number(id), amount })),
                    }));
                    form.post(route('dashboard.admin.finance.allocate', payment.id), { onSuccess: close });
                }}
            >
                {obligations.map((o) => (
                    <label key={o.id}>
                        {o.title} ({o.kind})
                        <input
                            inputMode="decimal"
                            value={form.data.amounts[o.id]}
                            onChange={(e) => form.setData('amounts', { ...form.data.amounts, [o.id]: e.target.value })}
                        />
                    </label>
                ))}
                <label>
                    Justification
                    <textarea required minLength={10} value={form.data.reason} onChange={(e) => form.setData('reason', e.target.value)} />
                </label>
            </form>
        </AdminModal>
    );
}
function Reconciliation({ preview }: { preview: Props['preview'] }) {
    const upload = useForm<{ file: File | null; account: string }>({ file: null, account: '' });
    const confirm = useForm<{ rows: number[]; reason: string }>({ rows: [], reason: '' });
    return (
        <section className="portal-panel finance-operational-panel" id="reconciliation">
            <h2>Rapprochement explicite d’un relevé CSV</h2>
            <p>Colonnes : bank_reference,payment_reference,amount,currency,date. Aucun paiement n’est confirmé par le seul dépôt du fichier.</p>
            <form
                className="portal-form"
                onSubmit={(event) => {
                    event.preventDefault();
                    upload.post(route('dashboard.admin.finance.reconciliation.preview'), { forceFormData: true });
                }}
            >
                <label>
                    Compte ou journal bancaire
                    <input required value={upload.data.account} onChange={(e) => upload.setData('account', e.target.value)} />
                </label>
                <label>
                    Relevé CSV
                    <input type="file" accept=".csv,text/csv" required onChange={(e) => upload.setData('file', e.target.files?.[0] ?? null)} />
                </label>
                {Object.values(upload.errors).map((error) => (
                    <p role="alert" key={error}>
                        {error}
                    </p>
                ))}
                <button className="portal-primary" disabled={upload.processing}>
                    Prévisualiser sans modifier les paiements
                </button>
            </form>
            {preview && (
                <form
                    className="portal-form"
                    onSubmit={(event) => {
                        event.preventDefault();
                        confirm.post(route('dashboard.admin.finance.reconciliation.commit'));
                    }}
                >
                    <h3>{preview.account}</h3>
                    {preview.rows.map((row, index) => (
                        <label key={index}>
                            <input
                                type="checkbox"
                                disabled={row.state !== 'match'}
                                checked={confirm.data.rows.includes(index)}
                                onChange={(e) =>
                                    confirm.setData(
                                        'rows',
                                        e.target.checked ? [...confirm.data.rows, index] : confirm.data.rows.filter((v) => v !== index),
                                    )
                                }
                            />
                            {row.bank_reference} · {row.payment_reference} · {money(row.amount_cents, row.currency)} · {statusLabel(row.state)}
                        </label>
                    ))}
                    <label>
                        Justification du rapprochement
                        <textarea required minLength={10} value={confirm.data.reason} onChange={(e) => confirm.setData('reason', e.target.value)} />
                    </label>
                    {Object.values(confirm.errors).map((error) => (
                        <p key={error} role="alert">
                            {error}
                        </p>
                    ))}
                    <button className="portal-primary" disabled={confirm.processing || !confirm.data.rows.length}>
                        Confirmer les correspondances sélectionnées
                    </button>
                </form>
            )}
        </section>
    );
}
