/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { CommandModule } from 'yargs';
/**
 * Arguments interface for the update extension command
 */
interface UpdateArgs {
  /** The name of a specific extension to update */
  name?: string;
  /** Whether to update all extensions */
  all?: boolean;
}
/**
 * Handles the update extension command execution
 * @param args - The command arguments containing extension name or all flag
 *
 * @example
 * ```typescript
 * // Update specific extension
 * await handleUpdate({ name: 'my-extension' });
 *
 * // Update all extensions
 * await handleUpdate({ all: true });
 * ```
 */
export declare function handleUpdate(args: UpdateArgs): Promise<void>;
/**
 * Yargs command module for updating extensions
 *
 * This command supports updating either a specific extension by name or all
 * installed extensions at once. It checks for available updates and applies
 * them automatically.
 */
export declare const updateCommand: CommandModule;
export {};
