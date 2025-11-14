import Dashboard from "@/components/layouts/Dashboard/Dashboard";
import EnrollmentShowSection from "@/components/section/dashboard/enrollement/EnrollmentShowSection";


export default function Show() {
    return <Dashboard>
        <EnrollmentShowSection enrollment={[]} />
    </Dashboard>;
}