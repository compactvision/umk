import React from 'react';
import { Link } from '@inertiajs/react';

const DashboardHeader = ({ 
  onMobileToggle, 
  isMobileSidebarOpen = false 
}: { 
  onMobileToggle: (e: React.MouseEvent) => void;
  isMobileSidebarOpen?: boolean;
}) => {
    return (
      <header className="bg-white border-b border-gray-200 shadow-sm fixed top-0 right-0 left-0 z-40 transition-all duration-300">
        <div className={`flex items-center justify-between px-4 py-3 lg:px-6 transition-all duration-300
          ${isMobileSidebarOpen 
            ? 'lg:pl-[132px] pl-[108px]'  // Quand sidebar ouverte
            : 'lg:pl-[132px] pl-4'       // Quand sidebar fermée (mobile)
          }
        `}>
          <div className="flex items-center space-x-4">
            <button
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 lg:hidden"
              id="mobileMenuToggle"
              aria-label="Ouvrir le menu de navigation"
              onClick={onMobileToggle}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" className="text-gray-600">
                <path fill="currentColor" d="M22 18.005c0 .55-.446.995-.995.995h-8.01a.995.995 0 0 1 0-1.99h8.01c.55 0 .995.445.995.995M22 12c0 .55-.446.995-.995.995H2.995a.995.995 0 1 1 0-1.99h18.01c.55 0 .995.446.995.995m-.995-5.01a.995.995 0 0 0 0-1.99H8.995a.995.995 0 1 0 0 1.99z"/>
              </svg>
            </button>
  
            <nav className="hidden lg:flex items-center space-x-6">
              <Link href={route('home')} className="text-gray-700 hover:text-indigo-600 font-medium transition-colors duration-200">Accueil</Link>
              <Link href="#" className="text-gray-700 hover:text-indigo-600 font-medium transition-colors duration-200">Projets</Link>
              <Link href="#" className="text-gray-700 hover:text-indigo-600 font-medium transition-colors duration-200">Équipe</Link>
              <Link href="#" className="text-gray-700 hover:text-indigo-600 font-medium transition-colors duration-200">Notifications</Link>
            </nav>
          </div>
  
          <div className="flex items-center space-x-4">
            <div className="relative hidden md:block">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M15.102 16.162a8 8 0 1 1 1.06-1.06l4.618 4.618a.75.75 0 1 1-1.06 1.06zM16.5 10a6.5 6.5 0 1 0-13 0a6.5 6.5 0 0 0 13 0"/>
                </svg>
              </span>
              <input
                type="search"
                className="pl-10 pr-4 py-2 w-64 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                placeholder="Rechercher..."
                aria-label="Champ de recherche"
              />
            </div>
  
            <div className="flex items-center space-x-2">
              <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200" aria-label="Paramètres de sécurité">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" className="text-gray-600">
                  <path fill="currentColor" d="M15 8V5s0-5-5-5a4.63 4.63 0 0 0-4.88 4h2C7.31 2.93 8 2 10 2c3 0 3 2 3 3.5V8H3.93A1.93 1.93 0 0 0 2 9.93v8.15A1.93 1.93 0 0 0 3.93 20h12.14A1.93 1.93 0 0 0 18 18.07V9.93A1.93 1.93 0 0 0 16.07 8zm-5 8a2 2 0 1 1 2-2a2 2 0 0 1-2 2"/>
                </svg>
              </button>
              <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200 font-medium">
                Nouvelle action
              </button>
            </div>
          </div>
        </div>
      </header>
    );
  };
  
  export default DashboardHeader;