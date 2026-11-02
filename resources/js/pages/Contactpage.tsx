import App from '@/components/layouts/Home/App';
import PublicImage from '@/components/seo/PublicImage';
import Breadcrumb from '@/components/UI/home/Breadcumb';
import { useInstitution } from '@/lib/useInstitution';
import { ArrowUpRight } from 'lucide-react';
export default function Contactpage() {
    const usk = useInstitution();
    return (
        <App>
            <Breadcrumb
                title="Commençons la conversation."
                desc="Un projet d’études, une question, un partenariat : l’équipe de l’USK est à votre écoute."
            />
            <section className="usk-section">
                <div className="usk-container usk-contact-grid">
                    <div>
                        <span className="usk-eyebrow">Nous rencontrer</span>
                        <h2>
                            Proches de vous.
                            <br />
                            <em>À votre écoute.</em>
                        </h2>
                        <div className="usk-contact-details">
                            <div>
                                <h3>Notre adresse</h3>
                                <p>{usk.address}</p>
                            </div>
                            <div>
                                <h3>Par téléphone</h3>
                                <a href={`tel:${usk.phone.replaceAll(' ', '')}`}>{usk.phone}</a>
                            </div>
                            <div>
                                <h3>Par e-mail</h3>
                                <a href={`mailto:${usk.email}`}>{usk.email}</a>
                            </div>
                        </div>
                        <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(usk.address)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="usk-link"
                            style={{ marginTop: 30 }}
                        >
                            Ouvrir l’itinéraire <ArrowUpRight size={18} />
                        </a>
                    </div>
                    <div>
                        <PublicImage
                            src="/assets/usk/campus.jpg"
                            alt="Campus de l’Université Simon Kimbangu à Kinshasa"
                            style={{ width: '100%', height: 350, objectFit: 'cover' }}
                        />
                        <div className="usk-panel">
                            <h3>Parlons de votre projet.</h3>
                            <p>
                                Écrivez-nous en précisant votre demande et, pour une admission, la faculté et le niveau d’études qui vous intéressent.
                            </p>
                            <div className="usk-actions">
                                <a href={`mailto:${usk.email}`} className="usk-button usk-button-green">
                                    Nous écrire <ArrowUpRight size={18} />
                                </a>
                                <a href={`https://wa.me/${usk.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="usk-link">
                                    WhatsApp <ArrowUpRight size={16} />
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </App>
    );
}
