import React from 'react'
import App from '@/components/layouts/Home/App'
import Breadcumb from '@/components/UI/home/Breadcumb'
import Admission from '@/components/section/admission/Admission'
import Faculty from '@/components/section/home/Faculty'
import Testimonial from '@/components/section/home/Testimonial'
import Fanfact from '@/components/section/admission/Fanfact'
import Cta from '@/components/section/admission/Cta'

export default function Admissionpage() {
  return (
    <App>
        <Breadcumb title="Admission" desc="Votre chemin pour rejoindre notre communauté universitaire" />
        <Admission />
        <Faculty />
        <Testimonial />
        <Fanfact />
        <Cta />
    </App>
  )
}
