import type { useLevelData } from '../hooks/useLevelData';
import type { useLevelModals } from '../hooks/useLevelModals';
import DetailsSection from '../sections/DetailsSection';
import IllustrationSection from '../sections/IllustrationSection';
import StatsGrid from '../sections/StatsGrid';
export default function InfosTab({ levelDataHook, modalsHook }: { levelDataHook: ReturnType<typeof useLevelData>; modalsHook: ReturnType<typeof useLevelModals> }) {
    const edit = (field: string) => {
        levelDataHook.resetDraft();
        modalsHook.openEditModal(field);
    };

    return (
        <div className="ld-info-sections">
            <StatsGrid levelData={levelDataHook.detailsData} onEdit={edit} />
            <DetailsSection levelData={levelDataHook.detailsData} onEdit={edit} />
            <IllustrationSection
                levelData={levelDataHook.detailsData}
                onEdit={edit}
                onPreview={() => modalsHook.setIsImagePreviewOpen(true)}
            />
        </div>
    );
}
