/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { CommandModule } from 'yargs';
interface CompatibilityCheckOptions {
  quick?: boolean;
  json?: boolean;
  'fix-issues'?: boolean;
  verbose?: boolean;
}
export declare const compatibilityCheckCommand: CommandModule<
  Record<string, unknown>,
  CompatibilityCheckOptions
>;
export {};
