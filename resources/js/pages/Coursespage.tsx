import Breadcumb from '@/components/UI/home/Breadcumb'
import React from 'react'
import App from '@/components/layouts/Home/App'
import Courses from '@/components/section/courses/Courses'

export default function Coursespage() {
  return (
    <App>
        <Breadcumb title="Nos Cours" desc="Offrir un large éventail d'opportunités d'apprentissage" />
        <Courses />
    </App>
  )
}
