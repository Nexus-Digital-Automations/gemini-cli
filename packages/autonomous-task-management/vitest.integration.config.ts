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
    include: ['tests/integration/**/*.test.ts'],
    exclude: ['node_modules', 'dist'],
    testTimeout: 60000,
    hookTimeout: 15000,
    setupFiles: ['./tests/setup.ts', './tests/integration-setup.ts'],
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
        maxThreads: 2
      }
    },
    fileParallelism: false, // Integration tests run sequentially to avoid conflicts
    sequence: {
      hooks: 'stack'
    }
  }
});