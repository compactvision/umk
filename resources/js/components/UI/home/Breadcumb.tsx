import PublicImage from '@/components/seo/PublicImage';
import { Link } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
export default function Breadcrumb({title, desc}: {title: string; desc: string}) {
    return <section className="usk-page-hero"><div className="usk-container"><nav aria-label="Fil d’Ariane" className="usk-breadcrumb"><Link href="/">Accueil</Link><ArrowRight size={13} /><span>{title}</span></nav><span className="usk-eyebrow">Université Simon Kimbangu</span><h1>{title}</h1><p>{desc}</p></div><PublicImage src="/assets/usk/campus.jpg" alt="" /></section>;
}
