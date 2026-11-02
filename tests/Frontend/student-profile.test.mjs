import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import test from 'node:test';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
const require=createRequire(import.meta.url);
const source=await readFile(new URL('../../resources/js/components/student/StudentProfileForm.tsx',import.meta.url),'utf8');
const {outputText}=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}});
const module={exports:{}};
vm.runInNewContext(outputText,{module,exports:module.exports,require(name){
    if(name.endsWith('.css'))return {};
    if(name==='@inertiajs/react')return {useForm:data=>({data,errors:{},processing:false})};
    if(name==='lucide-react')return new Proxy({}, {get:()=>()=>null});
    return require(name);
}});
const props={academic:{id:7,matricule:'MED0001'},profile:{values:{first_name:'Marie',last_name:'Test',email:'marie@example.test'},provinces:['Kinshasa','Kongo-Central']},onFeedback:()=>{}};
test('Le profil affiche les six sections et protège le matricule attribué',()=>{
    const html=renderToStaticMarkup(React.createElement(module.exports.default,props));
    for(const label of ['Votre identité','Compte et contact','Origine et résidence','Personne à contacter en cas d’urgence','Diplôme d’accès','Photo de profil'])assert.ok(html.includes(label));
    assert.match(html,/MED0001/);assert.match(html,/readOnly=""/);assert.doesNotMatch(html,/name="matricule"/);
    assert.match(html,/multipart\/form-data/);assert.match(html,/Enregistrer mon profil/);
});
test('Les choix Autre affichent les précisions nécessaires pour la province et le diplôme',()=>{
    const changed={...props,profile:{...props.profile,values:{...props.profile.values,province:'other',diploma_type:'other',email:'nouvelle@example.test'}}};
    const html=renderToStaticMarkup(React.createElement(module.exports.default,changed));
    assert.match(html,/Précisez la province/);assert.match(html,/Précisez le diplôme/);
    assert.match(html,/Kinshasa/);assert.match(html,/Kongo-Central/);
});
