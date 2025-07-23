import { useState } from 'react';
import { useForm } from '@inertiajs/react';
import ErrorText from '@/components/UI/ErrorText';

export default function LevelPopup({ isOpen, onClose, faculties }) {
    const [imagePreview, setImagePreview] = useState(null);

    const { data, setData, post, processing, reset, errors } = useForm({
        faculty_id: '',
        name: '',
        code: '',
        duration: '1',
        description: '',
        students: '',
        courses: '',
        credits: '',
        image: null
    });

    const handleChange = (e) => {
        const { id, value } = e.target;
        setData(id, value);
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setData('image', file);

            const reader = new FileReader();
            reader.onload = () => setImagePreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const saveLevel = (e) => {
        e.preventDefault();

        post(route('dashboard.levels.store'), {
            onSuccess: () => {
                alert(`✅ Niveau "${data.name}" enregistré avec succès !`);
                reset();
                setImagePreview(null);
                onClose();
            },
            onError: () => {
                alert('❌ Une erreur est survenue lors de l’enregistrement.');
            }
        });
    };

    if (!isOpen) return null;

    return (
        <div className="popup-overlay">
            <div className="popup__container">
                <div className="popup__header">
                    <h2 className="popup__title">🎓 Ajouter un Niveau</h2>
                    <button className="popup__close" onClick={onClose}>×</button>
                </div>

                <div className="popup__content">
                    <div className="popup__sidebar">
                        <div className="form__group">
                            <label htmlFor="faculty_id">Faculté</label>
                            <select id="faculty_id" value={data.faculty_id} onChange={handleChange}>
                                <option value="">-- Choisis la faculté --</option>
                                {faculties?.data?.map(f => (
                                    <option key={f.id} value={f.id}>{f.name}</option>
                                ))}
                            </select>
                            <ErrorText error={errors.faculty_id} />
                        </div>

                        <div className="form__group">
                            <label htmlFor="name">Nom du niveau</label>
                            <input id="name" type="text" value={data.name} onChange={handleChange} />
                            <ErrorText error={errors.name} />
                        </div>

                        <div className="form__group">
                            <label htmlFor="code">Code</label>
                            <input id="code" type="text" value={data.code} onChange={handleChange} />
                            <ErrorText error={errors.code}/>
                        </div>

                        <div className="form__group">
                            <label htmlFor="duration">Durée (en années)</label>
                            <select id="duration" value={data.duration} onChange={handleChange}>
                                {[1, 2, 3, 4].map(y => (
                                    <option key={y} value={y}>{y} an{y > 1 && 's'}</option>
                                ))}
                            </select>
                            <ErrorText error={errors.duration} />
                        </div>

                        <div className="form__group">
                            <label htmlFor="students">Nombre d'étudiants</label>
                            <input id="students" type="number" value={data.students} onChange={handleChange} />
                            <ErrorText error={errors.students} />
                        </div>

                        <div className="form__group">
                            <label htmlFor="courses">Nombre de cours</label>
                            <input id="courses" type="number" value={data.courses} onChange={handleChange} />
                            <ErrorText error={errors.courses} />
                        </div>

                        <div className="form__group">
                            <label htmlFor="credits">Crédits</label>
                            <input id="credits" type="number" value={data.credits} onChange={handleChange} />
                            <ErrorText error={errors.credits} />
                        </div>

                        <div className="form__group">
                            <label htmlFor="image">Image</label>
                            <input id="image" type="file" accept="image/*" onChange={handleImageChange} />
                            {imagePreview && <img src={imagePreview} alt="Aperçu" className="form__preview" />}
                            <ErrorText error={errors.image} />
                        </div>
                    </div>

                    <div className="popup__main">
                        <div className="form__group">
                            <label htmlFor="description">Description</label>
                            <textarea id="description" rows="10" value={data.description} onChange={handleChange}></textarea>
                            <ErrorText error={errors.description}/>
                        </div>

                        <button className="btn btn--primary" onClick={saveLevel} disabled={processing}>
                            {processing ? '⏳ Enregistrement...' : '💾 Enregistrer'}
                        </button>
                    </div>
                </div>
            </div>
            <style>{`

.popup-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(10px);
    z-index: 1000;
    opacity: 0;
    animation: fadeIn 0.3s ease-out forwards;
}

@keyframes fadeIn {
    to {
        opacity: 1;
    }
}

.popup__container {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) scale(0.95);
    width: 95vw;
    height: 90vh;
    background: linear-gradient(145deg, #ffffff, #f0f0f0);
    border-radius: 20px;
    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
    animation: popIn 0.4s ease-out 0.1s forwards;
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

@keyframes popIn {
    to {
        transform: translate(-50%, -50%) scale(1);
    }
}

.popup__header {
    background: linear-gradient(135deg, #4f46e5, #7c3aed);
    color: white;
    padding: 20px 30px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.popup__title {
    font-size: 24px;
    font-weight: bold;
}

.popup__close {
    background: transparent;
    border: none;
    color: white;
    font-size: 24px;
    cursor: pointer;
}

.popup__content {
    display: flex;
    height: 100%;
    flex-direction: row;
}

.popup__sidebar {
    width: 300px;
    background: linear-gradient(180deg, #f8fafc, #e2e8f0);
    border-right: 2px solid #e2e8f0;
    padding: 20px;
    overflow-y: auto;
    box-sizing: border-box;
}

.popup__main {
    flex: 1;
    background: #ffffff;
    padding: 30px;
    overflow-y: auto;
    box-sizing: border-box;
}

.form__group {
    margin-bottom: 20px;
    box-sizing: border-box;
}

.form__group label {
    display: block;
    font-weight: 600;
    margin-bottom: 8px;
    color: #374151;
}

.form__group input,
.form__group select,
.form__group textarea {
    display: block;
    width: 100%;
    padding: 12px;
    border: 2px solid #e5e7eb;
    border-radius: 10px;
    font-size: 14px;
    background: white;
    transition: all 0.3s ease;
    box-sizing: border-box;
}

.form__group input:focus,
.form__group select:focus,
.form__group textarea:focus {
    outline: none;
    border-color: #4f46e5;
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

.form__group textarea {
    resize: vertical;
    min-height: 80px;
}

.form__preview {
    margin-top: 10px;
    width: 100%;
    max-height: 150px;
    object-fit: contain;
    border-radius: 10px;
    border: 2px solid #cbd5e1;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.btn {
    padding: 15px;
    border: none;
    border-radius: 10px;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.3s ease;
    font-size: 16px;
    width: 100%;
    box-sizing: border-box;
}

.btn--primary {
    background: linear-gradient(145deg, #10b981, #059669);
    color: white;
}

.btn--primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
}

@media screen and (max-width: 768px) {
    .popup__content {
        flex-direction: column;
    }

    .popup__sidebar {
        width: 100%;
        border-right: none;
        border-bottom: 2px solid #e2e8f0;
    }

    .form__preview {
        max-height: 200px;
    }
}

        `}</style>
        </div>
    );
}
