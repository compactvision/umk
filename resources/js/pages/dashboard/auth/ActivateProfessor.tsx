import Dashboard from '@/components/layouts/Dashboard/Dashboard';
import { Head, Link, useForm } from '@inertiajs/react';
import { GraduationCap } from 'lucide-react';

type Invitation = { name: string; email: string; action: string };

export default function ActivateProfessor({ invitation }: { invitation: Invitation | null }) {
    const form = useForm({ password: '', password_confirmation: '' });
    return (
        <Dashboard authPage>
            <Head title="Activation du compte enseignant" />
            <section className="mx-auto grid w-full max-w-md gap-5 rounded-2xl border border-emerald-900/15 bg-white p-6 shadow-sm sm:p-8">
                <span className="grid size-11 place-items-center rounded-xl bg-emerald-100 text-emerald-900">
                    <GraduationCap aria-hidden="true" />
                </span>
                <h1 className="text-2xl font-semibold text-emerald-950">Activer mon espace enseignant</h1>
                {invitation ? (
                    <>
                        <p className="text-sm text-slate-700">
                            {invitation.name} · {invitation.email}
                        </p>
                        <form
                            className="grid gap-4"
                            onSubmit={(event) => {
                                event.preventDefault();
                                form.post(invitation.action);
                            }}
                        >
                            <label className="grid gap-1 text-sm font-medium">
                                Mot de passe (8 caractères minimum)
                                <input
                                    className="rounded-lg border border-slate-400 px-3 py-2"
                                    type="password"
                                    required
                                    minLength={8}
                                    autoComplete="new-password"
                                    value={form.data.password}
                                    onChange={(event) => form.setData('password', event.target.value)}
                                />
                            </label>
                            <label className="grid gap-1 text-sm font-medium">
                                Confirmer le mot de passe
                                <input
                                    className="rounded-lg border border-slate-400 px-3 py-2"
                                    type="password"
                                    required
                                    autoComplete="new-password"
                                    value={form.data.password_confirmation}
                                    onChange={(event) => form.setData('password_confirmation', event.target.value)}
                                />
                            </label>
                            {Object.values(form.errors).map((error) => (
                                <p className="text-sm text-red-800" role="alert" key={error}>
                                    {error}
                                </p>
                            ))}
                            <button
                                className="rounded-lg bg-emerald-900 px-4 py-3 font-medium text-white disabled:opacity-60"
                                disabled={form.processing}
                            >
                                {form.processing ? 'Activation…' : 'Activer mon compte'}
                            </button>
                        </form>
                    </>
                ) : (
                    <p className="text-sm text-slate-700">
                        Ce lien a expiré ou a déjà été utilisé. Contactez la scolarité pour recevoir une nouvelle invitation.
                    </p>
                )}
                <Link href={route('login')} className="text-sm font-medium text-emerald-900 underline">
                    Aller à la connexion
                </Link>
            </section>
        </Dashboard>
    );
}
