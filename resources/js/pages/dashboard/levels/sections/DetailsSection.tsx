import { Building, Award, User, Target, Edit3 } from 'lucide-react';
import { formatOptionsForDisplay } from '../utils/levelUtils';

export default function DetailsSection({ levelData, onEdit, getFieldValue }) {
    const formatOptions = () => {
        try {
            const options = levelData.details.options;
            if (!options) return 'Aucune opportunité définie';
            
            if (typeof options === 'string') {
                if (!options.trim()) return 'Aucune opportunité définie';
                if (options.startsWith('[') || options.startsWith('{')) {
                    try {
                        const parsed = JSON.parse(options);
                        if (Array.isArray(parsed)) {
                            return parsed.length > 0 ? parsed.join(', ') : 'Aucune opportunité définie';
                        }
                        return parsed.toString() || 'Aucune opportunité définie';
                    } catch (error) {
                        return options;
                    }
                }
                return options;
            }
            
            if (Array.isArray(options)) {
                return options.length > 0 ? options.join(', ') : 'Aucune opportunité définie';
            }
            
            return 'Aucune opportunité définie';
        } catch (error) {
            console.warn('Erreur lors du parsing des options:', error);
            return levelData.details.options?.toString() || 'Aucune opportunité définie';
        }
    };

    const details = [
        {
            field: 'details.language',
            label: "Langue d'enseignement",
            value: levelData.details.language || 'Non spécifiée',
            icon: <Building size={20} />,
        },
        {
            field: 'details.has_certificate',
            label: 'Délivrance de certificat',
            value: levelData.details.has_certificate ? 'Oui' : 'Non',
            icon: <Award size={20} />,
        },
        {
            field: 'details.options',
            label: 'Opportunités professionnelles',
            value: formatOptions(),
            icon: <User size={20} />,
        },
        {
            field: 'details.course_objective',
            label: 'Objectifs du cours',
            value: levelData.details.course_objective || 'Aucun objectif défini',
            icon: <Target size={20} />,
        },
    ];

    return (
        <div className="details-section">
            <h3 className="details-section__title">Détails du programme</h3>
            <div className="details-list">
                {details.map((item) => (
                    <div key={item.field} className="detail-item">
                        <div className="detail-item__content">
                            <div className="detail-item__icon">{item.icon}</div>
                            <div className="detail-item__info">
                                <div className="detail-item__label">{item.label}</div>
                                <div className="detail-item__value">{item.value}</div>
                            </div>
                        </div>
                        <button
                            onClick={() => onEdit(item.field, getFieldValue(item.field))}
                            className="detail-item__edit"
                        >
                            <Edit3 size={16} />
                            Modifier
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}