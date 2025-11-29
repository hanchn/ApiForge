import * as vscode from 'vscode'
import * as fs from 'fs'
import * as path from 'path'
import { Logger } from '../logging/logger'

export type ApiForgeConfig = {
  sources?: any[]
  output?: { baseDir?: string; structure?: 'byTag'|'byPathPrefix'|'flat' }
  template?: { runtime?: 'external'|'fetch'|'axios'|'umi-request'|'ky'; options?: Record<string, any> }
  runtime?: { fallback?: 'fetch'|'axios'|'umi-request'|'ky'; clientProviderPath?: string }
  naming?: { scheme?: 'resourceVerbCamel'|'pathSnake' }
}

export class SettingsManager {
  private logger: Logger
  constructor(logger: Logger) { this.logger = logger }
  getConfig(): ApiForgeConfig {
    const conf = vscode.workspace.getConfiguration('apiForge')
    const base: ApiForgeConfig = {
      sources: conf.get<any[]>('sources') || [],
      output: {
        baseDir: conf.get<string>('output.baseDir') || 'Apis',
        structure: (conf.get<string>('output.structure') as any) || 'byTag'
      },
      template: { runtime: (conf.get<string>('template.runtime') as any) || 'external', options: conf.get('template.options') || {} },
      runtime: { fallback: (conf.get<string>('runtime.fallback') as any) || 'fetch', clientProviderPath: conf.get<string>('runtime.clientProviderPath') },
      naming: { scheme: (conf.get<string>('naming.scheme') as any) || 'pathSnake' }
    }
    const merged = this.mergeWithWorkspace(base)
    return merged
  }
  private mergeWithWorkspace(base: ApiForgeConfig): ApiForgeConfig {
    const folder = vscode.workspace.workspaceFolders?.[0]
    if (!folder) return base
    const p = path.join(folder.uri.fsPath, 'apiForge.config.json')
    try {
      if (fs.existsSync(p)) {
        const raw = fs.readFileSync(p, 'utf8')
        const json = JSON.parse(raw)
        return { ...base, ...json, output: { ...base.output, ...(json.output||{}) }, template: { ...base.template, ...(json.template||{}) }, runtime: { ...base.runtime, ...(json.runtime||{}) }, naming: { ...base.naming, ...(json.naming||{}) } }
      }
    } catch (e: any) {
      this.logger.error(`workspace config parse error: ${e?.message||e}`)
    }
    return base
  }
}