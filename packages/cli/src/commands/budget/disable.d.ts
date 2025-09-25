/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { CommandModule } from 'yargs';
interface DisableCommandArgs {
    scope: 'user' | 'project';
    confirm?: boolean;
}
export declare const disableCommand: CommandModule<object, DisableCommandArgs>;
export {};
