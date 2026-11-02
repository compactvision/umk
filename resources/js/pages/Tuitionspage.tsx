import App from '@/components/layouts/Home/App';
import Breadcrumb from '@/components/UI/home/Breadcumb';
import { Link } from '@inertiajs/react';
import { ArrowUpRight } from 'lucide-react';
export default function Tuitionspage() {
    return (
        <App>
            <Breadcrumb
                title="Préparez votre projet d’études."
                desc="Les informations essentielles pour vous renseigner sur les frais académiques et organiser votre inscription."
            />
            <section className="usk-section">
                <div className="usk-container usk-content-grid">
                    <div className="usk-prose">
                        <span className="usk-eyebrow">Frais académiques</span>
                        <h2>
                            Une information claire.
                            <br />
                            <em>Un choix éclairé.</em>
                        </h2>
                        <p>
                            Les frais dépendent de la faculté, du programme, du niveau et de l’année académique. Contactez le service des admissions
                            pour obtenir le barème en vigueur et les modalités de règlement applicables à votre dossier.
                        </p>
                        <p>Précisez la formation souhaitée et votre niveau d’entrée pour recevoir les informations correspondantes.</p>
                        <Link href="/admission#frais" className="usk-button usk-button-green">
                            Consulter les frais 2026–2027 <ArrowUpRight size={18} />
                        </Link>
                    </div>
                    <img src="/assets/usk/academic.jpg" alt="Étudiants de l’Université Simon Kimbangu" />
                </div>
            </section>
        </App>
    );
}
