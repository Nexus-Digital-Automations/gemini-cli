/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { loadSettings } from '../../config/settings.js';
import { createBudgetTracker } from '@google/gemini-cli-core';
/**
 * Yargs command module for displaying budget status and usage
 *
 * This command provides comprehensive budget information including:
 * - Current usage statistics (requests made, remaining, percentage)
 * - Budget configuration (daily limit, reset time)
 * - Visual progress indicator and status warnings
 * - JSON output option for programmatic use
 * - Helpful tips and next steps based on current usage
 *
 * The command handles both enabled and disabled budget states gracefully
 * and provides actionable guidance for budget management.
 */
export const getCommand = {
  command: 'get',
  describe: 'Show current budget status and usage',
  builder: (yargs) =>
    yargs
      .option('json', {
        describe: 'Output in JSON format',
        type: 'boolean',
        default: false,
      })
      .example('gemini budget get', 'Show budget status')
      .example('gemini budget get --json', 'Show budget status in JSON format'),
  handler: async (args) => {
    try {
      const settings = loadSettings(process.cwd());
      const budgetSettings = settings.merged.budget || {};
      const projectRoot = process.cwd();
      const tracker = createBudgetTracker(projectRoot, budgetSettings);
      if (!tracker.isEnabled()) {
        if (args.json) {
          console.log(
            JSON.stringify(
              {
                enabled: false,
                message: 'Budget tracking is disabled',
              },
              null,
              2,
            ),
          );
        } else {
          console.log('📊 Budget Status: Disabled');
          console.log('');
          console.log('Budget tracking is not enabled for this project.');
          console.log(
            'Use "gemini budget set <limit>" to enable budget tracking.',
          );
        }
        return;
      }
      const stats = await tracker.getUsageStats();
      const budgetConfig = tracker.getBudgetSettings();
      if (args.json) {
        console.log(
          JSON.stringify(
            {
              enabled: true,
              ...stats,
              settings: budgetConfig,
            },
            null,
            2,
          ),
        );
      } else {
        console.log('📊 Budget Status');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(
          `   Status: ${tracker.isEnabled() ? '✅ Enabled' : '❌ Disabled'}`,
        );
        console.log(`   Daily Limit: ${stats.dailyLimit} requests`);
        console.log(`   Used Today: ${stats.requestCount} requests`);
        console.log(`   Remaining: ${stats.remainingRequests} requests`);
        console.log(`   Usage: ${stats.usagePercentage.toFixed(1)}%`);
        console.log(`   Reset Time: ${budgetConfig.resetTime || '00:00'}`);
        console.log(`   Next Reset: ${stats.timeUntilReset}`);
        // Progress bar
        const barLength = 30;
        const filledLength = Math.round(
          (stats.usagePercentage / 100) * barLength,
        );
        const bar =
          '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);
        console.log(
          `   Progress: [${bar}] ${stats.usagePercentage.toFixed(1)}%`,
        );
        // Status indicator
        console.log('');
        if (stats.remainingRequests === 0) {
          console.log('⚠️  Budget exceeded! No requests remaining today.');
          console.log(
            '   Use "gemini budget extend <amount>" to temporarily increase your limit.',
          );
        } else if (stats.usagePercentage >= 90) {
          console.log("🔶 Warning: You're approaching your daily limit.");
        } else if (stats.usagePercentage >= 75) {
          console.log("💡 Notice: You've used 75% of your daily budget.");
        } else {
          console.log("✅ You're within your daily budget.");
        }
        console.log('');
        console.log(
          '💡 Tip: Use "gemini budget set <limit>" to adjust your daily limit.',
        );
      }
    } catch (error) {
      console.error('Error retrieving budget status:', error);
      process.exit(1);
    }
  },
};
//# sourceMappingURL=get.js.map
