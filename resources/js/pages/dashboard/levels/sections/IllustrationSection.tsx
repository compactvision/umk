import { Image, Maximize2, Pencil, Upload } from 'lucide-react';
export default function IllustrationSection({ levelData, onEdit, onPreview }) {
    const image = levelData.illustration_image;
    const src = typeof image === 'string' && image ? (/^(https?:\/\/|\/)/.test(image) ? image : `/storage/${image}`) : '';
    return (
        <section className="ld-panel ld-illustration">
            <div className="ld-panel-heading">
                <span className="ld-icon">
                    <Image size={21} strokeWidth={1.6} />
                </span>
                <h3>Illustration du programme</h3>
                <button className="ld-edit-button" onClick={() => onEdit('illustration_image', image || '')}>
                    {src ? <Pencil size={14} /> : <Upload size={14} />}
                    {src ? 'Modifier' : 'Ajouter une image'}
                </button>
            </div>
            {src ? (
                <button className="ld-image-preview" onClick={onPreview} aria-label="Agrandir l’illustration du programme">
                    <img src={src} alt="Illustration du programme" loading="lazy" />
                    <span>
                        <Maximize2 size={18} />
                        Voir en grand
                    </span>
                </button>
            ) : (
                <div className="ld-illustration-empty">
                    <Image size={30} strokeWidth={1.3} />
                    <p>
                        Donnez un visage à ce parcours.<span>Ajoutez un visuel pour enrichir sa présentation.</span>
                    </p>
                </div>
            )}
        </section>
    );
}
