import PageHeading from '@/components/admin/PageHeading';
import CreateFacultyPopup from '@/components/form/CreateFacultyPopup';
import Dashboard from '@/components/layouts/Dashboard/Dashboard';
import { useCatalogView } from '@/hooks/use-catalog-view';
import { usePanelFade } from '@/hooks/use-panel-fade';
import ReferenceEditor from '@/pages/dashboard/academicStructure/ReferenceEditor';
import type { Row } from '@/pages/dashboard/academicStructure/types';
import { Head, Link } from '@inertiajs/react';
import { ArrowUpRight, Building2, ChevronRight, Layers3, Pencil, Plus, Search } from 'lucide-react';
import { useState } from 'react';
import '../../../../css/dashboard/academic-structure.css';
import '../../../../css/dashboard/faculty-catalog.css';
import DepartmentOptionsEditor, { type OrientationLevel } from './DepartmentOptionsEditor';

type Faculty = {
    id: number;
    name: string;
    code: string;
    description: string | null;
    duration_years: number;
    is_active: boolean;
    university_id: number | null;
    departments: Row[];
    levels: OrientationLevel[];
};

type Props = {
    faculties: Faculty[];
    institution: { id: number; name: string } | null;
    selectedFacultyId: number | null;
    viewDepartments: boolean;
    manageStructure: boolean;
};

const normalize = (value: string) =>
    value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLocaleLowerCase('fr')
        .trim();

export default function FacultyDirectory({ faculties, institution, selectedFacultyId, viewDepartments, manageStructure }: Props) {
    const [view, setView] = useCatalogView({ search: '', selection: selectedFacultyId });
    const { search, selection } = view;
    const [createFaculty, setCreateFaculty] = useState(false);
    const [editFaculty, setEditFaculty] = useState<Faculty | null>(null);
    const [orientation, setOrientation] = useState<OrientationLevel | null>(null);
    const [reference, setReference] = useState<{ kind: 'faculty-context' | 'department'; record: Partial<Row> } | null>(null);

    const filtered = faculties.filter((faculty) => normalize(`${faculty.name} ${faculty.code}`).includes(normalize(search)));
    const selected = filtered.find((faculty) => faculty.id === selection) ?? filtered[0];
    const attached = selected?.university_id === institution?.id && Boolean(institution);
    const resultsPanel = usePanelFade<HTMLElement>(filtered.map((faculty) => faculty.id).join(','));
    const detailPanel = usePanelFade<HTMLElement>(selected?.id);
    const setResultsPanel = (element: HTMLElement | null) => {
        resultsPanel.current = element;
    };

    return (
        <Dashboard hideAppsNavigation>
            <Head title="Facultés et départements" />
            <div className="as-page as-establishment faculty-directory">
                <PageHeading
                    title="Facultés et départements"
                    description="Sélectionnez une faculté pour consulter ses départements et accéder à sa fiche."
                    action={
                        <button type="button" className="admin-primary" onClick={() => setCreateFaculty(true)}>
                            <Plus size={17} />
                            Nouvelle faculté
                        </button>
                    }
                />

                <div className="faculty-directory-grid">
                    <section className="as-panel as-establishment-panel" aria-labelledby="faculty-list-heading">
                        <div className="faculty-directory-section-heading">
                            <h2 id="faculty-list-heading">Facultés</h2>
                            <span className="faculty-directory-count" role="status">
                                {filtered.length}
                                <span className="sr-only"> {filtered.length === 1 ? 'faculté affichée' : 'facultés affichées'}</span>
                            </span>
                        </div>
                        <label className="faculty-directory-search">
                            <Search size={17} aria-hidden="true" />
                            <input
                                type="search"
                                aria-label="Rechercher une faculté"
                                placeholder="Rechercher par nom ou code…"
                                value={search}
                                onChange={(event) => setView((current) => ({ ...current, search: event.target.value }))}
                            />
                        </label>
                        {filtered.length ? (
                            <ul className="faculty-directory-list" ref={setResultsPanel}>
                                {filtered.map((faculty) => {
                                    const count = faculty.departments.length;
                                    return (
                                        <li key={faculty.id}>
                                            <button
                                                type="button"
                                                aria-pressed={selected?.id === faculty.id}
                                                onClick={() => setView((current) => ({ ...current, selection: faculty.id }))}
                                            >
                                                <Building2 size={17} aria-hidden="true" />
                                                <span className="faculty-directory-list-copy">
                                                    <strong>{faculty.name}</strong>
                                                    <small>
                                                        {faculty.code}
                                                        {faculty.university_id === null
                                                            ? ' · À rattacher'
                                                            : viewDepartments && faculty.university_id === institution?.id
                                                              ? ` · ${count} département${count > 1 ? 's' : ''}`
                                                              : ''}
                                                    </small>
                                                </span>
                                                <ChevronRight size={16} aria-hidden="true" />
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        ) : (
                            <p className="as-note" role="status" ref={setResultsPanel}>
                                {search.trim() ? 'Aucune faculté ne correspond à la recherche.' : 'Aucune faculté enregistrée.'}
                            </p>
                        )}
                    </section>

                    {selected && (
                        <section
                            className="as-panel as-establishment-panel faculty-directory-detail"
                            aria-labelledby="selected-faculty-heading"
                            ref={detailPanel}
                        >
                            <div className="as-panel-title faculty-directory-identity">
                                <div>
                                    <div className="faculty-directory-meta">
                                        <span className="faculty-directory-emblem">
                                            <Building2 size={23} strokeWidth={1.5} aria-hidden="true" />
                                        </span>
                                        <span className="faculty-directory-code">{selected.code}</span>
                                        <span className={`as-badge ${selected.is_active ? 'as-established' : 'faculty-directory-inactive'}`}>
                                            {selected.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                    <h2 id="selected-faculty-heading">{selected.name}</h2>
                                    <p className="as-note">
                                        {attached
                                            ? institution?.name
                                            : selected.university_id === null
                                              ? 'À rattacher à l’établissement'
                                              : 'Rattachée à un autre établissement'}
                                    </p>
                                </div>
                                <div className="as-actions">
                                    <button type="button" className="admin-secondary" onClick={() => setEditFaculty(selected)}>
                                        <Pencil size={15} />
                                        Modifier
                                    </button>
                                    <Link className="as-establishment-link" href={route('dashboard.admin.faculties.show', selected.id)}>
                                        Ouvrir la fiche <ArrowUpRight size={15} />
                                    </Link>
                                </div>
                            </div>
                            {selected.description && <p className="faculty-directory-description">{selected.description}</p>}
                            {manageStructure && institution && selected.university_id === null && (
                                <button
                                    type="button"
                                    className="admin-secondary"
                                    onClick={() => setReference({ kind: 'faculty-context', record: { id: selected.id, name: selected.name } })}
                                >
                                    Rattacher à l’établissement
                                </button>
                            )}

                            {viewDepartments && (
                                <div className="faculty-directory-departments">
                                    <div className="as-panel-title">
                                        <div className="faculty-directory-section-heading">
                                            <h3>Départements</h3>
                                            {attached && <span className="faculty-directory-count">{selected.departments.length}</span>}
                                        </div>
                                        {manageStructure && attached && (
                                            <button
                                                type="button"
                                                className="admin-secondary"
                                                onClick={() => setReference({ kind: 'department', record: { faculty_id: selected.id } })}
                                            >
                                                <Plus size={16} />
                                                Ajouter un département
                                            </button>
                                        )}
                                    </div>
                                    {!attached ? (
                                        <p className="as-note">
                                            {selected.university_id === null
                                                ? 'Rattachez la faculté à l’établissement pour configurer ses départements.'
                                                : 'Les départements de cette faculté relèvent de son établissement.'}
                                        </p>
                                    ) : selected.departments.length ? (
                                        <div className="as-scroll">
                                            <table className="as-table" aria-label={`Départements de ${selected.name}`}>
                                                <thead>
                                                    <tr>
                                                        <th scope="col">Département</th>
                                                        <th scope="col">Statut</th>
                                                        <th scope="col">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {selected.departments.map((department) => (
                                                        <tr key={department.id}>
                                                            <td>
                                                                {department.name}
                                                                <small>{department.code}</small>
                                                            </td>
                                                            <td>
                                                                <span
                                                                    className={`as-badge ${department.is_active ? 'as-established' : 'faculty-directory-inactive'}`}
                                                                >
                                                                    {department.is_active ? 'Actif' : 'Inactif'}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                <div className="as-actions">
                                                                    <Link
                                                                        className="as-establishment-link"
                                                                        href={route('dashboard.admin.student-academic.index', {
                                                                            department: department.id,
                                                                        })}
                                                                    >
                                                                        Étudiants
                                                                    </Link>
                                                                    {manageStructure && (
                                                                        <button
                                                                            type="button"
                                                                            aria-label={`Modifier ${department.name}`}
                                                                            onClick={() => setReference({ kind: 'department', record: department })}
                                                                        >
                                                                            Modifier
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="faculty-directory-empty">
                                            <Layers3 size={21} strokeWidth={1.5} aria-hidden="true" />
                                            <p>Aucun département pour cette faculté.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                            {viewDepartments && attached && selected.levels.length > 0 && (
                                <section className="faculty-directory-departments" aria-labelledby="department-orientation-heading">
                                    <h3 id="department-orientation-heading">Choix du département par niveau</h3>
                                    <p className="as-note">Ouvrez le choix dans l’espace étudiant à partir des niveaux concernés.</p>
                                    <ul>
                                        {selected.levels.map((level) => (
                                            <li className="as-reference-row" key={level.id}>
                                                <span>
                                                    <strong>{level.title}</strong>
                                                    <small>
                                                        {level.department_options.map(({ name }) => name).join(' · ') || 'Aucun choix proposé'}
                                                    </small>
                                                </span>
                                                {manageStructure &&
                                                    (selected.departments.some(({ is_active }) => is_active) ||
                                                        level.department_options.length > 0) && (
                                                        <button
                                                            type="button"
                                                            aria-label={`Configurer le choix pour ${level.title}`}
                                                            onClick={() => setOrientation(level)}
                                                        >
                                                            Configurer
                                                        </button>
                                                    )}
                                            </li>
                                        ))}
                                    </ul>
                                </section>
                            )}
                        </section>
                    )}
                </div>

                {createFaculty && <CreateFacultyPopup isEdit={false} closeModal={() => setCreateFaculty(false)} />}
                {editFaculty && (
                    <CreateFacultyPopup
                        isEdit
                        faculty={{ ...editFaculty, description: editFaculty.description ?? '' }}
                        closeModal={() => setEditFaculty(null)}
                    />
                )}
                {orientation && selected && (
                    <DepartmentOptionsEditor level={orientation} departments={selected.departments} onClose={() => setOrientation(null)} />
                )}
                {reference && (
                    <ReferenceEditor
                        kind={reference.kind}
                        record={reference.record}
                        context={{ institution, faculties }}
                        onClose={() => setReference(null)}
                    />
                )}
            </div>
        </Dashboard>
    );
}
