import * as vscode from 'vscode'
import * as path from 'path'
import { Logger } from '../../logging/logger'
import { SettingsManager } from '../../config/settingsManager'
import { SecretService } from '../../secrets/secretService'
import { findOrCreateApisDir } from '../../utils/fs'
import { fetchAllFromOpenAPI, OpenAPISource } from '../../sources/openapiFetcher'
import { generateApis } from '../../generation/ast/generator'

export function registerGenerateOpenAPI(context: vscode.ExtensionContext, deps: { logger: Logger; settings: SettingsManager; secrets: SecretService }) {
  return vscode.commands.registerCommand('apiforge.generateOpenAPI', async () => {
    const cfg = deps.settings.getConfig()
    const sources = (cfg.sources || []).filter(s => s.type === 'openapi')
    if (!sources.length) { vscode.window.showErrorMessage('未配置 OpenAPI 数据源'); return }
    const pickName = await vscode.window.showQuickPick(sources.map((s: any) => s.sourceName), { placeHolder: '选择 OpenAPI 数据源' })
    const src = sources.find((s: any) => s.sourceName === pickName) || sources[0]
    const folder = vscode.workspace.workspaceFolders?.[0]
    if (!folder) { vscode.window.showErrorMessage('未找到工作区'); return }
    const apisDir = findOrCreateApisDir(folder.uri.fsPath)
    const osrc: OpenAPISource = { type: 'openapi', sourceName: src.sourceName, url: src.url, headers: src.headers, specFormat: src.specFormat }
    let items: any[] = []
    await vscode.window.withProgress({ location: vscode.ProgressLocation.Notification, title: '正在拉取 OpenAPI 文档...' }, async () => {
      try { items = await fetchAllFromOpenAPI(osrc) } catch (e: any) { deps.logger.error(e?.message||String(e)); vscode.window.showErrorMessage('拉取失败'); }
    })
    if (!items.length) { vscode.window.showWarningMessage('未获取到接口'); return }
    generateApis(apisDir, src.sourceName || 'openapi', items as any)
    vscode.window.showInformationMessage(`生成完成：${items.length}项，目录 ${path.join(apisDir, src.sourceName || 'openapi')}`)
  })
}