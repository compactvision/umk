import App from '@/components/layouts/Home/App'
import React from 'react'
import Breadcumb from '@/components/UI/home/Breadcumb'
import Contact from '@/components/section/contact/Contact'

export default function Contactpage() {
  return (
    <App>
        <Breadcumb title="Contact" desc="Nous sommes là pour vous aider" />
        <Contact />
    </App>
  )
}
