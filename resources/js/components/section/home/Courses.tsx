export default function Courses() {
    return (
        <section className="program pos-rel pt-115">
            <div className="container">
                <div className="pro-top ul_li_between mb-40">
                    <div className="section-title mb-20">
                        <span className="sub-title">Nos formations d'excellence</span>
                        <h1 className="title">Programmes Phares</h1>
                    </div>
                    <div className="pro-btn mb-20">
                        <a className="thm-btn thm-btn--stroke-black" href="#">
                            Voir tous les programmes
                            <span>
                                <svg width={24} height={24} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path
                                        d="M22 4.84993V16.7399C22 17.7099 21.21 18.5999 20.24 18.7199L19.93 18.7599C18.29 18.9799 15.98 19.6599 14.12 20.4399C13.47 20.7099 12.75 20.2199 12.75 19.5099V5.59993C12.75 5.22993 12.96 4.88993 13.29 4.70993C15.12 3.71993 17.89 2.83993 19.77 2.67993H19.83C21.03 2.67993 22 3.64993 22 4.84993Z"
                                        fill="#170006"
                                    />
                                    <path
                                        d="M10.71 4.70993C8.87999 3.71993 6.10999 2.83993 4.22999 2.67993H4.15999C2.95999 2.67993 1.98999 3.64993 1.98999 4.84993V16.7399C1.98999 17.7099 2.77999 18.5999 3.74999 18.7199L4.05999 18.7599C5.69999 18.9799 8.00999 19.6599 9.86999 20.4399C10.52 20.7099 11.24 20.2199 11.24 19.5099V5.59993C11.24 5.21993 11.04 4.88993 10.71 4.70993ZM4.99999 7.73993H7.24999C7.65999 7.73993 7.99999 8.07993 7.99999 8.48993C7.99999 8.90993 7.65999 9.23993 7.24999 9.23993H4.99999C4.58999 9.23993 4.24999 8.90993 4.24999 8.48993C4.24999 8.07993 4.58999 7.73993 4.99999 7.73993ZM7.99999 12.2399H4.99999C4.58999 12.2399 4.24999 11.9099 4.24999 11.4899C4.24999 11.0799 4.58999 10.7399 4.99999 10.7399H7.99999C8.40999 10.7399 8.74999 11.0799 8.74999 11.4899C8.74999 11.9099 8.40999 12.2399 7.99999 12.2399Z"
                                        fill="#170006"
                                    />
                                </svg>
                            </span>
                        </a>
                    </div>
                </div>
                <div className="row mt-none-60">
                    {/* Programme 1 */}
                    <div className="col-lg-4 col-md-6 mt-60">
                        <div className="xb-program__wrapper">
                            <div className="xb-item--img text-center">
                                <a href="#">
                                    <img src="assets/img/program/pro-img01.png" alt="Biomédical" />
                                </a>
                            </div>
                            <div className="xb-item--holder">
                                <div className="xb-item--deprt ul_li_between">
                                    <span className="xb-item--group"># Santé</span>
                                    <div className="xb-item--rating">
                                        <span>5.0</span> <img src="assets/img/icon/rating.png" alt="Note" />
                                    </div>
                                </div>
                                <h2 className="xb-item--title border-effect-2">
                                    <a href="course-single.html">MBA en Ingénierie Biomédicale</a>
                                </h2>
                                <ul className="xb-item--meta ul_li">
                                    <li>
                                        <img src="assets/img/icon/meta-icon01.png" alt="Places" />
                                        200 Places
                                    </li>
                                    <li>
                                        <img src="assets/img/icon/clock.png" alt="Durée" />
                                        14 Semestres
                                    </li>
                                </ul>
                                <div className="xb-item--dep-btn">
                                    <a href="#">S'inscrire</a>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Programme 2 */}
                    <div className="col-lg-4 col-md-6 mt-60">
                        <div className="xb-program__wrapper">
                            <div className="xb-item--img text-center">
                                <a href="#">
                                    <img src="assets/img/program/pro-img02.png" alt="Management" />
                                </a>
                            </div>
                            <div className="xb-item--holder">
                                <div className="xb-item--deprt ul_li_between">
                                    <span className="xb-item--group"># Management</span>
                                    <div className="xb-item--rating">
                                        <span>4.5</span> <img src="assets/img/icon/rating.png" alt="Note" />
                                    </div>
                                </div>
                                <h2 className="xb-item--title border-effect-2">
                                    <a href="#">MBA en Management de la Construction</a>
                                </h2>
                                <ul className="xb-item--meta ul_li">
                                    <li>
                                        <img src="assets/img/icon/meta-icon01.png" alt="Places" />
                                        250 Places
                                    </li>
                                    <li>
                                        <img src="assets/img/icon/clock.png" alt="Durée" />
                                        14 Semestres
                                    </li>
                                </ul>
                                <div className="xb-item--dep-btn">
                                    <a href="#">S'inscrire</a>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Programme 3 */}
                    <div className="col-lg-4 col-md-6 mt-60">
                        <div className="xb-program__wrapper">
                            <div className="xb-item--img text-center">
                                <a href="#">
                                    <img src="assets/img/program/pro-img03.png" alt="Stratégie" />
                                </a>
                            </div>
                            <div className="xb-item--holder">
                                <div className="xb-item--deprt ul_li_between">
                                    <span className="xb-item--group"># Stratégie</span>
                                    <div className="xb-item--rating">
                                        <span>5.0</span> <img src="assets/img/icon/rating.png" alt="Note" />
                                    </div>
                                </div>
                                <h2 className="xb-item--title border-effect-2">
                                    <a href="#">MBA en Management Stratégique</a>
                                </h2>
                                <ul className="xb-item--meta ul_li">
                                    <li>
                                        <img src="assets/img/icon/meta-icon01.png" alt="Places" />
                                        280 Places
                                    </li>
                                    <li>
                                        <img src="assets/img/icon/clock.png" alt="Durée" />
                                        14 Semestres
                                    </li>
                                </ul>
                                <div className="xb-item--dep-btn">
                                    <a href="#">S'inscrire</a>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Programme 4 */}
                    <div className="col-lg-4 col-md-6 mt-60">
                        <div className="xb-program__wrapper">
                            <div className="xb-item--img text-center">
                                <a href="#">
                                    <img src="assets/img/program/pro-img04.png" alt="Ingénierie" />
                                </a>
                            </div>
                            <div className="xb-item--holder">
                                <div className="xb-item--deprt ul_li_between">
                                    <span className="xb-item--group"># Ingénierie</span>
                                    <div className="xb-item--rating">
                                        <span>5.0</span> <img src="assets/img/icon/rating.png" alt="Note" />
                                    </div>
                                </div>
                                <h2 className="xb-item--title border-effect-2">
                                    <a href="#">MBA en Génie Mécanique</a>
                                </h2>
                                <ul className="xb-item--meta ul_li">
                                    <li>
                                        <img src="assets/img/icon/meta-icon01.png" alt="Places" />
                                        220 Places
                                    </li>
                                    <li>
                                        <img src="assets/img/icon/clock.png" alt="Durée" />
                                        14 Semestres
                                    </li>
                                </ul>
                                <div className="xb-item--dep-btn">
                                    <a href="#">S'inscrire</a>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Programme 5 */}
                    <div className="col-lg-4 col-md-6 mt-60">
                        <div className="xb-program__wrapper">
                            <div className="xb-item--img text-center">
                                <a href="#">
                                    <img src="assets/img/program/pro-img05.png" alt="Énergie" />
                                </a>
                            </div>
                            <div className="xb-item--holder">
                                <div className="xb-item--deprt ul_li_between">
                                    <span className="xb-item--group"># Énergie</span>
                                    <div className="xb-item--rating">
                                        <span>5.0</span> <img src="assets/img/icon/rating.png" alt="Note" />
                                    </div>
                                </div>
                                <h2 className="xb-item--title border-effect-2">
                                    <a href="#">MBA en Énergie Durable</a>
                                </h2>
                                <ul className="xb-item--meta ul_li">
                                    <li>
                                        <img src="assets/img/icon/meta-icon01.png" alt="Places" />
                                        200 Places
                                    </li>
                                    <li>
                                        <img src="assets/img/icon/clock.png" alt="Durée" />
                                        14 Semestres
                                    </li>
                                </ul>
                                <div className="xb-item--dep-btn">
                                    <a href="#">S'inscrire</a>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Programme 6 */}
                    <div className="col-lg-4 col-md-6 mt-60">
                        <div className="xb-program__wrapper">
                            <div className="xb-item--img text-center">
                                <a href="#">
                                    <img src="assets/img/program/pro-img06.png" alt="Immobilier" />
                                </a>
                            </div>
                            <div className="xb-item--holder">
                                <div className="xb-item--deprt ul_li_between">
                                    <span className="xb-item--group"># Immobilier</span>
                                    <div className="xb-item--rating">
                                        <span>4.9</span> <img src="assets/img/icon/rating.png" alt="Note" />
                                    </div>
                                </div>
                                <h2 className="xb-item--title border-effect-2">
                                    <a href="#">MBA en Immobilier et Urbanisme</a>
                                </h2>
                                <ul className="xb-item--meta ul_li">
                                    <li>
                                        <img src="assets/img/icon/meta-icon01.png" alt="Places" />
                                        230 Places
                                    </li>
                                    <li>
                                        <img src="assets/img/icon/clock.png" alt="Durée" />
                                        14 Semestres
                                    </li>
                                </ul>
                                <div className="xb-item--dep-btn">
                                    <a href="#">S'inscrire</a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* CTA */}
                {/* <div className="xb-cta bg_img pos-rel mt-120" data-background="assets/img/bg/pro-banner.png">
                    <h2 className="mb-15">Obtenez votre certification professionnelle avec UMK</h2>
                    <div className="xb-btn xb-cta-btn ul_li">
                        <a className="thm-btn btn-yellow mt-20" href="#">
                            Postuler maintenant
                            <span>
                                <img src="assets/img/icon/learning.png" alt="Apprentissage" />
                            </span>
                        </a>
                        <span className="mt-20">
                            <img src="assets/img/icon/calling-icon.png" alt="Téléphone" /> +243 821 11 22 333
                        </span>
                    </div>
                </div> */}
            </div>
            
            {/* Éléments décoratifs */}
            <div className="program-shape">
                <div className="shape shape--one">
                    <img data-parallax='{"x":-50,"y":-80}' src="assets/img/shape/book.png" alt="Livre" />
                </div>
                <div className="shape shape--two">
                    <img data-parallax='{"x":-50,"y":-80}' src="assets/img/shape/camical.png" alt="Camical" />
                </div>
                <div className="shape shape--three">
                    <img data-parallax='{"x":50,"y":80}' src="assets/img/shape/pen.png" alt="Stylo" />
                </div>
                <div className="shape shape--four">
                    <img data-parallax='{"x":50,"y":80}' src="assets/img/shape/stamp01.png" alt="Cachet" />
                </div>
            </div>
        </section>
    );
}