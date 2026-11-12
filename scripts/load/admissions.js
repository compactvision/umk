/* global __ENV */
import http from 'k6/http';
import { check, fail } from 'k6';
import { SharedArray } from 'k6/data';
import exec from 'k6/execution';

const base = (__ENV.BASE_URL || '').replace(/\/$/, '');
const flow = __ENV.FLOW || 'catalogue';
const count = Number(__ENV.COUNT || 1);
if (!base || __ENV.TARGET_ENV !== 'staging' || !['catalogue', 'upload', 'submit'].includes(flow) || !Number.isSafeInteger(count) || count < 1) {
    throw new Error('Indiquez un environnement de test autorisé, FLOW=catalogue|upload|submit et COUNT entier positif.');
}

const accounts = flow === 'catalogue' ? [] : new SharedArray('candidate fixtures', () => JSON.parse(open(__ENV.ACCOUNTS_FILE)));
if (flow !== 'catalogue' && accounts.length < count) throw new Error('Un compte fictif distinct par VU est requis.');
const document = flow === 'upload' ? open(__ENV.PDF_FILE, 'b') : null;

export const options = {
    noCookiesReset: true,
    scenarios: { admissions: { executor: 'per-vu-iterations', vus: count, iterations: flow === 'submit' ? 1 : 5, maxDuration: '3m' } },
    thresholds: { checks: ['rate==1'], http_req_failed: ['rate<0.01'] },
};
let loggedIn = false;

function csrf() {
    return decodeURIComponent((http.cookieJar().cookiesForURL(base + '/')['XSRF-TOKEN'] || [''])[0]);
}

export default function () {
    if (flow === 'catalogue') {
        check(http.get(base + '/admission', { tags: { name: 'admissions_catalogue' } }), { 'catalogue disponible': (response) => response.status === 200 });
        return;
    }

    const account = accounts[exec.vu.idInTest - 1];
    if (!loggedIn) {
        http.get(base + '/login', { tags: { name: 'admissions_login_form' } });
        const response = http.post(base + '/login', { email: account.email, password: account.password }, {
            redirects: 0, headers: { 'X-XSRF-TOKEN': csrf() }, tags: { name: 'admissions_login' },
        });
        loggedIn = check(response, { 'candidat connecté': (result) => result.status === 302 && (result.headers.Location || '').includes('/dashboard') });
        if (!loggedIn) fail('Connexion du compte fictif refusée.');
    }
    if (flow === 'upload') {
        const response = http.post(base + '/dashboard/enrollments/documents/upload', { key: 'proof', file: http.file(document, 'justificatif-test.pdf', 'application/pdf') }, {
            redirects: 0, headers: { 'X-XSRF-TOKEN': csrf(), Accept: 'application/json' }, tags: { name: 'admissions_upload' },
        });
        check(response, { 'pièce fictive acceptée': (result) => result.status === 200 && result.json('ok') === true });
        return;
    }

    if (!/^[0-9a-f-]{36}$/i.test(account.draft_uuid || '')) fail('UUID de brouillon complet requis.');
    const response = http.post(`${base}/dashboard/enrollments/${account.draft_uuid}/submit`, {}, {
        redirects: 0, headers: { 'X-XSRF-TOKEN': csrf(), Referer: `${base}/dashboard/enrollments/${account.draft_uuid}/edit` }, tags: { name: 'admissions_submit' },
    });
    check(response, { 'dossier soumis': (result) => result.status === 302 && (result.headers.Location || '').endsWith('/dashboard/enrollments') });
}
