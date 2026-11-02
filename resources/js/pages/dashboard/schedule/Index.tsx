import AdminModal from '@/components/admin/AdminModal';
import DeleteConfirmation from '@/components/admin/DeleteConfirmation';
import PageHeading from '@/components/admin/PageHeading';
import Dashboard from '@/components/layouts/Dashboard/Dashboard';
import SemesterManager, { type Semester } from '@/components/teaching/SemesterManager';
import SessionCalendar from '@/components/teaching/SessionCalendar';
import { professorName, type Assignment, type Year } from '@/components/teaching/types';
import { recurringDates, slotRange } from '@/lib/scheduleCalendar';
import { addDays, dateLabel, localDate, localInput, time, zone } from '@/lib/scheduleDates';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, MapPin, Plus, Trash2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import '../../../../css/dashboard/schedule.css';
import '../../../../css/dashboard/teaching.css';

type Session = {
    id: number;
    academic_offering_id: number;
    starts_at: string;
    ends_at: string;
    room: string;
    is_published: boolean;
    offering: Assignment;
};
type Props = {
    filters: { week: string; level_id?: number; academic_year_id?: number; semester?: number };
    levels: { id: number; title: string; faculty: { name: string } }[];
    years: Year[];
    offerings: Assignment[];
    semesters: Semester[];
    sessions: Session[];
    flash?: { success?: string };
};
const offeringLabel = (item: Assignment) =>
    `${item.course?.title} · ${item.level?.faculty.name} / ${item.level?.title} · ${item.academic_year.title} · ${item.group?.intake?.name ?? 'Tous les groupes'}`;

function SessionForm({
    offerings,
    semesters,
    session,
    week,
    slot,
    onClose,
}: {
    offerings: Assignment[];
    semesters: Semester[];
    session: Session | null;
    week: string;
    slot: { day: string; minute: number } | null;
    onClose: () => void;
}) {
    const [mode, setMode] = useState<'single' | 'weekly' | 'semester'>(session ? 'single' : slot ? 'weekly' : 'semester');
    const [level, setLevel] = useState(session?.offering.level?.id ? String(session.offering.level.id) : '');
    const [year, setYear] = useState(String(session?.offering.academic_year_id ?? offerings[0]?.academic_year_id ?? ''));
    const levels = [...new Map(offerings.filter((item) => item.level).map((item) => [item.level!.id, item.level!])).values()];
    const years = [...new Map(offerings.map((item) => [item.academic_year.id, item.academic_year])).values()];
    const defaultRange = slotRange(slot?.day ?? week, slot?.minute ?? 480);
    const form = useForm({
        academic_offering_id: session ? String(session.academic_offering_id) : '',
        starts_at: session ? localInput(session.starts_at) : defaultRange.starts_at,
        ends_at: session ? localInput(session.ends_at) : defaultRange.ends_at,
        room: session?.room ?? '',
        is_published: session?.is_published ?? false,
        repeat_count: 1,
        semester: '',
        slots: [
            {
                weekday: new Date(`${slot?.day ?? week}T12:00:00Z`).getUTCDay() || 7,
                start_time: defaultRange.starts_at.slice(11),
                end_time: defaultRange.ends_at.slice(11),
                room: '',
            },
        ],
    });
    const selectedSemester = semesters.find((period) => String(period.academic_year_id) === year && String(period.number) === form.data.semester);
    const selected = offerings.find((item) => String(item.id) === form.data.academic_offering_id);
    const filtered = offerings.filter(
        (item) =>
            (!level || String(item.level?.id) === level) &&
            (!year || String(item.academic_year_id) === year) &&
            (!form.data.semester || String(item.course?.semester) === form.data.semester),
    );
    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        form.transform((data) =>
            mode === 'semester'
                ? {
                      academic_offering_id: data.academic_offering_id,
                      semester_id: selectedSemester?.id ?? '',
                      slots: data.slots,
                      is_published: data.is_published,
                  }
                : {
                      academic_offering_id: data.academic_offering_id,
                      starts_at: data.starts_at,
                      ends_at: data.ends_at,
                      room: data.room,
                      is_published: data.is_published,
                      repeat_count: data.repeat_count,
                  },
        );
        const options = { preserveScroll: true, onSuccess: onClose };
        if (session) form.put(route('dashboard.admin.schedule.update', session.id), options);
        else form.post(route(mode === 'semester' ? 'dashboard.admin.schedule.semester' : 'dashboard.admin.schedule.store'), options);
    };
    return (
        <AdminModal
            title={session ? 'Modifier la séance' : 'Planifier un cours'}
            description="Dates et heures de Kinshasa (UTC+1). Les conflits sont vérifiés avant l’enregistrement."
            formId="schedule-form"
            submitLabel={mode === 'semester' ? 'Créer l’horaire du semestre' : 'Enregistrer'}
            onClose={onClose}
            busy={form.processing}
            errors={form.errors}
        >
            <form id="schedule-form" className="admin-modal-form" onSubmit={submit}>
                {!session && (
                    <label>
                        Type d’horaire
                        <select
                            value={mode}
                            onChange={(event) => {
                                setMode(event.target.value as 'single' | 'weekly' | 'semester');
                                form.setData('repeat_count', 1);
                            }}
                        >
                            <option value="semester">Chaque semaine, pendant un semestre</option>
                            <option value="weekly">Chaque semaine, pendant un nombre de semaines</option>
                            <option value="single">Une seule séance</option>
                        </select>
                    </label>
                )}
                <label>
                    Filtrer par niveau
                    <select
                        value={level}
                        onChange={(e) => {
                            setLevel(e.target.value);
                            form.setData('academic_offering_id', '');
                        }}
                    >
                        <option value="">Tous les niveaux</option>
                        {levels.map((item) => (
                            <option value={item.id} key={item.id}>
                                {item.faculty.name} · {item.title}
                            </option>
                        ))}
                    </select>
                </label>
                <label>
                    Filtrer par année
                    <select
                        value={year}
                        onChange={(e) => {
                            setYear(e.target.value);
                            form.setData('academic_offering_id', '');
                        }}
                    >
                        <option value="" disabled>
                            Choisir une année
                        </option>
                        {years.map((item) => (
                            <option value={item.id} key={item.id}>
                                {item.title}
                            </option>
                        ))}
                    </select>
                </label>
                {!session && (
                    <label>
                        Semestre {mode === 'semester' && '*'}
                        <select
                            required={mode === 'semester'}
                            value={form.data.semester}
                            onChange={(event) => {
                                form.setData('semester', event.target.value);
                                form.setData('academic_offering_id', '');
                            }}
                        >
                            <option value="">{mode === 'semester' ? 'Choisir le semestre' : 'Tous les semestres'}</option>
                            <option
                                value="1"
                                disabled={
                                    mode === 'semester' &&
                                    !semesters.some((period) => String(period.academic_year_id) === year && period.number === 1)
                                }
                            >
                                1er semestre
                            </option>
                            <option
                                value="2"
                                disabled={
                                    mode === 'semester' &&
                                    !semesters.some((period) => String(period.academic_year_id) === year && period.number === 2)
                                }
                            >
                                2e semestre
                            </option>
                        </select>
                    </label>
                )}
                <label>
                    Enseignement *
                    <select required value={form.data.academic_offering_id} onChange={(e) => form.setData('academic_offering_id', e.target.value)}>
                        <option value="">Choisir un cours affecté à une année</option>
                        {filtered.map((item) => (
                            <option key={item.id} value={item.id}>
                                {offeringLabel(item)}
                            </option>
                        ))}
                    </select>
                </label>
                {selected && (
                    <p className="teaching-help">
                        {selected.professor ? professorName(selected.professor) : 'Enseignant à affecter'} ·{' '}
                        {selected.is_published
                            ? 'Enseignement publié'
                            : 'Enseignement non publié : la séance restera invisible aux étudiants tant que le cours ne sera pas publié.'}
                    </p>
                )}
                {mode === 'semester' ? (
                    <>
                        <div className="schedule-recurrence-preview">
                            {selectedSemester ? (
                                <>
                                    <strong>Période du semestre</strong>
                                    <p>
                                        {dateLabel(selectedSemester.start_date)} — {dateLabel(selectedSemester.end_date)}
                                    </p>
                                    <small>Les dates sont reprises automatiquement depuis l’année académique.</small>
                                </>
                            ) : (
                                <p>Définissez d’abord la période du semestre dans « Les semestres », puis choisissez l’année et le semestre ici.</p>
                            )}
                        </div>
                        <div className="schedule-slots">
                            <header>
                                <strong>Les créneaux de la semaine</strong>
                                <small>Chaque ligne a ses propres heures et sa propre salle.</small>
                            </header>
                            {form.data.slots.map((item, index) => (
                                <fieldset key={index} className="schedule-slot-row">
                                    <legend>Créneau {index + 1}</legend>
                                    <div className="schedule-slot-fields">
                                        <label>
                                            Jour *
                                            <select
                                                required
                                                value={item.weekday}
                                                onChange={(event) =>
                                                    form.setData(
                                                        'slots',
                                                        form.data.slots.map((value, i) =>
                                                            i === index ? { ...value, weekday: Number(event.target.value) } : value,
                                                        ),
                                                    )
                                                }
                                            >
                                                {['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'].map((day, i) => (
                                                    <option key={day} value={i + 1}>
                                                        {day}
                                                    </option>
                                                ))}
                                            </select>
                                        </label>
                                        <label>
                                            De *
                                            <input
                                                required
                                                type="time"
                                                value={item.start_time}
                                                onChange={(event) =>
                                                    form.setData(
                                                        'slots',
                                                        form.data.slots.map((value, i) =>
                                                            i === index ? { ...value, start_time: event.target.value } : value,
                                                        ),
                                                    )
                                                }
                                            />
                                        </label>
                                        <label>
                                            À *
                                            <input
                                                required
                                                type="time"
                                                min={item.start_time}
                                                value={item.end_time}
                                                onChange={(event) =>
                                                    form.setData(
                                                        'slots',
                                                        form.data.slots.map((value, i) =>
                                                            i === index ? { ...value, end_time: event.target.value } : value,
                                                        ),
                                                    )
                                                }
                                            />
                                        </label>
                                        <label>
                                            Salle / lieu *
                                            <input
                                                required
                                                maxLength={180}
                                                value={item.room}
                                                placeholder="Auditoire A"
                                                onChange={(event) =>
                                                    form.setData(
                                                        'slots',
                                                        form.data.slots.map((value, i) =>
                                                            i === index ? { ...value, room: event.target.value } : value,
                                                        ),
                                                    )
                                                }
                                            />
                                        </label>
                                    </div>
                                    {form.data.slots.length > 1 && (
                                        <button
                                            type="button"
                                            className="calendar-delete"
                                            onClick={() =>
                                                form.setData(
                                                    'slots',
                                                    form.data.slots.filter((_, i) => i !== index),
                                                )
                                            }
                                        >
                                            <Trash2 size={14} />
                                            Retirer ce créneau
                                        </button>
                                    )}
                                </fieldset>
                            ))}
                            <button
                                type="button"
                                className="admin-secondary"
                                disabled={form.data.slots.length >= 21}
                                onClick={() => {
                                    const previous = form.data.slots[form.data.slots.length - 1];
                                    form.setData('slots', [...form.data.slots, { ...previous, weekday: (previous.weekday % 7) + 1 }]);
                                }}
                            >
                                <Plus size={15} /> Ajouter un créneau
                            </button>
                        </div>
                        <div className="schedule-recurrence-preview" role="status">
                            <strong>Chaque semaine, pendant le semestre</strong>
                            {form.data.slots.map((item, index) => (
                                <p key={index}>
                                    {['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'][item.weekday - 1]} · {item.start_time}–
                                    {item.end_time}
                                    {item.room ? ` · ${item.room}` : ''}
                                </p>
                            ))}
                            {selectedSemester && (
                                <p>
                                    <strong>
                                        {form.data.slots.reduce(
                                            (count, item) =>
                                                count + recurringDates(selectedSemester.start_date, selectedSemester.end_date, [item.weekday]).length,
                                            0,
                                        )}{' '}
                                        séances seront créées.
                                    </strong>
                                </p>
                            )}
                        </div>
                    </>
                ) : (
                    <>
                        <label>
                            {mode === 'weekly' ? 'Première séance : début *' : 'Début *'}
                            <input
                                required
                                type="datetime-local"
                                value={form.data.starts_at}
                                onChange={(event) => form.setData('starts_at', event.target.value)}
                            />
                        </label>
                        <label>
                            {mode === 'weekly' ? 'Première séance : fin *' : 'Fin *'}
                            <input
                                required
                                type="datetime-local"
                                min={form.data.starts_at}
                                value={form.data.ends_at}
                                onChange={(event) => form.setData('ends_at', event.target.value)}
                            />
                        </label>
                    </>
                )}
                {mode !== 'semester' && (
                    <label>
                        Salle / lieu *
                        <input
                            required
                            maxLength={180}
                            value={form.data.room}
                            onChange={(e) => form.setData('room', e.target.value)}
                            placeholder="Ex. : Auditoire A"
                        />
                    </label>
                )}
                {!session && mode === 'weekly' && (
                    <label>
                        Nombre de semaines *
                        <input
                            required
                            type="number"
                            min={1}
                            max={26}
                            step={1}
                            value={form.data.repeat_count}
                            onChange={(e) => form.setData('repeat_count', Number(e.target.value))}
                        />
                        <small>1 = séance unique. Au-delà, répétition au même créneau chaque semaine.</small>
                    </label>
                )}
                <label className="teaching-checkbox">
                    <input type="checkbox" checked={form.data.is_published} onChange={(e) => form.setData('is_published', e.target.checked)} />{' '}
                    Publier dans l’espace étudiant
                </label>
                <p className="teaching-help">Les brouillons réservent aussi le créneau. Une modification concerne uniquement cette séance.</p>
            </form>
        </AdminModal>
    );
}

export default function ScheduleIndex() {
    const { filters, levels, years, offerings, sessions, semesters, flash } = usePage<Props>().props;
    const [level, setLevel] = useState(String(filters.level_id ?? ''));
    const [semester, setSemester] = useState(String(filters.semester ?? ''));
    const [year, setYear] = useState(String(filters.academic_year_id ?? ''));
    const [week, setWeek] = useState(filters.week);
    const [view, setView] = useState<'week' | 'day'>('week');
    const today = localDate(new Date().toISOString());
    const [selectedDay, setSelectedDay] = useState(today >= filters.week && today <= addDays(filters.week, 6) ? today : filters.week);
    const [hourHeight, setHourHeight] = useState(72);
    const [slot, setSlot] = useState<{ day: string; minute: number } | null>(null);
    const [preview, setPreview] = useState<Session | null>(null);
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<Session | null>(null);
    const [deleting, setDeleting] = useState<Session | null>(null);
    const deletion = useForm({});
    const navigate = (date = week) =>
        router.get(route('dashboard.admin.schedule.index'), {
            week: date,
            level_id: level || undefined,
            academic_year_id: year || undefined,
            semester: semester || undefined,
        });
    const remove = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (deleting)
            deletion.delete(route('dashboard.admin.schedule.destroy', deleting.id), { preserveScroll: true, onSuccess: () => setDeleting(null) });
    };
    return (
        <Dashboard>
            <Head title="Horaires des cours" />
            <div className="teaching-page">
                <PageHeading
                    title="Les horaires des cours."
                    description="Planifiez les séances par niveau, année et groupe. Heure de Kinshasa (UTC+1)."
                    action={
                        <button
                            className="admin-primary"
                            disabled={!offerings.length || !semesters.some((period) => period.academic_year_id === Number(filters.academic_year_id))}
                            onClick={() => {
                                setSlot(null);
                                setEditing(null);
                                setFormOpen(true);
                            }}
                        >
                            <Plus size={17} /> Planifier un cours
                        </button>
                    }
                />
                {flash?.success && (
                    <p className="teaching-feedback" role="status">
                        {flash.success}
                    </p>
                )}
                <form
                    className="teaching-search schedule-filters"
                    onSubmit={(e) => {
                        e.preventDefault();
                        navigate();
                    }}
                >
                    <label>
                        <span>Niveau</span>
                        <select value={level} onChange={(e) => setLevel(e.target.value)}>
                            <option value="">Tous les niveaux</option>
                            {levels.map((item) => (
                                <option key={item.id} value={item.id}>
                                    {item.faculty.name} · {item.title}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label>
                        <span>Année académique</span>
                        <select value={year} onChange={(e) => setYear(e.target.value)}>
                            <option value="" disabled>
                                Choisir une année
                            </option>
                            {years.map((item) => (
                                <option key={item.id} value={item.id}>
                                    {item.title}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label>
                        <span>Semestre</span>
                        <select value={semester} onChange={(event) => setSemester(event.target.value)}>
                            <option value="">Tous les semestres</option>
                            <option value="1">1er semestre</option>
                            <option value="2">2e semestre</option>
                        </select>
                    </label>
                    <label>
                        <span>Semaine du</span>
                        <input type="date" required value={week} onChange={(e) => setWeek(e.target.value)} />
                    </label>
                    <button className="admin-secondary" type="submit">
                        Afficher
                    </button>
                </form>
                <SemesterManager year={years.find((item) => item.id === Number(filters.academic_year_id))} semesters={semesters} />
                <div className="schedule-week-navigation">
                    <button className="admin-secondary" aria-label="Semaine précédente" onClick={() => navigate(addDays(filters.week, -7))}>
                        <ChevronLeft size={18} />
                    </button>
                    <strong>
                        {dateLabel(filters.week)} — {dateLabel(addDays(filters.week, 6))}
                    </strong>
                    <button className="admin-secondary" aria-label="Semaine suivante" onClick={() => navigate(addDays(filters.week, 7))}>
                        <ChevronRight size={18} />
                    </button>
                </div>
                {!offerings.length && (
                    <div className="teaching-profile">
                        <h2>Préparez les enseignements.</h2>
                        <p>Affectez les cours à une année académique depuis l’onglet Cours d’un niveau, puis planifiez les séances ici.</p>
                        <Link className="admin-secondary" href={route('dashboard.admin.levels.index')}>
                            Ouvrir les niveaux
                        </Link>
                    </div>
                )}
                <div className="schedule-summary">
                    <CalendarDays size={20} />
                    <span>
                        {sessions.length} séance(s) cette semaine · {sessions.filter((session) => session.is_published).length} publiée(s)
                    </span>
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
                    <label className="calendar-zoom">
                        Affichage
                        <select value={hourHeight} onChange={(event) => setHourHeight(Number(event.target.value))}>
                            <option value={56}>Compact</option>
                            <option value={72}>Confort</option>
                            <option value={96}>Détaillé</option>
                        </select>
                    </label>
                    <div className="calendar-legend">
                        <span>
                            <i /> Publiée
                        </span>
                        <span>
                            <i className="is-draft" /> Brouillon
                        </span>
                    </div>
                </div>
                {view === 'day' && (
                    <div className="calendar-day-picker" aria-label="Choisir un jour">
                        {Array.from({ length: 7 }, (_, index) => addDays(filters.week, index)).map((day) => (
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
                <p className="calendar-instruction">
                    Cliquez sur un créneau libre pour planifier un cours, ou sur une séance pour consulter ses détails.
                </p>
                <SessionCalendar
                    sessions={sessions.map((session) => ({
                        ...session,
                        course: session.offering.course?.title ?? 'Cours',
                        teacher: session.offering.professor ? professorName(session.offering.professor) : null,
                        level_id: session.offering.level?.id,
                    }))}
                    week={filters.week}
                    selectedDay={selectedDay}
                    view={view}
                    today={today}
                    hourHeight={hourHeight}
                    canCreate={offerings.length > 0 && semesters.some((period) => period.academic_year_id === Number(filters.academic_year_id))}
                    onSlot={(day, minute) => {
                        setSlot({ day, minute });
                        setEditing(null);
                        setFormOpen(true);
                    }}
                    onSession={(id) => setPreview(sessions.find((session) => session.id === id) ?? null)}
                />
            </div>
            {formOpen && (
                <SessionForm
                    offerings={offerings}
                    semesters={semesters}
                    session={editing}
                    slot={slot}
                    week={filters.week}
                    onClose={() => setFormOpen(false)}
                />
            )}
            {preview && (
                <AdminModal
                    title={preview.offering.course?.title ?? 'Séance'}
                    description={`${dateLabel(localDate(preview.starts_at))} · ${time(preview.starts_at)} — ${time(preview.ends_at)}`}
                    formId="session-preview"
                    submitLabel="Modifier la séance"
                    onClose={() => setPreview(null)}
                >
                    <form
                        id="session-preview"
                        onSubmit={(event) => {
                            event.preventDefault();
                            setEditing(preview);
                            setPreview(null);
                            setFormOpen(true);
                        }}
                        className="calendar-preview"
                    >
                        <Link className="admin-secondary" href={route('dashboard.admin.schedule.attendance', preview.id)}>
                            Faire l’appel / voir les présences
                        </Link>
                        <span className={`teaching-status ${preview.is_published ? '' : 'is-inactive'}`}>
                            {preview.is_published ? 'Publiée' : 'Brouillon'}
                        </span>
                        <p>
                            <MapPin size={17} /> {preview.room}
                        </p>
                        <p>{preview.offering.professor ? professorName(preview.offering.professor) : 'Enseignant à affecter'}</p>
                        <p>
                            {preview.offering.level?.faculty.name} · {preview.offering.level?.title}
                        </p>
                        <p>
                            {preview.offering.academic_year.title} · {preview.offering.group?.intake?.name ?? 'Tous les groupes'}
                        </p>
                        <p>
                            <Clock3 size={17} /> Heure de Kinshasa (UTC+1)
                        </p>
                        <button
                            type="button"
                            className="calendar-delete"
                            onClick={() => {
                                deletion.clearErrors();
                                setDeleting(preview);
                                setPreview(null);
                            }}
                        >
                            <Trash2 size={16} /> Supprimer cette séance
                        </button>
                    </form>
                </AdminModal>
            )}
            {deleting && (
                <DeleteConfirmation
                    title="Supprimer cette séance ?"
                    name={deleting.offering.course?.title ?? 'Séance'}
                    detail={`${dateLabel(localDate(deleting.starts_at))} · ${time(deleting.starts_at)} · ${deleting.room}`}
                    explanation="Cette séance sera retirée de l’emploi du temps."
                    hint="Les autres séances du cours sont conservées."
                    busy={deletion.processing}
                    errors={deletion.errors}
                    onClose={() => setDeleting(null)}
                    onConfirm={remove}
                />
            )}
        </Dashboard>
    );
}
