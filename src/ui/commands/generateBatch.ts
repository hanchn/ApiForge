import * as vscode from 'vscode'
import { Logger } from '../../logging/logger'
import { SettingsManager } from '../../config/settingsManager'
import { SecretService } from '../../secrets/secretService'

export function registerGenerateBatch(context: vscode.ExtensionContext, deps: { logger: Logger; settings: SettingsManager; secrets: SecretService }) {
  return vscode.commands.registerCommand('apiforge.generateBatch', async () => {
    const cfg = deps.settings.getConfig()
    deps.logger.info(`generate batch using ${cfg.output?.structure}`)
    vscode.window.showInformationMessage('ApiForge: 批量生成接口')
  })
}