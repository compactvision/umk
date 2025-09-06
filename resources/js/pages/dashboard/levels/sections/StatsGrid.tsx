import { 
    Award, BookOpen, Clock, GraduationCap, DollarSign, MapPin, Edit3 
} from 'lucide-react';
import { formatValue, getFieldLabel } from '../utils/levelUtils';

export default function StatsGrid({ levelData, onEdit }) {
    console.log("...",levelData)
    const stats = [
        {
            field: 'level_code',
            value: formatValue(levelData.level_code),
            icon: <Award size={24} />,
            color: 'purple',
        },
        {
            field: 'details.credit_required',
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
            field: 'details.duration_years',
            value: formatValue(levelData.duration_years),
            icon: <Clock size={24} />,
            color: 'orange',
        },
        {
            field: 'details.courses_number',
            value: formatValue(levelData.courses_number),
            icon: <GraduationCap size={24} />,
            color: 'red',
        },
        {
            field: 'details.price',
            value: levelData.price && levelData.price > 0 
                ? `${levelData.price} $` 
                : 'Prix non fixé',
            icon: <DollarSign size={24} />,
            color: 'green',
        },
        {
            field: 'details.student_number',
            value: formatValue(levelData.student_number),
            icon: <MapPin size={24} />,
            color: 'blue',
        },
        {
            field: 'details.fees',
            value: levelData.fees && levelData.fees > 0 
                ? `${levelData.fees} $` 
                : 'Frais non fixé',
            icon: <DollarSign size={24} />,
            color: 'green',
        },
    ];

    return (
        <div className="stats-grid">
            {stats.map((stat, index) => (
                <div
                    key={stat.field}
                    className={`stat-card stat-card--${stat.color}`}
                    style={{ animationDelay: `${index * 100}ms` }}
                >
                    <div className={`stat-card__icon stat-card__icon--${stat.color}`}>
                        {stat.icon}
                    </div>
                    <div className="stat-card__label">
                        {getFieldLabel(stat.field)}
                    </div>
                    <div className="stat-card__value">{stat.value}</div>
                    <button 
                        className="detail-item__edit" 
                        onClick={() => onEdit(stat.field, stat.value)}
                    >
                        <Edit3 size={16} />
                        Modifier
                    </button>
                </div>
            ))}
        </div>
    );
}