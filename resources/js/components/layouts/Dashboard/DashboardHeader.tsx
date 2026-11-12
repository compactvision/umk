import AdminNotifications from '@/components/admin/AdminNotifications';
import { Link } from '@inertiajs/react';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import React from 'react';
import DashboardThemeMenu from './DashboardThemeMenu';

const DashboardHeader = ({
    onMobileToggle,
    isMobileSidebarOpen = false,
    adminApps = false,
    enrollmentSpace = false,
    administration = false,
    teaching = false,
    teachingProfileActive = false,
    canManageCourses = false,
    authenticated = false,
    studentPortal = false,
    themeEnabled = false,
}: {
    onMobileToggle: (e: React.MouseEvent) => void;
    isMobileSidebarOpen?: boolean;
    adminApps?: boolean;
    enrollmentSpace?: boolean;
    administration?: boolean;
    teaching?: boolean;
    teachingProfileActive?: boolean;
    canManageCourses?: boolean;
    authenticated?: boolean;
    studentPortal?: boolean;
    themeEnabled?: boolean;
}) => {
    if (adminApps || enrollmentSpace || administration)
        return (
            <header className="admin-topbar">
                <div>
                    <button
                        type="button"
                        className="admin-mobile-toggle md:hidden"
                        aria-label={isMobileSidebarOpen ? 'Fermer la navigation' : 'Ouvrir la navigation'}
                        aria-expanded={isMobileSidebarOpen}
                        onClick={onMobileToggle}
                    >
                        {isMobileSidebarOpen ? <X size={21} /> : <Menu size={21} />}
                    </button>
                    <div>
                        <strong>Université Simon Kimbangu</strong>
                        <span>{enrollmentSpace ? (studentPortal ? 'ESPACE ÉTUDIANT' : 'ESPACE CANDIDATURE') : 'ESPACE ADMINISTRATION'}</span>
                    </div>
                </div>
                <div>
                    {themeEnabled && <DashboardThemeMenu />}
                    {enrollmentSpace ? <AdminNotifications audience="student" /> : administration && <AdminNotifications />}
                    {!studentPortal && (
                        <Link href="/" className="admin-site-link" aria-label="Voir le site">
                            <span className="usk-site-link-label">Voir le site</span>
                            <ArrowUpRight size={15} aria-hidden="true" />
                        </Link>
                    )}
                </div>
            </header>
        );
    return (
        <header className="fixed top-0 right-0 left-0 z-40 border-b border-gray-200 bg-white shadow-sm transition-all duration-300">
            <div
                className={`flex items-center justify-between px-4 py-3 transition-all duration-300 lg:px-6 ${
                    isMobileSidebarOpen
                        ? 'pl-[108px] lg:pl-[132px]' // Quand sidebar ouverte
                        : 'pl-4 lg:pl-[132px]' // Quand sidebar fermée (mobile)
                } `}
            >
                <div className="flex items-center space-x-4">
                    {authenticated && (
                        <button
                            className="rounded-lg p-2 transition-colors duration-200 hover:bg-gray-100 md:hidden"
                            id="mobileMenuToggle"
                            type="button"
                            aria-label={isMobileSidebarOpen ? 'Fermer la navigation' : 'Ouvrir la navigation'}
                            aria-expanded={isMobileSidebarOpen}
                            onClick={onMobileToggle}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" className="text-gray-600">
                                <path
                                    fill="currentColor"
                                    d="M22 18.005c0 .55-.446.995-.995.995h-8.01a.995.995 0 0 1 0-1.99h8.01c.55 0 .995.445.995.995M22 12c0 .55-.446.995-.995.995H2.995a.995.995 0 1 1 0-1.99h18.01c.55 0 .995.446.995.995m-.995-5.01a.995.995 0 0 0 0-1.99H8.995a.995.995 0 1 0 0 1.99z"
                                />
                            </svg>
                        </button>
                    )}

                    <nav className="hidden items-center space-x-6 lg:flex">
                        <Link href={route('home')} className="font-medium text-gray-700 transition-colors duration-200 hover:text-emerald-600">
                            Accueil
                        </Link>
                        {teaching && (
                            <>
                                <Link
                                    href={route('dashboard.teaching.index')}
                                    className="font-medium text-gray-700 transition-colors duration-200 hover:text-emerald-600"
                                >
                                    Mes cours
                                </Link>
                                {teachingProfileActive && (
                                    <>
                                        <Link
                                            href={route('dashboard.teaching.learning.index')}
                                            className="font-medium text-gray-700 transition-colors duration-200 hover:text-emerald-600"
                                        >
                                            Supports pédagogiques
                                        </Link>
                                        {canManageCourses && (
                                            <Link
                                                href={route('dashboard.teaching.assessments.index')}
                                                className="font-medium text-gray-700 transition-colors duration-200 hover:text-emerald-600"
                                            >
                                                Évaluations
                                            </Link>
                                        )}
                                    </>
                                )}
                            </>
                        )}
                    </nav>
                </div>
                {themeEnabled && <DashboardThemeMenu />}
            </div>
        </header>
    );
};

export default DashboardHeader;
