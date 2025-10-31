import { Plus, Edit3, Trash2 } from 'lucide-react';

export default function ConditionsTab({ levelConditions, modalsHook }) {
    console.log("conditions",levelConditions);
    return (
        <div className="bg-white rounded-3xl shadow-lg border border-white/80 p-10">
            <div className="flex items-center justify-between mb-8">
                <h3 className="text-3xl font-bold text-slate-800">Conditions d'admission</h3>
                <button 
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white border-none rounded-xl font-semibold cursor-pointer transition-all duration-300 hover:from-green-600 hover:to-green-700 hover:-translate-y-0.5 hover:shadow-lg shadow-green-500/30"
                    onClick={() => modalsHook.openConditionModal('add')}
                >
                    <Plus size={20} />
                    <span className="hidden sm:inline">Ajouter une condition</span>
                    <span className="sm:hidden">Ajouter</span>
                </button>
            </div>
            
            <ul className="list-none p-0 m-0 flex flex-col gap-4">
                {levelConditions && levelConditions.length > 0 ? (
                    levelConditions.map((condition) => (
                        <li key={condition.id} className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-200 transition-all duration-300 hover:bg-slate-100 hover:border-slate-300 hover:translate-x-1">
                            <div className="flex items-center gap-4 flex-1">
                                <div className="w-2 h-2 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex-shrink-0"></div>
                                <div className="flex flex-col flex-1">
                                    <span className="font-bold text-slate-800 mb-1">
                                        {condition.title}
                                    </span>
                                    <p className="text-slate-600 text-sm leading-relaxed">
                                        {condition.description}
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    className="inline-flex items-center gap-1 px-3 py-2 bg-blue-100 text-blue-600 border-none rounded-lg text-xs font-medium cursor-pointer transition-all duration-200 hover:bg-blue-200 hover:-translate-y-0.5"
                                    onClick={() => modalsHook.openConditionModal('edit', condition.id, condition)}
                                >
                                    <Edit3 size={14} />
                                    <span className="hidden sm:inline">Modifier</span>
                                    <span className="sm:hidden">Edit</span>
                                </button>
                                <button
                                    className="inline-flex items-center gap-1 px-3 py-2 bg-red-100 text-red-600 border-none rounded-lg text-xs font-medium cursor-pointer transition-all duration-200 hover:bg-red-200 hover:-translate-y-0.5"
                                    onClick={() => modalsHook.deleteCondition(condition.id)}
                                >
                                    <Trash2 size={14} />
                                    <span className="hidden sm:inline">Supprimer</span>
                                    <span className="sm:hidden">Del</span>
                                </button>
                            </div>
                        </li>
                    ))
                ) : (
                    <li className="flex items-center justify-center p-12 bg-slate-50 rounded-2xl border border-slate-200">
                        <div className="text-center">
                            <span className="text-slate-600 italic text-lg">
                                Aucune condition d'admission définie pour le moment.
                            </span>
                        </div>
                    </li>
                )}
            </ul>
        </div>
    );
}