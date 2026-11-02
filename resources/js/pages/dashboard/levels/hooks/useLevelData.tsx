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
        clearErrors,
    } = useForm({
        level_id: level?.level_id || '',
        credit_required: level?.credit_required || 0,
        duration_years: level?.duration_years || 0,
        courses_number: level?.courses_number || 0,
        price: level?.price ?? '',
        price_foreign: level?.price_foreign ?? '',
        price_national_first: level?.price_national_first ?? '',
        price_national_second: level?.price_national_second ?? '',
        price_foreign_first: level?.price_foreign_first ?? '',
        price_foreign_second: level?.price_foreign_second ?? '',
        language: level?.language || 'Non spécifiée',
        student_number: level?.student_number || 0,
        has_certificate: level?.has_certificate || false,
        illustration_image: level?.illustration_image || '',
        course_objective: level?.course_objective || '',
        options: safeJsonParse(level?.options, []),
        fees: level?.fees || 0,
        level_code: level?.level_code || '',
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

        formData.append('credit_required', detailsData.credit_required || 0);
        formData.append('duration_years', detailsData.duration_years || 0);
        formData.append('courses_number', detailsData.courses_number || 0);
        formData.append('price', detailsData.price ?? '');
        formData.append('price_foreign', detailsData.price_foreign ?? '');
        formData.append('price_national_first', detailsData.price_national_first ?? '');
        formData.append('price_national_second', detailsData.price_national_second ?? '');
        formData.append('price_foreign_first', detailsData.price_foreign_first ?? '');
        formData.append('price_foreign_second', detailsData.price_foreign_second ?? '');
        formData.append('language', detailsData.language || '');
        formData.append('has_certificate', detailsData.has_certificate ? '1' : '0');
        formData.append('student_number', detailsData.student_number || 0);
        formData.append('course_objective', detailsData.course_objective || '');
        formData.append('fees', detailsData.fees || 0);

        if (detailsData.illustration_image instanceof File) {
            formData.append('illustration_image', detailsData.illustration_image);
        }

        processedOptions.forEach((option, index) => {
            formData.append(`options[${index}]`, option);
        });

        formData.append('_method', 'PUT');

        return router.post(route('dashboard.admin.levels.details.update', levelDetailId), formData, {
            forceFormData: true,
            onSuccess: () => {
                Alert.success('Détails du niveau mis à jour avec succès');
                reset();
                clearErrors();
                router.reload({ only: ['levels'] });
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
