/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type React from 'react';
import type { BudgetSettings } from '../../config/settingsSchema.js';
/**
 * Props for the BudgetDisplay component.
 * Configures how budget information is displayed and tracked.
 */
export interface BudgetDisplayProps {
    budgetSettings?: BudgetSettings;
    projectRoot: string;
    compact?: boolean;
}
/**
 * BudgetDisplay shows current API usage against configured limits.
 *
 * This component displays budget information including request count,
 * daily limits, usage percentage, and time until reset. It automatically
 * refreshes data and provides visual indicators when approaching limits.
 *
 * The component supports both compact and full display modes, automatically
 * choosing appropriate colors based on usage levels (green, yellow, red).
 *
 * @param props - Configuration for budget display behavior and data sources
 * @returns A React component showing current budget status
 *
 * @example
 * ```tsx
 * <BudgetDisplay
 *   budgetSettings={budgetConfig}
 *   projectRoot="/path/to/project"
 *   compact={false}
 * />
 * ```
 */
export declare const BudgetDisplay: React.FC<BudgetDisplayProps>;
