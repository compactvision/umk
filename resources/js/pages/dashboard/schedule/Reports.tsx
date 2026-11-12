import Pagination from '@/components/admin/Pagination';
import Dashboard from '@/components/layouts/Dashboard/Dashboard';
import { dateLabel, localDate } from '@/lib/scheduleDates';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import '../../../../css/dashboard/student-academic.css';
import '../../../../css/student-portal.css';

type Totals = { recorded: number; present: number | null; late: number | null; excused: number | null; absent: number | null };
type Filters = { year?: string; group?: string; course?: string; teacher?: string; student?: string; from?: string; to?: string };
export default function Reports({
    total,
    filters,
    rows,
    years,
}: {
    total: Totals;
    filters: Filters;
    rows: { data: (Totals & { id: number; starts_at: string; course: string })[] };
    years: { id: number; title: string }[];
}) {
    const [form, setForm] = useState(filters);
    const rate = Number(total.recorded)
        ? new Intl.NumberFormat('fr-FR', { style: 'percent', maximumFractionDigits: 1 }).format(
              (Number(total.present) + Number(total.late)) / Number(total.recorded),
          )
        : '—';
    const base = route('dashboard.admin.schedule.reports');
    const date = (value: string) => dateLabel(localDate(value.replace(' ', 'T') + (value.includes('Z') ? '' : 'Z')));
    return (
        <Dashboard hideAppsNavigation>
            <Head title="Rapports de présence" />
            <main className="student-portal academic-administration">
                <header className="directory-heading">
                    <div>
                        <h1>Rapports de présence</h1>
                        <p>Appels enregistrés des séances terminées.</p>
                    </div>
                    <a href={route('dashboard.admin.schedule.reports', { ...filters, format: 'csv' })}>Exporter la sélection CSV</a>
                </header>
                <form
                    className="portal-form"
                    onSubmit={(e) => {
                        e.preventDefault();
                        router.get(base, form);
                    }}
                >
                    <label>
                        Année
                        <select value={form.year ?? ''} onChange={(e) => setForm({ ...form, year: e.target.value })}>
                            <option value="">Toutes</option>
                            {years.map((y) => (
                                <option key={y.id} value={y.id}>
                                    {y.title}
                                </option>
                            ))}
                        </select>
                    </label>
                    {(['course', 'teacher', 'group', 'student'] as const).map((key) => (
                        <label key={key}>
                            Identifiant{' '}
                            {{ course: 'du cours', teacher: 'de l’enseignant', group: 'du groupe', student: 'de l’inscription annuelle' }[key]}
                            <input type="number" min={1} value={form[key] ?? ''} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
                        </label>
                    ))}
                    <label>
                        Du
                        <input type="date" value={form.from ?? ''} onChange={(e) => setForm({ ...form, from: e.target.value })} />
                    </label>
                    <label>
                        Au
                        <input type="date" value={form.to ?? ''} onChange={(e) => setForm({ ...form, to: e.target.value })} />
                    </label>
                    <button className="portal-primary">Filtrer</button>
                    <Link href={base}>Réinitialiser</Link>
                </form>
                <section className="portal-panel">
                    <h2>Assiduité · {rate}</h2>
                    <p>
                        {total.recorded} saisies · {total.present ?? 0} présences · {total.late ?? 0} retards · {total.excused ?? 0} absences
                        justifiées · {total.absent ?? 0} absences non justifiées.
                    </p>
                    <p>
                        Le taux rapporte les présences et retards aux lignes saisies. Les créneaux annulés et les appels non renseignés sont exclus.
                    </p>
                    {rows.data.length ? (
                        <div className="academic-table-scroll">
                            <table className="academic-table">
                                <thead>
                                    <tr>
                                        <th>Cours</th>
                                        <th>Date</th>
                                        <th>Présents</th>
                                        <th>Retards</th>
                                        <th>Justifiées</th>
                                        <th>Absents</th>
                                    </tr>
                                </thead>
                                <tbody data-dashboard-panel="">
                                    {rows.data.map((row) => (
                                        <tr key={row.id}>
                                            <td>{row.course}</td>
                                            <td>{date(row.starts_at)}</td>
                                            <td>{row.present}</td>
                                            <td>{row.late}</td>
                                            <td>{row.excused}</td>
                                            <td>{row.absent}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p data-dashboard-panel="">Aucun appel sur ce périmètre.</p>
                    )}
                    <Pagination value={rows} />
                </section>
            </main>
        </Dashboard>
    );
}
