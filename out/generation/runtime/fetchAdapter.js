"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchAdapter = void 0;
function buildURL(url, options) {
    const base = options?.baseURL ? options.baseURL.replace(/\/$/, '') + (url.startsWith('/') ? url : '/' + url) : url;
    const q = options?.query || {};
    const qs = Object.keys(q).length ? '?' + new URLSearchParams(Object.entries(q).reduce((acc, [k, v]) => { acc[k] = String(v); return acc; }, {})).toString() : '';
    return base + qs;
}
async function core(method, url, body, options) {
    const finalURL = buildURL(url, options);
    const headers = Object.assign({ 'Content-Type': 'application/json' }, options?.headers || {});
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : undefined;
    const id = options?.timeout && controller ? setTimeout(() => controller.abort(), options.timeout) : undefined;
    const res = await globalThis.fetch(finalURL, { method, headers, body: body != null ? JSON.stringify(body) : undefined, signal: controller?.signal });
    if (id)
        clearTimeout(id);
    if (!res.ok)
        throw new Error(`request failed ${res.status}`);
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json'))
        return await res.json();
    const text = await res.text();
    return text;
}
exports.fetchAdapter = {
    async get(url, options) { return core('GET', url, undefined, options); },
    async post(url, body, options) { return core('POST', url, body, options); },
    async put(url, body, options) { return core('PUT', url, body, options); },
    async patch(url, body, options) { return core('PATCH', url, body, options); },
    async delete(url, options) { return core('DELETE', url, undefined, options); }
};
