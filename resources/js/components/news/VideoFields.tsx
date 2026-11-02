import { usePage } from '@inertiajs/react';
import { Film, Link2, Upload } from 'lucide-react';
import { useEffect, useId, useState } from 'react';
import VideoPlayer from './VideoPlayer';

type Props = {
    url: string;
    file: File | null;
    onUrl: (value: string) => void;
    onFile: (file: File | null) => void;
    errors: { video_url?: string; video_file?: string };
    existing?: string | null;
    remove?: boolean;
    onRemove?: (value: boolean) => void;
};
export default function VideoFields({ url, file, onUrl, onFile, errors, existing, remove, onRemove }: Props) {
    const id = useId();
    const maxMb = Number(usePage().props.videoUploadLimitMb ?? 2);
    const [preview, setPreview] = useState('');
    useEffect(() => {
        if (!file) {
            setPreview('');
            return;
        }
        const src = URL.createObjectURL(file);
        setPreview(src);
        return () => URL.revokeObjectURL(src);
    }, [file]);
    const source = preview || url || (!remove ? existing : '') || '';
    return (
        <section className="space-y-4 rounded-xl border border-emerald-900/15 bg-emerald-50/40 p-5">
            <div className="flex items-center gap-3">
                <Film className="text-emerald-800" size={23} />
                <div>
                    <h3 className="font-semibold text-emerald-950">Une actualité en vidéo</h3>
                    <p className="text-xs text-slate-600">Ajoutez une vidéo à votre article. L’image principale devient sa couverture.</p>
                </div>
            </div>
            <div>
                <label htmlFor={`${id}-url`} className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                    <Link2 size={15} />
                    Lien de la vidéo
                </label>
                <input
                    id={`${id}-url`}
                    type="url"
                    value={url}
                    placeholder="https://www.youtube.com/watch?v=…"
                    className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm"
                    onChange={(e) => {
                        onUrl(e.target.value);
                        if (e.target.value) onFile(null);
                    }}
                />
                <p className="mt-2 text-xs text-slate-500">YouTube, Vimeo ou lien HTTPS vers un fichier MP4 / WebM.</p>
                {errors.video_url && (
                    <p role="alert" className="mt-2 text-sm text-red-600">
                        {errors.video_url}
                    </p>
                )}
            </div>
            <div>
                <label htmlFor={`${id}-file`} className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                    <Upload size={15} />
                    Ou importer un fichier
                </label>
                <input
                    id={`${id}-file`}
                    type="file"
                    accept="video/mp4,video/webm"
                    onChange={(e) => {
                        const selected = e.target.files?.[0] ?? null;
                        onFile(selected);
                        if (selected) onUrl('');
                    }}
                    className="w-full text-sm text-slate-600"
                />
                <p className="mt-2 text-xs text-slate-500">
                    MP4 ou WebM · {maxMb.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} Mo maximum sur ce serveur.
                </p>
                {file && (
                    <button type="button" className="mt-2 text-xs text-red-700" onClick={() => onFile(null)}>
                        Retirer {file.name}
                    </button>
                )}
                {errors.video_file && (
                    <p role="alert" className="mt-2 text-sm text-red-600">
                        {errors.video_file}
                    </p>
                )}
            </div>
            {existing && onRemove && (
                <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input type="checkbox" checked={remove} onChange={(e) => onRemove(e.target.checked)} />
                    Retirer la vidéo actuelle
                </label>
            )}
            {source && (
                <div className="overflow-hidden rounded-lg">
                    <VideoPlayer source={source} title="Aperçu de la vidéo de l’article" />
                </div>
            )}
        </section>
    );
}
