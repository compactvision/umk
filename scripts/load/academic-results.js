/* global __ENV, __VU, __ITER */
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';
import http from 'k6/http';

const origin = (__ENV.BASE_URL || '').replace(/\/$/, '');
const mode = __ENV.MODE || 'results';
const targets = { results: 1000, peak: 2500, mixed: 5000, bulletin: 50, export: 10, prepare: 5, publish: 5 };
const writes = ['prepare', 'publish'].includes(mode);
const target = Number(__ENV.TARGET_VUS || targets[mode]);
if (
    __ENV.TARGET_ENV !== 'staging' ||
    !/^https?:\/\/[^/]+$/.test(origin) ||
    !Object.prototype.hasOwnProperty.call(targets, mode) ||
    !Number.isInteger(target) ||
    target < 1
) {
    throw new Error('Indiquez une recette, un mode et une cible valides.');
}
const accounts = new SharedArray('sessions de résultats jetables', () => JSON.parse(open(__ENV.ACCOUNTS_FILE)));
if (!accounts.length || (writes && (__ENV.ALLOW_WRITES !== 'disposable' || accounts.length < target))) {
    throw new Error('Les écritures exigent un dossier jetable par VU et ALLOW_WRITES=disposable.');
}

export const options = {
    discardResponseBodies: true,
    stages: [
        { duration: '2m', target: Math.min(target, 20) },
        { duration: '5m', target },
        { duration: '1m', target: 0 },
    ],
    thresholds: { checks: ['rate>0.99'], http_req_duration: ['p(95)<2500'] },
};

export default function () {
    const account = accounts[(__VU - 1) % accounts.length];
    if (!account.cookie) throw new Error('Cookie de recette requis.');
    const params = { redirects: 0, headers: { Cookie: account.cookie, Accept: 'text/html' } };
    const academic = Number(account.academic_id);
    const run = Number(account.run_id);
    const prefix = '/dashboard/admin/academic-results';
    if (writes) {
        if (__ITER > 0) return sleep(1);
        if (!account.csrf || !account.payload) throw new Error('Jeton et scénario jetables requis.');
        const path = mode === 'prepare' ? `${prefix}/rules/${Number(account.rule_id)}/deliberations` : `${prefix}/deliberations/${run}/state`;
        const headers = { ...params.headers, 'X-CSRF-TOKEN': account.csrf, 'Content-Type': 'application/json', Accept: 'application/json' };
        const payload = mode === 'publish' ? { ...account.payload, action: 'publish', notify: false } : account.payload;
        check(http.post(origin + path, JSON.stringify(payload), { ...params, headers }), { 'opération jetable acceptée': (r) => r.status === 303 });
    } else {
        const reference = encodeURIComponent(account.reference || '');
        const result = `/dashboard/student/results?academic=${academic}`;
        const paths = {
            results: result,
            peak: result,
            mixed: __ITER % 3 === 0 ? `/dashboard/student/assignments?academic=${academic}` : result,
            bulletin: `/dashboard/student/results/official/${reference}/report?academic=${academic}`,
            export: `${prefix}/deliberations/${run}/export`,
        };
        const response = http.get(origin + paths[mode], params);
        check(response, {
            'consultation autorisée': (r) => r.status === 200,
            'format demandé': (r) =>
                mode === 'bulletin'
                    ? /application\/pdf/.test(r.headers['Content-Type'] || '')
                    : mode === 'export'
                      ? /text\/csv/.test(r.headers['Content-Type'] || '')
                      : true,
        });
    }
    sleep(1);
}
