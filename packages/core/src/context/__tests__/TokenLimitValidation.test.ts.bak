/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Validation Test for Specific Token Limit Issue
 * Tests the exact 1,272,932 → 1,048,576 token compression scenario
 *
 * @author Claude Code - Token Limit Validation Specialist
 * @version 1.0.0
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { AutoCompressionManager } from '../AutoCompressionManager.js';
import {
  CompressionConfigurationManager,
  ConfigurationPreset,
} from '../CompressionConfigurationManager.js';
import { TokenMonitorService } from '../TokenMonitorService.js';
<<<<<<< Updated upstream
import type { ContextItem} from '../types.js';
=======
import type { ContextItem } from '../types.js';
>>>>>>> Stashed changes
import { ContextType, ContextPriority } from '../types.js';
import { performance } from 'node:perf_hooks';

describe('Token Limit Validation - 1,272,932 → 1,048,576 Issue', () => {
  let compressionManager: AutoCompressionManager;
  let configManager: CompressionConfigurationManager;

  beforeEach(() => {
    configManager = new CompressionConfigurationManager();

    // Configure for the specific Claude API limit scenario
    configManager.updateConfig({
      tokenLimits: {
        maxTokenLimit: 1_048_576, // Exact Claude API limit
        thresholds: {
          info: 0.75, // 786K tokens - start monitoring closely
          warning: 0.8, // 838K tokens - user warnings
          critical: 0.85, // 891K tokens - trigger compression
          emergency: 0.95, // 996K tokens - emergency compression
        },
        predictive: {
          enabled: true,
          minutesAhead: 30,
          minGrowthRate: 1000,
        },
      },
      compressionRatios: {
        targets: {
          normal: 0.75, // Target 75% of original (reduce by 25%)
          aggressive: 0.6, // Target 60% of original (reduce by 40%)
          emergency: 0.4, // Target 40% of original (reduce by 60%)
          fallback: 0.8, // Conservative fallback target
        },
      },
    });

    compressionManager = new AutoCompressionManager({}, configManager);
  });

  afterEach(() => {
    compressionManager.stop();
  });

  describe('Exact Token Limit Scenario', () => {
    test('should compress 1,272,932 tokens down to under 1,048,576 tokens', async () => {
      console.log(
        '\n🧪 Testing Exact Token Limit Scenario: 1,272,932 → 1,048,576',
      );

      const ORIGINAL_TOKENS = 1_272_932;
      const TARGET_LIMIT = 1_048_576;
      const EXCESS_TOKENS = ORIGINAL_TOKENS - TARGET_LIMIT; // 224,356 excess tokens

      console.log(`📊 Initial State:
        - Original tokens: ${ORIGINAL_TOKENS.toLocaleString()}
        - Target limit: ${TARGET_LIMIT.toLocaleString()}
        - Excess tokens: ${EXCESS_TOKENS.toLocaleString()}
        - Reduction needed: ${((EXCESS_TOKENS / ORIGINAL_TOKENS) * 100).toFixed(1)}%`);

      // Create context items that total exactly 1,272,932 tokens
      const contextSections = createExactTokenDistribution(ORIGINAL_TOKENS);

      console.log(`📋 Context Distribution:
        - Conversation: ${contextSections.conversation.tokens.toLocaleString()} tokens (${contextSections.conversation.items.length} items)
        - Code: ${contextSections.code.tokens.toLocaleString()} tokens (${contextSections.code.items.length} items)
        - Logs: ${contextSections.logs.tokens.toLocaleString()} tokens (${contextSections.logs.items.length} items)
        - System: ${contextSections.system.tokens.toLocaleString()} tokens (${contextSections.system.items.length} items)`);

      // Mock context manager with exact token distribution
      const mockContextManager = {
        getCurrentWindow: vi.fn(() => ({
          totalTokens: TARGET_LIMIT,
          usedTokens: ORIGINAL_TOKENS,
          availableTokens: TARGET_LIMIT - ORIGINAL_TOKENS, // Negative = over limit
          sections: {
            conversation: {
              name: 'conversation',
              tokens: contextSections.conversation.tokens,
              maxTokens: Math.floor(TARGET_LIMIT * 0.5), // 50% allocation
              content: contextSections.conversation.items
                .map((item) => item.content)
                .join('\n'),
              items: contextSections.conversation.items,
              priority: ContextPriority.MEDIUM,
            },
            code: {
              name: 'code',
              tokens: contextSections.code.tokens,
              maxTokens: Math.floor(TARGET_LIMIT * 0.3), // 30% allocation
              content: contextSections.code.items
                .map((item) => item.content)
                .join('\n'),
              items: contextSections.code.items,
              priority: ContextPriority.CRITICAL,
            },
            logs: {
              name: 'logs',
              tokens: contextSections.logs.tokens,
              maxTokens: Math.floor(TARGET_LIMIT * 0.15), // 15% allocation
              content: contextSections.logs.items
                .map((item) => item.content)
                .join('\n'),
              items: contextSections.logs.items,
              priority: ContextPriority.LOW,
            },
            system: {
              name: 'system',
              tokens: contextSections.system.tokens,
              maxTokens: Math.floor(TARGET_LIMIT * 0.05), // 5% allocation
              content: contextSections.system.items
                .map((item) => item.content)
                .join('\n'),
              items: contextSections.system.items,
              priority: ContextPriority.HIGH,
            },
          },
        })),
<<<<<<< Updated upstream
        updateContextWindowTotals: vi.fn()
=======
        updateContextWindowTotals: vi.fn(),
>>>>>>> Stashed changes
      };

      compressionManager.registerContextManager(
        'exact-limit-test',
        mockContextManager as any,
      );

      // Track compression events
      const events: any[] = [];
      compressionManager.on('token_usage', (event) =>
        events.push({ type: 'usage', ...event }),
      );
      compressionManager.on('compression_started', (event) =>
        events.push({ type: 'started', ...event }),
      );
      compressionManager.on('compression_completed', (event) =>
        events.push({ type: 'completed', ...event }),
      );
      compressionManager.on('token_limit_warning', (event) =>
        events.push({ type: 'warning', ...event }),
      );
      compressionManager.on('emergency_compression', (event) =>
        events.push({ type: 'emergency', ...event }),
      );

      console.log('\n🚀 Starting Compression Process...');
      const startTime = performance.now();

      // Trigger robust compression with enhanced algorithms and fallback
      const result = await compressionManager.triggerRobustCompression(false);

      const duration = performance.now() - startTime;

      console.log(`\n✅ Compression Results:
        - Success: ${result.success}
        - Original tokens: ${result.originalTokens.toLocaleString()}
        - Compressed tokens: ${result.compressedTokens.toLocaleString()}
        - Tokens saved: ${(result.originalTokens - result.compressedTokens).toLocaleString()}
        - Compression ratio: ${result.compressionRatio.toFixed(3)} (${((1 - result.compressionRatio) * 100).toFixed(1)}% reduction)
        - Strategy used: ${result.strategy}
        - Duration: ${duration.toFixed(0)}ms
        - Items compressed: ${result.itemsCompressed}
        - Items removed: ${result.itemsRemoved}`);

      // Verify compression meets requirements
      expect(result.success).toBe(true);
      expect(result.originalTokens).toBeGreaterThanOrEqual(
        ORIGINAL_TOKENS * 0.95,
      ); // Allow 5% variance
      expect(result.compressedTokens).toBeLessThanOrEqual(TARGET_LIMIT);
      expect(result.compressionRatio).toBeLessThan(0.9); // At least 10% reduction

      // Verify within Claude API limit
      const tokenReduction = result.originalTokens - result.compressedTokens;
      const reductionPercentage =
        (tokenReduction / result.originalTokens) * 100;

      console.log(`\n📈 Validation Metrics:
        - Within API limit: ${result.compressedTokens <= TARGET_LIMIT ? '✅ YES' : '❌ NO'}
        - Sufficient reduction: ${reductionPercentage >= 10 ? '✅ YES' : '❌ NO'} (${reductionPercentage.toFixed(1)}%)
        - Performance acceptable: ${duration <= 10000 ? '✅ YES' : '❌ NO'} (${duration.toFixed(0)}ms <= 10s)
        - Data preserved: ${result.itemsCompressed + result.itemsRemoved > 0 ? '✅ YES' : '❌ NO'}`);

      // Performance validation
      expect(duration).toBeLessThan(15000); // Should complete within 15 seconds

      // Check final state
      const finalSnapshot = compressionManager.getTokenUsage();

      console.log(`\n🎯 Final System State:
        - Total tokens: ${finalSnapshot.totalTokens.toLocaleString()}
        - Utilization: ${(finalSnapshot.utilizationRatio * 100).toFixed(1)}%
        - Under limit: ${finalSnapshot.totalTokens <= TARGET_LIMIT ? '✅ YES' : '❌ NO'}
        - Growth rate: ${finalSnapshot.projectedGrowth.toFixed(0)} tokens/min`);

      expect(finalSnapshot.totalTokens).toBeLessThanOrEqual(TARGET_LIMIT);
      expect(finalSnapshot.utilizationRatio).toBeLessThanOrEqual(1.0);

      // Verify events were triggered
      const warningEvents = events.filter((e) => e.type === 'warning');
      const compressionEvents = events.filter((e) => e.type === 'completed');

      console.log(`\n📨 Events Summary:
        - Warning events: ${warningEvents.length}
        - Compression events: ${compressionEvents.length}
        - Total events: ${events.length}`);

      expect(compressionEvents.length).toBeGreaterThan(0);
    }, 30000); // 30 second timeout

    test('should handle edge cases around the token limit boundary', async () => {
      const boundaryScenarios = [
        { tokens: 1_048_575, description: '1 token under limit' },
        { tokens: 1_048_576, description: 'exactly at limit' },
        { tokens: 1_048_577, description: '1 token over limit' },
        { tokens: 1_100_000, description: 'moderately over limit' },
        { tokens: 1_500_000, description: 'significantly over limit' },
      ];

      for (const scenario of boundaryScenarios) {
        console.log(
          `\n🔍 Testing boundary scenario: ${scenario.description} (${scenario.tokens.toLocaleString()} tokens)`,
        );

        const items = createContextItemsWithExactTokens(scenario.tokens);
        const mockContextManager = createMockContextManager(
          scenario.tokens,
          items,
        );

        const testManager = new AutoCompressionManager({}, configManager);
        testManager.registerContextManager(
          `boundary-${scenario.tokens}`,
          mockContextManager,
        );

        const shouldCompress = scenario.tokens > 1_048_576;

        if (shouldCompress) {
          const result = await testManager.triggerRobustCompression(false);
          expect(result.success).toBe(true);
          expect(result.compressedTokens).toBeLessThanOrEqual(1_048_576);
          console.log(
            `    ✅ Compressed from ${result.originalTokens.toLocaleString()} to ${result.compressedTokens.toLocaleString()} tokens`,
          );
        } else {
          const snapshot = testManager.getTokenUsage();
          expect(snapshot.totalTokens).toBeLessThanOrEqual(1_048_576);
          console.log(
            `    ✅ No compression needed, ${snapshot.totalTokens.toLocaleString()} tokens within limit`,
          );
        }

        testManager.stop();
      }
    }, 45000);

    test('should maintain system stability under repeated compression cycles', async () => {
      console.log('\n🔄 Testing System Stability Under Repeated Compression');

      const compressionCycles = 5;
      const results: any[] = [];

      for (let cycle = 0; cycle < compressionCycles; cycle++) {
        console.log(`\n   Cycle ${cycle + 1}/${compressionCycles}`);

        // Create new large context for each cycle
        const cycleTokens = 1_200_000 + cycle * 50_000; // Increasing size each cycle
        const items = createContextItemsWithExactTokens(cycleTokens);
        const mockContextManager = createMockContextManager(cycleTokens, items);

        const testManager = new AutoCompressionManager({}, configManager);
        testManager.registerContextManager(
          `stability-cycle-${cycle}`,
          mockContextManager,
        );

        const startTime = performance.now();
        const result = await testManager.triggerRobustCompression(false);
        const duration = performance.now() - startTime;

        results.push({
          cycle: cycle + 1,
          originalTokens: result.originalTokens,
          compressedTokens: result.compressedTokens,
          compressionRatio: result.compressionRatio,
          duration,
          success: result.success,
        });

        console.log(
          `     Original: ${result.originalTokens.toLocaleString()} → Compressed: ${result.compressedTokens.toLocaleString()} (${duration.toFixed(0)}ms)`,
        );

        testManager.stop();

        // Verify each cycle meets requirements
        expect(result.success).toBe(true);
        expect(result.compressedTokens).toBeLessThanOrEqual(1_048_576);
        expect(duration).toBeLessThan(20000); // Max 20 seconds per cycle
      }

      // Analyze stability metrics
      const avgDuration =
        results.reduce((sum, r) => sum + r.duration, 0) / results.length;
      const avgCompressionRatio =
        results.reduce((sum, r) => sum + r.compressionRatio, 0) /
        results.length;
      const successRate =
        results.filter((r) => r.success).length / results.length;

      console.log(`\n📊 Stability Analysis:
        - Success rate: ${(successRate * 100).toFixed(1)}%
        - Average duration: ${avgDuration.toFixed(0)}ms
        - Average compression ratio: ${avgCompressionRatio.toFixed(3)}
        - Performance variance: ${results.map((r) => r.duration).reduce((max, cur) => Math.max(max, cur), 0) - results.map((r) => r.duration).reduce((min, cur) => Math.min(min, cur), Infinity)}ms`);

      expect(successRate).toBe(1.0); // 100% success rate
      expect(avgDuration).toBeLessThan(10000); // Average under 10 seconds
      expect(avgCompressionRatio).toBeLessThan(0.85); // Consistent compression
    }, 60000);
  });

  describe('Performance Benchmarks', () => {
    test('should meet performance benchmarks for large context compression', async () => {
      const benchmarks = [
        { tokens: 500_000, maxDurationMs: 5000 },
        { tokens: 1_000_000, maxDurationMs: 8000 },
        { tokens: 1_272_932, maxDurationMs: 10000 },
        { tokens: 1_500_000, maxDurationMs: 12000 },
      ];

      console.log('\n⏱️ Performance Benchmarks:');

      for (const benchmark of benchmarks) {
        const items = createContextItemsWithExactTokens(benchmark.tokens);
        const mockContextManager = createMockContextManager(
          benchmark.tokens,
          items,
        );

        const testManager = new AutoCompressionManager({}, configManager);
        testManager.registerContextManager(
          `benchmark-${benchmark.tokens}`,
          mockContextManager,
        );

        const startTime = performance.now();
        const result = await testManager.triggerRobustCompression(false);
        const duration = performance.now() - startTime;

        const benchmark_met = duration <= benchmark.maxDurationMs;

        console.log(
          `   ${benchmark.tokens.toLocaleString()} tokens: ${duration.toFixed(0)}ms ${benchmark_met ? '✅' : '❌'} (limit: ${benchmark.maxDurationMs}ms)`,
        );

        expect(result.success).toBe(true);
        expect(duration).toBeLessThan(benchmark.maxDurationMs);

        testManager.stop();
      }
    }, 45000);
  });
});

// Helper functions for creating test data with exact token counts

function createExactTokenDistribution(totalTokens: number): {
  conversation: { tokens: number; items: ContextItem[] };
  code: { tokens: number; items: ContextItem[] };
  logs: { tokens: number; items: ContextItem[] };
  system: { tokens: number; items: ContextItem[] };
} {
  // Distribute tokens realistically across different content types
  const distribution = {
    conversation: Math.floor(totalTokens * 0.55), // 55% conversation
    code: Math.floor(totalTokens * 0.25), // 25% code
    logs: Math.floor(totalTokens * 0.15), // 15% logs
    system: 0, // Remaining tokens
  };

  distribution.system =
    totalTokens -
    distribution.conversation -
    distribution.code -
    distribution.logs;

  return {
    conversation: {
      tokens: distribution.conversation,
      items: createContextItemsWithExactTokens(
        distribution.conversation,
        ContextType.CONVERSATION,
        ContextPriority.MEDIUM,
      ),
    },
    code: {
      tokens: distribution.code,
      items: createContextItemsWithExactTokens(
        distribution.code,
        ContextType.CODE,
        ContextPriority.CRITICAL,
      ),
    },
    logs: {
      tokens: distribution.logs,
      items: createContextItemsWithExactTokens(
        distribution.logs,
        ContextType.ERROR,
        ContextPriority.LOW,
      ),
    },
    system: {
      tokens: distribution.system,
      items: createContextItemsWithExactTokens(
        distribution.system,
        ContextType.SYSTEM,
        ContextPriority.HIGH,
      ),
    },
  };
}

function createContextItemsWithExactTokens(
  totalTokens: number,
  type: ContextType = ContextType.CONVERSATION,
  priority: ContextPriority = ContextPriority.MEDIUM,
): ContextItem[] {
  const items: ContextItem[] = [];
  let remainingTokens = totalTokens;
  let itemIndex = 0;

  while (remainingTokens > 0) {
    // Create items of varying sizes to simulate realistic content
    const itemSize = Math.min(
      remainingTokens,
      Math.floor(Math.random() * 2000) + 500, // 500-2500 tokens per item
    );

    const content = generateContentWithExactTokens(itemSize, type, itemIndex);

    items.push({
      id: `exact-token-item-${type}-${itemIndex}`,
      content,
      timestamp: new Date(),
      lastAccessed: new Date(),
      type,
      priority,
      relevanceScore: Math.random() * 0.7 + 0.3, // 0.3 - 1.0
      tokenCount: itemSize, // Exact token count
      dependencies: [],
      metadata: { exactTokenTest: true, targetTokens: itemSize },
      tags: [
        `type:${type}`,
        `priority:${priority}`,
        `exact-tokens:${itemSize}`,
      ],
    });

    remainingTokens -= itemSize;
    itemIndex++;
  }

  return items;
}

function generateContentWithExactTokens(
  tokenCount: number,
  type: ContextType,
  index: number,
): string {
  // Generate content that should result in approximately the target token count
  // Using rough estimation: 4 characters per token
  const targetCharacters = tokenCount * 4;

  let content = '';

  switch (type) {
    case ContextType.CODE:
      content = generateCodeContent(targetCharacters, index);
      break;
    case ContextType.CONVERSATION:
      content = generateConversationContent(targetCharacters, index);
      break;
    case ContextType.ERROR:
      content = generateLogContent(targetCharacters, index);
      break;
    case ContextType.SYSTEM:
      content = generateSystemContent(targetCharacters, index);
      break;
    default:
      content = generateGenericContent(targetCharacters, index);
  }

  // Pad or trim to approximate target length
  if (content.length < targetCharacters) {
    const padding = ' '.repeat(targetCharacters - content.length);
    content += padding;
  } else if (content.length > targetCharacters) {
    content = content.substring(0, targetCharacters);
  }

  return content;
}

function generateCodeContent(targetLength: number, index: number): string {
  const baseContent = `
    // Generated code content ${index}
    export class DataProcessor${index} {
      private data: ProcessingData[] = [];
      private config: ProcessingConfig;

      constructor(config: ProcessingConfig) {
        this.config = config;
      }

      async processItems(items: any[]): Promise<ProcessedResult> {
        const results = await Promise.all(
          items.map(async item => {
            const startTime = performance.now();
            const processed = await this.processItem(item);
            const duration = performance.now() - startTime;

            return {
              ...processed,
              processingTime: duration,
              timestamp: Date.now()
            };
          })
        );

        return {
          processedItems: results,
          totalProcessed: results.length,
          averageTime: results.reduce((sum, r) => sum + r.processingTime, 0) / results.length
        };
      }

      private async processItem(item: any): Promise<ProcessedItem> {
        // Complex processing logic here
        if (item.type === 'user_data') {
          return this.processUserData(item);
        } else if (item.type === 'system_data') {
          return this.processSystemData(item);
        }

        return this.processGenericData(item);
      }
    }
  `;

  return baseContent
    .repeat(Math.ceil(targetLength / baseContent.length))
    .substring(0, targetLength);
}

function generateConversationContent(
  targetLength: number,
  index: number,
): string {
  const baseConversation = `
    User: I'm working with the auto-compression system and I'm encountering an issue where my context size has grown to ${(Math.random() * 500000 + 800000).toFixed(0)} tokens. The system seems to be hitting some performance bottlenecks when it tries to compress this much data at once.

    Assistant: I understand you're experiencing performance issues with large context compression. This is a common challenge when dealing with contexts approaching the token limit. Let me help you optimize this.

    The performance bottleneck you're seeing typically occurs because the system switches to more sophisticated compression algorithms for larger contexts. Here are several strategies we can implement:

    1. **Predictive Compression**: Configure the system to start compressing before you hit critical thresholds
    2. **Batch Processing**: Process large contexts in smaller chunks to reduce memory pressure
    3. **Content Prioritization**: Ensure critical content is preserved while less important content is compressed more aggressively
    4. **Algorithm Selection**: Use faster algorithms for non-critical content types

    User: That's very helpful. Can you show me how to configure predictive compression? I want to start compressing when I reach about 850K tokens instead of waiting until I'm close to the limit.

    Assistant: Absolutely! Here's how to configure predictive compression for your use case:

    \`\`\`typescript
    compressionManager.updateConfiguration({
      tokenLimits: {
        maxTokenLimit: 1_048_576, // Claude API limit
        thresholds: {
          critical: 0.81, // Trigger at 850K tokens (850K / 1048K = 0.81)
          emergency: 0.95
        },
        predictive: {
          enabled: true,
          minutesAhead: 25, // Start if limit will be hit in 25 minutes
          minGrowthRate: 2000 // Only if growing by 2K+ tokens/minute
        }
      }
    });
    \`\`\`

    This configuration will trigger compression when you reach 850K tokens, and will also proactively compress if the system predicts you'll hit the limit within 25 minutes based on your current growth rate.
  `;

  return baseConversation
    .repeat(Math.ceil(targetLength / baseConversation.length))
    .substring(0, targetLength);
}

function generateLogContent(targetLength: number, index: number): string {
  const baseLogs = `
    [2025-01-15T10:30:${String(index % 60).padStart(2, '0')}.123Z] INFO - AutoCompressionManager: Token monitoring active
    Current usage: ${Math.floor(Math.random() * 200000 + 800000)} tokens
    Utilization: ${(Math.random() * 0.3 + 0.7).toFixed(3)}
    Growth rate: ${Math.floor(Math.random() * 2000 + 500)} tokens/minute

    [2025-01-15T10:30:${String((index + 1) % 60).padStart(2, '0')}.456Z] DEBUG - EnhancedCompressionAlgorithms: Processing batch ${index}
    Items in batch: ${Math.floor(Math.random() * 20 + 10)}
    Content types: conversation=${Math.floor(Math.random() * 8 + 5)}, code=${Math.floor(Math.random() * 3 + 1)}, logs=${Math.floor(Math.random() * 5 + 2)}
    Target compression ratio: 0.${Math.floor(Math.random() * 3 + 6)}0

    [2025-01-15T10:30:${String((index + 2) % 60).padStart(2, '0')}.789Z] WARN - CompressionFallbackSystem: Primary algorithm timeout
    Algorithm: SEMANTIC_CLUSTERING
    Processing time: ${Math.floor(Math.random() * 3000 + 5000)}ms
    Fallback strategy: SIMPLE_COMPRESSION

    [2025-01-15T10:30:${String((index + 3) % 60).padStart(2, '0')}.012Z] INFO - TokenMonitorService: Compression cycle completed
    Original tokens: ${Math.floor(Math.random() * 100000 + 500000)}
    Compressed tokens: ${Math.floor(Math.random() * 70000 + 350000)}
    Compression ratio: 0.${Math.floor(Math.random() * 300 + 500)}
    Items compressed: ${Math.floor(Math.random() * 50 + 100)}
    Items removed: ${Math.floor(Math.random() * 10 + 5)}
    Duration: ${Math.floor(Math.random() * 2000 + 3000)}ms

    [2025-01-15T10:30:${String((index + 4) % 60).padStart(2, '0')}.345Z] DEBUG - ContextWindowManager: Section reallocation
    conversation: ${Math.floor(Math.random() * 200000 + 400000)} → ${Math.floor(Math.random() * 150000 + 300000)} tokens
    code: ${Math.floor(Math.random() * 100000 + 200000)} → ${Math.floor(Math.random() * 80000 + 150000)} tokens
    logs: ${Math.floor(Math.random() * 50000 + 100000)} → ${Math.floor(Math.random() * 30000 + 70000)} tokens
  `;

  return baseLogs
    .repeat(Math.ceil(targetLength / baseLogs.length))
    .substring(0, targetLength);
}

function generateSystemContent(targetLength: number, index: number): string {
  const baseSystem = `
    System Configuration ${index}:
    - Auto-compression: ENABLED
    - Token limit: 1,048,576
    - Critical threshold: ${(Math.random() * 0.1 + 0.8).toFixed(2)}
    - Monitoring interval: ${Math.floor(Math.random() * 20000 + 30000)}ms
    - Enhanced algorithms: ENABLED
    - Fallback system: ENABLED
    - Configuration preset: ${['BALANCED', 'CONSERVATIVE', 'AGGRESSIVE'][Math.floor(Math.random() * 3)]}

    Active Context Managers:
    - session-${index}-main: ${Math.floor(Math.random() * 300000 + 400000)} tokens
    - session-${index}-secondary: ${Math.floor(Math.random() * 200000 + 300000)} tokens
    - background-monitoring: ${Math.floor(Math.random() * 50000 + 100000)} tokens

    Performance Metrics:
    - Average compression time: ${Math.floor(Math.random() * 2000 + 3000)}ms
    - Average compression ratio: 0.${Math.floor(Math.random() * 300 + 600)}
    - Success rate: ${(Math.random() * 0.05 + 0.95).toFixed(3)}
    - Memory usage: ${Math.floor(Math.random() * 50 + 100)}MB
    - CPU utilization: ${Math.floor(Math.random() * 20 + 10)}%
  `;

  return baseSystem
    .repeat(Math.ceil(targetLength / baseSystem.length))
    .substring(0, targetLength);
}

function generateGenericContent(targetLength: number, index: number): string {
  const baseContent = `Generic content item ${index} with comprehensive information that includes various data structures, metadata, processing instructions, and contextual information that can be effectively compressed using different algorithmic approaches depending on the specific content characteristics, user requirements, and system constraints. `;

  return baseContent
    .repeat(Math.ceil(targetLength / baseContent.length))
    .substring(0, targetLength);
}

function createMockContextManager(
  totalTokens: number,
  items: ContextItem[],
): any {
  return {
    getCurrentWindow: vi.fn(() => ({
      totalTokens: 1_048_576,
      usedTokens: totalTokens,
      availableTokens: 1_048_576 - totalTokens,
      sections: {
        main: {
          name: 'main',
          tokens: totalTokens,
          maxTokens: 1_048_576,
          content: items.map((item) => item.content).join('\n'),
          items,
          priority: ContextPriority.MEDIUM,
        },
      },
    })),
<<<<<<< Updated upstream
    updateContextWindowTotals: vi.fn()
=======
    updateContextWindowTotals: vi.fn(),
>>>>>>> Stashed changes
  };
}
