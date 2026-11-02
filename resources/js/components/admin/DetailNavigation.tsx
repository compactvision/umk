import BackButton from '@/components/UI/dashboard/BackButton';
import { usePage } from '@inertiajs/react';
const destinations: Record<string, { href: string; label: string }> = {
    'dashboard/professors/Show': { href: '/dashboard/admin/professors', label: 'Retour aux enseignants' },
    'dashboard/academicYear/Show': { href: '/dashboard/admin/academic-years', label: 'Retour aux années académiques' },
    'dashboard/faculties/Show': { href: '/dashboard/admin/faculties', label: 'Retour aux facultés' },
    'dashboard/levels/Show': { href: '/dashboard/admin/levels', label: 'Retour aux niveaux' },
    'dashboard/blog/Show': { href: '/dashboard/admin/posts', label: 'Retour aux actualités' },
    'dashboard/adminEnrollments/Show': { href: '/dashboard/admin/enrollments', label: 'Retour aux inscriptions' },
};
export default function DetailNavigation() {
    const { component } = usePage();
    const destination = destinations[component];
    return destination ? (
        <div className="admin-detail-navigation">
            <BackButton {...destination} />
        </div>
    ) : null;
}
