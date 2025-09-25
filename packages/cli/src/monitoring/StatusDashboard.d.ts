/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type React from 'react';
interface DashboardState {
  currentView: 'overview' | 'tasks' | 'agents' | 'analytics' | 'history';
  refreshInterval: number;
  lastRefresh: Date;
  isLoading: boolean;
  error?: string;
}
/**
 * Main Status Dashboard Component
 */
export declare const StatusDashboard: React.FC<{
  autoRefresh?: boolean;
  refreshInterval?: number;
  initialView?: DashboardState['currentView'];
}>;
export default StatusDashboard;
