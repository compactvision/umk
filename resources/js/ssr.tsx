import NavigationFeedback from '@/components/system/NavigationFeedback';
import { createInertiaApp } from '@inertiajs/react';
import createServer from '@inertiajs/react/server';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import ReactDOMServer from 'react-dom/server';
import { type RouteName, route } from 'ziggy-js';

const appName = 'Université Simon Kimbangu';

createServer((page) =>
    createInertiaApp({
        page,
        render: ReactDOMServer.renderToString,
        title: (title) => (title.includes(appName) ? title : `${title} — ${appName}`),
        resolve: (name) => {
            const publicPages = [
                'Homepage',
                'Aboutpage',
                'Admissionpage',
                'Contactpage',
                'Tuitionspage',
                'Blogpage',
                'BlogDetailsPage',
                'courses/Coursespage',
                'courses/CourseShow',
                'faculties/FacultyShow',
                'legal/LegalPage',
                'legal/SitePlan',
            ];
            if (!publicPages.includes(name)) throw new Error('SSR réservé aux pages publiques');
            return resolvePageComponent(`./pages/${name}.tsx`, import.meta.glob('./pages/**/*.tsx'));
        },
        setup: ({ App, props }) => {
            /* eslint-disable */
            // @ts-expect-error
            global.route<RouteName> = (name, params, absolute) =>
                route(name, params as any, absolute, {
                    // @ts-expect-error
                    ...page.props.ziggy,
                    // @ts-expect-error
                    location: new URL(page.props.ziggy.location),
                });
            /* eslint-enable */

            return (
                <NavigationFeedback>
                    <App {...props} />
                </NavigationFeedback>
            );
        },
    }),
);
