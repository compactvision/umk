import { Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';

export default function BackButton({ href, label, className = '' }: { href: string; label: string; className?: string }) {
    return <Link href={href} className={`admin-back-link ${className}`}><ArrowLeft size={16} aria-hidden="true" /><span>{label}</span></Link>;
}
