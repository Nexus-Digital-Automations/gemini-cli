/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { BudgetTracker } from '../budget-tracker.js';
import type {
  AnalyticsEngine,
  FeatureCostAnalysis,
  OptimizationRecommendation,
} from '../index';
import { type RealTimeData } from './RealTimeTracker.js';
/**
 * Dashboard configuration options
 */
export interface DashboardConfig {
  refreshInterval?: number;
  maxHistoryDays?: number;
  showRealTime?: boolean;
  enableInteractivity?: boolean;
  theme?: 'light' | 'dark' | 'auto';
  chartType?: 'line' | 'bar' | 'sparkline' | 'mixed';
}
/**
 * Dashboard sections configuration
 */
export interface DashboardSections {
  summary?: boolean;
  realTimeUsage?: boolean;
  historicalTrends?: boolean;
  featureAnalysis?: boolean;
  costProjections?: boolean;
  optimizationRecommendations?: boolean;
  budgetAlerts?: boolean;
}
/**
 * Budget alert types and severity levels
 */
export interface BudgetAlert {
  id: string;
  type: 'critical' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: string;
  threshold?: number;
  currentValue?: number;
  actionable: boolean;
}
/**
 * Current usage summary data
 */
export interface CurrentUsageData {
  todayRequests: number;
  todayCost: number;
  budgetRemaining: number;
  budgetUtilization: number;
}
/**
 * Cost projections data
 */
export interface CostProjections {
  dailyProjection: number;
  weeklyProjection: number;
  monthlyProjection: number;
  exceedsDaily: boolean;
  exceedsWeekly: boolean;
  exceedsMonthly: boolean;
}
/**
 * Historical trends data
 */
export interface TrendsData {
  hourlyUsage: number[];
  dailyUsage: number[];
  weeklyUsage: number[];
}
/**
 * Complete dashboard data structure
 */
export interface DashboardData {
  currentUsage: CurrentUsageData;
  projections: CostProjections;
  trends: TrendsData;
  features: FeatureCostAnalysis[];
  recommendations: OptimizationRecommendation[];
  alerts: BudgetAlert[];
  realTimeData?: RealTimeData;
}
/**
 * Main Budget Usage Visualizer and Analytics Dashboard
 *
 * Coordinates all budget components to provide comprehensive cost tracking,
 * analytics, visualizations, and optimization recommendations.
 */
export declare class BudgetDashboard {
  private budgetTracker;
  private analytics;
  private realTimeTracker;
  private formatter;
  private chartRenderer;
  private config;
  private isRunning;
  private refreshTimer?;
  private currentData?;
  constructor(
    budgetTracker: BudgetTracker,
    analytics: AnalyticsEngine,
    config?: DashboardConfig,
  );
  /**
   * Start the interactive dashboard
   */
  startDashboard(sections?: Partial<DashboardSections>): Promise<void>;
  /**
   * Stop the dashboard
   */
  stopDashboard(): void;
  /**
   * Generate a static dashboard report
   */
  generateReport(sections?: Partial<DashboardSections>): Promise<string>;
  /**
   * Get current dashboard data snapshot
   */
  getDashboardData(): Promise<DashboardData>;
  /**
   * Refresh dashboard display
   */
  private refreshDashboard;
  /**
   * Collect all dashboard data from various sources
   */
  private collectDashboardData;
  /**
   * Generate cost projections based on current usage
   */
  private generateCostProjections;
  /**
   * Generate historical trends data
   */
  private generateTrendsData;
  /**
   * Generate budget alerts based on current status
   */
  private generateBudgetAlerts;
  /**
   * Generate feature cost analysis (mock data)
   */
  private generateFeatureAnalysis;
  /**
   * Generate optimization recommendations
   */
  private generateOptimizationRecommendations;
  /**
   * Setup periodic dashboard refresh
   */
  private setupPeriodicRefresh;
  /**
   * Setup keyboard handlers for interactive mode
   */
  private setupKeyboardHandlers;
}
/**
 * Create a budget dashboard instance
 */
export declare function createBudgetDashboard(
  budgetTracker: BudgetTracker,
  analytics: AnalyticsEngine,
  config?: DashboardConfig,
): BudgetDashboard;
/**
 * Export types for external use
 */
export type {
  DashboardConfig,
  DashboardSections,
  DashboardData,
  BudgetAlert,
  CurrentUsageData,
  CostProjections,
  TrendsData,
};
