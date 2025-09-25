/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { setCommand } from './budget/set.js';
import { getCommand } from './budget/get.js';
import { resetCommand } from './budget/reset.js';
import { extendCommand } from './budget/extend.js';
import { enableCommand } from './budget/enable.js';
import { disableCommand } from './budget/disable.js';
import { visualizeCommand } from './budget/visualize.js';
export const budgetCommand = {
  command: 'budget',
  describe: 'Manage daily API request budget limits',
  builder: (yargs) =>
    yargs
      .command(setCommand)
      .command(getCommand)
      .command(resetCommand)
      .command(extendCommand)
      .command(enableCommand)
      .command(disableCommand)
      .command(visualizeCommand)
      .demandCommand(1, 'You need at least one command before continuing.')
      .version(false)
      .example(
        'gemini budget set 200',
        'Set daily budget limit to 200 requests',
      )
      .example('gemini budget get', 'Show current budget status and usage')
      .example(
        'gemini budget visualize',
        'Show interactive budget visualization',
      )
      .example('gemini budget reset', "Reset today's usage count")
      .example(
        'gemini budget extend 50',
        "Temporarily add 50 requests to today's limit",
      )
      .example('gemini budget disable', 'Disable budget tracking')
      .epilog(
        'Budget tracking helps you manage your daily API usage and avoid unexpected costs.',
      ),
  handler: () => {
    // yargs will automatically show help if no subcommand is provided
    // thanks to demandCommand(1) in the builder.
  },
};
//# sourceMappingURL=budget.js.map
