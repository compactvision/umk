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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {faculty.professors.map((prof) => (
                <div 
                    className="bg-white rounded-2xl p-8 shadow-lg border border-white/80 relative overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-xl group"
                    key={prof.id}
                >
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-600"></div>
                    
                    <div className="flex items-center gap-4 mb-6">
                        <img 
                            src={prof.avatar} 
                            alt={prof.name} 
                            className="w-20 h-20 rounded-full object-cover border-4 border-slate-100 shadow-lg group-hover:scale-110 transition-transform duration-300"
                        />
                        <div className="flex-1">
                            <h3 className="text-xl font-bold text-slate-800 mb-1 group-hover:text-indigo-600 transition-colors duration-300">
                                {prof.name}
                            </h3>
                            <p className="text-slate-600 text-sm mb-2">{prof.role}</p>
                            <span className="inline-block px-3 py-1 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-600 text-xs font-medium rounded-full">
                                {prof.specialty}
                            </span>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                        <Mail size={16} className="text-slate-500" />
                        <span className="text-slate-600 text-sm">{prof.contact}</span>
                    </div>
                </div>
            ))}
        </div>
    );
}