import PageHeading from '@/components/admin/PageHeading';
import Pagination from '@/components/admin/Pagination';
import LevelPopup from '@/components/form/LevelPopup';
import Dashboard from '@/components/layouts/Dashboard/Dashboard';
import { useCatalogView } from '@/hooks/use-catalog-view';
import { usePanelFade } from '@/hooks/use-panel-fade';
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
    const [view, setView] = useCatalogView({ search: '', selectedFaculties: [] as number[], filtersOpen: false });
    const { search, selectedFaculties, filtersOpen } = view;
    const { faculties, levelCodes } = usePage().props as unknown as {
        faculties?: FacultyPage;
        levelCodes?: { data?: { id?: number | string; code: string }[] };
    };
    const allFaculties = useMemo(() => faculties?.data || [], [faculties]);

    const [isOpen, setIsOpen] = useState(false);

    const query = normalize(search);
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
    const resultsPanel = usePanelFade(visible.map((faculty) => `${faculty.id}:${faculty.levels.map((level) => level.id).join(',')}`).join('|'));
    const visibleCount = visible.reduce((sum, faculty) => sum + faculty.levels.length, 0);
    const filtered = Boolean(query || selectedFaculties.length);
    const reset = () => {
        setView((current) => ({ ...current, search: '', selectedFaculties: [] }));
    };
    const toggle = (id: number) =>
        setView((current) => ({
            ...current,
            selectedFaculties: selectedFaculties.includes(id) ? selectedFaculties.filter((value) => value !== id) : [...selectedFaculties, id],
        }));

    return (
        <Dashboard hideAppsNavigation>
            <Head title="Niveaux et formations" />
            <div className="levels-catalog levels-index">
                <PageHeading
                    title="Niveaux et formations"
                    description="Retrouvez les niveaux de formation et ouvrez leur fiche pour les gérer."
                    action={
                        <button className="admin-primary" onClick={() => setIsOpen(true)}>
                            <Plus size={18} strokeWidth={1.8} />
                            Nouveau niveau
                        </button>
                    }
                />
                <section className="levels-filter-panel" aria-label="Rechercher et filtrer les niveaux">
                    <div className="levels-toolbar">
                        <label className="levels-search">
                            <Search size={19} strokeWidth={1.7} />
                            <input
                                type="search"
                                value={search}
                                onChange={(e) => setView((current) => ({ ...current, search: e.target.value }))}
                                placeholder="Niveau, code ou faculté…"
                                aria-label="Rechercher parmi les niveaux de cette page"
                            />
                        </label>
                        <button
                            className={`levels-filter-toggle ${filtersOpen || selectedFaculties.length ? 'is-active' : ''}`}
                            aria-expanded={filtersOpen}
                            aria-controls="levels-faculty-filters"
                            onClick={() => setView((current) => ({ ...current, filtersOpen: !current.filtersOpen }))}
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
                                onClick={() => setView((current) => ({ ...current, selectedFaculties: [] }))}
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
                <div className="levels-faculty-list" ref={resultsPanel}>
                    {visible.map((faculty) => (
                        <section className="levels-faculty-section" key={faculty.id} aria-labelledby={`faculty-${faculty.id}`}>
                            <header className="levels-faculty-header">
                                <span className="levels-faculty-icon">
                                    <Building2 size={20} aria-hidden="true" />
                                </span>
                                <div className="levels-faculty-title">
                                    {faculty.code && <span>{faculty.code}</span>}
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
                                        <LevelCard key={level.id} level={level} compact />
                                    ))}
                                </div>
                            ) : (
                                <div className="levels-faculty-empty">
                                    <BookOpen size={24} strokeWidth={1.5} />
                                    <div>
                                        <strong>Aucun niveau dans cette faculté</strong>
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
                            <h2>{filtered ? 'Aucun niveau ne correspond' : 'Aucune faculté disponible'}</h2>
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
