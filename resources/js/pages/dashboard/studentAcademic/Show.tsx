import AdminModal from '@/components/admin/AdminModal';
import Dashboard from '@/components/layouts/Dashboard/Dashboard';
import { documentLabels, type DocumentRow } from '@/components/student/OfficialDocumentCenter';
import { labels, money, type Balance } from '@/components/student/types';
import DossierBackLink from '@/components/system/DossierBackLink';
import { dateLabel, localDate } from '@/lib/scheduleDates';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, ArrowUpRight, GraduationCap } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import '../../../../css/dashboard/student-academic.css';
import '../../../../css/student-portal.css';

type Enrollment = {
    id: number;
    faculty: string;
    level: string;
    department: string | null;
    year: string;
    group: string | null;
    status: string;
    program: string | null;
    cohort: string | null;
    promotion: string | null;
    curriculum: { id: number; name: string; code: string; status: string } | null;
};

type TimelineItem = { id: string; action: string; date: string | null };
type Resource = { id: number; title: string; updated_at: string; url?: string | null };
type UnitResult = {
    id: number;
    code: string;
    name: string;
    period: string;
    credits: number | null;
    score: number | null;
    validated: boolean | null;
};
type Dossier = {
    requests: {
        data: {
            id: number;
            academic_enrollment_id: number;
            category: string;
            subject: string;
            body: string;
            status: string;
            response: string | null;
        }[];
        next_page_url: string | null;
    } | null;
    records: { page: number; more: boolean };
    identity: Record<string, string | null> | null;
    identityHistory: TimelineItem[];
    admission: {
        reference: string;
        decision: string;
        url: string;
        documents: { id: string; title: string; type: string; status: string; url: string }[];
    } | null;
    teaching: boolean;
    courses: { id: number; title: string; code: string | null; credits: number | null; semester: string | null }[];
    unitResults: {
        units: UnitResult[];
        average: number | null;
        earnedCredits: number | null;
        requiredCredits: number | null;
        editable: boolean;
    } | null;
    results: Resource[];
    documents: Resource[];
    attendance: { id: number; title: string; starts_at: string; status: string }[];
    finance: {
        more_payments: boolean;
        balance: Balance;
        nextDue: string | null;
        obligations: { id: number; title: string; amount_cents: number; due_at: string | null }[];
        payments: { id: number; reference: string; amount_cents: number; currency: string; status: string; created_at: string }[];
        adjustments: {
            id: number;
            type: string;
            fee_kind: string;
            amount_cents: number | null;
            schedule: { due_at: string; amount_cents: number }[] | null;
        }[];
    } | null;
    timeline: TimelineItem[];
};
const tabs = [
    'Résumé',
    'Identité',
    'Admission',
    'Parcours',
    'Académique',
    'Présences',
    'Finances',
    'Stages et mémoire',
    'Documents',
    'Demandes',
    'Historique',
    'Compte et sécurité',
] as const;
type DossierTab = (typeof tabs)[number];
const attendanceLabels: Record<string, string> = { present: 'Présent', late: 'En retard', absent: 'Absent', excused: 'Absence justifiée' };
const dossierDate = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeZone: 'UTC' });
const day = (value: string | null) => (value ? dossierDate.format(new Date(`${value.slice(0, 10)}T12:00:00Z`)) : 'À préciser');
const actionLabels: Record<string, string> = {
    student_profile_updated: 'Modification du profil',
    student_admission_activated: 'Activation de l’espace étudiant',
    academic_status_changed: 'Modification du statut académique',
    academic_progression_decided: 'Passage validé par le jury',
    academic_renewal_started: 'Réinscription lancée',
    academic_enrollment_confirmed: 'Inscription confirmée automatiquement',
    student_department_selected: 'Choix du département',
    fees_assessed: 'Établissement des frais',
    academic_unit_result_saved: 'Enregistrement d’un résultat d’UE',
};
const timelineRows = (events: TimelineItem[]) =>
    events.map((event) => [actionLabels[event.action] ?? event.action.replaceAll('_', ' '), day(event.date)]);
const isPresent = (record: Dossier['attendance'][number]) => record.status === 'present' || record.status === 'late';

function Panel({ title, children }: { title: string; children: ReactNode }) {
    return (
        <section className="portal-panel student-dossier-panel">
            <header>
                <h2>{title}</h2>
            </header>
            {children}
        </section>
    );
}

function Fields({ rows }: { rows: [string, ReactNode][] }) {
    return (
        <dl>
            {rows.map(([label, value]) => (
                <div key={label}>
                    <dt>{label}</dt>
                    <dd>{value ?? 'Non renseigné'}</dd>
                </div>
            ))}
        </dl>
    );
}

function Records({ columns, rows, empty, queryKeys }: { columns: string[]; rows: ReactNode[][]; empty: string; queryKeys?: string }) {
    if (!rows.length) return <p data-dashboard-panel={queryKeys}>{empty}</p>;
    return (
        <div className="academic-table-scroll">
            <table className="academic-table">
                <thead>
                    <tr>
                        {columns.map((column) => (
                            <th key={column} scope="col">
                                {column}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody data-dashboard-panel={queryKeys}>
                    {rows.map((row, index) => (
                        <tr key={index}>
                            {row.map((cell, position) => (
                                <td key={position}>{cell}</td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

const academicNumber = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 });
const formatScore = (score: number) => `${academicNumber.format(score)} / 20`;

function academicIndicators(results: Dossier['unitResults']): [string, ReactNode][] {
    return [
        ['Moyenne', results?.average == null ? 'Non disponible' : formatScore(results.average)],
        [
            'Crédits acquis / requis',
            results
                ? `${results.earnedCredits === null ? '—' : academicNumber.format(results.earnedCredits)} / ${results.requiredCredits === null ? '—' : academicNumber.format(results.requiredCredits)}`
                : 'Non disponibles',
        ],
    ];
}

function UnitResultForm({ academicId, unit, close }: { academicId: number; unit: UnitResult; close: () => void }) {
    const form = useForm({ score: unit.score === null ? '' : String(unit.score), validated: unit.validated ?? false });
    return (
        <AdminModal
            title={unit.score === null ? 'Saisir un résultat' : 'Modifier le résultat'}
            description={`${unit.code} · ${unit.name}`}
            formId="dossier-unit-result"
            submitLabel="Enregistrer"
            busy={form.processing}
            errors={form.errors}
            onClose={close}
        >
            <form
                id="dossier-unit-result"
                className="admin-modal-form"
                onSubmit={(event) => {
                    event.preventDefault();
                    form.put(route('dashboard.admin.student-academic.unit-results.update', [academicId, unit.id]), {
                        preserveScroll: true,
                        onSuccess: close,
                    });
                }}
            >
                <label className="admin-field">
                    Note sur 20 *
                    <input
                        type="number"
                        min={0}
                        max={20}
                        step={0.01}
                        required
                        value={form.data.score}
                        onChange={(event) => form.setData('score', event.target.value)}
                    />
                </label>
                <label>
                    <input type="checkbox" checked={form.data.validated} onChange={(event) => form.setData('validated', event.target.checked)} /> UE
                    validée
                </label>
                <p>Les crédits sont acquis lorsque l’UE est validée.</p>
            </form>
        </AdminModal>
    );
}

function UnitResults({ results, academicId }: { results: Dossier['unitResults']; academicId: number }) {
    const [editing, setEditing] = useState<UnitResult | null>(null);
    return (
        <Panel title="Notes par unité d’enseignement">
            <Fields rows={academicIndicators(results)} />
            {results?.units.length ? (
                <>
                    <p>La moyenne porte sur les notes saisies. Les crédits acquis proviennent des UE validées.</p>
                    <Records
                        columns={['UE', 'Période', 'Note / 20', 'Validation', 'Crédits acquis / requis', ...(results.editable ? ['Action'] : [])]}
                        rows={results.units.map((unit) => [
                            `${unit.code} · ${unit.name}`,
                            unit.period,
                            unit.score === null ? 'À saisir' : academicNumber.format(unit.score),
                            unit.validated === null ? 'En attente' : unit.validated ? 'Validée' : 'Non validée',
                            `${unit.validated === null || unit.credits === null ? '—' : academicNumber.format(unit.validated ? unit.credits : 0)} / ${unit.credits === null ? '—' : academicNumber.format(unit.credits)}`,
                            ...(results.editable
                                ? [
                                      <button key={unit.id} type="button" className="admin-secondary" onClick={() => setEditing(unit)}>
                                          {unit.score === null ? 'Saisir' : 'Modifier'}
                                      </button>,
                                  ]
                                : []),
                        ])}
                        empty="Aucune unité d’enseignement."
                    />
                </>
            ) : (
                <p>Rattachez l’inscription à une maquette publiée qui contient les UE de ce niveau pour consulter ou saisir les résultats.</p>
            )}
            {editing && <UnitResultForm academicId={academicId} unit={editing} close={() => setEditing(null)} />}
        </Panel>
    );
}

function DossierSection({
    tab,
    data,
    financeUrl,
    academicId,
    teachingSubmissionsUrl,
}: {
    tab: DossierTab;
    data: Dossier;
    financeUrl: string;
    academicId: number;
    teachingSubmissionsUrl: string | null;
}) {
    const { identity, admission, attendance, finance } = data;
    switch (tab) {
        case 'Résumé':
            return (
                <Panel title="Indicateurs de l’inscription">
                    <Fields
                        rows={[
                            ...academicIndicators(data.unitResults),
                            [
                                'Taux de présence',
                                attendance.length
                                    ? `${Math.round((attendance.filter(isPresent).length * 100) / attendance.length)} % sur ${attendance.length} séances relevées`
                                    : 'Non disponible',
                            ],
                            ['Solde', finance?.balance.assessed ? money(finance.balance.balance_cents, finance.balance.currency) : 'Non disponible'],
                            [
                                'Prochaine échéance à régler',
                                finance ? (finance.nextDue ? day(finance.nextDue) : 'Aucune échéance datée') : 'Non disponible',
                            ],
                        ]}
                    />
                </Panel>
            );
        case 'Identité':
            return identity ? (
                <>
                    <Panel title="Coordonnées et personne à prévenir">
                        <Fields
                            rows={[
                                ['Téléphone', identity.phone],
                                ['Adresse', identity.home_address],
                                ['Commune', identity.residence_commune],
                                ['Date de naissance', identity.birth_date],
                                ['Lieu de naissance', identity.birth_place],
                                ['Personne à prévenir', identity.emergency_name],
                                ['Lien', identity.emergency_relationship],
                                ['Téléphone d’urgence', identity.emergency_phone],
                                ['Adresse d’urgence', identity.emergency_address],
                            ]}
                        />
                    </Panel>
                    <Panel title="Pièces d’identité">
                        <Records
                            columns={['Pièce', 'Vérification']}
                            rows={(admission?.documents ?? [])
                                .filter((item) => ['id_card', 'birth_certificate'].includes(item.type))
                                .map((item) => [
                                    <a key={item.id} href={item.url}>
                                        {item.title}
                                    </a>,
                                    labels[item.status] || item.status || 'À vérifier',
                                ])}
                            empty="Aucune pièce d’identité enregistrée."
                        />
                    </Panel>
                    <Panel title="Historique des modifications">
                        <Records
                            queryKeys="records_page"
                            columns={['Action', 'Date']}
                            rows={timelineRows(data.identityHistory)}
                            empty="Aucune modification enregistrée."
                        />
                    </Panel>
                </>
            ) : (
                <Panel title="Identité">
                    <p>Les coordonnées et les pièces d’identité sont réservées au service habilité.</p>
                </Panel>
            );
        case 'Admission':
            return (
                <Panel title="Candidature et décision">
                    {admission ? (
                        <>
                            <Fields
                                rows={[
                                    ['Référence', admission.reference],
                                    ['Décision', admission.decision],
                                ]}
                            />
                            <div className="student-dossier-links">
                                <Link href={admission.url}>
                                    Ouvrir le dossier de candidature <ArrowUpRight size={15} aria-hidden="true" />
                                </Link>
                            </div>
                            <Records
                                columns={['Pièce fournie', 'Vérification']}
                                rows={admission.documents.map((item) => [
                                    <a key={item.id} href={item.url}>
                                        {item.title}
                                    </a>,
                                    labels[item.status] || item.status || 'À vérifier',
                                ])}
                                empty="Aucune pièce enregistrée."
                            />
                        </>
                    ) : (
                        <p>Le dossier d’admission est réservé au service habilité.</p>
                    )}
                </Panel>
            );
        case 'Académique':
            return data.teaching ? (
                <>
                    <UnitResults results={data.unitResults} academicId={academicId} />
                    {teachingSubmissionsUrl && (
                        <Panel title="Dépôts pédagogiques">
                            <Link className="admin-secondary" href={teachingSubmissionsUrl}>
                                Consulter les travaux remis
                            </Link>
                        </Panel>
                    )}
                    <Panel title="Plan d’études">
                        <Records
                            columns={['Cours', 'Code', 'Semestre', 'Crédits prévus']}
                            rows={data.courses.map((course) => [course.title, course.code ?? '—', course.semester ?? '—', course.credits ?? '—'])}
                            empty="Aucun cours disponible pour cette inscription."
                        />
                    </Panel>
                    <Panel title="Résultats publiés">
                        <Records
                            queryKeys="records_page"
                            columns={['Résultat', 'Date']}
                            rows={data.results.map((item) => [item.title, day(item.updated_at)])}
                            empty="Aucun résultat individuel publié."
                        />
                    </Panel>
                </>
            ) : (
                <Panel title="Académique">
                    <p>Le plan d’études et les résultats sont réservés au service habilité.</p>
                </Panel>
            );
        case 'Présences': {
            const months = [...new Set(attendance.map((record) => localDate(record.starts_at).slice(0, 7)))].sort();
            return (
                <Panel title="Assiduité — page consultée">
                    {data.teaching ? (
                        <>
                            {months.length > 0 && (
                                <div className="student-dossier-attendance">
                                    {months.map((month) => {
                                        const records = attendance.filter((record) => localDate(record.starts_at).startsWith(month));
                                        const rate = Math.round((records.filter(isPresent).length * 100) / records.length);
                                        return (
                                            <div key={month}>
                                                <span>
                                                    {new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
                                                        new Date(`${month}-01T12:00:00Z`),
                                                    )}
                                                </span>
                                                <meter aria-label={`Présence en ${month}`} value={rate} min={0} max={100} />
                                                <strong>{rate} %</strong>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                            <Records
                                queryKeys="records_page"
                                columns={['Séance', 'Date', 'Présence']}
                                rows={attendance.map((item) => [
                                    item.title,
                                    dateLabel(localDate(item.starts_at)),
                                    attendanceLabels[item.status] || item.status,
                                ])}
                                empty="Aucune présence ni absence enregistrée."
                            />
                        </>
                    ) : (
                        <p>Les relevés de présence sont réservés au service habilité.</p>
                    )}
                </Panel>
            );
        }
        case 'Finances':
            return finance ? (
                <>
                    <Panel title="Situation financière">
                        <Fields
                            rows={[
                                ['Solde', finance.balance.assessed ? money(finance.balance.balance_cents, finance.balance.currency) : 'À établir'],
                                [
                                    'État du quitus financier',
                                    labels[finance.balance.financial_clearance_status] || finance.balance.financial_clearance_status,
                                ],
                                ['Prochaine échéance à régler', finance.nextDue ? day(finance.nextDue) : 'Aucune échéance datée'],
                            ]}
                        />
                        <div className="student-dossier-links">
                            <Link href={financeUrl}>
                                Ouvrir le suivi financier <ArrowUpRight size={15} aria-hidden="true" />
                            </Link>
                        </div>
                    </Panel>
                    <Panel title="Frais et échéances">
                        <Records
                            columns={['Libellé', 'Montant', 'Échéance']}
                            rows={finance.obligations.map((item) => [
                                item.title,
                                money(item.amount_cents, finance.balance.currency),
                                day(item.due_at),
                            ])}
                            empty="Aucun frais établi."
                        />
                    </Panel>
                    <Panel title="Paiements">
                        <Records
                            queryKeys="records_page"
                            columns={['Référence', 'Montant', 'Statut', 'Date']}
                            rows={finance.payments.map((item) => [
                                item.reference,
                                money(item.amount_cents, item.currency),
                                labels[item.status] || item.status,
                                day(item.created_at),
                            ])}
                            empty="Aucun paiement enregistré."
                        />
                    </Panel>
                    <Panel title="Bourses, exonérations et échéanciers">
                        <Records
                            columns={['Type', 'Détail']}
                            rows={finance.adjustments.map((item) => [
                                ({ scholarship: 'Bourse', exemption: 'Exonération', plan: 'Échéancier' } as Record<string, string>)[item.type] ||
                                    item.type,
                                item.schedule
                                    ? item.schedule
                                          .map((row) => `${day(row.due_at)} · ${money(row.amount_cents, finance.balance.currency)}`)
                                          .join(' / ')
                                    : item.amount_cents === null
                                      ? '—'
                                      : money(item.amount_cents, finance.balance.currency),
                            ])}
                            empty="Aucun dispositif actif."
                        />
                    </Panel>
                </>
            ) : (
                <Panel title="Finances">
                    <p>Les données financières sont réservées au service habilité.</p>
                </Panel>
            );
        case 'Stages et mémoire':
            return (
                <Panel title="Stages et mémoire">
                    <p>Les conventions, les rapports et les soutenances ne sont pas encore gérés dans ce dossier.</p>
                </Panel>
            );
        case 'Documents':
            return (
                <Panel title="Documents émis">
                    {data.teaching ? (
                        <Records
                            queryKeys="records_page"
                            columns={['Document', 'Date']}
                            rows={data.documents.map((item) => [
                                item.url ? (
                                    <a key={item.id} href={item.url}>
                                        {item.title}
                                    </a>
                                ) : (
                                    item.title
                                ),
                                day(item.updated_at),
                            ])}
                            empty="Aucun document individuel publié pour cette inscription."
                        />
                    ) : (
                        <p>Les documents sont réservés au service habilité.</p>
                    )}
                </Panel>
            );
        case 'Demandes':
            return (
                <Panel title="Demandes et réclamations">
                    {data.requests ? (
                        <Records
                            queryKeys="records_page"
                            columns={['Inscription', 'Catégorie', 'Demande', 'Statut', 'Réponse', 'Action']}
                            rows={data.requests.data.map((item) => [
                                item.academic_enrollment_id,
                                item.category,
                                <span key={item.id}>
                                    <strong>{item.subject}</strong>
                                    <br />
                                    {item.body}
                                </span>,
                                labels[item.status] || item.status,
                                item.response || 'En attente',
                                <Link
                                    key={`action-${item.id}`}
                                    href={route('dashboard.admin.student-academic.index', { tab: 'requests', academic: item.academic_enrollment_id })}
                                >
                                    Traiter
                                </Link>,
                            ])}
                            empty="Aucune demande enregistrée."
                        />
                    ) : (
                        <p>Accès réservé au service habilité.</p>
                    )}
                </Panel>
            );
        case 'Compte et sécurité':
            return null;
        case 'Historique':
            return (
                <Panel title="Chronologie du dossier">
                    {data.teaching ? (
                        <Records
                            queryKeys="records_page"
                            columns={['Événement', 'Date']}
                            rows={timelineRows(data.timeline)}
                            empty="Aucun événement enregistré."
                        />
                    ) : (
                        <p>Le journal est réservé au service habilité.</p>
                    )}
                </Panel>
            );
        case 'Parcours':
            return null;
    }
}

type Progression = {
    kind?: string;
    due_on?: string | null;
    retakes?: { item_id: number; name: string }[];
    level: string;
    year: string;
    reason: string;
    target_id: number | null;
    status: string | null;
};
type ProgressionOptions = {
    mode?: string | null;
    officialResultId?: number | null;
    levels: { id: number; title: string }[];
    years: { id: number; title: string }[];
};

function ProgressionPanel({
    academicId,
    decision,
    options,
}: {
    academicId: number;
    decision: Progression | null;
    options: ProgressionOptions | null;
}) {
    const form = useForm({
        level_id: '',
        academic_year_id: '',
        reason: '',
        due_on: '',
        target_curriculum_version_id: '',
        academic_official_result_id: options?.officialResultId,
    });
    if (decision && !options) {
        return (
            <Panel title="Décision de passage">
                <p>
                    <strong>{decision.level}</strong> · {decision.year}
                </p>
                <p>{decision.reason}</p>
                {decision.due_on && <p>Échéance de reprise {decision.due_on}</p>}
                {!!decision.retakes?.length && (
                    <ul>
                        {decision.retakes.map((item) => (
                            <li key={item.item_id}>{item.name}</li>
                        ))}
                    </ul>
                )}
                {decision.target_id ? (
                    <Link href={route('dashboard.admin.student-academic.show', decision.target_id)}>
                        {labels[decision.status ?? ''] || decision.status} · Consulter la réinscription
                    </Link>
                ) : (
                    <p>En attente de la démarche de l’étudiant.</p>
                )}
            </Panel>
        );
    }
    if (!options) return null;

    return (
        <Panel title="Décision de passage">
            {decision && <p>Confirmez la destination à partir de la nouvelle décision officielle.</p>}
            {options.levels.length > 0 && options.years.length > 0 ? (
                <form
                    className="portal-form"
                    onSubmit={(event) => {
                        event.preventDefault();
                        form.post(route('dashboard.admin.student-academic.progression', academicId), { preserveScroll: true });
                    }}
                >
                    <label>
                        Niveau de destination
                        <select required value={form.data.level_id} onChange={(event) => form.setData('level_id', event.target.value)}>
                            <option value="">Choisir le niveau</option>
                            {options.levels.map((level) => (
                                <option key={level.id} value={level.id}>
                                    {level.title}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label>
                        Nouvelle année académique
                        <select
                            required
                            value={form.data.academic_year_id}
                            onChange={(event) => form.setData('academic_year_id', event.target.value)}
                        >
                            <option value="">Choisir l’année</option>
                            {options.years.map((year) => (
                                <option key={year.id} value={year.id}>
                                    {year.title}
                                </option>
                            ))}
                        </select>
                    </label>
                    {options.mode === 'conditional' && (
                        <label>
                            Échéance du plan de reprise
                            <input type="date" required value={form.data.due_on} onChange={(event) => form.setData('due_on', event.target.value)} />
                        </label>
                    )}
                    {options.officialResultId && (
                        <label>
                            Maquette cible (ID, si plusieurs versions compatibles)
                            <input
                                type="number"
                                min="1"
                                value={form.data.target_curriculum_version_id}
                                onChange={(event) => form.setData('target_curriculum_version_id', event.target.value)}
                            />
                        </label>
                    )}
                    <label>
                        Référence ou motif de la décision du jury
                        <textarea
                            required
                            minLength={5}
                            maxLength={1000}
                            value={form.data.reason}
                            onChange={(event) => form.setData('reason', event.target.value)}
                        />
                    </label>
                    {Object.values(form.errors).map((error) => (
                        <p className="portal-alert" role="alert" key={error}>
                            {error}
                        </p>
                    ))}
                    <button className="portal-primary" disabled={form.processing}>
                        Publier le passage
                    </button>
                </form>
            ) : (
                <p>Un niveau de destination et une année ultérieure doivent être configurés pour publier le passage.</p>
            )}
        </Panel>
    );
}

type Props = {
    financialSummary: Balance | null;
    section: DossierTab;
    account: { email: string; verified: boolean; linked: boolean; canManage: boolean; canRevoke: boolean } | null;
    card: {
        request: { status: string; decision_note: string | null } | null;
        issuance: { printed_at: string; collected_at: string | null } | null;
        photo: boolean;
        matricule: boolean;
        identity: boolean;
    } | null;
    lifecycleUrl?: string | null;
    lifecycleHistory?: { reference: string; academic_enrollment_id: number; kind: string; status: string; decided_at: string }[];
    progression: Progression | null;
    progressionOptions: ProgressionOptions | null;
    documentRegistry?: { url: string; rows: DocumentRow[] } | null;

    officialHistory?: {
        id: number;
        run_id: number;
        reference: string;
        edition: number;
        session: string;
        decision: string;
        average: string | null;
        earned: number;
    }[];
    student: { name: string; matricule: string | null; email: string | null; status: string; photo_url: string | null };
    academicId: number;
    dossier: Dossier;
    enrollments: Enrollment[];
    currentEnrollment: Enrollment;
    enrollmentPagination: { page: number; more: boolean };
    directoryFilters: Record<string, string | number>;
    abilities: { access: boolean; finance: boolean };
    teachingSubmissionsUrl: string | null;
};

export default function Show({
    documentRegistry,
    student,
    academicId,
    enrollments,
    directoryFilters,
    abilities,
    dossier,
    lifecycleUrl,
    lifecycleHistory,
    progression,
    progressionOptions,
    officialHistory,
    section: tab,
    account,
    card,
    currentEnrollment,
    enrollmentPagination,
    financialSummary,
    teachingSubmissionsUrl,
}: Props) {
    const enrollment = currentEnrollment;
    const directory = route('dashboard.admin.student-academic.index', { ...directoryFilters, tab: 'students' });
    const details = enrollment && [
        ['Année académique', enrollment.year],
        ['Faculté', enrollment.faculty],
        ['Programme', enrollment.program],
        ['Cohorte d’admission', enrollment.cohort ?? 'Non rattachée'],
        ['Promotion annuelle', enrollment.promotion ?? 'Non affectée'],
        ['Maquette applicable', enrollment.curriculum ? `${enrollment.curriculum.code} · ${enrollment.curriculum.name}` : 'Non rattachée'],
        ['Niveau', enrollment.level],
        ['Département', enrollment.department],
        ['Groupe', enrollment.group],
        ['Statut de l’inscription', labels[enrollment.status] || enrollment.status],
    ];

    return (
        <Dashboard hideAppsNavigation>
            <Head title={`Dossier étudiant 360° · ${student.name}`} />
            <div className="student-portal academic-administration">
                <DossierBackLink className="student-dossier-back" href={directory}>
                    <ArrowLeft size={17} aria-hidden="true" />{' '}
                    {directoryFilters.history
                        ? 'Retour à l’historique des inscriptions'
                        : directoryFilters.enrollment_status
                          ? 'Retour aux inscriptions'
                          : 'Retour au répertoire'}
                </DossierBackLink>
                <header className="directory-heading">
                    <div>
                        <p className="directory-heading-label">
                            <GraduationCap size={17} aria-hidden="true" /> Dossier étudiant 360°
                        </p>
                        {student.photo_url && (
                            <img
                                src={student.photo_url}
                                alt={`Portrait de ${student.name}`}
                                width={72}
                                height={72}
                                style={{ borderRadius: 12, objectFit: 'cover' }}
                            />
                        )}
                        <h1>{student.name}</h1>
                        <p>
                            {student.matricule || 'Matricule à renseigner'}
                            {student.email && ` · ${student.email}`}
                        </p>
                    </div>
                    <span className={`portal-status is-${student.status}`}>{labels[student.status] || student.status}</span>
                </header>

                <nav className="student-dossier-tabs" aria-label="Sections du dossier 360°">
                    {tabs.map((item) => (
                        <Link
                            key={item}
                            href={route('dashboard.admin.student-academic.show', academicId)}
                            data={{ ...directoryFilters, section: item }}
                            preserveScroll
                            aria-current={tab === item ? 'page' : undefined}
                        >
                            {item}
                        </Link>
                    ))}
                </nav>
                {tab === 'Résumé' && (
                    <>
                        <Panel title="Vue d’ensemble">
                            <Fields rows={(details as [string, ReactNode][]) || []} />
                        </Panel>
                        {financialSummary && (
                            <Panel title="Résumé financier">
                                <p>
                                    {financialSummary.assessed
                                        ? money(financialSummary.balance_cents, financialSummary.currency)
                                        : 'Frais à établir par le service financier'}
                                </p>
                                <Link href={route('dashboard.admin.student-academic.show', { academic: academicId, section: 'Finances' })}>
                                    Consulter la situation financière
                                </Link>
                            </Panel>
                        )}
                        {account && (
                            <Panel title="Compte lié">
                                <Fields
                                    rows={[
                                        ['Email de connexion', account.email],
                                        ['Vérification', account.verified ? 'Email vérifié' : 'Email à vérifier'],
                                    ]}
                                />
                            </Panel>
                        )}
                        {card && (
                            <Panel title="Carte étudiante">
                                <Fields
                                    rows={[
                                        ['Identité', card.identity ? 'Renseignée' : 'À compléter'],
                                        ['Matricule', card.matricule ? 'Attribué' : 'Manquant'],
                                        ['Photo', card.photo ? 'Déposée — validation dans le module Cartes' : 'À déposer'],
                                        ['Demande', card.request ? labels[card.request.status] || card.request.status : 'Aucune demande'],
                                        [
                                            'Délivrance',
                                            card.issuance?.collected_at
                                                ? 'Retirée'
                                                : card.issuance
                                                  ? 'Imprimée, en attente de retrait'
                                                  : 'Non imprimée',
                                        ],
                                    ]}
                                />
                                <p>L’éligibilité complète est vérifiée par le module Cartes.</p>
                            </Panel>
                        )}
                    </>
                )}
                {tab === 'Compte et sécurité' && <AccountPanel account={account} academicId={academicId} />}
                {tab !== 'Parcours' && tab !== 'Résumé' && (
                    <DossierSection
                        tab={tab}
                        data={dossier}
                        academicId={academicId}
                        financeUrl={route('dashboard.admin.student-academic.index', { tab: 'finance', academic: academicId })}
                        teachingSubmissionsUrl={teachingSubmissionsUrl}
                    />
                )}
                {tab === 'Documents' && documentRegistry && (
                    <Panel title="Registre des documents officiels">
                        <Records
                            columns={['Document', 'Numéro', 'Validité']}
                            rows={documentRegistry.rows.map((row) => [row.name, row.number, documentLabels[row.validity]])}
                            empty="Aucun document enregistré pour cette inscription."
                        />
                        <Link className="admin-secondary" href={documentRegistry.url}>
                            Ouvrir le registre de cette inscription
                        </Link>
                    </Panel>
                )}
                {(['Présences', 'Historique', 'Identité', 'Demandes', 'Finances', 'Documents', 'Académique'] as string[]).includes(tab) && (
                    <nav aria-label="Pagination des données" className="student-dossier-links">
                        {dossier.records.page > 1 && (
                            <Link
                                href={route('dashboard.admin.student-academic.show', academicId)}
                                data={{ ...directoryFilters, section: tab, records_page: dossier.records.page - 1 }}
                                preserveScroll
                            >
                                Précédent
                            </Link>
                        )}
                        {(dossier.records.more || dossier.requests?.next_page_url || dossier.finance?.more_payments) && (
                            <Link
                                href={route('dashboard.admin.student-academic.show', academicId)}
                                data={{ ...directoryFilters, section: tab, records_page: dossier.records.page + 1 }}
                                preserveScroll
                            >
                                Suivant
                            </Link>
                        )}
                    </nav>
                )}
                {tab === 'Parcours' && (
                    <>
                        {details && (
                            <section className="portal-panel student-dossier-panel" aria-labelledby="dossier-enrollment">
                                <header>
                                    <h2 id="dossier-enrollment">Inscription consultée</h2>
                                    <Link href={route('dashboard.admin.student-academic.administration', { academic: academicId })}>
                                        Situations et décisions administratives
                                    </Link>
                                </header>
                                <dl>
                                    {details.map(([label, value]) => (
                                        <div key={label}>
                                            <dt>{label}</dt>
                                            <dd>{value || 'Non renseigné'}</dd>
                                        </div>
                                    ))}
                                </dl>
                                {(abilities.access || abilities.finance) && (
                                    <div className="student-dossier-links">
                                        {abilities.access && (
                                            <Link className="admin-secondary" href={directory} data={{ tab: 'students', academic: academicId }}>
                                                Gérer les affectations <ArrowUpRight size={15} aria-hidden="true" />
                                            </Link>
                                        )}
                                        {abilities.finance && (
                                            <Link className="admin-secondary" href={directory} data={{ tab: 'finance', academic: academicId }}>
                                                Ouvrir le suivi financier <ArrowUpRight size={15} aria-hidden="true" />
                                            </Link>
                                        )}
                                    </div>
                                )}
                            </section>
                        )}

                        {!!officialHistory?.length && (
                            <Panel title="Historique des résultats officiels">
                                <ul>
                                    {officialHistory.map((row) => (
                                        <li key={row.id}>
                                            {row.session} · Édition {row.edition} · {row.decision} · {row.average ?? '—'} · {row.earned / 100}{' '}
                                            crédits.
                                        </li>
                                    ))}
                                </ul>
                            </Panel>
                        )}
                        {!!lifecycleHistory?.length && (
                            <Panel title="Historique du parcours">
                                <ul>
                                    {lifecycleHistory.map((event) => (
                                        <li key={event.reference}>
                                            {day(event.decided_at)} ·{' '}
                                            {
                                                (
                                                    {
                                                        interruption: 'Interruption',
                                                        resumption: 'Reprise d’études',
                                                        reorientation: 'Réorientation',
                                                        external_transfer: 'Transfert externe',
                                                        cycle: 'Changement de cycle',
                                                        graduation: 'Fin de cursus',
                                                    } as Record<string, string>
                                                )[event.kind]
                                            }{' '}
                                            · {event.status === 'approved' ? 'Approuvé' : 'Refusé'} · Inscription {event.academic_enrollment_id}
                                        </li>
                                    ))}
                                </ul>
                            </Panel>
                        )}
                        {lifecycleUrl && (
                            <Link className="admin-secondary" href={lifecycleUrl}>
                                Historique et dossiers de parcours
                            </Link>
                        )}
                        <ProgressionPanel key={academicId} academicId={academicId} decision={progression} options={progressionOptions} />
                        <section className="portal-panel" aria-labelledby="dossier-history">
                            <header>
                                <h2 id="dossier-history">Historique des inscriptions</h2>
                            </header>
                            <div className="academic-table-scroll">
                                <table className="academic-table">
                                    <thead>
                                        <tr>
                                            <th>Année</th>
                                            <th>Faculté</th>
                                            <th>Niveau</th>
                                            <th>Statut</th>
                                            <th>Inscription</th>
                                        </tr>
                                    </thead>
                                    <tbody data-dashboard-panel="enrollments_page">
                                        {enrollments.map((item) => (
                                            <tr key={item.id}>
                                                <td>{item.year}</td>
                                                <td>{item.faculty}</td>
                                                <td>{item.level}</td>
                                                <td>{labels[item.status] || item.status}</td>
                                                <td>
                                                    {item.id === academicId ? (
                                                        'Affichée'
                                                    ) : (
                                                        <Link href={route('dashboard.admin.student-academic.show', item.id)} data={directoryFilters}>
                                                            Consulter
                                                        </Link>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <nav aria-label="Pagination des inscriptions" className="student-dossier-links">
                                {enrollmentPagination.page > 1 && (
                                    <Link
                                        href={route('dashboard.admin.student-academic.show', academicId)}
                                        data={{ ...directoryFilters, section: 'Parcours', enrollments_page: enrollmentPagination.page - 1 }}
                                        preserveScroll
                                    >
                                        Précédent
                                    </Link>
                                )}
                                {enrollmentPagination.more && (
                                    <Link
                                        href={route('dashboard.admin.student-academic.show', academicId)}
                                        data={{ ...directoryFilters, section: 'Parcours', enrollments_page: enrollmentPagination.page + 1 }}
                                        preserveScroll
                                    >
                                        Suivant
                                    </Link>
                                )}
                            </nav>
                        </section>
                    </>
                )}
            </div>
        </Dashboard>
    );
}

function AccountPanel({ account, academicId }: { account: Props['account']; academicId: number }) {
    const form = useForm({ action: account?.verified ? 'revoke' : 'verify', reason: '' });
    if (!account)
        return (
            <Panel title="Compte et sécurité">
                <p>Accès réservé au service habilité.</p>
            </Panel>
        );
    return (
        <Panel title="Compte et sécurité">
            <Fields
                rows={[
                    ['Compte', account.linked ? 'Lié au dossier permanent' : 'Non lié'],
                    ['Email de connexion', account.email],
                    ['Email', account.verified ? 'Vérifié' : 'À vérifier'],
                ]}
            />
            <p>
                L’activation académique et la vérification de l’email sont distinctes. La suspension académique ne désactive pas le compte de
                connexion.
            </p>
            {account.canManage && (!account.verified || account.canRevoke) && (
                <form
                    className="portal-form"
                    onSubmit={(event) => {
                        event.preventDefault();
                        form.post(route('dashboard.admin.student-academic.account', academicId), {
                            preserveScroll: true,
                            onSuccess: () => form.reset('reason'),
                        });
                    }}
                >
                    <label>
                        Action
                        <select value={form.data.action} onChange={(event) => form.setData('action', event.target.value)}>
                            <option value="verify" disabled={account.verified}>
                                Renvoyer le lien de vérification de l’email
                            </option>
                            {account.canRevoke && <option value="revoke">Révoquer les sessions et jetons d’accès</option>}
                        </select>
                    </label>
                    <label>
                        Justification
                        <textarea
                            required
                            minLength={10}
                            maxLength={1000}
                            value={form.data.reason}
                            onChange={(event) => form.setData('reason', event.target.value)}
                        />
                    </label>
                    {Object.values(form.errors).map((error) => (
                        <p role="alert" key={error}>
                            {error}
                        </p>
                    ))}
                    <button className="portal-primary" disabled={form.processing || (form.data.action === 'verify' && account.verified)}>
                        Exécuter l’action
                    </button>
                </form>
            )}
        </Panel>
    );
}
