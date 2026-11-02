import App from '@/components/layouts/Home/App';
import { Link } from '@inertiajs/react';
export default function SitePlan({ links }: { links: { path: string; title: string }[] }) {
    return (
        <App>
            <section className="usk-page-hero">
                <div className="usk-container">
                    <h1>Plan du site</h1>
                    <p>Les informations publiques de l’Université Simon Kimbangu.</p>
                </div>
            </section>
            <section className="usk-section">
                <div className="usk-container usk-prose">
                    <ul>
                        {links.map((link) => (
                            <li key={link.path}>
                                <Link href={link.path}>{link.title}</Link>
                            </li>
                        ))}
                    </ul>
                </div>
            </section>
        </App>
    );
}
