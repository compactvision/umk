import LevelPopup from '@/components/form/LevelPopup';
import Dashboard from '@/components/layouts/Dashboard/Dashboard';
import Alert from '@/utils/sweetAlert';
import { Link, router, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';
import './Faculties.css';
import CreateFacultyPopup from '@/components/form/CreateFacultyPopup';

const Faculty = () => {
    const { faculties = { data: [] }, levelCodes = { data: [] } } = usePage().props;

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
    const [selectedLevel, setSelectedLevel] = useState(null);
    const [hoveredCard, setHoveredCard] = useState<number | null>(null);
    const [selectedFaculty, setSelectedFaculty] = useState(null);

    const openEditModal = (faculty: any) => {
        setIsEdit(true);
        setIsModalOpen(true);
        setSelectedFaculty(faculty);
    };

    const openCreateModal = () => {
        setIsEdit(false);
        setIsModalOpen(true);
        document.body.style.overflow = 'hidden';
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setIsEdit(false);
        setLevelEdit(false);
        setSelectedFaculty(null);
        document.body.style.overflow = 'auto';
    };

    const deleteFaculty = async (id: number) => {
        const confirmed = await Alert.deleteConfirm('cette faculté');
        if (!confirmed) return;

        Alert.loading('Suppression en cours...');
        router.delete(route('dashboard.admin.faculties.destroy', id), {
            onSuccess: () => {
                Alert.success('Faculté supprimée avec succès.');
            },
            onError: () => {
                Alert.error('Une erreur est survenue.');
            },
            onFinish: () => {
                Alert.close();
            },
        });
    };

    const viewLevel = (level: any) => {
        router.visit(route('dashboard.admin.levels.show', level))
    };

    const editLevel = (level: any) => {
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

    return (
        <Dashboard>
            <div className="container">
                <div className="headerr">
                    <h1>🎓 Gestion des Facultés</h1>
                    <p>Créez et gérez les facultés avec leurs niveaux d'études</p>
                </div>

                <div style={{ textAlign: 'center', marginTop: '20px' }}>
                    <button className="create-btn" onClick={openCreateModal}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                            <g
                                fill="none"
                                stroke="currentColor"
                                strokeDasharray="16"
                                strokeDashoffset="16"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                            >
                                <path d="M5 12h14">
                                    <animate fill="freeze" attributeName="stroke-dashoffset" dur="0.4s" values="16;0" />
                                </path>
                                <path d="M12 5v14">
                                    <animate fill="freeze" attributeName="stroke-dashoffset" begin="0.4s" dur="0.4s" values="16;0" />
                                </path>
                            </g>
                        </svg>
                        <p>Créer une nouvelle faculté</p>
                    </button>
                </div>

                <div className="faculties-grid">
                    {!faculties?.data || faculties.data.length === 0 ? (
                        <div className="empty-state">
                            <h3>Aucune faculté créée</h3>
                            <p>Cliquez sur "Créer une nouvelle faculté" pour commencer</p>
                        </div>
                    ) : (
                        faculties.data.map((faculty: any) => {
                            const levels = faculty.levels || [];
                            return (
                                <div
                                    className="faculty-card-container"
                                    key={faculty.id}
                                    onMouseEnter={() => setHoveredCard(faculty.id)}
                                    onMouseLeave={() => setHoveredCard(null)}
                                >
                                    <div className={`faculty-card ${hoveredCard === faculty.id ? 'hovered' : ''}`}>
                                        <div className="faculty-header">
                                            <div>
                                                <Link href={route('dashboard.admin.faculties.show', faculty.id)} className="faculty-name">
                                                    {faculty.name}
                                                </Link>
                                                <div className="faculty-code">{faculty.code}</div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '10px' }}>
                                                <button className="btn edit-btn" onClick={() => openEditModal(faculty)}>
                                                    ✏️
                                                </button>
                                                <button className="btn delete-btn" onClick={() => deleteFaculty(faculty.id)}>
                                                    🗑️
                                                </button>
                                            </div>
                                        </div>
                                        <div className="faculty-description">
                                            <p>{faculty.description}</p>
                                            <span className="duration">Durée: {faculty.duration_years} ans</span>
                                        </div>
                                    </div>

                                    {/* Levels Submenu */}
                                    <div className={`levels-submenu ${hoveredCard === faculty.id ? 'show' : ''}`}>
                                        <div className="submenu-header">
                                            <div className="submenu-title">
                                                <span className="levels-icon">📚</span>
                                                <span>Niveaux d'études</span>
                                            </div>
                                            <div className="submenu-count">
                                                {levels.length} niveau{levels.length > 1 ? 'x' : ''}
                                            </div>
                                        </div>

                                        <div className="levels-list">
                                            {levels.length === 0 ? (
                                                <div className="no-levels">
                                                    <span>Aucun niveau configuré</span>
                                                </div>
                                            ) : (
                                                levels.map((level: any, index: number) => (
                                                    <div key={level.id} className="level-item" style={{ animationDelay: `${index * 0.1}s` }}>
                                                        <div className="level-info">
                                                            <div className="level-name">{level.level_name}</div>
                                                            <div className="level-code">{level.level_code}</div>
                                                            <div className="level-students">
                                                                <span className="student-icon">👥</span>
                                                                {level.student_number} étudiants
                                                            </div>
                                                        </div>
                                                        <div className="level-actions">
                                                            <button className="level-btn edit-btn" onClick={() => editLevel(level)} title="Modifier">
                                                                ✏️
                                                            </button>
                                                            <button className="level-btn view-btn" onClick={() => viewLevel(level)} title="Voir">
                                                                👁
                                                            </button>
                                                            <button
                                                                className="level-btn delete-btn"
                                                                onClick={() => deleteLevel(level.id)}
                                                                title="Supprimer"
                                                            >
                                                                🗑️
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Modal */}
                {isModalOpen && (
                    <CreateFacultyPopup isEdit={isEdit} closeModal={closeModal} faculty={selectedFaculty}/>
                )}

                {levelEdit && (
                    <LevelPopup faculties={faculties} onClose={closeModal} level={selectedLevel} levelCodes={codesToUse} />
                )}
            </div>
        </Dashboard>
    );
};

export default Faculty;
