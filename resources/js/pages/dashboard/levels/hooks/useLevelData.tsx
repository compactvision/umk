import { useForm, router } from '@inertiajs/react';
import { safeJsonParse, processOptionsValue } from '../utils/levelUtils';
import Alert from '@/utils/sweetAlert';

export function useLevelData(level) {
    const {
        data: levelData,
        setData: setLevelData,
        post,
        processing,
        errors,
        reset,
    } = useForm({
        level_name: level?.level_name || '',
        level_code: level?.level_code || '',
        description: level?.description || '',
        image: level?.image || '',
        details: {
            credit_required: level?.details?.credit_required || 0,
            duration_years: level?.details?.duration_years || 0,
            courses_number: level?.details?.courses_number || 0,
            price: level?.details?.price || 0,
            language: level?.details?.language || 'Non spécifiée',
            student_number: level?.details?.student_number || 0,
            has_certificate: level?.details?.has_certificate || false,
            illustration_image: level?.details?.illustration_image || '',
            course_objective: level?.details?.course_objective || '',
            options: safeJsonParse(level?.details?.options, []),
            fees: level?.details?.fees || 0,
        },
    });

    const updateNestedField = (field, value) => {
        if (field.startsWith('details.')) {
            const detailField = field.replace('details.', '');
            setLevelData('details', {
                ...levelData.details,
                [detailField]: value,
            });
        } else {
            setLevelData(field, value);
        }
    };

    const getFieldValue = (field) => {
        if (field.startsWith('details.')) {
            const detailField = field.replace('details.', '');
            const value = levelData.details[detailField];
            
            if (detailField === 'options') {
                return formatOptionsForDisplay(value);
            }
            
            return value;
        }
        return levelData[field];
    };

    const formatOptionsForDisplay = (options) => {
        if (!options) return '';
        if (typeof options === 'string') return options;
        if (Array.isArray(options)) return options.join(', ');
        return '';
    };

    const saveEdit = (editField) => {
        const isImageField = editField === 'details.illustration_image' || editField === 'image';
        const isFileUpload = isImageField && levelData.details.illustration_image instanceof File;

        const processedOptions = editField === 'details.options' 
            ? processOptionsValue(levelData.details.options) 
            : safeJsonParse(levelData.details.options, []);

        const formData = new FormData();
        formData.append('_method', 'PUT');

        // Ajouter tous les champs requis
        formData.append('level_name', levelData.level_name || '');
        formData.append('level_code', levelData.level_code || '');
        formData.append('description', levelData.description || '');

        // Champs details obligatoires
        formData.append('details[credit_required]', levelData.details.credit_required || 0);
        formData.append('details[duration_years]', levelData.details.duration_years || 0);
        formData.append('details[courses_number]', levelData.details.courses_number || 0);
        formData.append('details[price]', levelData.details.price || 0);
        formData.append('details[language]', levelData.details.language || '');
        formData.append('details[has_certificate]', levelData.details.has_certificate ? '1' : '0');
        formData.append('details[student_number]', levelData.details.student_number || 0);
        formData.append('details[course_objective]', levelData.details.course_objective || '');
        formData.append('details[fees]', levelData.details.fees || 0);

        // Traiter les options correctement
        processedOptions.forEach((option, index) => {
            formData.append(`details[options][${index}]`, option);
        });

        // Si c'est un upload d'image, ajouter le fichier
        if (isFileUpload) {
            formData.append('details[illustration_image]', levelData.details.illustration_image);
        }

        return router.post(route('dashboard.levels.update.details', level.id), formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            onSuccess: () => {
                Alert.success(isFileUpload ? 'Image mise à jour avec succès' : 'Niveau mis à jour avec succès');
                router.reload({ only: ['level'] });
            },
            onError: (errors) => {
                Alert.error(isFileUpload ? "Erreur lors de la mise à jour de l'image" : 'Erreur lors de la mise à jour');
                console.error('Erreur:', errors);
            },
        });
    };

    return {
        levelData,
        setLevelData,
        updateNestedField,
        getFieldValue,
        processing,
        errors,
        post,
        reset,
        saveEdit
    };
}