import Dashboard from '@/components/layouts/Dashboard/Dashboard';
import { Head, Link } from '@inertiajs/react';
import {
    ArrowRight,
    ArrowUpRight,
    BarChart3,
    BookOpen,
    CalendarDays,
    ClipboardCheck,
    GraduationCap,
    Layers3,
    ShieldCheck,
    Users,
    Wallet,
} from 'lucide-react';
import '../../../../css/dashboard/overview.css';

type Destination = { key: string; label: string; detail: string; href: string };
type Count = Destination & { value: number };
type Event = { label: string; detail: string; date: string; href?: string | null };
type Overview = {
    year: { id: number; title: string } | null;
    scope: { label: string };
    metrics: Count[];
    actions: (Destination & { count: number })[];
    admissions: { label: string; value: number }[] | null;
    finance: { currency: string; billed_cents: number; net_cents: number; balance_cents: number }[] | null;
    activity: Event[];
    schedule: Event[] | null;
    shortcuts: Destination[];
};

const icons = {
    admissions: ClipboardCheck,
    students: GraduationCap,
    enrollments: Users,
    finance: Wallet,
    payments: Wallet,
    teaching: BookOpen,
    schedule: CalendarDays,
    sessions: CalendarDays,
    years: CalendarDays,
    structure: Layers3,
};
const iconFor = (key: string) => icons[key as keyof typeof icons] ?? BarChart3;
const number = new Intl.NumberFormat('fr-FR');
const dateFormat = new Intl.DateTimeFormat('fr-CD', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Africa/Kinshasa',
});
const amount = new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function Metric({ item }: { item: Count }) {
    const Icon = iconFor(item.key);
    return (
        <Link className="admin-overview-metric" href={item.href} data-dashboard-arrival-item>
            <div className="admin-overview-metric-top">
                <span className="admin-overview-icon">
                    <Icon size={20} strokeWidth={1.7} aria-hidden="true" />
                </span>
                <ArrowUpRight size={17} aria-hidden="true" />
            </div>
            <strong>{number.format(item.value)}</strong>
            <h2>{item.label}</h2>
            <p>{item.detail}</p>
        </Link>
    );
}

function EventPanel({ title, items, empty, destination }: { title: string; items: Event[]; empty: string; destination?: Destination }) {
    return (
        <section className="admin-overview-panel">
            <div className="admin-overview-panel-header">
                <h2>{title}</h2>
                {destination && (
                    <Link href={destination.href} className="admin-overview-text-link">
                        Ouvrir le planning <ArrowUpRight size={15} aria-hidden="true" />
                    </Link>
                )}
            </div>
            {items.length ? (
                <ul className="admin-overview-activity">
                    {items.map((item, index) => (
                        <li key={`${item.date}-${index}`}>
                            <span className="admin-overview-activity-dot" aria-hidden="true" />
                            <div>
                                {item.href ? <Link href={item.href}>{item.label}</Link> : <strong>{item.label}</strong>}
                                <p>{item.detail}</p>
                            </div>
                            <time dateTime={item.date}>{dateFormat.format(new Date(item.date))}</time>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="admin-overview-empty">{empty}</p>
            )}
        </section>
    );
}

export default function Index({ dashboard }: { dashboard?: Overview }) {
    if (!dashboard) {
        return (
            <Dashboard>
                <Head title="Tableau de bord" />
                <section className="admin-overview-panel">
                    <h1>Votre espace universitaire</h1>
                    <p>Aucun espace de travail n’est associé à votre compte.</p>
                    <Link href="/" className="admin-overview-text-link">
                        Retour au site <ArrowRight size={15} aria-hidden="true" />
                    </Link>
                </section>
            </Dashboard>
        );
    }

    const { year, scope, metrics, actions, admissions, finance, activity, schedule, shortcuts } = dashboard;
    const admissionsTotal = admissions?.reduce((total, item) => total + item.value, 0) ?? 0;
    const admissionsLink = shortcuts.find((item) => item.key === 'admissions');
    const financeLink = shortcuts.find((item) => item.key === 'finance');
    const scheduleLink = shortcuts.find((item) => item.key === 'schedule');
    const showActivity = admissions !== null || finance !== null;

    return (
        <Dashboard>
            <Head title="Vue d’ensemble administrative" />
            <div className="admin-overview" data-dashboard-arrival-grid>
                <header className="admin-overview-hero" data-dashboard-arrival-item>
                    <div className="admin-overview-hero-copy">
                        <p className="admin-overview-hero-context">Administration universitaire</p>
                        <h1>Vue d’ensemble</h1>
                        <p>Suivez les candidatures, les inscriptions et les opérations de votre périmètre.</p>
                        <div className="admin-overview-context">
                            <span>
                                <CalendarDays size={16} aria-hidden="true" /> {year ? year.title : 'Toutes les années académiques'}
                            </span>
                            <span>
                                <ShieldCheck size={16} aria-hidden="true" /> {scope.label}
                            </span>
                        </div>
                    </div>
                </header>

                {metrics.length > 0 && (
                    <section className="admin-overview-metrics" aria-label="Indicateurs clés" data-dashboard-arrival-grid="metrics">
                        {metrics.map((item) => (
                            <Metric key={item.key} item={item} />
                        ))}
                    </section>
                )}

                {(actions.length > 0 || admissions !== null) && (
                    <div className="admin-overview-columns" data-dashboard-arrival-grid="panels">
                        {admissions !== null && (
                            <section className="admin-overview-panel">
                                <div className="admin-overview-panel-header">
                                    <div>
                                        <h2>Candidatures</h2>
                                        <p>Répartition des dossiers par statut.</p>
                                    </div>
                                    {admissionsLink && (
                                        <Link href={admissionsLink.href} className="admin-overview-text-link">
                                            Voir les dossiers <ArrowUpRight size={15} aria-hidden="true" />
                                        </Link>
                                    )}
                                </div>
                                {admissionsTotal > 0 ? (
                                    <ul className="admin-overview-breakdown">
                                        {admissions.map(({ label, value }) => (
                                            <li key={label}>
                                                <div>
                                                    <span>{label}</span>
                                                    <strong>{number.format(value)}</strong>
                                                </div>
                                                <div className="admin-overview-track" aria-hidden="true">
                                                    <span style={{ width: `${(value / admissionsTotal) * 100}%` }} />
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="admin-overview-empty">Aucune candidature dans ce périmètre.</p>
                                )}
                            </section>
                        )}

                        {actions.length > 0 && (
                            <section className="admin-overview-panel">
                                <div className="admin-overview-panel-header">
                                    <div>
                                        <h2>À traiter</h2>
                                        <p>Les files de travail accessibles à votre compte.</p>
                                    </div>
                                </div>
                                <ul className="admin-overview-queue">
                                    {actions.map(({ key, label, count, href, detail }) => (
                                        <li key={key}>
                                            <Link href={href}>
                                                <span className="admin-overview-count" data-active={count > 0}>
                                                    {number.format(count)}
                                                </span>
                                                <span className="admin-overview-row-copy">
                                                    <strong>{label}</strong>
                                                    <small>{detail}</small>
                                                </span>
                                                <ArrowRight size={16} aria-hidden="true" />
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        )}
                    </div>
                )}

                {(showActivity || schedule !== null) && (
                    <div className="admin-overview-columns admin-overview-columns-secondary" data-dashboard-arrival-grid="panels">
                        {finance !== null && (
                            <section className="admin-overview-panel">
                                <div className="admin-overview-panel-header">
                                    <div>
                                        <h2>Situation financière</h2>
                                        <p>Montants suivis séparément par devise.</p>
                                    </div>
                                    {financeLink && (
                                        <Link href={financeLink.href} className="admin-overview-text-link">
                                            Suivi financier <ArrowUpRight size={15} aria-hidden="true" />
                                        </Link>
                                    )}
                                </div>
                                {finance.length > 0 ? (
                                    <div className="admin-overview-table-wrap" tabIndex={0} role="region" aria-label="Totaux financiers par devise">
                                        <table className="admin-overview-table">
                                            <thead>
                                                <tr>
                                                    <th scope="col">Devise</th>
                                                    <th scope="col">Facturé brut</th>
                                                    <th scope="col">Encaissé net</th>
                                                    <th scope="col">Reste dû</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {finance.map(({ currency, billed_cents, net_cents, balance_cents }) => (
                                                    <tr key={currency}>
                                                        <th scope="row">{currency}</th>
                                                        <td>{amount.format(billed_cents / 100)}</td>
                                                        <td>{amount.format(net_cents / 100)}</td>
                                                        <td>{amount.format(balance_cents / 100)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <p className="admin-overview-empty">Aucun montant à afficher dans ce périmètre.</p>
                                )}
                            </section>
                        )}
                        {schedule !== null && (
                            <EventPanel
                                title="Prochaines séances"
                                items={schedule}
                                empty="Aucune séance publiée à venir."
                                destination={scheduleLink}
                            />
                        )}
                        {showActivity && <EventPanel title="Activité récente" items={activity} empty="Aucune activité récente." />}
                    </div>
                )}

                {shortcuts.length > 0 && (
                    <section className="admin-overview-panel admin-overview-shortcut-panel">
                        <div className="admin-overview-panel-header">
                            <div>
                                <h2>Accès rapides</h2>
                                <p>Ouvrez directement vos espaces de travail.</p>
                            </div>
                        </div>
                        <div className="admin-overview-shortcuts">
                            {shortcuts.map(({ key, label, detail, href }) => {
                                const Icon = iconFor(key);
                                return (
                                    <Link key={key} href={href}>
                                        <span className="admin-overview-icon">
                                            <Icon size={19} strokeWidth={1.7} aria-hidden="true" />
                                        </span>
                                        <span className="admin-overview-row-copy">
                                            <strong>{label}</strong>
                                            <small>{detail}</small>
                                        </span>
                                        <ArrowUpRight size={16} aria-hidden="true" />
                                    </Link>
                                );
                            })}
                        </div>
                    </section>
                )}

                {metrics.length === 0 && (
                    <p className="admin-overview-empty">Aucun indicateur métier n’est accessible avec les permissions de votre compte.</p>
                )}
            </div>
        </Dashboard>
    );
}
