import { adminNavigation } from '@/components/layouts/Dashboard/adminNavigation';
import { studentHref, studentModules, studentSectionAccess } from '@/components/student/navigation';
import type { Permission } from '@/components/student/types';
import Alert from '@/utils/sweetAlert';
import { router, usePage } from '@inertiajs/react';
import { BookOpen, ChevronRight, ClipboardCheck, GraduationCap, Home, LogOut, X } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { route } from 'ziggy-js';

// Types pour les rôles
type UserRole = 'user' | 'candidate' | 'student' | 'professor' | 'admin';

// Configuration des permissions par rôle
const rolePermissions: Record<UserRole, string[]> = {
    user: ['enrollments'],
    candidate: ['enrollments'],
    student: ['dashboard', 'enrollments'],
    professor: ['teaching'],
    admin: adminNavigation.map(({ id }) => id),
};

const Sidebar = ({
    onButtonClick,
    onCloseMenu,
    onNavigate = onCloseMenu,
    onLogout,
    loggingOut = false,
    isMobile,
    isMobileSidebarOpen,
    currentActiveMenu,
    userRole,
}: {
    onButtonClick: (e: React.MouseEvent, menuId: string) => void;
    onCloseMenu: () => void;
    onNavigate?: () => void;
    onLogout: () => void;
    loggingOut?: boolean;
    isMobile: boolean;
    isMobileSidebarOpen: boolean;
    currentActiveMenu: string | null;
    userRole?: UserRole | UserRole[] | null;
}) => {
    const roles = Array.isArray(userRole) ? userRole : [userRole];
    const isAdministration = roles.includes('admin');
    const page = usePage<{
        studentPortalActive?: boolean;
        teachingProfileActive?: boolean;
        academic?: { id: number };
        permissions?: Record<string, Permission>;
        auth?: { user?: { permissions?: string[]; hasAcademicFacultyScope?: boolean } | null };
    }>();
    const portalActive = Boolean(page.props.studentPortalActive);
    const isStudentPortal = portalActive && !isAdministration && !page.url?.startsWith('/dashboard/teacher');
    const sidebarRef = useRef<HTMLDivElement>(null);
    const menuRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
    const [hoveredItem, setHoveredItem] = useState<string | null>(null);
    const [menuAnimations, setMenuAnimations] = useState<{ [key: string]: boolean }>({});

    const handleCloseMenu = useCallback(
        (restoreFocus = false) => {
            if (restoreFocus && currentActiveMenu) {
                sidebarRef.current?.querySelector<HTMLButtonElement>(`[data-menu="${currentActiveMenu}"]`)?.focus();
            }
            onCloseMenu();
        },
        [currentActiveMenu, onCloseMenu],
    );

    // Fermeture au clic en dehors
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (currentActiveMenu && menuRefs.current[currentActiveMenu]) {
                const menuElement = menuRefs.current[currentActiveMenu];
                if (menuElement && !menuElement.contains(event.target as Node) && !sidebarRef.current?.contains(event.target as Node)) {
                    handleCloseMenu();
                }
            }
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && currentActiveMenu && !event.defaultPrevented) handleCloseMenu(true);
        };
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [currentActiveMenu, handleCloseMenu]);

    // Animation d'entrée des menus
    useEffect(() => {
        if (currentActiveMenu) {
            setMenuAnimations((prev) => ({ ...prev, [currentActiveMenu]: true }));
            menuRefs.current[currentActiveMenu]?.querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true });
        }
    }, [currentActiveMenu]);

    const handleLogout = async () => {
        const result = await Alert.confirm('Êtes-vous sûr de vouloir vous déconnecter?');

        if (result.isConfirmed) onLogout();
    };

    const visitMenuPage = (event: React.MouseEvent<HTMLAnchorElement>) => {
        if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        const destination = new URL(event.currentTarget.href);
        if (destination.origin !== window.location.origin || !/^\/dashboard(?:\/|$)/.test(destination.pathname)) return;

        event.preventDefault();
        onNavigate();

        const { pathname, search, hash } = window.location;
        if (destination.hash && destination.pathname === pathname && (!destination.search || destination.search === search)) {
            const anchor = document.getElementById(destination.hash.slice(1));
            if (anchor) {
                if (destination.hash === hash) anchor.scrollIntoView({ block: 'start' });
                else window.location.hash = destination.hash;
                return;
            }
        }
        router.visit(destination.href);
    };

    const hasPermission = (menuId: string): boolean => {
        if (isStudentPortal) return studentModules.some((module) => module.id === menuId);
        // Un étudiant activé retrouve son dossier dans son espace unique,
        // même lorsqu’il conserve également le rôle candidat « user ».
        if (menuId === 'enrollments' && (portalActive || isAdministration)) return false;
        return roles.some((role) => role && rolePermissions[role]?.includes(menuId));
    };

    const menuItems = [
        {
            id: 'dashboard',
            label: 'Étudiant',
            ariaLabel: 'Espace étudiant',
            icon: <GraduationCap size={isMobile ? 20 : 24} />,
        },
        {
            id: 'teaching',
            label: 'Enseignant',
            ariaLabel: 'Espace enseignant',
            icon: <BookOpen size={isMobile ? 20 : 24} />,
        },
        {
            id: 'enrollments',
            label: 'Inscriptions',
            ariaLabel: 'Gestion des inscriptions',
            icon: <BookOpen size={isMobile ? 20 : 24} />,
        },
    ];

    const visibleMenuItems = isAdministration
        ? adminNavigation.map((item) => ({
              id: item.id,
              label: item.shortLabel,
              ariaLabel: item.title,
              icon: <item.icon size={isMobile ? 20 : 24} />,
          }))
        : isStudentPortal
          ? studentModules.map((module) => ({
                id: module.id,
                label: module.title,
                ariaLabel: module.title,
                icon: <module.icon size={isMobile ? 20 : 24} />,
            }))
          : menuItems.filter((item) => hasPermission(item.id));

    // Configuration des sous-menus
    const subMenuConfig: Record<
        string,
        {
            title: string;
            description?: string;
            items: { id: string; label: string; icon: React.ReactNode; href?: string; status?: string; native?: boolean }[];
        }
    > = isAdministration
        ? Object.fromEntries(
              adminNavigation.map((menu) => [
                  menu.id,
                  {
                      title: menu.title,
                      items: menu.items.map(([label, destination]) => {
                          const user = page.props.auth?.user;
                          const restricted =
                              (destination.institutionWide && user?.hasAcademicFacultyScope) ||
                              (destination.anyPermission?.length &&
                                  !destination.anyPermission.some((permission) => user?.permissions?.includes(permission)));
                          return {
                              id: label,
                              label,
                              icon: <menu.icon size={18} />,
                              href: restricted ? undefined : destination.href,
                              native: destination.native,
                              status: restricted ? 'Accès restreint' : undefined,
                          };
                      }),
                  },
              ]),
          )
        : isStudentPortal
          ? Object.fromEntries(
                studentModules.map((module) => [
                    module.id,
                    {
                        title: module.title,
                        description: module.description,
                        items: module.items.flatMap((item, index) => {
                            const access = studentSectionAccess(item.section, page.props.permissions);
                            return access.visible
                                ? [
                                      {
                                          id: `${module.id}-${index}`,
                                          label: item.label,
                                          icon: <module.icon size={18} />,
                                          href: access.allowed ? studentHref(item.section, page.props.academic?.id, item.hash) : undefined,
                                          status: access.reason ?? undefined,
                                      },
                                  ]
                                : [];
                        }),
                    },
                ]),
            )
          : {
                dashboard: {
                    title: 'Espace étudiant',
                    items: [{ id: 'home', label: 'Mon espace', icon: <Home size={18} />, href: '/dashboard' }],
                },
                teaching: {
                    title: 'Espace enseignant',
                    description: 'Vos enseignements, supports et évaluations',
                    items: [
                        { id: 'courses', label: 'Mes cours', icon: <BookOpen size={18} />, href: route('dashboard.teaching.index') },
                        ...(page.props.teachingProfileActive
                            ? [
                                  {
                                      id: 'resources',
                                      label: 'Supports pédagogiques',
                                      icon: <BookOpen size={18} />,
                                      href: route('dashboard.teaching.learning.index'),
                                  },
                              ]
                            : []),
                        ...(page.props.teachingProfileActive && page.props.auth?.user?.permissions?.includes('manage courses')
                            ? [
                                  {
                                      id: 'assessments',
                                      label: 'Évaluations',
                                      icon: <ClipboardCheck size={18} />,
                                      href: route('dashboard.teaching.assessments.index'),
                                  },
                              ]
                            : []),
                    ],
                },
                enrollments: {
                    title: 'Inscriptions',
                    items: [
                        { id: 'my-enrollments', label: 'Mes inscriptions', icon: <BookOpen size={18} />, href: route('dashboard.enrollments.index') },
                    ],
                },
            };

    return (
        <>
            {/* Sidebar principale avec design compact et animations fluides */}
            <nav
                className={`fixed top-0 left-0 ${isMobile ? 'w-16' : 'w-20'} z-[60] flex h-screen flex-col border-r border-slate-700/50 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-300 shadow-2xl backdrop-blur-xl transition-all duration-500 ease-out ${isMobile ? 'overflow-y-auto' : 'overflow-hidden'} md:translate-x-0 ${isMobile && !isMobileSidebarOpen ? '-translate-x-full' : 'translate-x-0'} ${isMobile && currentActiveMenu ? 'opacity-30' : 'opacity-100'}`}
                ref={sidebarRef}
                data-dashboard-rail
                aria-label="Navigation principale"
                inert={isMobile && !isMobileSidebarOpen}
            >
                {/* Gradient Overlay Effect */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-emerald-500/5 via-transparent to-teal-500/5"></div>

                {/* Brand avec taille adaptative et animation subtile */}
                <div
                    className={`relative flex items-center justify-center ${isMobile ? 'mb-4 px-2 py-4' : 'mb-6 px-3 py-5'} flex-shrink-0 border-b border-slate-700/50`}
                >
                    <div
                        className={`${isMobile ? 'h-10 w-10 text-xl' : 'h-12 w-12 text-2xl'} flex transform items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 font-bold text-white shadow-lg transition-all duration-500 hover:scale-110 hover:rotate-6 hover:shadow-xl hover:shadow-emerald-500/25`}
                    >
                        <img src="/assets/usk/logo.png" alt="Université Simon Kimbangu" className="h-full w-full object-contain p-1" />
                    </div>
                </div>

                {/* Navigation avec espacement optimisé */}
                <div
                    className={`relative flex min-h-0 flex-1 flex-col overflow-y-auto ${isMobile ? 'gap-2' : 'gap-3'} ${isMobile ? 'px-1.5' : 'px-2'} pb-4 ${isAdministration ? 'overscroll-contain' : ''}`}
                >
                    {visibleMenuItems
                        .filter((item) => subMenuConfig[item.id]?.items.length)
                        .map((item) => {
                            const isActive = currentActiveMenu === item.id;
                            const isHovered = hoveredItem === item.id;

                            return (
                                <div key={item.id} className="group relative">
                                    {/* Active Indicator avec animation améliorée */}
                                    <div
                                        className={`absolute ${isMobile ? '-left-1.5' : '-left-2'} top-1/2 -translate-y-1/2 ${isMobile ? 'h-8 w-1' : 'h-10 w-1.5'} rounded-r-full bg-gradient-to-b from-emerald-400 to-emerald-600 transition-all duration-500 ${isActive ? 'scale-y-100 opacity-100' : 'scale-y-0 opacity-0'}`}
                                    ></div>

                                    <button
                                        className={`relative w-full cursor-pointer border-none bg-transparent ${isAdministration ? 'gap-1 px-0.5 py-2.5' : isMobile ? 'p-2.5' : 'p-3'} flex flex-col items-center overflow-hidden rounded-xl text-xs font-medium transition-all duration-300 ${
                                            isActive
                                                ? 'scale-105 border border-emerald-400/40 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 text-white shadow-lg'
                                                : 'text-slate-400 hover:scale-105 hover:bg-slate-800/60 hover:text-white active:scale-95'
                                        } ${isHovered && !isActive ? 'shadow-lg' : ''}`}
                                        data-menu={item.id}
                                        aria-label={item.label}
                                        aria-expanded={isActive}
                                        aria-controls={`sidebar-panel-${item.id}`}
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
                                            className={`absolute inset-0 rounded-xl bg-gradient-to-br from-emerald-500/0 via-emerald-500/10 to-teal-500/0 transition-opacity duration-500 ${isActive || isHovered ? 'opacity-100' : 'opacity-0'}`}
                                        ></div>

                                        {/* Icon Container with Animation */}
                                        <span
                                            className={`relative z-10 transition-all duration-300 ${isActive ? 'scale-110 drop-shadow-lg' : isHovered ? 'scale-105' : 'scale-100'}`}
                                        >
                                            {item.icon}
                                        </span>

                                        {/* Label */}
                                        <span
                                            className={`relative z-10 ${isMobile ? 'text-[0.6rem]' : 'text-[0.65rem]'} max-w-full text-center leading-tight font-bold [overflow-wrap:anywhere] whitespace-normal transition-all duration-300 ${isActive ? 'text-white' : ''}`}
                                        >
                                            {item.label}
                                        </span>

                                        {/* Ripple Effect on Click */}
                                        {isActive && <span className="absolute inset-0 animate-ping rounded-xl bg-emerald-400 opacity-20"></span>}
                                    </button>
                                </div>
                            );
                        })}

                    {/* Logout Button avec espacement optimisé */}
                    {roles.some(Boolean) && (
                        <div className={`group relative mt-auto ${isMobile ? 'pt-3' : 'pt-4'}`}>
                            <button
                                className={`relative w-full cursor-pointer border-none bg-transparent ${isMobile ? 'p-2.5' : 'p-3'} flex flex-col items-center overflow-hidden rounded-xl border border-transparent text-xs font-medium text-slate-400 transition-all duration-300 hover:scale-105 hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400 hover:shadow-lg active:scale-95`}
                                data-menu="logout"
                                aria-label={loggingOut ? 'Déconnexion en cours' : 'Déconnexion'}
                                onClick={handleLogout}
                                onMouseEnter={() => setHoveredItem('logout')}
                                onMouseLeave={() => setHoveredItem(null)}
                                disabled={loggingOut}
                            >
                                <span className={`relative z-10 transition-all duration-300 ${hoveredItem === 'logout' ? 'scale-105' : 'scale-100'}`}>
                                    <LogOut size={isMobile ? 20 : 24} />
                                </span>
                                <span
                                    className={`relative z-10 ${isMobile ? 'text-[0.6rem]' : 'text-[0.65rem]'} text-center leading-tight font-bold`}
                                >
                                    {loggingOut ? 'Déconnexion…' : 'Déconnexion'}
                                </span>
                            </button>
                        </div>
                    )}
                </div>
            </nav>

            {/* Menus secondaires avec comportement différent selon l'écran */}
            {Object.entries(subMenuConfig).map(([menuId, config]) => {
                if (!hasPermission(menuId) || !config.items.length) return null;

                const isActive = currentActiveMenu === menuId;
                const hasAnimation = isActive && menuAnimations[menuId];

                return (
                    <div
                        key={menuId}
                        id={`sidebar-panel-${menuId}`}
                        ref={(el) => {
                            menuRefs.current[menuId] = el;
                        }}
                        className={`fixed top-0 z-[70] flex h-screen flex-col border-r border-slate-200/80 bg-white/98 shadow-2xl backdrop-blur-xl transition-all duration-500 ease-out ${isMobile ? 'left-0 w-full' : 'left-20 w-80'} ${
                            isActive
                                ? 'visible translate-x-0 opacity-100'
                                : isMobile
                                  ? 'pointer-events-none invisible -translate-x-full opacity-0'
                                  : 'pointer-events-none invisible -translate-x-8 opacity-0'
                        }`}
                        inert={!isActive}
                        aria-hidden={!isActive}
                    >
                        {/* Header du menu avec design amélioré */}
                        <div
                            className={`relative ${isMobile ? 'px-5 py-5' : 'px-7 py-7'} flex-shrink-0 border-b border-slate-200/60 bg-gradient-to-r from-slate-50 to-white pr-12`}
                        >
                            {/* Bouton de fermeture avec animation */}
                            <button
                                onClick={() => handleCloseMenu(true)}
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
                                        className={`${isMobile ? 'text-xl' : 'text-2xl'} bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text font-bold text-slate-900 text-transparent`}
                                    >
                                        {config.title}
                                    </h3>
                                    {!isAdministration && (
                                        <p className="mt-1 text-sm text-slate-500">
                                            {config.description ??
                                                (menuId === 'dashboard'
                                                    ? isAdministration
                                                        ? 'Gestion et suivi des étudiants du campus'
                                                        : 'Votre parcours et vos services étudiants'
                                                    : menuId === 'enrollments'
                                                      ? 'Vos candidatures et leur suivi'
                                                      : menuId === 'reports'
                                                        ? 'Formations, calendrier et contenus'
                                                        : `Manage your ${menuId} settings`)}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Navigation items avec animations d'entrée */}
                        <nav aria-label={config.title} className={submenuPanelClass(isMobile)}>
                            <div className={isMobile ? 'space-y-2' : 'space-y-3'}>
                                {config.items.map((item, index) => (
                                    <a
                                        key={item.id}
                                        href={item.href}
                                        onClick={item.href && !item.native ? visitMenuPage : undefined}
                                        aria-disabled={!item.href || undefined}
                                        aria-current={item.href && isCurrentDestination(item.href, page.url) ? 'page' : undefined}
                                        tabIndex={item.href ? undefined : -1}
                                        className={`${submenuRowClass(isMobile)} ${hasAnimation ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-0'}`}
                                        style={{ transitionDelay: `${index * 50}ms` }}
                                    >
                                        <SubmenuRowContent
                                            icon={item.icon}
                                            isMobile={isMobile}
                                            status={item.status ?? (!item.href ? 'À venir' : undefined)}
                                        >
                                            {item.label}
                                        </SubmenuRowContent>
                                    </a>
                                ))}
                            </div>
                        </nav>
                    </div>
                );
            })}
        </>
    );
};

const submenuPanelClass = (isMobile: boolean) => `flex-1 overflow-y-auto ${isMobile ? 'p-5' : 'p-6'}`;

function isCurrentDestination(href: string, pageUrl: string | undefined): boolean {
    if (!pageUrl) return false;
    const current = new URL(pageUrl, 'https://navigation.invalid');
    const destination = new URL(href, current);
    current.searchParams.sort();
    destination.searchParams.sort();
    return current.pathname === destination.pathname && current.search === destination.search && current.hash === destination.hash;
}

const submenuRowClass = (isMobile: boolean) =>
    `group flex items-center ${isMobile ? 'gap-3 px-4 py-3' : 'gap-4 px-5 py-4'} relative rounded-xl border border-transparent text-slate-600 transition-all duration-300 hover:translate-x-1 hover:border-slate-200/50 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-teal-50 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-emerald-600`;

function SubmenuRowContent({
    icon,
    isMobile,
    children,
    status,
}: {
    icon: React.ReactNode;
    isMobile: boolean;
    children: React.ReactNode;
    status?: string;
}) {
    return (
        <>
            <span
                aria-hidden="true"
                className={`${isMobile ? 'size-9' : 'size-10'} flex shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition-all duration-300 group-hover:scale-110 group-hover:bg-gradient-to-br group-hover:from-emerald-500 group-hover:to-teal-600 group-hover:text-white`}
            >
                {icon}
            </span>
            <span className={`flex-1 font-medium ${isMobile ? 'text-sm' : 'text-base'}`}>
                {children}
                {status && <small className="ml-2 text-xs text-slate-500">{status}</small>}
            </span>
            {!status && (
                <ChevronRight
                    size={isMobile ? 16 : 18}
                    aria-hidden="true"
                    className="shrink-0 text-slate-400 transition-all duration-300 group-hover:translate-x-1 group-hover:text-emerald-500"
                />
            )}
        </>
    );
}

export default Sidebar;
