import { useInstitution } from '@/lib/useInstitution';
import { Link, usePage } from '@inertiajs/react';
import * as Dialog from '@radix-ui/react-dialog';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';

const links = [
    ['/', 'Accueil'],
    ['/about', 'L’université'],
    ['/courses', 'Nos facultés'],
    ['/admission', 'Admissions'],
    ['/blog', 'Actualités'],
    ['/contact', 'Contact'],
];
export default function Header() {
    const usk = useInstitution();
    const { url, props } = usePage<{ auth: { user: { id: number } | null } }>();
    const studentHref = props.auth?.user ? '/dashboard' : '/login';
    const [open, setOpen] = useState(false);
    useEffect(() => {
        setOpen(false);
    }, [url]);
    useEffect(() => {
        const viewport = window.matchMedia('(min-width: 1051px)');
        const closeOnDesktop = () => {
            if (viewport.matches) setOpen(false);
        };
        viewport.addEventListener('change', closeOnDesktop);
        return () => viewport.removeEventListener('change', closeOnDesktop);
    }, []);
    return (
        <header className="usk-header">
            <a className="usk-skip" href="#contenu">
                Aller au contenu
            </a>
            <div className="usk-utility">
                <div className="usk-container">
                    <span>Kinshasa, République démocratique du Congo</span>
                    <div>
                        <a href={`mailto:${usk.email}`}>{usk.email}</a>
                        <Link href={studentHref}>
                            Espace étudiant <ArrowUpRight size={12} />
                        </Link>
                    </div>
                </div>
            </div>
            <div className="usk-container usk-nav">
                <Link href="/" className="usk-brand">
                    <img width={52} height={52} src={usk.logo} alt="Blason de l’Université Simon Kimbangu" />
                    <span>
                        Université<strong>Simon Kimbangu</strong>
                        <small>{usk.motto}</small>
                    </span>
                </Link>
                <Dialog.Root open={open} onOpenChange={setOpen}>
                    <Dialog.Trigger asChild>
                        <button className="usk-menu-toggle" aria-label="Ouvrir le menu">
                            <Menu />
                        </button>
                    </Dialog.Trigger>
                    <Dialog.Portal>
                        <Dialog.Content className="usk-site usk-fullscreen-menu" aria-describedby={undefined}>
                            <div className="usk-menu-top">
                                <Link href="/" className="usk-brand" onClick={() => setOpen(false)}>
                                    <img width={52} height={52} src={usk.logo} alt="Blason de l’Université Simon Kimbangu" />
                                    <span>
                                        Université<strong>Simon Kimbangu</strong>
                                        <small>{usk.motto}</small>
                                    </span>
                                </Link>
                                <Dialog.Close className="usk-menu-close" aria-label="Fermer le menu">
                                    <span>Fermer</span>
                                    <X size={22} />
                                </Dialog.Close>
                            </div>
                            <div className="usk-menu-body">
                                <div className="usk-menu-intro">
                                    <Dialog.Title className="usk-eyebrow">Explorez l’USK</Dialog.Title>
                                    <p>
                                        Le savoir.
                                        <br />
                                        La conscience.
                                        <br />
                                        <em>Votre avenir.</em>
                                    </p>
                                    <span>
                                        Une université ancrée à Kinshasa,
                                        <br />
                                        ouverte sur le monde.
                                    </span>
                                </div>
                                <nav className="usk-menu-links" aria-label="Navigation principale">
                                    {links.map(([path, label], index) => (
                                        <Link
                                            key={path}
                                            href={path}
                                            onClick={() => setOpen(false)}
                                            style={{ animationDelay: `${80 + index * 45}ms` }}
                                            aria-current={(path === '/' ? url === '/' : url.startsWith(path)) ? 'page' : undefined}
                                        >
                                            <span className="usk-menu-number">0{index + 1}</span>
                                            <span>{label}</span>
                                            <ArrowUpRight aria-hidden="true" />
                                        </Link>
                                    ))}
                                </nav>
                            </div>
                            <div className="usk-menu-bottom">
                                <a href={`mailto:${usk.email}`}>{usk.email}</a>
                                <Link href={studentHref} onClick={() => setOpen(false)}>
                                    Espace étudiant <ArrowUpRight size={16} />
                                </Link>
                                <Link className="usk-button usk-button-gold" href="/admission" onClick={() => setOpen(false)}>
                                    Rejoindre l’USK <ArrowUpRight size={18} />
                                </Link>
                            </div>
                        </Dialog.Content>
                    </Dialog.Portal>
                </Dialog.Root>
                <nav aria-label="Navigation principale" className="usk-navigation">
                    {links.map(([path, label]) => (
                        <Link key={path} href={path} aria-current={(path === '/' ? url === '/' : url.startsWith(path)) ? 'page' : undefined}>
                            {label}
                        </Link>
                    ))}
                    <Link className="usk-button usk-button-green" href="/admission">
                        Rejoindre l’USK <ArrowUpRight size={16} />
                    </Link>
                </nav>
            </div>
        </header>
    );
}
