import { BookOpen, Users, CheckCircle, GraduationCap } from 'lucide-react';

export default function LevelNavigation({ activeTab, setActiveTab }: { activeTab: string; setActiveTab: (tab: string) => void }) {
    const navigationItems = [
        { id: 'infos', label: 'Informations', icon: <BookOpen size={20} /> },
        { id: 'prof', label: 'Professeurs', icon: <Users size={20} /> },
        { id: 'conditions', label: 'Conditions', icon: <CheckCircle size={20} /> },
        { id: 'cours', label: 'Cours', icon: <GraduationCap size={20} /> },
    ];
    return (
        <nav className="sticky top-0 z-10 bg-white/95 backdrop-blur-lg rounded-2xl shadow-xl border border-white/30 p-2 mb-8">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-600/5 rounded-2xl -z-10"></div>
            <ul className="flex flex-wrap gap-2 relative z-10">
                {navigationItems.map((tab) => (
                    <li key={tab.id} className="flex-1 min-w-[120px]">
                        <button
                            onClick={() => setActiveTab(tab.id)}
                            className={`group flex items-center justify-center gap-2 w-full px-6 py-4 rounded-xl font-semibold text-sm transition-all duration-300 cursor-pointer relative overflow-hidden ${
                                activeTab === tab.id
                                    ? 'text-white bg-gradient-to-r from-indigo-500 to-purple-600 shadow-lg -translate-y-0.5 scale-105 z-20'
                                    : 'text-slate-600 bg-transparent hover:text-slate-800 hover:bg-slate-100 hover:-translate-y-0.5 hover:shadow-md z-10'
                            }`}
                        >
                            <div className={`absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-600/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${activeTab === tab.id ? 'opacity-0' : ''}`}></div>
                            {activeTab === tab.id && (
                                <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/30 rounded-b-xl"></div>
                            )}
                            <span className="relative z-10 flex items-center gap-2">
                                <span className={`transition-transform duration-300 ${activeTab === tab.id ? 'scale-110' : 'group-hover:scale-110'}`}>
                                    {tab.icon}
                                </span>
                                <span className="hidden sm:inline">{tab.label}</span>
                                <span className="sm:hidden">{tab.label.charAt(0)}</span>
                            </span>
                        </button>
                    </li>
                ))}
            </ul>
        </nav>
    );
}