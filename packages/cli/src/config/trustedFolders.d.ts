/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Settings } from './settings.js';
/** Filename for the trusted folders configuration file */
export declare const TRUSTED_FOLDERS_FILENAME = "trustedFolders.json";
/** Directory name for Gemini CLI configuration files */
export declare const SETTINGS_DIRECTORY_NAME = ".gemini";
/** Directory path for user-specific Gemini CLI settings */
export declare const USER_SETTINGS_DIR: string;
/**
 * Returns the absolute path to the trusted folders configuration file.
 * Can be overridden via the GEMINI_CLI_TRUSTED_FOLDERS_PATH environment variable.
 *
 * @returns Absolute path to the trusted folders configuration file
 *
 * @example
 * ```typescript
 * const trustedFoldersPath = getTrustedFoldersPath();
 * // Returns: /Users/username/.gemini/trustedFolders.json (on macOS)
 * ```
 */
export declare function getTrustedFoldersPath(): string;
/**
 * Trust levels that can be assigned to folders for security control.
 * Determines how the application handles workspace operations and file access.
 *
 * @example
 * ```typescript
 * // Trust a specific project folder
 * const rule: TrustRule = {
 *   path: '/Users/me/projects/safe-project',
 *   trustLevel: TrustLevel.TRUST_FOLDER
 * };
 * ```
 */
export declare enum TrustLevel {
    /** Trust the exact folder path specified */
    TRUST_FOLDER = "TRUST_FOLDER",
    /** Trust the parent directory of the specified path */
    TRUST_PARENT = "TRUST_PARENT",
    /** Explicitly mark the folder as untrusted */
    DO_NOT_TRUST = "DO_NOT_TRUST"
}
/**
 * A trust rule associating a file system path with a trust level.
 * Used to define folder trust policies for workspace security.
 *
 * @example
 * ```typescript
 * const trustRule: TrustRule = {
 *   path: '/Users/me/work/projects',
 *   trustLevel: TrustLevel.TRUST_FOLDER
 * };
 * ```
 */
export interface TrustRule {
    /** Absolute path to the folder this rule applies to */
    path: string;
    /** Trust level to apply to this folder */
    trustLevel: TrustLevel;
}
/**
 * Error information for trusted folders configuration file issues.
 * Provides detailed feedback about configuration parsing problems.
 */
export interface TrustedFoldersError {
    /** Descriptive error message explaining the problem */
    message: string;
    /** File path where the error occurred */
    path: string;
}
/**
 * Represents a loaded trusted folders configuration file.
 * Contains the trust rules mapping folder paths to trust levels.
 *
 * @example
 * ```typescript
 * const trustedFolders: TrustedFoldersFile = {
 *   config: {
 *     '/Users/me/work': TrustLevel.TRUST_FOLDER,
 *     '/Users/me/temp': TrustLevel.DO_NOT_TRUST
 *   },
 *   path: '/Users/me/.gemini/trustedFolders.json'
 * };
 * ```
 */
export interface TrustedFoldersFile {
    /** Mapping of folder paths to their assigned trust levels */
    config: Record<string, TrustLevel>;
    /** Absolute path to the configuration file */
    path: string;
}
/**
 * Result of a workspace trust evaluation indicating trust status and source.
 * Provides information about whether a workspace is trusted and how that determination was made.
 *
 * @example
 * ```typescript
 * const trustResult = isWorkspaceTrusted(settings);
 * if (trustResult.isTrusted) {
 *   console.log(`Workspace is trusted (source: ${trustResult.source})`);
 * }
 * ```
 */
export interface TrustResult {
    /** Whether the workspace is trusted (true), untrusted (false), or unknown (undefined) */
    isTrusted: boolean | undefined;
    /** Source of the trust decision: 'ide' for IDE integration, 'file' for local config */
    source: 'ide' | 'file' | undefined;
}
/**
 * Manages loaded trusted folders configuration with trust evaluation capabilities.
 * Provides methods to check folder trust status and modify trust rules.
 *
 * @example
 * ```typescript
 * const trustedFolders = loadTrustedFolders();
 *
 * // Check if a path is trusted
 * const isTrusted = trustedFolders.isPathTrusted('/workspace/project');
 *
 * // Add a new trust rule
 * trustedFolders.setValue('/new/project', TrustLevel.TRUST_FOLDER);
 * ```
 */
export declare class LoadedTrustedFolders {
    readonly user: TrustedFoldersFile;
    readonly errors: TrustedFoldersError[];
    constructor(user: TrustedFoldersFile, errors: TrustedFoldersError[]);
    /**
     * Returns all trust rules as an array of TrustRule objects.
     * Converts the internal key-value configuration to a more structured format.
     *
     * @returns Array of trust rules with path and trust level
     *
     * @example
     * ```typescript
     * const rules = trustedFolders.rules;
     * rules.forEach(rule => {
     *   console.log(`${rule.path}: ${rule.trustLevel}`);
     * });
     * ```
     */
    get rules(): TrustRule[];
    /**
     * Evaluates whether a given path should be trusted based on configured trust rules.
     * Should only be called when the folder trust feature is active.
     *
     * Trust Evaluation Logic:
     * 1. TRUST_FOLDER: Trusts the exact path and any subdirectories
     * 2. TRUST_PARENT: Trusts the parent directory and any subdirectories
     * 3. DO_NOT_TRUST: Explicitly marks the exact path as untrusted
     * 4. If no rules match, returns undefined (unknown trust status)
     *
     * @param location - Absolute path to evaluate for trust status
     * @returns true if trusted, false if explicitly untrusted, undefined if no rule applies
     *
     * @example
     * ```typescript
     * const isProjectTrusted = trustedFolders.isPathTrusted('/workspace/my-project');
     * if (isProjectTrusted === true) {
     *   // Enable full functionality
     * } else if (isProjectTrusted === false) {
     *   // Restrict operations
     * } else {
     *   // Prompt user for trust decision
     * }
     * ```
     */
    isPathTrusted(location: string): boolean | undefined;
    /**
     * Sets the trust level for a specific path and persists the change to disk.
     * Updates the trust configuration and immediately saves to the trusted folders file.
     *
     * @param path - Absolute path to set trust level for
     * @param trustLevel - Trust level to assign to the path
     *
     * @example
     * ```typescript
     * // Trust a new project folder
     * trustedFolders.setValue('/workspace/new-project', TrustLevel.TRUST_FOLDER);
     *
     * // Mark a folder as untrusted
     * trustedFolders.setValue('/unsafe/folder', TrustLevel.DO_NOT_TRUST);
     * ```
     */
    setValue(path: string, trustLevel: TrustLevel): void;
}
/**
 * FOR TESTING PURPOSES ONLY.
 * Resets the in-memory cache of the trusted folders configuration.
 * This forces the next call to loadTrustedFolders() to reload from disk.
 *
 * @internal
 */
export declare function resetTrustedFoldersForTesting(): void;
/**
 * Loads and caches the trusted folders configuration from disk.
 * Uses a singleton pattern to avoid repeated file system access.
 * Handles JSON parsing errors gracefully and provides error information.
 *
 * File Format:
 * The trusted folders file should be a JSON object mapping paths to trust levels:
 * ```json
 * {
 *   "/Users/me/work/projects": "TRUST_FOLDER",
 *   "/tmp/unsafe": "DO_NOT_TRUST"
 * }
 * ```
 *
 * @returns Loaded trusted folders configuration with any parsing errors
 *
 * @example
 * ```typescript
 * const trustedFolders = loadTrustedFolders();
 * if (trustedFolders.errors.length > 0) {
 *   console.error('Configuration errors:', trustedFolders.errors);
 * }
 * ```
 */
export declare function loadTrustedFolders(): LoadedTrustedFolders;
/**
 * Saves the trusted folders configuration to disk with secure file permissions.
 * Creates the parent directory if it doesn't exist and sets restrictive file permissions
 * (0o600) to protect the trust configuration from unauthorized access.
 *
 * @param trustedFoldersFile - The trusted folders configuration to save
 *
 * @example
 * ```typescript
 * const trustedFolders = loadTrustedFolders();
 * trustedFolders.user.config['/new/project'] = TrustLevel.TRUST_FOLDER;
 * saveTrustedFolders(trustedFolders.user);
 * ```
 */
export declare function saveTrustedFolders(trustedFoldersFile: TrustedFoldersFile): void;
/**
 * Determines if the folder trust feature is enabled based on current settings.
 * The folder trust feature provides workspace-level security by requiring
 * explicit trust before loading project-specific configuration and environment variables.
 *
 * @param settings - Current application settings
 * @returns true if folder trust feature is enabled, false otherwise
 *
 * @example
 * ```typescript
 * const settings = loadSettings().merged;
 * if (isFolderTrustEnabled(settings)) {
 *   // Check workspace trust before loading sensitive configuration
 *   const trustResult = isWorkspaceTrusted(settings);
 * }
 * ```
 */
export declare function isFolderTrustEnabled(settings: Settings): boolean;
/**
 * Determines if the current workspace is trusted based on settings and trust sources.
 * Implements a hierarchical trust evaluation system with multiple sources.
 *
 * Trust Evaluation Order:
 * 1. If folder trust feature is disabled, workspace is always trusted
 * 2. IDE integration trust status (highest priority if available)
 * 3. Local trusted folders configuration (fallback)
 *
 * @param settings - Current application settings
 * @param trustConfig - Optional override for trust configuration (used for testing)
 * @returns Trust result indicating trust status and source
 *
 * @example
 * ```typescript
 * const settings = loadSettings().merged;
 * const trustResult = isWorkspaceTrusted(settings);
 *
 * switch (trustResult.source) {
 *   case 'ide':
 *     console.log('Trust decision from IDE integration');
 *     break;
 *   case 'file':
 *     console.log('Trust decision from local configuration');
 *     break;
 *   default:
 *     console.log('Folder trust feature is disabled');
 * }
 * ```
 */
export declare function isWorkspaceTrusted(settings: Settings, trustConfig?: Record<string, TrustLevel>): TrustResult;
