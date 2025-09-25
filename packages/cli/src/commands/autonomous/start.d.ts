/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { CommandModule } from 'yargs';
interface StartOptions {
  config?: string;
  maxAgents?: number;
  enableMetrics?: boolean;
  enablePersistence?: boolean;
  verbose?: boolean;
}
export declare const startCommand: CommandModule<{}, StartOptions>;
export {};
