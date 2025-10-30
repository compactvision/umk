import { Link } from '@inertiajs/react';
import { useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import Alert from '@/utils/sweetAlert';

const DashboardSignup = () => {
    const { data, setData, errors: formErrors, post, processing } = useForm({
        last_name: '',
        first_name: '',
        post_name: '',
        email: '',
        password: '',
        password_confirmation: '',
        gender: '',
    });

    const [focusedField, setFocusedField] = useState<string | null>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        setData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        Alert.loading('Inscription en cours...');

        post(route('register'), {
            onSuccess: () => {
                Alert.success('Inscription réussie !');
            },
            onError: () => {
                Alert.error('Une erreur est survenue lors de l\'inscription.');
            },
        });
    };

    const handleSocialLogin = (provider: string) => {
        console.log(`Connexion avec ${provider}`);
    };

    const getButtonText = () => {
        return processing ? (
            <>
                <span className="inline-block animate-spin mr-2">⟳</span>
                Inscription en cours...
            </>
        ) : "S'inscrire";
    };

    return (
        <div className="w-full flex items-center justify-center font-sans bg-gradient-to-br from-slate-50 to-gray-100 overflow-hidden">
            <div className="w-full max-w-md px-6">
                {/* Logo */}
                <div className="flex justify-center mb-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center font-bold text-white text-3xl transition-all duration-500 hover:scale-110 hover:rotate-6">
                        D
                    </div>
                </div>
                
                {/* Titre */}
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800 mb-1">Créer un compte</h1>
                    <p className="text-gray-600">Rejoignez notre plateforme</p>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Champs de nom en grille */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <svg className={`h-5 w-5 transition-colors duration-300 ${focusedField === 'last_name' ? 'text-indigo-500' : 'text-gray-400'}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                name="last_name"
                                value={data.last_name}
                                onChange={handleInputChange}
                                onFocus={() => setFocusedField('last_name')}
                                onBlur={() => setFocusedField(null)}
                                className={`w-full pl-11 pr-3 py-3 bg-transparent transition-all duration-300 outline-none text-gray-700 placeholder-gray-400
                                    ${focusedField === 'last_name' 
                                        ? 'border-b-2 border-indigo-500' 
                                        : 'border-b border-gray-300'
                                    }`}
                                placeholder="Nom"
                                required
                            />
                            {formErrors.last_name && <p className="text-red-500 text-sm mt-1">{formErrors.last_name}</p>}
                        </div>

                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <svg className={`h-5 w-5 transition-colors duration-300 ${focusedField === 'first_name' ? 'text-indigo-500' : 'text-gray-400'}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                name="first_name"
                                value={data.first_name}
                                onChange={handleInputChange}
                                onFocus={() => setFocusedField('first_name')}
                                onBlur={() => setFocusedField(null)}
                                className={`w-full pl-11 pr-3 py-3 bg-transparent transition-all duration-300 outline-none text-gray-700 placeholder-gray-400
                                    ${focusedField === 'first_name' 
                                        ? 'border-b-2 border-indigo-500' 
                                        : 'border-b border-gray-300'
                                    }`}
                                placeholder="Prénom"
                                required
                            />
                            {formErrors.first_name && <p className="text-red-500 text-sm mt-1">{formErrors.first_name}</p>}
                        </div>
                    </div>

                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <svg className={`h-5 w-5 transition-colors duration-300 ${focusedField === 'post_name' ? 'text-indigo-500' : 'text-gray-400'}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            name="post_name"
                            value={data.post_name}
                            onChange={handleInputChange}
                            onFocus={() => setFocusedField('post_name')}
                            onBlur={() => setFocusedField(null)}
                            className={`w-full pl-11 pr-4 py-3 bg-transparent transition-all duration-300 outline-none text-gray-700 placeholder-gray-400
                                ${focusedField === 'post_name' 
                                    ? 'border-b-2 border-indigo-500' 
                                    : 'border-b border-gray-300'
                                }`}
                            placeholder="Postnom"
                        />
                        {formErrors.post_name && <p className="text-red-500 text-sm mt-1">{formErrors.post_name}</p>}
                    </div>

                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <svg className={`h-5 w-5 transition-colors duration-300 ${focusedField === 'gender' ? 'text-indigo-500' : 'text-gray-400'}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                            </svg>
                        </div>
                        <select
                            name="gender"
                            value={data.gender}
                            onChange={handleSelectChange}
                            className={`w-full pl-11 pr-4 py-3 bg-transparent transition-all duration-300 outline-none text-gray-700 appearance-none
                                ${focusedField === 'gender' 
                                    ? 'border-b-2 border-indigo-500' 
                                    : 'border-b border-gray-300'
                                }`}
                            onFocus={() => setFocusedField('gender')}
                            onBlur={() => setFocusedField(null)}
                        >
                            <option value="" className="bg-white">Genre</option>
                            <option value="male" className="bg-white">Masculin</option>
                            <option value="female" className="bg-white">Féminin</option>
                            <option value="other" className="bg-white">Autre</option>
                        </select>
                        {formErrors.gender && <p className="text-red-500 text-sm mt-1">{formErrors.gender}</p>}
                    </div>

                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <svg className={`h-5 w-5 transition-colors duration-300 ${focusedField === 'email' ? 'text-indigo-500' : 'text-gray-400'}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                            </svg>
                        </div>
                        <input
                            type="email"
                            name="email"
                            value={data.email}
                            onChange={handleInputChange}
                            onFocus={() => setFocusedField('email')}
                            onBlur={() => setFocusedField(null)}
                            className={`w-full pl-11 pr-4 py-3 bg-transparent transition-all duration-300 outline-none text-gray-700 placeholder-gray-400
                                ${focusedField === 'email' 
                                    ? 'border-b-2 border-indigo-500' 
                                    : 'border-b border-gray-300'
                                }`}
                            placeholder="Adresse email"
                            required
                        />
                        {formErrors.email && <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>}
                    </div>

                    {/* Champs de mot de passe en grille */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <svg className={`h-5 w-5 transition-colors duration-300 ${focusedField === 'password' ? 'text-indigo-500' : 'text-gray-400'}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                            <input
                                type="password"
                                name="password"
                                value={data.password}
                                onChange={handleInputChange}
                                onFocus={() => setFocusedField('password')}
                                onBlur={() => setFocusedField(null)}
                                className={`w-full pl-11 pr-3 py-3 bg-transparent transition-all duration-300 outline-none text-gray-700 placeholder-gray-400
                                    ${focusedField === 'password' 
                                        ? 'border-b-2 border-indigo-500' 
                                        : 'border-b border-gray-300'
                                    }`}
                                placeholder="Mot de passe"
                                required
                            />
                            {formErrors.password && <p className="text-red-500 text-sm mt-1">{formErrors.password}</p>}
                        </div>

                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <svg className={`h-5 w-5 transition-colors duration-300 ${focusedField === 'password_confirmation' ? 'text-indigo-500' : 'text-gray-400'}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            </div>
                            <input
                                type="password"
                                name="password_confirmation"
                                value={data.password_confirmation}
                                onChange={handleInputChange}
                                onFocus={() => setFocusedField('password_confirmation')}
                                onBlur={() => setFocusedField(null)}
                                className={`w-full pl-11 pr-3 py-3 bg-transparent transition-all duration-300 outline-none text-gray-700 placeholder-gray-400
                                    ${focusedField === 'password_confirmation' 
                                        ? 'border-b-2 border-indigo-500' 
                                        : 'border-b border-gray-300'
                                    }`}
                                placeholder="Confirmation"
                                required
                            />
                            {formErrors.password_confirmation && <p className="text-red-500 text-sm mt-1">{formErrors.password_confirmation}</p>}
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        className="w-full py-3.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-lg transition-all duration-300 hover:from-indigo-600 hover:to-purple-700 text-base mt-3" 
                        disabled={processing}
                    >
                        {getButtonText()}
                    </button>
                </form>

                <div className="relative my-5">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-4 bg-gradient-to-br from-slate-50 to-gray-100 text-gray-500">ou</span>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4">
                    <button className="flex items-center justify-center py-3 text-sm text-gray-700 hover:text-gray-900 transition-colors duration-200" onClick={() => handleSocialLogin('Google')}>
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                    </button>
                    <button className="flex items-center justify-center py-3 text-sm text-gray-700 hover:text-gray-900 transition-colors duration-200" onClick={() => handleSocialLogin('Facebook')}>
                        <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                    </button>
                    <button className="flex items-center justify-center py-3 text-sm text-gray-700 hover:text-gray-900 transition-colors duration-200" onClick={() => handleSocialLogin('Twitter')}>
                        <svg className="w-5 h-5" fill="#1DA1F2" viewBox="0 0 24 24">
                            <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                        </svg>
                    </button>
                </div>

                <div className="text-center text-gray-600">
                    Déjà un compte ?{' '}
                    <Link href={route('login')} className="text-indigo-600 font-medium hover:text-indigo-800 transition-colors duration-200">
                        Se connecter
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default DashboardSignup;