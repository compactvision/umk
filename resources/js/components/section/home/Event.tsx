export default function Event() {
    return (
        <section className="event event-bg-clr pos-rel pt-115">
            <div className="container">
                <div className="section-title mb-40 text-center">
                    <span className="sub-title">Nos Événements</span>
                    <h1 className="title">Événements à venir</h1>
                </div>
                <div className="row justify-content-center">
                    <div className="col-xl-6 col-lg-8">
                        {/* Événement 1 */}
                        <div className="xb-event-wrapper mt-20">
                            <div className="xb-event-left ul_li align-items-center">
                                <div className="xb-item--img pos-rel">
                                    <img src="assets/img/event/event-img01.png" alt="Célébration de la diversité culturelle" />
                                    <span className="xb-item--date">24 Nov 2024</span>
                                </div>
                                <div className="xb-item--author">
                                    <span className="xb-item--location">
                                        <svg width={20} height={20} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path
                                                d="M10 11.1917C11.436 11.1917 12.6 10.0276 12.6 8.5917C12.6 7.15576 11.436 5.9917 10 5.9917C8.56408 5.9917 7.40002 7.15576 7.40002 8.5917C7.40002 10.0276 8.56408 11.1917 10 11.1917Z"
                                                stroke="#292D32"
                                                strokeWidth="1.5"
                                            />
                                            <path
                                                d="M3.01663 7.07484C4.65829 -0.141827 15.35 -0.133494 16.9833 7.08317C17.9416 11.3165 15.3083 14.8998 13 17.1165C11.325 18.7332 8.67496 18.7332 6.99163 17.1165C4.69163 14.8998 2.05829 11.3082 3.01663 7.07484Z"
                                                stroke="#292D32"
                                                strokeWidth="1.5"
                                            />
                                        </svg>{' '}
                                        139 W, 46th Street, New York
                                    </span>
                                    <h2 className="xb-item--title border-effect">
                                        <a href="#">Festival des Cultures : Art et Spectacle Vivant</a>
                                    </h2>
                                </div>
                            </div>
                        </div>

                        {/* Événement 2 */}
                        <div className="xb-event-wrapper mt-20">
                            <div className="xb-event-left ul_li align-items-center">
                                <div className="xb-item--img pos-rel">
                                    <img src="assets/img/event/event-img02.png" alt="Conférence internationale" />
                                    <span className="xb-item--date">15 Déc 2024</span>
                                </div>
                                <div className="xb-item--author">
                                    <span className="xb-item--location">
                                        <svg width={20} height={20} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            {/* Icône de localisation identique */}
                                        </svg>{' '}
                                        New York, NY 10036, USA
                                    </span>
                                    <h2 className="xb-item--title border-effect">
                                        <a href="#">Horizons Globaux : Échanges Interculturels</a>
                                    </h2>
                                </div>
                            </div>
                        </div>

                        {/* Événement 3 */}
                        <div className="xb-event-wrapper pos-rel mt-20">
                            <div className="xb-event-left ul_li align-items-center">
                                <div className="xb-item--img pos-rel">
                                    <img src="assets/img/event/event-img03.png" alt="Lancement de programme" />
                                    <span className="xb-item--date">10 Jan 2025</span>
                                </div>
                                <div className="xb-item--author">
                                    <span className="xb-item--location">
                                        <svg width={20} height={20} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            {/* Icône de localisation identique */}
                                        </svg>{' '}
                                        New York, NY 10036, USA
                                    </span>
                                    <h2 className="xb-item--title border-effect">
                                        <a href="#">Soirée de Lancement : Programme de Mentorat Étudiant</a>
                                    </h2>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Événement principal */}
                    <div className="col-xl-6 col-lg-8">
                        <div className="xb-event-item mt-20">
                            <div className="xb-item--img">
                                <img src="assets/img/event/event-img04.png" alt="Conférence scientifique" />
                            </div>
                            <div className="ul_li xb-item--wrap">
                                <div className="xb-item--content">
                                    <span className="xb-item--location">
                                        <svg width={20} height={20} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            {/* Icône de localisation identique */}
                                        </svg>
                                        Financial District, New York
                                    </span>
                                    <h2 className="xb-item--title border-effect">
                                        <a href="#">Conférence du Dr. Hongbo Chi : Immunologie et Innovations Médicales</a>
                                    </h2>
                                    <div className="xb-event-btn pt-15">
                                        <a className="thm-btn" href="#">
                                            Réserver
                                            <span className="icon">
                                                <svg width={21} height={21} viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    {/* Icône de flèche identique */}
                                                </svg>
                                            </span>
                                        </a>
                                    </div>
                                </div>
                                <div className="xb-item--date-inner text-center">
                                    <div className="xb-item--icon">
                                        <img src="assets/img/icon/note-book.svg" alt="Icône événement" />
                                    </div>
                                    <span className="xb-item--date">
                                        24 Déc <br /> 2024
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bouton Voir plus */}
                    <div className="event-btns pos-rel z-1 mt-40 text-center">
                        <a className="more-btn" href="#">
                            Voir tous les événements
                            <span>
                                <svg width={21} height={21} viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    {/* Icône de flèche identique */}
                                </svg>
                            </span>
                        </a>
                    </div>
                </div>
            </div>

            {/* Image décorative */}
            <div className="xb-event-bottom">
                <img src="assets/img/event/event-img05.png" alt="Événements universitaires" />
            </div>

            {/* Éléments décoratifs */}
            <div className="event-shape">
                <div className="shape shape--one">
                    <img data-parallax='{"x":-50,"y":-80}' src="assets/img/shape/stamp.png" alt="Décoration" />
                </div>
                <div className="shape shape--two">
                    <img src="assets/img/shape/Union.png" alt="Décoration" />
                </div>
            </div>
        </section>
    );
}