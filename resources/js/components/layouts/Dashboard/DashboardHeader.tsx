import React from 'react';
import '../../../../css/dashboard/app.css';

const DashboardHeader = ({ onMobileToggle }: { onMobileToggle: (e: React.MouseEvent) => void }) => {
    return (
      <header className="header">
        <div className="header__left">
          <button
            className="header__menu-toggle"
            id="mobileMenuToggle"
            aria-label="Ouvrir le menu de navigation"
            onClick={onMobileToggle}
          >
            <span>☰</span>
          </button>
  
          <nav className="header__nav">
            <a href="#" className="header__nav-link">Accueil</a>
            <a href="#" className="header__nav-link">Projets</a>
            <a href="#" className="header__nav-link">Équipe</a>
            <a href="#" className="header__nav-link">Notifications</a>
          </nav>
        </div>
  
        <div className="header__right">
          <div className="header__search">
            <span className="header__search-icon">🔍</span>
            <input
              type="search"
              className="header__search-input"
              placeholder="Rechercher..."
              aria-label="Champ de recherche"
            />
          </div>
  
          <div className="header__actions">
            <button className="header__button" aria-label="Notifications">
              <span>🔔</span>
            </button>
            <button className="header__button" aria-label="Paramètres de sécurité">
              <span>🔒</span>
            </button>
            <button className="header__button header__button--primary">
              Nouvelle action
            </button>
          </div>
        </div>
      </header>
    );
  };
  
  export default DashboardHeader;
