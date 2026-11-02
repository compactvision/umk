import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import test from 'node:test';
import ts from 'typescript';
const require = createRequire(import.meta.url);
const source = await readFile(new URL('../../resources/js/components/section/dashboard/enrollement/ReviewFeedback.tsx', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 } });

function submit(file, errors = {}) {
    const calls = [];
    const input = { files: file ? [file] : [], focus() {} };
    let transform = () => ({ file: null });
    const form = {
        data: { file: null }, errors, processing: false, progress: null,
        clearErrors() {}, setError(key, message) { calls.push({ error: key, message }); },
        transform(callback) { transform = callback; }, // React useForm.transform returns void.
        post(url, options) { calls.push({ url, data: transform(), options }); },
    };
    const module = { exports: {} };
    vm.runInNewContext(outputText, {
        module, exports: module.exports,
        require(name) {
            if (name === '@inertiajs/react') return { useForm: () => form };
            if (name === 'lucide-react') return { FileUp: () => null, Upload: () => null };
            if (name === 'react') return { useRef: () => ({ current: input }) };
            if (name.endsWith('.css')) return {};
            return require(name);
        },
    });
    const element = module.exports.ReplacementForm({ document: { uuid: 'test-document' }, limit: 2048 });
    element.props.onSubmit({ preventDefault() {} });
    return calls;
}

test('Un fichier valide est envoyé en multipart avec un espace d’erreurs propre à la pièce', () => {
    const file = { name: 'corrige.pdf', size: 1200 };
    const [call] = submit(file);
    assert.equal(call.url, '/dashboard/enrollments/documents/test-document/replace');
    assert.equal(call.data.file, file);
    assert.equal(call.options.forceFormData, true);
    assert.equal(call.options.errorBag, 'replacement-test-document');
});
test('Une ancienne erreur ne bloque pas la nouvelle tentative d’envoi', () => {
    const file = { name: 'corrige.jpg', size: 1200 };
    const [call] = submit(file, { file: 'Erreur de la tentative précédente' });
    assert.equal(call.data.file, file);
});
test('Sans fichier, le bouton affiche une explication sans envoyer de requête', () => {
    const [call] = submit(null);
    assert.equal(call.error, 'file');
    assert.match(call.message, /Choisissez/);
    assert.equal(call.url, undefined);
});
test('Les fichiers trop volumineux ou de format incorrect ne sont pas envoyés', () => {
    for (const file of [{ name: 'trop-grand.pdf', size: 3 * 1024 * 1024 }, { name: 'programme.exe', size: 100 }]) {
        const [call] = submit(file);
        assert.equal(call.error, 'file');
        assert.equal(call.url, undefined);
    }
});
