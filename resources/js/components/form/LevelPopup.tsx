import AdminModal from '@/components/admin/AdminModal';
import { useForm } from '@inertiajs/react';
import { Building2, GraduationCap, ImageIcon, Info, Upload, X } from 'lucide-react';
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import '../../../css/dashboard/level-forms.css';
type Faculty = { id: number; name: string };
type Level = { id: number; faculty_id: number; title: string; code: string; tag?: string; description?: string; is_active?: boolean; image?: string };
type Props = { onClose: () => void; faculties?: { data?: Faculty[] }; level?: Level | null; levelCodes?: { id?: number | string; code: string }[] };
type LevelForm = {
    faculty_id: number | string;
    title: string;
    code: string;
    tag: string;
    description: string;
    is_active: boolean;
    image: File | null;
};
const imageUrl = (path?: string) => (path ? (/^(https?:\/\/|\/)/.test(path) ? path : `/storage/${path}`) : '');
export default function LevelPopup({ onClose, faculties, level = null, levelCodes = [] }: Props) {
    const { data, setData, post, processing, errors, clearErrors, setError, transform, progress } = useForm<LevelForm>({
        faculty_id: level?.faculty_id || faculties?.data?.[0]?.id || '',
        title: level?.title || '',
        code: level?.code || '',
        tag: level?.tag || '',
        description: level?.description || '',
        is_active: level?.is_active ?? true,
        image: null,
    });
    const [imagePreview, setImagePreview] = useState(imageUrl(level?.image));
    const fileInput = useRef<HTMLInputElement>(null);
    useEffect(() => {
        if (!data.image) {
            setImagePreview(imageUrl(level?.image));
            return;
        }
        const url = URL.createObjectURL(data.image);
        setImagePreview(url);
        return () => URL.revokeObjectURL(url);
    }, [data.image, level?.image]);
    const defaultCodes = ['L1', 'L2', 'L3', 'L4', 'M1', 'M2', 'D1'];
    const codes = [...new Set([...(levelCodes.length ? levelCodes.map((item) => item.code) : defaultCodes), ...(level?.code ? [level.code] : [])])];
    const faculty = faculties?.data?.find((item) => String(item.id) === String(data.faculty_id));
    const formErrors = errors as Record<string, string | undefined>;
    const error = (field: string) =>
        formErrors[field] ? (
            <p id={`level-create-${field}-error`} className="lf-error" role="alert">
                {formErrors[field]}
            </p>
        ) : null;
    const handleImage = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024 || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            setError('image', 'Choisissez une image JPG, PNG ou WebP de 2 Mo maximum.');
            event.target.value = '';
            return;
        }
        clearErrors('image');
        setData('image', file);
    };
    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (formErrors.image) return;
        transform((values) => (level ? { ...values, _method: 'PUT' } : values));
        post(level ? route('dashboard.admin.levels.update', level.id) : route('dashboard.admin.levels.store'), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => onClose(),
        });
    };
    return (
        <AdminModal
            wide
            className="level-form-modal lf-create-level-modal"
            title={level ? 'Affiner votre niveau.' : 'Un nouveau parcours.'}
            description="Posez les bases de la formation, puis donnez-lui une identité."
            onClose={onClose}
            formId="level-form"
            submitLabel={level ? 'Enregistrer les modifications' : 'Créer le niveau'}
            busy={processing}
            errors={formErrors}
        >
            <form id="level-form" onSubmit={submit} className="admin-modal-form lf-level-create-layout">
                <fieldset disabled={processing} className="lf-fields">
                    <section className="lf-form-section">
                        <div className="lf-section-title">
                            <span>01</span>
                            <div>
                                <h3>L’identité du niveau</h3>
                                <p>Rattachez le parcours à sa faculté et définissez ses repères.</p>
                            </div>
                        </div>
                        <label className="lf-label" htmlFor="level-create-faculty">
                            Faculté de rattachement <span>*</span>
                        </label>
                        <div className="lf-select-wrap">
                            <Building2 size={17} />
                            <select
                                id="level-create-faculty"
                                value={data.faculty_id}
                                onChange={(e) => setData('faculty_id', e.target.value)}
                                disabled={!!level}
                                required
                                aria-invalid={!!errors.faculty_id}
                                aria-describedby={errors.faculty_id ? 'level-create-faculty_id-error' : undefined}
                            >
                                <option value="">Choisir une faculté</option>
                                {faculties?.data?.map((item) => (
                                    <option key={item.id} value={item.id}>
                                        {item.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        {error('faculty_id')}
                        <div className="lf-create-field">
                            <label className="lf-label" htmlFor="level-create-title">
                                Nom du niveau <span>*</span>
                            </label>
                            <input
                                id="level-create-title"
                                type="text"
                                value={data.title}
                                onChange={(e) => setData('title', e.target.value)}
                                placeholder="Ex. : Première année de licence"
                                maxLength={255}
                                required
                                aria-invalid={!!errors.title}
                                aria-describedby={errors.title ? 'level-create-title-error' : undefined}
                            />
                            {error('title')}
                        </div>
                        <div className="lf-create-two-fields">
                            <div>
                                <label className="lf-label" htmlFor="level-create-code">
                                    Code académique <span>*</span>
                                </label>
                                <select
                                    id="level-create-code"
                                    value={data.code}
                                    onChange={(e) => setData('code', e.target.value)}
                                    required
                                    aria-invalid={!!errors.code}
                                >
                                    <option value="">Choisir un code</option>
                                    {codes.map((code) => (
                                        <option key={code} value={code}>
                                            {code}
                                        </option>
                                    ))}
                                </select>
                                {error('code')}
                            </div>
                            <div>
                                <label className="lf-label" htmlFor="level-create-tag">
                                    Libellé court <span className="lf-optional">Facultatif</span>
                                </label>
                                <input
                                    id="level-create-tag"
                                    value={data.tag}
                                    onChange={(e) => setData('tag', e.target.value)}
                                    placeholder="Ex. : Cycle de licence"
                                    maxLength={50}
                                    aria-invalid={!!errors.tag}
                                />
                                {error('tag')}
                            </div>
                        </div>
                    </section>
                    <section className="lf-form-section">
                        <div className="lf-section-title">
                            <span>02</span>
                            <div>
                                <h3>La présentation du parcours</h3>
                                <p>Quelques mots pour comprendre l’ambition de cette formation.</p>
                            </div>
                        </div>
                        <div className="lf-label-row">
                            <label className="lf-label" htmlFor="level-create-description">
                                Description du niveau
                            </label>
                            <span>Facultatif</span>
                        </div>
                        <textarea
                            id="level-create-description"
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            rows={5}
                            placeholder="Présentez les grandes orientations de ce niveau, les apprentissages et les perspectives…"
                            aria-invalid={!!errors.description}
                        />
                        <div className="lf-description-meta">
                            <p className="lf-help">Vous pourrez compléter les détails après la création.</p>
                            <span>{data.description.length} caractères</span>
                        </div>
                        {error('description')}
                    </section>
                    <section className="lf-form-section">
                        <div className="lf-section-title">
                            <span>03</span>
                            <div>
                                <h3>La disponibilité du niveau</h3>
                                <p>Définissez son statut dans votre offre de formation.</p>
                            </div>
                        </div>
                        <label className="lf-switch-card" htmlFor="level-create-active">
                            <span className="lf-switch-copy">
                                <strong>Niveau actif</strong>
                                <small>{data.is_active ? 'Ce niveau est marqué comme actif.' : 'Ce niveau est marqué comme inactif.'}</small>
                            </span>
                            <input
                                id="level-create-active"
                                type="checkbox"
                                role="switch"
                                checked={data.is_active}
                                onChange={(e) => setData('is_active', e.target.checked)}
                            />
                            <span className="lf-switch-track" aria-hidden="true" />
                        </label>
                        {error('is_active')}
                    </section>
                </fieldset>
                <aside className="lf-level-image-column">
                    <span className="lf-eyebrow">LE VISAGE DU PARCOURS</span>
                    <h3>Une image, une identité.</h3>
                    <p className="lf-help">Prévisualisez la couverture de votre niveau avant de l’enregistrer.</p>
                    <div className="lf-level-live-card">
                        <div className="lf-level-cover">
                            {imagePreview ? (
                                <img src={imagePreview} alt={`Aperçu de la couverture : ${data.title || 'nouveau niveau'}`} />
                            ) : (
                                <div className="lf-level-cover-empty">
                                    <GraduationCap size={44} strokeWidth={1.2} />
                                    <span>UNIVERSITÉ SIMON KIMBANGU</span>
                                </div>
                            )}
                            {data.code && <span className="lf-level-code">{data.code}</span>}
                        </div>
                        <div className="lf-level-card-copy">
                            <span>{faculty?.name || 'Votre faculté'}</span>
                            <h4>{data.title.trim() || 'Le nom de votre niveau'}</h4>
                            <p>{data.tag || 'Parcours académique'}</p>
                            <span className={`lf-status ${data.is_active ? 'lf-active-status' : ''}`}>{data.is_active ? 'Actif' : 'Inactif'}</span>
                        </div>
                    </div>
                    <input
                        ref={fileInput}
                        id="level-create-image"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleImage}
                        className="lf-file-input"
                        disabled={processing}
                        aria-describedby="level-create-image-help"
                        aria-invalid={!!errors.image}
                    />
                    <label htmlFor="level-create-image" className="lf-upload lf-create-upload">
                        <Upload size={22} strokeWidth={1.5} />
                        <strong>{imagePreview ? 'Choisir une autre image' : 'Ajouter une couverture'}</strong>
                        <span>Parcourir les fichiers</span>
                    </label>
                    <p className="lf-help" id="level-create-image-help">
                        JPG, PNG ou WebP · 2 Mo maximum · Facultatif
                    </p>
                    {error('image')}
                    {data.image && (
                        <div className="lf-selected-file">
                            <ImageIcon size={15} />
                            <span>{data.image.name}</span>
                            <button
                                type="button"
                                disabled={processing}
                                aria-label="Retirer la nouvelle image"
                                onClick={() => {
                                    setData('image', null);
                                    clearErrors('image');
                                    if (fileInput.current) fileInput.current.value = '';
                                }}
                            >
                                <X size={15} />
                            </button>
                        </div>
                    )}
                    {progress && (
                        <div className="lf-upload-progress">
                            <progress max={100} value={progress.percentage || 0} aria-label="Progression de l’envoi du niveau" />
                            <span>{progress.percentage || 0} %</span>
                        </div>
                    )}
                    <div className="lf-edit-note">
                        <Info size={16} />
                        <p>
                            {level
                                ? 'L’image actuelle est conservée si vous ne sélectionnez pas de nouveau fichier.'
                                : 'Après la création, complétez les objectifs, les tarifs et les conditions d’admission depuis la fiche du niveau.'}
                        </p>
                    </div>
                </aside>
            </form>
        </AdminModal>
    );
}
