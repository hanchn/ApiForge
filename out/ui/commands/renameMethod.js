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
exports.registerRenameMethod = registerRenameMethod;
const vscode = __importStar(require("vscode"));
function registerRenameMethod(context, deps) {
    return vscode.commands.registerCommand('apiforge.renameMethod', async () => {
        const scheme = deps.settings.getConfig().naming?.scheme || 'pathSnake';
        const input = await vscode.window.showInputBox({ prompt: '输入接口路径与方法，如 GET /users/{id}' });
        if (!input)
            return;
        const m = input.match(/^(GET|POST|PUT|PATCH|DELETE)\s+(.+)$/i);
        if (!m) {
            vscode.window.showWarningMessage('格式: METHOD /path');
            return;
        }
        const method = m[1].toUpperCase();
        const path = m[2];
        const item = { id: 'temp', name: '', method, path };
        let suggestion = '';
        if (scheme === 'pathSnake') {
            const { nameFromPathSnake } = await Promise.resolve().then(() => __importStar(require('../../naming/namer')));
            suggestion = nameFromPathSnake(item);
        }
        const name = await vscode.window.showInputBox({ prompt: '输入新方法名', value: suggestion });
        if (!name)
            return;
        deps.logger.info(`rename to ${name}`);
    });
}
