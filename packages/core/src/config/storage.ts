/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as path from 'node:path';
import * as os from 'node:os';
import * as crypto from 'node:crypto';
import * as fs from 'node:fs';

/** Directory name for Gemini CLI configuration and data storage */
export const GEMINI_DIR = '.gemini';
/** Filename for Google accounts configuration */
export const GOOGLE_ACCOUNTS_FILENAME = 'google_accounts.json';
/** Filename for OAuth credentials storage */
export const OAUTH_FILE = 'oauth_creds.json';
/** Directory name for temporary files */
const TMP_DIR_NAME = 'tmp';
/** Directory name for binary/executable storage */
const BIN_DIR_NAME = 'bin';

/**
 * Storage management class for Gemini CLI file system operations.
 * Provides centralized path management for configuration files, temporary storage,
 * and project-specific data with support for both global and workspace-specific storage.
 *
 * Path Management:
 * - Global paths: User-wide configuration stored in ~/.gemini/
 * - Workspace paths: Project-specific configuration in workspace/.gemini/
 * - Temporary paths: Hashed project directories for isolation
 *
 * @example
 * ```typescript
 * const storage = new Storage('/workspace/project');
 *
 * // Get workspace-specific paths
 * const workspaceSettings = storage.getWorkspaceSettingsPath();
 * const projectTemp = storage.getProjectTempDir();
 *
 * // Get global paths
 * const globalSettings = Storage.getGlobalSettingsPath();
 * const globalMemory = Storage.getGlobalMemoryFilePath();
 * ```
 */
export class Storage {
  private readonly targetDir: string;

  /**
   * Creates a new Storage instance for the specified target directory.
   *
   * @param targetDir - Absolute path to the workspace/project directory
   */
  constructor(targetDir: string) {
    this.targetDir = targetDir;
  }

  /**
   * Returns the global Gemini CLI configuration directory path.
   * Uses the user's home directory, falling back to system temp if unavailable.
   *
   * @returns Absolute path to global .gemini directory
   *
   * @example
   * ```typescript
   * const globalDir = Storage.getGlobalGeminiDir();
   * // Returns: /Users/username/.gemini (on macOS)
   * ```
   */
  static getGlobalGeminiDir(): string {
    const homeDir = os.homedir();
    if (!homeDir) {
      return path.join(os.tmpdir(), '.gemini');
    }
    return path.join(homeDir, GEMINI_DIR);
  }

  /**
   * Returns the path for MCP OAuth tokens storage.
   *
   * @returns Absolute path to MCP OAuth tokens file
   */
  static getMcpOAuthTokensPath(): string {
    return path.join(Storage.getGlobalGeminiDir(), 'mcp-oauth-tokens.json');
  }

  /**
   * Returns the path for global user settings.
   *
   * @returns Absolute path to global settings file
   */
  static getGlobalSettingsPath(): string {
    return path.join(Storage.getGlobalGeminiDir(), 'settings.json');
  }

  /**
   * Returns the path for the unique installation identifier file.
   *
   * @returns Absolute path to installation ID file
   */
  static getInstallationIdPath(): string {
    return path.join(Storage.getGlobalGeminiDir(), 'installation_id');
  }

  /**
   * Returns the path for Google accounts configuration.
   *
   * @returns Absolute path to Google accounts file
   */
  static getGoogleAccountsPath(): string {
    return path.join(Storage.getGlobalGeminiDir(), GOOGLE_ACCOUNTS_FILENAME);
  }

  /**
   * Returns the directory path for user-defined commands.
   *
   * @returns Absolute path to user commands directory
   */
  static getUserCommandsDir(): string {
    return path.join(Storage.getGlobalGeminiDir(), 'commands');
  }

  /**
   * Returns the path for the global memory/context file.
   *
   * @returns Absolute path to global memory file
   */
  static getGlobalMemoryFilePath(): string {
    return path.join(Storage.getGlobalGeminiDir(), 'memory.md');
  }

  /**
   * Returns the global temporary directory for Gemini CLI operations.
   *
   * @returns Absolute path to global temp directory
   */
  static getGlobalTempDir(): string {
    return path.join(Storage.getGlobalGeminiDir(), TMP_DIR_NAME);
  }

  /**
   * Returns the global binary/executable directory.
   *
   * @returns Absolute path to global bin directory
   */
  static getGlobalBinDir(): string {
    return path.join(Storage.getGlobalTempDir(), BIN_DIR_NAME);
  }

  /**
   * Returns the workspace-specific Gemini configuration directory.
   *
   * @returns Absolute path to workspace .gemini directory
   */
  getGeminiDir(): string {
    return path.join(this.targetDir, GEMINI_DIR);
  }

  /**
   * Returns a project-specific temporary directory using a hash of the project path.
   * This provides isolation between different projects.
   *
   * @returns Absolute path to project-specific temp directory
   */
  getProjectTempDir(): string {
    const hash = this.getFilePathHash(this.getProjectRoot());
    const tempDir = Storage.getGlobalTempDir();
    return path.join(tempDir, hash);
  }

  /**
   * Creates the project-specific temporary directory if it doesn't exist.
   * Uses recursive creation to ensure all parent directories are created.
   */
  ensureProjectTempDirExists(): void {
    fs.mkdirSync(this.getProjectTempDir(), { recursive: true });
  }

  /**
   * Returns the path for OAuth credentials storage.
   *
   * @returns Absolute path to OAuth credentials file
   */
  static getOAuthCredsPath(): string {
    return path.join(Storage.getGlobalGeminiDir(), OAUTH_FILE);
  }

  /**
   * Returns the project root directory (same as target directory).
   *
   * @returns Absolute path to project root
   */
  getProjectRoot(): string {
    return this.targetDir;
  }

  /**
   * Generates a SHA-256 hash of a file path for unique directory naming.
   * Used to create isolated temporary directories for different projects.
   *
   * @param filePath - Path to hash
   * @returns Hexadecimal hash string
   */
  private getFilePathHash(filePath: string): string {
    return crypto.createHash('sha256').update(filePath).digest('hex');
  }

  /**
   * Returns the project-specific history directory using a hash of the project path.
   *
   * @returns Absolute path to project-specific history directory
   */
  getHistoryDir(): string {
    const hash = this.getFilePathHash(this.getProjectRoot());
    const historyDir = path.join(Storage.getGlobalGeminiDir(), 'history');
    return path.join(historyDir, hash);
  }

  /**
   * Returns the path for workspace-specific settings.
   *
   * @returns Absolute path to workspace settings file
   */
  getWorkspaceSettingsPath(): string {
    return path.join(this.getGeminiDir(), 'settings.json');
  }

  /**
   * Returns the directory path for project-specific commands.
   *
   * @returns Absolute path to project commands directory
   */
  getProjectCommandsDir(): string {
    return path.join(this.getGeminiDir(), 'commands');
  }

  /**
   * Returns the directory path for project-specific session checkpoints.
   *
   * @returns Absolute path to project checkpoints directory
   */
  getProjectTempCheckpointsDir(): string {
    return path.join(this.getProjectTempDir(), 'checkpoints');
  }

  /**
   * Returns the directory path for workspace-specific extensions.
   *
   * @returns Absolute path to workspace extensions directory
   */
  getExtensionsDir(): string {
    return path.join(this.getGeminiDir(), 'extensions');
  }

  /**
   * Returns the path for workspace extensions configuration.
   *
   * @returns Absolute path to extensions config file
   */
  getExtensionsConfigPath(): string {
    return path.join(this.getExtensionsDir(), 'gemini-extension.json');
  }

  /**
   * Returns the path for project-specific shell history storage.
   *
   * @returns Absolute path to shell history file
   */
  getHistoryFilePath(): string {
    return path.join(this.getProjectTempDir(), 'shell_history');
  }
}
