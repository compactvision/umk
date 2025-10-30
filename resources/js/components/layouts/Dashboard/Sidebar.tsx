import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  GraduationCap, 
  BarChart3, 
  Grid3x3, 
  Users, 
  Settings, 
  BookOpen, 
  LogOut,
  X,
  ChevronRight,
  Home,
  FileText,
  Shield,
  Bell,
  User,
  Lock,
  Mail,
  Calendar,
  TrendingUp,
  Award,
  Clock
} from 'lucide-react';

// Types pour les rôles
type UserRole = 'user' | 'student' | 'instructor' | 'admin' | 'super_admin';

// Configuration des permissions par rôle
const rolePermissions: Record<UserRole, string[]> = {
    user: ['enrollments'],
    student: ['dashboard', 'settings'],
    instructor: ['analytics', 'reports', 'settings'],
    admin: ['dashboard', 'analytics', 'reports', 'users', 'settings'],
    super_admin: ['dashboard', 'analytics', 'reports', 'users', 'settings']
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
            setMenuAnimations(prev => ({ ...prev, [currentActiveMenu]: true }));
        }
    }, [currentActiveMenu]);

    const handleLogout = async () => {
        setIsLoading(true);
        // Simuler une action de déconnexion
        setTimeout(() => {
            setIsLoading(false);
            console.log('Logout clicked');
        }, 1000);
    };

    const handleCloseMenu = useCallback((menuId: string) => {
        setIsClosing(menuId);
        setMenuAnimations(prev => ({ ...prev, [menuId]: false }));
        setTimeout(() => {
            onButtonClick(new MouseEvent('click') as any, '');
            setIsClosing(null);
        }, 300);
    }, [onButtonClick]);

    const hasPermission = (menuId: string): boolean => {
        return rolePermissions[userRole as UserRole]?.includes(menuId) || false;
    };

    const menuItems = [
        {
            id: 'dashboard',
            label: 'Student',
            ariaLabel: 'Tableau de bord',
            icon: <GraduationCap size={isMobile ? 20 : 24} />
        },
        {
            id: 'analytics',
            label: 'Instructor',
            ariaLabel: 'Analyses et statistiques',
            icon: <BarChart3 size={isMobile ? 20 : 24} />
        },
        {
            id: 'reports',
            label: 'Apps',
            ariaLabel: 'Rapports',
            icon: <Grid3x3 size={isMobile ? 20 : 24} />
        },
        {
            id: 'users',
            label: 'Account',
            ariaLabel: 'Gestion des utilisateurs',
            icon: <Users size={isMobile ? 20 : 24} />
        },
        {
            id: 'settings',
            label: 'Settings',
            ariaLabel: 'Paramètres de l\'application',
            icon: <Settings size={isMobile ? 20 : 24} />
        },
        {
            id: 'enrollments',
            label: 'Enroll',
            ariaLabel: 'Gestion des inscriptions',
            icon: <BookOpen size={isMobile ? 20 : 24} />
        }
    ];

    const visibleMenuItems = menuItems.filter(item => hasPermission(item.id));

    // Configuration des sous-menus
    const subMenuConfig = {
        dashboard: {
            title: 'Student Dashboard',
            items: [
                { id: 'home', label: 'Home', icon: <Home size={18} />, href: '#' },
                { id: 'my-courses', label: 'My Courses', icon: <BookOpen size={18} />, href: '#' },
                { id: 'schedule', label: 'Schedule', icon: <Calendar size={18} />, href: '#' },
                { id: 'grades', label: 'Grades', icon: <Award size={18} />, href: '#' },
                { id: 'assignments', label: 'Assignments', icon: <FileText size={18} />, href: '#' }
            ]
        },
        analytics: {
            title: 'Instructor Analytics',
            items: [
                { id: 'overview', label: 'Overview', icon: <TrendingUp size={18} />, href: '#' },
                { id: 'student-progress', label: 'Student Progress', icon: <Users size={18} />, href: '#' },
                { id: 'course-stats', label: 'Course Statistics', icon: <BarChart3 size={18} />, href: '#' },
                { id: 'engagement', label: 'Engagement', icon: <Clock size={18} />, href: '#' }
            ]
        },
        reports: {
            title: 'Apps & Reports',
            items: [
                { id: 'monthly', label: 'Monthly Reports', icon: <Calendar size={18} />, href: '#' },
                { id: 'annual', label: 'Annual Reports', icon: <FileText size={18} />, href: '#' },
                { id: 'custom', label: 'Custom Reports', icon: <Settings size={18} />, href: '#' },
                { id: 'export', label: 'Export Data', icon: <Mail size={18} />, href: '#' }
            ]
        },
        users: {
            title: 'Account Management',
            items: [
                { id: 'profile', label: 'Profile', icon: <User size={18} />, href: '#' },
                { id: 'security', label: 'Security', icon: <Lock size={18} />, href: '#' },
                { id: 'notifications', label: 'Notifications', icon: <Bell size={18} />, href: '#' },
                { id: 'privacy', label: 'Privacy', icon: <Shield size={18} />, href: '#' }
            ]
        },
        settings: {
            title: 'Settings',
            items: [
                { id: 'general', label: 'General', icon: <Settings size={18} />, href: '#' },
                { id: 'appearance', label: 'Appearance', icon: <Grid3x3 size={18} />, href: '#' },
                { id: 'notifications', label: 'Notifications', icon: <Bell size={18} />, href: '#' },
                { id: 'advanced', label: 'Advanced', icon: <Shield size={18} />, href: '#' }
            ]
        },
        enrollments: {
            title: 'Enrollments',
            items: [
                { id: 'my-enrollments', label: 'My Enrollments', icon: <BookOpen size={18} />, href: '#' },
                { id: 'available', label: 'Available Courses', icon: <Grid3x3 size={18} />, href: '#' },
                { id: 'pending', label: 'Pending', icon: <Clock size={18} />, href: '#' },
                { id: 'completed', label: 'Completed', icon: <Award size={18} />, href: '#' }
            ]
        }
    };

    return (
        <>
            {/* Sidebar principale avec design compact et animations fluides */}
            <nav
                className={`fixed top-0 left-0 ${isMobile ? 'w-16' : 'w-20'} h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-300 flex flex-col z-[60] transition-all duration-500 ease-out shadow-2xl backdrop-blur-xl border-r border-slate-700/50
                    ${isMobile ? 'overflow-y-auto' : 'overflow-hidden'}
                    md:translate-x-0 ${isMobile && !isMobileSidebarOpen ? '-translate-x-full' : 'translate-x-0'}
                    ${isMobile && currentActiveMenu ? 'opacity-30' : 'opacity-100'}`}
                ref={sidebarRef}
                aria-label="Navigation principale"
            >
                {/* Gradient Overlay Effect */}
                <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 via-transparent to-purple-500/5 pointer-events-none"></div>
                
                {/* Brand avec taille adaptative et animation subtile */}
                <div className={`relative flex items-center justify-center ${isMobile ? 'px-2 py-4 mb-4' : 'px-3 py-5 mb-6'} border-b border-slate-700/50 flex-shrink-0`}>
                    <div className={`${isMobile ? 'w-10 h-10 text-xl' : 'w-12 h-12 text-2xl'} bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 rounded-xl flex items-center justify-center font-bold text-white shadow-lg transform transition-all duration-500 hover:scale-110 hover:rotate-6 hover:shadow-xl hover:shadow-indigo-500/25`}>
                        D
                    </div>
                </div>

                {/* Navigation avec espacement optimisé */}
                <div className={`relative flex-1 flex flex-col ${isMobile ? 'gap-2' : 'gap-3'} ${isMobile ? 'px-1.5' : 'px-2'} pb-4`}>
                    {visibleMenuItems.map((item, index) => {
                        const isActive = currentActiveMenu === item.id;
                        const isHovered = hoveredItem === item.id;
                        const hasAnimation = menuAnimations[item.id];
                        
                        return (
                            <div key={item.id} className="relative group">
                                {/* Active Indicator avec animation améliorée */}
                                <div className={`absolute ${isMobile ? '-left-1.5' : '-left-2'} top-1/2 -translate-y-1/2 ${isMobile ? 'w-1 h-8' : 'w-1.5 h-10'} bg-gradient-to-b from-indigo-400 to-indigo-600 rounded-r-full transition-all duration-500 ${isActive ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-0'}`}></div>
                                
                                <button
                                    className={`relative w-full bg-transparent border-none cursor-pointer ${isMobile ? 'p-2.5' : 'p-3'} rounded-xl transition-all duration-300 flex flex-col items-center text-xs font-medium overflow-hidden
                                        ${isActive 
                                            ? 'text-white bg-gradient-to-br from-indigo-500/20 to-purple-500/20 shadow-lg scale-105 border border-indigo-400/40' 
                                            : 'text-slate-400 hover:text-white hover:bg-slate-800/60 hover:scale-105 active:scale-95'
                                        }
                                        ${isHovered && !isActive ? 'shadow-lg' : ''}`}
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
                                    <div className={`absolute inset-0 bg-gradient-to-br from-indigo-500/0 via-indigo-500/10 to-purple-500/0 rounded-xl transition-opacity duration-500 ${isActive || isHovered ? 'opacity-100' : 'opacity-0'}`}></div>
                                    
                                    {/* Icon Container with Animation */}
                                    <span className={`relative z-10 transition-all duration-300 ${isActive ? 'scale-110 drop-shadow-lg' : isHovered ? 'scale-105' : 'scale-100'}`}>
                                        {item.icon}
                                    </span>
                                    
                                    {/* Label */}
                                    <span className={`relative z-10 ${isMobile ? 'text-[0.6rem]' : 'text-[0.65rem]'} font-bold text-center leading-tight whitespace-normal transition-all duration-300 ${isActive ? 'text-white' : ''}`}>
                                        {item.label}
                                    </span>
                                    
                                    {/* Ripple Effect on Click */}
                                    {isActive && (
                                        <span className="absolute inset-0 rounded-xl animate-ping opacity-20 bg-indigo-400"></span>
                                    )}
                                </button>
                            </div>
                        );
                    })}

                    {/* Logout Button avec espacement optimisé */}
                    <div className={`relative group mt-auto ${isMobile ? 'pt-3' : 'pt-4'}`}>
                        <button
                            className={`relative w-full bg-transparent border-none cursor-pointer ${isMobile ? 'p-2.5' : 'p-3'} rounded-xl transition-all duration-300 flex flex-col items-center text-xs font-medium overflow-hidden text-slate-400
                                hover:text-red-400 hover:bg-red-500/10 hover:scale-105 hover:shadow-lg active:scale-95 border border-transparent hover:border-red-500/40`}
                            data-menu="logout"
                            aria-label="Se deconnecter"
                            onClick={handleLogout}
                            onMouseEnter={() => setHoveredItem('logout')}
                            onMouseLeave={() => setHoveredItem(null)}
                            disabled={isLoading}
                        >
                            <span className={`relative z-10 transition-all duration-300 ${hoveredItem === 'logout' ? 'scale-105' : 'scale-100'} ${isLoading ? 'animate-spin' : ''}`}>
                                {isLoading ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" width={isMobile ? 20 : 24} height={isMobile ? 20 : 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 12a9 9 0 11-6.219-8.56"></path>
                                    </svg>
                                ) : (
                                    <LogOut size={isMobile ? 20 : 24} />
                                )}
                            </span>
                            <span className={`relative z-10 ${isMobile ? 'text-[0.6rem]' : 'text-[0.65rem]'} font-bold text-center leading-tight`}>
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
                        ref={el => menuRefs.current[menuId] = el}
                        className={`fixed top-0 h-screen bg-white/98 backdrop-blur-xl shadow-2xl border-r border-slate-200/80 flex flex-col transition-all duration-500 ease-out z-[70]
                            ${isMobile ? 'left-0 w-full' : 'left-20 w-80'}
                            ${isActive && !isClosingThis 
                                ? 'opacity-100 visible translate-x-0' 
                                : isMobile 
                                    ? 'opacity-0 invisible -translate-x-full pointer-events-none'
                                    : 'opacity-0 invisible -translate-x-8 pointer-events-none'
                            }`}
                        role="menu"
                        aria-hidden={!isActive}
                    >
                        {/* Header du menu avec design amélioré */}
                        <div className={`relative ${isMobile ? 'px-5 py-5' : 'px-7 py-7'} border-b border-slate-200/60 bg-gradient-to-r from-slate-50 to-white flex-shrink-0`}>
                            {/* Bouton de fermeture avec animation */}
                            <button
                                onClick={() => handleCloseMenu(menuId)}
                                className={`absolute ${isMobile ? 'top-3 right-3 p-2' : 'top-4 right-4 p-2.5'} rounded-lg hover:bg-slate-100 transition-all duration-200 group z-10 transform hover:rotate-90`}
                                aria-label="Fermer le menu"
                            >
                                <X size={isMobile ? 18 : 20} className="text-slate-400 group-hover:text-slate-600 transition-colors duration-200" />
                            </button>
                            
                            <div className={`flex items-center ${isMobile ? 'gap-3' : 'gap-4'}`}>
                                <div className={`transition-all duration-500 ${hasAnimation ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}>
                                    <h3 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-slate-900 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent`}>
                                        {config.title}
                                    </h3>
                                    <p className="text-sm text-slate-500 mt-1">Manage your {menuId} settings</p>
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
                                        className={`group flex items-center ${isMobile ? 'gap-3 px-4 py-3' : 'gap-4 px-5 py-4'} rounded-xl text-slate-600 hover:text-slate-900 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 transition-all duration-300 relative overflow-hidden border border-transparent hover:border-slate-200/50 transform hover:translate-x-1
                                            ${hasAnimation ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}
                                        style={{ transitionDelay: `${index * 50}ms` }}
                                        role="menuitem"
                                    >
                                        <span className={`flex-shrink-0 ${isMobile ? 'w-9 h-9' : 'w-10 h-10'} bg-slate-100 group-hover:bg-gradient-to-br group-hover:from-indigo-500 group-hover:to-purple-600 rounded-lg flex items-center justify-center transition-all duration-300 transform group-hover:scale-110`}>
                                            <span className="text-slate-500 group-hover:text-white transition-colors duration-300">
                                                {item.icon}
                                            </span>
                                        </span>
                                        <span className={`font-medium ${isMobile ? 'text-sm' : 'text-base'} flex-1`}>{item.label}</span>
                                        <ChevronRight size={isMobile ? 16 : 18} className="text-slate-400 group-hover:text-indigo-500 transition-all duration-300 group-hover:translate-x-1" />
                                        
                                        {/* Hover effect background */}
                                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-indigo-500/5 to-purple-500/0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                    </a>
                                ))}
                            </div>
                        </nav>

                        {/* Footer du menu avec design amélioré */}
                        <div className={`${isMobile ? 'px-5 py-4' : 'px-6 py-5'} border-t border-slate-200/60 bg-gradient-to-r from-slate-50 to-white flex-shrink-0`}>
                            <div className="flex items-center justify-between">
                                <span className={`${isMobile ? 'text-xs' : 'text-sm'} text-slate-500`}>Last updated: Today</span>
                                <button className={`${isMobile ? 'text-xs' : 'text-sm'} text-indigo-600 hover:text-indigo-700 font-medium transition-colors duration-200 hover:underline`}>
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