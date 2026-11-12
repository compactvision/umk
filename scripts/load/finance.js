/* global __ENV, __VU */
// Sessions and disposable contexts must belong to an authorized staging environment.
// k6 run -e TARGET_ENV=staging -e BASE_URL=https://recette.example -e ACCOUNTS_FILE=/secure/finance-sessions.json scripts/load/finance.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';

if (__ENV.TARGET_ENV !== 'staging') throw new Error('TARGET_ENV=staging requis.');
const mode = __ENV.MODE || 'read';
if (!['read', 'double-confirm', 'double-refund'].includes(mode)) throw new Error('Mode inconnu.');
const accounts = new SharedArray('finance staging sessions', () => JSON.parse(open(__ENV.ACCOUNTS_FILE)));
export const options = {
    stages: [{ duration: '1m', target: 10 }, { duration: '3m', target: Number(__ENV.TARGET_VUS || 50) }, { duration: '1m', target: 0 }],
    thresholds: { http_req_failed: ['rate<0.01'], http_req_duration: ['p(95)<1500'] },
};
export default function () {
    const account = accounts[(__VU - 1) % accounts.length];
    const base = __ENV.BASE_URL.replace(/\/$/, '');
    const params = { headers: { Cookie: account.cookie, Accept: 'text/html' }, redirects: 0 };
    if (mode === 'read') {
        for (const path of ['/dashboard/admin/finance', `/dashboard/admin/finance?academic=${account.academic_id}`, '/dashboard/admin/finance/export']) {
            check(http.get(base + path, params), { 'financial scope available': response => response.status === 200 });
        }
    } else {
        if (!account.csrf || !account.payment_id) throw new Error('Dossier jetable, paiement et jeton CSRF requis.');
        const refund = mode === 'double-refund';
        if (refund && (!account.operation_key || !account.refund_amount)) throw new Error('Clé de demande stable et montant exact requis.');
        const path = refund ? `/dashboard/admin/finance/payments/${account.payment_id}/refunds` : `/dashboard/admin/student-academic/payments/${account.payment_id}/status`;
        const body = JSON.stringify(refund ? { amount: account.refund_amount, operation_key: account.operation_key, reason: 'Demande répétée sur une opération jetable de recette autorisée.' } : { status: 'confirmed', reason: 'Double confirmation contrôlée sur une opération jetable de recette.' });
        const write = { ...params, headers: { ...params.headers, 'Content-Type': 'application/json', 'X-CSRF-TOKEN': account.csrf } };
        const responses = http.batch([['POST', base + path, body, write], ['POST', base + path, body, write]]);
        for (const response of responses) check(response, { 'operation accepted or replayed': result => result.status === 303 });
    }
    sleep(1);
}
