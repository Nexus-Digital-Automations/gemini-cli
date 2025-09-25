/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { type CommandModule } from 'yargs';
/**
 * Arguments interface for the enable extension command
 */
interface EnableArgs {
    /** The name of the extension to enable */
    name: string;
    /** The scope to enable the extension in (user or workspace) */
    scope?: string;
}
/**
 * Handles the enable extension command execution
 * @param args - The command arguments containing extension name and optional scope
 * @throws {FatalConfigError} When extension enabling fails or configuration is invalid
 *
 * @example
 * ```typescript
 * handleEnable({ name: 'my-extension', scope: 'workspace' });
 * // Enables 'my-extension' for workspace scope
 *
 * handleEnable({ name: 'my-extension' });
 * // Enables 'my-extension' for user scope (default)
 * ```
 */
export declare function handleEnable(args: EnableArgs): void;
/**
 * Yargs command module for enabling extensions
 *
 * This command allows users to enable extensions either for their user scope
 * or workspace scope. Extensions enable additional functionality and tools
 * within the Gemini CLI environment.
 */
export declare const enableCommand: CommandModule;
export {};
