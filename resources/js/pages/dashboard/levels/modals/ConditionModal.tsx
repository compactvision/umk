import ErrorText from '@/components/UI/ErrorText';
import { X, Save } from 'lucide-react';

export default function ConditionModal({
    isOpen,
    conditionMode,
    conditionData,
    onClose,
    onSave,
    setConditionData,
    conditionProcessing
}) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-100 p-4" onClick={onClose}>
            <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100 opacity-100" onClick={(e) => e.stopPropagation()}>
                <form onSubmit={onSave}>
                    <div className="flex items-center justify-between p-6 border-b border-slate-200">
                        <h2 className="text-2xl font-bold text-slate-800">
                            {conditionMode === 'add' ? 'Ajouter' : 'Modifier'} une condition
                        </h2>
                        <button type="button" className="flex items-center justify-center w-10 h-10 bg-slate-100 rounded-xl text-slate-600 hover:bg-slate-200 transition-colors duration-200" onClick={onClose}>
                            <X size={20} />
                        </button>
                    </div>
                    
                    <div className="p-6 space-y-6">
                        <div>
                            <label className="block font-semibold text-slate-700 mb-2">Titre</label>
                            <input
                                type="text"
                                className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                value={conditionData.title || ''}
                                onChange={(e) => setConditionData('title', e.target.value)}
                                placeholder="Exemple : Diplôme requis"
                                required
                            />
                        </div>

                        <div>
                            <label className="block font-semibold text-slate-700 mb-2">Description</label>
                            <textarea
                                className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none min-h-[120px]"
                                value={conditionData.description || ''}
                                onChange={(e) => setConditionData('description', e.target.value)}
                                placeholder="Exemple : Avoir un diplôme d'État avec mention"
                                required
                            />
                            <div className="mt-2 p-3 bg-slate-50 rounded-lg border-l-4 border-blue-500">
                                <span className="text-sm text-slate-600">
                                    💡 Décrivez clairement la condition requise pour l'admission au programme
                                </span>
                            </div>
                        </div>

                        <div>
                            <label className="block font-semibold text-slate-700 mb-2">Type</label>
                            <div className="relative">
                                <select
                                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 appearance-none cursor-pointer bg-white"
                                    value={conditionData.section || ''}
                                    onChange={(e) => setConditionData('section', e.target.value)}
                                    required
                                >
                                    <option value="">Sélectionnez un type</option>
                                    <option value="personal_info">Informations personnelles</option>
                                    <option value="academic_info">Informations académiques</option>
                                    <option value="other">Autre</option>
                                </select>
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block font-semibold text-slate-700 mb-2">Statut</label>
                            <div className="flex items-center gap-3">
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        id="is_active"
                                        type="checkbox"
                                        checked={!!conditionData.is_required}
                                        onChange={(e) => setConditionData('is_required', e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                                <span className="text-sm text-slate-600">
                                    {conditionData.is_required ? 'Requis' : 'Non requis'}
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex gap-3 justify-end p-6 border-t border-slate-200">
                        <button
                            type="button"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-semibold hover:bg-slate-200 transition-colors duration-200"
                            onClick={onClose}
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white border-none rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                            disabled={!conditionData.title?.trim() || !conditionData.description?.trim() || conditionProcessing}
                        >
                            <Save size={16} />
                            {conditionProcessing ? 'Traitement...' : conditionMode === 'add' ? 'Ajouter' : 'Modifier'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}