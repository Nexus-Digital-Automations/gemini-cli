/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { BudgetTracker } from '../budget-tracker.js';
import type { AnalyticsEngine } from '../index';
/**
 * Real-time usage tracking data
 */
export interface RealTimeData {
    currentRequests: number;
    currentCost: number;
    requestsPerMinute: number;
    costPerMinute: number;
    peakRequestsPerMinute: number;
    averageRequestsPerMinute: number;
    uptimeMinutes: number;
    lastRequestTimestamp?: string;
    activeFeatures: string[];
    alertThresholds: {
        requestsPerMinute: number;
        costPerMinute: number;
        budgetUtilization: number;
    };
}
/**
 * Real-time usage event
 */
export interface UsageEvent {
    timestamp: string;
    type: 'request' | 'cost' | 'threshold_breach';
    value: number;
    feature?: string;
    metadata?: Record<string, unknown>;
}
/**
 * Real-time usage listener
 */
export type UsageEventListener = (event: UsageEvent) => void;
/**
 * Real-Time Budget Usage Tracker
 *
 * Monitors budget usage in real-time, tracks patterns,
 * and provides live updates for the dashboard visualization.
 */
export declare class RealTimeTracker {
    private budgetTracker;
    private analytics;
    private listeners;
    private isTracking;
    private trackingInterval?;
    private startTime;
    private requestCounts;
    private costHistory;
    private minutelyRequests;
    private minutelyCost;
    private lastMinute;
    private readonly TRACKING_INTERVAL_MS;
    private readonly HISTORY_SIZE;
    private readonly REQUEST_RATE_THRESHOLD;
    private readonly COST_RATE_THRESHOLD;
    constructor(budgetTracker: BudgetTracker, analytics: AnalyticsEngine);
    /**
     * Start real-time tracking
     */
    startTracking(): void;
    /**
     * Stop real-time tracking
     */
    stopTracking(): void;
    /**
     * Get current real-time data
     */
    getRealTimeData(): RealTimeData;
    /**
     * Record a usage event (called by the system when requests are made)
     */
    recordUsage(cost: number, feature?: string, metadata?: Record<string, unknown>): void;
    /**
     * Add a usage event listener
     */
    addListener(id: string, listener: UsageEventListener): void;
    /**
     * Remove a usage event listener
     */
    removeListener(id: string): void;
    /**
     * Get usage trend analysis
     */
    getTrendAnalysis(): {
        trend: 'increasing' | 'decreasing' | 'stable' | 'volatile';
        confidence: number;
        projectedNextHour: {
            requests: number;
            cost: number;
        };
    };
    /**
     * Get current minute-by-minute usage data for visualization
     */
    getMinutelyData(): {
        requests: number[];
        costs: number[];
        timestamps: string[];
    };
    /**
     * Collect metrics from the budget tracker and analytics engine
     */
    private collectMetrics;
    /**
     * Get list of currently active features
     */
    private getActiveFeatures;
    /**
     * Check for threshold breaches and generate alerts
     */
    private checkThresholds;
    /**
     * Notify all listeners of a usage event
     */
    private notifyListeners;
}
/**
 * Create a real-time tracker instance
 */
export declare function createRealTimeTracker(budgetTracker: BudgetTracker, analytics: AnalyticsEngine): RealTimeTracker;
