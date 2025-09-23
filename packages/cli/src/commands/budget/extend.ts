/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { CommandModule } from 'yargs';
import { loadSettings } from '../../config/settings.js';
import { createBudgetTracker } from '@google/gemini-cli-core';

interface ExtendCommandArgs {
  amount: number;
  confirm?: boolean;
}

export const extendCommand: CommandModule<object, ExtendCommandArgs> = {
  command: 'extend <amount>',
  describe: "Temporarily extend today's budget limit",
  builder: (yargs) =>
    yargs
      .positional('amount', {
        describe: 'Number of additional requests to allow for today',
        type: 'number',
        demandOption: true,
      })
      .option('confirm', {
        describe: 'Skip confirmation prompt',
        type: 'boolean',
        default: false,
      })
      .example('gemini budget extend 50', "Add 50 requests to today's limit")
      .example(
        'gemini budget extend 25 --confirm',
        'Add 25 requests without confirmation',
      ),

  handler: async (args) => {
    const { amount, confirm } = args;

    // Validate amount
    if (amount <= 0) {
      console.error('Error: Extension amount must be a positive number.');
      process.exit(1);
    }

    if (amount > 1000) {
      console.error(
        'Error: Extension amount cannot exceed 1000 requests at once.',
      );
      process.exit(1);
    }

    try {
      const settings = loadSettings(process.cwd());
      const budgetSettings = settings.merged.budget || {};
      const projectRoot = process.cwd();

      const tracker = createBudgetTracker(projectRoot, budgetSettings);

      if (!tracker.isEnabled()) {
        console.log('Budget tracking is not enabled for this project.');
        console.log(
          'Use "gemini budget set <limit>" to enable budget tracking.',
        );
        return;
      }

      // Get current stats before extension
      const statsBefore = await tracker.getUsageStats();

      // Confirmation prompt (unless --confirm is used)
      if (!confirm) {
        console.log(`Current limit: ${statsBefore.dailyLimit} requests`);
        console.log(
          `Current usage: ${statsBefore.requestCount}/${statsBefore.dailyLimit} requests`,
        );
        console.log(`Remaining: ${statsBefore.remainingRequests} requests`);
        console.log('');
        console.log(
          `⚠️  This will temporarily add ${amount} requests to today's limit.`,
        );
        console.log(
          `New limit for today: ${statsBefore.dailyLimit + amount} requests`,
        );
        console.log('');
        console.log(
          '⚠️  Note: This extension only applies to today and will reset tomorrow.',
        );
        console.log('Are you sure you want to continue? (y/N)');

        // Simple confirmation logic
        const readline = await import('node:readline/promises');
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout,
        });

        try {
          const answer = await rl.question('');
          rl.close();

          if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
            console.log('Extension cancelled.');
            return;
          }
        } catch (_error) {
          rl.close();
          console.log('Extension cancelled.');
          return;
        }
      }

      // Perform the extension
      await tracker.extendDailyLimit(amount);

      // Get stats after extension to confirm
      const statsAfter = await tracker.getUsageStats();

      console.log('✅ Budget extended successfully!');
      console.log('');
      console.log(`   Previous limit: ${statsBefore.dailyLimit} requests`);
      console.log(
        `   New limit (today only): ${statsAfter.dailyLimit} requests`,
      );
      console.log(`   Additional requests: +${amount} requests`);
      console.log(
        `   Current usage: ${statsAfter.requestCount}/${statsAfter.dailyLimit} requests`,
      );
      console.log(`   Available now: ${statsAfter.remainingRequests} requests`);
      console.log('');
      console.log(
        '⏰ This extension applies only to today and will reset tomorrow.',
      );
      console.log(
        '💡 To permanently change your limit, use "gemini budget set <limit>".',
      );
    } catch (error) {
      console.error('Error extending budget:', error);
      process.exit(1);
    }
  },
};
