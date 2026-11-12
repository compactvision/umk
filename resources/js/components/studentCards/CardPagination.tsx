import { Link } from '@inertiajs/react';
import type { ReactNode } from 'react';

type PageLink = { href: string; label: string };

export default function CardPagination({
    previous,
    next,
    label = 'Pagination',
    preserveScroll = true,
    children,
}: {
    previous?: PageLink;
    next?: PageLink;
    label?: string;
    preserveScroll?: boolean;
    children?: ReactNode;
}) {
    if (!previous && !next && !children) return null;

    return (
        <nav className="cr-pagination" aria-label={label}>
            {previous && (
                <Link className="admin-secondary" href={previous.href} preserveScroll={preserveScroll}>
                    {previous.label}
                </Link>
            )}
            {children}
            {next && (
                <Link className="admin-secondary" href={next.href} preserveScroll={preserveScroll}>
                    {next.label}
                </Link>
            )}
        </nav>
    );
}
