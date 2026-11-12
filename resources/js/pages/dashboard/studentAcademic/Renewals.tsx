import Dashboard from '@/components/layouts/Dashboard/Dashboard';
import { labels } from '@/components/student/types';
import { Head, Link } from '@inertiajs/react';
import '../../../../css/dashboard/student-academic.css';
import '../../../../css/student-portal.css';

type Decision = {
    id: number;
    source_id: number;
    target_id: number | null;
    student: string;
    source_level: string;
    level: string;
    year: string;
    status: string | null;
};

export default function Renewals({
    decisions,
    canFinance,
}: {
    decisions: { data: Decision[]; prev_page_url: string | null; next_page_url: string | null };
    canFinance: boolean;
}) {
    return (
        <Dashboard hideAppsNavigation>
            <Head title="Réinscriptions" />
            <div className="student-portal academic-administration">
                <header className="directory-heading">
                    <div>
                        <h1>Réinscriptions</h1>
                        <p>Suivez les passages validés par le jury et la confirmation des réinscriptions.</p>
                    </div>
                    <Link className="admin-secondary" href={route('dashboard.admin.student-academic.index')}>
                        Répertoire des étudiants
                    </Link>
                </header>
                <section className="portal-panel">
                    <header>
                        <h2>Décisions de passage</h2>
                    </header>
                    <p className="portal-muted">Pour publier un passage, ouvrez le dossier de l’étudiant puis l’onglet Parcours.</p>
                    {decisions.data.length === 0 ? (
                        <p data-dashboard-panel="page">Aucune décision de passage publiée.</p>
                    ) : (
                        <div className="academic-table-scroll">
                            <table className="academic-table">
                                <thead>
                                    <tr>
                                        <th>Étudiant</th>
                                        <th>Passage</th>
                                        <th>Année</th>
                                        <th>État</th>
                                        <th>Suivi</th>
                                    </tr>
                                </thead>
                                <tbody data-dashboard-panel="page">
                                    {decisions.data.map((item) => (
                                        <tr key={item.id}>
                                            <td>
                                                <Link href={route('dashboard.admin.student-academic.show', item.source_id)}>{item.student}</Link>
                                            </td>
                                            <td>
                                                {item.source_level} → {item.level}
                                            </td>
                                            <td>{item.year}</td>
                                            <td>{item.status ? labels[item.status] || item.status : 'À lancer par l’étudiant'}</td>
                                            <td>
                                                {item.target_id && canFinance && (
                                                    <Link
                                                        href={route('dashboard.admin.student-academic.index', {
                                                            tab: 'finance',
                                                            academic: item.target_id,
                                                        })}
                                                    >
                                                        Suivi financier
                                                    </Link>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    {(decisions.prev_page_url || decisions.next_page_url) && (
                        <nav className="student-dossier-links" aria-label="Pagination">
                            {decisions.prev_page_url && (
                                <Link href={decisions.prev_page_url} preserveScroll>
                                    Précédent
                                </Link>
                            )}
                            {decisions.next_page_url && (
                                <Link href={decisions.next_page_url} preserveScroll>
                                    Suivant
                                </Link>
                            )}
                        </nav>
                    )}
                </section>
            </div>
        </Dashboard>
    );
}
