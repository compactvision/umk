import { Mail } from 'lucide-react';

const faculty = {
    name: 'Faculté des Sciences Informatiques',
    professors: [
        {
            id: 1,
            name: 'Dr. Jean Mbala',
            role: 'Professeur principal',
            contact: 'jean.mbala@univ.cd',
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
            specialty: 'Intelligence Artificielle',
        },
        {
            id: 2,
            name: 'Mme. Alice Kanza',
            role: 'Enseignante',
            contact: 'alice.kanza@univ.cd',
            avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
            specialty: 'Développement Web',
        },
        {
            id: 3,
            name: 'Pr. Michel Ngoyi',
            role: 'Coordonnateur académique',
            contact: 'michel.ngoyi@univ.cd',
            avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
            specialty: 'Bases de Données',
        },
    ],
};

export default function ProfessorsTab() {
    return (
        <div className="professors-grid">
            {faculty.professors.map((prof) => (
                <div className="professor-card" key={prof.id}>
                    <div className="professor-card__header">
                        <img src={prof.avatar} alt={prof.name} className="professor-card__avatar" />
                        <div className="professor-card__info">
                            <h3 className="professor-card__name">{prof.name}</h3>
                            <p className="professor-card__role">{prof.role}</p>
                            <span className="professor-card__specialty">{prof.specialty}</span>
                        </div>
                    </div>
                    <div className="professor-card__contact">
                        <Mail size={16} />
                        {prof.contact}
                    </div>
                </div>
            ))}
        </div>
    );
}
