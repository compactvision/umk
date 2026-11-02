import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import test from 'node:test';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
const require=createRequire(import.meta.url);
const source=await readFile(new URL('../../resources/js/components/student/PortalCards.tsx',import.meta.url),'utf8');
const {outputText}=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}});
const module={exports:{}};
vm.runInNewContext(outputText,{module,exports:module.exports,require(name){
    if(name==='@inertiajs/react')return {Link:({href,children,...props})=>React.createElement('a',{href,...props},children)};
    if(name==='lucide-react')return new Proxy({}, {get:()=>()=>null});
    if(name==='@/lib/studentEnrollment')return {formatDate:()=> '01 novembre 2026'};
    if(name==='./types')return {labels:{},money:(value)=>`${value/100} USD`};
    return require(name);
}});
const {LockedFeatureCard,PaymentOverview}=module.exports;
const props={title:'Mes supports',subtitle:'Les ressources publiées',icon:()=>null,href:'/dashboard/student/materials?academic=1',regularizationHref:'/dashboard/student/fees?academic=1'};
test('Un service verrouillé présente la raison et le lien de régularisation sans lien vers une route interdite',()=>{
    const html=renderToStaticMarkup(React.createElement(LockedFeatureCard,{...props,available:true,permission:{allowed:false,reason:'Acompte confirmé insuffisant.'}}));
    assert.match(html,/Acompte confirmé insuffisant/);assert.match(html,/href="\/dashboard\/student\/fees\?academic=1"/);assert.doesNotMatch(html,/href="\/dashboard\/student\/materials/);
});
test('Un service autorisé ouvre la ressource du contexte académique courant',()=>{
    const html=renderToStaticMarkup(React.createElement(LockedFeatureCard,{...props,available:true,permission:{allowed:true,reason:null}}));
    assert.match(html,/href="\/dashboard\/student\/materials\?academic=1"/);assert.doesNotMatch(html,/is-locked/);
});
test('Sans barème affecté, les indicateurs ne prétendent pas que les frais sont réglés',()=>{
    const html=renderToStaticMarkup(React.createElement(PaymentOverview,{balance:{assessed:false,total_cents:0,waived_cents:0,paid_cents:0,balance_cents:0,currency:'USD'}}));
    assert.match(html,/À confirmer/);assert.doesNotMatch(html,/0 USD/);
});

test('La fiche d’accueil affiche les coordonnées, le matricule et le nombre réel de cours du contexte',()=>{
    const html=renderToStaticMarkup(React.createElement(module.exports.StudentIdentityCard,{academic:{id:7,name:'Étudiante Test',email:'etudiante@example.test',matricule:'MAT-007',student_status:'active',level:'Licence 1',year:'2026–2027'},courseCount:4}));
    assert.match(html,/etudiante@example.test/);assert.match(html,/MAT-007/);assert.match(html,/>4<\/strong>/);assert.match(html,/Licence 1/);assert.match(html,/courses\?academic=7/);
});
