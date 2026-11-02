import { Link } from '@inertiajs/react';
import { ArrowUpRight, BookOpen, CalendarDays, ClipboardCheck, MapPin, Wallet } from 'lucide-react';
import { EmptyState } from './PortalCards';
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
}: {
    data: StudentOverviewData;
    academic: Academic;
    balance: Balance;
    permissions: Record<string, Permission>;
    courses?: PortalProps['courses'];
}) {
    const href = (section: string) => `/dashboard/student/${section}?academic=${academic.id}`;
    const fees = data.fee_summary || [];
    const evaluations = data.ongoing_evaluations || [];
    const evaluationAccess = permissions.evaluations_participate;
    return (
        <div className="student-overview overview-ordered">
            <section className="overview-home-section" aria-labelledby="home-fees-title">
                <header>
                    <div className="overview-panel-title">
                        <Wallet size={20} />
                        <h2 id="home-fees-title">Frais obligatoires</h2>
                    </div>
                    <Link href={href('fees')}>
                        Voir plus
                        <ArrowUpRight size={15} />
                    </Link>
                </header>
                <p className="overview-section-description">Vos frais académiques et connexes, les montants confirmés et ce qu’il reste à régler.</p>
                {fees.length ? (
                    <div className="overview-fee-table">
                        <div className="overview-fee-labels" aria-hidden="true">
                            <span>Type de frais</span>
                            <span>Total net dû</span>
                            <span>Déjà payé</span>
                            <span>Solde restant</span>
                        </div>
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
                        Les frais académiques et connexes seront affichés dès leur affectation à votre inscription. Aucun montant n’est présumé réglé.
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
                <p className="overview-caption">
                    Seuls les paiements confirmés sont comptabilisés. Les frais connexes apparaissent uniquement lorsqu’ils sont enregistrés pour
                    votre dossier.
                </p>
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
            <section className="overview-home-section" aria-labelledby="home-schedule-title">
                <header>
                    <div className="overview-panel-title">
                        <CalendarDays size={20} />
                        <h2 id="home-schedule-title">Horaire du jour</h2>
                    </div>
                    <Link href={href(permissions.schedule_view.allowed ? 'schedule' : 'requests')}>
                        Voir plus
                        <ArrowUpRight size={15} />
                    </Link>
                </header>
                <p className="overview-section-description">
                    {date(data.generated_at, { weekday: 'long', day: 'numeric', month: 'long' })} · Heure de Kinshasa
                </p>
                {!permissions.schedule_view.allowed ? (
                    <EmptyState title="Agenda indisponible pour ce contexte." icon={CalendarDays}>
                        {permissions.schedule_view.reason}
                    </EmptyState>
                ) : data.today_sessions.length ? (
                    <div className="overview-lessons">
                        {data.today_sessions.map((session) => (
                            <article key={session.id}>
                                <div className="overview-lesson-time">
                                    <strong>{time(session.starts_at)}</strong>
                                    <span>{time(session.ends_at)}</span>
                                </div>
                                <div className="overview-lesson-content">
                                    <small>
                                        {session.ongoing
                                            ? 'En cours'
                                            : new Date(session.ends_at) <= new Date(data.generated_at)
                                              ? 'Terminé'
                                              : 'À venir aujourd’hui'}
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
                    <EmptyState title="Aucun autre cours publié pour aujourd’hui." icon={CalendarDays}>
                        L’horaire complet de la semaine reste accessible avec « Voir plus ».
                    </EmptyState>
                )}
            </section>
            {evaluationAccess?.visible !== false && (
                <section className="overview-home-section" aria-labelledby="home-evaluations-title">
                    <header>
                        <div className="overview-panel-title">
                            <ClipboardCheck size={20} />
                            <h2 id="home-evaluations-title">Évaluations en cours</h2>
                        </div>
                        <Link href={href('evaluations')}>
                            Voir plus
                            <ArrowUpRight size={15} />
                        </Link>
                    </header>
                    <p className="overview-section-description">Les évaluations publiées dont la période est actuellement ouverte.</p>
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
                        <EmptyState title="Aucune évaluation en cours." icon={ClipboardCheck}>
                            Les évaluations à venir sont consultables dans votre rubrique Évaluations.
                        </EmptyState>
                    )}
                </section>
            )}
            <section className="overview-home-section" aria-labelledby="home-courses-title">
                <header>
                    <div className="overview-panel-title">
                        <BookOpen size={20} />
                        <h2 id="home-courses-title">Cours du niveau</h2>
                    </div>
                    <Link href={href(permissions.courses_view.allowed ? 'courses' : 'requests')}>
                        Voir plus
                        <ArrowUpRight size={15} />
                    </Link>
                </header>
                <p className="overview-section-description">
                    {academic.level} · {academic.faculty} · {academic.year}
                </p>
                {permissions.courses_view.allowed && courses.length ? (
                    <div className="overview-level-courses">
                        {courses.map((course, index) => (
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
        </div>
    );
}
