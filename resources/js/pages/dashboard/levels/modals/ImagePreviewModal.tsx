import { X } from 'lucide-react';

export default function ImagePreviewModal({ isOpen, imageSrc, onClose }) {
    if (!isOpen || !imageSrc) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden transform transition-all duration-300 scale-100 opacity-100" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
                    <h3 className="text-2xl font-bold text-slate-800">Illustration du programme</h3>
                    <button className="flex items-center justify-center w-12 h-12 bg-slate-100 rounded-full text-slate-600 hover:bg-slate-200 transition-all duration-200 hover:scale-110" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>
                <div className="p-6 bg-slate-50">
                    <div className="relative overflow-hidden rounded-2xl shadow-lg">
                        <img
                            src={`/storage/${imageSrc}`}
                            alt="Illustration du programme"
                            className="w-full h-auto max-h-[60vh] object-contain bg-white"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}