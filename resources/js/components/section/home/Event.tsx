import React, { useState, useEffect } from "react";

type MiniEvent = {
  img: string;
  dateLabel: string; // "24 Nov 2024"
  title: string;
  location: string;
  href?: string;
  category?: string;
  attendees?: number;
};

type FeaturedEvent = MiniEvent & {
  cta?: { label: string; href: string };
  icon?: string;
  description?: string;
  speaker?: string;
};

const miniEvents: MiniEvent[] = [
  {
    img: "/assets/img/event/event-img01.png",
    dateLabel: "24 Nov 2024",
    title: "Festival des Cultures : Art et Spectacle Vivant",
    location: "139 W, 46th Street, New York",
    href: "#",
    category: "Culture",
    attendees: 250
  },
  {
    img: "/assets/img/event/event-img02.png",
    dateLabel: "15 Déc 2024",
    title: "Horizons Globaux : Échanges Interculturels",
    location: "New York, NY 10036, USA",
    href: "#",
    category: "International",
    attendees: 180
  },
  {
    img: "/assets/img/event/event-img03.png",
    dateLabel: "10 Jan 2025",
    title: "Soirée de Lancement : Programme de Mentorat Étudiant",
    location: "New York, NY 10036, USA",
    href: "#",
    category: "Éducation",
    attendees: 120
  },
];

const featured: FeaturedEvent = {
  img: "/assets/img/event/event-img04.png",
  dateLabel: "24 Déc 2024",
  title: "Conférence du Dr. Hongbo Chi : Immunologie et Innovations Médicales",
  location: "Financial District, New York",
  href: "#",
  cta: { label: "Réserver", href: "#" },
  icon: "/assets/img/icon/note-book.svg",
  description: "Une exploration des dernières avancées en immunologie et leurs applications médicales révolutionnaires.",
  speaker: "Dr. Hongbo Chi",
  category: "Conférence",
  attendees: 350
};

function splitDate(label: string) {
  const p = label.split(" ");
  return { d: p[0] ?? "", m: p[1] ?? "", y: p[2] ?? "" };
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  "Culture": { bg: "bg-rose-100", text: "text-rose-700" },
  "International": { bg: "bg-blue-100", text: "text-blue-700" },
  "Éducation": { bg: "bg-green-100", text: "text-green-700" },
  "Conférence": { bg: "bg-amber-100", text: "text-amber-700" },
};

export default function Event(): JSX.Element {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hoveredEvent, setHoveredEvent] = useState<number | null>(null);
  const f = splitDate(featured.dateLabel);

  useEffect(() => {
    setTimeout(() => setIsLoaded(true), 100);
  }, []);

  return (
    <section
      className="relative bg-gradient-to-br from-amber-50 via-white to-yellow-50 py-20 md:py-32 overflow-hidden"
      aria-label="Événements à venir"
    >
      {/* Éléments décoratifs de fond */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-amber-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-orange-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Décors discrets */}
      <img
        src="/assets/img/shape/Union.png"
        alt=""
        aria-hidden
        className="pointer-events-none absolute right-0 top-0 -z-10 hidden w-40 opacity-20 lg:block"
      />
      <img
        src="/assets/img/shape/stamp.png"
        alt=""
        aria-hidden
        className="pointer-events-none absolute left-0 top-8 -z-10 hidden w-28 opacity-10 lg:block"
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Titre */}
        <div className={`text-center mb-16 transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <span className="inline-block rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 px-4 py-2 text-sm font-semibold text-white shadow-lg">
            Nos Événements
          </span>
          <h2 className="mt-6 text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-600 bg-clip-text text-transparent">
            Événements à venir
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-600">
            Rejoignez-nous pour des événements inspirants qui enrichissent votre expérience universitaire.
          </p>
          <div className="mt-4 mx-auto h-1 w-24 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full"></div>
        </div>

        {/* Grille */}
        <div className={`mt-10 grid gap-12 xl:grid-cols-2 transition-all duration-1000 delay-300 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          {/* Liste d'événements */}
          <div role="list" aria-label="Liste des prochains événements" className="space-y-6">
            {miniEvents.map((ev, i) => {
              const d = splitDate(ev.dateLabel);
              const colors = CATEGORY_COLORS[ev.category || ""] || { bg: "bg-gray-100", text: "text-gray-700" };
              
              return (
                <article
                  role="listitem"
                  key={i}
                  className={`group relative flex gap-5 rounded-3xl border border-amber-200 bg-white p-5 shadow-lg transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 focus-within:shadow-2xl ${
                    hoveredEvent === i ? "ring-2 ring-amber-400" : ""
                  }`}
                  onMouseEnter={() => setHoveredEvent(i)}
                  onMouseLeave={() => setHoveredEvent(null)}
                >
                  <div className="relative h-28 w-32 shrink-0 overflow-hidden rounded-2xl">
                    <img
                      src={ev.img}
                      alt={ev.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      loading="lazy"
                    />
                    {/* Date */}
                    <div className="absolute left-3 top-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 px-3 py-2 text-xs font-semibold text-white shadow-lg">
                      <div className="text-center">
                        <div className="text-lg font-bold">{d.d}</div>
                        <div className="text-xs">{d.m}</div>
                      </div>
                    </div>
                    
                    {/* Badge catégorie */}
                    {ev.category && (
                      <div className={`absolute right-3 top-3 rounded-lg ${colors.bg} ${colors.text} px-2 py-1 text-xs font-semibold`}>
                        {ev.category}
                      </div>
                    )}
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          className="text-amber-500"
                          aria-hidden
                        >
                          <path
                            d="M12 21s-7-4.35-7-10a7 7 0 1 1 14 0c0 5.65-7 10-7 10Z"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <circle cx="12" cy="9.5" r="2.25" stroke="currentColor" strokeWidth="2" />
                        </svg>
                        <span className="truncate">{ev.location}</span>
                      </div>

                      <h3 className="text-lg font-bold leading-snug text-gray-900 mb-2">
                        <a
                          href={ev.href || "#"}
                          className="outline-none ring-offset-2 ring-offset-white transition hover:text-amber-600 focus-visible:ring-2 focus-visible:ring-amber-500"
                        >
                          <span className="absolute inset-0" aria-hidden />
                          {ev.title}
                        </a>
                      </h3>
                      
                      {/* Participants */}
                      {ev.attendees && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                          </svg>
                          <span>{ev.attendees} participants</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <a
                        href={ev.href || "#"}
                        className="inline-flex items-center gap-1 text-sm font-medium text-amber-600 hover:text-amber-700 transition-colors duration-300"
                      >
                        Voir détails
                        <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                        </svg>
                      </a>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Événement en avant */}
          <article className="relative overflow-hidden rounded-3xl border border-amber-200 bg-white shadow-xl transition-all duration-500 hover:shadow-2xl hover:-translate-y-1">
            <div className="relative">
              <img
                src={featured.img}
                alt={featured.title}
                className="h-64 w-full object-cover sm:h-80 md:h-96 transition-transform duration-700 hover:scale-105"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              
              {/* Badge catégorie */}
              {featured.category && (
                <div className="absolute left-6 top-6 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 px-4 py-2 text-sm font-semibold text-white shadow-lg">
                  {featured.category}
                </div>
              )}
              
              {/* Participants */}
              {featured.attendees && (
                <div className="absolute right-6 top-6 rounded-xl bg-white/90 backdrop-blur-sm px-4 py-2 text-sm font-semibold text-gray-800 shadow-lg">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                    </svg>
                    <span>{featured.attendees} participants</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-6 p-6 sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="mb-3 flex items-center gap-2 text-sm text-gray-600">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      className="text-amber-500"
                      aria-hidden
                    >
                      <path
                        d="M12 21s-7-4.35-7-10a7 7 0 1 1 14 0c0 5.65-7 10-7 10Z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <circle cx="12" cy="9.5" r="2.25" stroke="currentColor" strokeWidth="2" />
                    </svg>
                    <span className="truncate">{featured.location}</span>
                  </div>

                  <h3 className="text-2xl font-bold leading-snug text-gray-900 mb-3">
                    <a
                      href={featured.href || "#"}
                      className="outline-none ring-offset-2 ring-offset-white transition hover:text-amber-600 focus-visible:ring-2 focus-visible:ring-amber-500"
                    >
                      {featured.title}
                    </a>
                  </h3>
                  
                  {/* Description */}
                  {featured.description && (
                    <p className="text-gray-600 mb-3">
                      {featured.description}
                    </p>
                  )}
                  
                  {/* Speaker */}
                  {featured.speaker && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                      <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                      </svg>
                      <span>Conférencier: {featured.speaker}</span>
                    </div>
                  )}
                </div>

                <div className="hidden shrink-0 text-center sm:block">
                  {featured.icon && (
                    <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-gradient-to-br from-amber-500 to-yellow-500 p-3 shadow-lg">
                      <img src={featured.icon} alt="" aria-hidden className="w-full h-full object-contain filter brightness-0 invert" />
                    </div>
                  )}
                  <div className="rounded-xl bg-gradient-to-br from-amber-50 to-yellow-50 px-4 py-3 text-center shadow-lg border border-amber-200">
                    <span className="block text-lg font-bold text-gray-900">
                      {f.d} {f.m}
                    </span>
                    <span className="block text-xs uppercase tracking-wide text-gray-600">
                      {f.y}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                {featured.cta && (
                  <a
                    href={featured.cta.href}
                    className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 px-6 py-3 text-base font-semibold text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                  >
                    {featured.cta.label}
                    <span className="ml-2 inline-flex">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                        <path
                          d="M5 12h14m-6-6 6 6-6 6"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  </a>
                )}

                {/* Date mobile */}
                <div className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-br from-amber-50 to-yellow-50 px-4 py-2 text-sm font-medium text-gray-800 border border-amber-200 sm:hidden">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path
                      d="M8 2v3M16 2v3M3 9h18M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5A2 2 0 0 0 3 7v12a2 2 0 0 0 2 2Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                  {featured.dateLabel}
                </div>
              </div>
            </div>
          </article>
        </div>

        {/* CTA Voir plus */}
        <div className={`mt-16 text-center transition-all duration-1000 delay-500 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <a
            href="#"
            className="inline-flex items-center gap-2 rounded-xl border border-amber-300 bg-white px-6 py-3 text-base font-semibold text-amber-700 shadow-md transition-all duration-300 hover:border-amber-400 hover:bg-amber-50 hover:shadow-lg hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
          >
            Voir tous les événements
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              className="transition-transform group-hover:translate-x-1"
              aria-hidden
            >
              <path
                d="M5 12h14m-6-6 6 6-6 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </a>
        </div>
      </div>

      {/* Bandeau image bas */}
      {/* <div className={`pointer-events-none mt-16 transition-all duration-1000 delay-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <img
          src="/assets/img/event/event-img05.png"
          alt="Événements universitaires"
          className="mx-auto w-full max-w-5xl opacity-95"
          loading="lazy"
        />
      </div> */}

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