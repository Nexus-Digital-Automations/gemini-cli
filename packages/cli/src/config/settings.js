/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { homedir, platform } from 'node:os';
import * as dotenv from 'dotenv';
import process from 'node:process';
import { FatalConfigError, GEMINI_CONFIG_DIR as GEMINI_DIR, getErrorMessage, Storage, } from '@google/gemini-cli-core';
import stripJsonComments from 'strip-json-comments';
import { DefaultLight } from '../ui/themes/default-light.js';
import { DefaultDark } from '../ui/themes/default.js';
import { isWorkspaceTrusted } from './trustedFolders.js';
import { getSettingsSchema, } from './settingsSchema.js';
import { resolveEnvVarsInObject } from '../utils/envVarResolver.js';
import { customDeepMerge } from '../utils/deepMerge.js';
import { updateSettingsFilePreservingFormat } from '../utils/commentJson.js';
import { disableExtension } from './extension.js';
/**
 * Determines the merge strategy for a specific setting path in the schema hierarchy.
 * Traverses nested configuration properties to find the appropriate merge behavior.
 *
 * @param path - Array of property keys representing the path to the setting
 * @returns The merge strategy for the setting, or undefined if path is invalid
 *
 * @example
 * ```typescript
 * const strategy = getMergeStrategyForPath(['context', 'includeDirectories']);
 * // Returns MergeStrategy.CONCAT for array concatenation
 * ```
 */
function getMergeStrategyForPath(path) {
    let current = undefined;
    let currentSchema = getSettingsSchema();
    for (const key of path) {
        if (!currentSchema || !currentSchema[key]) {
            return undefined;
        }
        current = currentSchema[key];
        currentSchema = current.properties;
    }
    return current?.mergeStrategy;
}
/** Directory name used for storing Gemini CLI configuration files */
export const SETTINGS_DIRECTORY_NAME = '.gemini';
/** Absolute path to the user's global settings file */
export const USER_SETTINGS_PATH = Storage.getGlobalSettingsPath();
/** Directory containing the user's global settings file */
export const USER_SETTINGS_DIR = path.dirname(USER_SETTINGS_PATH);
/** Default environment variables to exclude from project context loading */
export const DEFAULT_EXCLUDED_ENV_VARS = ['DEBUG', 'DEBUG_MODE'];
const MIGRATE_V2_OVERWRITE = true;
const MIGRATION_MAP = {
    accessibility: 'ui.accessibility',
    allowedTools: 'tools.allowed',
    allowMCPServers: 'mcp.allowed',
    autoAccept: 'tools.autoAccept',
    autoConfigureMaxOldSpaceSize: 'advanced.autoConfigureMemory',
    bugCommand: 'advanced.bugCommand',
    chatCompression: 'model.chatCompression',
    checkpointing: 'general.checkpointing',
    coreTools: 'tools.core',
    contextFileName: 'context.fileName',
    customThemes: 'ui.customThemes',
    customWittyPhrases: 'ui.customWittyPhrases',
    debugKeystrokeLogging: 'general.debugKeystrokeLogging',
    disableAutoUpdate: 'general.disableAutoUpdate',
    disableUpdateNag: 'general.disableUpdateNag',
    dnsResolutionOrder: 'advanced.dnsResolutionOrder',
    enableMessageBusIntegration: 'tools.enableMessageBusIntegration',
    enablePromptCompletion: 'general.enablePromptCompletion',
    enforcedAuthType: 'security.auth.enforcedType',
    excludeTools: 'tools.exclude',
    excludeMCPServers: 'mcp.excluded',
    excludedProjectEnvVars: 'advanced.excludedEnvVars',
    extensionManagement: 'experimental.extensionManagement',
    extensions: 'extensions',
    fileFiltering: 'context.fileFiltering',
    folderTrustFeature: 'security.folderTrust.featureEnabled',
    folderTrust: 'security.folderTrust.enabled',
    hasSeenIdeIntegrationNudge: 'ide.hasSeenNudge',
    hideWindowTitle: 'ui.hideWindowTitle',
    hideTips: 'ui.hideTips',
    hideBanner: 'ui.hideBanner',
    hideFooter: 'ui.hideFooter',
    hideCWD: 'ui.footer.hideCWD',
    hideSandboxStatus: 'ui.footer.hideSandboxStatus',
    hideModelInfo: 'ui.footer.hideModelInfo',
    hideContextSummary: 'ui.hideContextSummary',
    showMemoryUsage: 'ui.showMemoryUsage',
    showLineNumbers: 'ui.showLineNumbers',
    showCitations: 'ui.showCitations',
    ideMode: 'ide.enabled',
    includeDirectories: 'context.includeDirectories',
    loadMemoryFromIncludeDirectories: 'context.loadFromIncludeDirectories',
    maxSessionTurns: 'model.maxSessionTurns',
    mcpServers: 'mcpServers',
    mcpServerCommand: 'mcp.serverCommand',
    memoryImportFormat: 'context.importFormat',
    memoryDiscoveryMaxDirs: 'context.discoveryMaxDirs',
    model: 'model.name',
    preferredEditor: 'general.preferredEditor',
    sandbox: 'tools.sandbox',
    selectedAuthType: 'security.auth.selectedType',
    shouldUseNodePtyShell: 'tools.shell.enableInteractiveShell',
    shellPager: 'tools.shell.pager',
    shellShowColor: 'tools.shell.showColor',
    skipNextSpeakerCheck: 'model.skipNextSpeakerCheck',
    summarizeToolOutput: 'model.summarizeToolOutput',
    telemetry: 'telemetry',
    theme: 'ui.theme',
    toolDiscoveryCommand: 'tools.discoveryCommand',
    toolCallCommand: 'tools.callCommand',
    usageStatisticsEnabled: 'privacy.usageStatisticsEnabled',
    useExternalAuth: 'security.auth.useExternal',
    useRipgrep: 'tools.useRipgrep',
    vimMode: 'general.vimMode',
};
/**
 * Returns the platform-specific path for system-wide settings configuration.
 * System settings provide organization-wide defaults and restrictions.
 * Can be overridden via GEMINI_CLI_SYSTEM_SETTINGS_PATH environment variable.
 *
 * @returns Absolute path to the system settings file
 *
 * Platform-specific locations:
 * - macOS: /Library/Application Support/GeminiCli/settings.json
 * - Windows: C:\ProgramData\gemini-cli\settings.json
 * - Linux/Unix: /etc/gemini-cli/settings.json
 */
export function getSystemSettingsPath() {
    if (process.env['GEMINI_CLI_SYSTEM_SETTINGS_PATH']) {
        return process.env['GEMINI_CLI_SYSTEM_SETTINGS_PATH'];
    }
    if (platform() === 'darwin') {
        return '/Library/Application Support/GeminiCli/settings.json';
    }
    else if (platform() === 'win32') {
        return 'C:\\ProgramData\\gemini-cli\\settings.json';
    }
    else {
        return '/etc/gemini-cli/settings.json';
    }
}
/**
 * Returns the path for system default configuration values.
 * System defaults provide baseline configuration before any customization.
 * Located alongside system settings but with lower precedence.
 *
 * @returns Absolute path to the system defaults file
 */
export function getSystemDefaultsPath() {
    if (process.env['GEMINI_CLI_SYSTEM_DEFAULTS_PATH']) {
        return process.env['GEMINI_CLI_SYSTEM_DEFAULTS_PATH'];
    }
    return path.join(path.dirname(getSystemSettingsPath()), 'system-defaults.json');
}
/**
 * Enumeration of configuration scopes in order of precedence (lowest to highest).
 * Settings are merged hierarchically with higher scopes overriding lower ones.
 *
 * Precedence order (highest precedence wins):
 * 1. SystemDefaults (lowest)
 * 2. User
 * 3. Workspace
 * 4. System (highest - administrative overrides)
 */
export let SettingScope;
(function (SettingScope) {
    /** User-specific settings stored in home directory */
    SettingScope["User"] = "User";
    /** Project/workspace-specific settings (only loaded in trusted workspaces) */
    SettingScope["Workspace"] = "Workspace";
    /** System-wide administrative settings with highest precedence */
    SettingScope["System"] = "System";
    /** Default baseline settings for the system */
    SettingScope["SystemDefaults"] = "SystemDefaults";
})(SettingScope || (SettingScope = {}));
/**
 * Sets a value at a nested object path, creating intermediate objects as needed.
 * Used for applying configuration values to deeply nested settings structures.
 *
 * @param obj - Target object to modify
 * @param path - Dot-separated path to the property (e.g., 'ui.theme.colors')
 * @param value - Value to set at the specified path
 *
 * @example
 * ```typescript
 * const settings = {};
 * setNestedProperty(settings, 'ui.theme.name', 'dark');
 * // Result: { ui: { theme: { name: 'dark' } } }
 * ```
 */
function setNestedProperty(obj, path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    if (!lastKey)
        return;
    let current = obj;
    for (const key of keys) {
        if (current[key] === undefined) {
            current[key] = {};
        }
        const next = current[key];
        if (typeof next === 'object' && next !== null) {
            current = next;
        }
        else {
            // This path is invalid, so we stop.
            return;
        }
    }
    current[lastKey] = value;
}
/**
 * Determines if a settings object needs migration from v1 to v2 format.
 * Checks for presence of deprecated top-level keys that have been moved to nested locations.
 *
 * @param settings - Settings object to check for migration needs
 * @returns True if the settings contain v1 keys that need migration
 *
 * @example
 * ```typescript
 * const oldSettings = { vimMode: true, theme: 'dark' };
 * const needsUpdate = needsMigration(oldSettings); // true
 *
 * const newSettings = { general: { vimMode: true }, ui: { theme: 'dark' } };
 * const isUpdated = needsMigration(newSettings); // false
 * ```
 */
export function needsMigration(settings) {
    // A file needs migration if it contains any top-level key that is moved to a
    // nested location in V2.
    const hasV1Keys = Object.entries(MIGRATION_MAP).some(([v1Key, v2Path]) => {
        if (v1Key === v2Path || !(v1Key in settings)) {
            return false;
        }
        // If a key exists that is both a V1 key and a V2 container (like 'model'),
        // we need to check the type. If it's an object, it's a V2 container and not
        // a V1 key that needs migration.
        if (KNOWN_V2_CONTAINERS.has(v1Key) &&
            typeof settings[v1Key] === 'object' &&
            settings[v1Key] !== null) {
            return false;
        }
        return true;
    });
    return hasV1Keys;
}
/**
 * Migrates settings from v1 flat structure to v2 nested structure.
 * Transforms deprecated top-level properties to their new nested locations
 * while preserving any custom settings and properly merging conflicts.
 *
 * @param flatSettings - Settings object in v1 format with flat structure
 * @returns Migrated settings in v2 format, or null if no migration needed
 *
 * @example
 * ```typescript
 * const v1Settings = {
 *   vimMode: true,
 *   theme: 'dark',
 *   customSetting: 'value'
 * };
 *
 * const v2Settings = migrateSettingsToV2(v1Settings);
 * // Result: {
 * //   general: { vimMode: true },
 * //   ui: { theme: 'dark' },
 * //   customSetting: 'value'
 * // }
 * ```
 */
function migrateSettingsToV2(flatSettings) {
    if (!needsMigration(flatSettings)) {
        return null;
    }
    const v2Settings = {};
    const flatKeys = new Set(Object.keys(flatSettings));
    for (const [oldKey, newPath] of Object.entries(MIGRATION_MAP)) {
        if (flatKeys.has(oldKey)) {
            setNestedProperty(v2Settings, newPath, flatSettings[oldKey]);
            flatKeys.delete(oldKey);
        }
    }
    // Preserve mcpServers at the top level
    if (flatSettings['mcpServers']) {
        v2Settings['mcpServers'] = flatSettings['mcpServers'];
        flatKeys.delete('mcpServers');
    }
    // Carry over any unrecognized keys
    for (const remainingKey of flatKeys) {
        const existingValue = v2Settings[remainingKey];
        const newValue = flatSettings[remainingKey];
        if (typeof existingValue === 'object' &&
            existingValue !== null &&
            !Array.isArray(existingValue) &&
            typeof newValue === 'object' &&
            newValue !== null &&
            !Array.isArray(newValue)) {
            const pathAwareGetStrategy = (path) => getMergeStrategyForPath([remainingKey, ...path]);
            v2Settings[remainingKey] = customDeepMerge(pathAwareGetStrategy, {}, newValue, existingValue);
        }
        else {
            v2Settings[remainingKey] = newValue;
        }
    }
    return v2Settings;
}
/**
 * Retrieves a value from a nested object path.
 * Used for reading deeply nested configuration values.
 *
 * @param obj - Object to read from
 * @param path - Dot-separated path to the property
 * @returns Value at the specified path, or undefined if path doesn't exist
 *
 * @example
 * ```typescript
 * const settings = { ui: { theme: { name: 'dark' } } };
 * const themeName = getNestedProperty(settings, 'ui.theme.name'); // 'dark'
 * const missing = getNestedProperty(settings, 'ui.colors.primary'); // undefined
 * ```
 */
function getNestedProperty(obj, path) {
    const keys = path.split('.');
    let current = obj;
    for (const key of keys) {
        if (typeof current !== 'object' || current === null || !(key in current)) {
            return undefined;
        }
        current = current[key];
    }
    return current;
}
const REVERSE_MIGRATION_MAP = Object.fromEntries(Object.entries(MIGRATION_MAP).map(([key, value]) => [value, key]));
// Dynamically determine the top-level keys from the V2 settings structure.
const KNOWN_V2_CONTAINERS = new Set(Object.values(MIGRATION_MAP).map((path) => path.split('.')[0]));
/**
 * Converts settings from v2 nested format back to v1 flat format.
 * Used for backward compatibility when saving settings to files that expect v1 format.
 *
 * @param v2Settings - Settings in v2 nested format
 * @returns Settings converted to v1 flat format
 *
 * @example
 * ```typescript
 * const v2Settings = {
 *   general: { vimMode: true },
 *   ui: { theme: 'dark' }
 * };
 *
 * const v1Settings = migrateSettingsToV1(v2Settings);
 * // Result: { vimMode: true, theme: 'dark' }
 * ```
 */
export function migrateSettingsToV1(v2Settings) {
    const v1Settings = {};
    const v2Keys = new Set(Object.keys(v2Settings));
    for (const [newPath, oldKey] of Object.entries(REVERSE_MIGRATION_MAP)) {
        const value = getNestedProperty(v2Settings, newPath);
        if (value !== undefined) {
            v1Settings[oldKey] = value;
            v2Keys.delete(newPath.split('.')[0]);
        }
    }
    // Preserve mcpServers at the top level
    if (v2Settings['mcpServers']) {
        v1Settings['mcpServers'] = v2Settings['mcpServers'];
        v2Keys.delete('mcpServers');
    }
    // Carry over any unrecognized keys
    for (const remainingKey of v2Keys) {
        const value = v2Settings[remainingKey];
        if (value === undefined) {
            continue;
        }
        // Don't carry over empty objects that were just containers for migrated settings.
        if (KNOWN_V2_CONTAINERS.has(remainingKey) &&
            typeof value === 'object' &&
            value !== null &&
            !Array.isArray(value) &&
            Object.keys(value).length === 0) {
            continue;
        }
        v1Settings[remainingKey] = value;
    }
    return v1Settings;
}
/**
 * Merges configuration settings from multiple scopes according to precedence rules.
 * Higher precedence settings override lower ones, with special handling for untrusted workspaces.
 *
 * Merge precedence (lowest to highest):
 * 1. System Defaults (baseline configuration)
 * 2. User Settings (personal preferences)
 * 3. Workspace Settings (project-specific, only if trusted)
 * 4. System Settings (administrative overrides)
 *
 * @param system - System-wide administrative settings (highest precedence)
 * @param systemDefaults - Default baseline settings (lowest precedence)
 * @param user - User personal settings
 * @param workspace - Project/workspace settings (ignored if untrusted)
 * @param isTrusted - Whether the current workspace is trusted for loading workspace settings
 * @returns Merged settings with proper precedence applied
 *
 * @example
 * ```typescript
 * const merged = mergeSettings(
 *   { ui: { theme: 'system-dark' } },      // System override
 *   { general: { vimMode: false } },       // Default
 *   { general: { vimMode: true } },        // User preference
 *   { ui: { theme: 'project-light' } },    // Workspace (if trusted)
 *   true  // Workspace is trusted
 * );
 * // Result: { general: { vimMode: true }, ui: { theme: 'system-dark' } }
 * ```
 */
function mergeSettings(system, systemDefaults, user, workspace, isTrusted) {
    const safeWorkspace = isTrusted ? workspace : {};
    // Settings are merged with the following precedence (last one wins for
    // single values):
    // 1. System Defaults
    // 2. User Settings
    // 3. Workspace Settings
    // 4. System Settings (as overrides)
    return customDeepMerge(getMergeStrategyForPath, {}, // Start with an empty object
    systemDefaults, user, safeWorkspace, system);
}
/**
 * Complete settings configuration loaded from all available sources.
 * Manages configuration from system defaults, user preferences, workspace settings,
 * and system overrides with proper precedence and security handling.
 *
 * Provides methods to:
 * - Access merged settings with proper precedence
 * - Modify settings in specific scopes
 * - Handle trusted/untrusted workspace scenarios
 * - Manage settings file persistence
 *
 * @example
 * ```typescript
 * const loadedSettings = loadSettings('/path/to/workspace');
 *
 * // Access merged configuration
 * const vimMode = loadedSettings.merged.general?.vimMode;
 *
 * // Modify user settings
 * loadedSettings.setValue(SettingScope.User, 'general.vimMode', true);
 *
 * // Check workspace trust status
 * if (loadedSettings.isTrusted) {
 *   // Workspace settings are active
 * }
 * ```
 */
export class LoadedSettings {
    constructor(system, systemDefaults, user, workspace, isTrusted, migratedInMemorScopes) {
        this.system = system;
        this.systemDefaults = systemDefaults;
        this.user = user;
        this.workspace = workspace;
        this.isTrusted = isTrusted;
        this.migratedInMemorScopes = migratedInMemorScopes;
        this._merged = this.computeMergedSettings();
    }
    /** System-wide administrative settings with highest precedence */
    system;
    /** Default baseline settings with lowest precedence */
    systemDefaults;
    /** User personal settings */
    user;
    /** Project/workspace-specific settings (only used if workspace is trusted) */
    workspace;
    /** Whether the current workspace is trusted for loading workspace settings */
    isTrusted;
    /** Set of scopes that were migrated in memory but not yet written to disk */
    migratedInMemorScopes;
    _merged;
    /**
     * The final merged settings configuration with all scopes properly combined.
     * This is the configuration that should be used throughout the application.
     *
     * @returns Complete settings object with proper precedence applied
     */
    get merged() {
        return this._merged;
    }
    /**
     * Computes the merged settings by combining all configuration scopes.
     * Called automatically when settings change to maintain consistency.
     *
     * @returns Newly computed merged settings
     */
    computeMergedSettings() {
        return mergeSettings(this.system.settings, this.systemDefaults.settings, this.user.settings, this.workspace.settings, this.isTrusted);
    }
    /**
     * Retrieves the settings file for a specific configuration scope.
     * Provides access to individual configuration layers for targeted modifications.
     *
     * @param scope - The configuration scope to retrieve
     * @returns The settings file for the specified scope
     * @throws Error if the scope is invalid
     *
     * @example
     * ```typescript
     * const userSettings = loadedSettings.forScope(SettingScope.User);
     * const currentTheme = userSettings.settings.ui?.theme;
     * ```
     */
    forScope(scope) {
        switch (scope) {
            case SettingScope.User:
                return this.user;
            case SettingScope.Workspace:
                return this.workspace;
            case SettingScope.System:
                return this.system;
            case SettingScope.SystemDefaults:
                return this.systemDefaults;
            default:
                throw new Error(`Invalid scope: ${scope}`);
        }
    }
    /**
     * Sets a configuration value in a specific scope and persists the change.
     * Updates both the runtime settings and the original settings for file persistence.
     * Automatically recomputes merged settings and saves to disk.
     *
     * @param scope - The configuration scope to modify
     * @param key - Dot-separated path to the setting (e.g., 'ui.theme')
     * @param value - The new value to set
     *
     * @example
     * ```typescript
     * // Set user preference for vim mode
     * loadedSettings.setValue(SettingScope.User, 'general.vimMode', true);
     *
     * // Set workspace-specific theme
     * loadedSettings.setValue(SettingScope.Workspace, 'ui.theme', 'project-dark');
     * ```
     */
    setValue(scope, key, value) {
        const settingsFile = this.forScope(scope);
        setNestedProperty(settingsFile.settings, key, value);
        setNestedProperty(settingsFile.originalSettings, key, value);
        this._merged = this.computeMergedSettings();
        saveSettings(settingsFile);
    }
    /**
     * Explicitly saves all settings files to disk.
     * Note: Individual setValue calls already save automatically.
     * This method is provided for explicit save operations and consistency.
     * In the future, this could be enhanced to track dirty state and batch saves.
     *
     * @example
     * ```typescript
     * // Explicit save operation (though setValue already saves)
     * await loadedSettings.save();
     * ```
     */
    async save() {
        // Since setValue already saves automatically, this method is primarily
        // for API compatibility. In the future, we could track dirty state
        // and only save modified files here.
    }
}
/**
 * Searches for environment files (.env) starting from a directory and walking up the tree.
 * Follows a specific precedence order to locate the most appropriate environment file.
 *
 * Search order (first found wins):
 * 1. .gemini/.env in current directory (Gemini-specific)
 * 2. .env in current directory (standard)
 * 3. Walk up parent directories repeating steps 1-2
 * 4. .gemini/.env in user home directory (fallback)
 * 5. .env in user home directory (final fallback)
 *
 * @param startDir - Directory to start searching from
 * @returns Path to the found environment file, or null if none found
 *
 * @example
 * ```typescript
 * const envFile = findEnvFile('/workspace/project');
 * if (envFile) {
 *   console.log(`Found environment file: ${envFile}`);
 * }
 * ```
 */
function findEnvFile(startDir) {
    let currentDir = path.resolve(startDir);
    while (true) {
        // prefer gemini-specific .env under GEMINI_DIR
        const geminiEnvPath = path.join(currentDir, GEMINI_DIR, '.env');
        if (fs.existsSync(geminiEnvPath)) {
            return geminiEnvPath;
        }
        const envPath = path.join(currentDir, '.env');
        if (fs.existsSync(envPath)) {
            return envPath;
        }
        const parentDir = path.dirname(currentDir);
        if (parentDir === currentDir || !parentDir) {
            // check .env under home as fallback, again preferring gemini-specific .env
            const homeGeminiEnvPath = path.join(homedir(), GEMINI_DIR, '.env');
            if (fs.existsSync(homeGeminiEnvPath)) {
                return homeGeminiEnvPath;
            }
            const homeEnvPath = path.join(homedir(), '.env');
            if (fs.existsSync(homeEnvPath)) {
                return homeEnvPath;
            }
            return null;
        }
        currentDir = parentDir;
    }
}
/**
 * Configures Google Cloud environment variables specifically for Cloud Shell environments.
 * Handles the special case where GOOGLE_CLOUD_PROJECT needs Cloud Shell-specific defaults
 * rather than using the globally configured project from gcloud.
 *
 * Cloud Shell Behavior:
 * - If .env file specifies GOOGLE_CLOUD_PROJECT, that value is used
 * - Otherwise, sets to 'cloudshell-gca' as the default
 * - This prevents conflicts with user's global gcloud project settings
 *
 * @param envFilePath - Path to the environment file, or null if none found
 *
 * @example
 * ```typescript
 * // Called automatically in Cloud Shell environments
 * if (process.env['CLOUD_SHELL'] === 'true') {
 *   setUpCloudShellEnvironment('/workspace/.env');
 * }
 * ```
 */
export function setUpCloudShellEnvironment(envFilePath) {
    // Special handling for GOOGLE_CLOUD_PROJECT in Cloud Shell:
    // Because GOOGLE_CLOUD_PROJECT in Cloud Shell tracks the project
    // set by the user using "gcloud config set project" we do not want to
    // use its value. So, unless the user overrides GOOGLE_CLOUD_PROJECT in
    // one of the .env files, we set the Cloud Shell-specific default here.
    if (envFilePath && fs.existsSync(envFilePath)) {
        const envFileContent = fs.readFileSync(envFilePath);
        const parsedEnv = dotenv.parse(envFileContent);
        if (parsedEnv['GOOGLE_CLOUD_PROJECT']) {
            // .env file takes precedence in Cloud Shell
            process.env['GOOGLE_CLOUD_PROJECT'] = parsedEnv['GOOGLE_CLOUD_PROJECT'];
        }
        else {
            // If not in .env, set to default and override global
            process.env['GOOGLE_CLOUD_PROJECT'] = 'cloudshell-gca';
        }
    }
    else {
        // If no .env file, set to default and override global
        process.env['GOOGLE_CLOUD_PROJECT'] = 'cloudshell-gca';
    }
}
/**
 * Loads environment variables from .env files based on current workspace and trust settings.
 * Implements security measures and variable exclusion rules for safe environment loading.
 *
 * Security and Trust:
 * - Only loads environment variables if the workspace is trusted
 * - Respects excluded variable lists to prevent loading sensitive/problematic variables
 * - Preserves existing environment variables (doesn't overwrite)
 *
 * File Processing:
 * - Finds appropriate .env file using search hierarchy
 * - Handles Cloud Shell special cases automatically
 * - Supports both Gemini-specific and standard .env files
 *
 * @param settings - Current application settings containing exclusion rules
 *
 * @example
 * ```typescript
 * const settings = loadSettings();
 * loadEnvironment(settings.merged);
 * // Environment variables from .env files are now available in process.env
 * ```
 */
export function loadEnvironment(settings) {
    const envFilePath = findEnvFile(process.cwd());
    if (!isWorkspaceTrusted(settings).isTrusted) {
        return;
    }
    // Cloud Shell environment variable handling
    if (process.env['CLOUD_SHELL'] === 'true') {
        setUpCloudShellEnvironment(envFilePath);
    }
    if (envFilePath) {
        // Manually parse and load environment variables to handle exclusions correctly.
        // This avoids modifying environment variables that were already set from the shell.
        try {
            const envFileContent = fs.readFileSync(envFilePath, 'utf-8');
            const parsedEnv = dotenv.parse(envFileContent);
            const excludedVars = settings?.advanced?.excludedEnvVars || DEFAULT_EXCLUDED_ENV_VARS;
            const isProjectEnvFile = !envFilePath.includes(GEMINI_DIR);
            for (const key in parsedEnv) {
                if (Object.hasOwn(parsedEnv, key)) {
                    // If it's a project .env file, skip loading excluded variables.
                    if (isProjectEnvFile && excludedVars.includes(key)) {
                        continue;
                    }
                    // Load variable only if it's not already set in the environment.
                    if (!Object.hasOwn(process.env, key)) {
                        process.env[key] = parsedEnv[key];
                    }
                }
            }
        }
        catch (_e) {
            // Errors are ignored to match the behavior of `dotenv.config({ quiet: true })`.
        }
    }
}
/**
 * Loads settings from user and workspace directories.
 * Project settings override user settings.
 */
export function loadSettings(workspaceDir = process.cwd()) {
    let systemSettings = {};
    let systemDefaultSettings = {};
    let userSettings = {};
    let workspaceSettings = {};
    const settingsErrors = [];
    const systemSettingsPath = getSystemSettingsPath();
    const systemDefaultsPath = getSystemDefaultsPath();
    const migratedInMemorScopes = new Set();
    // Resolve paths to their canonical representation to handle symlinks
    const resolvedWorkspaceDir = path.resolve(workspaceDir);
    const resolvedHomeDir = path.resolve(homedir());
    let realWorkspaceDir = resolvedWorkspaceDir;
    try {
        // fs.realpathSync gets the "true" path, resolving any symlinks
        realWorkspaceDir = fs.realpathSync(resolvedWorkspaceDir);
    }
    catch (_e) {
        // This is okay. The path might not exist yet, and that's a valid state.
    }
    // We expect homedir to always exist and be resolvable.
    const realHomeDir = fs.realpathSync(resolvedHomeDir);
    const workspaceSettingsPath = new Storage(workspaceDir).getWorkspaceSettingsPath();
    const loadAndMigrate = (filePath, scope) => {
        try {
            if (fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath, 'utf-8');
                const rawSettings = JSON.parse(stripJsonComments(content));
                if (typeof rawSettings !== 'object' ||
                    rawSettings === null ||
                    Array.isArray(rawSettings)) {
                    settingsErrors.push({
                        message: 'Settings file is not a valid JSON object.',
                        path: filePath,
                    });
                    return { settings: {} };
                }
                let settingsObject = rawSettings;
                if (needsMigration(settingsObject)) {
                    const migratedSettings = migrateSettingsToV2(settingsObject);
                    if (migratedSettings) {
                        if (MIGRATE_V2_OVERWRITE) {
                            try {
                                fs.renameSync(filePath, `${filePath}.orig`);
                                fs.writeFileSync(filePath, JSON.stringify(migratedSettings, null, 2), 'utf-8');
                            }
                            catch (e) {
                                console.error(`Error migrating settings file on disk: ${getErrorMessage(e)}`);
                            }
                        }
                        else {
                            migratedInMemorScopes.add(scope);
                        }
                        settingsObject = migratedSettings;
                    }
                }
                return { settings: settingsObject, rawJson: content };
            }
        }
        catch (error) {
            settingsErrors.push({
                message: getErrorMessage(error),
                path: filePath,
            });
        }
        return { settings: {} };
    };
    const systemResult = loadAndMigrate(systemSettingsPath, SettingScope.System);
    const systemDefaultsResult = loadAndMigrate(systemDefaultsPath, SettingScope.SystemDefaults);
    const userResult = loadAndMigrate(USER_SETTINGS_PATH, SettingScope.User);
    let workspaceResult = {
        settings: {},
        rawJson: undefined,
    };
    if (realWorkspaceDir !== realHomeDir) {
        workspaceResult = loadAndMigrate(workspaceSettingsPath, SettingScope.Workspace);
    }
    const systemOriginalSettings = structuredClone(systemResult.settings);
    const systemDefaultsOriginalSettings = structuredClone(systemDefaultsResult.settings);
    const userOriginalSettings = structuredClone(userResult.settings);
    const workspaceOriginalSettings = structuredClone(workspaceResult.settings);
    // Environment variables for runtime use
    systemSettings = resolveEnvVarsInObject(systemResult.settings);
    systemDefaultSettings = resolveEnvVarsInObject(systemDefaultsResult.settings);
    userSettings = resolveEnvVarsInObject(userResult.settings);
    workspaceSettings = resolveEnvVarsInObject(workspaceResult.settings);
    // Support legacy theme names
    if (userSettings.ui?.theme === 'VS') {
        userSettings.ui.theme = DefaultLight.name;
    }
    else if (userSettings.ui?.theme === 'VS2015') {
        userSettings.ui.theme = DefaultDark.name;
    }
    if (workspaceSettings.ui?.theme === 'VS') {
        workspaceSettings.ui.theme = DefaultLight.name;
    }
    else if (workspaceSettings.ui?.theme === 'VS2015') {
        workspaceSettings.ui.theme = DefaultDark.name;
    }
    // For the initial trust check, we can only use user and system settings.
    const initialTrustCheckSettings = customDeepMerge(getMergeStrategyForPath, {}, systemSettings, userSettings);
    const isTrusted = isWorkspaceTrusted(initialTrustCheckSettings).isTrusted ?? true;
    // Create a temporary merged settings object to pass to loadEnvironment.
    const tempMergedSettings = mergeSettings(systemSettings, systemDefaultSettings, userSettings, workspaceSettings, isTrusted);
    // loadEnviroment depends on settings so we have to create a temp version of
    // the settings to avoid a cycle
    loadEnvironment(tempMergedSettings);
    // Create LoadedSettings first
    if (settingsErrors.length > 0) {
        const errorMessages = settingsErrors.map((error) => `Error in ${error.path}: ${error.message}`);
        throw new FatalConfigError(`${errorMessages.join('\n')}\nPlease fix the configuration file(s) and try again.`);
    }
    return new LoadedSettings({
        path: systemSettingsPath,
        settings: systemSettings,
        originalSettings: systemOriginalSettings,
        rawJson: systemResult.rawJson,
    }, {
        path: systemDefaultsPath,
        settings: systemDefaultSettings,
        originalSettings: systemDefaultsOriginalSettings,
        rawJson: systemDefaultsResult.rawJson,
    }, {
        path: USER_SETTINGS_PATH,
        settings: userSettings,
        originalSettings: userOriginalSettings,
        rawJson: userResult.rawJson,
    }, {
        path: workspaceSettingsPath,
        settings: workspaceSettings,
        originalSettings: workspaceOriginalSettings,
        rawJson: workspaceResult.rawJson,
    }, isTrusted, migratedInMemorScopes);
}
export function migrateDeprecatedSettings(loadedSettings, workspaceDir = process.cwd()) {
    const processScope = (scope) => {
        const settings = loadedSettings.forScope(scope).settings;
        if (settings.extensions?.disabled) {
            console.log(`Migrating deprecated extensions.disabled settings from ${scope} settings...`);
            for (const extension of settings.extensions.disabled ?? []) {
                disableExtension(extension, scope, workspaceDir);
            }
            const newExtensionsValue = { ...settings.extensions };
            newExtensionsValue.disabled = undefined;
            loadedSettings.setValue(scope, 'extensions', newExtensionsValue);
        }
    };
    processScope(SettingScope.User);
    processScope(SettingScope.Workspace);
}
export function saveSettings(settingsFile) {
    try {
        // Ensure the directory exists
        const dirPath = path.dirname(settingsFile.path);
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
        let settingsToSave = settingsFile.originalSettings;
        if (!MIGRATE_V2_OVERWRITE) {
            settingsToSave = migrateSettingsToV1(settingsToSave);
        }
        // Use the format-preserving update function
        updateSettingsFilePreservingFormat(settingsFile.path, settingsToSave);
    }
    catch (error) {
        console.error('Error saving user settings file:', error);
    }
}
//# sourceMappingURL=settings.js.map