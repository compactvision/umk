import PageHeading from '@/components/admin/PageHeading';
import Dashboard from '@/components/layouts/Dashboard/Dashboard';
import AssignmentForm from '@/components/teaching/AssignmentForm';
import ProfessorForm from '@/components/teaching/ProfessorForm';
import { professorName, type Assignment, type Professor, type TeachingCourse, type Year } from '@/components/teaching/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { BookOpen, Pencil, Plus } from 'lucide-react';
import { useState } from 'react';
import '../../../../css/dashboard/teaching.css';

export default function ProfessorShow() {
    const { professor, professors, assignments, catalog, years, canAssign, flash } = usePage<{
        professor: Professor;
        professors: Professor[];
        assignments: Assignment[];
        catalog: TeachingCourse[];
        years: Year[];
        canAssign: boolean;
        flash?: { success?: string };
    }>().props;
    const [editing, setEditing] = useState(false);
    const [assigning, setAssigning] = useState(false);
    const [assignment, setAssignment] = useState<Assignment | undefined>();
    return (
        <Dashboard>
            <Head title={professorName(professor)} />
            <div className="teaching-page">
                <PageHeading
                    title={professorName(professor)}
                    description={professor.speciality || 'Fiche enseignant et affectations pédagogiques.'}
                    action={
                        <button className="admin-secondary" onClick={() => setEditing(true)}>
                            <Pencil size={16} /> Modifier la fiche
                        </button>
                    }
                />
                {flash?.success && (
                    <p role="status" className="teaching-feedback">
                        {flash.success}
                    </p>
                )}
                <section className="teaching-profile">
                    <span className={`teaching-status ${professor.is_active ? '' : 'is-inactive'}`}>{professor.is_active ? 'Actif' : 'Inactif'}</span>
                    <a href={`mailto:${professor.email}`}>{professor.email}</a>
                    {professor.phone && <p>{professor.phone}</p>}
                    {professor.biography && <p className="whitespace-pre-line">{professor.biography}</p>}
                    {!professor.is_active && (
                        <p className="teaching-help">
                            Les affectations existantes sont conservées. Réactivez cet enseignant pour lui attribuer un nouveau cours.
                        </p>
                    )}
                </section>
                <section className="teaching-profile">
                    <header className="teaching-section-heading">
                        <h2>Les cours affectés</h2>
                        {canAssign && professor.is_active && (
                            <button
                                className="admin-primary"
                                onClick={() => {
                                    setAssignment(undefined);
                                    setAssigning(true);
                                }}
                            >
                                <Plus size={16} /> Affecter un cours
                            </button>
                        )}
                    </header>
                    {assignments.length ? (
                        <div className="teaching-assignment-list">
                            {assignments.map((item) => (
                                <article key={item.id}>
                                    <BookOpen size={21} />
                                    <div>
                                        <h3>{item.course?.title}</h3>
                                        <p>
                                            {item.level?.faculty.name} · {item.level?.title}
                                        </p>
                                        <p>
                                            {item.academic_year.title} · {item.group?.intake?.name ?? 'Tous les groupes'}
                                            {item.is_optional ? ' · Optionnel' : ''}
                                        </p>
                                        <small>{item.is_published ? 'Publié' : 'Non publié'}</small>
                                    </div>
                                    <div className="teaching-inline-actions">
                                        <Link className="admin-secondary" href={route('dashboard.admin.levels.details.show', item.level?.id)}>
                                            Voir le niveau
                                        </Link>
                                        {canAssign && (
                                            <button
                                                className="admin-secondary"
                                                onClick={() => {
                                                    setAssignment(item);
                                                    setAssigning(true);
                                                }}
                                            >
                                                Modifier l’affectation
                                            </button>
                                        )}
                                    </div>
                                </article>
                            ))}
                        </div>
                    ) : (
                        <p className="teaching-empty">Aucun cours n’est encore affecté à cet enseignant.</p>
                    )}
                </section>
            </div>
            {editing && <ProfessorForm professor={professor} onClose={() => setEditing(false)} />}
            {assigning && (
                <AssignmentForm
                    courses={catalog}
                    professors={professors}
                    years={years}
                    fixedProfessor={assignment ? undefined : professor}
                    assignment={assignment}
                    onClose={() => setAssigning(false)}
                />
            )}
        </Dashboard>
    );
}
