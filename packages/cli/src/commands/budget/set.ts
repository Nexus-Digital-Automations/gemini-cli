/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { CommandModule } from 'yargs';
import { loadSettings, SettingScope } from '../../config/settings.js';

interface SetCommandArgs {
  limit: number;
  'reset-time'?: string;
  scope: 'user' | 'project';
}

export const setCommand: CommandModule<{}, SetCommandArgs> = {
  command: 'set <limit>',
  describe: 'Set the daily API request budget limit',
  builder: (yargs) =>
    yargs
      .positional('limit', {
        describe: 'Daily request limit (number of requests)',
        type: 'number',
        demandOption: true,
      })
      .option('reset-time', {
        describe: 'Time when budget resets daily (HH:MM format)',
        type: 'string',
        default: undefined,
      })
      .option('scope', {
        describe: 'Scope for the budget setting',
        choices: ['user', 'project'] as const,
        default: 'project' as const,
      })
      .example('gemini budget set 200', 'Set daily limit to 200 requests')
      .example('gemini budget set 100 --reset-time 06:00', 'Set limit to 100 requests, reset at 6 AM')
      .example('gemini budget set 500 --scope user', 'Set user-level limit to 500 requests'),

  handler: async (args) => {
    const { limit, 'reset-time': resetTime, scope } = args;

    // Validate limit
    if (limit < 0) {
      console.error('Error: Budget limit must be a positive number.');
      process.exit(1);
    }

    if (limit === 0) {
      console.error('Error: Budget limit cannot be zero. Use "gemini budget disable" to disable budget tracking.');
      process.exit(1);
    }

    // Validate reset time format if provided
    if (resetTime) {
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(resetTime)) {
        console.error('Error: Reset time must be in HH:MM format (e.g., 06:00, 14:30).');
        process.exit(1);
      }
    }

    try {
      const settings = loadSettings(process.cwd());
      const inHome = settings.workspace.path === settings.user.path;

      if (scope === 'project' && inHome) {
        console.error(
          'Error: Please use --scope user to edit settings in the home directory.'
        );
        process.exit(1);
      }

      const settingsScope = scope === 'user' ? SettingScope.User : SettingScope.Workspace;

      // Set the budget limit
      settings.setValue(settingsScope, 'budget.dailyLimit', limit);

      // Enable budget tracking when setting a limit
      settings.setValue(settingsScope, 'budget.enabled', true);

      // Set reset time if provided
      if (resetTime) {
        settings.setValue(settingsScope, 'budget.resetTime', resetTime);
      }

      // Save settings
      await settings.save();

      console.log(`✅ Budget settings updated:`);
      console.log(`   Daily limit: ${limit} requests`);
      if (resetTime) {
        console.log(`   Reset time: ${resetTime}`);
      }
      console.log(`   Scope: ${scope}`);
      console.log(`   Budget tracking: enabled`);
      console.log('');
      console.log('Use "gemini budget get" to check your current usage.');

    } catch (error) {
      console.error('Error setting budget configuration:', error);
      process.exit(1);
    }
  },
};