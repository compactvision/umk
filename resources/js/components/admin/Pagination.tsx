import { Link } from '@inertiajs/react';
type PageLink = { url: string | null; label: string; active: boolean };
export default function Pagination({ value }: { value: unknown }) {
    const links = value && typeof value === 'object' && 'links' in value && Array.isArray(value.links) ? (value.links as PageLink[]) : [];
    if (links.length <= 3) return null;
    return (
        <nav className="admin-pagination" aria-label="Pagination">
            {links.map((link, index) => {
                const label = link.label
                    .replace(/&laquo;|&raquo;/g, '')
                    .replace('Previous', 'Précédent')
                    .replace('Next', 'Suivant')
                    .trim();
                return link.url ? (
                    <Link href={link.url} key={index} aria-current={link.active ? 'page' : undefined}>
                        {label}
                    </Link>
                ) : (
                    <span key={index}>{label}</span>
                );
            })}
        </nav>
    );
}
