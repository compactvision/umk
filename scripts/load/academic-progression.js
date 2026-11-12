/* global __ENV, __VU, __ITER */
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';
import http from 'k6/http';

const origin = (__ENV.BASE_URL || '').replace(/\/$/, '');
const mode = __ENV.MODE || 'portal';
const targets = { portal: 5000, history: 300, cohort: 50, prepare: 5000, approve: 30, race: 2 };
const writes = ['prepare', 'approve', 'race'].includes(mode);
const target = Number(__ENV.TARGET_VUS || targets[mode]);
if (
    __ENV.TARGET_ENV !== 'staging' ||
    !/^https?:\/\/[^/]+$/.test(origin) ||
    !Object.hasOwn(targets, mode) ||
    !Number.isInteger(target) ||
    target < 1
) {
    throw new Error('Indiquez la recette, le mode et le nombre de VU.');
}
const accounts = new SharedArray('dossiers de parcours de recette', () => JSON.parse(open(__ENV.ACCOUNTS_FILE)));
if (!accounts.length || (writes && (__ENV.ALLOW_WRITES !== 'disposable' || accounts.length < target))) {
    throw new Error('Les écritures exigent un scénario jetable par VU et ALLOW_WRITES=disposable.');
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
    const academic = Number(account.academic_id);
    const prefix = '/dashboard/admin/progression';
    if (!account.cookie || !academic) throw new Error('Contexte de recette incomplet.');
    const params = { redirects: 0, headers: { Cookie: account.cookie, Accept: 'text/html' } };
    if (writes) {
        if (__ITER > 0) return sleep(1);
        if (!account.csrf || !account.payload) throw new Error('Jeton et dossier jetable requis.');
        const path = mode === 'prepare' ? `${prefix}/enrollments/${academic}/cases` : `${prefix}/cases/${Number(account.case_id)}/decision`;
        const headers = { ...params.headers, 'X-CSRF-TOKEN': account.csrf, 'Content-Type': 'application/json', Accept: 'application/json' };
        const response = http.post(origin + path, JSON.stringify(account.payload), { ...params, headers });
        check(response, {
            'opération acceptée ou révision concurrente détectée': (result) => result.status === 303 || (mode === 'race' && result.status === 422),
        });
    } else {
        const paths = {
            portal: `/dashboard/student/academics?academic=${academic}`,
            history: `/dashboard/admin/student-academic/${academic}?section=Parcours`,
            cohort: `${prefix}?year=${Number(account.year_id)}`,
        };
        check(http.get(origin + paths[mode], params), { 'consultation réussie': (result) => result.status === 200 });
    }
    sleep(1);
}
