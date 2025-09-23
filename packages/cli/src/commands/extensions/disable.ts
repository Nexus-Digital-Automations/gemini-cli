/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { type CommandModule } from 'yargs';
import { disableExtension } from '../../config/extension.js';
import { SettingScope } from '../../config/settings.js';
import { getErrorMessage } from '../../utils/errors.js';

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
export function handleDisable(args: DisableArgs) {
  try {
    if (args.scope?.toLowerCase() === 'workspace') {
      disableExtension(args.name, SettingScope.Workspace);
    } else {
      disableExtension(args.name, SettingScope.User);
    }
    console.log(
      `Extension "${args.name}" successfully disabled for scope "${args.scope}".`,
    );
  } catch (error) {
    console.error(getErrorMessage(error));
    process.exit(1);
  }
}

/**
 * Yargs command module for disabling extensions
 *
 * This command allows users to disable extensions either for their user scope
 * or workspace scope. Disabling extensions removes their functionality and tools
 * from the Gemini CLI environment.
 */
export const disableCommand: CommandModule = {
  command: 'disable [--scope] <name>',
  describe: 'Disables an extension.',
  builder: (yargs) =>
    yargs
      .positional('name', {
        describe: 'The name of the extension to disable.',
        type: 'string',
      })
      .option('scope', {
        describe: 'The scope to disable the extenison in.',
        type: 'string',
        default: SettingScope.User,
      })
      .check((argv) => {
        if (
          argv.scope &&
          !Object.values(SettingScope)
            .map((s) => s.toLowerCase())
            .includes((argv.scope as string).toLowerCase())
        ) {
          throw new Error(
            `Invalid scope: ${argv.scope}. Please use one of ${Object.values(
              SettingScope,
            )
              .map((s) => s.toLowerCase())
              .join(', ')}.`,
          );
        }
        return true;
      }),
  handler: (argv) => {
    handleDisable({
      name: argv['name'] as string,
      scope: argv['scope'] as string,
    });
  },
};
