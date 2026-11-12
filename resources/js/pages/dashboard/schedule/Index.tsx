import AdminModal from '@/components/admin/AdminModal';
import DeleteConfirmation from '@/components/admin/DeleteConfirmation';
import Dashboard from '@/components/layouts/Dashboard/Dashboard';
import SemesterManager, { type Semester } from '@/components/teaching/SemesterManager';
import SessionCalendar from '@/components/teaching/SessionCalendar';
import { professorName, type Assignment, type Year } from '@/components/teaching/types';
import { usePanelFade } from '@/hooks/use-panel-fade';
import { recurringDates, slotRange } from '@/lib/scheduleCalendar';
import { addDays, dateLabel, localDate, localInput, time, zone } from '@/lib/scheduleDates';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, List, MapPin, Plus, SlidersHorizontal, Trash2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import '../../../../css/dashboard/schedule.css';
import '../../../../css/dashboard/teaching.css';
import SessionActions, { sessionLabel, type RoomChoice, type SessionState } from './SessionActions';

type Session = SessionState & { academic_offering_id: number; offering: Assignment };
type Props = {
    filters: {
        week: string;
        level_id?: number;
        academic_year_id?: number;
        semester?: number;
        academic_room_id?: number;
        professor_id?: number;
        class_id?: number;
    };
    levels: { id: number; title: string; faculty: { name: string } }[];
    years: Year[];
    offerings: Assignment[];
    semesters: Semester[];
    sessions: Session[];
    rooms: RoomChoice[];
    canManageRooms: boolean;
    canReviewAbsences: boolean;
    flash?: { success?: string };
};
const offeringLabel = (item: Assignment) =>
    `${item.course?.title} · ${item.level?.faculty.name} / ${item.level?.title} · ${item.academic_year.title} · ${item.department?.name ?? 'Tronc commun'} · ${item.group?.intake?.name ?? 'Tous les groupes'}`;

function SessionForm({
    offerings,
    rooms,
    semesters,
    session,
    week,
    slot,
    onClose,
}: {
    offerings: Assignment[];
    rooms: RoomChoice[];
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
        academic_room_id: String(session?.academic_room_id ?? ''),
        activity_type: session?.activity_type ?? '',
        exclusions: '',
        scope: session?.recurrence_id && new Date(session.starts_at) <= new Date() ? 'semester' : 'session',
        is_published: session?.is_published ?? false,
        repeat_count: 1,
        semester: '',
        slots: [
            {
                weekday: new Date(`${slot?.day ?? week}T12:00:00Z`).getUTCDay() || 7,
                start_time: defaultRange.starts_at.slice(11),
                end_time: defaultRange.ends_at.slice(11),
                room: '',
                academic_room_id: '',
            },
        ],
    });
    const filterSemester = semesters.find((period) => String(period.academic_year_id) === year && String(period.number) === form.data.semester);
    const selected = offerings.find((item) => String(item.id) === form.data.academic_offering_id);
    const selectedSemester = selected?.curriculum_item_id ? selected.academic_semester : filterSemester;
    const selectedPeriod =
        selectedSemester ?? (selected?.starts_on && selected.ends_on ? { start_date: selected.starts_on, end_date: selected.ends_on } : null);
    const filtered = offerings.filter(
        (item) =>
            (!level || String(item.level?.id) === level) &&
            (!year || String(item.academic_year_id) === year) &&
            (!form.data.semester ||
                (form.data.semester === 'custom'
                    ? item.curriculum_item_id && !item.academic_semester
                    : String(item.curriculum_item_id ? item.academic_semester?.number : item.course?.semester) === form.data.semester)),
    );
    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        form.transform((data) =>
            mode === 'semester'
                ? {
                      academic_offering_id: data.academic_offering_id,
                      semester_id: selectedSemester?.id ?? '',
                      slots: data.slots,
                      activity_type: data.activity_type,
                      excluded_dates: data.exclusions.split(/[,\s]+/).filter(Boolean),
                      is_published: data.is_published,
                  }
                : {
                      academic_offering_id: data.academic_offering_id,
                      starts_at: data.starts_at,
                      ends_at: data.ends_at,
                      room: data.room,
                      academic_room_id: data.academic_room_id,
                      activity_type: data.activity_type,
                      excluded_dates: data.exclusions.split(/[,\s]+/).filter(Boolean),
                      is_published: data.is_published,
                      repeat_count: data.repeat_count,
                      scope: session ? data.scope : undefined,
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
                            <option value="custom">Période propre à l’offre</option>
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
                {session?.recurrence_id && (
                    <label>
                        Périmètre de modification
                        <select value={form.data.scope} onChange={(e) => form.setData('scope', e.target.value)}>
                            <option value="session" disabled={session.is_published && new Date(session.starts_at) <= new Date()}>
                                Cette occurrence
                            </option>
                            <option value="semester">Occurrences à venir de cette série</option>
                        </select>
                    </label>
                )}
                <label>
                    Type d’activité
                    <input
                        value={form.data.activity_type}
                        onChange={(e) => form.setData('activity_type', e.target.value)}
                        maxLength={80}
                        placeholder="Cours, TD, atelier…"
                    />
                </label>
                {mode !== 'single' && (
                    <label>
                        Dates à exclure
                        <input
                            value={form.data.exclusions}
                            onChange={(e) => form.setData('exclusions', e.target.value)}
                            placeholder="AAAA-MM-JJ, AAAA-MM-JJ"
                        />
                        <small>Les congés sont déjà exclus des séries.</small>
                    </label>
                )}
                {mode === 'semester' ? (
                    <>
                        <div className="schedule-recurrence-preview">
                            {selectedPeriod ? (
                                <>
                                    <strong>Période du semestre</strong>
                                    <p>
                                        {dateLabel(selectedPeriod.start_date)} — {dateLabel(selectedPeriod.end_date)}
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
                                    <label>
                                        Salle du référentiel
                                        <select
                                            value={item.academic_room_id}
                                            onChange={(e) =>
                                                form.setData(
                                                    'slots',
                                                    form.data.slots.map((row, i) =>
                                                        i === index ? { ...row, academic_room_id: e.target.value } : row,
                                                    ),
                                                )
                                            }
                                        >
                                            <option value="">Salle libre ou à préciser</option>
                                            {rooms
                                                .filter((room) => room.is_active)
                                                .map((room) => (
                                                    <option key={room.id} value={room.id}>
                                                        {room.code} · {room.name} · {room.capacity} places
                                                    </option>
                                                ))}
                                        </select>
                                    </label>
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
                                            Salle / lieu (facultatif)
                                            <input
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
                            {selectedPeriod && (
                                <p>
                                    <strong>
                                        {form.data.slots.reduce(
                                            (count, item) =>
                                                count + recurringDates(selectedPeriod.start_date, selectedPeriod.end_date, [item.weekday]).length,
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
                    <>
                        <label>
                            Salle du référentiel
                            <select value={form.data.academic_room_id} onChange={(e) => form.setData('academic_room_id', e.target.value)}>
                                <option value="">Salle libre ou à préciser</option>
                                {rooms
                                    .filter((room) => room.is_active || room.id === session?.academic_room_id)
                                    .map((room) => (
                                        <option key={room.id} value={room.id}>
                                            {room.code} · {room.name} · {room.capacity} places
                                        </option>
                                    ))}
                            </select>
                        </label>
                        <label>
                            Salle / lieu (facultatif)
                            <input
                                maxLength={180}
                                value={form.data.room}
                                onChange={(e) => form.setData('room', e.target.value)}
                                placeholder="Ex. : Auditoire A"
                            />
                        </label>
                    </>
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
    const { filters, levels, years, offerings, sessions, semesters, rooms, canManageRooms, canReviewAbsences, flash } = usePage<Props>().props;
    const [level, setLevel] = useState(String(filters.level_id ?? ''));
    const [semester, setSemester] = useState(String(filters.semester ?? ''));
    const [year, setYear] = useState(String(filters.academic_year_id ?? ''));
    const [roomFilter, setRoomFilter] = useState(String(filters.academic_room_id ?? ''));
    const [teacherFilter, setTeacherFilter] = useState(String(filters.professor_id ?? ''));
    const [groupFilter, setGroupFilter] = useState(String(filters.class_id ?? ''));
    const [list, setList] = useState(false);
    const [week, setWeek] = useState(filters.week);
    const [view, setView] = useState<'week' | 'day'>('week');
    const today = localDate(new Date().toISOString());
    const [selectedDay, setSelectedDay] = useState(today >= filters.week && today <= addDays(filters.week, 6) ? today : filters.week);
    const schedulePanel = usePanelFade<HTMLDivElement>(list ? 'list' : view === 'day' ? selectedDay : 'week');
    const [hourHeight, setHourHeight] = useState(72);
    const [slot, setSlot] = useState<{ day: string; minute: number } | null>(null);
    const [preview, setPreview] = useState<Session | null>(null);
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<Session | null>(null);
    const [deleting, setDeleting] = useState<Session | null>(null);
    const deletion = useForm({});
    const hasSemester = semesters.some((period) => period.academic_year_id === Number(filters.academic_year_id));
    const canPlan = offerings.length > 0 && hasSemester;
    const publishedCount = sessions.filter((session) => session.is_published).length;
    const sessionsByDay = new Map<string, Session[]>();
    if (list) {
        for (const session of [...sessions].sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime() || a.id - b.id)) {
            const day = localDate(session.starts_at);
            const daySessions = sessionsByDay.get(day) ?? [];
            daySessions.push(session);
            sessionsByDay.set(day, daySessions);
        }
    }
    const navigate = (date = week) =>
        router.get(
            route('dashboard.admin.schedule.index'),
            {
                week: date,
                level_id: level || undefined,
                academic_year_id: year || undefined,
                semester: semester || undefined,
                academic_room_id: roomFilter || undefined,
                professor_id: teacherFilter || undefined,
                class_id: groupFilter || undefined,
            },
            { preserveScroll: true },
        );
    const remove = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (deleting)
            deletion.delete(route('dashboard.admin.schedule.destroy', deleting.id), { preserveScroll: true, onSuccess: () => setDeleting(null) });
    };
    return (
        <Dashboard hideAppsNavigation>
            <Head title="Horaires des cours" />
            <div className="teaching-page schedule-page">
                <header className="schedule-page-heading">
                    <div>
                        <h1>Horaires des cours</h1>
                        <p>Heure de Kinshasa · UTC+1</p>
                    </div>
                    <div className="schedule-heading-actions">
                        {!hasSemester && offerings.length > 0 && <a href="#schedule-semesters">Définir les semestres</a>}
                        <button
                            className="admin-primary schedule-page-action"
                            type="button"
                            disabled={!canPlan}
                            onClick={() => {
                                setSlot(null);
                                setEditing(null);
                                setFormOpen(true);
                            }}
                        >
                            <Plus size={17} aria-hidden="true" /> Planifier un cours
                        </button>
                    </div>
                </header>
                <nav className="schedule-tools" aria-label="Outils de planification">
                    {canManageRooms && <Link href={route('dashboard.admin.schedule.resources')}>Salles et disponibilités</Link>}
                    {canReviewAbsences && <Link href={route('dashboard.admin.schedule.absences')}>Justifications</Link>}
                    <Link href={route('dashboard.admin.schedule.reports')}>Rapports de présence</Link>
                </nav>
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
                    <h2 className="schedule-filters-title">
                        <SlidersHorizontal size={17} aria-hidden="true" /> Filtres du planning
                    </h2>
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
                        Salle
                        <select value={roomFilter} onChange={(e) => setRoomFilter(e.target.value)}>
                            <option value="">Toutes</option>
                            {rooms.map((room) => (
                                <option key={room.id} value={room.id}>
                                    {room.code} · {room.name}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label>
                        Enseignant
                        <select value={teacherFilter} onChange={(e) => setTeacherFilter(e.target.value)}>
                            <option value="">Tous</option>
                            {[...new Map(offerings.filter((o) => o.professor).map((o) => [o.professor!.id, o.professor!])).values()].map((person) => (
                                <option key={person.id} value={person.id}>
                                    {professorName(person)}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label>
                        Groupe
                        <select value={groupFilter} onChange={(e) => setGroupFilter(e.target.value)}>
                            <option value="">Tous</option>
                            {[
                                ...new Map(
                                    offerings.filter((o) => o.class_id).map((o) => [o.class_id!, o.group?.intake?.name ?? `Groupe ${o.class_id}`]),
                                ).entries(),
                            ].map(([id, name]) => (
                                <option key={id} value={id}>
                                    {name}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label>
                        <span>Semaine du</span>
                        <input type="date" required value={week} onChange={(e) => setWeek(e.target.value)} />
                    </label>
                    <button className="admin-primary schedule-page-action" type="submit">
                        Appliquer les filtres
                    </button>
                </form>
                {!offerings.length && (
                    <div className="teaching-profile">
                        <h2>Préparez les enseignements.</h2>
                        <p>Affectez les cours à une année académique depuis l’onglet Cours d’un niveau, puis planifiez les séances ici.</p>
                        <Link className="admin-secondary" href={route('dashboard.admin.levels.index')}>
                            Ouvrir les niveaux
                        </Link>
                    </div>
                )}
                <section className="schedule-calendar-panel" aria-label="Planning des séances">
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
                    <div className="schedule-summary" data-dashboard-panel="">
                        <CalendarDays size={20} />
                        <span>
                            {sessions.length} {sessions.length === 1 ? 'séance' : 'séances'} cette semaine
                        </span>
                        <span className="schedule-published-count">
                            {publishedCount} {publishedCount === 1 ? 'publiée' : 'publiées'}
                        </span>
                    </div>
                    <div className="calendar-toolbar">
                        <button className="admin-secondary schedule-page-action" type="button" aria-pressed={list} onClick={() => setList(!list)}>
                            {list ? <CalendarDays size={16} aria-hidden="true" /> : <List size={16} aria-hidden="true" />}
                            {list ? 'Vue calendrier' : 'Vue liste'}
                        </button>
                        {!list && (
                            <div className="calendar-view-switch" role="group" aria-label="Vue du calendrier">
                                <button className={view === 'week' ? 'is-active' : ''} aria-pressed={view === 'week'} onClick={() => setView('week')}>
                                    Semaine
                                </button>
                                <button className={view === 'day' ? 'is-active' : ''} aria-pressed={view === 'day'} onClick={() => setView('day')}>
                                    Jour
                                </button>
                            </div>
                        )}
                        <button className="admin-secondary schedule-page-action" onClick={() => navigate(today)}>
                            Aujourd’hui
                        </button>
                        {!list && (
                            <>
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
                            </>
                        )}
                    </div>
                    {!list && view === 'day' && (
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
                    {!list && (
                        <p className="calendar-instruction">
                            Cliquez sur un créneau libre pour planifier un cours, ou sur une séance pour consulter ses détails.
                        </p>
                    )}
                    <div className="min-w-0" ref={schedulePanel} data-dashboard-panel="">
                        {list ? (
                            <section className="schedule-agenda" aria-labelledby="schedule-agenda-title">
                                <h2 id="schedule-agenda-title">Séances de la semaine</h2>
                                {sessionsByDay.size ? (
                                    Array.from(sessionsByDay, ([day, items]) => (
                                        <section key={day} className="schedule-agenda-day" aria-label={dateLabel(day)}>
                                            <header>
                                                <CalendarDays size={17} aria-hidden="true" />
                                                <h3>
                                                    <time dateTime={day}>{dateLabel(day)}</time>
                                                </h3>
                                                <span>
                                                    {items.length} {items.length === 1 ? 'séance' : 'séances'}
                                                </span>
                                            </header>
                                            <ul>
                                                {items.map((session) => (
                                                    <li key={session.id}>
                                                        <button type="button" className="schedule-agenda-row" onClick={() => setPreview(session)}>
                                                            <span className="schedule-agenda-time">
                                                                <Clock3 size={16} aria-hidden="true" />
                                                                <span>
                                                                    <strong>{time(session.starts_at)}</strong>
                                                                    <span>à {time(session.ends_at)}</span>
                                                                </span>
                                                            </span>
                                                            <span className="schedule-agenda-course">
                                                                <strong>{session.offering.course?.title ?? 'Séance'}</strong>
                                                                <span>
                                                                    {[
                                                                        session.offering.level?.title,
                                                                        session.activity_type,
                                                                        session.offering.group?.intake?.name,
                                                                    ]
                                                                        .filter(Boolean)
                                                                        .join(' · ')}
                                                                </span>
                                                            </span>
                                                            <span className="schedule-agenda-place">
                                                                <span>
                                                                    <MapPin size={15} aria-hidden="true" /> {session.room || 'Salle à préciser'}
                                                                </span>
                                                                {session.offering.professor && (
                                                                    <span>{professorName(session.offering.professor)}</span>
                                                                )}
                                                            </span>
                                                            <span className="schedule-agenda-status" data-status={sessionLabel(session)}>
                                                                {sessionLabel(session)}
                                                            </span>
                                                            <ChevronRight size={17} className="schedule-agenda-arrow" aria-hidden="true" />
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                        </section>
                                    ))
                                ) : (
                                    <div className="schedule-agenda-empty">
                                        <CalendarDays size={26} aria-hidden="true" />
                                        <strong>Aucune séance cette semaine</strong>
                                        <p>Changez de semaine ou ajustez les filtres pour consulter un autre créneau.</p>
                                        {canPlan && (
                                            <button
                                                type="button"
                                                className="admin-primary schedule-page-action"
                                                onClick={() => {
                                                    setSlot(null);
                                                    setEditing(null);
                                                    setFormOpen(true);
                                                }}
                                            >
                                                <Plus size={16} aria-hidden="true" /> Planifier un cours
                                            </button>
                                        )}
                                    </div>
                                )}
                            </section>
                        ) : (
                            <SessionCalendar
                                sessions={sessions.map((session) => ({
                                    ...session,
                                    status: session.cancelled_at ? (session.successor ? 'rescheduled' : 'cancelled') : 'published',
                                    course: [session.offering.course?.title ?? 'Cours', session.offering.department?.name]
                                        .filter(Boolean)
                                        .join(' · '),
                                    teacher: session.offering.professor ? professorName(session.offering.professor) : null,
                                    level_id: session.offering.level?.id,
                                }))}
                                week={filters.week}
                                selectedDay={selectedDay}
                                view={view}
                                today={today}
                                hourHeight={hourHeight}
                                canCreate={canPlan}
                                onSlot={(day, minute) => {
                                    setSlot({ day, minute });
                                    setEditing(null);
                                    setFormOpen(true);
                                }}
                                onSession={(id) => setPreview(sessions.find((session) => session.id === id) ?? null)}
                            />
                        )}
                    </div>
                </section>
                <div id="schedule-semesters">
                    <SemesterManager year={years.find((item) => item.id === Number(filters.academic_year_id))} semesters={semesters} />
                </div>
            </div>
            {formOpen && (
                <SessionForm
                    offerings={offerings}
                    rooms={rooms}
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
                    hideSubmit={
                        !!preview.cancelled_at || (preview.is_published && !preview.recurrence_id && new Date(preview.starts_at) <= new Date())
                    }
                    onClose={() => setPreview(null)}
                >
                    <form
                        id="session-preview"
                        onSubmit={(event) => {
                            if (event.target !== event.currentTarget) return;
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
                        <span className={`teaching-status ${preview.is_published ? '' : 'is-inactive'}`}>{sessionLabel(preview)}</span>
                        <Link href={route('dashboard.admin.schedule.history', preview.id)}>Historique de la séance</Link>
                        <SessionActions session={preview} rooms={rooms} close={() => setPreview(null)} />
                        <p>
                            <MapPin size={17} /> {preview.room || 'Salle à préciser'}
                        </p>
                        <p>{preview.offering.professor ? professorName(preview.offering.professor) : 'Enseignant à affecter'}</p>
                        <p>
                            {preview.offering.level?.faculty.name} · {preview.offering.level?.title}
                        </p>
                        <p>
                            {preview.offering.academic_year.title} · {preview.offering.department?.name ?? 'Tronc commun'} ·{' '}
                            {preview.offering.group?.intake?.name ?? 'Tous les groupes'}
                        </p>
                        <p>
                            <Clock3 size={17} /> Heure de Kinshasa (UTC+1)
                        </p>
                        {!preview.is_published && !preview.cancelled_at && !preview.replaces_session_id && (
                            <button
                                type="button"
                                className="calendar-delete"
                                onClick={() => {
                                    deletion.clearErrors();
                                    setDeleting(preview);
                                    setPreview(null);
                                }}
                            >
                                <Trash2 size={16} /> Supprimer ce brouillon
                            </button>
                        )}
                    </form>
                </AdminModal>
            )}
            {deleting && (
                <DeleteConfirmation
                    title="Supprimer ce brouillon ?"
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
