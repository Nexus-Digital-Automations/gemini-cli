/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { vol } from 'memfs';
import { mockProcess } from './helpers/process-helper';
// Global test setup
beforeAll(() => {
    // Initialize test environment
    process.env.NODE_ENV = 'test';
    process.env.GEMINI_CLI_TEST = 'true';
    // Mock console methods to reduce noise in tests
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;
    console.error = (...args) => {
        // Only show errors that contain 'FATAL' or are explicitly marked as important
        if (args.some(arg => String(arg).includes('FATAL') || String(arg).includes('IMPORTANT'))) {
            originalConsoleError(...args);
        }
    };
    console.warn = (...args) => {
        // Only show warnings in debug mode
        if (process.env.DEBUG === 'true') {
            originalConsoleWarn(...args);
        }
    };
});
afterAll(() => {
    // Clean up test environment
    delete process.env.GEMINI_CLI_TEST;
    // Restore console methods
    console.error = console.error;
    console.warn = console.warn;
});
// Per-test setup
beforeEach(() => {
    // Reset virtual file system
    vol.reset();
    // Mock process environment
    mockProcess.setup();
});
afterEach(() => {
    // Clean up mocks
    mockProcess.cleanup();
    // Reset virtual file system
    vol.reset();
});
//# sourceMappingURL=setup.js.map