import * as vscode from 'vscode'
import { Logger } from '../../logging/logger'
import { SettingsManager } from '../../config/settingsManager'
import { SecretService } from '../../secrets/secretService'

export function registerRefreshCache(context: vscode.ExtensionContext, deps: { logger: Logger; settings: SettingsManager; secrets: SecretService }) {
  return vscode.commands.registerCommand('apiforge.refreshCache', async () => {
    deps.logger.info('refresh cache')
    vscode.window.showInformationMessage('ApiForge: 刷新缓存')
  })
}