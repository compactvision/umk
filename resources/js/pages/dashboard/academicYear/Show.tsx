import AdminModal from '@/components/admin/AdminModal';
import Pagination from '@/components/admin/Pagination';
import CreateAcademicYearPopup from '@/components/form/CreateAcademicYearPopup';
import Dashboard from '@/components/layouts/Dashboard/Dashboard';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    ArrowRight,
    CalendarDays,
    CalendarRange,
    Check,
    CircleCheck,
    Clock3,
    DoorClosed,
    DoorOpen,
    FileClock,
    Info,
    Pencil,
    Users,
} from 'lucide-react';
import { useState, type FormEvent } from 'react';
import '../../../../css/dashboard/academic-year-detail.css';
import '../../../../css/dashboard/academic-years.css';
import type { AcademicYear } from './Index';
type Enrollment = { id: number; student_name: string; level_title?: string; level_code?: string; status: string; status_label: string };
type EnrollmentPage = { data: Enrollment[]; total: number };
type Stats = { total: number; validated: number; pending: number; draft: number };
const date = (value: string) => {
    const parsed = new Date(`${value.slice(0, 10)}T12:00:00`);
    return Number.isNaN(parsed.getTime()) ? 'À préciser' : parsed.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
};
export default function AcademicYearShow({
    academicYear,
    enrollmentStats,
    enrollments,
}: {
    academicYear: AcademicYear | { data: AcademicYear };
    enrollmentStats: Stats;
    enrollments: EnrollmentPage;
}) {
    const year = 'data' in academicYear ? academicYear.data : academicYear;
    const [editing, setEditing] = useState(false);
    const [closing, setClosing] = useState(false);
    const action = useForm({});
    const closeYear = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!action.processing)
            action.patch(route('dashboard.admin.academic-years.close', year.id), { preserveScroll: true, onSuccess: () => setClosing(false) });
    };
    const openYear = () => {
        if (!action.processing) {
            action.clearErrors();
            action.patch(route('dashboard.admin.academic-years.open', year.id), { preserveScroll: true });
        }
    };
    const labels = { draft: 'Brouillon', open: 'Ouverte', closed: 'Clôturée' };
    const stats = [
        { label: 'Dossiers d’inscription', value: enrollmentStats.total, icon: Users },
        { label: 'Inscriptions validées', value: enrollmentStats.validated, icon: CircleCheck },
        { label: 'À examiner', value: enrollmentStats.pending, icon: FileClock },
        { label: 'Brouillons', value: enrollmentStats.draft, icon: Pencil },
    ];
    return (
        <Dashboard hideAppsNavigation>
            <Head title={`${year.title} · Année académique`} />
            <div className="academic-years-page academic-year-detail">
                <div className="ayd-topline">
                    <span>GESTION UNIVERSITAIRE · CALENDRIER</span>
                    <div className="ayd-actions">
                        {year.status !== 'closed' && (
                            <button className="ayd-edit" disabled={action.processing} onClick={() => setEditing(true)}>
                                <Pencil size={15} />
                                Modifier l’année
                            </button>
                        )}
                        {year.status === 'open' && (
                            <button
                                className="ayd-close"
                                disabled={action.processing}
                                onClick={() => {
                                    action.clearErrors();
                                    setClosing(true);
                                }}
                            >
                                <DoorClosed size={15} />
                                Clôturer l’année
                            </button>
                        )}
                        {year.status === 'draft' && (
                            <button className="admin-primary" disabled={action.processing} onClick={openYear}>
                                <DoorOpen size={16} />
                                Ouvrir les inscriptions
                            </button>
                        )}
                    </div>
                </div>
                <header className="ayd-hero">
                    <div>
                        <span className="ay-eyebrow">ANNÉE ACADÉMIQUE</span>
                        <h1>{year.title}</h1>
                        <p>
                            {year.status === 'open'
                                ? 'Une année en cours, des parcours qui se construisent.'
                                : year.status === 'closed'
                                  ? 'Une période clôturée, des parcours à retrouver.'
                                  : 'Préparez le calendrier et les prochaines inscriptions.'}
                        </p>
                        <span className={`ay-badge is-${year.status}`}>
                            {year.status === 'open' ? <Check size={13} /> : <Clock3 size={13} />}
                            {labels[year.status]}
                        </span>
                    </div>
                    <div className="ayd-calendar-seal" aria-hidden="true">
                        <CalendarRange size={58} strokeWidth={1.1} />
                        <span>UNIVERSITÉ SIMON KIMBANGU</span>
                    </div>
                </header>
                {!closing &&
                    Object.values(action.errors).map((message) => (
                        <div className="ay-error" role="alert" key={String(message)}>
                            <Info size={17} />
                            {String(message)}
                        </div>
                    ))}
                <section className="ayd-calendar" aria-label="Dates et état des inscriptions">
                    <div>
                        <span className="ayd-icon">
                            <CalendarDays size={22} strokeWidth={1.5} />
                        </span>
                        <p>
                            <span>Début de l’année</span>
                            <strong>{date(year.start_date)}</strong>
                        </p>
                    </div>
                    <div>
                        <span className="ayd-icon">
                            <CalendarRange size={22} strokeWidth={1.5} />
                        </span>
                        <p>
                            <span>Fin de l’année</span>
                            <strong>{date(year.end_date)}</strong>
                        </p>
                    </div>
                    <div>
                        <span className="ayd-icon">
                            {year.status === 'open' ? <DoorOpen size={22} strokeWidth={1.5} /> : <DoorClosed size={22} strokeWidth={1.5} />}
                        </span>
                        <p>
                            <span>Inscriptions</span>
                            <strong>{year.status === 'open' ? 'Ouvertes' : year.status === 'closed' ? 'Clôturées' : 'Non ouvertes'}</strong>
                        </p>
                    </div>
                </section>
                <section className="ayd-enrollments" aria-labelledby="ayd-enrollments-heading">
                    <div className="ayd-section-heading">
                        <div>
                            <span>LES PARCOURS DE CETTE ANNÉE</span>
                            <h2 id="ayd-enrollments-heading">Les inscriptions, en perspective.</h2>
                            <p>Les dossiers rattachés uniquement à l’année {year.title}.</p>
                        </div>
                        <Link href={route('dashboard.admin.enrollments.index') + `?year_id=${year.id}`}>
                            Gérer les inscriptions
                            <ArrowRight size={16} />
                        </Link>
                    </div>
                    <div className="ayd-stats">
                        {stats.map((stat) => (
                            <div key={stat.label}>
                                <stat.icon size={22} strokeWidth={1.5} />
                                <strong>{stat.value}</strong>
                                <span>{stat.label}</span>
                            </div>
                        ))}
                    </div>
                    {enrollments.data.length ? (
                        <div className="ayd-dossier-list">
                            <div className="ayd-list-heading">
                                <h3>Les derniers dossiers</h3>
                                <span>
                                    {enrollments.total} dossier{enrollments.total > 1 ? 's' : ''}
                                </span>
                            </div>
                            {enrollments.data.map((enrollment) => (
                                <Link className="ayd-dossier" href={route('dashboard.admin.enrollments.show', enrollment.id)} key={enrollment.id}>
                                    <span className="ayd-avatar">{enrollment.student_name.charAt(0).toLocaleUpperCase('fr')}</span>
                                    <div>
                                        <strong>{enrollment.student_name}</strong>
                                        <p>{[enrollment.level_code, enrollment.level_title].filter(Boolean).join(' · ') || 'Niveau non renseigné'}</p>
                                    </div>
                                    <span className={`ayd-enrollment-status is-${enrollment.status}`}>{enrollment.status_label}</span>
                                    <ArrowRight size={16} />
                                </Link>
                            ))}
                            <Pagination value={enrollments} />
                        </div>
                    ) : (
                        <div className="ay-empty">
                            <Users size={37} strokeWidth={1.3} />
                            <h2>Les premiers dossiers sont à venir.</h2>
                            <p>Aucune inscription n’est encore rattachée à cette année académique.</p>
                        </div>
                    )}
                </section>
                <div className="ayd-footnote">
                    <Info size={16} />
                    <p>
                        {year.status === 'closed'
                            ? 'Cette année est clôturée. Les dossiers et les informations enregistrés restent consultables.'
                            : 'La clôture ferme les inscriptions de cette année et conserve les dossiers déjà enregistrés.'}
                    </p>
                </div>
                {editing && <CreateAcademicYearPopup academicYear={year} closeModal={() => setEditing(false)} />}
                {closing && (
                    <AdminModal
                        className="ay-close-modal"
                        title="Clôturer les inscriptions ?"
                        description="Vérifiez l’année concernée avant de confirmer cette action."
                        onClose={() => setClosing(false)}
                        formId="close-year-detail-form"
                        submitLabel="Confirmer la clôture"
                        busy={action.processing}
                        errors={action.errors}
                    >
                        <form id="close-year-detail-form" onSubmit={closeYear} className="admin-modal-form">
                            <div className="ay-close-target">
                                <DoorClosed size={27} strokeWidth={1.5} />
                                <div>
                                    <span>ANNÉE ACADÉMIQUE</span>
                                    <strong>{year.title}</strong>
                                </div>
                            </div>
                            <p className="ay-close-message">
                                Les inscriptions seront fermées pour cette année. Les dossiers et les informations déjà enregistrés seront conservés.
                            </p>
                        </form>
                    </AdminModal>
                )}
            </div>
        </Dashboard>
    );
}
