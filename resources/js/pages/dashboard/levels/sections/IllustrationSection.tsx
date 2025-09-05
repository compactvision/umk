import { ImageIcon as ImageIcon, Eye, Edit3, Upload } from 'lucide-react';

export default function IllustrationSection({ levelData, onEdit, onPreview }) {
    if (levelData.details.illustration_image) {
        return (
            <div className="illustration-section">
                <div className="illustration-section__header">
                    <h3 className="illustration-section__title">
                        <ImageIcon size={24} />
                        Illustration du programme
                    </h3>
                    <div className="illustration-section__actions">
                        <button
                            onClick={onPreview}
                            className="illustration-section__btn illustration-section__btn--view"
                        >
                            <Eye size={16} />
                            Aperçu complet
                        </button>
                        <button
                            onClick={() => onEdit('details.illustration_image', levelData.details.illustration_image)}
                            className="illustration-section__btn illustration-section__btn--edit"
                        >
                            <Edit3 size={16} />
                            Modifier
                        </button>
                    </div>
                </div>
                <div className="illustration-container">
                    <div className="illustration-wrapper">
                        <img
                            src={`/storage/${levelData.details.illustration_image}`}
                            alt="Illustration du programme"
                            className="illustration-image"
                        />
                        <div className="illustration-overlay">
                            <div className="illustration-overlay__content">
                                <ImageIcon size={32} />
                                <span>Cliquez pour voir en grand</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="illustration-placeholder">
            <div className="illustration-placeholder__content">
                <div className="illustration-placeholder__icon">
                    <ImageIcon size={48} />
                </div>
                <h3 className="illustration-placeholder__title">Aucune illustration</h3>
                <p className="illustration-placeholder__description">
                    Ajoutez une image d'illustration pour enrichir la présentation de votre programme
                </p>
                <button
                    onClick={() => onEdit('details.illustration_image', '')}
                    className="illustration-placeholder__btn"
                >
                    <Upload size={18} />
                    Ajouter une illustration
                </button>
            </div>
        </div>
    );
}
