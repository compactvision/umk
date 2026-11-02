import FeedbackToast, { type ToastFeedback } from '@/components/admin/FeedbackToast';
import Dashboard from '@/components/layouts/Dashboard/Dashboard';
import ModuleLanding from '@/components/student/ModuleLanding';
import { studentModules, studentSectionLabels } from '@/components/student/navigation';
import {
    AcademicSummary,
    CourseCard,
    EmptyState,
    FinancialStatusBanner,
    PaymentOverview,
    StudentIdentityCard,
} from '@/components/student/PortalCards';
import StudentOverview from '@/components/student/StudentOverview';
import StudentProfileForm, { StudentPasswordModal } from '@/components/student/StudentProfileForm';
import StudentSchedule from '@/components/student/StudentSchedule';
import StudentWelcome from '@/components/student/StudentWelcome';
import { labels, money, type PortalProps, type Resource } from '@/components/student/types';
import { formatDate } from '@/lib/studentEnrollment';
import { Head, Link, router, useForm, usePoll } from '@inertiajs/react';
import { ArrowUpRight, BookOpen, CreditCard, Download, LayoutDashboard, LockKeyhole, MessageSquare, Send } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import '../../../../css/student-portal.css';
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
                            <span>{items.reduce((total, course) => total + Number(course.credits), 0)} crédits</span>
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

function WorkForm({ resource, academic, onFeedback }: { resource: Resource; academic: number; onFeedback: (message: string) => void }) {
    const input = useRef<HTMLInputElement>(null);
    const form = useForm<{ body: string; file: File | null }>({ body: resource.submission?.body || '', file: null });
    return (
        <form
            className="portal-form"
            onSubmit={(event) => {
                event.preventDefault();
                form.transform((data) => ({ ...data, file: input.current?.files?.[0] || null }));
                form.post(`/dashboard/student/resources/${resource.id}/submit?academic=${academic}`, {
                    forceFormData: true,
                    preserveScroll: true,
                    errorBag: `work-${resource.id}`,
                    onSuccess: () => {
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
    const [navigating, setNavigating] = useState(false);
    useEffect(() => {
        const offStart = router.on('start', (event) => {
            if (event.detail.visit.method === 'get' && !event.detail.visit.only.length) setNavigating(true);
        });
        const offFinish = router.on('finish', (event) => {
            if (event.detail.visit.method === 'get' && !event.detail.visit.only.length) setNavigating(false);
        });
        return () => {
            offStart();
            offFinish();
        };
    }, []);
    usePoll(30000, {
        only: ['permissions', 'balance', 'resources', 'payments', 'requests', 'overview', 'sessions', 'upcoming_sessions', 'schedule_week'],
    });
    const href = (section = 'overview') => `/dashboard/student/${section}?academic=${academic.id}`;
    const sectionFeatures: Record<string, string> = {
        materials: 'materials_download',
        assignments: 'assignments_submit',
        evaluations: 'evaluations_participate',
        results: 'results_view',
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
    const displayed = resources.filter((resource) => resource.kind === resourceKind[section]);
    if (section === 'schedule') {
        return (
            <Dashboard>
                <Head title={`Horaire · ${academic.level}`} />
                <div className="student-portal is-schedule">
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
                    <StudentSchedule sessions={props.sessions} week={props.schedule_week} academic={academic.id} promotion={academic} />
                </div>
            </Dashboard>
        );
    }

    return (
        <Dashboard>
            <Head title={section === 'profile' ? 'Mon profil étudiant' : 'Mon espace étudiant'} />
            {passwordOpen && <StudentPasswordModal academic={academic.id} onClose={() => setPasswordOpen(false)} onFeedback={notify} />}
            {toast && <FeedbackToast key={toast.id} feedback={toast} onDismiss={() => setToast(null)} />}
            <div className={`student-portal ${section === 'overview' ? 'is-overview' : section === 'profile' ? 'is-profile' : ''}`}>
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
                <StudentWelcome academic={academic} pending={props.welcome_pending && section === 'overview'} />
                <StudentIdentityCard
                    academic={academic}
                    onChangePassword={section === 'profile' ? () => setPasswordOpen(true) : undefined}
                    courseCount={permissions.courses_view.allowed ? (props.overview?.course_count ?? props.courses.length) : null}
                />
                {!['overview', 'profile'].includes(section) && <AcademicSummary academic={academic} />}
                {!['overview', 'profile'].includes(section) && <FinancialStatusBanner balance={balance} href={href('fees')} />}
                {(academic.enrollment_status !== 'confirmed' || academic.student_status !== 'active') && (
                    <p className="portal-alert">
                        Votre profil est {labels[academic.student_status]?.toLowerCase() || academic.student_status} et votre inscription est{' '}
                        {labels[academic.enrollment_status]?.toLowerCase() || academic.enrollment_status}. Votre identité, vos frais et l’assistance
                        restent consultables.
                    </p>
                )}
                {!['overview', 'profile'].includes(section) && (
                    <>
                        <nav className="portal-modules" aria-label="Rubriques de l’espace étudiant">
                            {studentModules.map((module) => (
                                <Link key={module.id} href={href(module.id)} aria-current={activeModule.id === module.id ? 'page' : undefined}>
                                    <module.icon size={19} />
                                    <span>
                                        {module.title}
                                        <small>{module.description}</small>
                                    </span>
                                </Link>
                            ))}
                        </nav>
                        {activeModule.sections.length > 1 && (
                            <nav className="portal-tabs" aria-label={`Navigation : ${activeModule.title}`}>
                                {activeModule.sections
                                    .filter((key) => permissions[sectionFeatures[key]]?.visible !== false)
                                    .map((key) => (
                                        <Link key={key} href={href(key)} aria-current={section === key ? 'page' : undefined}>
                                            {studentSectionLabels[key]}
                                        </Link>
                                    ))}
                            </nav>
                        )}
                    </>
                )}
                <div className={`portal-body ${navigating ? 'is-loading' : ''}`} aria-busy={navigating}>
                    {navigating && (
                        <div className="portal-skeleton" role="status">
                            <span>Chargement de votre espace…</span>
                            <div aria-hidden="true">
                                <i />
                                <i />
                                <i />
                            </div>
                        </div>
                    )}
                    <div className="portal-section-heading">
                        <div>
                            <span>{academic.year}</span>
                            <h2>{studentSectionLabels[section] || 'Mon espace'}</h2>
                        </div>
                        <span className={`portal-status is-${balance.financial_clearance_status}`}>
                            {labels[balance.financial_clearance_status] || balance.financial_clearance_status}
                        </span>
                    </div>
                    {section !== 'profile' && <ModuleLanding section={section} academic={academic.id} permissions={permissions} />}
                    {section === 'profile' && props.profile_form && (
                        <StudentProfileForm key={academic.id} academic={academic} profile={props.profile_form} onFeedback={notify} />
                    )}
                    {section === 'overview' && props.overview && (
                        <StudentOverview
                            data={props.overview}
                            courses={props.courses}
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
                                Aucun cours n’est encore publié pour votre niveau, votre année et votre groupe. Votre validation administrative reste
                                effective.
                            </EmptyState>
                        ))}
                    {['materials', 'assignments', 'evaluations', 'results', 'announcements', 'documents'].includes(section) && (
                        <>
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
                                                {!resource.allowed && <LockKeyhole size={19} />}
                                            </header>
                                            {resource.body && <p className="portal-resource-body">{resource.body}</p>}
                                            {!resource.allowed && (
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
                                            {resource.submission && (
                                                <p className="portal-submission-notice">
                                                    Travail transmis le {formatDate(resource.submission.submitted_at, true)} · Version{' '}
                                                    {resource.submission.version}
                                                    {resource.submission.download_url && (
                                                        <a href={resource.submission.download_url}>Télécharger mon dépôt</a>
                                                    )}
                                                </p>
                                            )}
                                            {['assignment', 'evaluation'].includes(resource.kind) &&
                                                (permissions[resource.kind === 'assignment' ? 'assignments_submit' : 'evaluations_participate']
                                                    .allowed ? (
                                                    <WorkForm resource={resource} academic={academic.id} onFeedback={notify} />
                                                ) : (
                                                    <p className="portal-lock-message">
                                                        {
                                                            permissions[
                                                                resource.kind === 'assignment' ? 'assignments_submit' : 'evaluations_participate'
                                                            ].reason
                                                        }
                                                    </p>
                                                ))}
                                        </article>
                                    ))}
                                </div>
                            ) : (
                                <EmptyState title="Aucune publication disponible pour le moment.">
                                    Les éléments publiés pour votre formation apparaîtront ici. Aucune donnée provisoire n’est présentée comme un
                                    résultat officiel.
                                </EmptyState>
                            )}
                        </>
                    )}
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
                                            Votre catégorie n’est pas encore confirmée. Le service financier établira votre compte à partir du barème
                                            du niveau ; aucun montant n’est considéré comme exigible avant cette affectation.
                                        </p>
                                        <div className="portal-tariffs">
                                            {Object.entries(props.tariffs).map(([category, values]) => (
                                                <article key={category}>
                                                    <h3>{category === 'foreign' ? 'Étrangers' : 'Nationaux'}</h3>
                                                    {values.map((value, index) => (
                                                        <p key={index}>
                                                            Tranche {index + 1}{' '}
                                                            <strong>
                                                                {value !== null
                                                                    ? money(Math.round(Number(value) * 100), balance.currency)
                                                                    : 'Non renseignée'}
                                                            </strong>
                                                        </p>
                                                    ))}
                                                </article>
                                            ))}
                                        </div>
                                    </>
                                )}
                                {balance.pending_cents > 0 && (
                                    <p className="portal-alert">
                                        {money(balance.pending_cents, balance.currency)} en attente de confirmation : ce montant n’ouvre pas encore de
                                        nouveaux accès.
                                    </p>
                                )}
                                {balance.credit_cents > 0 && (
                                    <p className="portal-muted">
                                        Crédit non affecté aux autres types de frais : {money(balance.credit_cents, balance.currency)}. Contactez le
                                        service financier pour son affectation.
                                    </p>
                                )}
                                <p className="portal-muted">
                                    Pour effectuer un versement, contactez le service financier. Vos paiements sont pris en compte après confirmation
                                    comptable.
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
                                            <strong>{labels[adjustment.type]}</strong>
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
                                            <strong>{money(payment.amount_cents, balance.currency)}</strong>
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
                                <RequestForm academic={academic.id} documentsAllowed={permissions.documents_request.allowed} onFeedback={notify} />
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
        </Dashboard>
    );
}
