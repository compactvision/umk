import { ImageIcon as ImageIcon, Eye, Edit3, Upload } from 'lucide-react';

export default function IllustrationSection({ levelData, onEdit, onPreview }) {
    if (levelData.illustration_image) {
        return (
            <div className="bg-white rounded-3xl shadow-lg border border-white/80 p-10 mb-8">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                        <ImageIcon size={24} />
                        Illustration du programme
                    </h3>
                    <div className="flex gap-3">
                        <button
                            onClick={onPreview}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-600 border-none rounded-lg text-sm font-medium cursor-pointer transition-all duration-200 hover:bg-blue-200 hover:-translate-y-0.5"
                        >
                            <Eye size={16} />
                            <span className="hidden sm:inline">Aperçu complet</span>
                            <span className="sm:hidden">Aperçu</span>
                        </button>
                        <button
                            onClick={() => onEdit('illustration_image', levelData.illustration_image)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-600 border-none rounded-lg text-sm font-medium cursor-pointer transition-all duration-200 hover:bg-indigo-200 hover:-translate-y-0.5"
                        >
                            <Edit3 size={16} />
                            <span className="hidden sm:inline">Modifier</span>
                            <span className="sm:hidden">Edit</span>
                        </button>
                    </div>
                </div>
                <div className="relative overflow-hidden rounded-2xl bg-slate-100">
                    <div className="relative group cursor-pointer" onClick={onPreview}>
                        <img
                            src={`/storage/${levelData.illustration_image}`}
                            alt="Illustration du programme"
                            className="w-full h-64 sm:h-80 object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                            <div className="flex flex-col items-center gap-3 text-white p-6 bg-black/60 backdrop-blur-sm rounded-2xl transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                <ImageIcon size={32} />
                                <span className="text-center font-medium">Cliquez pour voir en grand</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-3xl shadow-lg border border-white/80 p-10 mb-8">
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="flex items-center justify-center w-24 h-24 bg-gradient-to-r from-slate-100 to-slate-200 rounded-3xl mb-6 text-slate-400">
                    <ImageIcon size={48} />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-3">Aucune illustration</h3>
                <p className="text-slate-600 mb-8 max-w-md">
                    Ajoutez une image d'illustration pour enrichir la présentation de votre programme
                </p>
                <button
                    onClick={() => onEdit('illustration_image', '')}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-none rounded-xl font-medium cursor-pointer transition-all duration-300 hover:from-blue-600 hover:to-indigo-700 hover:-translate-y-0.5 hover:shadow-lg"
                >
                    <Upload size={18} />
                    Ajouter une illustration
                </button>
            </div>
        </div>
    );
}