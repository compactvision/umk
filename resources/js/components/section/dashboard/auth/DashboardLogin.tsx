import { Link, router, useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import Alert from '@/utils/sweetAlert';

const DashboardLogin = () => {
    const { data, setData, post, processing, errors: formErrors } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const [focusedField, setFocusedField] = useState<string | null>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        Alert.loading('Connexion en cours...');

        post(route('login'), {
            onSuccess: () => {
                Alert.success('Connexion réussie !');
            },
            onError: () => {
                Alert.error('Une erreur est survenue lors de la connexion.');
            },
        });

    };

    const handleSocialLogin = (provider: string) => {
        router.get(route('auth.' + provider + '.redirect'));
    };

    const getButtonText = () => {
        switch (processing) {
            case true:
                return (
                    <>
                        <span className="inline-block animate-spin mr-2">⟳</span>
                        Connexion en cours...
                    </>
                );
            default:
                return 'Se connecter';
        }
    };

    return (
        <div className="usk-auth-form w-full flex items-center justify-center font-sans">
            <div className="usk-auth-panel w-full min-w-0">
                {/* Logo */}
                <div className="flex justify-center mb-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 rounded-2xl flex items-center justify-center font-bold text-white text-3xl transition-all duration-500 hover:scale-110 hover:rotate-6">
                        <img src="/assets/usk/logo.png" alt="Université Simon Kimbangu" className="h-full w-full object-contain p-1" />
                    </div>
                </div>

                {/* Titre */}
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800 mb-1">Bienvenue</h1>
                    <p className="text-gray-600">Connectez-vous à votre espace</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <svg className={`h-6 w-6 transition-colors duration-300 ${focusedField === 'email' ? 'text-emerald-500' : 'text-gray-400'}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                            </svg>
                        </div>
                        <input
                            type="email"
                            name="email"
                            autoComplete="email"
                            value={data.email}
                            onChange={handleInputChange}
                            onFocus={() => setFocusedField('email')}
                            onBlur={() => setFocusedField(null)}
                            className={`w-full pl-12 pr-4 py-3.5 bg-transparent transition-all duration-300 outline-none text-gray-700 placeholder-gray-400
                                ${focusedField === 'email'
                                    ? 'border-b-2 border-emerald-500'
                                    : 'border-b border-gray-300'
                                }`}
                            placeholder="Adresse email"
                            required
                        />
                        {formErrors.email && <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>}
                    </div>

                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <svg className={`h-6 w-6 transition-colors duration-300 ${focusedField === 'password' ? 'text-emerald-500' : 'text-gray-400'}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <input
                            type="password"
                            name="password"
                            autoComplete="current-password"
                            value={data.password}
                            onChange={handleInputChange}
                            onFocus={() => setFocusedField('password')}
                            onBlur={() => setFocusedField(null)}
                            className={`w-full pl-12 pr-4 py-3.5 bg-transparent transition-all duration-300 outline-none text-gray-700 placeholder-gray-400
                                ${focusedField === 'password'
                                    ? 'border-b-2 border-emerald-500'
                                    : 'border-b border-gray-300'
                                }`}
                            placeholder="Mot de passe"
                            required
                        />
                        {formErrors.password && <p className="text-red-500 text-sm mt-1">{formErrors.password}</p>}
                    </div>

                    <div className="flex flex-wrap justify-between items-center gap-x-4 gap-y-3 py-2">
                        <label className="flex items-center gap-3 text-gray-600 cursor-pointer">
                            <input
                                type="checkbox"
                                name="remember"
                                checked={data.remember}
                                onChange={handleInputChange}
                                className="w-5 h-5 text-emerald-600 bg-transparent border-gray-300 rounded focus:ring-emerald-500"
                            />
                            Se souvenir
                        </label>
                        <Link href={route('password.request')} className="text-emerald-600 hover:text-emerald-800 transition-colors duration-200">
                            Mot de passe oublié ?
                        </Link>
                    </div>

                    <button
                        type="submit"
                        className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium rounded-lg transition-all duration-300 hover:from-emerald-600 hover:to-teal-700 text-base"
                        disabled={processing}
                    >
                        {getButtonText()}
                    </button>
                </form>

                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="usk-auth-divider px-4 text-gray-500">ou</span>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4">
                    <button className="flex items-center justify-center py-3 text-gray-700 hover:text-gray-900 transition-colors duration-200" onClick={() => handleSocialLogin('Google')}>
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                    </button>
                    <button className="flex items-center justify-center py-3 text-gray-700 hover:text-gray-900 transition-colors duration-200" onClick={() => handleSocialLogin('Facebook')}>
                        <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                    </button>
                    <button className="flex items-center justify-center py-3 text-gray-700 hover:text-gray-900 transition-colors duration-200" onClick={() => handleSocialLogin('Twitter')}>
                        <svg className="w-5 h-5" fill="#1DA1F2" viewBox="0 0 24 24">
                            <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                        </svg>
                    </button>
                </div>

                <div className="text-center text-gray-600">
                    Pas encore de compte ?{' '}
                    <Link href={route('register')} className="text-emerald-600 font-medium hover:text-emerald-800 transition-colors duration-200">
                        Créer un compte
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default DashboardLogin;
