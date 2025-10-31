import Alert from '@/utils/sweetAlert';
import { router } from '@inertiajs/react';
import {
    Award,
    BarChart3,
    Bell,
    BookOpen,
    Calendar,
    ChevronRight,
    Clock,
    FileText,
    GraduationCap,
    Grid3x3,
    Home,
    Lock,
    LogOut,
    Mail,
    Settings,
    Shield,
    TrendingUp,
    User,
    Users,
    X,
} from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { route } from 'ziggy-js';

// Types pour les rôles
type UserRole = 'user' | 'student' | 'instructor' | 'admin' | 'super_admin';

// Configuration des permissions par rôle
const rolePermissions: Record<UserRole, string[]> = {
    user: ['enrollments'],
    student: ['dashboard', 'settings'],
    instructor: ['analytics', 'reports', 'settings'],
    admin: ['dashboard', 'analytics', 'reports', 'users', 'settings'],
    super_admin: ['dashboard', 'analytics', 'reports', 'users', 'settings'],
};

const Sidebar = ({
    onButtonClick,
    isMobileSidebarOpen,
    currentActiveMenu,
    userRole = 'user',
}: {
    onButtonClick: (e: React.MouseEvent, menuId: string) => void;
    isMobileSidebarOpen: boolean;
    currentActiveMenu: string | null;
    userRole?: UserRole | null;
}) => {
    const sidebarRef = useRef<HTMLDivElement>(null);
    const menuRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [hoveredItem, setHoveredItem] = useState<string | null>(null);
    const [isClosing, setIsClosing] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [menuAnimations, setMenuAnimations] = useState<{ [key: string]: boolean }>({});

    useEffect(() => {
        const handleResize = () => {
            const newIsMobile = window.innerWidth <= 768;
            setIsMobile(newIsMobile);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Fermeture au clic en dehors
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (currentActiveMenu && menuRefs.current[currentActiveMenu]) {
                const menuElement = menuRefs.current[currentActiveMenu];
                if (menuElement && !menuElement.contains(event.target as Node)) {
                    handleCloseMenu(currentActiveMenu);
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [currentActiveMenu]);

    // Animation d'entrée des menus
    useEffect(() => {
        if (currentActiveMenu) {
            setMenuAnimations((prev) => ({ ...prev, [currentActiveMenu]: true }));
        }
    }, [currentActiveMenu]);

    const handleLogout = async () => {
        const result = await Alert.confirm('Êtes-vous sûr de vouloir vous déconnecter?');

        if (result.isConfirmed) {
            Alert.loading('Déconnexion en cours...');

            router.post(
                '/logout',
                {},
                {
                    onFinish: () => {
                        Alert.close();
                    }
                },
            );
        }
    };

    const handleCloseMenu = useCallback(
        (menuId: string) => {
            setIsClosing(menuId);
            setMenuAnimations((prev) => ({ ...prev, [menuId]: false }));
            setTimeout(() => {
                onButtonClick(new MouseEvent('click') as any, '');
                setIsClosing(null);
            }, 300);
        },
        [onButtonClick],
    );

    const hasPermission = (menuId: string): boolean => {
        return rolePermissions[userRole as UserRole]?.includes(menuId) || false;
    };

    const menuItems = [
        {
            id: 'dashboard',
            label: 'Student',
            ariaLabel: 'Tableau de bord',
            icon: <GraduationCap size={isMobile ? 20 : 24} />,
        },
        {
            id: 'analytics',
            label: 'Instructor',
            ariaLabel: 'Analyses et statistiques',
            icon: <BarChart3 size={isMobile ? 20 : 24} />,
        },
        {
            id: 'reports',
            label: 'Apps',
            ariaLabel: 'Rapports',
            icon: <Grid3x3 size={isMobile ? 20 : 24} />,
        },
        {
            id: 'users',
            label: 'Account',
            ariaLabel: 'Gestion des utilisateurs',
            icon: <Users size={isMobile ? 20 : 24} />,
        },
        {
            id: 'settings',
            label: 'Settings',
            ariaLabel: "Paramètres de l'application",
            icon: <Settings size={isMobile ? 20 : 24} />,
        },
        {
            id: 'enrollments',
            label: 'Enroll',
            ariaLabel: 'Gestion des inscriptions',
            icon: <BookOpen size={isMobile ? 20 : 24} />,
        },
    ];

    const visibleMenuItems = menuItems.filter((item) => hasPermission(item.id));

    // Configuration des sous-menus
    const subMenuConfig = {
        dashboard: {
            title: 'Student Dashboard',
            items: [
                { id: 'home', label: 'Home', icon: <Home size={18} />, href: '#' },
                { id: 'my-courses', label: 'My Courses', icon: <BookOpen size={18} />, href: '#' },
                { id: 'schedule', label: 'Schedule', icon: <Calendar size={18} />, href: '#' },
                { id: 'grades', label: 'Grades', icon: <Award size={18} />, href: '#' },
                { id: 'assignments', label: 'Assignments', icon: <FileText size={18} />, href: '#' },
            ],
        },
        analytics: {
            title: 'Instructor Analytics',
            items: [
                { id: 'overview', label: 'Overview', icon: <TrendingUp size={18} />, href: '#' },
                { id: 'student-progress', label: 'Student Progress', icon: <Users size={18} />, href: '#' },
                { id: 'course-stats', label: 'Course Statistics', icon: <BarChart3 size={18} />, href: '#' },
                { id: 'engagement', label: 'Engagement', icon: <Clock size={18} />, href: '#' },
            ],
        },
        reports: {
            title: 'Apps & Reports',
            items: [
                { id: 'years', label: 'Année Academique', icon: <Calendar size={18} />, href: route('dashboard.admin.academic-years.index')},
                { id: 'faculty', label: 'Faculté', icon: <Grid3x3 size={18} />, href: route('dashboard.admin.faculties.index') },
                { id: 'levels', label: 'Niveau', icon: <Grid3x3 size={18} />, href: route('dashboard.admin.faculties.show', { id: 1 }) },
                { id: 'monthly', label: 'Monthly Reports', icon: <Calendar size={18} />, href: '#' },
                { id: 'annual', label: 'Annual Reports', icon: <FileText size={18} />, href: '#' },
                { id: 'custom', label: 'Custom Reports', icon: <Settings size={18} />, href: '#' },
                { id: 'export', label: 'Export Data', icon: <Mail size={18} />, href: '#' },
            ],
        },
        users: {
            title: 'Account Management',
            items: [
                { id: 'profile', label: 'Profile', icon: <User size={18} />, href: '#' },
                { id: 'security', label: 'Security', icon: <Lock size={18} />, href: '#' },
                { id: 'notifications', label: 'Notifications', icon: <Bell size={18} />, href: '#' },
                { id: 'privacy', label: 'Privacy', icon: <Shield size={18} />, href: '#' },
            ],
        },
        settings: {
            title: 'Settings',
            items: [
                { id: 'general', label: 'General', icon: <Settings size={18} />, href: '#' },
                { id: 'appearance', label: 'Appearance', icon: <Grid3x3 size={18} />, href: '#' },
                { id: 'notifications', label: 'Notifications', icon: <Bell size={18} />, href: '#' },
                { id: 'advanced', label: 'Advanced', icon: <Shield size={18} />, href: '#' },
            ],
        },
        enrollments: {
            title: 'Enrollments',
            items: [
                { id: 'my-enrollments', label: 'My Enrollments', icon: <BookOpen size={18} />, href: '#' },
                { id: 'available', label: 'Available Courses', icon: <Grid3x3 size={18} />, href: '#' },
                { id: 'pending', label: 'Pending', icon: <Clock size={18} />, href: '#' },
                { id: 'completed', label: 'Completed', icon: <Award size={18} />, href: '#' },
            ],
        },
    };

    return (
        <>
            {/* Sidebar principale avec design compact et animations fluides */}
            <nav
                className={`fixed top-0 left-0 ${isMobile ? 'w-16' : 'w-20'} z-[60] flex h-screen flex-col border-r border-slate-700/50 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-300 shadow-2xl backdrop-blur-xl transition-all duration-500 ease-out ${isMobile ? 'overflow-y-auto' : 'overflow-hidden'} md:translate-x-0 ${isMobile && !isMobileSidebarOpen ? '-translate-x-full' : 'translate-x-0'} ${isMobile && currentActiveMenu ? 'opacity-30' : 'opacity-100'}`}
                ref={sidebarRef}
                aria-label="Navigation principale"
            >
                {/* Gradient Overlay Effect */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-indigo-500/5 via-transparent to-purple-500/5"></div>

                {/* Brand avec taille adaptative et animation subtile */}
                <div
                    className={`relative flex items-center justify-center ${isMobile ? 'mb-4 px-2 py-4' : 'mb-6 px-3 py-5'} flex-shrink-0 border-b border-slate-700/50`}
                >
                    <div
                        className={`${isMobile ? 'h-10 w-10 text-xl' : 'h-12 w-12 text-2xl'} flex transform items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 font-bold text-white shadow-lg transition-all duration-500 hover:scale-110 hover:rotate-6 hover:shadow-xl hover:shadow-indigo-500/25`}
                    >
                        D
                    </div>
                </div>

                {/* Navigation avec espacement optimisé */}
                <div className={`relative flex flex-1 flex-col ${isMobile ? 'gap-2' : 'gap-3'} ${isMobile ? 'px-1.5' : 'px-2'} pb-4`}>
                    {visibleMenuItems.map((item, index) => {
                        const isActive = currentActiveMenu === item.id;
                        const isHovered = hoveredItem === item.id;
                        const hasAnimation = menuAnimations[item.id];

                        return (
                            <div key={item.id} className="group relative">
                                {/* Active Indicator avec animation améliorée */}
                                <div
                                    className={`absolute ${isMobile ? '-left-1.5' : '-left-2'} top-1/2 -translate-y-1/2 ${isMobile ? 'h-8 w-1' : 'h-10 w-1.5'} rounded-r-full bg-gradient-to-b from-indigo-400 to-indigo-600 transition-all duration-500 ${isActive ? 'scale-y-100 opacity-100' : 'scale-y-0 opacity-0'}`}
                                ></div>

                                <button
                                    className={`relative w-full cursor-pointer border-none bg-transparent ${isMobile ? 'p-2.5' : 'p-3'} flex flex-col items-center overflow-hidden rounded-xl text-xs font-medium transition-all duration-300 ${
                                        isActive
                                            ? 'scale-105 border border-indigo-400/40 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-white shadow-lg'
                                            : 'text-slate-400 hover:scale-105 hover:bg-slate-800/60 hover:text-white active:scale-95'
                                    } ${isHovered && !isActive ? 'shadow-lg' : ''}`}
                                    data-menu={item.id}
                                    aria-label={item.ariaLabel}
                                    aria-expanded={isActive}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        // Changement direct du menu actif sans fermeture intermédiaire
                                        onButtonClick(e, item.id);
                                    }}
                                    onMouseEnter={() => setHoveredItem(item.id)}
                                    onMouseLeave={() => setHoveredItem(null)}
                                >
                                    {/* Background Glow Effect */}
                                    <div
                                        className={`absolute inset-0 rounded-xl bg-gradient-to-br from-indigo-500/0 via-indigo-500/10 to-purple-500/0 transition-opacity duration-500 ${isActive || isHovered ? 'opacity-100' : 'opacity-0'}`}
                                    ></div>

                                    {/* Icon Container with Animation */}
                                    <span
                                        className={`relative z-10 transition-all duration-300 ${isActive ? 'scale-110 drop-shadow-lg' : isHovered ? 'scale-105' : 'scale-100'}`}
                                    >
                                        {item.icon}
                                    </span>

                                    {/* Label */}
                                    <span
                                        className={`relative z-10 ${isMobile ? 'text-[0.6rem]' : 'text-[0.65rem]'} text-center leading-tight font-bold whitespace-normal transition-all duration-300 ${isActive ? 'text-white' : ''}`}
                                    >
                                        {item.label}
                                    </span>

                                    {/* Ripple Effect on Click */}
                                    {isActive && <span className="absolute inset-0 animate-ping rounded-xl bg-indigo-400 opacity-20"></span>}
                                </button>
                            </div>
                        );
                    })}

                    {/* Logout Button avec espacement optimisé */}
                    <div className={`group relative mt-auto ${isMobile ? 'pt-3' : 'pt-4'}`}>
                        <button
                            className={`relative w-full cursor-pointer border-none bg-transparent ${isMobile ? 'p-2.5' : 'p-3'} flex flex-col items-center overflow-hidden rounded-xl border border-transparent text-xs font-medium text-slate-400 transition-all duration-300 hover:scale-105 hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400 hover:shadow-lg active:scale-95`}
                            data-menu="logout"
                            aria-label="Se deconnecter"
                            onClick={handleLogout}
                            onMouseEnter={() => setHoveredItem('logout')}
                            onMouseLeave={() => setHoveredItem(null)}
                            disabled={isLoading}
                        >
                            <span
                                className={`relative z-10 transition-all duration-300 ${hoveredItem === 'logout' ? 'scale-105' : 'scale-100'} ${isLoading ? 'animate-spin' : ''}`}
                            >
                                {isLoading ? (
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width={isMobile ? 20 : 24}
                                        height={isMobile ? 20 : 24}
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <path d="M21 12a9 9 0 11-6.219-8.56"></path>
                                    </svg>
                                ) : (
                                    <LogOut size={isMobile ? 20 : 24} />
                                )}
                            </span>
                            <span className={`relative z-10 ${isMobile ? 'text-[0.6rem]' : 'text-[0.65rem]'} text-center leading-tight font-bold`}>
                                {isLoading ? 'Loading...' : 'Logout'}
                            </span>
                        </button>
                    </div>
                </div>
            </nav>

            {/* Menus secondaires avec comportement différent selon l'écran */}
            {Object.entries(subMenuConfig).map(([menuId, config]) => {
                if (!hasPermission(menuId)) return null;

                const isActive = currentActiveMenu === menuId;
                const isClosingThis = isClosing === menuId;
                const hasAnimation = menuAnimations[menuId];

                return (
                    <div
                        key={menuId}
                        ref={(el) => (menuRefs.current[menuId] = el)}
                        className={`fixed top-0 z-[70] flex h-screen flex-col border-r border-slate-200/80 bg-white/98 shadow-2xl backdrop-blur-xl transition-all duration-500 ease-out ${isMobile ? 'left-0 w-full' : 'left-20 w-80'} ${
                            isActive && !isClosingThis
                                ? 'visible translate-x-0 opacity-100'
                                : isMobile
                                  ? 'pointer-events-none invisible -translate-x-full opacity-0'
                                  : 'pointer-events-none invisible -translate-x-8 opacity-0'
                        }`}
                        role="menu"
                        aria-hidden={!isActive}
                    >
                        {/* Header du menu avec design amélioré */}
                        <div
                            className={`relative ${isMobile ? 'px-5 py-5' : 'px-7 py-7'} flex-shrink-0 border-b border-slate-200/60 bg-gradient-to-r from-slate-50 to-white`}
                        >
                            {/* Bouton de fermeture avec animation */}
                            <button
                                onClick={() => handleCloseMenu(menuId)}
                                className={`absolute ${isMobile ? 'top-3 right-3 p-2' : 'top-4 right-4 p-2.5'} group z-10 transform rounded-lg transition-all duration-200 hover:rotate-90 hover:bg-slate-100`}
                                aria-label="Fermer le menu"
                            >
                                <X size={isMobile ? 18 : 20} className="text-slate-400 transition-colors duration-200 group-hover:text-slate-600" />
                            </button>

                            <div className={`flex items-center ${isMobile ? 'gap-3' : 'gap-4'}`}>
                                <div
                                    className={`transition-all duration-500 ${hasAnimation ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-0'}`}
                                >
                                    <h3
                                        className={`${isMobile ? 'text-xl' : 'text-2xl'} bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text font-bold text-slate-900 text-transparent`}
                                    >
                                        {config.title}
                                    </h3>
                                    <p className="mt-1 text-sm text-slate-500">Manage your {menuId} settings</p>
                                </div>
                            </div>
                        </div>

                        {/* Navigation items avec animations d'entrée */}
                        <nav className={`flex-1 overflow-y-auto ${isMobile ? 'px-5 py-5' : 'px-6 py-6'}`}>
                            <div className={`space-y-${isMobile ? '2' : '3'}`}>
                                {config.items.map((item, index) => (
                                    <a
                                        key={item.id}
                                        href={item.href}
                                        className={`group flex items-center ${isMobile ? 'gap-3 px-4 py-3' : 'gap-4 px-5 py-4'} relative transform overflow-hidden rounded-xl border border-transparent text-slate-600 transition-all duration-300 hover:translate-x-1 hover:border-slate-200/50 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 hover:text-slate-900 ${hasAnimation ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-0'}`}
                                        style={{ transitionDelay: `${index * 50}ms` }}
                                        role="menuitem"
                                    >
                                        <span
                                            className={`flex-shrink-0 ${isMobile ? 'h-9 w-9' : 'h-10 w-10'} flex transform items-center justify-center rounded-lg bg-slate-100 transition-all duration-300 group-hover:scale-110 group-hover:bg-gradient-to-br group-hover:from-indigo-500 group-hover:to-purple-600`}
                                        >
                                            <span className="text-slate-500 transition-colors duration-300 group-hover:text-white">{item.icon}</span>
                                        </span>
                                        <span className={`font-medium ${isMobile ? 'text-sm' : 'text-base'} flex-1`}>{item.label}</span>
                                        <ChevronRight
                                            size={isMobile ? 16 : 18}
                                            className="text-slate-400 transition-all duration-300 group-hover:translate-x-1 group-hover:text-indigo-500"
                                        />

                                        {/* Hover effect background */}
                                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500/0 via-indigo-500/5 to-purple-500/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
                                    </a>
                                ))}
                            </div>
                        </nav>

                        {/* Footer du menu avec design amélioré */}
                        <div
                            className={`${isMobile ? 'px-5 py-4' : 'px-6 py-5'} flex-shrink-0 border-t border-slate-200/60 bg-gradient-to-r from-slate-50 to-white`}
                        >
                            <div className="flex items-center justify-between">
                                <span className={`${isMobile ? 'text-xs' : 'text-sm'} text-slate-500`}>Last updated: Today</span>
                                <button
                                    className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-indigo-600 transition-colors duration-200 hover:text-indigo-700 hover:underline`}
                                >
                                    View all
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })}
        </>
    );
};

export default Sidebar;
