import { money } from '@/components/student/types';
import { usePanelFade } from '@/hooks/use-panel-fade';
import { Link } from '@inertiajs/react';
import { ArrowRight, ChevronDown, CircleDollarSign, Landmark, Layers3, ReceiptText, type LucideIcon } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { FinanceTotal } from './FinanceOverview';

type FinanceBreakdown = Pick<FinanceTotal, 'currency' | 'billed_cents' | 'waived_cents' | 'due_cents' | 'balance_cents' | 'overdue_cents'> & {
    covered_cents: number;
};
type FacultyRow = FinanceBreakdown & { faculty_id: number; faculty_name: string };
type FeeRow = FinanceBreakdown & { kind: string };
export type FinanceBreakdowns = { faculties: FacultyRow[]; fee_kinds: FeeRow[] };

export function FinanceChartPanel({
    id,
    title,
    description,
    icon: Icon,
    controls,
    children,
}: {
    id: string;
    title: string;
    description: string;
    icon: LucideIcon;
    controls?: ReactNode;
    children: ReactNode;
}) {
    const panel = useRef<HTMLElement>(null);
    useEffect(() => {
        const element = panel.current;
        if (!element || typeof IntersectionObserver !== 'function' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    element.dataset.chartRevealed = 'true';
                    observer.disconnect();
                }
            },
            { threshold: 0.12 },
        );
        observer.observe(element);
        return () => observer.disconnect();
    }, []);
    return (
        <section ref={panel} className="finance-chart-panel" data-finance-chart={id} aria-labelledby={id}>
            <header className="finance-chart-top">
                <div className="finance-chart-heading">
                    <span className="finance-icon">
                        <Icon size={19} aria-hidden="true" />
                    </span>
                    <div>
                        <h3 id={id}>{title}</h3>
                        <p>{description}</p>
                    </div>
                </div>
                {controls}
            </header>
            {children}
        </section>
    );
}

const percentOf = (value: number, maximum: number) => `${maximum > 0 ? (value / maximum) * 100 : 0}%`;

type Bar = { label: string; cents: number; color?: 'gold' | 'deep' | 'soft' };

function AmountBars({ bars, currency }: { bars: Bar[]; currency: string }) {
    const maximum = Math.max(0, ...bars.map(({ cents }) => Math.abs(cents)));
    return (
        <dl className="finance-amount-bars">
            {bars.map(({ label, cents, color }) => (
                <div key={label}>
                    <dt>{label}</dt>
                    <dd>{money(cents, currency)}</dd>
                    <dd className="finance-value-track" aria-hidden="true">
                        <i
                            className="finance-value-fill"
                            data-color={color}
                            data-negative={cents < 0 || undefined}
                            style={{ width: percentOf(Math.abs(cents), maximum) }}
                        />
                    </dd>
                </div>
            ))}
        </dl>
    );
}

export function LedgerCharts({ total }: { total: FinanceTotal }) {
    return (
        <div className="finance-analysis-grid">
            <FinanceChartPanel
                id="finance-billing"
                title="Facturation et aides"
                description={`Obligations étudiantes · ${total.currency}`}
                icon={ReceiptText}
            >
                <AmountBars
                    currency={total.currency}
                    bars={[
                        { label: 'Facturé brut', cents: total.billed_cents, color: 'soft' },
                        { label: 'Aides déduites', cents: total.waived_cents, color: 'gold' },
                        { label: 'Frais nets', cents: total.due_cents, color: 'deep' },
                    ]}
                />
                <p className="finance-note">Les bourses, réductions et exonérations de l’université diminuent les frais dus.</p>
            </FinanceChartPanel>
            <FinanceChartPanel
                id="finance-payments"
                title="Du versement au net"
                description={`Écritures du périmètre filtré · ${total.currency}`}
                icon={CircleDollarSign}
            >
                <AmountBars
                    currency={total.currency}
                    bars={[
                        { label: 'Confirmés bruts', cents: total.gross_cents },
                        { label: 'Remboursés', cents: total.refunded_cents, color: 'gold' },
                        { label: 'Contrepassations historiques', cents: total.legacy_reversal_cents, color: 'soft' },
                        { label: 'Encaissements nets', cents: total.net_cents, color: 'deep' },
                    ]}
                />
                <dl className="finance-chart-facts">
                    <div>
                        <dt>En vérification</dt>
                        <dd>{money(total.pending_cents, total.currency)}</dd>
                    </div>
                    <div>
                        <dt>Écritures annulées</dt>
                        <dd>{money(total.cancelled_cents, total.currency)}</dd>
                    </div>
                </dl>
            </FinanceChartPanel>
        </div>
    );
}

const breakdownColumns = [
    ['Facturé brut', 'billed_cents'],
    ['Aides', 'waived_cents'],
    ['Frais nets', 'due_cents'],
    ['Couvert', 'covered_cents'],
    ['Reste dû', 'balance_cents'],
    ['Échu', 'overdue_cents'],
] as const;

function BreakdownTable({
    label,
    rows,
    currency,
}: {
    label: string;
    rows: (FinanceBreakdown & { label: string; key: string | number })[];
    currency: string;
}) {
    return (
        <details className="finance-details">
            <summary>
                Détail des montants <ChevronDown size={16} aria-hidden="true" />
            </summary>
            <div className="finance-table-scroll" tabIndex={0} role="region" aria-label={`Montants par ${label.toLowerCase()}`}>
                <table className="finance-data-table">
                    <thead>
                        <tr>
                            <th scope="col">{label}</th>
                            {breakdownColumns.map(([title, field]) => (
                                <th key={field} scope="col">
                                    {title}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row) => (
                            <tr key={row.key}>
                                <th scope="row">{row.label}</th>
                                {breakdownColumns.map(([, field]) => (
                                    <td key={field}>{money(row[field], currency)}</td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </details>
    );
}

function FacultyChart({ rows, currency, facultyHref }: { rows: FacultyRow[]; currency: string; facultyHref: (id: number) => string | undefined }) {
    const [metric, setMetric] = useState<'balance_cents' | 'overdue_cents'>('balance_cents');
    const [faculty, setFaculty] = useState<number | null>(null);
    const rankingFade = usePanelFade(metric);
    const facultyFade = usePanelFade(faculty);
    const sorted = [...rows].sort((left, right) => right[metric] - left[metric] || left.faculty_name.localeCompare(right.faculty_name, 'fr'));
    const visible = sorted.slice(0, 5);
    const selected = visible.find((row) => row.faculty_id === faculty) ?? visible[0];
    const destination = selected && facultyHref(selected.faculty_id);
    return (
        <FinanceChartPanel
            id="finance-faculties"
            title="Recouvrement par faculté"
            description={`Facultés du périmètre · ${currency}`}
            icon={Landmark}
            controls={
                rows.length > 0 && (
                    <div className="finance-chart-switch finance-faculty-switch" role="group" aria-label="Montant affiché par faculté">
                        <button type="button" aria-pressed={metric === 'balance_cents'} onClick={() => setMetric('balance_cents')}>
                            Reste dû
                        </button>
                        <button type="button" aria-pressed={metric === 'overdue_cents'} onClick={() => setMetric('overdue_cents')}>
                            Échu
                        </button>
                    </div>
                )
            }
        >
            {selected ? (
                <>
                    <div className="finance-ranking" ref={rankingFade} role="group" aria-label="Sélectionner une faculté">
                        {visible.map((row) => (
                            <button
                                type="button"
                                className="finance-ranking-row"
                                key={row.faculty_id}
                                aria-pressed={row.faculty_id === selected.faculty_id}
                                onClick={() => {
                                    if (selected.faculty_id !== row.faculty_id) setFaculty(row.faculty_id);
                                }}
                            >
                                <span>{row.faculty_name}</span>
                                <strong>{money(row[metric], currency)}</strong>
                                <span className="finance-value-track" aria-hidden="true">
                                    <i
                                        className="finance-value-fill"
                                        data-color={metric === 'overdue_cents' ? 'gold' : 'deep'}
                                        style={{ width: percentOf(row[metric], sorted[0][metric]) }}
                                    />
                                </span>
                            </button>
                        ))}
                    </div>
                    <div className="finance-selection" ref={facultyFade} aria-live="polite">
                        <div>
                            <strong>{selected.faculty_name}</strong>
                            {destination && (
                                <Link href={destination} preserveScroll>
                                    Filtrer <ArrowRight size={14} aria-hidden="true" />
                                </Link>
                            )}
                        </div>
                        <dl className="finance-chart-facts">
                            <div>
                                <dt>Frais nets</dt>
                                <dd>{money(selected.due_cents, currency)}</dd>
                            </div>
                            <div>
                                <dt>Reste dû</dt>
                                <dd>{money(selected.balance_cents, currency)}</dd>
                            </div>
                            <div>
                                <dt>Échu</dt>
                                <dd>{money(selected.overdue_cents, currency)}</dd>
                            </div>
                        </dl>
                    </div>
                    <BreakdownTable
                        label="Faculté"
                        currency={currency}
                        rows={sorted.map((row) => ({ ...row, key: row.faculty_id, label: row.faculty_name }))}
                    />
                </>
            ) : (
                <p className="finance-empty">Aucune obligation ventilée par faculté dans cette devise.</p>
            )}
        </FinanceChartPanel>
    );
}

const feeNames = new Map([
    ['tuition', 'Scolarité'],
    ['registration', 'Inscription'],
    ['admission', 'Admission'],
    ['laboratory', 'Laboratoire'],
    ['library', 'Bibliothèque'],
]);

function FeeChart({ rows, currency }: { rows: FeeRow[]; currency: string }) {
    const sorted = [...rows].sort((left, right) => right.due_cents - left.due_cents || left.kind.localeCompare(right.kind, 'fr'));
    const maximum = Math.max(0, ...rows.map((row) => row.covered_cents + row.balance_cents));
    const name = (kind: string) => feeNames.get(kind) ?? kind.replaceAll('_', ' ');
    return (
        <FinanceChartPanel
            id="finance-fees"
            title="Couverture par catégorie"
            description={`Obligations et règlements par type de frais · ${currency}`}
            icon={Layers3}
        >
            {rows.length > 0 ? (
                <>
                    <div className="finance-legend">
                        <span>
                            <i className="finance-key-receipt" /> Frais couverts
                        </span>
                        <span>
                            <i className="finance-key-balance" /> Reste dû
                        </span>
                    </div>
                    <dl className="finance-amount-bars finance-fee-bars">
                        {sorted.slice(0, 5).map((row) => (
                            <div key={row.kind}>
                                <dt>{name(row.kind)}</dt>
                                <dd>
                                    {money(row.due_cents, currency)} <small>de frais nets</small>
                                </dd>
                                <dd className="finance-value-track" aria-hidden="true">
                                    <i className="finance-value-fill" style={{ width: percentOf(row.covered_cents, maximum) }} />
                                    <i className="finance-value-fill" data-color="soft" style={{ width: percentOf(row.balance_cents, maximum) }} />
                                </dd>
                                <dd className="finance-fee-balance">{money(row.balance_cents, currency)} restant dû</dd>
                            </div>
                        ))}
                    </dl>
                    <BreakdownTable
                        label="Catégorie"
                        currency={currency}
                        rows={sorted.map((row) => ({ ...row, key: row.kind, label: name(row.kind) }))}
                    />
                </>
            ) : (
                <p className="finance-empty">Aucune catégorie de frais facturée dans cette devise.</p>
            )}
        </FinanceChartPanel>
    );
}

export function BreakdownCharts({
    data,
    currency,
    facultyHref,
}: {
    data: FinanceBreakdowns;
    currency: string;
    facultyHref: (id: number) => string | undefined;
}) {
    return (
        <div className="finance-analysis-grid">
            <FacultyChart rows={data.faculties.filter((row) => row.currency === currency)} currency={currency} facultyHref={facultyHref} />
            <FeeChart rows={data.fee_kinds.filter((row) => row.currency === currency)} currency={currency} />
        </div>
    );
}
