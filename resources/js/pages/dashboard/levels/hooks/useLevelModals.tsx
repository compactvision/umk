import { useState } from 'react';
import { useForm, router } from '@inertiajs/react';
import Alert from '@/utils/sweetAlert';

export function useLevelModals(level) {
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editField, setEditField] = useState('');
    const [isConditionModalOpen, setIsConditionModalOpen] = useState(false);
    const [conditionMode, setConditionMode] = useState('add');
    const [editIndex, setEditIndex] = useState(null);
    const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);

    // Formulaire pour les conditions
    const {
        data: conditionData,
        setData: setConditionData,
        post: postCondition,
        put: putCondition,
        processing: conditionProcessing,
        reset: resetCondition,
    } = useForm({
        faculty_id: level?.faculty?.id || '',
        level_id: level?.id || '',
        title: '',
        description: '',
        section: '',
        id: null,
    });

    const openEditModal = (field, value) => {
        setEditField(field);
        setIsEditModalOpen(true);
    };

    const saveEdit = (levelDataHook) => {
        setIsEditModalOpen(false);
        return levelDataHook.saveEdit(editField);
    };

    const openConditionModal = (mode, conditionId = null, condition = null) => {
        setConditionMode(mode);
        setEditIndex(conditionId);
        
        if (mode === 'edit' && condition) {
            setConditionData({
                faculty_id: level?.faculty?.id || '',
                level_id: level?.id || '',
                title: condition.title || '',
                description: condition.description || '',
                section: condition.section || '',
                id: condition.id,
            });
        } else {
            resetCondition();
            setConditionData({
                faculty_id: level?.faculty?.id || '',
                level_id: level?.id || '',
                title: '',
                description: '',
                section: '',
                id: null,
            });
        }
        
        setIsConditionModalOpen(true);
    };

    const saveCondition = (e) => {
        e.preventDefault();

        if (conditionMode === 'add') {
            postCondition(route('dashboard.admission.store'), {
                onSuccess: () => {
                    Alert.success("Condition d'admission ajoutée avec succès");
                    setIsConditionModalOpen(false);
                    resetCondition();
                },
                onError: (errors) => {
                    Alert.error("Erreur lors de l'ajout de la condition d'admission");
                    console.error("Erreur lors de l'ajout de la condition d'admission:", errors);
                },
            });
        } else if (conditionMode === 'edit' && conditionData.id) {
            putCondition(route('dashboard.admission.update', conditionData.id), {
                onSuccess: () => {
                    Alert.success("Condition d'admission mise à jour avec succès");
                    setIsConditionModalOpen(false);
                    resetCondition();
                },
                onError: (errors) => {
                    Alert.error("Erreur lors de la mise à jour de la condition d'admission");
                    console.error("Erreur lors de la mise à jour de la condition d'admission:", errors);
                },
            });
        }
    };

    const deleteCondition = async (conditionId) => {
        const confirmed = await Alert.deleteConfirm('cette condition');
        if (!confirmed) return;

        Alert.loading('Suppression en cours...');
        router.delete(route('dashboard.admission.destroy', conditionId), {
            onSuccess: () => {
                Alert.success("Condition d'admission supprimée avec succès");
            },
            onError: (errors) => {
                Alert.error("Erreur lors de la suppression de la condition d'admission");
                console.error("Erreur lors de la suppression de la condition d'admission:", errors);
            },
        });
    };

    return {
        // States
        isEditModalOpen,
        setIsEditModalOpen,
        editField,
        setEditField,
        isConditionModalOpen,
        setIsConditionModalOpen,
        conditionMode,
        setConditionMode,
        editIndex,
        setEditIndex,
        isImagePreviewOpen,
        setIsImagePreviewOpen,
        
        // Condition form data
        conditionData,
        setConditionData,
        conditionProcessing,
        
        // Actions
        openEditModal,
        saveEdit,
        openConditionModal,
        saveCondition,
        deleteCondition,
        resetCondition
    };
}