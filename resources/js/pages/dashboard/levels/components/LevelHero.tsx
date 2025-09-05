import { Building } from 'lucide-react';

export default function LevelHero({ levelData, levelDetail }) {
    return (
        <div className="level-hero">
            <div className="level-hero__overlay"></div>
            <img
                src={levelData.image ? `/storage/${levelData.image}` : '/default-hero.jpg'}
                alt={levelData.level_name || 'Niveau'}
                className="level-hero__banner"
            />
            <div className="level-hero__content">
                <div className="level-hero__info">
                    <div className="level-hero__faculty">
                        <Building size={20} />
                        <span>{levelDetail?.faculty_name || levelDetail.faculty_name}</span>
                    </div>
                    <h1 className="level-hero__title">
                        {levelData.level_name || 'Nom du niveau non défini'}
                    </h1>
                    <p className="level-hero__description">
                        {levelData.description || 'Description non disponible'}
                    </p>
                </div>
            </div>
        </div>
    );
}