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
                        <div className="modal__hint">
                            💡 <strong>Exemples d'opportunités :</strong>
                            <br />
                            • Ingénieur logiciel, DevOps, Consultant IT
                            <br />
                            • Développeur web, Architecte système, Chef de projet
                            <br />
                            • Data Scientist, Cybersécurité, IA/Machine Learning
                            <br />
                            <em>Séparez chaque opportunité par une virgule</em>
                        </div>
                    )}
                    <textarea
                        className="modal__textarea"
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
                <div className="modal__file-field">
                    <input
                        type="file"
                        accept="image/*"
                        className="modal__file-input"
                        onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                                levelDataHook.updateField(editField, file);
                            }
                        }}
                    />
                    <div className="modal__file-info">
                        <ImageIcon size={20} />
                        <span>Sélectionnez une nouvelle image d'illustration</span>
                    </div>
                    {levelDataHook.levelData.illustration_image &&
                        typeof levelDataHook.levelData.illustration_image === 'string' && (
                            <div className="modal__current-image">
                                <img
                                    src={`/storage/${levelDataHook.levelData.illustration_image}`}
                                    alt="Image actuelle"
                                    className="modal__preview-img"
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
                className="modal__input"
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
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <div className="modal__header">
                        <h2 className="modal__title">Modifier {getFieldLabel(editField)}</h2>
                        <button type="button" className="modal__close" onClick={onClose}>
                            <X size={20} />
                        </button>
                    </div>
                    <div className="modal__body">
                        <div className="modal__field">
                            <label className="modal__label">{getFieldLabel(editField)}</label>
                            {renderInputField()}
                            {levelDataHook.errors[editField] && (
                                <div className="modal__error">{levelDataHook.errors[editField]}</div>
                            )}
                        </div>
                    </div>
                    <div className="modal__actions">
                        <button type="button" className="modal__btn modal__btn--secondary" onClick={onClose}>
                            Annuler
                        </button>
                        <button type="submit" className="modal__btn modal__btn--primary" disabled={levelDataHook.processing}>
                            <Save size={16} />
                            {levelDataHook.processing ? 'Enregistrement...' : 'Enregistrer'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}