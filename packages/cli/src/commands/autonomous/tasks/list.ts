/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { CommandModule } from 'yargs';
import chalk from 'chalk';
import { TaskStatus, TaskPriority, TaskCategory } from '@google/gemini-cli-core/task-management/types.js';

interface ListTasksOptions {
  status?: string;
  priority?: string;
  category?: string;
  limit?: number;
  json?: boolean;
  'show-completed'?: boolean;
}

export const listTasksCommand: CommandModule<{}, ListTasksOptions> = {
  command: 'list',
  describe: 'List tasks in the autonomous system',
  builder: (yargs) =>
    yargs
      .option('status', {
        type: 'string',
        describe: 'Filter by task status',
        choices: Object.values(TaskStatus),
        alias: 's',
      })
      .option('priority', {
        type: 'string',
        describe: 'Filter by task priority',
        choices: ['critical', 'high', 'medium', 'low', 'background'],
        alias: 'p',
      })
      .option('category', {
        type: 'string',
        describe: 'Filter by task category',
        choices: Object.values(TaskCategory),
        alias: 'c',
      })
      .option('limit', {
        type: 'number',
        describe: 'Limit number of tasks shown',
        default: 50,
        alias: 'l',
      })
      .option('json', {
        type: 'boolean',
        describe: 'Output in JSON format',
        default: false,
      })
      .option('show-completed', {
        type: 'boolean',
        describe: 'Include completed tasks',
        default: false,
      })
      .example('gemini autonomous tasks list', 'List all active tasks')
      .example('gemini autonomous tasks list --status running', 'List only running tasks')
      .example('gemini autonomous tasks list --priority high', 'List high priority tasks')
      .example('gemini autonomous tasks list --show-completed', 'Include completed tasks'),

  handler: async (argv) => {
    try {
      console.log(chalk.cyan('📋 Task List'));
      console.log(chalk.gray('─'.repeat(80)));

      // Mock task data for demonstration
      // In real implementation, this would fetch from the autonomous system
      const mockTasks = [
        {
          id: 'task_001',
          title: 'Implement user authentication system',
          status: TaskStatus.RUNNING,
          priority: TaskPriority.HIGH,
          category: TaskCategory.FEATURE,
          progress: 65,
          assignedAgent: 'SECURITY_AGENT_001',
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          startedAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
          estimatedCompletion: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes from now
        },
        {
          id: 'task_002',
          title: 'Fix memory leak in task queue',
          status: TaskStatus.QUEUED,
          priority: TaskPriority.CRITICAL,
          category: TaskCategory.BUG_FIX,
          progress: 0,
          createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
          dependencies: ['task_001']
        },
        {
          id: 'task_003',
          title: 'Update API documentation',
          status: TaskStatus.COMPLETED,
          priority: TaskPriority.MEDIUM,
          category: TaskCategory.DOCUMENTATION,
          progress: 100,
          assignedAgent: 'DOCUMENTATION_AGENT_001',
          createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
          completedAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
        },
        {
          id: 'task_004',
          title: 'Optimize database queries',
          status: TaskStatus.BLOCKED,
          priority: TaskPriority.HIGH,
          category: TaskCategory.PERFORMANCE,
          progress: 25,
          assignedAgent: 'PERFORMANCE_AGENT_001',
          createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
          blockedReason: 'Waiting for database schema update'
        }
      ];

      // Apply filters
      let filteredTasks = mockTasks.filter(task => {
        if (argv.status && task.status !== argv.status) return false;
        if (argv.category && task.category !== argv.category) return false;
        if (!argv['show-completed'] && task.status === TaskStatus.COMPLETED) return false;

        // Priority filtering (convert string to enum value)
        if (argv.priority) {
          const priorityMap: Record<string, TaskPriority> = {
            'critical': TaskPriority.CRITICAL,
            'high': TaskPriority.HIGH,
            'medium': TaskPriority.MEDIUM,
            'low': TaskPriority.LOW,
            'background': TaskPriority.BACKGROUND
          };
          if (task.priority !== priorityMap[argv.priority]) return false;
        }

        return true;
      });

      // Apply limit
      if (argv.limit && argv.limit > 0) {
        filteredTasks = filteredTasks.slice(0, argv.limit);
      }

      if (argv.json) {
        console.log(JSON.stringify(filteredTasks, null, 2));
        return;
      }

      if (filteredTasks.length === 0) {
        console.log(chalk.yellow('📭 No tasks found matching the specified criteria'));
        return;
      }

      // Display tasks in a formatted table
      for (const task of filteredTasks) {
        displayTask(task);
        console.log(); // Empty line between tasks
      }

      // Summary
      console.log(chalk.gray('─'.repeat(80)));
      console.log(chalk.blue(`📊 Showing ${filteredTasks.length} tasks`));

      const statusCounts = filteredTasks.reduce((acc, task) => {
        acc[task.status] = (acc[task.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      console.log(chalk.gray('Status breakdown:'));
      Object.entries(statusCounts).forEach(([status, count]) => {
        const icon = getStatusIcon(status as TaskStatus);
        const color = getStatusColor(status as TaskStatus);
        console.log(chalk.gray(`  ${icon} ${color(status)}: ${count}`));
      });

    } catch (error) {
      console.error(chalk.red('❌ Failed to list tasks:'));
      console.error(chalk.red(error instanceof Error ? error.message : String(error)));
      process.exit(1);
    }
  },
};

function displayTask(task: any) {
  const statusIcon = getStatusIcon(task.status);
  const statusColor = getStatusColor(task.status);
  const priorityColor = getPriorityColor(task.priority);

  // Header line with title and status
  console.log(
    `${statusIcon} ${chalk.bold(task.title)} ${chalk.gray(`[${task.id}]`)}`
  );

  // Status and priority line
  console.log(
    `   Status: ${statusColor(task.status)} | ` +
    `Priority: ${priorityColor(getPriorityName(task.priority))} | ` +
    `Category: ${chalk.cyan(task.category)}`
  );

  // Progress bar (if applicable)
  if (task.progress > 0) {
    const progressBar = createProgressBar(task.progress);
    console.log(`   Progress: ${progressBar} ${task.progress}%`);
  }

  // Agent assignment
  if (task.assignedAgent) {
    console.log(`   Agent: ${chalk.magenta(task.assignedAgent)}`);
  }

  // Timing information
  const createdTime = task.createdAt.toLocaleString();
  console.log(`   Created: ${chalk.gray(createdTime)}`);

  if (task.startedAt) {
    const startedTime = task.startedAt.toLocaleString();
    console.log(`   Started: ${chalk.gray(startedTime)}`);
  }

  if (task.completedAt) {
    const completedTime = task.completedAt.toLocaleString();
    console.log(`   Completed: ${chalk.green(completedTime)}`);
  }

  if (task.estimatedCompletion) {
    const etaTime = task.estimatedCompletion.toLocaleString();
    console.log(`   ETA: ${chalk.blue(etaTime)}`);
  }

  // Dependencies
  if (task.dependencies && task.dependencies.length > 0) {
    console.log(`   Dependencies: ${chalk.yellow(task.dependencies.join(', '))}`);
  }

  // Blocked reason
  if (task.blockedReason) {
    console.log(`   ${chalk.red('🚫 Blocked:')} ${chalk.red(task.blockedReason)}`);
  }
}

function getStatusIcon(status: TaskStatus): string {
  const icons = {
    [TaskStatus.PENDING]: '⏸️',
    [TaskStatus.QUEUED]: '📋',
    [TaskStatus.RUNNING]: '🔄',
    [TaskStatus.BLOCKED]: '🚫',
    [TaskStatus.COMPLETED]: '✅',
    [TaskStatus.FAILED]: '❌',
    [TaskStatus.CANCELLED]: '🚮'
  };
  return icons[status] || '❓';
}

function getStatusColor(status: TaskStatus) {
  const colors = {
    [TaskStatus.PENDING]: chalk.gray,
    [TaskStatus.QUEUED]: chalk.blue,
    [TaskStatus.RUNNING]: chalk.yellow,
    [TaskStatus.BLOCKED]: chalk.red,
    [TaskStatus.COMPLETED]: chalk.green,
    [TaskStatus.FAILED]: chalk.red,
    [TaskStatus.CANCELLED]: chalk.gray
  };
  return colors[status] || chalk.white;
}

function getPriorityColor(priority: TaskPriority) {
  if (priority >= TaskPriority.CRITICAL) return chalk.red.bold;
  if (priority >= TaskPriority.HIGH) return chalk.red;
  if (priority >= TaskPriority.MEDIUM) return chalk.yellow;
  if (priority >= TaskPriority.LOW) return chalk.blue;
  return chalk.gray;
}

function getPriorityName(priority: TaskPriority): string {
  if (priority >= TaskPriority.CRITICAL) return 'CRITICAL';
  if (priority >= TaskPriority.HIGH) return 'HIGH';
  if (priority >= TaskPriority.MEDIUM) return 'MEDIUM';
  if (priority >= TaskPriority.LOW) return 'LOW';
  return 'BACKGROUND';
}

function createProgressBar(progress: number, width: number = 20): string {
  const filled = Math.round((progress / 100) * width);
  const empty = width - filled;
  const bar = '█'.repeat(filled) + '░'.repeat(empty);

  let color = chalk.red;
  if (progress > 66) color = chalk.green;
  else if (progress > 33) color = chalk.yellow;

  return color(bar);
}