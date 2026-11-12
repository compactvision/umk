/* global __ENV, __VU */
// Run only against an authorized staging environment. Authenticated read-only traffic.
// k6 run -e TARGET_ENV=staging -e BASE_URL=https://recette.example -e ACCOUNTS_FILE=/secure/sessions.json scripts/load/enrollment-management.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';

const mode = __ENV.MODE || 'read';
if (__ENV.TARGET_ENV !== 'staging') throw new Error('TARGET_ENV=staging requis.');
if (!['read', 'double-submit', 'confirmation'].includes(mode)) throw new Error('Mode inconnu.');
const accounts = new SharedArray('administrative sessions', () => JSON.parse(open(__ENV.ACCOUNTS_FILE)));
export const options = {
    stages: [{ duration: '1m', target: 10 }, { duration: '3m', target: Number(__ENV.TARGET_VUS || 50) }, { duration: '1m', target: 0 }],
    thresholds: { http_req_failed: ['rate<0.01'], http_req_duration: ['p(95)<1500'] },
};
export default function () {
    const account = accounts[(__VU - 1) % accounts.length];
    const params = { headers: { Cookie: account.cookie, Accept: 'text/html' }, redirects: 0 };
    const base = __ENV.BASE_URL.replace(/\/$/, '');
    if (mode !== 'read') {
        if (!account.csrf || !account.operation_key) throw new Error('Jeton CSRF et clé opération requis pour les comptes jetables de recette.');
        const body = JSON.stringify({ expected_status: account.expected_status || (mode === 'confirmation' ? 'pending_confirmation' : 'confirmed'), operation_key: account.operation_key, enrollment_status: mode === 'confirmation' ? 'confirmed' : 'suspended', reason: 'Scénario de concurrence autorisé sur un dossier jetable de recette.' });
        const writeParams = { ...params, headers: { ...params.headers, 'Content-Type': 'application/json', 'X-CSRF-TOKEN': account.csrf } };
        const url = `${base}/dashboard/admin/student-academic/${account.academic_id}/transition`;
        const responses = http.batch([['POST', url, body, writeParams], ['POST', url, body, writeParams]]);
        for (const response of responses) check(response, { 'decision accepted or replayed': result => result.status === 303 });
        sleep(1);
        return;
    }
    const paths = [
        '/dashboard/admin/student-academic?page=1',
        `/dashboard/admin/student-academic/${account.academic_id}`,
        `/dashboard/admin/student-academic/administration?academic=${account.academic_id}`,
    ];
    for (const path of paths) {
        const response = http.get(base + path, params);
        check(response, { 'authorized response': (result) => result.status === 200 });
        sleep(1);
    }
}
