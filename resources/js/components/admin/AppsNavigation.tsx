import { Link, usePage } from '@inertiajs/react';
import { BookOpen, CalendarDays, Files, GraduationCap, Layers3, Users } from 'lucide-react';
const apps = [
    { component: 'seo', label: 'Référencement', href: '/dashboard/admin/seo', icon: BookOpen },
    { component: 'schedule', label: 'Horaires', href: '/dashboard/admin/schedule', icon: CalendarDays, permissions: ['publish academic content'] },
    { component: 'professors', label: 'Enseignants', href: '/dashboard/admin/professors', icon: Users },
    {
        component: 'studentAcademic',
        label: 'Nos étudiants',
        href: '/dashboard/admin/student-academic',
        icon: Files,
        permissions: ['manage academic access', 'manage academic finance', 'publish academic content'],
    },
    {
        component: 'adminEnrollments',
        label: 'Inscriptions',
        href: '/dashboard/admin/enrollments',
        icon: Files,
        permissions: ['manage academic access'],
    },
    { component: 'academicYear', label: 'Années académiques', href: '/dashboard/admin/academic-years', icon: CalendarDays },
    { component: 'faculties', label: 'Facultés', href: '/dashboard/admin/faculties', icon: GraduationCap },
    { component: 'levels', label: 'Niveaux', href: '/dashboard/admin/levels', icon: Layers3 },
    { component: 'blog', label: 'Actualités', href: '/dashboard/admin/posts', icon: BookOpen },
];
export default function AppsNavigation() {
    const { component, props } = usePage<{ auth?: { user?: { permissions?: string[] } | null } }>();
    const current = component.split('/')[1];
    const permissions = props.auth?.user?.permissions ?? [];
    return (
        <div className="admin-apps-context">
            <div className="admin-apps-eyebrow">
                <span /> ADMINISTRATION USK <span className="admin-apps-context-divider">/</span> APPS
            </div>
            <nav aria-label="Applications de l’administration">
                {apps
                    .filter((app) => !app.permissions || app.permissions.some((permission) => permissions.includes(permission)))
                    .map(({ component: section, label, href, icon: Icon }) => (
                        <Link key={section} href={href} aria-current={section === current ? 'page' : undefined}>
                            <Icon size={16} />
                            {label}
                        </Link>
                    ))}
            </nav>
        </div>
    );
}
