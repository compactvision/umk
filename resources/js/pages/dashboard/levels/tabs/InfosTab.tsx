import DetailsSection from '../sections/DetailsSection';
import IllustrationSection from '../sections/IllustrationSection';
import StatsGrid from '../sections/StatsGrid';
export default function InfosTab({ levelDataHook, modalsHook }) {
    return (
        <div className="ld-info-sections">
            <StatsGrid levelData={levelDataHook.detailsData} onEdit={modalsHook.openEditModal} />
            <DetailsSection levelData={levelDataHook.detailsData} onEdit={modalsHook.openEditModal} getFieldValue={levelDataHook.getFieldValue} />
            <IllustrationSection
                levelData={levelDataHook.detailsData}
                onEdit={modalsHook.openEditModal}
                onPreview={() => modalsHook.setIsImagePreviewOpen(true)}
            />
        </div>
    );
}
