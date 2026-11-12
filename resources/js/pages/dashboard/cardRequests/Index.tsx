import AdminModal from '@/components/admin/AdminModal';
import PageHeading from '@/components/admin/PageHeading';
import Dashboard from '@/components/layouts/Dashboard/Dashboard';
import CardPagination from '@/components/studentCards/CardPagination';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { ClipboardCheck, IdCard, Search, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import '../../../../css/dashboard/card-requests.css';

type PhotoStatus = 'pending' | 'approved' | 'refused' | 'none';
type Row = {
    id: number;
    student: string;
    matricule: string | null;
    level: string | null;
    reasons: string[];
    year: string | null;
    ready: boolean;
    photo_status: PhotoStatus;
    decision_note: string | null;
    photo: { version: string; url: string } | null;
    fees: { required: number | null; paid: number; currency: string };
};
type Props = {
    years: { id: number; title: string }[];
    year: number | null;
    term: string;
    rows: { data: Row[]; total: number; current_page: number; last_page: number; prev_page_url: string | null; next_page_url: string | null };
};

const prefix = 'dashboard.admin.card-requests';
const labels: Record<PhotoStatus, string> = { none: 'Manquante', pending: 'À valider', approved: 'Validée', refused: 'À remplacer' };
const money = (cents: number, currency: string) => new Intl.NumberFormat('fr-CD', { style: 'currency', currency }).format(cents / 100);

function RequestAction({ row, close }: { row: Row; close: () => void }) {
    const form = useForm({ status: 'approved', decision_note: '', version: row.photo?.version ?? '' });
    const [photoLoaded, setPhotoLoaded] = useState(false);
    return (
        <AdminModal
            title="Valider la photo de profil"
            description={`${row.student || 'Étudiant'} · ${row.matricule || 'Sans matricule'}`}
            onClose={close}
            formId="card-request-form"
            submitLabel="Enregistrer la décision"
            busy={form.processing}
            errors={form.errors}
        >
            <form
                id="card-request-form"
                className="admin-modal-form"
                onSubmit={(event) => {
                    event.preventDefault();
                    if (photoLoaded) form.patch(route(prefix + '.review', row.id), { preserveScroll: true, onSuccess: close });
                }}
            >
                {row.photo && (
                    <img
                        className="cr-review-photo"
                        src={row.photo.url}
                        alt={`Photo de profil de ${row.student}`}
                        onLoad={() => setPhotoLoaded(true)}
                        onError={() => form.setError('version', 'La photo est indisponible. Rechargez la liste.')}
                    />
                )}
                <p>Vérifiez que le visage est net, de face et suffisamment cadré pour la carte.</p>
                <fieldset disabled={!photoLoaded} className="cr-decision">
                    <label className="admin-field">
                        Décision *
                        <select value={form.data.status} onChange={(event) => form.setData('status', event.target.value)}>
                            <option value="approved">Valider la photo</option>
                            <option value="refused">Demander une nouvelle photo</option>
                        </select>
                    </label>
                    <label className="admin-field">
                        {form.data.status === 'refused' ? 'Motif du refus *' : 'Note facultative'}
                        <textarea
                            rows={3}
                            maxLength={500}
                            required={form.data.status === 'refused'}
                            value={form.data.decision_note}
                            onChange={(event) => form.setData('decision_note', event.target.value)}
                        />
                    </label>
                </fieldset>
            </form>
        </AdminModal>
    );
}

export default function Index({ years, year, term, rows }: Props) {
    const [query, setQuery] = useState(term);
    const [selected, setSelected] = useState<Row | null>(null);
    const filter = (nextYear: number | null, q: string) =>
        router.get(route(prefix + '.index'), { year: nextYear || undefined, q: q.trim() || undefined }, { preserveScroll: true });

    return (
        <Dashboard hideAppsNavigation>
            <Head title="Demandes et éligibilité" />
            <div className="cr-page">
                <PageHeading
                    title="Demandes et éligibilité"
                    description="Retrouvez les inscriptions étudiantes et vérifiez les conditions avant la gravure du badge NFC."
                    action={
                        <Link className="admin-secondary" href={route('dashboard.admin.card-templates.index')}>
                            <IdCard size={17} /> Modèles de cartes
                        </Link>
                    }
                />
                <section className="cr-rule">
                    <ShieldCheck size={25} aria-hidden="true" />
                    <div>
                        <h2>Conditions d’éligibilité</h2>
                        <p>
                            Inscription confirmée pour une année ouverte, dossier actif avec matricule, photo de profil validée et première tranche
                            réglée.
                        </p>
                    </div>
                </section>
                <section className="cr-panel" aria-labelledby="cr-list">
                    <div className="cr-panel-title">
                        <ClipboardCheck size={21} aria-hidden="true" />
                        <h2 id="cr-list">
                            Inscriptions étudiantes <span>{rows.total}</span>
                        </h2>
                    </div>
                    <form
                        className="cr-filters"
                        onSubmit={(event) => {
                            event.preventDefault();
                            filter(year, query);
                        }}
                    >
                        <label>
                            Année académique
                            <select
                                value={year ?? ''}
                                disabled={!years.length}
                                onChange={(event) => filter(Number(event.target.value) || null, query)}
                            >
                                <option value="">Toutes les années</option>
                                {years.map((item) => (
                                    <option key={item.id} value={item.id}>
                                        {item.title}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label>
                            Rechercher un étudiant
                            <input
                                type="search"
                                value={query}
                                maxLength={100}
                                placeholder="Nom ou matricule"
                                onChange={(event) => setQuery(event.target.value)}
                            />
                        </label>
                        <button type="submit" className="admin-secondary">
                            <Search size={16} aria-hidden="true" /> Rechercher
                        </button>
                    </form>
                    {rows.data.length ? (
                        <div className="cr-table-wrap" data-dashboard-panel="year q page">
                            <table className="cr-table">
                                <thead>
                                    <tr>
                                        <th scope="col">Étudiant</th>
                                        <th scope="col">Photo de profil</th>
                                        <th scope="col">Première tranche</th>
                                        <th scope="col">Éligibilité</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.data.map((row) => (
                                        <tr key={row.id}>
                                            <td>
                                                <strong>{row.student || 'Étudiant'}</strong>
                                                <small>
                                                    {row.matricule || 'Sans matricule'}
                                                    {row.level ? ` · ${row.level}` : ''}
                                                    {row.year ? ` · ${row.year}` : ''}
                                                </small>
                                            </td>
                                            <td>
                                                <div className="cr-photo-cell">
                                                    {row.photo && <img src={row.photo.url} alt="" loading="lazy" />}
                                                    <div>
                                                        <span className="cr-pill" data-tone={row.photo_status}>
                                                            {labels[row.photo_status]}
                                                        </span>
                                                        {row.decision_note && <small>{row.decision_note}</small>}
                                                        {row.photo_status === 'pending' && (
                                                            <button type="button" className="admin-secondary" onClick={() => setSelected(row)}>
                                                                Examiner
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                {row.fees.required === null ? (
                                                    <span className="cr-pill">Non définie</span>
                                                ) : (
                                                    <>
                                                        <span className="cr-pill" data-tone={row.fees.paid >= row.fees.required ? 'good' : 'pending'}>
                                                            {row.fees.paid >= row.fees.required ? 'Réglée' : 'À compléter'}
                                                        </span>
                                                        <small>
                                                            {money(row.fees.paid, row.fees.currency)} confirmés sur{' '}
                                                            {money(row.fees.required, row.fees.currency)} requis
                                                        </small>
                                                    </>
                                                )}
                                            </td>
                                            <td>
                                                <span className="cr-pill" data-tone={row.ready ? 'good' : 'blocked'}>
                                                    {row.ready ? 'Prêt à graver' : 'Non éligible'}
                                                </span>
                                                {row.reasons.map((reason) => (
                                                    <small key={reason}>{reason}</small>
                                                ))}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="cr-empty" data-dashboard-panel="year q page">
                            Aucune inscription ne correspond à cette recherche.
                        </p>
                    )}
                    {rows.last_page > 1 && (
                        <CardPagination
                            previous={rows.prev_page_url ? { href: rows.prev_page_url, label: 'Précédente' } : undefined}
                            next={rows.next_page_url ? { href: rows.next_page_url, label: 'Suivante' } : undefined}
                            label="Pagination des dossiers"
                            preserveScroll
                        >
                            <span>
                                Page {rows.current_page} sur {rows.last_page}
                            </span>
                        </CardPagination>
                    )}
                </section>
            </div>
            {selected && <RequestAction row={selected} close={() => setSelected(null)} />}
        </Dashboard>
    );
}
