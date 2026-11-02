import Breadcrumb from "@/components/UI/home/Breadcumb";
import App from "@/components/layouts/Home/App";
import { FileCheck, Monitor, UserCheck, Shield, Eye, AlertTriangle, UserX, RefreshCw, Scale, Mail } from 'lucide-react';

export default function TermsOfUse() {
    const lastUpdatedDate = "24 mai 2024";

    return (
        <App>
            {/* En-tête percutant */}
            <Breadcrumb title="Conditions d’utilisation" desc="Les informations relatives à l’utilisation du site et à votre relation avec l’Université Simon Kimbangu." />

            <main className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-12 sm:py-16 bg-gray-50 min-h-screen">
                <div className="space-y-8">
                    {/* Section 1: Acceptation */}
                    <section className="bg-white rounded-2xl shadow-md overflow-hidden flex flex-col sm:flex-row">
                        <div className="bg-green-500 text-white p-6 sm:w-1/3 flex items-center justify-center">
                            <FileCheck className="w-12 h-12" />
                        </div>
                        <div className="p-6 sm:w-2/3">
                            <h3 className="text-xl font-bold text-gray-900 mb-3">1. Acceptation des conditions</h3>
                            <p className="text-gray-700">
                                L'accès et l'utilisation du site web <strong>universitesk.net</strong> (le "Service") sont soumis aux présentes conditions générales d'utilisation ("CGU"). En accédant ou en utilisant le Service, vous acceptez d'être lié par ces CGU. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser notre Service.
                            </p>
                        </div>
                    </section>

                    {/* Section 2: Description du service */}
                    <section className="bg-white rounded-2xl shadow-md overflow-hidden flex flex-col sm:flex-row">
                        <div className="bg-emerald-500 text-white p-6 sm:w-1/3 flex items-center justify-center">
                            <Monitor className="w-12 h-12" />
                        </div>
                        <div className="p-6 sm:w-2/3">
                            <h3 className="text-xl font-bold text-gray-900 mb-3">2. Description du service</h3>
                            <p className="text-gray-700">
                                <strong>Université Simon Kimbangu</strong> fournit une plateforme en ligne permettant aux utilisateurs de s'inscrire à des programmes d'études et de gérer leur dossier d'inscription.
                            </p>
                        </div>
                    </section>

                    {/* Section 3: Obligations de l'utilisateur */}
                    <section className="bg-white rounded-2xl shadow-md overflow-hidden flex flex-col sm:flex-row">
                        <div className="bg-emerald-500 text-white p-6 sm:w-1/3 flex items-center justify-center">
                            <UserCheck className="w-12 h-12" />
                        </div>
                        <div className="p-6 sm:w-2/3">
                            <h3 className="text-xl font-bold text-gray-900 mb-3">3. Obligations de l'utilisateur</h3>
                            <p className="text-gray-700 mb-3">En utilisant notre Service, vous vous engagez à :</p>
                            <ul className="list-disc list-inside space-y-2 text-gray-600">
                                <li>Fournir des informations exactes, complètes et à jour.</li>
                                <li>Ne pas utiliser le Service à des fins illégales.</li>
                                <li>Ne pas perturber ou surcharger nos serveurs.</li>
                                <li>Ne pas tenter de gagner un accès non autorisé.</li>
                                <li>Être responsable de la confidentialité de vos identifiants.</li>
                            </ul>
                        </div>
                    </section>

                    {/* Section 4: Propriété intellectuelle */}
                    <section className="bg-white rounded-2xl shadow-md overflow-hidden flex flex-col sm:flex-row">
                        <div className="bg-emerald-500 text-white p-6 sm:w-1/3 flex items-center justify-center">
                            <Shield className="w-12 h-12" />
                        </div>
                        <div className="p-6 sm:w-2/3">
                            <h3 className="text-xl font-bold text-gray-900 mb-3">4. Propriété intellectuelle</h3>
                            <p className="text-gray-700 mb-3">
                                Le Service et tout son contenu sont la propriété de <strong>Université Simon Kimbangu</strong> et sont protégés par les lois sur la propriété intellectuelle.
                            </p>
                            <p className="text-gray-700">
                                Les documents que vous soumettez restent votre propriété. Cependant, en nous les soumettant, vous nous accordez le droit de les utiliser aux fins de la gestion de votre inscription.
                            </p>
                        </div>
                    </section>

                    {/* Section 5: Confidentialité */}
                    <section className="bg-white rounded-2xl shadow-md overflow-hidden flex flex-col sm:flex-row">
                        <div className="bg-emerald-500 text-white p-6 sm:w-1/3 flex items-center justify-center">
                            <Eye className="w-12 h-12" />
                        </div>
                        <div className="p-6 sm:w-2/3">
                            <h3 className="text-xl font-bold text-gray-900 mb-3">5. Confidentialité</h3>
                            <p className="text-gray-700">
                                Votre confidentialité est importante pour nous. Veuillez consulter notre <a href="/politique-de-confidentialite" className="text-emerald-600 hover:underline font-semibold">Politique de Confidentialité</a> pour comprendre comment nous collectons, utilisons et protégeons vos informations.
                            </p>
                        </div>
                    </section>

                    {/* Section 6: Limitation de responsabilité */}
                    <section className="bg-white rounded-2xl shadow-md overflow-hidden flex flex-col sm:flex-row">
                        <div className="bg-red-500 text-white p-6 sm:w-1/3 flex items-center justify-center">
                            <AlertTriangle className="w-12 h-12" />
                        </div>
                        <div className="p-6 sm:w-2/3">
                            <h3 className="text-xl font-bold text-gray-900 mb-3">6. Limitation de responsabilité</h3>
                            <p className="text-gray-700">
                                Dans la mesure maximale permise par la loi, <strong>Université Simon Kimbangu</strong> ne sera pas responsable des dommages indirects découlant de votre utilisation ou de votre incapacité à utiliser le Service.
                            </p>
                        </div>
                    </section>

                    {/* Section 7: Résiliation */}
                    <section className="bg-white rounded-2xl shadow-md overflow-hidden flex flex-col sm:flex-row">
                        <div className="bg-orange-500 text-white p-6 sm:w-1/3 flex items-center justify-center">
                            <UserX className="w-12 h-12" />
                        </div>
                        <div className="p-6 sm:w-2/3">
                            <h3 className="text-xl font-bold text-gray-900 mb-3">7. Résiliation</h3>
                            <p className="text-gray-700">
                                Nous nous réservons le droit de suspendre ou de résilier votre compte à tout moment, pour quelque raison que ce soit, pour violation des présentes CGU.
                            </p>
                        </div>
                    </section>

                    {/* Section 8: Modifications des conditions */}
                    <section className="bg-white rounded-2xl shadow-md overflow-hidden flex flex-col sm:flex-row">
                        <div className="bg-teal-500 text-white p-6 sm:w-1/3 flex items-center justify-center">
                            <RefreshCw className="w-12 h-12" />
                        </div>
                        <div className="p-6 sm:w-2/3">
                            <h3 className="text-xl font-bold text-gray-900 mb-3">8. Modifications des conditions</h3>
                            <p className="text-gray-700">
                                Nous nous réservons le droit de modifier ces CGU à tout moment. Si nous apportons des modifications importantes, nous vous en informerons par e-mail ou en publiant un avis bien visible sur notre site.
                            </p>
                        </div>
                    </section>

                    {/* Section 9: Loi applicable */}
                    <section className="bg-white rounded-2xl shadow-md overflow-hidden flex flex-col sm:flex-row">
                        <div className="bg-gray-600 text-white p-6 sm:w-1/3 flex items-center justify-center">
                            <Scale className="w-12 h-12" />
                        </div>
                        <div className="p-6 sm:w-2/3">
                            <h3 className="text-xl font-bold text-gray-900 mb-3">9. Loi applicable</h3>
                            <p className="text-gray-700">
                                Ces CGU sont régies et interprétées conformément aux lois de <strong>[Votre Pays/État]</strong>, sans tenir compte de ses dispositions en matière de conflit de lois.
                            </p>
                        </div>
                    </section>
                </div>

                {/* Pied de page pour le contact */}
                <footer className="bg-white rounded-2xl shadow-md p-6 sm:p-8 mt-12 text-center">
                    <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Des questions ?</h3>
                    <p className="text-gray-700">
                        Pour toute question concernant ces CGU, veuillez nous contacter :
                    </p>
                    <p className="text-gray-700 mt-2">
                        Par e-mail : <a href="mailto:contact@universitesk.net" className="text-emerald-600 hover:underline font-semibold">contact@universitesk.net</a><br />
                        Par courrier : <strong>N° 44, avenue Bongolo, Kauka, Kalamu, Kinshasa, RDC</strong>
                    </p>
                </footer>
            </main>
        </App>
    );
}