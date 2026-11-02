import App from '@/components/layouts/Home/App';
import { Link } from '@inertiajs/react';
export default function LegalPage({ document }: { document: { title: string; status: string; content: string | null; updated_at: string | null } }) {
    return (
        <App>
            <section className="usk-page-hero">
                <div className="usk-container">
                    <div className="usk-breadcrumb">
                        <Link href="/">Accueil</Link>
                        <span>/</span>
                        <span>{document.title}</span>
                    </div>
                    <span className="usk-eyebrow">Informations de l’établissement</span>
                    <h1>{document.title}</h1>
                </div>
            </section>
            <section className="usk-section">
                <div className="usk-container usk-prose" style={{ maxWidth: 900 }}>
                    {document.status === 'published' ? (
                        <>
                            <p>
                                Version approuvée le{' '}
                                {document.updated_at &&
                                    new Date(`${document.updated_at}T12:00:00Z`).toLocaleDateString('fr-FR', { timeZone: 'Africa/Kinshasa' })}
                                .
                            </p>
                            {document.content?.split(/\n\s*\n/).map((paragraph, index) => (
                                <p key={index} style={{ whiteSpace: 'pre-line' }}>
                                    {paragraph}
                                </p>
                            ))}
                        </>
                    ) : (
                        <>
                            <h2>Document en cours de validation</h2>
                            <p>
                                Ce document sera publié après validation des informations officielles par l’établissement. Cette page ne constitue pas
                                une déclaration de conformité.
                            </p>
                            <Link href="/contact" className="usk-button usk-button-green">
                                Contacter l’établissement
                            </Link>
                        </>
                    )}
                </div>
            </section>
        </App>
    );
}
