import Dashboard from '@/components/layouts/Dashboard/Dashboard';
import { Head, Link, useForm } from '@inertiajs/react';
import { CircleCheck, Info, LoaderCircle, LogOut, Mail } from 'lucide-react';
import type { FormEvent } from 'react';

export default function VerifyEmail({ status }: { status?: string }) {
    const { post, processing, errors } = useForm();

    const handleResend = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        post(route('verification.send'), { preserveScroll: true });
    };

    return (
        <Dashboard authPage>
            <Head title="Vérification de votre adresse email" />
            <div className="usk-auth-form flex w-full items-center justify-center font-sans">
                <div className="usk-auth-panel w-full min-w-0">
                    <div className="mb-6 flex justify-center">
                        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600">
                            <img src="/assets/usk/logo.png" alt="Université Simon Kimbangu" className="h-full w-full object-contain p-1" />
                        </div>
                    </div>

                    <div className="mb-6 text-center">
                        <h1 className="mb-3 text-2xl font-bold text-gray-800">Vérifiez votre adresse email</h1>
                        <p className="leading-relaxed text-gray-600">
                            Cliquez sur le lien reçu par email pour activer votre compte et accéder à votre espace.
                        </p>
                    </div>

                    <div className="mb-6 flex items-start gap-3 rounded-lg border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-700">
                        <Info size={20} className="mt-0.5 shrink-0" aria-hidden="true" />
                        <p className="leading-relaxed">Vous ne trouvez pas le message ? Vérifiez également votre dossier spam ou renvoyez le lien ci-dessous.</p>
                    </div>

                    <div aria-live="polite" aria-atomic="true">
                        {status === 'verification-link-sent' && (
                            <div className="mb-6 flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700" role="status">
                                <CircleCheck size={20} className="mt-0.5 shrink-0" aria-hidden="true" />
                                <p>Un nouveau lien de vérification a été envoyé à votre adresse email.</p>
                            </div>
                        )}
                    </div>

                    {Object.keys(errors).length > 0 && (
                        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">
                            {Object.values(errors).map((error, index) => <p key={index}>{String(error)}</p>)}
                        </div>
                    )}

                    <form onSubmit={handleResend}>
                        <button
                            type="submit"
                            disabled={processing}
                            className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-3.5 text-base font-medium text-white transition-colors duration-300 hover:from-emerald-600 hover:to-teal-700 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            {processing ? <LoaderCircle size={20} className="shrink-0 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <Mail size={20} className="shrink-0" aria-hidden="true" />}
                            <span>{processing ? 'Envoi en cours...' : "Renvoyer l’email de vérification"}</span>
                        </button>
                    </form>

                    <div className="mt-6 border-t border-gray-200 pt-6 text-center">
                        <Link
                            href={route('logout')}
                            method="post"
                            as="button"
                            className="inline-flex min-h-11 items-center justify-center gap-2 text-sm font-medium text-emerald-600 transition-colors hover:text-emerald-800"
                        >
                            <LogOut size={18} aria-hidden="true" />
                            Se déconnecter
                        </Link>
                    </div>
                </div>
            </div>
        </Dashboard>
    );
}
