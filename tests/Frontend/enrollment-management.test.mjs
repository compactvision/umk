import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import test from 'node:test';
import vm from 'node:vm';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';

const require = createRequire(import.meta.url);
async function load(path) {
    const source = await readFile(new URL(`../../resources/js/${path}`, import.meta.url), 'utf8');
    const module = { exports: {} };
    const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 } }).outputText;
    vm.runInNewContext(output, { module, exports: module.exports, route: (name, value) => `/route/${name}?${typeof value === 'object' ? new URLSearchParams(value) : `id=${value}`}`, URLSearchParams, crypto: { randomUUID: () => 'operation-key' }, require(name) {
        if (name.endsWith('.css')) return {};
        if (name === '@inertiajs/react') return { Head: () => null, Link: ({ children, ...props }) => React.createElement('a', props, children), useForm: data => ({ data, errors: {}, processing: false }) };
        if (name === '@/components/layouts/Dashboard/Dashboard') return { default: ({ children }) => React.createElement('div', {}, children) };
        if (name === '@/components/admin/Pagination') return { default: () => null };
        if (name === '@/components/student/types') return { labels: { confirmed: 'Confirmée' }, money: value => String(value) };
        if (name === './navigation') return navigation;
        if (name === 'lucide-react') return new Proxy({}, { get: () => () => null });
        return require(name);
    } });
    return module.exports;
}
const navigation = await load('components/student/navigation.ts');
const MyEnrollments = (await load('pages/dashboard/studentAcademic/MyEnrollments.tsx')).default;
const Landing = (await load('components/student/ModuleLanding.tsx')).default;
const entry = { id: 7, year: '2026-2027', level: 'Niveau 1', status: 'confirmed', matricule: 'PERMANENT', faculty: 'Faculté', program: 'Programme historique', curriculum: 'V1', promotion: 'Promotion annuelle', group: 'Groupe A', requirements: ['Contrôle administratif à terminer.'], renewal: null };

test('L’entrée Inscriptions ouvre la page annuelle et les changements utilisent les demandes existantes', () => {
    const administration = navigation.studentModules.find(item => item.id === 'services');
    assert.equal(administration.items.find(item => item.label === 'Inscriptions').section, 'enrollments');
    const html = renderToStaticMarkup(React.createElement(Landing, { section: 'services', academic: 7, permissions: {} }));
    assert.match(html, /href="\/dashboard\/student\/enrollments"/);
    assert.doesNotMatch(html, /href="\/dashboard\/enrollments"/);
    assert.match(html, /href="\/dashboard\/student\/requests\?academic=7"/);
});

test('Les liens étudiants conservent le contexte des pages et ouvrent les listes transversales', () => {
    const { studentHref, studentModules } = navigation;
    const items = studentModules.flatMap(module => module.items);
    assert.ok(items.every(item => item.section));
    assert.equal(new Set(items.map(item => studentHref(item.section, 7, item.hash))).size, items.length);
    assert.equal(studentHref('overview', 7, 'home-schedule'), '/dashboard/student/overview?academic=7#home-schedule');
    assert.equal(studentHref('absences', 7), '/dashboard/student/absences');
    assert.equal(studentHref('enrollments', 7), '/dashboard/student/enrollments');
});

test('Les onglets du portail distinguent la lecture d’une page et les actions réglementées', () => {
    const { studentSectionAccess } = navigation;
    const permissions = {
        courses_view: { allowed: true },
        assignments_submit: { allowed: false },
        materials_download: { visible: false, allowed: false },
        schedule_view: { allowed: false, reason: 'Horaire fermé.' },
        results_view: { allowed: false },
    };
    assert.equal(studentSectionAccess('assignments', permissions).allowed, true);
    assert.equal(studentSectionAccess('materials', permissions).visible, false);
    assert.equal(studentSectionAccess('schedule', permissions).reason, 'Horaire fermé.');
    assert.equal(studentSectionAccess('results', permissions).allowed, false);
    assert.equal(studentSectionAccess('courses').allowed, false);
    assert.equal(studentSectionAccess('overview').allowed, true);

    const html = renderToStaticMarkup(React.createElement(Landing, { section: 'academics', academic: 7, permissions }));
    assert.match(html, /href="\/dashboard\/student\/assignments\?academic=7"/);
    assert.doesNotMatch(html, /href="\/dashboard\/student\/(?:schedule|materials)\?/);
});

test('La page annuelle présente promotion, groupe et conditions sans proposer une réinscription sans décision', () => {
    const html = renderToStaticMarkup(React.createElement(MyEnrollments, { entries: { data: [entry] }, changes: { data: [] } }));
    for (const text of ['PERMANENT', 'Programme historique', 'Promotion annuelle', 'Groupe A', 'Contrôle administratif à terminer.']) assert.ok(html.includes(text));
    assert.doesNotMatch(html, /Demander ma réinscription/);
});

test('Une décision ouverte propose la demande ; une cible existante ouvre son propre contexte', () => {
    const renewal = { id: 12, year: '2027-2028', level: 'Niveau 2', target_id: null, can_start: true };
    const html = renderToStaticMarkup(React.createElement(MyEnrollments, { entries: { data: [{ ...entry, renewal }] }, changes: { data: [] } }));
    assert.match(html, /Demander ma réinscription/);
    assert.match(html, /2027-2028/);
    const started = renderToStaticMarkup(React.createElement(MyEnrollments, { entries: { data: [{ ...entry, renewal: { ...renewal, target_id: 18, can_start: false } }] }, changes: { data: [] } }));
    assert.match(started, /Consulter la réinscription/);
    assert.match(started, /academic=18/);
    assert.doesNotMatch(started, /Demander ma réinscription/);
});
