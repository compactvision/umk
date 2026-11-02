import Dashboard from '@/components/layouts/Dashboard/Dashboard';
import { Head, useForm } from '@inertiajs/react';
import { useState, type FormEvent } from 'react';
import '../../../../css/dashboard/seo.css';

type Override = { path: string; title: string; description: string; image: string; canonical_path: string; indexable: boolean };
type Document = { key: string; title: string; content: string; status: string; approved_at: string | null };
type Settings = { analytics_enabled: boolean; origin: string; indexable: boolean; search_console: string; identity: Record<string, string> };
const labels: Record<string, string> = {
    name: 'Dénomination',
    email: 'Email public',
    phone: 'Téléphone',
    address: 'Adresse',
    city: 'Ville',
    country: 'Code pays',
    legal_form: 'Forme juridique',
    registration: 'Enregistrement officiel',
    publication_director: 'Responsable de publication',
    host_name: 'Hébergeur',
    host_contact: 'Coordonnées de l’hébergeur',
    privacy_contact: 'Contact protection des données',
    retention_policy: 'Conservation et archivage',
    refund_policy: 'Annulation et remboursement',
    legal_basis: 'Bases juridiques des traitements',
    international_transfers: 'Prestataires, lieux de traitement et transferts',
    minors_policy: 'Données des mineurs',
};
function Errors({ errors }: { errors: Record<string, string> }) {
    return (
        <div role="alert">
            {Object.values(errors).map((message, index) => (
                <p key={index}>{message}</p>
            ))}
        </div>
    );
}
function LegalEditor({ document }: { document: Document }) {
    const form = useForm({ content: document.content, status: document.status, approved: false });
    return (
        <details className="seo-panel">
            <summary>
                {document.title} — {document.status === 'published' ? 'publié' : 'brouillon'}
            </summary>
            <form
                onSubmit={(event) => {
                    event.preventDefault();
                    form.put(`/dashboard/admin/seo/legal/${document.key}`);
                }}
            >
                <p>
                    Les marqueurs [[...]] doivent être remplacés par des informations officielles vérifiées. La direction doit approuver les
                    conditions d’inscription.
                </p>
                <label>
                    Texte du document
                    <textarea rows={18} value={form.data.content} onChange={(event) => form.setData('content', event.target.value)} />
                </label>
                <label>
                    Statut
                    <select value={form.data.status} onChange={(event) => form.setData('status', event.target.value)}>
                        <option value="draft">Brouillon privé</option>
                        <option value="published">Publication après approbation</option>
                    </select>
                </label>
                <label className="seo-check">
                    <input type="checkbox" checked={form.data.approved} onChange={(event) => form.setData('approved', event.target.checked)} />
                    La direction a vérifié et approuvé ce texte et les informations officielles.
                </label>
                <Errors errors={form.errors} />
                <button disabled={form.processing} className="admin-primary">
                    Enregistrer le document
                </button>
                {form.recentlySuccessful && <p role="status">Document enregistré.</p>}
            </form>
        </details>
    );
}
export default function SeoIndex({
    settings,
    catalog,
    overrides,
    documents,
    environment,
    audience,
}: {
    settings: Settings;
    catalog: { path: string; title: string }[];
    overrides: Override[];
    documents: Document[];
    environment: string;
    audience: { event: string; total: number }[];
}) {
    const global = useForm(settings);
    const [selected, setSelected] = useState('/');
    const metadata = useForm<Override>({
        path: '/',
        title: '',
        description: '',
        image: '',
        canonical_path: '',
        indexable: true,
        ...overrides.find((entry) => entry.path === '/'),
    });
    const choose = (path: string) => {
        setSelected(path);
        metadata.setData({
            path,
            title: '',
            description: '',
            image: '',
            canonical_path: '',
            indexable: true,
            ...overrides.find((entry) => entry.path === path),
        });
        metadata.clearErrors();
    };
    const saveSettings = (event: FormEvent) => {
        event.preventDefault();
        global.put('/dashboard/admin/seo/settings');
    };
    return (
        <Dashboard>
            <Head title="Référencement et informations officielles" />
            <div className="seo-admin">
                <h1>Référencement et transparence</h1>
                <p>
                    Environnement : <strong>{environment}</strong>. En local, toutes les pages restent en noindex. Les espaces privés ne sont jamais
                    indexables.
                </p>
                <section className="seo-panel">
                    <h2>Paramètres globaux</h2>
                    <form onSubmit={saveSettings}>
                        <label>
                            Domaine de production (HTTPS, sans slash final)
                            <input
                                type="url"
                                value={global.data.origin ?? ''}
                                placeholder="À définir avant la mise en production"
                                onChange={(event) => global.setData('origin', event.target.value)}
                            />
                        </label>
                        <label>
                            Jeton de vérification Search Console
                            <input
                                value={global.data.search_console ?? ''}
                                onChange={(event) => global.setData('search_console', event.target.value)}
                            />
                        </label>
                        <label className="seo-check">
                            <input
                                type="checkbox"
                                checked={global.data.indexable}
                                onChange={(event) => global.setData('indexable', event.target.checked)}
                            />
                            Autoriser l’indexation des pages publiques en production
                        </label>
                        <label className="seo-check">
                            <input
                                type="checkbox"
                                checked={global.data.analytics_enabled ?? false}
                                onChange={(event) => global.setData('analytics_enabled', event.target.checked)}
                            />
                            Activer la mesure agrégée facultative après validation des politiques légales
                        </label>
                        <details>
                            <summary>Identité et informations officielles à valider</summary>
                            <div className="seo-fields">
                                {Object.entries(labels).map(([key, label]) => (
                                    <label key={key}>
                                        {label}
                                        <textarea
                                            rows={key.endsWith('policy') || key === 'international_transfers' ? 3 : 1}
                                            value={global.data.identity[key] ?? ''}
                                            onChange={(event) => global.setData('identity', { ...global.data.identity, [key]: event.target.value })}
                                        />
                                    </label>
                                ))}
                            </div>
                        </details>
                        <Errors errors={global.errors} />
                        <button className="admin-primary" disabled={global.processing}>
                            Enregistrer les paramètres
                        </button>
                        {global.recentlySuccessful && <p role="status">Paramètres enregistrés.</p>}
                    </form>
                </section>
                <section className="seo-panel">
                    <h2>Métadonnées des pages publiques</h2>
                    <p>
                        Les champs vides utilisent les données de la page. Les URL existantes sont conservées ; aucun changement de slug ne crée de
                        lien cassé.
                    </p>
                    <form
                        onSubmit={(event) => {
                            event.preventDefault();
                            metadata.put('/dashboard/admin/seo/pages');
                        }}
                    >
                        <label>
                            Page
                            <select value={selected} onChange={(event) => choose(event.target.value)}>
                                {catalog.map((entry) => (
                                    <option value={entry.path} key={entry.path}>
                                        {entry.title} — {entry.path}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label>
                            Titre SEO
                            <input
                                maxLength={180}
                                value={metadata.data.title ?? ''}
                                onChange={(event) => metadata.setData('title', event.target.value)}
                            />
                        </label>
                        <label>
                            Description
                            <textarea
                                maxLength={300}
                                value={metadata.data.description ?? ''}
                                onChange={(event) => metadata.setData('description', event.target.value)}
                            />
                        </label>
                        <label>
                            Image sociale (chemin local /assets/ ou /storage/)
                            <input value={metadata.data.image ?? ''} onChange={(event) => metadata.setData('image', event.target.value)} />
                        </label>
                        <label>
                            URL canonique
                            <select
                                value={metadata.data.canonical_path ?? ''}
                                onChange={(event) => metadata.setData('canonical_path', event.target.value)}
                            >
                                <option value="">URL actuelle de la page</option>
                                {catalog.map((entry) => (
                                    <option key={entry.path} value={entry.path}>
                                        {entry.path}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="seo-check">
                            <input
                                type="checkbox"
                                checked={metadata.data.indexable}
                                onChange={(event) => metadata.setData('indexable', event.target.checked)}
                            />
                            Page indexable si l’indexation globale est autorisée
                        </label>
                        <Errors errors={metadata.errors} />
                        <button className="admin-primary" disabled={metadata.processing}>
                            Enregistrer les métadonnées
                        </button>
                        {metadata.recentlySuccessful && <p role="status">Métadonnées enregistrées.</p>}
                    </form>
                </section>
                <section>
                    <h2>Documents juridiques</h2>
                    <p>
                        Les brouillons ne sont jamais transmis aux visiteurs. La publication exige les informations officielles complètes et une
                        approbation explicite.
                    </p>
                    {documents.map((document) => (
                        <LegalEditor key={document.key} document={document} />
                    ))}
                </section>
                <section className="seo-panel">
                    <h2>Exploration et mesure</h2>
                    <p>
                        <a href="/sitemap.xml">Sitemap XML</a> · <a href="/robots.txt">Robots.txt</a> · <a href="/plan-du-site">Plan du site</a>
                    </p>
                    <p>
                        Aucun outil de mesure externe n’est activé. La mesure interne reste désactivée tant que les politiques ne sont pas validées.
                        La vérification Search Console et la soumission du sitemap se feront après le choix du domaine de production.
                    </p>
                    {audience?.length > 0 && (
                        <ul>
                            {audience.map((entry) => (
                                <li key={entry.event}>
                                    {entry.event} : {entry.total} événements sur les 30 derniers jours
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </div>
        </Dashboard>
    );
}
