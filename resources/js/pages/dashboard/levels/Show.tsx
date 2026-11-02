import AdminModal from '@/components/admin/AdminModal';
import LevelPopup from '@/components/form/LevelPopup';
import Dashboard from '@/components/layouts/Dashboard/Dashboard';
import { Head, useForm, usePage } from '@inertiajs/react';
import { AlertTriangle, Pencil, Trash2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import '../../../../css/dashboard/level-detail.css';
import LevelContent from './components/LevelContent';
import LevelHero from './components/LevelHero';
import LevelNavigation from './components/LevelNavigation';
import { useLevelData } from './hooks/useLevelData';
import { useLevelModals } from './hooks/useLevelModals';

export default function LevelShow() {
    const [activeTab, setActiveTab] = useState('infos');
    const [editingLevel, setEditingLevel] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const deleteForm = useForm({});
    const { levelDetail, admissionConditions, level, faculties } = usePage().props;
    const levelDataHook = useLevelData(levelDetail);
    const modalsHook = useLevelModals(levelDetail);
    const deleteLevel = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (deleteForm.processing) return;
        deleteForm.delete(route('dashboard.admin.levels.destroy', level.id), { preserveScroll: true });
    };
    return (
        <Dashboard>
            <Head title={`${levelDetail?.level_title || 'Détail du niveau'} · Formation`} />
            <div className="level-detail-page">
                <div className="ld-level-actions">
                    <span>PARAMÈTRES DU PARCOURS</span>
                    <div className="ld-level-action-buttons">
                        <button
                            className="ld-delete-level"
                            disabled={deleteForm.processing}
                            onClick={() => {
                                deleteForm.clearErrors();
                                setConfirmDelete(true);
                            }}
                        >
                            <Trash2 size={16} strokeWidth={1.7} />
                            Supprimer le niveau
                        </button>
                        <button className="admin-primary" onClick={() => setEditingLevel(true)}>
                            <Pencil size={16} strokeWidth={1.7} />
                            Modifier le niveau
                        </button>
                    </div>
                </div>
                <LevelHero levelData={levelDataHook.detailsData} levelDetail={levelDetail} />
                <LevelNavigation
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    conditionCount={Array.isArray(admissionConditions) ? admissionConditions.length : 0}
                />
                <div id={`level-panel-${activeTab}`} role="tabpanel" aria-labelledby={`level-tab-${activeTab}`} tabIndex={0}>
                    <LevelContent activeTab={activeTab} levelDataHook={levelDataHook} modalsHook={modalsHook} levelConditions={admissionConditions} />
                </div>
                {confirmDelete && (
                    <AdminModal
                        className="ld-delete-modal"
                        title="Supprimer ce niveau ?"
                        description="Vérifiez le niveau concerné avant de confirmer sa suppression."
                        formId="level-delete-form"
                        submitLabel="Supprimer définitivement"
                        busy={deleteForm.processing}
                        errors={deleteForm.errors}
                        onClose={() => setConfirmDelete(false)}
                    >
                        <form id="level-delete-form" onSubmit={deleteLevel} className="admin-modal-form">
                            <div className="ld-delete-target">
                                <span>
                                    <AlertTriangle size={25} strokeWidth={1.5} />
                                </span>
                                <div>
                                    <small>
                                        {level.code} · {levelDetail.faculty_name}
                                    </small>
                                    <strong>{level.title}</strong>
                                </div>
                            </div>
                            <p className="ld-delete-explanation">
                                Le niveau, ses détails et ses conditions d’admission seront supprimés. <strong>Cette action est définitive.</strong>
                            </p>
                            <p className="ld-delete-help">Un niveau lié à des inscriptions ne peut pas être supprimé.</p>
                        </form>
                    </AdminModal>
                )}
                {editingLevel && <LevelPopup level={level} faculties={faculties} onClose={() => setEditingLevel(false)} />}
            </div>
        </Dashboard>
    );
}
