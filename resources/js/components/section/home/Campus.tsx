import React, { useEffect, useRef } from 'react';
import Swiper from 'swiper';

export default function Campus() {
  const swiperRef = useRef<Swiper | null>(null);
  const swiperContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (swiperContainerRef.current && !swiperRef.current) {
      swiperRef.current = new Swiper('.campus-slider', {
        slidesPerView: 4,
        roundLengths: true,
        loop: true,
        spaceBetween: 30,
        centeredSlides: true,
        loopAdditionalSlides: 30,
        speed: 400,
        pagination: {
          el: ".swiper-pagination",
          clickable: true,
        },
        autoplay: {
          delay: 6000
        },
        breakpoints: {
          '1600': { slidesPerView: 4 },
          '1200': { slidesPerView: 3 },
          '992': { slidesPerView: 2 },
          '768': { slidesPerView: 2 },
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

  const campusItems = [
    {
      img: "assets/img/campus/campus-img01.png",
      title: "Expériences culturelles",
      link: "#"
    },
    {
      img: "assets/img/campus/campus-img02.png",
      title: "Vie étudiante",
      link: "#"
    },
    {
      img: "assets/img/campus/campus-img03.png",
      title: "Activités sportives",
      link: "#"
    }
  ];

  return (
    <section className="campus pos-rel bg_img z-1 pt-195 pb-200" data-background="assets/img/bg/campus-bg.jpg">
      <div className="section-title mt-80 mb-60 text-center">
        <span className="sub-title">Vie sur le campus</span>
        <h1 className="title">Découvrez notre environnement</h1>
      </div>
      
      <div className="campus-slider mr-set" ref={swiperContainerRef}>
        <div className="swiper-wrapper">
          {campusItems.map((item, index) => (
            <div className="swiper-slide" key={index}>
              <div className="xb-campus__wrapper pos-rel">
                <div className="xb-item--img pos-rel">
                  <img src={item.img} alt={item.title} />
                </div>
                <div className="xb-item--holder">
                  <h3 className="xb-item--title">{item.title}</h3>
                  <div className="xb-btn_thm ul_li">
                    <a className="thm-btn btn-yellow" href={item.link}>
                      En savoir plus
                      <span>
                        <svg width={13} height={13} viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path
                            d="M13 0.999999C13 0.447714 12.5523 -1.14869e-06 12 -1.40157e-06L3 -6.00782e-07C2.44772 -9.37957e-07 2 0.447715 2 0.999999C2 1.55228 2.44772 2 3 2L11 2L11 10C11 10.5523 11.4477 11 12 11C12.5523 11 13 10.5523 13 10L13 0.999999ZM1.70711 12.7071L12.7071 1.70711L11.2929 0.292892L0.292893 11.2929L1.70711 12.7071Z"
                            fill="black"
                          />
                        </svg>
                      </span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="swiper-pagination ul_li_center"></div>
      </div>

      <style>{`
        .campus-slider
.campus-slider .swiper-slide-active .xb-campus__wrapper .xb-item--title {
  opacity: 1;
  transform: translateY(0);
  -webkit-transition: 0.4s;
  -o-transition: 0.4s;
  transition: 0.4s; }
.campus-slider .swiper-slide-active .xb-campus__wrapper .xb-item--holder .xb-btn_thm {
  opacity: 1;
  transform: translateY(0);
  -webkit-transition: 0.4s;
  -o-transition: 0.4s;
  transition: 0.4s;
  transition-delay: .2s; }

.campus-slider {
  border-radius: 20px; }
  .campus-slider .swiper-pagination-bullets, .campus-slider .swiper-pagination-custom, .campus-slider .swiper-pagination-fraction {
    bottom: 120px; }
  .campus-slider .swiper-pagination-bullets .swiper-pagination-bullet {
    margin: 4px 4px; }
  .campus-slider .swiper-pagination-bullet {
    width: 10px;
    height: 10px;
    display: inline-block;
    border-radius: 50%;
    background: var(--color-heading);
    opacity: .2; }
  .campus-slider .swiper-pagination-bullet-active {
    height: 14px;
    width: 14px;
    background: var(--color-heading);
    opacity: 1; }
      `}</style>
    </section>
  );
}