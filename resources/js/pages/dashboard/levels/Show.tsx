import Dashboard from '@/components/layouts/Dashboard/Dashboard';
import { usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import LevelHero from './components/LevelHero';
import LevelNavigation from './components/LevelNavigation';
import LevelContent from './components/LevelContent';
import { useLevelData } from './hooks/useLevelData';
import { useLevelModals } from './hooks/useLevelModals';
import './Level.css';

export default function LevelShow() {
    const [activeTab, setActiveTab] = useState('infos');
    const [isAnimating, setIsAnimating] = useState(false);
    const { level, levelDetail } = usePage().props;

    const levelDataHook = useLevelData(level);
    const modalsHook = useLevelModals(level);

    useEffect(() => {
        setIsAnimating(true);
        const timer = setTimeout(() => setIsAnimating(false), 500);
        return () => clearTimeout(timer);
    }, [activeTab]);

    return (
        <Dashboard>
            <div className="level-page">
                <LevelHero 
                    levelData={levelDataHook.levelData} 
                    levelDetail={levelDetail} 
                />
                
                <div className="level-container">
                    <LevelNavigation 
                        activeTab={activeTab} 
                        setActiveTab={setActiveTab} 
                    />
                    
                    <LevelContent
                        activeTab={activeTab}
                        isAnimating={isAnimating}
                        levelDataHook={levelDataHook}
                        modalsHook={modalsHook}
                        level={level}
                    />
                </div>
            </div>
        </Dashboard>
    );
}