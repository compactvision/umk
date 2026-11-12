import AdminNotifications from '@/components/admin/AdminNotifications';
import Pagination from '@/components/admin/Pagination';
import Dashboard from '@/components/layouts/Dashboard/Dashboard';
import ProfessorAvatar from '@/components/teaching/ProfessorAvatar';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import '../../../../css/dashboard/professor-portraits.css';
import '../../../../css/dashboard/student-academic.css';
import '../../../../css/student-portal.css';
import AcademicForm, { type FormSpec } from '../studentAcademic/AcademicForm';
import { Activity, Context } from './Details';
import { dateTime, type Offering, type Page, type Resource, type Session, type Student } from './types';

export default function Teacher({
    linked,
    photoUrl,
    offerings,
    selected,
    students,
    sessions,
    resources,
    canPublish,
    schedule,
    week,
}: {
    linked: boolean;
    photoUrl?: string | null;
    offerings: Page<Offering> | null;
    selected: Offering | null;
    students: Page<Student> | null;
    sessions: Page<Session> | null;
    resources: Page<Resource> | null;
    canPublish: boolean;
    schedule: Page<{
        id: number;
        offering_id: number;
        course: string;
        group: string | null;
        starts_at: string;
        ends_at: string;
        room: string;
        status: string;
    }> | null;
    week: string;
}) {
    const [modal, setModal] = useState<FormSpec | null>(null);
    const { flash } = usePage<{ flash?: { success?: string } }>().props;
    return (
        <Dashboard hideAppsNavigation>
            <Head title="Mes enseignements" />
            <AdminNotifications audience="student" />
            {modal && <AcademicForm spec={modal} onClose={() => setModal(null)} onSuccess={() => setModal(null)} />}
            <main className="student-portal academic-administration" data-dashboard-arrival-grid>
                <header className="directory-heading">
                    <div>
                        <h1>Mes enseignements</h1>
                        <p>Offres, groupes, séances et supports de vos affectations.</p>
                    </div>
                    {linked && (
                        <Link className="teacher-photo-link" href={route('dashboard.teaching.profile')}>
                            <ProfessorAvatar name="" photoUrl={photoUrl} /> Modifier ma photo
                        </Link>
                    )}
                </header>
                {flash?.success && (
                    <p role="status" className="portal-alert">
                        {flash.success}
                    </p>
                )}
                {!linked ? (
                    <section className="portal-panel">
                        <p>Votre compte doit être rattaché à une fiche enseignant active par l’administration.</p>
                    </section>
                ) : (
                    <section className="portal-panel">
                        <h2>Mes offres</h2>
                        {offerings?.data.length ? (
                            <ul>
                                {offerings.data.map((offer) => (
                                    <li key={offer.id}>
                                        <Link href={route('dashboard.teaching.index', { offering: offer.id })}>
                                            {offer.title} · {offer.year} · {offer.group ?? offer.level}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p>Aucun enseignement ne vous est affecté.</p>
                        )}
                        <Pagination value={offerings} />
                    </section>
                )}
                {schedule && (
                    <section className="portal-panel">
                        <h2>Mon planning de la semaine</h2>
                        <label>
                            Semaine du
                            <input
                                type="date"
                                value={week}
                                onChange={(event) =>
                                    event.target.value &&
                                    router.get(route('dashboard.teaching.index'), { week: event.target.value, offering: selected?.id })
                                }
                            />
                        </label>
                        {schedule.data.length ? (
                            <ul>
                                {schedule.data.map((session) => (
                                    <li key={session.id}>
                                        <Link href={route('dashboard.teaching.index', { offering: session.offering_id, week })}>
                                            {session.course}
                                        </Link>{' '}
                                        · {dateTime(session.starts_at)} → {dateTime(session.ends_at)} · {session.group ?? 'Public commun'} ·{' '}
                                        {session.room || 'Salle à préciser'} ·{' '}
                                        {session.status === 'rescheduled' ? 'Reportée' : session.status === 'cancelled' ? 'Annulée' : 'Publiée'}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p>Aucune séance pour cette semaine.</p>
                        )}
                        <Pagination value={schedule} />
                    </section>
                )}
                {selected && (
                    <>
                        <section className="portal-panel">
                            <Context offer={selected} />
                            {canPublish && (
                                <Link className="admin-secondary" href={route('dashboard.teaching.assessments.index', { offering: selected.id })}>
                                    Évaluations
                                </Link>
                            )}
                            <Link className="admin-secondary" href={route('dashboard.teaching.learning.index', { offering: selected.id })}>
                                Ressources pédagogiques
                            </Link>
                            {canPublish && (
                                <button
                                    className="admin-primary"
                                    onClick={() =>
                                        setModal({
                                            title: 'Publier un lien pédagogique',
                                            description: 'Le lien sera disponible aux étudiants autorisés de cette offre.',
                                            action: route('dashboard.teaching.link', selected.id),
                                            fields: [
                                                { name: 'title', label: 'Intitulé', required: true },
                                                { name: 'url', label: 'Adresse du lien (https ou http)', type: 'url', required: true },
                                            ],
                                        })
                                    }
                                >
                                    Publier un lien
                                </button>
                            )}
                        </section>
                        <Activity students={students} sessions={sessions} resources={resources} />
                    </>
                )}
            </main>
        </Dashboard>
    );
}
