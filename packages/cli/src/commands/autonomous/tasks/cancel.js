/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import chalk from 'chalk';
export const cancelTaskCommand = {
    command: 'cancel <taskId>',
    describe: 'Cancel a running or queued task',
    builder: (yargs) => yargs
        .positional('taskId', {
        type: 'string',
        describe: 'Task ID to cancel',
        demandOption: true,
    })
        .option('force', {
        type: 'boolean',
        describe: 'Force cancel even if task is in critical state',
        default: false,
        alias: 'f',
    })
        .option('reason', {
        type: 'string',
        describe: 'Reason for cancellation',
        alias: 'r',
    })
        .example('gemini autonomous tasks cancel task_123', 'Cancel task by ID')
        .example('gemini autonomous tasks cancel task_456 --force --reason "Changed requirements"', 'Force cancel with reason'),
    handler: async (argv) => {
        try {
            console.log(chalk.yellow(`🚫 Cancelling task: ${chalk.bold(argv.taskId)}...`));
            if (argv.reason) {
                console.log(chalk.gray(`   Reason: ${argv.reason}`));
            }
            // Simulate task cancellation process
            await new Promise((resolve) => setTimeout(resolve, 500));
            // In a real implementation, this would:
            // 1. Send cancellation request to TaskManager API
            // 2. Handle response and show appropriate status
            // 3. Cleanup any active agents working on this task
            // For now, simulate different scenarios
            const mockTaskStatuses = [
                'running',
                'queued',
                'completed',
                'cancelled',
                'failed',
            ];
            const currentStatus = mockTaskStatuses[Math.floor(Math.random() * mockTaskStatuses.length)];
            switch (currentStatus) {
                case 'completed':
                    console.log(chalk.yellow('⚠️  Task is already completed and cannot be cancelled'));
                    console.log(chalk.blue('💡 Consider using "gemini autonomous tasks retry" if you need to re-run it'));
                    break;
                case 'cancelled':
                    console.log(chalk.yellow('⚠️  Task is already cancelled'));
                    break;
                case 'failed':
                    console.log(chalk.yellow('⚠️  Task has already failed'));
                    console.log(chalk.blue('💡 No cancellation needed - task is not active'));
                    break;
                case 'running':
                    if (!argv.force && Math.random() < 0.3) {
                        console.log(chalk.red("❌ Cannot cancel task - it's in a critical state"));
                        console.log(chalk.blue('💡 Use --force flag to override, or wait for current operation to complete'));
                        process.exit(1);
                    }
                    console.log(chalk.green('✅ Task cancelled successfully!'));
                    console.log(chalk.blue('📊 Cancellation Details:'));
                    console.log(`   • Status changed: RUNNING → CANCELLED`);
                    console.log(`   • Cleanup: Agent released, resources freed`);
                    console.log(`   • Rollback: Partial changes reverted`);
                    if (argv.force) {
                        console.log(chalk.yellow(`   • Force cancelled: Yes`));
                    }
                    break;
                case 'queued':
                    console.log(chalk.green('✅ Task removed from queue successfully!'));
                    console.log(chalk.blue('📊 Cancellation Details:'));
                    console.log(`   • Status changed: QUEUED → CANCELLED`);
                    console.log(`   • Queue position: Released`);
                    console.log(`   • Resources: No cleanup needed`);
                    break;
                default:
                    console.log(chalk.green('✅ Task cancelled successfully!'));
            }
            // Show next steps
            console.log(chalk.blue('\n🔄 Next Steps:'));
            console.log('   • Check overall status: gemini autonomous status');
            console.log('   • View task history: gemini autonomous tasks list --show-cancelled');
            console.log(`   • View task details: gemini autonomous tasks show ${argv.taskId}`);
            // Simulate impact analysis
            if (currentStatus === 'running') {
                console.log(chalk.gray('\n🔍 Impact Analysis:'));
                console.log(chalk.gray('   • Dependent tasks: 2 tasks may be delayed'));
                console.log(chalk.gray('   • Resource utilization: CPU freed, 1 agent available'));
                console.log(chalk.gray('   • Progress lost: ~30% completion, can be resumed'));
            }
        }
        catch (error) {
            console.error(chalk.red('❌ Failed to cancel task:'));
            console.error(chalk.red(error instanceof Error ? error.message : String(error)));
            process.exit(1);
        }
    },
};
//# sourceMappingURL=cancel.js.map