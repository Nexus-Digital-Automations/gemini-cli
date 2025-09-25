/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/** Directory name for Gemini CLI configuration and data storage */
export declare const GEMINI_DIR = ".gemini";
/** Filename for Google accounts configuration */
export declare const GOOGLE_ACCOUNTS_FILENAME = "google_accounts.json";
/** Filename for OAuth credentials storage */
export declare const OAUTH_FILE = "oauth_creds.json";
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
export declare class Storage {
    private readonly targetDir;
    /**
     * Creates a new Storage instance for the specified target directory.
     *
     * @param targetDir - Absolute path to the workspace/project directory
     */
    constructor(targetDir: string);
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
    static getGlobalGeminiDir(): string;
    /**
     * Returns the path for MCP OAuth tokens storage.
     *
     * @returns Absolute path to MCP OAuth tokens file
     */
    static getMcpOAuthTokensPath(): string;
    /**
     * Returns the path for global user settings.
     *
     * @returns Absolute path to global settings file
     */
    static getGlobalSettingsPath(): string;
    /**
     * Returns the path for the unique installation identifier file.
     *
     * @returns Absolute path to installation ID file
     */
    static getInstallationIdPath(): string;
    /**
     * Returns the path for Google accounts configuration.
     *
     * @returns Absolute path to Google accounts file
     */
    static getGoogleAccountsPath(): string;
    /**
     * Returns the directory path for user-defined commands.
     *
     * @returns Absolute path to user commands directory
     */
    static getUserCommandsDir(): string;
    /**
     * Returns the path for the global memory/context file.
     *
     * @returns Absolute path to global memory file
     */
    static getGlobalMemoryFilePath(): string;
    /**
     * Returns the global temporary directory for Gemini CLI operations.
     *
     * @returns Absolute path to global temp directory
     */
    static getGlobalTempDir(): string;
    /**
     * Returns the global binary/executable directory.
     *
     * @returns Absolute path to global bin directory
     */
    static getGlobalBinDir(): string;
    /**
     * Returns the workspace-specific Gemini configuration directory.
     *
     * @returns Absolute path to workspace .gemini directory
     */
    getGeminiDir(): string;
    /**
     * Returns a project-specific temporary directory using a hash of the project path.
     * This provides isolation between different projects.
     *
     * @returns Absolute path to project-specific temp directory
     */
    getProjectTempDir(): string;
    /**
     * Creates the project-specific temporary directory if it doesn't exist.
     * Uses recursive creation to ensure all parent directories are created.
     */
    ensureProjectTempDirExists(): void;
    /**
     * Returns the path for OAuth credentials storage.
     *
     * @returns Absolute path to OAuth credentials file
     */
    static getOAuthCredsPath(): string;
    /**
     * Returns the project root directory (same as target directory).
     *
     * @returns Absolute path to project root
     */
    getProjectRoot(): string;
    /**
     * Generates a SHA-256 hash of a file path for unique directory naming.
     * Used to create isolated temporary directories for different projects.
     *
     * @param filePath - Path to hash
     * @returns Hexadecimal hash string
     */
    private getFilePathHash;
    /**
     * Returns the project-specific history directory using a hash of the project path.
     *
     * @returns Absolute path to project-specific history directory
     */
    getHistoryDir(): string;
    /**
     * Returns the path for workspace-specific settings.
     *
     * @returns Absolute path to workspace settings file
     */
    getWorkspaceSettingsPath(): string;
    /**
     * Returns the directory path for project-specific commands.
     *
     * @returns Absolute path to project commands directory
     */
    getProjectCommandsDir(): string;
    /**
     * Returns the directory path for project-specific session checkpoints.
     *
     * @returns Absolute path to project checkpoints directory
     */
    getProjectTempCheckpointsDir(): string;
    /**
     * Returns the directory path for workspace-specific extensions.
     *
     * @returns Absolute path to workspace extensions directory
     */
    getExtensionsDir(): string;
    /**
     * Returns the path for workspace extensions configuration.
     *
     * @returns Absolute path to extensions config file
     */
    getExtensionsConfigPath(): string;
    /**
     * Returns the path for project-specific shell history storage.
     *
     * @returns Absolute path to shell history file
     */
    getHistoryFilePath(): string;
}
