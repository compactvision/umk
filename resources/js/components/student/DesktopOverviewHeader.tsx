import { Link } from '@inertiajs/react';
import { ArrowUpRight, BookOpen, ChevronRight, GraduationCap, LayoutDashboard, TriangleAlert } from 'lucide-react';
import type { Academic, StudentOverviewData } from './types';
export default function DesktopOverviewHeader({
    academic,
    overview,
    onGuide,
}: {
    academic: Academic;
    overview: StudentOverviewData | null;
    onGuide: () => void;
}) {
    const alerts = (overview?.alerts ?? []).filter((alert) => alert.id !== 'documents');
    return (
        <div className="student-desktop-intro">
            <nav className="student-desktop-breadcrumb" aria-label="Fil d’Ariane de votre espace">
                <Link href={`/dashboard/student?academic=${academic.id}`}>
                    <LayoutDashboard size={15} />
                    Accueil
                </Link>
                <ChevronRight size={14} />
                <span>{academic.level}</span>
                <span className="student-desktop-year">
                    <GraduationCap size={17} />
                    {academic.year}
                </span>
            </nav>
            {alerts.length > 0 && (
                <div className="student-desktop-alerts">
                    {alerts.map((alert) => (
                        <div key={alert.id} className={`student-desktop-alert is-${alert.tone}`}>
                            <TriangleAlert size={19} />
                            <div>
                                <strong>{alert.title}</strong>
                                <p>{alert.message}</p>
                            </div>
                            <Link href={`/dashboard/student/${alert.section}?academic=${academic.id}`}>
                                Consulter
                                <ArrowUpRight size={15} />
                            </Link>
                        </div>
                    ))}
                </div>
            )}
            <section className="student-desktop-welcome" aria-label="Bienvenue dans votre espace étudiant">
                <div className="student-desktop-welcome-icon">
                    <LayoutDashboard size={28} strokeWidth={1.5} />
                </div>
                <div>
                    <span>VOTRE PARCOURS, VOTRE AVENIR</span>
                    <p>Bienvenue, {academic.name.split(' ')[0]}.</p>
                    <small>Vos cours, vos horaires et vos ressources. Tout votre parcours, au même endroit.</small>
                </div>
                <button type="button" onClick={onGuide}>
                    <BookOpen size={17} />
                    Guide de mon espace
                    <ArrowUpRight size={15} />
                </button>
            </section>
        </div>
    );
}
