import { professorName, type Assignment } from '@/components/teaching/types';
import { Link, usePage } from '@inertiajs/react';
import { ArrowUpRight, Users } from 'lucide-react';
import '../../../../../css/dashboard/teaching.css';

export default function ProfessorsTab() {
    const { teachingAssignments } = usePage<{ teachingAssignments: Assignment[] }>().props;
    const assigned = teachingAssignments.filter((item) => item.professor);
    const professors = [...new Map(assigned.map((item) => [item.professor!.id, item.professor!])).values()];
    return (
        <section className="ld-panel">
            <div className="ld-section-heading">
                <div>
                    <span className="ld-eyebrow">L’ÉQUIPE PÉDAGOGIQUE</span>
                    <h2>Les enseignants du parcours.</h2>
                    <p>Affectez les enseignants depuis l’onglet Cours de ce niveau.</p>
                </div>
                <Link className="admin-secondary" href={route('dashboard.admin.professors.index')}>
                    Gérer les enseignants <ArrowUpRight size={16} />
                </Link>
            </div>
            {professors.length ? (
                <div className="teaching-assignment-list">
                    {professors.map((professor) => (
                        <article key={professor.id}>
                            <Users size={22} />
                            <div>
                                <h3>
                                    <Link href={route('dashboard.admin.professors.show', professor.id)}>{professorName(professor)}</Link>
                                </h3>
                                <p>{professor.is_active ? 'Actif' : 'Inactif'}</p>
                                <ul>
                                    {assigned
                                        .filter((item) => item.professor_id === professor.id)
                                        .map((item) => (
                                            <li key={item.id}>
                                                {item.course?.title} · {item.academic_year.title}
                                                {item.group?.intake?.name ? ` · ${item.group.intake.name}` : ''}
                                            </li>
                                        ))}
                                </ul>
                            </div>
                        </article>
                    ))}
                </div>
            ) : (
                <div className="ld-empty">
                    <Users size={40} strokeWidth={1.2} />
                    <h3>Aucun enseignant affecté.</h3>
                    <p>Ajoutez un enseignant puis affectez-le à un cours du niveau.</p>
                </div>
            )}
        </section>
    );
}
