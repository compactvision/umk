import Pagination from '@/components/admin/Pagination';
import Dashboard from '@/components/layouts/Dashboard/Dashboard';
import StudentSchedule from '@/components/student/StudentSchedule';
import type { Permission, PortalProps } from '@/components/student/types';
import { dateLabel, localDate, time } from '@/lib/scheduleDates';
import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    ArrowUpRight,
    BookOpen,
    CalendarDays,
    ClipboardCheck,
    Download,
    Files,
    GraduationCap,
    Info,
    MonitorPlay,
    Play,
    UserRound,
    Users,
} from 'lucide-react';
import '../../../../css/student-course.css';
import '../../../../css/student-portal.css';

type Attendance = { id: number; starts_at: string; ends_at: string; room: string; status: string | null };
type Resource = {
    id: number;
    title: string;
    body: string | null;
    url: string | null;
    download_url: string | null;
    work_url: string | null;
    filename: string | null;
    opens_at: string | null;
    closes_at: string | null;
};
type Props = {
    section: string;
    academic: { id: number; level: string; faculty: string; year: string; group: string | null };
    course: {
        id: number;
        title: string;
        code: string | null;
        description: string | null;
        credits: number;
        semester: number | null;
        cmi_hours: number | null;
        td_hours: number | null;
        tp_hours: number | null;
        pedagogical_content: string | null;
    };
    organization: {
        id: number;
        teacher: string | null;
        assistant: string | null;
        leader: string | null;
        group: string | null;
        delivery_mode: string;
    }[];
    counts: Record<string, number>;
    permissions: Record<string, Permission>;
    resources: Resource[];
    week: string;
    sessions: PortalProps['sessions'];
    attendance: { data: Attendance[]; links: { url: string | null; label: string; active: boolean }[] } | null;
    attendance_stats: Record<string, number>;
    period: { start_date: string; end_date: string } | null;
};
const sections = [
    { id: 'infos', label: 'Infos', icon: Info },
    { id: 'sessions', label: 'Séances', icon: CalendarDays },
    { id: 'online', label: 'Cours en ligne', icon: MonitorPlay },
    { id: 'files', label: 'Fichiers', icon: Files },
    { id: 'evaluations', label: 'Évaluations', icon: ClipboardCheck },
    { id: 'videos', label: 'Vidéos', icon: Play },
];
const statuses: Record<string, string> = { present: 'Présent', absent: 'Absent', late: 'En retard', excused: 'Excusé' };
export default function StudentCourse(props: Props) {
    const { course, academic, section, organization, counts, attendance_stats: stats } = props;
    const base = `/dashboard/student/courses/${course.id}`;
    const href = (target: string) => `${base}/${target}?academic=${academic.id}`;
    const navigation = (
        <nav className="course-shortcuts" aria-label="Rubriques du cours">
            {sections.map(({ id, label, icon: Icon }) => {
                const feature =
                    id === 'files'
                        ? 'materials_download'
                        : id === 'evaluations'
                          ? 'evaluations_participate'
                          : id === 'sessions'
                            ? 'schedule_view'
                            : 'courses_view';
                const allowed = props.permissions[feature]?.allowed;
                return allowed ? (
                    <Link key={id} href={href(id)} aria-current={section === id ? 'page' : undefined}>
                        <Icon size={21} />
                        <strong>{label}</strong>
                        {id !== 'infos' && (
                            <span>
                                {counts[id] ?? 0} élément{counts[id] === 1 ? '' : 's'}
                            </span>
                        )}
                        <ArrowUpRight size={14} />
                    </Link>
                ) : (
                    <div key={id} aria-disabled="true">
                        <Icon size={21} />
                        <strong>{label}</strong>
                        <small>{props.permissions[feature]?.reason ?? 'Accès soumis à conditions'}</small>
                    </div>
                );
            })}
        </nav>
    );
    return (
        <Dashboard>
            <Head
                title={`${course.title} · ${section === 'infos' ? 'Mon cours' : (sections.find((item) => item.id === section)?.label ?? 'Présences')}`}
            />
            <div className="student-portal student-course-page">
                <Link href={`/dashboard/student?academic=${academic.id}`} className="course-back">
                    <ArrowLeft size={16} /> Retour à mon espace
                </Link>
                <header className="course-hero">
                    <div>
                        <span>
                            {course.code || 'MON COURS'} · {academic.year}
                        </span>
                        <h1>{course.title}</h1>
                        <p>
                            {academic.faculty} · {academic.level}
                            {academic.group ? ` · ${academic.group}` : ''}
                        </p>
                    </div>
                    <BookOpen size={42} strokeWidth={1.2} />
                </header>
                {section === 'infos' ? (
                    <>
                        <section className="course-team" aria-label="Équipe enseignante">
                            {organization.length ? (
                                organization.map((item) => (
                                    <article key={item.id}>
                                        <UserRound size={24} />
                                        <div>
                                            <small>PROFESSEUR TITULAIRE{item.group ? ` · ${item.group}` : ''}</small>
                                            <h2>{item.teacher || 'Titulaire à préciser'}</h2>
                                            <p>Assistant : {item.assistant || 'Non renseigné'}</p>
                                        </div>
                                    </article>
                                ))
                            ) : (
                                <article>
                                    <UserRound size={24} />
                                    <div>
                                        <h2>Équipe à confirmer</h2>
                                        <p>L’affectation de l’enseignant sera communiquée par la faculté.</p>
                                    </div>
                                </article>
                            )}
                        </section>
                        <section className="course-organization" aria-label="Organisation du cours">
                            <article>
                                <GraduationCap size={20} />
                                <small>Promotion</small>
                                <strong>{academic.level}</strong>
                                <span>{academic.group || academic.faculty}</span>
                            </article>
                            <article>
                                <CalendarDays size={20} />
                                <small>Période</small>
                                <strong>{course.semester === 1 ? '1er semestre' : course.semester === 2 ? '2e semestre' : 'À préciser'}</strong>
                                <span>
                                    {props.period ? `${dateLabel(props.period.start_date)} — ${dateLabel(props.period.end_date)}` : academic.year}
                                </span>
                            </article>
                            <article>
                                <Users size={20} />
                                <small>Chef de promotion</small>
                                <strong>{[...new Set(organization.map((item) => item.leader).filter(Boolean))].join(', ') || 'Non renseigné'}</strong>
                                <span>
                                    {[
                                        ...new Set(
                                            organization
                                                .map(
                                                    (item) =>
                                                        ({ in_person: 'Présentiel', online: 'À distance', hybrid: 'Hybride' })[
                                                            item.delivery_mode as 'in_person'
                                                        ],
                                                )
                                                .filter(Boolean),
                                        ),
                                    ].join(' · ') || 'Organisation à préciser'}
                                </span>
                            </article>
                            <Link href={href('attendance')}>
                                <ClipboardCheck size={20} />
                                <small>Mes présences</small>
                                <strong>
                                    {stats.present ?? 0} présent · {stats.absent ?? 0} absent
                                </strong>
                                <span>
                                    Consulter le suivi par séance <ArrowUpRight size={13} />
                                </span>
                            </Link>
                        </section>
                        <section className="course-kpis" aria-label="Volume du cours">
                            {[
                                { label: 'Crédits', value: course.credits, unit: 'crédits' },
                                { label: 'CMI', value: course.cmi_hours, unit: 'heures' },
                                { label: 'TD', value: course.td_hours, unit: 'heures' },
                                { label: 'TP', value: course.tp_hours, unit: 'heures' },
                            ].map((item) => (
                                <article key={item.label}>
                                    <span>{item.label}</span>
                                    <strong>{item.value ?? '—'}</strong>
                                    <small>{item.value == null ? 'À renseigner' : item.unit}</small>
                                </article>
                            ))}
                        </section>
                        <section className="course-content">
                            <span>LE CONTENU PÉDAGOGIQUE</span>
                            <h2>Comprendre le cours.</h2>
                            <p>
                                {course.pedagogical_content ||
                                    course.description ||
                                    'Le contenu pédagogique sera communiqué par l’équipe enseignante.'}
                            </p>
                        </section>
                        {navigation}
                    </>
                ) : (
                    <>
                        {navigation}
                        {section === 'sessions' && (
                            <StudentSchedule
                                sessions={props.sessions}
                                week={props.week}
                                academic={academic.id}
                                promotion={academic}
                                courseId={course.id}
                            />
                        )}
                        {section === 'attendance' && (
                            <section className="course-content">
                                <h2>Mes présences par séance</h2>
                                <div className="course-attendance-stats">
                                    {Object.entries(statuses).map(([key, label]) => (
                                        <span key={key}>
                                            {label} : <strong>{stats[key] ?? 0}</strong>
                                        </span>
                                    ))}
                                </div>
                                {props.attendance?.data.length ? (
                                    <>
                                        <div className="course-attendance-list">
                                            {props.attendance.data.map((item) => (
                                                <article key={item.id}>
                                                    <div>
                                                        <strong>{dateLabel(localDate(item.starts_at))}</strong>
                                                        <p>
                                                            {time(item.starts_at)}–{time(item.ends_at)} · {item.room}
                                                        </p>
                                                    </div>
                                                    <span className={`attendance-status is-${item.status ?? 'pending'}`}>
                                                        {item.status ? statuses[item.status] : 'Non renseigné'}
                                                    </span>
                                                </article>
                                            ))}
                                        </div>
                                        <Pagination value={props.attendance} />
                                    </>
                                ) : (
                                    <p>Aucune séance passée publiée pour ce cours.</p>
                                )}
                            </section>
                        )}
                        {['files', 'online', 'videos', 'evaluations'].includes(section) && (
                            <section className="course-content">
                                <h2>{sections.find((item) => item.id === section)?.label}</h2>
                                {props.resources.length ? (
                                    <div className="course-resource-list">
                                        {props.resources.map((item) => (
                                            <article key={item.id}>
                                                <h3>{item.title}</h3>
                                                {item.body && <p>{item.body}</p>}
                                                {item.closes_at && (
                                                    <small>
                                                        Clôture : {dateLabel(localDate(item.closes_at))} à {time(item.closes_at)}
                                                    </small>
                                                )}
                                                <div>
                                                    {item.download_url && (
                                                        <a href={item.download_url}>
                                                            <Download size={16} /> Télécharger {item.filename || 'le fichier'}
                                                        </a>
                                                    )}
                                                    {item.url && (
                                                        <a href={item.url} target="_blank" rel="noopener noreferrer">
                                                            {section === 'videos' ? 'Voir la vidéo' : 'Ouvrir le cours en ligne'}
                                                            <ArrowUpRight size={16} />
                                                        </a>
                                                    )}
                                                    {item.work_url && (
                                                        <Link href={item.work_url}>
                                                            Consulter les consignes et déposer mon travail
                                                            <ArrowUpRight size={16} />
                                                        </Link>
                                                    )}
                                                </div>
                                            </article>
                                        ))}
                                    </div>
                                ) : (
                                    <p>Aucun élément publié pour ce cours dans cette rubrique.</p>
                                )}
                            </section>
                        )}
                    </>
                )}
            </div>
        </Dashboard>
    );
}
