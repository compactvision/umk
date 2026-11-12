import PageHeading from '@/components/admin/PageHeading';
import Pagination from '@/components/admin/Pagination';
import Dashboard from '@/components/layouts/Dashboard/Dashboard';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowUpRight, FileText, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import '../../../../css/admin-enrollments.css';
import { applicantName, formatDate, statusLabels, type Dossier } from './types';
const queues = {
    new: 'Nouvelles candidatures',
    review: 'Dossiers à vérifier',
    corrections: 'Corrections demandées',
    reexamined: 'Dossiers réexaminés',
    decisions: 'Décisions',
    admitted: 'Candidatures admises',
    refused: 'Candidatures refusées',
    audit: 'Historique et audits',
};
type Filters = {
    queue?: keyof typeof queues;
    level_id?: string;
    program_id?: string;
    agent_id?: string;
    submitted_from?: string;
    submitted_to?: string;
    document_status?: string;
    reexamination?: string;
    q?: string;
    status?: string;
    faculty_id?: string;
    year_id?: string;
};
export type ListProps = {
    enrollments: { data: Dossier[]; total: number; links: { url: string | null; label: string; active: boolean }[] };
    filters: Filters;
    stats: { total: number; pending: number; validated: number; rejected: number };
    faculties: { id: number; name: string }[];
    years: { id: number; title: string }[];
    reexamination_total: number;
    levels: { id: number; title: string }[];
    programs: { id: number; name: string }[];
    agents: { id: number; first_name: string; last_name: string }[];
    success?: string;
};
export default function QueueList({ enrollments, filters, faculties, years, success, levels, programs, agents }: ListProps) {
    const [search, setSearch] = useState(filters);
    const [loading, setLoading] = useState(false);
    useEffect(() => setSearch(filters), [filters]);
    const isDecision = filters.queue === 'decisions' || filters.queue === 'admitted' || filters.queue === 'refused';
    const isTreatment = Boolean(filters.reexamination) || filters.queue === 'new' || filters.queue === 'review' || filters.queue === 'corrections';
    const title = isDecision ? 'Décisions' : isTreatment ? 'À traiter' : filters.queue ? queues[filters.queue] : 'Candidatures';
    const current = filters.reexamination ? 'reexamination' : filters.queue;
    const views = isDecision
        ? [
              { id: 'decisions', label: 'Toutes les décisions' },
              { id: 'admitted', label: 'Admis' },
              { id: 'refused', label: 'Refusés' },
          ]
        : [
              { id: 'new', label: 'Nouvelles' },
              { id: 'review', label: 'En analyse' },
              { id: 'corrections', label: 'Correction attendue' },
              { id: 'reexamination', label: 'Pièces corrigées reçues' },
          ];
    const viewFilters = { queue: filters.queue, reexamination: filters.reexamination };
    const apply = (reset = false) =>
        router.get('/dashboard/admin/enrollments', reset ? viewFilters : search, {
            preserveScroll: true,
            onStart: () => setLoading(true),
            onFinish: () => setLoading(false),
        });
    return (
        <Dashboard hideAppsNavigation>
            <Head title={title + ' · Admissions'} />
            <div className="admin-enrollments">
                <PageHeading
                    title={title}
                    description={
                        isDecision ? 'Retrouvez les admissions et les refus.' : 'Retrouvez les dossiers à examiner et les pièces à réexaminer.'
                    }
                    action={
                        <Link className="admin-primary" href="/dashboard/admin/enrollments">
                            Toutes les candidatures
                        </Link>
                    }
                />
                {(isTreatment || isDecision) && (
                    <nav className="admission-queue-views" aria-label={isDecision ? 'Filtrer les décisions' : 'Filtrer les dossiers à traiter'}>
                        {views.map(({ id, label }) => {
                            const params = Object.fromEntries(
                                Object.entries(filters).filter(([key, value]) => value && !['queue', 'reexamination', 'status'].includes(key)),
                            );
                            if (id === 'reexamination') params.reexamination = '1';
                            else params.queue = id;
                            return (
                                <Link key={id} href="/dashboard/admin/enrollments" data={params} aria-current={id === current ? 'page' : undefined}>
                                    {label}
                                </Link>
                            );
                        })}
                    </nav>
                )}
                {success && (
                    <p className="review-notice" role="status">
                        {success}
                    </p>
                )}
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
                                value={search.q ?? ''}
                                onChange={(e) => setSearch({ ...search, q: e.target.value })}
                                placeholder="Nom, email, matricule ou référence…"
                                type="search"
                                maxLength={150}
                            />
                        </div>
                    </div>
                    {!isTreatment && !isDecision && (
                        <div>
                            <label htmlFor="dossier-status">Statut</label>
                            <select
                                id="dossier-status"
                                value={search.status ?? ''}
                                onChange={(e) => setSearch({ ...search, status: e.target.value })}
                            >
                                <option value="">Tous les statuts</option>
                                {Object.entries(statusLabels).map(([key, label]) => (
                                    <option value={key} key={key}>
                                        {label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                    <div>
                        <label htmlFor="dossier-faculty">Faculté</label>
                        <select
                            id="dossier-faculty"
                            value={search.faculty_id ?? ''}
                            onChange={(e) => setSearch({ ...search, faculty_id: e.target.value })}
                        >
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
                        <select id="dossier-year" value={search.year_id ?? ''} onChange={(e) => setSearch({ ...search, year_id: e.target.value })}>
                            <option value="">Toutes les années</option>
                            {years.map((year) => (
                                <option value={year.id} key={year.id}>
                                    {year.title}
                                </option>
                            ))}
                        </select>
                    </div>
                    {(
                        [
                            { key: 'level_id', label: 'Niveau', options: levels.map((level) => [String(level.id), level.title]) },
                            { key: 'program_id', label: 'Programme', options: programs.map((program) => [String(program.id), program.name]) },
                            {
                                key: 'agent_id',
                                label: 'Agent chargé de l’analyse',
                                options: agents.map((agent) => [String(agent.id), `${agent.first_name} ${agent.last_name}`]),
                            },
                            {
                                key: 'document_status',
                                label: 'État des pièces',
                                options: [
                                    ['pending', 'À examiner'],
                                    ['accepted', 'Acceptées'],
                                    ['rejected', 'Refusées'],
                                    ['correction_requested', 'À corriger'],
                                ],
                            },
                        ] as const
                    ).map(({ key, label, options }) => (
                        <div key={key}>
                            <label htmlFor={key}>{label}</label>
                            <select id={key} value={search[key] ?? ''} onChange={(event) => setSearch({ ...search, [key]: event.target.value })}>
                                <option value="">Tous</option>
                                {options.map(([value, text]) => (
                                    <option key={value} value={value}>
                                        {text}
                                    </option>
                                ))}
                            </select>
                        </div>
                    ))}
                    {(['submitted_from', 'submitted_to'] as const).map((key) => (
                        <div key={key}>
                            <label htmlFor={key}>{key === 'submitted_from' ? 'Soumis à partir du' : 'Soumis jusqu’au'}</label>
                            <input
                                id={key}
                                type="date"
                                value={search[key] ?? ''}
                                onChange={(event) => setSearch({ ...search, [key]: event.target.value })}
                            />
                        </div>
                    ))}
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
                                <tbody data-dashboard-panel="">
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
                        <div className="review-empty" data-dashboard-panel="">
                            <FileText size={32} />
                            <h3>Aucun dossier à afficher.</h3>
                            <p>Les demandes apparaîtront ici. Vous pouvez aussi ajuster vos filtres.</p>
                            <button type="button" className="review-text-button" onClick={() => apply(true)}>
                                Effacer les filtres
                            </button>
                        </div>
                    )}
                </section>
                <Pagination value={enrollments} />
            </div>
        </Dashboard>
    );
}
