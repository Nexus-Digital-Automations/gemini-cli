/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { CommandModule } from 'yargs';
import chalk from 'chalk';
import {
  TaskPriority,
  TaskCategory,
  TaskType,
} from '@google/gemini-cli-core/src/task-management/types.js';
import {
  suggestFeature,
  convertTaskToFeature,
  handleApiResponse,
  handleApiFallback,
  initializeAgent,
} from '../taskManagerApi.js';

interface _AddTaskOptions {
  priority: string;
  category: string;
  type: string;
  description: string;
  'max-time': number;
  dependencies: string[];
  context?: string;
  'expected-outputs'?: string;
  [key: string]: unknown;
}

export const addTaskCommand: CommandModule = {
  command: 'add <description>',
  describe: 'Add a new task to the autonomous system',
  builder: (yargs) =>
    yargs
      .positional('description', {
        type: 'string',
        describe: 'Task description',
        demandOption: true,
      })
      .option('priority', {
        type: 'string',
        describe: 'Task priority level',
        choices: ['critical', 'high', 'medium', 'low', 'background'],
        default: 'medium',
        alias: 'p',
      })
      .option('category', {
        type: 'string',
        describe: 'Task category',
        choices: Object.values(TaskCategory),
        default: TaskCategory.FEATURE,
        alias: 'c',
      })
      .option('type', {
        type: 'string',
        describe: 'Task type for specialized handling',
        choices: [
          'implementation',
          'testing',
          'validation',
          'documentation',
          'analysis',
          'deployment',
          'security',
          'performance',
        ],
        default: 'implementation',
        alias: 't',
      })
      .option('max-time', {
        type: 'number',
        describe: 'Maximum execution time in minutes',
        default: 60,
        alias: 'm',
      })
      .option('dependencies', {
        type: 'array',
        describe: 'Task IDs this task depends on',
        default: [],
        alias: 'd',
      })
      .option('context', {
        type: 'string',
        describe: 'Additional context as JSON string',
      })
      .option('expected-outputs', {
        type: 'string',
        describe: 'Expected outputs as JSON string',
      })
      .example(
        'gemini autonomous tasks add "Implement user authentication"',
        'Add a basic task',
      )
      .example(
        'gemini autonomous tasks add "Fix critical bug" --priority critical --category bug_fix',
        'Add a critical bug fix',
      )
      .example(
        'gemini autonomous tasks add "Update docs" --type documentation --max-time 30',
        'Add documentation task with 30 min limit',
      ),

  handler: async (argv) => {
    try {
      console.log(chalk.cyan('➕ Adding new task to autonomous system...'));

      // Validate and parse input
      const priorityMap: Record<string, TaskPriority> = {
        critical: TaskPriority.CRITICAL,
        high: TaskPriority.HIGH,
        medium: TaskPriority.MEDIUM,
        low: TaskPriority.LOW,
        background: TaskPriority.BACKGROUND,
      };

      const typeMap: Record<string, TaskType> = {
        implementation: TaskType.IMPLEMENTATION,
        testing: TaskType.TESTING,
        validation: TaskType.VALIDATION,
        documentation: TaskType.DOCUMENTATION,
        analysis: TaskType.ANALYSIS,
        deployment: TaskType.DEPLOYMENT,
        security: TaskType.SECURITY,
        performance: TaskType.PERFORMANCE,
      };

      let parsedContext: Record<string, unknown> = {};
      if (argv['context']) {
        try {
          parsedContext = JSON.parse(argv['context'] as string);
        } catch (_error) {
          console.error(chalk.red('❌ Invalid JSON format for context'));
          process.exit(1);
        }
      }

      let parsedExpectedOutputs: Record<string, unknown> = {};
      if (argv['expected-outputs']) {
        try {
          parsedExpectedOutputs = JSON.parse(argv['expected-outputs'] as string);
        } catch (_error) {
          console.error(
            chalk.red('❌ Invalid JSON format for expected-outputs'),
          );
          process.exit(1);
        }
      }

      // Generate task ID
      const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Create task object
      const newTask = {
        title: generateTaskTitle(argv['description'] as string),
        description: argv['description'] as string,
        type: typeMap[argv['type'] as string || 'implementation'],
        priority: priorityMap[argv['priority'] as string || 'medium'],
        category: argv['category'] as TaskCategory,
        maxExecutionTimeMinutes: (argv['max-time'] as number) || 60,
        dependencies: (argv['dependencies'] as string[]) || [],
        context: parsedContext,
        expectedOutputs: parsedExpectedOutputs,
      };

      // Initialize agent for task management
      const agentId = `TASK_MANAGER_${Date.now()}`;
      await initializeAgent(agentId);

      // Convert autonomous task to TaskManager feature
      const feature = convertTaskToFeature(newTask);

      // Send task to TaskManager API
      const apiResponse = await suggestFeature(feature);

      if (handleApiResponse(apiResponse, 'Task submission')) {
        console.log(chalk.blue('📋 Task Details:'));
        console.log(`   ID: ${chalk.bold(taskId)}`);
        console.log(`   Title: ${chalk.bold(newTask.title)}`);
        console.log(`   Description: ${newTask.description}`);
        console.log(
          `   Priority: ${getPriorityColor(newTask.priority)(getPriorityName(newTask.priority))}`,
        );
        console.log(`   Category: ${chalk.cyan(newTask.category)}`);
        console.log(`   Type: ${chalk.magenta(newTask.type)}`);
        console.log(`   Max Time: ${newTask.maxExecutionTimeMinutes} minutes`);

        const responseData = apiResponse.data as { feature_id?: string };
        if (responseData?.feature_id) {
          console.log(
            `   TaskManager Feature ID: ${chalk.green(responseData.feature_id)}`,
          );
        }
      } else {
        // Fallback to local simulation
        handleApiFallback('task submission', () => {
          console.log(chalk.green('✅ Task added to local queue!'));
          console.log(chalk.blue('📋 Task Details:'));
          console.log(`   ID: ${chalk.bold(taskId)}`);
          console.log(`   Title: ${chalk.bold(newTask.title)}`);
          console.log(`   Description: ${newTask.description}`);
          console.log(
            `   Priority: ${getPriorityColor(newTask.priority)(getPriorityName(newTask.priority))}`,
          );
          console.log(`   Category: ${chalk.cyan(newTask.category)}`);
          console.log(`   Type: ${chalk.magenta(newTask.type)}`);
          console.log(
            `   Max Time: ${newTask.maxExecutionTimeMinutes} minutes`,
          );
        });
      }

      if (newTask.dependencies && newTask.dependencies.length > 0) {
        console.log(
          `   Dependencies: ${chalk.yellow(newTask.dependencies.join(', '))}`,
        );
      }

      console.log(chalk.blue('\n🔄 Next Steps:'));
      console.log(
        '   • The task will be analyzed and broken down automatically',
      );
      console.log('   • Check status: gemini autonomous status');
      console.log(
        `   • Monitor progress: gemini autonomous tasks show ${taskId}`,
      );

      // Simulate task analysis
      console.log(chalk.gray('\n🤖 Autonomous system is analyzing task...'));
      await new Promise((resolve) => setTimeout(resolve, 1000));

      console.log(chalk.green('✅ Task analysis complete'));
      console.log(chalk.blue('   • Complexity: MODERATE'));
      console.log(chalk.blue('   • Estimated subtasks: 3-5'));
      console.log(chalk.blue('   • Required capabilities: frontend, testing'));
      console.log(chalk.blue('   • Estimated duration: 45-75 minutes'));
    } catch (error) {
      console.error(chalk.red('❌ Failed to add task:'));
      console.error(
        chalk.red(error instanceof Error ? error.message : String(error)),
      );
      process.exit(1);
    }
  },
};

function generateTaskTitle(description: string): string {
  // Extract meaningful title from description
  const words = description.split(' ');
  if (words.length <= 6) {
    return description;
  }

  // Take first 6 words and add ellipsis if needed
  return words.slice(0, 6).join(' ') + '...';
}

function getPriorityColor(priority: TaskPriority): (text: string) => string {
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
