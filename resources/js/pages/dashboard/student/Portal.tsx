import FeedbackToast, { type ToastFeedback } from '@/components/admin/FeedbackToast';
import Pagination from '@/components/admin/Pagination';
import Dashboard from '@/components/layouts/Dashboard/Dashboard';
import DesktopOverviewHeader from '@/components/student/DesktopOverviewHeader';
import ModuleLanding from '@/components/student/ModuleLanding';
import { studentHref, studentModules, studentSectionAccess, studentSectionLabels } from '@/components/student/navigation';
import OfficialDocumentCenter from '@/components/student/OfficialDocumentCenter';
import OfficialResults from '@/components/student/OfficialResults';
import {
    AcademicSummary,
    CourseCard,
    EmptyState,
    FinancialStatusBanner,
    PaymentOverview,
    StudentIdentityCard,
} from '@/components/student/PortalCards';
import ProfilePageHeading from '@/components/student/ProfilePageHeading';
import StudentOverview from '@/components/student/StudentOverview';
import StudentProfileForm, { StudentPasswordModal } from '@/components/student/StudentProfileForm';
import StudentSchedule from '@/components/student/StudentSchedule';
import StudentWelcome from '@/components/student/StudentWelcome';
import { labels, money, type AssessmentActivity, type PortalProps, type Resource } from '@/components/student/types';
import { formatDate } from '@/lib/studentEnrollment';
import { Head, Link, router, useForm, usePoll } from '@inertiajs/react';
import { ArrowUpRight, BookOpen, CreditCard, Download, LayoutDashboard, LockKeyhole, MessageSquare, Send } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import '../../../../css/student-overview-desktop.css';
import '../../../../css/student-portal.css';
import '../../../../css/student-profile-desktop.css';
function DepartmentChoice({
    academic,
    department,
    options,
    onFeedback,
}: {
    academic: number;
    department: PortalProps['department'];
    options: PortalProps['department_options'];
    onFeedback: (message: string) => void;
}) {
    const form = useForm({ academic_department_id: '' });
    if (department)
        return (
            <p className="portal-muted">
                Département · <strong>{department.name}</strong>
            </p>
        );
    if (!options.length) return null;

    return (
        <section className="portal-panel" aria-labelledby="student-department-title">
            <header>
                <h2 id="student-department-title">Choisir mon département</h2>
            </header>
            <p className="portal-muted">Ce choix est définitif pour cette inscription. Il détermine vos cours et séances de spécialité.</p>
            <form
                className="portal-form"
                onSubmit={(event) => {
                    event.preventDefault();
                    form.post(route('dashboard.student.department.choose', { academic }), {
                        preserveScroll: true,
                        onSuccess: () => onFeedback('Votre département a été confirmé.'),
                    });
                }}
            >
                <label>
                    Département
                    <select
                        required
                        value={form.data.academic_department_id}
                        onChange={(event) => form.setData('academic_department_id', event.target.value)}
                    >
                        <option value="">Sélectionner un département</option>
                        {options.map((option) => (
                            <option key={option.id} value={option.id}>
                                {option.name}
                            </option>
                        ))}
                    </select>
                </label>
                {form.errors.academic_department_id && (
                    <p className="portal-alert" role="alert">
                        {form.errors.academic_department_id}
                    </p>
                )}
                <button type="submit" className="portal-primary" disabled={form.processing || !form.data.academic_department_id}>
                    Confirmer mon choix
                </button>
            </form>
        </section>
    );
}

const pathwayLabels: Record<string, string> = {
    interruption: 'Interruption',
    resumption: 'Reprise d’études',
    reorientation: 'Réorientation',
    external_transfer: 'Transfert externe',
    cycle: 'Changement de cycle',
    graduation: 'Fin de cursus',
    advance: 'Passage',
    repeat: 'Redoublement',
    conditional: 'Passage conditionnel',
};

function Renewal({ decision, academic }: { decision: NonNullable<PortalProps['progression']>; academic: number }) {
    const form = useForm<{ progression?: string }>({});

    return (
        <section className="portal-panel" aria-labelledby="student-renewal-title">
            <header>
                <h2 id="student-renewal-title">Réinscription · {decision.level}</h2>
            </header>
            <p>
                <strong>{decision.year}</strong> · {pathwayLabels[decision.kind ?? ''] || 'Décision de progression enregistrée'}
            </p>
            {decision.due_on && <p>Échéance de reprise {decision.due_on}</p>}
            {!!decision.retakes?.length && (
                <div>
                    <h3>Matières à reprendre</h3>
                    <ul>
                        {decision.retakes.map((item) => (
                            <li key={item.item_id}>
                                {item.unit} · {item.name}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            {decision.target_id ? (
                <>
                    <p className="portal-muted">
                        {decision.status === 'pending_confirmation'
                            ? 'Votre inscription est en attente de contrôle et de confirmation par le service des inscriptions.'
                            : labels[decision.status ?? ''] || decision.status}
                    </p>
                    {decision.target_id !== academic && (
                        <Link className="portal-primary" href={route('dashboard.student.index', { section: 'fees', academic: decision.target_id })}>
                            Consulter ma réinscription
                        </Link>
                    )}
                </>
            ) : decision.can_start ? (
                <form
                    className="portal-form"
                    onSubmit={(event) => {
                        event.preventDefault();
                        form.post(route('dashboard.student.renewals.start', { progression: decision.id, academic }));
                    }}
                >
                    {form.errors.progression && (
                        <p className="portal-alert" role="alert">
                            {form.errors.progression}
                        </p>
                    )}
                    {form.progress && <progress value={form.progress.percentage} max={100} aria-label="Téléversement du travail" />}
                    <button className="portal-primary" disabled={form.processing}>
                        Lancer ma réinscription
                    </button>
                </form>
            ) : (
                <p className="portal-muted">La réinscription est actuellement indisponible pour ce dossier.</p>
            )}
        </section>
    );
}

function CoursesBySemester({ courses }: { courses: PortalProps['courses'] }) {
    const groups = new Map<string, PortalProps['courses']>();
    for (const course of courses) {
        const semester = course.semester?.trim() || 'Semestre à préciser';
        const label = semester === '1' ? '1er semestre' : semester === '2' ? '2e semestre' : semester;
        groups.set(label, [...(groups.get(label) ?? []), course]);
    }
    const rank = (label: string) => (label === '1er semestre' ? 0 : label === '2e semestre' ? 1 : label === 'Semestre à préciser' ? 3 : 2);
    return (
        <div className="portal-semester-groups">
            {[...groups.entries()]
                .sort(([a], [b]) => rank(a) - rank(b) || a.localeCompare(b, 'fr'))
                .map(([semester, items]) => (
                    <section className="portal-semester-group" key={semester} aria-label={semester}>
                        <header className="portal-semester-heading">
                            <div>
                                <h2>{semester}</h2>
                                <p>{items.length} cours</p>
                            </div>
                            <span>
                                {items.filter((course) => course.registered).reduce((total, course) => total + Number(course.credits ?? 0), 0)}{' '}
                                crédits inscrits · crédits acquis selon décisions officielles
                            </span>
                        </header>
                        <div className="portal-course-grid">
                            {items.map((course) => (
                                <CourseCard key={course.id} course={course} />
                            ))}
                        </div>
                    </section>
                ))}
        </div>
    );
}

const activityFilters: Record<string, string> = {
    available: 'À faire',
    upcoming: 'À venir',
    submitted: 'Soumis',
    grading: 'En correction',
    corrected: 'Corrigés',
};
const activityStates: Record<string, string> = {
    available: 'Ouverte',
    upcoming: 'À venir',
    submitted: 'Travail remis',
    grading: 'En correction',
    corrected: 'Correction disponible',
    ended: 'Échéance passée',
    cancelled: 'Séance annulée',
    unassigned: 'Groupe à confirmer',
};
const participationLabels: Record<string, string> = {
    submitted: 'Remis',
    late_submission: 'Remis en retard',
    not_submitted: 'Non remis',
    present: 'Présent',
    late: 'Arrivé en retard',
    absent: 'Absent',
    excused: 'Absence justifiée',
    exempt: 'Dispensé',
    interrupted: 'Interrompu',
    invalidated: 'Invalidé',
};
const assessmentPoints = (value: number) => new Intl.NumberFormat('fr', { maximumFractionDigits: 2 }).format(value / 100);

function AssessmentReview({ url, onFeedback }: { url: string; onFeedback: (message: string) => void }) {
    const form = useForm({ body: '' });
    return (
        <details>
            <summary>Demander une révision pédagogique</summary>
            <form
                className="portal-form"
                onSubmit={(event) => {
                    event.preventDefault();
                    form.post(url, { preserveScroll: true, onSuccess: () => onFeedback('Demande de révision enregistrée.') });
                }}
            >
                <label>
                    Motif de la demande{' '}
                    <textarea
                        required
                        minLength={10}
                        maxLength={6000}
                        value={form.data.body}
                        onChange={(event) => form.setData('body', event.target.value)}
                    />
                </label>
                {form.errors.body && <p role="alert">{form.errors.body}</p>}
                <button className="portal-secondary" disabled={form.processing}>
                    Transmettre la demande
                </button>
            </form>
        </details>
    );
}

function AssessmentInfo({
    activity,
    opens,
    onFeedback,
}: {
    activity: AssessmentActivity;
    opens: string | null;
    onFeedback: (message: string) => void;
}) {
    const feedback = activity.feedback;
    return (
        <div>
            <p>
                <strong>{activityStates[activity.status]}</strong> · {activity.category} · {activity.session_code}
                {activity.teacher && ` · ${activity.teacher}`} {activity.group && ` · ${activity.group}`}
            </p>
            {activity.objectives && <p>{activity.objectives}</p>}
            {activity.maximum_points !== null && <p>Barème sur {assessmentPoints(activity.maximum_points)}</p>}
            {activity.modality === 'in_person' ? (
                <p>
                    Épreuve en présentiel
                    {activity.session &&
                        ` · ${activity.session.room} · ${formatDate(activity.session.starts_at, true)} – ${formatDate(activity.session.ends_at, true)}`}
                </p>
            ) : (
                <p>
                    {opens && `Ouverture le ${formatDate(opens, true)} · `}
                    {activity.attempt_limit} remise(s) maximum
                    {activity.late_deadline && ` · Dernière réception possible le ${formatDate(activity.late_deadline, true)}`}
                </p>
            )}
            {activity.participation && participationLabels[activity.participation] && <p>{participationLabels[activity.participation]}</p>}
            {feedback && (
                <section aria-label="Correction pédagogique">
                    <h3>Correction pédagogique</h3>
                    {feedback.points !== null && (
                        <p>
                            Résultat pédagogique {assessmentPoints(feedback.points)} / {assessmentPoints(activity.maximum_points ?? 0)}
                        </p>
                    )}
                    {feedback.individual && <p style={{ whiteSpace: 'pre-wrap' }}>{feedback.individual}</p>}
                    {feedback.collective && <p style={{ whiteSpace: 'pre-wrap' }}>{feedback.collective}</p>}
                    {feedback.criteria.length > 0 && (
                        <ul>
                            {feedback.criteria.map((criterion) => (
                                <li key={criterion.label}>
                                    {criterion.label} · {assessmentPoints(criterion.points)} / {assessmentPoints(criterion.maximum)}
                                </li>
                            ))}
                        </ul>
                    )}
                    {feedback.file_url && <a href={feedback.file_url}>Télécharger ma correction</a>}
                    {feedback.review_url && <AssessmentReview url={feedback.review_url} onFeedback={onFeedback} />}
                </section>
            )}
        </div>
    );
}

function WorkForm({ resource, academic, onFeedback }: { resource: Resource; academic: number; onFeedback: (message: string) => void }) {
    const input = useRef<HTMLInputElement>(null);
    const operation = useRef<string | null>(null);
    const form = useForm<{ body: string; file: File | null }>({ body: resource.submission?.body || '', file: null });
    return (
        <form
            className="portal-form"
            onSubmit={(event) => {
                event.preventDefault();
                if (form.processing) return;
                operation.current ??= crypto.randomUUID();
                form.transform((data) => ({
                    ...data,
                    file: input.current?.files?.[0] || null,
                    operation_key: operation.current,
                    expected_version: resource.submission?.version ?? 0,
                }));

                form.post(`/dashboard/student/resources/${resource.id}/submit?academic=${academic}`, {
                    forceFormData: true,
                    preserveScroll: true,
                    errorBag: `work-${resource.id}`,
                    onSuccess: () => {
                        operation.current = null;
                        onFeedback('Votre travail a été transmis.');
                        form.reset('file');
                        if (input.current) input.current.value = '';
                    },
                });
            }}
        >
            <label htmlFor={`work-${resource.id}`}>Votre réponse</label>
            <textarea
                id={`work-${resource.id}`}
                value={form.data.body}
                onChange={(event) => form.setData('body', event.target.value)}
                rows={5}
                maxLength={20000}
            />
            <label htmlFor={`work-file-${resource.id}`}>Joindre un fichier (PDF ou image)</label>
            <input
                id={`work-file-${resource.id}`}
                ref={input}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                onChange={(event) => form.setData('file', event.target.files?.[0] || null)}
            />
            {Object.values(form.errors).map((error, index) => (
                <p role="alert" className="portal-error" key={index}>
                    {error}
                </p>
            ))}
            <button className="portal-primary" disabled={form.processing}>
                <Send size={16} />
                {form.processing ? 'Envoi…' : resource.submission ? 'Actualiser mon dépôt' : 'Transmettre mon travail'}
            </button>
        </form>
    );
}
function RequestForm({
    academic,
    documentsAllowed,
    onFeedback,
}: {
    academic: number;
    documentsAllowed: boolean;
    onFeedback: (message: string) => void;
}) {
    const form = useForm({ category: 'support', subject: '', body: '' });
    return (
        <form
            className="portal-form"
            onSubmit={(event) => {
                event.preventDefault();
                form.post(`/dashboard/student/requests?academic=${academic}`, {
                    preserveScroll: true,
                    onSuccess: () => {
                        form.reset();
                        onFeedback('Votre demande a été transmise.');
                    },
                });
            }}
        >
            <label htmlFor="request-category">Objet de votre démarche</label>
            <select id="request-category" value={form.data.category} onChange={(event) => form.setData('category', event.target.value)}>
                <option value="support">Assistance administrative</option>
                <option value="appeal">Recours / réclamation</option>
                <option value="finance">Question financière</option>
                <option value="document" disabled={!documentsAllowed}>
                    Demande de document réglementée
                </option>
            </select>
            <label htmlFor="request-subject">Sujet</label>
            <input
                id="request-subject"
                value={form.data.subject}
                maxLength={180}
                required
                onChange={(event) => form.setData('subject', event.target.value)}
            />
            <label htmlFor="request-body">Votre message</label>
            <textarea
                id="request-body"
                value={form.data.body}
                minLength={10}
                maxLength={6000}
                required
                rows={5}
                onChange={(event) => form.setData('body', event.target.value)}
            />
            {Object.values(form.errors).map((error, index) => (
                <p key={index} role="alert" className="portal-error">
                    {error}
                </p>
            ))}
            <button className="portal-primary" disabled={form.processing}>
                <Send size={16} />
                {form.processing ? 'Envoi…' : 'Transmettre ma demande'}
            </button>
            <p className="portal-muted">L’assistance, les questions financières et les recours restent accessibles sans condition de paiement.</p>
        </form>
    );
}
export default function Portal(props: PortalProps) {
    const { academic, section, permissions, balance, resources } = props;
    const isAcademicLanding = section === 'academics';
    const [guideRequest, setGuideRequest] = useState(0);
    const [passwordOpen, setPasswordOpen] = useState(false);
    const [toast, setToast] = useState<ToastFeedback | null>(props.success ? { id: 0, message: props.success, tone: 'success' } : null);
    const sequence = useRef(0);
    const notify = (message: string) => setToast({ id: ++sequence.current, message, tone: 'success' });
    const previousAccess = useRef({ academic: academic.id, permissions });
    useEffect(() => {
        const titles: Record<string, string> = {
            materials_download: 'supports pédagogiques',
            assignments_submit: 'dépôt de travaux',
            evaluations_participate: 'évaluations',
            documents_request: 'demandes de documents',
        };
        if (previousAccess.current.academic === academic.id) {
            const opened = Object.keys(titles).filter(
                (feature) => permissions[feature]?.allowed && !previousAccess.current.permissions[feature]?.allowed,
            );
            if (opened.length)
                notify(
                    `Vos accès ont été actualisés : ${opened.map((feature) => titles[feature]).join(', ')}. Votre solde financier reste consultable séparément.`,
                );
        }
        previousAccess.current = { academic: academic.id, permissions };
    }, [permissions, academic.id]);
    const sectionPollProps: Record<string, string[]> = {
        overview: ['overview', 'resources', 'progression', 'sessions', 'upcoming_sessions', 'schedule_week'],
        academics: ['progression'],
        schedule: ['sessions', 'schedule_week', 'calendar_events'],
        materials: ['resources'],
        assignments: ['resources', 'work_pagination'],
        evaluations: ['resources', 'work_pagination'],
        announcements: ['resources'],
        results: ['resources', 'official_results'],
        documents: ['resources', 'document_center'],
        fees: ['progression', 'finance_schedule', 'obligations', 'adjustments'],
        transactions: ['payments', 'payments_pagination'],
        requests: ['requests'],
        card: ['card_eligibility', 'document_center'],
    };
    usePoll(30000, { only: ['permissions', 'balance', 'academic', ...(sectionPollProps[section] ?? [])] });
    const href = (section = 'overview') => studentHref(section, academic.id);
    const canOpen = (key: string) => {
        const access = studentSectionAccess(key, permissions);
        return access.visible && access.allowed;
    };
    const resourceKind: Record<string, string> = {
        materials: 'material',
        assignments: 'assignment',
        evaluations: 'evaluation',
        results: 'result',
        announcements: 'announcement',
        documents: 'document',
    };
    const activeModule = studentModules.find((module) => module.sections.includes(section)) || studentModules[0];
    const activeSections = activeModule.sections.filter(canOpen);
    const displayed = resources.filter((resource) => resource.kind === resourceKind[section]);
    if (section === 'schedule') {
        return (
            <Dashboard>
                <Head title={`Horaire · ${academic.level}`} />
                <div className="student-portal is-schedule">
                    <Link className="portal-secondary" href={route('dashboard.student.absences')}>
                        Consulter et justifier mes absences
                    </Link>
                    {props.contexts.length > 1 && (
                        <label className="student-schedule-context">
                            Promotion affichée
                            <select
                                aria-label="Promotion affichée"
                                value={academic.id}
                                onChange={(event) =>
                                    router.get('/dashboard/student/schedule', { academic: event.target.value, week: props.schedule_week })
                                }
                            >
                                {props.contexts.map((context) => (
                                    <option value={context.id} key={context.id}>
                                        {context.label}
                                    </option>
                                ))}
                            </select>
                        </label>
                    )}
                    <StudentSchedule
                        sessions={props.sessions}
                        week={props.schedule_week}
                        academic={academic.id}
                        promotion={academic}
                        calendarEvents={props.calendar_events}
                    />
                </div>
            </Dashboard>
        );
    }

    return (
        <Dashboard>
            <Head title={section === 'profile' ? 'Mon profil étudiant' : 'Mon espace étudiant'} />
            {passwordOpen && <StudentPasswordModal academic={academic.id} onClose={() => setPasswordOpen(false)} onFeedback={notify} />}
            {toast && <FeedbackToast key={toast.id} feedback={toast} onDismiss={() => setToast(null)} />}
            <div
                className={`student-portal ${section === 'overview' ? 'is-overview' : section === 'profile' ? 'is-profile' : ''}`}
                data-dashboard-arrival-grid
            >
                {props.curriculum && section !== 'academics' && (
                    <p className="portal-muted" role="note">
                        {props.curriculum.program} · {props.curriculum.cycle} · Maquette {props.curriculum.code}
                        {props.curriculum.promotion && ` · ${props.curriculum.promotion}`}
                        {props.curriculum.cohort && ` · ${props.curriculum.cohort}`}
                    </p>
                )}
                <div className="portal-toolbar">
                    <span>
                        <LayoutDashboard size={16} />
                        ESPACE ÉTUDIANT
                    </span>
                    <select
                        aria-label="Inscription académique affichée"
                        value={academic.id}
                        onChange={(event) => router.get('/dashboard/student', { academic: event.target.value })}
                    >
                        {props.contexts.map((context) => (
                            <option value={context.id} key={context.id}>
                                {context.label}
                            </option>
                        ))}
                    </select>
                </div>
                <Link href={route('dashboard.student.enrollments')}>Mes inscriptions académiques et leur historique</Link>
                <StudentWelcome
                    academic={academic}
                    pending={props.welcome_pending && section === 'overview'}
                    openRequest={guideRequest}
                    desktopInline={section === 'overview' || section === 'profile'}
                />
                {section === 'overview' && (
                    <DesktopOverviewHeader academic={academic} overview={props.overview} onGuide={() => setGuideRequest((value) => value + 1)} />
                )}
                {props.progression && <Renewal key={props.progression.id} decision={props.progression} academic={academic.id} />}
                {(section === 'overview' || section === 'academics' || section === 'courses') && (
                    <DepartmentChoice
                        key={academic.id}
                        academic={academic.id}
                        department={props.department}
                        options={props.department_options}
                        onFeedback={notify}
                    />
                )}
                {section === 'profile' && (
                    <ProfilePageHeading
                        academic={academic.id}
                        onPassword={() => setPasswordOpen(true)}
                        onGuide={() => setGuideRequest((value) => value + 1)}
                    />
                )}
                <div className="portal-content-layout">
                    {!isAcademicLanding && (
                        <StudentIdentityCard
                            academic={academic}
                            onChangePassword={section === 'profile' ? () => setPasswordOpen(true) : undefined}
                            courseCount={permissions.courses_view.allowed ? (props.overview?.course_count ?? props.courses.length) : null}
                        />
                    )}
                    {!['overview', 'profile', 'academics'].includes(section) && (
                        <>
                            <AcademicSummary academic={academic} />
                            <FinancialStatusBanner balance={balance} href={href('fees')} />
                        </>
                    )}
                    {(academic.enrollment_status !== 'confirmed' || academic.student_status !== 'active') && (
                        <p className="portal-alert">
                            Votre profil est {labels[academic.student_status]?.toLowerCase() || academic.student_status} et votre inscription est{' '}
                            {labels[academic.enrollment_status]?.toLowerCase() || academic.enrollment_status}. Votre identité, vos frais et
                            l’assistance restent consultables.
                        </p>
                    )}
                    {!['overview', 'profile', 'academics'].includes(section) && (
                        <>
                            <nav className="portal-modules" aria-label="Rubriques de l’espace étudiant">
                                {studentModules.map((module) => {
                                    const destination = module.sections.find(canOpen);
                                    if (!destination) return null;
                                    return (
                                        <Link
                                            key={module.id}
                                            href={href(destination)}
                                            aria-current={activeModule.id === module.id ? 'page' : undefined}
                                        >
                                            <module.icon size={19} />
                                            <span>
                                                {module.title}
                                                <small>{module.description}</small>
                                            </span>
                                        </Link>
                                    );
                                })}
                            </nav>
                            {activeSections.length > 1 && (
                                <nav className="portal-tabs" aria-label={`Navigation : ${activeModule.title}`}>
                                    {activeSections.map((key) => (
                                        <Link key={key} href={href(key)} aria-current={section === key ? 'page' : undefined}>
                                            {studentSectionLabels[key]}
                                        </Link>
                                    ))}
                                </nav>
                            )}
                        </>
                    )}
                    <div className="portal-body">
                        <div className="portal-section-heading">
                            <div>
                                <span>{isAcademicLanding ? `${academic.level} · ${academic.year}` : academic.year}</span>
                                <h2>{studentSectionLabels[section] || 'Mon espace'}</h2>
                            </div>
                            {!isAcademicLanding && (
                                <span className={`portal-status is-${balance.financial_clearance_status}`}>
                                    {labels[balance.financial_clearance_status] || balance.financial_clearance_status}
                                </span>
                            )}
                        </div>
                        {section === 'academics' && props.curriculum && (
                            <section className="portal-curriculum-card" aria-label="Maquette de votre programme">
                                <BookOpen size={21} aria-hidden="true" />
                                <div>
                                    <strong>{props.curriculum.program}</strong>
                                    <small>
                                        {[props.curriculum.cycle, props.curriculum.promotion, props.curriculum.cohort].filter(Boolean).join(' · ')}
                                    </small>
                                </div>
                                <span>Maquette {props.curriculum.code}</span>
                            </section>
                        )}
                        {section === 'academics' && (
                            <section className="portal-panel space-y-3">
                                <h2>Mon parcours académique</h2>
                                {props.progression_credits ? (
                                    <p>
                                        {(props.progression_credits.earned / 100).toLocaleString('fr-CD')} crédits acquis ·{' '}
                                        {(props.progression_credits.remaining / 100).toLocaleString('fr-CD')} restant pour ce résultat annuel
                                    </p>
                                ) : (
                                    permissions.results_view?.allowed && <p>Les crédits s’afficheront après publication du résultat officiel.</p>
                                )}
                                {!!props.lifecycle?.length && (
                                    <ul>
                                        {props.lifecycle.map((event) => (
                                            <li key={event.reference}>
                                                {new Date(event.decided_at).toLocaleDateString('fr-CD')} · {pathwayLabels[event.kind]} ·{' '}
                                                {event.status === 'approved' ? 'Approuvé' : 'Refusé'}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                <Link className="portal-primary" href={route('dashboard.student.enrollments')}>
                                    Consulter mes inscriptions
                                </Link>
                            </section>
                        )}
                        {section !== 'profile' && <ModuleLanding section={section} academic={academic.id} permissions={permissions} />}
                        {section === 'profile' && props.profile_form && (
                            <StudentProfileForm key={academic.id} academic={academic} profile={props.profile_form} onFeedback={notify} />
                        )}
                        {props.document_center && <OfficialDocumentCenter data={props.document_center} academic={academic.id} />}
                        {section === 'card' && props.card_eligibility && (
                            <section className="portal-panel">
                                <header>
                                    <h2>{props.card_eligibility.ready ? 'Dossier prêt pour la gravure' : 'Préparer ma carte étudiante'}</h2>
                                </header>
                                <p>
                                    La carte utilise la photo de votre profil. Choisissez un portrait net, de face, sur fond uni. Toute nouvelle photo
                                    doit être validée.
                                </p>
                                {!props.card_eligibility.ready && (
                                    <ul>
                                        {props.card_eligibility.reasons.map((reason) => (
                                            <li key={reason}>{reason}</li>
                                        ))}
                                    </ul>
                                )}
                                {props.card_eligibility.photo_status === 'approved' && (
                                    <p>
                                        <strong>Votre photo de profil est validée.</strong>
                                    </p>
                                )}
                                {props.card_eligibility.decision_note && <p>Note de l’administration : {props.card_eligibility.decision_note}</p>}
                                <Link className="portal-primary" href={href('profile')}>
                                    Gérer ma photo de profil
                                </Link>
                            </section>
                        )}
                        {section === 'overview' && props.overview && (
                            <StudentOverview
                                data={props.overview}
                                courses={props.courses}
                                calendarEvents={props.calendar_events}
                                academic={academic}
                                balance={balance}
                                permissions={permissions}
                            />
                        )}
                        {section === 'courses' &&
                            (props.courses.length ? (
                                <CoursesBySemester courses={props.courses} />
                            ) : (
                                <EmptyState title="Vos enseignements seront publiés ici." icon={BookOpen}>
                                    Aucun cours n’est encore publié pour votre niveau, votre année et votre groupe. Votre validation administrative
                                    reste effective.
                                </EmptyState>
                            ))}
                        {section === 'results' && props.official_results && <OfficialResults data={props.official_results} academic={academic.id} />}
                        {['materials', 'assignments', 'evaluations', 'results', 'announcements', 'documents'].includes(section) && (
                            <>
                                {['assignments', 'evaluations'].includes(section) && (
                                    <nav className="student-dossier-links" aria-label="Filtrer les activités">
                                        <Link href={href(section)} aria-current={!props.activity_filter ? 'page' : undefined}>
                                            Toutes
                                        </Link>
                                        {Object.entries(activityFilters).map(([value, label]) => (
                                            <Link
                                                key={value}
                                                href={`${href(section)}&activity=${value}`}
                                                aria-current={props.activity_filter === value ? 'page' : undefined}
                                            >
                                                {label}
                                            </Link>
                                        ))}
                                    </nav>
                                )}
                                {section === 'documents' && (
                                    <section className="portal-panel">
                                        <h2>Votre dossier d’inscription</h2>
                                        <p className="portal-muted">
                                            Les justificatifs de votre candidature restent consultables dans leur espace sécurisé.
                                        </p>
                                        <Link className="portal-secondary" href={`/dashboard/enrollments/${academic.application_uuid}`}>
                                            Consulter mon dossier
                                            <ArrowUpRight size={16} />
                                        </Link>
                                    </section>
                                )}
                                {section === 'documents' && props.work_archive.length > 0 && (
                                    <section className="portal-panel">
                                        <h2>Mes travaux transmis</h2>
                                        {props.work_archive.map((work) => (
                                            <article className="portal-ticket" key={work.id}>
                                                <h3>{work.title}</h3>
                                                <small>
                                                    {formatDate(work.submitted_at, true)} · Version {work.version}
                                                </small>
                                                {work.body && (
                                                    <details>
                                                        <summary>Lire mon travail</summary>
                                                        <p>{work.body}</p>
                                                    </details>
                                                )}
                                                {work.download_url && (
                                                    <a className="portal-secondary" href={work.download_url}>
                                                        <Download size={16} />
                                                        {work.filename}
                                                    </a>
                                                )}
                                            </article>
                                        ))}
                                    </section>
                                )}
                                {displayed.length ? (
                                    <div className="portal-resource-list">
                                        {displayed.map((resource) => (
                                            <article id={`resource-${resource.id}`} className="portal-panel portal-resource" key={resource.id}>
                                                <header>
                                                    <div>
                                                        <span>{resource.course}</span>
                                                        <h2>{resource.title}</h2>
                                                    </div>
                                                    {!resource.allowed && !resource.assessment?.feedback && <LockKeyhole size={19} />}
                                                </header>
                                                {resource.body && <p className="portal-resource-body">{resource.body}</p>}
                                                {!resource.allowed && !resource.assessment?.feedback && (
                                                    <div className="portal-lock-message">
                                                        <LockKeyhole size={16} />
                                                        <p>{resource.reason}</p>
                                                        <Link href={href('fees')}>Consulter mes frais</Link>
                                                    </div>
                                                )}
                                                {resource.download_url && (
                                                    <a className="portal-secondary" href={resource.download_url}>
                                                        <Download size={16} />
                                                        Télécharger le document
                                                    </a>
                                                )}
                                                {resource.closes_at && (
                                                    <p className="portal-muted">Date limite : {formatDate(resource.closes_at, true)}</p>
                                                )}
                                                {resource.assessment && (
                                                    <AssessmentInfo activity={resource.assessment} opens={resource.opens_at} onFeedback={notify} />
                                                )}
                                                {resource.submission && (
                                                    <p className="portal-submission-notice">
                                                        Travail transmis le {formatDate(resource.submission.submitted_at, true)} · Version{' '}
                                                        {resource.submission.version}
                                                        {resource.submission.download_url && (
                                                            <a href={resource.submission.download_url}>Télécharger mon dépôt</a>
                                                        )}
                                                        {resource.submission.id && (
                                                            <Link
                                                                href={route('dashboard.student.submissions.version', {
                                                                    submission: resource.submission.id,
                                                                    version: resource.submission.version,
                                                                    academic: academic.id,
                                                                })}
                                                            >
                                                                {' '}
                                                                Consulter mes versions
                                                            </Link>
                                                        )}
                                                    </p>
                                                )}
                                                {['assignment', 'evaluation'].includes(resource.kind) &&
                                                    (permissions[resource.kind === 'assignment' ? 'assignments_submit' : 'evaluations_participate']
                                                        .allowed ? (
                                                        <>
                                                            {Boolean(resource.supports?.length) && (
                                                                <ul aria-label="Supports associés">
                                                                    {resource.supports?.map((item) => (
                                                                        <li key={item.id}>
                                                                            <Link href={item.url}>{item.title}</Link>
                                                                            {item.download_url && <a href={item.download_url}> Télécharger</a>}
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            )}
                                                            {(!resource.assessment || resource.assessment.can_submit) && (
                                                                <WorkForm resource={resource} academic={academic.id} onFeedback={notify} />
                                                            )}
                                                        </>
                                                    ) : null)}
                                            </article>
                                        ))}
                                    </div>
                                ) : section === 'results' && props.official_results?.selected ? null : (
                                    <EmptyState title="Aucune publication disponible pour le moment.">
                                        Les éléments publiés pour votre formation apparaîtront ici. Aucune donnée provisoire n’est présentée comme un
                                        résultat officiel.
                                    </EmptyState>
                                )}
                            </>
                        )}
                        {['assignments', 'evaluations'].includes(section) && <Pagination value={props.work_pagination} />}
                        {section === 'fees' && (
                            <>
                                <PaymentOverview balance={balance} />
                                <section className="portal-panel">
                                    <h2>Les frais de votre formation</h2>
                                    {balance.assessed ? (
                                        <>
                                            <p className="portal-muted">
                                                Catégorie tarifaire :{' '}
                                                {academic.fee_category === 'foreign'
                                                    ? 'Étrangers'
                                                    : academic.fee_category === 'national'
                                                      ? 'Nationaux'
                                                      : 'À confirmer'}
                                                . Les montants ci-dessous constituent vos obligations enregistrées.
                                            </p>
                                            <div className="portal-fee-lines">
                                                {props.obligations.map((obligation) => (
                                                    <div key={obligation.id}>
                                                        <strong>{obligation.title}</strong>
                                                        <span>{money(obligation.amount_cents, balance.currency)}</span>
                                                        <small>
                                                            {obligation.due_at ? `Échéance : ${formatDate(obligation.due_at)}` : 'Échéance non fixée'}
                                                        </small>
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <p className="portal-muted">
                                                Votre catégorie n’est pas encore confirmée. Le service financier établira votre compte à partir du
                                                barème du niveau ; aucun montant n’est considéré comme exigible avant cette affectation.
                                            </p>
                                            <div className="portal-tariffs">
                                                {Object.entries(props.tariffs).map(([category, values]) => (
                                                    <article key={category}>
                                                        <h3>{category === 'foreign' ? 'Étrangers' : 'Nationaux'}</h3>
                                                        {values.map((value, index) => (
                                                            <p key={index}>
                                                                Tranche {index + 1}{' '}
                                                                <strong>
                                                                    {value !== null ? money(Number(value), balance.currency) : 'Non renseignée'}
                                                                </strong>
                                                            </p>
                                                        ))}
                                                    </article>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                    {props.finance_schedule && (
                                        <section aria-label="Échéancier applicable">
                                            <h3>Échéancier applicable</h3>
                                            {props.finance_schedule.map((line) => (
                                                <p key={line.id}>
                                                    {line.title} · {line.due_at ? formatDate(line.due_at) : 'Sans date'} · Reste :{' '}
                                                    {money(line.remaining_cents, balance.currency)} ·{' '}
                                                    {line.status === 'overdue'
                                                        ? 'En retard'
                                                        : line.status === 'paid'
                                                          ? 'Réglée'
                                                          : line.status === 'partial'
                                                            ? 'Partiellement réglée'
                                                            : 'À venir'}
                                                </p>
                                            ))}
                                        </section>
                                    )}
                                    {balance.pending_cents > 0 && (
                                        <p className="portal-alert">
                                            {money(balance.pending_cents, balance.currency)} en attente de confirmation : ce montant n’ouvre pas
                                            encore de nouveaux accès.
                                        </p>
                                    )}
                                    {balance.credit_cents > 0 && (
                                        <p className="portal-muted">
                                            Crédit non affecté aux autres types de frais : {money(balance.credit_cents, balance.currency)}. Contactez
                                            le service financier pour son affectation.
                                        </p>
                                    )}
                                    <p className="portal-muted">
                                        Pour effectuer un versement, contactez le service financier. Vos paiements sont pris en compte après
                                        confirmation comptable.
                                    </p>
                                    <Link className="portal-secondary" href={href('requests')}>
                                        Contacter le service financier
                                        <MessageSquare size={16} />
                                    </Link>
                                </section>
                                {props.adjustments.length > 0 && (
                                    <section className="portal-panel">
                                        <h2>Vos autorisations financières actives</h2>
                                        {props.adjustments.map((adjustment) => (
                                            <div className="portal-adjustment" key={adjustment.id}>
                                                <strong>{labels[adjustment.type] || adjustment.type}</strong>
                                                {adjustment.funding_source === 'third_party' && (
                                                    <p>Financement attendu d’un tiers — ne vaut pas règlement.</p>
                                                )}
                                                {adjustment.amount_cents !== null && <span>{money(adjustment.amount_cents, balance.currency)}</span>}
                                                {adjustment.expires_at && <small>Valable jusqu’au {formatDate(adjustment.expires_at)}</small>}
                                                {adjustment.schedule?.map((line, index) => (
                                                    <p key={index}>
                                                        {formatDate(line.due_at)} : {money(line.amount_cents, balance.currency)}
                                                    </p>
                                                ))}
                                            </div>
                                        ))}
                                    </section>
                                )}
                            </>
                        )}
                        {section === 'transactions' && (
                            <section className="portal-panel">
                                <h2>Vos versements et reçus</h2>
                                <Pagination value={props.payments_pagination} />
                                {props.payments.length ? (
                                    <div className="portal-payment-list">
                                        {props.payments.map((payment) => (
                                            <article key={payment.id}>
                                                <div>
                                                    <strong>{payment.reference}</strong>
                                                    <p>
                                                        {formatDate(payment.created_at)} ·{' '}
                                                        {payment.method === 'cash'
                                                            ? 'Espèces'
                                                            : payment.method === 'bank_transfer'
                                                              ? 'Virement'
                                                              : 'Autre mode'}
                                                    </p>
                                                    <span className={`portal-status is-${payment.status}`}>
                                                        {labels[payment.status] || payment.status}
                                                    </span>
                                                </div>
                                                <div>
                                                    <strong>{money(payment.amount_cents, payment.currency ?? balance.currency)}</strong>
                                                    {(payment.refunded_cents ?? 0) > 0 && (
                                                        <p>
                                                            Remboursement exécuté :{' '}
                                                            {money(payment.refunded_cents!, payment.currency ?? balance.currency)}
                                                        </p>
                                                    )}
                                                </div>
                                                {payment.receipt_url && (
                                                    <a href={payment.receipt_url} target="_blank" rel="noopener noreferrer">
                                                        <Download size={16} />
                                                        Reçu
                                                    </a>
                                                )}
                                            </article>
                                        ))}
                                    </div>
                                ) : (
                                    <EmptyState title="Aucun versement enregistré." icon={CreditCard}>
                                        Les versements saisis par la comptabilité et leurs confirmations apparaîtront ici.
                                    </EmptyState>
                                )}
                            </section>
                        )}
                        {section === 'requests' && (
                            <div className="portal-request-layout">
                                <section className="portal-panel">
                                    <h2>Comment pouvons-nous vous aider ?</h2>
                                    <RequestForm
                                        academic={academic.id}
                                        documentsAllowed={permissions.documents_request.allowed}
                                        onFeedback={notify}
                                    />
                                </section>
                                <section className="portal-panel">
                                    <h2>Le suivi de vos demandes</h2>
                                    {props.requests.length ? (
                                        props.requests.map((ticket) => (
                                            <article className="portal-ticket" key={ticket.id}>
                                                <span className={`portal-status is-${ticket.status}`}>{labels[ticket.status]}</span>
                                                <h3>{ticket.subject}</h3>
                                                <small>{formatDate(ticket.created_at)}</small>
                                                <p>{ticket.body}</p>
                                                {ticket.response && (
                                                    <div>
                                                        <strong>Réponse de l’administration</strong>
                                                        <p>{ticket.response}</p>
                                                    </div>
                                                )}
                                            </article>
                                        ))
                                    ) : (
                                        <EmptyState title="Aucune demande en cours." icon={MessageSquare}>
                                            Vos échanges avec l’administration seront conservés ici.
                                        </EmptyState>
                                    )}
                                </section>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Dashboard>
    );
}
