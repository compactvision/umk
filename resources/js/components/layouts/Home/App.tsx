import Footer from '@/components/common/Footer/Footer';
import Header from '@/components/common/Header/Header';
import AudienceConsent from '@/components/seo/AudienceConsent';
import Seo from '@/components/seo/Seo';
import PageContent from '@/components/system/PageContent';
import { ArrowUp } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import '../../../../css/usk.css';
export default function App({ children }: { children: ReactNode }) {
    const [show, setShow] = useState(false);
    useEffect(() => {
        const scroll = () => setShow(window.scrollY > 600);
        window.addEventListener('scroll', scroll, { passive: true });
        return () => window.removeEventListener('scroll', scroll);
    }, []);
    return (
        <div className="usk-site">
            <Seo />
            <Header />
            <main id="contenu" className="usk-page-content" data-page-tone="public">
                <PageContent tone="public">{children}</PageContent>
            </main>
            <Footer />
            <AudienceConsent />
            {show && (
                <button className="usk-back-top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="Retour en haut">
                    <ArrowUp size={20} />
                </button>
            )}
        </div>
    );
}
