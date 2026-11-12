import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import test from 'node:test';
import vm from 'node:vm';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const source = await readFile(new URL('../../resources/js/pages/dashboard/levels/tabs/CoursesTab.tsx', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
});
const module = { exports: {} };
let props;
vm.runInNewContext(outputText, {
    module,
    exports: module.exports,
    route: (name, params) => `${name}/${params.offering ?? params.level_id}`,
    require(name) {
        if (name === '@inertiajs/react') {
            return {
                usePage: () => ({ props }),
                useForm: () => ({}),
                Link: ({ href, children }) => React.createElement('a', { href }, children),
            };
        }
        if (name === 'lucide-react') return new Proxy({}, { get: () => () => null });
        if (name.startsWith('@/') || name.endsWith('.css')) return {};
        return require(name);
    },
});

function render(status, canManageCourses = true) {
    props = {
        courses: [{ id: 1, title: 'Biologie', catalog_status: status, credits: 3, semester: 1 }],
        level: { id: 2, title: 'Licence' },
        levelDetail: { credit_required: 30 },
        teachingAssignments: [{ id: 3, course_id: 1, curriculum_item_id: 4, academic_year: { title: '2026–2027' } }],
        canManageCourses,
    };
    return renderToStaticMarkup(React.createElement(module.exports.default));
}

test('Une matière archivée et son offre versionnée restent consultables', () => {
    const markup = render('archived');
    assert.match(markup, /dashboard\.admin\.teaching\.index\/3/);
    assert.doesNotMatch(markup, /Modifier Biologie|Modifier l’affectation|Affecter un enseignant/);
});

test('L’ajout d’une affectation exige une matière active et un périmètre autorisé', () => {
    assert.match(render('active'), /Affecter un enseignant/);
    assert.doesNotMatch(render('inactive'), /Affecter un enseignant/);
    assert.doesNotMatch(render('active', false), /Affecter un enseignant|Modifier Biologie|Ajouter un cours/);
});
