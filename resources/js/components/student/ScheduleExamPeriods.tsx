import { dateLabel } from '@/lib/scheduleDates';
import type { PortalProps } from './types';

export default function ScheduleExamPeriods({ events = [], day }: { events?: PortalProps['calendar_events']; day?: string }) {
    const visibleEvents = day ? events.filter((event) => event.start_date <= day && day <= event.end_date) : events;

    if (!visibleEvents.length) return null;

    return (
        <div className="student-schedule-exams" role="region" aria-label="Examens et rattrapages">
            {visibleEvents.map((event) => (
                <article key={event.id}>
                    <small>{event.category_label}</small>
                    <h3>{event.title}</h3>
                    <p>
                        {event.start_date === event.end_date
                            ? dateLabel(event.start_date)
                            : `Du ${dateLabel(event.start_date)} au ${dateLabel(event.end_date)}`}
                    </p>
                </article>
            ))}
        </div>
    );
}
