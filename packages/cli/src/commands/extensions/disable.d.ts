/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { type CommandModule } from 'yargs';
/**
 * Arguments interface for the disable extension command
 */
interface DisableArgs {
    /** The name of the extension to disable */
    name: string;
    /** The scope to disable the extension in (user or workspace) */
    scope?: string;
}
/**
 * Handles the disable extension command execution
 * @param args - The command arguments containing extension name and optional scope
 *
 * @example
 * ```typescript
 * handleDisable({ name: 'my-extension', scope: 'workspace' });
 * // Disables 'my-extension' for workspace scope
 *
 * handleDisable({ name: 'my-extension' });
 * // Disables 'my-extension' for user scope (default)
 * ```
 */
export declare function handleDisable(args: DisableArgs): void;
/**
 * Yargs command module for disabling extensions
 *
 * This command allows users to disable extensions either for their user scope
 * or workspace scope. Disabling extensions removes their functionality and tools
 * from the Gemini CLI environment.
 */
export declare const disableCommand: CommandModule;
export {};
