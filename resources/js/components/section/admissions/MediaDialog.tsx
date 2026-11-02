import { Download, Maximize2, Minimize2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
export type AdmissionMedia = { src: string; title: string; download?: string };
export default function MediaDialog({ media, onClose }: { media: AdmissionMedia | null; onClose: () => void }) {
    const ref = useRef<HTMLDialogElement>(null);
    const [fullSize, setFullSize] = useState(false);
    useEffect(() => {
        const dialog = ref.current;
        if (media && dialog && !dialog.open) {
            setFullSize(false);
            dialog.showModal();
        }
        if (!media && dialog?.open) dialog.close();
        if (!media) return;
        const previous = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = previous;
        };
    }, [media]);
    return (
        <dialog
            ref={ref}
            className="adm-media-dialog"
            aria-labelledby="admission-media-title"
            onClose={onClose}
            onClick={(e) => {
                if (e.target === e.currentTarget) ref.current?.close();
            }}
        >
            <div className="adm-media-head">
                <h2 id="admission-media-title">{media?.title || 'Document USK'}</h2>
                <div>
                    <button
                        type="button"
                        aria-label={fullSize ? 'Adapter le document à l’écran' : 'Afficher le document en taille réelle'}
                        onClick={() => setFullSize(!fullSize)}
                    >
                        {fullSize ? <Minimize2 size={19} /> : <Maximize2 size={19} />}
                    </button>
                    {media?.download && (
                        <a href={media.src} download={media.download} aria-label="Télécharger le flyer">
                            <Download size={19} />
                        </a>
                    )}
                    <button type="button" aria-label="Fermer l’aperçu" onClick={() => ref.current?.close()}>
                        <X size={22} />
                    </button>
                </div>
            </div>
            <div className={fullSize ? 'adm-media-scroll is-full-size' : 'adm-media-scroll'}>
                {media && <img src={media.src} alt={media.title} />}
            </div>
            <p className="adm-media-caption">
                {media?.download
                    ? 'Document officiel de l’Université Simon Kimbangu · Admissions 2026–2027'
                    : 'Université Simon Kimbangu · Vie du campus'}
            </p>
        </dialog>
    );
}
