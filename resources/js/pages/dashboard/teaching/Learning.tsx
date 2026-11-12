import Pagination from '@/components/admin/Pagination';
import Dashboard from '@/components/layouts/Dashboard/Dashboard';
import { dateTime } from '@/pages/dashboard/teaching/types';
import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    ArrowUpRight,
    BookOpen,
    ChevronRight,
    Download,
    FileText,
    FolderOpen,
    Headphones,
    Link2,
    Plus,
    Search,
    Video,
} from 'lucide-react';
import { useState } from 'react';
import '../../../../css/dashboard/learning-library.css';
import '../../../../css/dashboard/student-academic.css';
import '../../../../css/student-portal.css';
import AcademicForm, { type Field, type FormSpec } from '../studentAcademic/AcademicForm';

type Page<T> = { data: T[]; total: number };
type Reference = { id: number; title: string };
type Section = Reference & { position: number; revision: number };
type Item = Reference & {
    kind: string;
    course: string;
    section: string | null;
    body: string | null;
    url: string | null;
    position: number;
    revision: number;
    is_published: boolean;
    updated_at: string;
    published_at: string | null;
    archived_at: string | null;
    academic_offering_id: number;
    academic_content_section_id: number | null;
    academic_session_id: number | null;
    supplementary_for_id: number | null;
    current_version: number | null;
    filename: string | null;
    size_bytes: number | null;
    download_count: number;
    download_url: string | null;
    preview_url: string | null;
};
type Work = Reference & Pick<Item, 'academic_content_section_id' | 'academic_session_id' | 'position' | 'revision'> & { assessment_exists?: boolean };
type Version = {
    number: number;
    reason: string | null;
    author_id: number | null;
    created_at: string;
    edition: { title: string; filename: string | null; body: string | null; url: string | null };
    download_url: string | null;
};
type Props = {
    prefix: string;
    filters: Record<string, string | number | undefined>;
    offering: number | null;
    canManage: boolean;
    resources: Page<Item>;
    offers: Page<Reference>;
    selected: Item | null;
    downloads: number | null;
    sections: Section[];
    sessions: Page<{ id: number; starts_at: string; room: string }> | null;
    works: Page<Work> | null;
    file_status: 'available' | 'missing' | 'unavailable' | null;
    versions: Page<Version> | null;
};

const kinds = { material: 'Support', syllabus: 'Syllabus', online: 'Lien', video: 'Vidéo', audio: 'Audio' };
const kindIcons = { material: FileText, syllabus: BookOpen, online: Link2, video: Video, audio: Headphones };
const statuses = { draft: 'Brouillon', published: 'Publié', archived: 'Archivé' };
const options = (labels: Record<string, string>) => Object.entries(labels).map(([value, label]) => ({ value, label }));
const reason = { name: 'reason', label: 'Motif', type: 'textarea', required: true };
const stateOf = (item: Item) => (item.archived_at ? 'archived' : item.is_published ? 'published' : 'draft');
const status = (item: Item) => statuses[stateOf(item)];
const number = new Intl.NumberFormat('fr');
const httpLink = (url: string | null) => (url && /^https?:\/\//i.test(url) ? url : null);

function placement(name: string, label: string, choices: Reference[], value?: number | null): Field {
    const all = value && !choices.some((item) => item.id === value) ? [...choices, { id: value, title: `Référence n°${value}` }] : choices;
    return { name, label, type: 'select', value, options: all.map((item) => ({ value: item.id, label: item.title })) };
}

export default function Learning({
    prefix,
    filters,
    offering,
    canManage,
    resources,
    offers,
    selected,
    downloads,
    sections,
    sessions,
    works,
    versions,
    file_status: fileStatus,
}: Props) {
    const [modal, setModal] = useState<FormSpec | null>(null);
    const [message, setMessage] = useState('');
    const index = route(prefix + 'index');
    const admin = downloads !== null;
    const open = (title: string, description: string, action: string, fields: Field[], values?: FormSpec['values']) =>
        setModal({ title, description, action, fields, values });
    const edit = (item?: Item) => {
        if (!offering) return;
        const fields: Field[] = [
            { name: 'title', label: 'Titre', value: item?.title, required: true },
            { name: 'body', label: 'Texte pédagogique', type: 'textarea', value: item?.body },
            { name: 'url', label: 'Lien externe HTTP ou HTTPS', type: 'url', value: item?.url },
            { name: 'file', label: item?.filename ? `Remplacer ${item.filename}` : 'Fichier privé', type: 'file' },
            placement('academic_content_section_id', 'Section', sections, item?.academic_content_section_id),
            placement(
                'academic_session_id',
                'Séance',
                (sessions?.data ?? []).map((s) => ({ id: s.id, title: `${dateTime(s.starts_at)} · ${s.room || 'Salle à préciser'}` })),
                item?.academic_session_id,
            ),
            placement('supplementary_for_id', 'Devoir ou évaluation associé', works?.data ?? [], item?.supplementary_for_id),
            { name: 'position', label: 'Position', type: 'number', required: true, value: item?.position ?? 0 },
        ];
        if (item) fields.push(reason);
        else fields.unshift({ name: 'kind', label: 'Type', required: true, type: 'select', options: options(kinds) });
        open(
            item ? 'Modifier la ressource' : 'Ajouter une ressource',
            item
                ? 'Une modification du titre, du texte, du lien ou du fichier crée une version à republier.'
                : 'Le support est enregistré en brouillon.',
            item ? route(prefix + 'edit', item.id) : route(prefix + 'store', offering),
            fields,
            item ? { revision: item.revision } : { operation_key: crypto.randomUUID() },
        );
    };
    const sectionForm = (section?: Section) => {
        if (!offering) return;
        open(
            section ? 'Modifier la section' : 'Ajouter une section',
            'La position fixe l’ordre des sections dans le cours.',
            route(prefix + 'section', section ? [offering, section.id] : [offering]),
            [
                { name: 'title', label: 'Titre', value: section?.title, required: true },
                { name: 'position', label: 'Position', type: 'number', value: section?.position ?? 0, required: true },
            ],
            section ? { revision: section.revision } : undefined,
        );
    };
    const placeWork = (work: Work) =>
        open(
            'Organiser le travail',
            'Le dépôt et les consignes restent gérés dans leur rubrique habituelle.',
            route(prefix + 'work-placement', work.id),
            [
                placement('academic_content_section_id', 'Section', sections, work.academic_content_section_id),
                placement(
                    'academic_session_id',
                    'Séance',
                    (sessions?.data ?? []).map((session) => ({ id: session.id, title: dateTime(session.starts_at) })),
                    work.academic_session_id,
                ),
                { name: 'position', label: 'Position', type: 'number', required: true, value: work.position },
                reason,
            ],
            { revision: work.revision },
        );
    const publish = (item: Item, action: 'publish' | 'withdraw' | 'archive') =>
        open(
            { publish: 'Publier', withdraw: 'Retirer', archive: 'Archiver' }[action],
            {
                publish: 'La version courante sera visible aux étudiants autorisés.',
                withdraw: 'Le support retournera en brouillon.',
                archive: 'Le support sera retiré du cours et conservé en lecture seule.',
            }[action],
            route(prefix + 'transition', item.id),
            action === 'publish' ? [reason, { name: 'notify', label: 'Notifier les étudiants concernés', type: 'checkbox' }] : [reason],
            { revision: item.revision, action },
        );
    const reuse = (item: Item, version?: number) =>
        open(
            'Réutiliser dans une offre',
            'La copie sera créée en brouillon dans l’offre de destination. Les accès et la publication sont indépendants.',
            route(prefix + 'reuse', item.id),
            [
                {
                    name: 'destination',
                    label: 'Identifiant de l’offre de destination (visible dans la liste des offres)',
                    type: 'number',
                    required: true,
                },
                reason,
            ],
            { operation_key: crypto.randomUUID(), ...(version ? { source_version: version } : {}) },
        );
    const fileLinks = (item: Item) => (
        <div className="learning-actions">
            {item.download_url && <a href={item.download_url}>Télécharger {item.filename || 'le fichier'}</a>}
            {item.preview_url && (
                <a href={item.preview_url} target="_blank" rel="noopener noreferrer">
                    Consulter le fichier
                </a>
            )}
            {httpLink(item.url) && (
                <a href={httpLink(item.url)!} target="_blank" rel="noopener noreferrer">
                    Ouvrir le lien externe
                </a>
            )}
        </div>
    );

    return (
        <Dashboard hideAppsNavigation>
            <Head title="Ressources pédagogiques" />
            {modal && (
                <AcademicForm
                    spec={modal}
                    onClose={() => setModal(null)}
                    onSuccess={(feedback) => {
                        setModal(null);
                        setMessage(feedback);
                    }}
                />
            )}
            <main className="student-portal academic-administration learning-library">
                <header className="learning-header">
                    <div>
                        <Link
                            className="learning-back"
                            href={route(admin ? 'dashboard.admin.teaching.index' : 'dashboard.teaching.index', offering ? { offering } : {})}
                        >
                            <ArrowLeft size={16} aria-hidden="true" /> Retour aux enseignements
                        </Link>
                        <h1>Ressources pédagogiques</h1>
                    </div>
                    {canManage && (
                        <button type="button" className="learning-button is-primary" onClick={() => edit()}>
                            <Plus size={17} aria-hidden="true" /> Ajouter une ressource
                        </button>
                    )}
                </header>
                <div className="learning-metrics" aria-label="Résultats dans le périmètre actuel">
                    <div>
                        <span className="learning-metric-icon">
                            <FileText size={20} aria-hidden="true" />
                        </span>
                        <div>
                            <strong>{number.format(resources.total)}</strong>
                            <span>Ressources</span>
                        </div>
                    </div>
                    <div>
                        <span className="learning-metric-icon">
                            <BookOpen size={20} aria-hidden="true" />
                        </span>
                        <div>
                            <strong>{number.format(offers.total)}</strong>
                            <span>Offres de cours</span>
                        </div>
                    </div>
                    {downloads !== null && (
                        <div>
                            <span className="learning-metric-icon">
                                <Download size={20} aria-hidden="true" />
                            </span>
                            <div>
                                <strong>{number.format(downloads)}</strong>
                                <span>Téléchargements autorisés</span>
                            </div>
                        </div>
                    )}
                </div>
                {message && (
                    <p role="status" className="portal-alert">
                        {message}
                    </p>
                )}
                <section className="portal-panel learning-panel learning-filters" aria-labelledby="learning-filter-heading">
                    <h2 id="learning-filter-heading">
                        <Search size={18} aria-hidden="true" /> Rechercher des ressources
                    </h2>
                    <form
                        key={JSON.stringify(filters)}
                        className="academic-admin-form learning-search"
                        onSubmit={(event) => {
                            event.preventDefault();
                            const fields = new FormData(event.currentTarget);
                            router.get(
                                index,
                                Object.fromEntries([...fields].filter(([, value]) => value !== '').map(([name, value]) => [name, String(value)])),
                            );
                        }}
                    >
                        <div className="academic-field">
                            <label htmlFor="learning-query">Titre du support</label>
                            <input
                                id="learning-query"
                                name="q"
                                type="search"
                                defaultValue={filters.q}
                                placeholder="Ex. Introduction à l’algorithmique"
                            />
                        </div>
                        <div className="academic-field">
                            <label htmlFor="learning-kind">Type</label>
                            <select id="learning-kind" name="kind" defaultValue={filters.kind}>
                                <option value="">Tous</option>
                                {options(kinds).map((kind) => (
                                    <option key={kind.value} value={kind.value}>
                                        {kind.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="academic-field">
                            <label htmlFor="learning-status">État</label>
                            <select id="learning-status" name="status" defaultValue={filters.status}>
                                <option value="">Tous</option>
                                {options(statuses).map((state) => (
                                    <option key={state.value} value={state.value}>
                                        {state.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        {admin && (
                            <details
                                className="learning-advanced"
                                open={['year', 'faculty', 'program', 'course', 'teacher'].some((key) => !!filters[key]) || undefined}
                            >
                                <summary>Filtres avancés</summary>
                                <div className="learning-advanced-grid">
                                    {Object.entries({
                                        year: 'Année',
                                        faculty: 'Faculté',
                                        program: 'Programme',
                                        course: 'Cours',
                                        teacher: 'Enseignant',
                                    }).map(([name, label]) => (
                                        <div key={name} className="academic-field">
                                            <label htmlFor={`learning-${name}`}>{label}</label>
                                            <input id={`learning-${name}`} name={name} type="number" min="1" defaultValue={filters[name]} />
                                        </div>
                                    ))}
                                </div>
                            </details>
                        )}
                        {offering && <input type="hidden" name="offering" value={offering} />}
                        <div className="learning-actions learning-search-actions">
                            <Link className="learning-button" href={route(prefix + 'index', offering ? { offering } : {})}>
                                Réinitialiser les filtres
                            </Link>
                            <button className="learning-button is-primary" type="submit">
                                <Search size={16} aria-hidden="true" /> Appliquer les filtres
                            </button>
                        </div>
                    </form>
                </section>
                <div className="learning-workspace">
                    <aside className="portal-panel learning-panel learning-offers" aria-labelledby="learning-offers-heading">
                        <h2 id="learning-offers-heading">
                            <BookOpen size={18} aria-hidden="true" /> Offres de cours
                        </h2>
                        {offering && (
                            <Link className="learning-all" href={route(prefix + 'index', { ...filters, resource: undefined, offering: undefined })}>
                                Afficher toutes les offres
                            </Link>
                        )}
                        {offers.data.length ? (
                            <ul className="learning-offer-list">
                                {offers.data.map((offer) => (
                                    <li key={offer.id}>
                                        <Link
                                            aria-current={offering === offer.id ? 'true' : undefined}
                                            href={route(prefix + 'index', { ...filters, resource: undefined, offering: offer.id })}
                                        >
                                            <span>
                                                <strong>{offer.title}</strong>
                                                <small>Offre n°{offer.id}</small>
                                            </span>
                                            <ChevronRight size={16} aria-hidden="true" />
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="learning-empty">Aucune offre dans ce périmètre.</p>
                        )}
                        <Pagination value={offers} />
                    </aside>
                    <div className="learning-main">
                        {offering && (
                            <section className="portal-panel learning-panel learning-sections">
                                <div className="learning-section-heading">
                                    <h2>
                                        <FolderOpen size={18} aria-hidden="true" /> Sections de l’offre n°{offering}
                                    </h2>
                                    {canManage && (
                                        <button className="learning-button" onClick={() => sectionForm()}>
                                            <Plus size={16} aria-hidden="true" /> Ajouter une section
                                        </button>
                                    )}
                                </div>
                                {sections.length ? (
                                    <ul className="learning-section-list">
                                        {sections.map((section) => (
                                            <li key={section.id}>
                                                <span>
                                                    {section.title} <small>· Position {section.position}</small>
                                                </span>
                                                {canManage && (
                                                    <button className="learning-button" onClick={() => sectionForm(section)}>
                                                        Modifier
                                                    </button>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p>Aucune section. Les ressources peuvent rester dans la liste générale.</p>
                                )}
                                {canManage && (
                                    <details>
                                        <summary>Séances et travaux à organiser</summary>
                                        {works?.data.length ? (
                                            <ul>
                                                {works.data.map((work) => (
                                                    <li key={work.id}>
                                                        {work.title}{' '}
                                                        {work.assessment_exists ? (
                                                            <Link
                                                                className="learning-button"
                                                                href={route(
                                                                    admin
                                                                        ? 'dashboard.admin.assessments.index'
                                                                        : 'dashboard.teaching.assessments.index',
                                                                    { resource: work.id },
                                                                )}
                                                            >
                                                                Ouvrir l’évaluation
                                                            </Link>
                                                        ) : (
                                                            <button className="learning-button" onClick={() => placeWork(work)}>
                                                                Associer à une section ou une séance
                                                            </button>
                                                        )}
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p>Aucun devoir ou évaluation dans cette offre.</p>
                                        )}
                                        <Pagination value={sessions} />
                                        <Pagination value={works} />
                                    </details>
                                )}
                            </section>
                        )}
                        {selected && (
                            <section
                                id="learning-selected"
                                className="portal-panel learning-panel learning-selected"
                                aria-label="Ressource sélectionnée"
                                data-resource-id={selected.id}
                            >
                                <div className="learning-section-heading">
                                    <h2 tabIndex={-1}>
                                        <FileText size={18} aria-hidden="true" /> {selected.title}
                                    </h2>
                                    <span className="learning-state" data-state={stateOf(selected)}>
                                        {status(selected)}
                                    </span>
                                </div>
                                <p className="learning-muted">
                                    {selected.course} · {selected.section ?? 'Sans section'}
                                    {selected.current_version ? ` · Version ${selected.current_version}` : ' · Édition historique'}
                                </p>
                                <p>
                                    Mis à jour le {dateTime(selected.updated_at)}
                                    {selected.published_at && ` · Publié le ${dateTime(selected.published_at)}`}
                                    {selected.archived_at && ` · Archivé le ${dateTime(selected.archived_at)}`}
                                </p>
                                {selected.body && <p style={{ whiteSpace: 'pre-wrap' }}>{selected.body}</p>}
                                {fileStatus && fileStatus !== 'available' ? (
                                    <p role="status">Fichier indisponible dans le stockage configuré.</p>
                                ) : (
                                    fileLinks(selected)
                                )}
                                {selected.size_bytes !== null && (
                                    <p>Taille du fichier : {new Intl.NumberFormat('fr').format(selected.size_bytes)} octets.</p>
                                )}
                                {canManage && (
                                    <div className="learning-actions">
                                        {!selected.archived_at && (
                                            <>
                                                <button className="learning-button" onClick={() => edit(selected)}>
                                                    Modifier
                                                </button>
                                                <button
                                                    className="learning-button is-primary"
                                                    onClick={() => publish(selected, selected.is_published ? 'withdraw' : 'publish')}
                                                >
                                                    {selected.is_published ? 'Retirer' : 'Publier'}
                                                </button>
                                                <button className="learning-button" onClick={() => publish(selected, 'archive')}>
                                                    Archiver
                                                </button>
                                            </>
                                        )}
                                        <button className="learning-button" onClick={() => reuse(selected)}>
                                            Réutiliser
                                        </button>
                                    </div>
                                )}
                                {versions && (
                                    <>
                                        <h3 className="learning-versions-heading">Historique des versions</h3>
                                        {versions.data.length ? (
                                            <ul>
                                                {versions.data.map((version) => (
                                                    <li key={version.number}>
                                                        <details>
                                                            <summary>
                                                                Version {version.number} · {version.edition.title} · {dateTime(version.created_at)}
                                                            </summary>
                                                            {version.author_id && <p>Auteur n°{version.author_id}</p>}
                                                            {version.reason && <p>{version.reason}</p>}
                                                            {version.edition.body && <p style={{ whiteSpace: 'pre-wrap' }}>{version.edition.body}</p>}
                                                            {httpLink(version.edition.url) && (
                                                                <a href={httpLink(version.edition.url)!} target="_blank" rel="noopener noreferrer">
                                                                    Ouvrir le lien de cette version
                                                                </a>
                                                            )}
                                                            {version.download_url && (
                                                                <a href={version.download_url}>
                                                                    Télécharger {version.edition.filename || 'cette version'}
                                                                </a>
                                                            )}
                                                            {canManage && (
                                                                <button className="learning-button" onClick={() => reuse(selected, version.number)}>
                                                                    Réutiliser cette version
                                                                </button>
                                                            )}
                                                        </details>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p>L’édition historique sera enregistrée lors du premier remplacement.</p>
                                        )}
                                        <Pagination value={versions} />
                                    </>
                                )}
                            </section>
                        )}
                        <section className="portal-panel learning-panel" aria-labelledby="learning-results-heading">
                            <div className="learning-section-heading">
                                <h2 id="learning-results-heading">Bibliothèque de supports</h2>
                                <span className="learning-count">
                                    {number.format(resources.total)} résultat{resources.total !== 1 ? 's' : ''}
                                </span>
                            </div>
                            {resources.data.length ? (
                                <ul className="learning-resource-list">
                                    {resources.data.map((item) => {
                                        const Icon = kindIcons[item.kind as keyof typeof kinds] ?? FileText;
                                        return (
                                            <li key={item.id}>
                                                <Link
                                                    aria-current={selected?.id === item.id ? 'true' : undefined}
                                                    href={route(prefix + 'index', {
                                                        ...filters,
                                                        offering: item.academic_offering_id,
                                                        resource: item.id,
                                                    })}
                                                    preserveScroll
                                                    onSuccess={() => {
                                                        requestAnimationFrame(() => {
                                                            const panel = document.getElementById('learning-selected');
                                                            if (panel?.dataset.resourceId !== String(item.id)) return;

                                                            panel.querySelector('h2')?.focus({ preventScroll: true });
                                                            panel.scrollIntoView({
                                                                block: 'start',
                                                                behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
                                                                    ? 'instant'
                                                                    : 'smooth',
                                                            });
                                                        });
                                                    }}
                                                >
                                                    <span className="learning-item-icon">
                                                        <Icon size={20} aria-hidden="true" />
                                                    </span>
                                                    <span className="learning-resource-copy">
                                                        <strong>{item.title}</strong>
                                                        <small>
                                                            {kinds[item.kind as keyof typeof kinds] ?? item.kind} · {item.course}
                                                            {item.section && ` · ${item.section}`}
                                                        </small>
                                                    </span>
                                                    <span className="learning-state" data-state={stateOf(item)}>
                                                        {status(item)}
                                                    </span>
                                                    <ArrowUpRight className="learning-resource-arrow" size={16} aria-hidden="true" />
                                                </Link>
                                            </li>
                                        );
                                    })}
                                </ul>
                            ) : (
                                <div className="learning-empty learning-library-empty">
                                    <FolderOpen size={24} aria-hidden="true" />
                                    <p>Aucun support ne correspond à ces critères.</p>
                                </div>
                            )}
                            <Pagination value={resources} />
                        </section>
                    </div>
                </div>
            </main>
        </Dashboard>
    );
}
