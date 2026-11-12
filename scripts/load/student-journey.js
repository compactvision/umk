/* global __ENV, __VU */
import http from 'k6/http';
import { check, fail, sleep } from 'k6';
import { SharedArray } from 'k6/data';
import { Rate } from 'k6/metrics';

const base = (__ENV.BASE_URL || '').replace(/\/$/, '');
if (!base || __ENV.TARGET_ENV !== 'staging') throw new Error('BASE_URL et TARGET_ENV=staging requis ; uniquement environnement de test autorisé.');
const smoke = __ENV.SMOKE === 'true';
const mode = __ENV.JOURNEY_MODE || 'mixed';
if (!['mixed', 'results'].includes(mode)) throw new Error('JOURNEY_MODE doit être mixed ou results.');
const target = Number(__ENV.TARGET_VUS || (smoke ? 1 : 100));
if (!(smoke ? [1] : [100, 500, 1000, 2500, 5000]).includes(target)) throw new Error('Palier non reconnu.');
const accounts = new SharedArray('students', () => JSON.parse(open(__ENV.ACCOUNTS_FILE)));
if (accounts.length < target) throw new Error('Un compte étudiant de test distinct par VU est requis.');
const functionalErrors = new Rate('journey_errors');
export const options = {
    noCookiesReset: true,
    stages: smoke ? [{ duration: '1s', target: 1 }, { duration: '5s', target: 1 }, { duration: '1s', target: 0 }] : [{ duration: '2m', target }, { duration: __ENV.HOLD || '10m', target }, { duration: '2m', target: 0 }],
    summaryTrendStats: ['avg', 'med', 'p(95)', 'p(99)', 'max'],
    thresholds: { http_req_failed: ['rate<0.01'], journey_errors: ['rate<0.01'], http_req_duration: ['p(95)<1500', 'p(99)<3000'] },
};
let loggedIn = false;
let pageVersion = '';
function token() {
    const cookies = http.cookieJar().cookiesForURL(base + '/');
    return decodeURIComponent((cookies['XSRF-TOKEN'] || [''])[0]);
}
export default function () {
    const account = accounts[__VU - 1];
    if (!loggedIn) {
        http.get(base + '/login', { tags: { name: 'login_form' } });
        const result = http.post(base + '/login', JSON.stringify({ email: account.email, password: account.password }), {
            redirects: 0, headers: { 'Content-Type': 'application/json', 'X-XSRF-TOKEN': token() }, tags: { name: 'login' },
        });
        loggedIn = check(result, { authenticated: r => r.status === 302 && (r.headers.Location || '').includes('/dashboard') });
        functionalErrors.add(!loggedIn);
        if (!loggedIn) fail('Authentification échouée ; vérifier comptes et limitation de débit.');
        const initial = http.get(`${base}/dashboard/student?academic=${account.academic_id}`, { redirects: 0, tags: { name: 'initial_student_page' } });
        const page = JSON.parse(initial.html().find('[data-page]').attr('data-page') || '{}');
        if (initial.status !== 200 || page.component !== 'dashboard/student/Portal') fail('Contexte étudiant indisponible.');
        pageVersion = page.version || '';
        if (smoke) {
            const denied = http.post(base + '/api/site', JSON.stringify({ siteName: 'CSRF probe on disposable environment' }), { redirects: 0, headers: { 'Content-Type': 'application/json' }, tags: { name: 'csrf_refusal' }, responseCallback: http.expectedStatuses(419) });
            functionalErrors.add(!check(denied, { 'écriture sans CSRF refusée': r => r.status === 419 }));
        }
    }
    if (mode === 'results' && !account.results_enabled) fail('Un résultat accessible est requis pour le parcours results.');
    const sections = mode === 'results' ? ['results'] : ['overview', 'courses', 'schedule', 'profile', 'fees', 'transactions', 'documents'];
    if (mode === 'mixed' && account.results_enabled) sections.push('results');
    const section = sections[Math.floor(Math.random() * sections.length)];
    const response = http.get(`${base}/dashboard/student/${section}?academic=${account.academic_id}`, {
        redirects: 0, headers: { 'X-Inertia': 'true', 'X-Inertia-Version': pageVersion, 'X-Requested-With': 'XMLHttpRequest', Accept: 'text/html, application/xhtml+xml' }, tags: { name: `student_${section}` },
    });
    const ok = check(response, { 'page étudiante': r => {
        try { return r.status === 200 && r.json('component') === 'dashboard/student/Portal'; } catch { return false; }
    } });
    functionalErrors.add(!ok);
    if (account.material_id && Math.random() < 0.1) {
        const file = http.get(`${base}/dashboard/student/resources/${account.material_id}/download?academic=${account.academic_id}`, { redirects: 0, tags: { name: 'private_material' } });
        functionalErrors.add(!check(file, { 'support autorisé': r => r.status === 200 }));
    }
    // Opt-in writes only, to an open assignment belonging to this test student.
    if (__ENV.ALLOW_WRITES === 'true' && account.assignment_id && Math.random() < 0.05) {
        const submission = http.post(`${base}/dashboard/student/resources/${account.assignment_id}/submit?academic=${account.academic_id}`, { body: 'Soumission de charge sur environnement de test autorisé.' }, {
            redirects: 0, headers: { 'X-XSRF-TOKEN': token() }, tags: { name: 'assignment_submit' },
        });
        functionalErrors.add(!check(submission, { 'dépôt accepté': r => [302, 303].includes(r.status) }));
    }
    sleep(smoke ? 0.1 : 3 + Math.random() * 7);
}
