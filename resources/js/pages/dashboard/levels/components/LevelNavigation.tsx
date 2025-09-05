import { BookOpen, Users, CheckCircle, GraduationCap } from 'lucide-react';

const navigationItems = [
    { id: 'infos', label: 'Informations', icon: <BookOpen size={20} /> },
    { id: 'prof', label: 'Professeurs', icon: <Users size={20} /> },
    { id: 'conditions', label: 'Conditions', icon: <CheckCircle size={20} /> },
    { id: 'cours', label: 'Cours', icon: <GraduationCap size={20} /> },
];

export default function LevelNavigation({ activeTab, setActiveTab }) {
    return (
        <nav className="level-nav">
            <ul className="level-nav__list">
                {navigationItems.map((tab) => (
                    <li key={tab.id} className="level-nav__item">
                        <button
                            onClick={() => setActiveTab(tab.id)}
                            className={`level-nav__btn ${
                                activeTab === tab.id 
                                    ? 'level-nav__btn--active' 
                                    : 'level-nav__btn--inactive'
                            }`}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    </li>
                ))}
            </ul>
        </nav>
    );
}