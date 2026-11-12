import Pagination from '@/components/admin/Pagination';
import Dashboard from '@/components/layouts/Dashboard/Dashboard';
import { dateLabel, localDate, time } from '@/lib/scheduleDates';
import { Head, Link } from '@inertiajs/react';
import '../../../../css/student-portal.css';

type Slot = { starts_at?: string; ends_at?: string; room?: string };
type Event = {
    id: number;
    action: string;
    reason: string | null;
    date: string;
    actor: string | null;
    changes: { before?: Slot; after?: Slot } | null;
};
const labels: Record<string, string> = {
    session_created: 'Séance créée',
    session_updated: 'Séance modifiée',
    session_validate: 'Séance validée',
    session_publish: 'Séance publiée',
    session_reschedule: 'Séance reportée',
    session_cancel: 'Séance annulée',
    attendance_closed: 'Appel clôturé',
    attendance_recorded: 'Appel enregistré',
    academic_publication_changed: 'Publication modifiée',
};
const slot = (value: Slot) =>
    value.starts_at && value.ends_at
        ? `${dateLabel(localDate(value.starts_at))} · ${time(value.starts_at)}–${time(value.ends_at)} · ${value.room || 'Salle à préciser'}`
        : null;
export default function History({
    session,
    events,
}: {
    session: Slot & { id: number; course: string; replaces_session_id: number | null; successor_id: number | null };
    events: { data: Event[] };
}) {
    return (
        <Dashboard hideAppsNavigation>
            <Head title="Historique de séance" />
            <main className="student-portal">
                <header className="directory-heading">
                    <div>
                        <h1>{session.course}</h1>
                        <p>{slot(session)}</p>
                    </div>
                    <Link href={route('dashboard.admin.schedule.index')}>Retour au calendrier</Link>
                </header>
                <section className="portal-panel">
                    <h2>Historique de la séance</h2>
                    {session.replaces_session_id && (
                        <Link href={route('dashboard.admin.schedule.history', session.replaces_session_id)}>Séance d’origine</Link>
                    )}
                    {session.successor_id && (
                        <Link href={route('dashboard.admin.schedule.history', session.successor_id)}>Séance de remplacement</Link>
                    )}
                    {!events.data.length && <p>Aucun événement d’audit disponible pour cette séance.</p>}
                    {events.data.map((event) => (
                        <article key={event.id}>
                            <h3>{labels[event.action] ?? event.action}</h3>
                            <p>
                                {dateLabel(localDate(event.date))} à {time(event.date)} · {event.actor ?? 'Système'}
                            </p>
                            {event.reason && <p>{event.reason}</p>}
                            {event.changes?.before && <p>Créneau précédent · {slot(event.changes.before)}</p>}
                            {event.changes?.after && <p>Créneau enregistré · {slot(event.changes.after)}</p>}
                        </article>
                    ))}
                    <Pagination value={events} />
                </section>
            </main>
        </Dashboard>
    );
}
