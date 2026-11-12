import { addDays, dateLabel, localDate, localInput } from '@/lib/scheduleDates';
import { Link, router } from '@inertiajs/react';
import { ArrowUpRight, BookOpen, CalendarDays, ChevronLeft, ChevronRight, ClipboardCheck, MapPin, Wallet } from 'lucide-react';
import { useState } from 'react';
import { EmptyState } from './PortalCards';
import ScheduleExamPeriods from './ScheduleExamPeriods';
import { money, type Academic, type Balance, type Permission, type PortalProps, type StudentOverviewData } from './types';

const date = (value: string, options: Intl.DateTimeFormatOptions = {}) =>
    new Intl.DateTimeFormat('fr-FR', { timeZone: 'Africa/Kinshasa', ...options }).format(new Date(value));
const time = (value: string) => date(value, { hour: '2-digit', minute: '2-digit' });
export default function StudentOverview({
    data,
    academic,
    balance,
    permissions,
    courses = [],
    calendarEvents,
}: {
    data: StudentOverviewData;
    academic: Academic;
    balance: Balance;
    permissions: Record<string, Permission>;
    courses?: PortalProps['courses'];
    calendarEvents?: PortalProps['calendar_events'];
}) {
    const href = (section: string) => `/dashboard/student/${section}?academic=${academic.id}`;
    const fees = data.fee_summary || [];
    const evaluations = data.ongoing_evaluations || [];
    const evaluationAccess = permissions.evaluations_participate;
    const week = data.schedule_week;
    const today = localDate(data.generated_at);
    const [filters, setFilters] = useState({ week, day: today >= week && today < addDays(week, 7) ? today : '', course: '', semester: '' });
    const selected = filters.week === week ? filters : { week, day: '', course: '', semester: '' };
    const sessions = data.week_sessions;
    const semesters = [...new Set(sessions.map((session) => session.semester))].sort((a, b) => a.localeCompare(b, 'fr'));
    const semesterSessions = sessions.filter((session) => !selected.semester || session.semester === selected.semester);
    const courseOptions = [...new Map(semesterSessions.map((session) => [session.course_id, session.course])).entries()].sort((left, right) =>
        left[1].localeCompare(right[1], 'fr'),
    );
    const visibleSessions = semesterSessions.filter(
        (session) =>
            (!selected.course || String(session.course_id) === selected.course) &&
            (!selected.day || (localDate(session.starts_at) <= selected.day && localInput(session.ends_at) > `${selected.day}T00:00`)),
    );
    const openWeek = (day: string) =>
        router.get(
            '/dashboard/student/overview',
            { academic: academic.id, week: day },
            {
                preserveScroll: true,
                preserveState: true,
            },
        );
    return (
        <div className="student-overview overview-ordered">
            <section id="home-schedule" className="overview-home-section" aria-labelledby="home-schedule-title">
                <header>
                    <div className="overview-panel-title">
                        <CalendarDays size={20} />
                        <h2 id="home-schedule-title">Horaire des cours</h2>
                    </div>
                    <Link href={permissions.schedule_view.allowed ? `${href('schedule')}&week=${week}` : href('requests')}>
                        Horaire complet
                        <ArrowUpRight size={15} />
                    </Link>
                </header>
                {permissions.schedule_view.allowed && (
                    <div className="overview-schedule-controls">
                        <div className="overview-schedule-week">
                            <button type="button" aria-label="Semaine précédente" onClick={() => openWeek(addDays(week, -7))}>
                                <ChevronLeft size={18} />
                            </button>
                            <span>
                                Du {dateLabel(week)} au {dateLabel(addDays(week, 6))}
                            </span>
                            <button type="button" aria-label="Semaine suivante" onClick={() => openWeek(addDays(week, 7))}>
                                <ChevronRight size={18} />
                            </button>
                        </div>
                        <div className="overview-schedule-filters">
                            <label>
                                Semestre
                                <select
                                    value={selected.semester}
                                    onChange={(event) => setFilters({ ...selected, semester: event.target.value, course: '' })}
                                >
                                    <option value="">Tous</option>
                                    {semesters.map((semester) => (
                                        <option key={semester}>{semester}</option>
                                    ))}
                                </select>
                            </label>
                            <label>
                                Jour
                                <select value={selected.day} onChange={(event) => setFilters({ ...selected, day: event.target.value })}>
                                    <option value="">Tous les jours</option>
                                    {Array.from({ length: 7 }, (_, index) => addDays(week, index)).map((day) => (
                                        <option key={day} value={day}>
                                            {dateLabel(day)}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label>
                                Cours
                                <select value={selected.course} onChange={(event) => setFilters({ ...selected, course: event.target.value })}>
                                    <option value="">Tous les cours</option>
                                    {courseOptions.map(([id, title]) => (
                                        <option key={id} value={id}>
                                            {title}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        </div>
                    </div>
                )}
                {permissions.schedule_view.allowed && <ScheduleExamPeriods events={calendarEvents} day={selected.day} />}
                {!permissions.schedule_view.allowed ? (
                    <EmptyState title="Agenda indisponible pour ce contexte." icon={CalendarDays}>
                        {permissions.schedule_view.reason}
                    </EmptyState>
                ) : visibleSessions.length ? (
                    <div className="overview-lessons">
                        {visibleSessions.map((session) => (
                            <article key={session.id}>
                                <div className="overview-lesson-time">
                                    <strong>{time(session.starts_at)}</strong>
                                    <span>{time(session.ends_at)}</span>
                                </div>
                                <div className="overview-lesson-content">
                                    <small>
                                        {dateLabel(localDate(session.starts_at))} · {session.semester}
                                    </small>
                                    <h3>{session.course}</h3>
                                    <p>
                                        <MapPin size={13} />
                                        {session.room || 'Salle à préciser'}
                                    </p>
                                </div>
                            </article>
                        ))}
                    </div>
                ) : (
                    <p className="overview-section-description">Aucune séance pour cette sélection.</p>
                )}
            </section>
            <section className="overview-home-section" aria-labelledby="home-courses-title">
                <header>
                    <div className="overview-panel-title">
                        <BookOpen size={20} />
                        <h2 id="home-courses-title">Cours du niveau</h2>
                    </div>
                    <Link href={href(permissions.courses_view.allowed ? 'courses' : 'requests')}>
                        Tous les cours
                        <ArrowUpRight size={15} />
                    </Link>
                </header>
                <p className="overview-section-description">
                    {academic.level} · {courses.length} cours
                </p>
                {permissions.courses_view.allowed && courses.length ? (
                    <div className="overview-level-courses">
                        {courses.slice(0, 3).map((course, index) => (
                            <article key={course.id}>
                                <span>{String(index + 1).padStart(2, '0')}</span>
                                <div>
                                    <small>
                                        {course.code || 'Enseignement publié'}
                                        {course.semester ? ` · ${course.semester}` : ''}
                                    </small>
                                    <h3>
                                        <Link href={course.detail_url} className="student-course-title-link">
                                            {course.title}
                                            <ArrowUpRight size={14} />
                                        </Link>
                                    </h3>
                                    <p>{course.teacher || 'Titulaire à préciser'}</p>
                                </div>
                                <strong>
                                    {course.credits} <small>crédit(s)</small>
                                </strong>
                            </article>
                        ))}
                    </div>
                ) : (
                    <EmptyState title="Aucun enseignement disponible pour le moment." icon={BookOpen}>
                        {permissions.courses_view.allowed
                            ? 'Les cours publiés pour votre niveau, votre année et votre groupe apparaîtront ici.'
                            : permissions.courses_view.reason}
                    </EmptyState>
                )}
            </section>
            <section className="overview-home-section" aria-labelledby="home-fees-title">
                <header>
                    <div className="overview-panel-title">
                        <Wallet size={20} />
                        <h2 id="home-fees-title">Frais obligatoires</h2>
                    </div>
                    <Link href={href('fees')}>
                        Voir les frais
                        <ArrowUpRight size={15} />
                    </Link>
                </header>
                <p className="overview-section-description">Frais et paiements confirmés</p>
                {fees.length ? (
                    <div className="overview-fee-table">
                        {fees.map((fee) => (
                            <article key={fee.kind}>
                                <div>
                                    <h3>{fee.title}</h3>
                                    <span className={fee.balance.overdue_cents > 0 ? 'is-overdue' : ''}>
                                        {fee.balance.overdue_cents > 0
                                            ? `${money(fee.balance.overdue_cents, balance.currency)} en retard`
                                            : fee.balance.balance_cents === 0
                                              ? 'À jour'
                                              : 'À régulariser selon vos échéances'}
                                    </span>
                                </div>
                                <p>
                                    <small>Total net dû</small>
                                    {money(fee.balance.due_cents, balance.currency)}
                                </p>
                                <p>
                                    <small>Déjà payé</small>
                                    {money(fee.balance.paid_cents, balance.currency)}
                                </p>
                                <p>
                                    <small>Solde restant</small>
                                    <strong>{money(fee.balance.balance_cents, balance.currency)}</strong>
                                </p>
                            </article>
                        ))}
                    </div>
                ) : (
                    <EmptyState title="Frais à confirmer par l’administration." icon={Wallet}>
                        Les montants apparaîtront une fois les frais affectés à votre inscription.
                    </EmptyState>
                )}
                {fees.length > 0 && (
                    <div className="overview-fee-total">
                        <span>Solde total restant</span>
                        <strong>{money(balance.balance_cents, balance.currency)}</strong>
                        <Link href={href('fees')}>
                            Consulter les échéances
                            <ArrowUpRight size={14} />
                        </Link>
                    </div>
                )}
                {data.alerts
                    .filter((alert) => alert.id === 'documents')
                    .map((alert) => (
                        <p className="overview-inline-warning" key={alert.id}>
                            {alert.message}
                            <Link href={`/dashboard/enrollments/${academic.application_uuid}`}>
                                Consulter mon dossier
                                <ArrowUpRight size={14} />
                            </Link>
                        </p>
                    ))}
            </section>
            {evaluationAccess?.visible !== false && (
                <section className="overview-home-section" aria-labelledby="home-evaluations-title">
                    <header>
                        <div className="overview-panel-title">
                            <ClipboardCheck size={20} />
                            <h2 id="home-evaluations-title">Évaluations en cours</h2>
                        </div>
                        <Link href={href('evaluations')}>
                            Voir les évaluations
                            <ArrowUpRight size={15} />
                        </Link>
                    </header>
                    {evaluations.length ? (
                        <div className="overview-active-evaluations">
                            {evaluations.map((item) => (
                                <article key={item.id}>
                                    <div>
                                        <span>{item.course}</span>
                                        <h3>{item.title}</h3>
                                        <p>
                                            {item.closes_at
                                                ? `Clôture le ${date(item.closes_at, { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}`
                                                : 'Date de clôture non renseignée'}
                                        </p>
                                    </div>
                                    <Link href={evaluationAccess?.allowed ? `${href('evaluations')}#resource-${item.id}` : href('fees')}>
                                        {evaluationAccess?.allowed ? 'Consulter' : 'Conditions d’accès'}
                                        <ArrowUpRight size={14} />
                                    </Link>
                                </article>
                            ))}
                        </div>
                    ) : (
                        <p className="overview-section-description">Aucune évaluation en cours.</p>
                    )}
                </section>
            )}
        </div>
    );
}
