import { layoutDay } from '@/lib/scheduleCalendar';
import { addDays, dateLabel, localParts, time, zone } from '@/lib/scheduleDates';
import { MapPin } from 'lucide-react';
import { useEffect, useState } from 'react';
import '../../../css/dashboard/schedule.css';
export type CalendarSession = {
    id: number;
    course: string;
    teacher: string | null;
    level_id?: number;
    starts_at: string;
    ends_at: string;
    room: string;
    is_published?: boolean;
    status?: string;
};

export default function SessionCalendar({
    sessions,
    week,
    selectedDay,
    view,
    today,
    hourHeight,
    canCreate,
    onSlot,
    onSession,
}: {
    sessions: CalendarSession[];
    week: string;
    selectedDay: string;
    view: 'week' | 'day';
    today: string;
    hourHeight: number;
    canCreate?: boolean | ((day: string) => boolean);
    onSlot?: (day: string, minute: number) => void;
    onSession?: (id: number) => void;
}) {
    const days = view === 'day' ? [selectedDay] : Array.from({ length: 7 }, (_, index) => addDays(week, index));
    const columns = days.map((day) => ({ day, events: layoutDay(sessions, day) }));
    const all = columns.flatMap((column) => column.events);
    const startHour = Math.min(7, ...all.map((event) => Math.floor(event.start / 60)));
    const endHour = Math.max(20, ...all.map((event) => Math.ceil(event.end / 60)));
    const hours = Array.from({ length: endHour - startHour }, (_, index) => startHour + index);
    const height = (endHour - startHour) * hourHeight;
    const gridColumns = `64px ${columns.map((column) => `minmax(${Math.max(view === 'day' ? 280 : 148, ...column.events.map((event) => event.lanes * 106))}px, 1fr)`).join(' ')}`;
    const [clock, setClock] = useState(() => new Date());
    useEffect(() => {
        const timer = window.setInterval(() => setClock(new Date()), 60000);
        return () => window.clearInterval(timer);
    }, []);
    const now = localParts(clock.toISOString());
    const nowMinute = Number(now.hour) * 60 + Number(now.minute);
    const Event = onSession ? 'button' : 'div';
    return (
        <div className="calendar-scroll" role="region" aria-label="Calendrier des cours, heure de Kinshasa" tabIndex={0}>
            <div className="calendar-grid" style={{ gridTemplateColumns: gridColumns }}>
                <div className="calendar-corner">UTC+1</div>
                {columns.map(({ day }) => (
                    <div className={`calendar-column-heading ${day === today ? 'is-today' : ''}`} key={day}>
                        <span>{new Date(`${day}T12:00:00Z`).toLocaleDateString('fr-FR', { timeZone: zone, weekday: 'short' })}</span>
                        <strong>{new Date(`${day}T12:00:00Z`).getUTCDate()}</strong>
                        <small>{new Date(`${day}T12:00:00Z`).toLocaleDateString('fr-FR', { timeZone: zone, month: 'short' })}</small>
                    </div>
                ))}
                <div className="calendar-hour-rail" style={{ height }}>
                    {hours.map((hour) => (
                        <span key={hour} style={{ top: (hour - startHour) * hourHeight }}>
                            {String(hour).padStart(2, '0')}:00
                        </span>
                    ))}
                </div>
                {columns.map(({ day, events }) => (
                    <div
                        className={`calendar-day-column ${day === today ? 'is-today' : ''}`}
                        key={day}
                        style={{ height, backgroundSize: `100% ${hourHeight}px, 100% ${hourHeight / 2}px` }}
                    >
                        {onSlot &&
                            hours.flatMap((hour) =>
                                [0, 30].map((minute) => (
                                    <button
                                        key={`${hour}-${minute}`}
                                        type="button"
                                        className="calendar-slot"
                                        disabled={typeof canCreate === 'function' ? !canCreate(day) : !canCreate}
                                        style={{ top: (hour - startHour + minute / 60) * hourHeight, height: hourHeight / 2 }}
                                        aria-label={`Planifier le ${dateLabel(day)} à ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`}
                                        onClick={() => onSlot(day, hour * 60 + minute)}
                                    >
                                        <span>+</span>
                                    </button>
                                )),
                            )}
                        {events.map((event) => (
                            <Event
                                type={onSession ? 'button' : undefined}
                                key={event.session.id}
                                className={`calendar-event calendar-color-${(event.session.level_id ?? 0) % 5} ${event.session.is_published === false ? 'is-draft' : ''} ${event.end - event.start < 45 ? 'is-short' : ''}`}
                                style={{
                                    top: (event.start / 60 - startHour) * hourHeight + 2,
                                    height: Math.max(20, ((event.end - event.start) / 60) * hourHeight - 4),
                                    left: `calc(${(event.lane / event.lanes) * 100}% + 3px)`,
                                    width: `calc(${100 / event.lanes}% - 6px)`,
                                }}
                                title={`${event.session.status === 'rescheduled' ? 'Reportée · ' : event.session.status === 'cancelled' ? 'Annulée · ' : ''}${event.session.course} · ${time(event.session.starts_at)}–${time(event.session.ends_at)} · ${event.session.room || 'Salle à préciser'}`}
                                aria-label={
                                    onSession
                                        ? [
                                              event.session.course,
                                              dateLabel(day),
                                              `${time(event.session.starts_at)} à ${time(event.session.ends_at)}`,
                                              event.session.room || 'Salle à préciser',
                                              event.session.is_published === undefined ? null : event.session.is_published ? 'publiée' : 'brouillon',
                                          ]
                                              .filter(Boolean)
                                              .join(', ')
                                        : undefined
                                }
                                onClick={onSession ? () => onSession(event.session.id) : undefined}
                            >
                                <span className="calendar-event-time">
                                    {time(event.session.starts_at)} – {time(event.session.ends_at)}
                                    {event.session.is_published === false && <i aria-label="Brouillon" />}
                                </span>
                                <strong>
                                    {event.session.status === 'rescheduled'
                                        ? 'Reportée · '
                                        : event.session.status === 'cancelled'
                                          ? 'Annulée · '
                                          : ''}
                                    {event.session.course}
                                </strong>
                                <span className="calendar-event-room">
                                    <MapPin size={11} /> {event.session.room || 'Salle à préciser'}
                                </span>
                                {event.end - event.start >= 60 && (
                                    <span className="calendar-event-teacher">{event.session.teacher || 'Enseignant à confirmer'}</span>
                                )}
                            </Event>
                        ))}
                        {day === today && nowMinute >= startHour * 60 && nowMinute < endHour * 60 && (
                            <div className="calendar-now" style={{ top: (nowMinute / 60 - startHour) * hourHeight }} aria-label="Heure actuelle" />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
