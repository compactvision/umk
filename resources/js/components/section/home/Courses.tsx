import { Link } from "@inertiajs/react";
import React, { useState } from "react";

type Program = {
  id: number;
  title: string;
  category: string;       // ex: "# Santé"
  image: string;
  rating: number;         // 0..5
  seats: number;          // places
  semesters: number;      // durée en semestres
  href?: string;          // route vers la page programme
  enrollHref?: string;    // route vers inscription
  description?: string;   // description courte
  level?: string;         // niveau (ex: "Master", "Doctorat")
};

const PROGRAMS: Program[] = [
  { 
    id: 1, 
    title: "MBA en Ingénierie Biomédicale", 
    category: "Santé", 
    image: "/assets/img/program/pro-img01.png", 
    rating: 5.0, 
    seats: 200, 
    semesters: 14,
    description: "Alliez expertise médicale et innovation technologique",
    level: "Master"
  },
  { 
    id: 2, 
    title: "MBA en Management de la Construction", 
    category: "Management", 
    image: "/assets/img/program/pro-img02.png", 
    rating: 4.5, 
    seats: 250, 
    semesters: 14,
    description: "Dirigez des projets de construction complexes",
    level: "Master"
  },
  { 
    id: 3, 
    title: "MBA en Management Stratégique", 
    category: "Stratégie", 
    image: "/assets/img/program/pro-img03.png", 
    rating: 5.0, 
    seats: 280, 
    semesters: 14,
    description: "Développez une vision stratégique pour l'entreprise",
    level: "Master"
  },
  { 
    id: 4, 
    title: "MBA en Génie Mécanique", 
    category: "Ingénierie", 
    image: "/assets/img/program/pro-img04.png", 
    rating: 5.0, 
    seats: 220, 
    semesters: 14,
    description: "Concevez des solutions mécaniques innovantes",
    level: "Master"
  },
  { 
    id: 5, 
    title: "MBA en Énergie Durable", 
    category: "Énergie", 
    image: "/assets/img/program/pro-img05.png", 
    rating: 5.0, 
    seats: 200, 
    semesters: 14,
    description: "Formez-vous aux énergies renouvelables",
    level: "Master"
  },
  { 
    id: 6, 
    title: "MBA en Immobilier et Urbanisme", 
    category: "Immobilier", 
    image: "/assets/img/program/pro-img06.png", 
    rating: 4.9, 
    seats: 230, 
    semesters: 14,
    description: "Aménagez les villes de demain",
    level: "Master"
  },
];

const CAT_COLORS: Record<string, { bg: string; text: string; ring: string }> = {
  "Santé": { bg: "bg-rose-100", text: "text-rose-700", ring: "ring-rose-200" },
  "Management": { bg: "bg-amber-100", text: "text-amber-700", ring: "ring-amber-200" },
  "Stratégie": { bg: "bg-indigo-100", text: "text-indigo-700", ring: "ring-indigo-200" },
  "Ingénierie": { bg: "bg-sky-100", text: "text-sky-700", ring: "ring-sky-200" },
  "Énergie": { bg: "bg-emerald-100", text: "text-emerald-700", ring: "ring-emerald-200" },
  "Immobilier": { bg: "bg-fuchsia-100", text: "text-fuchsia-700", ring: "ring-fuchsia-200" },
};

export default function Courses(): JSX.Element {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  return (
    <section className="relative bg-gradient-to-br from-amber-50 via-white to-yellow-50 py-20 md:py-32 overflow-hidden">
      {/* Éléments décoratifs de fond */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-amber-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-orange-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-16 flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <div className="max-w-2xl">
            <span className="inline-block rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 px-4 py-2 text-sm font-semibold text-white shadow-lg">
              Nos formations d'excellence
            </span>
            <h1 className="mt-6 text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-600 bg-clip-text text-transparent">
              Programmes Phares
            </h1>
            <p className="mt-4 text-lg text-gray-600">
              Découvrez nos programmes de renommée mondiale conçus pour façonner les leaders de demain.
            </p>
          </div>
          <Link
            href={route?.("courses") ?? "#"}
            className="group inline-flex items-center gap-2 rounded-xl border border-amber-300 bg-white px-6 py-3 text-base font-medium text-amber-700 shadow-md transition-all duration-300 hover:border-amber-400 hover:shadow-lg hover:-translate-y-1"
          >
            Voir tous les programmes
            <svg
              className="transition-transform group-hover:translate-x-1"
              width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden
            >
              <path d="M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </Link>
        </div>

        {/* Filtres de catégories */}
        <div className="mb-10 flex flex-wrap gap-3">
          {["Tous", "Santé", "Management", "Stratégie", "Ingénierie", "Énergie", "Immobilier"].map((cat) => (
            <button
              key={cat}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                cat === "Tous" 
                  ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-md" 
                  : "bg-white text-gray-700 border border-gray-300 hover:border-amber-400 hover:text-amber-700"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {PROGRAMS.map((p) => (
            <article
              key={p.id}
              className={`group relative overflow-hidden rounded-3xl bg-white shadow-xl transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl ${
                hoveredCard === p.id ? "ring-2 ring-amber-400" : ""
              }`}
              onMouseEnter={() => setHoveredCard(p.id)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              {/* Image */}
              <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-amber-50 to-yellow-50">
                <img
                  src={p.image}
                  alt={p.title}
                  className="h-full w-full object-contain p-6 transition-transform duration-700 group-hover:scale-110"
                  loading="lazy"
                />
                
                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                {/* Badge catégorie */}
                <span
                  className={`absolute left-4 top-4 inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold ${CAT_COLORS[p.category]?.bg} ${CAT_COLORS[p.category]?.text} ${CAT_COLORS[p.category]?.ring} ring-1`}
                >
                  {p.category}
                </span>
                
                {/* Badge niveau */}
                <span className="absolute left-4 bottom-4 inline-flex items-center rounded-full bg-white/90 backdrop-blur-sm px-3 py-1.5 text-xs font-semibold text-gray-800 shadow-md">
                  {p.level}
                </span>
                
                {/* Note */}
                <div className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-white/90 backdrop-blur-sm px-3 py-1.5 text-sm font-semibold text-gray-800 shadow-md">
                  <StarIcon className="h-4 w-4 text-amber-400" />
                  {p.rating.toFixed(1)}
                  <span className="sr-only">/ 5</span>
                </div>
              </div>

              {/* Body */}
              <div className="space-y-4 p-6">
                <h2 className="line-clamp-2 text-xl font-bold text-gray-900 transition-colors group-hover:text-amber-700">
                  <Link href={p.href ?? "#"} className="focus:outline-none focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-amber-500">
                    {p.title}
                  </Link>
                </h2>
                
                {p.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {p.description}
                  </p>
                )}

                <ul className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                  <li className="inline-flex items-center gap-2">
                    <svg className="h-4 w-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                    </svg>
                    <span className="tabular-nums">{p.seats.toLocaleString("fr-FR")} Places</span>
                  </li>
                  <li className="inline-flex items-center gap-2">
                    <svg className="h-4 w-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span className="tabular-nums">{p.semesters} Semestres</span>
                  </li>
                </ul>

                <div className="flex items-center justify-between pt-2">
                  <Link
                    href={p.enrollHref ?? "#"}
                    className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                  >
                    S'inscrire
                  </Link>

                  <Link
                    href={p.href ?? "#"}
                    className="inline-flex items-center gap-1 text-sm font-medium text-amber-600 hover:text-amber-700 transition-colors duration-300"
                  >
                    Détails
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                    </svg>
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* CTA Banner amélioré */}
        <div className="relative mt-20 overflow-hidden rounded-3xl bg-gradient-to-r from-amber-600 to-yellow-600 px-8 py-12 shadow-2xl md:mt-24 md:flex md:items-center md:gap-10 md:py-16">
          <div
            className="pointer-events-none absolute inset-0 bg-[url('/assets/img/bg/pro-banner.png')] bg-cover bg-center opacity-10 mix-blend-luminosity"
            aria-hidden
          />
          
          {/* Éléments décoratifs */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
            <div className="absolute -bottom-10 -right-10 w-60 h-60 bg-white/10 rounded-full blur-2xl"></div>
          </div>
          
          <div className="relative max-w-2xl">
            <h2 className="text-balance text-3xl font-bold text-white sm:text-4xl">
              Obtenez votre certification professionnelle avec USK
            </h2>
            <p className="mt-4 text-lg text-amber-100">
              Des programmes conçus avec l'industrie, des enseignants experts, et un accompagnement personnalisé pour accélérer votre carrière.
            </p>
            <div className="mt-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <Link
                href={route?.("dashboard.enrollments.index") ?? "#"}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-base font-semibold text-amber-600 shadow-lg transition-all duration-300 hover:bg-amber-50 hover:shadow-xl hover:-translate-y-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
              >
                Postuler maintenant
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
                </svg>
              </Link>
              <a
                href="tel:+2438211122333"
                className="inline-flex items-center gap-2 text-base font-medium text-white/90 hover:text-white transition-colors duration-300"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                </svg>
                +243&nbsp;821&nbsp;11&nbsp;22&nbsp;333
              </a>
            </div>
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

function StarIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.803 2.037a1 1 0 00-.364 1.118l1.07 3.292c.3.922-.755 1.688-1.54 1.118l-2.804-2.038a1 1 0 00-1.175 0l-2.804 2.038c-.784.57-1.838-.196-1.54-1.118l1.071-3.292a1 1 0 00-.364-1.118L2.93 8.72c-.783-.57-.38-1.81.588-1.81H6.98a1 1 0 00.95-.69l1.12-3.292z"/>
    </svg>
  );
}