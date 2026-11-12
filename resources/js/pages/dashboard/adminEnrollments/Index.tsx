import PageHeading from '@/components/admin/PageHeading';
import Pagination from '@/components/admin/Pagination';
import Dashboard from '@/components/layouts/Dashboard/Dashboard';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowUpRight, FileText, Search, SlidersHorizontal, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import '../../../../css/admin-enrollments.css';
import QueueList, { type ListProps } from './QueueList';
import { applicantName, statusLabels, type Dossier } from './types';

const admissions = '/dashboard/admin/enrollments';
const dateFormat = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeZone: 'Africa/Kinshasa' });
const dossierStatuses = { ...statusLabels, pending: 'En analyse', validated: 'Admis', rejected: 'Refusé' };
type FilterKey =
    'q' | 'status' | 'year_id' | 'faculty_id' | 'program_id' | 'level_id' | 'agent_id' | 'submitted_from' | 'submitted_to' | 'document_status';
type Selection = Partial<Record<FilterKey, string>>;
type Choice = { key: FilterKey; label: string; options: [string, string][] };

function DocumentStatus({ entry }: { entry: Dossier }) {
    const total = entry.documents_count ?? 0;
    const pending = entry.pending_documents ?? 0;
    const corrections = entry.correction_documents ?? 0;
    return (
        <div className="admission-document-status">
            {corrections > 0 && <strong className="admission-document-warning">Correction attendue</strong>}
            {pending > 0 && <strong>{pending} à vérifier</strong>}
            {total > 0 && entry.accepted_documents === total && <strong>Toutes acceptées</strong>}
            <small>{total === 0 ? 'Aucune pièce' : `${total} pièce${total > 1 ? 's' : ''}`}</small>
        </div>
    );
}

function AllApplications({ enrollments, filters, faculties, years, levels, programs, agents, success }: ListProps) {
    const [query, setQuery] = useState(filters.q ?? '');
    const [advanced, setAdvanced] = useState<Selection>(filters);
    const [loading, setLoading] = useState(false);
    const panel = useRef<HTMLDetailsElement>(null);
    const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const cancel = useRef<(() => void) | undefined>(undefined);

    useEffect(() => {
        setQuery(filters.q ?? '');
        setAdvanced(filters);
    }, [filters]);

    useEffect(
        () => () => {
            clearTimeout(timer.current);
            cancel.current?.();
        },
        [],
    );

    const visit = (selection: Selection, replace = false) => {
        clearTimeout(timer.current);
        cancel.current?.();
        router.get(admissions, Object.fromEntries(Object.entries(selection).filter(([, value]) => value)), {
            preserveState: true,
            preserveScroll: true,
            replace,
            onCancelToken: (token) => {
                cancel.current = () => token.cancel();
            },
            onStart: () => setLoading(true),
            onFinish: () => {
                setLoading(false);
                cancel.current = undefined;
            },
        });
    };
    const search = (value: string) => {
        setQuery(value);
        clearTimeout(timer.current);
        cancel.current?.();
        timer.current = setTimeout(() => visit({ ...filters, q: value.trim() }, true), 350);
    };
    const apply = (selection: Selection) => visit({ ...filters, q: query.trim(), ...selection });

    const basic: Choice[] = [
        { key: 'year_id', label: 'Année', options: years.map((year) => [String(year.id), year.title]) },
        { key: 'status', label: 'Statut', options: Object.entries(dossierStatuses) },
    ];
    const extra: Choice[] = [
        { key: 'faculty_id', label: 'Faculté', options: faculties.map((faculty) => [String(faculty.id), faculty.name]) },
        { key: 'program_id', label: 'Programme', options: programs.map((program) => [String(program.id), program.name]) },
        { key: 'level_id', label: 'Niveau', options: levels.map((level) => [String(level.id), level.title]) },
        {
            key: 'agent_id',
            label: 'Agent chargé de l’analyse',
            options: agents.map((agent) => [String(agent.id), `${agent.first_name} ${agent.last_name}`]),
        },
        {
            key: 'document_status',
            label: 'État des pièces',
            options: [
                ['pending', 'À vérifier'],
                ['accepted', 'Acceptées'],
                ['rejected', 'Refusées'],
                ['correction_requested', 'À corriger'],
            ],
        },
    ];
    const dates = [
        { key: 'submitted_from', label: 'Soumis à partir du' },
        { key: 'submitted_to', label: 'Soumis jusqu’au' },
    ] as const;
    const active = [
        { key: 'q' as const, label: 'Recherche', value: filters.q },
        ...[...basic, ...extra].map(({ key, label, options }) => ({ key, label, value: options.find(([id]) => id === String(filters[key]))?.[1] })),
        ...dates.map(({ key, label }) => ({ key, label, value: filters[key] })),
    ].filter(({ value }) => value);
    const advancedCount = [...extra, ...dates].filter(({ key }) => filters[key]).length;
    const select = ({ key, label, options }: Choice, values: Selection, change: (value: string) => void) => (
        <div key={key}>
            <label htmlFor={key}>{label}</label>
            <select id={key} value={values[key] ?? ''} onChange={(event) => change(event.target.value)}>
                <option value="">Tous</option>
                {options.map(([value, text]) => (
                    <option key={value} value={value}>
                        {text}
                    </option>
                ))}
            </select>
        </div>
    );

    return (
        <Dashboard hideAppsNavigation>
            <Head title="Toutes les candidatures" />
            <div className="admin-enrollments">
                <PageHeading title="Toutes les candidatures" description="Recherchez un dossier et repérez les pièces qui nécessitent une action." />
                {success && (
                    <p className="review-notice" role="status">
                        {success}
                    </p>
                )}
                <section className="admission-directory-controls" aria-label="Recherche et filtres">
                    <form
                        className="admission-directory-search"
                        onSubmit={(event) => {
                            event.preventDefault();
                            apply({});
                        }}
                    >
                        <div className="review-search">
                            <label htmlFor="admission-search">Rechercher un dossier</label>
                            <div>
                                <Search size={17} aria-hidden="true" />
                                <input
                                    id="admission-search"
                                    type="search"
                                    value={query}
                                    onChange={(event) => search(event.target.value)}
                                    maxLength={150}
                                    placeholder="Nom, email, matricule ou référence…"
                                />
                            </div>
                        </div>
                        {basic.map((choice) => select(choice, filters, (value) => apply({ [choice.key]: value })))}
                        <button className="sr-only" type="submit">
                            Rechercher
                        </button>
                    </form>
                    <details ref={panel} className="admission-directory-advanced">
                        <summary>
                            <SlidersHorizontal size={16} aria-hidden="true" /> Filtres{advancedCount > 0 && ` (${advancedCount})`}
                        </summary>
                        <form
                            onSubmit={(event) => {
                                event.preventDefault();
                                apply(Object.fromEntries([...extra, ...dates].map(({ key }) => [key, advanced[key] ?? ''])));
                                if (panel.current) panel.current.open = false;
                            }}
                        >
                            <div className="admission-directory-options">
                                {extra.map((choice) => select(choice, advanced, (value) => setAdvanced({ ...advanced, [choice.key]: value })))}
                                {dates.map(({ key, label }) => (
                                    <div key={key}>
                                        <label htmlFor={key}>{label}</label>
                                        <input
                                            id={key}
                                            type="date"
                                            value={advanced[key] ?? ''}
                                            min={key === 'submitted_to' ? advanced.submitted_from : undefined}
                                            onChange={(event) => setAdvanced({ ...advanced, [key]: event.target.value })}
                                        />
                                    </div>
                                ))}
                            </div>
                            <button className="admin-primary" type="submit">
                                Appliquer les filtres
                            </button>
                        </form>
                    </details>
                    {active.length > 0 && (
                        <div className="admission-directory-chips" aria-label="Filtres actifs">
                            {active.map(({ key, label, value }) => (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => {
                                        if (key === 'q') setQuery('');
                                        apply({ [key]: '' });
                                    }}
                                    aria-label={`Retirer le filtre ${label} : ${value}`}
                                >
                                    {label} : {value} <X size={14} aria-hidden="true" />
                                </button>
                            ))}
                            <button
                                type="button"
                                className="review-text-button"
                                onClick={() => {
                                    setQuery('');
                                    visit({});
                                }}
                            >
                                Tout effacer
                            </button>
                        </div>
                    )}
                </section>
                <section className="review-list admission-directory" aria-label="Résultats" aria-busy={loading}>
                    <header>
                        <h2>Candidatures</h2>
                        <span role="status">
                            {loading ? 'Recherche…' : `${enrollments.total.toLocaleString('fr-FR')} dossier${enrollments.total === 1 ? '' : 's'}`}
                        </span>
                    </header>
                    {enrollments.data.length > 0 ? (
                        <table>
                            <thead>
                                <tr>
                                    <th scope="col">Candidat / Référence</th>
                                    <th scope="col">Formation</th>
                                    <th scope="col">Soumis le</th>
                                    <th scope="col">Statut</th>
                                    <th scope="col">Pièces</th>
                                    <th scope="col">
                                        <span className="sr-only">Accès au dossier</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody data-dashboard-panel="">
                                {enrollments.data.map((entry) => (
                                    <tr key={entry.id}>
                                        <td className="admission-candidate">
                                            <strong>{applicantName(entry.student)}</strong>
                                            <small>{entry.reference}</small>
                                        </td>
                                        <td className="admission-formation">
                                            {entry.level?.title ?? 'Formation non renseignée'}
                                            <small>
                                                {entry.level?.faculty?.name}
                                                {entry.level?.faculty?.name && entry.academic_year?.title ? ' · ' : ''}
                                                {entry.academic_year?.title}
                                            </small>
                                        </td>
                                        <td className="admission-submission">
                                            {entry.submitted_at ? (
                                                <time dateTime={entry.submitted_at}>{dateFormat.format(new Date(entry.submitted_at))}</time>
                                            ) : (
                                                '—'
                                            )}
                                        </td>
                                        <td className="admission-status">
                                            <span className={`review-status is-${entry.status}`}>
                                                {dossierStatuses[entry.status as keyof typeof dossierStatuses] ?? entry.status_label}
                                            </span>
                                        </td>
                                        <td className="admission-documents">
                                            <DocumentStatus entry={entry} />
                                        </td>
                                        <td className="admission-open">
                                            <Link
                                                className="review-open-link"
                                                href={`${admissions}/${entry.id}`}
                                                aria-label={`Ouvrir le dossier ${entry.reference}`}
                                            >
                                                Ouvrir <ArrowUpRight size={16} aria-hidden="true" />
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="review-empty" data-dashboard-panel="">
                            <FileText size={32} aria-hidden="true" />
                            <h3>Aucune candidature trouvée</h3>
                            <p>
                                {active.length
                                    ? 'Essayez une autre recherche ou retirez un filtre.'
                                    : 'Les dossiers apparaîtront ici dès leur création.'}
                            </p>
                        </div>
                    )}
                </section>
                <Pagination value={enrollments} />
            </div>
        </Dashboard>
    );
}

export default function Index(props: ListProps) {
    return props.filters.queue || props.filters.reexamination ? <QueueList {...props} /> : <AllApplications {...props} />;
}
