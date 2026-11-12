import Dashboard from '@/components/layouts/Dashboard/Dashboard';
import Alert from '@/utils/sweetAlert';
import { Link, useForm } from '@inertiajs/react';
import { CircleCheck, LockKeyhole, Mail, ShieldCheck } from 'lucide-react';
import React, { useState } from 'react';

export default function ForgotPassword({ status }: { status?: string }) {
    const { data, setData, post, processing, errors } = useForm({ email: '' });
    const [focused, setFocused] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitted(true);
        Alert.loading("Envoi de l'email de réinitialisation en cours...");

        post(route('password.email'), {
            onSuccess: () => {
                Alert.success('Un email de réinitialisation de mot de passe a été envoyé à votre adresse email.');
            },
            onError: () => {
                Alert.error('Une erreur est survenue lors de la réinitialisation de votre mot de passe.');
                setIsSubmitted(false);
            },
        });
    };

    return (
        <Dashboard>
            <div className="relative flex items-center justify-center overflow-hidden p-4 font-sans sm:p-5">
                {/* Fond animé amélioré */}
                <div className="absolute inset-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-emerald-50 to-teal-50"></div>
                    <div className="animate-gradient-shift absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent"></div>
                    {/* Éléments décoratifs flottants - cachés sur mobile */}
                    <div className="animate-float-1 absolute top-20 left-20 hidden h-32 w-32 rounded-full bg-emerald-400/20 blur-xl sm:block"></div>
                    <div className="animate-float-2 absolute top-40 right-20 hidden h-40 w-40 rounded-full bg-teal-400/20 blur-xl sm:block"></div>
                    <div className="animate-float-3 absolute bottom-20 left-1/3 hidden h-36 w-36 rounded-full bg-emerald-400/20 blur-xl sm:block"></div>
                </div>

                <div className="animate-slide-up relative z-10 w-full max-w-sm rounded-2xl border border-white/20 bg-white/95 p-6 shadow-2xl backdrop-blur-xl sm:max-w-md sm:rounded-3xl sm:p-8 md:p-12">
                    {/* Badge de sécurité */}
                    <div className="mb-4 flex justify-center sm:mb-6">
                        <div className="inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                            <span className="h-2 w-2 animate-pulse rounded-full bg-green-500"></span>
                            <span className="hidden sm:inline">Connexion sécurisée</span>
                            <span className="sm:hidden">Sécurisé</span>
                        </div>
                    </div>

                    <div className="animate-float group relative mx-auto mb-6 flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-emerald-500 shadow-lg shadow-emerald-500/30 sm:mb-8 sm:h-20 sm:w-20 sm:shadow-xl">
                        <div className="animate-spin-slow absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent"></div>
                        <span className="relative z-10 text-2xl transition-transform duration-300 group-hover:scale-110 sm:text-3xl">
                            <ShieldCheck size={18} strokeWidth={1.8} aria-hidden="true" className="inline-block shrink-0 align-middle" />
                        </span>
                    </div>

                    <h1 className="mb-3 bg-gradient-to-br from-slate-900 to-slate-700 bg-clip-text text-center text-2xl font-bold tracking-tight text-transparent sm:text-3xl">
                        Mot de passe oublié
                    </h1>
                    <p className="mb-8 px-2 text-center text-sm leading-relaxed text-gray-500 sm:mb-10 sm:text-base">
                        Pas de souci ! Saisissez votre adresse email et nous vous enverrons un lien de réinitialisation sécurisé.
                    </p>

                    {status && (
                        <div className="animate-alert-slide relative mb-6 overflow-hidden rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 p-3 text-xs font-medium text-white shadow-lg shadow-green-500/30 sm:p-4 sm:text-sm">
                            <div className="animate-shimmer absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                            <div className="flex items-center gap-2">
                                <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path
                                        fillRule="evenodd"
                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                                <span className="text-xs sm:text-sm">{status}</span>
                            </div>
                        </div>
                    )}

                    <div className="space-y-4 sm:space-y-6">
                        <div className="group relative">
                            <label className="mb-2 block text-sm font-medium text-gray-700">Adresse email</label>
                            <div className="relative">
                                <input
                                    type="email"
                                    name="email"
                                    value={data.email}
                                    onChange={(e) => setData({ email: e.target.value })}
                                    className={`h-12 w-full rounded-xl border-2 px-4 pl-12 text-sm font-medium transition-all duration-300 outline-none sm:h-14 sm:rounded-2xl sm:px-5 sm:pl-14 sm:text-base ${
                                        focused
                                            ? '-translate-y-0.5 border-emerald-500 bg-white shadow-lg shadow-emerald-500/10'
                                            : 'border-gray-200 bg-gray-50'
                                    } ${isSubmitted && !errors.email ? 'border-green-500 bg-green-50' : ''}`}
                                    placeholder="votre.email@exemple.com"
                                    required
                                    onFocus={() => setFocused(true)}
                                    onBlur={() => setFocused(false)}
                                />
                                <div
                                    className={`absolute top-1/2 left-4 z-10 -translate-y-1/2 text-lg transition-all duration-300 sm:left-5 sm:text-xl ${focused ? 'scale-110 text-emerald-500' : 'text-gray-400'} ${isSubmitted && !errors.email ? 'text-green-500' : ''}`}
                                >
                                    {isSubmitted && !errors.email ? (
                                        <CircleCheck size={18} strokeWidth={1.8} aria-hidden="true" className="inline-block shrink-0 align-middle" />
                                    ) : (
                                        <Mail size={18} strokeWidth={1.8} aria-hidden="true" className="inline-block shrink-0 align-middle" />
                                    )}
                                </div>
                                {focused && <div className="absolute -inset-1 animate-pulse rounded-xl bg-emerald-500/5 sm:rounded-2xl"></div>}
                            </div>
                            {errors.email && (
                                <div className="animate-error-shake mt-2 flex items-center gap-2 rounded-lg border-l-3 border-red-500 bg-red-50 p-2 text-xs font-medium text-red-500 sm:text-sm">
                                    <svg className="h-3 w-3 sm:h-4 sm:w-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path
                                            fillRule="evenodd"
                                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                    <span className="text-xs">{errors.email}</span>
                                </div>
                            )}
                        </div>

                        <button
                            type="button"
                            className="group relative h-12 w-full cursor-pointer overflow-hidden rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 text-sm font-semibold tracking-wide text-white shadow-lg shadow-emerald-500/30 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-emerald-500/40 active:translate-y-0 disabled:transform-none disabled:cursor-not-allowed disabled:opacity-70 disabled:shadow-none sm:h-14 sm:rounded-2xl sm:text-base"
                            disabled={processing}
                            onClick={handleSubmit}
                        >
                            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-all duration-500 group-hover:translate-x-full"></span>
                            <span className="relative z-10 flex items-center justify-center gap-2">
                                {processing ? (
                                    <>
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white sm:h-5 sm:w-5"></div>
                                        <span className="text-xs sm:text-sm">Envoi en cours...</span>
                                    </>
                                ) : (
                                    <>
                                        <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                            />
                                        </svg>
                                        <span className="text-xs sm:text-sm">Envoyer le lien</span>
                                    </>
                                )}
                            </span>
                        </button>
                    </div>

                    <div className="mt-6 text-center sm:mt-8">
                        <div className="mb-3 inline-flex items-center gap-2 text-xs text-gray-500 sm:mb-4 sm:text-sm">
                            <svg className="h-3 w-3 sm:h-4 sm:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                            <span className="hidden sm:inline">Besoin d'aide ?</span>
                            <span className="sm:hidden">Aide</span>
                        </div>
                        <Link
                            href="/login"
                            className="group relative inline-flex items-center gap-2 text-xs font-medium text-emerald-500 transition-all duration-300 hover:text-teal-600 sm:text-sm"
                        >
                            <svg
                                className="h-3 w-3 transition-transform duration-300 group-hover:-translate-x-1 sm:h-4 sm:w-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            <span className="hidden sm:inline">Retour à la connexion</span>
                            <span className="sm:hidden">Connexion</span>
                            <span className="absolute bottom-0 left-0 h-0.5 w-0 bg-gradient-to-r from-emerald-500 to-teal-600 transition-all duration-300 group-hover:w-full"></span>
                        </Link>
                    </div>

                    {/* Informations de sécurité - cachées sur mobile */}
                    <div className="mt-8 hidden rounded-xl border border-emerald-100 bg-emerald-50 p-4 sm:block">
                        <div className="flex items-start gap-3">
                            <svg className="mt-0.5 h-5 w-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                    fillRule="evenodd"
                                    d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 7c0-5.92-4.808-10.72-10.72-10.72A10.975 10.975 0 002.166 5zM8.058 14H15.94a8.975 8.975 0 00-1.856-4.5 8.975 8.975 0 00-7.17 0 8.975 8.975 0 00-1.856 4.5z"
                                    clipRule="evenodd"
                                />
                            </svg>
                            <div className="text-xs text-emerald-700">
                                <p className="mb-1 font-medium">
                                    <LockKeyhole size={18} strokeWidth={1.8} aria-hidden="true" className="inline-block shrink-0 align-middle" />{' '}
                                    Sécurité garantie
                                </p>
                                <p>Votre email est protégé et ne sera jamais partagé. Le lien de réinitialisation expire après 60 minutes.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes slide-up {
                    from {
                        opacity: 0;
                        transform: translateY(30px) scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }

                @keyframes float {
                    0%,
                    100% {
                        transform: translateY(0px);
                    }
                    50% {
                        transform: translateY(-5px);
                    }
                }

                @keyframes float-1 {
                    0%,
                    100% {
                        transform: translateY(0px) translateX(0px);
                    }
                    33% {
                        transform: translateY(-10px) translateX(5px);
                    }
                    66% {
                        transform: translateY(-5px) translateX(-5px);
                    }
                }

                @keyframes float-2 {
                    0%,
                    100% {
                        transform: translateY(0px) translateX(0px);
                    }
                    33% {
                        transform: translateY(-8px) translateX(-8px);
                    }
                    66% {
                        transform: translateY(-12px) translateX(4px);
                    }
                }

                @keyframes float-3 {
                    0%,
                    100% {
                        transform: translateY(0px) translateX(0px);
                    }
                    33% {
                        transform: translateY(-6px) translateX(-6px);
                    }
                    66% {
                        transform: translateY(-10px) translateX(8px);
                    }
                }

                @keyframes gradient-shift {
                    0%,
                    100% {
                        transform: translateX(0%) translateY(0%);
                    }
                    25% {
                        transform: translateX(25%) translateY(-25%);
                    }
                    50% {
                        transform: translateX(-25%) translateY(25%);
                    }
                    75% {
                        transform: translateX(15%) translateY(-15%);
                    }
                }

                @keyframes alert-slide {
                    from {
                        opacity: 0;
                        transform: translateY(-10px) scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }

                @keyframes shimmer {
                    0% {
                        left: -100%;
                    }
                    100% {
                        left: 100%;
                    }
                }

                @keyframes error-shake {
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
                        transform: translateX(-2px);
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
                    animation: slide-up 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
                }

                .animate-float {
                    animation: float 3s ease-in-out infinite;
                }

                .animate-float-1 {
                    animation: float-1 8s ease-in-out infinite;
                }

                .animate-float-2 {
                    animation: float-2 10s ease-in-out infinite;
                }

                .animate-float-3 {
                    animation: float-3 12s ease-in-out infinite;
                }

                .animate-gradient-shift {
                    animation: gradient-shift 15s ease-in-out infinite;
                }

                .animate-alert-slide {
                    animation: alert-slide 0.4s ease-out;
                }

                .animate-shimmer {
                    animation: shimmer 2s infinite;
                }

                .animate-error-shake {
                    animation: error-shake 0.5s ease-out;
                }

                .animate-spin-slow {
                    animation: spin-slow 3s linear infinite;
                }

                @media (prefers-reduced-motion: reduce) {
                    .animate-slide-up,
                    .animate-float,
                    .animate-float-1,
                    .animate-float-2,
                    .animate-float-3,
                    .animate-gradient-shift,
                    .animate-alert-slide,
                    .animate-shimmer,
                    .animate-error-shake,
                    .animate-spin-slow {
                        animation: none;
                    }
                }
            `}</style>
        </Dashboard>
    );
}
