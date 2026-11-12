import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
import vm from 'node:vm';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const source = new URL('../../resources/js/pages/dashboard/levels/', import.meta.url);

function load(path, imports, globals = {}) {
    const file = readFileSync(new URL(path, source), 'utf8');
    const { outputText } = ts.transpileModule(file, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } });
    const exports = {};
    vm.runInNewContext(outputText, {
        exports,
        require: (name) => imports[name] ?? require(name),
        ...globals,
    });
    return exports;
}

const utils = load('utils/levelUtils.tsx', { '@/utils/sweetAlert': {}, '@inertiajs/react': {} });

test('Annuler un brouillon de niveau écarte ses valeurs et conserve les champs non renseignés', () => {
    let draft;
    let submission;
    const { useLevelData } = load('hooks/useLevelData.tsx', {
        '../utils/levelUtils': utils,
        react: {
            useState: (initial) => {
                draft ??= initial;
                return [draft, (next) => { draft = typeof next === 'function' ? next(draft) : next; }];
            },
        },
    });
    const { useLevelModals } = load('hooks/useLevelModals.tsx', {
        '../utils/levelUtils': utils,
        '@/utils/sweetAlert': {},
        '@inertiajs/react': {
            useForm: (data) => ({ data }),
            router: { post: (url, body) => { submission = { url, body }; } },
        },
        react: { useState: (initial) => [initial, () => {}] },
    }, { File, FormData, route: (name, id) => `${name}/${id}` });
    const { default: Info } = load('tabs/InfosTab.tsx', {
        '../sections/StatsGrid': { default: () => null },
        '../sections/DetailsSection': { default: () => null },
        '../sections/IllustrationSection': { default: () => null },
    });
    const level = { id: 73, level_id: 26, duration_years: 1, credit_required: null, language: null, has_certificate: false, options: [] };
    const modals = useLevelModals(level);

    let data = useLevelData(level);
    Info({ levelDataHook: data, modalsHook: modals }).props.children[1].props.onEdit('language');
    data.updateField('language', 'À annuler');
    data = useLevelData(level);
    assert.equal(data.detailsData.language, '');
    assert.equal(data.getFieldValue('language'), 'À annuler');
    modals.setIsEditModalOpen(false);

    Info({ levelDataHook: data, modalsHook: modals }).props.children[0].props.onEdit('duration_years');
    data.updateField('duration_years', 2);
    modals.saveEdit(useLevelData(level));
    assert.equal(submission.url, 'dashboard.admin.levels.details.update/73');
    assert.equal(submission.body.get('duration_years'), '2');
    assert.equal(submission.body.get('credit_required'), '');
    assert.equal(submission.body.get('language'), '');
    assert.equal(submission.body.get('has_certificate'), '0');
    assert.equal(submission.body.get('_method'), 'PUT');
    assert.equal(submission.body.has('illustration_image'), false);
});

test('L’aperçu en grand reprend l’URL d’illustration sans doubler le chemin de stockage', () => {
    const { default: Preview } = load('modals/ImagePreviewModal.tsx', {
        '../utils/levelUtils': utils,
        'lucide-react': { X: () => null },
    });
    for (const [imageSrc, expected] of [
        ['illustrations/droit.webp', '/storage/illustrations/droit.webp'],
        ['/assets/illustrations/droit.webp', '/assets/illustrations/droit.webp'],
        ['https://example.test/droit.webp', 'https://example.test/droit.webp'],
    ]) {
        const markup = renderToStaticMarkup(createElement(Preview, { isOpen: true, imageSrc, onClose: () => {} }));
        assert.ok(markup.includes(`src="${expected}"`), expected);
    }
});
