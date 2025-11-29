"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verbOf = verbOf;
exports.toSnake = toSnake;
exports.nameFromPathSnake = nameFromPathSnake;
function verbOf(method) {
    switch (method) {
        case 'GET': return 'get';
        case 'POST': return 'create';
        case 'PUT': return 'update';
        case 'PATCH': return 'patch';
        case 'DELETE': return 'remove';
    }
}
function toSnake(s) {
    return s.replace(/[-\s]+/g, '_').replace(/_+/g, '_');
}
function nameFromPathSnake(item, removePrefixes = []) {
    const verb = verbOf(item.method);
    const segments = item.path.split('/').filter(Boolean);
    const staticSegs = [];
    const params = [];
    for (const seg of segments) {
        const m = seg.match(/^\{(.+)\}$/);
        if (m)
            params.push(m[1]);
        else
            staticSegs.push(seg);
    }
    const filtered = staticSegs.filter(x => !removePrefixes.includes(x));
    const body = filtered.map(toSnake).join('_');
    const paramPart = params.length ? `_by_${params.map(p => toSnake(p)).join('_and_')}` : '';
    let name = `${verb}${body ? '_' + body : ''}${paramPart}`;
    if (/^[0-9]/.test(name))
        name = `api_${name}`;
    return name;
}
