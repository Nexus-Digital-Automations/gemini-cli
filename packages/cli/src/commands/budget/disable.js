/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { loadSettings, SettingScope } from '../../config/settings.js';
export const disableCommand = {
  command: 'disable',
  describe: 'Disable budget tracking',
  builder: (yargs) =>
    yargs
      .option('scope', {
        describe: 'Scope for the budget setting',
        choices: ['user', 'project'],
        default: 'project',
      })
      .option('confirm', {
        describe: 'Skip confirmation prompt',
        type: 'boolean',
        default: false,
      })
      .example(
        'gemini budget disable',
        'Disable budget tracking for this project',
      )
      .example(
        'gemini budget disable --scope user',
        'Disable budget tracking globally',
      )
      .example(
        'gemini budget disable --confirm',
        'Disable without confirmation',
      ),
  handler: async (args) => {
    const { scope, confirm } = args;
    try {
      const settings = loadSettings(process.cwd());
      const inHome = settings.workspace.path === settings.user.path;
      if (scope === 'project' && inHome) {
        console.error(
          'Error: Please use --scope user to edit settings in the home directory.',
        );
        process.exit(1);
      }
      const settingsScope =
        scope === 'user' ? SettingScope.User : SettingScope.Workspace;
      const currentBudgetSettings = settings.merged.budget || {};
      // Check if already disabled
      if (!currentBudgetSettings.enabled) {
        console.log('✅ Budget tracking is already disabled.');
        return;
      }
      // Confirmation prompt (unless --confirm is used)
      if (!confirm) {
        console.log(
          '⚠️  This will disable budget tracking and allow unlimited API requests.',
        );
        console.log('');
        console.log(`   Current settings (${scope} scope):`);
        if (currentBudgetSettings.dailyLimit) {
          console.log(
            `   - Daily limit: ${currentBudgetSettings.dailyLimit} requests`,
          );
        }
        if (currentBudgetSettings.resetTime) {
          console.log(`   - Reset time: ${currentBudgetSettings.resetTime}`);
        }
        console.log('');
        console.log(
          'These settings will be preserved but budget enforcement will be disabled.',
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
            console.log('Disable cancelled.');
            return;
          }
        } catch (_error) {
          rl.close();
          console.log('Disable cancelled.');
          return;
        }
      }
      // Disable budget tracking
      settings.setValue(settingsScope, 'budget.enabled', false);
      // Save settings
      await settings.save();
      console.log('✅ Budget tracking disabled successfully!');
      console.log('');
      console.log(`   Scope: ${scope}`);
      console.log('   Status: Budget enforcement is now disabled');
      console.log('');
      console.log(
        '⚠️  API requests will no longer be limited by daily budget.',
      );
      console.log(
        '💡 Use "gemini budget enable" to re-enable budget tracking.',
      );
      console.log(
        '💡 Your budget settings have been preserved and will be restored when re-enabled.',
      );
    } catch (error) {
      console.error('Error disabling budget tracking:', error);
      process.exit(1);
    }
  },
};
//# sourceMappingURL=disable.js.map
