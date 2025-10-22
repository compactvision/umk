import Isotope from 'isotope-layout';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from '@inertiajs/react';

type Faculty = {
  id: number | string;
  code: string;
  name: string;
  levels?: Array<{
    id: number | string;
    title?: string;
    image?: string;
    detail?: { student_number?: number; duration_years?: number };
  }>;
};

export default function Courses({ faculties = [] as Faculty[] }) {
  const isoRef = useRef<Isotope | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);

  const [activeFilter, setActiveFilter] = useState<string>('*');
  const [search, setSearch] = useState<string>('');
  const [ready, setReady] = useState(false);
  const [sortAsc, setSortAsc] = useState(true);

  // Normalise & aplatit les niveaux
  const { items, counts } = useMemo(() => {
    const out: Array<{
      id: string | number;
      facultyCode: string;
      facultyName: string;
      title: string;
      image: string;
      places: number;
      years: string | number;
    }> = [];
    const perCode: Record<string, number> = {};
    (Array.isArray(faculties) ? faculties : []).forEach(f => {
      const lvls = Array.isArray(f?.levels) ? f.levels : [];
      perCode[f?.code] = lvls.length;
      lvls.forEach(l => {
        out.push({
          id: l?.id,
          facultyCode: f?.code,
          facultyName: f?.name || 'N/A',
          title: l?.title || 'N/A',
          image: l?.image ? `/storage/${l.image}` : '/assets/img/default-course.png',
          places: l?.detail?.student_number ?? 0,
          years: l?.detail?.duration_years ?? 'N/A',
        });
      });
    });
    return { items: out, counts: perCode };
  }, [faculties]);

  // Attendre le chargement des images avant de relayer
  const waitImages = async () => {
    if (!gridRef.current) return;
    const imgs = Array.from(gridRef.current.querySelectorAll('img')).filter(img => !img.complete);
    if (imgs.length === 0) return;
    await Promise.all(
      imgs.map(
        img =>
          new Promise<void>(res => {
            const done = () => res();
            img.addEventListener('load', done, { once: true });
            img.addEventListener('error', done, { once: true });
          }),
      ),
    );
  };

  // Init Isotope
  useEffect(() => {
    if (!gridRef.current || isoRef.current) return;

    isoRef.current = new Isotope(gridRef.current, {
      itemSelector: '.grid-item',
      layoutMode: 'masonry',
      masonry: {
        columnWidth: '.grid-sizer',
        percentPosition: true,
      },
      getSortData: { name: '[data-title]' },
      transitionDuration: '0.45s',
      hiddenStyle: { opacity: 0, transform: 'scale(0.95) translateY(10px)' },
      visibleStyle: { opacity: 1, transform: 'scale(1) translateY(0)' },
      stagger: 50,
    });

    (async () => {
      await waitImages();
      isoRef.current?.reloadItems();
      isoRef.current?.arrange({ filter: () => true, sortBy: 'name', sortAscending: sortAsc });
      setReady(true);
    })();

    // Relayout on resize (debounced)
    let t: number | null = null;
    const onResize = () => {
      if (t) window.clearTimeout(t);
      t = window.setTimeout(() => isoRef.current?.layout(), 120);
    };
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      isoRef.current?.destroy();
      isoRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filtre combiné (faculté + recherche)
  const applyArrange = async () => {
    if (!isoRef.current) return;
    await waitImages();
    const filterFn = (elem: Element) => {
      const title = (elem.getAttribute('data-title') || '').toLowerCase();
      const matchesText = !search.trim() || title.includes(search.trim().toLowerCase());
      if (activeFilter === '*') return matchesText;
      const code = activeFilter.startsWith('.') ? activeFilter.slice(1) : activeFilter;
      return elem.classList.contains(code) && matchesText;
    };
    isoRef.current.arrange({ filter: filterFn, sortBy: 'name', sortAscending: sortAsc });
  };

  // Re-arrange quand filtres/recherche changent
  useEffect(() => {
    applyArrange();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFilter, search, sortAsc, items.length]);

  return (
    <section className="relative pt-16 lg:pt-24 pb-20 lg:pb-28 bg-gradient-to-br from-slate-50 via-white to-blue-50/30 overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-amber-200/20 to-yellow-300/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-blue-200/20 to-purple-300/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-emerald-100/10 via-transparent to-amber-100/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Titre avec animation */}
        <div className="text-center relative">
          <div className="inline-block relative">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent">
              Nos Programmes
            </h2>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-20 h-1 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full"></div>
          </div>
          <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Découvrez nos formations d'excellence et trouvez votre voie vers la réussite
          </p>
        </div>

        {/* Contrôles avec design ultra moderne */}
        <div className="mt-12 bg-white/70 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl shadow-slate-200/50">
          <div className="flex flex-col xl:flex-row items-stretch xl:items-center gap-6">
            
            {/* Filtres facultés */}
            <div className="flex-1">
              <label className="block text-sm font-bold text-slate-700 mb-3 pl-1">
                Filtrer par faculté
              </label>
              <div className="relative -mx-2 px-2">
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1" role="tablist">
                  <button
                    onClick={() => setActiveFilter('*')}
                    className={`group shrink-0 px-5 py-3 rounded-2xl text-sm font-bold border-2 transition-all duration-300 relative overflow-hidden
                      ${activeFilter === '*' 
                        ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-white border-transparent shadow-lg shadow-amber-400/30 scale-105' 
                        : 'bg-white/80 text-slate-700 border-slate-200/80 hover:border-amber-300 hover:bg-gradient-to-r hover:from-amber-50 hover:to-yellow-50 hover:scale-102'
                      }
                    `}
                    role="tab" aria-selected={activeFilter === '*'}
                  >
                    <span className="relative z-10">
                      Tous les programmes
                      <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                        activeFilter === '*' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {items.length}
                      </span>
                    </span>
                  </button>

                  {(Array.isArray(faculties) ? faculties : []).map(f => (
                    <button
                      key={f?.id}
                      onClick={() => setActiveFilter(`.${f?.code}`)}
                      className={`group shrink-0 px-5 py-3 rounded-2xl text-sm font-bold border-2 transition-all duration-300 relative overflow-hidden
                        ${activeFilter === `.${f?.code}` 
                          ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-white border-transparent shadow-lg shadow-amber-400/30 scale-105' 
                          : 'bg-white/80 text-slate-700 border-slate-200/80 hover:border-amber-300 hover:bg-gradient-to-r hover:from-amber-50 hover:to-yellow-50 hover:scale-102'
                        }
                      `}
                      role="tab" aria-selected={activeFilter === `.${f?.code}`}
                    >
                      <span className="relative z-10">
                        {f?.name || 'N/A'}
                        <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                          activeFilter === `.${f?.code}` ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {counts?.[f?.code] ?? 0}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Recherche et tri */}
            <div className="flex flex-col sm:flex-row gap-4 xl:w-auto">
              {/* Recherche */}
              <div className="flex-1 sm:w-80">
                <label className="block text-sm font-bold text-slate-700 mb-3 pl-1">
                  Rechercher
                </label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-400/20 to-yellow-500/20 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative">
                    <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-amber-500 transition-colors duration-200" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M21 21l-5.8-5.8M10 18a8 8 0 100-16 8 8 0 000 16z" strokeWidth="2.5" strokeLinecap="round" />
                    </svg>
                    <input
                      type="search"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Tapez votre recherche..."
                      className="w-full rounded-2xl border-2 border-slate-200/80 bg-white/80 backdrop-blur-sm pl-12 pr-4 py-3.5 text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-0 focus:border-amber-400 focus:bg-white transition-all duration-300"
                    />
                  </div>
                </div>
              </div>

              {/* Tri */}
              <div className="sm:w-auto">
                <label className="block text-sm font-bold text-slate-700 mb-3 pl-1">
                  Trier
                </label>
                <button
                  onClick={() => setSortAsc(v => !v)}
                  className="group px-6 py-3.5 rounded-2xl text-sm font-bold border-2 border-slate-200/80 bg-white/80 hover:bg-gradient-to-r hover:from-slate-50 hover:to-slate-100 hover:border-slate-300 transition-all duration-300 flex items-center gap-3"
                  title={`Tri alphabétique ${sortAsc ? 'A → Z' : 'Z → A'}`}
                >
                  <span>{sortAsc ? 'A → Z' : 'Z → A'}</span>
                  <svg className={`w-4 h-4 transition-transform duration-300 ${sortAsc ? 'rotate-0' : 'rotate-180'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M8 6l4-4 4 4M12 2v20" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* GRID avec design ultra premium */}
        <div className="mt-16">
          <div ref={gridRef} className="grid-container relative -mx-3">
            {/* IMPORTANT: grid-sizer TOUJOURS visible */}
            <div className="grid-sizer w-full md:w-1/2 xl:w-1/3" />

            {items.length === 0 && (
              <div className="mx-3 mt-12 rounded-3xl border-2 border-dashed border-slate-300/60 bg-gradient-to-br from-slate-50 to-white p-12 text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                  <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-slate-700 mb-2">Aucun programme disponible</h3>
                <p className="text-slate-500">Aucun cours ne correspond à vos critères de recherche.</p>
              </div>
            )}

            {items.map((it) => (
              <article
                key={it.id}
                className={[
                  'grid-item',
                  'w-full md:w-1/2 xl:w-1/3',
                  'px-3 pb-6',
                  it.facultyCode || '',
                  ready ? 'opacity-100' : 'opacity-0',
                ].join(' ')}
                data-title={it.title}
              >
                {/* ULTRA PREMIUM CARD */}
                <div className="group h-full relative">
                  {/* Glow effect */}
                  <div className="absolute -inset-1 bg-gradient-to-r from-amber-400/20 via-yellow-500/20 to-amber-400/20 rounded-3xl blur-lg opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                  
                  {/* Main card */}
                  <div className="relative h-full overflow-hidden rounded-3xl border border-white/20 bg-white/95 backdrop-blur-xl shadow-xl shadow-slate-200/50 group-hover:shadow-2xl group-hover:shadow-slate-300/60 transition-all duration-500 group-hover:-translate-y-2">
                    
                    {/* Media container avec overlay sophistiqué */}
                    <div className="relative overflow-hidden">
                      <div className="aspect-[4/3] relative">
                        <img
                          src={it.image}
                          alt={it.title}
                          loading="lazy"
                          className="absolute inset-0 w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
                          onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/assets/img/default-course.png'; }}
                        />
                        
                        {/* Sophisticated overlays */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-80"></div>
                        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/30 opacity-60"></div>
                        
                        {/* Premium faculty badge */}
                        <div className="absolute left-4 top-4 z-20">
                          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/95 backdrop-blur-xl border border-white/40 shadow-lg">
                            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500"></div>
                            <span className="text-sm font-bold text-slate-800">{it.facultyName}</span>
                          </div>
                        </div>

                        {/* Floating stats */}
                        <div className="absolute right-4 top-4 z-20">
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/20 backdrop-blur-xl border border-white/20 text-white">
                            <span className="text-xs font-bold">{it.facultyCode}</span>
                          </div>
                        </div>

                        {/* Bottom gradient overlay */}
                        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                      </div>
                    </div>

                    {/* Content avec spacing parfait */}
                    <div className="p-6 relative">
                      {/* Title avec typography premium */}
                      <h3 className="text-lg sm:text-xl font-black text-slate-900 leading-tight line-clamp-2 mb-4 group-hover:text-amber-600 transition-colors duration-300">
                        {it.title}
                      </h3>

                      {/* Stats grid avec design sophistiqué */}
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100/50">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center flex-shrink-0">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0"/>
                            </svg>
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Places</div>
                            <div className="text-sm font-black text-slate-900">{it.places}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-100/50">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center flex-shrink-0">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">Durée</div>
                            <div className="text-sm font-black text-slate-900">{it.years} an{it.years !== 1 ? 's' : ''}</div>
                          </div>
                        </div>
                      </div>

                      {/* CTA avec animation ultra sophistiquée */}
                      <div className="flex items-center justify-between">
                        <Link
                          href={route('courseShow', it.id)}
                          className="group/cta relative inline-flex items-center gap-3 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-500 text-white font-black text-sm transition-all duration-300 hover:shadow-xl hover:shadow-amber-400/40 hover:scale-105 overflow-hidden"
                        >
                          {/* Button glow */}
                          <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover/cta:opacity-100 transition-opacity duration-300"></div>
                          
                          <span className="relative z-10">Découvrir</span>
                          
                          <div className="relative z-10 w-5 h-5 flex items-center justify-center">
                            <svg 
                              className="w-4 h-4 transition-transform duration-300 group-hover/cta:translate-x-0.5" 
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7l5 5-5 5M6 12h12"/>
                            </svg>
                          </div>

                          {/* Ripple effect */}
                          <div className="absolute inset-0 rounded-2xl opacity-0 group-hover/cta:animate-ping bg-white/20"></div>
                        </Link>

                        {/* Premium badge */}
                        <div className="px-3 py-2 rounded-xl bg-gradient-to-r from-slate-100 to-slate-200 border border-slate-300/50">
                          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                            Premium
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Subtle border glow */}
                    <div className="absolute inset-0 rounded-3xl border border-gradient-to-r from-transparent via-amber-200/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

        /* Isotope avec transitions ultra smooth */
        .grid-container { position: relative; }
        .grid-item { 
          transition: opacity 0.45s cubic-bezier(0.4, 0, 0.2, 1), 
                      transform 0.45s cubic-bezier(0.4, 0, 0.2, 1); 
        }

        /* Premium hover scale utilities */
        .hover\\:scale-102:hover { transform: scale(1.02); }
        
        /* Line clamp utilities */
        .line-clamp-2 {
          overflow: hidden;
          display: -webkit-box;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 2;
        }

        /* Premium gradient borders */
        @keyframes gradient-x {
          0%, 100% { background-size: 200% 200%; background-position: left center; }
          50% { background-size: 200% 200%; background-position: right center; }
        }

        /* Backdrop blur fallback */
        @supports not (backdrop-filter: blur(12px)) {
          .backdrop-blur-xl { background-color: rgba(255, 255, 255, 0.9); }
        }

        /* Enhanced ripple animation */
        @keyframes ping {
          75%, 100% {
            transform: scale(1.1);
            opacity: 0;
          }
        }
      `}</style>
    </section>
  );
}