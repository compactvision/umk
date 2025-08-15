import Dashboard from '@/components/layouts/Dashboard/Dashboard';
import { useState } from 'react';
import { Link } from '@inertiajs/react';
import { useForm, router, usePage } from '@inertiajs/react';
import ErrorText from '@/components/UI/ErrorText';
import Alert from '@/utils/sweetAlert';
import LevelPopup from '@/components/form/LevelPopup';

const Faculty = () => {
    const { faculties, levelCodes } = usePage().props;

    console.log(faculties, levelCodes);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [levelEdit, setLevelEdit] = useState(false)
    const [selectedLevel, setSelectedLevel] = useState(null)
    const [hoveredCard, setHoveredCard] = useState(null);

    const { data, setData, errors, post, put, processing, reset } = useForm({
        name: '',
        code: '',
        description: '',
        duration_years: '',
        is_active: true,
    });

    const openModal = () => {
        setIsModalOpen(true);
        document.body.style.overflow = 'hidden';
    };

    const openEditModal = (faculty) => {
        setIsEdit(true);
        setData({
            id: faculty.id,
            name: faculty.name,
            code: faculty.code,
            description: faculty.description,
            duration_years: faculty.duration_years,
            is_active: faculty.is_active
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setIsEdit(false)
        setLevelEdit(false)
        document.body.style.overflow = 'auto';
        reset();
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if(isEdit){
            Alert.loading('Mise à jour en cours...');
            put(route('dashboard.faculties.update', data.id), {
                onSuccess: () => {
                    Alert.success("Faculté mise à jour avec succès!")
                    closeModal();
                },
                onError: (errors) => {
                    console.error('Erreurs:', errors)
                    Alert.error("Une erreur s'est produite");
                    Alert.close();
                },
                onFinish: () => {
                    Alert.close();
                }
            })
        } else {
            post(route('dashboard.faculties.store'), {
                onSuccess: () => {
                    Alert.success("Faculté créée avec succès!")
                    reset();
                    closeModal();
                },
                onError: (errors) => {
                    console.error('Erreurs:', errors);
                    Alert.error("Une erreur s'est produite");
                },
            });
        }
    };

    const deleteFaculty = async (id) => {
        const confirmed = await Alert.deleteConfirm('cette faculté');
        if (!confirmed) return;

        Alert.loading('Suppression en cours...');
        router.delete(`/dashboard/faculties/${id}`, {
            onSuccess: () => {
                Alert.success('Faculté supprimée avec succès.');
            },
            onError: (errors) => {
                console.error(errors);
                Alert.error('Une erreur est survenue.');
            },
            onFinish: () => {
                Alert.close();
            }
        });
    };

    const viewLevel = (level) => {
        router.visit(route('dashboard.levels.show', level))
    };

    const editLevel = (level) => {
        setLevelEdit(true)
        setSelectedLevel(level)
    }

    const deleteLevel = async (levelId) => {
        const confirmed = await Alert.deleteConfirm('ce niveau');
        if (!confirmed) return;

        Alert.loading('Suppression en cours...');
        router.delete(`/dashboard/levels/${levelId}`, {
            onSuccess: () => {
                Alert.success('Niveau supprimé avec succès.');
                closeModal();
            },
            onError: (errors) => {
                console.error(errors);
                Alert.error('Une erreur est survenue.');
                closeModal();
            },
            onFinish: () => {
                Alert.close();
            }
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
                    <button className="create-btn" onClick={openModal}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                            <g fill="none" stroke="currentColor" strokeDasharray="16" strokeDashoffset="16" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
                                <path d="M5 12h14">
                                    <animate fill="freeze" attributeName="stroke-dashoffset" dur="0.4s" values="16;0"/>
                                </path>
                                <path d="M12 5v14">
                                    <animate fill="freeze" attributeName="stroke-dashoffset" begin="0.4s" dur="0.4s" values="16;0"/>
                                </path>
                            </g>
                        </svg>
                        <p>Créer une nouvelle faculté</p>
                    </button>
                </div>

                <div className="faculties-grid">
                    {Array.isArray(faculties?.data) && faculties.data.length === 0 ? (
                        <div className="empty-state">
                            <h3>Aucune faculté créée</h3>
                            <p>Cliquez sur "Créer une nouvelle faculté" pour commencer</p>
                        </div>
                    ) : (
                        Array.isArray(faculties?.data) &&
                        faculties.data.map((faculty) => {
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
                                                <Link href={route('dashboard.levels.index')} className="faculty-name">{faculty.name}</Link>
                                                <div className="faculty-code">{faculty.code}</div>
                                            </div>
                                            <div style={{display: "flex", gap: "10px"}}>
                                                <button className="btn edit-btn" onClick={() => openEditModal(faculty)}>
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><path fill="currentColor" d="M10.529 1.764a2.621 2.621 0 1 1 3.707 3.707l-.779.779L9.75 2.543zM9.043 3.25L2.657 9.636a2.96 2.96 0 0 0-.772 1.354l-.87 3.386a.5.5 0 0 0 .61.608l3.385-.869a2.95 2.95 0 0 0 1.354-.772l6.386-6.386z"/></svg>
                                                </button>
                                                <button className="btn delete-btn" onClick={() => deleteFaculty(faculty.id)}>
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 512 512"><rect width="448" height="80" x="32" y="48" fill="currentColor" rx="32" ry="32"/><path fill="currentColor" d="M74.45 160a8 8 0 0 0-8 8.83l26.31 252.56a1.5 1.5 0 0 0 0 .22A48 48 0 0 0 140.45 464h231.09a48 48 0 0 0 47.67-42.39v-.21l26.27-252.57a8 8 0 0 0-8-8.83Zm248.86 180.69a16 16 0 1 1-22.63 22.62L256 318.63l-44.69 44.68a16 16 0 0 1-22.63-22.62L233.37 296l-44.69-44.69a16 16 0 0 1 22.63-22.62L256 273.37l44.68-44.68a16 16 0 0 1 22.63 22.62L278.62 296Z"/></svg>
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
                                                levels.map((level, index) => (
                                                    <div
                                                        key={level.id}
                                                        className="level-item"
                                                        style={{ animationDelay: `${index * 0.1}s` }}
                                                    >
                                                        <div className="level-info">
                                                            <div className="level-name">{level.level_name}</div>
                                                            <div className="level-code">{level.level_code}</div>
                                                            <div className="level-students">
                                                                <span className="student-icon">👥</span>
                                                                {level.student_number} étudiants
                                                            </div>
                                                        </div>
                                                        <div className="level-actions">
                                                            <button
                                                                className="level-btn edit-btn"
                                                                onClick={() => editLevel(level)}
                                                                title="Voir le niveau"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 16 16"><path fill="currentColor" d="M14.236 1.764a2.62 2.62 0 0 0-3.707 0L2.657 9.636a2.96 2.96 0 0 0-.772 1.354l-.87 3.386a.5.5 0 0 0 .61.608l3.385-.869a2.95 2.95 0 0 0 1.354-.772l7.872-7.872a2.62 2.62 0 0 0 0-3.707m-3 .707a1.621 1.621 0 1 1 2.293 2.293l-.779.779l-2.293-2.293zM9.75 3.957l2.293 2.293l-6.386 6.386a1.95 1.95 0 0 1-.896.51l-2.567.66l.66-2.567a1.94 1.94 0 0 1 .51-.896z"/></svg>
                                                            </button>
                                                            <button
                                                                className="level-btn view-btn"
                                                                onClick={() => viewLevel(level)}
                                                                title="Voir le niveau"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24">
                                                                    <path fill="#fff" d="M12 9a3 3 0 0 0-3 3a3 3 0 0 0 3 3a3 3 0 0 0 3-3a3 3 0 0 0-3-3m0 8a5 5 0 0 1-5-5a5 5 0 0 1 5-5a5 5 0 0 1 5 5a5 5 0 0 1-5 5m0-12.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5Z"/>
                                                                </svg>
                                                            </button>
                                                            <button
                                                                className="level-btn delete-btn"
                                                                onClick={() => deleteLevel(level.id)}
                                                                title="Supprimer le niveau"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24">
                                                                    <path fill="currentColor" d="M19 4h-3.5l-1-1h-5l-1 1H5v2h14M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12Z"/>
                                                                </svg>
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
                    <div className="modall" onClick={(e) => e.target.className === 'modal' && closeModal()}>
                        <div className="modal-content">
                            <div className="modal-header">
                                <h2>{isEdit ? data.name : "🏛️ Nouvelle Faculté"}</h2>
                                <p>{isEdit ? "Modifiez " : "Remplissez "} les informations de la faculté</p>
                            </div>

                            <form onSubmit={handleSubmit}>
                                <div className="form-group">
                                    <label htmlFor="name">Nom de la faculté</label>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        placeholder="Ex: Faculté de Médecine"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        required
                                    />
                                    <ErrorText error={errors.name} />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="code">Code de la faculté</label>
                                    <input
                                        type="text"
                                        id="code"
                                        name="code"
                                        placeholder="Ex: MED"
                                        value={data.code}
                                        onChange={(e) => setData('code', e.target.value.toUpperCase())}
                                        maxLength={10}
                                        required
                                    />
                                    <ErrorText error={errors.code} />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="duration_years">Durée de la faculté (en années)</label>
                                    <input
                                        type="number"
                                        id="duration_years"
                                        name="duration_years"
                                        placeholder="4"
                                        min="1"
                                        max="10"
                                        value={data.duration_years}
                                        onChange={(e) => setData('duration_years', e.target.value)}
                                        required
                                    />
                                    <ErrorText error={errors.duration_years} />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="description">Description</label>
                                    <textarea
                                        id="description"
                                        name="description"
                                        placeholder="Courte présentation de la faculté"
                                        rows={7}
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                    ></textarea>
                                    <ErrorText error={errors.description} />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="name">Status</label>
                                    <label className="toggle-switch">
                                        <input
                                            type="checkbox"
                                            className="toggle-switch__checkbox"
                                            checked={data.is_active}
                                            onChange={(e) => setData('is_active', e.target.checked)}
                                        />
                                        <span className="toggle-switch__slider"></span>
                                    </label>
                                </div>

                                <div className="modal-actions">
                                    <button type="button" className="btn btn-secondary" onClick={closeModal}
                                            disabled={processing}>
                                        Annuler
                                    </button>
                                    <button type="submit" className="btn btn-primary" disabled={processing}>
                                        {processing
                                            ? (isEdit ? 'Mise à jour...' : 'Création...')
                                            : (isEdit ? 'Mettre à jour la faculté' : 'Créer la faculté')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {levelEdit && (
                    <LevelPopup faculties={faculties} onClose={closeModal} isOpen={levelEdit} level={selectedLevel} levelCodes={levelCodes?.data}/>
                )}

                <style>{`
                    .headerr {
                        text-align: center;
                        margin-bottom: 40px;
                    }

                    .headerr h1 {
                        font-size: 2.5rem;
                        color: #2d3748;
                        margin-bottom: 10px;
                        font-weight: 700;
                    }

                    .headerr p {
                        color: #718096;
                        font-size: 1.1rem;
                    }

                    .create-btn {
                        background: linear-gradient(135deg, #4f46e5, #7c3aed);
                        color: white;
                        border: none;
                        padding: 15px 30px;
                        border-radius: 12px;
                        font-size: 1.1rem;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        box-shadow: 0 8px 20px rgba(79, 70, 229, 0.3);
                        margin-bottom: 30px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 10px;
                        margin: 0 auto;
                    }

                    .create-btn:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 12px 25px rgba(79, 70, 229, 0.4);
                    }

                    .faculties-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
                        gap: 25px;
                        margin-top: 30px;
                    }

                    /* Faculty Card Container */
                    .faculty-card-container {
                        position: relative;
                        height: fit-content;
                        z-index: 1;
                        transition: z-index 0s;
                    }

                    .faculty-card-container:hover {
                        z-index: 1000;
                    }

                    .faculty-card {
                        background: white;
                        border-radius: 16px;
                        padding: 25px;
                        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
                        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                        border: 2px solid transparent;
                        position: relative;
                        z-index: 2;
                        overflow: hidden;
                    }

                    .faculty-card::before {
                        content: '';
                        position: absolute;
                        top: 0;
                        left: -100%;
                        width: 100%;
                        height: 100%;
                        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent);
                        transition: left 0.6s;
                        z-index: 1;
                    }

                    .faculty-card.hovered::before {
                        left: 100%;
                    }

                    .faculty-card.hovered {
                        transform: translateY(-8px) scale(1.02);
                        box-shadow: 0 20px 40px rgba(79, 70, 229, 0.25);
                        border-color: #4f46e5;
                        background: linear-gradient(135deg, #ffffff, #f8fafc);
                    }

                    .faculty-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: start;
                        margin-bottom: 15px;
                        position: relative;
                        z-index: 3;
                    }

                    .faculty-name {
                        text-decoration: none;
                        font-size: 1.4rem;
                        font-weight: 700;
                        color: #2d3748;
                        margin-bottom: 5px;
                        transition: color 0.3s ease;
                    }

                    .faculty-card.hovered .faculty-name {
                        color: #4f46e5;
                    }

                    .faculty-code {
                        background: linear-gradient(135deg, #4f46e5, #7c3aed);
                        color: white;
                        padding: 6px 12px;
                        border-radius: 20px;
                        font-size: 0.9rem;
                        font-weight: 600;
                        transition: all 0.3s ease;
                    }

                    .faculty-card.hovered .faculty-code {
                        transform: scale(1.1);
                        box-shadow: 0 4px 12px rgba(79, 70, 229, 0.4);
                    }

                    .faculty-description {
                        position: relative;
                        z-index: 3;
                    }

                    .faculty-description p {
                        color: #718096;
                        margin-bottom: 10px;
                        font-size: 0.95rem;
                        line-height: 1.5;
                        transition: color 0.3s ease;
                    }

                    .faculty-card.hovered .faculty-description p {
                        color: #4a5568;
                    }

                    .duration {
                        background: #f7fafc;
                        color: #4a5568;
                        padding: 4px 10px;
                        border-radius: 12px;
                        font-size: 0.85rem;
                        font-weight: 500;
                        transition: all 0.3s ease;
                    }

                    .faculty-card.hovered .duration {
                        background: #edf2f7;
                        transform: translateX(5px);
                    }

                    /* Levels Submenu */
                    .levels-submenu {
                        position: absolute;
                        top: 100%;
                        left: 0;
                        right: 0;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        border-radius: 0 0 20px 20px;
                        padding: 0;
                        max-height: 0;
                        overflow: hidden;
                        transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
                        box-shadow: 0 15px 35px rgba(102, 126, 234, 0.3);
                        z-index: 10;
                        opacity: 0;
                        transform: translateY(-20px);
                    }

                    .levels-submenu.show {
                        max-height: 600px;
                        padding: 20px;
                        opacity: 1;
                        transform: translateY(0);
                        box-shadow: 0 20px 50px rgba(102, 126, 234, 0.4);
                    }

                    .submenu-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 15px;
                        padding-bottom: 10px;
                        border-bottom: 1px solid rgba(255, 255, 255, 0.2);
                    }

                    .submenu-title {
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        color: white;
                        font-weight: 600;
                        font-size: 1.1rem;
                    }

                    .levels-icon {
                        font-size: 1.2rem;
                        animation: bounce 2s infinite;
                    }

                    @keyframes bounce {
                        0%, 20%, 50%, 80%, 100% {
                            transform: translateY(0);
                        }
                        40% {
                            transform: translateY(-5px);
                        }
                        60% {
                            transform: translateY(-3px);
                        }
                    }

                    .submenu-count {
                        background: rgba(255, 255, 255, 0.2);
                        color: white;
                        padding: 4px 10px;
                        border-radius: 12px;
                        font-size: 0.8rem;
                        font-weight: 500;
                    }

                    .levels-list {
                        display: flex;
                        flex-direction: column;
                        gap: 10px;
                    }

                    .level-item {
                        background: rgba(255, 255, 255, 0.1);
                        backdrop-filter: blur(10px);
                        border: 1px solid rgba(255, 255, 255, 0.2);
                        border-radius: 12px;
                        padding: 12px;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        transition: all 0.3s ease;
                        opacity: 0;
                        transform: translateX(-20px);
                        animation: slideInLeft 0.4s ease forwards;
                    }

                    @keyframes slideInLeft {
                        to {
                            opacity: 1;
                            transform: translateX(0);
                        }
                    }

                    .level-item:hover {
                        background: rgba(255, 255, 255, 0.2);
                        transform: translateX(5px);
                        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
                    }

                    .level-info {
                        flex: 1;
                    }

                    .level-name {
                        color: white;
                        font-weight: 600;
                        font-size: 0.95rem;
                        margin-bottom: 2px;
                    }

                    .level-code {
                        background: rgba(255, 255, 255, 0.2);
                        color: white;
                        padding: 2px 8px;
                        border-radius: 8px;
                        font-size: 0.75rem;
                        display: inline-block;
                        margin-bottom: 4px;
                    }

                    .level-students {
                        color: rgba(255, 255, 255, 0.8);
                        font-size: 0.8rem;
                        display: flex;
                        align-items: center;
                        gap: 4px;
                    }

                    .student-icon {
                        font-size: 0.9rem;
                    }

                    .level-actions {
                        display: flex;
                        gap: 8px;
                    }

                    .level-btn {
                        width: 32px;
                        height: 32px;
                        border: none;
                        border-radius: 8px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        backdrop-filter: blur(10px);
                    }

                    .level-btn.view-btn {
                        background: rgba(34, 197, 94, 0.2);
                        color: #22c55e;
                        border: 1px solid rgba(34, 197, 94, 0.3);
                    }

                    .level-btn.view-btn:hover {
                        background: rgba(34, 197, 94, 0.3);
                        transform: scale(1.1);
                    }

                    .level-btn.delete-btn {
                        background: rgba(239, 68, 68, 0.2);
                        color: #ef4444;
                        border: 1px solid rgba(239, 68, 68, 0.3);
                    }

                    .level-btn.delete-btn:hover {
                        background: rgba(239, 68, 68, 0.3);
                        transform: scale(1.1);
                    }

                    .no-levels {
                        text-align: center;
                        color: rgba(255, 255, 255, 0.7);
                        font-style: italic;
                        padding: 20px;
                    }

                    .btn {
                        border: none;
                        padding: 8px 12px;
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 0.9rem;
                        transition: all 0.3s ease;
                        position: relative;
                        z-index: 3;
                    }

                    .delete-btn {
                        background: #e53e3e;
                        color: white;
                    }

                    .delete-btn:hover {
                        background: #c53030;
                        transform: scale(1.05);
                    }

                    .edit-btn {
                        background: #0a58ca;
                        color: #fff;
                    }

                    .edit-btn:hover {
                        background: #0d6efd;
                        transform: scale(1.05);
                    }

                    /* Modal Styles */
                    .modall {
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background: rgba(0, 0, 0, 0.6);
                        backdrop-filter: blur(5px);
                        z-index: 1000;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                    }

                    .modal-content {
                        background: white;
                        padding: 40px;
                        border-radius: 20px;
                        width: 90%;
                        max-width: 500px;
                        box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
                        animation: modalAppear 0.3s ease;
                    }

                    @keyframes modalAppear {
                        from {
                            opacity: 0;
                            transform: scale(0.9);
                        }
                        to {
                            opacity: 1;
                            transform: scale(1);
                        }
                    }

                    .modal-header {
                        text-align: center;
                        margin-bottom: 30px;
                    }

                    .modal-header h2 {
                        font-size: 1.8rem;
                        color: #2d3748;
                        margin-bottom: 10px;
                    }

                    .form-group {
                        margin-bottom: 25px;
                    }

                    .form-group label {
                        display: block;
                        margin-bottom: 8px;
                        font-weight: 600;
                        color: #4a5568;
                    }

                    .form-group input,
                    .form-group textarea {
                        width: 100%;
                        padding: 12px 16px;
                        border: 2px solid #e2e8f0;
                        border-radius: 10px;
                        font-size: 1rem;
                        transition: border-color 0.3s ease;
                        box-sizing: border-box;
                    }

                    .form-group input:focus,
                    .form-group textarea:focus {
                        outline: none;
                        border-color: #4f46e5;
                    }

                    .form-group textarea {
                        resize: vertical;
                        min-height: 120px;
                    }

                    .toggle-switch {
                        position: relative;
                        display: inline-block;
                        width: 48px;
                        height: 26px;
                    }

                    .toggle-switch__checkbox {
                        opacity: 0;
                        width: 0;
                        height: 0;
                    }

                    .toggle-switch__slider {
                        position: absolute;
                        cursor: pointer;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background-color: #ccc;
                        transition: background-color 0.3s ease;
                        border-radius: 50px;
                    }

                    .toggle-switch__slider::before {
                        content: "";
                        position: absolute;
                        height: 20px;
                        width: 20px;
                        left: 3px;
                        bottom: 3px;
                        background-color: white;
                        transition: transform 0.3s ease;
                        border-radius: 50%;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                    }

                    .toggle-switch__checkbox:checked + .toggle-switch__slider {
                        background-color: #4caf50;
                    }

                    .toggle-switch__checkbox:checked + .toggle-switch__slider::before {
                        transform: translateX(22px);
                    }

                    .modal-actions {
                        display: flex;
                        gap: 15px;
                        margin-top: 30px;
                    }

                    .btn {
                        flex: 1;
                        padding: 12px 20px;
                        border: none;
                        border-radius: 10px;
                        font-size: 1rem;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.3s ease;
                    }

                    .btn:disabled {
                        opacity: 0.6;
                        cursor: not-allowed;
                    }

                    .btn-primary {
                        background: linear-gradient(135deg, #4f46e5, #7c3aed);
                        color: white;
                    }

                    .btn-primary:hover:not(:disabled) {
                        transform: translateY(-2px);
                        box-shadow: 0 8px 20px rgba(79, 70, 229, 0.3);
                    }

                    .btn-secondary {
                        background: #e2e8f0;
                        color: #4a5568;
                    }

                    .btn-secondary:hover:not(:disabled) {
                        background: #cbd5e0;
                    }

                    .empty-state {
                        text-align: center;
                        padding: 60px 20px;
                        color: #718096;
                        grid-column: 1 / -1;
                    }

                    .empty-state h3 {
                        font-size: 1.5rem;
                        margin-bottom: 15px;
                    }

                    .empty-state p {
                        font-size: 1.1rem;
                    }

                    /* Responsive Design */
                    @media (max-width: 768px) {
                        .faculties-grid {
                            grid-template-columns: 1fr;
                            gap: 20px;
                        }

                        .faculty-card {
                            padding: 20px;
                        }

                        .levels-submenu.show {
                            padding: 15px;
                            z-index: 5;
                        }

                        .level-item {
                            flex-direction: column;
                            align-items: flex-start;
                            gap: 10px;
                        }

                        .level-actions {
                            align-self: flex-end;
                        }
                    }
                `}</style>
            </div>
        </Dashboard>
    )
}

export default Faculty;
