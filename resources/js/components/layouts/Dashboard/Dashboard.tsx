import AppsNavigation from '@/components/admin/AppsNavigation';
import DetailNavigation from '@/components/admin/DetailNavigation';
import DashboardHeader from '@/components/layouts/Dashboard/DashboardHeader';
import Sidebar from '@/components/layouts/Dashboard/Sidebar';
import { DashboardArrivalContext, DashboardCurtain, useDashboardArrival } from '@/components/system/DashboardArrival';
import { DashboardDepartureContext } from '@/components/system/DashboardDeparture';
import { NavigationFeedbackContext } from '@/components/system/NavigationFeedback';
import PageContent from '@/components/system/PageContent';
import { useDashboardTheme } from '@/hooks/use-dashboard-theme';
import { usePage } from '@inertiajs/react';
import { useCallback, useContext, useEffect, useRef, useState, type ComponentProps } from 'react';
import '../../../../css/dashboard/admin-apps.css';
import '../../../../css/dashboard/night.css';
import '../../../../css/dashboard/usk-theme.css';

// Composant Dashboard principal
const Dashboard = ({
    children,
    authPage = false,
    hideAppsNavigation = false,
}: {
    children: React.ReactNode;
    authPage?: boolean;
    hideAppsNavigation?: boolean;
}) => {
    const [currentActiveMenu, setCurrentActiveMenu] = useState<string | null>(null);
    const [isMobile, setIsMobile] = useState(false);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const { props, component, flash, url } = usePage<{
        auth: { user: { roles?: ComponentProps<typeof Sidebar>['userRole']; permissions?: string[] } | null };
        section?: string;
    }>();
    const isAdminApps = /^dashboard\/(academicYear|faculties|levels|blog|adminEnrollments|studentAcademic|professors|schedule|seo)\//.test(component);
    const showAppsNavigation = isAdminApps && !hideAppsNavigation && component !== 'dashboard/adminEnrollments/Overview';
    const isStudentOverview = component === 'dashboard/student/Portal' && props.section === 'overview';
    const isStudentProfile = component === 'dashboard/student/Portal' && props.section === 'profile';
    const isStudentCourse = component === 'dashboard/student/Course';
    const user = props.auth?.user;
    const roles = Array.isArray(user?.roles) ? user.roles : [user?.roles];
    const administration = roles.includes('admin');
    const teaching = roles.includes('professor') && (url.startsWith('/dashboard/teacher') || (!administration && !props.studentPortalActive));
    const tone =
        authPage || component.startsWith('dashboard/auth/')
            ? 'auth'
            : (administration || teaching) && !url.startsWith('/dashboard/student')
              ? 'admin'
              : 'student';
    const { resolved } = useDashboardTheme();
    const themeEnabled = Boolean(user && tone !== 'auth');
    const opening = useDashboardArrival(Boolean(user && tone !== 'auth' && flash?.dashboardArrival === true));
    const { phase: departure, logout } = useContext(DashboardDepartureContext);
    const { cancelPageTransition } = useContext(NavigationFeedbackContext);
    const arriving = opening && departure === null;
    const leaving = Boolean(user && (departure === 'closing' || departure === 'waiting'));
    const loggingOut = leaving || Boolean(user && departure === 'immediate');
    const closeSubmenu = useCallback(() => setCurrentActiveMenu(null), []);

    useEffect(() => {
        if (!themeEnabled) return;
        const hideVisualProgress = () => document.getElementById('nprogress')?.setAttribute('aria-hidden', 'true');
        const observer = new MutationObserver(hideVisualProgress);
        observer.observe(document.body, { childList: true });
        hideVisualProgress();
        return () => {
            observer.disconnect();
            document.getElementById('nprogress')?.removeAttribute('aria-hidden');
        };
    }, [themeEnabled]);

    useEffect(() => {
        const desktop = window.matchMedia('(min-width: 48rem)');
        const syncViewport = () => {
            setIsMobile(!desktop.matches);

            // Si on passe de mobile à desktop, fermer le menu mobile
            if (desktop.matches) {
                setIsMobileSidebarOpen(false);
            } else {
                setCurrentActiveMenu(null);
            }
        };

        syncViewport();
        desktop.addEventListener('change', syncViewport);
        return () => desktop.removeEventListener('change', syncViewport);
    }, []);

    const handleButtonClick = (e: React.MouseEvent, menuId: string) => {
        e.stopPropagation();
        setCurrentActiveMenu((prev) => (prev === menuId ? null : menuId));
    };

    const toggleMobileSidebar = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentActiveMenu(null);
        setIsMobileSidebarOpen((prev) => !prev);
    };

    const mainRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!mainRef.current) return;

        if (isMobile) {
            if (isMobileSidebarOpen) {
                mainRef.current.style.transform = `translateX(${currentActiveMenu ? '300px' : '80px'})`;
            } else {
                mainRef.current.style.transform = 'translateX(0)';
            }
        } else {
            mainRef.current.style.transform = 'none';
        }
    }, [isMobile, isMobileSidebarOpen, currentActiveMenu]);

    const closeAllMenus = () => {
        setCurrentActiveMenu(null);
        setIsMobileSidebarOpen(false);
    };

    return (
        <div
            className={`usk-dashboard ${authPage ? 'usk-auth-page' : ''} ${isAdminApps ? 'usk-admin-apps' : ''} ${isStudentOverview ? 'usk-student-overview-shell' : ''} ${isStudentCourse ? 'usk-student-course-shell' : ''} ${isStudentProfile ? 'usk-student-profile-shell' : ''} relative min-h-screen overflow-x-clip bg-gray-50`}
            data-dashboard-theme={themeEnabled ? resolved : undefined}
            data-dashboard-arrival={arriving ? '' : undefined}
            data-dashboard-departure={leaving ? '' : undefined}
            inert={loggingOut}
        >
            {themeEnabled && (
                <a
                    className="usk-dashboard-skip"
                    href="#usk-dashboard-main"
                    onClick={(event) => {
                        event.preventDefault();
                        mainRef.current?.focus();
                    }}
                >
                    Aller au contenu principal
                </a>
            )}
            {arriving && <DashboardCurtain />}
            {/* Overlay pour mobile */}
            <div
                className={`fixed inset-0 z-50 bg-black/50 transition-opacity duration-300 md:hidden ${
                    isMobileSidebarOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
                }`}
                id="overlay"
                onClick={closeAllMenus}
            ></div>

            <Sidebar
                onButtonClick={handleButtonClick}
                onCloseMenu={closeSubmenu}
                onNavigate={closeAllMenus}
                onLogout={() => {
                    cancelPageTransition();
                    closeAllMenus();
                    logout(tone !== 'auth');
                }}
                loggingOut={loggingOut}
                isMobile={isMobile}
                isMobileSidebarOpen={isMobileSidebarOpen}
                currentActiveMenu={currentActiveMenu || ''}
                userRole={user?.roles ?? null}
            />

            <DashboardHeader
                enrollmentSpace={
                    component.startsWith('dashboard/enrollments/') ||
                    (component.startsWith('dashboard/student/') && !url.startsWith('/dashboard/admin/')) ||
                    (!authPage && !administration && !teaching && roles.some((role) => role === 'user' || role === 'candidate' || role === 'student'))
                }
                studentPortal={Boolean(props.studentPortalActive)}
                administration={administration}
                teaching={teaching}
                teachingProfileActive={Boolean(props.teachingProfileActive)}
                canManageCourses={Boolean(user?.permissions?.includes('manage courses'))}
                authenticated={Boolean(user)}
                themeEnabled={themeEnabled}
                adminApps={isAdminApps}
                onMobileToggle={toggleMobileSidebar}
                isMobileSidebarOpen={isMobileSidebarOpen}
            />

            <main
                id={themeEnabled ? 'usk-dashboard-main' : undefined}
                tabIndex={themeEnabled ? -1 : undefined}
                className={`usk-page-content ${authPage ? 'usk-auth-main' : ''} min-h-screen pt-16 transition-transform duration-300 ease-out md:ml-20 lg:ml-20`}
                data-page-tone={tone}
                data-dashboard-navigation-surface={user && tone !== 'auth' ? '' : undefined}
                ref={mainRef}
            >
                <PageContent
                    tone={tone}
                    skipEntrance={arriving || departure !== null}
                    className={
                        authPage
                            ? 'usk-auth-content'
                            : `w-full min-w-0 px-4 py-8 sm:px-6 lg:px-8 ${isStudentOverview ? 'student-desktop-container' : isStudentCourse ? 'student-course-container' : isStudentProfile ? 'student-profile-container' : ''}`
                    }
                >
                    {showAppsNavigation && <AppsNavigation />}
                    {isAdminApps && <DetailNavigation />}
                    <DashboardArrivalContext.Provider value={arriving}>{children}</DashboardArrivalContext.Provider>
                </PageContent>
            </main>
        </div>
    );
};

export default Dashboard;
