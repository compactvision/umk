import Dashboard from '@/components/layouts/Dashboard/Dashboard';
import ProfessorAvatar from '@/components/teaching/ProfessorAvatar';
import { Head, Link, useForm } from '@inertiajs/react';
import { Camera, Upload } from 'lucide-react';
import { useEffect, useState } from 'react';
import '../../../../css/dashboard/professor-portraits.css';

export default function TeacherProfile({ name, photoUrl }: { name: string; photoUrl: string | null }) {
    const form = useForm<{ photo: File | null }>({ photo: null });
    const [preview, setPreview] = useState<string | null>(null);

    useEffect(() => {
        if (!form.data.photo) return;
        const url = URL.createObjectURL(form.data.photo);
        setPreview(url);
        return () => URL.revokeObjectURL(url);
    }, [form.data.photo]);

    return (
        <Dashboard hideAppsNavigation>
            <Head title="Photo de profil" />
            <section className="professor-photo-panel" aria-labelledby="teacher-photo-title">
                {photoUrl && <Link href={route('dashboard.teaching.index')}>Retour à mes enseignements</Link>}
                <div className="professor-photo-heading">
                    <ProfessorAvatar name={name} photoUrl={form.data.photo ? preview : photoUrl} />
                    <div>
                        <h1 id="teacher-photo-title">Photo de profil</h1>
                        <p>{name}</p>
                    </div>
                </div>
                <p>
                    {photoUrl
                        ? 'Choisissez un nouveau portrait pour mettre à jour votre fiche enseignant.'
                        : 'Ajoutez un portrait pour accéder à vos cours, supports et évaluations.'}
                </p>
                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        form.post(route('dashboard.teaching.profile.photo'), { forceFormData: true });
                    }}
                >
                    <label className="professor-photo-upload">
                        <Upload size={18} aria-hidden="true" />
                        <span>Choisir une photo</span>
                        <input
                            required
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            aria-describedby="teacher-photo-formats"
                            aria-invalid={!!form.errors.photo}
                            onChange={(event) => form.setData('photo', event.target.files?.[0] ?? null)}
                        />
                    </label>
                    <p id="teacher-photo-formats">JPEG, PNG ou WebP · 5 Mo maximum.</p>
                    {form.errors.photo && (
                        <p role="alert" className="professor-photo-error">
                            {form.errors.photo}
                        </p>
                    )}
                    {form.progress && <progress aria-label="Téléversement de la photo" max={100} value={form.progress.percentage ?? 0} />}
                    <button className="admin-primary" disabled={!form.data.photo || form.processing}>
                        <Camera size={17} aria-hidden="true" /> {form.processing ? 'Enregistrement…' : 'Enregistrer ma photo'}
                    </button>
                </form>
            </section>
        </Dashboard>
    );
}
