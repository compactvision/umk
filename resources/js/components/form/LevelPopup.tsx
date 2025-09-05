import { useState, useEffect } from 'react';
import { useForm, router } from '@inertiajs/react';
import ErrorText from '@/components/UI/ErrorText';
import Alert from '@/utils/sweetAlert';

export default function LevelPopup({ onClose, faculties, level = null, levelCodes = [] }) {
    const isEditMode = !!level;

    const [imagePreview, setImagePreview] = useState(() => {
        return level?.image ? `/storage/${level.image}` : null;
    });

    const { data, setData, post, put, processing, reset, errors, clearErrors } = useForm({
        faculty_id: level?.faculty_id || '',
        title: level?.title || '',
        code: level?.code || '',
        tag: level?.tag || '',
        description: level?.description || '',
        is_active: level?.is_active ?? true,
        image: null
    });

    useEffect(() => {
        if (!data.faculty_id && faculties?.data?.length > 0 && !isEditMode) {
            setData('faculty_id', faculties.data[0].id);
        }
    }, [faculties, data.faculty_id, isEditMode]);

    const handleImageChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            // ✅ Vérifier la taille du fichier (2MB max)
            if (file.size > 2048 * 1024) {
                Alert.error("L'image ne doit pas dépasser 2MB");
                e.target.value = ''; // Reset input
                return;
            }

            // ✅ Vérifier le type de fichier
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
            if (!allowedTypes.includes(file.type)) {
                Alert.error("Seuls les fichiers JPG, PNG et WebP sont autorisés");
                e.target.value = ''; // Reset input
                return;
            }

            setData('image', file);
            const reader = new FileReader();
            reader.onload = () => setImagePreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const levelCodesOptions = [
        { id: '1', code: 'L1' },
        { id: '2', code: 'L2' },
        { id: '3', code: 'L3' },
        { id: '4', code: 'L4' },
        { id: '5', code: 'M1' },
        { id: '6', code: 'M2' },
        { id: '7', code: 'D1' },
    ];

    const handleClose = () => {
        reset();
        clearErrors();
        setImagePreview(level?.image ? `/storage/${level.image}` : null);
        onClose();
    };

    const saveLevel = (e) => {
        e.preventDefault();

        // ✅ Préparer les données pour l'envoi
        const payload = { ...data };
        
        // Si pas d'image uploadée, ne pas envoyer le champ image
        if (!data.image) {
            delete payload.image;
        }

        // ✅ Options pour Inertia
        const options = {
            forceFormData: true, // Important pour les fichiers
            onSuccess: (response) => {
                console.log('Réponse de succès:', response);
                
                // Afficher le message de succès
                Alert.success(isEditMode ? "Niveau modifié avec succès !" : "Niveau créé avec succès !");
                
                // Reset du formulaire
                reset();
                clearErrors();
                setImagePreview(null);
                
                // Fermer le popup
                onClose();
                
                // Recharger la liste des niveaux
                router.reload({ only: ['levels'] });
            },
            onError: (errors) => {
                console.error('Erreurs de validation:', errors);
                
                // Si c'est une erreur de validation Laravel
                if (errors && typeof errors === 'object') {
                    // Les erreurs sont déjà gérées par useForm
                    Alert.error("Veuillez corriger les erreurs du formulaire");
                } else {
                    Alert.error(isEditMode ? "Impossible de modifier ce niveau" : "Impossible de créer ce niveau");
                }
            },
            onFinish: () => {
                console.log('Requête terminée');
            }
        };

        if (isEditMode) {
            put(route('dashboard.admin.levels.update', level.id), options);
        } else {
            post(route('dashboard.admin.levels.store'), options);
        }
    };

    return (
        <div className="popup-overlay">
            <div className="popup__container">
                <div className="popup__header">
                    <h2 className="popup__title">🎓 {isEditMode ? "Modifier ce niveau" : "Ajouter un Niveau"}</h2>
                    <button className="popup__close" onClick={handleClose}>×</button>
                </div>

                <form onSubmit={saveLevel} className="popup__content">
                    <div className="popup__sidebar">
                        {/* Faculté */}
                        <div className="form__group">
                            <label htmlFor="faculty_id">Faculté</label>
                            <select
                                id="faculty_id"
                                value={data.faculty_id}
                                onChange={(e) => setData('faculty_id', e.target.value)}
                                disabled={isEditMode}
                                required
                            >
                                <option value="">-- Choisis la faculté --</option>
                                {faculties?.data?.map(f => (
                                    <option key={f.id} value={f.id}>{f.name}</option>
                                ))}
                            </select>
                            <ErrorText error={errors.faculty_id} />
                        </div>

                        {/* Nom */}
                        <div className="form__group">
                            <label htmlFor="title">Nom du niveau</label>
                            <input
                                id="title"
                                type="text"
                                value={data.title}
                                onChange={(e) => setData('title', e.target.value)}
                                required
                            />
                            <ErrorText error={errors.title} />
                        </div>

                        {/* Code */}
                        <div className="form__group">
                            <label htmlFor="code">Code</label>
                            <select
                                id="code"
                                value={data.code}
                                onChange={(e) => setData('code', e.target.value)}
                                required
                            >
                                <option value="">-- Choisis le code --</option>
                                {levelCodesOptions.map(code => (
                                    <option key={code.id} value={code.code}>{code.code}</option>
                                ))}
                            </select>
                            <ErrorText error={errors.code} />
                        </div>

                        {/* ✅ Toggle is_active */}
                        <div className="form__group">
                            <label htmlFor="is_active">Statut</label>
                            <label className="toggle-switch">
                                <input
                                    id="is_active"
                                    type="checkbox"
                                    checked={!!data.is_active}
                                    onChange={(e) => setData('is_active', e.target.checked)}
                                />
                                <span className="toggle-switch__slider"></span>
                            </label>
                            <span className="toggle-label">
                                {data.is_active ? 'Actif' : 'Inactif'}
                            </span>
                            <ErrorText error={errors.is_active} />
                        </div>

                        {/* Image */}
                        <div className="form__group">
                            <label htmlFor="image">Image</label>
                            <input 
                                id="image" 
                                type="file" 
                                accept="image/*" 
                                onChange={handleImageChange} 
                            />
                            {imagePreview && (
                                <img 
                                    src={imagePreview} 
                                    alt="Aperçu" 
                                    className="form__preview" 
                                    style={{maxWidth: '200px', maxHeight: '150px', objectFit: 'cover'}}
                                />
                            )}
                            <ErrorText error={errors.image} />
                        </div>
                    </div>

                    <div className="popup__main">
                        {/* Description */}
                        <div className="form__group">
                            <label htmlFor="description">Description</label>
                            <textarea
                                id="description"
                                rows={10}
                                value={data.description}
                                onChange={(e) => setData('description', e.target.value)}
                            ></textarea>
                            <ErrorText error={errors.description} />
                        </div>

                        {/* Affichage des erreurs générales */}
                        {errors.general && (
                            <div className="form__group">
                                <ErrorText error={errors.general} />
                            </div>
                        )}

                        {/* Boutons */}
                        <div className="form__actions">
                            <button type="submit" className="btn btn--primary" disabled={processing}>
                                {processing
                                    ? (isEditMode ? '⏳ Modification...' : '⏳ Enregistrement...')
                                    : (isEditMode ? '💾 Modifier' : '💾 Enregistrer')}
                            </button>
                            <button 
                                type="button" 
                                className="btn btn--secondary" 
                                onClick={handleClose}
                                disabled={processing}
                            >
                                Annuler
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}