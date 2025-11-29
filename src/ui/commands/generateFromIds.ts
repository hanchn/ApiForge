import * as vscode from 'vscode'
import * as fs from 'fs'
import * as path from 'path'
import { Logger } from '../../logging/logger'
import { SettingsManager } from '../../config/settingsManager'
import { SecretService } from '../../secrets/secretService'
import { findOrCreateApisDir } from '../../utils/fs'
import { fetchByProjectId, fetchByCatId, fetchById, YApiSource } from '../../sources/yapiFetcher'
import { generateApis } from '../../generation/ast/generator'

function parseInput(input: string): { projectId?: string; catId?: string; id?: string } {
  const mSpace = input.trim()
  if (/^\d+$/.test(mSpace)) return { projectId: mSpace }
  const pairs = mSpace.split(/[,\s]+/).map(x => x.trim()).filter(Boolean)
  const out: any = {}
  for (const p of pairs) {
    const m = p.match(/^(projectId|catId|id)[:=](.+)$/i)
    if (m) out[m[1]] = m[2]
  }
  return out
}

export function registerGenerateFromIds(context: vscode.ExtensionContext, deps: { logger: Logger; settings: SettingsManager; secrets: SecretService }) {
  return vscode.commands.registerCommand('apiforge.generateFromIds', async (uri?: vscode.Uri) => {
    const input = await vscode.window.showInputBox({ prompt: '输入 ProjectId/catId/id（例如：123 或 projectId=123,catId=45 或 id=678）' })
    if (!input) return
    const { projectId, catId, id } = parseInput(input)
    if (!projectId && !catId && !id) { vscode.window.showWarningMessage('未识别任何参数'); return }
    const cfg = deps.settings.getConfig()
    const yapiSources = (cfg.sources || []).filter(s => s.type === 'yapi')
    if (yapiSources.length === 0) { vscode.window.showErrorMessage('未配置 YApi 数据源'); return }
    let source = yapiSources[0]
    if (yapiSources.length > 1) {
      const pick = await vscode.window.showQuickPick(yapiSources.map((s: any) => s.sourceName), { placeHolder: '选择 YApi 数据源' })
      source = yapiSources.find((s: any) => s.sourceName === pick) || source
    }
    const folder = vscode.workspace.workspaceFolders?.[0]
    if (!folder) { vscode.window.showErrorMessage('未找到工作区'); return }
    const apisDir = findOrCreateApisDir(folder.uri.fsPath)
    const ysrc: YApiSource = { type: 'yapi', sourceName: source.sourceName, url: source.url, token: await deps.secrets.resolveValue(source.token) }
    let items: any[] = []
    const progressTitle = '正在拉取 YApi 接口...'
    await vscode.window.withProgress({ location: vscode.ProgressLocation.Notification, title: progressTitle }, async () => {
      try {
        if (id) items = await fetchById(ysrc, id)
        else if (catId) items = await fetchByCatId(ysrc, catId)
        else if (projectId) items = await fetchByProjectId(ysrc, projectId)
      } catch (e: any) {
        deps.logger.error(`拉取失败: ${e?.message||e}`)
        vscode.window.showErrorMessage(`拉取失败: ${e?.message||e}`)
        return
      }
    })
    if (!items.length) { vscode.window.showWarningMessage('未获取到接口'); return }
    generateApis(apisDir, source.sourceName || 'yapi', items as any)
    vscode.window.showInformationMessage(`生成完成：${items.length}项，目录 ${path.join(apisDir, source.sourceName || 'yapi')}`)
  })
}