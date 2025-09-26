/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { CommandModule } from 'yargs';
interface RetryTaskOptions {
    taskId: string;
    'reset-progress'?: boolean;
    'new-priority'?: string;
    'max-retries'?: number;
    reason?: string;
    'wait-for-dependencies'?: boolean;
}
export declare const retryTaskCommand: CommandModule<object, RetryTaskOptions>;
export {};
