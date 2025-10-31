import { Building } from 'lucide-react';

export default function LevelHero({ levelData, levelDetail }: { levelData: any; levelDetail: any }) {
    return (
        <div className="relative h-96 overflow-hidden -mt-[5%] mb-0">
            <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/40 to-black/20 z-20"></div>
            <img
                src={levelData.image ? `/storage/${levelData.image}` : '/assets/img/bg/hero.jpg'}
                alt={levelData.level_name || 'Niveau'}
                className="w-full h-full object-cover brightness-110 contrast-105"
            />
            <div className="absolute inset-0 z-30 flex items-center px-12">
                <div className="max-w-[50rem] text-white">
                    <div className="flex items-center gap-3 mb-2 text-indigo-300 font-medium">
                        <Building size={20} />
                        <span>{levelDetail?.faculty_name || levelDetail.faculty_name}</span>
                    </div>
                    <h1 className="text-5xl font-extrabold mb-4 bg-gradient-to-br from-white to-blue-100 bg-clip-text text-transparent leading-tight">
                        {levelDetail.level_title || 'Nom du niveau non défini'}
                    </h1>
                    <p className="text-xl text-gray-200 leading-relaxed mb-8 max-w-[42rem]">
                        {levelDetail.level_description || 'Description non disponible'}
                    </p>
                </div>
            </div>
        </div>
    );
}