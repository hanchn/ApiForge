import * as vscode from 'vscode'
import { Logger } from '../../logging/logger'
import { SettingsManager } from '../../config/settingsManager'
import { SecretService } from '../../secrets/secretService'

export function registerSyncUpdate(context: vscode.ExtensionContext, deps: { logger: Logger; settings: SettingsManager; secrets: SecretService }) {
  return vscode.commands.registerCommand('apiforge.syncUpdate', async () => {
    deps.logger.info('sync update started')
    vscode.window.showInformationMessage('ApiForge: 同步增量更新')
  })
}