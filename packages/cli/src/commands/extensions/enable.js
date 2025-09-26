/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import {} from 'yargs';
import { FatalConfigError, getErrorMessage } from '@google/gemini-cli-core';
import { enableExtension } from '../../config/extension.js';
import { SettingScope } from '../../config/settings.js';
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
export function handleEnable(args) {
    try {
        if (args.scope?.toLowerCase() === 'workspace') {
            enableExtension(args.name, SettingScope.Workspace);
        }
        else {
            enableExtension(args.name, SettingScope.User);
        }
        if (args.scope) {
            console.log(`Extension "${args.name}" successfully enabled for scope "${args.scope}".`);
        }
        else {
            console.log(`Extension "${args.name}" successfully enabled in all scopes.`);
        }
    }
    catch (error) {
        throw new FatalConfigError(getErrorMessage(error));
    }
}
/**
 * Yargs command module for enabling extensions
 *
 * This command allows users to enable extensions either for their user scope
 * or workspace scope. Extensions enable additional functionality and tools
 * within the Gemini CLI environment.
 */
export const enableCommand = {
    command: 'enable [--scope] <name>',
    describe: 'Enables an extension.',
    builder: (yargs) => yargs
        .positional('name', {
        describe: 'The name of the extension to enable.',
        type: 'string',
    })
        .option('scope', {
        describe: 'The scope to enable the extenison in. If not set, will be enabled in all scopes.',
        type: 'string',
    })
        .check((argv) => {
        if (argv.scope &&
            !Object.values(SettingScope)
                .map((s) => s.toLowerCase())
                .includes(argv.scope.toLowerCase())) {
            throw new Error(`Invalid scope: ${argv.scope}. Please use one of ${Object.values(SettingScope)
                .map((s) => s.toLowerCase())
                .join(', ')}.`);
        }
        return true;
    }),
    handler: (argv) => {
        handleEnable({
            name: argv['name'],
            scope: argv['scope'],
        });
    },
};
//# sourceMappingURL=enable.js.map