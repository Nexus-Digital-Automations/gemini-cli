/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { CommandModule } from 'yargs';
interface VisualizeArgs {
    format?: 'ascii' | 'json' | 'interactive';
    period?: 'day' | 'week' | 'month';
    analytics?: boolean;
    recommendations?: boolean;
}
/**
 * Yargs command module for budget visualization with analytics
 *
 * This command provides comprehensive budget visualization including:
 * - ASCII charts for usage trends and patterns
 * - Interactive analytics dashboard insights
 * - Cost optimization recommendations
 * - Usage pattern analysis and anomaly detection
 * - JSON output for programmatic integration
 *
 * The command leverages the advanced analytics engine to provide
 * actionable insights for budget optimization and cost reduction.
 */
export declare const visualizeCommand: CommandModule<object, VisualizeArgs>;
export {};
