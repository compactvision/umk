import AdminModal from '@/components/admin/AdminModal';
import PageHeading from '@/components/admin/PageHeading';
import Dashboard from '@/components/layouts/Dashboard/Dashboard';
import { addDays, dateLabel, localDate } from '@/lib/scheduleDates';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, Download, Pencil, Plus } from 'lucide-react';
import { useState } from 'react';
import '../../../../css/dashboard/academic-calendar.css';

type Year = { id: number; title: string; start_date: string; end_date: string };
type CalendarEvent = { id: number; title: string; category: string; start_date: string; end_date: string };
type Semester = { id: number; number: number; start_date: string; end_date: string };
type Props = { years: Year[]; year: Year | null; events: CalendarEvent[]; semesters: Semester[]; categories: Record<string, string> };

const days = ['Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.', 'Dim.'];
const monthLabel = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric', timeZone: 'UTC' });
const monthDate = (month: string) => new Date(`${month}-01T12:00:00Z`);

function moveMonth(month: string, step: number) {
    const date = monthDate(month);
    date.setUTCMonth(date.getUTCMonth() + step);
    return date.toISOString().slice(0, 7);
}

function EventForm({
    year,
    categories,
    day,
    event,
    close,
}: {
    year: Year;
    categories: Props['categories'];
    day: string;
    event?: CalendarEvent;
    close: () => void;
}) {
    const form = useForm({
        title: event?.title ?? '',
        category: event?.category ?? 'exam',
        start_date: event?.start_date ?? day,
        end_date: event?.end_date ?? day,
    });
    return (
        <AdminModal
            title={event ? 'Modifier l’événement' : 'Ajouter un événement'}
            description={`Calendrier commun de l’année ${year.title}`}
            formId="academic-calendar-event"
            submitLabel="Enregistrer"
            busy={form.processing}
            errors={form.errors}
            onClose={close}
        >
            <form
                id="academic-calendar-event"
                className="admin-modal-form"
                onSubmit={(submitEvent) => {
                    submitEvent.preventDefault();
                    const options = { preserveScroll: true, onSuccess: close };
                    if (event) form.put(route('dashboard.admin.academic-years.calendar.update', [year.id, event.id]), options);
                    else form.post(route('dashboard.admin.academic-years.calendar.store', year.id), options);
                }}
            >
                <label className="admin-field">
                    Intitulé *
                    <input required maxLength={160} value={form.data.title} onChange={(e) => form.setData('title', e.target.value)} />
                </label>
                <label className="admin-field">
                    Type *
                    <select value={form.data.category} onChange={(e) => form.setData('category', e.target.value)}>
                        {Object.entries(categories).map(([key, label]) => (
                            <option key={key} value={key}>
                                {label}
                            </option>
                        ))}
                    </select>
                </label>
                <label className="admin-field">
                    Date de début *
                    <input
                        type="date"
                        required
                        min={year.start_date}
                        max={year.end_date}
                        value={form.data.start_date}
                        onChange={(e) => {
                            const start_date = e.target.value;
                            form.setData((previous) => ({
                                ...previous,
                                start_date,
                                end_date: previous.end_date < start_date ? start_date : previous.end_date,
                            }));
                        }}
                    />
                </label>
                <label className="admin-field">
                    Date de fin incluse *
                    <input
                        type="date"
                        required
                        min={form.data.start_date}
                        max={year.end_date}
                        value={form.data.end_date}
                        onChange={(e) => form.setData('end_date', e.target.value)}
                    />
                </label>
            </form>
        </AdminModal>
    );
}

function YearCalendar({
    year,
    events,
    semesters,
    categories,
}: {
    year: Year;
    events: CalendarEvent[];
    semesters: Semester[];
    categories: Props['categories'];
}) {
    const today = localDate(new Date().toISOString());
    const [month, setMonth] = useState(() => (today >= year.start_date && today <= year.end_date ? today : year.start_date).slice(0, 7));
    const [editor, setEditor] = useState<{ day: string; event?: CalendarEvent } | null>(null);
    const first = `${month}-01`;
    const next = `${moveMonth(month, 1)}-01`;
    const offset = (monthDate(month).getUTCDay() + 6) % 7;
    const visibleEvents = events.filter((event) => event.start_date < next && event.end_date >= first);
    const slots = Array.from({ length: Math.ceil((offset + Number(addDays(next, -1).slice(8))) / 7) * 7 }, (_, index) =>
        addDays(first, index - offset),
    );

    return (
        <section className="ac-calendar" aria-label="Calendrier mensuel">
            <div className="ac-toolbar">
                <button
                    type="button"
                    className="admin-secondary"
                    aria-label="Mois précédent"
                    disabled={month <= year.start_date.slice(0, 7)}
                    onClick={() => setMonth(moveMonth(month, -1))}
                >
                    <ChevronLeft size={18} />
                </button>
                <h2 aria-live="polite">{monthLabel.format(monthDate(month))}</h2>
                <button
                    type="button"
                    className="admin-secondary"
                    aria-label="Mois suivant"
                    disabled={month >= year.end_date.slice(0, 7)}
                    onClick={() => setMonth(moveMonth(month, 1))}
                >
                    <ChevronRight size={18} />
                </button>
            </div>
            <div className="ac-grid">
                {days.map((day) => (
                    <span key={day} className="ac-weekday">
                        {day}
                    </span>
                ))}
                {slots.map((day) => {
                    const inMonth = day >= first && day < next;
                    const matching = inMonth ? visibleEvents.filter((event) => event.start_date <= day && event.end_date >= day) : [];
                    const semester = inMonth && semesters.find((period) => period.start_date <= day && period.end_date >= day);
                    return (
                        <div key={day} className={`ac-day${day === today ? 'ac-today' : ''}${semester ? 'ac-course-day' : ''}`}>
                            {inMonth && (
                                <>
                                    <button
                                        type="button"
                                        className="ac-day-number"
                                        aria-label={`Ajouter un événement le ${dateLabel(day)}${semester ? `, période de cours du semestre ${semester.number}` : ''}`}
                                        disabled={day < year.start_date || day > year.end_date}
                                        onClick={() => setEditor({ day })}
                                    >
                                        {Number(day.slice(8))}
                                    </button>
                                    {matching.map((event) => (
                                        <button
                                            type="button"
                                            key={event.id}
                                            className="ac-event"
                                            data-category={event.category}
                                            title={event.title}
                                            aria-label={`${event.title}, ${dateLabel(day)}`}
                                            onClick={() => setEditor({ day, event })}
                                        >
                                            {event.title}
                                        </button>
                                    ))}
                                </>
                            )}
                        </div>
                    );
                })}
            </div>
            <div className="ac-agenda">
                <div className="ac-toolbar">
                    <h3>Événements du mois</h3>
                    <button
                        type="button"
                        className="admin-primary"
                        onClick={() =>
                            setEditor({
                                day:
                                    today >= first && today < next && today >= year.start_date && today <= year.end_date
                                        ? today
                                        : first < year.start_date
                                          ? year.start_date
                                          : first,
                            })
                        }
                    >
                        <Plus size={17} /> Ajouter un événement
                    </button>
                </div>
                {visibleEvents.length === 0 && <p>Aucun événement ce mois-ci.</p>}
                {visibleEvents.map((event) => (
                    <div key={event.id} className="ac-agenda-item">
                        <div>
                            <span>{categories[event.category]}</span>
                            <strong>{event.title}</strong>
                            <p>
                                {dateLabel(event.start_date)}
                                {event.end_date !== event.start_date && ` au ${dateLabel(event.end_date)}`}
                            </p>
                        </div>
                        <button type="button" className="admin-secondary" onClick={() => setEditor({ day: event.start_date, event })}>
                            <Pencil size={15} /> Modifier
                        </button>
                    </div>
                ))}
            </div>
            {editor && <EventForm year={year} categories={categories} day={editor.day} event={editor.event} close={() => setEditor(null)} />}
        </section>
    );
}

export default function Calendar({ years, year, events, semesters, categories }: Props) {
    return (
        <Dashboard hideAppsNavigation>
            <Head title="Calendrier académique" />
            <div className="ac-page">
                <PageHeading title="Calendrier académique" description="Les dates communes à toute l’université." />
                {year ? (
                    <>
                        <div className="ac-controls">
                            <label className="admin-field">
                                Année académique
                                <select
                                    value={year.id}
                                    onChange={(e) =>
                                        router.get(route('dashboard.admin.academic-years.calendar.index'), { academic_year_id: e.target.value })
                                    }
                                >
                                    {years.map((item) => (
                                        <option key={item.id} value={item.id}>
                                            {item.title}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <a className="admin-secondary" href={route('dashboard.admin.academic-years.calendar.export', year.id)}>
                                <Download size={17} /> Exporter l’année (.ics)
                            </a>
                        </div>
                        <section className="ac-periods" aria-labelledby="ac-periods-title">
                            <div className="ac-toolbar">
                                <h2 id="ac-periods-title">Périodes de cours</h2>
                                <Link href={route('dashboard.admin.academic-years.semesters.index', { academic_year_id: year.id })}>
                                    Gérer les semestres
                                </Link>
                            </div>
                            <div className="ac-period-grid">
                                {[1, 2].map((number) => {
                                    const semester = semesters.find((period) => period.number === number);
                                    return (
                                        <div key={number}>
                                            <strong>Semestre {number}</strong>
                                            <p>
                                                {semester
                                                    ? `Du ${dateLabel(semester.start_date)} au ${dateLabel(semester.end_date)}`
                                                    : 'Période à définir'}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                        <ul className="ac-legend" aria-label="Légende du calendrier">
                            {Object.entries({ course: 'Cours', ...categories }).map(([key, label]) => (
                                <li key={key}>
                                    <span className="ac-key" data-category={key} /> {label}
                                </li>
                            ))}
                        </ul>
                        <YearCalendar key={year.id} year={year} events={events} semesters={semesters} categories={categories} />
                    </>
                ) : (
                    <p>
                        Créez une année académique pour commencer.{' '}
                        <Link href={route('dashboard.admin.academic-years.index')}>Gérer les années académiques</Link>
                    </p>
                )}
            </div>
        </Dashboard>
    );
}
