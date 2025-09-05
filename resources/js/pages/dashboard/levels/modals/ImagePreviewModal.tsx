import { X } from 'lucide-react';

export default function ImagePreviewModal({ isOpen, imageSrc, onClose }) {
    if (!isOpen || !imageSrc) return null;

    return (
        <div className="image-preview-overlay" onClick={onClose}>
            <div className="image-preview-modal" onClick={(e) => e.stopPropagation()}>
                <div className="image-preview-header">
                    <h3 className="image-preview-title">Illustration du programme</h3>
                    <button className="image-preview-close" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>
                <div className="image-preview-content">
                    <img
                        src={`/storage/${imageSrc}`}
                        alt="Illustration du programme"
                        className="image-preview-img"
                    />
                </div>
            </div>
        </div>
    );
}