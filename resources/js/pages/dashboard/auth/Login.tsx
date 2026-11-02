import Dashboard from '@/components/layouts/Dashboard/Dashboard';
import DashboardLogin from '@/components/section/dashboard/auth/DashboardLogin';

export default function Login() {
    return (
        <Dashboard authPage>
            <DashboardLogin />
        </Dashboard>
    );
}
