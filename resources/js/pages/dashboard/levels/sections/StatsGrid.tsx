import { 
    Award, BookOpen, Clock, GraduationCap, DollarSign, MapPin, Edit3 
} from 'lucide-react';
import { formatValue, getFieldLabel } from '../utils/levelUtils';

export default function StatsGrid({ levelData, onEdit }: { levelData: any; onEdit: any }) {
    const stats = [
        {
            field: 'level_code',
            value: formatValue(levelData.level_code),
            icon: <Award size={24} />,
            color: 'purple',
        },
        {
            field: 'credit_required',
            value: formatValue(levelData.credit_required),
            icon: <BookOpen size={24} />,
            color: 'blue',
        },
        {
            field: 'semestres',
            value: levelData.duration_years && levelData.duration_years > 0 
                ? levelData.duration_years * 2 
                : 'Non défini',
            icon: <Clock size={24} />,
            color: 'green',
        },
        {
            field: 'duration_years',
            value: formatValue(levelData.duration_years),
            icon: <Clock size={24} />,
            color: 'orange',
        },
        {
            field: 'courses_number',
            value: formatValue(levelData.courses_number),
            icon: <GraduationCap size={24} />,
            color: 'red',
        },
        {
            field: 'price',
            value: levelData.price && levelData.price > 0 
                ? `${levelData.price} $` 
                : 'Prix non fixé',
            icon: <DollarSign size={24} />,
            color: 'green',
        },
        {
            field: 'student_number',
            value: formatValue(levelData.student_number),
            icon: <MapPin size={24} />,
            color: 'blue',
        },
        {
            field: 'fees',
            value: levelData.fees && levelData.fees > 0 
                ? `${levelData.fees} $` 
                : 'Pas de frais',
            icon: <DollarSign size={24} />,
            color: 'green',
        },
    ];

    const getColorClasses = (color) => {
        const colorMap = {
            purple: {
                border: 'border-purple-500',
                bg: 'bg-gradient-to-r from-purple-500 to-purple-600',
                iconBg: 'bg-gradient-to-r from-purple-500 to-purple-600',
                iconText: 'text-white'
            },
            blue: {
                border: 'border-blue-500',
                bg: 'bg-gradient-to-r from-blue-500 to-blue-600',
                iconBg: 'bg-gradient-to-r from-blue-500 to-blue-600',
                iconText: 'text-white'
            },
            green: {
                border: 'border-green-500',
                bg: 'bg-gradient-to-r from-green-500 to-green-600',
                iconBg: 'bg-gradient-to-r from-green-500 to-green-600',
                iconText: 'text-white'
            },
            orange: {
                border: 'border-orange-500',
                bg: 'bg-gradient-to-r from-orange-500 to-orange-600',
                iconBg: 'bg-gradient-to-r from-orange-500 to-orange-600',
                iconText: 'text-white'
            },
            red: {
                border: 'border-red-500',
                bg: 'bg-gradient-to-r from-red-500 to-red-600',
                iconBg: 'bg-gradient-to-r from-red-500 to-red-600',
                iconText: 'text-white'
            }
        };
        return colorMap[color] || colorMap.blue;
    };

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
            {stats.map((stat, index) => {
                const colors = getColorClasses(stat.color);
                return (
                    <div
                        key={stat.field}
                        className="bg-white rounded-2xl p-8 shadow-lg border border-white/80 relative overflow-hidden transition-all duration-300 cursor-pointer hover:-translate-y-2 hover:scale-105 hover:shadow-xl animate-fadeInUp"
                        style={{ animationDelay: `${index * 100}ms` }}
                    >
                        <div className={`h-1 ${colors.bg} absolute top-0 left-0 right-0`}></div>
                        <div className={`inline-flex p-4 rounded-2xl mb-6 text-white ${colors.iconBg}`}>
                            {stat.icon}
                        </div>
                        <div className="text-xs font-medium text-slate-600 mb-2 uppercase tracking-wider">
                            {getFieldLabel(stat.field)}
                        </div>
                        <div className="text-4xl font-extrabold text-slate-800 mb-4 leading-none">
                            {stat.value}
                        </div>
                        {stat.field !== 'level_code' && (
                            <button 
                                className="inline-flex items-center gap-2 text-slate-600 text-sm font-medium hover:text-blue-500 transition-colors duration-200"
                                onClick={() => onEdit(stat.field, stat.value)}
                            >
                                <Edit3 size={16} />
                                <span className="hidden sm:inline">Modifier</span>
                                <span className="sm:hidden">Edit</span>
                            </button>
                        )}
                    </div>
                );
            })}
        </div>
    );
}