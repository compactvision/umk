import '../../../../css/home/app.css';

import Footer from '@/components/common/Footer/Footer';
import Header from '@/components/common/Header/Header';
import React, { useEffect, useState } from 'react';
import { CircleFadingArrowUp } from 'lucide-react';
import Preloader from '@/components/UI/home/Preloader';

export default function App({ children }: { children: React.ReactNode }) {
    const [showScrollTop, setShowScrollTop] = useState(false);

  // Gérer l'affichage du bouton "retour en haut"
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fonction pour remonter en haut de la page
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };
  
    useEffect(() => {
        // Applique les styles pour data-background
        document.querySelectorAll('[data-background]').forEach((element) => {
            const url = element.getAttribute('data-background');
            if (url) {
                (element as HTMLElement).style.backgroundImage = `url(${url})`;
            }
        });

        // Applique les styles pour data-bg-color
        document.querySelectorAll('[data-bg-color]').forEach((element) => {
            const color = element.getAttribute('data-bg-color');
            if (color) {
                (element as HTMLElement).style.backgroundColor = color;
            }
        });
    }, []);
    return (
        <div className={`flex min-h-screen flex-col`}>
            <Header />

            <Preloader />

            {/* Contenu principal avec padding pour éviter le header fixe */}
            <main className="flex-grow transition-colors duration-300">
                <div className="animate-fadeIn">{children}</div>
            </main>

            <Footer />

            {/* Bouton pour remonter en haut de la page */}
            <button
                onClick={scrollToTop}
                className={`fixed right-8 bottom-8 z-50 rounded-full bg-blue-600 p-3 text-white shadow-lg transition-all duration-300 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none ${
                    showScrollTop ? 'visible translate-y-0 opacity-100' : 'invisible translate-y-4 opacity-0'
                }`}
                aria-label="Retour en haut de la page"
            >
                <CircleFadingArrowUp />
            </button>

            <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
      `}</style>
        </div>
    );
}
