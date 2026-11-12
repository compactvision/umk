import AdminModal from '@/components/admin/AdminModal';
import { Link, useForm } from '@inertiajs/react';
import { useState, type FormEvent } from 'react';
import { professorName, type Assignment, type Department, type Professor, type TeachingCourse, type Year } from './types';

export default function AssignmentForm({
    courses,
    professors,
    years,
    fixedCourse,
    departmentOptions,
    fixedProfessor,
    assignment,
    onClose,
}: {
    courses: TeachingCourse[];
    professors: Professor[];
    years: Year[];
    fixedCourse?: TeachingCourse;
    departmentOptions?: Department[];
    fixedProfessor?: Professor;
    assignment?: Assignment;
    onClose: () => void;
}) {
    const [levelId, setLevelId] = useState('');
    const levels = [...new Map(courses.filter((course) => course.level).map((course) => [course.level!.id, course.level!])).values()];
    const form = useForm({
        course_id: String(assignment?.course_id ?? fixedCourse?.id ?? ''),
        academic_year_id: String(assignment?.academic_year_id ?? years[0]?.id ?? ''),
        academic_department_id: String(assignment?.academic_department_id ?? ''),
        professor_id: String(assignment?.professor_id ?? fixedProfessor?.id ?? ''),
        is_published: assignment?.is_published ?? true,
        assistant_professor_id: String(assignment?.assistant_professor_id ?? ''),
        group_leader_name: assignment?.group_leader_name ?? '',
        delivery_mode: assignment?.delivery_mode ?? 'in_person',
    });
    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const options = { preserveScroll: true, onSuccess: onClose };
        if (assignment) form.put(route('dashboard.admin.professors.assignments.update', assignment.id), options);
        else form.post(route('dashboard.admin.professors.assignments.store'), options);
    };
    const selectedCourse = fixedCourse ?? courses.find((course) => String(course.id) === form.data.course_id);
    const departments = departmentOptions ?? selectedCourse?.level?.department_options ?? [];
    const currentDepartment = assignment?.department;
    const selectedProfessor = fixedProfessor ?? professors.find((professor) => String(professor.id) === form.data.professor_id);
    const inactive = selectedProfessor && !selectedProfessor.is_active;
    return (
        <AdminModal
            title={assignment ? 'Modifier l’affectation' : 'Affecter un enseignant'}
            description="L’affectation concerne un cours et une année académique."
            formId="teaching-assignment-form"
            submitLabel="Enregistrer l’affectation"
            onClose={onClose}
            busy={form.processing}
            errors={form.errors}
        >
            <form id="teaching-assignment-form" onSubmit={submit} className="admin-modal-form">
                {fixedProfessor ? (
                    <p>
                        <strong>{professorName(fixedProfessor)}</strong>
                    </p>
                ) : (
                    <label>
                        Enseignant {!assignment && '*'}
                        <select required={!assignment} value={form.data.professor_id} onChange={(e) => form.setData('professor_id', e.target.value)}>
                            <option value="">{assignment ? 'Sans enseignant' : 'Choisir un enseignant'}</option>
                            {professors.map((professor) => (
                                <option key={professor.id} value={professor.id} disabled={!professor.is_active}>
                                    {professorName(professor)}
                                    {!professor.is_active ? ' (inactif)' : ''}
                                </option>
                            ))}
                        </select>
                    </label>
                )}
                {!fixedCourse && !assignment && (
                    <label>
                        Niveau / faculté *
                        <select
                            required
                            value={levelId}
                            onChange={(e) => {
                                setLevelId(e.target.value);
                                form.setData((data) => ({ ...data, course_id: '', academic_department_id: '' }));
                            }}
                        >
                            <option value="">Choisir un niveau</option>
                            {levels.map((level) => (
                                <option key={level.id} value={level.id}>
                                    {level.faculty.name} · {level.title}
                                </option>
                            ))}
                        </select>
                    </label>
                )}
                {fixedCourse || assignment ? (
                    <p>
                        <strong>{selectedCourse?.title ?? assignment?.course?.title}</strong>
                    </p>
                ) : (
                    <label>
                        Cours *
                        <select
                            required
                            disabled={!levelId}
                            value={form.data.course_id}
                            onChange={(e) => form.setData((data) => ({ ...data, course_id: e.target.value, academic_department_id: '' }))}
                        >
                            <option value="">Choisir un cours</option>
                            {courses
                                .filter((course) => String(course.level?.id) === levelId)
                                .map((course) => (
                                    <option key={course.id} value={course.id}>
                                        {course.code ? `${course.code} · ` : ''}
                                        {course.title}
                                    </option>
                                ))}
                        </select>
                    </label>
                )}
                {selectedCourse?.semester && <p className="teaching-help">{selectedCourse.semester === 1 ? '1er semestre' : '2e semestre'}</p>}
                <label>
                    Année académique *
                    <select
                        required
                        disabled={Boolean(assignment)}
                        value={form.data.academic_year_id}
                        onChange={(e) => form.setData('academic_year_id', e.target.value)}
                    >
                        <option value="">Choisir une année</option>
                        {years.map((year) => (
                            <option key={year.id} value={year.id}>
                                {year.title}
                            </option>
                        ))}
                    </select>
                </label>
                {(departments.length > 0 || currentDepartment) && (
                    <label>
                        Public de l’enseignement
                        <select
                            value={form.data.academic_department_id}
                            onChange={(event) => form.setData('academic_department_id', event.target.value)}
                        >
                            <option value="">Tronc commun</option>
                            {departments.map((department) => (
                                <option key={department.id} value={department.id}>
                                    {department.name}
                                </option>
                            ))}
                            {currentDepartment && !departments.some(({ id }) => id === currentDepartment.id) && (
                                <option value={currentDepartment.id}>{currentDepartment.name} (inactif)</option>
                            )}
                        </select>
                    </label>
                )}
                <label>
                    Assistant (facultatif)
                    <select value={form.data.assistant_professor_id} onChange={(event) => form.setData('assistant_professor_id', event.target.value)}>
                        <option value="">Aucun assistant renseigné</option>
                        {professors
                            .filter((professor) => professor.is_active)
                            .map((professor) => (
                                <option value={professor.id} key={professor.id}>
                                    {professorName(professor)}
                                </option>
                            ))}
                    </select>
                </label>
                <label>
                    Chef de promotion
                    <input
                        maxLength={180}
                        value={form.data.group_leader_name}
                        onChange={(event) => form.setData('group_leader_name', event.target.value)}
                    />
                </label>
                <label>
                    Organisation
                    <select value={form.data.delivery_mode} onChange={(event) => form.setData('delivery_mode', event.target.value)}>
                        <option value="in_person">Présentiel</option>
                        <option value="online">À distance</option>
                        <option value="hybrid">Hybride</option>
                    </select>
                </label>
                <label className="teaching-checkbox">
                    <input type="checkbox" checked={form.data.is_published} onChange={(e) => form.setData('is_published', e.target.checked)} />{' '}
                    Publier l’enseignement pour les étudiants concernés
                </label>
                <p className="teaching-help">
                    {assignment
                        ? 'Le groupe et le caractère optionnel de cet enseignement sont conservés.'
                        : 'Le tronc commun est partagé par les étudiants du niveau. Un enseignement de spécialité est réservé au département choisi.'}
                </p>
                {inactive && (
                    <p role="alert" className="text-sm text-red-700">
                        Cet enseignant est inactif. Choisissez un enseignant actif avant d’enregistrer.
                    </p>
                )}
                {!professors.some((professor) => professor.is_active) && (
                    <p className="teaching-help">
                        Aucun enseignant actif. <Link href={route('dashboard.admin.professors.index')}>Ajoutez ou activez un enseignant.</Link>
                    </p>
                )}
                {!years.length && (
                    <p role="alert">
                        Créez d’abord une année académique.{' '}
                        <Link href={route('dashboard.admin.academic-years.index')}>Gérer les années académiques</Link>
                    </p>
                )}
            </form>
        </AdminModal>
    );
}
