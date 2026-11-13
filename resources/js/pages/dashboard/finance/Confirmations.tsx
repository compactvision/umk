import AdminModal from '@/components/admin/AdminModal';
import Pagination from '@/components/admin/Pagination';
import Dashboard from '@/components/layouts/Dashboard/Dashboard';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, ClipboardCheck, Search } from 'lucide-react';
import { useState } from 'react';
import '../../../../css/dashboard/my-enrollments.css';
import '../../../../css/student-portal.css';

type Entry = {
    id: number;
    name: string;
    matricule: string | null;
    level: string;
    year: string;
    faculty: string;
    blocker: string | null;
    canConfirm: boolean;
    context: string;
};

export default function Confirmations({
    entries,
    filters,
    requiresPayment,
}: {
    entries: { data: Entry[]; total: number };
    filters: { q?: string };
    requiresPayment: boolean;
}) {
    const { flash, errors } = usePage<{ flash?: { success?: string }; errors: Record<string, string> }>().props;
    const [selected, setSelected] = useState<Entry | null>(null);
    const form = useForm({ reason: '', operation_key: '', expected_context: '' });
    const index = route('dashboard.admin.finance.confirmations');

    return (
        <Dashboard hideAppsNavigation>
            <Head title="Confirmation des inscriptions" />
            <div className="student-portal my-enrollments">
                <header className="my-enrollments-heading">
                    <Link className="me-link" href={route('dashboard.admin.finance.index')}>
                        <ArrowLeft size={16} /> Finances
                    </Link>
                    <h1>Confirmation des inscriptions</h1>
                    <p>
                        {requiresPayment
                            ? 'Confirmez les inscriptions dont la première tranche est couverte.'
                            : 'Examinez les dossiers en attente et confirmez les inscriptions admissibles.'}
                    </p>
                </header>
                {flash?.success && (
                    <p className="portal-alert" role="status">
                        {flash.success}
                    </p>
                )}
                {!selected &&
                    Object.values(errors ?? {}).map((error) => (
                        <p className="portal-error" role="alert" key={error}>
                            {error}
                        </p>
                    ))}
                <section className="me-list" aria-label="Inscriptions en attente">
                    <form
                        className="me-card portal-form"
                        key={filters.q}
                        onSubmit={(event) => {
                            event.preventDefault();
                            const q = String(new FormData(event.currentTarget).get('q') ?? '').trim();
                            router.get(index, q ? { q } : {});
                        }}
                    >
                        <label>
                            Nom ou matricule <input type="search" name="q" maxLength={150} defaultValue={filters.q} />
                        </label>
                        <div className="me-actions">
                            <button className="portal-primary">
                                <Search size={16} aria-hidden="true" /> Rechercher
                            </button>
                            {filters.q && (
                                <Link className="me-link" href={index}>
                                    Réinitialiser
                                </Link>
                            )}
                        </div>
                    </form>
                    <h2>
                        <ClipboardCheck size={20} aria-hidden="true" /> En attente · {entries.total}
                    </h2>
                    {entries.data.map((entry) => (
                        <article className="me-card" key={entry.id}>
                            <header className="me-card-header">
                                <div>
                                    <h3>{entry.name}</h3>
                                    <p>{[entry.matricule, entry.level, entry.faculty, entry.year].filter(Boolean).join(' · ')}</p>
                                </div>
                                <span className="me-status" data-status={entry.blocker ? 'pending_confirmation' : 'confirmed'}>
                                    {entry.blocker ?? 'Prête à confirmer'}
                                </span>
                            </header>
                            <div className="me-actions">
                                <Link className="me-link" href={route('dashboard.admin.finance.index', { academic: entry.id })}>
                                    Consulter le compte financier
                                </Link>
                                {entry.canConfirm && !entry.blocker && (
                                    <button
                                        className="portal-primary"
                                        onClick={() => {
                                            form.clearErrors();
                                            form.setData({ reason: '', operation_key: crypto.randomUUID(), expected_context: entry.context });
                                            setSelected(entry);
                                        }}
                                    >
                                        Confirmer l’inscription
                                    </button>
                                )}
                                {!entry.canConfirm && <p>Confirmation réservée aux agents autorisés à gérer les inscriptions.</p>}
                            </div>
                        </article>
                    ))}
                    {!entries.data.length && <p className="me-card">Aucune inscription en attente pour cette recherche.</p>}
                    <Pagination value={entries} />
                </section>
                {selected && (
                    <AdminModal
                        title="Confirmer l’inscription"
                        description={`${selected.name} · ${selected.level} · ${selected.year}`}
                        formId="finance-confirm-enrollment"
                        submitLabel="Confirmer l’inscription"
                        busy={form.processing}
                        errors={form.errors}
                        onClose={() => setSelected(null)}
                    >
                        <form
                            id="finance-confirm-enrollment"
                            className="admin-modal-form"
                            onSubmit={(event) => {
                                event.preventDefault();
                                if (form.processing) return;
                                form.post(route('dashboard.admin.finance.confirmations.store', selected.id), {
                                    preserveScroll: true,
                                    onSuccess: () => setSelected(null),
                                });
                            }}
                        >
                            <label>
                                Motif de confirmation
                                <textarea
                                    value={form.data.reason}
                                    onChange={(event) => form.setData('reason', event.target.value)}
                                    required
                                    minLength={10}
                                    maxLength={1000}
                                />
                            </label>
                        </form>
                    </AdminModal>
                )}
            </div>
        </Dashboard>
    );
}
