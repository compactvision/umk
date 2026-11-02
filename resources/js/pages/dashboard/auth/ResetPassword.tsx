import Dashboard from '@/components/layouts/Dashboard/Dashboard';
import Alert from '@/utils/sweetAlert';
import { useForm } from '@inertiajs/react';
import { CircleAlert, Eye, EyeOff, KeyRound, LockKeyhole, Mail, ShieldCheck } from 'lucide-react';
import React, { useEffect, useState } from 'react';

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
            case 1:
                return 'bg-red-500';
            case 2:
                return 'bg-orange-500';
            case 3:
                return 'bg-yellow-500';
            case 4:
                return 'bg-green-500';
            case 5:
                return 'bg-green-600';
            default:
                return 'bg-gray-200';
        }
    };

    const getPasswordStrengthTextColor = () => {
        switch (passwordStrength) {
            case 0:
            case 1:
                return 'text-red-500';
            case 2:
                return 'text-orange-500';
            case 3:
                return 'text-yellow-500';
            case 4:
                return 'text-green-500';
            case 5:
                return 'text-green-600';
            default:
                return 'text-gray-200';
        }
    };

    const getPasswordStrengthText = () => {
        switch (passwordStrength) {
            case 0:
            case 1:
                return 'Très faible';
            case 2:
                return 'Faible';
            case 3:
                return 'Moyen';
            case 4:
                return 'Fort';
            case 5:
                return 'Très fort';
            default:
                return '';
        }
    };

    return (
        <Dashboard>
            <div className="relative flex items-center justify-center overflow-hidden p-5 font-sans">
                {/* Fond animé */}
                <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-emerald-50 via-emerald-50 to-teal-50"></div>

                <div className="animate-slide-up relative z-10 w-full max-w-md rounded-3xl border border-white/20 bg-white/98 p-12 shadow-2xl backdrop-blur-xl">
                    <div className="mb-10 text-center">
                        <div className="relative mx-auto mb-6 flex h-20 w-20 animate-pulse items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 shadow-lg shadow-emerald-500/40">
                            <div className="animate-spin-slow absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent"></div>
                            <span className="relative z-10 text-3xl">
                                <ShieldCheck size={18} strokeWidth={1.8} aria-hidden="true" className="inline-block shrink-0 align-middle" />
                            </span>
                        </div>
                        <h1 className="mb-3 bg-gradient-to-br from-slate-900 to-slate-700 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent">
                            Nouveau mot de passe
                        </h1>
                        <p className="text-base leading-relaxed text-gray-500">Créez un mot de passe sécurisé pour protéger votre compte</p>
                    </div>

                    <div className="space-y-7">
                        <div className="relative">
                            <div className="relative flex items-center">
                                <input
                                    type="email"
                                    name="email"
                                    value={data.email}
                                    onChange={(e) => setData({ ...data, email: e.target.value })}
                                    className="h-16 w-full rounded-2xl border-2 border-gray-200 bg-gray-50 px-6 pl-16 text-base font-medium text-slate-900 transition-all duration-300 outline-none focus:-translate-y-1 focus:border-emerald-500 focus:bg-white focus:shadow-lg focus:shadow-emerald-500/10"
                                    placeholder="votre.email@exemple.com"
                                    required
                                    onFocus={() => setFocused('email')}
                                    onBlur={() => setFocused(null)}
                                    readOnly
                                />
                                <div className="absolute left-6 z-10 text-xl text-gray-400 transition-all duration-300">
                                    <Mail size={18} strokeWidth={1.8} aria-hidden="true" className="inline-block shrink-0 align-middle" />
                                </div>
                            </div>
                            {errors.email && (
                                <div className="animate-error-bounce mt-2.5 flex items-center gap-2 rounded-lg border-l-3 border-red-500 bg-red-50 p-2 text-sm font-medium text-red-500">
                                    <span>
                                        <CircleAlert size={18} strokeWidth={1.8} aria-hidden="true" className="inline-block shrink-0 align-middle" />
                                    </span>
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
                                    className="h-16 w-full rounded-2xl border-2 border-gray-200 bg-gray-50 px-6 pr-16 pl-16 text-base font-medium text-slate-900 transition-all duration-300 outline-none focus:-translate-y-1 focus:border-emerald-500 focus:bg-white focus:shadow-lg focus:shadow-emerald-500/10"
                                    placeholder="Nouveau mot de passe"
                                    required
                                    onFocus={() => setFocused('password')}
                                    onBlur={() => setFocused(null)}
                                />
                                <div
                                    className={`absolute left-6 z-10 text-xl transition-all duration-300 ${focused === 'password' ? 'scale-110 text-emerald-500' : 'text-gray-400'}`}
                                >
                                    <KeyRound size={18} strokeWidth={1.8} aria-hidden="true" className="inline-block shrink-0 align-middle" />
                                </div>
                                <button
                                    type="button"
                                    className="absolute right-5 z-20 rounded-lg p-1 text-lg text-gray-400 transition-all duration-300 hover:bg-emerald-50 hover:text-emerald-500"
                                    aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? (
                                        <EyeOff size={18} strokeWidth={1.8} aria-hidden="true" className="inline-block shrink-0 align-middle" />
                                    ) : (
                                        <Eye size={18} strokeWidth={1.8} aria-hidden="true" className="inline-block shrink-0 align-middle" />
                                    )}
                                </button>
                            </div>
                            {data.password && (
                                <div className="mt-3 flex items-center gap-1">
                                    {[1, 2, 3, 4, 5].map((level) => (
                                        <div
                                            key={level}
                                            className={`h-1 flex-1 rounded-full transition-all duration-300 ${level <= passwordStrength ? getPasswordStrengthColor() : 'bg-gray-200'}`}
                                        />
                                    ))}
                                    <div className={`ml-2 min-w-[70px] text-xs font-semibold ${getPasswordStrengthTextColor()}`}>
                                        {getPasswordStrengthText()}
                                    </div>
                                </div>
                            )}
                            {errors.password && (
                                <div className="animate-error-bounce mt-2.5 flex items-center gap-2 rounded-lg border-l-3 border-red-500 bg-red-50 p-2 text-sm font-medium text-red-500">
                                    <span>
                                        <CircleAlert size={18} strokeWidth={1.8} aria-hidden="true" className="inline-block shrink-0 align-middle" />
                                    </span>
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
                                    className="h-16 w-full rounded-2xl border-2 border-gray-200 bg-gray-50 px-6 pr-16 pl-16 text-base font-medium text-slate-900 transition-all duration-300 outline-none focus:-translate-y-1 focus:border-emerald-500 focus:bg-white focus:shadow-lg focus:shadow-emerald-500/10"
                                    placeholder="Confirmer le nouveau mot de passe"
                                    required
                                    onFocus={() => setFocused('confirm')}
                                    onBlur={() => setFocused(null)}
                                />
                                <div
                                    className={`absolute left-6 z-10 text-xl transition-all duration-300 ${focused === 'confirm' ? 'scale-110 text-emerald-500' : 'text-gray-400'}`}
                                >
                                    <ShieldCheck size={18} strokeWidth={1.8} aria-hidden="true" className="inline-block shrink-0 align-middle" />
                                </div>
                                <button
                                    type="button"
                                    className="absolute right-5 z-20 rounded-lg p-1 text-lg text-gray-400 transition-all duration-300 hover:bg-emerald-50 hover:text-emerald-500"
                                    aria-label={
                                        showConfirmPassword ? 'Masquer la confirmation du mot de passe' : 'Afficher la confirmation du mot de passe'
                                    }
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                    {showConfirmPassword ? (
                                        <EyeOff size={18} strokeWidth={1.8} aria-hidden="true" className="inline-block shrink-0 align-middle" />
                                    ) : (
                                        <Eye size={18} strokeWidth={1.8} aria-hidden="true" className="inline-block shrink-0 align-middle" />
                                    )}
                                </button>
                            </div>
                            {errors.password_confirmation && (
                                <div className="animate-error-bounce mt-2.5 flex items-center gap-2 rounded-lg border-l-3 border-red-500 bg-red-50 p-2 text-sm font-medium text-red-500">
                                    <span>
                                        <CircleAlert size={18} strokeWidth={1.8} aria-hidden="true" className="inline-block shrink-0 align-middle" />
                                    </span>
                                    {errors.password_confirmation}
                                </div>
                            )}
                        </div>

                        <button
                            type="button"
                            className="relative h-16 cursor-pointer overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 text-base text-sm font-bold tracking-wide text-white uppercase shadow-lg shadow-emerald-500/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/50 active:translate-y-0 disabled:transform-none disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
                            disabled={processing}
                            onClick={handleSubmit}
                        >
                            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-all duration-600 hover:translate-x-full"></span>
                            {processing && (
                                <div className="mr-2.5 inline-block h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
                            )}
                            {processing ? 'Réinitialisation...' : 'Réinitialiser le mot de passe'}
                        </button>
                    </div>

                    <div className="mt-8 rounded-2xl border border-green-100 bg-gradient-to-br from-green-50 to-emerald-50 p-5 text-center text-sm leading-relaxed text-green-600">
                        <span className="mb-2 block text-xl">
                            <LockKeyhole size={18} strokeWidth={1.8} aria-hidden="true" className="inline-block shrink-0 align-middle" />
                        </span>
                        Votre mot de passe sera chiffré et stocké de manière sécurisée. Assurez-vous qu'il contient au moins 8 caractères avec des
                        lettres, chiffres et symboles.
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
                    0%,
                    20%,
                    40%,
                    60%,
                    80% {
                        transform: translateX(0);
                    }
                    10%,
                    30%,
                    50%,
                    70%,
                    90% {
                        transform: translateX(-3px);
                    }
                }

                @keyframes spin-slow {
                    from {
                        transform: rotate(0deg);
                    }
                    to {
                        transform: rotate(360deg);
                    }
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
