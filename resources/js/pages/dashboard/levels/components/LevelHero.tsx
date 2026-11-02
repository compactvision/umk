import { Award, Building2, Clock3, GraduationCap } from 'lucide-react';
export default function LevelHero({
    levelData,
    levelDetail,
}: {
    levelData: { duration_years?: number; has_certificate?: boolean };
    levelDetail?: { faculty_name?: string; level_title?: string; level_description?: string; level_code?: string };
}) {
    return (
        <header className="ld-hero">
            <div className="ld-hero-content">
                <span className="ld-eyebrow">OFFRE DE FORMATION · USK</span>
                <div className="ld-faculty">
                    <Building2 size={15} strokeWidth={1.7} />
                    {levelDetail?.faculty_name || 'Université Simon Kimbangu'}
                </div>
                <h1>{levelDetail?.level_title || 'Niveau de formation'}</h1>
                <p>{levelDetail?.level_description || 'Retrouvez les informations du programme et les conditions pour rejoindre ce parcours.'}</p>
                <div className="ld-hero-tags">
                    {levelDetail?.level_code && (
                        <span>
                            <GraduationCap size={15} />
                            {levelDetail.level_code}
                        </span>
                    )}
                    {levelData.duration_years > 0 && (
                        <span>
                            <Clock3 size={15} />
                            {levelData.duration_years} an{levelData.duration_years > 1 ? 's' : ''}
                        </span>
                    )}
                    {levelData.has_certificate && (
                        <span>
                            <Award size={15} />
                            Certificat délivré
                        </span>
                    )}
                </div>
            </div>
            <div className="ld-hero-seal" aria-hidden="true">
                <GraduationCap size={65} strokeWidth={1} />
                <span>SCIENCE · CONSCIENCE · VÉRITÉ</span>
                <strong>USK</strong>
            </div>
        </header>
    );
}
