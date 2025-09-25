/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { CommandModule } from 'yargs';
interface ListTasksOptions {
    status?: string;
    priority?: string;
    category?: string;
    limit?: number;
    json?: boolean;
    'show-completed'?: boolean;
}
export declare const listTasksCommand: CommandModule<object, ListTasksOptions>;
export {};
