/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  installCommand,
  uninstallCommand,
  listCommand,
  updateCommand,
  disableCommand,
  enableCommand,
  linkCommand,
  newCommand,
} from './extensions/index.js';
export const extensionsCommand = {
  command: 'extensions <command>',
  describe: 'Manage Gemini CLI extensions.',
  builder: (yargs) =>
    yargs
      .command(installCommand)
      .command(uninstallCommand)
      .command(listCommand)
      .command(updateCommand)
      .command(disableCommand)
      .command(enableCommand)
      .command(linkCommand)
      .command(newCommand)
      .demandCommand(1, 'You need at least one command before continuing.')
      .version(false),
  handler: () => {
    // This handler is not called when a subcommand is provided.
    // Yargs will show the help menu.
  },
};
//# sourceMappingURL=extensions.js.map
