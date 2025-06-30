import { useEffect, useRef } from 'react';
import Swiper from 'swiper';

export default function Testimonial() {
    const testimonialSwiperRef = useRef<Swiper | null>(null);
    const testimonialNavSwiperRef = useRef<Swiper | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const navContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (containerRef.current && navContainerRef.current) {
            // Configuration pour le slider vertical de navigation
            testimonialNavSwiperRef.current = new Swiper('.testimonial-slider-nav', {
                loop: true,
                spaceBetween: 20,
                speed: 500,
                slidesPerView: 2,
                direction: 'vertical',
                navigation: {
                    nextEl: '.xb-swiper-arrow-next',
                    prevEl: '.xb-swiper-arrow-prev',
                },
            });

            // Configuration pour le slider principal
            testimonialSwiperRef.current = new Swiper('.testimonial-slider', {
                loop: true,
                spaceBetween: 10,
                effect: 'fade',
                navigation: {
                    nextEl: '.xb-swiper-arrow-next',
                    prevEl: '.xb-swiper-arrow-prev',
                },
                thumbs: {
                    swiper: testimonialNavSwiperRef.current,
                },
            });
        }

        return () => {
            if (testimonialSwiperRef.current) {
                testimonialSwiperRef.current.destroy();
            }
            if (testimonialNavSwiperRef.current) {
                testimonialNavSwiperRef.current.destroy();
            }
        };
    }, []);

    const testimonials = [
        {
            mainImg: 'assets/img/testimonial/tes-img.png',
            thumbImg: 'assets/img/testimonial/tes-img02.png',
            quote: "L'université Edubost a transformé mon parcours. Le corps enseignant expert, les expériences pratiques et la communauté bienveillante m'ont parfaitement préparé pour ma carrière.",
            name: 'Dr. William Harris',
            role: 'Doyen des Humanités',
        },
        {
            mainImg: 'assets/img/testimonial/tes-img04.png',
            thumbImg: 'assets/img/testimonial/tes-img03.png',
            quote: 'Les installations de pointe et la vie étudiante dynamique ont rendu mon expérience universitaire inoubliable et enrichissante.',
            name: 'Jessica Taylor',
            role: 'Présidente du Conseil Étudiant',
        },
        {
            mainImg: 'assets/img/testimonial/tes-img.png',
            thumbImg: 'assets/img/testimonial/tes-img02.png',
            quote: "L'approche pédagogique innovante et les opportunités de recherche m'ont permis de développer des compétences clés pour mon avenir professionnel.",
            name: 'Ryan Stewart',
            role: 'Responsable des Services Informatiques',
        },
        {
            mainImg: 'assets/img/testimonial/tes-img04.png',
            thumbImg: 'assets/img/testimonial/tes-img03.png',
            quote: "L'accompagnement personnalisé et les relations étroites entre étudiants et professeurs font toute la différence dans la qualité de l'enseignement.",
            name: 'Sarah Parker',
            role: 'Coordinatrice de la Vie Étudiante',
        },
    ];

    return (
        <section className="testimonial pos-rel pt-120 pb-120">
            <div className="container">
                <div className="row align-items-center mt-none-30">
                    <div className="col-lg-6 mt-30">
                        <div className="xb-testimonial-left pos-rel" ref={containerRef}>
                            {/* Slider principal */}
                            <div className="testimonial-slider swiper-container">
                                <div className="swiper-wrapper">
                                    {testimonials.map((testimonial, index) => (
                                        <div className="swiper-slide" key={`main-${index}`}>
                                            <div className="tes-img">
                                                <img src={testimonial.mainImg} alt={`Témoignage ${testimonial.name}`} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Slider de navigation vertical */}
                            <div className="testimonial-slider-nav swiper-container" ref={navContainerRef}>
                                <div className="swiper-wrapper">
                                    {testimonials.map((testimonial, index) => (
                                        <div className="swiper-slide" key={`nav-${index}`}>
                                            <div className="testimonial-nav-item">
                                                <img src={testimonial.thumbImg} alt={`Miniature ${testimonial.name}`} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Contrôles de navigation */}
                            <div className="testimonial-carousel">
                                <div className="xb-swiper-arrow xb-swiper-arrow-next">
                                    <i className="far fa-angle-down" />
                                </div>
                                <div className="xb-swiper-arrow xb-swiper-arrow-prev">
                                    <i className="far fa-angle-up" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-lg-6 mt-30">
                        <div className="xb-testimonial-right">
                            <div className="section-title mb-70">
                                <span className="sub-title">Témoignages étudiants</span>
                                <h1 className="title">Ce que disent nos étudiants</h1>
                            </div>

                            {/* Slider des témoignages */}
                            <div className="testimonial-content-slider">
                                <div className="swiper-wrapper">
                                    {testimonials.map((testimonial, index) => (
                                        <div className="swiper-slide" key={`content-${index}`}>
                                            <div className="xb-item--holder">
                                                <div className="xb-item--quote mb-35">
                                                    <img src="assets/img/icon/qua.png" alt="Icône de citation" />
                                                </div>
                                                <p className="xb-item--content">"{testimonial.quote}"</p>
                                            </div>
                                            <div className="xb-item--author mt-60">
                                                <span className="xb-item--name">{testimonial.name}</span>
                                                <span className="xb-item--desig">{testimonial.role}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Éléments décoratifs */}
            <div className="xb-tes-shape">
                <span className="shape shape--one">
                    <img src="assets/img/shape/tes-shape.png" alt="Décoration" />
                </span>
                <span className="shape shape--two">
                    <img src="assets/img/shape/tes-shape02.png" alt="Décoration" />
                </span>
            </div>

            {/* Styles */}
            <style>{`
        .testimonial-slider
.xb-testimonial-right .xb-item--quote, .xb-testimonial-right .xb-item--author {
  opacity: 0;
  visibility: hidden;
  -webkit-transform: translateY(50px);
  -ms-transform: translateY(50px);
  transform: translateY(50px); }
.xb-testimonial-right .xb-item--content {
  font-size: 22px;
  line-height: 32px;
  opacity: 0;
  visibility: hidden;
  -webkit-transform: translateY(50px);
  -ms-transform: translateY(50px);
  transform: translateY(50px); }
.xb-testimonial-right .xb-item--name {
  font-weight: 700;
  font-size: 22px;
  line-height: 35px;
  color: var(--color-heading);
  display: block;
  opacity: 0;
  -webkit-transition: 0.3s;
  -o-transition: 0.3s;
  transition: 0.3s;
  -webkit-transform: translateY(20px);
  -ms-transform: translateY(20px);
  transform: translateY(20px); }
.xb-testimonial-right .xb-item--desig {
  font-size: 14px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  opacity: 0;
  -webkit-transition: 0.3s;
  -o-transition: 0.3s;
  transition: 0.3s;
  -webkit-transform: translateY(20px);
  -ms-transform: translateY(20px);
  transform: translateY(20px); }
.xb-testimonial-right .swiper-slide-active .xb-item--content, .xb-testimonial-right .swiper-slide-active .xb-item--quote, .xb-testimonial-right .swiper-slide-active .xb-item--author {
  opacity: 1;
  visibility: visible;
  -webkit-transform: translateY(0);
  -ms-transform: translateY(0);
  transform: translateY(0);
  -webkit-transition: 0.5s;
  -o-transition: 0.5s;
  transition: 0.5s; }
.xb-testimonial-right .swiper-slide-active .xb-item--content {
  transition-delay: .2s; }
.xb-testimonial-right .swiper-slide-active .xb-item--author {
  transition-delay: .3s; }

.testimonial-slider .swiper-slide-active .xb-item--name {
  opacity: 1;
  -webkit-transform: translateY(0px);
  -ms-transform: translateY(0px);
  transform: translateY(0px); }

.testimonial-slider .swiper-slide-active .xb-item--desig {
  opacity: 1;
  transition-delay: .1s;
  -webkit-transform: translateY(0px);
  -ms-transform: translateY(0px);
  transform: translateY(0px); }

@media (max-width: 1199px) {
  .xb-tes-shape {
    display: none; } }
.xb-tes-shape .shape {
  position: absolute; }
  .xb-tes-shape .shape--one {
    top: 0;
    left: 0; }
  .xb-tes-shape .shape--two {
    top: 0;
    right: 0; }

.testimonial-carousel {
  position: absolute;
  top: 28.6%;
  right: 0%;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center; }
  @media (max-width: 767px) {
    .testimonial-carousel {
      top: 21.6%;
      right: 10%; } }
  .testimonial-carousel .xb-swiper-arrow {
    position: absolute;
    height: 50px;
    width: 50px;
    background-color: #fff1d0;
    border-radius: 100%;
    font-weight: 400;
    color: var(--color-heading);
    display: flex;
    align-items: center;
    justify-content: center;
    -webkit-transition: 0.3s;
    -o-transition: 0.3s;
    transition: 0.3s;
    cursor: pointer; }
    .testimonial-carousel .xb-swiper-arrow:hover {
      background: var(--color-primary); }
  .testimonial-carousel .xb-swiper-arrow-next {
    top: 200px; }

.testimonial-slider-nav {
  position: absolute;
  top: 50%;
  right: -8%;
  max-height: 155px;
  padding: 10px;
  -webkit-transform: translateY(-50%);
  -ms-transform: translateY(-50%);
  transform: translateY(-50%); }
  @media (max-width: 767px) {
    .testimonial-slider-nav {
      right: 0; } }

.testimonial-nav-item {
  position: relative;
  height: 60px;
  width: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center; }
  .testimonial-nav-item::before {
    position: absolute;
    content: '';
    height: 70px;
    width: 70px;
    opacity: 0;
    -webkit-transform: scale(0.8);
    -ms-transform: scale(0.8);
    transform: scale(0.8);
    -webkit-transition: 0.3s;
    -o-transition: 0.3s;
    transition: 0.3s;
    border-radius: 50%;
    -webkit-border-radius: 50%;
    -moz-border-radius: 50%;
    -ms-border-radius: 50%;
    -o-border-radius: 50%;
    border: 1px solid var(--color-primary); }

.testimonial-slider-nav .swiper-slide-active .testimonial-nav-item::before {
  -webkit-transform: scale(1);
  -ms-transform: scale(1);
  transform: scale(1);
  opacity: 1; }

.xb-testimonial-left {
  max-width: 498px;
  margin-left: 48px; }
  @media (max-width: 767px) {
    .xb-testimonial-left {
      max-width: 100%;
      margin-left: 0; } }

.clg-testimonial .xb-item--holder {
  padding-right: 100px; }
  @media (max-width: 991px) {
    .clg-testimonial .xb-item--holder {
      padding-right: 0; } }
.clg-testimonial .xb-item--quote {
  position: absolute;
  left: 0;
  top: 0;
  height: 45px;
  width: 45px;
  border-radius: 100%;
  -webkit-border-radius: 100%;
  -moz-border-radius: 100%;
  -ms-border-radius: 100%;
  -o-border-radius: 100%;
  border-radius: 100%;
  background: var(--color-white);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 20px 0 rgba(23, 0, 6, 0.12); }
  @media (max-width: 991px) {
    .clg-testimonial .xb-item--quote {
      margin-left: 20px; } }
  @media (max-width: 767px) {
    .clg-testimonial .xb-item--quote {
      position: unset;
      margin-left: 0;
      margin-bottom: 30px; } }
.clg-testimonial .xb-item--content {
  font-family: var(--font-body);
  font-size: 36px;
  line-height: 46px;
  color: var(--color-heading);
  padding-left: 183px; }
  @media (max-width: 767px) {
    .clg-testimonial .xb-item--content {
      padding-left: 0;
      font-size: 22px;
      line-height: 37px; } }

.clg-tes-slider_nav {
  margin-left: 183px;
  margin-top: 60px;
  margin-right: 150px; }
  @media (max-width: 767px) {
    .clg-tes-slider_nav {
      margin-left: 70px;
      margin-right: 70px; } }

.clg-testimonial-slider {
  padding-left: 30px;
  margin-left: -30px; }
  @media (max-width: 991px) {
    .clg-testimonial-slider {
      padding-left: 0;
      margin-left: 0; } }

.clg-testimonial_author {
  display: inline-block;
  margin-left: 22px; }
  .clg-testimonial_author .xb-item--holder {
    margin-top: 10px;
    min-width: 200px; }
  .clg-testimonial_author .xb-item--avater {
    -webkit-transform: scale(0.56);
    -ms-transform: scale(0.56);
    transform: scale(0.56);
    -webkit-transition: 0.3s;
    -o-transition: 0.3s;
    transition: 0.3s;
    display: inline-block;
    width: 90px;
    height: 90px; }
    .clg-testimonial_author .xb-item--avater img {
      width: 100%;
      opacity: 0.5; }
  .clg-testimonial_author .xb-item--name {
    font-size: 22px;
    line-height: 35px;
    letter-spacing: -0.02px;
    color: var(--color-heading);
    transform: translateY(20px);
    opacity: 0;
    visibility: hidden;
    -webkit-transition: 0.3s;
    -o-transition: 0.3s;
    transition: 0.3s; }
  .clg-testimonial_author .xb-item--desig {
    font-size: 14px;
    letter-spacing: 0.1px;
    transform: translateY(20px);
    opacity: 0;
    visibility: hidden;
    -webkit-transition: 0.3s;
    -o-transition: 0.3s;
    transition: 0.3s; }

.clg-tes-slider_nav .swiper-slide-active .clg-testimonial_author .xb-item--avater {
  -webkit-transform: scale(1);
  -ms-transform: scale(1);
  transform: scale(1); }
  .clg-tes-slider_nav .swiper-slide-active .clg-testimonial_author .xb-item--avater img {
    opacity: 1; }
.clg-tes-slider_nav .swiper-slide-active .clg-testimonial_author .xb-item--name, .clg-tes-slider_nav .swiper-slide-active .clg-testimonial_author .xb-item--desig {
  opacity: 1;
  visibility: visible;
  transform: translateY(0); }

.hs-testimonial_wrapper .xb-item--inner {
  background: var(--color-white);
  padding: 35px 40px 31px;
  position: relative;
  border-radius: 15px 15px 15px 0;
  margin-bottom: 42px; }
  .hs-testimonial_wrapper .xb-item--inner::before {
    position: absolute;
    content: '';
    left: 0;
    bottom: -27px;
    width: 52px;
    height: 26.9px;
    background-image: url(../img/shape/hs-tes-sp.png);
    background-repeat: no-repeat; }
.hs-testimonial_wrapper .xb-item--number {
  font-weight: 700;
  font-size: 18px;
  color: #161a2c;
  margin-right: 11px; }
.hs-testimonial_wrapper .xb-item--star {
  margin-top: -4px; }
.hs-testimonial_wrapper .xb-item--content {
  font-size: 20px;
  line-height: 30px;
  border-top: 1px solid #d5e0e3;
  padding-top: 20px;
  font-weight: 400; }
.hs-testimonial_wrapper .xb-item--name {
  font-family: var(--font-body);
  font-weight: 700;
  font-size: 18px;
  color: #161a2c; }

.hs-testimonial-slider {
  margin-left: -125px;
  margin-right: -125px; }
  @media (max-width: 991px) {
    .hs-testimonial-slider {
      margin: 0;
      padding: 0 20px; } }

.tes-img img {
  border-radius: 15px;
  -webkit-border-radius: 15px;
  -moz-border-radius: 15px;
  -ms-border-radius: 15px;
  -o-border-radius: 15px; }

.clg-testimonial-carousel .xb-swiper-arrow {
  width: 62px;
  height: 40px;
  border-radius: 40px;
  -webkit-border-radius: 40px;
  -moz-border-radius: 40px;
  -ms-border-radius: 40px;
  -o-border-radius: 40px;
  background-color: var(--color-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  bottom: 98px;
  left: 0;
  -webkit-transition: 0.3s;
  -o-transition: 0.3s;
  transition: 0.3s; }
  .clg-testimonial-carousel .xb-swiper-arrow svg path {
    -webkit-transition: 0.3s;
    -o-transition: 0.3s;
    transition: 0.3s; }
  .clg-testimonial-carousel .xb-swiper-arrow:hover {
    background-color: var(--color-primary); }
    .clg-testimonial-carousel .xb-swiper-arrow:hover svg path {
      stroke: #000; }
  .clg-testimonial-carousel .xb-swiper-arrow.tm-swiper-arrow-next {
    left: auto;
    right: 0; }

@media (max-width: 1199px) {
  .xb-testimonial-right {
    margin-left: 40px; } }
@media (max-width: 767px) {
  .xb-testimonial-right {
    margin-left: 0; } }

      `}</style>
        </section>
    );
}
