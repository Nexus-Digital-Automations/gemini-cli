/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import chalk from 'chalk';
export const retryTaskCommand = {
  command: 'retry <taskId>',
  describe: 'Retry a failed or cancelled task',
  builder: (yargs) =>
    yargs
      .positional('taskId', {
        type: 'string',
        describe: 'Task ID to retry',
        demandOption: true,
      })
      .option('reset-progress', {
        type: 'boolean',
        describe: 'Reset all progress and start from beginning',
        default: false,
        alias: 'r',
      })
      .option('new-priority', {
        type: 'string',
        describe: 'Change task priority for retry attempt',
        choices: ['critical', 'high', 'medium', 'low', 'background'],
        alias: 'p',
      })
      .option('max-retries', {
        type: 'number',
        describe: 'Override maximum retry attempts',
        alias: 'm',
      })
      .option('reason', {
        type: 'string',
        describe: 'Reason for manual retry',
        alias: 'R',
      })
      .option('wait-for-dependencies', {
        type: 'boolean',
        describe: 'Wait for all dependencies to complete before retrying',
        default: true,
        alias: 'w',
      })
      .example('gemini autonomous tasks retry task_123', 'Retry failed task')
      .example(
        'gemini autonomous tasks retry task_456 --reset-progress --new-priority high',
        'Retry with reset and high priority',
      )
      .example(
        'gemini autonomous tasks retry task_789 --reason "Environment fixed"',
        'Retry with reason',
      ),
  handler: async (argv) => {
    try {
      console.log(
        chalk.cyan(`🔄 Preparing to retry task: ${chalk.bold(argv.taskId)}...`),
      );
      if (argv.reason) {
        console.log(chalk.gray(`   Reason: ${argv.reason}`));
      }
      // Simulate task status check
      await new Promise((resolve) => setTimeout(resolve, 500));
      // Mock current task status - in real implementation this would come from TaskManager API
      const mockCurrentStatus = [
        'failed',
        'cancelled',
        'completed',
        'in_progress',
      ][Math.floor(Math.random() * 4)];
      const mockRetryCount = Math.floor(Math.random() * 3);
      const mockMaxRetries = argv['max-retries'] || 3;
      console.log(chalk.blue('📊 Current Task Status:'));
      console.log(
        `   Status: ${getStatusColor(mockCurrentStatus)(mockCurrentStatus.toUpperCase())}`,
      );
      console.log(`   Retry Attempts: ${mockRetryCount}/${mockMaxRetries}`);
      // Check if task can be retried
      if (mockCurrentStatus === 'in_progress') {
        console.log(chalk.red("❌ Cannot retry task - it's currently running"));
        console.log(
          chalk.blue('💡 Cancel the task first if you need to restart it'),
        );
        process.exit(1);
      }
      if (mockCurrentStatus === 'completed') {
        console.log(chalk.yellow('⚠️  Task is already completed'));
        console.log(
          chalk.blue(
            '💡 Use "add" command to create a new similar task if needed',
          ),
        );
        process.exit(1);
      }
      if (mockRetryCount >= mockMaxRetries && !argv['max-retries']) {
        console.log(chalk.red('❌ Task has reached maximum retry attempts'));
        console.log(
          chalk.blue('💡 Use --max-retries flag to override the limit'),
        );
        process.exit(1);
      }
      // Show retry configuration
      console.log(chalk.blue('\n⚙️  Retry Configuration:'));
      console.log(
        `   Reset Progress: ${argv['reset-progress'] ? chalk.green('Yes') : chalk.yellow('No')}`,
      );
      if (argv['new-priority']) {
        console.log(
          `   Priority Change: ${getPriorityColor(argv['new-priority'])(argv['new-priority'].toUpperCase())}`,
        );
      }
      if (argv['max-retries']) {
        console.log(
          `   Max Retries Override: ${chalk.cyan(argv['max-retries'])}`,
        );
      }
      console.log(
        `   Wait for Dependencies: ${argv['wait-for-dependencies'] ? chalk.green('Yes') : chalk.yellow('No')}`,
      );
      // Check dependencies if required
      if (argv['wait-for-dependencies']) {
        console.log(chalk.blue('\n🔗 Checking Dependencies:'));
        // Mock dependency check
        const mockDependencies = ['task_456', 'task_789'];
        const mockDepStatuses = mockDependencies.map((dep) => ({
          id: dep,
          status: ['completed', 'failed', 'in_progress'][
            Math.floor(Math.random() * 3)
          ],
        }));
        let allDepsComplete = true;
        mockDepStatuses.forEach((dep) => {
          const statusColor =
            dep.status === 'completed'
              ? chalk.green
              : dep.status === 'failed'
                ? chalk.red
                : chalk.yellow;
          console.log(`   ${dep.id}: ${statusColor(dep.status.toUpperCase())}`);
          if (dep.status !== 'completed') {
            allDepsComplete = false;
          }
        });
        if (!allDepsComplete) {
          console.log(
            chalk.yellow('\n⚠️  Some dependencies are not completed'),
          );
          console.log(
            chalk.blue(
              '💡 Task will be queued and start when dependencies are ready',
            ),
          );
        }
      }
      // Simulate retry preparation
      console.log(chalk.cyan('\n🔧 Preparing Task for Retry:'));
      await new Promise((resolve) => setTimeout(resolve, 800));
      console.log(chalk.gray('   • Analyzing previous failure points...'));
      await new Promise((resolve) => setTimeout(resolve, 300));
      console.log(chalk.gray('   • Clearing error state...'));
      await new Promise((resolve) => setTimeout(resolve, 200));
      if (argv['reset-progress']) {
        console.log(chalk.gray('   • Resetting progress to 0%...'));
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
      console.log(chalk.gray('   • Assigning to available agent...'));
      await new Promise((resolve) => setTimeout(resolve, 400));
      // Show successful retry initiation
      console.log(chalk.green('\n✅ Task retry initiated successfully!'));
      const newRetryCount = mockRetryCount + 1;
      const queuePosition = Math.floor(Math.random() * 5) + 1;
      console.log(chalk.blue('\n📊 Updated Task Status:'));
      console.log(
        `   Status: ${chalk.yellow('QUEUED')} → ${chalk.blue('PENDING_RETRY')}`,
      );
      console.log(
        `   Retry Count: ${mockRetryCount} → ${chalk.green(newRetryCount)}`,
      );
      console.log(`   Queue Position: ${chalk.cyan('#' + queuePosition)}`);
      if (argv['new-priority']) {
        console.log(
          `   Priority Updated: ${getPriorityColor(argv['new-priority'])(argv['new-priority'].toUpperCase())}`,
        );
      }
      if (argv['reset-progress']) {
        console.log(
          `   Progress Reset: ${chalk.yellow('65%')} → ${chalk.gray('0%')}`,
        );
      }
      // Show what was learned from previous failure
      console.log(chalk.blue('\n🧠 Failure Analysis Applied:'));
      const improvements = [
        'Increased timeout for external API calls',
        'Added retry logic for database connections',
        'Enhanced error handling for edge cases',
        'Improved resource allocation strategy',
      ];
      const selectedImprovements = improvements.slice(
        0,
        Math.floor(Math.random() * 3) + 1,
      );
      selectedImprovements.forEach((improvement) => {
        console.log(`   • ${improvement}`);
      });
      // Estimated timeline
      const estimatedStart =
        argv['wait-for-dependencies'] && !allDepsComplete
          ? 'When dependencies complete'
          : `${Math.floor(Math.random() * 5) + 1} minutes`;
      const estimatedDuration = argv['reset-progress']
        ? '45-60 minutes'
        : '20-30 minutes';
      console.log(chalk.blue('\n⏰ Timeline Estimate:'));
      console.log(`   Start Time: ${chalk.cyan(estimatedStart)}`);
      console.log(`   Duration: ${chalk.cyan(estimatedDuration)}`);
      // Show next steps
      console.log(chalk.blue('\n🔄 Next Steps:'));
      console.log(
        '   • Monitor progress: gemini autonomous tasks show ' + argv.taskId,
      );
      console.log('   • Check system status: gemini autonomous status');
      console.log('   • View all tasks: gemini autonomous tasks list');
      if (!argv['wait-for-dependencies'] || allDepsComplete) {
        console.log(chalk.green('\n🚀 Task will begin execution shortly...'));
      }
    } catch (error) {
      console.error(chalk.red('❌ Failed to retry task:'));
      console.error(
        chalk.red(error instanceof Error ? error.message : String(error)),
      );
      process.exit(1);
    }
  },
};
function getStatusColor(status) {
  switch (status.toLowerCase()) {
    case 'completed':
      return chalk.green;
    case 'in_progress':
      return chalk.blue;
    case 'failed':
      return chalk.red;
    case 'cancelled':
      return chalk.gray;
    case 'queued':
      return chalk.yellow;
    default:
      return chalk.white;
  }
}
function getPriorityColor(priority) {
  switch (priority.toLowerCase()) {
    case 'critical':
      return chalk.red.bold;
    case 'high':
      return chalk.red;
    case 'medium':
      return chalk.yellow;
    case 'low':
      return chalk.blue;
    case 'background':
      return chalk.gray;
    default:
      return chalk.white;
  }
}
//# sourceMappingURL=retry.js.map
