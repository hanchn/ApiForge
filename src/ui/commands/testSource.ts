import * as vscode from 'vscode'
import { Logger } from '../../logging/logger'
import { SettingsManager } from '../../config/settingsManager'
import { SecretService } from '../../secrets/secretService'

export function registerTestSource(context: vscode.ExtensionContext, deps: { logger: Logger; settings: SettingsManager; secrets: SecretService }) {
  return vscode.commands.registerCommand('apiforge.testSource', async () => {
    const cfg = deps.settings.getConfig()
    deps.logger.info(`sources: ${cfg.sources?.length || 0}`)
    vscode.window.showInformationMessage('ApiForge: 测试数据源')
  })
}