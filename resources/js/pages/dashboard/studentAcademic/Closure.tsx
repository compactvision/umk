import Dashboard from '@/components/layouts/Dashboard/Dashboard';
import { labels } from '@/components/student/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import '../../../../css/student-portal.css';
type Props = {
    years: { id: number; title: string }[];
    year: { id: number; title: string; status: string } | null;
    report: {
        total: number;
        unresolved: number;
        statuses: Record<string, number>;
        without_curriculum: number;
        without_group: number;
        can_close: boolean;
    } | null;
    canReopen: boolean;
};
export default function Closure({ years, year, report, canReopen }: Props) {
    const form = useForm({ reason: '' });
    return (
        <Dashboard hideAppsNavigation>
            <Head title="Clôture administrative annuelle" />
            <main className="student-portal">
                <header className="directory-heading">
                    <h1>Clôture administrative annuelle</h1>
                    <Link href={route('dashboard.admin.student-academic.administration')}>Retour aux inscriptions</Link>
                </header>
                <label>
                    Année
                    <select
                        value={year?.id ?? ''}
                        onChange={(event) => router.get(route('dashboard.admin.student-academic.closure'), { year: event.target.value })}
                    >
                        {years.map((value) => (
                            <option key={value.id} value={value.id}>
                                {value.title}
                            </option>
                        ))}
                    </select>
                </label>
                {year && report ? (
                    <section className="portal-panel">
                        <h2>
                            {year.title} · {labels[year.status] || year.status}
                        </h2>
                        <p>
                            {report.total} inscriptions · {report.unresolved} situations à résoudre
                        </p>
                        <ul>
                            {Object.entries(report.statuses).map(([status, count]) => (
                                <li key={status}>
                                    {labels[status] || status} : {count}
                                </li>
                            ))}
                        </ul>
                        <p>
                            {report.without_curriculum} inscription(s) sans maquette et {report.without_group} sans groupe : vérifier les contextes
                            historiques.
                        </p>
                        <p>La clôture conserve les résultats et les écritures financières. Elle ne crée aucune inscription pour l’année suivante.</p>
                        {report.unresolved > 0 && (
                            <Link href={route('dashboard.admin.student-academic.administration', { year: year.id })}>
                                Traiter les situations restantes
                            </Link>
                        )}
                        {((year.status === 'open' && report.can_close) || (year.status === 'closed' && canReopen)) && (
                            <form
                                className="portal-form"
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    form.patch(route(`dashboard.admin.academic-years.${year.status === 'closed' ? 'open' : 'close'}`, year.id));
                                }}
                            >
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
                                    <p key={error} role="alert">
                                        {error}
                                    </p>
                                ))}
                                <button className="portal-primary" disabled={form.processing}>
                                    {year.status === 'closed' ? 'Réouvrir exceptionnellement' : 'Clôturer l’année'}
                                </button>
                            </form>
                        )}
                    </section>
                ) : (
                    <p>Aucune année académique configurée.</p>
                )}
            </main>
        </Dashboard>
    );
}
