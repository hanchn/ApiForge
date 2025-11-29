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
exports.SettingsManager = void 0;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class SettingsManager {
    constructor(logger) { this.logger = logger; }
    getConfig() {
        const conf = vscode.workspace.getConfiguration('apiForge');
        const base = {
            sources: conf.get('sources') || [],
            output: {
                baseDir: conf.get('output.baseDir') || 'Apis',
                structure: conf.get('output.structure') || 'byTag'
            },
            template: { runtime: conf.get('template.runtime') || 'external', options: conf.get('template.options') || {} },
            runtime: { fallback: conf.get('runtime.fallback') || 'fetch', clientProviderPath: conf.get('runtime.clientProviderPath') },
            naming: { scheme: conf.get('naming.scheme') || 'pathSnake' }
        };
        const merged = this.mergeWithWorkspace(base);
        return merged;
    }
    mergeWithWorkspace(base) {
        const folder = vscode.workspace.workspaceFolders?.[0];
        if (!folder)
            return base;
        const p = path.join(folder.uri.fsPath, 'apiForge.config.json');
        try {
            if (fs.existsSync(p)) {
                const raw = fs.readFileSync(p, 'utf8');
                const json = JSON.parse(raw);
                return { ...base, ...json, output: { ...base.output, ...(json.output || {}) }, template: { ...base.template, ...(json.template || {}) }, runtime: { ...base.runtime, ...(json.runtime || {}) }, naming: { ...base.naming, ...(json.naming || {}) } };
            }
        }
        catch (e) {
            this.logger.error(`workspace config parse error: ${e?.message || e}`);
        }
        return base;
    }
}
exports.SettingsManager = SettingsManager;
