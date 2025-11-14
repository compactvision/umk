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
    const handleScroll = () => setScrollY(window.scrollY * 0.3);
    window.addEventListener('scroll', handleScroll);
    
    const timer = setTimeout(() => setIsLoaded(true), 100);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timer);
    };
  }, []);

  return (
    <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
      {/* Arrière-plan avec parallaxe subtil */}
      <div className="absolute inset-0 -z-10">
        <div 
          className="h-full w-full scale-110 transition-transform duration-1000 ease-out"
          style={{ 
            transform: `translateY(${scrollY}px)` 
          }}
        >
          <img
            src={bgSrc}
            alt=""
            aria-hidden
            className="h-full w-full object-cover"
          />
        </div>
        
        {/* Overlay élégant pour la lisibilité */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/50" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/30 to-transparent" />
      </div>

      {/* Contenu principal */}
      <div className="relative z-10 mx-auto max-w-4xl px-4 text-center">
        {/* Badge minimaliste */}
        <div className={`inline-flex items-center rounded-full bg-white/10 backdrop-blur-md px-4 py-2 mb-8 border border-white/20 transition-all duration-1000 ease-out ${
          isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
        }`}>
          <div className="w-2 h-2 rounded-full bg-white mr-2 animate-pulse" />
          <span className="text-sm font-medium text-white/90 tracking-wide">
            Navigation
          </span>
        </div>

        {/* Titre avec effet d'apparition élégant */}
        <h1 className={`text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 transition-all duration-1000 ease-out ${
          isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`} style={{ transitionDelay: '200ms' }}>
          <span className="relative inline-block">
            {title}
            <span className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/50 to-transparent scale-x-0 transition-transform duration-1000 ease-out" 
              style={{ 
                transform: isLoaded ? 'scaleX(1)' : 'scaleX(0)',
                transitionDelay: '800ms'
              }} 
            />
          </span>
        </h1>

        {/* Description avec effet de fade-in */}
        <p className={`text-lg md:text-xl text-white/90 max-w-2xl mx-auto leading-relaxed transition-all duration-1000 ease-out ${
          isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`} style={{ transitionDelay: '400ms' }}>
          {desc}
        </p>

       
      </div>

      {/* Indicateur de scroll subtil */}
      <div className={`absolute bottom-8 left-1/2 -translate-x-1/2 transition-all duration-1000 ease-out ${
        isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`} style={{ transitionDelay: '1000ms' }}>
        <div className="w-6 h-10 border border-white/30 rounded-full flex justify-center pt-2">
          <div className="w-1 h-3 bg-white/60 rounded-full animate-bounce" />
        </div>
      </div>

      {/* Effet de lumière subtil */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
    </section>
  );
}