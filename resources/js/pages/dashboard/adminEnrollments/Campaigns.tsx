import PageHeading from '@/components/admin/PageHeading';
import Pagination from '@/components/admin/Pagination';
import Dashboard from '@/components/layouts/Dashboard/Dashboard';
import { Head, Link, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import '../../../../css/admin-enrollments.css';

type Fields = {
    academic_program_id: number;
    academic_year_id: number;
    level_id: number;
    is_open: boolean;
    opens_on: string | null;
    closes_on: string | null;
};
type Campaign = Fields & { id: number; additional_documents: string[] | null };
type Props = {
    level: { id: number; title: string } | null;
    programs: { id: number; name: string; levels: { id: number; title: string }[] }[];
    years: { id: number; title: string }[];
    campaigns: { data: Campaign[]; links: { url: string | null; label: string; active: boolean }[] };
    success?: string;
};

export default function Campaigns({ level, programs, years, campaigns, success }: Props) {
    const form = useForm({
        academic_program_id: '',
        academic_year_id: '',
        level_id: level ? String(level.id) : '',
        is_open: true,
        opens_on: '',
        closes_on: '',
        additional_documents: '',
        reason: '',
    });
    const selected = programs.find((program) => String(program.id) === form.data.academic_program_id);
    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.post('/dashboard/admin/enrollments/campaigns', { preserveScroll: true, onSuccess: () => form.reset('reason') });
    };
    return (
        <Dashboard>
            <Head title="Campagnes d’admission" />
            <div className="admin-enrollments">
                <PageHeading
                    title="Campagnes d’admission"
                    description={
                        level
                            ? `Dates et pièces complémentaires des campagnes pour ${level.title}.`
                            : 'Configurez l’ouverture et les justificatifs complémentaires pour un programme, un niveau et une année.'
                    }
                />
                <div className="mb-4 flex flex-wrap gap-4">
                    {level ? (
                        <Link href={route('dashboard.admin.levels.details.show', { id: level.id, tab: 'conditions' })}>
                            Retour aux conditions générales du niveau
                        </Link>
                    ) : (
                        <Link href="/dashboard/admin/levels">Conditions générales par niveau</Link>
                    )}
                </div>
                {success && (
                    <p className="review-notice" role="status">
                        {success}
                    </p>
                )}
                {!programs.length && (
                    <p className="review-muted">
                        Configurez d’abord un programme dans Structure universitaire. Les formations historiques utilisent leurs conditions générales.
                    </p>
                )}
                <form className="review-filters" onSubmit={submit}>
                    <div>
                        <label htmlFor="campaign-program">Programme</label>
                        <select
                            id="campaign-program"
                            required
                            value={form.data.academic_program_id}
                            onChange={(event) =>
                                form.setData({ ...form.data, academic_program_id: event.target.value, level_id: level ? String(level.id) : '' })
                            }
                        >
                            <option value="">Choisir</option>
                            {programs.map((program) => (
                                <option key={program.id} value={program.id}>
                                    {program.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="campaign-level">Niveau</label>
                        {level ? (
                            <input id="campaign-level" value={level.title} readOnly />
                        ) : (
                            <select
                                id="campaign-level"
                                required
                                value={form.data.level_id}
                                onChange={(event) => form.setData('level_id', event.target.value)}
                            >
                                <option value="">Choisir</option>
                                {selected?.levels.map((level) => (
                                    <option key={level.id} value={level.id}>
                                        {level.title}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>
                    <div>
                        <label htmlFor="campaign-year">Année</label>
                        <select
                            id="campaign-year"
                            required
                            value={form.data.academic_year_id}
                            onChange={(event) => form.setData('academic_year_id', event.target.value)}
                        >
                            <option value="">Choisir</option>
                            {years.map((year) => (
                                <option key={year.id} value={year.id}>
                                    {year.title}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="campaign-open">État</label>
                        <select
                            id="campaign-open"
                            value={String(form.data.is_open)}
                            onChange={(event) => form.setData('is_open', event.target.value === 'true')}
                        >
                            <option value="true">Ouverte selon les dates</option>
                            <option value="false">Fermée</option>
                        </select>
                    </div>
                    {(['opens_on', 'closes_on'] as const).map((key) => (
                        <div key={key}>
                            <label htmlFor={key}>{key === 'opens_on' ? 'Ouvre le' : 'Clôture le'}</label>
                            <input id={key} type="date" value={form.data[key]} onChange={(event) => form.setData(key, event.target.value)} />
                        </div>
                    ))}
                    <div>
                        <label htmlFor="campaign-documents">Justificatifs obligatoires complémentaires (un par ligne)</label>
                        <textarea
                            id="campaign-documents"
                            value={form.data.additional_documents}
                            maxLength={2000}
                            onChange={(event) => form.setData('additional_documents', event.target.value)}
                        />
                    </div>
                    <div>
                        <label htmlFor="campaign-reason">Motif de la modification</label>
                        <input
                            id="campaign-reason"
                            required
                            minLength={5}
                            maxLength={500}
                            value={form.data.reason}
                            onChange={(event) => form.setData('reason', event.target.value)}
                        />
                    </div>
                    <button className="admin-primary" disabled={form.processing || !programs.length}>
                        Enregistrer la campagne
                    </button>
                    {Object.values(form.errors).length > 0 && (
                        <ul role="alert">
                            {Object.values(form.errors).map((error) => (
                                <li key={error}>{error}</li>
                            ))}
                        </ul>
                    )}
                </form>
                <section className="mt-6" aria-labelledby="campaigns-title">
                    <h2 id="campaigns-title" className="mb-3 text-xl font-semibold">
                        Campagnes configurées
                    </h2>
                    {!campaigns.data.length && <p className="review-muted">Aucune campagne spécifique.</p>}
                    <ul className="space-y-3">
                        {campaigns.data.map((campaign) => {
                            const program = programs.find((item) => item.id === campaign.academic_program_id);
                            return (
                                <li
                                    key={campaign.id}
                                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4"
                                >
                                    <div>
                                        <strong>
                                            {program?.name} · {program?.levels.find((level) => level.id === campaign.level_id)?.title}
                                        </strong>
                                        <p>
                                            {years.find((year) => year.id === campaign.academic_year_id)?.title} ·{' '}
                                            {campaign.is_open ? 'Ouverture selon les dates' : 'Fermée'} ·{' '}
                                            {campaign.opens_on || 'Sans date d’ouverture'} → {campaign.closes_on || 'Sans date de clôture'}
                                        </p>
                                    </div>
                                    <button
                                        className="admin-secondary"
                                        type="button"
                                        onClick={() =>
                                            form.setData({
                                                academic_program_id: String(campaign.academic_program_id),
                                                academic_year_id: String(campaign.academic_year_id),
                                                level_id: String(campaign.level_id),
                                                is_open: campaign.is_open,
                                                opens_on: campaign.opens_on ?? '',
                                                closes_on: campaign.closes_on ?? '',
                                                additional_documents: (campaign.additional_documents ?? []).join('\n'),
                                                reason: '',
                                            })
                                        }
                                    >
                                        Modifier
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                    <Pagination value={campaigns} />
                </section>
            </div>
        </Dashboard>
    );
}
