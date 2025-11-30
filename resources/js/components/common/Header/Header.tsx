import { Link, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

export default function Header() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const { url } = usePage();
    const { site } = usePage().props;

    const isActive = (path: string) => url === path || url.startsWith(path + '/');

    useEffect(() => {
        const onScroll = () => setIsScrolled(window.scrollY > 40);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    // Ferme avec ESC et bloque le scroll du body quand un overlay est ouvert
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setIsSearchOpen(false);
                setIsMobileMenuOpen(false);
            }
        };
        document.addEventListener('keydown', onKey);
        document.body.style.overflow = isSearchOpen || isMobileMenuOpen ? 'hidden' : '';
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = '';
        };
    }, [isSearchOpen, isMobileMenuOpen]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            console.log('Recherche:', searchQuery);
            setIsSearchOpen(false);
            // Redirige vers une page de résultats si besoin
        }
    };

    const InfoFor = [
        // {
        //     label: 'Étudiants',
        //     link: '#!',
        // },
        {
            label: 'Faculté',
            link: route('courses'),
        },
        {
            label: 'Actualités',
            link: route('blog'),
        },
        // {
        //     label: 'Communauté',
        //     link: '#!',
        // },
    ];

    console.log(site)

    return (
        <>
            {/* TOP BAR */}
            <div className="relative z-50 w-full bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 text-white">
                <div className="mx-auto flex h-12 max-w-7xl items-center justify-between px-4 text-xs sm:px-6 sm:text-sm">
                    <div className="group flex items-center gap-2 sm:gap-3">
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 backdrop-blur transition-all duration-300 group-hover:scale-110 group-hover:bg-amber-400/90 sm:h-6 sm:w-6">
                            <svg width="12" height="12" viewBox="0 0 20 20" className="transition-colors group-hover:text-white sm:h-3 sm:w-3">
                                <path
                                    d="M2 3a1 1 0 011-1h2.2l.7 4.4-1.6.8a11 11 0 006.1 6.1l.8-1.6 4.4.7V17a1 1 0 01-1 1h-2C7.8 18 2 12.2 2 5V3z"
                                    fill="currentColor"
                                />
                            </svg>
                        </div>
                        <span className="hidden font-medium opacity-90 sm:inline">SERVICE D'ASSISTANCE :</span>
                        <span className="font-medium opacity-90 sm:hidden">Support :</span>
                        <strong className="bg-gradient-to-r from-amber-300 to-yellow-300 bg-clip-text font-bold tracking-wide text-transparent">
                            {site?.contactPhone}
                        </strong>
                    </div>

                    <div className="hidden items-center gap-4 md:flex lg:gap-6">
                        <span className="hidden text-xs font-semibold tracking-wider uppercase opacity-85 lg:inline">INFORMATION POUR :</span>
                        <span className="text-xs font-semibold tracking-wider uppercase opacity-85 lg:hidden">INFO :</span>
                        {InfoFor.map((t) => (
                            <a
                                key={t.label}
                                href={t.link}
                                className="group relative px-2 py-1 text-xs font-medium transition-all duration-300 hover:scale-105 hover:text-amber-300 lg:px-3 lg:py-2 lg:text-sm"
                            >
                                <span className="relative z-10">{t.label}</span>
                                <div className="absolute inset-0 rounded-lg bg-white/10 opacity-0 transition-all duration-300 group-hover:scale-110 group-hover:opacity-100" />
                            </a>
                        ))}
                    </div>
                </div>
            </div>

            {/* NAV PRINCIPALE */}
            <header
                className={`sticky top-0 z-40 transition-all duration-500 ease-out ${
                    isScrolled
                        ? 'border-b border-blue-100/20 bg-white/95 shadow-lg shadow-blue-100/50 backdrop-blur-xl'
                        : 'border-b border-white/10 bg-white/10 backdrop-blur-sm'
                }`}
            >
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:h-18 sm:px-6 lg:h-20">
                    {/* Logo */}
                    <Link href={route('home')} className="group flex items-center gap-2 sm:gap-4">
                        <div className="relative">
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 opacity-20 blur transition-all duration-300 group-hover:opacity-40 group-hover:blur-md" />
                            <img
                                src="/assets/img/logo/logo.png"
                                alt="UMK"
                                className="relative h-10 w-auto transition-transform duration-300 group-hover:scale-110 sm:h-12"
                            />
                        </div>
                        <div className="flex flex-col">
                            <span
                                className={`hidden text-base font-bold transition-all duration-300 group-hover:scale-105 sm:block sm:text-lg ${
                                    isScrolled ? 'text-slate-800' : 'text-slate-800 drop-shadow-lg'
                                }`}
                            >
                                Université Moderne <br /> de Kinkole
                            </span>
                            <span
                                className={`hidden text-xs font-medium opacity-75 sm:block ${
                                    isScrolled ? 'text-blue-600' : 'text-blue-600 drop-shadow'
                                }`}
                            >
                                Excellence & Innovation
                            </span>
                        </div>
                    </Link>

                    {/* Navigation Desktop */}
                    <nav className="hidden items-center gap-1 lg:flex lg:gap-2">
                        {[
                            { label: 'Accueil', path: '/', href: route('home'), icon: '🏠' },
                            { label: 'Admission', path: '/admission', href: route('admission'), icon: '📚' },
                            { label: 'Faculté', path: '/courses', href: route('courses'), icon: '🎓' },
                            { label: 'A Propos', path: '/about', href: route('about'), icon: '❓' },
                            { label: 'Contact', path: '/contact', href: route('contact'), icon: '💬' },
                        ].map((item) => (
                            <Link
                                key={item.path}
                                href={item.href}
                                className={`group relative overflow-hidden rounded-2xl px-4 py-2 text-sm font-semibold transition-all duration-300 lg:px-6 lg:py-3 ${
                                    isScrolled ? 'text-slate-700 hover:text-slate-900' : 'text-slate-700 drop-shadow-sm hover:text-white'
                                } ${isActive(item.path) ? 'scale-105' : ''}`}
                            >
                                <div
                                    className={`absolute inset-0 rounded-2xl transition-all duration-300 ease-out group-hover:scale-110 ${
                                        isActive(item.path)
                                            ? isScrolled
                                                ? 'border border-blue-200/30 bg-gradient-to-br from-blue-50 to-indigo-50'
                                                : 'border border-white/30 bg-white/20 backdrop-blur'
                                            : 'bg-transparent group-hover:bg-gradient-to-br group-hover:from-amber-400/20 group-hover:to-yellow-400/20'
                                    }`}
                                />
                                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full" />
                                <span className="relative z-10 flex items-center gap-2">
                                    <span className="text-sm opacity-70 transition-all duration-300 group-hover:scale-125 group-hover:opacity-100 lg:text-base">
                                        {item.icon}
                                    </span>
                                    {item.label}
                                </span>
                            </Link>
                        ))}
                    </nav>

                    {/* Actions */}
                    <div className="flex items-center gap-2 sm:gap-3">
                        {/* Bouton Search */}
                        <button
                            onClick={() => setIsSearchOpen(true)}
                            className={`group flex items-center gap-2 overflow-hidden rounded-2xl border px-4 py-2 text-xs font-medium backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-amber-400/20 sm:gap-3 sm:px-6 sm:py-3 sm:text-sm ${
                                isScrolled
                                    ? 'border-blue-200/40 bg-white/60 text-slate-600 hover:bg-white/80 hover:text-slate-800'
                                    : 'border-white/30 bg-white/10 text-slate-600 drop-shadow-sm hover:bg-white/20 hover:text-white'
                            }`}
                        >
                            <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                className="transition-all duration-300 group-hover:scale-110 group-hover:rotate-12 sm:h-4 sm:w-4"
                            >
                                <path d="M21 21l-5.8-5.8M10 18a8 8 0 100-16 8 8 0 000 16z" stroke="currentColor" strokeWidth="2" fill="none" />
                            </svg>
                            <span className="hidden sm:inline">Rechercher</span>
                            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-amber-400/0 via-amber-400/20 to-amber-400/0 transition-transform duration-700 group-hover:translate-x-full" />
                        </button>

                        {/* Bouton Menu mobile */}
                        <button
                            onClick={() => setIsMobileMenuOpen(true)}
                            className={`group relative overflow-hidden rounded-2xl border p-2 transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-amber-400/20 sm:p-3 lg:hidden ${
                                isScrolled
                                    ? 'border-blue-200/40 bg-white/60 text-slate-600 hover:text-slate-800'
                                    : 'border-white/30 bg-white/10 text-slate-600 drop-shadow-sm hover:text-white'
                            }`}
                            aria-label="Menu"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" className="transition-all duration-300 group-hover:rotate-12">
                                <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                            </svg>
                            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-400/0 to-amber-400/30 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                        </button>

                        {/* CTA Desktop */}
                        <Link
                            href={route('dashboard.enrollments.index')}
                            className="group relative hidden items-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 px-4 py-2 text-xs font-bold text-white transition-all duration-300 hover:scale-105 hover:from-amber-500 hover:to-yellow-600 hover:shadow-xl hover:shadow-amber-400/40 md:flex lg:px-6 lg:py-3 lg:text-sm"
                        >
                            <span className="relative z-10">S'inscrire</span>
                            <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                className="relative z-10 transition-transform duration-300 group-hover:translate-x-1 lg:h-4 lg:w-4"
                            >
                                <path d="M13 7l5 5-5 5M6 12h12" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                            </svg>
                            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-white/0 via-white/20 to-white/0 transition-transform duration-500 group-hover:translate-x-full" />
                        </Link>
                    </div>
                </div>
            </header>

            {/* ===== SEARCH MODAL CENTRÉ AVEC OVERLAY ===== */}
            <div
                className={`fixed inset-0 z-[60] transition-all duration-300 ${isSearchOpen ? 'visible opacity-100' : 'invisible opacity-0'}`}
                aria-hidden={!isSearchOpen}
            >
                {/* Overlay */}
                <div
                    className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
                        isSearchOpen ? 'opacity-100' : 'opacity-0'
                    }`}
                    onClick={() => setIsSearchOpen(false)}
                />

                {/* Contenu modal */}
                <div className="relative z-[61] flex min-h-screen items-start justify-center p-4 sm:p-6 md:items-center">
                    <div
                        className={`w-full max-w-2xl transform rounded-2xl bg-white text-slate-900 shadow-2xl ring-1 ring-black/5 transition-all duration-300 ${
                            isSearchOpen ? 'translate-y-0 scale-100 opacity-100' : '-translate-y-6 scale-95 opacity-0'
                        }`}
                        role="dialog"
                        aria-modal="true"
                    >
                        {/* Header modal */}
                        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                            <h3 className="text-base font-semibold sm:text-lg">Rechercher</h3>
                            <button
                                onClick={() => setIsSearchOpen(false)}
                                className="rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
                                aria-label="Fermer"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24">
                                    <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSearch} className="px-5 py-5">
                            <div className="relative">
                                <svg
                                    className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-slate-400"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                >
                                    <path d="M21 21l-5.8-5.8M10 18a8 8 0 100-16 8 8 0 000 16z" strokeWidth="2" />
                                </svg>
                                <input
                                    type="search"
                                    autoFocus
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Rechercher des programmes, cours, infos..."
                                    className="w-full rounded-xl border border-slate-200 bg-white px-10 py-3 text-base text-slate-900 placeholder-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/30 focus:outline-none"
                                />
                                <button
                                    type="submit"
                                    className="absolute top-1/2 right-2 -translate-y-1/2 rounded-lg bg-gradient-to-r from-amber-400 to-yellow-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:from-amber-500 hover:to-yellow-600"
                                >
                                    R
                                </button>
                            </div>

                            <div className="mt-4 text-sm text-slate-600">
                                Suggestions :{' '}
                                <button type="button" onClick={() => setSearchQuery('Informatique')} className="underline hover:text-slate-900">
                                    Informatique
                                </button>
                                ,{' '}
                                <button type="button" onClick={() => setSearchQuery('Médecine')} className="underline hover:text-slate-900">
                                    Médecine
                                </button>
                                ,{' '}
                                <button type="button" onClick={() => setSearchQuery('Économie')} className="underline hover:text-slate-900">
                                    Économie
                                </button>
                                ,{' '}
                                <button type="button" onClick={() => setSearchQuery('Droit')} className="underline hover:text-slate-900">
                                    Droit
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            {/* ===== MENU MOBILE AVEC OVERLAY + TRANSITION FLUIDE ===== */}
            <div className={`fixed inset-0 z-[55] lg:hidden ${isMobileMenuOpen ? 'visible' : 'invisible'}`}>
                {/* Backdrop */}
                <div
                    className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
                        isMobileMenuOpen ? 'opacity-100' : 'opacity-0'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                />
                {/* Panel */}
                <div
                    className={`absolute top-0 right-0 h-full w-80 bg-white shadow-2xl transition-transform duration-300 ${
                        isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
                    }`}
                >
                    {/* Header panel */}
                    <div className="flex items-center justify-between border-b border-slate-200 p-6">
                        <div className="flex items-center gap-3">
                            <img src="/assets/img/logo/logo.png" alt="Logo" className="h-8 w-auto" />
                            <div>
                                <div className="text-sm font-bold text-slate-900">UMK</div>
                                <div className="text-xs text-slate-600">Menu</div>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                            aria-label="Fermer le menu"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24">
                                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" />
                            </svg>
                        </button>
                    </div>

                    {/* Liens */}
                    <div className="space-y-4 p-6">
                        {[
                            { label: 'Accueil', path: '/', href: route('home'), icon: '🏠' },
                            { label: 'Admission', path: '/admission', href: route('admission'), icon: '📚' },
                            { label: 'Cours', path: '/courses', href: route('courses'), icon: '🎓' },
                            { label: 'A propos', path: '/about', href: route('about'), icon: '❓' },
                            { label: 'Contact', path: '/contact', href: route('contact'), icon: '💬' },
                        ].map((item, index) => (
                            <Link
                                key={item.path}
                                href={item.href}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={`group flex items-center gap-4 rounded-2xl p-4 font-semibold transition-all duration-300 ${
                                    isActive(item.path)
                                        ? 'border border-blue-200/30 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700'
                                        : 'text-slate-700 hover:bg-gradient-to-r hover:from-amber-50 hover:to-yellow-50 hover:text-amber-700'
                                }`}
                                style={{ animationDelay: `${index * 80}ms` }}
                            >
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/80 text-lg transition-transform duration-300 group-hover:scale-110">
                                    {item.icon}
                                </div>
                                <span>{item.label}</span>
                                <svg
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    className="ml-auto transition-transform duration-300 group-hover:translate-x-1"
                                >
                                    <path d="M13 7l5 5-5 5M6 12h12" stroke="currentColor" strokeWidth="2" fill="none" />
                                </svg>
                            </Link>
                        ))}

                        {/* CTA Mobile */}
                        <Link
                            href={route('dashboard.enrollments.index')}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 px-6 py-4 text-center font-bold text-white shadow-lg shadow-amber-400/25 transition-all duration-300 hover:scale-105 hover:from-amber-500 hover:to-yellow-600"
                        >
                            <span>S'inscrire maintenant</span>
                            <svg width="20" height="20" viewBox="0 0 24 24">
                                <path d="M13 7l5 5-5 5M6 12h12" stroke="currentColor" strokeWidth="2.5" fill="none" />
                            </svg>
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
}
