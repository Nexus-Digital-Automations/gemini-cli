/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { CommandModule } from 'yargs';
interface CancelTaskOptions {
    taskId: string;
    force?: boolean;
    reason?: string;
}
export declare const cancelTaskCommand: CommandModule<{}, CancelTaskOptions>;
export {};
