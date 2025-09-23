/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { CommandModule } from 'yargs';
import {
  loadExtensions,
  annotateActiveExtensions,
} from '../../config/extension.js';
import {
  updateAllUpdatableExtensions,
  type ExtensionUpdateInfo,
  checkForAllExtensionUpdates,
  updateExtension,
} from '../../config/extensions/update.js';
import { checkForExtensionUpdate } from '../../config/extensions/github.js';
import { getErrorMessage } from '../../utils/errors.js';
import { ExtensionUpdateState } from '../../ui/state/extensions.js';

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
 * Formats update information for display output
 * @param info - Extension update information
 * @returns Formatted string describing the update
 */
const updateOutput = (info: ExtensionUpdateInfo) =>
  `Extension "${info.name}" successfully updated: ${info.originalVersion} → ${info.updatedVersion}.`;

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
export async function handleUpdate(args: UpdateArgs) {
  const workingDir = process.cwd();
  const allExtensions = loadExtensions();
  const extensions = annotateActiveExtensions(
    allExtensions,
    allExtensions.map((e) => e.config.name),
    workingDir,
  );
  if (args.name) {
    try {
      const extension = extensions.find(
        (extension) => extension.name === args.name,
      );
      if (!extension) {
        console.log(`Extension "${args.name}" not found.`);
        return;
      }
      let updateState: ExtensionUpdateState | undefined;
      if (!extension.installMetadata) {
        console.log(
          `Unable to install extension "${args.name}" due to missing install metadata`,
        );
        return;
      }
      await checkForExtensionUpdate(extension, (newState) => {
        updateState = newState;
      });
      if (updateState !== ExtensionUpdateState.UPDATE_AVAILABLE) {
        console.log(`Extension "${args.name}" is already up to date.`);
        return;
      }
      // TODO(chrstnb): we should list extensions if the requested extension is not installed.
      const updatedExtensionInfo = (await updateExtension(
        extension,
        workingDir,
        updateState,
        () => {},
      ))!;
      if (
        updatedExtensionInfo.originalVersion !==
        updatedExtensionInfo.updatedVersion
      ) {
        console.log(
          `Extension "${args.name}" successfully updated: ${updatedExtensionInfo.originalVersion} → ${updatedExtensionInfo.updatedVersion}.`,
        );
      } else {
        console.log(`Extension "${args.name}" is already up to date.`);
      }
    } catch (error) {
      console.error(getErrorMessage(error));
    }
  }
  if (args.all) {
    try {
      let updateInfos = await updateAllUpdatableExtensions(
        workingDir,
        extensions,
        await checkForAllExtensionUpdates(extensions, new Map(), (_) => {}),
        () => {},
      );
      updateInfos = updateInfos.filter(
        (info) => info.originalVersion !== info.updatedVersion,
      );
      if (updateInfos.length === 0) {
        console.log('No extensions to update.');
        return;
      }
      console.log(updateInfos.map((info) => updateOutput(info)).join('\n'));
    } catch (error) {
      console.error(getErrorMessage(error));
    }
  }
}

/**
 * Yargs command module for updating extensions
 *
 * This command supports updating either a specific extension by name or all
 * installed extensions at once. It checks for available updates and applies
 * them automatically.
 */
export const updateCommand: CommandModule = {
  command: 'update [<name>] [--all]',
  describe:
    'Updates all extensions or a named extension to the latest version.',
  builder: (yargs) =>
    yargs
      .positional('name', {
        describe: 'The name of the extension to update.',
        type: 'string',
      })
      .option('all', {
        describe: 'Update all extensions.',
        type: 'boolean',
      })
      .conflicts('name', 'all')
      .check((argv) => {
        if (!argv.all && !argv.name) {
          throw new Error('Either an extension name or --all must be provided');
        }
        return true;
      }),
  handler: async (argv) => {
    await handleUpdate({
      name: argv['name'] as string | undefined,
      all: argv['all'] as boolean | undefined,
    });
  },
};
