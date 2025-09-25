/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Mock process helper for testing autonomous task management components
 */

let originalProcessEnv: NodeJS.ProcessEnv;
let originalProcessCwd: () => string;
let originalProcessKill: (pid: number, signal?: string | number) => boolean;

export const mockProcess = {
  setup(): void {
    // Save original process methods
    originalProcessEnv = { ...process.env };
    originalProcessCwd = process.cwd;
    originalProcessKill = process.kill;

    // Set test environment variables
    process.env.NODE_ENV = 'test';
    process.env.GEMINI_CLI_TEST = 'true';
    process.env.TEST_TMP_DIR = '/tmp/autonomous-task-management-test';

    // Mock process.cwd to return test directory
    process.cwd = vi.fn(() => process.env.TEST_TMP_DIR || '/tmp/test');

    // Mock process.kill for testing file locking mechanisms
    process.kill = vi.fn((pid: number, signal?: string | number) => {
      // Simulate process exists check for file locking
      if (signal === 0) {
        // Return true for valid test PIDs, false for invalid ones
        return pid > 0 && pid < 99999;
      }
      return true;
    });
  },

  cleanup(): void {
    // Restore original process methods
    process.env = originalProcessEnv;
    process.cwd = originalProcessCwd;
    process.kill = originalProcessKill;
  },

  setEnv(key: string, value: string): void {
    process.env[key] = value;
  },

  setCwd(path: string): void {
    process.cwd = vi.fn(() => path);
  },

  mockKill(mockFn: (pid: number, signal?: string | number) => boolean): void {
    process.kill = vi.fn(mockFn);
  }
};