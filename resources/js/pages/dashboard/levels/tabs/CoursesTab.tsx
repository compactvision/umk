import AdminModal from '@/components/admin/AdminModal';
import AssignmentForm from '@/components/teaching/AssignmentForm';
import { professorName, type Assignment, type Professor, type Year } from '@/components/teaching/types';
import { Link, useForm, usePage } from '@inertiajs/react';
import { BookOpen, Pencil, Plus } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import '../../../../../css/dashboard/teaching.css';

type Course = {
    id: number;
    title: string;
    code: string | null;
    credits: number;
    description: string | null;
    semester: number | null;
    cmi_hours?: number | null;
    td_hours?: number | null;
    tp_hours?: number | null;
    pedagogical_content?: string | null;
};

export default function CoursesTab() {
    const { courses, level, canManageCourses, flash, levelDetail, teachingAssignments, professors, academicYears } = usePage<{
        levelDetail: { credit_required: number | null };
        courses: Course[];
        teachingAssignments: Assignment[];
        professors: Professor[];
        academicYears: Year[];
        level: { id: number; title: string };
        canManageCourses: boolean;
        flash?: { success?: string };
    }>().props;
    const [assigning, setAssigning] = useState<{ course: Course; assignment?: Assignment } | null>(null);
    const [adding, setAdding] = useState(false);
    const [editing, setEditing] = useState<Course | null>(null);
    const form = useForm({
        title: '',
        code: '',
        credits: '0',
        semester: '',
        description: '',
        cmi_hours: '',
        td_hours: '',
        tp_hours: '',
        pedagogical_content: '',
    });
    const usedCredits = courses.reduce((total, course) => total + Number(course.credits), 0);
    const limit = levelDetail.credit_required;
    const available = limit == null ? null : Math.max(0, Number(limit) - usedCredits + Number(editing?.credits ?? 0));
    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const options = {
            preserveScroll: true,
            onSuccess: () => {
                setAdding(false);
                setEditing(null);
                form.reset();
            },
        };
        if (editing) form.put(route('dashboard.admin.levels.details.courses.update', [level.id, editing.id]), options);
        else form.post(route('dashboard.admin.levels.details.courses.store', level.id), options);
    };

    return (
        <section className="ld-panel">
            <div className="ld-section-heading">
                <div>
                    <span className="ld-eyebrow">LE CONTENU PÉDAGOGIQUE</span>
                    <h2>Les cours du programme.</h2>
                    <p>
                        Catalogue des cours de {level.title}. {usedCredits} / {limit ?? 'plafond à définir'} crédits.
                    </p>
                </div>
                {canManageCourses && (
                    <Link className="admin-secondary" href={route('dashboard.admin.schedule.index', { level_id: level.id })}>
                        Gérer les horaires
                    </Link>
                )}
                {canManageCourses && (
                    <button
                        className="admin-primary"
                        onClick={() => {
                            form.reset();
                            form.clearErrors();
                            setEditing(null);
                            setAdding(true);
                        }}
                    >
                        <Plus size={16} /> Ajouter un cours
                    </button>
                )}
            </div>
            {flash?.success && (
                <p role="status" className="mt-4 text-sm text-emerald-700">
                    {flash.success}
                </p>
            )}
            {courses.length ? (
                <div className="ld-semester-groups">
                    {[1, 2, null].map((semester) => {
                        const items = courses.filter((course) => course.semester === semester).sort((a, b) => a.title.localeCompare(b.title, 'fr'));
                        if (semester === null && !items.length) return null;
                        const label = semester === 1 ? '1er semestre' : semester === 2 ? '2e semestre' : 'Semestre à préciser';
                        return (
                            <section key={semester ?? 'unspecified'} className="ld-semester-group" aria-label={label}>
                                <header className="ld-semester-heading">
                                    <div>
                                        <h3>{label}</h3>
                                        <p>{items.length} cours</p>
                                    </div>
                                    <span>{items.reduce((sum, course) => sum + Number(course.credits), 0)} crédits</span>
                                </header>
                                {items.length ? (
                                    <ul className="divide-y divide-gray-200">
                                        {items.map((course) => (
                                            <li key={course.id} className="flex items-start gap-3 py-4">
                                                <BookOpen size={22} className="mt-1 shrink-0 text-emerald-600" aria-hidden="true" />
                                                <div className="min-w-0 break-words">
                                                    <h3 className="font-semibold">{course.title}</h3>
                                                    <p className="mt-1 text-sm text-gray-600">
                                                        {course.code ? `${course.code} · ` : ''}
                                                        {course.credits} crédits ·{' '}
                                                        {course.semester === 1
                                                            ? '1er semestre'
                                                            : course.semester === 2
                                                              ? '2e semestre'
                                                              : 'Semestre à préciser'}
                                                    </p>
                                                    {course.description && (
                                                        <p className="mt-2 text-sm whitespace-pre-line text-gray-600">{course.description}</p>
                                                    )}
                                                    <div className="ld-course-assignments">
                                                        {teachingAssignments
                                                            .filter((item) => item.course_id === course.id)
                                                            .map((item) => (
                                                                <div className="ld-course-assignment" key={item.id}>
                                                                    <span>
                                                                        {item.academic_year.title} ·{' '}
                                                                        {item.professor ? professorName(item.professor) : 'Sans enseignant'} ·{' '}
                                                                        {item.is_published ? 'Publié' : 'Non publié'}
                                                                        {item.group?.intake?.name ? ` · ${item.group.intake.name}` : ''}
                                                                        {item.is_optional ? ' · Optionnel' : ''}
                                                                    </span>
                                                                    {canManageCourses && (
                                                                        <button
                                                                            className="admin-secondary"
                                                                            onClick={() => setAssigning({ course, assignment: item })}
                                                                        >
                                                                            Modifier l’affectation
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        {canManageCourses && (
                                                            <button className="admin-secondary self-start" onClick={() => setAssigning({ course })}>
                                                                <Plus size={14} /> Affecter un enseignant
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                                {canManageCourses && (
                                                    <button
                                                        className="admin-secondary ml-auto shrink-0"
                                                        aria-label={`Modifier ${course.title}`}
                                                        onClick={() => {
                                                            form.clearErrors();
                                                            form.setData({
                                                                title: course.title,
                                                                code: course.code ?? '',
                                                                credits: String(course.credits),
                                                                semester: course.semester ? String(course.semester) : '',
                                                                description: course.description ?? '',
                                                                cmi_hours: course.cmi_hours == null ? '' : String(course.cmi_hours),
                                                                td_hours: course.td_hours == null ? '' : String(course.td_hours),
                                                                tp_hours: course.tp_hours == null ? '' : String(course.tp_hours),
                                                                pedagogical_content: course.pedagogical_content ?? '',
                                                            });
                                                            setEditing(course);
                                                            setAdding(true);
                                                        }}
                                                    >
                                                        <Pencil size={16} /> Modifier
                                                    </button>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="py-4 text-sm text-gray-600">Aucun cours pour ce semestre.</p>
                                )}
                            </section>
                        );
                    })}
                </div>
            ) : (
                <div className="ld-empty">
                    <BookOpen size={40} strokeWidth={1.2} aria-hidden="true" />
                    <h3>Aucun cours pour ce niveau.</h3>
                    <p>Ajoutez les matières qui composent le programme.</p>
                </div>
            )}
            {assigning && (
                <AssignmentForm
                    courses={courses}
                    fixedCourse={assigning.course}
                    professors={
                        assigning.assignment?.professor && !assigning.assignment.professor.is_active
                            ? [...professors, assigning.assignment.professor]
                            : professors
                    }
                    years={academicYears}
                    assignment={assigning.assignment}
                    onClose={() => setAssigning(null)}
                />
            )}
            {adding && (
                <AdminModal
                    title={editing ? 'Modifier le cours' : 'Ajouter un cours'}
                    description={`Ce cours sera rattaché au niveau ${level.title}.`}
                    formId="level-course-form"
                    submitLabel={editing ? 'Enregistrer' : 'Ajouter le cours'}
                    busy={form.processing}
                    errors={form.errors}
                    onClose={() => setAdding(false)}
                >
                    <form id="level-course-form" onSubmit={submit} className="admin-modal-form">
                        <p className="text-sm text-emerald-700">
                            {available == null
                                ? 'Configurez le plafond de crédits dans les paramètres du niveau.'
                                : `${available} crédits disponibles sur ${limit}.`}
                        </p>
                        <label>
                            Intitulé du cours *
                            <input required maxLength={180} value={form.data.title} onChange={(event) => form.setData('title', event.target.value)} />
                        </label>
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
                                max={Math.min(60, available ?? 60)}
                                step={1}
                                value={form.data.credits}
                                onChange={(event) => form.setData('credits', event.target.value)}
                            />
                        </label>
                        <label>
                            Semestre *
                            <select required value={form.data.semester} onChange={(event) => form.setData('semester', event.target.value)}>
                                <option value="">Choisir le semestre</option>
                                <option value="1">1er semestre</option>
                                <option value="2">2e semestre</option>
                            </select>
                        </label>
                        {(['cmi_hours', 'td_hours', 'tp_hours'] as const).map((field) => (
                            <label key={field}>
                                {{ cmi_hours: 'CMI', td_hours: 'TD', tp_hours: 'TP' }[field]} (heures)
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
                        <label>
                            Contenu pédagogique
                            <textarea
                                rows={6}
                                maxLength={30000}
                                value={form.data.pedagogical_content}
                                onChange={(event) => form.setData('pedagogical_content', event.target.value)}
                            />
                        </label>
                        <label>
                            Description
                            <textarea
                                maxLength={5000}
                                rows={4}
                                value={form.data.description}
                                onChange={(event) => form.setData('description', event.target.value)}
                            />
                        </label>
                    </form>
                </AdminModal>
            )}
        </section>
    );
}
