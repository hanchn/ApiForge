"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecretService = void 0;
class SecretService {
    constructor(storage) { this.storage = storage; }
    async get(key) { return await this.storage.get(key); }
    async set(key, value) { await this.storage.store(key, value); }
    async delete(key) { await this.storage.delete(key); }
    async resolveValue(value) {
        if (!value)
            return value;
        const m = value.match(/^\$\{secret:(.+)\}$/);
        if (m)
            return await this.get(m[1]);
        return value;
    }
}
exports.SecretService = SecretService;
