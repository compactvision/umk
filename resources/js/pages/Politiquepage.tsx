import App from "@/components/layouts/Home/App";
import { Shield, Database, Cog, Share2, UserCheck, RefreshCw, Mail, FileText, Info } from 'lucide-react';

// Mapping des icônes pour chaque section
const sectionIcons = {
    intro: Info,
    collection: Database,
    usage: Cog,
    sharing: Share2,
    security: Shield,
    rights: UserCheck,
    changes: RefreshCw,
    contact: Mail,
};

export default function PrivacyPolicy() {
    const lastUpdatedDate = "24 mai 2024";

    return (
        <App>
            {/* En-tête plus attractif */}
            <header className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-12 sm:py-16">
                <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 text-center">
                    <FileText className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 text-white/80" />
                    <h1 className="text-4xl sm:text-5xl font-extrabold mb-4">
                        Politique de Confidentialité
                    </h1>
                    <p className="text-lg sm:text-xl text-blue-100">
                        Votre vie privée est notre priorité.
                    </p>
                    <p className="text-sm text-blue-200 mt-2">
                        Dernière mise à jour : {lastUpdatedDate}
                    </p>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-12 sm:py-16 bg-gray-50 min-h-screen">
                {/* Carte pour l'introduction */}
                <div className="bg-white rounded-2xl shadow-md p-6 sm:p-8 mb-8 border-l-4 border-blue-500">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                        <Info className="w-7 h-7 text-blue-500" />
                        Introduction
                    </h2>
                    <div className="prose prose-lg text-gray-700">
                        <p>
                            Chez <strong>[Nom de votre entreprise]</strong>, nous nous engageons à protéger et à respecter votre vie privée. Cette politique de confidentialité explique quelles informations nous recueillons à votre sujet, comment nous les utilisons, les personnes avec qui nous les partageons et vos droits concernant vos données.
                        </p>
                        <p>
                            En utilisant notre site web <strong>[URL de votre site]</strong>, vous acceptez les pratiques décrites dans cette politique.
                        </p>
                    </div>
                </div>

                {/* Section pour les points clés avec des cartes */}
                <div className="space-y-8">
                    {/* Section 1: Collecte des données */}
                    <section className="bg-white rounded-2xl shadow-md overflow-hidden flex flex-col sm:flex-row">
                        <div className="bg-blue-500 text-white p-6 sm:w-1/3 flex items-center justify-center">
                            <Database className="w-12 h-12" />
                        </div>
                        <div className="p-6 sm:w-2/3">
                            <h3 className="text-xl font-bold text-gray-900 mb-3">1. Informations que nous collectons</h3>
                            <p className="text-gray-700 mb-3">Nous pouvons collecter les types d'informations suivants :</p>
                            <ul className="list-disc list-inside space-y-2 text-gray-600">
                                <li><strong>Informations personnelles :</strong> Nom, prénom, adresse e-mail, numéro de téléphone, etc.</li>
                                <li><strong>Informations d'inscription :</strong> Niveaux choisis, documents soumis, historique des paiements.</li>
                                <li><strong>Données d'utilisation :</strong> Adresse IP, type de navigateur, pages visitées.</li>
                                <li><strong>Cookies et technologies de suivi :</strong> Pour améliorer votre expérience et analyser le trafic.</li>
                            </ul>
                        </div>
                    </section>

                    {/* Section 2: Utilisation des données */}
                    <section className="bg-white rounded-2xl shadow-md overflow-hidden flex flex-col sm:flex-row">
                        <div className="bg-cyan-500 text-white p-6 sm:w-1/3 flex items-center justify-center">
                            <Cog className="w-12 h-12" />
                        </div>
                        <div className="p-6 sm:w-2/3">
                            <h3 className="text-xl font-bold text-gray-900 mb-3">2. Comment nous utilisons vos informations</h3>
                            <p className="text-gray-700 mb-3">Nous utilisons les informations que nous collectons pour :</p>
                            <ul className="list-disc list-inside space-y-2 text-gray-600">
                                <li>Fournir, exploiter et maintenir notre service d'inscription en ligne.</li>
                                <li>Vous communiquer des informations importantes concernant votre compte.</li>
                                <li>Personnaliser votre expérience et améliorer notre site.</li>
                                <li>Détecter, prévenir et résoudre les problèmes techniques.</li>
                            </ul>
                        </div>
                    </section>

                    {/* Section 3: Partage des données */}
                    <section className="bg-white rounded-2xl shadow-md overflow-hidden flex flex-col sm:flex-row">
                        <div className="bg-indigo-500 text-white p-6 sm:w-1/3 flex items-center justify-center">
                            <Share2 className="w-12 h-12" />
                        </div>
                        <div className="p-6 sm:w-2/3">
                            <h3 className="text-xl font-bold text-gray-900 mb-3">3. Partage de vos informations</h3>
                            <p className="text-gray-700 mb-3">Nous ne vendons pas vos informations. Nous ne partageons vos données que dans les cas suivants :</p>
                            <ul className="list-disc list-inside space-y-2 text-gray-600">
                                <li><strong>Avec les prestataires de services :</strong> Pour l'hébergement, l'analyse de données, le traitement des paiements.</li>
                                <li><strong>Obligations légales :</strong> Si la loi nous y oblige ou pour nous conformer à une procédure judiciaire.</li>
                            </ul>
                        </div>
                    </section>

                    {/* Section 4: Sécurité des données */}
                    <section className="bg-white rounded-2xl shadow-md overflow-hidden flex flex-col sm:flex-row">
                        <div className="bg-green-500 text-white p-6 sm:w-1/3 flex items-center justify-center">
                            <Shield className="w-12 h-12" />
                        </div>
                        <div className="p-6 sm:w-2/3">
                            <h3 className="text-xl font-bold text-gray-900 mb-3">4. Sécurité des données</h3>
                            <p className="text-gray-700">
                                La sécurité de vos données est une priorité. Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles appropriées pour protéger vos informations personnelles contre tout accès non autorisé, modification, divulgation ou destruction.
                            </p>
                        </div>
                    </section>

                    {/* Section 5: Vos droits */}
                    <section className="bg-white rounded-2xl shadow-md overflow-hidden flex flex-col sm:flex-row">
                        <div className="bg-purple-500 text-white p-6 sm:w-1/3 flex items-center justify-center">
                            <UserCheck className="w-12 h-12" />
                        </div>
                        <div className="p-6 sm:w-2/3">
                            <h3 className="text-xl font-bold text-gray-900 mb-3">5. Vos droits</h3>
                            <p className="text-gray-700 mb-3">Conformément à la législation, vous disposez des droits suivants :</p>
                            <ul className="list-disc list-inside space-y-2 text-gray-600">
                                <li><strong>Droit d'accès</strong> et de rectification.</li>
                                <li><strong>Droit de suppression</strong> de vos informations.</li>
                                <li><strong>Droit de limitation</strong> du traitement.</li>
                            </ul>
                            <p className="text-gray-700 mt-3">Pour exercer ces droits, contactez-nous à <strong>[adresse e-mail de contact]</strong>.</p>
                        </div>
                    </section>

                    {/* Section 6: Modifications */}
                    <section className="bg-white rounded-2xl shadow-md overflow-hidden flex flex-col sm:flex-row">
                        <div className="bg-orange-500 text-white p-6 sm:w-1/3 flex items-center justify-center">
                            <RefreshCw className="w-12 h-12" />
                        </div>
                        <div className="p-6 sm:w-2/3">
                            <h3 className="text-xl font-bold text-gray-900 mb-3">6. Modifications de cette politique</h3>
                            <p className="text-gray-700">
                                Nous nous réservons le droit de mettre à jour cette politique. Toute modification sera publiée sur cette page avec une nouvelle date de "dernière mise à jour".
                            </p>
                        </div>
                    </section>
                </div>

                {/* Pied de page pour le contact */}
                <footer className="bg-white rounded-2xl shadow-md p-6 sm:p-8 mt-12 text-center">
                    <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Contactez-nous</h3>
                    <p className="text-gray-700">
                        Pour toute question concernant cette politique, veuillez nous contacter :
                    </p>
                    <p className="text-gray-700 mt-2">
                        Par e-mail : <a href="mailto:[adresse e-mail de contact]" className="text-blue-600 hover:underline font-semibold">[adresse e-mail de contact]</a><br />
                        Par courrier : <strong>[Adresse postale de votre entreprise]</strong>
                    </p>
                </footer>
            </main>
        </App>
    );
}