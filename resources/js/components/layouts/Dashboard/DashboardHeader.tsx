import React from 'react';
import '../../../../css/dashboard/app.css';
import { Link } from '@inertiajs/react';

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
            <span>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M22 18.005c0 .55-.446.995-.995.995h-8.01a.995.995 0 0 1 0-1.99h8.01c.55 0 .995.445.995.995M22 12c0 .55-.446.995-.995.995H2.995a.995.995 0 1 1 0-1.99h18.01c.55 0 .995.446.995.995m-.995-5.01a.995.995 0 0 0 0-1.99H8.995a.995.995 0 1 0 0 1.99z"/></svg>
            </span>
          </button>
  
          <nav className="header__nav">
            <Link href={route('home')} className="header__nav-link">Accueil</Link>
            <Link href="#" className="header__nav-link">Projets</Link>
            <Link href="#" className="header__nav-link">Équipe</Link>
            <Link href="#" className="header__nav-link">Notifications</Link>
          </nav>
        </div>
  
        <div className="header__right">
          <div className="header__search">
            <span className="header__search-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M15.102 16.162a8 8 0 1 1 1.06-1.06l4.618 4.618a.75.75 0 1 1-1.06 1.06zM16.5 10a6.5 6.5 0 1 0-13 0a6.5 6.5 0 0 0 13 0"/></svg>
            </span>
            <input
              type="search"
              className="header__search-input"
              placeholder="Rechercher..."
              aria-label="Champ de recherche"
            />
          </div>
  
          <div className="header__actions">
            <button className="header__button" aria-label="Paramètres de sécurité">
              <span>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"><path fill="currentColor" d="M15 8V5s0-5-5-5a4.63 4.63 0 0 0-4.88 4h2C7.31 2.93 8 2 10 2c3 0 3 2 3 3.5V8H3.93A1.93 1.93 0 0 0 2 9.93v8.15A1.93 1.93 0 0 0 3.93 20h12.14A1.93 1.93 0 0 0 18 18.07V9.93A1.93 1.93 0 0 0 16.07 8zm-5 8a2 2 0 1 1 2-2a2 2 0 0 1-2 2"/></svg>
              </span>
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
