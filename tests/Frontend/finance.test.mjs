import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import test from 'node:test';
import vm from 'node:vm';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';

const require = createRequire(import.meta.url);
async function load(path, imports = {}) {
    const source = await readFile(new URL(`../../resources/js/${path}`, import.meta.url), 'utf8');
    const module = { exports: {} };
    const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 } }).outputText;
    vm.runInNewContext(output, { module, exports: module.exports, route: (name, value) => `/route/${name}?${typeof value === 'object' ? new URLSearchParams(value) : `id=${value}`}`, URLSearchParams, crypto: { randomUUID: () => 'operation-key' }, require(name) {
        if (name in imports) return imports[name];
        if (name.endsWith('.css')) return {};
        if (name === '@inertiajs/react') return { Head: () => null, Link: ({ children, preserveScroll, ...props }) => React.createElement('a', { ...props, 'data-inertia': 'true', 'data-preserve-scroll': preserveScroll || undefined }, children), useForm: data => ({ data, errors: {}, processing: false }) };
        if (name === '@/components/layouts/Dashboard/Dashboard') return { default: ({ children }) => React.createElement('div', {}, children) };
        if (name === '../studentAcademic/AcademicForm' || name === '@/components/admin/AdminModal') return { default: () => null };
        if (name === '@/components/admin/Pagination') return { default: () => null };
        if (name === '@/hooks/use-panel-fade') return { usePanelFade: React.useRef };
        if (name === '@/components/student/types') return { labels: { confirmed: 'Confirmée' }, money: (value, currency) => `${value} ${currency}` };
        if (name === 'lucide-react') return new Proxy({}, { get: () => () => null });
        return require(name);
    } });
    return module.exports;
}

const charts = await load('pages/dashboard/finance/FinanceCharts.tsx');
const overview = await load('pages/dashboard/finance/FinanceOverview.tsx', { './FinanceCharts': charts });
const Finance = (await load('pages/dashboard/finance/Index.tsx', { './FinanceOverview': overview })).default;
const page = { entries: {data: []}, selected: null, filters: {}, statement: null, totals: [], cashflow: {start_month: '2025-12', end_month: '2026-11', series: []}, breakdowns: {faculties: [], fee_kinds: []}, obligations: [], adjustments: null, payments: null, refunds: null, tariffs: {data: []}, years: [], faculties: [], programs: [], levels: [], cycles: [], currencies: ['USD', 'CDF'], methods: ['cash', 'bank_transfer'], dualControl: false, preview: null };
const total = (currency, amount) => ({currency, billed_cents: amount, waived_cents: 0, due_cents: amount, gross_cents: 0, refunded_cents: 0, net_cents: 0, balance_cents: amount, overdue_cents: 0, pending_cents: 0, cancelled_cents: 0, legacy_reversal_cents: 0});
test('L’export CSV utilise un lien navigateur et conserve les filtres', () => {
    const html = renderToStaticMarkup(React.createElement(Finance, { ...page, filters: { year: 4, currency: 'USD' } }));
    assert.match(html, /<a[^>]*href="\/route\/dashboard\.admin\.finance\.export\?year=4&amp;currency=USD">\s*Exporter les totaux CSV<\/a>/);
});
test('Le classeur Excel est téléchargé depuis le périmètre affiché', () => {
    const html = renderToStaticMarkup(React.createElement(Finance, { ...page, filters: { year: 4, faculty: 2, program: 7, q: 'Kasa' } }));
    assert.match(html, /<a class="finance-export finance-export-xlsx" href="\/route\/dashboard\.admin\.finance\.export-xlsx\?year=4&amp;faculty=2&amp;program=7&amp;q=Kasa">\s*Exporter le rapport Excel<\/a>/);
});
test('Les indicateurs affichent chaque devise sans fabriquer un total converti', () => {
    const html = renderToStaticMarkup(React.createElement(Finance, {...page, totals: [total('USD', 10000), total('CDF', 25000)]}));
    assert.match(html, /10000 USD/); assert.match(html, /25000 CDF/); assert.doesNotMatch(html, /35000/);
});
test('Les flux mensuels présentent les remboursements et un flux net négatif, avec les valeurs en tableau', () => {
    const html = renderToStaticMarkup(React.createElement(Finance, {
        ...page, totals: [total('USD', 10000)],
        cashflow: {
            ...page.cashflow,
            series: [{ currency: 'USD', months: [
                { month: '2026-10', gross_cents: 6000, refunded_cents: 0, net_cents: 6000 },
                { month: '2026-11', gross_cents: 0, refunded_cents: 2400, net_cents: -2400 },
            ] }],
        },
    }));
    assert.match(html, /aria-label="nov 2026" title="novembre 2026"/);
    assert.match(html, /Voir les montants par mois/);
    assert.match(html, /<td>-2400 USD<\/td>/);
    assert.match(html, /Couverture des frais/);
});
test('Les graphiques de recouvrement affichent le détail dans la devise active', () => {
    const row = { ...total('USD', 10000), covered_cents: 4000, balance_cents: 6000, overdue_cents: 2500 };
    const html = renderToStaticMarkup(React.createElement(Finance, {
        ...page, totals: [row, total('CDF', 25000)],
        breakdowns: {
            faculties: [
                { ...row, faculty_id: 2, faculty_name: 'Droit' },
                { ...row, currency: 'CDF', faculty_id: 3, faculty_name: 'Médecine' },
            ],
            fee_kinds: [{ ...row, kind: 'tuition' }],
        },
    }));
    assert.match(html, /data-finance-chart="finance-faculties"/);
    assert.match(html, /data-finance-chart="finance-fees"/);
    assert.match(html, />Droit</);
    assert.doesNotMatch(html, />Médecine</);
    assert.match(html, />Scolarité</);
    assert.match(html, />2500 USD</);
});
test('Le relevé est prévisualisé et exige une sélection explicite avant rapprochement', () => {
    const html = renderToStaticMarkup(React.createElement(Finance, {...page, preview: {account: 'Banque', rows: [{bank_reference: 'OP1', payment_reference: 'PAY1', amount_cents: 5000, currency: 'USD', date: '2026-11-07', state: 'match'}]}}));
    assert.match(html, /Prévisualiser sans modifier les paiements/); assert.match(html, /Confirmer les correspondances sélectionnées/);
    assert.doesNotMatch(html, /checked=""/); assert.match(html, /disabled=""/);
});
test('Un paiement en vérification propose un contrôle et ne possède pas de reçu payé', () => {
    const balance = {currency: 'USD', due_cents: 10000, paid_cents: 0, balance_cents: 10000, credit_cents: 0};
    const html = renderToStaticMarkup(React.createElement(Finance, {...page, selected: {id: 1, name: 'Étudiant', year: '2026-2027'}, statement: {balance, schedules: {}, kinds: {}}, payments: {data: [{id: 1, reference: 'PENDING', amount_cents: 1000, currency: 'USD', kind: 'tuition', method: 'cash', status: 'pending', confirmed_at: null}]}}));
    assert.match(html, /Confirmer<\/button>/); assert.doesNotMatch(html, /Reçu et état actuel<\/a>/);
    assert.doesNotMatch(html, /Demander un remboursement<\/button>/);
});
