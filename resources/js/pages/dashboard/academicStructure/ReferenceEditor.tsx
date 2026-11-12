import AdminModal from '@/components/admin/AdminModal';
import Alert from '@/utils/sweetAlert';
import { useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { labels, messages, type Props, type ReferenceKind, type Row } from './types';

type EditorContext = {
    institution: Pick<NonNullable<Props['institution']>, 'id' | 'name' | 'site'> | null;
    faculties: Props['faculties'];
} & Partial<Pick<Props, 'sites' | 'selectedProgram' | 'departments' | 'cycles' | 'levels' | 'years' | 'groups'>>;

export default function ReferenceEditor({
    kind,
    record,
    context,
    onClose,
}: {
    kind: ReferenceKind;
    record?: Partial<Row>;
    context: EditorContext;
    onClose: () => void;
}) {
    const form = useForm({
        code: record?.code ?? '',
        name: record?.name ?? '',
        revision: record?.revision ?? 0,
        is_active: record?.is_active ?? true,
        acronym: record?.acronym ?? '',
        site_id: record?.site_id ?? '',
        address: kind === 'university' ? (context.institution?.site?.address ?? '') : '',
        contact_email: kind === 'university' ? (context.institution?.site?.contact_email ?? '') : '',
        contact_phone: kind === 'university' ? (context.institution?.site?.contact_phone ?? '') : '',
        faculty_id: record?.faculty_id ?? '',
        academic_cycle_id: record?.academic_cycle_id ?? '',
        academic_department_id: record?.academic_department_id ?? '',
        academic_program_id: context.selectedProgram?.id ?? '',
        academic_year_id: record?.academic_year_id ?? '',
        level_id: record?.level_id ?? '',
        degree: record?.degree ?? '',
        normal_duration: record?.normal_duration ?? (kind === 'cycle' ? 1 : ''),
        progression_mode: record?.progression_mode ?? 'annual',
        weighting_mode: record?.weighting_mode ?? 'credits',
        periods: record?.periods ?? [{ code: '', name: '' }],
        level_ids:
            kind === 'program' && record && 'levels' in record ? (record.levels as Props['levels']).map((level) => level.id) : ([] as number[]),
        academic_promotion_id: kind === 'group-promotion' ? (record?.id ?? '') : '',
        group_id: '',
        reason: '',
    });
    const contextual = kind === 'faculty-context' || kind === 'year-context' || kind === 'group-promotion';
    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.post(
            route('dashboard.admin.academic-structure.references', {
                kind,
                ...(kind === 'group-promotion' ? { id: form.data.group_id } : record?.id ? { id: record.id } : {}),
            }),
            {
                preserveScroll: true,
                onSuccess: () => {
                    if (kind === 'university') Alert.success('Informations de l’établissement enregistrées.');
                    if (kind === 'department') Alert.success(record?.id ? 'Département modifié.' : 'Département ajouté.');
                    if (kind === 'faculty-context') Alert.success('Faculté rattachée à l’établissement.');
                    onClose();
                },
            },
        );
    };
    const field = (name: 'code' | 'name' | 'acronym' | 'degree', title: string, required = false) => (
        <label className="admin-field">
            {title}
            <input
                required={required}
                value={form.data[name]}
                onChange={(event) => form.setData(name, event.target.value)}
                maxLength={name === 'code' || name === 'acronym' ? 60 : 255}
            />
        </label>
    );
    return (
        <AdminModal
            title={labels[kind]}
            description={
                contextual
                    ? 'Le rattachement est explicite. Aucun étudiant ni historique ne sera réaffecté.'
                    : 'Les références existantes sont conservées ; les changements nécessitent un motif.'
            }
            onClose={onClose}
            formId="structure-reference"
            submitLabel="Enregistrer"
            busy={form.processing}
            errors={messages(form.errors)}
            wide
        >
            <form id="structure-reference" className="admin-modal-form" onSubmit={submit}>
                {!contextual && (
                    <>
                        <div className="grid gap-4 sm:grid-cols-2">
                            {field('code', 'Code stable', true)}
                            {field('name', 'Nom officiel', true)}
                        </div>
                        {kind === 'university' && (
                            <div className="grid gap-4 sm:grid-cols-2">
                                {field('acronym', 'Sigle')}
                                <label className="admin-field">
                                    Site associé
                                    <select
                                        value={form.data.site_id}
                                        onChange={(event) => {
                                            const site = context.sites?.find(({ id }) => String(id) === event.target.value);
                                            form.setData({
                                                ...form.data,
                                                site_id: event.target.value,
                                                address: site?.address ?? '',
                                                contact_email: site?.contact_email ?? '',
                                                contact_phone: site?.contact_phone ?? '',
                                            });
                                        }}
                                    >
                                        <option value="">Aucun site associé</option>
                                        {context.sites?.map((site) => (
                                            <option key={site.id} value={site.id}>
                                                {site.site_name}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                                <label className="admin-field sm:col-span-2">
                                    Adresse
                                    <textarea
                                        rows={2}
                                        maxLength={2000}
                                        value={form.data.address}
                                        onChange={(event) => form.setData('address', event.target.value)}
                                    />
                                </label>
                                <label className="admin-field">
                                    Téléphone
                                    <input
                                        type="tel"
                                        maxLength={255}
                                        value={form.data.contact_phone}
                                        onChange={(event) => form.setData('contact_phone', event.target.value)}
                                    />
                                </label>
                                <label className="admin-field">
                                    Adresse e-mail
                                    <input
                                        type="email"
                                        maxLength={255}
                                        value={form.data.contact_email}
                                        onChange={(event) => form.setData('contact_email', event.target.value)}
                                    />
                                </label>
                                {!form.data.site_id && (
                                    <p className="as-note sm:col-span-2">
                                        Si vous renseignez des coordonnées, un site sera créé et associé à l’établissement.
                                    </p>
                                )}
                            </div>
                        )}
                        {(kind === 'department' || kind === 'program') && (
                            <label className="admin-field">
                                Faculté propriétaire
                                <select
                                    required
                                    disabled={kind === 'department' && Boolean(record?.faculty_id)}
                                    value={form.data.faculty_id}
                                    onChange={(event) => form.setData('faculty_id', event.target.value)}
                                >
                                    <option value="">Choisir une faculté rattachée</option>
                                    {context.faculties
                                        .filter((faculty) => faculty.university_id === context.institution?.id)
                                        .map((faculty) => (
                                            <option key={faculty.id} value={faculty.id}>
                                                {faculty.name}
                                            </option>
                                        ))}
                                </select>
                            </label>
                        )}
                        {kind === 'cycle' && (
                            <>
                                <div className="grid gap-4 sm:grid-cols-3">
                                    <label className="admin-field">
                                        Durée normale (étapes)
                                        <input
                                            type="number"
                                            min={1}
                                            max={100}
                                            required
                                            value={form.data.normal_duration}
                                            onChange={(event) =>
                                                form.setData('normal_duration', event.target.value === '' ? '' : Number(event.target.value))
                                            }
                                        />
                                    </label>
                                    <label className="admin-field">
                                        Progression
                                        <select
                                            value={form.data.progression_mode}
                                            onChange={(event) => form.setData('progression_mode', event.target.value)}
                                        >
                                            <option value="annual">Annuelle</option>
                                            <option value="credits">Par crédits</option>
                                            <option value="custom">Selon règlement</option>
                                        </select>
                                    </label>
                                    <label className="admin-field">
                                        Pondération
                                        <select
                                            value={form.data.weighting_mode}
                                            onChange={(event) => form.setData('weighting_mode', event.target.value)}
                                        >
                                            <option value="credits">Crédits</option>
                                            <option value="coefficients">Coefficients</option>
                                            <option value="both">Crédits et coefficients</option>
                                        </select>
                                    </label>
                                </div>
                                <fieldset className="space-y-3">
                                    <legend className="font-semibold">Périodes configurables</legend>
                                    {form.data.periods.map((period, index) => (
                                        <div key={index} className="flex gap-2">
                                            <input
                                                className="as-input"
                                                required
                                                aria-label={`Code période ${index + 1}`}
                                                placeholder="Code"
                                                value={period.code}
                                                onChange={(event) =>
                                                    form.setData(
                                                        'periods',
                                                        form.data.periods.map((item, i) =>
                                                            i === index ? { ...item, code: event.target.value } : item,
                                                        ),
                                                    )
                                                }
                                            />
                                            <input
                                                className="as-input"
                                                required
                                                aria-label={`Nom période ${index + 1}`}
                                                placeholder="Nom de la période"
                                                value={period.name}
                                                onChange={(event) =>
                                                    form.setData(
                                                        'periods',
                                                        form.data.periods.map((item, i) =>
                                                            i === index ? { ...item, name: event.target.value } : item,
                                                        ),
                                                    )
                                                }
                                            />
                                            <button
                                                type="button"
                                                aria-label={`Retirer la période ${index + 1}`}
                                                disabled={form.data.periods.length === 1}
                                                onClick={() =>
                                                    form.setData(
                                                        'periods',
                                                        form.data.periods.filter((_, i) => i !== index),
                                                    )
                                                }
                                            >
                                                Retirer
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        className="admin-secondary"
                                        disabled={form.data.periods.length >= 24}
                                        onClick={() => form.setData('periods', [...form.data.periods, { code: '', name: '' }])}
                                    >
                                        Ajouter une période
                                    </button>
                                </fieldset>
                            </>
                        )}
                        {kind === 'program' && (
                            <>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <label className="admin-field">
                                        Département responsable
                                        <select
                                            value={form.data.academic_department_id}
                                            onChange={(event) => form.setData('academic_department_id', event.target.value)}
                                        >
                                            <option value="">Sous responsabilité de la faculté</option>
                                            {context.departments
                                                ?.filter((department) => department.faculty_id === Number(form.data.faculty_id))
                                                .map((department) => (
                                                    <option key={department.id} value={department.id}>
                                                        {department.name}
                                                    </option>
                                                ))}
                                        </select>
                                    </label>
                                    <label className="admin-field">
                                        Cycle
                                        <select
                                            required
                                            value={form.data.academic_cycle_id}
                                            onChange={(event) => form.setData('academic_cycle_id', event.target.value)}
                                        >
                                            <option value="">Choisir un cycle</option>
                                            {context.cycles?.map((cycle) => (
                                                <option key={cycle.id} value={cycle.id}>
                                                    {cycle.name}
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                    {field('degree', 'Diplôme visé')}
                                    <label className="admin-field">
                                        Durée normale
                                        <input
                                            type="number"
                                            min={1}
                                            max={100}
                                            value={form.data.normal_duration}
                                            onChange={(event) =>
                                                form.setData('normal_duration', event.target.value === '' ? '' : Number(event.target.value))
                                            }
                                        />
                                    </label>
                                </div>
                                <fieldset>
                                    <legend className="mb-2 font-semibold">Niveaux existants du programme</legend>
                                    <div className="grid gap-2 sm:grid-cols-2">
                                        {context.levels
                                            ?.filter((level) => level.faculty_id === Number(form.data.faculty_id))
                                            .map((level) => (
                                                <label key={level.id} className="flex gap-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={form.data.level_ids.includes(level.id)}
                                                        onChange={(event) =>
                                                            form.setData(
                                                                'level_ids',
                                                                event.target.checked
                                                                    ? [...form.data.level_ids, level.id]
                                                                    : form.data.level_ids.filter((id) => id !== level.id),
                                                            )
                                                        }
                                                    />
                                                    {level.code} · {level.title}
                                                </label>
                                            ))}
                                    </div>
                                </fieldset>
                            </>
                        )}
                        {(kind === 'cohort' || kind === 'promotion') && (
                            <>
                                <label className="admin-field">
                                    Année académique
                                    <select
                                        required
                                        value={form.data.academic_year_id}
                                        onChange={(event) => form.setData('academic_year_id', event.target.value)}
                                    >
                                        <option value="">Choisir une année</option>
                                        {context.years?.map((year) => (
                                            <option key={year.id} value={year.id}>
                                                {year.title}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                                {kind === 'promotion' && (
                                    <label className="admin-field">
                                        Niveau
                                        <select
                                            required
                                            value={form.data.level_id}
                                            onChange={(event) => form.setData('level_id', event.target.value)}
                                        >
                                            <option value="">Choisir un niveau</option>
                                            {context.selectedProgram?.levels.map((level) => (
                                                <option key={level.id} value={level.id}>
                                                    {level.title}
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                )}
                            </>
                        )}
                        <label className="flex gap-2">
                            <input
                                type="checkbox"
                                checked={form.data.is_active}
                                onChange={(event) => form.setData('is_active', event.target.checked)}
                            />
                            Référentiel actif
                        </label>
                    </>
                )}
                {kind === 'group-promotion' && (
                    <label className="admin-field">
                        Groupe existant
                        <select required value={form.data.group_id} onChange={(event) => form.setData('group_id', event.target.value)}>
                            <option value="">Choisir un groupe compatible</option>
                            {context.groups
                                ?.filter(
                                    (group) =>
                                        group.level_id === record?.level_id &&
                                        (!group.academic_promotion_id || group.academic_promotion_id === record?.id),
                                )
                                .map((group) => (
                                    <option key={group.id} value={group.id}>
                                        {group.name}
                                    </option>
                                ))}
                        </select>
                    </label>
                )}
                {contextual && (
                    <p className="rounded-lg bg-slate-50 p-4">
                        {record?.name} → {context.institution?.name}
                    </p>
                )}
                <label className="admin-field">
                    Motif administratif
                    <textarea
                        required
                        minLength={5}
                        maxLength={1000}
                        value={form.data.reason}
                        onChange={(event) => form.setData('reason', event.target.value)}
                    />
                </label>
            </form>
        </AdminModal>
    );
}
