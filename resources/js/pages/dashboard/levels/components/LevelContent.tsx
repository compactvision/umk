import InfosTab from '../tabs/InfosTab';
import ProfessorsTab from '../tabs/ProfessorsTab';
import ConditionsTab from '../tabs/ConditionsTab';
import CoursesTab from '../tabs/CoursesTab';
import EditModal from '../modals/EditModal';
import ConditionModal from '../modals/ConditionModal';
import ImagePreviewModal from '../modals/ImagePreviewModal';

export default function LevelContent({ 
    activeTab, 
    isAnimating, 
    levelDataHook, 
    modalsHook, 
    levelConditions 
}) {
    console.log("LevelCOntent", levelConditions)
    const renderActiveTab = () => {
        switch (activeTab) {
            case 'infos':
                return (
                    <InfosTab 
                        levelDataHook={levelDataHook} 
                        modalsHook={modalsHook} 
                    />
                );
            case 'prof':
                return <ProfessorsTab />;
            case 'conditions':
                return (
                    <ConditionsTab 
                        levelConditions={levelConditions} 
                        modalsHook={modalsHook} 
                    />
                );
            case 'cours':
                return <CoursesTab />;
            default:
                return <InfosTab levelDataHook={levelDataHook} modalsHook={modalsHook} />;
        }
    };

    return (
        <>
            <div className={`level-content ${
                isAnimating ? 'level-content--animating' : 'level-content--visible'
            }`}>
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