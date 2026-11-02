import DeleteConfirmation from '@/components/admin/DeleteConfirmation';
import PageHeading from '@/components/admin/PageHeading';
import Pagination from '@/components/admin/Pagination';
import CreateFacultyPopup from '@/components/form/CreateFacultyPopup';
import LevelPopup from '@/components/form/LevelPopup';
import Dashboard from '@/components/layouts/Dashboard/Dashboard';
import Alert from '@/utils/sweetAlert';
import { Link, router, useForm, usePage } from '@inertiajs/react';
import { ArrowUpRight, BookOpen, Building2, ChevronDown, Clock3, Eye, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { route } from 'ziggy-js';
import '../../../../css/dashboard/faculty-catalog.css';

type FacultyLevel = {
    id: number;
    faculty_id: number;
    title: string;
    code: string;
    image?: string;
    tag?: string;
    description?: string;
    is_active?: boolean;
    level_name?: string;
    level_code?: string;
    student_number?: number;
};
type FacultyRecord = {
    id: number;
    name: string;
    code: string;
    duration_years: number;
    description?: string;
    is_active?: boolean;
    levels?: FacultyLevel[];
};
const Faculty = () => {
    const { faculties = { data: [] }, levelCodes = { data: [] } } = usePage().props as {
        faculties: { data: FacultyRecord[] };
        levelCodes: { data: { id: number; code: string }[] };
    };

    // Données fictives si rien ne vient du backend
    const fakeLevelCodes = [
        { id: 1, code: 'L1', name: 'Licence 1' },
        { id: 2, code: 'L2', name: 'Licence 2' },
        { id: 3, code: 'L3', name: 'Licence 3' },
    ];

    const codesToUse = levelCodes?.data?.length ? levelCodes.data : fakeLevelCodes;

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [levelEdit, setLevelEdit] = useState(false);
    const [selectedLevel, setSelectedLevel] = useState<FacultyLevel | null>(null);
    const [search, setSearch] = useState('');
    const [selectedFaculty, setSelectedFaculty] = useState<FacultyRecord | null>(null);

    const openEditModal = (faculty: FacultyRecord) => {
        setIsEdit(true);
        setIsModalOpen(true);
        setSelectedFaculty(faculty);
    };

    const openCreateModal = () => {
        setIsEdit(false);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setIsEdit(false);
        setLevelEdit(false);
        setSelectedFaculty(null);
        setSelectedLevel(null);
    };

    const [pendingDelete, setPendingDelete] = useState<FacultyRecord | null>(null);
    const deleteForm = useForm({});
    const deleteFaculty = (faculty: FacultyRecord) => {
        deleteForm.clearErrors();
        setPendingDelete(faculty);
    };
    const confirmDeleteFaculty = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!pendingDelete || deleteForm.processing) return;
        deleteForm.delete(route('dashboard.admin.faculties.destroy', pendingDelete.id), {
            preserveScroll: true,
            onSuccess: () => {
                setPendingDelete(null);
                Alert.success('Faculté supprimée avec succès.');
            },
        });
    };

    const viewLevel = (level: FacultyLevel) => {
        router.visit(route('dashboard.admin.levels.details.show', level.id));
    };

    const editLevel = (level: FacultyLevel) => {
        setLevelEdit(true);
        setSelectedLevel(level);
    };

    const deleteLevel = async (levelId: number) => {
        const confirmed = await Alert.deleteConfirm('ce niveau');
        if (!confirmed) return;

        Alert.loading('Suppression en cours...');
        router.delete(route('dashboard.admin.levels.destroy', levelId), {
            onSuccess: () => {
                Alert.success('Niveau supprimé avec succès.');
                closeModal();
            },
            onError: () => {
                Alert.error('Une erreur est survenue.');
                closeModal();
            },
            onFinish: () => {
                Alert.close();
            },
        });
    };

    const normalizedSearch = search
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLocaleLowerCase('fr')
        .trim();
    const filtered = faculties.data.filter((faculty) =>
        `${faculty.name} ${faculty.code}`
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLocaleLowerCase('fr')
            .includes(normalizedSearch),
    );
    return (
        <Dashboard>
            <div className="faculty-catalog">
                <PageHeading
                    title="Facultés"
                    description="Une organisation claire, des parcours à portée de main."
                    action={
                        <button type="button" onClick={openCreateModal} className="admin-primary">
                            <Plus size={17} strokeWidth={1.8} />
                            Nouvelle faculté
                        </button>
                    }
                />
                <div className="fc-toolbar">
                    <label className="fc-search">
                        <Search size={18} strokeWidth={1.7} />
                        <input
                            type="search"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Rechercher une faculté ou un code…"
                            aria-label="Rechercher une faculté sur cette page"
                        />
                    </label>
                    <span aria-live="polite">
                        {filtered.length} faculté{filtered.length > 1 ? 's' : ''} sur cette page
                    </span>
                </div>
                <div className="fc-grid">
                    {filtered.map((faculty) => {
                        const levels = faculty.levels || [];
                        return (
                            <article className="fc-card" key={faculty.id}>
                                <div className="fc-card-top">
                                    <span className="fc-faculty-icon">
                                        <Building2 size={25} strokeWidth={1.4} />
                                    </span>
                                    <span className="fc-code">{faculty.code}</span>
                                    <div className="fc-actions">
                                        <button
                                            type="button"
                                            onClick={() => openEditModal(faculty)}
                                            aria-label={`Modifier ${faculty.name}`}
                                            title="Modifier la faculté"
                                        >
                                            <Pencil size={16} strokeWidth={1.7} />
                                        </button>
                                        <button
                                            type="button"
                                            className="fc-delete"
                                            onClick={() => deleteFaculty(faculty)}
                                            aria-label={`Supprimer ${faculty.name}`}
                                            title="Supprimer la faculté"
                                        >
                                            <Trash2 size={16} strokeWidth={1.7} />
                                        </button>
                                    </div>
                                </div>
                                <div className="fc-card-copy">
                                    <h2>
                                        <Link href={route('dashboard.admin.faculties.show', faculty.id)}>{faculty.name}</Link>
                                    </h2>
                                    <p>{faculty.description || 'La présentation de cette faculté reste à compléter.'}</p>
                                </div>
                                <div className="fc-metadata">
                                    <span>
                                        <Clock3 size={15} />
                                        {faculty.duration_years} an{faculty.duration_years > 1 ? 's' : ''} de cursus
                                    </span>
                                    <span className={faculty.is_active === false ? 'is-inactive' : ''}>
                                        {faculty.is_active === false ? 'Inactive' : 'Active'}
                                    </span>
                                </div>
                                <details className="fc-levels">
                                    <summary>
                                        <span>
                                            <BookOpen size={16} strokeWidth={1.6} />
                                            Niveaux de formation
                                        </span>
                                        <span className="fc-level-count">{levels.length}</span>
                                        <ChevronDown size={16} strokeWidth={1.7} />
                                    </summary>
                                    <div className="fc-level-list">
                                        {levels.length ? (
                                            levels.map((level) => (
                                                <div className="fc-level-row" key={level.id}>
                                                    <span className="fc-level-code">{level.code || level.level_code}</span>
                                                    <Link href={route('dashboard.admin.levels.details.show', level.id)}>
                                                        {level.title || level.level_name || 'Niveau de formation'}
                                                    </Link>
                                                    <div className="fc-level-actions">
                                                        <button
                                                            type="button"
                                                            title="Modifier le niveau"
                                                            aria-label={`Modifier ${level.title || level.code}`}
                                                            onClick={() => editLevel(level)}
                                                        >
                                                            <Pencil size={14} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            title="Consulter le niveau"
                                                            aria-label={`Consulter ${level.title || level.code}`}
                                                            onClick={() => viewLevel(level)}
                                                        >
                                                            <Eye size={15} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="fc-delete"
                                                            title="Supprimer le niveau"
                                                            aria-label={`Supprimer ${level.title || level.code}`}
                                                            onClick={() => deleteLevel(level.id)}
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="fc-no-levels">Aucun niveau n’est encore configuré.</p>
                                        )}
                                    </div>
                                </details>
                                <Link className="fc-card-footer" href={route('dashboard.admin.faculties.show', faculty.id)}>
                                    Explorer la faculté
                                    <ArrowUpRight size={17} strokeWidth={1.7} />
                                </Link>
                            </article>
                        );
                    })}
                </div>
                {!filtered.length && (
                    <div className="fc-empty">
                        <Building2 size={34} strokeWidth={1.3} />
                        <h2>{search ? 'Aucune faculté ne correspond.' : 'Vos facultés prennent forme ici.'}</h2>
                        <p>{search ? 'Essayez un autre nom ou un autre code.' : 'Créez votre première faculté pour structurer vos formations.'}</p>
                        {search ? (
                            <button onClick={() => setSearch('')}>Effacer la recherche</button>
                        ) : (
                            <button className="admin-primary" onClick={openCreateModal}>
                                <Plus size={16} />
                                Nouvelle faculté
                            </button>
                        )}
                    </div>
                )}
                <Pagination value={faculties} />
                {pendingDelete && (
                    <DeleteConfirmation
                        title="Supprimer cette faculté ?"
                        name={pendingDelete.name}
                        detail={`FACULTÉ · ${pendingDelete.code}`}
                        explanation="La faculté sera retirée de votre organisation académique."
                        hint="La suppression est possible uniquement si aucun niveau ni aucune inscription n’est lié à cette faculté."
                        busy={deleteForm.processing}
                        errors={deleteForm.errors}
                        onClose={() => setPendingDelete(null)}
                        onConfirm={confirmDeleteFaculty}
                    />
                )}

                {/* Modal */}
                {isModalOpen && <CreateFacultyPopup isEdit={isEdit} closeModal={closeModal} faculty={selectedFaculty} />}

                {/* Level Edit Modal */}
                {levelEdit && <LevelPopup faculties={faculties} onClose={closeModal} level={selectedLevel} levelCodes={codesToUse} />}
            </div>
        </Dashboard>
    );
};

export default Faculty;
