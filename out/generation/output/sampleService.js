"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.get_users_by_id = get_users_by_id;
const clientProvider_1 = require("../runtime/clientProvider");
async function get_users_by_id(params) {
    const url = `/users/${encodeURIComponent(params.id)}`;
    return (0, clientProvider_1.request)('GET', url, undefined, {});
}
