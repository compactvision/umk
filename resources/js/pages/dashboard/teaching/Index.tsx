import Pagination from '@/components/admin/Pagination';
import Dashboard from '@/components/layouts/Dashboard/Dashboard';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import '../../../../css/dashboard/student-academic.css';
import '../../../../css/student-portal.css';
import AcademicForm, { type Field, type FormSpec } from '../studentAcademic/AcademicForm';
import { Activity, Context } from './Details';
import { dateTime, modes, roles, states, type Offering, type Page, type Person, type Resource, type Session, type Student } from './types';

type Ref = { id: number; name: string };
type Props = {
    filters: { year?: number; program?: number; version?: number; q?: string; status?: string; student?: string; offering?: number };
    offerings: Page<Offering>;
    summary: { total: number; published: number; archived: number };
    selected: Offering | null;
    canPublish: boolean;
    canRegister: boolean;
    students: Page<Student> | null;
    candidates: Student[];
    sessions: Page<Session> | null;
    resources: Page<Resource> | null;
    assignments: Page<{ id: number; professor: Person; role: keyof typeof roles; starts_at: string | null; ends_at: string | null }> | null;
    registrations: Page<{ id: number; student: Student; mode: keyof typeof modes; registered_at: string; withdrawn_at: string | null }> | null;
    professors: Person[];
    years: { id: number; title: string }[];
    programs: Ref[];
    versions: (Ref & { code: string; status: string })[];
    items: (Ref & { is_optional: boolean; unit: { code: string; level_id: number; level_title: string; period_code: string } })[];
    groups: { id: number; level_id: number; intake: { name: string } | null }[];
    semesters: { id: number; number: number; start_date: string; end_date: string }[];
    units: (Ref & { code: string; version: { code: string } })[];
};
const reason: Field = { name: 'reason', label: 'Justification de la décision', type: 'textarea', required: true };
const options = (labels: Record<string, string>) => Object.entries(labels).map(([value, label]) => ({ value, label }));
const person = (row: Person) => `${row.first_name} ${row.last_name}`;
export default function Teaching(props: Props) {
    const [modal, setModal] = useState<FormSpec | null>(null);
    const [filters, setFilters] = useState(props.filters);
    const { flash } = usePage<{ flash?: { success?: string } }>().props;
    const base = route('dashboard.admin.teaching.index');
    const offer = props.selected;
    const edit = props.canPublish && offer?.status !== 'archived';
    const register = props.canRegister && offer?.item_id && offer.status === 'published';
    const show = (
        title: string,
        action: string,
        fields: Field[],
        values: FormSpec['values'] = {},
        description = 'Vérifiez le contexte pédagogique et renseignez le motif de cette opération.',
    ) => setModal({ title, action, fields, values, description });
    const team = (title: string, action: 'assign' | 'end', fixed?: { professor_id: number; role: keyof typeof roles }) => {
        if (!offer) return;
        show(
            title,
            route('dashboard.admin.teaching.team', offer.id),
            fixed
                ? [reason]
                : [
                      {
                          name: 'professor_id',
                          label: 'Enseignant actif',
                          type: 'select',
                          required: true,
                          options: props.professors.map((p) => ({ value: p.id, label: person(p) })),
                      },
                      { name: 'role', label: 'Rôle', type: 'select', required: true, options: options(roles) },
                      reason,
                  ],
            { action, ...fixed },
        );
    };
    return (
        <Dashboard hideAppsNavigation>
            <Head title="Gestion des enseignements" />
            {modal && <AcademicForm spec={modal} onClose={() => setModal(null)} onSuccess={() => setModal(null)} />}
            <main className="student-portal academic-administration">
                <header className="directory-heading">
                    <div>
                        <h1>Enseignements</h1>
                        <p>Maquettes, offres, équipes et inscriptions pédagogiques.</p>
                    </div>
                    <div className="student-dossier-links">
                        <Link href="/dashboard/admin/course-catalog">Catalogue des matières</Link>
                        <Link href="/dashboard/admin/academic-structure?tab=curriculum">UE, EC et maquettes</Link>
                        <Link href="/dashboard/admin/professors">Enseignants</Link>
                        {props.canPublish && (
                            <Link href={route('dashboard.admin.assessments.index', offer ? { offering: offer.id } : {})}>
                                Évaluations et corrections
                            </Link>
                        )}

                        {props.canPublish && (
                            <Link href={route('dashboard.admin.learning.index', offer ? { offering: offer.id } : {})}>Ressources pédagogiques</Link>
                        )}
                    </div>
                </header>
                {flash?.success && (
                    <p role="status" className="portal-alert">
                        {flash.success}
                    </p>
                )}
                <form
                    className="portal-form"
                    onSubmit={(e) => {
                        e.preventDefault();
                        router.get(base, filters);
                    }}
                >
                    <label>
                        Matière
                        <input
                            value={filters.q ?? ''}
                            onChange={(e) => setFilters({ ...filters, q: e.target.value })}
                            placeholder="Intitulé ou code"
                        />
                    </label>
                    <label>
                        Année
                        <select
                            value={filters.year ?? ''}
                            onChange={(e) => setFilters({ ...filters, year: Number(e.target.value) || undefined, version: undefined })}
                        >
                            <option value="">Toutes</option>
                            {props.years.map((year) => (
                                <option key={year.id} value={year.id}>
                                    {year.title}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label>
                        Programme
                        <select
                            value={filters.program ?? ''}
                            onChange={(e) => setFilters({ ...filters, program: Number(e.target.value) || undefined, version: undefined })}
                        >
                            <option value="">Tous</option>
                            {props.programs.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.name}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label>
                        Version
                        <select
                            value={filters.version ?? ''}
                            onChange={(e) => setFilters({ ...filters, version: Number(e.target.value) || undefined })}
                        >
                            <option value="">Toutes</option>
                            {filters.program === props.filters.program &&
                                filters.year === props.filters.year &&
                                props.versions.map((v) => (
                                    <option key={v.id} value={v.id}>
                                        {v.code} · {v.name} · {v.status}
                                    </option>
                                ))}
                        </select>
                    </label>
                    <label>
                        État
                        <select value={filters.status ?? ''} onChange={(e) => setFilters({ ...filters, status: e.target.value || undefined })}>
                            <option value="">Tous</option>
                            {Object.entries(states).map(([key, label]) => (
                                <option key={key} value={key}>
                                    {label}
                                </option>
                            ))}
                        </select>
                    </label>
                    <button className="portal-primary">Appliquer les filtres</button>
                    <Link href={base}>Réinitialiser</Link>
                </form>
                <section className="portal-panel" id="reports">
                    <h2>Indicateurs du périmètre</h2>
                    <p>
                        {props.summary.total} offres · {props.summary.published} publiées · {props.summary.archived} archivées.
                    </p>
                </section>
                <section className="portal-panel">
                    <h2>Offres d’enseignement</h2>
                    {props.canPublish &&
                        (props.filters.year && props.items.length ? (
                            <button
                                className="admin-primary"
                                onClick={() =>
                                    show(
                                        'Préparer une offre annuelle',
                                        route('dashboard.admin.teaching.store'),
                                        [
                                            {
                                                name: 'curriculum_item_id',
                                                label: 'EC de la version sélectionnée',
                                                type: 'select',
                                                required: true,
                                                clears: 'class_id',
                                                options: props.items.map((item) => ({
                                                    value: item.id,
                                                    label: `${item.unit.level_title} · ${item.unit.period_code} · ${item.unit.code} · ${item.name}`,
                                                })),
                                            },
                                            {
                                                name: 'class_id',
                                                label: 'Groupe de la promotion (vide : public commun)',
                                                type: 'select',
                                                optionsFor: (values) =>
                                                    props.groups
                                                        .filter(
                                                            (group) =>
                                                                group.level_id ===
                                                                props.items.find((item) => item.id === Number(values.curriculum_item_id))?.unit
                                                                    .level_id,
                                                        )
                                                        .map((group) => ({
                                                            value: group.id,
                                                            label: `${group.intake?.name ?? 'Groupe'} · #${group.id}`,
                                                        })),
                                            },
                                            {
                                                name: 'academic_semester_id',
                                                label: 'Semestre institutionnel (facultatif)',
                                                type: 'select',
                                                options: props.semesters.map((s) => ({
                                                    value: s.id,
                                                    label: `S${s.number} · ${s.start_date} → ${s.end_date}`,
                                                })),
                                            },
                                            { name: 'starts_on', label: 'Début hors calendrier semestriel', type: 'date' },
                                            {
                                                name: 'ends_on',
                                                label: 'Fin hors calendrier semestriel',
                                                type: 'date',
                                                help: 'Sans dates ni semestre, la période couvre l’année.',
                                            },
                                            {
                                                name: 'required_unit_id',
                                                label: 'UE officielle préalable (facultatif)',
                                                type: 'select',
                                                options: props.units.map((u) => ({
                                                    value: u.id,
                                                    label: `${u.version.code} · ${u.code} · ${u.name}`,
                                                })),
                                            },
                                            reason,
                                        ],
                                        { academic_year_id: props.filters.year ?? null },
                                    )
                                }
                            >
                                Préparer une offre
                            </button>
                        ) : (
                            <p>Filtrez d’abord par année et programme, puis choisissez une maquette publiée pour préparer une offre.</p>
                        ))}
                    {props.offerings.data.length ? (
                        <div className="academic-table-scroll">
                            <table className="academic-table">
                                <thead>
                                    <tr>
                                        <th>Matière</th>
                                        <th>Contexte</th>
                                        <th>État</th>
                                        <th>Activités</th>
                                    </tr>
                                </thead>
                                <tbody data-dashboard-panel="page year program version q status">
                                    {props.offerings.data.map((row) => (
                                        <tr key={row.id}>
                                            <td>
                                                <Link href={base} data={{ ...props.filters, offering: row.id }}>
                                                    {row.title}
                                                </Link>
                                                <small>{row.code}</small>
                                            </td>
                                            <td>
                                                {row.year} · {row.program ?? row.level} · {row.group ?? 'Public commun'}
                                            </td>
                                            <td>{states[row.status]}</td>
                                            <td>
                                                {row.sessions_count ?? 0} séances · {row.resources_count ?? 0} ressources
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p data-dashboard-panel="page year program version q status">Aucune offre ne correspond aux filtres.</p>
                    )}
                    <Pagination value={props.offerings} />
                </section>
                {offer && (
                    <>
                        <section className="portal-panel">
                            <Context offer={offer} />
                            <div className="student-dossier-links">
                                {edit && offer.status === 'draft' && (
                                    <button
                                        className="admin-primary"
                                        disabled={!offer.teacher}
                                        onClick={() =>
                                            show('Publier l’offre', route('dashboard.admin.teaching.status', offer.id), [reason], {
                                                action: 'publish',
                                            })
                                        }
                                    >
                                        Publier après contrôle
                                    </button>
                                )}
                                {edit && (
                                    <button
                                        className="admin-secondary"
                                        onClick={() =>
                                            show(
                                                'Archiver et conserver les activités',
                                                route('dashboard.admin.teaching.status', offer.id),
                                                [reason],
                                                { action: 'archive' },
                                                'Les activités et inscriptions historiques seront conservées. L’offre ne recevra plus de nouvelles inscriptions.',
                                            )
                                        }
                                    >
                                        Archiver l’offre
                                    </button>
                                )}
                                {edit && (
                                    <button className="admin-secondary" onClick={() => team('Affecter ou remplacer un membre', 'assign')}>
                                        Affecter un membre
                                    </button>
                                )}
                                <Link href={`/dashboard/admin/schedule?academic_year_id=${offer.year_id}`}>Horaires de l’année</Link>
                                {props.canPublish && (
                                    <Link href="/dashboard/admin/student-academic?tab=teaching">Gestion des supports et travaux</Link>
                                )}
                            </div>
                        </section>
                        <section className="portal-panel">
                            <h3>Historique de l’équipe</h3>
                            {!props.assignments?.data.length && (
                                <p>Aucun changement d’équipe historisé. Les affectations historiques figurent dans le contexte ci-dessus.</p>
                            )}
                            {props.assignments?.data.map((a) => (
                                <p key={a.id}>
                                    {person(a.professor)} · {roles[a.role]} · {a.starts_at ? dateTime(a.starts_at) : 'Affectation initiale'}{' '}
                                    {a.ends_at ? `→ ${dateTime(a.ends_at)}` : '· en cours'}{' '}
                                    {edit && !a.ends_at && a.role !== 'lead' && (
                                        <button
                                            className="academic-link-button"
                                            onClick={() => team('Terminer cette affectation', 'end', { professor_id: a.professor.id, role: a.role })}
                                        >
                                            Terminer
                                        </button>
                                    )}
                                </p>
                            ))}
                            <Pagination value={props.assignments} />
                        </section>
                        <section className="portal-panel" id="registrations">
                            <h3>Inscriptions pédagogiques</h3>
                            {!offer.item_id && (
                                <p>Le public de cette offre historique est déterminé par le niveau, le groupe et les dérogations existantes.</p>
                            )}
                            {register && (
                                <>
                                    <form
                                        className="portal-form"
                                        onSubmit={(e) => {
                                            e.preventDefault();
                                            router.get(base, { ...props.filters, student: filters.student });
                                        }}
                                    >
                                        <label>
                                            Rechercher un inscrit annuel du public
                                            <input
                                                value={filters.student ?? ''}
                                                onChange={(e) => setFilters({ ...filters, student: e.target.value })}
                                                placeholder="Nom ou matricule"
                                            />
                                        </label>
                                        <button className="portal-secondary">Rechercher</button>
                                    </form>
                                    <div className="student-dossier-links">
                                        {!offer.optional && (
                                            <button
                                                className="admin-primary"
                                                onClick={() =>
                                                    show(
                                                        'Synchroniser les inscriptions obligatoires',
                                                        route('dashboard.admin.teaching.sync', offer.id),
                                                        [reason],
                                                        {},
                                                        'Les étudiants éligibles sont inscrits une seule fois. Les anciens rattachements hors public sont clôturés sans effacer leur historique.',
                                                    )
                                                }
                                            >
                                                Synchroniser le public obligatoire
                                            </button>
                                        )}
                                        <button
                                            className="admin-secondary"
                                            disabled={!props.candidates.length}
                                            onClick={() =>
                                                show('Inscription pédagogique motivée', route('dashboard.admin.teaching.register', offer.id), [
                                                    {
                                                        name: 'academic_enrollment_id',
                                                        label: 'Inscription annuelle éligible',
                                                        type: 'select',
                                                        required: true,
                                                        options: props.candidates.map((s) => ({
                                                            value: s.id,
                                                            label: `${s.name} · ${s.matricule ?? ''}`,
                                                        })),
                                                    },
                                                    {
                                                        name: 'mode',
                                                        label: 'Motif pédagogique',
                                                        type: 'select',
                                                        required: true,
                                                        options: options({
                                                            ...(offer.optional ? { elective: modes.elective } : { mandatory: modes.mandatory }),
                                                            repeat: modes.repeat,
                                                            derogation: modes.derogation,
                                                        }),
                                                    },
                                                    reason,
                                                ])
                                            }
                                        >
                                            Inscrire individuellement
                                        </button>
                                    </div>
                                </>
                            )}
                            {props.registrations?.data.map((r) => (
                                <p key={r.id}>
                                    {r.student.name} · {r.student.matricule} · {modes[r.mode]} · {dateTime(r.registered_at)}{' '}
                                    {r.withdrawn_at ? `· retirée le ${dateTime(r.withdrawn_at)}` : '· active'}{' '}
                                    {register && !r.withdrawn_at && (
                                        <button
                                            className="academic-link-button"
                                            onClick={() =>
                                                show('Retirer l’inscription pédagogique', route('dashboard.admin.teaching.withdraw', r.id), [reason])
                                            }
                                        >
                                            Retirer
                                        </button>
                                    )}
                                </p>
                            ))}
                            <Pagination value={props.registrations} />
                        </section>
                        <Activity students={props.students} sessions={props.sessions} resources={props.resources} />
                    </>
                )}
            </main>
        </Dashboard>
    );
}
