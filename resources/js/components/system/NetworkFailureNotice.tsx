import { router } from '@inertiajs/react';
import { isAxiosError } from 'axios';
import { useEffect, useState } from 'react';
export default function NetworkFailureNotice() {
    const [failed, setFailed] = useState<{ mutation: boolean } | null>(null);
    useEffect(
        () =>
            router.on('exception', (event) => {
                const error = event.detail.exception;
                if (!isAxiosError(error) || error.response || !['ERR_NETWORK', 'ECONNABORTED', 'ETIMEDOUT'].includes(error.code ?? '')) return;
                event.preventDefault();
                if (document.querySelector('.swal2-container')) {
                    void import('sweetalert2')
                        .then(({ default: modal }) => {
                            if (modal.isLoading()) modal.close();
                        })
                        .catch(() => {});
                }
                setFailed({ mutation: !['get', 'head'].includes(error.config?.method?.toLowerCase() ?? 'get') });
            }),
        [],
    );
    if (!failed) return null;
    return (
        <aside role="alert" className="network-failure-notice">
            <strong>Connexion interrompue</strong>
            <p>
                {failed.mutation
                    ? 'L’action a peut-être été enregistrée. Rechargez la page pour vérifier son état avant de réessayer.'
                    : 'La page n’a pas pu être chargée. Vérifiez votre connexion puis rechargez-la.'}
            </p>
            <div>
                <button type="button" onClick={() => window.location.reload()}>
                    Vérifier la page
                </button>
                <button type="button" onClick={() => setFailed(null)}>
                    Fermer
                </button>
            </div>
        </aside>
    );
}
