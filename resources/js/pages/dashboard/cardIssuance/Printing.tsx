import PageHeading from '@/components/admin/PageHeading';
import Dashboard from '@/components/layouts/Dashboard/Dashboard';
import CardPagination from '@/components/studentCards/CardPagination';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { PackageCheck, Printer, Search } from 'lucide-react';
import { useState } from 'react';
import '../../../../css/dashboard/card-issuance.css';
import '../../../../css/dashboard/card-requests.css';

const prefix = 'dashboard.admin.card-issuance.';
type Row = { id: number; student_name: string; matricule: string; academic_year: string; level: string | null };

export default function Printing({ rows, term, after, next }: { rows: Row[]; term: string; after: number; next: number | null }) {
    const [query, setQuery] = useState(term);
    const errors = usePage().props.errors;
    return (
        <Dashboard hideAppsNavigation>
            <Head title="Génération et impression" />
            <div className="cr-page">
                <PageHeading
                    title="Génération et impression"
                    description="Prévisualisez et imprimez les badges NFC des étudiants éligibles."
                    action={
                        <Link className="admin-secondary" href={route(prefix + 'delivery')}>
                            <PackageCheck size={17} /> Délivrance
                        </Link>
                    }
                />
                {errors.card && (
                    <p className="ci-error" role="alert">
                        {errors.card}
                    </p>
                )}
                <section className="cr-panel">
                    <form
                        className="ci-search"
                        onSubmit={(event) => {
                            event.preventDefault();
                            router.get(route(prefix + 'printing'), { q: query.trim() || undefined });
                        }}
                    >
                        <label>
                            Rechercher un étudiant
                            <input
                                type="search"
                                maxLength={100}
                                value={query}
                                placeholder="Nom ou matricule"
                                onChange={(event) => setQuery(event.target.value)}
                            />
                        </label>
                        <button type="submit" className="admin-secondary">
                            <Search size={16} /> Rechercher
                        </button>
                    </form>
                    {rows.length ? (
                        <div className="cr-table-wrap" data-dashboard-panel="q after">
                            <table className="cr-table">
                                <thead>
                                    <tr>
                                        <th scope="col">Étudiant</th>
                                        <th scope="col">Année académique</th>
                                        <th scope="col">État</th>
                                        <th scope="col">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((row) => (
                                        <tr key={row.id}>
                                            <td>
                                                <strong>{row.student_name}</strong>
                                                <small>
                                                    {row.matricule}
                                                    {row.level ? ` · ${row.level}` : ''}
                                                </small>
                                            </td>
                                            <td>{row.academic_year}</td>
                                            <td>
                                                <span className="cr-pill" data-tone="good">
                                                    Prêt à imprimer
                                                </span>
                                            </td>
                                            <td>
                                                <Link className="admin-secondary" href={route(prefix + 'preview', row.id)}>
                                                    <Printer size={16} /> Aperçu et impression
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="cr-empty" data-dashboard-panel="q after">
                            Aucun badge éligible à imprimer dans cette liste.
                        </p>
                    )}
                    <CardPagination
                        previous={after > 0 ? { href: route(prefix + 'printing', { q: term || undefined }), label: 'Première page' } : undefined}
                        next={
                            next !== null
                                ? { href: route(prefix + 'printing', { after: next, q: term || undefined }), label: 'Page suivante' }
                                : undefined
                        }
                    />
                </section>
            </div>
        </Dashboard>
    );
}
