import { useState, useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import ErrorText from '@/components/UI/ErrorText';
import Alert from '@/utils/sweetAlert';

export default function LevelPopup({ isOpen, onClose, faculties, level = null, levelCodes = null }) {
    const isEditMode = !!level;

    const [imagePreview, setImagePreview] = useState(() => {
        return level?.image ? `/storage/${level.image}` : null;
    });

    const { data, setData, post, put, processing, reset, errors } = useForm({
        faculty_id: level?.faculty_id || '',
        level_name: level?.level_name || '',
        level_code_id: level?.level_code_id || '',
        duration_years: level?.duration_years?.toString() || '1',
        description: level?.description || '',
        student_number: level?.student_number || '',
        courses_number: level?.courses_number || '',
        credit_required: level?.credit_required || '',
        image: null
    });

    useEffect(() => {
        if (!data.faculty_id && faculties?.data?.length > 0 && !isEditMode) {
            setData('faculty_id', faculties.data[0].id);
        }
    }, [faculties, data.faculty_id, isEditMode]);

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

        // Validation côté frontend
        const requiredFields = {
            faculty_id: 'La faculté est requise',
            level_name: 'Le nom du niveau est requis',
            level_code_id: 'Le code du niveau est requis'
        };

        const validationErrors = {};
        Object.keys(requiredFields).forEach(field => {
            if (!data[field] || data[field].toString().trim() === '') {
                validationErrors[field] = requiredFields[field];
            }
        });

        if (Object.keys(validationErrors).length > 0) {
            Alert.error("Veuillez remplir tous les champs requis");
            return;
        }

        const options = {
            onSuccess: () => {
                Alert.success(isEditMode ? "Niveau modifié avec succès !" : "Niveau créé avec succès !");
                reset();
                setImagePreview(null);
                onClose();
            },
            onError: (errors) => {
                console.error('Erreurs de validation:', errors);
                Alert.error("Erreur: " + JSON.stringify(errors));
            }
        };

        if (isEditMode) {
            // Pour la modification, toujours utiliser put() avec forceFormData si nécessaire
            if (data.image && data.image instanceof File) {
                // Avec fichier : utiliser PUT avec forceFormData
                put(route('dashboard.levels.update', level.id), {
                    ...options,
                    forceFormData: true
                });
            } else {
                // Sans fichier : requête PUT normale
                put(route('dashboard.levels.update', level.id), options);
            }
        } else {
            // Pour la création
            post(route('dashboard.levels.store'), options);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="popup-overlay">
            <div className="popup__container">
                <div className="popup__header">
                    <h2 className="popup__title">🎓 {isEditMode ? "Modifier ce niveau" : "Ajouter un Niveau"}</h2>
                    <button className="popup__close" onClick={onClose}>×</button>
                </div>

                <div className="popup__content">
                    <div className="popup__sidebar">
                        <div className="form__group">
                            <label htmlFor="faculty_id">Faculté</label>
                            <select 
                                id="faculty_id" 
                                value={data.faculty_id || ''} 
                                onChange={(e) => setData('faculty_id', e.target.value)} 
                                disabled={isEditMode}
                            >
                                <option value="">-- Choisis la faculté --</option>
                                {faculties?.data?.map(f => (
                                    <option key={f.id} value={f.id}>{f.name}</option>
                                ))}
                            </select>
                            <ErrorText error={errors.faculty_id} />
                        </div>

                        <div className="form__group">
                            <label htmlFor="name">Nom du niveau</label>
                            <input 
                                id="name" 
                                type="text" 
                                value={data.level_name || ''} 
                                onChange={(e) => setData('level_name', e.target.value)} 
                            />
                            <ErrorText error={errors.level_name} />
                        </div>

                        <div className="form__group">
                            <label htmlFor="code">Code</label>
                            <select 
                                id="code" 
                                value={data.level_code_id || ''} 
                                onChange={(e) => setData('level_code_id', e.target.value)}
                            >
                                <option value="">-- Choisis le code --</option>
                                {levelCodes?.map(code => (
                                    <option key={code.id} value={code.id}>{code.code}</option>
                                ))}
                            </select>
                            <ErrorText error={errors.level_code_id}/>
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
                            <textarea 
                                id="description" 
                                rows="10" 
                                value={data.description || ''} 
                                onChange={(e) => setData('description', e.target.value)}
                            ></textarea>
                            <ErrorText error={errors.description}/>
                        </div>

                        <button className="btn btn--primary" onClick={saveLevel} disabled={processing}>
                            {processing ? (isEditMode ? '⏳ Modification...' : '⏳ Enregistrement...') : (isEditMode ? '💾 Modifier' : '💾 Enregistrer')}
                        </button>
                    </div>
                </div>
            </div>
            
        </div>
    );
}