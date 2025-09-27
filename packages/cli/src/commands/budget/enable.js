/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { loadSettings, SettingScope } from '../../config/settings.js';
export const enableCommand = {
  command: 'enable',
  describe: 'Enable budget tracking',
  builder: (yargs) =>
    yargs
      .option('scope', {
        describe: 'Scope for the budget setting',
        choices: ['user', 'project'],
        default: 'project',
      })
      .example(
        'gemini budget enable',
        'Enable budget tracking for this project',
      )
      .example(
        'gemini budget enable --scope user',
        'Enable budget tracking globally',
      ),
  handler: async (args) => {
    const { scope } = args;
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
      // Check if already enabled
      if (currentBudgetSettings.enabled) {
        console.log('✅ Budget tracking is already enabled.');
        console.log('');
        if (currentBudgetSettings.dailyLimit) {
          console.log(
            `   Daily limit: ${currentBudgetSettings.dailyLimit} requests`,
          );
          console.log(
            `   Reset time: ${currentBudgetSettings.resetTime || '00:00'}`,
          );
        } else {
          console.log(
            '⚠️  No daily limit is set. Use "gemini budget set <limit>" to configure a limit.',
          );
        }
        return;
      }
      // Enable budget tracking
      settings.setValue(settingsScope, 'budget.enabled', true);
      // Set default limit if none exists
      if (!currentBudgetSettings.dailyLimit) {
        settings.setValue(settingsScope, 'budget.dailyLimit', 100);
        console.log(
          '🔧 No daily limit was set. Using default limit of 100 requests.',
        );
      }
      // Set default reset time if none exists
      if (!currentBudgetSettings.resetTime) {
        settings.setValue(settingsScope, 'budget.resetTime', '00:00');
      }
      // Set default warning thresholds if none exist
      if (!currentBudgetSettings.warningThresholds) {
        settings.setValue(
          settingsScope,
          'budget.warningThresholds',
          [50, 75, 90],
        );
      }
      // Save settings
      await settings.save();
      console.log('✅ Budget tracking enabled successfully!');
      console.log('');
      console.log(`   Scope: ${scope}`);
      console.log(
        `   Daily limit: ${currentBudgetSettings.dailyLimit || 100} requests`,
      );
      console.log(
        `   Reset time: ${currentBudgetSettings.resetTime || '00:00'}`,
      );
      console.log('');
      console.log('💡 Use "gemini budget get" to check your current usage.');
      console.log(
        '💡 Use "gemini budget set <limit>" to adjust your daily limit.',
      );
    } catch (error) {
      console.error('Error enabling budget tracking:', error);
      process.exit(1);
    }
  },
};
//# sourceMappingURL=enable.js.map
