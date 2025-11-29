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
exports.registerGenerateFromIds = registerGenerateFromIds;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const fs_1 = require("../../utils/fs");
const yapiFetcher_1 = require("../../sources/yapiFetcher");
const generator_1 = require("../../generation/ast/generator");
function parseInput(input) {
    const mSpace = input.trim();
    if (/^\d+$/.test(mSpace))
        return { projectId: mSpace };
    const pairs = mSpace.split(/[,\s]+/).map(x => x.trim()).filter(Boolean);
    const out = {};
    for (const p of pairs) {
        const m = p.match(/^(projectId|catId|id)[:=](.+)$/i);
        if (m)
            out[m[1]] = m[2];
    }
    return out;
}
function registerGenerateFromIds(context, deps) {
    return vscode.commands.registerCommand('apiforge.generateFromIds', async (uri) => {
        const input = await vscode.window.showInputBox({ prompt: '输入 ProjectId/catId/id（例如：123 或 projectId=123,catId=45 或 id=678）' });
        if (!input)
            return;
        const { projectId, catId, id } = parseInput(input);
        if (!projectId && !catId && !id) {
            vscode.window.showWarningMessage('未识别任何参数');
            return;
        }
        const cfg = deps.settings.getConfig();
        const yapiSources = (cfg.sources || []).filter(s => s.type === 'yapi');
        if (yapiSources.length === 0) {
            vscode.window.showErrorMessage('未配置 YApi 数据源');
            return;
        }
        let source = yapiSources[0];
        if (yapiSources.length > 1) {
            const pick = await vscode.window.showQuickPick(yapiSources.map((s) => s.sourceName), { placeHolder: '选择 YApi 数据源' });
            source = yapiSources.find((s) => s.sourceName === pick) || source;
        }
        const folder = vscode.workspace.workspaceFolders?.[0];
        if (!folder) {
            vscode.window.showErrorMessage('未找到工作区');
            return;
        }
        const apisDir = (0, fs_1.findOrCreateApisDir)(folder.uri.fsPath);
        const ysrc = { type: 'yapi', sourceName: source.sourceName, url: source.url, token: await deps.secrets.resolveValue(source.token) };
        let items = [];
        const progressTitle = '正在拉取 YApi 接口...';
        await vscode.window.withProgress({ location: vscode.ProgressLocation.Notification, title: progressTitle }, async () => {
            try {
                if (id)
                    items = await (0, yapiFetcher_1.fetchById)(ysrc, id);
                else if (catId)
                    items = await (0, yapiFetcher_1.fetchByCatId)(ysrc, catId);
                else if (projectId)
                    items = await (0, yapiFetcher_1.fetchByProjectId)(ysrc, projectId);
            }
            catch (e) {
                deps.logger.error(`拉取失败: ${e?.message || e}`);
                vscode.window.showErrorMessage(`拉取失败: ${e?.message || e}`);
                return;
            }
        });
        if (!items.length) {
            vscode.window.showWarningMessage('未获取到接口');
            return;
        }
        (0, generator_1.generateApis)(apisDir, source.sourceName || 'yapi', items);
        vscode.window.showInformationMessage(`生成完成：${items.length}项，目录 ${path.join(apisDir, source.sourceName || 'yapi')}`);
    });
}
