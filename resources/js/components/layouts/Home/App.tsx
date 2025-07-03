import '../../../../css/home/app.css';

import React, { useEffect } from 'react'
import Header from '@/components/common/Header/Header'
import Footer from '@/components/common/Footer/Footer'
import Preloader from '@/components/UI/home/Preloader'

export default function App({children}: {children: React.ReactNode}) {
  useEffect(() => {
          // Applique les styles pour data-background
          document.querySelectorAll("[data-background]").forEach((element) => {
              const url = element.getAttribute("data-background");
              if (url) {
                  (element as HTMLElement).style.backgroundImage = `url(${url})`;
              }
          });
  
          // Applique les styles pour data-bg-color
          document.querySelectorAll("[data-bg-color]").forEach((element) => {
              const color = element.getAttribute("data-bg-color");
              if (color) {
                  (element as HTMLElement).style.backgroundColor = color;
              }
          });
      }, []);
  return (
    <>
        <Preloader />
        <Header/>
        <main>
            {children}
        </main>  
        <Footer/>  
    </>
  )
}
