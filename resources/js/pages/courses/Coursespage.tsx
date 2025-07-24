import Breadcumb from '@/components/UI/home/Breadcumb'
import React from 'react'
import App from '@/components/layouts/Home/App'
import Courses from '@/components/section/courses/Courses'
import { usePage } from '@inertiajs/react';

export default function Coursespage() {
    const { faculties } = usePage().props
    const facultyList = Array.isArray(faculties?.data) ? faculties.data : [];

  return (
    <App>
        <Breadcumb title="Nos Cours" desc="Offrir un large éventail d'opportunités d'apprentissage" />
        <Courses faculties={facultyList}/>
    </App>
  )
}
