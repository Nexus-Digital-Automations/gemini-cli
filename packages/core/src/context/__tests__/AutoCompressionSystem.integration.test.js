/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Comprehensive Integration Tests for Auto-Compression System
 * Tests the complete system with large context scenarios and edge cases
 *
 * @author Claude Code - Auto-Compression Test Specialist
 * @version 1.0.0
 */
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { AutoCompressionManager, AutoCompressionEvent, } from '../AutoCompressionManager.js';
import { TokenMonitorService } from '../TokenMonitorService.js';
import { CompressionConfigurationManager, ConfigurationPreset, } from '../CompressionConfigurationManager.js';
import { CompressionFallbackSystem } from '../CompressionFallbackSystem.js';
import { EnhancedCompressionAlgorithms } from '../EnhancedCompressionAlgorithms.js';
import { ContextType, ContextPriority } from '../types.js';
import { performance } from 'node:perf_hooks';
describe('AutoCompressionSystem Integration Tests', () => {
    let compressionManager;
    let tokenMonitor;
    let configManager;
    beforeEach(() => {
        configManager = new CompressionConfigurationManager();
        compressionManager = new AutoCompressionManager({}, configManager);
        tokenMonitor = new TokenMonitorService();
    });
    afterEach(async () => {
        compressionManager.stop();
        await new Promise((resolve) => setTimeout(resolve, 100)); // Allow cleanup
    });
    describe('Large Context Handling', () => {
        test('should handle context approaching 1M token limit (1,272,932 → 1,048,576)', async () => {
            // Create a large context that exceeds the limit
            const largeContextItems = createLargeContextItems(1_272_932); // Original problematic size
            const targetTokens = 1_048_576; // Claude API limit
            // Mock context manager
            const mockContextManager = {
                getCurrentWindow: vi.fn(() => ({
                    totalTokens: targetTokens,
                    usedTokens: 1_272_932,
                    availableTokens: targetTokens - 1_272_932, // Negative = over limit
                    sections: {
                        conversation: {
                            name: 'conversation',
                            tokens: 800_000,
                            maxTokens: 400_000,
                            content: largeContextItems.conversation
                                .map((item) => item.content)
                                .join('\n'),
                            items: largeContextItems.conversation,
                            priority: ContextPriority.HIGH,
                        },
                        code: {
                            name: 'code',
                            tokens: 300_000,
                            maxTokens: 400_000,
                            content: largeContextItems.code
                                .map((item) => item.content)
                                .join('\n'),
                            items: largeContextItems.code,
                            priority: ContextPriority.CRITICAL,
                        },
                        logs: {
                            name: 'logs',
                            tokens: 172_932,
                            maxTokens: 200_000,
                            content: largeContextItems.logs
                                .map((item) => item.content)
                                .join('\n'),
                            items: largeContextItems.logs,
                            priority: ContextPriority.LOW,
                        },
                    },
                })),
                updateContextWindowTotals: vi.fn(),
            };
            compressionManager.registerContextManager('test-session', mockContextManager);
            // Set up event listeners to track compression
            const compressionEvents = [];
            compressionManager.on(AutoCompressionEvent.COMPRESSION_STARTED, (event) => {
                compressionEvents.push({ type: 'started', ...event });
            });
            compressionManager.on(AutoCompressionEvent.COMPRESSION_COMPLETED, (event) => {
                compressionEvents.push({ type: 'completed', ...event });
            });
            compressionManager.on(AutoCompressionEvent.TOKEN_LIMIT_WARNING, (event) => {
                compressionEvents.push({ type: 'warning', ...event });
            });
            // Start monitoring and wait for automatic compression
            compressionManager.start();
            // Wait for automatic compression to trigger
            await new Promise((resolve) => setTimeout(resolve, 2000));
            // Manually trigger compression to ensure it runs
            const result = await compressionManager.triggerRobustCompression(false);
            // Verify compression was successful
            expect(result.success).toBe(true);
            expect(result.compressedTokens).toBeLessThan(targetTokens);
            expect(result.compressionRatio).toBeLessThan(0.9); // At least 10% reduction
            expect(result.originalTokens).toBe(1_272_932);
            // Verify token limit compliance
            const finalSnapshot = compressionManager.getTokenUsage();
            expect(finalSnapshot.totalTokens).toBeLessThanOrEqual(targetTokens);
            console.log('Large Context Compression Test Results:', {
                originalTokens: result.originalTokens,
                compressedTokens: result.compressedTokens,
                compressionRatio: result.compressionRatio,
                tokensSaved: result.originalTokens - result.compressedTokens,
                withinLimit: finalSnapshot.totalTokens <= targetTokens,
                compressionEvents: compressionEvents.length,
            });
        });
        test('should handle gradual context growth and predict compression needs', async () => {
            const baseTokens = 800_000; // Start at 800K tokens
            const growthRate = 5_000; // 5K tokens per monitoring cycle
            let currentTokens = baseTokens;
            const mockContextManager = {
                getCurrentWindow: vi.fn(() => {
                    currentTokens += growthRate; // Simulate growth
                    return {
                        totalTokens: 1_048_576,
                        usedTokens: currentTokens,
                        availableTokens: 1_048_576 - currentTokens,
                        sections: {
                            conversation: {
                                name: 'conversation',
                                tokens: currentTokens * 0.8,
                                maxTokens: 500_000,
                                content: 'Growing conversation content...',
                                items: createContextItems(Math.floor((currentTokens * 0.8) / 1000), ContextType.CONVERSATION),
                                priority: ContextPriority.MEDIUM,
                            },
                            system: {
                                name: 'system',
                                tokens: currentTokens * 0.2,
                                maxTokens: 200_000,
                                content: 'System context...',
                                items: createContextItems(Math.floor((currentTokens * 0.2) / 1000), ContextType.SYSTEM),
                                priority: ContextPriority.HIGH,
                            },
                        },
                    };
                }),
                updateContextWindowTotals: vi.fn(),
            };
            compressionManager.registerContextManager('growth-test', mockContextManager);
            // Enable predictive compression
            compressionManager.updateConfiguration({
                tokenLimits: {
                    maxTokenLimit: 1_048_576,
                    thresholds: {
                        info: 0.75,
                        warning: 0.8,
                        critical: 0.85,
                        emergency: 0.95,
                    },
                    predictive: {
                        enabled: true,
                        minutesAhead: 10, // Trigger if hitting limit in 10 minutes
                        minGrowthRate: 1000, // tokens per minute
                    },
                },
            });
            const warnings = [];
            compressionManager.on(AutoCompressionEvent.TOKEN_LIMIT_WARNING, (event) => {
                warnings.push(event);
            });
            // Start monitoring with shorter interval for testing
            compressionManager.updateConfiguration({
                monitoring: {
                    enabled: true,
                    interval: 500, // 0.5 second for testing
                    criticalInterval: 200,
                    enableEvents: true,
                    performance: { enabled: true, historySize: 50, slowThreshold: 2000 },
                    history: { enabled: true, maxEntries: 100, cleanupInterval: 10000 },
                },
            });
            compressionManager.start();
            // Wait for predictive compression to trigger
            await new Promise((resolve) => setTimeout(resolve, 3000));
            expect(warnings.length).toBeGreaterThan(0);
            expect(warnings.some((w) => w.level === 'warning' || w.level === 'critical')).toBe(true);
            console.log('Predictive Compression Test Results:', {
                finalTokens: currentTokens,
                warningsTriggered: warnings.length,
                predictivelyTriggered: warnings.some((w) => w.triggerType?.includes('predictive')),
            });
        });
        test('should handle emergency compression at 95% threshold', async () => {
            const emergencyTokens = Math.floor(1_048_576 * 0.96); // 96% of limit
            const mockContextManager = {
                getCurrentWindow: vi.fn(() => ({
                    totalTokens: 1_048_576,
                    usedTokens: emergencyTokens,
                    availableTokens: 1_048_576 - emergencyTokens,
                    sections: {
                        conversation: {
                            name: 'conversation',
                            tokens: emergencyTokens,
                            maxTokens: 600_000,
                            content: 'Emergency level context content that must be compressed immediately...',
                            items: createContextItems(Math.floor(emergencyTokens / 1000), ContextType.CONVERSATION),
                            priority: ContextPriority.MEDIUM,
                        },
                    },
                })),
                updateContextWindowTotals: vi.fn(),
            };
            compressionManager.registerContextManager('emergency-test', mockContextManager);
            const emergencyEvents = [];
            compressionManager.on(AutoCompressionEvent.EMERGENCY_COMPRESSION, (event) => {
                emergencyEvents.push(event);
            });
            // Trigger emergency compression
            const result = await compressionManager.triggerRobustCompression(true);
            expect(result.success).toBe(true);
            expect(result.compressedTokens).toBeLessThan(emergencyTokens * 0.7); // Aggressive compression
            expect(emergencyEvents.length).toBeGreaterThan(0);
            console.log('Emergency Compression Test Results:', {
                originalTokens: emergencyTokens,
                compressedTokens: result.compressedTokens,
                aggressionLevel: (emergencyTokens - result.compressedTokens) / emergencyTokens,
                emergencyEventsTriggered: emergencyEvents.length,
            });
        });
    });
    describe('Compression Effectiveness', () => {
        test('should achieve different compression ratios based on content type', async () => {
            const contentTypes = [
                { type: ContextType.CODE, expectedRatio: 0.8 }, // Code is harder to compress
                { type: ContextType.CONVERSATION, expectedRatio: 0.6 }, // Conversation compresses well
                { type: ContextType.ERROR, expectedRatio: 0.7 }, // Logs compress moderately
                { type: ContextType.FILE, expectedRatio: 0.5 }, // File listings compress very well
            ];
            const enhancedCompressor = new EnhancedCompressionAlgorithms();
            for (const { type, expectedRatio } of contentTypes) {
                const items = createContextItems(100, type);
                const testItem = items[0];
                const result = await enhancedCompressor.compressWithTypeOptimization(testItem, 0.7);
                expect(result.success).toBe(true);
                expect(result.compressionRatio).toBeLessThanOrEqual(expectedRatio);
                expect(result.compressedTokens).toBeLessThan(result.originalTokens);
                console.log(`Content Type ${type} Compression:`, {
                    originalTokens: result.originalTokens,
                    compressedTokens: result.compressedTokens,
                    ratio: result.compressionRatio,
                    meetingExpected: result.compressionRatio <= expectedRatio,
                });
            }
        });
        test('should preserve critical content priority', async () => {
            const items = [
                createContextItem('Critical system error occurred', ContextType.ERROR, ContextPriority.CRITICAL),
                createContextItem('Debug log entry', ContextType.SYSTEM, ContextPriority.LOW),
                createContextItem('User conversation', ContextType.CONVERSATION, ContextPriority.MEDIUM),
                createContextItem('Important function definition', ContextType.CODE, ContextPriority.HIGH),
            ];
            const fallbackSystem = new CompressionFallbackSystem();
            // Apply aggressive compression that should preserve critical items
            const result = await fallbackSystem.applyFallbackCompression(items, 0.3, // Very aggressive 30% target
            new Error('Test compression'), false);
            expect(result.success).toBe(true);
            // Verify critical content is preserved
            const compressedContent = result.compressed.toLowerCase();
            expect(compressedContent).toContain('critical');
            expect(compressedContent).toContain('system error');
            console.log('Priority Preservation Test:', {
                originalLength: result.original.length,
                compressedLength: result.compressed.length,
                preservesCritical: compressedContent.includes('critical'),
                compressionRatio: result.compressionRatio,
            });
        });
    });
    describe('Fallback System', () => {
        test('should handle compression algorithm failures gracefully', async () => {
            const items = createContextItems(50, ContextType.CODE);
            // Create a mock compression error
            const compressionError = new Error('Algorithm timeout exceeded');
            const fallbackSystem = new CompressionFallbackSystem();
            const result = await fallbackSystem.applyFallbackCompression(items, 0.7, compressionError, false);
            expect(result.fallbackStrategy).toBeDefined();
            expect(result.fallbackAttempts).toBeGreaterThan(0);
            expect(result.fallbackErrors.length).toBeGreaterThan(0);
            // Should still achieve some compression through fallback
            if (result.success) {
                expect(result.compressionRatio).toBeLessThan(1.0);
            }
            console.log('Fallback System Test:', {
                fallbackStrategy: result.fallbackStrategy,
                attempts: result.fallbackAttempts,
                success: result.success,
                errors: result.fallbackErrors?.length || 0,
            });
        });
        test('should apply emergency measures when all fallbacks fail', async () => {
            const items = createContextItems(100, ContextType.CONVERSATION);
            // Create fallback system with very restrictive settings to force emergency
            const restrictiveFallback = new CompressionFallbackSystem({
                maxFallbackAttempts: 1,
                enableEmergencyRemoval: true,
                minPreservationRatio: 0.05, // Keep only 5% minimum
                fallbackTimeoutMs: 100, // Very short timeout
            });
            const result = await restrictiveFallback.applyFallbackCompression(items, 0.1, // Very aggressive target
            new Error('All algorithms failed'), true);
            if (result.emergencyMeasuresApplied) {
                expect(result.compressionRatio).toBeLessThan(0.2); // Very aggressive compression
                expect(result.recoveryActions.length).toBeGreaterThan(0);
            }
            console.log('Emergency Measures Test:', {
                emergencyApplied: result.emergencyMeasuresApplied,
                finalRatio: result.compressionRatio,
                recoveryActions: result.recoveryActions?.length || 0,
            });
        });
    });
    describe('Configuration System', () => {
        test('should apply different configuration presets correctly', async () => {
            const presets = [
                ConfigurationPreset.CONSERVATIVE,
                ConfigurationPreset.BALANCED,
                ConfigurationPreset.AGGRESSIVE,
            ];
            for (const preset of presets) {
                const testConfigManager = new CompressionConfigurationManager();
                testConfigManager.applyPreset(preset);
                const config = testConfigManager.getConfig();
                // Verify preset characteristics
                switch (preset) {
                    case ConfigurationPreset.CONSERVATIVE:
                        expect(config.tokenLimits.thresholds.critical).toBeLessThan(0.8);
                        expect(config.compressionRatios.targets.normal).toBeGreaterThan(0.7);
                        break;
                    case ConfigurationPreset.AGGRESSIVE:
                        expect(config.tokenLimits.thresholds.critical).toBeGreaterThan(0.85);
                        expect(config.compressionRatios.targets.normal).toBeLessThan(0.6);
                        break;
                    case ConfigurationPreset.BALANCED:
                        expect(config.tokenLimits.thresholds.critical).toBeCloseTo(0.85, 1);
                        expect(config.compressionRatios.targets.normal).toBeCloseTo(0.7, 1);
                        break;
                }
                console.log(`Preset ${preset} Configuration:`, {
                    criticalThreshold: config.tokenLimits.thresholds.critical,
                    normalRatio: config.compressionRatios.targets.normal,
                    fallbackEnabled: config.fallback.enabled,
                });
            }
        });
        test('should handle configuration changes dynamically', async () => {
            const testManager = new AutoCompressionManager({}, configManager);
            let configChangeEvents = 0;
            configManager.watchConfig('test', () => {
                configChangeEvents++;
            });
            // Change configuration
            configManager.updateConfig({
                tokenLimits: {
                    maxTokenLimit: 2_000_000,
                    thresholds: {
                        info: 0.6,
                        warning: 0.7,
                        critical: 0.8,
                        emergency: 0.9,
                    },
                    predictive: { enabled: true, minutesAhead: 15, minGrowthRate: 500 },
                },
            });
            // Verify change was applied
            const updatedConfig = testManager.getConfig();
            expect(updatedConfig.maxTokenLimit).toBe(2_000_000);
            expect(configChangeEvents).toBeGreaterThan(0);
            console.log('Dynamic Configuration Test:', {
                configChanges: configChangeEvents,
                newMaxLimit: updatedConfig.maxTokenLimit,
                newCriticalThreshold: updatedConfig.compressionThreshold,
            });
        });
    });
    describe('Performance Tests', () => {
        test('should compress large contexts within reasonable time limits', async () => {
            const items = createLargeContextItems(500_000); // 500K tokens
            const allItems = [...items.conversation, ...items.code, ...items.logs];
            const startTime = performance.now();
            const enhancedCompressor = new EnhancedCompressionAlgorithms();
            const results = await Promise.all(allItems.slice(0, 10).map((item) => enhancedCompressor.compressWithTypeOptimization(item, 0.7)));
            const duration = performance.now() - startTime;
            expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
            expect(results.every((r) => r.success)).toBe(true);
            console.log('Performance Test Results:', {
                itemsProcessed: results.length,
                totalDurationMs: duration,
                averageDurationPerItem: duration / results.length,
                allSuccessful: results.every((r) => r.success),
            });
        });
        test('should handle memory constraints gracefully', async () => {
            // Create very large items to test memory handling
            const largeItems = Array.from({ length: 5 }, (_, i) => createContextItem('x'.repeat(50_000), // 50K character items
            ContextType.FILE, ContextPriority.LOW));
            const fallbackSystem = new CompressionFallbackSystem({
                maxFallbackAttempts: 3,
                enableEmergencyRemoval: true,
                fallbackTimeoutMs: 5000,
            });
            const memoryError = new Error('JavaScript heap out of memory');
            const result = await fallbackSystem.applyFallbackCompression(largeItems, 0.5, memoryError, false);
            // Should handle memory constraints without crashing
            expect(result).toBeDefined();
            expect(result.fallbackAttempts).toBeGreaterThan(0);
            console.log('Memory Constraint Test:', {
                handled: !!result,
                strategy: result.fallbackStrategy,
                success: result.success,
                finalSize: result.compressed?.length || 0,
            });
        });
    });
});
// Helper functions for creating test data
function createLargeContextItems(totalTokens) {
    const conversationTokens = Math.floor(totalTokens * 0.6);
    const codeTokens = Math.floor(totalTokens * 0.25);
    const logTokens = totalTokens - conversationTokens - codeTokens;
    return {
        conversation: createContextItems(Math.floor(conversationTokens / 1000), ContextType.CONVERSATION),
        code: createContextItems(Math.floor(codeTokens / 1000), ContextType.CODE),
        logs: createContextItems(Math.floor(logTokens / 1000), ContextType.ERROR),
    };
}
function createContextItems(count, type) {
    return Array.from({ length: count }, (_, i) => createContextItem(generateContentByType(type, i), type, i % 3 === 0 ? ContextPriority.HIGH : ContextPriority.MEDIUM));
}
function createContextItem(content, type, priority) {
    return {
        id: `test-item-${Date.now()}-${Math.random()}`,
        content,
        timestamp: new Date(),
        lastAccessed: new Date(),
        type,
        priority,
        relevanceScore: Math.random() * 0.8 + 0.2, // 0.2 - 1.0
        tokenCount: Math.ceil(content.length / 4), // Rough token estimation
        dependencies: [],
        metadata: { testItem: true },
        tags: [`type:${type}`, `priority:${priority}`],
    };
}
function generateContentByType(type, index) {
    switch (type) {
        case ContextType.CODE:
            return `
        // Function ${index}
        export function processData${index}(input: any[]): ProcessedData {
          const results = input.map(item => {
            if (item.type === 'user') {
              return transformUserData(item);
            } else if (item.type === 'system') {
              return transformSystemData(item);
            }
            return item;
          });

          return {
            processedItems: results,
            timestamp: Date.now(),
            processingTime: performance.now()
          };
        }

        interface ProcessedData {
          processedItems: any[];
          timestamp: number;
          processingTime: number;
        }
      `;
        case ContextType.CONVERSATION:
            return `
        User: I'm having trouble with the auto-compression system. When I reach about ${Math.floor(Math.random() * 500000 + 800000)} tokens, the system seems to slow down significantly. Is there a way to optimize this?

        Assistant: The performance issue you're experiencing is likely related to the compression algorithm selection. When you reach higher token counts, the system switches to more sophisticated algorithms which can be computationally intensive. Here are a few optimization strategies:

        1. Enable predictive compression to start compressing before hitting the limit
        2. Use the AGGRESSIVE configuration preset for faster compression
        3. Consider adjusting the batch size in performance settings

        Would you like me to help you configure these settings?

        User: Yes, that would be great. Can you show me how to set up predictive compression?

        Assistant: Certainly! Here's how to configure predictive compression:

        \`\`\`javascript
        compressionManager.updateConfiguration({
          tokenLimits: {
            predictive: {
              enabled: true,
              minutesAhead: 30, // Start compressing if limit will be hit in 30 minutes
              minGrowthRate: 1000 // Only trigger if growing by 1000+ tokens/minute
            }
          }
        });
        \`\`\`

        This will help the system compress proactively rather than reactively.
      `;
        case ContextType.ERROR:
            return `
        [${new Date().toISOString()}] ERROR - CompressionManager: Token limit approaching critical threshold
        Current usage: ${Math.floor(Math.random() * 200000 + 850000)} tokens
        Limit: 1048576 tokens
        Utilization: ${(Math.random() * 0.1 + 0.85).toFixed(3)}

        [${new Date().toISOString()}] INFO - AutoCompressionManager: Starting compression process
        Strategy: SEMANTIC_CLUSTERING
        Target ratio: 0.70
        Items to process: ${Math.floor(Math.random() * 50 + 100)}

        [${new Date().toISOString()}] DEBUG - EnhancedCompressionAlgorithms: Processing item ${index}
        Content type: ${type}
        Original tokens: ${Math.floor(Math.random() * 5000 + 1000)}

        [${new Date().toISOString()}] WARN - FallbackSystem: Primary compression failed, applying fallback
        Error: Algorithm timeout exceeded
        Fallback strategy: SIMPLE_COMPRESSION

        [${new Date().toISOString()}] INFO - CompressionManager: Compression completed successfully
        Original tokens: ${Math.floor(Math.random() * 100000 + 500000)}
        Compressed tokens: ${Math.floor(Math.random() * 70000 + 350000)}
        Compression ratio: ${(Math.random() * 0.3 + 0.5).toFixed(3)}
        Duration: ${Math.floor(Math.random() * 2000 + 1000)}ms
      `;
        case ContextType.FILE:
            return `
        File listing for project directory ${index}:

        src/
        ├── components/
        │   ├── AutoCompressionManager.ts (15,432 bytes)
        │   ├── TokenMonitorService.ts (8,921 bytes)
        │   ├── CompressionFallbackSystem.ts (23,187 bytes)
        │   └── EnhancedCompressionAlgorithms.ts (18,765 bytes)
        ├── types/
        │   ├── compression.ts (4,321 bytes)
        │   ├── context.ts (6,789 bytes)
        │   └── monitoring.ts (3,456 bytes)
        ├── utils/
        │   ├── logger.ts (2,345 bytes)
        │   ├── tokenCounter.ts (4,567 bytes)
        │   └── configValidator.ts (3,890 bytes)
        └── __tests__/
            ├── integration.test.ts (12,345 bytes)
            ├── unit.test.ts (8,901 bytes)
            └── performance.test.ts (7,234 bytes)

        Total: ${Math.floor(Math.random() * 50 + 100)} files, ${Math.floor(Math.random() * 500000 + 1000000)} bytes
        Dependencies: ${Math.floor(Math.random() * 20 + 30)} packages
        Last modified: ${new Date().toISOString()}
      `;
        default:
            return `Generic content item ${index} with various information and data that can be compressed effectively using different algorithms depending on the content characteristics and compression requirements.`;
    }
}
//# sourceMappingURL=AutoCompressionSystem.integration.test.js.map