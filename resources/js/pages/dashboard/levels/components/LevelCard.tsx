import { Link } from '@inertiajs/react';
import { ArrowRight, GraduationCap } from 'lucide-react';
import { useState } from 'react';
export type CatalogLevel = {
    id: number;
    title: string;
    code: string;
    image?: string | null;
    description?: string | null;
    tag?: string | null;
    is_active?: boolean | number;
};
export default function LevelCard({ level }: { level: CatalogLevel }) {
    const [failed, setFailed] = useState(false);
    const image = level.image ? (/^(https?:\/\/|\/)/.test(level.image) ? level.image : `/storage/${level.image}`) : '';
    return (
        <Link className="levels-card" href={route('dashboard.admin.levels.details.show', level.id)}>
            <div className="levels-card-cover">
                {image && !failed ? (
                    <img src={image} alt="" loading="lazy" onError={() => setFailed(true)} />
                ) : (
                    <div className="levels-cover-placeholder">
                        <GraduationCap size={44} strokeWidth={1.2} />
                        <span>UNIVERSITÉ SIMON KIMBANGU</span>
                    </div>
                )}
                <span className="levels-code">{level.code}</span>
            </div>
            <div className="levels-card-body">
                <div className="levels-card-eyebrow">
                    <span>{level.tag || 'Parcours académique'}</span>
                    <span className={`levels-status ${level.is_active ? '' : 'is-inactive'}`}>{level.is_active ? 'Actif' : 'Inactif'}</span>
                </div>
                <h3>{level.title}</h3>
                {level.description && <p className="levels-card-description">{level.description}</p>}
                <div className="levels-card-footer">
                    <span>Consulter le niveau</span>
                    <ArrowRight size={18} strokeWidth={1.7} />
                </div>
            </div>
        </Link>
    );
}
