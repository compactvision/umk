import React, { useState, useEffect } from "react";

export default function Breadcrumb({
  title,
  desc,
}: {
  title: string;
  desc: string;
}) {
  const bgSrc = "/assets/img/bg/hero.jpg";
  const [scrollY, setScrollY] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    
    // Animation d'entrée
    const timer = setTimeout(() => setIsLoaded(true), 100);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timer);
    };
  }, []);

  return (
    <section className="relative isolate min-h-[10vh] flex items-center justify-center overflow-hidden">
      {/* Arrière-plan avec effet parallaxe */}
      <div className="absolute inset-0 -z-20">
        <div 
          className="h-[120%] w-[120%] -translate-x-[10%] -translate-y-[10%] transition-transform duration-[3000ms] ease-out"
          style={{ 
            transform: `translate(-10%, -10%) scale(1.2) translateY(${scrollY * 0.5}px)` 
          }}
        >
          <img
            src={bgSrc}
            alt=""
            aria-hidden
            className="h-full w-full object-cover filter brightness-110 contrast-105 saturate-105"
          />
        </div>
        
        {/* Overlay gradient sophistiqué */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/20 via-transparent to-slate-800/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-white/20" />
        
        {/* Effet glassmorphism subtil */}
        <div className="absolute inset-0 backdrop-blur-[0.5px] bg-white/[0.02]" />
      </div>

      {/* Particules flottantes animées */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white/10 animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${Math.random() * 4 + 2}px`,
              height: `${Math.random() * 4 + 2}px`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${Math.random() * 4 + 3}s`,
            }}
          />
        ))}
      </div>

      {/* Mesh gradient moderne */}
      <div className="absolute inset-0 -z-10 opacity-30">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-400/20 to-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-emerald-400/20 to-cyan-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-rose-400/10 to-orange-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Contenu principal avec animations fluides */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-20 sm:py-28 lg:py-36">
        <div className="text-center">
          {/* Badge décoratif */}
          <div className={`inline-flex items-center rounded-full bg-white/10 backdrop-blur-md px-4 py-2 mb-8 border border-white/20 transition-all duration-1000 ease-out ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 mr-2 animate-pulse" />
            <span className="text-sm font-medium text-white/90 tracking-wide">
              Breadcrumb Navigation
            </span>
          </div>

          {/* Titre avec effet de révélation */}
          <div className="overflow-hidden mb-4">
            <h1 className={`text-4xl sm:text-5xl lg:text-7xl xl:text-8xl font-black tracking-tight transition-all duration-1200 ease-out ${
              isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
            }`} style={{ transitionDelay: '300ms' }}>
              <span className="block bg-gradient-to-r from-white via-white to-white/80 text-white bg-clip-text text-transparent drop-shadow-2xl">
                {title.split(' ').map((word, i) => (
                  <span 
                    key={i}
                    className="inline-block"
                    style={{ 
                      animationDelay: `${i * 0.1 + 0.3}s`,
                      animation: isLoaded ? 'slideInUp 0.8s ease-out forwards' : 'none'
                    }}
                  >
                    {word}&nbsp;
                  </span>
                ))}
              </span>
            </h1>
          </div>

          {/* Description avec effet de machine à écrire */}
          <div className="overflow-hidden">
            <p className={`mx-auto max-w-3xl text-lg sm:text-xl lg:text-2xl text-white/90 font-light leading-relaxed transition-all duration-1000 ease-out backdrop-blur-sm ${
              isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
            }`} style={{ transitionDelay: '800ms' }}>
              {desc}
            </p>
          </div>

          {/* Bouton CTA avec effet hover sophistiqué */}
          <div className={`mt-12 transition-all duration-1000 ease-out ${
            isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`} style={{ transitionDelay: '1200ms' }}>
            <button className="group relative inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-white transition-all duration-300 ease-out rounded-full bg-gradient-to-r from-blue-600/80 to-purple-600/80 backdrop-blur-md border border-white/20 hover:from-blue-500/90 hover:to-purple-500/90 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/25 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-transparent">
              <span className="relative z-10">Découvrir</span>
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <svg className="ml-2 -mr-1 w-5 h-5 transition-transform group-hover:translate-x-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Indicateur de scroll animé */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/40 rounded-full p-1">
          <div className="w-1 h-3 bg-white/60 rounded-full mx-auto animate-pulse" />
        </div>
      </div>

      {/* Overlay décoratif en bas avec courbe */}
      <div className="absolute inset-x-0 bottom-0 -z-10">
        <svg viewBox="0 0 1440 120" className="w-full h-30 fill-white/20">
          <path d="M0,96L48,85.3C96,75,192,53,288,48C384,43,480,53,576,69.3C672,85,768,107,864,101.3C960,96,1056,64,1152,48C1248,32,1344,32,1392,32L1440,32L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z"></path>
        </svg>
      </div>

      {/* Styles CSS personnalisés via classe inline */}
      <style jsx>{`
        @keyframes slideInUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        /* Amélioration du rendu des polices */
        h1 {
          text-rendering: optimizeLegibility;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
      `}</style>
    </section>
  );
}