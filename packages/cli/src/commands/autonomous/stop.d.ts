/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { CommandModule } from 'yargs';
interface StopOptions {
    force?: boolean;
    timeout?: number;
    'save-state'?: boolean;
}
export declare const stopCommand: CommandModule<object, StopOptions>;
export {};
