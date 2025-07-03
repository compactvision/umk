import React, { useEffect, useRef, useState } from 'react';

const Sidebar = ({ onButtonClick, isMobileSidebarOpen, currentActiveMenu }: { 
  onButtonClick: (e: React.MouseEvent, menuId: string) => void, 
  isMobileSidebarOpen: boolean, 
  currentActiveMenu: string | null 
}) => {
    const sidebarRef = useRef<HTMLDivElement>(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    // Détection du viewport et gestion du sidebar
    useEffect(() => {
        const handleResize = () => {
            const newIsMobile = window.innerWidth <= 768;
            setIsMobile(newIsMobile);
            
            if (!newIsMobile && sidebarRef.current) {
                // En desktop, on s'assure que le sidebar est visible
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
                sidebarRef.current.style.transform = isMobileSidebarOpen 
                    ? 'translateX(0)' 
                    : 'translateX(-100%)';
                sidebarRef.current.classList.toggle('sidebar--mobile-open', isMobileSidebarOpen);
            } else {
                sidebarRef.current.style.transform = 'translateX(0)';
                sidebarRef.current.classList.remove('sidebar--mobile-open');
            }
        }
    }, [isMobile, isMobileSidebarOpen]);

    return (
      <>
        <nav className="sidebar" id="sidebar" aria-label="Navigation principale" ref={sidebarRef}>
          <div className="sidebar__brand">
            <div className="sidebar__brand-logo" aria-label="Logo de l'application">
              D
            </div>
          </div>
    
          <div className="sidebar__nav">
            <div className="sidebar__item">
              <button
                className={`sidebar__button ${currentActiveMenu === 'dashboard' ? 'sidebar__button--active' : ''}`}
                data-menu="dashboard"
                aria-label="Tableau de bord"
                aria-expanded={currentActiveMenu === 'dashboard'}
                onClick={(e) => onButtonClick(e, 'dashboard')}
              >
                <span className="sidebar__icon">🏠</span>
                <span className="sidebar__label">Accueil</span>
              </button>
            </div>
    
            <div className="sidebar__separator"></div>
    
            <div className="sidebar__item">
              <button
                className={`sidebar__button ${currentActiveMenu === 'analytics' ? 'sidebar__button--active' : ''}`}
                data-menu="analytics"
                aria-label="Analyses et statistiques"
                aria-expanded={currentActiveMenu === 'analytics'}
                onClick={(e) => onButtonClick(e, 'analytics')}
              >
                <span className="sidebar__icon">📊</span>
                <span className="sidebar__label">Analytics</span>
              </button>
            </div>
    
            <div className="sidebar__separator"></div>
    
            <div className="sidebar__item">
              <button
                className={`sidebar__button ${currentActiveMenu === 'reports' ? 'sidebar__button--active' : ''}`}
                data-menu="reports"
                aria-label="Rapports"
                aria-expanded={currentActiveMenu === 'reports'}
                onClick={(e) => onButtonClick(e, 'reports')}
              >
                <span className="sidebar__icon">📈</span>
                <span className="sidebar__label">Rapports</span>
              </button>
            </div>
    
            <div className="sidebar__separator"></div>
    
            <div className="sidebar__item">
              <button
                className={`sidebar__button ${currentActiveMenu === 'users' ? 'sidebar__button--active' : ''}`}
                data-menu="users"
                aria-label="Gestion des utilisateurs"
                aria-expanded={currentActiveMenu === 'users'}
                onClick={(e) => onButtonClick(e, 'users')}
              >
                <span className="sidebar__icon">👥</span>
                <span className="sidebar__label">Utilisateurs</span>
              </button>
            </div>
    
            <div className="sidebar__separator"></div>
    
            <div className="sidebar__item">
              <button
                className={`sidebar__button ${currentActiveMenu === 'settings' ? 'sidebar__button--active' : ''}`}
                data-menu="settings"
                aria-label="Paramètres de l'application"
                aria-expanded={currentActiveMenu === 'settings'}
                onClick={(e) => onButtonClick(e, 'settings')}
              >
                <span className="sidebar__icon">⚙️</span>
                <span className="sidebar__label">Paramètres</span>
              </button>
            </div>
          </div>
        </nav>

        {/* Menus déroulants - Positionnés en dehors de la sidebar */}
        <div 
          id="dashboard" 
          className={`sidebar-menu ${currentActiveMenu === 'dashboard' ? 'sidebar-menu--active animate-slide-in' : ''}`} 
          role="menu" 
          aria-hidden={currentActiveMenu !== 'dashboard'}
        >
          <h3 className="sidebar-menu__title">Tableau de bord</h3>
          <nav className="sidebar-menu__nav">
            <a href="#" className="sidebar-menu__link" role="menuitem">Vue d'ensemble</a>
            <a href="#" className="sidebar-menu__link" role="menuitem">Activités récentes</a>
            <a href="#" className="sidebar-menu__link" role="menuitem">Métriques clés</a>
            <a href="#" className="sidebar-menu__link" role="menuitem">Alertes</a>
          </nav>
        </div>

        <div 
          id="analytics" 
          className={`sidebar-menu ${currentActiveMenu === 'analytics' ? 'sidebar-menu--active animate-slide-in' : ''}`} 
          role="menu" 
          aria-hidden={currentActiveMenu !== 'analytics'}
        >
          <h3 className="sidebar-menu__title">Analytics</h3>
          <nav className="sidebar-menu__nav">
            <a href="#" className="sidebar-menu__link" role="menuitem">Audiences</a>
            <a href="#" className="sidebar-menu__link" role="menuitem">Comportement</a>
            <a href="#" className="sidebar-menu__link" role="menuitem">Conversions</a>
            <a href="#" className="sidebar-menu__link" role="menuitem">Temps réel</a>
          </nav>
        </div>

        <div 
          id="reports" 
          className={`sidebar-menu ${currentActiveMenu === 'reports' ? 'sidebar-menu--active animate-slide-in' : ''}`} 
          role="menu" 
          aria-hidden={currentActiveMenu !== 'reports'}
        >
          <h3 className="sidebar-menu__title">Rapports</h3>
          <nav className="sidebar-menu__nav">
            <a href="#" className="sidebar-menu__link" role="menuitem">Rapports mensuels</a>
            <a href="#" className="sidebar-menu__link" role="menuitem">Performance</a>
            <a href="#" className="sidebar-menu__link" role="menuitem">Tendances</a>
            <a href="#" className="sidebar-menu__link" role="menuitem">Export données</a>
          </nav>
        </div>

        <div 
          id="users" 
          className={`sidebar-menu ${currentActiveMenu === 'users' ? 'sidebar-menu--active animate-slide-in' : ''}`} 
          role="menu" 
          aria-hidden={currentActiveMenu !== 'users'}
        >
          <h3 className="sidebar-menu__title">Utilisateurs</h3>
          <nav className="sidebar-menu__nav">
            <a href="#" className="sidebar-menu__link" role="menuitem">Tous les utilisateurs</a>
            <a href="#" className="sidebar-menu__link" role="menuitem">Rôles et permissions</a>
            <a href="#" className="sidebar-menu__link" role="menuitem">Groupes</a>
            <a href="#" className="sidebar-menu__link" role="menuitem">Audit des connexions</a>
          </nav>
        </div>

        <div 
          id="settings" 
          className={`sidebar-menu ${currentActiveMenu === 'settings' ? 'sidebar-menu--active animate-slide-in' : ''}`} 
          role="menu" 
          aria-hidden={currentActiveMenu !== 'settings'}
        >
          <h3 className="sidebar-menu__title">Paramètres</h3>
          <nav className="sidebar-menu__nav">
            <a href="#" className="sidebar-menu__link" role="menuitem">Général</a>
            <a href="#" className="sidebar-menu__link" role="menuitem">Sécurité</a>
            <a href="#" className="sidebar-menu__link" role="menuitem">Notifications</a>
            <a href="#" className="sidebar-menu__link" role="menuitem">Intégrations</a>
            <a href="#" className="sidebar-menu__link" role="menuitem">Support</a>
          </nav>
        </div>

        
      </>
    );
};

export default Sidebar;