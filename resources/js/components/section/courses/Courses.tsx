import { Link } from '@inertiajs/react';
import Isotope from 'isotope-layout';
import { useEffect, useMemo, useRef, useState } from 'react';

type Faculty = {
    id: number | string;
    code: string;
    name: string;
    levels?: Array<{
        id: number | string;
        title?: string;
        image?: string;
        student_number?: number; duration_years?: number;
        detail?: { student_number?: number; duration_years?: number; illustration_image_url?: string };
    }>;
};

export default function Courses({ faculties = [] as Faculty[] }) {
    const isoRef = useRef<Isotope | null>(null);
    const gridRef = useRef<HTMLDivElement | null>(null);

    const [activeFilter, setActiveFilter] = useState<string>('*');
    const [search, setSearch] = useState<string>('');
    const [ready, setReady] = useState(false);
    const [sortAsc, setSortAsc] = useState(true);
    const [showFilters, setShowFilters] = useState(false);

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

        (Array.isArray(faculties) ? faculties : []).forEach((f) => {
            const lvls = Array.isArray(f?.levels) ? f.levels : [];
            perCode[f?.code ?? 'N/A'] = lvls.length;

            lvls.forEach((l) => {
                const d = l?.detail ?? null;

                const image =
                    (d?.illustration_image_url && String(d.illustration_image_url)) ||
                    (l?.image ? `/storage/${l.image}` : '/assets/img/default-course.png');

                const places =
                    (typeof d?.student_number === 'number' ? d.student_number : undefined) ??
                    (typeof l?.student_number === 'number' ? l.student_number : undefined) ??
                    0;

                const years = d?.duration_years ?? l?.duration_years ?? 'N/A';

                out.push({
                    id: l?.id,
                    facultyCode: f?.code ?? 'N/A',
                    facultyName: f?.name || 'N/A',
                    title: l?.title || 'N/A',
                    image,
                    places,
                    years,
                });
            });
        });

        return { items: out, counts: perCode };
    }, [faculties]);

    console.log(faculties, items);

    // Attendre le chargement des images avant de relayer
    const waitImages = async () => {
        if (!gridRef.current) return;
        const imgs = Array.from(gridRef.current.querySelectorAll('img')).filter((img) => !img.complete);
        if (imgs.length === 0) return;
        await Promise.all(
            imgs.map(
                (img) =>
                    new Promise<void>((res) => {
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
        <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50/30 pt-16 pb-20 lg:pt-24 lg:pb-28">
            {/* Background decorations */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-gradient-to-br from-amber-200/20 to-yellow-300/20 blur-3xl"></div>
                <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-gradient-to-tr from-blue-200/20 to-purple-300/20 blur-3xl"></div>
                <div className="absolute top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-emerald-100/10 via-transparent to-amber-100/10 blur-3xl"></div>
            </div>

            <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                {/* Titre avec animation */}
                <div className="relative text-center">
                    <div className="relative inline-block">
                        <h2 className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-3xl font-black tracking-tight text-transparent sm:text-4xl lg:text-5xl xl:text-6xl">
                            Nos Programmes
                        </h2>
                        <div className="absolute -bottom-2 left-1/2 h-1 w-20 -translate-x-1/2 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500"></div>
                    </div>
                    <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-600 sm:text-xl">
                        Découvrez nos formations d'excellence et trouvez votre voie vers la réussite
                    </p>
                </div>

                {/* Contrôles avec design ultra moderne */}
                <div className="mt-12 rounded-3xl border border-white/30 bg-white/90 p-4 shadow-2xl shadow-slate-200/50 backdrop-blur-xl sm:p-6">
                    {/* Barre de recherche et tri - toujours visible */}
                    <div className="mb-6 flex flex-col gap-4 lg:flex-row">
                        <div className="flex-1 lg:w-80">
                            <label className="mb-3 block text-sm font-bold text-slate-700">Rechercher</label>
                            <div className="group relative">
                                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-amber-400/20 to-yellow-500/20 opacity-0 blur transition-opacity duration-300 group-focus-within:opacity-100"></div>
                                <div className="relative">
                                    <svg
                                        className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-slate-400 transition-colors duration-200 group-focus-within:text-amber-500"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                    >
                                        <path d="M21 21l-5.8-5.8M10 18a8 8 0 100-16 8 8 0 000 16z" strokeWidth="2.5" strokeLinecap="round" />
                                    </svg>
                                    <input
                                        type="search"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Tapez votre recherche..."
                                        className="w-full rounded-2xl border-2 border-slate-200 bg-white py-3.5 pr-4 pl-12 text-sm font-medium text-slate-900 placeholder-slate-400 transition-all duration-300 focus:border-amber-400 focus:bg-white focus:ring-0 focus:outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="lg:w-auto">
                            <label className="mb-3 block text-sm font-bold text-slate-700">Trier</label>
                            <button
                                onClick={() => setSortAsc((v) => !v)}
                                className="group flex items-center gap-3 rounded-2xl border-2 border-slate-200 bg-white px-6 py-3.5 text-sm font-bold transition-all duration-300 hover:border-slate-300 hover:bg-gradient-to-r hover:from-slate-50 hover:to-slate-100"
                                title={`Tri alphabétique ${sortAsc ? 'A → Z' : 'Z → A'}`}
                            >
                                <span>{sortAsc ? 'A → Z' : 'Z → A'}</span>
                                <svg
                                    className={`h-4 w-4 transition-transform duration-300 ${sortAsc ? 'rotate-0' : 'rotate-180'}`}
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                >
                                    <path d="M8 6l4-4 4 4M12 2v20" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Section filtres avec bouton toggle */}
                    <div className="border-t border-slate-200 pt-4">
                        <div className="mb-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setShowFilters(!showFilters)}
                                    className="group flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 px-4 py-2 font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl"
                                >
                                    <svg
                                        className={`h-5 w-5 transition-transform duration-300 ${showFilters ? 'rotate-180' : ''}`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                    <span>Filtres</span>
                                    <span className="rounded-full bg-white/20 px-2 py-1 text-xs">
                                        {activeFilter === '*' ? items.length : counts?.[activeFilter.replace('.', '')] || 0}
                                    </span>
                                </button>

                                <div className="hidden items-center gap-2 text-sm text-slate-600 sm:flex">
                                    {activeFilter !== '*' && (
                                        <>
                                            <span>Filtré par:</span>
                                            <span className="rounded-full bg-amber-100 px-3 py-1 font-medium text-amber-700">
                                                {faculties.find((f) => f.code === activeFilter.replace('.', ''))?.name || 'Inconnu'}
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>

                            {activeFilter !== '*' && (
                                <button
                                    onClick={() => setActiveFilter('*')}
                                    className="text-sm font-medium text-amber-600 transition-colors duration-200 hover:text-amber-700"
                                >
                                    Réinitialiser
                                </button>
                            )}
                        </div>

                        {/* Filtres dépliables avec animation */}
                        <div
                            className={`overflow-hidden transition-all duration-500 ease-in-out ${
                                showFilters ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                            }`}
                        >
                            <div className="pt-4">
                                <label className="mb-3 block text-sm font-bold text-slate-700">Filtrer par faculté</label>

                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                    <button
                                        onClick={() => setActiveFilter('*')}
                                        className={`group relative overflow-hidden rounded-2xl border-2 px-4 py-3 text-sm font-bold transition-all duration-300 ${
                                            activeFilter === '*'
                                                ? 'scale-105 border-transparent bg-gradient-to-r from-amber-400 to-yellow-500 text-white shadow-lg shadow-amber-400/30'
                                                : 'border-slate-200 bg-white text-slate-700 hover:scale-102 hover:border-amber-300 hover:bg-gradient-to-r hover:from-amber-50 hover:to-yellow-50'
                                        } `}
                                        role="tab"
                                        aria-selected={activeFilter === '*'}
                                    >
                                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-amber-400/10 to-yellow-500/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
                                        <div className="relative z-10 flex flex-col items-center gap-1">
                                            <span className="flex items-center gap-2">
                                                <div className={`h-2 w-2 rounded-full ${activeFilter === '*' ? 'bg-white' : 'bg-slate-400'}`}></div>
                                                Tous
                                            </span>
                                            <span
                                                className={`rounded-full px-2 py-1 text-xs ${
                                                    activeFilter === '*' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                                                }`}
                                            >
                                                {items.length}
                                            </span>
                                        </div>
                                    </button>

                                    {(Array.isArray(faculties) ? faculties : []).map((f) => (
                                        <button
                                            key={f?.id}
                                            onClick={() => setActiveFilter(`.${f?.code}`)}
                                            className={`group relative overflow-hidden rounded-2xl border-2 px-4 py-3 text-sm font-bold transition-all duration-300 ${
                                                activeFilter === `.${f?.code}`
                                                    ? 'scale-105 border-transparent bg-gradient-to-r from-amber-400 to-yellow-500 text-white shadow-lg shadow-amber-400/30'
                                                    : 'border-slate-200 bg-white text-slate-700 hover:scale-102 hover:border-amber-300 hover:bg-gradient-to-r hover:from-amber-50 hover:to-yellow-50'
                                            } `}
                                            role="tab"
                                            aria-selected={activeFilter === `.${f?.code}`}
                                        >
                                            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-amber-400/10 to-yellow-500/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
                                            <div className="relative z-10 flex flex-col items-center gap-1">
                                                <span className="flex items-center gap-2 truncate">
                                                    <div
                                                        className={`h-2 w-2 rounded-full ${activeFilter === `.${f?.code}` ? 'bg-white' : 'bg-slate-400'}`}
                                                    ></div>
                                                    <span className="truncate text-center">{f?.name || 'N/A'}</span>
                                                </span>
                                                <span
                                                    className={`rounded-full px-2 py-1 text-xs ${
                                                        activeFilter === `.${f?.code}` ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                                                    }`}
                                                >
                                                    {counts?.[f?.code] ?? 0}
                                                </span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
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
                                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200">
                                    <svg className="h-10 w-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                                        />
                                    </svg>
                                </div>
                                <h3 className="mb-2 text-xl font-bold text-slate-700">Aucun programme disponible</h3>
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
                                <div className="group relative h-full">
                                    {/* Glow effect */}
                                    <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-amber-400/20 via-yellow-500/20 to-amber-400/20 opacity-0 blur-lg transition-all duration-500 group-hover:opacity-100"></div>

                                    {/* Main card */}
                                    <div className="relative h-full overflow-hidden rounded-3xl border border-white/20 bg-white/95 shadow-xl shadow-slate-200/50 backdrop-blur-xl transition-all duration-500 group-hover:-translate-y-2 group-hover:shadow-2xl group-hover:shadow-slate-300/60">
                                        {/* Media container avec overlay sophistiqué */}
                                        <div className="relative overflow-hidden">
                                            <div className="relative aspect-[4/3]">
                                                <img
                                                    src={it.image}
                                                    alt={it.title}
                                                    loading="lazy"
                                                    className="absolute inset-0 h-full w-full object-cover transition-all duration-700 group-hover:scale-110"
                                                    onError={(e) => {
                                                        (e.currentTarget as HTMLImageElement).src = '/assets/img/default-course.png';
                                                    }}
                                                />

                                                {/* Sophisticated overlays */}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-80"></div>
                                                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/30 opacity-60"></div>

                                                {/* Premium faculty badge */}
                                                <div className="absolute top-4 left-4 z-20">
                                                    <div className="inline-flex items-center gap-2 rounded-2xl border border-white/40 bg-white/95 px-4 py-2 shadow-lg backdrop-blur-xl">
                                                        <div className="h-2 w-2 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500"></div>
                                                        <span className="text-sm font-bold text-slate-800">{it.facultyName}</span>
                                                    </div>
                                                </div>

                                                {/* Floating stats */}
                                                <div className="absolute top-4 right-4 z-20">
                                                    <div className="flex items-center gap-1.5 rounded-xl border border-white/20 bg-black/20 px-3 py-1.5 text-white backdrop-blur-xl">
                                                        <span className="text-xs font-bold">{it.facultyCode}</span>
                                                    </div>
                                                </div>

                                                {/* Bottom gradient overlay */}
                                                <div className="absolute right-0 bottom-0 left-0 h-24 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                                            </div>
                                        </div>

                                        {/* Content avec spacing parfait */}
                                        <div className="relative p-6">
                                            {/* Title avec typography premium */}
                                            <h3 className="mb-4 line-clamp-2 text-lg leading-tight font-black text-slate-900 transition-colors duration-300 group-hover:text-amber-600 sm:text-xl">
                                                {it.title}
                                            </h3>

                                            {/* Stats grid avec design sophistiqué */}
                                            <div className="mb-6 grid grid-cols-2 gap-4">
                                                <div className="flex items-center gap-3 rounded-2xl border border-blue-100/50 bg-gradient-to-br from-blue-50 to-indigo-50 p-3">
                                                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500">
                                                        <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth="2"
                                                                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0"
                                                            />
                                                        </svg>
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="text-xs font-semibold tracking-wide text-blue-600 uppercase">Places</div>
                                                        <div className="text-sm font-black text-slate-900">{it.places}</div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3 rounded-2xl border border-emerald-100/50 bg-gradient-to-br from-emerald-50 to-green-50 p-3">
                                                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-green-500">
                                                        <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth="2"
                                                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                                            />
                                                        </svg>
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="text-xs font-semibold tracking-wide text-emerald-600 uppercase">Durée</div>
                                                        <div className="text-sm font-black text-slate-900">
                                                            {it.years} an{it.years !== 1 ? 's' : ''}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* CTA avec animation ultra sophistiquée */}
                                            <div className="flex items-center justify-between">
                                                <Link
                                                    href={route('courseShow', it.id)}
                                                    className="group/cta relative inline-flex items-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-500 px-6 py-3.5 text-sm font-black text-white transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-amber-400/40"
                                                >
                                                    {/* Button glow */}
                                                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 transition-opacity duration-300 group-hover/cta:opacity-100"></div>

                                                    <span className="relative z-10">Découvrir</span>

                                                    <div className="relative z-10 flex h-5 w-5 items-center justify-center">
                                                        <svg
                                                            className="h-4 w-4 transition-transform duration-300 group-hover/cta:translate-x-0.5"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth="2.5"
                                                                d="M13 7l5 5-5 5M6 12h12"
                                                            />
                                                        </svg>
                                                    </div>

                                                    {/* Ripple effect */}
                                                    <div className="absolute inset-0 rounded-2xl bg-white/20 opacity-0 group-hover/cta:animate-ping"></div>
                                                </Link>

                                              
                                            </div>
                                        </div>

                                        {/* Subtle border glow */}
                                        <div className="border-gradient-to-r pointer-events-none absolute inset-0 rounded-3xl border from-transparent via-amber-200/30 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>
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
