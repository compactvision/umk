/* global __ENV, __VU, __ITER */
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';
import http from 'k6/http';

const origin = (__ENV.BASE_URL || '').replace(/\/$/, '');
const mode = __ENV.MODE || 'portal';
const targets = { portal: 5000, issue: 1000, report: 50, download: 300, verify: 20, card: 30 };
const target = Number(__ENV.TARGET_VUS || targets[mode]);
const writes = ['issue', 'card'].includes(mode);
if (__ENV.TARGET_ENV !== 'staging' || !/^https?:\/\/[^/]+$/.test(origin) || !Object.hasOwn(targets, mode) || !Number.isInteger(target) || target < 1) {
    throw new Error('Indiquez la recette, le mode et le nombre de VU.');
}
const accounts = new SharedArray('dossiers documentaires de recette', () => JSON.parse(open(__ENV.ACCOUNTS_FILE)));
if (!accounts.length || (writes && (__ENV.ALLOW_WRITES !== 'disposable' || accounts.length < target))) {
    throw new Error('Une écriture par VU requiert un dossier jetable et ALLOW_WRITES=disposable.');
}

export const options = {
    discardResponseBodies: true,
    stages: [{ duration: '2m', target: Math.min(target, 20) }, { duration: '5m', target }, { duration: '1m', target: 0 }],
    thresholds: { checks: ['rate>0.99'], http_req_duration: ['p(95)<2500'] },
};

export default function () {
    const account = accounts[(__VU - 1) % accounts.length];
    if (mode !== 'verify' && !account.cookie) throw new Error('Session de recette manquante.');
    const params = { redirects: 0, headers: { Cookie: account.cookie || '', Accept: 'text/html' } };
    if (writes) {
        if (__ITER > 0) return sleep(1);
        if (!account.csrf || !account.ticket_id || !account.revision) throw new Error('Demande approuvée et jeton requis.');
        const path = `/dashboard/admin/official-documents/requests/${Number(account.ticket_id)}/issue`;
        const headers = { ...params.headers, 'X-CSRF-TOKEN': account.csrf, 'Content-Type': 'application/json', Accept: 'application/json' };
        check(http.post(origin + path, JSON.stringify({ revision: Number(account.revision) }), { ...params, headers }), {
            'émission acceptée': (response) => response.status === 303,
        });
    } else {
        const academic = Number(account.academic_id);
        const reference = encodeURIComponent(account.reference || '');
        const paths = {
            portal: `/dashboard/student/${__ITER % 5 === 0 ? 'card' : 'documents'}?academic=${academic}`,
            report: `/dashboard/student/results/official/${reference}/report?academic=${academic}`,
            download: `/dashboard/student/official-documents/${reference}?academic=${academic}`,
            verify: `/verifier/document/${reference}`,
        };
        check(http.get(origin + paths[mode], params), {
            'consultation réussie': (response) => response.status === 200,
            'format attendu': (response) => !['report', 'download'].includes(mode) || /application\/pdf/.test(response.headers['Content-Type'] || ''),
        });
    }
    sleep(mode === 'verify' ? 2 : 1);
}
