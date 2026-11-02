import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import test from 'node:test';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
const require = createRequire(import.meta.url);
const source = await readFile(new URL('../../resources/js/components/student/DesktopCourseInfo.tsx', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 } });
const module = { exports: {} };
vm.runInNewContext(outputText, { module, exports: module.exports, require(name) {
    if (name === '@inertiajs/react') return { Link: ({ children, ...props }) => React.createElement('a', props, children) };
    if (name === 'lucide-react') return new Proxy({}, { get: () => () => null });
    if (name === '@/lib/scheduleDates') return { dateLabel: value => value };
    return require(name);
} });
const Info = module.exports.default;
const base = () => ({ course: { title:'Biologie', description:'Description vérifiée.',pedagogical_content:null,credits:4,semester:1,cmi_hours:null,td_hours:null,tp_hours:null }, academic: {level:'Licence 1',faculty:'Médecine',year:'2026-2027',group:null}, organization: [], period:null,stats:{}, attendanceHref:null });
test('La présentation conserve tous les paragraphes, y compris le préambule et les titres non reconnus', () => {
    const props = base(); props.course.pedagogical_content='PROPOSITION À VALIDER\nPréambule essentiel.\n\nOBJECTIFS ET ACQUIS ATTENDUS\nObjectifs réels.\n\nCONTENU DU COURS\nProgramme réel.\nTITRE PERSONNALISÉ\nParagraphe à conserver.\n\nRESSOURCES\nBibliographie à confirmer.';
    const html = renderToStaticMarkup(React.createElement(Info,props));
    for (const paragraph of ['Description vérifiée.','PROPOSITION À VALIDER','Préambule essentiel.','Objectifs réels.','Programme réel.','TITRE PERSONNALISÉ','Paragraphe à conserver.','Bibliographie à confirmer.']) assert.ok(html.includes(paragraph),paragraph);
    assert.match(html, /<details open="">/);
});
test('Une fiche incomplète conserve les inconnues et ne fabrique ni enseignant, ni heures, ni taux de présence', () => {
    const html=renderToStaticMarkup(React.createElement(Info,base()));
    assert.match(html,/équipe enseignante sera précisée/);
    assert.match(html,/Non renseigné/);
    assert.doesNotMatch(html,/0\s*%/);
    assert.doesNotMatch(html,/Suivi par séance/);
    assert.equal((html.match(/—/g)||[]).length,3);
});
