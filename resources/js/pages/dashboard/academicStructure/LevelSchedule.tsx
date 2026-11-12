import AdminModal from '@/components/admin/AdminModal';
import SessionCalendar from '@/components/teaching/SessionCalendar';
import { addDays, dateLabel, localDate, localInput } from '@/lib/scheduleDates';
import { Link, useForm } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { messages, type Course, type LevelReview, type Props } from './types';
import WeeklyScheduleForm from './WeeklyScheduleForm';

function weekStart(day: string) {
    const weekday = new Date(`${day}T12:00:00Z`).getUTCDay();
    return addDays(day, -((weekday + 6) % 7));
}

export default function LevelSchedule({
    level,
    catalog,
    semesters,
    yearId,
    editable,
    live,
}: {
    level: LevelReview;
    catalog: Course[];
    semesters: Props['scheduleSemesters'];
    yearId?: number;
    editable: boolean;
    live: boolean;
}) {
    const today = localDate(new Date().toISOString());
    const [semester, setSemester] = useState(() =>
        String(semesters.find((period) => period.start_date <= today && today <= period.end_date)?.number ?? semesters[0]?.number ?? ''),
    );
    const period = semesters.find((item) => String(item.number) === semester);
    const semesterByCourse = new Map(catalog.map((course) => [course.id, String(course.semester ?? '')]));
    const offerings = level.schedule.filter((offering) => semesterByCourse.get(offering.course_id) === semester);
    const schedule = semester
        ? level.schedule.flatMap((offering) => {
              const courseSemester = semesterByCourse.get(offering.course_id);
              if (courseSemester && (live || !period)) return courseSemester === semester ? [offering] : [];
              if (!period) return [];

              return [
                  {
                      ...offering,
                      sessions: offering.sessions.filter((session) => {
                          const day = localDate(session.starts_at);
                          return day >= period.start_date && day <= period.end_date;
                      }),
                  },
              ];
          })
        : level.schedule;
    const [chosenWeek, setWeek] = useState<string>();
    const firstSession = schedule.flatMap((offering) => offering.sessions.map((session) => session.starts_at)).sort()[0];
    const initialDate =
        period && period.start_date <= today && today <= period.end_date
            ? today
            : firstSession
              ? localDate(firstSession)
              : (period?.start_date ?? today);
    const firstWeek = period && weekStart(period.start_date);
    const lastWeek = period && weekStart(period.end_date);
    const requestedWeek = chosenWeek ?? weekStart(initialDate);
    const week = firstWeek && requestedWeek < firstWeek ? firstWeek : lastWeek && requestedWeek > lastWeek ? lastWeek : requestedWeek;
    const nextWeek = addDays(week, 7);
    const weeklySchedule = schedule
        .flatMap((offering) =>
            offering.sessions
                .filter((session) => localDate(session.starts_at) < nextWeek && localInput(session.ends_at) > `${week}T00:00`)
                .map((session) => ({ offering, session })),
        )
        .sort((left, right) => left.session.starts_at.localeCompare(right.session.starts_at));
    const [dialog, setDialog] = useState<{ sessionId: number; course: string; day: string; deleting?: boolean } | null>(null);
    const [weeklyForm, setWeeklyForm] = useState<{ slot?: { day: string; minute: number } } | null>(null);
    const [selectedDay, setSelectedDay] = useState('');
    const canPlan = editable && Boolean(period) && offerings.length > 0;
    const dayInWeek = selectedDay >= week && selectedDay < nextWeek;
    const form = useForm({
        academic_offering_id: '',
        starts_at: '',
        ends_at: '',
        room: '',
        repeat_count: 1,
        scope: 'session' as 'session' | 'semester',
    });
    const wholeSemester = form.data.scope === 'semester';
    const planned = new Set(schedule.filter((offering) => offering.sessions.length).map((offering) => offering.course_id)).size;

    function showSavedWeek(levels: LevelReview[]) {
        const refreshed = levels.find((item) => item.id === level.id);
        if (!refreshed) return;

        const previousIds = new Set(level.schedule.flatMap((offering) => offering.sessions.map((session) => session.id)));
        const newWeeks = refreshed.schedule
            .flatMap((offering) => offering.sessions)
            .filter((session) => !previousIds.has(session.id))
            .map((session) => weekStart(localDate(session.starts_at)))
            .sort();
        if (newWeeks.length && !newWeeks.includes(week)) setWeek(newWeeks[0]);
    }

    return (
        <div className="as-stack">
            <div className="as-panel-title">
                <p className="as-note">
                    {live
                        ? `${planned} matière(s) avec une séance planifiée dans la période affichée.`
                        : 'Horaire enregistré lors de la validation du niveau.'}
                </p>
                {editable && (
                    <div className="as-actions">
                        <Link
                            className="as-establishment-link"
                            href={route('dashboard.admin.schedule.index', {
                                level_id: level.id,
                                academic_year_id: yearId,
                                semester: semester || undefined,
                            })}
                        >
                            Ouvrir le planning du niveau
                        </Link>
                        {canPlan && (
                            <button className="admin-secondary" type="button" onClick={() => setWeeklyForm({})}>
                                Planifier un cours pour le semestre
                            </button>
                        )}
                    </div>
                )}
            </div>
            <div className="as-toolbar as-week-toolbar" aria-label="Navigation par semaine">
                <label className="admin-field">
                    Semestre
                    <select
                        value={semester}
                        onChange={(event) => {
                            setSemester(event.target.value);
                            setWeek(undefined);
                            setSelectedDay('');
                        }}
                    >
                        <option value="">Tous les semestres</option>
                        <option value="1">Semestre 1</option>
                        <option value="2">Semestre 2</option>
                    </select>
                </label>
                <div className="as-week-navigation">
                    <button
                        type="button"
                        className="admin-secondary"
                        aria-label="Semaine précédente"
                        disabled={Boolean(firstWeek && week <= firstWeek)}
                        onClick={() => setWeek(addDays(week, -7))}
                    >
                        <ChevronLeft size={18} aria-hidden="true" />
                    </button>
                    <span aria-live="polite">
                        Du {dateLabel(week)} au {dateLabel(addDays(week, 6))}
                    </span>
                    <button
                        type="button"
                        className="admin-secondary"
                        aria-label="Semaine suivante"
                        disabled={Boolean(lastWeek && week >= lastWeek)}
                        onClick={() => setWeek(nextWeek)}
                    >
                        <ChevronRight size={18} aria-hidden="true" />
                    </button>
                </div>
                <label className="admin-field">
                    Affichage
                    <select value={dayInWeek ? selectedDay : ''} onChange={(event) => setSelectedDay(event.target.value)}>
                        <option value="">Semaine entière</option>
                        {Array.from({ length: 7 }, (_, index) => addDays(week, index)).map((day) => (
                            <option key={day} value={day}>
                                {dateLabel(day)}
                            </option>
                        ))}
                    </select>
                </label>
                <label className="admin-field">
                    Aller à une date
                    <input
                        type="date"
                        value={week}
                        min={firstWeek}
                        max={period?.end_date}
                        onChange={(event) => {
                            if (event.target.value && event.target.validity.valid) setWeek(weekStart(event.target.value));
                        }}
                    />
                </label>
            </div>
            {period && (
                <p className="as-note">
                    Semestre {period.number} · du {dateLabel(period.start_date)} au {dateLabel(period.end_date)}
                </p>
            )}
            {editable && !period && (
                <p className="as-note">
                    {semester
                        ? 'Les dates de ce semestre doivent être configurées pour planifier un cours.'
                        : 'Sélectionnez un semestre pour planifier un cours.'}
                </p>
            )}
            <p className="as-note">
                {canPlan
                    ? 'Cliquez sur un créneau libre pour planifier un cours, ou sur un cours pour modifier ou supprimer une séance.'
                    : 'Les heures affichées sont celles de Kinshasa.'}
            </p>
            {!weeklySchedule.length && <p className="as-note">Aucune séance cette semaine.</p>}
            <SessionCalendar
                sessions={weeklySchedule.map(({ offering, session }) => ({
                    ...session,
                    course: [offering.course, offering.audience].filter(Boolean).join(' · '),
                    teacher: offering.teacher,
                }))}
                week={week}
                selectedDay={selectedDay}
                view={dayInWeek ? 'day' : 'week'}
                today={today}
                hourHeight={58}
                canCreate={canPlan && period ? (day) => day >= period.start_date && day <= period.end_date : false}
                onSlot={canPlan ? (day, minute) => setWeeklyForm({ slot: { day, minute } }) : undefined}
                onSession={
                    editable
                        ? (id) => {
                              const entry = weeklySchedule.find(({ session }) => session.id === id);
                              if (!entry) return;

                              const { offering, session } = entry;
                              form.clearErrors();
                              form.setData({
                                  academic_offering_id: String(offering.id),
                                  starts_at: localInput(session.starts_at),
                                  ends_at: localInput(session.ends_at),
                                  room: session.room,
                                  repeat_count: 1,
                                  scope: 'session',
                              });
                              setDialog({ sessionId: id, course: offering.course, day: localDate(session.starts_at) });
                          }
                        : undefined
                }
            />
            {weeklyForm && period && (
                <WeeklyScheduleForm
                    offerings={offerings}
                    semesterId={period.id}
                    initialSlot={weeklyForm.slot}
                    onClose={() => setWeeklyForm(null)}
                    onSaved={showSavedWeek}
                />
            )}
            {dialog && (
                <AdminModal
                    title={dialog.deleting ? 'Supprimer du calendrier' : 'Modifier la séance'}
                    description={
                        dialog.deleting
                            ? 'Choisissez les séances à retirer de l’emploi du temps. Leurs relevés de présence seront également supprimés.'
                            : 'Choisissez quelles séances modifier. Les heures saisies sont celles de Kinshasa.'
                    }
                    formId="curriculum-level-session"
                    submitLabel={
                        dialog.deleting
                            ? wholeSemester
                                ? 'Supprimer le créneau du semestre'
                                : 'Confirmer la suppression'
                            : wholeSemester
                              ? 'Modifier le créneau du semestre'
                              : 'Modifier cette séance'
                    }
                    className={dialog.deleting ? 'as-schedule-delete-modal' : undefined}
                    onClose={() => setDialog(null)}
                    busy={form.processing}
                    errors={messages(form.errors)}
                >
                    <form
                        id="curriculum-level-session"
                        className="admin-modal-form"
                        onSubmit={(event) => {
                            event.preventDefault();
                            if (dialog.deleting) {
                                form.delete(route('dashboard.admin.schedule.destroy', dialog.sessionId), {
                                    preserveScroll: true,
                                    onSuccess: () => setDialog(null),
                                });
                                return;
                            }
                            form.put(route('dashboard.admin.schedule.update', dialog.sessionId), {
                                preserveScroll: true,
                                onSuccess: () => {
                                    setWeek(weekStart(form.data.starts_at.slice(0, 10)));
                                    setDialog(null);
                                },
                            });
                        }}
                    >
                        <p>
                            <strong>{dialog.course}</strong> · {dateLabel(dialog.day)}
                        </p>
                        <fieldset className="as-schedule-scope">
                            <legend>{dialog.deleting ? 'Quelles séances supprimer ?' : 'Appliquer la modification à'}</legend>
                            <label>
                                <input
                                    type="radio"
                                    name="schedule-scope"
                                    checked={!wholeSemester}
                                    onChange={() => form.setData('scope', 'session')}
                                />
                                <span>
                                    <strong>Cette séance uniquement</strong>
                                    <small>Séance du {dateLabel(dialog.day)}.</small>
                                </span>
                            </label>
                            <label>
                                <input
                                    type="radio"
                                    name="schedule-scope"
                                    checked={wholeSemester}
                                    onChange={() => form.setData('scope', 'semester')}
                                />
                                <span>
                                    <strong>Ce créneau chaque semaine du semestre</strong>
                                    <small>Les séances de ce cours qui ont le même jour et les mêmes heures d’origine.</small>
                                </span>
                            </label>
                        </fieldset>
                        {!dialog.deleting && (
                            <>
                                <label className="admin-field">
                                    Début du créneau *
                                    <input
                                        type="datetime-local"
                                        required
                                        min={wholeSemester ? `${dialog.day}T00:00` : undefined}
                                        max={wholeSemester ? `${dialog.day}T23:59` : undefined}
                                        value={form.data.starts_at}
                                        onChange={(event) => form.setData('starts_at', event.target.value)}
                                    />
                                </label>
                                <label className="admin-field">
                                    Fin *
                                    <input
                                        type="datetime-local"
                                        required
                                        max={wholeSemester ? `${addDays(dialog.day, 1)}T00:00` : undefined}
                                        value={form.data.ends_at}
                                        onChange={(event) => form.setData('ends_at', event.target.value)}
                                    />
                                </label>
                                <label className="admin-field">
                                    Salle (facultatif)
                                    <input maxLength={180} value={form.data.room} onChange={(event) => form.setData('room', event.target.value)} />
                                </label>
                            </>
                        )}
                        <button
                            type="button"
                            className={dialog.deleting ? 'admin-secondary' : 'calendar-delete'}
                            disabled={form.processing}
                            onClick={() => {
                                form.clearErrors();
                                form.setData('scope', 'session');
                                setDialog({ ...dialog, deleting: !dialog.deleting });
                            }}
                        >
                            {dialog.deleting ? (
                                'Revenir à la modification'
                            ) : (
                                <>
                                    <Trash2 size={16} aria-hidden="true" /> Supprimer…
                                </>
                            )}
                        </button>
                    </form>
                </AdminModal>
            )}
        </div>
    );
}
