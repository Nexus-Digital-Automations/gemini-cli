/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { loadUserExtensions, toOutputString } from '../../config/extension.js';
import { getErrorMessage } from '../../utils/errors.js';
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
export async function handleList() {
  try {
    const extensions = loadUserExtensions();
    if (extensions.length === 0) {
      console.log('No extensions installed.');
      return;
    }
    console.log(
      extensions.map((extension, _) => toOutputString(extension)).join('\n\n'),
    );
  } catch (error) {
    console.error(getErrorMessage(error));
    process.exit(1);
  }
}
/**
 * Yargs command module for listing installed extensions
 *
 * This command displays all currently installed extensions with their
 * metadata such as name, source, enabled status, and installation details.
 */
export const listCommand = {
  command: 'list',
  describe: 'Lists installed extensions.',
  builder: (yargs) => yargs,
  handler: async () => {
    await handleList();
  },
};
//# sourceMappingURL=list.js.map
