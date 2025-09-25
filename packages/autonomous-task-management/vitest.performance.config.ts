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
    include: ['tests/performance/**/*.test.ts'],
    exclude: ['node_modules', 'dist'],
    testTimeout: 300000, // 5 minutes for performance tests
    hookTimeout: 60000,
    setupFiles: ['./tests/setup.ts', './tests/performance-setup.ts'],
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
    retry: 0, // No retries for performance tests to get accurate measurements
    pool: 'threads',
    poolOptions: {
      threads: {
        minThreads: 1,
        maxThreads: 1 // Performance tests run in isolation
      }
    },
    fileParallelism: false, // Performance tests must run sequentially
    sequence: {
      hooks: 'stack'
    },
    benchmark: {
      include: ['tests/performance/**/*.bench.ts'],
      outputFile: './performance-results.json'
    }
  }
});