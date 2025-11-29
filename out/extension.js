"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const settingsManager_1 = require("./config/settingsManager");
const secretService_1 = require("./secrets/secretService");
const logger_1 = require("./logging/logger");
const generateOne_1 = require("./ui/commands/generateOne");
const generateBatch_1 = require("./ui/commands/generateBatch");
const syncUpdate_1 = require("./ui/commands/syncUpdate");
const configureSources_1 = require("./ui/commands/configureSources");
const renameMethod_1 = require("./ui/commands/renameMethod");
const testSource_1 = require("./ui/commands/testSource");
const refreshCache_1 = require("./ui/commands/refreshCache");
const generateFromIds_1 = require("./ui/commands/generateFromIds");
const generateOpenAPI_1 = require("./ui/commands/generateOpenAPI");
function activate(context) {
    const logger = new logger_1.Logger('ApiForge');
    const settings = new settingsManager_1.SettingsManager(logger);
    const secrets = new secretService_1.SecretService(context.secrets);
    context.subscriptions.push((0, generateOne_1.registerGenerateOne)(context, { logger, settings, secrets }), (0, generateBatch_1.registerGenerateBatch)(context, { logger, settings, secrets }), (0, syncUpdate_1.registerSyncUpdate)(context, { logger, settings, secrets }), (0, configureSources_1.registerConfigureSources)(context, { logger, settings, secrets }), (0, renameMethod_1.registerRenameMethod)(context, { logger, settings, secrets }), (0, testSource_1.registerTestSource)(context, { logger, settings, secrets }), (0, refreshCache_1.registerRefreshCache)(context, { logger, settings, secrets }), (0, generateFromIds_1.registerGenerateFromIds)(context, { logger, settings, secrets }), (0, generateOpenAPI_1.registerGenerateOpenAPI)(context, { logger, settings, secrets }));
    logger.info('ApiForge activated');
}
function deactivate() { }
