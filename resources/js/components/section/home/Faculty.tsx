import { Link, usePage } from '@inertiajs/react';
import { route } from 'ziggy-js';

type Dept = {
  name: string;
  levels: {length: number};
  description: string;
  href?: string;
  icon: 'law' | 'economics' | 'engineering' | 'health' | 'wellness';
};

// ✅ Tes 6 filières phares (UMK)
const DEPARTMENTS: Dept[] = [
  {
    name: 'Droit & Administration des Affaires',
    levels: 14,
    description: 'Se faire former par les professionnels',
    href: "",
    icon: 'law',
  },
  {
    name: 'Économie & Gestion des Entreprises',
    levels: 18,
    description: 'Venez découvrir un secteur passionnant',
    href: "",
    icon: 'economics',
  },
  {
    name: 'Informatique',
    levels: 16,
    description: 'Rien que la technologie, venez explorer',
    href: "",
    icon: 'engineering',
  },
  {
    name: 'Santé Publique',
    levels: 12,
    description: 'Sauvons le monde, un métier noble',
    href: "",
    icon: 'health',
  },
  {
    name: 'Médecine',
    levels: 10,
    description: 'Libérez votre passion pour la science et votre compassion pour l’humanité dans notre prestigieuse faculté de médecine',
    href: "",
    icon: 'health',
  },
  {
    name: 'Sciences Infirmières',
    levels: 9,
    description: 'Faites une différence tangible dans la vie des patients en tant qu’infirmière qualifiée et accomplie.',
    href: "",
    icon: 'wellness',
  },
];

export default function Faculty() {
  const { props } = usePage();

  const faculties = props.faculties;

  console.log(faculties);

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
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {faculties.data.map((d, i) => (
            <Card key={i} dept={d} />
          ))}
        </div>
      </div>
    </section>
  );
}

function Card({ dept }: { dept: Dept }) {
  const to = dept.href ?? route('courses'); // fallback si la route n'existe pas

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
        <h3 className="line-clamp-2 text-lg font-semibold text-slate-900">{dept.name}</h3>

        {/* Tagline */}
        <p className="mt-2 line-clamp-2 text-sm text-slate-600">{dept.description}</p>

        {/* Meta */}
        <div className="mt-3 flex items-center gap-2 text-sm text-slate-600">
          <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1">
            Formations : {dept.levels.length} niveaux
          </span>
        </div>

        {/* CTA */}
        <div className="mt-5 flex items-center justify-between">
          <span className="text-sm text-slate-500">EN SAVOIR PLUS</span>
          <svg
            className="h-5 w-5 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-slate-700"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden
          >
            <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        {/* Lien étendu */}
        <Link href={to} aria-label={dept.title} className="absolute inset-0" />
      </div>
    </div>
  );
}

/* ----------------- Icônes ----------------- */
function Icon({ name }: { name: Dept['icon'] }) {
  switch (name) {
    case 'law':
      // Balance (Justice)
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M12 4v14M5 10h6l-3 5-3-5Zm8 0h6l-3 5-3-5Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M6 20h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case 'economics':
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M4 12h4v7H4zM10 5h4v14h-4zM16 9h4v10h-4z" fill="currentColor" />
        </svg>
      );
    case 'engineering':
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8z" stroke="currentColor" strokeWidth="1.8" />
          <path d="M2 12h4M18 12h4M12 2v4M12 18v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case 'health':
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M12 21s-7-4.35-7-10a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 5.65-7 10-7 10z" stroke="currentColor" strokeWidth="1.8" />
          <path d="M12 8v4M10 10h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
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
