import Dashboard from '@/components/layouts/Dashboard/Dashboard';
import { useState } from 'react';

const Faculty = () => {
    const [faculties, setFaculties] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        levels: [],
    });

    const levelsOptions = ['L1', 'L2', 'L3', 'M1', 'M2', 'D1', 'D2', 'D3'];

    const openModal = () => {
        setIsModalOpen(true);
        document.body.style.overflow = 'hidden';
    };

    const closeModal = () => {
        setIsModalOpen(false);
        document.body.style.overflow = 'auto';
        setFormData({
            name: '',
            code: '',
            levels: [],
        });
    };

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [id]: value,
        }));
    };

    const handleLevelsChange = (e) => {
        const { value, checked } = e.target;
        setFormData((prev) => {
            if (checked) {
                return {
                    ...prev,
                    levels: [...prev.levels, value],
                };
            } else {
                return {
                    ...prev,
                    levels: prev.levels.filter((level) => level !== value),
                };
            }
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const { name, code, levels } = formData;

        if (!name || !code) {
            alert('Veuillez remplir tous les champs requis');
            return;
        }

        if (levels.length === 0) {
            alert("Veuillez sélectionner au moins un niveau d'études");
            return;
        }

        if (faculties.some((f) => f.code === code.toUpperCase())) {
            alert('Ce code de faculté existe déjà');
            return;
        }

        const newFaculty = {
            id: Date.now(),
            name: name,
            code: code.toUpperCase(),
            levels: levels,
        };

        setFaculties((prev) => [...prev, newFaculty]);
        closeModal();
    };

    const deleteFaculty = (id) => {
        if (confirm('Êtes-vous sûr de vouloir supprimer cette faculté ?')) {
            setFaculties((prev) => prev.filter((f) => f.id !== id));
        }
    };

    return (
        <Dashboard>
            <div className="container">
                <div className="headerr">
                    <h1>🎓 Gestion des Facultés</h1>
                    <p>Créez et gérez les facultés avec leurs niveaux d'études</p>
                </div>

                <div style={{ textAlign: 'center' }}>
                    <button className="create-btn" onClick={openModal}>
                        ✨ Créer une nouvelle faculté
                    </button>
                </div>

                <div className="faculties-grid">
                    {faculties.length === 0 ? (
                        <div className="empty-state">
                            <h3>Aucune faculté créée</h3>
                            <p>Cliquez sur "Créer une nouvelle faculté" pour commencer</p>
                        </div>
                    ) : (
                        faculties.map((faculty) => (
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
                                <div className="levels-section">
                                    <div className="levels-title">Niveaux d'études</div>
                                    <div className="levels-grid">
                                        {faculty.levels.map((level) => (
                                            <span className="level-badge" key={level}>
                                                {level}
                                            </span>
                                        ))}
                                    </div>
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
                                    <label htmlFor="facultyName">Nom de la faculté</label>
                                    <input
                                        type="text"
                                        id="name"
                                        placeholder="Ex: Faculté de Médecine"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="facultyCode">Code de la faculté</label>
                                    <input type="text" id="code" placeholder="Ex: MED" value={formData.code} onChange={handleInputChange} required />
                                </div>

                                <div className="levels-selection">
                                    <label>Niveaux d'études disponibles</label>
                                    <div className="levels-checkboxes">
                                        {levelsOptions.map((level) => (
                                            <div className="checkbox-item" key={level}>
                                                <input
                                                    type="checkbox"
                                                    id={level}
                                                    value={level}
                                                    checked={formData.levels.includes(level)}
                                                    onChange={handleLevelsChange}
                                                />
                                                <label htmlFor={level}>{level}</label>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="modal-actions">
                                    <button type="button" className="btn btn-secondary" onClick={closeModal}>
                                        Annuler
                                    </button>
                                    <button type="submit" className="btn btn-primary">
                                        Créer la faculté
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                <style jsx>{`
                    .header {
                        text-align: center;
                        margin-bottom: 40px;
                    }

                    .header h1 {
                        font-size: 2.5rem;
                        color: #2d3748;
                        margin-bottom: 10px;
                        font-weight: 700;
                    }

                    .header p {
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

                    .levels-section {
                        margin-top: 20px;
                    }

                    .levels-title {
                        font-size: 1.1rem;
                        font-weight: 600;
                        color: #4a5568;
                        margin-bottom: 12px;
                    }

                    .levels-grid {
                        display: flex;
                        flex-wrap: wrap;
                        gap: 8px;
                    }

                    .level-badge {
                        background: linear-gradient(135deg, #38b2ac, #4299e1);
                        color: white;
                        padding: 8px 16px;
                        border-radius: 20px;
                        font-size: 0.9rem;
                        font-weight: 500;
                        text-transform: uppercase;
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

                    .form-group input {
                        width: 100%;
                        padding: 12px 16px;
                        border: 2px solid #e2e8f0;
                        border-radius: 10px;
                        font-size: 1rem;
                        transition: border-color 0.3s ease;
                    }

                    .form-group input:focus {
                        outline: none;
                        border-color: #4f46e5;
                    }

                    .levels-selection {
                        margin-top: 20px;
                    }

                    .levels-checkboxes {
                        display: grid;
                        grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
                        gap: 10px;
                        margin-top: 15px;
                    }

                    .checkbox-item {
                        display: flex;
                        align-items: center;
                        gap: 8px;
                    }

                    .checkbox-item input[type='checkbox'] {
                        width: 18px;
                        height: 18px;
                        accent-color: #4f46e5;
                    }

                    .checkbox-item label {
                        font-weight: 500;
                        color: #2d3748;
                        cursor: pointer;
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

                    .btn-primary {
                        background: linear-gradient(135deg, #4f46e5, #7c3aed);
                        color: white;
                    }

                    .btn-primary:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 8px 20px rgba(79, 70, 229, 0.3);
                    }

                    .btn-secondary {
                        background: #e2e8f0;
                        color: #4a5568;
                    }

                    .btn-secondary:hover {
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
