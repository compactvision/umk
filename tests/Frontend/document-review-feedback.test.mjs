import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import test from 'node:test';
import ts from 'typescript';
const require = createRequire(import.meta.url);
const source = await readFile(new URL('../../resources/js/pages/dashboard/adminEnrollments/DocumentReview.tsx', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 } });
function setup(processing = false) {
    const feedback = [];
    let request;
    const form = { data: { verdict: 'accepted', reason: '' }, processing, errors: {}, post(url, options) { request = { url, options }; } };
    const module = { exports: {} };
    vm.runInNewContext(outputText, { module, exports: module.exports, require(name) {
        if (name === '@inertiajs/react') return { useForm: () => form };
        if (name === 'lucide-react') return new Proxy({}, { get: () => () => null });
        if (name === './types') return { documentReviewLabels: { pending: 'À examiner', accepted: 'Acceptée' } };
        return require(name);
    } });
    const document = { uuid: 'proof-test', filename: 'Diplôme.pdf', review_status: 'pending', version: 1 };
    const view = module.exports.default({ document, enrollmentId: 42, enabled: true, onFeedback: (message, tone) => feedback.push({ message, tone }) });
    const formElement = view.props.children.find(child => child?.type === 'form');
    formElement.props.onSubmit({ preventDefault() {} });
    return { feedback, request, view };
}
test('Le toast de succès attend la confirmation serveur du verdict', () => {
    const { feedback, request } = setup();
    assert.equal(feedback.length, 0);
    assert.equal(request.url, '/dashboard/admin/enrollments/42/documents/proof-test/review');
    request.options.onSuccess();
    assert.deepEqual(feedback, [{ message: 'Diplôme.pdf : Acceptée.', tone: 'success' }]);
});
test('Un échec affiche le motif et conserve la pièce dans son état enregistré', () => {
    const { feedback, request, view } = setup();
    request.options.onError({ review: 'Le dossier a été clôturé.' });
    assert.deepEqual(feedback, [{ message: 'Le dossier a été clôturé.', tone: 'error' }]);
    assert.match(view.props.className, /is-pending/);
});
test('Chaque enregistrement réussi peut déclencher une nouvelle confirmation', () => {
    const { feedback, request } = setup();
    request.options.onSuccess();
    request.options.onSuccess();
    assert.equal(feedback.length, 2);
    assert.ok(feedback.every(item => item.tone === 'success'));
});
test('Un enregistrement en cours bloque les soumissions supplémentaires', () => {
    const { feedback, request } = setup(true);
    assert.equal(request, undefined);
    assert.equal(feedback.length, 0);
});
