/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { CommandModule } from 'yargs';
/**
 * Arguments interface for the budget set command
 */
interface SetCommandArgs {
  /** Daily API request limit */
  limit: number;
  /** Time when budget resets daily in HH:MM format */
  'reset-time'?: string;
  /** Configuration scope (user or project) */
  scope: 'user' | 'project';
}
/**
 * Yargs command module for setting budget limits and configuration
 *
 * This command enables and configures API request budget tracking with:
 * - Daily request limits to control API usage
 * - Customizable reset times for budget cycles
 * - User and project scope support for flexible configuration
 * - Input validation for limits and time formats
 * - Automatic budget enabling when limits are set
 *
 * The command includes comprehensive validation and provides clear
 * feedback about the configured settings and next steps.
 */
export declare const setCommand: CommandModule<object, SetCommandArgs>;
export {};
