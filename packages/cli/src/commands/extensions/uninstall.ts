/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { CommandModule } from 'yargs';
import { uninstallExtension } from '../../config/extension.js';
import { getErrorMessage } from '../../utils/errors.js';

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
export async function handleUninstall(args: UninstallArgs) {
  try {
    await uninstallExtension(args.name);
    console.log(`Extension "${args.name}" successfully uninstalled.`);
  } catch (error) {
    console.error(getErrorMessage(error));
    process.exit(1);
  }
}

/**
 * Yargs command module for uninstalling extensions
 *
 * This command removes extensions from the system and cleans up associated
 * configuration. Extensions can be identified either by name or source URL.
 */
export const uninstallCommand: CommandModule = {
  command: 'uninstall <name>',
  describe: 'Uninstalls an extension.',
  builder: (yargs) =>
    yargs
      .positional('name', {
        describe: 'The name or source path of the extension to uninstall.',
        type: 'string',
      })
      .check((argv) => {
        if (!argv.name) {
          throw new Error(
            'Please include the name of the extension to uninstall as a positional argument.',
          );
        }
        return true;
      }),
  handler: async (argv) => {
    await handleUninstall({
      name: argv['name'] as string,
    });
  },
};
