import PageHeading from '@/components/admin/PageHeading';
import Pagination from '@/components/admin/Pagination';
import Dashboard from '@/components/layouts/Dashboard/Dashboard';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowUpRight, CheckCircle2, Clock3, FileText, Search, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import '../../../../css/admin-enrollments.css';
import { applicantName, formatDate, statusLabels, type Dossier } from './types';
type Filters = { reexamination?: string; q?: string; status?: string; faculty_id?: string; year_id?: string };
type Props = {
    enrollments: { data: Dossier[]; total: number; links: { url: string | null; label: string; active: boolean }[] };
    filters: Filters;
    stats: { total: number; pending: number; validated: number; rejected: number };
    faculties: { id: number; name: string }[];
    years: { id: number; title: string }[];
    reexamination_total: number;
    success?: string;
};
export default function Index({ enrollments, filters, stats, faculties, years, success, reexamination_total }: Props) {
    const [search, setSearch] = useState({
        reexamination: filters.reexamination || '',
        q: filters.q || '',
        status: filters.status || '',
        faculty_id: filters.faculty_id || '',
        year_id: filters.year_id || '',
    });
    const [loading, setLoading] = useState(false);
    useEffect(
        () =>
            setSearch({
                reexamination: filters.reexamination || '',
                q: filters.q || '',
                status: filters.status || '',
                faculty_id: filters.faculty_id || '',
                year_id: filters.year_id || '',
            }),
        [filters],
    );
    const apply = (reset = false) =>
        router.get('/dashboard/admin/enrollments', reset ? {} : search, {
            preserveScroll: true,
            onStart: () => setLoading(true),
            onFinish: () => setLoading(false),
        });
    return (
        <Dashboard>
            <Head title="Gestion des inscriptions" />
            <div className="admin-enrollments">
                <PageHeading
                    title="Les parcours commencent ici."
                    description="Consultez les candidatures, examinez les documents et accompagnez chaque décision."
                />
                {reexamination_total > 0 && (
                    <div className="review-reexamination-banner">
                        <div>
                            <strong>{reexamination_total} dossier(s) avec de nouvelles pièces à réexaminer</strong>
                            <p>Les candidats ont transmis des versions corrigées. Elles attendent un nouveau verdict.</p>
                        </div>
                        <Link href="/dashboard/admin/enrollments?reexamination=1">
                            Voir les dossiers concernés <ArrowUpRight size={17} />
                        </Link>
                    </div>
                )}
                {filters.reexamination && (
                    <p className="review-muted">
                        Filtre actif : nouvelles pièces à réexaminer. <Link href="/dashboard/admin/enrollments">Afficher tous les dossiers</Link>
                    </p>
                )}
                {success && (
                    <p className="review-notice" role="status">
                        {success}
                    </p>
                )}
                <section className="review-stats" aria-label="Toutes les inscriptions">
                    {[
                        { key: 'pending' as const, label: 'À examiner', icon: Clock3 },
                        { key: 'validated' as const, label: 'Validées', icon: CheckCircle2 },
                        { key: 'rejected' as const, label: 'Rejetées', icon: XCircle },
                        { key: 'total' as const, label: 'Dossiers au total', icon: FileText },
                    ].map(({ key, label, icon: Icon }) => (
                        <div key={key}>
                            <span>
                                <Icon size={21} />
                            </span>
                            <div>
                                <strong>{stats[key]}</strong>
                                <small>{label}</small>
                            </div>
                        </div>
                    ))}
                </section>
                <form
                    className="review-filters"
                    onSubmit={(e) => {
                        e.preventDefault();
                        apply();
                    }}
                >
                    <div className="review-search">
                        <label htmlFor="dossier-search">Rechercher un étudiant ou un dossier</label>
                        <div>
                            <Search size={17} />
                            <input
                                id="dossier-search"
                                value={search.q}
                                onChange={(e) => setSearch({ ...search, q: e.target.value })}
                                placeholder="Nom, email, matricule ou référence…"
                                type="search"
                                maxLength={150}
                            />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="dossier-status">Statut</label>
                        <select id="dossier-status" value={search.status} onChange={(e) => setSearch({ ...search, status: e.target.value })}>
                            <option value="">Tous les statuts</option>
                            {Object.entries(statusLabels).map(([key, label]) => (
                                <option value={key} key={key}>
                                    {label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="dossier-faculty">Faculté</label>
                        <select id="dossier-faculty" value={search.faculty_id} onChange={(e) => setSearch({ ...search, faculty_id: e.target.value })}>
                            <option value="">Toutes les facultés</option>
                            {faculties.map((faculty) => (
                                <option value={faculty.id} key={faculty.id}>
                                    {faculty.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="dossier-year">Année</label>
                        <select id="dossier-year" value={search.year_id} onChange={(e) => setSearch({ ...search, year_id: e.target.value })}>
                            <option value="">Toutes les années</option>
                            {years.map((year) => (
                                <option value={year.id} key={year.id}>
                                    {year.title}
                                </option>
                            ))}
                        </select>
                    </div>
                    <button className="admin-primary" disabled={loading}>
                        {loading ? 'Recherche…' : 'Rechercher'}
                    </button>
                    <button className="review-text-button" type="button" disabled={loading} onClick={() => apply(true)}>
                        Réinitialiser
                    </button>
                </form>
                <section className="review-list">
                    <header>
                        <h2>Dossiers d’inscription</h2>
                        <span>
                            {enrollments.total} résultat{enrollments.total > 1 ? 's' : ''}
                        </span>
                    </header>
                    {enrollments.data.length ? (
                        <div className="overflow-x-auto">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Étudiant</th>
                                        <th>Formation</th>
                                        <th>Statut</th>
                                        <th>Documents</th>
                                        <th>Consultation</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {enrollments.data.map((entry) => (
                                        <tr key={entry.id}>
                                            <td>
                                                <strong>{applicantName(entry.student)}</strong>
                                                <small>Référence {entry.reference}</small>
                                                {!!entry.reexamination_count && (
                                                    <span className="review-new-version">{entry.reexamination_count} pièce(s) à réexaminer</span>
                                                )}
                                                <small>{entry.student?.email}</small>
                                                <small>Créé le {formatDate(entry.created_at)}</small>
                                            </td>
                                            <td>
                                                {entry.level?.faculty?.name || 'Faculté non renseignée'}
                                                <small>
                                                    {entry.level?.title || 'Niveau non renseigné'} ·{' '}
                                                    {entry.academic_year?.title || 'Année non renseignée'}
                                                </small>
                                            </td>
                                            <td>
                                                <span className={`review-status is-${entry.status}`}>{entry.status_label}</span>
                                            </td>
                                            <td>
                                                <span className="review-doc-count">
                                                    <FileText size={15} />
                                                    {entry.documents_count || 0} pièce(s)
                                                </span>
                                            </td>
                                            <td>
                                                <Link className="review-open-link" href={`/dashboard/admin/enrollments/${entry.id}`}>
                                                    Consulter <ArrowUpRight size={16} />
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="review-empty">
                            <FileText size={32} />
                            <h3>Aucun dossier à afficher.</h3>
                            <p>Les demandes apparaîtront ici. Vous pouvez aussi ajuster vos filtres.</p>
                            <button type="button" className="review-text-button" onClick={() => apply(true)}>
                                Afficher tous les dossiers
                            </button>
                        </div>
                    )}
                </section>
                <Pagination value={enrollments} />
            </div>
        </Dashboard>
    );
}
