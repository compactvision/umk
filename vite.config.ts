import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { resolve } from 'node:path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), ['APP_URL', 'VITE_DEV_HOST']);
    // Laravel uses the HMR host to write the asset URL in public/hot.
    const appHost = URL.canParse(env.APP_URL ?? '') ? new URL(env.APP_URL).hostname : 'localhost';
    const devHost = env.VITE_DEV_HOST || appHost;

    return {
        plugins: [
            laravel({
                input: ['resources/css/app.css', 'resources/js/app.tsx'],
                ssr: 'resources/js/ssr.tsx',
                refresh: true,
            }),
            react(),
            tailwindcss(),
        ],
        base: '/build/',
        server: {
            host: '0.0.0.0',
            hmr: {
                host: devHost,
            },
        },
        esbuild: {
            jsx: 'automatic',
        },
        resolve: {
            alias: {
                'ziggy-js': resolve(__dirname, 'vendor/tightenco/ziggy'),
            },
        },
    };
});
