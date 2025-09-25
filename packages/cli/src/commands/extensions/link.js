/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { installExtension } from '../../config/extension.js';
import { getErrorMessage } from '../../utils/errors.js';
/**
 * Handles the link extension command execution
 *
 * Creates a symbolic link to a local extension directory, allowing changes
 * to be reflected immediately without reinstallation.
 *
 * @param args - The command arguments containing the path to link
 *
 * @example
 * ```typescript
 * await handleLink({ path: '/path/to/extension/directory' });
 * // Links extension and enables it immediately
 * ```
 */
export async function handleLink(args) {
    try {
        const installMetadata = {
            source: args.path,
            type: 'link',
        };
        const extensionName = await installExtension(installMetadata);
        console.log(`Extension "${extensionName}" linked successfully and enabled.`);
    }
    catch (error) {
        console.error(getErrorMessage(error));
        process.exit(1);
    }
}
/**
 * Yargs command module for linking extensions
 *
 * This command creates a symbolic link to a local extension directory,
 * enabling development mode where changes to the extension are reflected
 * immediately without reinstallation.
 */
export const linkCommand = {
    command: 'link <path>',
    describe: 'Links an extension from a local path. Updates made to the local path will always be reflected.',
    builder: (yargs) => yargs
        .positional('path', {
        describe: 'The name of the extension to link.',
        type: 'string',
    })
        .check((_) => true),
    handler: async (argv) => {
        await handleLink({
            path: argv['path'],
        });
    },
};
//# sourceMappingURL=link.js.map