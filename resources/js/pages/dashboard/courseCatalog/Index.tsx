import AdminModal from '@/components/admin/AdminModal';
import PageHeading from '@/components/admin/PageHeading';
import Pagination from '@/components/admin/Pagination';
import Dashboard from '@/components/layouts/Dashboard/Dashboard';
import { professorName, type Professor, type Year } from '@/components/teaching/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { ArrowUpRight, BookOpen, Plus, Search } from 'lucide-react';
import { useState } from 'react';
import '../../../../css/dashboard/course-catalog.css';

type Faculty = { id: number; name: string };
type Level = { id: number; title: string; faculty_id: number; detail?: { credit_required: number | null } | null };
type Course = {
    id: number;
    title: string;
    code: string | null;
    credits: number;
    status?: 'active' | 'inactive' | 'archived';
    semester: number | null;
    faculty: string | null;
    level: Pick<Level, 'id' | 'title'> | null;
};
type Filters = { term: string; faculty: number | null; level: number | null; semester: string; status?: string };
type Props = {
    courses: { data: Course[]; total: number; from: number | null; to: number | null };
    faculties: Faculty[];
    levels: Level[];
    filters: Filters;
    canCreate: boolean;
    professors: Professor[];
    years: Year[];
    success: string | null;
};

function CatalogFilters({ faculties, levels, filters }: Pick<Props, 'faculties' | 'levels' | 'filters'>) {
    const [term, setTerm] = useState(filters.term);
    const [faculty, setFaculty] = useState(filters.faculty === null ? '' : String(filters.faculty));
    const [level, setLevel] = useState(filters.level === null ? '' : String(filters.level));
    const [semester, setSemester] = useState(filters.semester);
    const [status, setStatus] = useState(filters.status ?? '');
    const visibleLevels = levels.filter((item) => !faculty || String(item.faculty_id) === faculty);
    const hasFilters = Boolean(filters.term || filters.faculty || filters.level || filters.semester || filters.status);
    const index = route('dashboard.admin.course-catalog.index');

    return (
        <form
            className="course-catalog-filters"
            aria-label="Filtrer les cours"
            onSubmit={(event) => {
                event.preventDefault();
                router.get(index, {
                    q: term.trim() || undefined,
                    faculty: faculty || undefined,
                    level: level || undefined,
                    semester: semester || undefined,
                    status: status || undefined,
                });
            }}
        >
            <label>
                Nom ou code du cours
                <input
                    type="search"
                    value={term}
                    maxLength={100}
                    placeholder="Ex. Droit civil ou DR101"
                    onChange={(event) => setTerm(event.target.value)}
                />
            </label>
            <label>
                Faculté
                <select
                    value={faculty}
                    onChange={(event) => {
                        const nextFaculty = event.target.value;
                        setFaculty(nextFaculty);
                        if (nextFaculty && !levels.some((item) => String(item.id) === level && String(item.faculty_id) === nextFaculty)) setLevel('');
                    }}
                >
                    <option value="">Toutes les facultés</option>
                    {faculties.map((item) => (
                        <option key={item.id} value={item.id}>
                            {item.name}
                        </option>
                    ))}
                </select>
            </label>
            <label>
                Niveau
                <select value={level} onChange={(event) => setLevel(event.target.value)}>
                    <option value="">Tous les niveaux</option>
                    {visibleLevels.map((item) => (
                        <option key={item.id} value={item.id}>
                            {item.title}
                            {!faculty && ` · ${faculties.find((option) => option.id === item.faculty_id)?.name ?? ''}`}
                        </option>
                    ))}
                </select>
            </label>
            <label>
                Semestre
                <select value={semester} onChange={(event) => setSemester(event.target.value)}>
                    <option value="">Tous les semestres</option>
                    <option value="1">Semestre 1</option>
                    <option value="2">Semestre 2</option>
                    <option value="unassigned">Non renseigné</option>
                </select>
            </label>
            <label>
                Statut
                <select value={status} onChange={(event) => setStatus(event.target.value)}>
                    <option value="">Tous</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="archived">Archivée</option>
                </select>
            </label>
            <div className="course-catalog-actions">
                <button type="submit" className="admin-primary">
                    <Search size={16} aria-hidden="true" /> Appliquer
                </button>
                {hasFilters && (
                    <Link className="admin-secondary" href={index}>
                        Réinitialiser
                    </Link>
                )}
            </div>
        </form>
    );
}

const hours = { cmi_hours: 'CMI', td_hours: 'TD', tp_hours: 'TP' } as const;

function AddCourse({
    faculties,
    levels,
    filters,
    professors,
    years,
    close,
}: Pick<Props, 'faculties' | 'levels' | 'filters' | 'professors' | 'years'> & { close: () => void }) {
    const initialLevel = levels.find((item) => item.id === filters.level);
    const initialFaculty = filters.faculty ?? initialLevel?.faculty_id;
    const form = useForm({
        faculty_id: initialFaculty ? String(initialFaculty) : '',
        level_id: initialLevel?.faculty_id === initialFaculty && initialLevel ? String(initialLevel.id) : '',
        title: '',
        code: '',
        discipline: '',
        credits: '0',
        semester: filters.semester === '1' || filters.semester === '2' ? filters.semester : '',
        cmi_hours: '',
        td_hours: '',
        tp_hours: '',
        description: '',
        pedagogical_content: '',
        professor_id: '',
        academic_year_id: '',
    });
    const availableLevels = levels.filter((item) => String(item.faculty_id) === form.data.faculty_id);
    const selectedLevel = availableLevels.find((item) => String(item.id) === form.data.level_id);
    const creditLimit = selectedLevel?.detail?.credit_required;
    const canAssign = professors.length > 0 && years.length > 0;

    return (
        <AdminModal
            title="Ajouter un cours"
            description="Choisissez le niveau auquel rattacher le cours et renseignez ses informations pédagogiques."
            formId="catalog-course-form"
            submitLabel="Ajouter le cours"
            onClose={close}
            busy={form.processing}
            errors={form.errors}
            wide
        >
            <form
                id="catalog-course-form"
                className="admin-modal-form"
                onSubmit={(event) => {
                    event.preventDefault();
                    form.post(route('dashboard.admin.course-catalog.store'), { onSuccess: close });
                }}
            >
                <div className="course-create-grid">
                    <label>
                        Faculté *
                        <select
                            required
                            value={form.data.faculty_id}
                            onChange={(event) => form.setData((data) => ({ ...data, faculty_id: event.target.value, level_id: '' }))}
                        >
                            <option value="">Choisir la faculté</option>
                            {faculties.map((faculty) => (
                                <option key={faculty.id} value={faculty.id}>
                                    {faculty.name}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label>
                        Niveau *
                        <select
                            required
                            disabled={!availableLevels.length}
                            value={form.data.level_id}
                            onChange={(event) => form.setData('level_id', event.target.value)}
                        >
                            <option value="">
                                {form.data.faculty_id && !availableLevels.length ? 'Aucun niveau dans cette faculté' : 'Choisir le niveau'}
                            </option>
                            {availableLevels.map((level) => (
                                <option key={level.id} value={level.id}>
                                    {level.title}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>
                {selectedLevel && (
                    <p className="course-create-note">
                        {creditLimit == null
                            ? 'Le plafond de crédits doit être renseigné dans les paramètres de ce niveau avant l’ajout.'
                            : `Plafond du niveau : ${creditLimit} crédits.`}
                    </p>
                )}
                <label>
                    Intitulé du cours *
                    <input required maxLength={180} value={form.data.title} onChange={(event) => form.setData('title', event.target.value)} />
                </label>
                <div className="course-create-grid course-create-grid-three">
                    <label>
                        Code
                        <input maxLength={50} value={form.data.code} onChange={(event) => form.setData('code', event.target.value)} />
                    </label>
                    <label>
                        Crédits *
                        <input
                            type="number"
                            required
                            min={0}
                            max={60}
                            step={1}
                            value={form.data.credits}
                            onChange={(event) => form.setData('credits', event.target.value)}
                        />
                    </label>
                    <label>
                        Semestre *
                        <select required value={form.data.semester} onChange={(event) => form.setData('semester', event.target.value)}>
                            <option value="">Choisir le semestre</option>
                            <option value="1">Semestre 1</option>
                            <option value="2">Semestre 2</option>
                        </select>
                    </label>
                </div>
                <fieldset className="course-create-group">
                    <legend>Volume horaire</legend>
                    <div className="course-create-grid course-create-grid-three">
                        {(Object.keys(hours) as (keyof typeof hours)[]).map((field) => (
                            <label key={field}>
                                {hours[field]} (heures)
                                <input
                                    type="number"
                                    min={0}
                                    max={2000}
                                    step={1}
                                    value={form.data[field]}
                                    onChange={(event) => form.setData(field, event.target.value)}
                                />
                            </label>
                        ))}
                    </div>
                </fieldset>
                <label>
                    Domaine académique
                    <input value={form.data.discipline} onChange={(event) => form.setData('discipline', event.target.value)} maxLength={120} />
                </label>
                <label>
                    Description
                    <textarea
                        rows={3}
                        maxLength={5000}
                        value={form.data.description}
                        onChange={(event) => form.setData('description', event.target.value)}
                    />
                </label>
                <label>
                    Contenu pédagogique
                    <textarea
                        rows={4}
                        maxLength={30000}
                        value={form.data.pedagogical_content}
                        onChange={(event) => form.setData('pedagogical_content', event.target.value)}
                    />
                </label>
                <fieldset className="course-create-group">
                    <legend>Affectation facultative</legend>
                    {canAssign ? (
                        <>
                            <div className="course-create-grid">
                                <label>
                                    Enseignant
                                    <select
                                        value={form.data.professor_id}
                                        onChange={(event) =>
                                            form.setData((data) => ({ ...data, professor_id: event.target.value, academic_year_id: '' }))
                                        }
                                    >
                                        <option value="">Aucun pour le moment</option>
                                        {professors.map((professor) => (
                                            <option key={professor.id} value={professor.id}>
                                                {professorName(professor)}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                                {form.data.professor_id && (
                                    <label>
                                        Année académique *
                                        <select
                                            required
                                            value={form.data.academic_year_id}
                                            onChange={(event) => form.setData('academic_year_id', event.target.value)}
                                        >
                                            <option value="">Choisir l’année</option>
                                            {years.map((year) => (
                                                <option key={year.id} value={year.id}>
                                                    {year.title}
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                )}
                            </div>
                            <p className="course-create-note">L’affectation concerne tout le niveau. L’offre pourra être publiée séparément.</p>
                        </>
                    ) : (
                        <p className="course-create-note">L’affectation nécessite un enseignant actif et une année académique configurée.</p>
                    )}
                </fieldset>
            </form>
        </AdminModal>
    );
}

export default function Index({ courses, faculties, levels, filters, canCreate, professors, years, success }: Props) {
    const [adding, setAdding] = useState(false);
    return (
        <Dashboard hideAppsNavigation>
            <Head title="Catalogue des cours" />
            <div className="course-catalog">
                <PageHeading
                    title="Catalogue des cours"
                    description="Retrouvez les cours de l’université par faculté, niveau et semestre."
                    action={
                        canCreate && (
                            <button type="button" className="admin-primary" onClick={() => setAdding(true)}>
                                <Plus size={18} aria-hidden="true" /> Ajouter un cours
                            </button>
                        )
                    }
                />
                {success && (
                    <p className="course-catalog-success" role="status">
                        {success}
                    </p>
                )}
                <section className="course-catalog-panel" aria-labelledby="course-results">
                    <CatalogFilters key={JSON.stringify(filters)} faculties={faculties} levels={levels} filters={filters} />
                    <div className="course-catalog-results">
                        <BookOpen size={19} aria-hidden="true" />
                        <h2 id="course-results">{courses.total} cours</h2>
                        {courses.from !== null && (
                            <span>
                                {courses.from}–{courses.to} sur {courses.total}
                            </span>
                        )}
                    </div>
                    {courses.data.length > 0 ? (
                        <div className="course-catalog-scroll">
                            <table aria-labelledby="course-results">
                                <thead>
                                    <tr>
                                        <th scope="col">Cours</th>
                                        <th scope="col">Faculté</th>
                                        <th scope="col">Niveau</th>
                                        <th scope="col">Semestre</th>
                                        <th scope="col">Crédits</th>
                                    </tr>
                                </thead>
                                <tbody data-dashboard-panel="">
                                    {courses.data.map((course) => (
                                        <tr key={course.id}>
                                            <th scope="row">
                                                <Link href={route('dashboard.admin.course-catalog.show', course.id)}>
                                                    <strong>{course.title}</strong>
                                                </Link>
                                                <small>
                                                    {course.code || 'Code non renseigné'}
                                                    {course.status === 'archived' ? ' · Archivée' : course.status === 'inactive' ? ' · Inactive' : ''}
                                                </small>
                                            </th>
                                            <td>{course.faculty ?? '—'}</td>
                                            <td>
                                                {course.level ? (
                                                    <Link href={route('dashboard.admin.levels.details.show', { id: course.level.id, tab: 'cours' })}>
                                                        {course.level.title} <ArrowUpRight size={13} aria-hidden="true" />
                                                    </Link>
                                                ) : (
                                                    '—'
                                                )}
                                            </td>
                                            <td>{course.semester === null ? 'Non renseigné' : `Semestre ${course.semester}`}</td>
                                            <td>{course.credits}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="course-catalog-empty" data-dashboard-panel="">
                            Aucun cours à afficher pour cette sélection.
                        </p>
                    )}
                    <Pagination value={courses} />
                </section>
            </div>
            {adding && (
                <AddCourse
                    faculties={faculties}
                    levels={levels}
                    filters={filters}
                    professors={professors}
                    years={years}
                    close={() => setAdding(false)}
                />
            )}
        </Dashboard>
    );
}
