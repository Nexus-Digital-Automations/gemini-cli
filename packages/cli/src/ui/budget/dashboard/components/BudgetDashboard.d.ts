/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type React from 'react';
import type { BudgetDashboardProps } from '../types/index.js';
/**
 * Budget Usage Visualizer and Analytics Dashboard - Main Component
 *
 * This is the primary dashboard component that provides a comprehensive
 * view of budget usage, costs, trends, and analytics. It includes multiple
 * interactive charts, real-time data, alerts, and filtering capabilities.
 *
 * The dashboard supports multiple views:
 * - Overview: Summary of all budget metrics
 * - Usage: Detailed token usage analysis
 * - Costs: Cost breakdown and analysis
 * - Trends: Historical usage trends
 * - Alerts: Budget alerts and notifications
 * - Settings: Dashboard configuration
 *
 * @param props - Configuration for the dashboard
 * @returns Interactive budget dashboard UI component
 */
export declare const BudgetDashboard: React.FC<BudgetDashboardProps>;
