"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setClient = setClient;
exports.getClient = getClient;
exports.request = request;
const fetchAdapter_1 = require("./fetchAdapter");
let adapter;
function setClient(a) { adapter = a; }
function getClient() { return adapter || fetchAdapter_1.fetchAdapter; }
async function request(method, url, body, options) {
    const c = getClient();
    switch (method) {
        case 'GET': return c.get(url, options);
        case 'POST': return c.post(url, body, options);
        case 'PUT': return c.put(url, body, options);
        case 'PATCH': return c.patch(url, body, options);
        case 'DELETE': return c.delete(url, options);
    }
}
