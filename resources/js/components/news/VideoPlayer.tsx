import { useState } from 'react';
export function mediaUrl(path?: string | null) {
    if (!path) return '';
    return /^(https?:\/\/|\/|blob:)/.test(path) ? path : `/storage/${path}`;
}

export function videoEmbed(source: string): string | null {
    try {
        const url = new URL(source);
        const host = url.hostname.toLowerCase();
        if (['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be'].includes(host)) {
            const id = host === 'youtu.be' ? url.pathname.split('/')[1] : url.searchParams.get('v') || url.pathname.split('/')[2];
            return id && /^[\w-]{11}$/.test(id) ? `https://www.youtube-nocookie.com/embed/${id}` : null;
        }
        if (['vimeo.com', 'www.vimeo.com'].includes(host) && /^\/\d+\/?$/.test(url.pathname)) {
            return `https://player.vimeo.com/video/${url.pathname.split('/')[1]}`;
        }
    } catch {
        /* Uploaded files use a relative storage path. */
    }
    return null;
}

export default function VideoPlayer({ source, poster, title }: { source: string; poster?: string; title: string }) {
    const embed = videoEmbed(source);
    const [approvedSource, setApprovedSource] = useState<string | null>(null);
    if (embed && approvedSource !== source)
        return (
            <div className="usk-panel">
                <p>
                    Cette vidéo est hébergée par {embed.includes('youtube') ? 'YouTube' : 'Vimeo'}. Son chargement transmettra des données techniques
                    à ce fournisseur.
                </p>
                <button type="button" className="usk-button usk-button-green" onClick={() => setApprovedSource(source)}>
                    Charger la vidéo externe : {title}
                </button>
                <p>
                    <a href="/politique-des-cookies">Informations sur les cookies et services externes</a>
                </p>
            </div>
        );
    return embed ? (
        <iframe
            className="usk-video-player"
            src={embed}
            title={title}
            allow="fullscreen; picture-in-picture; encrypted-media"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            style={{ width: '100%', aspectRatio: '16/9', border: 0 }}
        />
    ) : (
        <video
            className="usk-video-player"
            key={source}
            controls
            playsInline
            preload="none"
            poster={poster}
            aria-label={title}
            style={{ display: 'block', width: '100%', maxHeight: '75vh', background: '#051b16' }}
        >
            <source src={mediaUrl(source)} />
            Votre navigateur ne prend pas en charge la vidéo.
        </video>
    );
}
