import Pagination from '@/components/admin/Pagination';
import { Link } from '@inertiajs/react';
import { dateTime, states, type Offering, type Page, type Resource, type Session, type Student } from './types';

export function Context({ offer }: { offer: Offering }) {
    return (
        <>
            <h2>{offer.title}</h2>
            <p>
                {offer.faculty} · {offer.level} · {offer.year} · {states[offer.status]}
            </p>
            <p>
                {offer.program
                    ? `${offer.program} · ${offer.version} · UE ${offer.unit} · EC ${offer.code || offer.title}`
                    : 'Offre historique par niveau'}
            </p>
            <p>
                {offer.semester || 'Période non renseignée'} {offer.starts_on && ` · du ${offer.starts_on} au ${offer.ends_on}`} ·{' '}
                {offer.group || 'Tous les groupes du périmètre'} {offer.promotion && ` · ${offer.promotion}`}{' '}
                {offer.department && ` · ${offer.department}`}
            </p>
            <p>
                Responsable : {offer.teacher || 'À affecter'} {offer.assistant && ` · Assistant principal : ${offer.assistant}`}
            </p>
            {offer.item_id && (
                <p>
                    {offer.optional ? 'Matière optionnelle' : 'Matière obligatoire'} · {offer.credits ?? '—'} crédits prévus · Coefficient :{' '}
                    {offer.coefficient ?? '—'}
                </p>
            )}
            {offer.prerequisite && <p>Prérequis : UE {offer.prerequisite}</p>}
        </>
    );
}

export function Activity({
    students,
    sessions,
    resources,
}: {
    students: Page<Student> | null;
    sessions: Page<Session> | null;
    resources: Page<Resource> | null;
}) {
    return (
        <>
            {students && (
                <section className="portal-panel">
                    <h3>Étudiants du public actuel ({students.total})</h3>
                    {students.data.length ? (
                        <ul>
                            {students.data.map((student) => (
                                <li key={student.id}>
                                    {student.name} · {student.matricule || 'Matricule non renseigné'}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>Aucun étudiant dans ce public.</p>
                    )}
                    <Pagination value={students} />
                </section>
            )}
            {sessions && (
                <section className="portal-panel">
                    <h3>Séances ({sessions.total})</h3>
                    {sessions.data.length ? (
                        <ul>
                            {sessions.data.map((session) => (
                                <li key={session.id}>
                                    {dateTime(session.starts_at)} — {dateTime(session.ends_at)} · {session.room || 'Sans salle'} ·{' '}
                                    {session.cancelled_at
                                        ? session.successor
                                            ? 'Reportée'
                                            : 'Annulée'
                                        : session.is_published
                                          ? 'Publiée'
                                          : 'Brouillon'}{' '}
                                    {session.successor && `→ ${dateTime(session.successor.starts_at)}`}{' '}
                                    {session.attendance_url && <Link href={session.attendance_url}>Faire l’appel</Link>}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>Aucune séance planifiée.</p>
                    )}
                    <Pagination value={sessions} />
                </section>
            )}
            {resources && (
                <section className="portal-panel">
                    <h3>Ressources de l’offre ({resources.total})</h3>
                    {resources.data.length ? (
                        <ul>
                            {resources.data.map((resource) => (
                                <li key={resource.id}>
                                    {resource.title} · {resource.is_published ? 'Publiée' : 'Brouillon'}{' '}
                                    {resource.download_url && <a href={resource.download_url}>Télécharger</a>}
                                    {resource.url && /^https?:\/\//i.test(resource.url) && (
                                        <a href={resource.url} target="_blank" rel="noreferrer">
                                            Ouvrir le lien
                                        </a>
                                    )}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>Aucune ressource commune.</p>
                    )}
                    <Pagination value={resources} />
                </section>
            )}
        </>
    );
}
