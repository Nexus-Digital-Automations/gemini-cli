/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

declare const resetConstructorCallCount: () => void;
declare const getConstructorCallCount: () => number;
declare const createDefaultAsyncFzfMock: () => (
  items: readonly string[],
  _options: unknown,
) => Promise<Array<{ indices: number[]; score?: number }>>;
export {
  resetConstructorCallCount,
  getConstructorCallCount,
  createDefaultAsyncFzfMock,
};
