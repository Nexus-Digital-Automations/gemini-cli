/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { type Settings, type MemoryImportFormat } from './settingsSchema.js';
export type { Settings, MemoryImportFormat };
/** Directory name used for storing Gemini CLI configuration files */
export declare const SETTINGS_DIRECTORY_NAME = '.gemini';
/** Absolute path to the user's global settings file */
export declare const USER_SETTINGS_PATH: string;
/** Directory containing the user's global settings file */
export declare const USER_SETTINGS_DIR: string;
/** Default environment variables to exclude from project context loading */
export declare const DEFAULT_EXCLUDED_ENV_VARS: string[];
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
export declare function getSystemSettingsPath(): string;
/**
 * Returns the path for system default configuration values.
 * System defaults provide baseline configuration before any customization.
 * Located alongside system settings but with lower precedence.
 *
 * @returns Absolute path to the system defaults file
 */
export declare function getSystemDefaultsPath(): string;
export type { DnsResolutionOrder } from './settingsSchema.js';
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
export declare enum SettingScope {
  /** User-specific settings stored in home directory */
  User = 'User',
  /** Project/workspace-specific settings (only loaded in trusted workspaces) */
  Workspace = 'Workspace',
  /** System-wide administrative settings with highest precedence */
  System = 'System',
  /** Default baseline settings for the system */
  SystemDefaults = 'SystemDefaults',
}
/**
 * Configuration for session checkpointing and recovery functionality.
 * Enables automatic saving and restoration of conversation state.
 */
export interface CheckpointingSettings {
  /** Whether to enable automatic session checkpointing for recovery */
  enabled?: boolean;
}
/**
 * Configuration for tool output summarization to manage context window usage.
 * Helps prevent tool outputs from consuming excessive token budget.
 */
export interface SummarizeToolOutputSettings {
  /** Maximum tokens to allocate for tool output before summarization kicks in */
  tokenBudget?: number;
}
/**
 * Accessibility-focused configuration options for improved usability.
 * Provides options for users with different accessibility needs.
 */
export interface AccessibilitySettings {
  /** Disable animated loading phrases for accessibility */
  disableLoadingPhrases?: boolean;
  /** Enable screen reader compatibility mode with plain text output */
  screenReader?: boolean;
}
/**
 * Error information for configuration file parsing and validation failures.
 * Used to provide detailed feedback about configuration problems.
 */
export interface SettingsError {
  /** Descriptive error message explaining what went wrong */
  message: string;
  /** File path where the error occurred */
  path: string;
}
/**
 * Represents a loaded configuration file with both processed and original content.
 * Maintains original format for preservation during updates.
 */
export interface SettingsFile {
  /** Processed settings with environment variable resolution and type conversion */
  settings: Settings;
  /** Original settings as parsed from file, used for format-preserving saves */
  originalSettings: Settings;
  /** Absolute path to the settings file */
  path: string;
  /** Original JSON content for format preservation during updates */
  rawJson?: string;
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
export declare function needsMigration(
  settings: Record<string, unknown>,
): boolean;
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
export declare function migrateSettingsToV1(
  v2Settings: Record<string, unknown>,
): Record<string, unknown>;
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
export declare class LoadedSettings {
  constructor(
    system: SettingsFile,
    systemDefaults: SettingsFile,
    user: SettingsFile,
    workspace: SettingsFile,
    isTrusted: boolean,
    migratedInMemorScopes: Set<SettingScope>,
  );
  /** System-wide administrative settings with highest precedence */
  readonly system: SettingsFile;
  /** Default baseline settings with lowest precedence */
  readonly systemDefaults: SettingsFile;
  /** User personal settings */
  readonly user: SettingsFile;
  /** Project/workspace-specific settings (only used if workspace is trusted) */
  readonly workspace: SettingsFile;
  /** Whether the current workspace is trusted for loading workspace settings */
  readonly isTrusted: boolean;
  /** Set of scopes that were migrated in memory but not yet written to disk */
  readonly migratedInMemorScopes: Set<SettingScope>;
  private _merged;
  /**
   * The final merged settings configuration with all scopes properly combined.
   * This is the configuration that should be used throughout the application.
   *
   * @returns Complete settings object with proper precedence applied
   */
  get merged(): Settings;
  /**
   * Computes the merged settings by combining all configuration scopes.
   * Called automatically when settings change to maintain consistency.
   *
   * @returns Newly computed merged settings
   */
  private computeMergedSettings;
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
  forScope(scope: SettingScope): SettingsFile;
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
  setValue(scope: SettingScope, key: string, value: unknown): void;
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
  save(): Promise<void>;
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
export declare function setUpCloudShellEnvironment(
  envFilePath: string | null,
): void;
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
export declare function loadEnvironment(settings: Settings): void;
/**
 * Loads settings from user and workspace directories.
 * Project settings override user settings.
 */
export declare function loadSettings(workspaceDir?: string): LoadedSettings;
export declare function migrateDeprecatedSettings(
  loadedSettings: LoadedSettings,
  workspaceDir?: string,
): void;
export declare function saveSettings(settingsFile: SettingsFile): void;
