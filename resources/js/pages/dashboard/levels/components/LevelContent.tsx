import ConditionModal from '../modals/ConditionModal';
import EditModal from '../modals/EditModal';
import ImagePreviewModal from '../modals/ImagePreviewModal';
import ConditionsTab from '../tabs/ConditionsTab';
import CoursesTab from '../tabs/CoursesTab';
import InfosTab from '../tabs/InfosTab';
import ProfessorsTab from '../tabs/ProfessorsTab';

export default function LevelContent({ activeTab, isAnimating, levelDataHook, modalsHook, levelConditions }) {
    console.log('LevelCOntent', levelConditions);
    const renderActiveTab = () => {
        switch (activeTab) {
            case 'infos':
                return <InfosTab levelDataHook={levelDataHook} modalsHook={modalsHook} />;
            case 'prof':
                return <ProfessorsTab />;
            case 'conditions':
                return <ConditionsTab levelConditions={levelConditions} modalsHook={modalsHook} />;
            case 'cours':
                return <CoursesTab />;
            default:
                return <InfosTab levelDataHook={levelDataHook} modalsHook={modalsHook} />;
        }
    };

    return (
        <>
            <div
                className={`origin-center transform transition-all duration-500 ease-in-out ${
                    isAnimating ? 'translate-x-4 scale-95 opacity-0' : 'translate-x-0 scale-100 opacity-100'
                }`}
            >
                {renderActiveTab()}
            </div>

            {/* Modals */}
            <EditModal
                isOpen={modalsHook.isEditModalOpen}
                editField={modalsHook.editField}
                levelDataHook={levelDataHook}
                onClose={() => modalsHook.setIsEditModalOpen(false)}
                onSave={modalsHook.saveEdit}
            />

            <ConditionModal
                isOpen={modalsHook.isConditionModalOpen}
                conditionMode={modalsHook.conditionMode}
                conditionData={modalsHook.conditionData}
                onClose={() => modalsHook.setIsConditionModalOpen(false)}
                onSave={modalsHook.saveCondition}
                setConditionData={modalsHook.setConditionData}
                conditionProcessing={modalsHook.conditionProcessing}
            />

            <ImagePreviewModal
                isOpen={modalsHook.isImagePreviewOpen}
                imageSrc={levelDataHook.detailsData.illustration_image}
                onClose={() => modalsHook.setIsImagePreviewOpen(false)}
            />
        </>
    );
}
