import React from 'react'
import Header from '@/components/common/Header/Header'
import Footer from '@/components/common/Footer/Footer'
import Preloader from '@/components/UI/home/Preloader'

export default function App({children}: {children: React.ReactNode}) {
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
