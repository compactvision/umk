import { Link } from '@inertiajs/react';
import { useState, useEffect } from 'react';

export default function Hero() {
    const [scrollY, setScrollY] = useState(0);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrollY(window.scrollY);
        const handleMouseMove = (e) => {
            setMousePosition({ x: e.clientX, y: e.clientY });
        };
        
        window.addEventListener('scroll', handleScroll);
        window.addEventListener('mousemove', handleMouseMove);
        
        // Déclencher l'animation après le chargement
        setTimeout(() => setIsLoaded(true), 100);
        
        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, []);

    return (
        <section className="relative overflow-hidden min-h-screen flex flex-col">
            {/* Background avec effets parallax améliorés */}
            <div className="absolute inset-0 -z-10">
                <img 
                    src="/assets/img/bg/hero.jpg" 
                    alt="" 
                    className="h-full w-full object-cover"
                    style={{
                        transform: `scale(${1.05 - scrollY * 0.0005}) translateY(${scrollY * 0.3}px)`,
                    }}
                    fetchPriority="high" 
                />
                
                {/* Overlay gradient sophistiqué avec effet de profondeur */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/85 via-indigo-700/80 to-purple-800/75" />
                <div className="absolute inset-0 bg-gradient-to-t from-blue-900/95 via-blue-800/40 to-transparent" />
                
                {/* Effets de lumière animés avec suivi de souris */}
                <div 
                    className="absolute w-96 h-96 bg-amber-400/20 rounded-full blur-3xl transition-all duration-1000 ease-out"
                    style={{
                        left: `${mousePosition.x * 0.05}px`,
                        top: `${mousePosition.y * 0.05}px`,
                        transform: 'translate(-50%, -50%)',
                    }}
                />
                <div 
                    className="absolute w-96 h-96 bg-purple-400/15 rounded-full blur-3xl transition-all duration-1000 ease-out"
                    style={{
                        right: `${-mousePosition.x * 0.03}px`,
                        bottom: `${-mousePosition.y * 0.03}px`,
                        transform: 'translate(50%, 50%)',
                    }}
                />
                
                {/* Effet de grille 3D */}
                <div className="absolute inset-0 opacity-20">
                    <div className="h-full w-full bg-grid-pattern"></div>
                </div>
            </div>

            {/* Particules flottantes améliorées */}
            <div className="absolute inset-0 -z-5">
                {[...Array(20)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute w-1.5 h-1.5 sm:w-2 sm:h-2 bg-amber-300/30 rounded-full animate-float"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 5}s`,
                            animationDuration: `${3 + Math.random() * 4}s`,
                            width: `${Math.random() * 3 + 1}px`,
                            height: `${Math.random() * 3 + 1}px`,
                        }}
                    />
                ))}
            </div>

            {/* Formes géométriques flottantes */}
            <div className="absolute inset-0 overflow-hidden -z-5">
                <div className="absolute top-20 left-10 w-32 h-32 border border-amber-300/20 rotate-45 animate-spin-slow"></div>
                <div className="absolute bottom-20 right-10 w-24 h-24 border border-blue-300/20 rounded-full animate-pulse-slow"></div>
                <div className="absolute top-1/2 left-1/4 w-16 h-16 border border-purple-300/20 rotate-12 animate-float-delayed"></div>
            </div>

            {/* CONTENU HERO */}
            <div className="flex-1 flex flex-col">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 flex-1 flex flex-col">
                    {/* Espacement intelligent pour le header */}
                    <div className="pt-8 sm:pt-12 lg:pt-16" />

                    <div className="flex-1 flex flex-col items-center justify-center text-center text-white max-w-6xl mx-auto">
                        {/* Badge d'introduction avec animation améliorée */}
                        <div className={`mb-4 sm:mb-6 group transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'}`}>
                            <div className="inline-flex items-center gap-2 sm:gap-3 rounded-full border border-amber-300/30 bg-amber-400/10 backdrop-blur-sm px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-medium transition-all duration-300 hover:bg-amber-400/20 hover:border-amber-300/50 hover:scale-105 hover:shadow-lg hover:shadow-amber-400/20">
                                <div className="flex h-2 w-2 items-center justify-center">
                                    <div className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
                                    <div className="absolute h-1 w-1 rounded-full bg-amber-300" />
                                </div>
                                <span className="bg-gradient-to-r from-amber-200 to-yellow-200 bg-clip-text text-transparent font-semibold">
                                    Bienvenue à l'Université d'Excellence
                                </span>
                                <svg width="14" height="14" viewBox="0 0 24 24" className="text-amber-300 transition-transform duration-300 group-hover:rotate-12 sm:w-4 sm:h-4">
                                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="currentColor"/>
                                </svg>
                            </div>
                        </div>

                        {/* Titre principal avec animation responsive améliorée */}
                        <h1 className={`mx-auto max-w-5xl text-3xl leading-tight font-bold sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl transition-all duration-1000 delay-300 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                            <span className="block bg-gradient-to-r from-white via-blue-50 to-amber-100 bg-clip-text text-transparent animate-gradient hover:animate-gradient-slow">
                                Université Moderne
                            </span>
                            <span className="block mt-1 sm:mt-2 bg-gradient-to-r from-amber-300 via-yellow-300 to-amber-200 bg-clip-text text-transparent animate-gradient delay-300">
                                De Kinkole
                            </span>
                            <span className="block mt-2 sm:mt-4 text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-semibold text-white/95">
                                Votre Chemin Vers Le
                                <span className="relative ml-2 sm:ml-3 group">
                                    Succès
                                    <svg className="absolute -bottom-1 sm:-bottom-2 left-0 w-full h-2 sm:h-3 text-amber-400/60 transition-all duration-300 group-hover:text-amber-400/80" viewBox="0 0 200 12" preserveAspectRatio="none">
                                        <path d="M0 8 Q50 2 100 8 T200 8" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/>
                                    </svg>
                                </span>
                            </span>
                        </h1>

                        {/* Sous-titre élégant responsive avec animation améliorée */}
                        <p className={`mt-4 sm:mt-6 lg:mt-8 max-w-2xl lg:max-w-3xl text-base sm:text-lg md:text-xl text-blue-100/90 font-medium leading-relaxed transition-all duration-1000 delay-500 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                            Forgez votre avenir avec une éducation de classe mondiale, 
                            <span className="text-amber-200 font-semibold hover:text-amber-100 transition-colors duration-300"> des programmes innovants </span>
                            et un accompagnement personnalisé vers l'excellence académique.
                        </p>

                        {/* Image étudiants avec effets responsive améliorés */}
                        <div className={`mt-6 sm:mt-8 lg:mt-12 w-full max-w-3xl lg:max-w-5xl group transition-all duration-1000 delay-700 ${isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
                            <div className="relative">
                                <div className="absolute inset-0 bg-gradient-to-t from-white/10 to-transparent rounded-2xl sm:rounded-3xl group-hover:from-white/20 transition-all duration-500" />
                                <img
                                    src="/assets/img/hero/hero3.png"
                                    alt="Diplômés UMK - Excellence Académique"
                                    className="mx-auto h-auto w-full max-w-2xl lg:max-w-4xl object-contain transition-all duration-700 group-hover:scale-105 drop-shadow-2xl"
                                    loading="eager"
                                />
                                {/* Effets de brillance améliorés */}
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
                                
                                {/* Points d'intérêt interactifs */}
                                <div className="absolute top-1/4 left-1/4 w-4 h-4 bg-amber-400 rounded-full animate-pulse cursor-pointer group-hover:scale-125 transition-transform duration-300">
                                    <div className="absolute inset-0 bg-amber-400 rounded-full animate-ping" />
                                </div>
                                <div className="absolute top-1/2 right-1/3 w-4 h-4 bg-blue-400 rounded-full animate-pulse cursor-pointer group-hover:scale-125 transition-transform duration-300">
                                    <div className="absolute inset-0 bg-blue-400 rounded-full animate-ping" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* CTA Bar Ultra Premium Responsive améliorée */}
                    <div className={`pb-8 sm:pb-12 lg:pb-16 mt-4 transition-all duration-1000 delay-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                        <div className="mx-auto max-w-4xl lg:max-w-6xl">
                            {/* Conteneur principal avec glassmorphism amélioré */}
                            <div className="relative rounded-2xl sm:rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 p-1.5 sm:p-2 shadow-2xl shadow-blue-900/25 hover:shadow-3xl hover:shadow-blue-800/30 transition-all duration-500 group">
                                {/* Effet de halo amélioré */}
                                <div className="absolute inset-0 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-amber-400/20 via-transparent to-yellow-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                
                                <div className="grid gap-1.5 sm:gap-2 grid-cols-1 sm:grid-cols-3">
                                    {/* Explorer les programmes */}
                                    <Link
                                        href={route('courses')}
                                        className="group/btn relative overflow-hidden rounded-xl sm:rounded-2xl bg-white/5 backdrop-blur border border-white/10 px-4 sm:px-6 lg:px-8 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-white transition-all duration-300 hover:bg-white/10 hover:border-white/20 hover:scale-105 hover:-translate-y-1 hover:shadow-xl hover:shadow-amber-400/25"
                                    >
                                        <div className="flex items-center justify-center gap-2 sm:gap-3">
                                            <svg width="16" height="16" viewBox="0 0 24 24" className="transition-all duration-300 group-hover/btn:rotate-12 group-hover/btn:scale-110 sm:w-5 sm:h-5">
                                                <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" stroke="currentColor" strokeWidth="2" fill="none"/>
                                            </svg>
                                            <span className="relative z-10">
                                                <span className="hidden sm:inline">Explorer les programmes</span>
                                                <span className="sm:hidden">Programmes</span>
                                            </span>
                                            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-amber-400 rounded-full animate-pulse" />
                                        </div>
                                        <div className="absolute inset-0 bg-gradient-to-r from-amber-400/0 via-amber-400/20 to-amber-400/0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700" />
                                    </Link>

                                    {/* Postuler - CTA Principal */}
                                    <Link
                                        href={route('dashboard.enrollments.index')}
                                        className="group/btn relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 px-4 sm:px-6 lg:px-8 py-3 sm:py-4 text-xs sm:text-sm font-bold text-white shadow-lg shadow-amber-400/25 transition-all duration-300 hover:from-amber-500 hover:to-yellow-600 hover:scale-110 hover:-translate-y-2 hover:shadow-2xl hover:shadow-amber-400/40"
                                    >
                                        <div className="flex items-center justify-center gap-2 sm:gap-3">
                                            <span className="relative z-10">
                                                <span className="hidden sm:inline">Postulez maintenant</span>
                                                <span className="sm:hidden">Postuler</span>
                                            </span>
                                            <svg width="16" height="16" viewBox="0 0 24 24" className="transition-all duration-300 group-hover/btn:translate-x-1 group-hover/btn:scale-110 sm:w-5 sm:h-5">
                                                <path d="M13 7l5 5-5 5M6 12h12" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
                                            </svg>
                                            <div className="absolute right-1 sm:right-2 top-1 sm:top-2 w-2 h-2 sm:w-3 sm:h-3 bg-white/30 rounded-full animate-ping" />
                                        </div>
                                        {/* Effet de brillance animé amélioré */}
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-500" />
                                        {/* Pulsation de bordure améliorée */}
                                        <div className="absolute inset-0 rounded-xl sm:rounded-2xl border border-white/50 scale-100 group-hover/btn:scale-110 group-hover/btn:border-white/70 transition-all duration-300" />
                                    </Link>

                                    {/* Parler avec un conseiller */}
                                    <Link
                                        href={route('contact')}
                                        className="group/btn relative overflow-hidden rounded-xl sm:rounded-2xl bg-white/5 backdrop-blur border border-white/10 px-4 sm:px-6 lg:px-8 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-white transition-all duration-300 hover:bg-white/10 hover:border-white/20 hover:scale-105 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-400/25"
                                    >
                                        <div className="flex items-center justify-center gap-2 sm:gap-3">
                                            <svg width="16" height="16" viewBox="0 0 24 24" className="transition-all duration-300 group-hover/btn:scale-110 sm:w-5 sm:h-5">
                                                <path
                                                    d="M12 20c4.4 0 8-2.9 8-6.5S16.4 7 12 7 4 9.9 4 13.5c0 1.7.9 3.3 2.4 4.4L6 21l3.3-1.1c.8.1 1.4.1 2.7.1Z"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                    fill="none"
                                                />
                                                <circle cx="9" cy="13" r="0.5" fill="currentColor" />
                                                <circle cx="12" cy="13" r="0.5" fill="currentColor" />
                                                <circle cx="15" cy="13" r="0.5" fill="currentColor" />
                                            </svg>
                                            <span className="relative z-10">
                                                <span className="hidden sm:inline">Parler avec un conseiller</span>
                                                <span className="sm:hidden">Conseiller</span>
                                            </span>
                                            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-400 rounded-full animate-pulse" />
                                        </div>
                                        <div className="absolute inset-0 bg-gradient-to-r from-blue-400/0 via-blue-400/20 to-blue-400/0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Indicateur de défilement */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white/60 animate-bounce">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 5v14M19 12l-7 7-7-7"/>
                </svg>
            </div>

            {/* CSS Animations et Responsive améliorées */}
            <style jsx>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.4; }
                    50% { transform: translateY(-15px) rotate(180deg); opacity: 1; }
                }
                @keyframes gradient {
                    0%, 100% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                }
                @keyframes gradient-slow {
                    0%, 100% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                }
                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                @keyframes pulse-slow {
                    0%, 100% { opacity: 0.2; transform: scale(1); }
                    50% { opacity: 0.4; transform: scale(1.05); }
                }
                @keyframes float-delayed {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(-20px) rotate(10deg); }
                }
                
                .animate-float {
                    animation: float ease-in-out infinite;
                }
                .animate-gradient {
                    background-size: 200% 200%;
                    animation: gradient 3s ease infinite;
                }
                .animate-gradient-slow {
                    background-size: 200% 200%;
                    animation: gradient-slow 8s ease infinite;
                }
                .animate-spin-slow {
                    animation: spin-slow 20s linear infinite;
                }
                .animate-pulse-slow {
                    animation: pulse-slow 4s ease-in-out infinite;
                }
                .animate-float-delayed {
                    animation: float-delayed 6s ease-in-out infinite;
                }
                
                /* Pattern de grille */
                .bg-grid-pattern {
                    background-image: 
                        linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
                    background-size: 50px 50px;
                }
                
                /* Responsive particules */
                @media (max-width: 640px) {
                    @keyframes float {
                        0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.3; }
                        50% { transform: translateY(-10px) rotate(90deg); opacity: 0.8; }
                    }
                }
                
                /* Effets hover mobile */
                @media (hover: none) and (pointer: coarse) {
                    .group:hover .group-hover\\:scale-105 {
                        transform: scale(1.02);
                    }
                    
                    .group:hover .group-hover\\:translate-x-1 {
                        transform: translateX(2px);
                    }
                    
                    .group:active .group-hover\\:scale-110 {
                        transform: scale(1.05);
                    }
                }
                
                /* Optimisation performances mobiles */
                @media (prefers-reduced-motion: reduce) {
                    * {
                        animation-duration: 0.01ms !important;
                        animation-iteration-count: 1 !important;
                        transition-duration: 0.01ms !important;
                    }
                    
                    .animate-pulse,
                    .animate-float,
                    .animate-gradient,
                    .animate-gradient-slow,
                    .animate-spin-slow,
                    .animate-pulse-slow,
                    .animate-float-delayed {
                        animation: none !important;
                    }
                }
            `}</style>
        </section>
    );
}