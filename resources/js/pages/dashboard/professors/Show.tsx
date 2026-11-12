import Dashboard from '@/components/layouts/Dashboard/Dashboard';
import AssignmentForm from '@/components/teaching/AssignmentForm';
import ProfessorAvatar from '@/components/teaching/ProfessorAvatar';
import ProfessorForm from '@/components/teaching/ProfessorForm';
import { professorName, type Assignment, type Professor, type TeachingCourse, type Year } from '@/components/teaching/types';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { ArrowUpRight, BookOpen, Link2, Mail, Pencil, Plus, ShieldCheck, UserRound } from 'lucide-react';
import { useState } from 'react';
import '../../../../css/dashboard/professor-detail.css';
import '../../../../css/dashboard/professor-portraits.css';
import '../../../../css/dashboard/teaching.css';
import AcademicForm, { type FormSpec } from '../studentAcademic/AcademicForm';

export default function ProfessorShow() {
    const { professor, professors, assignments, catalog, years, canAssign, canLinkAccount, linkedAccount, invitationPending, flash, errors } =
        usePage<{
            professor: Professor;
            professors: Professor[];
            assignments: Assignment[];
            catalog: TeachingCourse[];
            years: Year[];
            canAssign: boolean;
            canLinkAccount?: boolean;
            linkedAccount?: string | null;
            invitationPending?: boolean;
            errors?: { invitation?: string };
            flash?: { success?: string };
        }>().props;
    const [linking, setLinking] = useState<FormSpec | null>(null);
    const [editing, setEditing] = useState(false);
    const [assigning, setAssigning] = useState(false);
    const [assignment, setAssignment] = useState<Assignment | undefined>();
    const invite = useForm({});
    const name = professorName(professor);
    return (
        <Dashboard hideAppsNavigation>
            <Head title={professorName(professor)} />
            {linking && <AcademicForm spec={linking} onClose={() => setLinking(null)} onSuccess={() => setLinking(null)} />}
            <div className="teaching-page professor-detail">
                <header className="professor-detail-heading">
                    <div className="professor-detail-identity">
                        <ProfessorAvatar name={name} photoUrl={professor.photo_url} />
                        <div>
                            <h1>{name}</h1>
                            <div className="professor-detail-meta">
                                {professor.speciality && <span>{professor.speciality}</span>}
                                {!professor.photo_url && <span className="professor-photo-missing">Photo à compléter</span>}
                                <span className={`teaching-status ${professor.is_active ? '' : 'is-inactive'}`}>
                                    {professor.is_active ? 'Actif' : 'Inactif'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <button type="button" className="professor-action" onClick={() => setEditing(true)}>
                        <Pencil size={16} aria-hidden="true" /> Modifier la fiche
                    </button>
                </header>
                {flash?.success && (
                    <p role="status" className="teaching-feedback">
                        {flash.success}
                    </p>
                )}
                {errors?.invitation && (
                    <p role="alert" className="teaching-feedback professor-detail-error">
                        {errors.invitation}
                    </p>
                )}
                <div className="professor-detail-grid">
                    <section className="teaching-profile professor-detail-card" aria-labelledby="professor-contact">
                        <header>
                            <span className="professor-section-icon">
                                <UserRound size={18} aria-hidden="true" />
                            </span>
                            <h2 id="professor-contact">Coordonnées</h2>
                        </header>
                        <dl className="professor-contact-list">
                            <div>
                                <dt>Adresse e-mail</dt>
                                <dd>
                                    <a href={`mailto:${professor.email}`}>{professor.email}</a>
                                </dd>
                            </div>
                            <div>
                                <dt>Téléphone</dt>
                                <dd>{professor.phone ? <a href={`tel:${professor.phone}`}>{professor.phone}</a> : 'Non renseigné'}</dd>
                            </div>
                        </dl>
                        {professor.biography && <p className="professor-bio whitespace-pre-line">{professor.biography}</p>}
                    </section>
                    {canLinkAccount && (
                        <section className="teaching-profile professor-detail-card" aria-labelledby="professor-access">
                            <header>
                                <span className="professor-section-icon">
                                    <ShieldCheck size={18} aria-hidden="true" />
                                </span>
                                <h2 id="professor-access">Accès à l’espace enseignant</h2>
                            </header>
                            <div className="professor-account-state">
                                <span className="teaching-status" data-pending={(invitationPending && !linkedAccount) || undefined}>
                                    {linkedAccount
                                        ? 'Compte associé'
                                        : invitationPending
                                          ? 'Invitation en attente d’activation'
                                          : 'Aucun compte associé'}
                                </span>
                                {linkedAccount && <p>{linkedAccount}</p>}
                            </div>
                            <div className="professor-detail-actions">
                                {!linkedAccount && professor.is_active && (
                                    <button
                                        type="button"
                                        className="professor-action is-primary"
                                        disabled={invite.processing}
                                        onClick={() =>
                                            invite.post(route('dashboard.admin.professors.invitation', professor.id), { preserveScroll: true })
                                        }
                                    >
                                        <Mail size={16} aria-hidden="true" />
                                        {invite.processing ? 'Envoi en cours…' : invitationPending ? 'Renvoyer l’invitation' : 'Inviter par e-mail'}
                                    </button>
                                )}
                                <button
                                    type="button"
                                    className="professor-action"
                                    onClick={() =>
                                        setLinking({
                                            title: 'Associer le compte enseignant',
                                            description:
                                                'Indiquez un compte vérifié ayant le rôle enseignant. Laissez l’adresse vide pour retirer le rattachement.',
                                            action: route('dashboard.admin.professors.account', professor.id),
                                            fields: [
                                                { name: 'email', label: 'Adresse du compte', type: 'email', value: linkedAccount },
                                                { name: 'reason', label: 'Justification', type: 'textarea', required: true },
                                            ],
                                        })
                                    }
                                >
                                    <Link2 size={16} aria-hidden="true" /> {linkedAccount ? 'Gérer le rattachement' : 'Associer un compte'}
                                </button>
                            </div>
                        </section>
                    )}
                </div>
                <section className="teaching-profile professor-detail-card" aria-labelledby="professor-courses">
                    <header className="professor-courses-heading">
                        <div>
                            <span className="professor-section-icon">
                                <BookOpen size={18} aria-hidden="true" />
                            </span>
                            <h2 id="professor-courses">Cours affectés</h2>
                            <span className="professor-course-count" aria-label={`${assignments.length} cours affectés`}>
                                {assignments.length}
                            </span>
                        </div>
                        {canAssign && professor.is_active && (
                            <button
                                type="button"
                                className="professor-action is-primary"
                                onClick={() => {
                                    setAssignment(undefined);
                                    setAssigning(true);
                                }}
                            >
                                <Plus size={16} aria-hidden="true" /> Affecter un cours
                            </button>
                        )}
                    </header>
                    {!professor.is_active && <p className="teaching-help">Réactivez cet enseignant pour lui attribuer un nouveau cours.</p>}
                    {assignments.length ? (
                        <div className="teaching-assignment-list">
                            {assignments.map((item) => (
                                <article key={item.id}>
                                    <BookOpen size={21} aria-hidden="true" />
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
                                    <div className="professor-detail-actions">
                                        {item.level && (
                                            <Link className="professor-action" href={route('dashboard.admin.levels.details.show', item.level.id)}>
                                                Voir le niveau <ArrowUpRight size={15} aria-hidden="true" />
                                            </Link>
                                        )}
                                        {canAssign && item.curriculum_item_id && (
                                            <Link className="professor-action" href={route('dashboard.admin.teaching.index', { offering: item.id })}>
                                                Voir l’équipe <ArrowUpRight size={15} aria-hidden="true" />
                                            </Link>
                                        )}
                                        {canAssign && !item.curriculum_item_id && !item.archived_at && (
                                            <button
                                                type="button"
                                                className="professor-action"
                                                onClick={() => {
                                                    setAssignment(item);
                                                    setAssigning(true);
                                                }}
                                            >
                                                <Pencil size={15} aria-hidden="true" /> Modifier l’affectation
                                            </button>
                                        )}
                                    </div>
                                </article>
                            ))}
                        </div>
                    ) : (
                        <p className="teaching-empty professor-courses-empty">Aucun cours affecté pour le moment.</p>
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
