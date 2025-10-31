import { Building, Award, User, Target, Edit3 } from 'lucide-react';

export default function DetailsSection({ levelData, onEdit, getFieldValue }) {
    const formatOptions = () => {
        try {
            const options = levelData.options;
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
            return levelData.options?.toString() || 'Aucune opportunité définie';
        }
    };

    const details = [
        {
            field: 'language',
            label: "Langue d'enseignement",
            value: levelData.language || 'Non spécifiée',
            icon: <Building size={20} />,
        },
        {
            field: 'has_certificate',
            label: 'Délivrance de certificat',
            value: levelData.has_certificate ? 'Oui' : 'Non',
            icon: <Award size={20} />,
        },
        {
            field: 'options',
            label: 'Opportunités professionnelles',
            value: formatOptions(),
            icon: <User size={20} />,
        },
        {
            field: 'course_objective',
            label: 'Objectifs du cours',
            value: levelData.course_objective || 'Aucun objectif défini',
            icon: <Target size={20} />,
        },
    ];

    return (
        <div className="bg-white rounded-3xl shadow-lg border border-white/80 p-10 mb-8">
            <h3 className="text-3xl font-bold text-slate-800 mb-8">Détails du programme</h3>
            <div className="flex flex-col gap-6">
                {details.map((item) => (
                    <div 
                        key={item.field} 
                        className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl transition-all duration-300 border border-transparent hover:bg-slate-100 hover:border-slate-200 hover:translate-x-1"
                    >
                        <div className="flex items-center gap-4">
                            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-100 to-blue-200 rounded-xl text-blue-500">
                                {item.icon}
                            </div>
                            <div className="flex flex-col">
                                <div className="font-semibold text-slate-800 mb-1">{item.label}</div>
                                <div className="text-slate-600 text-sm leading-relaxed">{item.value}</div>
                            </div>
                        </div>
                        <button
                            onClick={() => onEdit(item.field, getFieldValue(item.field))}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white border-none rounded-lg text-sm font-medium cursor-pointer transition-all duration-200 hover:bg-blue-600 hover:-translate-y-0.5 hover:shadow-md"
                        >
                            <Edit3 size={16} />
                            <span className="hidden sm:inline">Modifier</span>
                            <span className="sm:hidden">Edit</span>
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}