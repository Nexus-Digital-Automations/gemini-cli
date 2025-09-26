/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { CommandModule } from 'yargs';
/**
 * Arguments interface for the install extension command
 */
interface InstallArgs {
    /** Git URL of the extension to install */
    source?: string;
    /** Local file system path to the extension directory */
    path?: string;
    /** Git reference (branch, tag, commit) to install from */
    ref?: string;
    /** Whether to enable auto-update for this extension */
    autoUpdate?: boolean;
}
/**
 * Handles the install extension command execution
 * @param args - The command arguments containing source/path and installation options
 *
 * @example
 * ```typescript
 * // Install from git repository
 * await handleInstall({
 *   source: 'https://github.com/user/extension.git',
 *   ref: 'v1.0.0',
 *   autoUpdate: true
 * });
 *
 * // Install from local path
 * await handleInstall({ path: '/path/to/local/extension' });
 * ```
 */
export declare function handleInstall(args: InstallArgs): Promise<void>;
/**
 * Yargs command module for installing extensions
 *
 * This command supports installation from both remote git repositories and local
 * file system paths. It provides options for specifying git references and
 * enabling auto-updates for remote installations.
 */
export declare const installCommand: CommandModule;
export {};
