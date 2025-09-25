/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { CommandModule, Argv } from 'yargs';
import { listTasksCommand } from './tasks/list.js';
import { addTaskCommand } from './tasks/add.js';
import { cancelTaskCommand } from './tasks/cancel.js';
import { showTaskCommand } from './tasks/show.js';
import { retryTaskCommand } from './tasks/retry.js';

export const tasksCommand: CommandModule = {
  command: 'tasks',
  describe: 'Manage autonomous tasks',
  builder: (yargs: Argv) =>
    yargs
      .command(listTasksCommand)
      .command(addTaskCommand)
      .command(showTaskCommand)
      .command(cancelTaskCommand)
      .command(retryTaskCommand)
      .demandCommand(1, 'You need at least one command before continuing.')
      .version(false)
      .example('gemini autonomous tasks list', 'List all tasks')
      .example('gemini autonomous tasks add "Fix bug in authentication"', 'Add new task')
      .example('gemini autonomous tasks show task_123', 'Show task details')
      .example('gemini autonomous tasks cancel task_123', 'Cancel a task')
      .epilog('Task management commands for the autonomous system'),
  handler: () => {
    // yargs will automatically show help if no subcommand is provided
  },
};