import * as vscode from 'vscode'
import { SettingsManager } from './config/settingsManager'
import { SecretService } from './secrets/secretService'
import { Logger } from './logging/logger'
import { registerGenerateOne } from './ui/commands/generateOne'
import { registerGenerateBatch } from './ui/commands/generateBatch'
import { registerSyncUpdate } from './ui/commands/syncUpdate'
import { registerConfigureSources } from './ui/commands/configureSources'
import { registerRenameMethod } from './ui/commands/renameMethod'
import { registerTestSource } from './ui/commands/testSource'
import { registerRefreshCache } from './ui/commands/refreshCache'
import { registerGenerateFromIds } from './ui/commands/generateFromIds'
import { registerGenerateOpenAPI } from './ui/commands/generateOpenAPI'

export function activate(context: vscode.ExtensionContext) {
  const logger = new Logger('ApiForge')
  const settings = new SettingsManager(logger)
  const secrets = new SecretService(context.secrets)
  context.subscriptions.push(
    registerGenerateOne(context, { logger, settings, secrets }),
    registerGenerateBatch(context, { logger, settings, secrets }),
    registerSyncUpdate(context, { logger, settings, secrets }),
    registerConfigureSources(context, { logger, settings, secrets }),
    registerRenameMethod(context, { logger, settings, secrets }),
    registerTestSource(context, { logger, settings, secrets }),
    registerRefreshCache(context, { logger, settings, secrets }),
    registerGenerateFromIds(context, { logger, settings, secrets }),
    registerGenerateOpenAPI(context, { logger, settings, secrets })
  )
  logger.info('ApiForge activated')
}

export function deactivate() {}