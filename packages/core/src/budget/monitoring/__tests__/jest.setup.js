/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Jest setup file for token monitoring tests
 * Configures global test environment and utilities
 */

// Global test utilities
global.createMockTimestamp = (offsetMs = 0) => new Date(Date.now() + offsetMs);

global.createMockRequestId = (prefix = 'req') => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

global.createMockSessionId = (prefix = 'session') => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Mock console methods to reduce noise in tests
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

global.mockConsoleWarn = jest.fn();
global.mockConsoleError = jest.fn();

beforeEach(() => {
  // Reset console mocks before each test
  global.mockConsoleWarn.mockClear();
  global.mockConsoleError.mockClear();

  // Mock console methods during tests to reduce noise
  console.warn = global.mockConsoleWarn;
  console.error = global.mockConsoleError;
});

afterEach(() => {
  // Restore original console methods after each test
  console.warn = originalConsoleWarn;
  console.error = originalConsoleError;
});

// Global test timeout for async operations
jest.setTimeout(10000); // 10 seconds

// Memory usage monitoring for performance tests
global.getMemoryUsage = () => {
  if (typeof process !== 'undefined' && process.memoryUsage) {
    return process.memoryUsage();
  }
  return {
    rss: 0,
    heapTotal: 0,
    heapUsed: 0,
    external: 0,
    arrayBuffers: 0,
  };
};

// Performance timing utilities
global.measureExecutionTime = async (fn) => {
  const start = Date.now();
  const result = await fn();
  const end = Date.now();
  return {
    result,
    executionTime: end - start,
  };
};

// Test data generators
global.generateTokenUsageData = (count = 10, baseTime = Date.now()) => Array.from({ length: count }, (_, i) => ({
    timestamp: new Date(baseTime - (count - i) * 1000),
    requestId: `req-${i}`,
    model: i % 2 === 0 ? 'gemini-2.5-flash' : 'gemini-2.5-pro',
    feature: 'chat',
    inputTokens: 10 + (i % 5),
    outputTokens: 15 + (i % 3),
    totalTokens: 25 + (i % 8),
    cost: 0.001 * (1 + i * 0.1),
    responseTime: 100 + (i % 10) * 10,
    success: i % 10 !== 0, // Every 10th request fails
    sessionId: `session-${Math.floor(i / 5)}`,
  }));

global.generateLargeString = (sizeInBytes) => 'x'.repeat(sizeInBytes);

// Async utilities for testing
global.waitFor = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

global.waitUntil = async (predicate, timeout = 5000, interval = 100) => {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (await predicate()) {
      return true;
    }
    await global.waitFor(interval);
  }

  throw new Error(`Condition not met within ${timeout}ms`);
};

// Event collection utility for testing event emissions
global.collectEvents = (emitter, eventName, timeout = 1000) => {
  const events = [];

  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      emitter.removeListener(eventName, listener);
      resolve(events);
    }, timeout);

    const listener = (event) => {
      events.push(event);
    };

    emitter.on(eventName, listener);
  });
};

// Resource cleanup tracking
const resourceCleanupCallbacks = [];

global.onCleanup = (callback) => {
  resourceCleanupCallbacks.push(callback);
};

afterAll(async () => {
  // Clean up all registered resources
  for (const cleanup of resourceCleanupCallbacks) {
    try {
      await cleanup();
    } catch (error) {
      console.warn('Error during resource cleanup:', error);
    }
  }
  resourceCleanupCallbacks.length = 0;
});
