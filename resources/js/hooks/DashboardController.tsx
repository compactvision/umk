import { useState, useRef, useEffect } from 'react';

export function useDashboardController() {
    const [currentActiveMenu, setCurrentActiveMenu] = useState(null);
    const [isMobile, setIsMobile] = useState(false);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    
    const sidebarRef = useRef(null);
    const overlayRef = useRef(null);

    // Gérer le redimensionnement
    useEffect(() => {
        const handleResize = () => {
            const wasMobile = isMobile;
            const newIsMobile = window.innerWidth <= 768;
            setIsMobile(newIsMobile);

            // Si on passe de mobile à desktop, fermer le menu mobile
            if (wasMobile && !newIsMobile) {
                setIsMobileSidebarOpen(false);
            }

            // Si on passe de desktop à mobile, fermer tous les menus
            if (!wasMobile && newIsMobile) {
                setCurrentActiveMenu(null);
            }
        };

        handleResize(); // Vérifier la taille initiale
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [isMobile]);

    // Gérer les clics extérieurs
    useEffect(() => {
        const handleOutsideClick = (e) => {
            if (!e.target.closest('.sidebar') && !e.target.closest('.sidebar-menu')) {
                closeAllMenus();
                if (isMobile) {
                    setIsMobileSidebarOpen(false);
                }
            }
        };

        document.addEventListener('click', handleOutsideClick);
        return () => document.removeEventListener('click', handleOutsideClick);
    }, [isMobile]);

    // Gérer la navigation clavier
    useEffect(() => {
        const handleKeyboard = (e) => {
            if (e.key === 'Escape') {
                closeAllMenus();
                if (isMobile) {
                    setIsMobileSidebarOpen(false);
                }
                return;
            }

            // Navigation avec les flèches dans la sidebar
            if (e.target.closest('.sidebar__nav')) {
                const buttons = Array.from(document.querySelectorAll('.sidebar__button'));
                const currentIndex = buttons.indexOf(e.target.closest('.sidebar__button'));

                if (currentIndex === -1) return;

                let nextIndex;

                switch (e.key) {
                    case 'ArrowDown':
                        e.preventDefault();
                        nextIndex = (currentIndex + 1) % buttons.length;
                        buttons[nextIndex].focus();
                        break;
                    case 'ArrowUp':
                        e.preventDefault();
                        nextIndex = (currentIndex - 1 + buttons.length) % buttons.length;
                        buttons[nextIndex].focus();
                        break;
                    case 'Enter':
                    case ' ':
                        e.preventDefault();
                        buttons[currentIndex].click();
                        break;
                }
            }

            // Navigation dans les menus
            if (e.target.closest('.sidebar-menu')) {
                const activeMenu = document.querySelector('.sidebar-menu--active');
                if (!activeMenu) return;

                const links = Array.from(activeMenu.querySelectorAll('.sidebar-menu__link'));
                const currentIndex = links.indexOf(e.target);

                if (currentIndex === -1) return;

                let nextIndex;

                switch (e.key) {
                    case 'ArrowDown':
                        e.preventDefault();
                        nextIndex = (currentIndex + 1) % links.length;
                        links[nextIndex].focus();
                        break;
                    case 'ArrowUp':
                        e.preventDefault();
                        nextIndex = (currentIndex - 1 + links.length) % links.length;
                        links[nextIndex].focus();
                        break;
                }
            }
        };

        document.addEventListener('keydown', handleKeyboard);
        return () => document.removeEventListener('keydown', handleKeyboard);
    }, [isMobile]);

    // Gérer les effets de la sidebar mobile
    useEffect(() => {
        const sidebar = sidebarRef.current;
        const overlay = overlayRef.current;

        if (!sidebar || !overlay) return;

        if (isMobileSidebarOpen) {
            sidebar.style.transform = 'translateX(0)';
            sidebar.classList.add('sidebar--mobile-open');
            overlay.style.display = 'block';
            overlay.classList.add('overlay--active');
            document.body.style.overflow = 'hidden';
        } else {
            sidebar.style.transform = 'translateX(-100%)';
            sidebar.classList.remove('sidebar--mobile-open');
            overlay.style.display = 'none';
            overlay.classList.remove('overlay--active');
            document.body.style.overflow = '';
        }
    }, [isMobileSidebarOpen]);

    const closeAllMenus = () => {
        setCurrentActiveMenu(null);
        
        // Mettre à jour les attributs ARIA
        const buttons = document.querySelectorAll('.sidebar__button');
        const menus = document.querySelectorAll('.sidebar-menu');
        
        buttons.forEach(button => {
            button.classList.remove('sidebar__button--active');
            button.setAttribute('aria-expanded', 'false');
        });
        
        menus.forEach(menu => {
            menu.classList.remove('sidebar-menu--active', 'animate-slide-in');
            menu.setAttribute('aria-hidden', 'true');
        });
    };

    const handleSidebarButtonClick = (e) => {
        e.stopPropagation();
        const button = e.currentTarget;
        const menuId = button.dataset.menu;
        const targetMenu = document.getElementById(menuId);

        if (!targetMenu) return;

        // Si le menu est déjà actif, le fermer
        if (currentActiveMenu === menuId) {
            closeAllMenus();
            return;
        }

        // Fermer tous les menus d'abord
        closeAllMenus();

        // Si on est en mobile, ouvrir d'abord la sidebar
        if (isMobile && !isMobileSidebarOpen) {
            setIsMobileSidebarOpen(true);
        }

        // Ouvrir le nouveau menu
        setTimeout(() => {
            button.classList.add('sidebar__button--active');
            button.setAttribute('aria-expanded', 'true');

            targetMenu.classList.add('sidebar-menu--active');
            targetMenu.setAttribute('aria-hidden', 'false');
            targetMenu.classList.add('animate-slide-in');

            const firstLink = targetMenu.querySelector('.sidebar-menu__link');
            if (firstLink) {
                setTimeout(() => firstLink.focus(), 150);
            }
        }, 10);

        setCurrentActiveMenu(menuId);
    };

    const toggleMobileSidebar = (e) => {
        e.stopPropagation();
        setIsMobileSidebarOpen(!isMobileSidebarOpen);
    };

    const handleOverlayClick = () => {
        closeAllMenus();
        setIsMobileSidebarOpen(false);
    };

    return {
        sidebarRef,
        overlayRef,
        handleSidebarButtonClick,
        toggleMobileSidebar,
        handleOverlayClick,
        currentActiveMenu,
        isMobileSidebarOpen
    };
}