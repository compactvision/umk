import Dashboard from "@/components/layouts/Dashboard/Dashboard";
import { Building2, Globe, Mail, Phone, MapPin, Facebook, Twitter, Linkedin, Image, Save, X, Upload } from 'lucide-react';
import { useState } from 'react';
import { usePage, router } from '@inertiajs/react';
import Alert from "@/utils/sweetAlert";

interface SiteData {
    id?: number;
    siteName: string;
    siteTagline: string;
    contactEmail: string;
    contactPhone: string;
    address: string;
    description?: string;
    logoUrl?: string;
    faviconUrl?: string;
    socialLinks: {
        facebook: string;
        twitter: string;
        linkedin: string;
    };
}

export default function SiteSettingsPage() {
    const { site } = usePage<{ site: SiteData | null }>().props;
    
    const [isEditing, setIsEditing] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    
    // Form data
    const [formData, setFormData] = useState<SiteData>({
        siteName: site?.siteName || '',
        siteTagline: site?.siteTagline || '',
        contactEmail: site?.contactEmail || '',
        contactPhone: site?.contactPhone || '',
        address: site?.address || '',
        description: site?.description || '',
        socialLinks: site?.socialLinks || {
            facebook: '',
            twitter: '',
            linkedin: '',
        },
    });
    
    const [logo, setLogo] = useState<File | null>(null);
    const [favicon, setFavicon] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [faviconPreview, setFaviconPreview] = useState<string | null>(null);

    const handleFileChange = (field: 'logo' | 'favicon', e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            if (field === 'logo') {
                setLogo(file);
                setLogoPreview(URL.createObjectURL(file));
            } else {
                setFavicon(file);
                setFaviconPreview(URL.createObjectURL(file));
            }
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        const data = new FormData();
        data.append('siteName', formData.siteName);
        data.append('siteTagline', formData.siteTagline || '');
        data.append('contactEmail', formData.contactEmail || '');
        data.append('contactPhone', formData.contactPhone || '');
        data.append('address', formData.address || '');
        data.append('description', formData.description || '');
        data.append('socialLinks', JSON.stringify(formData.socialLinks));
        
        if (logo) {
            data.append('logo', logo);
        }
        if (favicon) {
            data.append('favicon', favicon);
        }

        // Use POST with _method for file uploads (Inertia limitation with PUT)
        data.append('_method', 'PUT');

        router.post(route('dashboard.admin.site.update', { id: site?.id || 1 }), data, {
            onSuccess: () => {
                setIsEditing(false);
                setProcessing(false);
                setLogo(null);
                setFavicon(null);
                setLogoPreview(null);
                setFaviconPreview(null);
                Alert.success('Site mis à jour avec succès');
            },
            onError: (err) => {
                setErrors(err as Record<string, string>);
                setProcessing(false);
                Alert.error('Une erreur est survenue lors de la mise à jour du site');
            },
        });
    };
    
    const handleCancel = () => {
        setIsEditing(false);
        setFormData({
            siteName: site?.siteName || '',
            siteTagline: site?.siteTagline || '',
            contactEmail: site?.contactEmail || '',
            contactPhone: site?.contactPhone || '',
            address: site?.address || '',
            description: site?.description || '',
            socialLinks: site?.socialLinks || {
                facebook: '',
                twitter: '',
                linkedin: '',
            },
        });
        setLogo(null);
        setFavicon(null);
        setLogoPreview(null);
        setFaviconPreview(null);
        setErrors({});
    };

    return (
        <Dashboard>
            <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8 bg-gradient-to-br from-gray-50 to-slate-100 min-h-screen">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 pb-4 border-b-2 border-gray-200">
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-500 mb-4 sm:mb-0">
                        Paramètres du Site
                    </h1>
                </div>

                <form onSubmit={handleSubmit} className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 shadow-lg border border-gray-100">
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
                                        <label htmlFor="siteName" className="block text-sm font-medium text-gray-500">Nom du site</label>
                                        {isEditing ? (
                                            <>
                                                <input 
                                                    type="text" 
                                                    id="siteName" 
                                                    value={formData.siteName} 
                                                    onChange={e => setFormData({ ...formData, siteName: e.target.value })} 
                                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" 
                                                />
                                                {errors.siteName && <p className="text-red-500 text-xs mt-1">{errors.siteName}</p>}
                                            </>
                                        ) : (
                                            <p className="mt-1 text-lg font-semibold text-gray-900">{formData.siteName || 'Non défini'}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label htmlFor="siteTagline" className="block text-sm font-medium text-gray-500">Slogan</label>
                                        {isEditing ? (
                                            <input 
                                                type="text" 
                                                id="siteTagline" 
                                                value={formData.siteTagline} 
                                                onChange={e => setFormData({ ...formData, siteTagline: e.target.value })} 
                                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" 
                                            />
                                        ) : (
                                            <p className="mt-1 text-gray-700">{formData.siteTagline || 'Non défini'}</p>
                                        )}
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
                                        <div className="flex-1">
                                            <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-500">Email</label>
                                            {isEditing ? (
                                                <>
                                                    <input 
                                                        type="email" 
                                                        id="contactEmail" 
                                                        value={formData.contactEmail} 
                                                        onChange={e => setFormData({ ...formData, contactEmail: e.target.value })} 
                                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" 
                                                    />
                                                    {errors.contactEmail && <p className="text-red-500 text-xs mt-1">{errors.contactEmail}</p>}
                                                </>
                                            ) : (
                                                <a href={`mailto:${formData.contactEmail}`} className="mt-1 text-blue-600 hover:underline">{formData.contactEmail || 'Non défini'}</a>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <Phone className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                                        <div className="flex-1">
                                            <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-500">Téléphone</label>
                                            {isEditing ? (
                                                <input 
                                                    type="tel" 
                                                    id="contactPhone" 
                                                    value={formData.contactPhone} 
                                                    onChange={e => setFormData({ ...formData, contactPhone: e.target.value })} 
                                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" 
                                                />
                                            ) : (
                                                <a href={`tel:${formData.contactPhone}`} className="mt-1 text-blue-600 hover:underline">{formData.contactPhone || 'Non défini'}</a>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <MapPin className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                                        <div className="flex-1">
                                            <label htmlFor="address" className="block text-sm font-medium text-gray-500">Adresse</label>
                                            {isEditing ? (
                                                <textarea 
                                                    id="address" 
                                                    rows={3} 
                                                    value={formData.address} 
                                                    onChange={e => setFormData({ ...formData, address: e.target.value })} 
                                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" 
                                                />
                                            ) : (
                                                <p className="mt-1 text-gray-700">{formData.address || 'Non défini'}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <Globe className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                                        <div className="flex-1">
                                            <label htmlFor="description" className="block text-sm font-medium text-gray-500">Description</label>
                                            {isEditing ? (
                                                <textarea 
                                                    id="description" 
                                                    rows={4} 
                                                    value={formData.description || ''} 
                                                    onChange={e => setFormData({ ...formData, description: e.target.value })} 
                                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" 
                                                    placeholder="Description du site..."
                                                />
                                            ) : (
                                                <p className="mt-1 text-gray-700">{formData.description || 'Non défini'}</p>
                                            )}
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
                                        <label htmlFor="logo" className="block text-sm font-medium text-gray-500">Logo du site</label>
                                        {isEditing ? (
                                            <div className="mt-1">
                                                <input 
                                                    type="file" 
                                                    id="logo" 
                                                    name="logo" 
                                                    onChange={e => handleFileChange('logo', e)} 
                                                    className="hidden" 
                                                    accept="image/*" 
                                                />
                                                <label htmlFor="logo" className="cursor-pointer flex items-center justify-center w-full h-24 px-4 transition bg-white border-2 border-gray-300 border-dashed rounded-md appearance-none hover:border-blue-400 focus:outline-none">
                                                    {logoPreview ? (
                                                        <img src={logoPreview} alt="Aperçu du logo" className="h-full object-contain" />
                                                    ) : site?.logoUrl ? (
                                                        <img src={`/storage/${site.logoUrl}`} alt="Logo actuel" className="h-full object-contain" />
                                                    ) : (
                                                        <div className="flex flex-col items-center space-y-1 text-gray-500">
                                                            <Upload className="w-6 h-6" />
                                                            <span className="text-xs">Cliquez pour téléverser</span>
                                                        </div>
                                                    )}
                                                </label>
                                                {errors.logo && <p className="text-red-500 text-xs mt-1">{errors.logo}</p>}
                                            </div>
                                        ) : (
                                            <div className="mt-2 p-2 border border-gray-200 rounded-lg bg-gray-50 flex items-center justify-center h-20">
                                                {site?.logoUrl ? (
                                                    <img src={`/storage/${site.logoUrl}`} alt="Logo du site" className="max-h-full max-w-full object-contain" />
                                                ) : (
                                                    <p className="text-gray-700 text-sm">Aucun logo</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <label htmlFor="favicon" className="block text-sm font-medium text-gray-500">Favicon du site</label>
                                        {isEditing ? (
                                            <div className="mt-1">
                                                <input 
                                                    type="file" 
                                                    id="favicon" 
                                                    name="favicon" 
                                                    onChange={e => handleFileChange('favicon', e)} 
                                                    className="hidden" 
                                                    accept="image/*" 
                                                />
                                                <label htmlFor="favicon" className="cursor-pointer flex items-center justify-center w-full h-16 px-4 transition bg-white border-2 border-gray-300 border-dashed rounded-md appearance-none hover:border-blue-400 focus:outline-none">
                                                    {faviconPreview ? (
                                                        <img src={faviconPreview} alt="Aperçu du favicon" className="h-full object-contain" />
                                                    ) : site?.faviconUrl ? (
                                                        <img src={`/storage/${site.faviconUrl}`} alt="Favicon actuel" className="h-full object-contain" />
                                                    ) : (
                                                        <div className="flex flex-col items-center space-y-1 text-gray-500">
                                                            <Upload className="w-5 h-5" />
                                                            <span className="text-xs">Cliquez pour téléverser</span>
                                                        </div>
                                                    )}
                                                </label>
                                                {errors.favicon && <p className="text-red-500 text-xs mt-1">{errors.favicon}</p>}
                                            </div>
                                        ) : (
                                            <div className="mt-2 p-2 border border-gray-200 rounded-lg bg-gray-50 flex items-center justify-center h-16">
                                                {site?.faviconUrl ? (
                                                    <img src={`/storage/${site.faviconUrl}`} alt="Favicon du site" className="max-h-full max-w-full object-contain" />
                                                ) : (
                                                    <p className="text-gray-700 text-sm">Aucun favicon</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="border-t pt-6">
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">Réseaux Sociaux</h2>
                                <div className="space-y-3">
                                    {isEditing ? (
                                        <>
                                            <div>
                                                <label className="block text-xs text-gray-500 mb-1">Facebook</label>
                                                <input 
                                                    type="url" 
                                                    value={formData.socialLinks.facebook} 
                                                    onChange={e => setFormData({ ...formData, socialLinks: { ...formData.socialLinks, facebook: e.target.value } })} 
                                                    placeholder="URL Facebook" 
                                                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" 
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-gray-500 mb-1">Twitter</label>
                                                <input 
                                                    type="url" 
                                                    value={formData.socialLinks.twitter} 
                                                    onChange={e => setFormData({ ...formData, socialLinks: { ...formData.socialLinks, twitter: e.target.value } })} 
                                                    placeholder="URL Twitter" 
                                                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" 
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-gray-500 mb-1">LinkedIn</label>
                                                <input 
                                                    type="url" 
                                                    value={formData.socialLinks.linkedin} 
                                                    onChange={e => setFormData({ ...formData, socialLinks: { ...formData.socialLinks, linkedin: e.target.value } })} 
                                                    placeholder="URL LinkedIn" 
                                                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" 
                                                />
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            {formData.socialLinks.facebook && (
                                                <a href={formData.socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-gray-600 hover:text-blue-600 transition-colors">
                                                    <Facebook className="w-5 h-5" />
                                                    <span>Facebook</span>
                                                </a>
                                            )}
                                            {formData.socialLinks.twitter && (
                                                <a href={formData.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-gray-600 hover:text-cyan-500 transition-colors">
                                                    <Twitter className="w-5 h-5" />
                                                    <span>Twitter</span>
                                                </a>
                                            )}
                                            {formData.socialLinks.linkedin && (
                                                <a href={formData.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-gray-600 hover:text-blue-700 transition-colors">
                                                    <Linkedin className="w-5 h-5" />
                                                    <span>LinkedIn</span>
                                                </a>
                                            )}
                                            {!formData.socialLinks.facebook && !formData.socialLinks.twitter && !formData.socialLinks.linkedin && (
                                                <p className="text-gray-700 text-sm">Aucun réseau social configuré</p>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Pied de page avec les boutons d'action */}
                    <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end gap-3">
                        {isEditing ? (
                            <>
                                <button 
                                    type="button" 
                                    onClick={handleCancel} 
                                    className="px-4 sm:px-6 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors duration-300 flex items-center gap-2 text-sm sm:text-base"
                                >
                                    <X className="w-4 h-4" /> Annuler
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={processing} 
                                    className="px-4 sm:px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex items-center gap-2 text-sm sm:text-base disabled:opacity-50"
                                >
                                    <Save className="w-4 h-4" /> {processing ? 'Mise à jour...' : 'Mettre à jour'}
                                </button>
                            </>
                        ) : (
                            <button 
                                type="button" 
                                onClick={() => setIsEditing(true)} 
                                className="px-6 sm:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 text-sm sm:text-base"
                            >
                                Modifier les paramètres
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </Dashboard>
    );
}