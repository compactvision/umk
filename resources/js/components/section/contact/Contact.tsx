export default function Contact() {
    return (
        <section className="contact_section section_space" data-bg-color="#F1F1E9">
            <div className="container">
                <div className="row justify-content-lg-between mt-none-30">
                    <div className="col-lg-7 mt-30">
                        <div className="contact_form mb-0">
                            <h3 className="title">Envoyez-nous un message 👍🏻</h3>
                            <p className="content">Laissez-nous l'opportunité de vous accompagner et d'apporter une touche d'excellence à votre projet.</p>
                            <div className="row">
                                <div className="col-md-6">
                                    <div className="form-group">
                                        <label className="input_title" htmlFor="input_name">
                                            Nom complet
                                        </label>
                                        <input
                                            id="input_name"
                                            className="form-control"
                                            type="text"
                                            name="name"
                                            placeholder="Jean Dupont"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="form-group">
                                        <label className="input_title" htmlFor="input_email">
                                            Votre email
                                        </label>
                                        <input
                                            id="input_email"
                                            className="form-control"
                                            type="email"
                                            name="email"
                                            placeholder="contact@example.com"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="col-12">
                                    <div className="form-group">
                                        <label className="input_title" htmlFor="input_phone">
                                            Téléphone
                                        </label>
                                        <input id="input_phone" className="form-control" type="tel" name="phone" placeholder="+33 6 12 34 56 78" />
                                    </div>
                                </div>
                                <div className="col-12">
                                    <div className="form-group">
                                        <label className="input_title" htmlFor="input_textarea">
                                            Votre message
                                        </label>
                                        <textarea
                                            id="input_textarea"
                                            className="form-control"
                                            name="message"
                                            placeholder="Comment pouvons-nous vous aider ?"
                                            defaultValue={''}
                                        />
                                    </div>
                                    <button type="submit" className="thm-btn">
                                        Envoyer le message
                                        <span>
                                            <svg width={22} height={22} viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path
                                                    d="M13.0364 2.63798C11.6702 1.79536 10.0512 1.33203 8.37891 1.33203C3.82654 1.33203 0 4.72368 0 9.06641C0 10.589 0.473 12.0486 1.37148 13.3092L0.116359 17.2497C-0.0162422 17.6659 0.295539 18.0898 0.730598 18.0898C0.83007 18.0898 0.930188 18.0669 1.02257 18.0198L4.83957 16.0791C4.99413 16.1456 5.15062 16.2076 5.3087 16.265C4.42496 14.8857 3.95312 13.3023 3.95312 11.6445C3.95312 6.70755 8.10726 2.91208 13.0364 2.63798Z"
                                                    fill="#170006"
                                                />
                                                <path
                                                    d="M20.6285 15.8873C21.527 14.6267 22 13.1671 22 11.6445C22 7.30022 18.1718 3.91016 13.6211 3.91016C9.06873 3.91016 5.24219 7.30181 5.24219 11.6445C5.24219 15.9888 9.07036 19.3789 13.6211 19.3789C14.8421 19.3789 16.0588 19.1301 17.1602 18.6571L20.9774 20.598C21.2091 20.7157 21.4889 20.6829 21.6869 20.5146C21.885 20.3463 21.9626 20.0755 21.8837 19.8278L20.6285 15.8873ZM11 12.2891C10.644 12.2891 10.3555 12.0005 10.3555 11.6445C10.3555 11.2886 10.644 11 11 11C11.356 11 11.6445 11.2886 11.6445 11.6445C11.6445 12.0005 11.356 12.2891 11 12.2891ZM13.5781 12.2891C13.2222 12.2891 12.9336 12.0005 12.9336 11.6445C12.9336 11.2886 13.2222 11 13.5781 11C13.9341 11 14.2227 11.2886 14.2227 11.6445C14.2227 12.0005 13.9341 12.2891 13.5781 12.2891ZM16.1562 12.2891C15.8003 12.2891 15.5117 12.0005 15.5117 11.6445C15.5117 11.2886 15.8003 11 16.1562 11C16.5122 11 16.8008 11.2886 16.8008 11.6445C16.8008 12.0005 16.5122 12.2891 16.1562 12.2891Z"
                                                    fill="#170006"
                                                />
                                            </svg>
                                        </span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-lg-5 mt-30">
                        <div className="gmap_canvas ps-lg-5">
                            <iframe 
                                src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d497.30809873161564!2d15.511390394230279!3d-4.323441389480845!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x1a6a4facb0bb2a1b%3A0x3e21b9f521803de8!2sUMK%20(universit%C3%A9%20moderne%20de%20kinkole)!5e0!3m2!1sfr!2sfr!4v1751294876823!5m2!1sfr!2sfr"
                                title="Localisation UMK sur Google Maps"
                            />
                        </div>
                    </div>
                </div>
                <div className="contact_info_box_inner pt-110">
                    <h2 className="text-center">Dites-nous comment nous pouvons vous aider</h2>
                </div>
                <div className="contact_info_box row mt-none-30">
                    <div className="col-lg-3 col-md-6 col-sm-6 mt-30">
                        <div className="contact_iconbox">
                            <div className="iconbox_icon">
                                <img src="assets/img/icon/call-calling.svg" alt="Icône téléphone" />
                            </div>
                            <div className="iconbox_content">
                                <h2 className="iconbox_title">Appelez-nous</h2>
                                <p>Du lundi au vendredi de 9h à 18h</p>
                                <h3>+243 810 23 45 67</h3>
                            </div>
                        </div>
                    </div>
                    <div className="col-lg-3 col-md-6 col-sm-6 mt-30">
                        <div className="contact_iconbox">
                            <div className="iconbox_icon">
                                <img src="assets/img/icon/call-calling.svg" alt="Icône téléphone secondaire" />
                            </div>
                            <div className="iconbox_content">
                                <h2 className="iconbox_title">Autre numéro</h2>
                                <p>Du lundi au vendredi de 9h à 18h</p>
                                <h3>+243 810 23 45 67</h3>
                            </div>
                        </div>
                    </div>
                    <div className="col-lg-3 col-md-6 col-sm-6 mt-30">
                        <div className="contact_iconbox">
                            <div className="iconbox_icon">
                                <img src="assets/img/icon/sms-edit.svg" alt="Icône email" />
                            </div>
                            <div className="iconbox_content">
                                <h2 className="iconbox_title">Écrivez-nous</h2>
                                <p>Notre équipe est à votre écoute.</p>
                                <h3>contact@umk.edu</h3>
                            </div>
                        </div>
                    </div>
                    <div className="col-lg-3 col-md-6 col-sm-6 mt-30">
                        <div className="contact_iconbox">
                            <div className="iconbox_icon">
                                <img src="assets/img/icon/location-add.svg" alt="Icône localisation" />
                            </div>
                            <div className="iconbox_content">
                                <h2 className="iconbox_title">Notre campus</h2>
                                <p>Venez visiter l'université UMK.</p>
                                <h3>123 Avenue kinkole, RDC</h3>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}