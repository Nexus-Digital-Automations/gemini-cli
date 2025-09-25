/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { EventEmitter } from 'node:events';
import type { Task } from '../TaskQueue.js';
/**
 * Test utilities and helpers
 */
declare class TestUtils {
  /**
   * Create a mock task for testing
   */
  static createMockTask(overrides?: Partial<Task>): Task;
  /**
   * Create multiple mock tasks for batch testing
   */
  static createMockTasks(count: number, overrides?: Partial<Task>): Task[];
  /**
   * Wait for a specific amount of time
   */
  static wait(ms: number): Promise<void>;
  /**
   * Create a mock event emitter with tracking
   */
  static createMockEventEmitter(): EventEmitter & {
    emittedEvents: Array<{
      event: string;
      args: any[];
    }>;
  };
  /**
   * Validate task execution result
   */
  static validateTaskResult(result: any): boolean;
}
/**
 * Performance measurement utilities
 */
declare class PerformanceTracker {
  private measurements;
  startMeasurement(name: string): () => number;
  getStats(name: string): {
    min: number;
    max: number;
    avg: number;
    count: number;
  } | null;
  clear(): void;
}
export { TestUtils, PerformanceTracker };
