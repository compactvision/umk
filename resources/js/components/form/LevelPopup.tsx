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
            if (file.size > 2048 * 1024) {
                Alert.error("L'image ne doit pas dépasser 2MB");
                e.target.value = ''; 
                return;
            }

            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
            if (!allowedTypes.includes(file.type)) {
                Alert.error("Seuls les fichiers JPG, PNG et WebP sont autorisés");
                e.target.value = ''; 
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

        if (isEditMode) {
            const formData = new FormData();
            
            formData.append('faculty_id', data.faculty_id);
            formData.append('title', data.title);
            formData.append('code', data.code);
            formData.append('tag', data.code || '');
            formData.append('description', data.description);
            formData.append('is_active', data.is_active ? '1' : '0');
            
            if (data.image instanceof File) {
                formData.append('image', data.image);
            }
            
            formData.append('_method', 'PUT');

            router.post(route('dashboard.admin.levels.update', level.id), formData, {
                forceFormData: true,
                onSuccess: (response) => {
                    Alert.success("Niveau modifié avec succès !");
                    reset();
                    clearErrors();
                    setImagePreview(null);
                    onClose();
                    router.reload({ only: ['levels'] });
                },
                onError: (errors) => {
                    console.error('❌ Erreurs UPDATE:', errors);
                    Alert.error(errors.code);
                },
                onFinish: () => {
                    console.log('🏁 Update terminé');
                }
            });

        } else {
            const payload = { ...data };
            
            if (!data.image) {
                delete payload.image;
            }

            post(route('dashboard.admin.levels.store'), {
                forceFormData: true,
                data: payload,
                onSuccess: (response) => {
                    Alert.success("Niveau créé avec succès !");
                    reset();
                    clearErrors();
                    setImagePreview(null);
                    onClose();
                    router.reload({ only: ['levels'] });
                },
                onError: (errors) => {
                    console.error('❌ Erreurs CREATE:', errors);
                    Alert.error("Veuillez corriger les erreurs du formulaire");
                },
                onFinish: () => {
                    console.log('🏁 Create terminé');
                }
            });
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            {/* Modal Container - 80% height, 90% width */}
            <div className="bg-white w-[90%] h-[80vh] max-w-7xl rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                {/* Header - Fixed Top */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-4 flex-shrink-0">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-4">
                            <div className="bg-white bg-opacity-20 p-3 rounded-xl backdrop-blur-sm">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold">
                                    {isEditMode ? "Modifier ce niveau" : "Ajouter un Niveau"}
                                </h2>
                                <p className="text-indigo-100 mt-1 text-sm">
                                    {isEditMode ? "Mettez à jour les informations du niveau" : "Créez un nouveau niveau académique"}
                                </p>
                            </div>
                        </div>
                        <button 
                            onClick={handleClose}
                            className="bg-white bg-opacity-20 hover:bg-opacity-30 p-3 rounded-xl transition-all duration-200 backdrop-blur-sm"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Error Alert */}
                {errors.code && (
                    <div className="px-6 py-2 bg-red-50 border-b border-red-200">
                        <ErrorText error={errors.code} />
                    </div>
                )}

                {/* Form Content - Takes Remaining Height */}
                <form onSubmit={saveLevel} className="flex-1 flex overflow-hidden">
                    {/* Left Sidebar - Fixed Width */}
                    <div className="w-80 bg-gray-50 border-r border-gray-200 overflow-y-auto">
                        <div className="p-4 space-y-4">
                            {/* Image Upload */}
                            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                                <label className="block text-xs font-semibold text-gray-700 mb-2">
                                    Image du niveau
                                </label>
                                <div className="space-y-2">
                                    <div className="relative group">
                                        <input 
                                            id="image" 
                                            type="file" 
                                            accept="image/*" 
                                            onChange={handleImageChange} 
                                            className="hidden"
                                        />
                                        <label 
                                            htmlFor="image" 
                                            className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors duration-200"
                                        >
                                            {imagePreview ? (
                                                <img 
                                                    src={imagePreview} 
                                                    alt="Aperçu" 
                                                    className="h-full w-full object-cover rounded-lg"
                                                />
                                            ) : (
                                                <>
                                                    <svg className="w-10 h-10 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                                    </svg>
                                                    <p className="text-xs text-gray-600 font-medium">Cliquez pour télécharger</p>
                                                    <p className="text-xs text-gray-500 mt-1">PNG, JPG, WebP (max. 2MB)</p>
                                                </>
                                            )}
                                        </label>
                                    </div>
                                    <ErrorText error={errors.image} />
                                </div>
                            </div>

                            {/* Faculty */}
                            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                                <label htmlFor="faculty_id" className="block text-xs font-semibold text-gray-700 mb-2">
                                    Faculté
                                </label>
                                <select
                                    id="faculty_id"
                                    value={data.faculty_id}
                                    onChange={(e) => setData('faculty_id', e.target.value)}
                                    disabled={isEditMode}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 text-sm"
                                >
                                    <option value="">-- Choisis la faculté --</option>
                                    {faculties?.data?.map(f => (
                                        <option key={f.id} value={f.id}>{f.name}</option>
                                    ))}
                                </select>
                                <ErrorText error={errors.faculty_id} />
                            </div>

                            {/* Title */}
                            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                                <label htmlFor="title" className="block text-xs font-semibold text-gray-700 mb-2">
                                    Nom du niveau
                                </label>
                                <input
                                    id="title"
                                    type="text"
                                    value={data.title}
                                    onChange={(e) => setData('title', e.target.value)}
                                    required
                                    placeholder="Ex: Licence 1ère année"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 text-sm"
                                />
                                <ErrorText error={errors.title} />
                            </div>

                            {/* Code */}
                            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                                <label htmlFor="code" className="block text-xs font-semibold text-gray-700 mb-2">
                                    Code du niveau
                                </label>
                                <select
                                    id="code"
                                    value={data.code}
                                    onChange={(e) => setData('code', e.target.value)}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 text-sm"
                                >
                                    <option value="">-- Choisis le code --</option>
                                    {levelCodesOptions.map(code => (
                                        <option key={code.id} value={code.code}>{code.code}</option>
                                    ))}
                                </select>
                                <ErrorText error={errors.code} />
                            </div>

                            {/* Status Toggle */}
                            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                                <label className="block text-xs font-semibold text-gray-700 mb-2">
                                    Statut du niveau
                                </label>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600 font-medium">
                                        {data.is_active ? 'Actif' : 'Inactif'}
                                    </span>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={!!data.is_active}
                                            onChange={(e) => setData('is_active', e.target.checked)}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-indigo-500 peer-checked:to-purple-600"></div>
                                    </label>
                                </div>
                                <ErrorText error={errors.is_active} />
                            </div>
                        </div>
                    </div>

                    {/* Main Content - Takes Remaining Space */}
                    <div className="flex-1 flex flex-col overflow-hidden">
                        <div className="flex-1 overflow-y-auto p-4">
                            <div className="max-w-4xl mx-auto space-y-4">
                                {/* Description */}
                                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                                    <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">
                                        Description du niveau
                                    </label>
                                    <textarea
                                        id="description"
                                        rows={8}
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        placeholder="Décrivez ce niveau académique, les prérequis, les débouchés..."
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 resize-none text-sm"
                                    ></textarea>
                                    <div className="flex justify-between items-center mt-2">
                                        <ErrorText error={errors.description} />
                                        <span className="text-xs text-gray-500">
                                            {data.description?.length || 0} caractères
                                        </span>
                                    </div>
                                </div>

                                {/* Additional Info */}
                                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-100">
                                    <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                                        <svg className="w-4 h-4 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Informations supplémentaires
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div className="bg-white rounded-lg p-3">
                                            <p className="text-xs text-gray-600 mb-1">Tag automatique</p>
                                            <p className="text-sm font-medium text-gray-800">
                                                {data.code || 'Non défini'}
                                            </p>
                                        </div>
                                        <div className="bg-white rounded-lg p-3">
                                            <p className="text-xs text-gray-600 mb-1">Mode</p>
                                            <p className="text-sm font-medium text-gray-800">
                                                {isEditMode ? 'Modification' : 'Création'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Global Errors */}
                                {errors.general && (
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                        <ErrorText error={errors.general} />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Fixed Bottom Actions */}
                        <div className="bg-white border-t border-gray-200 px-4 py-3">
                            <div className="max-w-4xl mx-auto flex gap-3">
                                <button 
                                    type="submit" 
                                    className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-6 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 font-semibold text-base shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2" 
                                    disabled={processing}
                                >
                                    {processing ? (
                                        <>
                                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            {isEditMode ? 'Modification...' : 'Enregistrement...'}
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            {isEditMode ? 'Modifier' : 'Créer'}
                                        </>
                                    )}
                                </button>
                                <button 
                                    type="button" 
                                    className="px-8 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-300 font-semibold text-base hover:shadow-md transform hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none" 
                                    onClick={handleClose}
                                    disabled={processing}
                                >
                                    Annuler
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}