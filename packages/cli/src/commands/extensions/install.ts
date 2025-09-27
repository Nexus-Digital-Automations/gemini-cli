/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { CommandModule } from 'yargs';
import {
  installExtension,
  requestConsentNonInteractive,
} from '../../config/extension.js';
import type { ExtensionInstallMetadata } from '@google/gemini-cli-core';

import { getErrorMessage } from '../../utils/errors.js';

/**
 * Arguments interface for the install extension command
 */
interface InstallArgs {
  /** Git URL of the extension to install */
  source?: string;
  /** Local file system path to the extension directory */
  path?: string;
  /** Git reference (branch, tag, commit) to install from */
  ref?: string;
  /** Whether to enable auto-update for this extension */
  autoUpdate?: boolean;
}

/**
 * Handles the install extension command execution
 * @param args - The command arguments containing source/path and installation options
 *
 * @example
 * ```typescript
 * // Install from git repository
 * await handleInstall({
 *   source: 'https://github.com/user/extension.git',
 *   ref: 'v1.0.0',
 *   autoUpdate: true
 * });
 *
 * // Install from local path
 * await handleInstall({ path: '/path/to/local/extension' });
 * ```
 */
export async function handleInstall(args: InstallArgs) {
  try {
    let installMetadata: ExtensionInstallMetadata;
    if (args.source) {
      const { source } = args;
      if (
        source.startsWith('http://') ||
        source.startsWith('https://') ||
        source.startsWith('git@') ||
        source.startsWith('sso://')
      ) {
        installMetadata = {
          source,
          type: 'git',
          ref: args.ref,
          autoUpdate: args.autoUpdate,
        };
      } else {
        throw new Error(`The source "${source}" is not a valid URL format.`);
      }
    } else if (args.path) {
      installMetadata = {
        source: args.path,
        type: 'local',
        autoUpdate: args.autoUpdate,
      };
    } else {
      // This should not be reached due to the yargs check.
      throw new Error('Either --source or --path must be provided.');
    }

    const name = await installExtension(
      installMetadata,
      requestConsentNonInteractive,
    );
    console.log(`Extension "${name}" installed successfully and enabled.`);
  } catch (error) {
    console.error(getErrorMessage(error));
    process.exit(1);
  }
}

/**
 * Yargs command module for installing extensions
 *
 * This command supports installation from both remote git repositories and local
 * file system paths. It provides options for specifying git references and
 * enabling auto-updates for remote installations.
 */
export const installCommand: CommandModule = {
  command: 'install [<source>] [--path] [--ref] [--auto-update]',
  describe: 'Installs an extension from a git repository URL or a local path.',
  builder: (yargs) =>
    yargs
      .positional('source', {
        describe: 'The github URL of the extension to install.',
        type: 'string',
      })
      .option('path', {
        describe: 'Path to a local extension directory.',
        type: 'string',
      })
      .option('ref', {
        describe: 'The git ref to install from.',
        type: 'string',
      })
      .option('auto-update', {
        describe: 'Enable auto-update for this extension.',
        type: 'boolean',
      })
      .conflicts('source', 'path')
      .conflicts('path', 'ref')
      .conflicts('path', 'auto-update')
      .check((argv) => {
        if (!argv.source && !argv.path) {
          throw new Error('Either source or --path must be provided.');
        }
        return true;
      }),
  handler: async (argv) => {
    await handleInstall({
      source: argv['source'] as string | undefined,
      path: argv['path'] as string | undefined,
      ref: argv['ref'] as string | undefined,
      autoUpdate: argv['auto-update'] as boolean | undefined,
    });
  },
};
