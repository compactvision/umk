import PageHeading from '@/components/admin/PageHeading';
import Pagination from '@/components/admin/Pagination';
import Dashboard from '@/components/layouts/Dashboard/Dashboard';
import { usePanelFade } from '@/hooks/use-panel-fade';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, ArrowUpRight, BookOpen, Building2, Layers3, Plus } from 'lucide-react';
import { useRef, useState, type FormEvent } from 'react';
import '../../../../css/dashboard/academic-structure.css';
import CurriculumEditor from './CurriculumEditor';
import ReferenceEditor from './ReferenceEditor';
import { AnnualDrafts, GenerateSchedule, NewVersion, ScheduleReport, Transition } from './VersionDialogs';
import { messages, statusLabels, type Props, type ReferenceKind, type Row, type Student, type Version } from './types';

const referenceHeadings = {
    cohort: 'Cohortes d’admission',
    promotion: 'Promotions annuelles',
    cycle: 'Cycles académiques',
};

function StudentRows({ rows, queryKeys }: { rows: Student[]; queryKeys: string }) {
    return (
        <div className="as-scroll" data-dashboard-panel={queryKeys}>
            <table className="as-table">
                <thead>
                    <tr>
                        <th>Étudiant</th>
                        <th>Matricule</th>
                        <th>Niveau</th>
                        <th>Année</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((student) => (
                        <tr key={student.id}>
                            <td>
                                {student.profile.user.first_name} {student.profile.user.last_name}
                            </td>
                            <td>{student.matricule || 'Non attribué'}</td>
                            <td>{student.level.title}</td>
                            <td>{student.academic_year.title}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {!rows.length && <p className="as-empty">Aucune inscription dans cette sélection.</p>}
        </div>
    );
}
function Binding({ context, version }: { context: Props; version: NonNullable<Props['selectedVersion']> }) {
    const form = useForm({ enrollment_id: '', reason: '' });
    const compatible = context.unmapped?.data.filter((entry) => version.units.some((unit) => unit.level_id === entry.level_id)) ?? [];
    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.post(route('dashboard.admin.academic-structure.versions.bind', version.id), { preserveScroll: true, onSuccess: () => form.reset() });
    };
    return (
        <form onSubmit={submit} className="as-fields as-binding">
            <label>
                Inscription sans maquette
                <select required value={form.data.enrollment_id} onChange={(event) => form.setData('enrollment_id', event.target.value)}>
                    <option value="">Choisir explicitement une inscription</option>
                    {compatible.map((entry) => (
                        <option key={entry.id} value={entry.id}>
                            {entry.profile.user.first_name} {entry.profile.user.last_name} · {entry.matricule || entry.level.title} ·{' '}
                            {entry.academic_year.title}
                        </option>
                    ))}
                </select>
            </label>
            <label>
                Motif de rattachement
                <input
                    required
                    minLength={5}
                    maxLength={1000}
                    value={form.data.reason}
                    onChange={(event) => form.setData('reason', event.target.value)}
                />
            </label>
            <button className="admin-primary" disabled={form.processing}>
                Rattacher cette inscription
            </button>
            {Object.entries(messages(form.errors)).map(([key, value]) => (
                <p role="alert" className="as-error" key={key}>
                    {value}
                </p>
            ))}
        </form>
    );
}
export default function AcademicStructure() {
    const context = usePage<Props>().props;
    const [tab, setTab] = useState<'institution' | 'programs' | 'curriculum'>(
        context.filters.tab ?? (context.selectedVersion ? 'curriculum' : 'programs'),
    );
    const tabPanel = usePanelFade<HTMLDivElement>(tab);
    const programHeading = useRef<HTMLHeadingElement>(null);
    const [editor, setEditor] = useState<{ kind: ReferenceKind; record?: Partial<Row> } | null>(null);
    const [generatingSchedule, setGeneratingSchedule] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [creating, setCreating] = useState<{ clone?: Version } | null>(null);
    const [decision, setDecision] = useState<'validate' | 'reopen' | 'publish' | 'archive' | null>(null);
    const [search, setSearch] = useState(context.filters.q ?? '');
    const [studentSearch, setStudentSearch] = useState(context.filters.student_q ?? '');
    const selected = context.selectedVersion;
    const selectedProgram = context.selectedProgram;
    const faculty = context.facultyPack.find((entry) => entry.versions.some((version) => version.program_id === context.selectedProgram?.id));
    const versionPeriod = selected?.academic_year_id
        ? context.years.find((year) => year.id === selected.academic_year_id)?.title
        : context.cohorts.find((cohort) => cohort.id === selected?.admission_cohort_id)?.name;

    const navigate = (values: Record<string, string | number | null>, onSuccess?: () => void) =>
        router.get(
            route('dashboard.admin.academic-structure.index'),
            { ...context.filters, ...values },
            { preserveScroll: true, preserveState: true, onSuccess },
        );
    const open = (kind: ReferenceKind, record?: Partial<Row>) => setEditor({ kind, record });
    const references = (kind: keyof typeof referenceHeadings, rows: Row[], description?: string, empty = 'Aucun référentiel configuré.') => (
        <section className={description ? 'as-unit' : 'as-panel'}>
            <div className="as-panel-title">
                {description ? <h3>{referenceHeadings[kind]}</h3> : <h2>{referenceHeadings[kind]}</h2>}
                {context.abilities.manage && (
                    <button className="admin-secondary" onClick={() => open(kind)}>
                        <Plus size={15} />
                        Ajouter
                    </button>
                )}
            </div>
            {description && <p className="as-note">{description}</p>}
            {!rows.length ? (
                <p className="as-empty">{empty}</p>
            ) : (
                <div className="as-scroll">
                    <table className="as-table">
                        <thead>
                            <tr>
                                <th>Code</th>
                                <th>Nom</th>
                                <th>Statut</th>
                                {context.abilities.manage && <th>Action</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row) => {
                                const year = context.years.find((entry) => entry.id === row.academic_year_id);
                                const level = context.levels.find((entry) => entry.id === row.level_id);
                                const details = [level?.title, year?.title].filter(Boolean).join(' · ');

                                return (
                                    <tr key={row.id}>
                                        <td>{row.code}</td>
                                        <td>
                                            {row.name}
                                            {details && <small>{details}</small>}
                                        </td>
                                        <td>
                                            <span className="as-badge">{row.is_active ? 'Actif' : 'Inactif'}</span>
                                        </td>
                                        {context.abilities.manage && (
                                            <td>
                                                <div className="as-actions">
                                                    <button onClick={() => open(kind, row)}>Modifier</button>
                                                    {kind === 'promotion' && (
                                                        <button onClick={() => open('group-promotion', row)}>Associer un groupe</button>
                                                    )}
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
    const institution = context.institution;
    const site = institution?.site;
    return (
        <Dashboard>
            <Head title={tab === 'institution' ? 'Établissement' : 'Structure universitaire et maquettes'} />
            <div className={`usk-admin-apps as-page ${tab === 'institution' ? 'as-establishment' : ''}`}>
                {(tab !== 'curriculum' || !context.selectedProgram) && (
                    <PageHeading
                        title={tab === 'institution' ? 'Établissement' : tab === 'curriculum' ? 'Maquettes pédagogiques' : 'Structure et cursus'}
                        description={
                            tab === 'institution'
                                ? 'Retrouvez les informations de l’université et accédez aux fiches des facultés.'
                                : tab === 'curriculum'
                                  ? 'Générez les brouillons, vérifiez les matières et l’horaire, puis validez chaque niveau.'
                                  : 'Des programmes configurables et des maquettes dont l’historique est préservé.'
                        }
                        action={
                            tab === 'curriculum' &&
                            context.abilities.curriculum &&
                            institution &&
                            context.years.length > 0 && (
                                <button className="admin-primary" type="button" onClick={() => setGenerating(true)}>
                                    <Plus size={16} />
                                    Générer les brouillons de l’année
                                </button>
                            )
                        }
                    />
                )}
                {context.success && tab !== 'institution' && (
                    <p role="status" className="as-success">
                        {context.success}
                    </p>
                )}
                {tab === 'programs' && (
                    <nav className="as-tabs" aria-label="Référentiel universitaire">
                        {(
                            [
                                { id: 'institution', label: 'Établissement', icon: Building2 },
                                { id: 'programs', label: 'Programmes', icon: Layers3 },
                                { id: 'curriculum', label: 'Maquettes', icon: BookOpen },
                            ] as const
                        ).map(({ id, label, icon: Icon }) => (
                            <button key={id} aria-current={id === 'programs' ? 'page' : undefined} onClick={() => setTab(id)}>
                                <Icon size={17} />
                                {label}
                            </button>
                        ))}
                    </nav>
                )}
                {!context.institution && tab !== 'institution' && (
                    <div className="as-note">
                        L’identité institutionnelle reste à confirmer. Aucun ancien dossier ne sera rattaché automatiquement.
                        {context.abilities.manage && (
                            <button className="admin-secondary" onClick={() => open('university')}>
                                Configurer l’université
                            </button>
                        )}
                    </div>
                )}
                {tab === 'institution' && (
                    <div ref={tabPanel} className="as-stack" data-dashboard-panel="tab">
                        <section className="as-panel as-establishment-panel" aria-labelledby="as-identity">
                            <div className="as-panel-title">
                                <div>
                                    <p className="as-establishment-eyebrow">
                                        <Building2 size={16} aria-hidden="true" /> IDENTITÉ OFFICIELLE
                                    </p>
                                    <h2 id="as-identity">{institution?.name ?? 'Identité à configurer'}</h2>
                                </div>
                                {context.abilities.manage && (
                                    <button type="button" className="admin-primary" onClick={() => open('university', institution ?? undefined)}>
                                        {institution ? 'Modifier les informations' : 'Configurer l’établissement'}
                                    </button>
                                )}
                            </div>
                            {institution ? (
                                <dl className="as-establishment-facts">
                                    <div>
                                        <dt>Sigle</dt>
                                        <dd>{institution.acronym || 'Non renseigné'}</dd>
                                    </div>
                                    <div>
                                        <dt>Code institutionnel</dt>
                                        <dd>{institution.code}</dd>
                                    </div>
                                    <div>
                                        <dt>Statut</dt>
                                        <dd>{institution.is_active ? 'Actif' : 'Inactif'}</dd>
                                    </div>
                                    <div>
                                        <dt>Site associé</dt>
                                        <dd>{site?.site_name ?? 'Aucun site associé'}</dd>
                                    </div>
                                    <div>
                                        <dt>Adresse</dt>
                                        <dd className="whitespace-pre-line">{site?.address || 'Non renseignée'}</dd>
                                    </div>
                                    <div>
                                        <dt>Téléphone</dt>
                                        <dd>{site?.contact_phone || 'Non renseigné'}</dd>
                                    </div>
                                    <div>
                                        <dt>Adresse e-mail</dt>
                                        <dd>{site?.contact_email || 'Non renseignée'}</dd>
                                    </div>
                                </dl>
                            ) : (
                                <p className="as-note">Renseignez le nom officiel, le sigle et le code de l’université.</p>
                            )}
                        </section>
                        <section className="as-panel as-establishment-panel" aria-labelledby="as-faculty-directory">
                            <h2 id="as-faculty-directory">Facultés</h2>
                            {context.faculties.length ? (
                                <ul>
                                    {context.faculties.map((faculty) => (
                                        <li key={faculty.id}>
                                            <Link
                                                className="as-reference-row as-faculty-detail-link"
                                                href={route('dashboard.admin.faculties.show', faculty.id)}
                                            >
                                                {faculty.name} <ArrowUpRight size={16} aria-hidden="true" />
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="as-note">Aucune faculté enregistrée.</p>
                            )}
                        </section>
                    </div>
                )}
                {tab === 'programs' && (
                    <div ref={tabPanel} className="as-stack">
                        <section className="as-panel">
                            <div className="as-panel-title">
                                <h2>Programmes existants et niveaux</h2>
                                {context.abilities.manage && context.institution && (
                                    <button className="admin-primary" onClick={() => open('program')}>
                                        <Plus size={16} />
                                        Nouveau programme
                                    </button>
                                )}
                            </div>
                            <p className="as-note">
                                Sélectionnez un programme pour consulter son cycle, ses niveaux, ses cohortes et ses promotions.
                            </p>
                            <form
                                className="as-toolbar"
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    navigate({ q: search, programs_page: 1 });
                                }}
                            >
                                <label>
                                    Rechercher un programme
                                    <input
                                        className="as-input"
                                        value={search}
                                        onChange={(event) => setSearch(event.target.value)}
                                        placeholder="Nom ou code"
                                    />
                                </label>
                                <button className="admin-secondary">Rechercher</button>
                            </form>
                            <div className="as-scroll" data-dashboard-panel="tab q programs_page">
                                <table className="as-table">
                                    <thead>
                                        <tr>
                                            <th>Programme</th>
                                            <th>Faculté / cycle</th>
                                            <th>Niveaux existants</th>
                                            <th>Statut</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {context.programs.data.map((program) => (
                                            <tr key={program.id}>
                                                <td>
                                                    <strong>{program.name}</strong>
                                                    <small>
                                                        {program.code} · {program.versions_count ?? 0} version(s)
                                                    </small>
                                                </td>
                                                <td>
                                                    {program.faculty.name}
                                                    <small>{program.cycle.name}</small>
                                                </td>
                                                <td>{program.levels.map((level) => level.code).join(' · ')}</td>
                                                <td>{program.is_active ? 'Actif' : 'Inactif'}</td>
                                                <td>
                                                    <div className="as-actions">
                                                        <button
                                                            type="button"
                                                            aria-current={selectedProgram?.id === program.id ? 'true' : undefined}
                                                            onClick={() =>
                                                                navigate(
                                                                    { tab: 'programs', program: program.id, version: null, compare: null },
                                                                    () => {
                                                                        programHeading.current?.focus({ preventScroll: true });
                                                                        programHeading.current?.scrollIntoView({ block: 'start' });
                                                                    },
                                                                )
                                                            }
                                                        >
                                                            {selectedProgram?.id === program.id ? 'Sélectionné' : 'Sélectionner'}
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                navigate({ program: program.id, version: null, compare: null });
                                                                setTab('curriculum');
                                                            }}
                                                        >
                                                            Maquettes
                                                        </button>
                                                        {context.abilities.manage && (
                                                            <button onClick={() => open('program', program)}>Modifier</button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {!context.programs.data.length && (
                                    <p className="as-empty">
                                        Aucun programme pour cette sélection. Commencez par rattacher les facultés et configurer un cycle.
                                    </p>
                                )}
                            </div>
                            <Pagination value={context.programs} />
                        </section>
                        {selectedProgram && (
                            <section className="as-panel as-stack" aria-labelledby="selected-program-heading" data-dashboard-panel="tab program">
                                <div>
                                    <h2 id="selected-program-heading" ref={programHeading} tabIndex={-1} className="scroll-mt-24">
                                        {selectedProgram.name}
                                    </h2>
                                    <p className="as-note">
                                        {selectedProgram.faculty.name} · {selectedProgram.code}
                                    </p>
                                </div>
                                <div className="as-columns">
                                    <section className="as-unit">
                                        <h3>Cycle académique</h3>
                                        <p className="as-note">Le cycle définit les règles communes de progression du programme.</p>
                                        <p>
                                            <strong>{selectedProgram.cycle.name}</strong>
                                        </p>
                                    </section>
                                    <section className="as-unit">
                                        <h3>Niveaux du programme</h3>
                                        <p className="as-note">Les niveaux sont les étapes d’études rattachées à ce programme.</p>
                                        {selectedProgram.levels.length ? (
                                            <ul>
                                                {selectedProgram.levels.map((level) => (
                                                    <li key={level.id} className="as-reference-row">
                                                        <strong>{level.title}</strong>
                                                        <span className="as-badge">{level.code}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="as-empty">Aucun niveau rattaché à ce programme.</p>
                                        )}
                                    </section>
                                    {references(
                                        'cohort',
                                        context.cohorts,
                                        'Une cohorte identifie la rentrée des étudiants dans ce programme, par année d’admission.',
                                        'Aucune cohorte d’admission pour ce programme.',
                                    )}
                                    {references(
                                        'promotion',
                                        context.promotions,
                                        'Une promotion correspond à un niveau de ce programme pour une année académique. Des groupes pédagogiques peuvent y être associés.',
                                        'Aucune promotion annuelle pour ce programme.',
                                    )}
                                </div>
                            </section>
                        )}
                        {references('cycle', context.cycles)}
                        <details className="as-panel as-establishment-panel">
                            <summary className="as-establishment-summary">Années académiques</summary>
                            <p className="as-note">Rattachez les années à l’établissement pour identifier leur contexte institutionnel.</p>
                            {context.years.length ? (
                                <ul>
                                    {context.years.map((year) => (
                                        <li className="as-reference-row" key={year.id}>
                                            <span>{year.title}</span>
                                            {year.university_id ? (
                                                <span className="as-badge as-established">Rattachée</span>
                                            ) : context.abilities.manage && institution ? (
                                                <button
                                                    type="button"
                                                    aria-label={`Rattacher ${year.title}`}
                                                    onClick={() => open('year-context', { id: year.id, name: year.title })}
                                                >
                                                    Rattacher
                                                </button>
                                            ) : (
                                                <span className="as-badge">Non rattachée</span>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="as-note">Aucune année académique enregistrée.</p>
                            )}
                            <Link className="as-establishment-link" href={route('dashboard.admin.academic-years.index')}>
                                Gérer les années académiques <ArrowUpRight size={15} aria-hidden="true" />
                            </Link>
                        </details>
                    </div>
                )}
                {tab === 'curriculum' && (
                    <div ref={tabPanel} className="as-stack">
                        {context.annualBatch && (
                            <details className="as-panel as-disclosure">
                                <summary>Bilan de génération · {context.annualBatch.year}</summary>
                                <p className="as-note" role="status">
                                    {context.annualBatch.rows.filter((row) => row.status === 'created').length} brouillon(s) créé(s)
                                </p>
                                {context.annualBatch.rows.map((row) => (
                                    <div className="as-reference-row" key={row.program_id ?? row.faculty}>
                                        <div>
                                            <strong>{row.faculty}</strong>
                                            {row.program && <small>{row.program}</small>}
                                            {row.status !== 'skipped' && row.schedule && <ScheduleReport result={row.schedule} />}
                                        </div>
                                        {row.status === 'skipped' ? (
                                            <span>{row.message}</span>
                                        ) : (
                                            <Link
                                                className="as-establishment-link"
                                                href={route('dashboard.admin.academic-structure.index', {
                                                    tab: 'curriculum',
                                                    program: row.program_id,
                                                    version: row.version_id,
                                                })}
                                            >
                                                {row.status === 'created' ? 'Ouvrir le brouillon' : 'Voir la maquette existante'}
                                                <ArrowUpRight size={15} aria-hidden="true" />
                                            </Link>
                                        )}
                                    </div>
                                ))}
                                {!context.annualBatch.rows.length && <p className="as-note">Aucune faculté disponible.</p>}
                            </details>
                        )}

                        {!context.selectedProgram ? (
                            <section className="as-panel">
                                <div className="as-panel-title">
                                    <h2>Maquettes par faculté</h2>
                                    <label className="admin-field">
                                        Année académique
                                        <select
                                            value={context.packYear ?? ''}
                                            onChange={(event) => navigate({ tab: 'curriculum', year: event.target.value })}
                                        >
                                            {!context.years.length && <option value="">Aucune année</option>}
                                            {context.years.map((year) => (
                                                <option key={year.id} value={year.id}>
                                                    {year.title}
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                </div>
                                <div className="as-curriculum-directory" data-dashboard-panel="tab year">
                                    {context.facultyPack.map((faculty) => {
                                        const first = faculty.versions[0];
                                        const status =
                                            faculty.total > 0 && faculty.approved === faculty.total
                                                ? 'Faculté validée'
                                                : first
                                                  ? `${faculty.approved} / ${faculty.total} niveaux validés`
                                                  : 'À générer';
                                        const label = (
                                            <>
                                                <span className="as-curriculum-icon">
                                                    <Building2 size={20} aria-hidden="true" />
                                                </span>
                                                <strong>{faculty.name}</strong>
                                                <span
                                                    className={`as-badge ${faculty.total > 0 && faculty.approved === faculty.total ? 'as-approved' : ''}`}
                                                >
                                                    {status}
                                                </span>
                                            </>
                                        );
                                        return first ? (
                                            <Link
                                                className="as-curriculum-card"
                                                key={faculty.id}
                                                href={route('dashboard.admin.academic-structure.index', { tab: 'curriculum', version: first.id })}
                                            >
                                                {label}
                                                <ArrowUpRight size={16} aria-hidden="true" />
                                            </Link>
                                        ) : (
                                            <div className="as-curriculum-card as-curriculum-card-pending" key={faculty.id}>
                                                {label}
                                            </div>
                                        );
                                    })}
                                </div>
                                {!context.facultyPack.length && <p className="as-note">Aucune faculté disponible pour cette année.</p>}
                            </section>
                        ) : (
                            <>
                                <section className="as-faculty-workspace" aria-label="Maquette de la faculté">
                                    <header className="as-faculty-hero">
                                        <div>
                                            <Link
                                                className="as-level-back"
                                                href={route('dashboard.admin.academic-structure.index', {
                                                    tab: 'curriculum',
                                                    year: context.packYear,
                                                })}
                                            >
                                                <ArrowLeft size={15} aria-hidden="true" /> Facultés
                                            </Link>
                                            <h2>{faculty?.name ?? context.selectedProgram.name}</h2>
                                            {selected && (
                                                <div className="as-faculty-meta">
                                                    {versionPeriod && <span>{versionPeriod}</span>}
                                                    <span className="as-badge">{statusLabels[selected.status]}</span>
                                                </div>
                                            )}
                                        </div>
                                        {context.abilities.curriculum && (
                                            <div className="as-actions">
                                                {!selected && (
                                                    <button type="button" className="admin-primary" onClick={() => setCreating({})}>
                                                        <Plus size={16} /> Nouvelle maquette
                                                    </button>
                                                )}
                                                {selected?.status === 'draft' && (
                                                    <button type="button" className="admin-secondary" onClick={() => setGeneratingSchedule(true)}>
                                                        Compléter l’horaire
                                                    </button>
                                                )}
                                                {selected?.status === 'validated' && (
                                                    <button type="button" className="admin-primary" onClick={() => setDecision('publish')}>
                                                        Publier la maquette
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </header>
                                    <details
                                        className="as-disclosure as-faculty-versions"
                                        open={!selected || (context.versions?.current_page ?? 1) > 1}
                                    >
                                        <summary>{selected ? 'Versions et actions' : 'Versions du programme'}</summary>
                                        <div className="as-version-list" data-dashboard-panel="tab program versions_page">
                                            {context.versions?.data.map((version) => (
                                                <button
                                                    key={version.id}
                                                    className={selected?.id === version.id ? 'as-version selected' : 'as-version'}
                                                    onClick={() => navigate({ version: version.id, compare: null, level: null })}
                                                >
                                                    <strong>{version.name}</strong>
                                                    <span className="as-badge">{statusLabels[version.status]}</span>
                                                    <small>
                                                        {version.academic_year_id
                                                            ? context.years.find((year) => year.id === version.academic_year_id)?.title
                                                            : context.cohorts.find((cohort) => cohort.id === version.admission_cohort_id)?.name}
                                                    </small>
                                                </button>
                                            ))}
                                        </div>
                                        {!context.versions?.data.length && <p className="as-empty">Aucune maquette pour ce programme.</p>}
                                        <Pagination value={context.versions} />
                                        {selected && context.abilities.curriculum && (
                                            <div className="as-actions as-version-actions">
                                                <button type="button" className="admin-secondary" onClick={() => setCreating({})}>
                                                    Nouvelle maquette
                                                </button>
                                                <button type="button" className="admin-secondary" onClick={() => setCreating({ clone: selected })}>
                                                    Dupliquer la version
                                                </button>
                                                {selected.status === 'validated' && (
                                                    <button type="button" className="admin-secondary" onClick={() => setDecision('reopen')}>
                                                        Reprendre le brouillon
                                                    </button>
                                                )}
                                                {selected.status !== 'archived' && (
                                                    <button type="button" className="admin-secondary" onClick={() => setDecision('archive')}>
                                                        Archiver
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </details>
                                    {selected && (
                                        <div className="as-faculty-levels" data-dashboard-panel="tab program version level">
                                            {context.scheduleGeneration && <ScheduleReport result={context.scheduleGeneration} />}
                                            <CurriculumEditor
                                                key={selected.id}
                                                version={selected}
                                                context={context}
                                                onValidate={() => setDecision('validate')}
                                            />
                                        </div>
                                    )}
                                </section>
                                {selected && (
                                    <>
                                        <details className="as-panel as-disclosure" open={context.comparison !== null}>
                                            <summary>Comparer les versions</summary>
                                            <label className="admin-field">
                                                Autre version du même programme
                                                <select
                                                    value={context.filters.compare ?? ''}
                                                    onChange={(event) => navigate({ compare: event.target.value || null })}
                                                >
                                                    <option value="">Choisir une autre version</option>
                                                    {context.versions?.data
                                                        .filter((version) => version.id !== selected.id)
                                                        .map((version) => (
                                                            <option key={version.id} value={version.id}>
                                                                {version.code} · {version.name}
                                                            </option>
                                                        ))}
                                                </select>
                                            </label>
                                            {context.comparison !== null &&
                                                (context.comparison.length ? (
                                                    <div className="as-scroll" data-dashboard-panel="compare">
                                                        <table className="as-table">
                                                            <thead>
                                                                <tr>
                                                                    <th>Changement</th>
                                                                    <th>Matière / unité</th>
                                                                    <th>Avant : crédits / coefficient / heures</th>
                                                                    <th>Après : crédits / coefficient / heures</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {context.comparison.map((row) => (
                                                                    <tr key={row.key}>
                                                                        <td>{!row.before ? 'Ajout' : !row.after ? 'Retrait' : 'Modification'}</td>
                                                                        <td>
                                                                            {row.after?.name ?? row.before?.name}
                                                                            <small>
                                                                                {row.after?.unit ?? row.before?.unit} ·{' '}
                                                                                {row.after?.period ?? row.before?.period}
                                                                            </small>
                                                                        </td>
                                                                        <td>
                                                                            {row.before
                                                                                ? `${row.before.credits ?? '—'} / ${row.before.coefficient ?? '—'} / ${Number(row.before.cmi_hours ?? 0) + Number(row.before.td_hours ?? 0) + Number(row.before.tp_hours ?? 0)}`
                                                                                : '—'}
                                                                        </td>
                                                                        <td>
                                                                            {row.after
                                                                                ? `${row.after.credits ?? '—'} / ${row.after.coefficient ?? '—'} / ${Number(row.after.cmi_hours ?? 0) + Number(row.after.td_hours ?? 0) + Number(row.after.tp_hours ?? 0)}`
                                                                                : '—'}
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                ) : (
                                                    <p className="as-note" data-dashboard-panel="compare">
                                                        Aucune différence dans le contenu académique comparé.
                                                    </p>
                                                ))}
                                        </details>
                                        {context.abilities.manage && (
                                            <details className="as-panel as-disclosure" open={(context.affected?.current_page ?? 1) > 1}>
                                                <summary>Étudiants rattachés ({context.affected?.total ?? 0})</summary>
                                                <StudentRows rows={context.affected?.data ?? []} queryKeys="version student_q students_page" />
                                                <Pagination value={context.affected} />
                                                {selected.published_at && ['published', 'replaced', 'archived'].includes(selected.status) && (
                                                    <Binding key={selected.id} context={context} version={selected} />
                                                )}
                                            </details>
                                        )}
                                        <details className="as-panel as-disclosure">
                                            <summary>Historique des décisions</summary>
                                            {context.audit.map((event) => (
                                                <div className="as-reference-row" key={event.id}>
                                                    <span>
                                                        <strong>{event.action}</strong>
                                                        <small>{event.reason}</small>
                                                    </span>
                                                    <time dateTime={event.created_at}>
                                                        {new Date(event.created_at).toLocaleString('fr-FR', { timeZone: 'Africa/Kinshasa' })}
                                                    </time>
                                                </div>
                                            ))}
                                        </details>
                                    </>
                                )}
                            </>
                        )}
                    </div>
                )}
                {context.abilities.manage && (tab === 'programs' || tab === 'curriculum') && (
                    <details
                        className="as-panel as-disclosure"
                        open={tab === 'programs' || Boolean(context.filters.student_q) || (context.unmapped?.current_page ?? 1) > 1}
                    >
                        <summary>Inscriptions sans maquette ({context.unmapped?.total ?? 0})</summary>
                        <p className="as-note">
                            Ces dossiers sont conservés en l’état. Aucune version récente ne leur est attribuée automatiquement. Sélectionnez une
                            maquette compatible pour un rattachement motivé.
                        </p>
                        <form
                            className="as-toolbar"
                            onSubmit={(event) => {
                                event.preventDefault();
                                navigate({ student_q: studentSearch, unmapped_page: 1 });
                            }}
                        >
                            <label>
                                Rechercher une inscription
                                <input
                                    className="as-input"
                                    value={studentSearch}
                                    onChange={(event) => setStudentSearch(event.target.value)}
                                    placeholder="Nom ou matricule"
                                />
                            </label>
                            <button className="admin-secondary">Rechercher</button>
                        </form>
                        <StudentRows rows={context.unmapped?.data ?? []} queryKeys="student_q unmapped_page" />
                        <Pagination value={context.unmapped} />
                    </details>
                )}
                {editor && (
                    <ReferenceEditor
                        key={`${editor.kind}:${editor.record?.id ?? 'new'}`}
                        {...editor}
                        context={context}
                        onClose={() => setEditor(null)}
                    />
                )}
                {selected && generatingSchedule && <GenerateSchedule version={selected} onClose={() => setGeneratingSchedule(false)} />}
                {generating && <AnnualDrafts years={context.years} onClose={() => setGenerating(false)} />}
                {creating && (
                    <NewVersion
                        context={context}
                        clone={creating.clone}
                        onClose={() => {
                            setCreating(null);
                            setTab('curriculum');
                        }}
                    />
                )}
                {selected && decision && <Transition context={context} version={selected} action={decision} onClose={() => setDecision(null)} />}
            </div>
        </Dashboard>
    );
}
