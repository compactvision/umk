import App from "@/components/layouts/Home/App";
import AboutPageSection from "@/components/section/about/AboutPageSection";
import FanFact from "@/components/section/about/FanFact";
import Mission from "@/components/section/about/Mission";
import OrgansUMK from "@/components/section/about/OrgansUMK";
import Team from "@/components/section/about/Team";
import Breadcrumb from "@/components/UI/home/Breadcumb";



export default function AboutPage() {
    return (
        <App>
            <Breadcrumb title="À propos" desc="Découvrez l'Université Moderne de Kinkole" />
            <AboutPageSection />
            <Mission />
            {/* <FanFact /> */}
            {/* <Team /> */}
            <OrgansUMK />
        </App>
    );
}