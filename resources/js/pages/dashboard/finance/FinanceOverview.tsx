import { money } from '@/components/student/types';
import { usePanelFade } from '@/hooks/use-panel-fade';
import { Activity, ArrowDownToLine, ArrowUpRight, CalendarClock, ChartColumn, ChevronDown, ReceiptText, Wallet } from 'lucide-react';
import { useState, type CSSProperties } from 'react';
import { BreakdownCharts, FinanceChartPanel, LedgerCharts, type FinanceBreakdowns } from './FinanceCharts';

export type FinanceTotal = {
    currency: string;
    billed_cents: number;
    gross_cents: number;
    pending_cents: number;
    cancelled_cents: number;
    refunded_cents: number;
    legacy_reversal_cents: number;
    net_cents: number;
    balance_cents: number;
    due_cents: number;
    waived_cents: number;
    overdue_cents: number;
};

type Month = { month: string; gross_cents: number; refunded_cents: number; net_cents: number };
export type Cashflow = { start_month: string; end_month: string; series: { currency: string; months: Month[] }[] };
export const financeReportQuery = 'q year faculty program level';

const amounts = [
    ['Facturé brut', 'billed_cents'],
    ['Aides déduites', 'waived_cents'],
    ['Frais nets', 'due_cents'],
    ['Encaissements confirmés bruts', 'gross_cents'],
    ['Remboursements exécutés', 'refunded_cents'],
    ['Contrepassations historiques', 'legacy_reversal_cents'],
    ['Encaissements nets', 'net_cents'],
    ['Reste dû', 'balance_cents'],
    ['Échu non réglé', 'overdue_cents'],
    ['En vérification', 'pending_cents'],
    ['Écritures annulées', 'cancelled_cents'],
] as const;

const shortMonth = new Intl.DateTimeFormat('fr-FR', { month: 'short', timeZone: 'UTC' });
const monthLabel = (date: Date) => shortMonth.format(date).replace(/\.$/, '');
const longMonth = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric', timeZone: 'UTC' });
const percentage = new Intl.NumberFormat('fr-FR', { style: 'percent', maximumFractionDigits: 1 });
const compactAmount = new Intl.NumberFormat('fr-FR', { notation: 'compact', maximumFractionDigits: 1 });
const monthDate = (month: string) => new Date(`${month}-01T00:00:00Z`);
const barSize = (value: number, maximum: number) => `${maximum > 0 ? (value / maximum) * 100 : 0}%`;

function CashflowChart({ months, currency, period }: { months: Month[]; currency: string; period: string }) {
    const [month, setMonth] = useState<string | null>(null);
    const [mode, setMode] = useState<'movements' | 'net'>('movements');
    const seriesFade = usePanelFade(mode);
    const monthFade = usePanelFade(month);
    const selected = months.find((item) => item.month === month) ?? [...months].reverse().find((item) => item.gross_cents || item.refunded_cents);
    const bars = months.map((item) => ({
        ...item,
        receipt: mode === 'net' ? Math.max(0, item.net_cents) : item.gross_cents,
        refund: mode === 'net' ? Math.max(0, -item.net_cents) : item.refunded_cents,
    }));
    const maxReceipt = Math.max(0, ...bars.map((item) => item.receipt));
    const maxRefund = Math.max(0, ...bars.map((item) => item.refund));
    const positiveScale = maxReceipt || (maxRefund === 0 ? 1 : 0);
    const chartSize = positiveScale + maxRefund;
    return (
        <FinanceChartPanel
            id="finance-cashflow"
            title="Encaissements par mois"
            description={`${period} · ${currency}`}
            icon={ChartColumn}
            controls={
                selected && (
                    <div className="finance-chart-switch" role="group" aria-label="Série du graphique mensuel">
                        <button type="button" aria-pressed={mode === 'movements'} onClick={() => setMode('movements')}>
                            Mouvements
                        </button>
                        <button type="button" aria-pressed={mode === 'net'} onClick={() => setMode('net')}>
                            Flux net
                        </button>
                    </div>
                )
            }
        >
            {selected ? (
                <>
                    <div className="finance-series" ref={seriesFade}>
                        <div className="finance-legend">
                            <span>
                                <i className="finance-key-receipt" /> {mode === 'net' ? 'Flux net positif' : 'Versements confirmés'}
                            </span>
                            <span>
                                <i className="finance-key-refund" /> {mode === 'net' ? 'Flux net négatif' : 'Remboursements exécutés'}
                            </span>
                        </div>
                        <div className="finance-plot">
                            <div className="finance-chart-axis" aria-hidden="true">
                                {maxReceipt / chartSize > 0.15 && <span>{compactAmount.format(maxReceipt / 100)}</span>}
                                <span className="finance-axis-zero" style={{ top: barSize(positiveScale, chartSize) }}>
                                    0
                                </span>
                                {maxRefund / chartSize > 0.15 && (
                                    <span className="finance-axis-negative">{compactAmount.format(-maxRefund / 100)}</span>
                                )}
                            </div>
                            <div
                                className="finance-cashflow"
                                aria-label="Sélectionner un mois"
                                role="group"
                                style={{ gridTemplateColumns: `repeat(${bars.length}, minmax(24px, 1fr))` }}
                            >
                                {bars.map((item) => (
                                    <button
                                        className="finance-month"
                                        type="button"
                                        key={item.month}
                                        aria-pressed={selected.month === item.month}
                                        aria-label={`${monthLabel(monthDate(item.month))} ${item.month.slice(0, 4)}`}
                                        title={longMonth.format(monthDate(item.month))}
                                        onClick={() => {
                                            if (selected.month !== item.month) setMonth(item.month);
                                        }}
                                    >
                                        <span
                                            className="finance-month-bars"
                                            aria-hidden="true"
                                            style={{ gridTemplateRows: `minmax(0, ${positiveScale}fr) minmax(0, ${maxRefund}fr)` }}
                                        >
                                            <span className="finance-month-receipts">
                                                <i style={{ height: barSize(item.receipt, maxReceipt) }} />
                                            </span>
                                            <span className="finance-month-refunds">
                                                <i style={{ height: barSize(item.refund, maxRefund) }} />
                                            </span>
                                        </span>
                                        <span className="finance-month-label" aria-hidden="true">
                                            {monthLabel(monthDate(item.month))}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="finance-month-detail" ref={monthFade} aria-live="polite">
                        <strong>{longMonth.format(monthDate(selected.month))}</strong>
                        <dl>
                            <div>
                                <dt>Confirmés</dt>
                                <dd>{money(selected.gross_cents, currency)}</dd>
                            </div>
                            <div>
                                <dt>Remboursés</dt>
                                <dd>{money(selected.refunded_cents, currency)}</dd>
                            </div>
                            <div>
                                <dt>Flux net</dt>
                                <dd>{money(selected.net_cents, currency)}</dd>
                            </div>
                        </dl>
                    </div>
                    <details className="finance-details">
                        <summary>
                            Voir les montants par mois <ChevronDown size={16} aria-hidden="true" />
                        </summary>
                        <div className="finance-table-scroll" tabIndex={0} role="region" aria-label="Montants par mois">
                            <table className="finance-data-table">
                                <thead>
                                    <tr>
                                        <th scope="col">Mois</th>
                                        <th scope="col">Confirmés</th>
                                        <th scope="col">Remboursés</th>
                                        <th scope="col">Flux net</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {months.map((item) => (
                                        <tr key={item.month}>
                                            <th scope="row">{longMonth.format(monthDate(item.month))}</th>
                                            <td>{money(item.gross_cents, currency)}</td>
                                            <td>{money(item.refunded_cents, currency)}</td>
                                            <td>{money(item.net_cents, currency)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </details>
                </>
            ) : (
                <p className="finance-empty">Aucun versement confirmé ni remboursement daté sur la période affichée.</p>
            )}
            <p className="finance-note">
                Les versements sont datés à la confirmation et les remboursements à leur exécution. Les opérations sans date et les contrepassations
                historiques figurent dans le détail des écritures.
            </p>
        </FinanceChartPanel>
    );
}

function CoverageChart({ total }: { total: FinanceTotal }) {
    const covered = Math.max(0, total.due_cents - total.balance_cents);
    const ratio = total.due_cents ? covered / total.due_cents : 0;
    const amount = (cents: number) => money(cents, total.currency);
    return (
        <FinanceChartPanel id="finance-coverage" title="Couverture des frais" description="Frais nets après aides et réductions" icon={Activity}>
            {total.due_cents > 0 ? (
                <div className="finance-coverage-visual">
                    <div className="finance-coverage-bar" style={{ '--finance-coverage': barSize(covered, total.due_cents) } as CSSProperties}>
                        <div className="finance-coverage-score">
                            <strong>{percentage.format(ratio)}</strong>
                            <span>couverts</span>
                        </div>
                    </div>
                    <div className="finance-coverage-base">
                        <span>Frais nets</span>
                        <strong>{amount(total.due_cents)}</strong>
                    </div>
                </div>
            ) : (
                <p className="finance-empty">Aucun frais net à couvrir dans cette devise.</p>
            )}
            <dl className="finance-coverage-breakdown">
                <div>
                    <dt>
                        <i className="finance-key-receipt" /> Frais couverts
                    </dt>
                    <dd>{amount(covered)}</dd>
                </div>
                <div>
                    <dt>
                        <i className="finance-key-balance" /> Reste dû
                    </dt>
                    <dd>{amount(total.balance_cents)}</dd>
                </div>
                <div className="finance-overdue-row">
                    <dt>
                        <CalendarClock size={16} aria-hidden="true" /> Échu non réglé
                    </dt>
                    <dd>{amount(total.overdue_cents)}</dd>
                </div>
            </dl>
            <p className="finance-note">La couverture mesure les frais réglés. Un versement confirmé peut rester à affecter au compte de frais.</p>
        </FinanceChartPanel>
    );
}

export default function FinanceOverview({
    totals,
    cashflow,
    breakdowns,
    facultyHref,
    preferredCurrency,
}: {
    totals: FinanceTotal[];
    cashflow: Cashflow;
    breakdowns: FinanceBreakdowns;
    facultyHref: (id: number) => string | undefined;
    preferredCurrency?: string;
}) {
    const [currency, setCurrency] = useState<string>();
    const currencyFade = usePanelFade(currency);
    const total = totals.find((row) => row.currency === (currency ?? preferredCurrency)) ?? totals[0];
    const months = cashflow.series.find((row) => row.currency === total?.currency)?.months ?? [];
    const period = `${longMonth.format(monthDate(cashflow.start_month))} – ${longMonth.format(monthDate(cashflow.end_month))}`;
    const metrics = total
        ? [
              {
                  icon: ReceiptText,
                  title: 'Frais nets',
                  value: total.due_cents,
                  detail: `${money(total.waived_cents, total.currency)} d’aides déduites`,
              },
              { icon: ArrowDownToLine, title: 'Encaissements nets', value: total.net_cents, detail: 'Après remboursements et contrepassations' },
              { icon: Wallet, title: 'Reste dû', value: total.balance_cents, detail: 'Solde des obligations étudiantes' },
              {
                  icon: CalendarClock,
                  title: 'Échu non réglé',
                  value: total.overdue_cents,
                  detail: 'Échéances dépassées',
                  urgent: total.overdue_cents > 0,
              },
          ]
        : [];
    return (
        <>
            <header className="finance-section-heading">
                <div>
                    <h2 id="finance-report-title">Suivi financier</h2>
                    <p>Indicateurs calculés sur le périmètre filtré.</p>
                </div>
                {total && (
                    <div className="finance-currencies" role="group" aria-label="Devise du rapport">
                        {totals.map((row) => (
                            <button
                                key={row.currency}
                                type="button"
                                aria-pressed={total.currency === row.currency}
                                onClick={() => {
                                    if (row.currency !== total.currency) setCurrency(row.currency);
                                }}
                            >
                                {row.currency}
                            </button>
                        ))}
                    </div>
                )}
            </header>
            <div
                className="finance-report-data"
                data-dashboard-panel={financeReportQuery}
                data-dashboard-update={currency ? '' : undefined}
                ref={currencyFade}
            >
                {total ? (
                    <>
                        <dl className="finance-metrics">
                            {metrics.map(({ icon: Icon, title, value, detail, urgent }) => (
                                <div key={title} className="finance-metric" data-urgent={urgent || undefined}>
                                    <dt>
                                        <span className="finance-icon">
                                            <Icon size={19} aria-hidden="true" />
                                        </span>{' '}
                                        {title}
                                    </dt>
                                    <dd>
                                        {money(value, total.currency)}
                                        <small>{detail}</small>
                                    </dd>
                                </div>
                            ))}
                        </dl>
                        <div className="finance-charts">
                            <CashflowChart months={months} currency={total.currency} period={period} />
                            <CoverageChart total={total} />
                        </div>
                        <LedgerCharts total={total} />
                        <BreakdownCharts data={breakdowns} currency={total.currency} facultyHref={facultyHref} />
                    </>
                ) : (
                    <div className="finance-empty finance-report-empty">
                        <ReceiptText size={22} aria-hidden="true" />
                        <div>
                            <strong>Aucune écriture sur ce périmètre</strong>
                            <p>Élargissez les filtres pour afficher les opérations d’autres comptes.</p>
                        </div>
                        <a href="#finance-filters">
                            Revoir les filtres <ArrowUpRight size={15} aria-hidden="true" />
                        </a>
                    </div>
                )}
            </div>
            {total && (
                <details className="finance-details finance-ledger">
                    <summary>
                        <span>
                            <ReceiptText size={18} aria-hidden="true" /> Détail des écritures par devise
                        </span>{' '}
                        <ChevronDown size={18} aria-hidden="true" />
                    </summary>
                    <div
                        className="finance-table-scroll"
                        data-dashboard-panel={financeReportQuery}
                        tabIndex={0}
                        role="region"
                        aria-label="Détail des écritures par devise"
                    >
                        <table className="finance-data-table">
                            <thead>
                                <tr>
                                    <th scope="col">Indicateur</th>
                                    {totals.map((row) => (
                                        <th key={row.currency} scope="col">
                                            {row.currency}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {amounts.map(([label, field]) => (
                                    <tr key={field}>
                                        <th scope="row">{label}</th>
                                        {totals.map((row) => (
                                            <td key={row.currency}>{money(row[field], row.currency)}</td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </details>
            )}
        </>
    );
}
