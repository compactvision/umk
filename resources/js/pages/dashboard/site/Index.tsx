import Dashboard from "@/components/layouts/Dashboard/Dashboard";
import { Building2, Globe, Mail, Phone, MapPin, Facebook, Twitter, Linkedin, Image } from 'lucide-react';

// --- DONNÉES EXEMPLE ---
// Dans une vraie application, ces données proviendraient de votre API (usePage, axios, etc.)
const siteInfo = {
    siteName: "Académie Pro",
    siteTagline: "La excellence dans l'éducation professionnelle",
    contactEmail: "contact@academie-pro.ma",
    contactPhone: "+212 5XX-XXXXXX",
    address: "123 Avenue de l'Université, Agdal, Rabat, Maroc",
    logoUrl: "https://via.placeholder.com/150x50.png?text=Mon+Logo",
    faviconUrl: "https://via.placeholder.com/32x32.png?text=F",
    socialLinks: {
        facebook: "https://facebook.com/academiepro",
        twitter: "https://twitter.com/academiepro",
        linkedin: "https://linkedin.com/company/academiepro",
    }
};

export default function SiteSettingsPage() {
    return (
        <Dashboard>
            <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8 bg-gradient-to-br from-gray-50 to-slate-100 min-h-screen">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 pb-4 border-b-2 border-gray-200">
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-500 mb-4 sm:mb-0">
                        Paramètres du Site
                    </h1>
                    {/* Vous pourriez ajouter un bouton de sauvegarde ici plus tard */}
                </div>

                {/* Carte principale pour les informations */}
                <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 shadow-lg border border-gray-100">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                        
                        {/* Colonne 1: Informations Générales & Contact */}
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <Globe className="w-5 h-5 text-blue-500" />
                                    Informations Générales
                                </h2>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500">Nom du site</label>
                                        <p className="mt-1 text-lg font-semibold text-gray-900">{siteInfo.siteName}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500">Slogan</label>
                                        <p className="mt-1 text-gray-700">{siteInfo.siteTagline}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t pt-6">
                                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <Building2 className="w-5 h-5 text-cyan-500" />
                                    Coordonnées
                                </h2>
                                <div className="space-y-4">
                                    <div className="flex items-start gap-3">
                                        <Mail className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <label className="block text-sm font-medium text-gray-500">Email</label>
                                            <a href={`mailto:${siteInfo.contactEmail}`} className="mt-1 text-blue-600 hover:underline">{siteInfo.contactEmail}</a>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <Phone className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <label className="block text-sm font-medium text-gray-500">Téléphone</label>
                                            <a href={`tel:${siteInfo.contactPhone}`} className="mt-1 text-blue-600 hover:underline">{siteInfo.contactPhone}</a>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <MapPin className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <label className="block text-sm font-medium text-gray-500">Adresse</label>
                                            <p className="mt-1 text-gray-700">{siteInfo.address}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Colonne 2: Médias & Réseaux Sociaux */}
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <Image className="w-5 h-5 text-green-500" />
                                    Médias
                                </h2>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500">URL du Logo</label>
                                        <div className="mt-2 p-2 border border-gray-200 rounded-lg bg-gray-50 flex items-center justify-center h-20">
                                            <img src={siteInfo.logoUrl} alt="Logo du site" className="max-h-full max-w-full object-contain" />
                                        </div>
                                        <p className="mt-1 text-xs text-gray-400 truncate">{siteInfo.logoUrl}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500">URL du Favicon</label>
                                        <div className="mt-2 p-2 border border-gray-200 rounded-lg bg-gray-50 flex items-center justify-center h-16">
                                            <img src={siteInfo.faviconUrl} alt="Favicon du site" className="max-h-full max-w-full object-contain" />
                                        </div>
                                        <p className="mt-1 text-xs text-gray-400 truncate">{siteInfo.faviconUrl}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t pt-6">
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">Réseaux Sociaux</h2>
                                <div className="space-y-3">
                                    <a href={siteInfo.socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-gray-600 hover:text-blue-600 transition-colors">
                                        <Facebook className="w-5 h-5" />
                                        <span>Facebook</span>
                                    </a>
                                    <a href={siteInfo.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-gray-600 hover:text-cyan-500 transition-colors">
                                        <Twitter className="w-5 h-5" />
                                        <span>Twitter</span>
                                    </a>
                                    <a href={siteInfo.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-gray-600 hover:text-blue-700 transition-colors">
                                        <Linkedin className="w-5 h-5" />
                                        <span>LinkedIn</span>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Pied de page avec le bouton d'action */}
                    <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end">
                        <button className="px-6 sm:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 text-sm sm:text-base">
                            Activer la modification
                        </button>
                    </div>
                </div>
            </div>
        </Dashboard>
    );
}