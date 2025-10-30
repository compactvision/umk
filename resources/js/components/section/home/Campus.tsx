import React, { useEffect, useRef, useState } from "react";
import { Link } from "@inertiajs/react";

type CampusItem = {
  img: string;
  title: string;
  link: string;
  description?: string;
  icon?: string;
  stats?: { label: string; value: string }[];
};

const ITEMS: CampusItem[] = [
  { 
    img: "https://commons.wikimedia.org/wiki/Special:FilePath/Acad%C3%A9mie%20Beaux%20Arts%20Kinshasa.JPG?width=1600",
    title: "Expériences culturelles",
    link: "#",
    description: "Ateliers et expositions à l’Académie des Beaux-Arts de Kinshasa : sculpture, peinture, design…",
    icon: "theater",
    stats: [
      { label: "Événements/an", value: "50+" },
      { label: "Associations", value: "25" }
    ]
  },
  { 
    img: "https://commons.wikimedia.org/wiki/Special:FilePath/EITI%20students%20meeting%20Universit%C3%A9%20protestante%20au%20Congo%20(16987503918).jpg?width=1600",
    title: "Vie étudiante",
    link: "#",
    description: "Rencontres, clubs et débats à l’UPC et sur les campus de Kinshasa : une communauté active et solidaire.",
    icon: "users",
    stats: [
      { label: "Étudiants", value: "15K+" },
      { label: "Nationalités", value: "62" }
    ]
  },
  { 
    img: "https://commons.wikimedia.org/wiki/Special:FilePath/Stade%20des%20martyrs%200332%20Kinshasa%20(8756673901).jpg?width=1600",
    title: "Activités sportives",
    link: "#",
    description: "Compétitions et grands rendez-vous sportifs au Stade des Martyrs et sur nos terrains universitaires.",
    icon: "trophy",
    stats: [
      { label: "Équipes", value: "18" },
      { label: "Installations", value: "12" }
    ]
  },
  { 
    img: "https://commons.wikimedia.org/wiki/Special:FilePath/Parc%20de%20L%27Universit%C3%A9%20de%20Kinshasa%202.jpg?width=1600",
    title: "Résidences & Vie de campus",
    link: "#",
    description: "Espaces verts et zones de détente à l’UNIKIN : proximité des facultés et cadre paisible.",
    icon: "home",
    stats: [
      { label: "Chambres", value: "3000+" },
      { label: "Résidences", value: "8" }
    ]
  },
  { 
    img: "https://commons.wikimedia.org/wiki/Special:FilePath/Ista%20kinshasa%20batiment%20vodacom.jpg?width=1600",
    title: "Laboratoires modernes",
    link: "#",
    description: "Bâtiments techniques (ISTA) et équipements pour l’expérimentation, le prototypage et la recherche.",
    icon: "flask",
    stats: [
      { label: "Labos", value: "45" },
      { label: "Projets/an", value: "200+" }
    ]
  },
  { 
    img: "https://commons.wikimedia.org/wiki/Special:FilePath/Halle%20de%20la%20Rawbank%20%C3%A0%20l%27Universit%C3%A8%20de%20Kinshasa.jpg?width=1600",
    title: "Bibliothèques",
    link: "#",
    description: "Halles et espaces de lecture (UNIKIN) : ressources documentaires et zones d’étude connectées.",
    icon: "book",
    stats: [
      { label: "Volumes", value: "500K+" },
      { label: "Espaces", value: "10" }
    ]
  },
];


const ICONS: Record<string, JSX.Element> = {
  theater: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 16h4m10 0h4"></path>
    </svg>
  ),
  users: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
    </svg>
  ),
  trophy: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"></path>
    </svg>
  ),
  home: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
    </svg>
  ),
  flask: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path>
    </svg>
  ),
  book: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
    </svg>
  ),
};

export default function Campus(): JSX.Element {
  const trackRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement[]>([]);
  const hoverRef = useRef(false);
  const [active, setActive] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  // Initialisation animation
  useEffect(() => {
    setTimeout(() => setIsLoaded(true), 100);
  }, []);

  // Utility: scroll vers une slide
  const scrollToIndex = (idx: number) => {
    const el = cardsRef.current[idx];
    const track = trackRef.current;
    if (!el || !track) return;
    track.scrollTo({ left: el.offsetLeft - track.clientLeft, behavior: "smooth" });
    setActive(idx);
  };

  // Sync l'index actif sur le scroll (drag, molette, responsive)
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let t: number | null = null;

    const onScroll = () => {
      if (t) cancelAnimationFrame(t);
      t = requestAnimationFrame(() => {
        const children = cardsRef.current;
        if (!children.length) return;
        const center = track.scrollLeft + track.clientWidth / 2;
        // Trouve la carte la plus proche du centre
        let nearest = 0;
        let best = Infinity;
        children.forEach((c, i) => {
          const mid = c.offsetLeft + c.offsetWidth / 2;
          const dist = Math.abs(mid - center);
          if (dist < best) {
            best = dist;
            nearest = i;
          }
        });
        setActive(nearest);
      });
    };

    track.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      track.removeEventListener("scroll", onScroll);
      if (t) cancelAnimationFrame(t);
    };
  }, []);

  // Autoplay (pause on hover/focus, respects reduced motion)
  useEffect(() => {
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced) return;

    const id = window.setInterval(() => {
      if (hoverRef.current) return;
      const next = (active + 1) % ITEMS.length;
      scrollToIndex(next);
    }, 5000);

    return () => window.clearInterval(id);
  }, [active]);

  return (
    <section
      className="relative bg-gradient-to-br from-amber-50 via-white to-yellow-50 py-20 md:py-32 overflow-hidden"
      aria-label="Vie sur le campus"
    >
      {/* Éléments décoratifs de fond */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-amber-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-orange-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Titre */}
        <header className={`text-center mb-16 transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <span className="inline-block rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 px-4 py-2 text-sm font-semibold text-white shadow-lg">
            Vie sur le campus
          </span>
          <h2 className="mt-6 text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-600 bg-clip-text text-transparent">
            Découvrez notre environnement
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-600">
            Plongez dans la vie dynamique de notre campus où l'apprentissage, la culture et le divertissement se rencontrent.
          </p>
          <div className="mt-4 mx-auto h-1 w-24 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full"></div>
        </header>

        {/* Carousel */}
        <div
          className={`relative transition-all duration-1000 delay-300 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
          onMouseEnter={() => (hoverRef.current = true)}
          onMouseLeave={() => (hoverRef.current = false)}
          onFocus={() => (hoverRef.current = true)}
          onBlur={() => (hoverRef.current = false)}
        >
          {/* Track */}
          <div
            ref={trackRef}
            className="flex snap-x snap-mandatory scroll-px-6 gap-8 overflow-x-auto pb-8 pt-2 px-1 sm:px-2 md:px-0
                       [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:rounded-full
                       [&::-webkit-scrollbar-thumb]:bg-amber-300/60 hover:[&::-webkit-scrollbar-thumb]:bg-amber-400/70"
            role="region"
            aria-roledescription="carousel"
            aria-label="Galerie campus"
          >
            {ITEMS.map((item, i) => (
              <div
                key={i}
                ref={(el) => {
                  if (el) cardsRef.current[i] = el;
                }}
                className={`group relative aspect-[4/3] w-[85%] shrink-0 snap-center overflow-hidden
                           rounded-3xl border border-amber-200 bg-white shadow-xl
                           transition-all duration-700 hover:-translate-y-2 hover:shadow-2xl
                           sm:w-[70%] md:w-[48%] lg:w-[32%] ${
                             active === i ? "ring-2 ring-amber-400" : ""
                           }`}
                aria-roledescription="slide"
                aria-label={`${i + 1} sur ${ITEMS.length}`}
              >
                {/* Image */}
                <div className="relative h-full">
                  <img
                    src={item.img}
                    alt={item.title}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    loading="lazy"
                  />
                  
                  {/* Overlay gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                  
                  {/* Badge icône */}
                  <div className="absolute top-4 left-4 w-12 h-12 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-full flex items-center justify-center text-white shadow-lg">
                    {ICONS[item.icon || "home"]}
                  </div>
                  
                  {/* Stats */}
                  {item.stats && (
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-xl p-3 shadow-lg">
                      {item.stats.map((stat, idx) => (
                        <div key={idx} className="text-center">
                          <div className="text-lg font-bold text-gray-900">{stat.value}</div>
                          <div className="text-xs text-gray-600">{stat.label}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Content */}
                <div className="absolute inset-x-0 bottom-0 p-6">
                  <h3 className="text-xl font-bold text-white drop-shadow-sm mb-2">
                    {item.title}
                  </h3>
                  {item.description && (
                    <p className="text-sm text-white/90 mb-4 line-clamp-2">
                      {item.description}
                    </p>
                  )}
                  <Link
                    href={item.link}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                  >
                    En savoir plus
                    <svg width="14" height="14" viewBox="0 0 13 13" fill="none" aria-hidden>
                      <path
                        d="M13 1a1 1 0 0 0-1-1H3a1 1 0 1 0 0 2h8v8a1 1 0 1 0 2 0V1ZM1.707 12.707 12.707 1.707 11.293.293.293 11.293l1.414 1.414Z"
                        fill="currentColor"
                      />
                    </svg>
                  </Link>
                </div>
                
                {/* Focus ring */}
                <span className="pointer-events-none absolute inset-0 rounded-3xl ring-0 ring-amber-500 focus-within:ring-2" />
              </div>
            ))}
          </div>

          {/* Controls améliorés */}
          <div className="mt-8 flex items-center justify-center gap-3">
            {ITEMS.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => scrollToIndex(i)}
                aria-label={`Aller à la diapositive ${i + 1}`}
                aria-current={active === i}
                className={`h-3 rounded-full transition-all duration-300 ${
                  active === i 
                    ? "w-8 bg-gradient-to-r from-amber-500 to-yellow-500" 
                    : "w-3 bg-amber-300/60 hover:bg-amber-400/80"
                }`}
              />
            ))}
          </div>

          {/* Prev / Next améliorés */}
          <div className="pointer-events-none absolute inset-y-0 hidden w-full items-center justify-between md:flex">
            <button
              type="button"
              onClick={() => scrollToIndex((active - 1 + ITEMS.length) % ITEMS.length)}
              className="pointer-events-auto ml-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm text-amber-600 shadow-lg ring-1 ring-amber-200 transition-all duration-300 hover:bg-white hover:shadow-xl hover:-translate-x-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
              aria-label="Précédent"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => scrollToIndex((active + 1) % ITEMS.length)}
              className="pointer-events-auto mr-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm text-amber-600 shadow-lg ring-1 ring-amber-200 transition-all duration-300 hover:bg-white hover:shadow-xl hover:translate-x-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
              aria-label="Suivant"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>

        {/* Section additionnelle */}
        <div className={`mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 transition-all duration-1000 delay-500 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-amber-100">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-full flex items-center justify-center text-white mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Apprentissage immersive</h3>
            <p className="text-gray-600">Notre approche pédagogique combine théorie et pratique pour une expérience d'apprentissage complète.</p>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-amber-100">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-full flex items-center justify-center text-white mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Communauté diverse</h3>
            <p className="text-gray-600">Rejoignez une communauté mondiale d'étudiants et de professeurs passionnés par l'excellence.</p>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-amber-100">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-full flex items-center justify-center text-white mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path>
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Opportunités globales</h3>
            <p className="text-gray-600">Accédez à des programmes d'échange et des stages dans le monde entier pour enrichir votre parcours.</p>
          </div>
        </div>
      </div>

      {/* Styles pour les animations de blob */}
      <style>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </section>
  );
}