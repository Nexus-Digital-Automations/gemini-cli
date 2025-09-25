/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { CommandModule } from 'yargs';
interface ExtendCommandArgs {
  amount: number;
  confirm?: boolean;
}
export declare const extendCommand: CommandModule<object, ExtendCommandArgs>;
export {};
