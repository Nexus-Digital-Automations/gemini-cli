/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { BudgetTracker } from '../budget-tracker.js';
import type { AnalyticsEngine, FeatureCostAnalysis, OptimizationRecommendation } from '../index.js';
import { type RealTimeData } from './RealTimeTracker.js';
/**
 * Dashboard configuration options
 */
export interface BudgetDashboardConfig {
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
export interface BudgetDashboardSections {
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
export interface BudgetDashboardAlert {
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
export interface BudgetCurrentUsageData {
    todayRequests: number;
    todayCost: number;
    budgetRemaining: number;
    budgetUtilization: number;
}
/**
 * Cost projections data
 */
export interface BudgetCostProjections {
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
export interface BudgetTrendsData {
    hourlyUsage: number[];
    dailyUsage: number[];
    weeklyUsage: number[];
}
/**
 * Complete dashboard data structure
 */
export interface BudgetDashboardData {
    currentUsage: BudgetCurrentUsageData;
    projections: BudgetCostProjections;
    trends: BudgetTrendsData;
    features: FeatureCostAnalysis[];
    recommendations: OptimizationRecommendation[];
    alerts: BudgetDashboardAlert[];
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
    constructor(budgetTracker: BudgetTracker, analytics: AnalyticsEngine, config?: BudgetDashboardConfig);
    /**
     * Start the interactive dashboard
     */
    startDashboard(sections?: Partial<BudgetDashboardSections>): Promise<void>;
    /**
     * Stop the dashboard
     */
    stopDashboard(): void;
    /**
     * Generate a static dashboard report
     */
    generateReport(sections?: Partial<BudgetDashboardSections>): Promise<string>;
    /**
     * Get current dashboard data snapshot
     */
    getBudgetDashboardData(): Promise<BudgetDashboardData>;
    /**
     * Refresh dashboard display
     */
    private refreshDashboard;
    /**
     * Collect all dashboard data from various sources
     */
    private collectBudgetDashboardData;
    /**
     * Generate cost projections based on current usage
     */
    private generateBudgetCostProjections;
    /**
     * Generate historical trends data
     */
    private generateBudgetTrendsData;
    /**
     * Generate budget alerts based on current status
     */
    private generateBudgetDashboardAlerts;
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
export declare function createBudgetDashboard(budgetTracker: BudgetTracker, analytics: AnalyticsEngine, config?: BudgetDashboardConfig): BudgetDashboard;
