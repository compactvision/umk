/* global __ENV, __VU, __ITER */
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';
import http from 'k6/http';

const mode = __ENV.MODE || 'read';
const base = (__ENV.BASE_URL || '').replace(/\/$/, '');
if (__ENV.TARGET_ENV !== 'staging' || !/^https?:\/\/[^/]+$/.test(base)) {
    throw new Error('Indiquez TARGET_ENV=staging et l’origine de la recette dans BASE_URL.');
}
if (!['read', 'download', 'media', 'upload', 'publish', 'renew'].includes(mode)) throw new Error('MODE inconnu.');
const write = ['upload', 'publish'].includes(mode);
const target = Number(__ENV.TARGET_VUS || 20);
const accounts = new SharedArray('sessions et contextes jetables en recette', () => JSON.parse(open(__ENV.ACCOUNTS_FILE)));
if (!Number.isInteger(target) || target < 1 || !accounts.length || (write && (__ENV.ALLOW_WRITES !== 'disposable' || accounts.length < target))) {
    throw new Error('Pour les écritures, configurez une session et un scénario jetables par VU et ALLOW_WRITES=disposable.');
}
const file = mode === 'upload' ? open(__ENV.PDF_FILE, 'b') : null;

export const options = {
    discardResponseBodies: true,
    systemTags: ['status', 'method', 'name', 'scenario', 'check', 'error_code'],
    ...(mode === 'renew'
        ? { scenarios: { signature: { executor: 'per-vu-iterations', vus: target, iterations: 1, maxDuration: '4m' } } }
        : {
              stages: [
                  { duration: '1m', target: Math.min(target, 5) },
                  { duration: '3m', target },
                  { duration: '1m', target: 0 },
              ],
          }),
    thresholds: { checks: ['rate>0.99'], http_req_duration: ['p(95)<1500'] },
};

function signedUrl(download, params) {
    const response = http.get(download, { ...params, tags: { name: 'autoriser le téléchargement' } });
    const url = response.headers.Location;
    return check(response, { 'autorisation et URL signée': (r) => r.status === 302 && /^https:\/\//.test(url || '') }) ? url : null;
}

function object(url) {
    return http.get(url, { redirects: 0, tags: { name: 'objet signé privé' } });
}

export default function () {
    const account = accounts[(__VU - 1) % accounts.length];
    if (!account.cookie) throw new Error('Cookie de session jetable requis.');
    const params = { headers: { Cookie: account.cookie, Accept: 'text/html' }, redirects: 0 };
    const teacher = account.role === 'professor';
    const library = teacher ? '/dashboard/teacher/resources' : '/dashboard/admin/teaching/resources';
    const studentResource = `/dashboard/student/resources/${Number(account.resource_id)}`;
    const download = `${base}${studentResource}/download?academic=${Number(account.academic_id)}`;
    if (mode === 'read') {
        const url =
            account.role === 'student'
                ? `/dashboard/student/courses/${Number(account.course_id)}/files?academic=${Number(account.academic_id)}`
                : `${library}?offering=${Number(account.offering_id)}`;
        check(http.get(base + url, params), { 'catalogue autorisé': (r) => r.status === 200 });
    } else if (mode === 'renew') {
        const original = signedUrl(download, params);
        if (!original) return;
        check(object(original), { 'signature initiale utilisable': (r) => r.status === 200 });
        sleep(125);
        check(object(original), { 'signature expirée': (r) => r.status === 403 });
        const renewed = signedUrl(download, params);
        if (renewed) check(object(renewed), { 'signature renouvelée utilisable': (r) => r.status === 200 });
    } else if (mode === 'download') {
        if (__ENV.DIRECT_S3 === 'true') {
            const url = signedUrl(download, params);
            if (url) check(object(url), { 'objet privé livré': (r) => r.status === 200 });
        } else {
            check(http.get(download, params), { 'fichier privé livré': (r) => r.status === 200 && Boolean(r.headers['Content-Disposition']) });
        }
    } else if (mode === 'media') {
        const headers = { ...params.headers, Range: 'bytes=0-65535' };
        check(http.get(`${base}${studentResource}/preview?academic=${Number(account.academic_id)}`, { ...params, headers }), {
            'plage privée servie': (r) => r.status === 206,
        });
    } else {
        if (__ITER > 0) return sleep(1);
        if (!account.csrf) throw new Error('Jeton CSRF de recette requis.');
        const headers = { ...params.headers, 'X-CSRF-TOKEN': account.csrf, Accept: 'application/json' };
        const url =
            mode === 'upload' ? `${library}/offerings/${Number(account.offering_id)}` : `${library}/${Number(account.resource_id)}/publication`;
        const body =
            mode === 'upload'
                ? {
                      operation_key: account.operation_key,
                      title: `Support jetable VU ${__VU}`,
                      kind: 'material',
                      file: http.file(file, 'charge.pdf', 'application/pdf'),
                  }
                : { action: 'publish', reason: 'Scénario de charge jetable en recette.', revision: Number(account.revision), notify: '0' };
        const responses = http.batch([1, 2].map(() => ['POST', base + url, body, { ...params, headers }]));
        responses.forEach((response) => check(response, { 'écriture et rejeu contrôlé': (r) => r.status === 303 }));
    }
    sleep(1);
}
