/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Mock node:crypto for Vitest in jsdom environment
import { vi } from 'vitest';
vi.mock('node:crypto', () => ({
    randomUUID: vi.fn(() => 'mock-random-uuid'),
}));
// Unset NO_COLOR environment variable to ensure consistent theme behavior between local and CI test runs
if (process.env['NO_COLOR'] !== undefined) {
    delete process.env['NO_COLOR'];
}
import './src/test-utils/customMatchers.js';
//# sourceMappingURL=test-setup.js.map