/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { CommandModule } from 'yargs';
/**
 * Arguments interface for the link extension command
 */
interface InstallArgs {
    /** Local file system path to the extension directory */
    path: string;
}
/**
 * Handles the link extension command execution
 *
 * Creates a symbolic link to a local extension directory, allowing changes
 * to be reflected immediately without reinstallation.
 *
 * @param args - The command arguments containing the path to link
 *
 * @example
 * ```typescript
 * await handleLink({ path: '/path/to/extension/directory' });
 * // Links extension and enables it immediately
 * ```
 */
export declare function handleLink(args: InstallArgs): Promise<void>;
/**
 * Yargs command module for linking extensions
 *
 * This command creates a symbolic link to a local extension directory,
 * enabling development mode where changes to the extension are reflected
 * immediately without reinstallation.
 */
export declare const linkCommand: CommandModule;
export {};
