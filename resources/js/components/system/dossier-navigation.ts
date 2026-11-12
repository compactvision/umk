import { router } from '@inertiajs/react';

const routes = {
    enrollments: /^\/dashboard\/admin\/enrollments\/\d+$/,
    students: /^\/dashboard\/admin\/student-academic\/\d+$/,
    faculties: /^\/dashboard\/admin\/faculties\/\d+$/,
    levels: /^\/dashboard\/admin\/levels\/details\/\d+$/,
};

type ListPosition = { href: string; left: number; top: number; catalogView?: unknown };
const positions = new Map<string, ListPosition>();
const pathOf = (url: string) =>
    url
        .split(/[?#]/, 1)[0]
        .replace(/\/$/, '')
        .replace(/^(\/dashboard\/admin\/levels)\/(\d+)$/, '$1/details/$2');

function detailModule(path: string) {
    return (Object.keys(routes) as (keyof typeof routes)[]).find((key) => routes[key].test(path));
}

export function catalogViewKey(url: string) {
    return `catalog-view:${pathOf(url)}`;
}

export function isDossierOpening(source: string, target: string) {
    const path = pathOf(source);
    switch (detailModule(pathOf(target))) {
        case 'enrollments':
            return path === '/dashboard/admin/enrollments';
        case 'students':
            return [
                '/dashboard/admin/student-academic',
                '/dashboard/admin/student-academic/administration',
                '/dashboard/admin/student-academic/renewals',
            ].includes(path);
        case 'faculties':
            return path === '/dashboard/admin/faculties';
        case 'levels':
            return path === '/dashboard/admin/levels' || routes.faculties.test(path);
        default:
            return false;
    }
}

export function rememberDossierList(target: URL) {
    const current = window.location;
    const targetPath = pathOf(target.pathname);
    const targetModule = detailModule(targetPath);
    if (target.origin !== current.origin || !targetModule) return;

    const currentPosition = dossierListPosition(current.pathname);
    if (currentPosition && pathOf(currentPosition.href) === targetPath) return;

    if (isDossierOpening(current.pathname, targetPath)) {
        positions.set(targetPath, {
            href: current.pathname + current.search + current.hash,
            left: window.scrollX,
            top: window.scrollY,
            catalogView: router.restore(catalogViewKey(current.pathname)),
        });
    } else if (currentPosition && detailModule(pathOf(current.pathname)) === targetModule) {
        positions.set(targetPath, currentPosition);
    } else {
        positions.delete(targetPath);
    }
}

export function dossierListPosition(dossierUrl: string) {
    return positions.get(pathOf(dossierUrl));
}

function normalizeListUrl(href: string) {
    const url = new URL(href, window.location.origin);
    url.searchParams.sort();
    return pathOf(url.pathname) + url.search;
}

export function catalogReturnView(target: string) {
    const position = dossierListPosition(window.location.pathname);
    if (position && normalizeListUrl(target) === normalizeListUrl(position.href)) return position.catalogView;
}
