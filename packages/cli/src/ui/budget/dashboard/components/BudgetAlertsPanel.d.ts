/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type React from 'react';
import type { BudgetAlert, BudgetUsageStats } from '../types/index.js';
/**
 * Props for the BudgetAlertsPanel component.
 */
interface BudgetAlertsPanelProps {
    /** Active budget alerts to display */
    alerts: BudgetAlert[];
    /** Current budget usage statistics */
    budgetStats?: BudgetUsageStats | null;
    /** Callback when an alert is dismissed */
    onDismissAlert?: (alertId: string) => void;
    /** Callback when alert thresholds are modified */
    onModifyThresholds?: (thresholds: number[]) => void;
}
/**
 * Budget Alerts Panel Component
 *
 * This component displays and manages budget alerts and notifications
 * in a CLI-optimized interface. It provides real-time alerts for budget
 * thresholds, cost overruns, usage spikes, and other critical events.
 *
 * Features:
 * - Real-time budget alert notifications
 * - Alert severity classification (info, warning, error, critical)
 * - Interactive alert dismissal
 * - Alert history and statistics
 * - Suggested actions for each alert
 * - Alert threshold configuration
 * - Keyboard navigation for alert management
 *
 * @param props - Configuration and data for the alerts panel
 * @returns Interactive budget alerts panel component
 */
export declare const BudgetAlertsPanel: React.FC<BudgetAlertsPanelProps>;
export {};
