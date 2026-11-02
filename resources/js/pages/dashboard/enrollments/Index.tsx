import Pagination from '@/components/admin/Pagination';
import Dashboard from '@/components/layouts/Dashboard/Dashboard';
import { formatDate, nextStep, statusLabels, type StudentEnrollment } from '@/lib/studentEnrollment';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowUpRight, CheckCircle2, Clock3, FileCheck2, FilePenLine, FolderOpen, GraduationCap, Plus, Search } from 'lucide-react';
import { useState } from 'react';
import '../../../../css/student-enrollments.css';

type Props = {
    enrollments: {
        data: StudentEnrollment[];
        total: number;
        from: number | null;
        to: number | null;
        links: { url: string | null; label: string; active: boolean }[];
    };
    filters: { q?: string; status?: string };
    stats: { total: number; draft: number; in_progress: number; validated: number };
    success?: string;
};
export default function Index({ enrollments, filters, stats, success }: Props) {
    const [search, setSearch] = useState({ q: filters.q || '', status: filters.status || '' });
    const [loading, setLoading] = useState(false);
    const apply = (reset = false) => {
        const values = reset ? { q: '', status: '' } : search;
        if (reset) setSearch(values);
        router.get('/dashboard/enrollments', values, {
            preserveState: true,
            preserveScroll: true,
            onStart: () => setLoading(true),
            onFinish: () => setLoading(false),
        });
    };
    return (
        <Dashboard>
            <Head title="Mes inscriptions" />
            <div className="student-enrollments">
                <header className="student-page-heading">
                    <div>
                        <span>MON PARCOURS À L’USK</span>
                        <h1>Mes inscriptions</h1>
                        <p>Chaque étape de votre candidature, dans un seul espace.</p>
                    </div>
                    <Link href="/dashboard/enrollments/create" className="student-primary">
                        <Plus size={17} />
                        Nouvelle inscription
                    </Link>
                </header>
                {success && (
                    <p className="student-notice" role="status">
                        {success}
                    </p>
                )}
                <div className="student-stats">
                    {[
                        { label: 'Dossiers', value: stats.total, icon: FolderOpen },
                        { label: 'Brouillons', value: stats.draft, icon: FilePenLine },
                        { label: 'En cours', value: stats.in_progress, icon: Clock3 },
                        { label: 'Validés', value: stats.validated, icon: CheckCircle2 },
                    ].map((item) => (
                        <div key={item.label}>
                            <item.icon size={21} strokeWidth={1.5} />
                            <div>
                                <strong>{item.value}</strong>
                                <span>{item.label}</span>
                            </div>
                        </div>
                    ))}
                </div>
                <form
                    className="student-filters"
                    onSubmit={(event) => {
                        event.preventDefault();
                        apply();
                    }}
                >
                    <div>
                        <label htmlFor="student-search">Retrouver un dossier</label>
                        <div className="student-search">
                            <Search size={17} />
                            <input
                                id="student-search"
                                type="search"
                                placeholder="Référence, formation, faculté ou année…"
                                maxLength={150}
                                value={search.q}
                                onChange={(event) => setSearch({ ...search, q: event.target.value })}
                            />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="student-status">Statut du dossier</label>
                        <select id="student-status" value={search.status} onChange={(event) => setSearch({ ...search, status: event.target.value })}>
                            <option value="">Tous les statuts</option>
                            {Object.entries(statusLabels).map(([value, label]) => (
                                <option key={value} value={value}>
                                    {label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <button className="student-primary" disabled={loading}>
                        {loading ? 'Recherche…' : 'Rechercher'}
                    </button>
                    <button type="button" className="student-text-button" disabled={loading} onClick={() => apply(true)}>
                        Réinitialiser
                    </button>
                </form>
                <div className="student-results">
                    <h2>Vos dossiers de candidature</h2>
                    <span>
                        {enrollments.total} résultat{enrollments.total > 1 ? 's' : ''}
                    </span>
                </div>
                {enrollments.data.length ? (
                    <>
                        <div className="student-card-grid">
                            {enrollments.data.map((entry) => (
                                <article key={entry.id} className="student-enrollment-card">
                                    <header>
                                        <span className="student-reference">{entry.reference}</span>
                                        <span className={`student-badge is-${entry.status}`}>
                                            {statusLabels[entry.status] || 'Statut à confirmer'}
                                        </span>
                                    </header>
                                    <div className="student-card-program">
                                        <span className="student-program-icon">
                                            <GraduationCap size={25} strokeWidth={1.5} />
                                        </span>
                                        <div>
                                            <p>{entry.level?.faculty?.name || 'Faculté à choisir'}</p>
                                            <h3>{entry.level?.title || 'Formation à compléter'}</h3>
                                        </div>
                                    </div>
                                    <dl className="student-card-facts">
                                        <div>
                                            <dt>Année académique</dt>
                                            <dd>{entry.academic_year?.title || 'À sélectionner'}</dd>
                                        </div>
                                        <div>
                                            <dt>Création du dossier</dt>
                                            <dd>{formatDate(entry.created_at)}</dd>
                                        </div>
                                    </dl>
                                    <div className="student-card-documents">
                                        <FileCheck2 size={18} />
                                        <span>Pièces acceptées</span>
                                        <strong>
                                            {entry.accepted_documents_count || 0}
                                            <small> / {entry.documents_count || 0}</small>
                                        </strong>
                                    </div>
                                    <p className="student-card-guidance">{nextStep(entry)}</p>
                                    <footer>
                                        {entry.academic_portal_url && (
                                            <Link className="student-secondary" href={entry.academic_portal_url}>
                                                Accéder à mon espace étudiant
                                                <GraduationCap size={17} />
                                            </Link>
                                        )}
                                        {entry.status === 'draft' ? (
                                            <>
                                                <Link className="student-primary" href={`/dashboard/enrollments/${entry.uuid}/edit`}>
                                                    <FilePenLine size={16} />
                                                    Reprendre le brouillon
                                                </Link>
                                                <Link className="student-text-button" href={`/dashboard/enrollments/${entry.uuid}`}>
                                                    Consulter
                                                </Link>
                                            </>
                                        ) : (
                                            <Link className="student-primary" href={`/dashboard/enrollments/${entry.uuid}`}>
                                                Consulter mon dossier
                                                <ArrowUpRight size={17} />
                                            </Link>
                                        )}
                                    </footer>
                                </article>
                            ))}
                        </div>
                        <Pagination value={enrollments} />
                    </>
                ) : (
                    <section className="student-empty">
                        <FolderOpen size={36} strokeWidth={1.3} />
                        <h2>{stats.total ? 'Aucun dossier ne correspond.' : 'Votre parcours commence ici.'}</h2>
                        <p>
                            {stats.total
                                ? 'Modifiez votre recherche pour retrouver votre candidature.'
                                : 'Choisissez votre formation et préparez votre dossier d’inscription à l’Université Simon Kimbangu.'}
                        </p>
                        {stats.total ? (
                            <button className="student-secondary" onClick={() => apply(true)}>
                                Effacer les filtres
                            </button>
                        ) : (
                            <Link className="student-primary" href="/dashboard/enrollments/create">
                                Commencer mon inscription
                                <ArrowUpRight size={17} />
                            </Link>
                        )}
                    </section>
                )}
            </div>
        </Dashboard>
    );
}
