import AppsNavigation from '@/components/admin/AppsNavigation';
import DetailNavigation from '@/components/admin/DetailNavigation';
import DashboardHeader from '@/components/layouts/Dashboard/DashboardHeader';
import Sidebar from '@/components/layouts/Dashboard/Sidebar';
import { usePage } from '@inertiajs/react';
import { useEffect, useRef, useState, type ComponentProps } from 'react';
import '../../../../css/dashboard/admin-apps.css';
import '../../../../css/dashboard/usk-theme.css';

// Composant Dashboard principal
const Dashboard = ({ children, authPage = false }: { children: React.ReactNode; authPage?: boolean }) => {
    const [currentActiveMenu, setCurrentActiveMenu] = useState<string | null>(null);
    const [isMobile, setIsMobile] = useState(false);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const { props, component } = usePage<{ auth: { user: { roles?: ComponentProps<typeof Sidebar>['userRole'] } | null }; section?: string }>();
    const isAdminApps = /^dashboard\/(academicYear|faculties|levels|blog|adminEnrollments|studentAcademic|professors|schedule|seo)\//.test(component);
    const isStudentOverview = component === 'dashboard/student/Portal' && props.section === 'overview';
    const isStudentProfile = component === 'dashboard/student/Portal' && props.section === 'profile';
    const isStudentCourse = component === 'dashboard/student/Course';
    const user = props.auth?.user;

    useEffect(() => {
        const handleResize = () => {
            const newIsMobile = window.innerWidth <= 768;
            setIsMobile(newIsMobile);

            // Si on passe de mobile à desktop, fermer le menu mobile
            if (!newIsMobile) {
                setIsMobileSidebarOpen(false);
            }

            // Si on passe de desktop à mobile, fermer tous les menus
            if (newIsMobile) {
                setCurrentActiveMenu(null);
            }
        };

        handleResize(); // Vérifier la taille initiale
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleButtonClick = (e: React.MouseEvent, menuId: string) => {
        e.stopPropagation();
        setCurrentActiveMenu((prev) => (prev === menuId ? null : menuId));
    };

    const toggleMobileSidebar = (e: React.MouseEvent) => {
        e.stopPropagation();
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
            className={`usk-dashboard ${authPage ? 'usk-auth-page' : ''} ${isAdminApps ? 'usk-admin-apps' : ''} ${isStudentOverview ? 'usk-student-overview-shell' : ''} ${isStudentCourse ? 'usk-student-course-shell' : ''} ${isStudentProfile ? 'usk-student-profile-shell' : ''} relative min-h-screen overflow-hidden bg-gray-50`}
        >
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
                isMobileSidebarOpen={isMobileSidebarOpen}
                currentActiveMenu={currentActiveMenu || ''}
                userRole={user?.roles}
            />

            <DashboardHeader
                enrollmentSpace={
                    component.startsWith('dashboard/enrollments/') ||
                    component.startsWith('dashboard/student/') ||
                    (!authPage &&
                        Array.isArray(user?.roles) &&
                        !user.roles.includes('admin') &&
                        user.roles.some((role) => role === 'user' || role === 'student'))
                }
                studentPortal={Boolean(props.studentPortalActive)}
                administration={Array.isArray(user?.roles) && user.roles.includes('admin')}
                adminApps={isAdminApps}
                onMobileToggle={toggleMobileSidebar}
                isMobileSidebarOpen={isMobileSidebarOpen}
            />

            <main
                className={`${authPage ? 'usk-auth-main' : ''} min-h-screen pt-16 transition-transform duration-300 ease-out md:ml-20 lg:ml-20`}
                ref={mainRef}
            >
                <div
                    className={
                        authPage
                            ? 'usk-auth-content'
                            : `mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 ${isStudentOverview ? 'student-desktop-container' : isStudentCourse ? 'student-course-container' : isStudentProfile ? 'student-profile-container' : ''}`
                    }
                >
                    {isAdminApps && (
                        <>
                            <AppsNavigation />
                            <DetailNavigation />
                        </>
                    )}
                    {children}
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
