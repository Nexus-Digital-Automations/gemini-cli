/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { mockCommandContext } from '../../../test-utils/mockCommandContext.js';
import { budgetCommand } from '../../../commands/budget.js';
import { getCommand } from '../get.js';
import { setCommand } from '../set.js';
import { resetCommand } from '../reset.js';
import { enableCommand } from '../enable.js';
import { disableCommand } from '../disable.js';
import { extendCommand } from '../extend.js';
// Mock file system operations
vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
  mkdir: vi.fn(),
  access: vi.fn(),
  unlink: vi.fn(),
}));
// Mock config and settings
const mockConfig = {
  getProjectRoot: vi.fn().mockReturnValue('/test/project'),
  getSettings: vi.fn(),
  updateSettings: vi.fn(),
  getBudgetSettings: vi.fn(),
};
const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
describe('Budget CLI Integration Tests', () => {
  let testProjectRoot;
  let mockBudgetSettings;
  let mockUsageData;
  beforeEach(() => {
    vi.clearAllMocks();
    consoleSpy.mockClear();
    consoleErrorSpy.mockClear();
    testProjectRoot = '/test/project';
    mockBudgetSettings = {
      enabled: true,
      dailyLimit: 100,
      resetTime: '00:00',
      warningThresholds: [50, 75, 90],
    };
    mockUsageData = {
      date: new Date().toISOString().split('T')[0],
      requestCount: 25,
      lastResetTime: new Date().toISOString(),
      warningsShown: [],
    };
    // Default mock implementations
    vi.mocked(fs.mkdir).mockResolvedValue(undefined);
    vi.mocked(fs.writeFile).mockResolvedValue();
    vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockUsageData));
    vi.mocked(fs.access).mockResolvedValue(undefined);
    mockConfig.getBudgetSettings = vi.fn().mockReturnValue(mockBudgetSettings);
    mockConfig.getSettings = vi
      .fn()
      .mockReturnValue({ budget: mockBudgetSettings });
    mockConfig.updateSettings = vi.fn();
  });
  afterEach(() => {
    consoleSpy.mockClear();
    consoleErrorSpy.mockClear();
  });
  describe('Main Budget Command', () => {
    it('should display help when no subcommand provided', async () => {
      const context = mockCommandContext({
        config: mockConfig,
        args: [],
      });
      await budgetCommand(context);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Manage API request budget limits'),
      );
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('get'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('set'));
    });
    it('should display help for invalid subcommand', async () => {
      const context = mockCommandContext({
        config: mockConfig,
        args: ['invalid-command'],
      });
      await budgetCommand(context);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Unknown budget command'),
      );
    });
    it('should delegate to get command', async () => {
      const context = mockCommandContext({
        config: mockConfig,
        args: ['get'],
      });
      await budgetCommand(context);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Budget Status'),
      );
    });
  });
  describe('Budget Get Command', () => {
    it('should display current budget status when enabled', async () => {
      const context = mockCommandContext({
        config: mockConfig,
        args: [],
      });
      await getCommand(context);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Budget Status: ✅ Enabled'),
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Daily Limit: 100 requests'),
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Usage: 25/100 (25.0%)'),
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Remaining: 75 requests'),
      );
    });
    it('should display disabled status when budget is disabled', async () => {
      mockConfig.getBudgetSettings = vi.fn().mockReturnValue({
        ...mockBudgetSettings,
        enabled: false,
      });
      const context = mockCommandContext({
        config: mockConfig,
        args: [],
      });
      await getCommand(context);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Budget Status: ❌ Disabled'),
      );
    });
    it('should show over budget status', async () => {
      vi.mocked(fs.readFile).mockResolvedValue(
        JSON.stringify({
          ...mockUsageData,
          requestCount: 105,
        }),
      );
      const context = mockCommandContext({
        config: mockConfig,
        args: [],
      });
      await getCommand(context);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Usage: 105/100 (105.0%) ⚠️  Over Budget!'),
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Remaining: 0 requests'),
      );
    });
    it('should handle missing usage file gracefully', async () => {
      vi.mocked(fs.readFile).mockRejectedValue(new Error('File not found'));
      const context = mockCommandContext({
        config: mockConfig,
        args: [],
      });
      await getCommand(context);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Usage: 0/100 (0.0%)'),
      );
    });
    it('should show detailed information with --verbose flag', async () => {
      const context = mockCommandContext({
        config: mockConfig,
        args: ['--verbose'],
      });
      await getCommand(context);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Reset Time: 00:00'),
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Warning Thresholds: 50%, 75%, 90%'),
      );
    });
  });
  describe('Budget Set Command', () => {
    it('should set daily limit successfully', async () => {
      const context = mockCommandContext({
        config: mockConfig,
        args: ['150'],
      });
      await setCommand(context);
      expect(mockConfig.updateSettings).toHaveBeenCalledWith({
        budget: {
          ...mockBudgetSettings,
          dailyLimit: 150,
        },
      });
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Daily budget limit set to 150 requests'),
      );
    });
    it('should reject invalid limit values', async () => {
      const context = mockCommandContext({
        config: mockConfig,
        args: ['-10'],
      });
      await setCommand(context);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Budget limit must be a positive number'),
      );
      expect(mockConfig.updateSettings).not.toHaveBeenCalled();
    });
    it('should reject non-numeric limit values', async () => {
      const context = mockCommandContext({
        config: mockConfig,
        args: ['abc'],
      });
      await setCommand(context);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Budget limit must be a positive number'),
      );
      expect(mockConfig.updateSettings).not.toHaveBeenCalled();
    });
    it('should enable budget when setting limit', async () => {
      mockConfig.getBudgetSettings = vi.fn().mockReturnValue({
        ...mockBudgetSettings,
        enabled: false,
      });
      const context = mockCommandContext({
        config: mockConfig,
        args: ['200'],
      });
      await setCommand(context);
      expect(mockConfig.updateSettings).toHaveBeenCalledWith({
        budget: {
          ...mockBudgetSettings,
          enabled: true,
          dailyLimit: 200,
        },
      });
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Budget tracking has been enabled'),
      );
    });
    it('should handle missing argument gracefully', async () => {
      const context = mockCommandContext({
        config: mockConfig,
        args: [],
      });
      await setCommand(context);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Please provide a budget limit'),
      );
      expect(mockConfig.updateSettings).not.toHaveBeenCalled();
    });
  });
  describe('Budget Enable Command', () => {
    it('should enable budget tracking', async () => {
      mockConfig.getBudgetSettings = vi.fn().mockReturnValue({
        ...mockBudgetSettings,
        enabled: false,
      });
      const context = mockCommandContext({
        config: mockConfig,
        args: [],
      });
      await enableCommand(context);
      expect(mockConfig.updateSettings).toHaveBeenCalledWith({
        budget: {
          ...mockBudgetSettings,
          enabled: true,
        },
      });
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Budget tracking has been enabled'),
      );
    });
    it('should set default limit when no limit configured', async () => {
      mockConfig.getBudgetSettings = vi.fn().mockReturnValue({
        enabled: false,
        dailyLimit: undefined,
      });
      const context = mockCommandContext({
        config: mockConfig,
        args: [],
      });
      await enableCommand(context);
      expect(mockConfig.updateSettings).toHaveBeenCalledWith({
        budget: expect.objectContaining({
          enabled: true,
          dailyLimit: expect.any(Number),
        }),
      });
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Budget tracking has been enabled'),
      );
    });
    it('should inform when budget is already enabled', async () => {
      const context = mockCommandContext({
        config: mockConfig,
        args: [],
      });
      await enableCommand(context);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Budget tracking is already enabled'),
      );
      expect(mockConfig.updateSettings).not.toHaveBeenCalled();
    });
  });
  describe('Budget Disable Command', () => {
    it('should disable budget tracking', async () => {
      const context = mockCommandContext({
        config: mockConfig,
        args: [],
      });
      await disableCommand(context);
      expect(mockConfig.updateSettings).toHaveBeenCalledWith({
        budget: {
          ...mockBudgetSettings,
          enabled: false,
        },
      });
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Budget tracking has been disabled'),
      );
    });
    it('should inform when budget is already disabled', async () => {
      mockConfig.getBudgetSettings = vi.fn().mockReturnValue({
        ...mockBudgetSettings,
        enabled: false,
      });
      const context = mockCommandContext({
        config: mockConfig,
        args: [],
      });
      await disableCommand(context);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Budget tracking is already disabled'),
      );
      expect(mockConfig.updateSettings).not.toHaveBeenCalled();
    });
  });
  describe('Budget Reset Command', () => {
    it('should reset usage data successfully', async () => {
      const context = mockCommandContext({
        config: mockConfig,
        args: [],
      });
      await resetCommand(context);
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('budget-usage.json'),
        expect.stringContaining('"requestCount":0'),
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Budget usage has been reset'),
      );
    });
    it('should handle reset when budget is disabled', async () => {
      mockConfig.getBudgetSettings = vi.fn().mockReturnValue({
        ...mockBudgetSettings,
        enabled: false,
      });
      const context = mockCommandContext({
        config: mockConfig,
        args: [],
      });
      await resetCommand(context);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Budget tracking is not enabled'),
      );
      expect(fs.writeFile).not.toHaveBeenCalled();
    });
    it('should handle file system errors gracefully', async () => {
      vi.mocked(fs.writeFile).mockRejectedValue(new Error('Write failed'));
      const context = mockCommandContext({
        config: mockConfig,
        args: [],
      });
      await resetCommand(context);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to reset budget usage'),
      );
    });
    it('should confirm reset with --confirm flag', async () => {
      const context = mockCommandContext({
        config: mockConfig,
        args: ['--confirm'],
      });
      await resetCommand(context);
      expect(fs.writeFile).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Budget usage has been reset'),
      );
    });
  });
  describe('Budget Extend Command', () => {
    it('should extend daily limit successfully', async () => {
      const context = mockCommandContext({
        config: mockConfig,
        args: ['50'],
      });
      await extendCommand(context);
      expect(mockConfig.updateSettings).toHaveBeenCalledWith({
        budget: {
          ...mockBudgetSettings,
          dailyLimit: 150, // 100 + 50
        },
      });
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Daily budget extended by 50 requests'),
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('New limit: 150 requests'),
      );
    });
    it('should reject invalid extension amounts', async () => {
      const context = mockCommandContext({
        config: mockConfig,
        args: ['-10'],
      });
      await extendCommand(context);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Extension amount must be a positive number'),
      );
      expect(mockConfig.updateSettings).not.toHaveBeenCalled();
    });
    it('should handle budget disabled state', async () => {
      mockConfig.getBudgetSettings = vi.fn().mockReturnValue({
        ...mockBudgetSettings,
        enabled: false,
      });
      const context = mockCommandContext({
        config: mockConfig,
        args: ['50'],
      });
      await extendCommand(context);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Budget tracking is not enabled'),
      );
      expect(mockConfig.updateSettings).not.toHaveBeenCalled();
    });
    it('should handle missing argument gracefully', async () => {
      const context = mockCommandContext({
        config: mockConfig,
        args: [],
      });
      await extendCommand(context);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Please provide an extension amount'),
      );
      expect(mockConfig.updateSettings).not.toHaveBeenCalled();
    });
    it('should warn when extending over budget', async () => {
      vi.mocked(fs.readFile).mockResolvedValue(
        JSON.stringify({
          ...mockUsageData,
          requestCount: 120, // Already over budget
        }),
      );
      const context = mockCommandContext({
        config: mockConfig,
        args: ['20'],
      });
      await extendCommand(context);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Note: You are currently over your budget'),
      );
      expect(mockConfig.updateSettings).toHaveBeenCalledWith({
        budget: {
          ...mockBudgetSettings,
          dailyLimit: 120, // 100 + 20
        },
      });
    });
  });
  describe('Command Integration Workflows', () => {
    it('should complete full budget setup workflow', async () => {
      // Start with disabled budget
      mockConfig.getBudgetSettings = vi.fn().mockReturnValue({
        enabled: false,
        dailyLimit: undefined,
      });
      // 1. Enable budget
      const enableContext = mockCommandContext({
        config: mockConfig,
        args: [],
      });
      await enableCommand(enableContext);
      // 2. Set daily limit
      mockConfig.getBudgetSettings = vi.fn().mockReturnValue({
        enabled: true,
        dailyLimit: 100,
      });
      const setContext = mockCommandContext({
        config: mockConfig,
        args: ['150'],
      });
      await setCommand(setContext);
      // 3. Check status
      const getContext = mockCommandContext({
        config: mockConfig,
        args: [],
      });
      await getCommand(getContext);
      // Verify all commands executed successfully
      expect(mockConfig.updateSettings).toHaveBeenCalledTimes(2);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Budget tracking has been enabled'),
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Daily budget limit set to 150'),
      );
    });
    it('should handle budget exceeded scenario with extend', async () => {
      // Set up over budget scenario
      vi.mocked(fs.readFile).mockResolvedValue(
        JSON.stringify({
          ...mockUsageData,
          requestCount: 105,
        }),
      );
      // 1. Check over budget status
      const getContext = mockCommandContext({
        config: mockConfig,
        args: [],
      });
      await getCommand(getContext);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Over Budget!'),
      );
      // 2. Extend budget
      const extendContext = mockCommandContext({
        config: mockConfig,
        args: ['50'],
      });
      await extendCommand(extendContext);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Daily budget extended by 50'),
      );
      // 3. Verify new status would be under budget
      mockConfig.getBudgetSettings = vi.fn().mockReturnValue({
        ...mockBudgetSettings,
        dailyLimit: 150,
      });
      const finalGetContext = mockCommandContext({
        config: mockConfig,
        args: [],
      });
      await getCommand(finalGetContext);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Usage: 105/150'),
      );
    });
    it('should handle reset and reconfiguration workflow', async () => {
      // 1. Reset usage data
      const resetContext = mockCommandContext({
        config: mockConfig,
        args: ['--confirm'],
      });
      await resetCommand(resetContext);
      // 2. Reconfigure with new limit
      const setContext = mockCommandContext({
        config: mockConfig,
        args: ['200'],
      });
      await setCommand(setContext);
      // 3. Verify clean state
      vi.mocked(fs.readFile).mockResolvedValue(
        JSON.stringify({
          date: new Date().toISOString().split('T')[0],
          requestCount: 0,
          lastResetTime: new Date().toISOString(),
          warningsShown: [],
        }),
      );
      mockConfig.getBudgetSettings = vi.fn().mockReturnValue({
        ...mockBudgetSettings,
        dailyLimit: 200,
      });
      const getContext = mockCommandContext({
        config: mockConfig,
        args: [],
      });
      await getContext(getCommand);
      expect(fs.writeFile).toHaveBeenCalled(); // Reset file operation
      expect(mockConfig.updateSettings).toHaveBeenCalledWith({
        budget: {
          ...mockBudgetSettings,
          dailyLimit: 200,
        },
      });
    });
  });
  describe('Error Handling and Edge Cases', () => {
    it('should handle config read errors gracefully', async () => {
      mockConfig.getBudgetSettings = vi.fn().mockImplementation(() => {
        throw new Error('Config read failed');
      });
      const context = mockCommandContext({
        config: mockConfig,
        args: [],
      });
      await getCommand(context);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to retrieve budget settings'),
      );
    });
    it('should handle config update errors gracefully', async () => {
      mockConfig.updateSettings = vi.fn().mockImplementation(() => {
        throw new Error('Config update failed');
      });
      const context = mockCommandContext({
        config: mockConfig,
        args: ['150'],
      });
      await setCommand(context);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to update budget settings'),
      );
    });
    it('should handle usage file corruption gracefully', async () => {
      vi.mocked(fs.readFile).mockResolvedValue('invalid json');
      const context = mockCommandContext({
        config: mockConfig,
        args: [],
      });
      await getCommand(context);
      // Should fall back to default values
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Usage: 0/100'),
      );
    });
    it('should handle permission errors when writing files', async () => {
      vi.mocked(fs.mkdir).mockRejectedValue(new Error('Permission denied'));
      const context = mockCommandContext({
        config: mockConfig,
        args: [],
      });
      await resetCommand(context);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to reset budget usage'),
      );
    });
    it('should handle extreme numeric values', async () => {
      const context = mockCommandContext({
        config: mockConfig,
        args: [Number.MAX_SAFE_INTEGER.toString()],
      });
      await setCommand(context);
      expect(mockConfig.updateSettings).toHaveBeenCalledWith({
        budget: {
          ...mockBudgetSettings,
          dailyLimit: Number.MAX_SAFE_INTEGER,
        },
      });
    });
    it('should handle float values by rounding down', async () => {
      const context = mockCommandContext({
        config: mockConfig,
        args: ['150.75'],
      });
      await setCommand(context);
      expect(mockConfig.updateSettings).toHaveBeenCalledWith({
        budget: {
          ...mockBudgetSettings,
          dailyLimit: 150, // Should be rounded down
        },
      });
    });
    it('should handle concurrent command execution safely', async () => {
      const contexts = Array.from({ length: 5 }, () =>
        mockCommandContext({
          config: mockConfig,
          args: [],
        }),
      );
      // Execute multiple get commands concurrently
      const promises = contexts.map((context) => getCommand(context));
      await Promise.all(promises);
      // Should not cause any errors or race conditions
      expect(consoleSpy).toHaveBeenCalledTimes(contexts.length * 5); // Each get command logs ~5 lines
    });
  });
  describe('Command Help and Documentation', () => {
    it('should provide help for individual commands', async () => {
      const commands = [
        getCommand,
        setCommand,
        resetCommand,
        enableCommand,
        disableCommand,
        extendCommand,
      ];
      for (const command of commands) {
        const context = mockCommandContext({
          config: mockConfig,
          args: ['--help'],
        });
        await command(context);
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('Usage:'),
        );
      }
    });
    it('should display command descriptions correctly', async () => {
      const context = mockCommandContext({
        config: mockConfig,
        args: [],
      });
      await budgetCommand(context);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Available commands:'),
      );
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('get'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('set'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('reset'));
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('enable'),
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('disable'),
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('extend'),
      );
    });
  });
});
//# sourceMappingURL=integration.test.js.map
