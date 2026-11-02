import { Link, usePage } from '@inertiajs/react';
import { BookOpen, CalendarDays, Files, GraduationCap, Layers3, Users } from 'lucide-react';
const apps = [
    { component: 'seo', label: 'Référencement', href: '/dashboard/admin/seo', icon: BookOpen },
    { component: 'schedule', label: 'Horaires', href: '/dashboard/admin/schedule', icon: CalendarDays },
    { component: 'professors', label: 'Enseignants', href: '/dashboard/admin/professors', icon: Users },
    { component: 'studentAcademic', label: 'Nos étudiants', href: '/dashboard/admin/student-academic', icon: Files },
    { component: 'adminEnrollments', label: 'Inscriptions', href: '/dashboard/admin/enrollments', icon: Files },
    { component: 'academicYear', label: 'Années académiques', href: '/dashboard/admin/academic-years', icon: CalendarDays },
    { component: 'faculties', label: 'Facultés', href: '/dashboard/admin/faculties', icon: GraduationCap },
    { component: 'levels', label: 'Niveaux', href: '/dashboard/admin/levels', icon: Layers3 },
    { component: 'blog', label: 'Actualités', href: '/dashboard/admin/posts', icon: BookOpen },
];
export default function AppsNavigation() {
    const { component } = usePage();
    const current = component === 'dashboard/faculties/Show' ? 'levels' : component.split('/')[1];
    return (
        <div className="admin-apps-context">
            <div className="admin-apps-eyebrow">
                <span /> ADMINISTRATION USK <span className="admin-apps-context-divider">/</span> APPS
            </div>
            <nav aria-label="Applications de l’administration">
                {apps.map(({ component: section, label, href, icon: Icon }) => (
                    <Link key={section} href={href} aria-current={section === current ? 'page' : undefined}>
                        <Icon size={16} />
                        {label}
                    </Link>
                ))}
            </nav>
        </div>
    );
}
