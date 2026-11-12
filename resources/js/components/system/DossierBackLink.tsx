import { Link, usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { dossierListPosition } from './dossier-navigation';

export default function DossierBackLink({ href, className, children }: { href: string; className: string; children: ReactNode }) {
    const position = dossierListPosition(usePage().url);

    return (
        <Link
            href={position?.href ?? href}
            className={className}
            preserveScroll={Boolean(position)}
            onSuccess={(page) => {
                if (position && page.url.split(/[?#]/, 1)[0] === position.href.split(/[?#]/, 1)[0]) {
                    window.scrollTo({ left: position.left, top: position.top, behavior: 'instant' });
                }
            }}
        >
            {children}
        </Link>
    );
}
