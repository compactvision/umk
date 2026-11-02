import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot, hydrateRoot } from 'react-dom/client';

const appName = 'Université Simon Kimbangu';

createInertiaApp({
    title: (title) => (title.includes(appName) ? title : `${title} — ${appName}`),
    resolve: (name) => resolvePageComponent(`./pages/${name}.tsx`, import.meta.glob('./pages/**/*.tsx')),
    setup({ el, App, props }) {
        if (el.dataset.ssr === 'true') hydrateRoot(el, <App {...props} />);
        else createRoot(el).render(<App {...props} />);
    },
    progress: {
        color: '#4B5563',
    },
});
