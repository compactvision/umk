import { usePanelFade } from '@/hooks/use-panel-fade';
import { Link, useForm } from '@inertiajs/react';
import { ArrowLeft, ArrowUpRight, BookOpen, CalendarDays, GraduationCap, ShieldCheck } from 'lucide-react';
import { useState, type FormEvent, type ReactNode } from 'react';
import LevelSchedule from './LevelSchedule';
import { messages, type Item, type Props, type Unit } from './types';

type Selected = NonNullable<Props['selectedVersion']>;

function CurriculumPeriodContent({ period, children }: { period: string; children: ReactNode }) {
    const periodPanel = usePanelFade<HTMLDivElement>(period);

    return (
        <div ref={periodPanel} className="as-stack">
            {children}
        </div>
    );
}

export default function CurriculumEditor({ version, context, onValidate }: { version: Selected; context: Props; onValidate: () => void }) {
    const form = useForm({ revision: version.revision, reason: '', units: version.units as Unit[] });
    const [levelId, setLevelId] = useState(() => Number(context.filters.level) || undefined);
    const [tab, setTab] = useState<'subjects' | 'schedule' | 'review'>('subjects');
    const [periodCode, setPeriodCode] = useState(version.periods[0]?.code ?? '');
    const panelRevision = `${levelId ?? ''}:${tab}`;
    const subjectsPanel = usePanelFade<HTMLFormElement>(panelRevision);
    const detailPanel = usePanelFade<HTMLElement>(panelRevision);
    const level = context.levelWorkspace.find((entry) => entry.id === levelId);
    const review = useForm({ revision: version.revision, signature: '' });
    const facultyVersions =
        context.facultyPack.find((faculty) => faculty.versions.some((entry) => entry.program_id === version.academic_program_id))?.versions ?? [];
    const siblingVersions = facultyVersions.filter((entry) => entry.program_id !== version.academic_program_id);
    const faculty = context.facultyPack.find((entry) => entry.versions.some((candidate) => candidate.program_id === version.academic_program_id));
    const approvedCount = context.levelWorkspace.filter((entry) => entry.approved).length;
    const complete = approvedCount > 0 && approvedCount === context.levelWorkspace.length;
    const editable = version.status === 'draft' && context.abilities.curriculum;
    const setUnit = (index: number, patch: Partial<Unit>) =>
        form.setData(
            'units',
            form.data.units.map((unit, i) => (i === index ? { ...unit, ...patch } : unit)),
        );
    const setItem = (unitIndex: number, itemIndex: number, patch: Partial<Item>) =>
        setUnit(unitIndex, { items: form.data.units[unitIndex].items.map((item, i) => (i === itemIndex ? { ...item, ...patch } : item)) });
    const appendCourse = (units: Unit[], item: Item, destination: string) => {
        if (!level) return units;
        const target = units.findIndex((unit) => unit.level_id === level.id && unit.period_code === destination);
        if (target >= 0) {
            return units.map((unit, index) => (index === target ? { ...unit, items: [...unit.items, item] } : unit));
        }
        return [
            ...units,
            { level_id: level.id, period_code: destination, code: 'CAT-1', name: 'Matières du catalogue', expected_credits: null, items: [item] },
        ];
    };
    const addCourse = (id: number) => {
        const course = context.catalog.find((item) => item.id === id);
        if (!course) return;
        form.setData(
            'units',
            appendCourse(
                form.data.units,
                {
                    source_course_id: course.id,
                    name: course.title,
                    code: course.code,
                    credits: course.credits ?? null,
                    coefficient: null,
                    cmi_hours: course.cmi_hours ?? 0,
                    td_hours: course.td_hours ?? 0,
                    tp_hours: course.tp_hours ?? 0,
                },
                periodCode,
            ),
        );
    };
    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.put(route('dashboard.admin.academic-structure.versions.update', version.id), {
            preserveScroll: true,
            onSuccess: (page) => {
                const saved = page.props.selectedVersion;
                if (!saved) return;
                const { revision, units } = saved as Selected;
                const values = { revision, units, reason: '' };
                form.setData(values);
                form.setDefaults(values);
            },
        });
    };
    const used = new Set(form.data.units.flatMap((unit) => unit.items.map((item) => item.source_course_id)));
    const visibleUnits = form.data.units.filter((unit) => unit.level_id === levelId && unit.period_code === periodCode);
    const withoutCourse = (unitIndex: number, item: Item) =>
        form.data.units.flatMap((unit, index) => {
            if (index !== unitIndex) return [unit];
            const items = unit.items.filter((entry) => entry.source_course_id !== item.source_course_id);
            return !items.length && unit.expected_credits === null && /^CAT-\d+$/.test(unit.code) ? [] : [{ ...unit, items }];
        });
    const moveCourse = (unitIndex: number, item: Item, destination: string) =>
        form.setData('units', appendCourse(withoutCourse(unitIndex, item), item, destination));
    return (
        <div className="as-stack">
            <div className="as-panel-title as-review-overview">
                <div>
                    {level && (
                        <button type="button" className="as-level-back" onClick={() => setLevelId(undefined)}>
                            <ArrowLeft size={15} aria-hidden="true" /> Retour aux niveaux
                        </button>
                    )}
                    <h3>{level?.title ?? 'Niveaux de la faculté'}</h3>
                </div>
                <span className="as-badge">
                    {faculty?.approved ?? approvedCount} / {faculty?.total ?? context.levelWorkspace.length} niveaux validés
                </span>
            </div>
            {!level ? (
                <div className="as-curriculum-directory">
                    {context.levelWorkspace.map((entry) => (
                        <button
                            key={entry.id}
                            type="button"
                            className="as-curriculum-card"
                            onClick={() => {
                                setLevelId(entry.id);
                                setTab('subjects');
                                setPeriodCode(version.periods[0]?.code ?? '');
                                review.clearErrors();
                            }}
                        >
                            <span className="as-curriculum-icon">
                                <GraduationCap size={20} aria-hidden="true" />
                            </span>
                            <strong>{entry.title}</strong>
                            <span className={`as-badge ${entry.approved ? 'as-approved' : ''}`}>{entry.approved ? 'Validé' : 'À valider'}</span>
                            <ArrowUpRight size={16} aria-hidden="true" />
                        </button>
                    ))}
                    {siblingVersions.map((entry) =>
                        entry.levels.map((sibling) => (
                            <Link
                                key={`${entry.id}-${sibling.id}`}
                                className="as-curriculum-card"
                                href={route('dashboard.admin.academic-structure.index', { tab: 'curriculum', version: entry.id, level: sibling.id })}
                                onBefore={() => !form.isDirty || window.confirm('Quitter avec des modifications non enregistrées ?')}
                            >
                                <span className="as-curriculum-icon">
                                    <GraduationCap size={20} aria-hidden="true" />
                                </span>
                                <span>
                                    <strong>{sibling.title}</strong>
                                    <small>{entry.name}</small>
                                </span>
                                <span className={`as-badge ${sibling.approved ? 'as-approved' : ''}`}>
                                    {sibling.approved ? 'Validé' : 'À valider'}
                                </span>
                                <ArrowUpRight size={16} aria-hidden="true" />
                            </Link>
                        )),
                    )}
                    {!context.levelWorkspace.length && <p className="as-note">Aucun niveau dans cette version.</p>}
                    {editable && complete && (
                        <button type="button" className="admin-primary" disabled={form.isDirty || form.processing} onClick={onValidate}>
                            Valider la maquette
                        </button>
                    )}
                </div>
            ) : (
                <nav className="as-tabs as-level-tabs" aria-label="Espace du niveau">
                    <button type="button" aria-current={tab === 'subjects' ? 'page' : undefined} onClick={() => setTab('subjects')}>
                        <BookOpen size={17} aria-hidden="true" /> Matières et semestres
                    </button>
                    <button type="button" aria-current={tab === 'schedule' ? 'page' : undefined} onClick={() => setTab('schedule')}>
                        <CalendarDays size={17} aria-hidden="true" /> Horaire par semaine
                    </button>
                    <button type="button" aria-current={tab === 'review' ? 'page' : undefined} onClick={() => setTab('review')}>
                        <ShieldCheck size={17} aria-hidden="true" /> Validation
                    </button>
                </nav>
            )}
            {level && tab === 'subjects' && (
                <form ref={subjectsPanel} onSubmit={submit} className="as-stack" aria-label="Matières du niveau">
                    <div className="as-curriculum-filters">
                        <label className="admin-field">
                            Semestre ou période
                            <select value={periodCode} onChange={(event) => setPeriodCode(event.target.value)}>
                                {version.periods.map((period) => (
                                    <option key={period.code} value={period.code}>
                                        {period.name}
                                    </option>
                                ))}
                            </select>
                        </label>
                        {editable && (
                            <label className="admin-field">
                                Ajouter un cours du catalogue de ce niveau
                                <select value="" onChange={(event) => addCourse(Number(event.target.value))}>
                                    <option value="">Choisir un cours</option>
                                    {context.catalog
                                        .filter((course) => course.level_id === level.id && !used.has(course.id))
                                        .map((course) => (
                                            <option key={course.id} value={course.id}>
                                                {course.title}
                                            </option>
                                        ))}
                                </select>
                            </label>
                        )}
                    </div>
                    {Object.entries(messages(form.errors)).map(([key, value]) => (
                        <p className="as-error" role="alert" key={key}>
                            {value}
                        </p>
                    ))}
                    <CurriculumPeriodContent period={periodCode}>
                        {visibleUnits.length === 0 && <p className="as-empty">Aucune matière dans cette période.</p>}
                        {form.data.units.map(
                            (unit, index) =>
                                unit.level_id === level.id &&
                                unit.period_code === periodCode && (
                                    <section className="as-unit" key={index} aria-label={`Unité ${index + 1}`}>
                                        <div className="as-fields">
                                            <label>
                                                Code UE
                                                <input
                                                    required
                                                    disabled={!editable}
                                                    maxLength={60}
                                                    value={unit.code}
                                                    onChange={(event) => setUnit(index, { code: event.target.value })}
                                                />
                                            </label>
                                            <label>
                                                Nom de l’unité
                                                <input
                                                    required
                                                    disabled={!editable}
                                                    maxLength={255}
                                                    value={unit.name}
                                                    onChange={(event) => setUnit(index, { name: event.target.value })}
                                                />
                                            </label>
                                            <label>
                                                Crédits attendus (facultatif)
                                                <input
                                                    disabled={!editable}
                                                    type="number"
                                                    min={0}
                                                    step="0.01"
                                                    value={unit.expected_credits ?? ''}
                                                    onChange={(event) =>
                                                        setUnit(index, { expected_credits: event.target.value === '' ? null : event.target.value })
                                                    }
                                                />
                                            </label>
                                            <label>
                                                Règle des crédits UE
                                                <select
                                                    disabled={!editable}
                                                    value={unit.credit_rule ?? 'sum'}
                                                    onChange={(event) => setUnit(index, { credit_rule: event.target.value as Unit['credit_rule'] })}
                                                >
                                                    <option value="sum">Vérifier la somme des crédits EC</option>
                                                    <option value="independent">Crédits UE définis séparément</option>
                                                </select>
                                            </label>
                                        </div>
                                        <div className="as-scroll">
                                            <table className="as-table">
                                                <thead>
                                                    <tr>
                                                        <th>Matière de référence</th>
                                                        <th>Crédits</th>
                                                        <th>Coefficient</th>
                                                        <th>CMI</th>
                                                        <th>TD</th>
                                                        <th>TP</th>
                                                        {editable && <th>Action</th>}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {unit.items.map((item, itemIndex) => (
                                                        <tr key={item.source_course_id}>
                                                            <td>
                                                                <input
                                                                    aria-label={`Intitulé matière ${itemIndex + 1}`}
                                                                    disabled={!editable}
                                                                    required
                                                                    value={item.name}
                                                                    onChange={(event) => setItem(index, itemIndex, { name: event.target.value })}
                                                                />
                                                                <input
                                                                    aria-label={`Code EC ${itemIndex + 1}`}
                                                                    disabled={!editable}
                                                                    value={item.code ?? ''}
                                                                    maxLength={60}
                                                                    onChange={(event) =>
                                                                        setItem(index, itemIndex, { code: event.target.value || null })
                                                                    }
                                                                />
                                                                <label>
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={item.is_optional ?? false}
                                                                        disabled={!editable}
                                                                        onChange={(event) =>
                                                                            setItem(index, itemIndex, { is_optional: event.target.checked })
                                                                        }
                                                                    />{' '}
                                                                    Optionnel
                                                                </label>
                                                            </td>
                                                            {(['credits', 'coefficient', 'cmi_hours', 'td_hours', 'tp_hours'] as const).map((key) => (
                                                                <td key={key}>
                                                                    <input
                                                                        aria-label={`${item.name} · ${key}`}
                                                                        disabled={!editable}
                                                                        type="number"
                                                                        min={0}
                                                                        step={key === 'credits' ? '0.01' : key === 'coefficient' ? '0.001' : '1'}
                                                                        value={item[key] ?? ''}
                                                                        onChange={(event) =>
                                                                            setItem(index, itemIndex, {
                                                                                [key]:
                                                                                    event.target.value === ''
                                                                                        ? key === 'credits' || key === 'coefficient'
                                                                                            ? null
                                                                                            : 0
                                                                                        : Number(event.target.value),
                                                                            })
                                                                        }
                                                                    />
                                                                </td>
                                                            ))}
                                                            {editable && (
                                                                <td>
                                                                    {version.periods.length > 1 && (
                                                                        <select
                                                                            aria-label={`Changer la période de ${item.name}`}
                                                                            value=""
                                                                            onChange={(event) => moveCourse(index, item, event.target.value)}
                                                                        >
                                                                            <option value="" disabled>
                                                                                Déplacer vers…
                                                                            </option>
                                                                            {version.periods
                                                                                .filter((period) => period.code !== periodCode)
                                                                                .map((period) => (
                                                                                    <option key={period.code} value={period.code}>
                                                                                        {period.name}
                                                                                    </option>
                                                                                ))}
                                                                        </select>
                                                                    )}
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => form.setData('units', withoutCourse(index, item))}
                                                                    >
                                                                        Retirer
                                                                    </button>
                                                                </td>
                                                            )}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                        {editable && (
                                            <div className="as-toolbar">
                                                <button
                                                    type="button"
                                                    className="as-danger"
                                                    onClick={() => {
                                                        if (window.confirm('Retirer cette unité du brouillon ?'))
                                                            form.setData(
                                                                'units',
                                                                form.data.units.filter((_, i) => i !== index),
                                                            );
                                                    }}
                                                >
                                                    Retirer l’unité
                                                </button>
                                            </div>
                                        )}
                                    </section>
                                ),
                        )}
                    </CurriculumPeriodContent>
                    {editable && (
                        <>
                            <button
                                type="button"
                                className="admin-secondary"
                                disabled={!level || !version.periods.length}
                                onClick={() =>
                                    form.setData('units', [
                                        ...form.data.units,
                                        {
                                            level_id: level?.id ?? 0,
                                            period_code: periodCode,
                                            code: '',
                                            name: '',
                                            expected_credits: null,
                                            items: [],
                                        },
                                    ])
                                }
                            >
                                Ajouter une unité d’enseignement
                            </button>
                            <label className="admin-field">
                                Motif de modification
                                <textarea
                                    required
                                    minLength={5}
                                    maxLength={1000}
                                    value={form.data.reason}
                                    onChange={(event) => form.setData('reason', event.target.value)}
                                />
                            </label>
                            <button className="admin-primary" disabled={form.processing}>
                                {form.processing ? 'Enregistrement…' : 'Enregistrer le brouillon'}
                            </button>
                        </>
                    )}
                </form>
            )}
            {level && tab === 'schedule' && (
                <section ref={detailPanel} className="as-review-section" aria-labelledby="curriculum-schedule-heading">
                    <h3 id="curriculum-schedule-heading">Horaire</h3>
                    <LevelSchedule
                        key={`${version.id}-${level.id}`}
                        level={level}
                        catalog={context.catalog}
                        semesters={context.scheduleSemesters}
                        yearId={
                            version.academic_year_id ?? context.cohorts.find((cohort) => cohort.id === version.admission_cohort_id)?.academic_year_id
                        }
                        editable={editable}
                        live={version.status === 'draft' || version.status === 'validated'}
                    />
                </section>
            )}
            {level && tab === 'review' && (
                <section ref={detailPanel} className="as-stack as-review-section" aria-labelledby="curriculum-review-heading">
                    <h3 id="curriculum-review-heading">Validation</h3>
                    {Object.entries(messages(review.errors)).map(([key, error]) => (
                        <p key={key} role="alert" className="as-error">
                            {error}
                        </p>
                    ))}
                    {form.isDirty && <p className="as-note">Enregistre les modifications du brouillon avant de valider.</p>}
                    <p className="as-note">{level.approved ? 'Ce niveau est validé.' : 'Ce niveau est en attente de validation.'}</p>
                    {editable && (
                        <div className="as-actions">
                            <button
                                type="button"
                                className="admin-secondary"
                                disabled={form.isDirty || form.processing || review.processing || level.approved || level.subject_count === 0}
                                onClick={() => {
                                    review.transform(() => ({ revision: version.revision, signature: level.signature }));
                                    review.post(route('dashboard.admin.academic-structure.versions.levels.approve', [version.id, level.id]), {
                                        preserveScroll: true,
                                    });
                                }}
                            >
                                {level.approved ? 'Niveau validé' : 'Valider ce niveau'}
                            </button>
                            {complete && (
                                <button type="button" className="admin-primary" disabled={form.isDirty || form.processing} onClick={onValidate}>
                                    Valider la maquette
                                </button>
                            )}
                        </div>
                    )}
                </section>
            )}
        </div>
    );
}
