import Dashboard from '@/components/layouts/Dashboard/Dashboard';
import { useState, useEffect } from 'react';
import { useForm, router, usePage } from '@inertiajs/react';
import ErrorText from '@/components/UI/ErrorText';

const Faculty = () => { // Récupérer les facultés depuis les props
    const { faculties } = usePage().props;

    const [isModalOpen, setIsModalOpen] = useState(false);

    const { data, setData, errors, post, processing, reset } = useForm({
        name: '',
        code: '',
        description: '',
        duration_years: '',
    });

    const openModal = () => {
        setIsModalOpen(true);
        document.body.style.overflow = 'hidden';
    };

    const closeModal = () => {
        setIsModalOpen(false);
        document.body.style.overflow = 'auto';
        reset();
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Option 1: Utiliser post avec l'URL directe
        post('/faculties', {
            onSuccess: () => {
                reset();
                closeModal();
            },
            onError: (errors) => {
                console.error('Erreurs:', errors);
            },
        });
    };

    const deleteFaculty = (id) => {
        if (confirm('Êtes-vous sûr de vouloir supprimer cette faculté ?')) {
            // Utiliser router.delete pour la suppression
            router.delete(`/faculties/${id}`, {
                onSuccess: () => {
                    setFaculties((prev) => prev.filter((f) => f.id !== id));
                },
                onError: (errors) => {
                    console.error('Erreur lors de la suppression:', errors);
                    alert('Erreur lors de la suppression');
                }
            });
        }
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
                        faculties.data.map((faculty) => (
                            <div className="faculty-card" key={faculty.id}>
                                <div className="faculty-header">
                                    <div>
                                        <div className="faculty-name">{faculty.name}</div>
                                        <div className="faculty-code">{faculty.code}</div>
                                    </div>
                                    <button className="delete-btn" onClick={() => deleteFaculty(faculty.id)}>
                                        🗑️
                                    </button>
                                </div>
                                <div className="faculty-description">
                                    <p>{faculty.description}</p>
                                    <span className="duration">Durée: {faculty.duration_years} ans</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Modal */}
                {isModalOpen && (
                    <div className="modal" onClick={(e) => e.target.className === 'modal' && closeModal()}>
                        <div className="modal-content">
                            <div className="modal-header">
                                <h2>🏛️ Nouvelle Faculté</h2>
                                <p>Remplissez les informations de la faculté</p>
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

                                <div className="modal-actions">
                                    <button type="button" className="btn btn-secondary" onClick={closeModal} disabled={processing}>
                                        Annuler
                                    </button>
                                    <button type="submit" className="btn btn-primary" disabled={processing}>
                                        {processing ? 'Création...' : 'Créer la faculté'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Styles identiques à votre code original */}
                <style jsx>{`
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

                    .faculty-card {
                        background: white;
                        border-radius: 16px;
                        padding: 25px;
                        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
                        transition: all 0.3s ease;
                        border: 2px solid transparent;
                    }

                    .faculty-card:hover {
                        transform: translateY(-5px);
                        box-shadow: 0 15px 35px rgba(0, 0, 0, 0.15);
                        border-color: #4f46e5;
                    }

                    .faculty-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: start;
                        margin-bottom: 15px;
                    }

                    .faculty-name {
                        font-size: 1.4rem;
                        font-weight: 700;
                        color: #2d3748;
                        margin-bottom: 5px;
                    }

                    .faculty-code {
                        background: linear-gradient(135deg, #4f46e5, #7c3aed);
                        color: white;
                        padding: 6px 12px;
                        border-radius: 20px;
                        font-size: 0.9rem;
                        font-weight: 600;
                    }

                    .faculty-description p {
                        color: #718096;
                        margin-bottom: 10px;
                        font-size: 0.95rem;
                        line-height: 1.5;
                    }

                    .duration {
                        background: #f7fafc;
                        color: #4a5568;
                        padding: 4px 10px;
                        border-radius: 12px;
                        font-size: 0.85rem;
                        font-weight: 500;
                    }

                    .delete-btn {
                        background: #e53e3e;
                        color: white;
                        border: none;
                        padding: 8px 12px;
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 0.9rem;
                        transition: all 0.3s ease;
                    }

                    .delete-btn:hover {
                        background: #c53030;
                    }

                    /* Modal Styles */
                    .modal {
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
                `}</style>
            </div>
        </Dashboard>
    );
};

export default Faculty;
