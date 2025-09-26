/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { CommandModule } from 'yargs';
interface EnableCommandArgs {
    scope: 'user' | 'project';
}
export declare const enableCommand: CommandModule<object, EnableCommandArgs>;
export {};
