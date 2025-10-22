import { Link } from '@inertiajs/react';
import { route } from 'ziggy-js';

type Dept = {
    title: string;
    programs: number;
    href?: string;
    icon: 'economics' | 'health' | 'engineering' | 'math' | 'science' | 'marketing' | 'wellness' | 'research';
};

const DEPARTMENTS: Dept[] = [
    { title: 'Sciences Économiques', programs: 20, icon: 'economics' },
    { title: 'Médecine & Santé', programs: 22, icon: 'health' },
    { title: 'Ingénierie & Numérique', programs: 18, icon: 'engineering' },
    { title: 'Mathématiques Fondamentales', programs: 26, icon: 'math' },
    { title: 'Sciences Expérimentales', programs: 22, icon: 'science' },
    { title: 'Marketing & Communication', programs: 20, icon: 'marketing' },
    { title: 'Recherche Avancée', programs: 17, icon: 'research' },
    { title: 'Santé & Bien-être', programs: 18, icon: 'wellness' },
];

export default function Faculty() {
    return (
        <section className="relative overflow-hidden bg-gradient-to-b from-white to-slate-50 py-20 md:py-24">
            {/* Shapes décoratives */}
            <img
                src="/assets/img/shape/stamp.png"
                alt=""
                className="pointer-events-none absolute -top-10 -left-10 h-40 w-40 opacity-20 md:h-56 md:w-56"
            />
            <img
                src="/assets/img/shape/cap.png"
                alt=""
                className="pointer-events-none absolute -right-10 bottom-0 h-40 w-40 opacity-20 md:h-56 md:w-56"
            />

            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mx-auto mb-10 max-w-2xl text-center md:mb-14">
                    <span className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium tracking-wider text-slate-600 uppercase">
                        Nos domaines d&apos;excellence
                    </span>
                    <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">Nos filières phares</h2>
                    <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600 md:text-base">
                        Découvrez un éventail de programmes pensés pour vos objectifs académiques et professionnels.
                    </p>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {DEPARTMENTS.map((d, i) => (
                        <Card key={i} dept={d} />
                    ))}
                </div>
            </div>
        </section>
    );
}

function Card({ dept }: { dept: Dept }) {
    const to = dept.href ?? route('courses'); // ajuste la route si besoin

    return (
        <div className="group relative">
            {/* Card */}
            <div className="relative h-full overflow-hidden rounded-2xl border border-slate-200/70 bg-white p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-900/5">
                {/* Accent gradient */}
                <div className="pointer-events-none absolute -inset-x-1 -top-1 h-1 rounded-t-2xl bg-gradient-to-r from-amber-500 via-yellow-500 to-yellow-400 opacity-0 transition group-hover:opacity-100" />

                {/* Icon */}
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-600 to-yellow-500 text-white shadow-sm">
                    <Icon name={dept.icon} />
                </div>

                {/* Title */}
                <h3 className="line-clamp-2 text-lg font-semibold text-slate-900">{dept.title}</h3>

                {/* Meta */}
                <div className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                    <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1">Formations : {dept.programs} programmes</span>
                </div>

                {/* CTA */}
                <div className="mt-5 flex items-center justify-between">
                    <span className="text-sm text-slate-500">En savoir plus</span>
                    <svg
                        className="h-5 w-5 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-slate-700"
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-hidden
                    >
                        <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>

                {/* Stretched link */}
                <Link href={to} aria-label={dept.title} className="absolute inset-0">
                    {/* empty */}
                </Link>
            </div>
        </div>
    );
}

/* ----------------- Icons (quelques variantes légères) ----------------- */
function Icon({ name }: { name: Dept['icon'] }) {
    switch (name) {
        case 'economics':
            return (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M4 12h4v7H4zM10 5h4v14h-4zM16 9h4v10h-4z" fill="currentColor" />
                </svg>
            );
        case 'health':
            return (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M12 21s-7-4.35-7-10a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 5.65-7 10-7 10z" stroke="currentColor" strokeWidth="1.8" />
                    <path d="M12 8v4M10 10h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
            );
        case 'engineering':
            return (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8z" stroke="currentColor" strokeWidth="1.8" />
                    <path d="M2 12h4M18 12h4M12 2v4M12 18v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
            );
        case 'math':
            return (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M4 7h6M7 4v6M14 4l6 6M14 10l6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
            );
        case 'science':
            return (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M9 3v4l-5 9a3 3 0 0 0 3 5h10a3 3 0 0 0 3-5l-5-9V3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    <path d="M9 7h6" stroke="currentColor" strokeWidth="1.8" />
                </svg>
            );
        case 'marketing':
            return (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M3 11h9l6-4v10l-6-4H3v-2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    <circle cx="18" cy="12" r="1" fill="currentColor" />
                </svg>
            );
        case 'research':
            return (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="1.8" />
                    <path d="M20 20l-3.2-3.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
            );
        case 'wellness':
            return (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M12 21c4-2.5 7-5.5 7-9a5 5 0 0 0-9-3 5 5 0 0 0-9 3c0 3.5 3 6.5 7 9" stroke="currentColor" strokeWidth="1.8" />
                </svg>
            );
        default:
            return null;
    }
}
