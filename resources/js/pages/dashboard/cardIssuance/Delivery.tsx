import AdminModal from '@/components/admin/AdminModal';
import PageHeading from '@/components/admin/PageHeading';
import Dashboard from '@/components/layouts/Dashboard/Dashboard';
import CardPagination from '@/components/studentCards/CardPagination';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { PackageCheck, Printer, Search } from 'lucide-react';
import { useState } from 'react';
import '../../../../css/dashboard/card-issuance.css';
import '../../../../css/dashboard/card-requests.css';

type Card = { id: number; student_name: string; matricule: string; academic_year: string; printed_at: string; collected_at: string | null };
type Status = 'waiting' | 'collected';
type Props = {
    cards: { data: Card[]; total: number; prev_page_url: string | null; next_page_url: string | null };
    status: Status;
    term: string;
    success: string | null;
};

const prefix = 'dashboard.admin.card-issuance.';
const timestamp = new Intl.DateTimeFormat('fr-CD', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Africa/Kinshasa' });

function Collection({ card, close }: { card: Card; close: () => void }) {
    const form = useForm({});
    return (
        <AdminModal
            title="Confirmer le retrait"
            description={`${card.student_name} · ${card.matricule}`}
            formId="ci-collect"
            submitLabel="Confirmer le retrait"
            onClose={close}
            busy={form.processing}
            errors={form.errors}
        >
            <form
                id="ci-collect"
                onSubmit={(event) => {
                    event.preventDefault();
                    form.patch(route(prefix + 'collect', card.id), { onSuccess: close, preserveScroll: true });
                }}
            >
                <p>Confirmez uniquement si le badge a bien été remis à l’étudiant.</p>
            </form>
        </AdminModal>
    );
}

export default function Delivery({ cards, status, term, success }: Props) {
    const [query, setQuery] = useState(term);
    const [selected, setSelected] = useState<Card | null>(null);
    const href = (next: Status) => route(prefix + 'delivery', { status: next, q: term || undefined });

    return (
        <Dashboard hideAppsNavigation>
            <Head title="Délivrance des cartes" />
            <div className="cr-page">
                <PageHeading
                    title="Délivrance des cartes"
                    description="Remettez les badges imprimés aux étudiants et retrouvez l’historique des retraits."
                    action={
                        <Link className="admin-secondary" href={route(prefix + 'printing')}>
                            <Printer size={17} /> Génération et impression
                        </Link>
                    }
                />
                {success && (
                    <p className="ci-success" role="status">
                        {success}
                    </p>
                )}
                <section className="cr-panel">
                    <nav className="ci-tabs" aria-label="État de délivrance">
                        <Link href={href('waiting')} aria-current={status === 'waiting' ? 'page' : undefined}>
                            En attente de retrait
                        </Link>
                        <Link href={href('collected')} aria-current={status === 'collected' ? 'page' : undefined}>
                            Cartes retirées
                        </Link>
                    </nav>
                    <form
                        className="ci-search"
                        onSubmit={(event) => {
                            event.preventDefault();
                            router.get(route(prefix + 'delivery'), { status, q: query.trim() || undefined });
                        }}
                    >
                        <label>
                            Rechercher un étudiant
                            <input
                                type="search"
                                maxLength={100}
                                value={query}
                                placeholder="Nom ou matricule"
                                onChange={(event) => setQuery(event.target.value)}
                            />
                        </label>
                        <button type="submit" className="admin-secondary">
                            <Search size={16} /> Rechercher
                        </button>
                    </form>
                    {cards.data.length ? (
                        <div className="cr-table-wrap" data-dashboard-panel="status q page">
                            <table className="cr-table">
                                <thead>
                                    <tr>
                                        <th scope="col">Étudiant</th>
                                        <th scope="col">Année académique</th>
                                        <th scope="col">Imprimée le</th>
                                        <th scope="col">{status === 'waiting' ? 'Action' : 'Retirée le'}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cards.data.map((card) => (
                                        <tr key={card.id}>
                                            <td>
                                                <strong>{card.student_name}</strong>
                                                <small>{card.matricule}</small>
                                            </td>
                                            <td>{card.academic_year}</td>
                                            <td>{timestamp.format(new Date(card.printed_at))}</td>
                                            <td>
                                                {card.collected_at ? (
                                                    timestamp.format(new Date(card.collected_at))
                                                ) : (
                                                    <button type="button" className="admin-primary" onClick={() => setSelected(card)}>
                                                        <PackageCheck size={16} /> Confirmer le retrait
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="cr-empty" data-dashboard-panel="status q page">
                            {status === 'waiting'
                                ? 'Aucune carte en attente de retrait dans cette liste.'
                                : 'Aucun retrait confirmé dans cette liste.'}
                        </p>
                    )}
                    <CardPagination
                        previous={cards.prev_page_url ? { href: cards.prev_page_url, label: 'Précédente' } : undefined}
                        next={cards.next_page_url ? { href: cards.next_page_url, label: 'Suivante' } : undefined}
                        preserveScroll
                    />
                </section>
            </div>
            {selected && <Collection card={selected} close={() => setSelected(null)} />}
        </Dashboard>
    );
}
