import AdminModal from '@/components/admin/AdminModal';
import PageHeading from '@/components/admin/PageHeading';
import Pagination from '@/components/admin/Pagination';
import CreateAcademicYearPopup from '@/components/form/CreateAcademicYearPopup';
import Dashboard from '@/components/layouts/Dashboard/Dashboard';
import { usePanelFade } from '@/hooks/use-panel-fade';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    ArrowRight,
    CalendarDays,
    CalendarRange,
    Check,
    CircleCheck,
    Clock3,
    DoorClosed,
    DoorOpen,
    Info,
    Pencil,
    Plus,
    Search,
    X,
} from 'lucide-react';
import { useState, type FormEvent } from 'react';
import '../../../../css/dashboard/academic-years.css';
export type AcademicYear = {
    id: number;
    title: string;
    start_date: string;
    end_date: string;
    status: 'draft' | 'open' | 'closed';
    students_count?: number;
    created_at?: string;
};
const labels = { draft: 'Brouillon', open: 'Ouverte', closed: 'Clôturée' };
const date = (value?: string) => {
    if (!value) return 'À préciser';
    const parsed = new Date(`${value.slice(0, 10)}T12:00:00`);
    return Number.isNaN(parsed.getTime()) ? 'À préciser' : parsed.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
};
export default function AcademicYearManager({ academicYears }: { academicYears: AcademicYear[] | { data: AcademicYear[] } }) {
    const [editing, setEditing] = useState<AcademicYear | null>(null);
    const [formOpen, setFormOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('all');
    const [closing, setClosing] = useState<AcademicYear | null>(null);
    const action = useForm({});
    const years = Array.isArray(academicYears) ? academicYears : academicYears.data || [];
    const filtered = years.filter(
        (year) => year.title.toLocaleLowerCase('fr').includes(search.trim().toLocaleLowerCase('fr')) && (status === 'all' || year.status === status),
    );
    const resultsPanel = usePanelFade(filtered.map((year) => year.id).join(','));
    const openYear = (year: AcademicYear) => {
        if (!action.processing) action.patch(route('dashboard.admin.academic-years.open', year.id), { preserveScroll: true });
    };
    const closeYear = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (closing && !action.processing)
            action.patch(route('dashboard.admin.academic-years.close', closing.id), { preserveScroll: true, onSuccess: () => setClosing(null) });
    };
    const messages = Object.values(action.errors);
    return (
        <Dashboard hideAppsNavigation>
            <Head title="Années académiques" />
            <div className="academic-years-page">
                <PageHeading
                    title="Années académiques"
                    description="Des périodes bien définies pour accompagner chaque parcours."
                    action={
                        <button
                            className="admin-primary"
                            onClick={() => {
                                setEditing(null);
                                setFormOpen(true);
                            }}
                        >
                            <Plus size={17} />
                            Nouvelle année
                        </button>
                    }
                />
                <div className="ay-overview">
                    <div>
                        <CalendarRange size={23} strokeWidth={1.5} />
                        <p>
                            <strong>{years.length}</strong>
                            <span>Année{years.length > 1 ? 's' : ''} sur cette page</span>
                        </p>
                    </div>
                    <div>
                        <CircleCheck size={23} strokeWidth={1.5} />
                        <p>
                            <strong>{years.filter((year) => year.status === 'open').length}</strong>
                            <span>Ouverte{years.filter((year) => year.status === 'open').length > 1 ? 's' : ''} aux inscriptions</span>
                        </p>
                    </div>
                    <div>
                        <Clock3 size={23} strokeWidth={1.5} />
                        <p>
                            <strong>{years.filter((year) => year.status === 'draft').length}</strong>
                            <span>En préparation</span>
                        </p>
                    </div>
                </div>
                <div className="ay-toolbar">
                    <label className="ay-search">
                        <Search size={18} />
                        <input
                            type="search"
                            placeholder="Rechercher une année académique…"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            aria-label="Rechercher une année sur cette page"
                        />
                    </label>
                    <label className="ay-status-filter">
                        <span>Statut</span>
                        <select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filtrer par statut">
                            <option value="all">Tous les statuts</option>
                            <option value="draft">Brouillons</option>
                            <option value="open">Ouvertes</option>
                            <option value="closed">Clôturées</option>
                        </select>
                    </label>
                </div>
                <div className="ay-results">
                    <span aria-live="polite">
                        {filtered.length} année{filtered.length > 1 ? 's' : ''} affichée{filtered.length > 1 ? 's' : ''}
                    </span>
                    {(search || status !== 'all') && (
                        <button
                            onClick={() => {
                                setSearch('');
                                setStatus('all');
                            }}
                        >
                            <X size={14} />
                            Effacer les filtres
                        </button>
                    )}
                </div>
                {!!messages.length && !closing && (
                    <div className="ay-error" role="alert">
                        <Info size={17} />
                        <div>
                            {messages.map((message) => (
                                <p key={String(message)}>{String(message)}</p>
                            ))}
                        </div>
                    </div>
                )}
                <div className="ay-grid" ref={filtered.length ? resultsPanel : undefined}>
                    {filtered.map((year) => (
                        <article className="ay-card" key={year.id}>
                            <div className="ay-card-top">
                                <span className="ay-calendar-icon">
                                    <CalendarDays size={25} strokeWidth={1.4} />
                                </span>
                                <span className={`ay-badge is-${year.status}`}>
                                    {year.status === 'open' ? (
                                        <Check size={12} />
                                    ) : year.status === 'closed' ? (
                                        <DoorClosed size={12} />
                                    ) : (
                                        <Clock3 size={12} />
                                    )}
                                    {labels[year.status]}
                                </span>
                            </div>
                            <span className="ay-eyebrow">CALENDRIER UNIVERSITAIRE</span>
                            <h2>
                                <Link href={route('dashboard.admin.academic-years.show', year.id)}>{year.title}</Link>
                            </h2>
                            <div className="ay-dates">
                                <div>
                                    <span>Début de l’année</span>
                                    <strong>{date(year.start_date)}</strong>
                                </div>
                                <ArrowRight size={18} strokeWidth={1.4} />
                                <div>
                                    <span>Fin de l’année</span>
                                    <strong>{date(year.end_date)}</strong>
                                </div>
                            </div>
                            <div className="ay-card-note">
                                <Info size={14} />
                                <span>
                                    {year.status === 'draft'
                                        ? 'Prête à être configurée avant son ouverture.'
                                        : year.status === 'open'
                                          ? 'Les inscriptions sont ouvertes pour cette année.'
                                          : 'Les inscriptions de cette année sont clôturées.'}
                                </span>
                            </div>
                            <div className="ay-card-actions">
                                {year.status === 'draft' && (
                                    <button
                                        className="ay-open"
                                        disabled={action.processing}
                                        onClick={() => {
                                            action.clearErrors();
                                            openYear(year);
                                        }}
                                    >
                                        <DoorOpen size={15} />
                                        Ouvrir les inscriptions
                                    </button>
                                )}
                                {year.status === 'open' && (
                                    <button
                                        className="ay-close-year"
                                        disabled={action.processing}
                                        onClick={() => {
                                            action.clearErrors();
                                            setClosing(year);
                                        }}
                                    >
                                        <DoorClosed size={15} />
                                        Clôturer les inscriptions
                                    </button>
                                )}
                                {year.status !== 'closed' && (
                                    <button
                                        className="ay-edit"
                                        disabled={action.processing}
                                        onClick={() => {
                                            setEditing(year);
                                            setFormOpen(true);
                                        }}
                                    >
                                        <Pencil size={14} />
                                        Modifier
                                    </button>
                                )}
                            </div>
                            <Link className="ay-card-footer" href={route('dashboard.admin.academic-years.show', year.id)}>
                                Consulter l’année
                                <ArrowRight size={17} />
                            </Link>
                        </article>
                    ))}
                </div>
                {!filtered.length && (
                    <div className="ay-empty" ref={resultsPanel}>
                        <CalendarRange size={37} strokeWidth={1.3} />
                        <h2>{years.length ? 'Aucune année ne correspond.' : 'Un nouveau calendrier commence ici.'}</h2>
                        <p>
                            {years.length
                                ? 'Essayez un autre titre ou un autre statut.'
                                : 'Créez votre première année académique pour préparer les inscriptions.'}
                        </p>
                        {!years.length && (
                            <button
                                className="admin-primary"
                                onClick={() => {
                                    setEditing(null);
                                    setFormOpen(true);
                                }}
                            >
                                <Plus size={16} />
                                Créer une année
                            </button>
                        )}
                    </div>
                )}
                <Pagination value={academicYears} />
                {formOpen && <CreateAcademicYearPopup academicYear={editing} closeModal={() => setFormOpen(false)} />}
                {closing && (
                    <AdminModal
                        className="ay-close-modal"
                        title="Clôturer les inscriptions ?"
                        description="Vérifiez l’année concernée avant de confirmer cette action."
                        onClose={() => setClosing(null)}
                        formId="close-year-form"
                        submitLabel="Confirmer la clôture"
                        busy={action.processing}
                        errors={action.errors}
                    >
                        <form id="close-year-form" onSubmit={closeYear} className="admin-modal-form">
                            <div className="ay-close-target">
                                <DoorClosed size={27} strokeWidth={1.5} />
                                <div>
                                    <span>ANNÉE ACADÉMIQUE</span>
                                    <strong>{closing.title}</strong>
                                </div>
                            </div>
                            <p className="ay-close-message">
                                Les inscriptions seront fermées pour cette année. Les dossiers et les informations déjà enregistrés seront conservés.
                            </p>
                        </form>
                    </AdminModal>
                )}
            </div>
        </Dashboard>
    );
}
