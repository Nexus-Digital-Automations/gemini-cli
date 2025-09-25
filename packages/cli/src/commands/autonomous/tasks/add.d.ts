/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { CommandModule } from 'yargs';
interface AddTaskOptions {
  priority?: string;
  category?: string;
  type?: string;
  description: string;
  'max-time'?: number;
  dependencies?: string[];
  context?: string;
  'expected-outputs'?: string;
}
export declare const addTaskCommand: CommandModule<object, AddTaskOptions>;
export {};
