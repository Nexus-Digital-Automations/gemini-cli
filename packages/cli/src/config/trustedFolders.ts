/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { homedir } from 'node:os';
import {
  FatalConfigError,
  getErrorMessage,
  isWithinRoot,
  ideContextStore,
} from '@google/gemini-cli-core';
import type { Settings } from './settings.js';
import stripJsonComments from 'strip-json-comments';

/** Filename for the trusted folders configuration file */
export const TRUSTED_FOLDERS_FILENAME = 'trustedFolders.json';
/** Directory name for Gemini CLI configuration files */
export const SETTINGS_DIRECTORY_NAME = '.gemini';
/** Directory path for user-specific Gemini CLI settings */
export const USER_SETTINGS_DIR = path.join(homedir(), SETTINGS_DIRECTORY_NAME);

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
export function getTrustedFoldersPath(): string {
  if (process.env['GEMINI_CLI_TRUSTED_FOLDERS_PATH']) {
    return process.env['GEMINI_CLI_TRUSTED_FOLDERS_PATH'];
  }
  return path.join(USER_SETTINGS_DIR, TRUSTED_FOLDERS_FILENAME);
}

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
export enum TrustLevel {
  /** Trust the exact folder path specified */
  TRUST_FOLDER = 'TRUST_FOLDER',
  /** Trust the parent directory of the specified path */
  TRUST_PARENT = 'TRUST_PARENT',
  /** Explicitly mark the folder as untrusted */
  DO_NOT_TRUST = 'DO_NOT_TRUST',
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
export class LoadedTrustedFolders {
  constructor(
    readonly user: TrustedFoldersFile,
    readonly errors: TrustedFoldersError[],
  ) {}

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
  get rules(): TrustRule[] {
    return Object.entries(this.user.config).map(([path, trustLevel]) => ({
      path,
      trustLevel,
    }));
  }

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
  isPathTrusted(location: string): boolean | undefined {
    const trustedPaths: string[] = [];
    const untrustedPaths: string[] = [];

    for (const rule of this.rules) {
      switch (rule.trustLevel) {
        case TrustLevel.TRUST_FOLDER:
          trustedPaths.push(rule.path);
          break;
        case TrustLevel.TRUST_PARENT:
          trustedPaths.push(path.dirname(rule.path));
          break;
        case TrustLevel.DO_NOT_TRUST:
          untrustedPaths.push(rule.path);
          break;
        default:
          // Do nothing for unknown trust levels.
          break;
      }
    }

    for (const trustedPath of trustedPaths) {
      if (isWithinRoot(location, trustedPath)) {
        return true;
      }
    }

    for (const untrustedPath of untrustedPaths) {
      if (path.normalize(location) === path.normalize(untrustedPath)) {
        return false;
      }
    }

    return undefined;
  }

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
  setValue(path: string, trustLevel: TrustLevel): void {
    this.user.config[path] = trustLevel;
    saveTrustedFolders(this.user);
  }
}

let loadedTrustedFolders: LoadedTrustedFolders | undefined;

/**
 * FOR TESTING PURPOSES ONLY.
 * Resets the in-memory cache of the trusted folders configuration.
 * This forces the next call to loadTrustedFolders() to reload from disk.
 *
 * @internal
 */
export function resetTrustedFoldersForTesting(): void {
  loadedTrustedFolders = undefined;
}

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
export function loadTrustedFolders(): LoadedTrustedFolders {
  if (loadedTrustedFolders) {
    return loadedTrustedFolders;
  }

  const errors: TrustedFoldersError[] = [];
  let userConfig: Record<string, TrustLevel> = {};

  const userPath = getTrustedFoldersPath();

  // Load user trusted folders
  try {
    if (fs.existsSync(userPath)) {
      const content = fs.readFileSync(userPath, 'utf-8');
      const parsed: unknown = JSON.parse(stripJsonComments(content));

      if (
        typeof parsed !== 'object' ||
        parsed === null ||
        Array.isArray(parsed)
      ) {
        errors.push({
          message: 'Trusted folders file is not a valid JSON object.',
          path: userPath,
        });
      } else {
        userConfig = parsed as Record<string, TrustLevel>;
      }
    }
  } catch (error: unknown) {
    errors.push({
      message: getErrorMessage(error),
      path: userPath,
    });
  }

  loadedTrustedFolders = new LoadedTrustedFolders(
    { path: userPath, config: userConfig },
    errors,
  );
  return loadedTrustedFolders;
}

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
export function saveTrustedFolders(
  trustedFoldersFile: TrustedFoldersFile,
): void {
  try {
    // Ensure the directory exists
    const dirPath = path.dirname(trustedFoldersFile.path);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    fs.writeFileSync(
      trustedFoldersFile.path,
      JSON.stringify(trustedFoldersFile.config, null, 2),
      { encoding: 'utf-8', mode: 0o600 },
    );
  } catch (error) {
    console.error('Error saving trusted folders file:', error);
  }
}

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
export function isFolderTrustEnabled(settings: Settings): boolean {
  const folderTrustSetting = settings.security?.folderTrust?.enabled ?? false;
  return folderTrustSetting;
}

/**
 * Evaluates workspace trust using local configuration file.
 * Checks the current working directory against trust rules in the trusted folders configuration.
 *
 * @param trustConfig - Optional override for trust configuration (used for testing)
 * @returns Trust result indicating if workspace is trusted and the source of that decision
 * @throws FatalConfigError if the trusted folders configuration file has errors
 *
 * @example
 * ```typescript
 * try {
 *   const trustResult = getWorkspaceTrustFromLocalConfig();
 *   if (trustResult.isTrusted) {
 *     console.log('Workspace is trusted via local configuration');
 *   }
 * } catch (error) {
 *   console.error('Trust configuration error:', error.message);
 * }
 * ```
 */
function getWorkspaceTrustFromLocalConfig(
  trustConfig?: Record<string, TrustLevel>,
): TrustResult {
  const folders = loadTrustedFolders();

  if (trustConfig) {
    folders.user.config = trustConfig;
  }

  if (folders.errors.length > 0) {
    const errorMessages = folders.errors.map(
      (error) => `Error in ${error.path}: ${error.message}`,
    );
    throw new FatalConfigError(
      `${errorMessages.join('\n')}\nPlease fix the configuration file and try again.`,
    );
  }

  const isTrusted = folders.isPathTrusted(process.cwd());
  return {
    isTrusted,
    source: isTrusted !== undefined ? 'file' : undefined,
  };
}

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
export function isWorkspaceTrusted(
  settings: Settings,
  trustConfig?: Record<string, TrustLevel>,
): TrustResult {
  if (!isFolderTrustEnabled(settings)) {
    return { isTrusted: true, source: undefined };
  }

  const ideTrust = ideContextStore.get()?.workspaceState?.isTrusted;
  if (ideTrust !== undefined) {
    return { isTrusted: ideTrust, source: 'ide' };
  }

  // Fall back to the local user configuration
  return getWorkspaceTrustFromLocalConfig(trustConfig);
}
