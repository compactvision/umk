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
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <form onSubmit={onSave}>
                    <div className="modal__header">
                        <h2 className="modal__title">
                            {conditionMode === 'add' ? 'Ajouter' : 'Modifier'} une condition
                        </h2>
                        <button type="button" className="modal__close" onClick={onClose}>
                            <X size={20} />
                        </button>
                    </div>
                    <div className="modal__body">
                        <div className="modal__field">
                            <label className="modal__label">Titre</label>
                            <input
                                type="text"
                                className="modal__input"
                                value={conditionData.title || ''}
                                onChange={(e) => setConditionData('title', e.target.value)}
                                placeholder="Exemple : Diplôme requis"
                                required
                            />
                        </div>

                        <div className="modal__field">
                            <label className="modal__label">Description</label>
                            <textarea
                                className="modal__textarea"
                                value={conditionData.description || ''}
                                onChange={(e) => setConditionData('description', e.target.value)}
                                placeholder="Exemple : Avoir un diplôme d'État avec mention"
                                required
                            />
                            <div className="modal__hint">
                                💡 Décrivez clairement la condition requise pour l'admission au programme
                            </div>
                        </div>

                        <div className="modal__field">
                            <label className="modal__label">Type</label>
                            <select
                                className="modal__select"
                                value={conditionData.section || ''}
                                onChange={(e) => setConditionData('section', e.target.value)}
                                required
                                style={{
                                    width: '100%',
                                    padding: '1rem',
                                    border: '1px solid #ccc',
                                    borderRadius: '8px',
                                    fontSize: '1rem',
                                    color: '#333',
                                    backgroundColor: '#fff',
                                    appearance: 'none',
                                    cursor: 'pointer',
                                }}
                            >
                                <option value="">Sélectionnez un type</option>
                                <option value="personal_info">Informations personnelles</option>
                                <option value="academic_info">Informations académiques</option>
                                <option value="other">Autre</option>
                            </select>
                        </div>
                        <div className="modal__field">
                            <label className="modal__label">Statut</label>
                            <label className="toggle-switch">
                                <input
                                    id="is_active"
                                    type="checkbox"
                                    checked={!!conditionData.is_required}
                                    onChange={(e) => setConditionData('is_required', e.target.checked)}
                                />
                                <span className="toggle-switch__slider"></span>
                            </label>
                            <span className="toggle-label">
                                {conditionData.is_required ? 'Requis' : 'Non requis'}
                            </span>
                        </div>
                    </div>
                    <div className="modal__actions">
                        <button
                            type="button"
                            className="modal__btn modal__btn--secondary"
                            onClick={onClose}
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            className="modal__btn modal__btn--primary"
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