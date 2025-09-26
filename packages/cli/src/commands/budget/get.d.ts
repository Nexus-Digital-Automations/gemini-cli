/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { CommandModule } from 'yargs';
/**
 * Arguments interface for the budget get command
 */
interface GetCommandArgs {
    /** Whether to output results in JSON format */
    json?: boolean;
}
/**
 * Yargs command module for displaying budget status and usage
 *
 * This command provides comprehensive budget information including:
 * - Current usage statistics (requests made, remaining, percentage)
 * - Budget configuration (daily limit, reset time)
 * - Visual progress indicator and status warnings
 * - JSON output option for programmatic use
 * - Helpful tips and next steps based on current usage
 *
 * The command handles both enabled and disabled budget states gracefully
 * and provides actionable guidance for budget management.
 */
export declare const getCommand: CommandModule<object, GetCommandArgs>;
export {};
