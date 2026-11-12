/* global __ENV, __VU */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';

if (__ENV.TARGET_ENV !== 'staging') throw new Error('TARGET_ENV=staging requis.');
const mode = __ENV.MODE || 'read';
if (!['read', 'semester', 'publish', 'reschedule', 'attendance'].includes(mode)) throw new Error('MODE inconnu.');
const accounts = new SharedArray('planning staging sessions', () => JSON.parse(open(__ENV.ACCOUNTS_FILE)));
export const options = {
    stages: [{ duration: '1m', target: 10 }, { duration: '4m', target: Number(__ENV.TARGET_VUS || 50) }, { duration: '1m', target: 0 }],
    thresholds: { checks: ['rate>0.99'], http_req_duration: ['p(95)<1500'] },
};
export default function () {
    const account = accounts[(__VU - 1) % accounts.length];
    const base = __ENV.BASE_URL.replace(/\/$/, '');
    const params = { headers: { Cookie: account.cookie, Accept: 'text/html' }, redirects: 0 };
    if (mode === 'read') {
        const path = account.role === 'admin'
            ? '/dashboard/admin/schedule/reports'
            : account.role === 'professor'
              ? `/dashboard/teacher?offering=${account.offering_id}`
              : `/dashboard/student/schedule?academic=${account.academic_id}`;
        check(http.get(base + path, params), { 'page autorisée': result => result.status === 200 });
    } else {
        // The fixture defines a disposable schedule, decision or attendance batch and is supplied out of band.
        if (!account.csrf || !account.path || !account.payload) throw new Error('Scénario jetable et jeton CSRF requis.');
        const write = { ...params, headers: { ...params.headers, Accept: 'application/json', 'X-CSRF-TOKEN': account.csrf, 'Content-Type': 'application/json' } };
        const responses = http.batch([1, 2].map(() => ['POST', base + account.path, JSON.stringify(account.payload), write]));
        responses.forEach(response => check(response, { 'succès ou conflit métier contrôlé': result => [302, 303, 422].includes(result.status) }));
    }
    sleep(1);
}
