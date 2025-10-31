import Dashboard from '@/components/layouts/Dashboard/Dashboard';
import { usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import LevelHero from './components/LevelHero';
import LevelNavigation from './components/LevelNavigation';
import LevelContent from './components/LevelContent';
import { useLevelData } from './hooks/useLevelData';
import { useLevelModals } from './hooks/useLevelModals';

export default function LevelShow() {
    const [activeTab, setActiveTab] = useState('infos');
    const [isAnimating, setIsAnimating] = useState(false);
    const { levelDetail, admissionConditions } = usePage().props;

    console.log("levelCondi Show", admissionConditions)

    const levelDataHook = useLevelData(levelDetail);
    const modalsHook = useLevelModals(levelDetail);

    useEffect(() => {
        setIsAnimating(true);
        const timer = setTimeout(() => setIsAnimating(false), 500);
        return () => clearTimeout(timer);
    }, [activeTab]);

    return (
        <Dashboard>
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 font-sans">
                <LevelHero 
                    levelData={levelDataHook.detailsData} 
                    levelDetail={levelDetail} 
                />
                
                <div className="max-w-7xl mx-auto px-6 relative z-30 -mt-16">
                    <LevelNavigation 
                        activeTab={activeTab} 
                        setActiveTab={setActiveTab} 
                    />
                    
                    <LevelContent
                        activeTab={activeTab}
                        isAnimating={isAnimating}
                        levelDataHook={levelDataHook}
                        modalsHook={modalsHook}
                        levelConditions={admissionConditions}
                    />
                </div>
            </div>
        </Dashboard>
    );
}