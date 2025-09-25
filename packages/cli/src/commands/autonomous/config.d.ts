/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { CommandModule } from 'yargs';
interface ConfigOptions {
  get?: string;
  set?: string;
  list?: boolean;
  reset?: string;
  value?: string;
}
export declare const configCommand: CommandModule<{}, ConfigOptions>;
export {};
