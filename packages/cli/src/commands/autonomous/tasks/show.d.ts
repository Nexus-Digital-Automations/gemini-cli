/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { CommandModule } from 'yargs';
interface ShowTaskOptions {
  taskId: string;
  verbose?: boolean;
  logs?: boolean;
  'show-subtasks'?: boolean;
  'show-dependencies'?: boolean;
}
export declare const showTaskCommand: CommandModule<object, ShowTaskOptions>;
export {};
