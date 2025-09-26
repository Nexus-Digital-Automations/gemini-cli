/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { BudgetTracker } from '../budget-tracker.js';
import {
  BudgetEnforcement,
  BudgetExceededError,
} from '../budget-enforcement.js';
import type { BudgetSettings, BudgetUsageData } from '../types.js';
import type { Config } from '../../config/config.js';
import type { ContentGenerator } from '../../core/contentGenerator.js';
import type {
  GenerateContentParameters,
  GenerateContentResponse,
} from '@google/genai';
import { FinishReason } from '@google/genai';
import { BudgetContentGenerator } from '../../core/budgetContentGenerator.js';

// Mock file system operations for isolated testing
vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
  mkdir: vi.fn(),
  access: vi.fn(),
}));

const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

describe('Budget Analytics System - End-to-End Workflow Tests', () => {
  let projectRoot: string;
  let budgetSettings: BudgetSettings;
  let mockConfig: Config;
  let mockContentGenerator: ContentGenerator;
  let usageFilePath: string;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleSpy.mockClear();

    projectRoot = '/test/e2e/project';
    usageFilePath = path.join(projectRoot, '.gemini', 'budget-usage.json');

    budgetSettings = {
      enabled: true,
      dailyLimit: 100,
      resetTime: '00:00',
      warningThresholds: [50, 75, 90],
    };

    mockConfig = {
      getProjectRoot: vi.fn().mockReturnValue(projectRoot),
    } as unknown as Config;

    mockContentGenerator = {
      userTier: 'paid' as ContentGenerator['userTier'],
      generateContent: vi.fn(),
      generateContentStream: vi.fn(),
      countTokens: vi.fn(),
      embedContent: vi.fn(),
    };

    // Default file system mocks
    vi.mocked(fs.mkdir).mockResolvedValue(undefined);
    vi.mocked(fs.writeFile).mockResolvedValue();
    vi.mocked(fs.access).mockResolvedValue(undefined);
  });

  afterEach(() => {
    consoleSpy.mockClear();
  });

  describe('Complete Budget Lifecycle Workflow', () => {
    it('should handle complete budget setup and usage cycle', async () => {
      // 1. Initialize fresh budget system
      vi.mocked(fs.readFile).mockRejectedValueOnce(new Error('File not found'));

      const tracker = new BudgetTracker(projectRoot, budgetSettings);
      const enforcement = new BudgetEnforcement(projectRoot, budgetSettings);

      // Verify initial state
      expect(tracker.isEnabled()).toBe(true);
      expect(enforcement.isEnabled()).toBe(true);

      // 2. First API request - should create usage file
      await tracker.recordRequest();

      expect(fs.mkdir).toHaveBeenCalledWith(path.join(projectRoot, '.gemini'), {
        recursive: true,
      });
      expect(fs.writeFile).toHaveBeenCalledWith(
        usageFilePath,
        expect.stringContaining('"requestCount":1'),
      );

      // 3. Check budget status
      const mockUsageData: BudgetUsageData = {
        date: new Date().toISOString().split('T')[0],
        requestCount: 1,
        totalCost: 0.01,
        tokenUsage: {
          inputTokens: 10,
          outputTokens: 20,
          totalTokens: 30,
          tokenCosts: {
            input: 0.005,
            output: 0.005,
          },
        },
        lastResetTime: new Date().toISOString(),
        warningsShown: [],
      };

      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockUsageData));

      const stats = await tracker.getUsageStats();
      expect(stats.requestCount).toBe(1);
      expect(stats.dailyLimit).toBe(100);
      expect(stats.remainingRequests).toBe(99);
      expect(stats.usagePercentage).toBe(1);

      // 4. Simulate progressive usage
      for (let i = 2; i <= 50; i++) {
        mockUsageData.requestCount = i;
        vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockUsageData));
        await tracker.recordRequest();
      }

      // 5. Check warning threshold reached
      mockUsageData.requestCount = 50;
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockUsageData));

      const warningCheck = await tracker.shouldShowWarning();
      expect(warningCheck.show).toBe(true);
      expect(warningCheck.threshold).toBe(50);

      // 6. Continue to near budget limit
      mockUsageData.requestCount = 95;
      mockUsageData.warningsShown = [50, 75, 90];
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockUsageData));

      const nearLimitStats = await tracker.getUsageStats();
      expect(nearLimitStats.requestCount).toBe(95);
      expect(nearLimitStats.remainingRequests).toBe(5);
      expect(nearLimitStats.usagePercentage).toBe(95);

      // 7. Exceed budget
      mockUsageData.requestCount = 101;
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockUsageData));

      const isOverBudget = await tracker.isOverBudget();
      expect(isOverBudget).toBe(true);

      // 8. Budget enforcement should block requests
      const enforcementCheck = await enforcement.checkRequestAllowed();
      expect(enforcementCheck.allowed).toBe(false);
      expect(enforcementCheck.error).toBeInstanceOf(BudgetExceededError);

      // 9. Reset budget
      await tracker.resetDailyUsage();

      expect(fs.writeFile).toHaveBeenLastCalledWith(
        usageFilePath,
        expect.stringContaining('"requestCount":0'),
      );

      // 10. Verify reset state
      const resetUsageData: BudgetUsageData = {
        date: new Date().toISOString().split('T')[0],
        requestCount: 0,
        totalCost: 0,
        tokenUsage: {
          inputTokens: 0,
          outputTokens: 0,
          totalTokens: 0,
          tokenCosts: {
            input: 0,
            output: 0,
          },
        },
        lastResetTime: new Date().toISOString(),
        warningsShown: [],
      };

      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(resetUsageData));

      const resetStats = await tracker.getUsageStats();
      expect(resetStats.requestCount).toBe(0);
      expect(resetStats.remainingRequests).toBe(100);
      expect(resetStats.usagePercentage).toBe(0);

      const resetOverBudget = await tracker.isOverBudget();
      expect(resetOverBudget).toBe(false);
    });

    it('should handle budget extension workflow', async () => {
      // Start near budget limit
      const initialUsageData: BudgetUsageData = {
        date: new Date().toISOString().split('T')[0],
        requestCount: 95,
        totalCost: 0.95,
        tokenUsage: {
          inputTokens: 950,
          outputTokens: 1900,
          totalTokens: 2850,
          tokenCosts: {
            input: 0.475,
            output: 0.475,
          },
        },
        lastResetTime: new Date().toISOString(),
        warningsShown: [50, 75, 90],
      };

      vi.mocked(fs.readFile).mockResolvedValue(
        JSON.stringify(initialUsageData),
      );

      const tracker = new BudgetTracker(projectRoot, budgetSettings);
      const enforcement = new BudgetEnforcement(projectRoot, budgetSettings);

      // 1. Verify near limit
      const beforeExtensionStats = await tracker.getUsageStats();
      expect(beforeExtensionStats.requestCount).toBe(95);
      expect(beforeExtensionStats.remainingRequests).toBe(5);

      // 2. Make requests that would exceed original limit
      for (let i = 96; i <= 105; i++) {
        initialUsageData.requestCount = i;
        vi.mocked(fs.readFile).mockResolvedValue(
          JSON.stringify(initialUsageData),
        );

        if (i <= 100) {
          // Should still be allowed
          const check = await enforcement.checkRequestAllowed();
          expect(check.allowed).toBe(true);
          await enforcement.recordSuccessfulRequest();
        } else {
          // Should be blocked
          const check = await enforcement.checkRequestAllowed();
          expect(check.allowed).toBe(false);
          expect(check.error).toBeInstanceOf(BudgetExceededError);
        }
      }

      // 3. Extend budget limit
      await tracker.extendDailyLimit(50); // Extend from 100 to 150
      expect(tracker.getBudgetSettings().dailyLimit).toBe(150);

      // 4. Previously blocked requests should now be allowed
      const extendedCheck = await enforcement.checkRequestAllowed();
      expect(extendedCheck.allowed).toBe(true);

      // 5. Verify extended stats
      const extendedStats = await tracker.getUsageStats();
      expect(extendedStats.dailyLimit).toBe(150);
      expect(extendedStats.remainingRequests).toBe(45); // 150 - 105

      // 6. Continue using until new limit
      initialUsageData.requestCount = 151;
      vi.mocked(fs.readFile).mockResolvedValue(
        JSON.stringify(initialUsageData),
      );

      const newOverBudget = await tracker.isOverBudget();
      expect(newOverBudget).toBe(true);
    });

    it('should handle daily reset time workflow', async () => {
      // Set custom reset time (2 PM)
      const customSettings: BudgetSettings = {
        ...budgetSettings,
        resetTime: '14:00',
      };

      const tracker = new BudgetTracker(projectRoot, customSettings);

      // Mock current time as 1 PM (before reset time)
      const beforeResetTime = new Date('2023-12-01T13:00:00.000Z');
      vi.setSystemTime(beforeResetTime);

      const usageData: BudgetUsageData = {
        date: '2023-12-01',
        requestCount: 75,
        totalCost: 0.75,
        tokenUsage: {
          inputTokens: 750,
          outputTokens: 1500,
          totalTokens: 2250,
          tokenCosts: {
            input: 0.375,
            output: 0.375,
          },
        },
        lastResetTime: '2023-12-01T10:00:00.000Z', // Last reset at 10 AM
        warningsShown: [50],
      };

      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(usageData));

      // Record request before reset time - should increment existing count
      await tracker.recordRequest();

      expect(fs.writeFile).toHaveBeenCalledWith(
        usageFilePath,
        expect.stringContaining('"requestCount":76'),
      );

      // Mock time after reset time (3 PM)
      const afterResetTime = new Date('2023-12-01T15:00:00.000Z');
      vi.setSystemTime(afterResetTime);

      // Record request after reset time - should trigger reset first
      await tracker.recordRequest();

      // Should have been called twice: once for reset (0), once for increment (1)
      expect(fs.writeFile).toHaveBeenCalledWith(
        usageFilePath,
        expect.stringContaining('"requestCount":0'),
      );
      expect(fs.writeFile).toHaveBeenLastCalledWith(
        usageFilePath,
        expect.stringContaining('"requestCount":1'),
      );

      vi.useRealTimers();
    });
  });

  describe('BudgetContentGenerator E2E Integration', () => {
    it('should handle complete API request lifecycle with budget enforcement', async () => {
      const budgetContentGenerator = new BudgetContentGenerator(
        mockContentGenerator,
        mockConfig,
        budgetSettings,
      );

      // Mock initial empty state
      vi.mocked(fs.readFile).mockRejectedValueOnce(new Error('File not found'));

      const mockRequest: GenerateContentParameters = {
        contents: [{ parts: [{ text: 'Test prompt' }], role: 'user' }],
        model: 'gemini-1.5-flash',
      };

      const mockResponse = {
        candidates: [
          {
            content: { parts: [{ text: 'Test response' }], role: 'model' },
            finishReason: FinishReason.STOP,
            index: 0,
          },
        ],
        get text() { return 'Test response'; },
        get data() { return undefined; },
        get functionCalls() { return []; },
        get executableCode() { return undefined; },
        get codeExecutionResult() { return undefined; },
      } as GenerateContentResponse;

      mockContentGenerator.generateContent = vi
        .fn()
        .mockResolvedValue(mockResponse);

      // 1. First API call should succeed and create usage file
      const result1 = await budgetContentGenerator.generateContent(
        mockRequest,
        'prompt1',
      );
      expect(result1).toEqual(mockResponse);

      // 2. Simulate progressive usage to warning threshold
      const usageData: BudgetUsageData = {
        date: new Date().toISOString().split('T')[0],
        requestCount: 0,
        totalCost: 0,
        tokenUsage: {
          inputTokens: 0,
          outputTokens: 0,
          totalTokens: 0,
          tokenCosts: {
            input: 0,
            output: 0,
          },
        },
        lastResetTime: new Date().toISOString(),
        warningsShown: [],
      };

      for (let i = 1; i <= 75; i++) {
        usageData.requestCount = i;
        vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(usageData));

        if (i === 50 && !usageData.warningsShown.includes(50)) {
          // First warning at 50%
          usageData.warningsShown.push(50);
          vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(usageData));

          const warnResult = await budgetContentGenerator.generateContent(
            mockRequest,
            `prompt${i}`,
          );
          expect(warnResult).toEqual(mockResponse);
          expect(consoleSpy).toHaveBeenCalledWith(
            expect.stringContaining('⚠️'),
          );
        } else if (i === 75 && !usageData.warningsShown.includes(75)) {
          // Second warning at 75%
          usageData.warningsShown.push(75);
          vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(usageData));

          const warnResult = await budgetContentGenerator.generateContent(
            mockRequest,
            `prompt${i}`,
          );
          expect(warnResult).toEqual(mockResponse);
          expect(consoleSpy).toHaveBeenCalledWith(
            expect.stringContaining('⚠️'),
          );
        } else {
          const normalResult = await budgetContentGenerator.generateContent(
            mockRequest,
            `prompt${i}`,
          );
          expect(normalResult).toEqual(mockResponse);
        }
      }

      // 3. Continue to budget limit
      for (let i = 76; i <= 100; i++) {
        usageData.requestCount = i;
        vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(usageData));

        if (i === 90 && !usageData.warningsShown.includes(90)) {
          // Final warning at 90%
          usageData.warningsShown.push(90);
          vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(usageData));

          const finalWarnResult = await budgetContentGenerator.generateContent(
            mockRequest,
            `prompt${i}`,
          );
          expect(finalWarnResult).toEqual(mockResponse);
          expect(consoleSpy).toHaveBeenCalledWith(
            expect.stringContaining('⚠️'),
          );
        } else {
          const nearLimitResult = await budgetContentGenerator.generateContent(
            mockRequest,
            `prompt${i}`,
          );
          expect(nearLimitResult).toEqual(mockResponse);
        }
      }

      // 4. Attempt to exceed budget - should throw
      usageData.requestCount = 101;
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(usageData));

      await expect(
        budgetContentGenerator.generateContent(mockRequest, 'over-budget'),
      ).rejects.toThrow(BudgetExceededError);

      // Verify underlying API was not called
      expect(mockContentGenerator.generateContent).not.toHaveBeenLastCalledWith(
        mockRequest,
        'over-budget',
      );
    });

    it('should handle streaming API requests with budget enforcement', async () => {
      const budgetContentGenerator = new BudgetContentGenerator(
        mockContentGenerator,
        mockConfig,
        budgetSettings,
      );

      async function* mockStream(): AsyncGenerator<GenerateContentResponse> {
        yield {
          candidates: [
            {
              content: {
                parts: [{ text: 'Streaming chunk 1' }],
                role: 'model',
              },
              finishReason: FinishReason.STOP,
              index: 0,
            },
          ],
          get text() { return 'Streaming chunk 1'; },
          get data() { return undefined; },
          get functionCalls() { return []; },
          get executableCode() { return undefined; },
          get codeExecutionResult() { return undefined; },
        } as GenerateContentResponse;
        yield {
          candidates: [
            {
              content: {
                parts: [{ text: 'Streaming chunk 2' }],
                role: 'model',
              },
              finishReason: FinishReason.STOP,
              index: 0,
            },
          ],
          get text() { return 'Streaming chunk 2'; },
          get data() { return undefined; },
          get functionCalls() { return []; },
          get executableCode() { return undefined; },
          get codeExecutionResult() { return undefined; },
        } as GenerateContentResponse;
      }

      mockContentGenerator.generateContentStream = vi
        .fn()
        .mockResolvedValue(mockStream());

      // Start with clean usage
      const usageData: BudgetUsageData = {
        date: new Date().toISOString().split('T')[0],
        requestCount: 0,
        totalCost: 0,
        tokenUsage: {
          inputTokens: 0,
          outputTokens: 0,
          totalTokens: 0,
          tokenCosts: {
            input: 0,
            output: 0,
          },
        },
        lastResetTime: new Date().toISOString(),
        warningsShown: [],
      };

      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(usageData));

      const streamRequest: GenerateContentParameters = {
        contents: [{ parts: [{ text: 'Streaming prompt' }], role: 'user' }],
        model: 'gemini-1.5-flash',
      };

      // 1. Successful streaming request
      const stream = await budgetContentGenerator.generateContentStream(
        streamRequest,
        'stream-prompt',
      );

      const chunks: GenerateContentResponse[] = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
      }

      expect(chunks).toHaveLength(2);
      expect(chunks[0].candidates?.[0]?.content.parts?.[0]).toEqual({
        text: 'Streaming chunk 1',
      });
      expect(chunks[1].candidates?.[0]?.content.parts?.[0]).toEqual({
        text: 'Streaming chunk 2',
      });

      // 2. Simulate budget exceeded scenario for streaming
      usageData.requestCount = 101;
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(usageData));

      await expect(
        budgetContentGenerator.generateContentStream(
          streamRequest,
          'over-budget-stream',
        ),
      ).rejects.toThrow(BudgetExceededError);

      expect(
        mockContentGenerator.generateContentStream,
      ).not.toHaveBeenLastCalledWith(streamRequest, 'over-budget-stream');
    });
  });

  describe('Multi-Component System Integration', () => {
    it('should coordinate between tracker, enforcement, and content generator', async () => {
      const tracker = new BudgetTracker(projectRoot, budgetSettings);
      const enforcement = new BudgetEnforcement(projectRoot, budgetSettings);
      const budgetContentGenerator = new BudgetContentGenerator(
        mockContentGenerator,
        mockConfig,
        budgetSettings,
      );

      // Mock successful API response
      const mockResponse = {
        candidates: [
          {
            content: { parts: [{ text: 'Response' }], role: 'model' },
            finishReason: FinishReason.STOP,
            index: 0,
          },
        ],
        get text() { return 'Response'; },
        get data() { return undefined; },
        get functionCalls() { return []; },
        get executableCode() { return undefined; },
        get codeExecutionResult() { return undefined; },
      } as GenerateContentResponse;

      mockContentGenerator.generateContent = vi
        .fn()
        .mockResolvedValue(mockResponse);

      // Start with empty usage
      vi.mocked(fs.readFile).mockRejectedValueOnce(new Error('File not found'));

      const request: GenerateContentParameters = {
        contents: [{ parts: [{ text: 'Test' }], role: 'user' }],
        model: 'gemini-1.5-flash',
      };

      // 1. Verify initial state across all components
      expect(tracker.isEnabled()).toBe(true);
      expect(enforcement.isEnabled()).toBe(true);
      expect(budgetContentGenerator.isBudgetEnabled()).toBe(true);

      // 2. Make API call through content generator
      const result = await budgetContentGenerator.generateContent(
        request,
        'test',
      );
      expect(result).toEqual(mockResponse);

      // 3. Verify usage was recorded
      expect(fs.writeFile).toHaveBeenCalledWith(
        usageFilePath,
        expect.stringContaining('"requestCount":1'),
      );

      // 4. Update settings and verify coordination
      const newSettings: Partial<BudgetSettings> = { dailyLimit: 200 };

      tracker.updateSettings(newSettings);
      enforcement.updateSettings(newSettings);
      budgetContentGenerator.updateBudgetSettings(newSettings);

      expect(tracker.getBudgetSettings().dailyLimit).toBe(200);
      expect(enforcement.getBudgetSettings().dailyLimit).toBe(200);

      // 5. Test enforcement coordination
      const mockUsageData: BudgetUsageData = {
        date: new Date().toISOString().split('T')[0],
        requestCount: 201, // Over new limit
        totalCost: 2.01,
        tokenUsage: {
          inputTokens: 2010,
          outputTokens: 4020,
          totalTokens: 6030,
          tokenCosts: {
            input: 1.005,
            output: 1.005,
          },
        },
        lastResetTime: new Date().toISOString(),
        warningsShown: [],
      };

      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockUsageData));

      // Tracker should report over budget
      const isOverBudget = await tracker.isOverBudget();
      expect(isOverBudget).toBe(true);

      // Enforcement should block
      const check = await enforcement.checkRequestAllowed();
      expect(check.allowed).toBe(false);

      // Content generator should throw
      await expect(
        budgetContentGenerator.generateContent(request, 'blocked'),
      ).rejects.toThrow(BudgetExceededError);
    });

    it('should handle configuration changes across system', async () => {
      const tracker = new BudgetTracker(projectRoot, budgetSettings);
      const enforcement = new BudgetEnforcement(projectRoot, budgetSettings);

      // 1. Initial state
      expect(tracker.isEnabled()).toBe(true);
      expect(enforcement.isEnabled()).toBe(true);

      // 2. Disable budget system
      const disabledSettings: Partial<BudgetSettings> = { enabled: false };

      tracker.updateSettings(disabledSettings);
      enforcement.updateSettings(disabledSettings);

      expect(tracker.isEnabled()).toBe(false);
      expect(enforcement.isEnabled()).toBe(false);

      // 3. Verify no tracking when disabled
      await tracker.recordRequest();
      expect(fs.writeFile).not.toHaveBeenCalled();

      // 4. Verify no enforcement when disabled
      const check = await enforcement.checkRequestAllowed();
      expect(check.allowed).toBe(true);

      // 5. Re-enable with new settings
      const enabledSettings: Partial<BudgetSettings> = {
        enabled: true,
        dailyLimit: 50,
        warningThresholds: [25, 40],
      };

      tracker.updateSettings(enabledSettings);
      enforcement.updateSettings(enabledSettings);

      expect(tracker.isEnabled()).toBe(true);
      expect(enforcement.isEnabled()).toBe(true);
      expect(tracker.getBudgetSettings().dailyLimit).toBe(50);
      expect(tracker.getBudgetSettings().warningThresholds).toEqual([25, 40]);
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('should handle and recover from file system errors', async () => {
      const tracker = new BudgetTracker(projectRoot, budgetSettings);

      // Simulate file system failures
      vi.mocked(fs.mkdir).mockRejectedValue(new Error('Permission denied'));
      vi.mocked(fs.writeFile).mockRejectedValue(new Error('Disk full'));
      vi.mocked(fs.readFile).mockRejectedValue(new Error('File corrupted'));

      // Should not throw errors, but handle gracefully
      await expect(tracker.recordRequest()).resolves.not.toThrow();
      await expect(tracker.resetDailyUsage()).resolves.not.toThrow();
      await expect(tracker.getUsageStats()).resolves.not.toThrow();

      // Verify error was logged
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to save budget usage data:',
        expect.any(Error),
      );

      // System should continue working when file system recovers
      vi.mocked(fs.mkdir).mockResolvedValue(undefined);
      vi.mocked(fs.writeFile).mockResolvedValue();
      vi.mocked(fs.readFile).mockResolvedValue(
        JSON.stringify({
          date: new Date().toISOString().split('T')[0],
          requestCount: 5,
          totalCost: 0.05,
          tokenUsage: {
            inputTokens: 50,
            outputTokens: 100,
            totalTokens: 150,
            tokenCosts: {
              input: 0.025,
              output: 0.025,
            },
          },
          lastResetTime: new Date().toISOString(),
          warningsShown: [],
        }),
      );

      await tracker.recordRequest();
      expect(fs.writeFile).toHaveBeenCalled();

      const stats = await tracker.getUsageStats();
      expect(stats.requestCount).toBe(6); // 5 + 1
    });

    it('should handle corrupted usage data gracefully', async () => {
      const tracker = new BudgetTracker(projectRoot, budgetSettings);

      // Simulate various corruption scenarios
      const corruptedDataScenarios = [
        'invalid json',
        '{"date": ""}', // Missing required fields
        '{"date": "2023-01-01", "requestCount": "invalid"}', // Wrong type
        '{"date": "2023-01-01", "requestCount": -5}', // Negative count
      ];

      for (const corruptedData of corruptedDataScenarios) {
        vi.mocked(fs.readFile).mockResolvedValue(corruptedData);

        // Should not throw and should reset to valid state
        await expect(tracker.recordRequest()).resolves.not.toThrow();

        const stats = await tracker.getUsageStats();
        expect(stats.requestCount).toBeGreaterThanOrEqual(0);
        expect(stats.dailyLimit).toBe(100);
      }
    });

    it('should maintain consistency during concurrent operations', async () => {
      const tracker = new BudgetTracker(projectRoot, budgetSettings);

      // Mock initial state
      const usageData: BudgetUsageData = {
        date: new Date().toISOString().split('T')[0],
        requestCount: 50,
        totalCost: 0.5,
        tokenUsage: {
          inputTokens: 500,
          outputTokens: 1000,
          totalTokens: 1500,
          tokenCosts: {
            input: 0.25,
            output: 0.25,
          },
        },
        lastResetTime: new Date().toISOString(),
        warningsShown: [],
      };

      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(usageData));

      // Simulate concurrent operations
      const operations = [
        () => tracker.recordRequest(),
        () => tracker.getUsageStats(),
        () => tracker.isOverBudget(),
        () => tracker.shouldShowWarning(),
        () => tracker.resetDailyUsage(),
      ];

      // Execute operations concurrently
      const results = await Promise.allSettled(
        Array.from({ length: 20 }, (_, i) =>
          operations[i % operations.length](),
        ),
      );

      // All operations should complete successfully or fail gracefully
      for (const result of results) {
        if (result.status === 'rejected') {
          // If any operation failed, it should be due to expected reasons
          expect(result.reason).toBeInstanceOf(Error);
        }
      }

      // System should still be in a valid state
      const finalStats = await tracker.getUsageStats();
      expect(finalStats.requestCount).toBeGreaterThanOrEqual(0);
      expect(finalStats.dailyLimit).toBe(100);
    });
  });

  describe('Performance and Scale Testing', () => {
    it('should handle high-frequency request recording efficiently', async () => {
      const tracker = new BudgetTracker(projectRoot, budgetSettings);

      // Mock file operations to track call counts
      let writeCallCount = 0;
      vi.mocked(fs.writeFile).mockImplementation(() => {
        writeCallCount++;
        return Promise.resolve();
      });

      const usageData: BudgetUsageData = {
        date: new Date().toISOString().split('T')[0],
        requestCount: 0,
        totalCost: 0,
        tokenUsage: {
          inputTokens: 0,
          outputTokens: 0,
          totalTokens: 0,
          tokenCosts: {
            input: 0,
            output: 0,
          },
        },
        lastResetTime: new Date().toISOString(),
        warningsShown: [],
      };

      // Simulate rapid request recording
      const requestCount = 100;
      const startTime = Date.now();

      for (let i = 1; i <= requestCount; i++) {
        usageData.requestCount = i - 1; // Previous count
        vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(usageData));
        await tracker.recordRequest();
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Verify performance expectations
      expect(duration).toBeLessThan(5000); // Should complete in under 5 seconds
      expect(writeCallCount).toBe(requestCount); // One write per request

      // Verify accuracy
      const finalStats = await tracker.getUsageStats();
      expect(finalStats.requestCount).toBe(requestCount);
    });

    it('should handle large usage data files efficiently', async () => {
      const tracker = new BudgetTracker(projectRoot, budgetSettings);

      // Create large usage data with extensive history
      const largeUsageData: BudgetUsageData = {
        date: new Date().toISOString().split('T')[0],
        requestCount: 50000,
        totalCost: 500.0,
        tokenUsage: {
          inputTokens: 500000,
          outputTokens: 1000000,
          totalTokens: 1500000,
          tokenCosts: {
            input: 250.0,
            output: 250.0,
          },
        },
        lastResetTime: new Date().toISOString(),
        warningsShown: [50, 75, 90], // All thresholds triggered
      };

      // Simulate large JSON file
      const largeJsonData = JSON.stringify(largeUsageData);
      expect(largeJsonData.length).toBeGreaterThan(100); // Reasonable size

      vi.mocked(fs.readFile).mockResolvedValue(largeJsonData);

      // Operations should still be efficient
      const startTime = Date.now();

      const stats = await tracker.getUsageStats();
      const isOverBudget = await tracker.isOverBudget();
      const warningCheck = await tracker.shouldShowWarning();

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Verify performance with large data
      expect(duration).toBeLessThan(1000); // Should complete in under 1 second

      // Verify correct processing of large numbers
      expect(stats.requestCount).toBe(50000);
      expect(isOverBudget).toBe(true);
      expect(warningCheck.show).toBe(false); // All warnings already shown
    });
  });
});
