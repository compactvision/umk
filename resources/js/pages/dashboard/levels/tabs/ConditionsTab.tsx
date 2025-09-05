import { Plus, Edit3, Trash2 } from 'lucide-react';

export default function ConditionsTab({ level, modalsHook }) {
    console.log(level);
    return (
        <div className="conditions-section">
            <div className="conditions-section__header">
                <h3 className="conditions-section__title">Conditions d'admission</h3>
                <button 
                    className="conditions-section__add-btn" 
                    onClick={() => modalsHook.openConditionModal('add')}
                >
                    <Plus size={20} />
                    Ajouter une condition
                </button>
            </div>
            <ul className="conditions-list">
                {level.admission_conditions && level.admission_conditions.length > 0 ? (
                    level.admission_conditions.map((condition) => (
                        <li key={condition.id} className="condition-item">
                            <div className="condition-item__content">
                                <div className="condition-item__icon"></div>
                                <div className="condition-item__details">
                                    <span 
                                        className="condition-item__title" 
                                        style={{ fontWeight: 'bold' }}
                                    >
                                        {condition.title}
                                    </span>
                                    <p className="condition-item__description">
                                        {condition.description}
                                    </p>
                                </div>
                            </div>
                            <div className="condition-item__actions">
                                <button
                                    className="condition-item__btn condition-item__btn--edit"
                                    onClick={() => modalsHook.openConditionModal('edit', condition.id, condition)}
                                >
                                    <Edit3 size={14} />
                                    Modifier
                                </button>
                                <button
                                    className="condition-item__btn condition-item__btn--delete"
                                    onClick={() => modalsHook.deleteCondition(condition.id)}
                                >
                                    <Trash2 size={14} />
                                    Supprimer
                                </button>
                            </div>
                        </li>
                    ))
                ) : (
                    <li className="condition-item condition-item--empty">
                        <div className="condition-item__content">
                            <span 
                                className="condition-item__text" 
                                style={{ color: '#64748b', fontStyle: 'italic' }}
                            >
                                Aucune condition d'admission définie pour le moment.
                            </span>
                        </div>
                    </li>
                )}
            </ul>
        </div>
    );
}