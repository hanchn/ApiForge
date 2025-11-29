import * as vscode from 'vscode'
import { Logger } from '../../logging/logger'
import { SettingsManager } from '../../config/settingsManager'
import { SecretService } from '../../secrets/secretService'

export function registerConfigureSources(context: vscode.ExtensionContext, deps: { logger: Logger; settings: SettingsManager; secrets: SecretService }) {
  return vscode.commands.registerCommand('apiforge.configureSources', async () => {
    deps.logger.show()
    vscode.window.showInformationMessage('ApiForge: 打开数据源配置表单')
  })
}