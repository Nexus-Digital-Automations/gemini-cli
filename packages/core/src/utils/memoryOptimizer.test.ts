/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import {
  MemoryEfficientStringBuilder,
  StreamTokenCounter,
  ContextWindowManager,
  MemoryOptimizationUtils,
  memoryOptimizer,
} from './memoryOptimizer.js';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { tmpdir } from 'node:os';

describe('MemoryEfficientStringBuilder', () => {
  let builder: MemoryEfficientStringBuilder;

  beforeEach(() => {
    builder = new MemoryEfficientStringBuilder();
  });

  test('should handle empty strings', () => {
    expect(builder.length()).toBe(0);
    expect(builder.build()).toBe('');
  });

  test('should append single string', () => {
    builder.append('Hello World');
    expect(builder.length()).toBe(11);
    expect(builder.build()).toBe('Hello World');
  });

  test('should append multiple strings', () => {
    builder.append('Hello ');
    builder.append('Beautiful ');
    builder.append('World');
    expect(builder.length()).toBe(21);
    expect(builder.build()).toBe('Hello Beautiful World');
  });

  test('should handle large strings efficiently', () => {
    const largeString = 'x'.repeat(2 * 1024 * 1024); // 2MB string
    const startTime = Date.now();
    const startMemory = process.memoryUsage();

    builder.append(largeString);
    const result = builder.build();

    const endTime = Date.now();
    const endMemory = process.memoryUsage();

    expect(result.length).toBe(largeString.length);
    expect(endTime - startTime).toBeLessThan(1000); // Should complete in under 1 second

    // Memory should not increase excessively (allowing for some overhead)
    const memoryIncrease = endMemory.heapUsed - startMemory.heapUsed;
    expect(memoryIncrease).toBeLessThan(largeString.length * 3); // No more than 3x the string size
  });

  test('should consolidate many small chunks', () => {
    // Add many small chunks to trigger consolidation
    for (let i = 0; i < 150; i++) {
      builder.append(`chunk${i} `);
    }

    const result = builder.build();
    expect(result).toContain('chunk0 ');
    expect(result).toContain('chunk149 ');
    // After build(), the builder should be cleared (length = 0)
    expect(builder.length()).toBe(0);
    expect(result.length).toBeGreaterThan(1000);
  });

  test('should clear properly', () => {
    builder.append('test content');
    expect(builder.length()).toBeGreaterThan(0);

    builder.clear();
    expect(builder.length()).toBe(0);
    expect(builder.build()).toBe('');
  });
});

describe('StreamTokenCounter', () => {
  let counter: StreamTokenCounter;
  let tempDir: string;
  let testFilePath: string;

  beforeEach(async () => {
    counter = new StreamTokenCounter();
    tempDir = await fs.mkdtemp(path.join(tmpdir(), 'memory-test-'));
    testFilePath = path.join(tempDir, 'test.txt');
  });

  afterEach(async () => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  test('should count tokens from string', () => {
    const text = 'Hello world! This is a test string with some words.';
    const tokenCount = counter.countTokensFromString(text);

    expect(tokenCount).toBeGreaterThan(0);
    // Rough estimation: ~15-20 tokens for this sentence
    expect(tokenCount).toBeGreaterThan(10);
    expect(tokenCount).toBeLessThan(30);
  });

  test('should handle empty string', () => {
    const tokenCount = counter.countTokensFromString('');
    expect(tokenCount).toBe(0);
  });

  test('should count tokens from file', async () => {
    const testContent =
      'This is a test file with multiple lines.\nIt contains various words and punctuation!\nUsed for testing token counting functionality.';
    await fs.writeFile(testFilePath, testContent, 'utf-8');

    const tokenCount = await counter.countTokensFromFile(testFilePath);

    expect(tokenCount).toBeGreaterThan(0);
    // Should be roughly similar to string count
    const stringCount = counter.countTokensFromString(testContent);
    expect(Math.abs(tokenCount - stringCount)).toBeLessThan(5); // Allow small variance
  });

  test('should handle moderate files efficiently', async () => {
    // Create a moderate test file (reduced size for faster test)
    const moderateContent =
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(1000);
    await fs.writeFile(testFilePath, moderateContent, 'utf-8');

    const startTime = Date.now();
    const startMemory = process.memoryUsage();

    const tokenCount = await counter.countTokensFromFile(testFilePath);

    const endTime = Date.now();
    const endMemory = process.memoryUsage();

    expect(tokenCount).toBeGreaterThan(0);
    expect(endTime - startTime).toBeLessThan(2000); // Should complete in under 2 seconds

    // Memory usage should be reasonable for streaming
    const memoryIncrease = endMemory.heapUsed - startMemory.heapUsed;
    expect(memoryIncrease).toBeLessThan(5 * 1024 * 1024); // Less than 5MB increase
  });

  test('should handle chunked large strings', () => {
    const largeText =
      'This is a test sentence that will be repeated many times. '.repeat(
        50000,
      );
    const tokenCount = counter.countTokensFromString(largeText);

    expect(tokenCount).toBeGreaterThan(0);
    // Should handle large strings without memory issues
    expect(tokenCount).toBeGreaterThan(100000); // Rough expectation
  });
});

describe('ContextWindowManager', () => {
  let manager: ContextWindowManager;

  beforeEach(() => {
    manager = new ContextWindowManager({
      maxMemoryThreshold: 50 * 1024 * 1024, // 50MB for testing
      enableGcHints: false, // Disable for testing
      monitoringInterval: 100, // Fast monitoring for tests
    });
  });

  afterEach(() => {
    manager.dispose();
  });

  test('should get current memory metrics', () => {
    const metrics = manager.getCurrentMemoryMetrics();

    expect(metrics).toHaveProperty('heapUsed');
    expect(metrics).toHaveProperty('heapTotal');
    expect(metrics).toHaveProperty('external');
    expect(metrics).toHaveProperty('arrayBuffers');
    expect(metrics).toHaveProperty('rss');
    expect(metrics).toHaveProperty('timestamp');

    expect(typeof metrics.heapUsed).toBe('number');
    expect(metrics.heapUsed).toBeGreaterThan(0);
    expect(metrics.timestamp).toBeCloseTo(Date.now(), -3); // Within 1 second
  });

  test('should slide context window with token limit', () => {
    // Create mock history with text content
    const mockHistory = [
      {
        role: 'user',
        parts: [{ text: 'First message with some content here' }],
      },
      {
        role: 'model',
        parts: [
          { text: 'Model response with detailed explanation and more text' },
        ],
      },
      {
        role: 'user',
        parts: [{ text: 'Second user message with additional context' }],
      },
      {
        role: 'model',
        parts: [
          { text: 'Another model response that is quite lengthy and detailed' },
        ],
      },
      {
        role: 'user',
        parts: [{ text: 'Final user message in the conversation' }],
      },
    ];

    // Set a low token limit to force sliding
    const slidHistory = manager.slideContextWindow(mockHistory, 50);

    expect(slidHistory.length).toBeLessThanOrEqual(mockHistory.length);
    expect(slidHistory.length).toBeGreaterThan(0);

    // Should preserve most recent content
    const lastEntry = slidHistory[slidHistory.length - 1];
    expect(lastEntry.parts?.[0]?.text).toContain('Final user message');
  });

  test('should handle empty history', () => {
    const slidHistory = manager.slideContextWindow([], 1000);
    expect(slidHistory).toEqual([]);
  });

  test('should track memory history', async () => {
    // Wait for at least one monitoring cycle
    await new Promise((resolve) => setTimeout(resolve, 150));

    const memoryHistory = manager.getMemoryHistory();
    expect(memoryHistory.length).toBeGreaterThan(0);

    const metrics = memoryHistory[0];
    expect(metrics).toHaveProperty('heapUsed');
    expect(metrics).toHaveProperty('timestamp');
  });

  test('should detect memory pressure', () => {
    // This test depends on current system state, so we mainly check the method exists
    const isHighPressure = manager.isMemoryPressureHigh();
    expect(typeof isHighPressure).toBe('boolean');
  });
});

describe('MemoryOptimizationUtils', () => {
  test('should optimize string replacement for large strings', () => {
    const largeString = 'Hello world! '.repeat(100000); // ~1.2MB string
    const startTime = Date.now();

    const result = MemoryOptimizationUtils.optimizeStringReplace(
      largeString,
      'world',
      'universe',
    );

    const endTime = Date.now();

    expect(result).toContain('Hello universe!');
    expect(result.length).toBeGreaterThan(largeString.length);
    expect(endTime - startTime).toBeLessThan(2000); // Should complete in under 2 seconds
  });

  test('should optimize array concatenation', () => {
    const arrays = [
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
      [10, 11, 12],
    ];

    const result = MemoryOptimizationUtils.optimizeArrayConcat(...arrays);

    expect(result).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    expect(result.length).toBe(12);
  });

  test('should measure performance accurately', async () => {
    const testOperation = async () => {
      // Simulate some work
      await new Promise((resolve) => setTimeout(resolve, 100));
      return 'test result';
    };

    const { result, duration, memoryDelta } =
      await MemoryOptimizationUtils.measurePerformance(
        testOperation,
        'test operation',
      );

    expect(result).toBe('test result');
    expect(duration).toBeGreaterThan(90); // At least 90ms due to timeout
    expect(duration).toBeLessThan(200); // Should not exceed 200ms by much

    expect(memoryDelta).toHaveProperty('heapUsed');
    expect(memoryDelta).toHaveProperty('timestamp');
    expect(typeof memoryDelta.heapUsed).toBe('number');
  });

  test('should handle large array concatenation efficiently', () => {
    const largeArrays = Array.from({ length: 100 }, (_, i) =>
      Array.from({ length: 1000 }, (_, j) => i * 1000 + j),
    );

    const startTime = Date.now();
    const startMemory = process.memoryUsage();

    const result = MemoryOptimizationUtils.optimizeArrayConcat(...largeArrays);

    const endTime = Date.now();
    const endMemory = process.memoryUsage();

    expect(result.length).toBe(100000);
    expect(result[0]).toBe(0);
    expect(result[99999]).toBe(99999);

    expect(endTime - startTime).toBeLessThan(1000); // Should complete in under 1 second

    // Memory should not increase excessively
    const memoryIncrease = endMemory.heapUsed - startMemory.heapUsed;
    expect(memoryIncrease).toBeLessThan(100000 * 8 * 3); // No more than 3x expected size
  });
});

describe('memoryOptimizer convenience object', () => {
  test('should provide convenient access to all utilities', () => {
    expect(typeof memoryOptimizer.stringBuilder).toBe('function');
    expect(typeof memoryOptimizer.tokenCounter).toBe('function');
    expect(typeof memoryOptimizer.contextManager).toBe('function');
    expect(typeof memoryOptimizer.utils).toBe('function'); // Class constructor, not object

    const stringBuilder = memoryOptimizer.stringBuilder();
    expect(stringBuilder).toBeInstanceOf(MemoryEfficientStringBuilder);

    const tokenCounter = memoryOptimizer.tokenCounter();
    expect(tokenCounter).toBeInstanceOf(StreamTokenCounter);

    const contextManager = memoryOptimizer.contextManager();
    expect(contextManager).toBeInstanceOf(ContextWindowManager);

    contextManager.dispose();
  });
});

describe('Integration Tests', () => {
  test('should handle realistic chat session memory usage', async () => {
    const manager = new ContextWindowManager({
      maxMemoryThreshold: 100 * 1024 * 1024, // 100MB
      enableGcHints: false,
    });

    try {
      // Simulate a realistic chat history
      const chatHistory = [];
      const longMessage =
        'This is a detailed response that contains a lot of information about various topics including technology, science, literature, and many other subjects that might come up in a typical conversation with an AI assistant. '.repeat(
          100,
        );

      for (let i = 0; i < 50; i++) {
        chatHistory.push({
          role: 'user',
          parts: [{ text: `User message ${i}: ${longMessage}` }],
        });
        chatHistory.push({
          role: 'model',
          parts: [{ text: `Model response ${i}: ${longMessage}` }],
        });
      }

      const initialMetrics = manager.getCurrentMemoryMetrics();

      // Test context sliding with realistic token limits
      const slidHistory = manager.slideContextWindow(chatHistory, 50000);

      const finalMetrics = manager.getCurrentMemoryMetrics();

      expect(slidHistory.length).toBeLessThan(chatHistory.length);
      expect(slidHistory.length).toBeGreaterThan(0);

      // Memory usage should be reasonable
      const memoryIncrease = finalMetrics.heapUsed - initialMetrics.heapUsed;
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // Less than 50MB increase
    } finally {
      manager.dispose();
    }
  });

  test('should optimize large text processing workflow', async () => {
    const builder = new MemoryEfficientStringBuilder();
    const counter = new StreamTokenCounter();

    const startMemory = process.memoryUsage();
    const startTime = Date.now();

    // Simulate processing many large documents
    for (let i = 0; i < 10; i++) {
      const document = `Document ${i}: ${'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(10000)}`;

      builder.append(`\n--- Document ${i} ---\n`);
      builder.append(document);

      const tokenCount = counter.countTokensFromString(document);
      expect(tokenCount).toBeGreaterThan(0);
    }

    const finalContent = builder.build();
    const endTime = Date.now();
    const endMemory = process.memoryUsage();

    expect(finalContent.length).toBeGreaterThan(1000000); // Should be over 1MB
    expect(finalContent).toContain('Document 0');
    expect(finalContent).toContain('Document 9');

    expect(endTime - startTime).toBeLessThan(5000); // Should complete in under 5 seconds

    // Memory usage should be reasonable
    const memoryIncrease = endMemory.heapUsed - startMemory.heapUsed;
    expect(memoryIncrease).toBeLessThan(finalContent.length * 3); // No more than 3x content size
  });
});
