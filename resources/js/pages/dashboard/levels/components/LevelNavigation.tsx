import { BookOpen, ClipboardCheck, GraduationCap, Users } from 'lucide-react';
const tabs = [
    { id: 'infos', label: 'Vue d’ensemble', icon: BookOpen },
    { id: 'conditions', label: 'Conditions d’admission', icon: ClipboardCheck },
    { id: 'prof', label: 'Enseignants', icon: Users },
    { id: 'cours', label: 'Cours', icon: GraduationCap },
];
export default function LevelNavigation({
    activeTab,
    setActiveTab,
    conditionCount = 0,
}: {
    activeTab: string;
    setActiveTab: (tab: string) => void;
    conditionCount?: number;
}) {
    return (
        <nav className="ld-nav" aria-label="Sections du niveau">
            <div role="tablist" aria-label="Détails de la formation">
                {tabs.map((tab, index) => (
                    <button
                        key={tab.id}
                        id={`level-tab-${tab.id}`}
                        role="tab"
                        type="button"
                        aria-selected={activeTab === tab.id}
                        aria-controls={`level-panel-${tab.id}`}
                        tabIndex={activeTab === tab.id ? 0 : -1}
                        onClick={() => setActiveTab(tab.id)}
                        onKeyDown={(event) => {
                            let next = index;
                            if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
                            else if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
                            else if (event.key === 'Home') next = 0;
                            else if (event.key === 'End') next = tabs.length - 1;
                            else return;
                            event.preventDefault();
                            setActiveTab(tabs[next].id);
                            document.getElementById(`level-tab-${tabs[next].id}`)?.focus();
                        }}
                    >
                        <tab.icon size={17} strokeWidth={1.7} />
                        {tab.label}
                        {tab.id === 'conditions' && <span>{conditionCount}</span>}
                    </button>
                ))}
            </div>
        </nav>
    );
}
