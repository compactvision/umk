import Pagination from '@/components/admin/Pagination';
import Dashboard from '@/components/layouts/Dashboard/Dashboard';
import AssignmentForm from '@/components/teaching/AssignmentForm';
import ProfessorAvatar from '@/components/teaching/ProfessorAvatar';
import ProfessorForm from '@/components/teaching/ProfessorForm';
import { professorName, type Professor, type TeachingCourse, type Year } from '@/components/teaching/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowUpRight, BookOpen, Mail, Pencil, Phone, Plus, Search, Users } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import '../../../../css/dashboard/professor-portraits.css';
import '../../../../css/dashboard/teaching.css';

type Props = {
    professors: { data: Professor[]; total: number };
    filters: { q?: string; status?: string };
    stats: { total: number; active: number; assignments: number };
    catalog: TeachingCourse[];
    years: Year[];
    canAssign: boolean;
    canInvite: boolean;
    flash?: { success?: string };
};
export default function ProfessorsIndex() {
    const props = usePage<Props>().props;
    const [q, setQ] = useState(props.filters.q ?? '');
    const [status, setStatus] = useState(props.filters.status ?? '');
    const [editing, setEditing] = useState<Professor | null>(null);
    const [formOpen, setFormOpen] = useState(false);
    const [assigning, setAssigning] = useState<Professor | null>(null);
    const search = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        router.get(route('dashboard.admin.professors.index'), { q, status: status || undefined }, { preserveState: true, replace: true });
    };
    return (
        <Dashboard hideAppsNavigation>
            <Head title="Enseignants" />
            <div className="teaching-page professor-directory">
                <header className="professor-heading">
                    <h1>Enseignants</h1>
                    <button
                        className="admin-primary"
                        onClick={() => {
                            setEditing(null);
                            setFormOpen(true);
                        }}
                    >
                        <Plus size={17} /> Ajouter un enseignant
                    </button>
                </header>
                <div className="teaching-stats">
                    <div>
                        <Users size={21} />
                        <strong>{props.stats.total}</strong>
                        <span>Enseignants</span>
                    </div>
                    <div>
                        <Users size={21} />
                        <strong>{props.stats.active}</strong>
                        <span>Actifs</span>
                    </div>
                    <div>
                        <BookOpen size={21} />
                        <strong>{props.stats.assignments}</strong>
                        <span>Affectations</span>
                    </div>
                </div>
                {props.flash?.success && (
                    <p className="teaching-feedback" role="status">
                        {props.flash.success}
                    </p>
                )}
                <form onSubmit={search} className="teaching-search">
                    <label>
                        <span className="sr-only">Rechercher un enseignant</span>
                        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nom, email ou spécialité…" />
                    </label>
                    <label>
                        <span className="sr-only">Statut</span>
                        <select value={status} onChange={(e) => setStatus(e.target.value)}>
                            <option value="">Tous les statuts</option>
                            <option value="active">Actifs</option>
                            <option value="inactive">Inactifs</option>
                        </select>
                    </label>
                    <button className="admin-secondary" type="submit">
                        <Search size={16} /> Rechercher
                    </button>
                </form>
                {props.professors.data.length ? (
                    <div className="teaching-professor-grid" data-dashboard-panel="q status page">
                        {props.professors.data.map((professor) => (
                            <article className="teaching-professor-card" key={professor.id}>
                                <header className="professor-card-identity">
                                    <ProfessorAvatar name={professorName(professor)} photoUrl={professor.photo_url} />
                                    <h2>{professorName(professor)}</h2>
                                    {professor.speciality && <p>{professor.speciality}</p>}
                                    <span className={`teaching-status ${professor.is_active ? '' : 'is-inactive'}`}>
                                        {professor.is_active ? 'Actif' : 'Inactif'}
                                    </span>
                                </header>
                                <div className="professor-card-contact">
                                    {professor.email && (
                                        <a href={`mailto:${professor.email}`}>
                                            <Mail size={15} aria-hidden="true" /> <span>{professor.email}</span>
                                        </a>
                                    )}
                                    {professor.phone && (
                                        <a href={`tel:${professor.phone}`}>
                                            <Phone size={15} aria-hidden="true" /> <span>{professor.phone}</span>
                                        </a>
                                    )}
                                    <p>
                                        <BookOpen size={15} aria-hidden="true" /> {professor.offerings_count ?? 0}{' '}
                                        {(professor.offerings_count ?? 0) > 1 ? 'affectations' : 'affectation'}
                                    </p>
                                </div>
                                <Link
                                    className="professor-card-link"
                                    href={route('dashboard.admin.professors.show', professor.id)}
                                    aria-label={`Voir le profil de ${professorName(professor)}`}
                                >
                                    Voir le profil <ArrowUpRight size={16} aria-hidden="true" />
                                </Link>
                                <footer>
                                    <button
                                        className="admin-secondary"
                                        onClick={() => {
                                            setEditing(professor);
                                            setFormOpen(true);
                                        }}
                                    >
                                        <Pencil size={15} /> Modifier
                                    </button>
                                    {props.canAssign && professor.is_active && (
                                        <button className="admin-secondary" onClick={() => setAssigning(professor)}>
                                            <Plus size={15} /> Affecter un cours
                                        </button>
                                    )}
                                </footer>
                            </article>
                        ))}
                    </div>
                ) : (
                    <div className="teaching-empty" data-dashboard-panel="q status page">
                        <Users size={36} />
                        <h2>Aucun enseignant trouvé.</h2>
                        <p>Ajoutez un enseignant ou ajustez votre recherche.</p>
                    </div>
                )}
                <Pagination value={props.professors} />
            </div>
            {formOpen && <ProfessorForm canInvite={props.canInvite} professor={editing ?? undefined} onClose={() => setFormOpen(false)} />}
            {assigning && (
                <AssignmentForm
                    courses={props.catalog}
                    professors={[assigning]}
                    years={props.years}
                    fixedProfessor={assigning}
                    onClose={() => setAssigning(null)}
                />
            )}
        </Dashboard>
    );
}
