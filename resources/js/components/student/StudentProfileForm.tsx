import { useForm } from '@inertiajs/react';
import * as Dialog from '@radix-ui/react-dialog';
import { Camera, Check, Eye, EyeOff, GraduationCap, KeyRound, LoaderCircle, MapPin, Phone, Save, ShieldCheck, UserRound, X } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import '../../../css/student-profile.css';
import type { Academic, PortalProps } from './types';

type ProfileData = Record<string, string | boolean | File | null>;
const sections = [
    ['identity', 'Identité', UserRound],
    ['contact', 'Compte et contact', ShieldCheck],
    ['origin', 'Origine et résidence', MapPin],
    ['emergency', 'Contact d’urgence', Phone],
    ['diploma', 'Diplôme d’accès', GraduationCap],
    ['photo', 'Photo de profil', Camera],
] as const;
export default function StudentProfileForm({
    academic,
    profile,
    onFeedback,
}: {
    academic: Academic;
    profile: NonNullable<PortalProps['profile_form']>;
    onFeedback: (message: string) => void;
}) {
    const values = Object.fromEntries(Object.entries(profile.values).map(([key, value]) => [key, value == null ? '' : String(value)]));
    const form = useForm<ProfileData>({ ...values, email_current_password: '', photo: null, remove_photo: false });
    const [activeSection, setActiveSection] = useState<string>('identity');
    const [preview, setPreview] = useState<string | null>(null);
    const photoInput = useRef<HTMLInputElement>(null);
    const formViewport = useRef<HTMLFormElement>(null);
    useEffect(() => {
        const file = form.data.photo;
        if (!(file instanceof File)) {
            setPreview(null);
            return;
        }
        const url = URL.createObjectURL(file);
        setPreview(url);
        return () => URL.revokeObjectURL(url);
    }, [form.data.photo]);
    useEffect(() => {
        const viewport = formViewport.current;
        if (!viewport) return;
        let frame = 0;
        const updateActiveSection = () => {
            let current: (typeof sections)[number][0] = sections[0][0];
            for (const [id] of sections) {
                const node = document.getElementById(`profile-section-${id}`);
                if (node && node.getBoundingClientRect().top <= viewport.getBoundingClientRect().top + 48) current = id;
            }
            setActiveSection(current);
            frame = 0;
        };
        const onScroll = () => {
            if (!frame) frame = window.requestAnimationFrame(updateActiveSection);
        };
        viewport.addEventListener('scroll', onScroll, { passive: true });
        return () => {
            viewport.removeEventListener('scroll', onScroll);
            window.cancelAnimationFrame(frame);
        };
    }, []);
    const field = (name: string, label: string, type = 'text', options?: { value: string; label: string }[], required = false, wide = false) => (
        <div className={`profile-field ${wide ? 'is-wide' : ''}`} key={name}>
            <label htmlFor={`profile-${name}`}>
                {label}
                {required && <span aria-hidden="true"> *</span>}
            </label>
            {options ? (
                <select
                    id={`profile-${name}`}
                    name={name}
                    value={String(form.data[name] ?? '')}
                    onChange={(event) => form.setData(name, event.target.value)}
                    required={required}
                    aria-invalid={Boolean(form.errors[name])}
                    aria-describedby={form.errors[name] ? `profile-error-${name}` : undefined}
                >
                    <option value="">Sélectionner</option>
                    {options.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            ) : type === 'textarea' ? (
                <textarea
                    id={`profile-${name}`}
                    name={name}
                    rows={3}
                    maxLength={name === 'description' ? 2000 : 500}
                    value={String(form.data[name] ?? '')}
                    onChange={(event) => form.setData(name, event.target.value)}
                    aria-invalid={Boolean(form.errors[name])}
                    aria-describedby={form.errors[name] ? `profile-error-${name}` : undefined}
                />
            ) : (
                <input
                    id={`profile-${name}`}
                    name={name}
                    type={type}
                    required={required}
                    max={
                        type === 'date'
                            ? new Intl.DateTimeFormat('en-CA', {
                                  timeZone: 'Africa/Kinshasa',
                                  year: 'numeric',
                                  month: '2-digit',
                                  day: '2-digit',
                              }).format(new Date())
                            : type === 'number'
                              ? Number(new Intl.DateTimeFormat('en', { timeZone: 'Africa/Kinshasa', year: 'numeric' }).format(new Date()))
                              : undefined
                    }
                    min={type === 'number' ? 1900 : undefined}
                    maxLength={type === 'tel' ? 30 : type === 'email' ? 255 : 200}
                    autoComplete={
                        name === 'first_name'
                            ? 'given-name'
                            : name === 'last_name'
                              ? 'family-name'
                              : name === 'email'
                                ? 'email'
                                : name === 'phone'
                                  ? 'tel'
                                  : name === 'email_current_password'
                                    ? 'current-password'
                                    : 'off'
                    }
                    value={String(form.data[name] ?? '')}
                    onChange={(event) => form.setData(name, event.target.value)}
                    aria-invalid={Boolean(form.errors[name])}
                    aria-describedby={form.errors[name] ? `profile-error-${name}` : undefined}
                />
            )}
            {form.errors[name] && (
                <p id={`profile-error-${name}`} className="profile-field-error">
                    {form.errors[name]}
                </p>
            )}
        </div>
    );
    const group = (id: string, title: string, description: string, children: ReactNode) => (
        <section className="profile-form-section" id={`profile-section-${id}`} aria-labelledby={`profile-heading-${id}`}>
            <header>
                <span>{String(sections.findIndex((section) => section[0] === id) + 1).padStart(2, '0')}</span>
                <div>
                    <h2 id={`profile-heading-${id}`}>{title}</h2>
                    <p>{description}</p>
                </div>
            </header>
            <div className="profile-fields">{children}</div>
        </section>
    );
    const opts = (items: Record<string, string>) => Object.entries(items).map(([value, label]) => ({ value, label }));
    return (
        <div className="student-profile-editor">
            <div className="profile-editor-intro">
                <div>
                    <span>VOTRE DOSSIER PERSONNEL</span>
                    <h2>Des informations à jour, un parcours serein.</h2>
                    <p>Complétez votre identité et vos coordonnées. Les champs marqués * sont obligatoires.</p>
                </div>
                <ShieldCheck size={26} strokeWidth={1.3} />
            </div>
            <div className="profile-editor-layout">
                <nav className="profile-section-nav" aria-label="Sections du formulaire de profil">
                    {sections.map(([id, title, Icon]) => (
                        <a
                            key={id}
                            href={`#profile-section-${id}`}
                            aria-current={activeSection === id ? 'location' : undefined}
                            onClick={(event) => {
                                event.preventDefault();
                                setActiveSection(id);
                                const viewport = formViewport.current;
                                const target = document.getElementById(`profile-section-${id}`);
                                if (viewport && target) {
                                    viewport.scrollTo({
                                        top: viewport.scrollTop + target.getBoundingClientRect().top - viewport.getBoundingClientRect().top - 16,
                                        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
                                    });
                                }
                            }}
                        >
                            <Icon size={17} />
                            {title}
                        </a>
                    ))}
                </nav>
                <form
                    className="student-profile-form"
                    ref={formViewport}
                    tabIndex={0}
                    aria-label="Informations du profil, contenu défilant"
                    encType="multipart/form-data"
                    onSubmit={(event) => {
                        event.preventDefault();
                        form.post(`/dashboard/student/profile?academic=${academic.id}`, {
                            forceFormData: true,
                            preserveScroll: true,
                            onSuccess: () => {
                                form.reset('email_current_password', 'photo', 'remove_photo');
                                if (photoInput.current) photoInput.current.value = '';
                                onFeedback('Votre profil a été enregistré avec succès.');
                            },
                            onError: () => {
                                form.reset('email_current_password');
                                requestAnimationFrame(() =>
                                    document.querySelector<HTMLElement>('.student-profile-form [aria-invalid="true"]')?.focus(),
                                );
                            },
                        });
                    }}
                >
                    {Object.keys(form.errors).length > 0 && (
                        <div className="profile-error-summary" role="alert">
                            Certaines informations nécessitent votre attention. Vérifiez les champs signalés ci-dessous.
                        </div>
                    )}
                    {group(
                        'identity',
                        'Votre identité',
                        'Vos informations personnelles, telles qu’elles doivent figurer dans votre dossier.',
                        <>
                            {field('last_name', 'Nom', 'text', undefined, true)}
                            {field('post_name', 'Postnom')}
                            {field('first_name', 'Prénom', 'text', undefined, true)}
                            {field('birth_date', 'Date de naissance', 'date')}
                            {field('gender', 'Sexe', 'text', opts({ male: 'Masculin', female: 'Féminin', other: 'Autre' }))}
                            {field('birth_place', 'Lieu de naissance')}
                            {field(
                                'marital_status',
                                'État civil',
                                'text',
                                opts({ single: 'Célibataire', married: 'Marié(e)', divorced: 'Divorcé(e)', widowed: 'Veuf / Veuve', other: 'Autre' }),
                            )}
                        </>,
                    )}
                    {group(
                        'contact',
                        'Compte et contact',
                        'Vos coordonnées pour recevoir les informations de l’université.',
                        <>
                            <div className="profile-field">
                                <label htmlFor="profile-code">Code étudiant · Matricule</label>
                                <input id="profile-code" value={academic.matricule || 'Non attribué'} readOnly />
                                <small>Attribué lors de votre inscription. Ce code ne peut pas être modifié.</small>
                            </div>
                            {field('email', 'Adresse email', 'email', undefined, true)}
                            {field('phone', 'Téléphone', 'tel')}
                            {form.data.email !== profile.values.email && (
                                <>
                                    {field('email_current_password', 'Mot de passe actuel', 'password', undefined, true)}
                                    <p className="profile-field-help is-wide">
                                        Une nouvelle adresse email nécessite une vérification et la confirmation de votre mot de passe actuel.
                                    </p>
                                </>
                            )}
                        </>,
                    )}
                    {group(
                        'origin',
                        'Origine et résidence',
                        'Votre province d’origine et les coordonnées de votre résidence actuelle.',
                        <>
                            {field('province', 'Province d’origine', 'text', [
                                ...profile.provinces.map((value) => ({ value, label: value })),
                                { value: 'other', label: 'Autre' },
                            ])}
                            {form.data.province === 'other' && field('other_province', 'Précisez la province / région', 'text', undefined, true)}
                            {field('territory', 'Territoire')}
                            {field('sector', 'Secteur / chefferie')}
                            {field('residence_commune', 'Commune de résidence')}
                            {field('home_address', 'Adresse du domicile', 'textarea', undefined, false, true)}
                            {field('description', 'Description / informations complémentaires', 'textarea', undefined, false, true)}
                        </>,
                    )}
                    {group(
                        'emergency',
                        'Personne à contacter en cas d’urgence',
                        'Indiquez un proche joignable si une situation nécessite de le prévenir.',
                        <>
                            {field('emergency_name', 'Nom complet')}
                            {field('emergency_relationship', 'Lien avec l’étudiant')}
                            {field('emergency_phone', 'Téléphone', 'tel')}
                            {field('emergency_address', 'Adresse du contact', 'textarea', undefined, false, true)}
                        </>,
                    )}
                    {group(
                        'diploma',
                        'Diplôme d’accès',
                        'Les informations du diplôme avec lequel vous avez accédé à cette formation.',
                        <>
                            {field(
                                'diploma_type',
                                'Type de diplôme',
                                'text',
                                opts({ state_diploma: 'Diplôme d’État', baccalaureate: 'Baccalauréat', other: 'Autre' }),
                            )}
                            {form.data.diploma_type === 'other' && field('other_diploma', 'Précisez le diplôme', 'text', undefined, true)}
                            {field('diploma_number', 'Numéro du diplôme')}
                            {field('diploma_section', 'Section / option')}
                            {field('diploma_school', 'Établissement')}
                            {field('diploma_year', 'Année d’obtention', 'number')}
                        </>,
                    )}
                    {group(
                        'photo',
                        'Photo de profil',
                        'Choisissez un portrait net. Formats JPG, PNG ou WebP, 5 Mo maximum.',
                        <div className="profile-photo-editor is-wide">
                            <div className="profile-photo-preview">
                                {preview || academic.photo_url ? (
                                    <img src={preview || academic.photo_url!} alt="Aperçu de votre photo de profil" />
                                ) : (
                                    <UserRound size={44} strokeWidth={1.2} />
                                )}
                            </div>
                            <div>
                                <label className="profile-upload-button" htmlFor="profile-photo">
                                    <Camera size={16} />
                                    {preview ? 'Choisir une autre photo' : 'Choisir une photo'}
                                </label>
                                <input
                                    ref={photoInput}
                                    id="profile-photo"
                                    type="file"
                                    className="sr-only"
                                    accept="image/jpeg,image/png,image/webp"
                                    onChange={(event) => {
                                        form.setData('photo', event.target.files?.[0] || null);
                                        form.setData('remove_photo', false);
                                    }}
                                />
                                <p>Votre nouvelle photo sera appliquée après l’enregistrement.</p>
                                {preview && (
                                    <button
                                        type="button"
                                        className="profile-text-button"
                                        onClick={() => {
                                            form.setData('photo', null);
                                            if (photoInput.current) photoInput.current.value = '';
                                        }}
                                    >
                                        Annuler la sélection
                                    </button>
                                )}
                                {academic.photo_url && (
                                    <label className="profile-photo-reset">
                                        <input
                                            type="checkbox"
                                            checked={Boolean(form.data.remove_photo)}
                                            onChange={(event) => {
                                                form.setData('remove_photo', event.target.checked);
                                                if (event.target.checked) {
                                                    form.setData('photo', null);
                                                    if (photoInput.current) photoInput.current.value = '';
                                                }
                                            }}
                                        />
                                        Revenir à la photo du dossier d’inscription
                                    </label>
                                )}
                                {form.errors.photo && (
                                    <p className="profile-field-error" role="alert">
                                        {form.errors.photo}
                                    </p>
                                )}
                            </div>
                        </div>,
                    )}
                    <footer className="profile-save-bar">
                        <p>
                            <Check size={16} />
                            Vos changements seront appliqués à votre espace étudiant.
                        </p>
                        <button type="submit" disabled={form.processing}>
                            {form.processing ? <LoaderCircle size={17} className="animate-spin" /> : <Save size={17} />}
                            {form.processing ? 'Enregistrement…' : 'Enregistrer mon profil'}
                        </button>
                    </footer>
                </form>
            </div>
        </div>
    );
}

export function StudentPasswordModal({
    academic,
    onClose,
    onFeedback,
}: {
    academic: number;
    onClose: () => void;
    onFeedback: (message: string) => void;
}) {
    const form = useForm({ current_password: '', password: '', password_confirmation: '' });
    const [visible, setVisible] = useState(false);
    return (
        <Dialog.Root
            open
            onOpenChange={(open) => {
                if (!open && !form.processing) {
                    form.reset();
                    onClose();
                }
            }}
        >
            <Dialog.Portal>
                <Dialog.Overlay className="profile-password-overlay" />
                <Dialog.Content
                    onOpenAutoFocus={(event) => {
                        event.preventDefault();
                        document.getElementById('security-current_password')?.focus();
                    }}
                    className="profile-password-modal"
                    onEscapeKeyDown={(event) => {
                        if (form.processing) event.preventDefault();
                    }}
                    onInteractOutside={(event) => {
                        if (form.processing) event.preventDefault();
                    }}
                >
                    <Dialog.Close className="profile-password-close" aria-label="Fermer le changement de mot de passe" disabled={form.processing}>
                        <X size={20} />
                    </Dialog.Close>
                    <div className="profile-password-icon">
                        <KeyRound size={25} strokeWidth={1.5} />
                    </div>
                    <span className="profile-modal-eyebrow">SÉCURITÉ DU COMPTE</span>
                    <Dialog.Title>Changer votre mot de passe</Dialog.Title>
                    <Dialog.Description>
                        Choisissez un mot de passe personnel d’au moins 8 caractères, avec des lettres et des chiffres.
                    </Dialog.Description>
                    <form
                        onSubmit={(event) => {
                            event.preventDefault();
                            form.post(`/dashboard/student/profile/password?academic=${academic}`, {
                                errorBag: 'studentPassword',
                                preserveScroll: true,
                                onSuccess: () => {
                                    form.reset();
                                    onClose();
                                    onFeedback('Votre mot de passe a été modifié.');
                                },
                                onError: () => form.reset('password', 'password_confirmation'),
                            });
                        }}
                    >
                        {(['current_password', 'password', 'password_confirmation'] as const).map((key, index) => (
                            <div className="profile-field" key={key}>
                                <label htmlFor={`security-${key}`}>
                                    {['Mot de passe actuel', 'Nouveau mot de passe', 'Confirmer le nouveau mot de passe'][index]}
                                </label>
                                <input
                                    id={`security-${key}`}
                                    type={visible ? 'text' : 'password'}
                                    required
                                    autoComplete={index === 0 ? 'current-password' : 'new-password'}
                                    value={form.data[key]}
                                    onChange={(event) => form.setData(key, event.target.value)}
                                    aria-invalid={Boolean(form.errors[key])}
                                    aria-describedby={form.errors[key] ? `security-error-${key}` : undefined}
                                />
                                {form.errors[key] && (
                                    <p className="profile-field-error" id={`security-error-${key}`}>
                                        {form.errors[key]}
                                    </p>
                                )}
                            </div>
                        ))}
                        <button type="button" className="profile-text-button" onClick={() => setVisible(!visible)}>
                            {visible ? <EyeOff size={15} /> : <Eye size={15} />} {visible ? 'Masquer' : 'Afficher'} les mots de passe
                        </button>
                        <div className="profile-password-actions">
                            <button
                                type="button"
                                disabled={form.processing}
                                onClick={() => {
                                    form.reset();
                                    onClose();
                                }}
                            >
                                Annuler
                            </button>
                            <button type="submit" disabled={form.processing}>
                                {form.processing && <LoaderCircle size={16} className="animate-spin" />}
                                {form.processing ? 'Modification…' : 'Modifier le mot de passe'}
                            </button>
                        </div>
                    </form>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
