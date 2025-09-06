import StatsGrid from '../sections/StatsGrid';
import IllustrationSection from '../sections/IllustrationSection';
import DetailsSection from '../sections/DetailsSection';

export default function InfosTab({ levelDataHook, modalsHook }) {
    console.log("infostab", levelDataHook)
    return (
        <div>
            <StatsGrid 
                levelData={levelDataHook.detailsData}
                onEdit={modalsHook.openEditModal}
            />
            
            <IllustrationSection
                levelData={levelDataHook.detailsData}
                onEdit={modalsHook.openEditModal}
                onPreview={() => modalsHook.setIsImagePreviewOpen(true)}
            />
            
            <DetailsSection
                levelData={levelDataHook.detailsData}
                onEdit={modalsHook.openEditModal}
                getFieldValue={levelDataHook.getFieldValue}
            />
        </div>
    );
}