import PageHeading from '@/components/admin/PageHeading';
import Dashboard from '@/components/layouts/Dashboard/Dashboard';
import { Head, Link } from '@inertiajs/react';
import { ArrowRight, ClipboardCheck, FileCheck2, FilePlus2, Inbox } from 'lucide-react';
import '../../../../css/admin-enrollments.css';
import { applicantName, type Applicant } from './types';

const admissions = '/dashboard/admin/enrollments';
const queues = [
    { key: 'new', title: 'Nouvelles candidatures', detail: 'Dossiers reçus, analyse à démarrer', href: '?queue=new', icon: Inbox },
    { key: 'review', title: 'Dossiers à vérifier', detail: 'Dossiers en cours d’analyse', href: '?queue=review', icon: ClipboardCheck },
    { key: 'reexamination', title: 'Pièces corrigées reçues', detail: 'Dossiers à réexaminer', href: '?reexamination=1', icon: FilePlus2 },
] as const;
const decisionDate = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeZone: 'Africa/Kinshasa' });

type Entry = {
    id: number;
    reference: string;
    candidate: Omit<Applicant, 'email'> | null;
    formation: string | null;
    status: string;
};
type Props = {
    counts: Record<(typeof queues)[number]['key'], number>;
    priorities: (Entry & { corrected_count: number })[];
    decisions: (Entry & { decided_at: string })[];
};

const rowClass =
    'group flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-5 py-4 transition-colors hover:bg-[#f5f7f0] focus-visible:bg-[#f5f7f0] focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-emerald-800 sm:px-6';

function DossierIdentity({ entry }: { entry: Entry }) {
    return (
        <div className="min-w-0 flex-1 basis-44">
            <span className="block text-sm font-semibold break-words">{applicantName(entry.candidate)}</span>
            <span className="admission-overview-muted mt-1 block text-xs">
                {entry.reference}
                {entry.formation && ` · ${entry.formation}`}
            </span>
        </div>
    );
}

export default function Overview({ counts, priorities, decisions }: Props) {
    return (
        <Dashboard>
            <Head title="Vue d’ensemble des admissions" />
            <div className="admin-enrollments">
                <PageHeading
                    title="Vue d’ensemble des admissions"
                    description="Repérez les dossiers à traiter et retrouvez les décisions récentes."
                    action={
                        <Link href={admissions} className="admin-primary">
                            Toutes les candidatures <ArrowRight size={16} aria-hidden="true" />
                        </Link>
                    }
                />

                <section aria-label="Files d’admission" className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {queues.map(({ key, title, detail, href, icon: Icon }) => (
                        <Link
                            key={key}
                            href={admissions + href}
                            className="group flex min-w-0 flex-col rounded-[10px] border border-[#dfe6d6] bg-white p-5 transition-colors hover:border-[#849a7a] hover:bg-[var(--usk-night-raised,#f8faf5)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800 sm:p-6"
                        >
                            <div className="mb-4 flex items-center justify-between gap-2">
                                <span className="grid size-10 place-items-center rounded-lg bg-[#edf2e5] text-[#426044]">
                                    <Icon size={20} aria-hidden="true" />
                                </span>
                                <ArrowRight
                                    size={18}
                                    aria-hidden="true"
                                    className="admission-overview-muted transition-transform group-hover:translate-x-1"
                                />
                            </div>
                            <strong className="text-3xl leading-none tabular-nums">{counts[key].toLocaleString('fr-FR')}</strong>
                            <span className="mt-2 text-sm font-semibold">{title}</span>
                            <span className="admission-overview-muted mt-1 text-xs leading-relaxed">{detail}</span>
                        </Link>
                    ))}
                </section>

                <section className="review-list mb-5" aria-labelledby="admission-priorities">
                    <header>
                        <div>
                            <h2 id="admission-priorities">À traiter en priorité</h2>
                            <p className="admission-overview-muted mt-1 text-sm">
                                Les pièces corrigées d’abord, puis les candidatures reçues les plus anciennes.
                            </p>
                        </div>
                    </header>
                    {priorities.length ? (
                        <ul className="divide-y divide-[#e8ede3]">
                            {priorities.map((entry) => (
                                <li key={entry.id}>
                                    <Link href={`${admissions}/${entry.id}`} className={rowClass}>
                                        <DossierIdentity entry={entry} />
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-medium ${entry.corrected_count ? 'bg-[#f6eed8] text-[#73551d]' : 'bg-[#edf2e5] text-[#426044]'}`}
                                        >
                                            {entry.corrected_count
                                                ? `${entry.corrected_count} pièce${entry.corrected_count > 1 ? 's' : ''} à réexaminer`
                                                : 'Nouvelle candidature'}
                                        </span>
                                        <ArrowRight size={16} aria-hidden="true" className="admission-overview-muted shrink-0" />
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="admission-overview-muted flex items-center gap-3 px-6 py-6 text-sm">
                            <Inbox size={18} aria-hidden="true" /> Aucun dossier prioritaire pour le moment.
                        </p>
                    )}
                </section>

                <section className="review-list" aria-labelledby="admission-decisions">
                    <header>
                        <div>
                            <h2 id="admission-decisions">Dernières décisions</h2>
                            <p className="admission-overview-muted mt-1 text-sm">Les dernières admissions et les derniers refus enregistrés.</p>
                        </div>
                    </header>
                    {decisions.length ? (
                        <ul className="divide-y divide-[#e8ede3]">
                            {decisions.map((entry) => (
                                <li key={entry.id}>
                                    <Link href={`${admissions}/${entry.id}`} className={rowClass}>
                                        <DossierIdentity entry={entry} />
                                        <time dateTime={entry.decided_at} className="admission-overview-muted text-xs">
                                            {decisionDate.format(new Date(entry.decided_at))}
                                        </time>
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-medium ${entry.status === 'validated' ? 'bg-[#edf2e5] text-[#426044]' : 'bg-[#f9ede5] text-[#854835]'}`}
                                        >
                                            {entry.status === 'validated' ? 'Admis' : 'Refusé'}
                                        </span>
                                        <ArrowRight size={16} aria-hidden="true" className="admission-overview-muted shrink-0" />
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="admission-overview-muted flex items-center gap-3 px-6 py-6 text-sm">
                            <FileCheck2 size={18} aria-hidden="true" /> Aucune décision récente enregistrée.
                        </p>
                    )}
                </section>
            </div>
        </Dashboard>
    );
}
