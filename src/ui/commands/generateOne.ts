import * as vscode from 'vscode'
import { Logger } from '../../logging/logger'
import { SettingsManager } from '../../config/settingsManager'
import { SecretService } from '../../secrets/secretService'

export function registerGenerateOne(context: vscode.ExtensionContext, deps: { logger: Logger; settings: SettingsManager; secrets: SecretService }) {
  return vscode.commands.registerCommand('apiforge.generateOne', async () => {
    const cfg = deps.settings.getConfig()
    deps.logger.info(`generate one using ${cfg.naming?.scheme}`)
    vscode.window.showInformationMessage('ApiForge: 生成接口（单个）')
  })
}