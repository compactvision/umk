import PageHeading from '@/components/admin/PageHeading';
import Dashboard from '@/components/layouts/Dashboard/Dashboard';
import { CardFace, cardInk, defaultCardDesign, specimenIdentity, type CardDesign } from '@/components/studentCards/CardArtwork';
import { Head, Link, useForm } from '@inertiajs/react';
import { Check, IdCard, Nfc, Plus, RotateCw } from 'lucide-react';
import { useState } from 'react';
import '../../../../css/dashboard/card-templates.css';

type Template = CardDesign & { id: number };
type Props = { templates: Template[]; selectedId: number | null };

const example = { ...defaultCardDesign, name: '' };
const routePrefix = 'dashboard.admin.card-templates';

function ReaderDemo() {
    const [scanned, setScanned] = useState(false);
    return (
        <div className="ct-reader" data-scanned={scanned}>
            <div className="ct-reader-device" aria-hidden="true">
                <i />
                {scanned ? <Check size={23} /> : <Nfc size={23} />}
            </div>
            <div>
                <strong>Lecteur d’auditoire · Démonstration</strong>
                <p role="status">{scanned ? 'Présence simulée · Grâce Mbuyi' : 'En attente du badge NFC'}</p>
            </div>
            <button type="button" className="admin-secondary" onClick={() => setScanned((value) => !value)}>
                {scanned ? 'Réinitialiser' : 'Simuler le pointage'}
            </button>
        </div>
    );
}

function Preview({ design }: { design: CardDesign }) {
    const [back, setBack] = useState(false);
    const style = cardInk(design.color);

    return (
        <section className="ct-preview" aria-label="Aperçu de la carte">
            <div className="ct-preview-header">
                <div>
                    <h2>Aperçu de la carte</h2>
                    <p>Badge NFC sur PVC · Données fictives</p>
                </div>
                <div className="ct-side-switch" role="group" aria-label="Face affichée">
                    <button type="button" aria-pressed={!back} onClick={() => setBack(false)}>
                        Recto
                    </button>
                    <button type="button" aria-pressed={back} onClick={() => setBack(true)}>
                        Verso
                    </button>
                </div>
            </div>
            <div className="ct-stage">
                <div className="ct-stage-caption" aria-hidden="true">
                    <span>BADGE UNIVERSITAIRE NFC</span>
                    <span>85,60 × 53,98 mm</span>
                </div>
                <div className="ct-card-scene">
                    <div className="ct-card" style={style} data-back={back}>
                        {[false, true].map((reverse) => (
                            <div className="ct-card-face" key={String(reverse)} data-reverse={reverse} aria-hidden={back !== reverse}>
                                <CardFace design={design} identity={specimenIdentity} reverse={reverse} specimen />
                            </div>
                        ))}
                    </div>
                </div>
                <div className="ct-stage-caption ct-stage-bottom">
                    <span>
                        {back ? 'VERSO' : 'RECTO'} <span aria-hidden="true">/</span> APERÇU
                    </span>
                    <button type="button" onClick={() => setBack(!back)}>
                        <RotateCw size={14} aria-hidden="true" /> Retourner
                    </button>
                </div>
            </div>
            <ReaderDemo />
        </section>
    );
}

function Editor({ template, onSaved }: { template?: Template; onSaved: () => void }) {
    const form = useForm<CardDesign>(
        template
            ? {
                  name: template.name,
                  institution: template.institution,
                  heading: template.heading,
                  color: template.color,
                  back_text: template.back_text,
              }
            : example,
    );
    const [saved, setSaved] = useState(false);
    const fields = [
        ['name', 'Nom du modèle', 100],
        ['institution', 'Établissement', 100],
        ['heading', 'Titre sur la carte', 60],
    ] as const;

    return (
        <>
            <form
                className="ct-form"
                onChange={() => setSaved(false)}
                onSubmit={(event) => {
                    event.preventDefault();
                    const options = {
                        preserveScroll: true,
                        onSuccess: () => {
                            setSaved(true);
                            onSaved();
                        },
                    };
                    if (template) form.put(route(routePrefix + '.update', template.id), options);
                    else form.post(route(routePrefix + '.store'), options);
                }}
            >
                <h2>{template ? 'Modifier le modèle' : 'Nouveau modèle'}</h2>
                {fields.map(([key, label, length]) => (
                    <label className="ct-field" key={key}>
                        {label}
                        <input required maxLength={length} value={form.data[key]} onChange={(event) => form.setData(key, event.target.value)} />
                        {form.errors[key] && <span role="alert">{form.errors[key]}</span>}
                    </label>
                ))}
                <label className="ct-field">
                    Couleur principale
                    <input type="color" value={form.data.color} onChange={(event) => form.setData('color', event.target.value)} />
                    {form.errors.color && <span role="alert">{form.errors.color}</span>}
                </label>
                <label className="ct-field">
                    Texte au verso
                    <textarea
                        rows={3}
                        maxLength={220}
                        value={form.data.back_text ?? ''}
                        onChange={(event) => form.setData('back_text', event.target.value)}
                    />
                    {form.errors.back_text && <span role="alert">{form.errors.back_text}</span>}
                </label>
                <button className="admin-primary" disabled={form.processing || (Boolean(template) && !form.isDirty)}>
                    {form.processing ? 'Enregistrement…' : 'Enregistrer le modèle'}
                </button>
                {saved && <p role="status">Modèle enregistré.</p>}
            </form>
            <Preview design={form.data} />
        </>
    );
}

export default function Index({ templates, selectedId }: Props) {
    const [creating, setCreating] = useState(false);
    const selected = creating ? undefined : (templates.find(({ id }) => id === selectedId) ?? templates[0]);

    return (
        <Dashboard hideAppsNavigation>
            <Head title="Modèles de cartes" />
            <div className="ct-page">
                <PageHeading
                    title="Modèles de cartes"
                    description="Personnalisez les modèles de cartes étudiantes et prévisualisez leurs deux faces."
                    action={
                        <button type="button" className="admin-primary" onClick={() => setCreating(true)}>
                            <Plus size={18} /> Nouveau modèle
                        </button>
                    }
                />
                <div className="ct-workspace">
                    <nav className="ct-library" aria-label="Modèles enregistrés">
                        <h2>
                            Modèles enregistrés <span>{templates.length}</span>
                        </h2>
                        {templates.length === 0 && <p>Aucun modèle enregistré. Créez votre premier modèle avec le formulaire.</p>}
                        {templates.map((template) => (
                            <Link
                                key={template.id}
                                href={route(routePrefix + '.index', { template: template.id })}
                                preserveScroll
                                onClick={() => setCreating(false)}
                                aria-current={selected?.id === template.id ? 'true' : undefined}
                            >
                                <IdCard size={19} aria-hidden="true" />
                                <span>{template.name}</span>
                            </Link>
                        ))}
                    </nav>
                    <div className="ct-editor">
                        <Editor key={selected?.id ?? 'new'} template={selected} onSaved={() => setCreating(false)} />
                    </div>
                </div>
            </div>
        </Dashboard>
    );
}
