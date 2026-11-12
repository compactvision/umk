import { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';

export default function Contact() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        message: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const { site } = usePage<{ site?: { contactPhone?: string; contactEmail?: string; address?: string } }>().props;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        // Simuler l'envoi du formulaire
        setTimeout(() => {
            setIsSubmitting(false);
            setIsSubmitted(true);
            // Réinitialiser le formulaire après 3 secondes
            setTimeout(() => {
                setIsSubmitted(false);
                setFormData({
                    name: '',
                    email: '',
                    phone: '',
                    message: ''
                });
            }, 3000);
        }, 1500);
    };

    return (
        <section className="relative bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-20 lg:py-32 overflow-hidden">
            {/* Éléments décoratifs de fond */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
            </div>

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* En-tête de section */}
                <div className="text-center mb-16">
                    <span className="inline-block rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 px-4 py-2 text-sm font-semibold text-white shadow-lg">
                        Contact
                    </span>
                    <h2 className="mt-6 text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-amber-400 via-yellow-500 to-yellow-500 bg-clip-text text-transparent">
                        Entrons en contact
                    </h2>
                    <div className="mt-4 mx-auto h-1 w-24 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full"></div>
                    <p className="mt-6 max-w-2xl mx-auto text-lg text-gray-600">
                        Nous sommes là pour répondre à toutes vos questions et vous accompagner dans votre parcours académique.
                    </p>
                </div>

                <div className="grid lg:grid-cols-2 gap-12 items-start">
                    {/* Formulaire de contact */}
                    <div className="bg-white rounded-3xl shadow-2xl p-8 lg:p-10 transform transition-all duration-500 hover:shadow-3xl">
                        <h3 className="text-2xl font-bold text-gray-900 mb-4">
                            Envoyez-nous un message
                            <span className="ml-2 inline-block transform transition-transform duration-300 hover:scale-125">👋</span>
                        </h3>
                        <p className="text-gray-600 mb-8">
                            Laissez-nous l'opportunité de vous accompagner et d'apporter une touche d'excellence à votre projet.
                        </p>

                        {isSubmitted ? (
                            <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                    </svg>
                                </div>
                                <h4 className="text-xl font-semibold text-green-800 mb-2">Message envoyé avec succès!</h4>
                                <p className="text-green-600">Nous vous répondrons dans les plus brefs délais.</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <label htmlFor="input_name" className="block text-sm font-medium text-gray-700 mb-2">
                                            Nom complet
                                        </label>
                                        <input
                                            id="input_name"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200"
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            placeholder="Jean Dupont"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="input_email" className="block text-sm font-medium text-gray-700 mb-2">
                                            Votre email
                                        </label>
                                        <input
                                            id="input_email"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200"
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            placeholder="contact@example.com"
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="input_phone" className="block text-sm font-medium text-gray-700 mb-2">
                                        Téléphone
                                    </label>
                                    <input
                                        id="input_phone"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200"
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        placeholder="+243 810 23 45 67"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="input_textarea" className="block text-sm font-medium text-gray-700 mb-2">
                                        Votre message
                                    </label>
                                    <textarea
                                        id="input_textarea"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200"
                                        name="message"
                                        value={formData.message}
                                        onChange={handleChange}
                                        placeholder="Comment pouvons-nous vous aider ?"
                                        rows={5}
                                        required
                                    ></textarea>
                                </div>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full bg-gradient-to-r from-amber-400 to-yellow-500 text-white font-semibold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transform transition-all duration-300 hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? (
                                        <span className="flex items-center justify-center">
                                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Envoi en cours...
                                        </span>
                                    ) : (
                                        <span className="flex items-center justify-center">
                                            Envoyer le message
                                            <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                                            </svg>
                                        </span>
                                    )}
                                </button>
                            </form>
                        )}
                    </div>

                    {/* Carte et informations */}
                    <div className="space-y-8">
                        {/* Carte Google Maps */}
                        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden transform transition-all duration-500 hover:shadow-3xl">
                            <div className="h-96 lg:h-full min-h-[400px]">
                                <iframe
                                    src="https://maps.google.com/maps?q=Universit%C3%A9%20Simon%20Kimbangu%20Kalamu%20Kinshasa&output=embed"
                                    title="Localisation USK sur Google Maps"
                                    className="w-full h-full border-0"
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                ></iframe>
                            </div>
                        </div>

                        {/* Informations de contact */}
                        <div className="bg-white rounded-3xl shadow-2xl p-8 transform transition-all duration-500 hover:shadow-3xl">
                            <h3 className="text-2xl font-bold text-gray-900 mb-6">Informations de contact</h3>
                            <div className="grid sm:grid-cols-2 gap-6">
                                <div className="flex items-start space-x-4 group">
                                    <div className="flex-shrink-0 w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center group-hover:bg-indigo-200 transition-colors duration-300">
                                        <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                                        </svg>
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-semibold text-gray-900">Appelez-nous</h4>
                                        <p className="text-gray-600 text-sm">Du lundi au vendredi de 9h à 18h</p>
                                        <p className="text-yellow-600 font-medium">{site?.contactPhone}</p>
                                    </div>
                                </div>
                                <div className="flex items-start space-x-4 group">
                                    <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center group-hover:bg-purple-200 transition-colors duration-300">
                                        <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                                        </svg>
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-semibold text-gray-900">Écrivez-nous</h4>
                                        <p className="text-gray-600 text-sm">Notre équipe est à votre écoute</p>
                                        <p className="text-yellow-600 font-medium">{site?.contactEmail}</p>
                                    </div>
                                </div>
                                <div className="flex items-start space-x-4 group sm:col-span-2">
                                    <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center group-hover:bg-green-200 transition-colors duration-300">
                                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                        </svg>
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-semibold text-gray-900">Notre campus</h4>
                                        <p className="text-gray-600 text-sm">Venez visiter l'université USK</p>
                                        <p className="text-green-600 font-medium">{site?.address}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section FAQ ou autres informations */}
                <div className="mt-20 text-center">
                    <h3 className="text-2xl font-bold text-gray-900 mb-8">Questions fréquentes</h3>
                    <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                        <div className="bg-white rounded-xl p-6 shadow-lg transform transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                                </svg>
                            </div>
                            <h4 className="text-lg font-semibold text-gray-900 mb-2">Programmes d'études</h4>
                            <p className="text-gray-600">Découvrez notre catalogue de formations et trouvez celle qui vous correspond.</p>
                            <Link href="/courses" className="mt-4 inline-flex items-center text-yellow-600 font-medium hover:text-yellow-700">
                                En savoir plus
                                <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                                </svg>
                            </Link>
                        </div>
                        <div className="bg-white rounded-xl p-6 shadow-lg transform transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                            </div>
                            <h4 className="text-lg font-semibold text-gray-900 mb-2">Frais de scolarité</h4>
                            <p className="text-gray-600">Informations sur les coûts et les options de financement disponibles.</p>
                            <Link href="/tuitions" className="mt-4 inline-flex items-center text-yellow-600 font-medium hover:text-yellow-700">
                                En savoir plus
                                <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                                </svg>
                            </Link>
                        </div>
                        <div className="bg-white rounded-xl p-6 shadow-lg transform transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                            </div>
                            <h4 className="text-lg font-semibold text-gray-900 mb-2">Processus d'admission</h4>
                            <p className="text-gray-600">Guide complet pour postuler et rejoindre notre communauté universitaire.</p>
                            <Link href="/admission" className="mt-4 inline-flex items-center text-green-600 font-medium hover:text-green-700">
                                En savoir plus
                                <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                                </svg>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Styles pour les animations de blob */}
            <style>{`
                @keyframes blob {
                    0% {
                        transform: translate(0px, 0px) scale(1);
                    }
                    33% {
                        transform: translate(30px, -50px) scale(1.1);
                    }
                    66% {
                        transform: translate(-20px, 20px) scale(0.9);
                    }
                    100% {
                        transform: translate(0px, 0px) scale(1);
                    }
                }
                .animate-blob {
                    animation: blob 7s infinite;
                }
                .animation-delay-2000 {
                    animation-delay: 2s;
                }
                .animation-delay-4000 {
                    animation-delay: 4s;
                }
            `}</style>
        </section>
    );
}