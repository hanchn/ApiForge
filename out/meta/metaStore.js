"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetaStore = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class MetaStore {
    constructor(baseDir, sourceName) { this.metaPath = path.join(baseDir, sourceName, '_apiForge.meta.json'); }
    read() {
        try {
            if (fs.existsSync(this.metaPath))
                return JSON.parse(fs.readFileSync(this.metaPath, 'utf8'));
        }
        catch { }
        return [];
    }
    write(entries) {
        fs.mkdirSync(path.dirname(this.metaPath), { recursive: true });
        fs.writeFileSync(this.metaPath, JSON.stringify(entries, null, 2), 'utf8');
    }
    upsert(entry) {
        const all = this.read();
        const i = all.findIndex(e => e.id === entry.id);
        if (i >= 0)
            all[i] = entry;
        else
            all.push(entry);
        this.write(all);
    }
}
exports.MetaStore = MetaStore;
