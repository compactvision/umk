import { X, Save, ImageIcon } from 'lucide-react';
import { getFieldLabel } from '../utils/levelUtils';

export default function EditModal({ 
    isOpen, 
    editField, 
    levelDataHook, 
    onClose, 
    onSave 
}: {
    isOpen: boolean;
    editField: string;
    levelDataHook: any;
    onClose: () => void;
    onSave: (levelDataHook: any) => void;
}) {
    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        onSave(levelDataHook);
    };

    const renderInputField = () => {
        if (editField === 'description' ||
            editField === 'options' ||
            editField === 'course_objective') {
            return (
                <>
                    {editField === 'options' && (
                        <div className="mt-2 p-3 bg-slate-50 rounded-lg border-l-4 border-blue-500">
                            <span className="text-sm text-slate-600">
                                💡 <strong>Exemples d'opportunités :</strong>
                                <br />
                                • Ingénieur logiciel, DevOps, Consultant IT
                                <br />
                                • Développeur web, Architecte système, Chef de projet
                                <br />
                                • Data Scientist, Cybersécurité, IA/Machine Learning
                                <br />
                                <em>Séparez chaque opportunité par une virgule</em>
                            </span>
                        </div>
                    )}
                    <textarea
                        className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                        value={levelDataHook.getFieldValue(editField) || ''}
                        onChange={(e) => levelDataHook.updateField(editField, e.target.value)}
                        placeholder={`Entrez la nouvelle valeur pour ${getFieldLabel(editField)}`}
                        rows={editField === 'course_objective' ? 6 : 4}
                    />
                </>
            );
        }

        if (editField === 'illustration_image') {
            return (
                <div className="space-y-4">
                    <div className="relative">
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            id="file-upload"
                            onChange={(e) => {
                                const file = e.target.files[0];
                                if (file) {
                                    levelDataHook.updateField(editField, file);
                                }
                            }}
                        />
                        <label 
                            htmlFor="file-upload"
                            className="flex items-center gap-3 p-4 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all duration-200"
                        >
                            <ImageIcon size={20} className="text-slate-500" />
                            <span className="text-slate-600">Sélectionnez une nouvelle image d'illustration</span>
                        </label>
                    </div>
                    {levelDataHook.levelData.illustration_image &&
                        typeof levelDataHook.levelData.illustration_image === 'string' && (
                            <div className="mt-4">
                                <p className="text-sm text-slate-600 mb-2">Image actuelle :</p>
                                <img
                                    src={`/storage/${levelDataHook.levelData.illustration_image}`}
                                    alt="Image actuelle"
                                    className="w-full h-48 object-cover rounded-xl border border-slate-200"
                                />
                            </div>
                        )}
                </div>
            );
        }

        const numericFields = [
            'credit_required',
            'duration_years',
            'courses_number',
            'price',
            'fees',
            'student_number',
        ];

        return (
            <input
                type={
                    editField === 'has_certificate'
                        ? 'checkbox'
                        : numericFields.includes(editField)
                          ? 'number'
                          : 'text'
                }
                className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                value={editField === 'has_certificate' ? undefined : levelDataHook.getFieldValue(editField) || ''}
                checked={editField === 'has_certificate' ? levelDataHook.getFieldValue(editField) : undefined}
                onChange={(e) => {
                    const value =
                        editField === 'has_certificate'
                            ? e.target.checked
                            : numericFields.includes(editField)
                              ? parseInt(e.target.value) || 0
                              : e.target.value;
                    levelDataHook.updateField(editField, value);
                }}
                placeholder={`Entrez la nouvelle valeur pour ${getFieldLabel(editField)}`}
                min={numericFields.includes(editField) ? '0' : undefined}
            />
        );
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100 opacity-100" onClick={(e) => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <div className="flex items-center justify-between p-6 border-b border-slate-200">
                        <h2 className="text-2xl font-bold text-slate-800">Modifier {getFieldLabel(editField)}</h2>
                        <button type="button" className="flex items-center justify-center w-10 h-10 bg-slate-100 rounded-xl text-slate-600 hover:bg-slate-200 transition-colors duration-200" onClick={onClose}>
                            <X size={20} />
                        </button>
                    </div>
                    
                    <div className="p-6">
                        <div className="mb-6">
                            <label className="block font-semibold text-slate-700 mb-2">{getFieldLabel(editField)}</label>
                            {renderInputField()}
                            {levelDataHook.errors[editField] && (
                                <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                                    {levelDataHook.errors[editField]}
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <div className="flex gap-3 justify-end p-6 border-t border-slate-200">
                        <button type="button" className="inline-flex items-center gap-2 px-6 py-3 bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-semibold hover:bg-slate-200 transition-colors duration-200" onClick={onClose}>
                            Annuler
                        </button>
                        <button type="submit" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white border-none rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed" disabled={levelDataHook.processing}>
                            <Save size={16} />
                            {levelDataHook.processing ? 'Enregistrement...' : 'Enregistrer'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}