/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { CommandModule } from 'yargs';
interface ResetCommandArgs {
    confirm?: boolean;
}
export declare const resetCommand: CommandModule<object, ResetCommandArgs>;
export {};
