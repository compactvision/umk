import PageHeading from '@/components/admin/PageHeading';
import Dashboard from '@/components/layouts/Dashboard/Dashboard';
import { defaultCardDesign, FlatCard, type CardDesign, type CardIdentity } from '@/components/studentCards/CardArtwork';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { ArrowLeft, Check, Printer } from 'lucide-react';
import { useRef, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import '../../../../css/dashboard/card-issuance.css';
import '../../../../css/dashboard/card-requests.css';

type Props = {
    enrollment: number;
    identity: CardIdentity;
    template: (CardDesign & { id: number }) | null;
    templates: { id: number; name: string }[];
    version: string;
};

const prefix = 'dashboard.admin.card-issuance.';
const subscribeToBrowser = () => () => {};
const inBrowser = () => true;
const onServer = () => false;

function PrintPreview({ enrollment, identity, template, templates, version }: Props) {
    const [checking, setChecking] = useState(false);
    const [printOpened, setPrintOpened] = useState(false);
    const [error, setError] = useState('');
    const printRoot = useRef<HTMLDivElement>(null);
    const mounted = useSyncExternalStore(subscribeToBrowser, inBrowser, onServer);
    const form = useForm({ version, template: template?.id ?? null });
    const design = template ?? defaultCardDesign;

    async function print() {
        if (!printRoot.current || checking) return;
        setChecking(true);
        setError('');
        setPrintOpened(false);
        try {
            const response = await fetch(route(prefix + 'check', { enrollment, version, template: template?.id }), {
                headers: { Accept: 'application/json' },
                cache: 'no-store',
            });
            const result = await response.json();
            if (!response.ok || !result.ready) {
                setError(result.errors?.card?.[0] || 'L’aperçu ne peut plus être imprimé. Rechargez le dossier.');
                return;
            }
            await Promise.all(Array.from(printRoot.current.querySelectorAll('img'), (image) => image.decode()));
            window.print();
            setPrintOpened(true);
        } catch {
            setError('Impossible de préparer l’impression. Vérifiez que la photo se charge, puis réessayez.');
        } finally {
            setChecking(false);
        }
    }

    return (
        <Dashboard hideAppsNavigation>
            <Head title="Aperçu avant impression" />
            <div className="cr-page">
                <PageHeading
                    title="Aperçu avant impression"
                    description={`${identity.student_name} · ${identity.matricule} · ${identity.academic_year}`}
                    action={
                        <Link className="admin-secondary" href={route(prefix + 'printing')}>
                            <ArrowLeft size={17} /> Liste des badges
                        </Link>
                    }
                />
                <div className="ci-preview cr-panel">
                    <div className="ci-print-toolbar">
                        <label>
                            Modèle de carte
                            <select
                                value={template?.id ?? ''}
                                disabled={checking || form.processing || templates.length === 0}
                                onChange={(event) =>
                                    router.get(
                                        route(prefix + 'preview', { enrollment, template: Number(event.target.value) }),
                                        {},
                                        { preserveScroll: true },
                                    )
                                }
                            >
                                {!templates.length && <option value="">Modèle USK</option>}
                                {templates.map((item) => (
                                    <option key={item.id} value={item.id}>
                                        {item.name}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <button className="admin-primary" type="button" disabled={checking || form.processing} onClick={print}>
                            <Printer size={17} /> {checking ? 'Préparation…' : 'Imprimer'}
                        </button>
                    </div>
                    <div className="ci-faces ct-stage">
                        {[false, true].map((reverse) => (
                            <figure key={String(reverse)}>
                                <figcaption>{reverse ? 'VERSO' : 'RECTO'}</figcaption>
                                <FlatCard design={design} identity={identity} reverse={reverse} />
                            </figure>
                        ))}
                    </div>
                    <p className="ci-print-help">
                        Dans le pilote de l’imprimante, choisissez le format carte 85,60 × 53,98 mm et l’échelle 100 %. Le recto et le verso sont
                        envoyés sur deux pages.
                    </p>
                    {(error || Object.keys(form.errors).length > 0) && (
                        <p className="ci-error" role="alert">
                            {error || Object.values(form.errors).join(' ')}
                        </p>
                    )}
                    {printOpened && (
                        <form
                            className="ci-confirm-print"
                            onSubmit={(event) => {
                                event.preventDefault();
                                form.post(route(prefix + 'printed', enrollment));
                            }}
                        >
                            <p>Confirmez lorsque les deux faces ont bien été imprimées. La carte passera alors en attente de retrait.</p>
                            <button type="submit" className="admin-primary" disabled={form.processing}>
                                <Check size={17} /> Confirmer l’impression
                            </button>
                        </form>
                    )}
                </div>
            </div>
            {mounted &&
                createPortal(
                    <div className="ci-print" ref={printRoot} aria-hidden="true">
                        <FlatCard design={design} identity={identity} reverse={false} />
                        <FlatCard design={design} identity={identity} reverse />
                    </div>,
                    document.body,
                )}
        </Dashboard>
    );
}

export default function Preview(props: Props) {
    return <PrintPreview key={props.version} {...props} />;
}
