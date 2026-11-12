import { formatDate } from '@/lib/studentEnrollment';
import { Link } from '@inertiajs/react';
import {
    ArrowUpRight,
    CalendarDays,
    FileText,
    GraduationCap,
    Info,
    KeyRound,
    LockKeyhole,
    Mail,
    Phone,
    UserRound,
    type LucideIcon,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { labels, money, type Academic, type Balance, type Permission } from './types';
export function EmptyState({ title, children, icon: Icon = FileText }: { title: string; children: ReactNode; icon?: LucideIcon }) {
    return (
        <div className="portal-empty">
            <Icon size={31} strokeWidth={1.4} />
            <h3>{title}</h3>
            <p>{children}</p>
        </div>
    );
}
export function StudentIdentityCard({
    academic,
    courseCount,
    onChangePassword,
}: {
    academic: Academic;
    courseCount?: number | null;
    onChangePassword?: () => void;
}) {
    if (courseCount !== undefined) {
        return (
            <header className="portal-profile-cover-card">
                <div className="portal-profile-cover" aria-hidden="true" />
                <div className="portal-profile-content">
                    <div className="portal-profile-portrait">
                        {academic.photo_url ? (
                            <img src={academic.photo_url} alt={`Photo de profil de ${academic.name}`} />
                        ) : (
                            <UserRound size={58} strokeWidth={1.1} aria-hidden="true" />
                        )}
                    </div>
                    <span className="portal-profile-eyebrow">ESPACE ÉTUDIANT · {academic.year}</span>
                    <h1>{academic.name}</h1>
                    <p className="portal-profile-faculty">{academic.faculty}</p>
                    <a className="portal-profile-contact" href={`mailto:${academic.email}`}>
                        <Mail size={17} aria-hidden="true" />
                        {academic.email}
                    </a>
                    {academic.phone && (
                        <a className="portal-profile-contact" href={`tel:${academic.phone.replace(/[^+0-9]/g, '')}`}>
                            <Phone size={16} aria-hidden="true" />
                            {academic.phone}
                        </a>
                    )}
                    {onChangePassword && (
                        <button type="button" className="profile-password-trigger" onClick={onChangePassword}>
                            <KeyRound size={15} />
                            Changer mon mot de passe
                        </button>
                    )}
                    <p className="portal-profile-identifier">
                        <span>ID · Matricule</span>
                        <strong>{academic.matricule || 'Non renseigné'}</strong>
                    </p>
                    <Link
                        className="portal-profile-course-total"
                        href={
                            courseCount === null
                                ? `/dashboard/student/requests?academic=${academic.id}`
                                : `/dashboard/student/courses?academic=${academic.id}`
                        }
                    >
                        <strong>{courseCount === null ? 'Accès limité' : courseCount}</strong>
                        <span>
                            {courseCount === 1 ? 'Cours suivi en' : 'Cours suivis en'} {academic.level}
                        </span>
                        <small>
                            {courseCount === null ? 'Contacter le service' : 'Consulter mes enseignements'}
                            <ArrowUpRight size={13} aria-hidden="true" />
                        </small>
                    </Link>
                </div>
            </header>
        );
    }
    return (
        <header className="portal-identity">
            <div className="portal-avatar">
                {academic.photo_url ? (
                    <img src={academic.photo_url} alt={`Photo de profil de ${academic.name}`} />
                ) : (
                    <UserRound size={35} strokeWidth={1.2} />
                )}
            </div>
            <div className="portal-identity-info">
                <span>VOTRE ESPACE PERSONNEL</span>
                <h1>Bienvenue, {academic.name}.</h1>
                <a className="portal-identity-email" href={`mailto:${academic.email}`}>
                    <Mail size={14} aria-hidden="true" />
                    {academic.email}
                </a>
                <dl className="portal-identity-id">
                    <dt>ID · Matricule</dt>
                    <dd>{academic.matricule || 'Non renseigné'}</dd>
                </dl>
                <span className={`portal-status is-${academic.student_status}`}>{labels[academic.student_status] || academic.student_status}</span>
            </div>
        </header>
    );
}
export function AcademicSummary({ academic }: { academic: Academic }) {
    return (
        <section className="portal-academic-summary" aria-label="Votre inscription académique">
            {[
                ['Faculté', academic.faculty],
                ['Niveau / programme', academic.level],
                ['Année académique', academic.year],
                ['Promotion / groupe', academic.group || 'Non affecté'],
                ['Inscription académique', labels[academic.enrollment_status] || academic.enrollment_status],
                ['Situation étudiante', labels[academic.student_status] || academic.student_status],
            ].map(([label, value]) => (
                <div key={label}>
                    <span>{label}</span>
                    <strong>{value}</strong>
                </div>
            ))}
        </section>
    );
}
export function FinancialStatusBanner({ balance, href }: { balance: Balance; href: string }) {
    if (balance.assessed && balance.balance_cents === 0) return null;
    return (
        <section className="portal-financial-banner">
            <Info size={21} strokeWidth={1.5} />
            <div>
                <strong>Votre espace étudiant est ouvert.</strong>
                <p>
                    {balance.assessed
                        ? 'Consultez votre situation financière et les conditions propres aux services pédagogiques. Un seuil d’activation peut différer du règlement intégral.'
                        : 'Le service financier doit confirmer votre catégorie tarifaire. Votre identité, vos cours publiés, votre emploi du temps et l’assistance restent consultables.'}
                </p>
            </div>
            <Link href={href}>
                Consulter mes frais <ArrowUpRight size={16} />
            </Link>
        </section>
    );
}
export function LockedFeatureCard({
    title,
    subtitle,
    icon: Icon,
    href,
    permission,
    available = true,
    regularizationHref,
}: {
    title: string;
    subtitle: string;
    icon: LucideIcon;
    href: string;
    permission: Permission;
    available?: boolean;
    regularizationHref: string;
}) {
    if (permission.visible === false) return null;
    const locked = available && !permission.allowed;
    const content = (
        <>
            <div>
                <span>
                    <Icon size={22} strokeWidth={1.5} />
                </span>
                {locked ? <LockKeyhole size={15} /> : permission.allowed ? <ArrowUpRight size={17} /> : null}
            </div>
            <h3>{title}</h3>
            <p>{subtitle}</p>
            {locked && <small>{permission.reason}</small>}
            {!available && <small>Les prochaines publications apparaîtront ici.</small>}
        </>
    );
    return !permission.allowed ? (
        <article className={`portal-feature-card ${locked ? 'is-locked' : ''}`}>
            {content}
            {locked && (
                <Link className="portal-access-link" href={regularizationHref}>
                    Comprendre les conditions d’accès
                </Link>
            )}
        </article>
    ) : (
        <Link href={href} className="portal-feature-card">
            {content}
        </Link>
    );
}
export function CourseCard({
    course,
}: {
    course: {
        detail_url?: string;
        title: string;
        code: string | null;
        teacher: string | null;
        credits: number;
        semester: string | null;
        catalog_only?: boolean;
        registered?: boolean;
        is_optional?: boolean;
        archived?: boolean;
        unit?: string | null;
    };
}) {
    return (
        <article className="portal-course">
            <GraduationCap size={25} strokeWidth={1.4} />
            <span>{course.code || (course.catalog_only ? 'PROGRAMME DU NIVEAU' : 'ENSEIGNEMENT PUBLIÉ')}</span>
            <h3>{course.detail_url ? <Link href={course.detail_url}>{course.title}</Link> : course.title}</h3>
            <p>{course.catalog_only ? 'Au programme · enseignant à confirmer' : course.teacher || 'Enseignant non renseigné'}</p>
            <p>
                {[course.unit ? `UE ${course.unit}` : '', course.is_optional ? 'Optionnel' : '', course.archived ? 'Offre archivée' : '']
                    .filter(Boolean)
                    .join(' · ')}
            </p>
            <footer>
                <span>
                    {course.credits ?? '—'} crédits {course.registered ? 'inscrits' : 'prévus'}
                </span>
                <span>{course.semester || 'Période non précisée'}</span>
            </footer>
        </article>
    );
}
export function SchedulePreview({ sessions }: { sessions: { id: number; course: string; starts_at: string; ends_at: string; room: string }[] }) {
    return sessions.length ? (
        <div className="portal-sessions">
            {sessions.map((session) => (
                <article key={session.id}>
                    <CalendarDays size={20} />
                    <div>
                        <h3>{session.course}</h3>
                        <p>
                            {formatDate(session.starts_at, true)} –{' '}
                            {new Date(session.ends_at).toLocaleTimeString('fr-FR', {
                                timeZone: 'Africa/Kinshasa',
                                hour: '2-digit',
                                minute: '2-digit',
                            })}
                        </p>
                    </div>
                    <span>{session.room}</span>
                </article>
            ))}
        </div>
    ) : (
        <EmptyState title="Votre emploi du temps sera publié ici." icon={CalendarDays}>
            Aucune séance publiée pour votre niveau et votre groupe sur la période courante.
        </EmptyState>
    );
}
export function PaymentOverview({ balance }: { balance: Balance }) {
    return (
        <div className="portal-payment-overview">
            {[
                ['Frais applicables', balance.total_cents],
                ['Bourses / exonérations', balance.waived_cents],
                ['Versements confirmés', balance.paid_cents],
                ['Solde restant', balance.balance_cents],
            ].map(([label, value]) => (
                <div key={label}>
                    <span>{label}</span>
                    <strong>{balance.assessed ? money(Number(value), balance.currency) : 'À confirmer'}</strong>
                </div>
            ))}
        </div>
    );
}
