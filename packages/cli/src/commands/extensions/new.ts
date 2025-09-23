/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { access, cp, mkdir, readdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import type { CommandModule } from 'yargs';
import { fileURLToPath } from 'node:url';
import { getErrorMessage } from '../../utils/errors.js';

/**
 * Arguments interface for the new extension command
 */
interface NewArgs {
  /** The path where the new extension should be created */
  path: string;
  /** The template/boilerplate to use for the new extension */
  template: string;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const EXAMPLES_PATH = join(__dirname, 'examples');

/**
 * Checks if a file or directory exists at the given path
 * @param path - The path to check
 * @returns True if the path exists, false otherwise
 */
async function pathExists(path: string) {
  try {
    await access(path);
    return true;
  } catch (_e) {
    return false;
  }
}

/**
 * Copies a template directory to the target path
 * @param template - The name of the template to copy
 * @param path - The destination path for the new extension
 * @throws {Error} If the target path already exists or copying fails
 */
async function copyDirectory(template: string, path: string) {
  if (await pathExists(path)) {
    throw new Error(`Path already exists: ${path}`);
  }

  const examplePath = join(EXAMPLES_PATH, template);
  await mkdir(path, { recursive: true });
  await cp(examplePath, path, { recursive: true });
}

/**
 * Handles the new extension command execution
 * @param args - The command arguments containing path and template
 *
 * @example
 * ```typescript
 * await handleNew({
 *   path: './my-extension',
 *   template: 'mcp-server'
 * });
 * // Creates a new extension from the mcp-server template
 * ```
 */
async function handleNew(args: NewArgs) {
  try {
    await copyDirectory(args.template, args.path);
    console.log(
      `Successfully created new extension from template "${args.template}" at ${args.path}.`,
    );
    console.log(
      `You can install this using "gemini extensions link ${args.path}" to test it out.`,
    );
  } catch (error) {
    console.error(getErrorMessage(error));
    throw error;
  }
}

/**
 * Gets the list of available boilerplate template choices
 * @returns Array of template names available for new extensions
 */
async function getBoilerplateChoices() {
  const entries = await readdir(EXAMPLES_PATH, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
}

/**
 * Yargs command module for creating new extensions
 *
 * This command creates a new extension from predefined boilerplate templates,
 * providing a starting point for extension development with common patterns
 * and structure already in place.
 */
export const newCommand: CommandModule = {
  command: 'new <path> <template>',
  describe: 'Create a new extension from a boilerplate example.',
  builder: async (yargs) => {
    const choices = await getBoilerplateChoices();
    return yargs
      .positional('path', {
        describe: 'The path to create the extension in.',
        type: 'string',
      })
      .positional('template', {
        describe: 'The boilerplate template to use.',
        type: 'string',
        choices,
      });
  },
  handler: async (args) => {
    await handleNew({
      path: args['path'] as string,
      template: args['template'] as string,
    });
  },
};
