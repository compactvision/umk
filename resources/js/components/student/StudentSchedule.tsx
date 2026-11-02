import SessionCalendar, { type CalendarSession } from '@/components/teaching/SessionCalendar';
import { addDays, dateLabel, localDate, time, zone } from '@/lib/scheduleDates';
import { router } from '@inertiajs/react';
import * as Dialog from '@radix-ui/react-dialog';
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, MapPin, UserRound, X } from 'lucide-react';
import { useState } from 'react';
import type { Academic, PortalProps } from './types';

export default function StudentSchedule({
    sessions,
    week,
    academic,
    promotion,
    courseId,
}: {
    promotion: Pick<Academic, 'level' | 'faculty' | 'year' | 'group'>;
    courseId?: number;
    sessions: PortalProps['sessions'];
    week: string;
    academic: number;
}) {
    const today = localDate(new Date().toISOString());
    const [view, setView] = useState<'week' | 'day'>('week');
    const [selectedDay, setSelectedDay] = useState(today >= week && today <= addDays(week, 6) ? today : week);
    const [hourHeight, setHourHeight] = useState(72);
    const [date, setDate] = useState(week);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const selected = sessions.find((session) => session.id === selectedId);
    const calendarSessions: CalendarSession[] = sessions.map((session) => ({ ...session, teacher: session.teacher ?? null, is_published: true }));
    const navigate = (day: string) =>
        router.get(courseId ? `/dashboard/student/courses/${courseId}/sessions` : '/dashboard/student/schedule', { academic, week: day });
    return (
        <div className="student-schedule">
            <header className="student-schedule-heading">
                <div>
                    <h1>Horaire · {promotion.level}</h1>
                    <p>
                        {promotion.faculty}
                        {promotion.group ? ` · ${promotion.group}` : ''} · {promotion.year}
                    </p>
                    <small>Heure de Kinshasa (UTC+1)</small>
                </div>
                <span>
                    <CalendarDays size={18} />
                    {sessions.length} séance{sessions.length > 1 ? 's' : ''}
                </span>
            </header>
            <div className="schedule-week-navigation">
                <button className="admin-secondary" aria-label="Semaine précédente" onClick={() => navigate(addDays(week, -7))}>
                    <ChevronLeft size={18} />
                </button>
                <strong>
                    {dateLabel(week)} — {dateLabel(addDays(week, 6))}
                </strong>
                <button className="admin-secondary" aria-label="Semaine suivante" onClick={() => navigate(addDays(week, 7))}>
                    <ChevronRight size={18} />
                </button>
            </div>
            <div className="calendar-toolbar">
                <div className="calendar-view-switch" aria-label="Vue du calendrier">
                    <button className={view === 'week' ? 'is-active' : ''} aria-pressed={view === 'week'} onClick={() => setView('week')}>
                        Semaine
                    </button>
                    <button className={view === 'day' ? 'is-active' : ''} aria-pressed={view === 'day'} onClick={() => setView('day')}>
                        Jour
                    </button>
                </div>
                <button className="admin-secondary" onClick={() => navigate(today)}>
                    Aujourd’hui
                </button>
                <form
                    className="student-schedule-date"
                    onSubmit={(event) => {
                        event.preventDefault();
                        navigate(date);
                    }}
                >
                    <label>
                        <span className="sr-only">Choisir une semaine</span>
                        <input type="date" required value={date} onChange={(event) => setDate(event.target.value)} />
                    </label>
                    <button className="admin-secondary" type="submit">
                        Afficher
                    </button>
                </form>
                <label className="calendar-zoom">
                    Affichage
                    <select value={hourHeight} onChange={(event) => setHourHeight(Number(event.target.value))}>
                        <option value={56}>Compact</option>
                        <option value={72}>Confort</option>
                        <option value={96}>Détaillé</option>
                    </select>
                </label>
            </div>
            {view === 'day' && (
                <div className="calendar-day-picker" aria-label="Choisir un jour">
                    {Array.from({ length: 7 }, (_, index) => addDays(week, index)).map((day) => (
                        <button
                            key={day}
                            className={selectedDay === day ? 'is-active' : ''}
                            aria-pressed={selectedDay === day}
                            onClick={() => setSelectedDay(day)}
                        >
                            {new Date(`${day}T12:00:00Z`).toLocaleDateString('fr-FR', { timeZone: zone, weekday: 'short', day: 'numeric' })}
                        </button>
                    ))}
                </div>
            )}
            {!sessions.length && (
                <p role="status" className="student-schedule-empty">
                    Aucun cours publié pour cette semaine. Vous pouvez consulter les autres semaines.
                </p>
            )}
            <SessionCalendar
                sessions={calendarSessions}
                week={week}
                selectedDay={selectedDay}
                view={view}
                today={today}
                hourHeight={hourHeight}
                onSession={setSelectedId}
            />
            <Dialog.Root
                open={Boolean(selected)}
                onOpenChange={(open) => {
                    if (!open) setSelectedId(null);
                }}
            >
                <Dialog.Portal>
                    <Dialog.Overlay className="student-schedule-overlay" />
                    <Dialog.Content className="student-schedule-dialog">
                        <Dialog.Close className="student-schedule-close" aria-label="Fermer les détails">
                            <X size={20} />
                        </Dialog.Close>
                        <span className="student-schedule-eyebrow">MON EMPLOI DU TEMPS</span>
                        <Dialog.Title>{selected?.course}</Dialog.Title>
                        <Dialog.Description>{selected && dateLabel(localDate(selected.starts_at))}</Dialog.Description>
                        {selected && (
                            <div className="student-schedule-details">
                                <p>
                                    <Clock3 size={20} />
                                    {time(selected.starts_at)} — {time(selected.ends_at)} · Kinshasa
                                </p>
                                <p>
                                    <MapPin size={20} />
                                    {selected.room}
                                </p>
                                <p>
                                    <UserRound size={20} />
                                    {selected.teacher || 'Enseignant à confirmer'}
                                </p>
                            </div>
                        )}
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>
        </div>
    );
}
