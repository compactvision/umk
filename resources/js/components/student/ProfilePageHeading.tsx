import { Link } from '@inertiajs/react';
import { ArrowLeft, ArrowUpRight, Compass, KeyRound, UserRound } from 'lucide-react';
export default function ProfilePageHeading({ academic, onPassword, onGuide }: { academic: number; onPassword: () => void; onGuide: () => void }) {
    return (
        <div className="student-profile-desktop-intro">
            <Link href={`/dashboard/student?academic=${academic}`} className="student-profile-back">
                <ArrowLeft size={15} />
                Retour à mon espace
            </Link>
            <header className="student-profile-page-heading">
                <div className="student-profile-heading-icon">
                    <UserRound size={29} strokeWidth={1.4} />
                </div>
                <div>
                    <span>VOTRE ESPACE PERSONNEL</span>
                    <p>Un profil qui vous ressemble.</p>
                    <small>Vos informations, vos coordonnées et les repères de votre parcours.</small>
                </div>
                <div className="student-profile-heading-actions">
                    <button type="button" className="student-profile-guide" onClick={onGuide} aria-haspopup="dialog">
                        <Compass size={17} />
                        Guide
                    </button>
                    <button type="button" onClick={onPassword}>
                        <KeyRound size={17} />
                        Changer mon mot de passe
                        <ArrowUpRight size={14} />
                    </button>
                </div>
            </header>
        </div>
    );
}
