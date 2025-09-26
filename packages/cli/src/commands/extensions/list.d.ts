/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { CommandModule } from 'yargs';
/**
 * Handles the list extensions command execution
 *
 * Lists all installed extensions with their metadata including name, source,
 * version, status, and other relevant information.
 *
 * @example
 * ```typescript
 * await handleList();
 * // Outputs information about all installed extensions
 * ```
 */
export declare function handleList(): Promise<void>;
/**
 * Yargs command module for listing installed extensions
 *
 * This command displays all currently installed extensions with their
 * metadata such as name, source, enabled status, and installation details.
 */
export declare const listCommand: CommandModule;
