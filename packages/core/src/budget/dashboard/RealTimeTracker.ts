/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { BudgetTracker } from '../budget-tracker.js';
import type { AnalyticsEngine } from '../index.js';

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
export class RealTimeTracker {
  private budgetTracker: BudgetTracker;
  private analytics: AnalyticsEngine;
  private listeners: Map<string, UsageEventListener> = new Map();
  private isTracking: boolean = false;
  private trackingInterval?: NodeJS.Timeout;

  // Real-time metrics
  private startTime: Date = new Date();
  private requestCounts: number[] = []; // Last 60 minutes
  private costHistory: number[] = []; // Last 60 minutes
  private minutelyRequests: number = 0;
  private minutelyCost: number = 0;
  private lastMinute: number = new Date().getMinutes();

  // Configuration
  private readonly TRACKING_INTERVAL_MS = 60000; // 1 minute
  private readonly HISTORY_SIZE = 60; // Keep 60 minutes of data
  private readonly REQUEST_RATE_THRESHOLD = 100; // requests per minute
  private readonly COST_RATE_THRESHOLD = 0.1; // $0.10 per minute

  constructor(budgetTracker: BudgetTracker, analytics: AnalyticsEngine) {
    this.budgetTracker = budgetTracker;
    this.analytics = analytics;

    // Initialize history arrays
    this.requestCounts = Array(this.HISTORY_SIZE).fill(0);
    this.costHistory = Array(this.HISTORY_SIZE).fill(0);
  }

  /**
   * Start real-time tracking
   */
  startTracking(): void {
    if (this.isTracking) {
      return;
    }

    this.isTracking = true;
    this.startTime = new Date();

    // Setup periodic data collection
    this.trackingInterval = setInterval(() => {
      this.collectMetrics();
    }, this.TRACKING_INTERVAL_MS);

    // Initial data collection
    this.collectMetrics();
  }

  /**
   * Stop real-time tracking
   */
  stopTracking(): void {
    if (!this.isTracking) {
      return;
    }

    this.isTracking = false;

    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
      this.trackingInterval = undefined;
    }
  }

  /**
   * Get current real-time data
   */
  getRealTimeData(): RealTimeData {
    const currentMinute = new Date().getMinutes();
    const uptimeMinutes = Math.floor(
      (Date.now() - this.startTime.getTime()) / 60000,
    );

    // Calculate rates
    const requestsPerMinute = this.requestCounts[currentMinute] || 0;
    const costPerMinute = this.costHistory[currentMinute] || 0;
    const peakRequestsPerMinute = Math.max(...this.requestCounts);
    const totalRequests = this.requestCounts.reduce(
      (sum, count) => sum + count,
      0,
    );
    const averageRequestsPerMinute =
      uptimeMinutes > 0 ? totalRequests / uptimeMinutes : 0;

    // Calculate total current usage
    const currentRequests = totalRequests;
    const currentCost = this.costHistory.reduce((sum, cost) => sum + cost, 0);

    return {
      currentRequests,
      currentCost,
      requestsPerMinute,
      costPerMinute,
      peakRequestsPerMinute,
      averageRequestsPerMinute,
      uptimeMinutes,
      lastRequestTimestamp: new Date().toISOString(),
      activeFeatures: this.getActiveFeatures(),
      alertThresholds: {
        requestsPerMinute: this.REQUEST_RATE_THRESHOLD,
        costPerMinute: this.COST_RATE_THRESHOLD,
        budgetUtilization: 75, // 75% budget utilization threshold
      },
    };
  }

  /**
   * Record a usage event (called by the system when requests are made)
   */
  recordUsage(
    cost: number,
    feature?: string,
    metadata?: Record<string, unknown>,
  ): void {
    const currentMinute = new Date().getMinutes();

    // Update current minute's counters
    if (currentMinute !== this.lastMinute) {
      // New minute - reset counters
      this.minutelyRequests = 0;
      this.minutelyCost = 0;
      this.lastMinute = currentMinute;
    }

    this.minutelyRequests++;
    this.minutelyCost += cost;

    // Update history arrays
    this.requestCounts[currentMinute] = this.minutelyRequests;
    this.costHistory[currentMinute] = this.minutelyCost;

    // Create usage event
    const event: UsageEvent = {
      timestamp: new Date().toISOString(),
      type: 'request',
      value: 1,
      feature,
      metadata,
    };

    // Check for threshold breaches
    this.checkThresholds(this.minutelyRequests, this.minutelyCost);

    // Notify listeners
    this.notifyListeners(event);
  }

  /**
   * Add a usage event listener
   */
  addListener(id: string, listener: UsageEventListener): void {
    this.listeners.set(id, listener);
  }

  /**
   * Remove a usage event listener
   */
  removeListener(id: string): void {
    this.listeners.delete(id);
  }

  /**
   * Get usage trend analysis
   */
  getTrendAnalysis(): {
    trend: 'increasing' | 'decreasing' | 'stable' | 'volatile';
    confidence: number;
    projectedNextHour: { requests: number; cost: number };
  } {
    // Simple trend analysis based on recent data
    const recentData = this.requestCounts.slice(-10); // Last 10 minutes
    const olderData = this.requestCounts.slice(-20, -10); // Previous 10 minutes

    const recentAvg =
      recentData.reduce((sum, val) => sum + val, 0) / recentData.length;
    const olderAvg =
      olderData.reduce((sum, val) => sum + val, 0) / olderData.length;

    let trend: 'increasing' | 'decreasing' | 'stable' | 'volatile';
    let confidence: number;

    const change = recentAvg - olderAvg;
    const changePercent = olderAvg > 0 ? Math.abs(change) / olderAvg : 0;

    if (changePercent < 0.1) {
      trend = 'stable';
      confidence = 0.8;
    } else if (change > 0) {
      trend = 'increasing';
      confidence = Math.min(0.9, changePercent);
    } else {
      trend = 'decreasing';
      confidence = Math.min(0.9, changePercent);
    }

    // Check for volatility
    const variance =
      recentData.reduce((sum, val) => sum + Math.pow(val - recentAvg, 2), 0) /
      recentData.length;
    if (variance > recentAvg) {
      trend = 'volatile';
      confidence = 0.6;
    }

    // Project next hour usage
    const currentRate = recentAvg;
    const projectedRequests = currentRate * 60; // 60 minutes
    const avgCostPerRequest =
      this.costHistory.reduce((sum, cost) => sum + cost, 0) /
      this.requestCounts.reduce((sum, req) => sum + req, 0);
    const projectedCost = projectedRequests * (avgCostPerRequest || 0);

    return {
      trend,
      confidence,
      projectedNextHour: {
        requests: Math.round(projectedRequests),
        cost: Math.round(projectedCost * 10000) / 10000, // Round to 4 decimal places
      },
    };
  }

  /**
   * Get current minute-by-minute usage data for visualization
   */
  getMinutelyData(): {
    requests: number[];
    costs: number[];
    timestamps: string[];
  } {
    const timestamps = Array.from({ length: this.HISTORY_SIZE }, (_, i) => {
      const date = new Date();
      date.setMinutes(date.getMinutes() - (this.HISTORY_SIZE - 1 - i));
      return date.toISOString();
    });

    return {
      requests: [...this.requestCounts],
      costs: [...this.costHistory],
      timestamps,
    };
  }

  /**
   * Collect metrics from the budget tracker and analytics engine
   */
  private collectMetrics(): void {
    // This would integrate with the actual budget tracker and analytics
    // For now, we'll maintain the internal state

    // Rotate history arrays if needed (circular buffer)
    const currentMinute = new Date().getMinutes();

    // Clear old data points that are more than HISTORY_SIZE minutes old
    if (this.requestCounts.length >= this.HISTORY_SIZE) {
      const oldestIndex = (currentMinute + 1) % this.HISTORY_SIZE;
      this.requestCounts[oldestIndex] = 0;
      this.costHistory[oldestIndex] = 0;
    }
  }

  /**
   * Get list of currently active features
   */
  private getActiveFeatures(): string[] {
    // This would integrate with the analytics engine to get actual active features
    // For now, return a placeholder list
    return ['chat', 'code-analysis', 'documentation'];
  }

  /**
   * Check for threshold breaches and generate alerts
   */
  private checkThresholds(requests: number, cost: number): void {
    const budgetSettings = this.budgetTracker.getBudgetSettings();

    // Check request rate threshold
    if (requests > this.REQUEST_RATE_THRESHOLD) {
      const event: UsageEvent = {
        timestamp: new Date().toISOString(),
        type: 'threshold_breach',
        value: requests,
        metadata: {
          threshold: this.REQUEST_RATE_THRESHOLD,
          type: 'request_rate',
          severity: 'warning',
        },
      };
      this.notifyListeners(event);
    }

    // Check cost rate threshold
    if (cost > this.COST_RATE_THRESHOLD) {
      const event: UsageEvent = {
        timestamp: new Date().toISOString(),
        type: 'threshold_breach',
        value: cost,
        metadata: {
          threshold: this.COST_RATE_THRESHOLD,
          type: 'cost_rate',
          severity: 'warning',
        },
      };
      this.notifyListeners(event);
    }

    // Check budget utilization if budget is enabled
    if (budgetSettings.enabled && budgetSettings.dailyLimit) {
      const totalCost = this.costHistory.reduce((sum, c) => sum + c, 0);
      const utilization = (totalCost / budgetSettings.dailyLimit) * 100;

      if (utilization > 75) {
        const severity = utilization > 90 ? 'critical' : 'warning';
        const event: UsageEvent = {
          timestamp: new Date().toISOString(),
          type: 'threshold_breach',
          value: utilization,
          metadata: {
            threshold: 75,
            type: 'budget_utilization',
            severity,
          },
        };
        this.notifyListeners(event);
      }
    }
  }

  /**
   * Notify all listeners of a usage event
   */
  private notifyListeners(event: UsageEvent): void {
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in usage event listener:', error);
      }
    });
  }
}

/**
 * Create a real-time tracker instance
 */
export function createRealTimeTracker(
  budgetTracker: BudgetTracker,
  analytics: AnalyticsEngine,
): RealTimeTracker {
  return new RealTimeTracker(budgetTracker, analytics);
}
