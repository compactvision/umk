import Pagination from '@/components/admin/Pagination';
import Dashboard from '@/components/layouts/Dashboard/Dashboard';
import { labels } from '@/components/student/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, ArrowUpRight, BookOpen, CalendarDays, ClipboardList, GraduationCap, History, Info } from 'lucide-react';
import '../../../../css/dashboard/my-enrollments.css';
import '../../../../css/student-portal.css';
type Props = {
    entries: {
        data: {
            id: number;
            matricule: string | null;
            year: string;
            level: string;
            status: string;
            program: string | null;
            curriculum: string | null;
            faculty: string;
            promotion: string | null;
            group: string | null;
            requirements: string[];
            renewal: { id: number; level: string; year: string; target_id: number | null; can_start: boolean } | null;
        }[];
    };
    changes: { data: { id: number; action: string; after: { enrollment_status: string }; effective_at: string; ends_at: string | null }[] };
};
const date = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeZone: 'Africa/Kinshasa' });

export default function MyEnrollments({ entries, changes }: Props) {
    return (
        <Dashboard hideAppsNavigation>
            <Head title="Mes inscriptions académiques" />
            <div className="student-portal my-enrollments">
                <header className="my-enrollments-heading">
                    <Link className="me-link" href={route('dashboard.student.index')}>
                        <ArrowLeft size={16} aria-hidden="true" /> Mon espace étudiant
                    </Link>
                    <h1>Mes inscriptions académiques</h1>
                    <p>Retrouve tes inscriptions par année et les démarches associées.</p>
                </header>
                <div className="me-layout">
                    <section className="me-list" aria-labelledby="me-years">
                        <h2 id="me-years">
                            <GraduationCap size={22} aria-hidden="true" /> Inscriptions par année
                        </h2>
                        {entries.data.map((entry) => (
                            <article className="me-card" key={entry.id}>
                                <header className="me-card-header">
                                    <div>
                                        <p className="me-year">
                                            <CalendarDays size={15} aria-hidden="true" /> {entry.year}
                                        </p>
                                        <h3>{entry.level}</h3>
                                        <p>{[entry.program, entry.faculty].filter(Boolean).join(' · ')}</p>
                                    </div>
                                    <span className="me-status" data-status={entry.status}>
                                        {labels[entry.status] || entry.status}
                                    </span>
                                </header>
                                <dl className="me-facts">
                                    {[
                                        ['Matricule', entry.matricule],
                                        ['Promotion', entry.promotion],
                                        ['Groupe', entry.group],
                                        ['Maquette', entry.curriculum],
                                    ].map(([label, value]) => (
                                        <div key={label}>
                                            <dt>{label}</dt>
                                            <dd>{value || 'À renseigner'}</dd>
                                        </div>
                                    ))}
                                </dl>
                                {(entry.requirements.length > 0 || entry.status === 'pending_confirmation') && (
                                    <div className="me-notice">
                                        <Info size={18} aria-hidden="true" />
                                        <div>
                                            {entry.requirements.length > 0 && (
                                                <ul>
                                                    {entry.requirements.map((requirement) => (
                                                        <li key={requirement}>{requirement}</li>
                                                    ))}
                                                </ul>
                                            )}
                                            {entry.status === 'pending_confirmation' && (
                                                <p>La confirmation dépend des contrôles administratifs et des conditions financières applicables.</p>
                                            )}
                                        </div>
                                    </div>
                                )}
                                {entry.renewal && <RenewalAction entry={entry} renewal={entry.renewal} />}
                                <footer className="me-actions">
                                    <Link
                                        className="portal-primary"
                                        href={route('dashboard.student.index', { section: 'overview', academic: entry.id })}
                                    >
                                        Consulter l’inscription <ArrowUpRight size={16} aria-hidden="true" />
                                    </Link>
                                    <Link className="me-link" href={route('dashboard.student.index', { section: 'requests', academic: entry.id })}>
                                        Demander une correction ou un changement
                                    </Link>
                                </footer>
                            </article>
                        ))}
                        {!entries.data.length && (
                            <div className="me-card me-empty">
                                <BookOpen size={24} aria-hidden="true" /> Aucune inscription académique enregistrée.
                            </div>
                        )}
                        <Pagination value={entries} />
                    </section>
                    <aside className="me-card me-decisions" aria-labelledby="me-decisions">
                        <h2 id="me-decisions">
                            <History size={20} aria-hidden="true" /> Décisions administratives
                        </h2>
                        {changes.data.length ? (
                            <ul>
                                {changes.data.map((change) => (
                                    <li key={change.id}>
                                        <time dateTime={change.effective_at}>{date.format(new Date(change.effective_at))}</time>
                                        <strong>{change.action === 'transfer' ? 'Transfert autorisé' : 'Situation mise à jour'}</strong>
                                        <p>{labels[change.after.enrollment_status] || change.after.enrollment_status}</p>
                                        {change.ends_at && <p>Fin prévue le {date.format(new Date(change.ends_at))}</p>}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p>Aucune décision administrative enregistrée.</p>
                        )}
                        <Pagination value={changes} />
                    </aside>
                </div>
            </div>
        </Dashboard>
    );
}

type Entry = Props['entries']['data'][number];

function RenewalAction({ entry, renewal }: { entry: Entry; renewal: NonNullable<Entry['renewal']> }) {
    const form = useForm<{ progression?: string }>({});
    return (
        <section className="me-renewal" aria-label="Réinscription">
            <h4>
                <ClipboardList size={18} aria-hidden="true" /> Réinscription · {renewal.level} · {renewal.year}
            </h4>
            {renewal.target_id ? (
                <Link className="me-link" href={route('dashboard.student.index', { section: 'overview', academic: renewal.target_id })}>
                    Consulter la réinscription
                </Link>
            ) : renewal.can_start ? (
                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        form.post(route('dashboard.student.renewals.start', { progression: renewal.id, academic: entry.id }));
                    }}
                >
                    <button className="portal-primary" disabled={form.processing}>
                        Demander ma réinscription
                    </button>
                    {Object.values(form.errors).map((error) => (
                        <p key={error} role="alert">
                            {error}
                        </p>
                    ))}
                </form>
            ) : (
                <p>La décision de poursuite est enregistrée ; les conditions d’ouverture et d’éligibilité doivent être remplies avant la demande.</p>
            )}
        </section>
    );
}
