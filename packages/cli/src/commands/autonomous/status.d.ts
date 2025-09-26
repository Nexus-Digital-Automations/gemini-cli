/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { CommandModule } from 'yargs';
interface StatusOptions {
    json?: boolean;
    watch?: boolean;
    interval?: number;
}
export declare const statusCommand: CommandModule<object, StatusOptions>;
export {};
