import AdminNotifications from '@/components/admin/AdminNotifications';
import { Link } from '@inertiajs/react';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import React from 'react';

const DashboardHeader = ({
    onMobileToggle,
    isMobileSidebarOpen = false,
    adminApps = false,
    enrollmentSpace = false,
    administration = false,
    studentPortal = false,
}: {
    onMobileToggle: (e: React.MouseEvent) => void;
    isMobileSidebarOpen?: boolean;
    adminApps?: boolean;
    enrollmentSpace?: boolean;
    administration?: boolean;
    studentPortal?: boolean;
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
                    {enrollmentSpace ? <AdminNotifications audience="student" /> : administration && <AdminNotifications />}
                    {!studentPortal && (
                        <Link href="/" className="admin-site-link">
                            Voir le site <ArrowUpRight size={15} />
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
                    <button
                        className="rounded-lg p-2 transition-colors duration-200 hover:bg-gray-100 lg:hidden"
                        id="mobileMenuToggle"
                        aria-label="Ouvrir le menu de navigation"
                        onClick={onMobileToggle}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" className="text-gray-600">
                            <path
                                fill="currentColor"
                                d="M22 18.005c0 .55-.446.995-.995.995h-8.01a.995.995 0 0 1 0-1.99h8.01c.55 0 .995.445.995.995M22 12c0 .55-.446.995-.995.995H2.995a.995.995 0 1 1 0-1.99h18.01c.55 0 .995.446.995.995m-.995-5.01a.995.995 0 0 0 0-1.99H8.995a.995.995 0 1 0 0 1.99z"
                            />
                        </svg>
                    </button>

                    <nav className="hidden items-center space-x-6 lg:flex">
                        <Link href={route('home')} className="font-medium text-gray-700 transition-colors duration-200 hover:text-emerald-600">
                            Accueil
                        </Link>
                        <Link href="#" className="font-medium text-gray-700 transition-colors duration-200 hover:text-emerald-600">
                            Projets
                        </Link>
                        <Link href="#" className="font-medium text-gray-700 transition-colors duration-200 hover:text-emerald-600">
                            Équipe
                        </Link>
                        <Link href="#" className="font-medium text-gray-700 transition-colors duration-200 hover:text-emerald-600">
                            Notifications
                        </Link>
                    </nav>
                </div>

                <div className="flex items-center space-x-4">
                    <div className="relative hidden md:block">
                        <span className="absolute top-1/2 left-3 -translate-y-1/2 transform text-gray-400">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">
                                <path
                                    fill="currentColor"
                                    d="M15.102 16.162a8 8 0 1 1 1.06-1.06l4.618 4.618a.75.75 0 1 1-1.06 1.06zM16.5 10a6.5 6.5 0 1 0-13 0a6.5 6.5 0 0 0 13 0"
                                />
                            </svg>
                        </span>
                        <input
                            type="search"
                            className="w-64 rounded-lg border border-gray-300 py-2 pr-4 pl-10 transition-all duration-200 focus:border-transparent focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                            placeholder="Rechercher..."
                            aria-label="Champ de recherche"
                        />
                    </div>

                    <div className="flex items-center space-x-2">
                        <button className="rounded-lg p-2 transition-colors duration-200 hover:bg-gray-100" aria-label="Paramètres de sécurité">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" className="text-gray-600">
                                <path
                                    fill="currentColor"
                                    d="M15 8V5s0-5-5-5a4.63 4.63 0 0 0-4.88 4h2C7.31 2.93 8 2 10 2c3 0 3 2 3 3.5V8H3.93A1.93 1.93 0 0 0 2 9.93v8.15A1.93 1.93 0 0 0 3.93 20h12.14A1.93 1.93 0 0 0 18 18.07V9.93A1.93 1.93 0 0 0 16.07 8zm-5 8a2 2 0 1 1 2-2a2 2 0 0 1-2 2"
                                />
                            </svg>
                        </button>
                        <button className="rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white transition-colors duration-200 hover:bg-emerald-700">
                            Nouvelle action
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default DashboardHeader;
