import NetworkFailureNotice from '@/components/system/NetworkFailureNotice';
import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot, hydrateRoot } from 'react-dom/client';

const appName = 'Université Simon Kimbangu';

createInertiaApp({
    title: (title) => (title.includes(appName) ? title : `${title} — ${appName}`),
    resolve: (name) => resolvePageComponent(`./pages/${name}.tsx`, import.meta.glob('./pages/**/*.tsx')),
    setup({ el, App, props }) {
        const content = (
            <>
                <App {...props} />
                <NetworkFailureNotice />
            </>
        );
        if (el.dataset.ssr === 'true') hydrateRoot(el, content);
        else createRoot(el).render(content);
    },
    progress: {
        color: '#4B5563',
    },
});
