import Alert from '@/utils/sweetAlert';
import { router, useForm } from '@inertiajs/react';
import { processOptionsValue, safeJsonParse } from '../utils/levelUtils';

export function useLevelData(level) {
    const {
        data: detailsData,
        setData: setDetailsData,
        put,
        processing,
        errors,
        reset,
    } = useForm({
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
    });

    const {
        data: levelData,
        setData: setLevelData,
        post,
        processing: levelProcessing,
        errors: levelErrors,
        reset: levelReset,
    } = useForm({
        level_id: level?.level_id || '',
        level_name: level?.level_name || '',
        level_code: level?.level_code || '',
        description: level?.description || '',
        image: level?.image || '',
    });

    const getFieldValue = (field) => detailsData[field];

    const updateField = (field, value) => {
        setDetailsData(field, value);
    };

    const saveEdit = (levelDetailId) => {
        const processedOptions = processOptionsValue(detailsData.options);

        const formData = new FormData();
        formData.append('_method', 'PUT');

        formData.append('credit_required', detailsData.credit_required || 0);
        formData.append('duration_years', detailsData.duration_years || 0);
        formData.append('courses_number', detailsData.courses_number || 0);
        formData.append('price', detailsData.price || 0);
        formData.append('language', detailsData.language || '');
        formData.append('has_certificate', detailsData.has_certificate ? '1' : '0');
        formData.append('student_number', detailsData.student_number || 0);
        formData.append('course_objective', detailsData.course_objective || '');
        formData.append('fees', detailsData.fees || 0);

        processedOptions.forEach((option, index) => {
            formData.append(`options[${index}]`, option);
        });

        if (detailsData.illustration_image instanceof File) {
            formData.append('illustration_image', detailsData.illustration_image);
        }

        return router.post(route('dashboard.admin.levels.details.update', levelDetailId), formData, {
            forceFormData: true,
            onSuccess: () => {
                Alert.success('Détails du niveau mis à jour avec succès');
                router.reload({ only: ['level'] });
            },
            onError: (errors) => {
                Alert.error('Erreur lors de la mise à jour des détails');
                console.error('Erreur:', errors);
            },
        });
    };

    return {
        detailsData,
        levelData,
        setDetailsData,
        setLevelData,
        updateField,
        getFieldValue,
        processing,
        errors,
        reset,
        saveEdit,
    };
}
