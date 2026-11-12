/* global __ENV, __VU */
// Read-only against authorized staging. Sessions must belong to disposable accounts.
// k6 run -e TARGET_ENV=staging -e BASE_URL=https://recette.example -e ACCOUNTS_FILE=/secure/teaching-sessions.json scripts/load/academic-teaching.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';

if (__ENV.TARGET_ENV !== 'staging') throw new Error('TARGET_ENV=staging requis.');
const accounts = new SharedArray('teaching staging sessions', () => JSON.parse(open(__ENV.ACCOUNTS_FILE)));
export const options = {
    stages: [{ duration: '1m', target: 10 }, { duration: '4m', target: Number(__ENV.TARGET_VUS || 50) }, { duration: '1m', target: 0 }],
    thresholds: { http_req_failed: ['rate<0.01'], http_req_duration: ['p(95)<1500'] },
};
export default function () {
    const account = accounts[(__VU - 1) % accounts.length];
    const base = __ENV.BASE_URL.replace(/\/$/, '');
    const paths = account.role === 'admin'
        ? ['/dashboard/admin/teaching', `/dashboard/admin/teaching?offering=${account.offering_id}`]
        : account.role === 'professor'
          ? ['/dashboard/teacher', `/dashboard/teacher?offering=${account.offering_id}`]
          : [`/dashboard/student/courses?academic=${account.academic_id}`, `/dashboard/student/courses/${account.course_id}?academic=${account.academic_id}`];
    for (const path of paths) {
        const response = http.get(base + path, { headers: { Cookie: account.cookie, Accept: 'text/html' }, redirects: 0 });
        check(response, { 'authorized response': result => result.status === 200 });
        sleep(1);
    }
}
