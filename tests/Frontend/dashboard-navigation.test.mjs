import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import test from 'node:test';
import vm from 'node:vm';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const source = await readFile(new URL('../../resources/js/components/layouts/Dashboard/Sidebar.tsx', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
});
const destinations = {
    home: '/',
    'dashboard.enrollments.index': '/dashboard/enrollments',
    'dashboard.teaching.index': '/dashboard/teacher',
    'dashboard.teaching.learning.index': '/dashboard/teacher/resources',
    'dashboard.teaching.assessments.index': '/dashboard/teacher/assessments',
};
const module = { exports: {} };
let page;
vm.runInNewContext(outputText, {
    module,
    exports: module.exports,
    URL,
    require(name) {
        if (name === '@/components/layouts/Dashboard/adminNavigation') {
            return { adminNavigation: [{ id: 'schedule', title: 'Planning', shortLabel: 'Planning', icon: () => null, items: [
                ['Salles', { href: '/dashboard/admin/schedule/resources', institutionWide: true, anyPermission: ['publish academic content'] }],
            ] }] };
        }
        if (name === '@/components/student/navigation') return { studentModules: [] };
        if (name === '@/utils/sweetAlert') return {};
        if (name === '@inertiajs/react') return { usePage: () => page };
        if (name === 'lucide-react') return new Proxy({}, { get: () => () => null });
        if (name === 'ziggy-js') {
            return {
                route: (routeName) => {
                    assert.ok(destinations[routeName], routeName);
                    return destinations[routeName];
                },
            };
        }
        return require(name);
    },
});

function sidebar(role, menu, { props = {}, url = '/', isMobile = false, isMobileSidebarOpen = false } = {}) {
    page = { props, url };
    return renderToStaticMarkup(
        React.createElement(module.exports.default, {
            userRole: [role],
            currentActiveMenu: menu,
            isMobile,
            isMobileSidebarOpen,
            onButtonClick: () => {},
            onCloseMenu: () => {},
        }),
    );
}

test('Le menu du rôle professor ouvre les trois espaces enseignants', () => {
    const markup = sidebar('professor', 'teaching', {
        props: { teachingProfileActive: true, auth: { user: { permissions: ['manage courses'] } } },
        url: destinations['dashboard.teaching.index'],
    });
    for (const href of Object.values(destinations).filter((url) => url.startsWith('/dashboard/teacher'))) {
        assert.ok(markup.includes(`href="${href}"`), href);
    }
    assert.doesNotMatch(markup, /href="#"/);
    assert.match(markup, /href="\/dashboard\/teacher" aria-current="page"/);
});

test('Un enseignant sans fiche active accède à ses cours et reçoit les instructions de rattachement', () => {
    const markup = sidebar('professor', 'teaching');
    assert.match(markup, /href="\/dashboard\/teacher"/);
    assert.doesNotMatch(markup, /href="\/dashboard\/teacher\//);
});

test('Le lien vers les évaluations exige le droit de gestion des cours', () => {
    const markup = sidebar('professor', 'teaching', { props: { teachingProfileActive: true } });
    assert.match(markup, /href="\/dashboard\/teacher\/resources"/);
    assert.doesNotMatch(markup, /href="\/dashboard\/teacher\/assessments"/);
});

test('Un panneau mobile fermé et les sous-menus inactifs sont inertes', () => {
    const markup = sidebar('candidate', null, { isMobile: true });
    assert.match(markup, /aria-label="Navigation principale" inert=""/);
    assert.match(markup, /id="sidebar-panel-enrollments"[^>]+inert="" aria-hidden="true"/);
});

test('Le lien institutionnel respecte la permission et le périmètre administratif', () => {
    const auth = (permissions, hasAcademicFacultyScope) => ({ auth: { user: { permissions, hasAcademicFacultyScope } } });
    assert.match(sidebar('admin', 'schedule', { props: auth(['publish academic content'], false) }), /href="\/dashboard\/admin\/schedule\/resources"/);
    for (const props of [auth([], false), auth(['publish academic content'], true)]) {
        assert.doesNotMatch(sidebar('admin', 'schedule', { props }), /href="\/dashboard\/admin\/schedule\/resources"/);
    }
});

test('Le rôle candidate accède au suivi de ses candidatures', () => {
    const markup = sidebar('candidate', 'enrollments');
    assert.match(markup, /href="\/dashboard\/enrollments"/);
    assert.doesNotMatch(markup, /href="\/dashboard\/teacher/);
});
