import Dashboard from '@/components/layouts/Dashboard/Dashboard';
import React, { useState, useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import Alert from '@/utils/sweetAlert';

export default function ResetPassword({ token, email }: { token?: string; email?: string }) {
    const { data, setData, post, processing, errors } = useForm({
        token,
        email: email || '',
        password: '',
        password_confirmation: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const newErrors: typeof errors = {};
        if (!data.email) newErrors.email = 'Email requis';
        if (!data.password) newErrors.password = 'Mot de passe requis';
        if (data.password !== data.password_confirmation) {
            newErrors.password_confirmation = 'Les mots de passe ne correspondent pas';
        }

        post(route('password.update'), {
            onSuccess: () => {
                Alert.success('Mot de passe réinitialisé avec succès!');
            },
            onError: () => {
                Alert.error('Une erreur est survenue lors de la réinitialisation de votre mot de passe.');
            },
        });
    };

    const [focused, setFocused] = useState<string | null>(null);
    const [passwordStrength, setPasswordStrength] = useState(0);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const calculatePasswordStrength = (password: string) => {
        let strength = 0;
        if (password.length >= 8) strength += 1;
        if (/[a-z]/.test(password)) strength += 1;
        if (/[A-Z]/.test(password)) strength += 1;
        if (/[0-9]/.test(password)) strength += 1;
        if (/[^A-Za-z0-9]/.test(password)) strength += 1;
        return strength;
    };

    useEffect(() => {
        setPasswordStrength(calculatePasswordStrength(data.password));
    }, [data.password]);

    const getPasswordStrengthColor = () => {
        switch (passwordStrength) {
            case 0:
            case 1: return 'bg-red-500';
            case 2: return 'bg-orange-500';
            case 3: return 'bg-yellow-500';
            case 4: return 'bg-green-500';
            case 5: return 'bg-green-600';
            default: return 'bg-gray-200';
        }
    };

    const getPasswordStrengthTextColor = () => {
        switch (passwordStrength) {
            case 0:
            case 1: return 'text-red-500';
            case 2: return 'text-orange-500';
            case 3: return 'text-yellow-500';
            case 4: return 'text-green-500';
            case 5: return 'text-green-600';
            default: return 'text-gray-200';
        }
    };

    const getPasswordStrengthText = () => {
        switch (passwordStrength) {
            case 0:
            case 1: return 'Très faible';
            case 2: return 'Faible';
            case 3: return 'Moyen';
            case 4: return 'Fort';
            case 5: return 'Très fort';
            default: return '';
        }
    };

    return (
        <Dashboard>
            <div className="flex items-center justify-center p-5 font-sans relative overflow-hidden">
                {/* Fond animé */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 animate-pulse"></div>
                
                <div className="bg-white/98 backdrop-blur-xl rounded-3xl p-12 w-full max-w-md shadow-2xl border border-white/20 relative z-10 animate-slide-up">
                    <div className="text-center mb-10">
                        <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-500 via-purple-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/40 animate-pulse relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent animate-spin-slow"></div>
                            <span className="text-3xl relative z-10">🔐</span>
                        </div>
                        <h1 className="text-3xl font-extrabold mb-3 tracking-tight bg-gradient-to-br from-slate-900 to-slate-700 bg-clip-text text-transparent">
                            Nouveau mot de passe
                        </h1>
                        <p className="text-gray-500 text-base leading-relaxed">
                            Créez un mot de passe sécurisé pour protéger votre compte
                        </p>
                    </div>

                    <div className="space-y-7">
                        <div className="relative">
                            <div className="relative flex items-center">
                                <input
                                    type="email"
                                    name="email"
                                    value={data.email}
                                    onChange={(e) => setData({ ...data, email: e.target.value })}
                                    className="w-full h-16 px-6 pl-16 border-2 border-gray-200 rounded-2xl text-base bg-gray-50 transition-all duration-300 outline-none text-slate-900 font-medium focus:border-blue-500 focus:bg-white focus:shadow-lg focus:shadow-blue-500/10 focus:-translate-y-1"
                                    placeholder="votre.email@exemple.com"
                                    required
                                    onFocus={() => setFocused('email')}
                                    onBlur={() => setFocused(null)}
                                    readOnly
                                />
                                <div className="absolute left-6 text-xl text-gray-400 transition-all duration-300 z-10">
                                    📧
                                </div>
                            </div>
                            {errors.email && (
                                <div className="mt-2.5 text-sm text-red-500 font-medium flex items-center gap-2 bg-red-50 p-2 rounded-lg border-l-3 border-red-500 animate-error-bounce">
                                    <span>❌</span>
                                    {errors.email}
                                </div>
                            )}
                        </div>

                        <div className="relative">
                            <div className="relative flex items-center">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    value={data.password}
                                    onChange={(e) => setData({ ...data, password: e.target.value })}
                                    className="w-full h-16 px-6 pl-16 pr-16 border-2 border-gray-200 rounded-2xl text-base bg-gray-50 transition-all duration-300 outline-none text-slate-900 font-medium focus:border-blue-500 focus:bg-white focus:shadow-lg focus:shadow-blue-500/10 focus:-translate-y-1"
                                    placeholder="Nouveau mot de passe"
                                    required
                                    onFocus={() => setFocused('password')}
                                    onBlur={() => setFocused(null)}
                                />
                                <div className={`absolute left-6 text-xl transition-all duration-300 z-10 ${focused === 'password' ? 'text-blue-500 scale-110' : 'text-gray-400'}`}>
                                    🔑
                                </div>
                                <button
                                    type="button"
                                    className="absolute right-5 text-lg text-gray-400 transition-all duration-300 z-20 p-1 rounded-lg hover:text-blue-500 hover:bg-blue-50"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? '🙈' : '👁️'}
                                </button>
                            </div>
                            {data.password && (
                                <div className="mt-3 flex gap-1 items-center">
                                    {[1, 2, 3, 4, 5].map((level) => (
                                        <div
                                            key={level}
                                            className={`h-1 flex-1 rounded-full transition-all duration-300 ${level <= passwordStrength ? getPasswordStrengthColor() : 'bg-gray-200'}`}
                                        />
                                    ))}
                                    <div className={`text-xs font-semibold ml-2 min-w-[70px] ${getPasswordStrengthTextColor()}`}>
                                        {getPasswordStrengthText()}
                                    </div>
                                </div>
                            )}
                            {errors.password && (
                                <div className="mt-2.5 text-sm text-red-500 font-medium flex items-center gap-2 bg-red-50 p-2 rounded-lg border-l-3 border-red-500 animate-error-bounce">
                                    <span>❌</span>
                                    {errors.password}
                                </div>
                            )}
                        </div>

                        <div className="relative">
                            <div className="relative flex items-center">
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    name="password_confirmation"
                                    value={data.password_confirmation}
                                    onChange={(e) => setData({ ...data, password_confirmation: e.target.value })}
                                    className="w-full h-16 px-6 pl-16 pr-16 border-2 border-gray-200 rounded-2xl text-base bg-gray-50 transition-all duration-300 outline-none text-slate-900 font-medium focus:border-blue-500 focus:bg-white focus:shadow-lg focus:shadow-blue-500/10 focus:-translate-y-1"
                                    placeholder="Confirmer le nouveau mot de passe"
                                    required
                                    onFocus={() => setFocused('confirm')}
                                    onBlur={() => setFocused(null)}
                                />
                                <div className={`absolute left-6 text-xl transition-all duration-300 z-10 ${focused === 'confirm' ? 'text-blue-500 scale-110' : 'text-gray-400'}`}>
                                    🔐
                                </div>
                                <button
                                    type="button"
                                    className="absolute right-5 text-lg text-gray-400 transition-all duration-300 z-20 p-1 rounded-lg hover:text-blue-500 hover:bg-blue-50"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                    {showConfirmPassword ? '🙈' : '👁️'}
                                </button>
                            </div>
                            {errors.password_confirmation && (
                                <div className="mt-2.5 text-sm text-red-500 font-medium flex items-center gap-2 bg-red-50 p-2 rounded-lg border-l-3 border-red-500 animate-error-bounce">
                                    <span>❌</span>
                                    {errors.password_confirmation}
                                </div>
                            )}
                        </div>

                        <button 
                            type="button" 
                            className="h-16 bg-gradient-to-br from-blue-500 via-purple-500 to-cyan-500 text-white rounded-2xl text-base font-bold cursor-pointer transition-all duration-300 shadow-lg shadow-blue-500/40 relative overflow-hidden tracking-wide uppercase text-sm hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/50 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none" 
                            disabled={processing}
                            onClick={handleSubmit}
                        >
                            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full hover:translate-x-full transition-all duration-600"></span>
                            {processing && <div className="inline-block w-5 h-5 border-2 border-white/30 rounded-full border-t-white animate-spin mr-2.5"></div>}
                            {processing ? 'Réinitialisation...' : 'Réinitialiser le mot de passe'}
                        </button>
                    </div>

                    <div className="mt-8 p-5 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-100 text-sm text-green-600 text-center leading-relaxed">
                        <span className="block text-xl mb-2">🔒</span>
                        Votre mot de passe sera chiffré et stocké de manière sécurisée. 
                        Assurez-vous qu'il contient au moins 8 caractères avec des lettres, 
                        chiffres et symboles.
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes slide-up {
                    from {
                        opacity: 0;
                        transform: translateY(40px) scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }
                
                @keyframes error-bounce {
                    0%, 20%, 40%, 60%, 80% { transform: translateX(0); }
                    10%, 30%, 50%, 70%, 90% { transform: translateX(-3px); }
                }
                
                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                
                .animate-slide-up {
                    animation: slide-up 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
                }
                
                .animate-error-bounce {
                    animation: error-bounce 0.6s ease-out;
                }
                
                .animate-spin-slow {
                    animation: spin-slow 3s linear infinite;
                }
                
                @media (prefers-reduced-motion: reduce) {
                    .animate-slide-up,
                    .animate-error-bounce,
                    .animate-spin-slow {
                        animation: none;
                    }
                }
            `}</style>
        </Dashboard>
    );
}