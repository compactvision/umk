import manifest from '@/lib/public-images.json';
import type { ImgHTMLAttributes } from 'react';
type Entry = { width: number; height: number; variants: { src: string; width: number }[] };
export default function PublicImage({
    src,
    loading = 'lazy',
    sizes = '(max-width: 768px) 100vw, 50vw',
    ...props
}: ImgHTMLAttributes<HTMLImageElement>) {
    const entry = src ? (manifest as Record<string, Entry>)[src] : undefined;
    if (!entry) return <img src={src} loading={loading} {...props} />;
    const variant = entry.variants[entry.variants.length - 1];
    return (
        <img
            src={variant.src}
            srcSet={entry.variants.map((item) => `${item.src} ${item.width}w`).join(', ')}
            sizes={sizes}
            width={entry.width}
            height={entry.height}
            loading={loading}
            {...props}
        />
    );
}
