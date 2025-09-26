/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type React from 'react';
import type { DashboardFilters } from '../types/index.js';
/**
 * Props for the BudgetControlsPanel component.
 */
interface BudgetControlsPanelProps {
    /** Current dashboard filters */
    filters: DashboardFilters;
    /** Callback when filters are updated */
    onUpdateFilters?: (filters: Partial<DashboardFilters>) => void;
    /** Whether auto-refresh is enabled */
    autoRefresh: boolean;
    /** Callback to toggle auto-refresh */
    onToggleAutoRefresh?: () => void;
    /** Current refresh interval in seconds */
    refreshInterval: number;
    /** Callback to export dashboard data */
    onExportData?: (format: 'json' | 'csv') => Promise<string>;
}
/**
 * Budget Controls Panel Component
 *
 * This component provides dashboard configuration and control options
 * in a CLI-optimized interface. It allows users to modify filters,
 * configure settings, manage exports, and control dashboard behavior.
 *
 * Features:
 * - Time range filter configuration
 * - Feature inclusion/exclusion filters
 * - Cost and usage range filters
 * - Auto-refresh toggle and interval settings
 * - Data export controls (JSON, CSV)
 * - Filter presets (today, week, month, etc.)
 * - Keyboard navigation for all settings
 *
 * @param props - Configuration and callbacks for the controls panel
 * @returns Interactive budget controls panel component
 */
export declare const BudgetControlsPanel: React.FC<BudgetControlsPanelProps>;
export {};
