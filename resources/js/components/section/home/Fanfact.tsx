import React, { useEffect, useRef } from 'react';
import Swiper from 'swiper';

export default function Fanfact() {
  const swiperRef = useRef<Swiper | null>(null);
  const swiperContainerRef = useRef<HTMLDivElement>(null);

  const slides = [
    {
      img: "/assets/img/feature/feature-img01.png",
      title: "Notre excellence académique sans égale",
      number: "15+",
      text: "Instituts de recherche",
      content: "Des centres spécialisés dédiés à l'avancement des connaissances."
    },
    {
      img: "/assets/img/feature/feature-img03.png",
      title: "Ressources documentaires exceptionnelles",
      number: "10+",
      text: "Bibliothèques spécialisées",
      content: "Un réseau documentaire offrant des ressources variées et actualisées."
    }
  ];

  useEffect(() => {
    if (swiperContainerRef.current && !swiperRef.current) {
      swiperRef.current = new Swiper('.fanfact-slider', {
        slidesPerView: 1,
        roundLengths: true,
        loop: true,
        loopAdditionalSlides: 30,
        effect: "fade",
        pagination: {
          el: ".swiper-pagination",
          clickable: true,
        },
        autoplay: {
          delay: 6000
        },
        speed: 400,
        breakpoints: {
          '1600': { slidesPerView: 1 },
          '1200': { slidesPerView: 1 },
          '992': { slidesPerView: 1 },
          '768': { slidesPerView: 1 },
          '576': { slidesPerView: 1 },
          '0': { slidesPerView: 1 },
        },
      });
    }

    return () => {
      if (swiperRef.current) {
        swiperRef.current.destroy();
        swiperRef.current = null;
      }
    };
  }, []);

  return (
    <section className="fanfact pos-rel">
      <div className="container">
        <div className="fanfact-wrapper">
          <div className="fanfact-slider swiper-container" ref={swiperContainerRef}>
            <div className="swiper-wrapper">
              {slides.map((slide, index) => (
                <div className="swiper-slide" key={index}>
                  <div className="xb-fanfact__wrapper pos-rel">
                    <div className="xb-item--img">
                      <img src={slide.img} alt={slide.text} />
                    </div>
                    <h2 className="xb-item--title">{slide.title}</h2>
                    <div className="xb-item--holder">
                      <h3 className="xb-item--number">{slide.number}</h3>
                      <h2 className="xb-item--text">{slide.text}</h2>
                      <p className="xb-item--content">{slide.content}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="swiper-pagination ul_li_center"></div>
          </div>
        </div>
      </div>

      <style>{`
        .fanfact-slider {
            border-radius: 20px; }
            .fanfact-slider .swiper-pagination-bullets, .fanfact-slider .swiper-pagination-custom, .fanfact-slider .swiper-pagination-fraction {
                bottom: 38px; }
            .fanfact-slider .swiper-pagination-bullets .swiper-pagination-bullet {
                margin: 4px 4px; }
            .fanfact-slider .swiper-pagination-bullet {
                width: 10px;
                height: 10px;
                display: inline-block;
                border-radius: 50%;
                background: var(--color-white);
                opacity: .2; }
            .fanfact-slider .swiper-pagination-bullet-active {
                height: 14px;
                width: 14px;
                background: var(--color-white);
                opacity: 1; }
            .fanfact-slider .swiper-slide-active .xb-fanfact__wrapper .xb-item--title,
            .fanfact-slider .swiper-slide-active .xb-fanfact__wrapper .xb-item--holder {
                opacity: 1;
                visibility: visible;
                -webkit-transform: translateY(0);
                -ms-transform: translateY(0);
                transform: translateY(0);
                -webkit-transition: 0.5s;
                -o-transition: 0.5s;
                transition: 0.5s; }
            .fanfact-slider .swiper-slide-active .xb-fanfact__wrapper .xb-item--holder {
                transition-delay: .2s; }
      `}</style>
    </section>
  );
}