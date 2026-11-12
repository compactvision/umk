import BackButton from '@/components/UI/dashboard/BackButton';
import DossierBackLink from '@/components/system/DossierBackLink';
import { dossierListPosition } from '@/components/system/dossier-navigation';
import { usePage } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
const restoreList = new Set(['dashboard/adminEnrollments/Show', 'dashboard/faculties/Show', 'dashboard/levels/Show']);
const destinations: Record<string, { href: string; label: string }> = {
    'dashboard/professors/Show': { href: '/dashboard/admin/professors', label: 'Retour aux enseignants' },
    'dashboard/academicYear/Show': { href: '/dashboard/admin/academic-years', label: 'Retour aux années académiques' },
    'dashboard/faculties/Show': { href: '/dashboard/admin/faculties', label: 'Retour aux facultés' },
    'dashboard/levels/Show': { href: '/dashboard/admin/levels', label: 'Retour aux niveaux' },
    'dashboard/blog/Show': { href: '/dashboard/admin/posts', label: 'Retour aux actualités' },
    'dashboard/adminEnrollments/Show': { href: '/dashboard/admin/enrollments', label: 'Retour aux inscriptions' },
};
export default function DetailNavigation() {
    const { component, url } = usePage();
    const destination = destinations[component];
    const fromFaculty = component === 'dashboard/levels/Show' && dossierListPosition(url)?.href.startsWith('/dashboard/admin/faculties/');
    return destination ? (
        <div className="admin-detail-navigation">
            {restoreList.has(component) ? (
                <DossierBackLink href={destination.href} className="admin-back-link">
                    <ArrowLeft size={16} aria-hidden="true" />
                    <span>{fromFaculty ? 'Retour à la faculté' : destination.label}</span>
                </DossierBackLink>
            ) : (
                <BackButton {...destination} />
            )}
        </div>
    ) : null;
}
