import DashboardHeader from '@/components/layouts/Dashboard/DashboardHeader';
import Sidebar from '@/components/layouts/Dashboard/Sidebar';
import { useEffect, useRef, useState } from 'react';
import '../../../../css/dashboard/app.css';

// Composant Dashboard principal
const Dashboard = ({ children }: { children: React.ReactNode }) => {
    const [currentActiveMenu, setCurrentActiveMenu] = useState(null);
    const [isMobile, setIsMobile] = useState(false);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

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

    const handleSidebarButtonClick = (e: React.MouseEvent, menuId: string) => {
        e.stopPropagation();

        // Si le menu est déjà actif, le fermer
        if (currentActiveMenu === menuId) {
            setCurrentActiveMenu(null);
            return;
        }

        // Fermer tous les menus d'abord
        setCurrentActiveMenu(null);

        // Si on est en mobile, ouvrir d'abord la sidebar
        if (isMobile && !isMobileSidebarOpen) {
            setIsMobileSidebarOpen(true);
        }

        // Ouvrir le nouveau menu
        setTimeout(() => {
            setCurrentActiveMenu(menuId);
        }, 10);
    };

    const handleButtonClick = (e: React.MouseEvent, menuId: string) => {
      e.stopPropagation();
      setCurrentActiveMenu(prev => prev === menuId ? null : menuId);
    };

    const toggleMobileSidebar = (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsMobileSidebarOpen(prev => !prev);
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
        <div className="dashboard">
            {/* Overlay pour mobile */}
            <div className={`overlay ${isMobileSidebarOpen ? 'overlay--active' : ''}`} id="overlay" onClick={closeAllMenus}></div>

            <Sidebar onButtonClick={handleButtonClick} isMobileSidebarOpen={isMobileSidebarOpen} currentActiveMenu={currentActiveMenu || ''} />

            <DashboardHeader onMobileToggle={toggleMobileSidebar} />

            <main className="main" ref={mainRef}>
                <div className="main__content">
                    {children || (
                        <>
                            <header className="main__header">
                                <h1 className="main__title">Bienvenue dans votre Dashboard</h1>
                                <p className="main__subtitle">
                                    Gérez vos projets, analysez vos données et collaborez avec votre équipe en toute simplicité.
                                </p>
                            </header>

                            <section className="main__section animate-fade-in">
                                <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem', fontWeight: 600 }}>Interface Moderne et Responsive</h2>
                                <p style={{ marginBottom: '1.5rem', color: 'var(--color-text-secondary)' }}>
                                    Cette interface utilise les dernières tendances en matière de design web avec une approche mobile-first. Cliquez
                                    sur les icônes de la barre latérale pour explorer les différentes sections.
                                </p>

                                <div
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                                        gap: '1.5rem',
                                        marginTop: '2rem',
                                    }}
                                >
                                    <div
                                        style={{
                                            padding: '1.5rem',
                                            background: 'var(--color-surface-secondary)',
                                            borderRadius: 'var(--radius-md)',
                                            border: '1px solid var(--color-border)',
                                        }}
                                    >
                                        <h3
                                            style={{
                                                marginBottom: '0.75rem',
                                                fontWeight: 600,
                                                color: 'var(--color-primary)',
                                            }}
                                        >
                                            🎨 Design System
                                        </h3>
                                        <p
                                            style={{
                                                color: 'var(--color-text-secondary)',
                                                fontSize: '0.875rem',
                                            }}
                                        >
                                            Architecture BEM, variables CSS, et
                                        </p>
                                    </div>

                                    <div
                                        style={{
                                            padding: '1.5rem',
                                            background: 'var(--color-surface-secondary)',
                                            borderRadius: 'var(--radius-md)',
                                            border: '1px solid var(--color-border)',
                                        }}
                                    >
                                        <h3
                                            style={{
                                                marginBottom: '0.75rem',
                                                fontWeight: 600,
                                                color: 'var(--color-secondary)',
                                            }}
                                        >
                                            📱 Responsive
                                        </h3>
                                        <p
                                            style={{
                                                color: 'var(--color-text-secondary)',
                                                fontSize: '0.875rem',
                                            }}
                                        >
                                            Interface adaptative qui s'ajuste automatiquement à tous les types d'écrans et appareils.
                                        </p>
                                    </div>

                                    <div
                                        style={{
                                            padding: '1.5rem',
                                            background: 'var(--color-surface-secondary)',
                                            borderRadius: 'var(--radius-md)',
                                            border: '1px solid var(--color-border)',
                                        }}
                                    >
                                        <h3
                                            style={{
                                                marginBottom: '0.75rem',
                                                fontWeight: 600,
                                                color: '#f59e0b',
                                            }}
                                        >
                                            ♿ Accessibilité
                                        </h3>
                                        <p
                                            style={{
                                                color: 'var(--color-text-secondary)',
                                                fontSize: '0.875rem',
                                            }}
                                        >
                                            Respect des standards WCAG avec navigation au clavier et lecteurs d'écran supportés.
                                        </p>
                                    </div>
                                </div>
                            </section>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
