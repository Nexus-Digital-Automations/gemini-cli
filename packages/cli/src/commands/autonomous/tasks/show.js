/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import chalk from 'chalk';
export const showTaskCommand = {
  command: 'show <taskId>',
  describe: 'Show detailed information about a specific task',
  builder: (yargs) =>
    yargs
      .positional('taskId', {
        type: 'string',
        describe: 'Task ID to show details for',
        demandOption: true,
      })
      .option('verbose', {
        type: 'boolean',
        describe: 'Show verbose details including internal state',
        default: false,
        alias: 'v',
      })
      .option('logs', {
        type: 'boolean',
        describe: 'Show task execution logs',
        default: false,
        alias: 'l',
      })
      .option('show-subtasks', {
        type: 'boolean',
        describe: 'Show all subtasks and their status',
        default: false,
        alias: 's',
      })
      .option('show-dependencies', {
        type: 'boolean',
        describe: 'Show task dependencies and dependents',
        default: false,
        alias: 'd',
      })
      .example(
        'gemini autonomous tasks show task_123',
        'Show basic task details',
      )
      .example(
        'gemini autonomous tasks show task_456 --verbose --logs',
        'Show detailed info with logs',
      )
      .example(
        'gemini autonomous tasks show task_789 --show-subtasks --show-dependencies',
        'Show complete task tree',
      ),
  handler: async (argv) => {
    try {
      console.log(
        chalk.cyan(`📋 Loading task details: ${chalk.bold(argv.taskId)}...`),
      );
      // Simulate loading task data
      await new Promise((resolve) => setTimeout(resolve, 300));
      // Mock task data - in real implementation this would come from TaskManager API
      const mockTask = {
        id: argv.taskId,
        title: 'Implement user authentication system',
        description:
          'Create comprehensive authentication system with OAuth2, JWT tokens, password reset, and user session management.',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        category: 'FEATURE',
        type: 'IMPLEMENTATION',
        // Timestamps
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        startedAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
        updatedAt: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
        // Progress
        progress: 65,
        completedSubtasks: 4,
        totalSubtasks: 7,
        estimatedTimeRemaining: '25 minutes',
        // Assignment
        assignedAgent: 'BACKEND_SPECIALIST_001',
        agentStatus: 'ACTIVE',
        // Configuration
        maxExecutionTime: 120, // minutes
        retryCount: 0,
        maxRetries: 3,
        // Context
        context: {
          framework: 'Express.js',
          database: 'PostgreSQL',
          authProvider: 'Auth0',
          testingRequired: true,
        },
        // Dependencies
        dependencies: ['task_456', 'task_789'],
        dependents: ['task_101', 'task_102', 'task_103'],
        // Resources
        filesModified: [
          'src/auth/AuthService.ts',
          'src/auth/JWTManager.ts',
          'src/routes/auth.ts',
          'tests/auth.test.ts',
        ],
      };
      // Display basic task information
      console.log(chalk.blue('\n📊 Task Overview:'));
      console.log(`   ID: ${chalk.bold(mockTask.id)}`);
      console.log(`   Title: ${chalk.bold(mockTask.title)}`);
      console.log(
        `   Status: ${getStatusColor(mockTask.status)(mockTask.status)}`,
      );
      console.log(
        `   Priority: ${getPriorityColor(mockTask.priority)(mockTask.priority)}`,
      );
      console.log(`   Category: ${chalk.cyan(mockTask.category)}`);
      console.log(`   Type: ${chalk.magenta(mockTask.type)}`);
      // Progress information
      console.log(chalk.blue('\n⏱️  Progress & Timing:'));
      console.log(
        `   Overall Progress: ${getProgressBar(mockTask.progress)} ${mockTask.progress}%`,
      );
      console.log(
        `   Subtasks: ${chalk.green(mockTask.completedSubtasks)}/${mockTask.totalSubtasks} completed`,
      );
      console.log(
        `   Est. Time Remaining: ${chalk.yellow(mockTask.estimatedTimeRemaining)}`,
      );
      console.log(
        `   Created: ${chalk.gray(mockTask.createdAt.toLocaleString())}`,
      );
      console.log(
        `   Started: ${chalk.gray(mockTask.startedAt.toLocaleString())}`,
      );
      console.log(
        `   Last Updated: ${chalk.gray(mockTask.updatedAt.toLocaleString())}`,
      );
      // Agent information
      console.log(chalk.blue('\n🤖 Agent Assignment:'));
      console.log(`   Assigned Agent: ${chalk.bold(mockTask.assignedAgent)}`);
      console.log(
        `   Agent Status: ${getAgentStatusColor(mockTask.agentStatus)(mockTask.agentStatus)}`,
      );
      console.log(
        `   Retry Count: ${mockTask.retryCount}/${mockTask.maxRetries}`,
      );
      // Show description
      console.log(chalk.blue('\n📝 Description:'));
      console.log(`   ${mockTask.description}`);
      // Show context if verbose
      if (argv.verbose) {
        console.log(chalk.blue('\n🔧 Context & Configuration:'));
        Object.entries(mockTask.context).forEach(([key, value]) => {
          console.log(`   ${key}: ${chalk.green(String(value))}`);
        });
        console.log(
          `   Max Execution Time: ${mockTask.maxExecutionTime} minutes`,
        );
      }
      // Show dependencies if requested
      if (argv['show-dependencies']) {
        console.log(chalk.blue('\n🔗 Dependencies:'));
        if (mockTask.dependencies.length > 0) {
          console.log(
            `   Depends on: ${chalk.yellow(mockTask.dependencies.join(', '))}`,
          );
        } else {
          console.log(`   No dependencies`);
        }
        if (mockTask.dependents.length > 0) {
          console.log(
            `   Required by: ${chalk.cyan(mockTask.dependents.join(', '))}`,
          );
        } else {
          console.log(`   No dependents`);
        }
      }
      // Show subtasks if requested
      if (argv['show-subtasks']) {
        console.log(chalk.blue('\n📋 Subtasks:'));
        const mockSubtasks = [
          {
            id: 'sub_1',
            title: 'Set up JWT token generation',
            status: 'COMPLETED',
            progress: 100,
          },
          {
            id: 'sub_2',
            title: 'Implement password hashing',
            status: 'COMPLETED',
            progress: 100,
          },
          {
            id: 'sub_3',
            title: 'Create authentication middleware',
            status: 'COMPLETED',
            progress: 100,
          },
          {
            id: 'sub_4',
            title: 'Build OAuth2 integration',
            status: 'IN_PROGRESS',
            progress: 80,
          },
          {
            id: 'sub_5',
            title: 'Add session management',
            status: 'IN_PROGRESS',
            progress: 40,
          },
          {
            id: 'sub_6',
            title: 'Implement password reset',
            status: 'QUEUED',
            progress: 0,
          },
          {
            id: 'sub_7',
            title: 'Write comprehensive tests',
            status: 'QUEUED',
            progress: 0,
          },
        ];
        mockSubtasks.forEach((subtask, index) => {
          const statusIcon =
            subtask.status === 'COMPLETED'
              ? '✅'
              : subtask.status === 'IN_PROGRESS'
                ? '🔄'
                : '⏳';
          console.log(`   ${index + 1}. ${statusIcon} ${subtask.title}`);
          console.log(
            `      Status: ${getStatusColor(subtask.status)(subtask.status)} (${subtask.progress}%)`,
          );
        });
      }
      // Show file modifications if verbose
      if (argv.verbose) {
        console.log(chalk.blue('\n📁 Modified Files:'));
        mockTask.filesModified.forEach((file) => {
          console.log(`   ${chalk.gray('+')} ${file}`);
        });
      }
      // Show logs if requested
      if (argv.logs) {
        console.log(chalk.blue('\n📜 Recent Execution Logs:'));
        const mockLogs = [
          '[2024-01-15 14:30:15] INFO: Starting OAuth2 integration implementation',
          '[2024-01-15 14:32:42] DEBUG: Configuring Auth0 client credentials',
          '[2024-01-15 14:35:10] INFO: JWT token validation middleware implemented',
          '[2024-01-15 14:37:33] WARN: Rate limiting consideration for auth endpoints',
          '[2024-01-15 14:40:01] INFO: Session management scaffolding complete',
          '[2024-01-15 14:42:18] DEBUG: Testing authentication flow...',
        ];
        mockLogs.forEach((log) => {
          const level = log.match(/\[(.*?)\] (\w+):/);
          if (level) {
            const logLevel = level[2];
            const color =
              logLevel === 'ERROR'
                ? chalk.red
                : logLevel === 'WARN'
                  ? chalk.yellow
                  : logLevel === 'DEBUG'
                    ? chalk.gray
                    : chalk.white;
            console.log(`   ${color(log)}`);
          } else {
            console.log(`   ${chalk.gray(log)}`);
          }
        });
      }
      // Show next steps
      console.log(chalk.blue('\n🔄 Available Actions:'));
      console.log(
        '   • Cancel task: gemini autonomous tasks cancel ' + argv.taskId,
      );
      if (mockTask.status === 'FAILED') {
        console.log(
          '   • Retry task: gemini autonomous tasks retry ' + argv.taskId,
        );
      }
      console.log('   • View all tasks: gemini autonomous tasks list');
      console.log('   • System status: gemini autonomous status');
    } catch (error) {
      console.error(chalk.red('❌ Failed to show task:'));
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
function getAgentStatusColor(status) {
  switch (status.toLowerCase()) {
    case 'active':
      return chalk.green;
    case 'idle':
      return chalk.yellow;
    case 'error':
      return chalk.red;
    case 'offline':
      return chalk.gray;
    default:
      return chalk.white;
  }
}
function getProgressBar(progress, width = 20) {
  const filled = Math.round((progress / 100) * width);
  const empty = width - filled;
  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  if (progress >= 80) return chalk.green(bar);
  if (progress >= 50) return chalk.yellow(bar);
  if (progress >= 25) return chalk.blue(bar);
  return chalk.red(bar);
}
//# sourceMappingURL=show.js.map
