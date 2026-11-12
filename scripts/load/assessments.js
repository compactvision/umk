/* global __ENV, __VU, __ITER */
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';
import http from 'k6/http';

const origin = (__ENV.BASE_URL || '').replace(/\/$/, '');
const mode = __ENV.MODE || 'assignments';
const modes = { assignments: 500, submit: 1000, exams: 2500, mixed: 5000, corrections: 20, copies: 50 };
const writes = ['submit', 'corrections'].includes(mode);
const target = Number(__ENV.TARGET_VUS || modes[mode]);
if (__ENV.TARGET_ENV !== 'staging' || !/^https?:\/\/[^/]+$/.test(origin) || !Object.hasOwn(modes, mode) || !Number.isInteger(target) || target < 1) {
    throw new Error('Indiquez TARGET_ENV=staging, BASE_URL, MODE et un nombre de VU valide.');
}
const sessions = new SharedArray('dossiers d’évaluation jetables', () => JSON.parse(open(__ENV.ACCOUNTS_FILE)));
if (!sessions.length || (writes && (__ENV.ALLOW_WRITES !== 'disposable' || sessions.length < target))) {
    throw new Error('Pour écrire, fournissez un dossier jetable distinct par VU et ALLOW_WRITES=disposable.');
}
const pdf = mode === 'submit' && __ENV.PDF_FILE ? open(__ENV.PDF_FILE, 'b') : null;

export const options = {
    discardResponseBodies: true,
    stages: [
        { duration: '2m', target: Math.min(target, 25) },
        { duration: '5m', target },
        { duration: '1m', target: 0 },
    ],
    thresholds: { checks: ['rate>0.99'], http_req_duration: ['p(95)<2000'] },
};

export default function () {
    const session = sessions[(__VU - 1) % sessions.length];
    if (!session.cookie) throw new Error('Session de recette requise.');
    const params = { headers: { Cookie: session.cookie, Accept: 'text/html' }, redirects: 0 };
    const academic = Number(session.academic_id);
    const resource = Number(session.resource_id);
    if (mode === 'assignments' || mode === 'exams' || mode === 'mixed') {
        const page = mode === 'exams' || (mode === 'mixed' && __ITER % 3 === 1) ? 'evaluations' : 'assignments';
        const url = mode === 'mixed' && __ITER % 3 === 2 ? '/dashboard/student/courses' : `/dashboard/student/${page}`;
        check(http.get(`${origin}${url}?academic=${academic}`, params), { 'page de l’étudiant autorisée': (r) => r.status === 200 });
    } else if (mode === 'copies') {
        check(http.get(`${origin}/dashboard/student/submissions/${Number(session.submission_id)}/download?academic=${academic}`, params), {
            'copie privée servie': (r) => r.status === 200 && Boolean(r.headers['Content-Disposition']),
        });
    } else {
        if (__ITER > 0) return sleep(1);
        if (!session.csrf) throw new Error('Jeton CSRF jetable requis.');
        const headers = { ...params.headers, 'X-CSRF-TOKEN': session.csrf, Accept: 'application/json' };
        if (mode === 'submit') {
            const url = `${origin}/dashboard/student/resources/${resource}/submit?academic=${academic}`;
            const body = {
                body: 'Remise jetable de recette',
                operation_key: session.operation_key,
                expected_version: String(session.expected_version ?? 0),
                ...(pdf ? { file: http.file(pdf, 'essai.pdf', 'application/pdf') } : {}),
            };
            http.batch([1, 2].map(() => ['POST', url, body, { ...params, headers }])).forEach((response) =>
                check(response, { 'dépôt ou rejeu accepté': (r) => r.status === 302 || r.status === 303 }),
            );
        } else {
            const url = `${origin}/dashboard/admin/assessments/${resource}/records/${Number(session.record_id)}/correction`;
            check(http.post(url, session.correction, { ...params, headers }), { 'correction jetable enregistrée': (r) => r.status === 303 });
        }
    }
    sleep(1);
}
