import DeleteConfirmation from '@/components/admin/DeleteConfirmation';
import CreateFacultyPopup from '@/components/form/CreateFacultyPopup';
import LevelPopup from '@/components/form/LevelPopup';
import Dashboard from '@/components/layouts/Dashboard/Dashboard';
import { useCatalogView } from '@/hooks/use-catalog-view';
import { usePanelFade } from '@/hooks/use-panel-fade';
import LevelCard, { type CatalogLevel } from '@/pages/dashboard/levels/components/LevelCard';
import { Head, useForm } from '@inertiajs/react';
import { Building2, Clock3, GraduationCap, Layers3, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import '../../../../css/dashboard/faculty-detail.css';
import '../../../../css/dashboard/levels-catalog.css';
type Faculty = { id: number; name: string; code: string; description?: string; duration_years: number; is_active: boolean; levels: CatalogLevel[] };
export default function FacultyShow({ faculty }: { faculty: Faculty }) {
    const [view, setView] = useCatalogView({ search: '', status: 'all' });
    const { search, status } = view;
    const [createLevel, setCreateLevel] = useState(false);
    const [editFaculty, setEditFaculty] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const deleteForm = useForm({});
    const deleteFaculty = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (deleteForm.processing) return;
        deleteForm.delete(route('dashboard.admin.faculties.destroy', faculty.id), { preserveScroll: true });
    };
    const normalize = (text: string) =>
        text
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLocaleLowerCase('fr')
            .trim();
    const levels = faculty.levels || [];
    const active = levels.filter((level) => level.is_active).length;
    const filtered = levels.filter(
        (level) =>
            (status === 'all' || (status === 'active' ? !!level.is_active : !level.is_active)) &&
            normalize(`${level.title} ${level.code} ${level.tag || ''}`).includes(normalize(search)),
    );
    const resultsPanel = usePanelFade(filtered.map((level) => level.id).join(','));
    const reset = () => {
        setView({ search: '', status: 'all' });
    };
    return (
        <Dashboard hideAppsNavigation>
            <Head title={`${faculty.name} · Faculté`} />
            <div className="levels-catalog faculty-detail-page">
                <div className="fd-topline">
                    <span>GESTION UNIVERSITAIRE · FACULTÉ</span>
                    <div className="fd-actions">
                        <button
                            className="fd-delete"
                            disabled={deleteForm.processing}
                            onClick={() => {
                                deleteForm.clearErrors();
                                setConfirmDelete(true);
                            }}
                        >
                            <Trash2 size={15} />
                            Supprimer la faculté
                        </button>
                        <button className="fd-edit" onClick={() => setEditFaculty(true)}>
                            <Pencil size={15} />
                            Modifier la faculté
                        </button>
                    </div>
                </div>
                <header className="fd-hero">
                    <div className="fd-hero-copy">
                        <div className="fd-code-row">
                            <span>{faculty.code}</span>
                            <span className={faculty.is_active ? 'fd-status' : 'fd-status is-inactive'}>
                                {faculty.is_active ? 'Faculté active' : 'Faculté inactive'}
                            </span>
                        </div>
                        <h1>{faculty.name}</h1>
                        <p>{faculty.description || 'La présentation de cette faculté reste à compléter.'}</p>
                        <span className="fd-duration">
                            <Clock3 size={15} />
                            {faculty.duration_years} an{faculty.duration_years > 1 ? 's' : ''} de cursus
                        </span>
                    </div>
                    <div className="fd-emblem" aria-hidden="true">
                        <Building2 size={54} strokeWidth={1.1} />
                        <span>UNIVERSITÉ SIMON KIMBANGU</span>
                    </div>
                </header>
                <div className="fd-stats" role="group" aria-label="Aperçu des niveaux de cette faculté">
                    <div>
                        <Layers3 size={22} strokeWidth={1.5} />
                        <p>
                            <strong>{levels.length}</strong>
                            <span>Niveau{levels.length > 1 ? 'x' : ''} de formation</span>
                        </p>
                    </div>
                    <div>
                        <GraduationCap size={22} strokeWidth={1.5} />
                        <p>
                            <strong>{active}</strong>
                            <span>
                                Niveau{active > 1 ? 'x' : ''} actif{active > 1 ? 's' : ''}
                            </span>
                        </p>
                    </div>
                    <div>
                        <Clock3 size={22} strokeWidth={1.5} />
                        <p>
                            <strong>{levels.length - active}</strong>
                            <span>
                                Niveau{levels.length - active > 1 ? 'x' : ''} inactif{levels.length - active > 1 ? 's' : ''}
                            </span>
                        </p>
                    </div>
                </div>
                <section aria-labelledby="faculty-levels-heading">
                    <div className="fd-section-heading">
                        <div>
                            <span>LES PARCOURS DE LA FACULTÉ</span>
                            <h2 id="faculty-levels-heading">Ses niveaux de formation.</h2>
                            <p>Explorez et gérez les parcours rattachés à {faculty.name}.</p>
                        </div>
                        <button className="admin-primary" onClick={() => setCreateLevel(true)}>
                            <Plus size={17} />
                            Nouveau niveau
                        </button>
                    </div>
                    <div className="fd-filters">
                        <label className="levels-search">
                            <Search size={18} />
                            <input
                                type="search"
                                value={search}
                                onChange={(event) => setView((current) => ({ ...current, search: event.target.value }))}
                                aria-label="Rechercher un niveau de cette faculté"
                                placeholder="Rechercher un niveau ou un code…"
                            />
                        </label>
                        <label className="fd-status-select">
                            <span>Statut</span>
                            <select
                                value={status}
                                onChange={(event) => setView((current) => ({ ...current, status: event.target.value }))}
                                aria-label="Filtrer les niveaux par statut"
                            >
                                <option value="all">Tous les statuts</option>
                                <option value="active">Actifs</option>
                                <option value="inactive">Inactifs</option>
                            </select>
                        </label>
                    </div>
                    <div className="levels-results">
                        <span aria-live="polite">
                            {filtered.length} niveau{filtered.length > 1 ? 'x' : ''} dans cette faculté
                        </span>
                        {(search || status !== 'all') && (
                            <button onClick={reset}>
                                <X size={14} />
                                Effacer les filtres
                            </button>
                        )}
                    </div>
                    {filtered.length ? (
                        <div className="levels-cards fd-level-grid" ref={resultsPanel}>
                            {filtered.map((level) => (
                                <LevelCard level={level} key={level.id} />
                            ))}
                        </div>
                    ) : (
                        <div className="levels-empty" ref={resultsPanel}>
                            <GraduationCap size={38} strokeWidth={1.3} />
                            <h2>{levels.length ? 'Aucun niveau ne correspond.' : 'Les premiers parcours commencent ici.'}</h2>
                            <p>
                                {levels.length
                                    ? 'Essayez un autre mot-clé ou un autre statut.'
                                    : 'Ajoutez le premier niveau de formation de cette faculté.'}
                            </p>
                            {levels.length ? (
                                <button onClick={reset}>Voir tous ses niveaux</button>
                            ) : (
                                <button onClick={() => setCreateLevel(true)}>
                                    <Plus size={16} />
                                    Créer un niveau
                                </button>
                            )}
                        </div>
                    )}
                </section>
                {confirmDelete && (
                    <DeleteConfirmation
                        title="Supprimer cette faculté ?"
                        name={faculty.name}
                        detail={`FACULTÉ · ${faculty.code}`}
                        explanation="La faculté sera retirée de votre organisation académique."
                        hint="La suppression est possible uniquement si aucun niveau ni aucune inscription n’est lié à cette faculté."
                        busy={deleteForm.processing}
                        errors={deleteForm.errors}
                        onClose={() => setConfirmDelete(false)}
                        onConfirm={deleteFaculty}
                    />
                )}
                {createLevel && <LevelPopup faculties={{ data: [faculty] }} onClose={() => setCreateLevel(false)} />}
                {editFaculty && <CreateFacultyPopup isEdit faculty={faculty} closeModal={() => setEditFaculty(false)} />}
            </div>
        </Dashboard>
    );
}
