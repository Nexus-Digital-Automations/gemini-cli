/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { CommandModule } from 'yargs';
import { loadSettings } from '../../config/settings.js';
import { createBudgetTracker } from '@google/gemini-cli-core';

interface ResetCommandArgs {
  confirm?: boolean;
}

export const resetCommand: CommandModule<object, ResetCommandArgs> = {
  command: 'reset',
  describe: "Reset today's usage count to zero",
  builder: (yargs) =>
    yargs
      .option('confirm', {
        describe: 'Skip confirmation prompt',
        type: 'boolean',
        default: false,
      })
      .example('gemini budget reset', 'Reset usage count with confirmation')
      .example(
        'gemini budget reset --confirm',
        'Reset usage count without confirmation',
      ),

  handler: async (args) => {
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

      // Get current stats before reset
      const statsBefore = await tracker.getUsageStats();

      if (statsBefore.requestCount === 0) {
        console.log('✅ Usage count is already at zero. No reset needed.');
        return;
      }

      // Confirmation prompt (unless --confirm is used)
      if (!args.confirm) {
        console.log(
          `Current usage: ${statsBefore.requestCount}/${statsBefore.dailyLimit} requests`,
        );
        console.log('');
        console.log('⚠️  This will reset your usage count to zero for today.');
        console.log('Are you sure you want to continue? (y/N)');

        // Simple confirmation logic (in a real implementation, you'd use a proper prompt library)
        const readline = await import('node:readline/promises');
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout,
        });

        try {
          const answer = await rl.question('');
          rl.close();

          if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
            console.log('Reset cancelled.');
            return;
          }
        } catch (_error) {
          rl.close();
          console.log('Reset cancelled.');
          return;
        }
      }

      // Perform the reset
      await tracker.resetDailyUsage();

      // Get stats after reset to confirm
      const statsAfter = await tracker.getUsageStats();

      console.log('✅ Budget reset successfully!');
      console.log('');
      console.log(
        `   Before: ${statsBefore.requestCount}/${statsBefore.dailyLimit} requests used`,
      );
      console.log(
        `   After:  ${statsAfter.requestCount}/${statsAfter.dailyLimit} requests used`,
      );
      console.log(`   Available: ${statsAfter.remainingRequests} requests`);
      console.log('');
      console.log('Your usage counter has been reset to zero for today.');
    } catch (error) {
      console.error('Error resetting budget:', error);
      process.exit(1);
    }
  },
};
