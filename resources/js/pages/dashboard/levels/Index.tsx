import PageHeading from '@/components/admin/PageHeading';
import Pagination from '@/components/admin/Pagination';
import LevelPopup from '@/components/form/LevelPopup';
import Dashboard from '@/components/layouts/Dashboard/Dashboard';
import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowRight, BookOpen, Building2, Check, Layers3, Plus, Search, SlidersHorizontal, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import '../../../../css/dashboard/levels-catalog.css';
import LevelCard from './components/LevelCard';

type Level = {
    id: number;
    title: string;
    code: string;
    image?: string | null;
    description?: string | null;
    tag?: string | null;
    is_active?: boolean | number;
};
type Faculty = { id: number; name: string; code?: string; duration_years?: number; levels?: Level[] };
type FacultyPage = { data: Faculty[]; total?: number };
const normalize = (value: string) =>
    value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLocaleLowerCase('fr')
        .trim();
export default function LevelsIndex() {
    const { faculties, levelCodes } = usePage().props as unknown as {
        faculties?: FacultyPage;
        levelCodes?: { data?: { id?: number | string; code: string }[] };
    };
    const allFaculties = useMemo(() => faculties?.data || [], [faculties]);
    const [selectedFaculties, setSelectedFaculties] = useState<number[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [filtersOpen, setFiltersOpen] = useState(false);
    const query = normalize(search);
    const totalLevels = allFaculties.reduce((sum, faculty) => sum + (faculty.levels?.length || 0), 0);
    const visible = allFaculties
        .filter((faculty) => !selectedFaculties.length || selectedFaculties.includes(faculty.id))
        .map((faculty) => {
            const facultyMatches = normalize(`${faculty.name} ${faculty.code || ''}`).includes(query);
            const levels = (faculty.levels || []).filter(
                (level) => !query || facultyMatches || normalize(`${level.title} ${level.code} ${level.tag || ''}`).includes(query),
            );
            return { ...faculty, levels };
        })
        .filter((faculty) => !query || faculty.levels.length || normalize(`${faculty.name} ${faculty.code || ''}`).includes(query));
    const visibleCount = visible.reduce((sum, faculty) => sum + faculty.levels.length, 0);
    const filtered = Boolean(query || selectedFaculties.length);
    const reset = () => {
        setSearch('');
        setSelectedFaculties([]);
    };
    const toggle = (id: number) =>
        setSelectedFaculties((current) => (current.includes(id) ? current.filter((value) => value !== id) : [...current, id]));

    return (
        <Dashboard>
            <Head title="Niveaux et formations" />
            <div className="levels-catalog">
                <PageHeading
                    title="Niveaux et formations"
                    description="Une vue claire de vos parcours, organisés par faculté."
                    action={
                        <button className="admin-primary" onClick={() => setIsOpen(true)}>
                            <Plus size={18} strokeWidth={1.8} />
                            Nouveau niveau
                        </button>
                    }
                />
                <div className="levels-overview" aria-label="Aperçu des formations de cette page">
                    <div>
                        <span className="levels-overview-icon">
                            <Building2 size={21} strokeWidth={1.6} />
                        </span>
                        <p>
                            <strong>{allFaculties.length}</strong>
                            <span>Faculté{allFaculties.length > 1 ? 's' : ''} sur cette page</span>
                        </p>
                    </div>
                    <div>
                        <span className="levels-overview-icon">
                            <Layers3 size={21} strokeWidth={1.6} />
                        </span>
                        <p>
                            <strong>{totalLevels}</strong>
                            <span>Niveau{totalLevels > 1 ? 'x' : ''} de formation</span>
                        </p>
                    </div>
                    <div className="levels-overview-note">
                        <BookOpen size={21} strokeWidth={1.6} />
                        <p>
                            Des parcours structurés.
                            <br />
                            <strong>Chaque niveau à sa place.</strong>
                        </p>
                    </div>
                </div>
                <section className="levels-filter-panel" aria-label="Rechercher et filtrer les niveaux">
                    <div className="levels-toolbar">
                        <label className="levels-search">
                            <Search size={19} strokeWidth={1.7} />
                            <input
                                type="search"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Rechercher un niveau, un code ou une faculté…"
                                aria-label="Rechercher parmi les niveaux de cette page"
                            />
                        </label>
                        <button
                            className={`levels-filter-toggle ${filtersOpen || selectedFaculties.length ? 'is-active' : ''}`}
                            aria-expanded={filtersOpen}
                            aria-controls="levels-faculty-filters"
                            onClick={() => setFiltersOpen(!filtersOpen)}
                        >
                            <SlidersHorizontal size={17} />
                            Facultés{selectedFaculties.length > 0 && <span>{selectedFaculties.length}</span>}
                        </button>
                    </div>
                    {filtersOpen && (
                        <div className="levels-filter-options" id="levels-faculty-filters" role="group" aria-label="Filtrer par faculté">
                            <button
                                className={!selectedFaculties.length ? 'is-selected' : ''}
                                aria-pressed={!selectedFaculties.length}
                                onClick={() => setSelectedFaculties([])}
                            >
                                Toutes les facultés
                            </button>
                            {allFaculties.map((faculty) => (
                                <button
                                    key={faculty.id}
                                    className={selectedFaculties.includes(faculty.id) ? 'is-selected' : ''}
                                    aria-pressed={selectedFaculties.includes(faculty.id)}
                                    onClick={() => toggle(faculty.id)}
                                >
                                    {selectedFaculties.includes(faculty.id) && <Check size={14} />}
                                    {faculty.name}
                                    <span>{faculty.levels?.length || 0}</span>
                                </button>
                            ))}
                        </div>
                    )}
                    <div className="levels-results">
                        <span aria-live="polite">
                            {visibleCount} niveau{visibleCount > 1 ? 'x' : ''} · {visible.length} faculté{visible.length > 1 ? 's' : ''}
                            {filtered ? ' dans cette sélection' : ' sur cette page'}
                        </span>
                        {filtered && (
                            <button onClick={reset}>
                                <X size={14} />
                                Effacer les filtres
                            </button>
                        )}
                    </div>
                </section>
                <div className="levels-faculty-list">
                    {visible.map((faculty, index) => (
                        <section className="levels-faculty-section" key={faculty.id} aria-labelledby={`faculty-${faculty.id}`}>
                            <header className="levels-faculty-header">
                                <div className="levels-faculty-number">{String(index + 1).padStart(2, '0')}</div>
                                <div className="levels-faculty-title">
                                    <span>{faculty.code || 'OFFRE DE FORMATION'}</span>
                                    <h2 id={`faculty-${faculty.id}`}>{faculty.name}</h2>
                                </div>
                                <span className="levels-faculty-count">
                                    <Layers3 size={15} />
                                    {faculty.levels.length} niveau{faculty.levels.length > 1 ? 'x' : ''}
                                </span>
                            </header>
                            {faculty.levels.length ? (
                                <div className="levels-cards">
                                    {faculty.levels.map((level) => (
                                        <LevelCard key={level.id} level={level} />
                                    ))}
                                </div>
                            ) : (
                                <div className="levels-faculty-empty">
                                    <BookOpen size={24} strokeWidth={1.5} />
                                    <div>
                                        <strong>Les parcours prennent forme.</strong>
                                        <p>Aucun niveau n’est encore configuré pour cette faculté.</p>
                                    </div>
                                    <button onClick={() => setIsOpen(true)}>
                                        <Plus size={16} />
                                        Créer un niveau
                                    </button>
                                </div>
                            )}
                        </section>
                    ))}
                    {!visible.length && (
                        <div className="levels-empty">
                            <Search size={32} strokeWidth={1.4} />
                            <h2>{filtered ? 'Aucun parcours ne correspond.' : 'Votre offre de formation commence ici.'}</h2>
                            <p>
                                {filtered
                                    ? 'Essayez un autre mot-clé ou élargissez votre sélection de facultés.'
                                    : 'Ajoutez une faculté, puis créez ses premiers niveaux de formation.'}
                            </p>
                            {filtered ? (
                                <button onClick={reset}>
                                    Voir tous les niveaux
                                    <ArrowRight size={17} />
                                </button>
                            ) : (
                                <Link href={route('dashboard.admin.faculties.index')}>
                                    Gérer les facultés
                                    <ArrowRight size={17} />
                                </Link>
                            )}
                        </div>
                    )}
                </div>
                <Pagination value={faculties} />
                {isOpen && <LevelPopup onClose={() => setIsOpen(false)} faculties={faculties || { data: [] }} levelCodes={levelCodes?.data || []} />}
            </div>
        </Dashboard>
    );
}
