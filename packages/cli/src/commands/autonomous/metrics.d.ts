/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { CommandModule } from 'yargs';
interface MetricsOptions {
  json?: boolean;
  watch?: boolean;
  interval?: number;
  'time-range'?: string;
}
export declare const metricsCommand: CommandModule<{}, MetricsOptions>;
export {};
