/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  DashboardState,
  DashboardFilters,
  BudgetUsageStats,
  TokenUsageMetrics,
  UsageDataPoint,
  CostBreakdownItem,
  BudgetAlert,
  CostProjection,
} from '../types/index.js';
/**
 * Budget Usage Visualizer Dashboard - Main Hook
 *
 * This hook provides comprehensive state management and data fetching
 * for the Budget Usage Visualizer dashboard. It handles real-time data
 * updates, filtering, error states, and provides a clean API for
 * dashboard components.
 */
interface UseBudgetDashboardOptions {
  /** Project root directory for budget tracking */
  projectRoot: string;
  /** Budget settings configuration */
  budgetSettings?: {
    enabled: boolean;
    dailyLimit?: number;
    alerts?: {
      enabled: boolean;
      thresholds: number[];
    };
  };
  /** Auto-refresh interval in seconds */
  refreshInterval?: number;
  /** Whether to enable auto-refresh */
  autoRefresh?: boolean;
}
interface BudgetDashboardData {
  /** Current budget usage statistics */
  budgetStats: BudgetUsageStats | null;
  /** Token usage metrics over time */
  tokenMetrics: TokenUsageMetrics[];
  /** Historical usage data points */
  historicalData: UsageDataPoint[];
  /** Cost breakdown by feature */
  costBreakdown: CostBreakdownItem[];
  /** Active budget alerts */
  alerts: BudgetAlert[];
  /** Cost projections */
  projections: CostProjection[];
}
interface UseBudgetDashboardReturn extends BudgetDashboardData {
  /** Dashboard state and configuration */
  dashboardState: DashboardState;
  /** Update dashboard filters */
  updateFilters: (filters: Partial<DashboardFilters>) => void;
  /** Change active dashboard view */
  setActiveView: (view: DashboardState['activeView']) => void;
  /** Manually refresh all data */
  refreshData: () => Promise<void>;
  /** Toggle auto-refresh on/off */
  toggleAutoRefresh: () => void;
  /** Dismiss an alert */
  dismissAlert: (alertId: string) => void;
  /** Export dashboard data */
  exportData: (format: 'json' | 'csv') => Promise<string>;
}
/**
 * Main hook for the Budget Usage Visualizer dashboard.
 * Provides comprehensive state management and data fetching capabilities.
 *
 * @param options - Configuration options for the dashboard
 * @returns Dashboard data, state, and control functions
 *
 * @example
 * ```typescript
 * const {
 *   budgetStats,
 *   historicalData,
 *   dashboardState,
 *   updateFilters,
 *   refreshData,
 * } = useBudgetDashboard({
 *   projectRoot: '/path/to/project',
 *   budgetSettings: { enabled: true, dailyLimit: 1000 },
 *   refreshInterval: 30,
 * });
 * ```
 */
export declare function useBudgetDashboard(
  options: UseBudgetDashboardOptions,
): UseBudgetDashboardReturn;
export {};
