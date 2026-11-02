import Dashboard from '@/components/layouts/Dashboard/Dashboard';
import EnrollmentShowSection from '@/components/section/dashboard/enrollement/EnrollmentShowSection';
import type { ComponentProps } from 'react';
export default function Show(props: ComponentProps<typeof EnrollmentShowSection>) {
    return (
        <Dashboard>
            <EnrollmentShowSection {...props} />
        </Dashboard>
    );
}
