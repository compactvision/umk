import type { AdmissionCondition } from '@/types/academic';
import type { useLevelData } from '../hooks/useLevelData';
import type { useLevelModals } from '../hooks/useLevelModals';
import ConditionModal from '../modals/ConditionModal';
import EditModal from '../modals/EditModal';
import ImagePreviewModal from '../modals/ImagePreviewModal';
import ConditionsTab from '../tabs/ConditionsTab';
import CoursesTab from '../tabs/CoursesTab';
import InfosTab from '../tabs/InfosTab';
import ProfessorsTab from '../tabs/ProfessorsTab';

export default function LevelContent({
    activeTab,
    levelDataHook,
    modalsHook,
    levelConditions,
    campaignsHref,
}: {
    activeTab: string;
    levelDataHook: ReturnType<typeof useLevelData>;
    modalsHook: ReturnType<typeof useLevelModals>;
    levelConditions: AdmissionCondition[];
    campaignsHref?: string;
}) {
    const renderActiveTab = () => {
        switch (activeTab) {
            case 'infos':
                return <InfosTab levelDataHook={levelDataHook} modalsHook={modalsHook} />;
            case 'prof':
                return <ProfessorsTab />;
            case 'conditions':
                return <ConditionsTab levelConditions={levelConditions} modalsHook={modalsHook} campaignsHref={campaignsHref} />;
            case 'cours':
                return <CoursesTab />;
            default:
                return <InfosTab levelDataHook={levelDataHook} modalsHook={modalsHook} />;
        }
    };

    return (
        <>
            <div className="ld-tab-content">{renderActiveTab()}</div>

            {/* Modals */}
            <EditModal
                isOpen={modalsHook.isEditModalOpen}
                editField={modalsHook.editField}
                levelDataHook={levelDataHook}
                onClose={() => modalsHook.setIsEditModalOpen(false)}
                onSave={modalsHook.saveEdit}
                saving={modalsHook.editSaving}
                saveErrors={modalsHook.editErrors}
            />

            <ConditionModal
                isOpen={modalsHook.isConditionModalOpen}
                conditionMode={modalsHook.conditionMode}
                conditionData={modalsHook.conditionData}
                onClose={() => modalsHook.setIsConditionModalOpen(false)}
                onSave={modalsHook.saveCondition}
                setConditionData={modalsHook.setConditionData}
                conditionProcessing={modalsHook.conditionProcessing}
                conditionErrors={modalsHook.conditionErrors}
            />

            <ImagePreviewModal
                isOpen={modalsHook.isImagePreviewOpen}
                imageSrc={levelDataHook.detailsData.illustration_image}
                onClose={() => modalsHook.setIsImagePreviewOpen(false)}
            />
        </>
    );
}
