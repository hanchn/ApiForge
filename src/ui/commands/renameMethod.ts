import * as vscode from 'vscode'
import { Logger } from '../../logging/logger'
import { SettingsManager } from '../../config/settingsManager'
import { SecretService } from '../../secrets/secretService'

export function registerRenameMethod(context: vscode.ExtensionContext, deps: { logger: Logger; settings: SettingsManager; secrets: SecretService }) {
  return vscode.commands.registerCommand('apiforge.renameMethod', async () => {
    const scheme = deps.settings.getConfig().naming?.scheme || 'pathSnake'
    const input = await vscode.window.showInputBox({ prompt: '输入接口路径与方法，如 GET /users/{id}' })
    if (!input) return
    const m = input.match(/^(GET|POST|PUT|PATCH|DELETE)\s+(.+)$/i)
    if (!m) { vscode.window.showWarningMessage('格式: METHOD /path'); return }
    const method = m[1].toUpperCase() as any
    const path = m[2]
    const item = { id: 'temp', name: '', method, path } as any
    let suggestion = ''
    if (scheme === 'pathSnake') {
      const { nameFromPathSnake } = await import('../../naming/namer')
      suggestion = nameFromPathSnake(item)
    }
    const name = await vscode.window.showInputBox({ prompt: '输入新方法名', value: suggestion })
    if (!name) return
    deps.logger.info(`rename to ${name}`)
  })
}