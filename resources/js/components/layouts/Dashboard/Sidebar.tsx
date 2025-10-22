import Alert from '@/utils/sweetAlert';
import { Link, router } from '@inertiajs/react';
import React, { useEffect, useRef, useState } from 'react';

// Types pour les rôles
type UserRole = 'user' | 'student' | 'instructor' | 'admin' | 'super_admin';

// Configuration des permissions par rôle
const rolePermissions: Record<UserRole, string[]> = {
    user: ['enrollments'], // Aucun menu visible
    student: ['dashboard', 'settings'], // Seulement dashboard et paramètres
    instructor: ['analytics', 'reports', 'settings'], // Pas d'accès student
    admin: ['dashboard', 'analytics', 'reports', 'users', 'settings'], // Presque tout
    super_admin: ['dashboard', 'analytics', 'reports', 'users', 'settings'] // Tout
};

const Sidebar = ({
    onButtonClick,
    isMobileSidebarOpen,
    currentActiveMenu,
    userRole = 'user', // Nouveau prop pour le rôle utilisateur
}: {
    onButtonClick: (e: React.MouseEvent, menuId: string) => void;
    isMobileSidebarOpen: boolean;
    currentActiveMenu: string | null;
    userRole?: UserRole | null;
}) => {
    const sidebarRef = useRef<HTMLDivElement>(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    // Détection du viewport et gestion du sidebar
    useEffect(() => {
        const handleResize = () => {
            const newIsMobile = window.innerWidth <= 768;
            setIsMobile(newIsMobile);

            if (!newIsMobile && sidebarRef.current) {
                sidebarRef.current.style.transform = 'translateX(0)';
                sidebarRef.current.classList.remove('sidebar--mobile-open');
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    

    // Gestion de l'état ouvert/fermé du sidebar
    useEffect(() => {
        if (sidebarRef.current) {
            if (isMobile) {
                sidebarRef.current.style.transform = isMobileSidebarOpen ? 'translateX(0)' : 'translateX(-100%)';
                sidebarRef.current.classList.toggle('sidebar--mobile-open', isMobileSidebarOpen);
            } else {
                sidebarRef.current.style.transform = 'translateX(0)';
                sidebarRef.current.classList.remove('sidebar--mobile-open');
            }
        }
    }, [isMobile, isMobileSidebarOpen]);

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
                    },
                },
            );
        }
    };

    // Fonction pour vérifier si un menu est accessible
    const hasPermission = (menuId: string): boolean => {
        return rolePermissions[userRole as UserRole]?.includes(menuId) || false;
    };

    // Configuration des menus avec leurs informations
    const menuItems = [
        {
            id: 'dashboard',
            label: 'Student',
            ariaLabel: 'Tableau de bord',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
                    <path
                        fill="currentColor"
                        d="m16 7.78l-.313.095l-12.5 4.188L.345 13L2 13.53v8.75c-.597.347-1 .98-1 1.72a2 2 0 1 0 4 0c0-.74-.403-1.373-1-1.72v-8.06l2 .655V20c0 .82.5 1.5 1.094 1.97c.594.467 1.332.797 2.218 1.093c1.774.59 4.112.937 6.688.937s4.914-.346 6.688-.938c.886-.295 1.624-.625 2.218-1.093C25.5 21.5 26 20.82 26 20v-5.125l2.813-.938L31.655 13l-2.843-.938l-12.5-4.187zm0 2.095L25.375 13L16 16.125L6.625 13zm-8 5.688l7.688 2.562l.312.094l.313-.095L24 15.562V20c0 .01.004.126-.313.375c-.316.25-.883.565-1.625.813C20.58 21.681 18.395 22 16 22s-4.58-.318-6.063-.813c-.74-.247-1.308-.563-1.624-.812C7.995 20.125 8 20.01 8 20z"
                    />
                </svg>
            )
        },
        {
            id: 'analytics',
            label: 'Instructor',
            ariaLabel: 'Analyses et statistiques',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24">
                    <path
                        fill="currentColor"
                        d="M1 23v-6h2V7H1V1h6v2h10V1h6v6h-2v10h2v6h-6v-2H7v2zm6-4h10v-2h2V7h-2V5H7v2H5v10h2zm.8-3l3.4-9h1.6l3.4 9h-1.55l-.8-2.3H10.2L9.4 16zm2.85-3.6h2.7l-1.3-3.75h-.1zM3 5h2V3H3zm16 0h2V3h-2zm0 16h2v-2h-2zM3 21h2v-2H3zm2-2"
                    />
                </svg>
            )
        },
        {
            id: 'reports',
            label: 'Apps',
            ariaLabel: 'Rapports',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 8 8">
                    <path
                        fill="currentColor"
                        d="M6 6v2h2V6M3 6v2h2V6M0 6v2h2V6M0 3v2h2V3m1 0v2h2V3m1 0v2h2V3M6 0v2h2V0M3 0v2h2V0M0 0v2h2V0"
                    />
                </svg>
            )
        },
        {
            id: 'users',
            label: 'Account',
            ariaLabel: 'Gestion des utilisateurs',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24">
                    <path
                        fill="currentColor"
                        d="M12 13q1.45 0 2.475-1.025T15.5 9.5t-1.025-2.475T12 6T9.525 7.025T8.5 9.5t1.025 2.475T12 13m-7 8q-.825 0-1.412-.587T3 19V5q0-.825.588-1.412T5 3h14q.825 0 1.413.588T21 5v14q0 .825-.587 1.413T19 21zm0-2h14v-1.15q-1.35-1.325-3.137-2.087T12 15t-3.863.763T5 17.85z"
                    />
                </svg>
            )
        },
        {
            id: 'settings',
            label: 'Paramètres',
            ariaLabel: 'Paramètres de l\'application',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24">
                    <path
                        fill="currentColor"
                        d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2m-2 12H6v-2h12zm0-3H6V9h12zm0-3H6V6h12z"
                    />
                </svg>
            )
        },
        {
            id: 'enrollments',
            label: 'Inscriptions',
            ariaLabel: 'Gestion des inscriptions',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24">
                    <path
                        fill="currentColor"
                        d="M12 13q1.45 0 2.475-1.025T15.5 9.5t-1.025-2.475T12 6T9.525 7.025T8.5 9.5t1.025 2.475T12 13m-7 8q-.825 0-1.412-.587T3 19V5q0-.825.588-1.412T5 3h14q.825 0 1.413.588T21 5v14q0 .825-.587 1.413T19 21zm0-2h14v-1.15q-1.35-1.325-3.137-2.087T12 15t-3.863.763T5 17.85z"
                    />
                </svg>
            )
        }
    ];

    // Si l'utilisateur n'a aucune permission, ne pas afficher la sidebar
    // if (rolePermissions[userRole].length === 0) {
    //     return null;
    // }
    console.log(userRole);
    return (
        <>
            <nav className="sidebar" id="sidebar" aria-label="Navigation principale" ref={sidebarRef}>
                <div className="sidebar__brand">
                    <div className="sidebar__brand-logo" aria-label="Logo de l'application">
                        D
                    </div>
                </div>

                <div className="sidebar__nav">
                    {menuItems.map((item, index) => {
                        // Vérifier si l'utilisateur a la permission pour ce menu
                        if (!hasPermission(item.id)) {
                            return null;
                        }

                        return (
                            <React.Fragment key={item.id}>
                                <div className="sidebar__item">
                                    <button
                                        className={`sidebar__button ${currentActiveMenu === item.id ? 'sidebar__button--active' : ''}`}
                                        data-menu={item.id}
                                        aria-label={item.ariaLabel}
                                        aria-expanded={currentActiveMenu === item.id}
                                        onClick={(e) => onButtonClick(e, item.id)}
                                    >
                                        <span className="sidebar__icon">
                                            {item.icon}
                                        </span>
                                        <span className="sidebar__label">{item.label}</span>
                                    </button>
                                </div>
                                {/* Ajouter un séparateur après chaque item sauf le dernier */}
                                {index < menuItems.length - 1 && <div className="sidebar__separator"></div>}
                            </React.Fragment>
                        );
                    })}

                    {/* Séparateur avant logout si au moins un menu est affiché */}
                    {rolePermissions[userRole as UserRole].length > 0 && <div className="sidebar__separator"></div>}

                    {/* Bouton de déconnexion - toujours visible */}
                    <div className="sidebar__item">
                        <button
                            className={`sidebar__button ${currentActiveMenu === 'logout' ? 'sidebar__button--active' : ''}`}
                            data-menu="logout"
                            aria-label="Se deconnecter"
                            aria-expanded={currentActiveMenu === 'logout'}
                            onClick={handleLogout}
                        >
                            <span className="sidebar__icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24">
                                    <path
                                        fill="currentColor"
                                        d="M5 21q-.825 0-1.412-.587T3 19V5q0-.825.588-1.412T5 3h7v2H5v14h7v2zm11-4l-1.375-1.45l2.55-2.55H9v-2h8.175l-2.55-2.55L16 7l5 5z"
                                    />
                                </svg>
                            </span>
                            <span className="sidebar__label">Se deconnecter</span>
                        </button>
                    </div>
                </div>
            </nav>

            {/* Menus déroulants - Affichés seulement si l'utilisateur a la permission */}
            {hasPermission('dashboard') && (
                <div
                    id="dashboard"
                    className={`sidebar-menu ${currentActiveMenu === 'dashboard' ? 'sidebar-menu--active animate-slide-in' : ''}`}
                    role="menu"
                    aria-hidden={currentActiveMenu !== 'dashboard'}
                >
                    <h3 className="sidebar-menu__title">Tableau de bord</h3>
                    <nav className="sidebar-menu__nav">
                        <a href="#" className="sidebar-menu__link" role="menuitem">
                            Vue d'ensemble
                        </a>
                        <a href="#" className="sidebar-menu__link" role="menuitem">
                            Activités récentes
                        </a>
                        <a href="#" className="sidebar-menu__link" role="menuitem">
                            Métriques clés
                        </a>
                        <a href="#" className="sidebar-menu__link" role="menuitem">
                            Alertes
                        </a>
                    </nav>
                </div>
            )}

            {hasPermission('analytics') && (
                <div
                    id="analytics"
                    className={`sidebar-menu ${currentActiveMenu === 'analytics' ? 'sidebar-menu--active animate-slide-in' : ''}`}
                    role="menu"
                    aria-hidden={currentActiveMenu !== 'analytics'}
                >
                    <h3 className="sidebar-menu__title">Analytics</h3>
                    <nav className="sidebar-menu__nav">
                        <a href="#" className="sidebar-menu__link" role="menuitem">
                            Audiences
                        </a>
                        <a href="#" className="sidebar-menu__link" role="menuitem">
                            Comportement
                        </a>
                        <a href="#" className="sidebar-menu__link" role="menuitem">
                            Conversions
                        </a>
                        <a href="#" className="sidebar-menu__link" role="menuitem">
                            Temps réel
                        </a>
                    </nav>
                </div>
            )}

            {hasPermission('reports') && (
                <div
                    id="reports"
                    className={`sidebar-menu ${currentActiveMenu === 'reports' ? 'sidebar-menu--active animate-slide-in' : ''}`}
                    role="menu"
                    aria-hidden={currentActiveMenu !== 'reports'}
                >
                    <h3 className="sidebar-menu__title">Configuration</h3>
                    <nav className="sidebar-menu__nav">
                        <Link href={route('dashboard.admin.academic-years.index')} className="sidebar-menu__link" role="menuitem">
                            Années Académiques
                        </Link>
                        <Link href={route('dashboard.admin.faculties.index')} className="sidebar-menu__link" role="menuitem">
                            Facultés
                        </Link>
                        <Link href={route('dashboard.admin.faculties.show', 1)} className="sidebar-menu__link" role="menuitem">
                            Niveaux
                        </Link>
                    </nav>
                </div>
            )}

            {hasPermission('users') && (
                <div
                    id="users"
                    className={`sidebar-menu ${currentActiveMenu === 'users' ? 'sidebar-menu--active animate-slide-in' : ''}`}
                    role="menu"
                    aria-hidden={currentActiveMenu !== 'users'}
                >
                    <h3 className="sidebar-menu__title">Utilisateurs</h3>
                    <nav className="sidebar-menu__nav">
                        <a href="#" className="sidebar-menu__link" role="menuitem">
                            Tous les utilisateurs
                        </a>
                        <a href="#" className="sidebar-menu__link" role="menuitem">
                            Rôles et permissions
                        </a>
                        <a href="#" className="sidebar-menu__link" role="menuitem">
                            Groupes
                        </a>
                        <a href="#" className="sidebar-menu__link" role="menuitem">
                            Audit des connexions
                        </a>
                    </nav>
                </div>
            )}

            {hasPermission('settings') && (
                <div
                    id="settings"
                    className={`sidebar-menu ${currentActiveMenu === 'settings' ? 'sidebar-menu--active animate-slide-in' : ''}`}
                    role="menu"
                    aria-hidden={currentActiveMenu !== 'settings'}
                >
                    <h3 className="sidebar-menu__title">Paramètres</h3>
                    <nav className="sidebar-menu__nav">
                        <a href="#" className="sidebar-menu__link" role="menuitem">
                            Général
                        </a>
                        <a href="#" className="sidebar-menu__link" role="menuitem">
                            Sécurité
                        </a>
                        <a href="#" className="sidebar-menu__link" role="menuitem">
                            Notifications
                        </a>
                        <a href="#" className="sidebar-menu__link" role="menuitem">
                            Intégrations
                        </a>
                        <a href="#" className="sidebar-menu__link" role="menuitem">
                            Support
                        </a>
                    </nav>
                </div>
            )}

            {hasPermission('enrollments') && (
                <div
                    id="enrollments"
                    className={`sidebar-menu ${currentActiveMenu === 'enrollments' ? 'sidebar-menu--active animate-slide-in' : ''}`}
                    role="menu"
                    aria-hidden={currentActiveMenu !== 'enrollments'}
                >
                    <h3 className="sidebar-menu__title">Inscriptions</h3>
                    <nav className="sidebar-menu__nav">
                        <Link href={route('dashboard.enrollments.index')} className="sidebar-menu__link" role="menuitem">
                            Mes inscriptions
                        </Link>
                    </nav>
                </div>
            )}


        </>
    );
};

export default Sidebar;