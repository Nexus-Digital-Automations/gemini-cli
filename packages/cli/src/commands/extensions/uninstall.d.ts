/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { CommandModule } from 'yargs';
/**
 * Arguments interface for the uninstall extension command
 */
interface UninstallArgs {
  /** The name or source URL of the extension to uninstall */
  name: string;
}
/**
 * Handles the uninstall extension command execution
 * @param args - The command arguments containing extension name or source URL
 *
 * @example
 * ```typescript
 * // Uninstall by extension name
 * await handleUninstall({ name: 'my-extension' });
 *
 * // Uninstall by source URL
 * await handleUninstall({ name: 'https://github.com/user/extension.git' });
 * ```
 */
export declare function handleUninstall(args: UninstallArgs): Promise<void>;
/**
 * Yargs command module for uninstalling extensions
 *
 * This command removes extensions from the system and cleans up associated
 * configuration. Extensions can be identified either by name or source URL.
 */
export declare const uninstallCommand: CommandModule;
export {};
