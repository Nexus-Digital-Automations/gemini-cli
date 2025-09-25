/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { CommandModule, Argv } from 'yargs';
import { startCommand } from './autonomous/start.js';
import { stopCommand } from './autonomous/stop.js';
import { statusCommand } from './autonomous/status.js';
import { tasksCommand } from './autonomous/tasks.js';
import { metricsCommand } from './autonomous/metrics.js';
import { configCommand } from './autonomous/config.js';
import { compatibilityCheckCommand } from './autonomous/compatibility-check.js';

/**
 * Autonomous Task Management CLI Command Interface
 *
 * Provides comprehensive command-line access to the autonomous task management system,
 * enabling users to control, monitor, and configure the autonomous development assistant.
 */
export const autonomousCommand: CommandModule = {
  command: 'autonomous',
  describe: 'Manage the autonomous task management system',
  builder: (yargs: Argv) =>
    yargs
      .command(startCommand)
      .command(stopCommand)
      .command(statusCommand)
      .command(tasksCommand)
      .command(metricsCommand)
      .command(configCommand)
      .command(compatibilityCheckCommand)
      .demandCommand(1, 'You need at least one command before continuing.')
      .version(false)
      .example(
        'gemini autonomous start',
        'Start the autonomous task management system',
      )
      .example(
        'gemini autonomous status',
        'Show system status and active agents',
      )
      .example('gemini autonomous tasks list', 'List all tasks in the queue')
      .example(
        'gemini autonomous tasks add "Implement user auth"',
        'Add a new task',
      )
      .example('gemini autonomous metrics', 'Show performance metrics')
      .example(
        'gemini autonomous config set maxAgents 10',
        'Configure system settings',
      )
      .example(
        'gemini autonomous compatibility-check',
        'Validate system compatibility',
      )
      .example(
        'gemini autonomous stop',
        'Stop the autonomous system gracefully',
      )
      .epilog(`The autonomous task management system transforms Gemini CLI into a proactive
development partner that can independently manage complex multi-session projects,
breaking down tasks, managing dependencies, and executing work with comprehensive
validation cycles.

Key Features:
• Self-managing task queue with intelligent priority scheduling
• Autonomous task breakdown and execution orchestration
• Cross-session task persistence and real-time monitoring
• Intelligent dependency analysis and sequencing
• Automatic task completion validation with quality gates
• Multi-agent coordination and resource management

For detailed documentation, visit: https://gemini-cli.dev/autonomous`),
  handler: () => {
    // yargs will automatically show help if no subcommand is provided
    // thanks to demandCommand(1) in the builder.
  },
};
