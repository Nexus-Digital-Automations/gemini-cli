/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/e2e/**/*.test.ts'],
    exclude: ['node_modules', 'dist'],
    testTimeout: 120000, // 2 minutes for E2E tests
    hookTimeout: 30000,
    setupFiles: ['./tests/setup.ts', './tests/e2e-setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json'],
      exclude: [
        'node_modules/',
        'dist/',
        'tests/',
        '**/*.test.ts',
        '**/*.spec.ts'
      ]
    },
    retry: 1,
    pool: 'threads',
    poolOptions: {
      threads: {
        minThreads: 1,
        maxThreads: 1 // E2E tests run in single thread to avoid race conditions
      }
    },
    fileParallelism: false, // E2E tests must run sequentially
    sequence: {
      hooks: 'stack'
    }
  }
});