import React from 'react'
import Header from '@/components/common/Header/Header'
import Footer from '@/components/common/Footer/Footer'

export default function App({children}: {children: React.ReactNode}) {
  return (
    <>
        <Header/>
        <main>
            {children}
        </main>  
        <Footer/>  
    </>
  )
}
