"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.joinPathSegments = joinPathSegments;
exports.splitPath = splitPath;
function joinPathSegments(segments) {
    return segments.filter(Boolean).join('/');
}
function splitPath(p) {
    return p.split('/').filter(Boolean);
}
