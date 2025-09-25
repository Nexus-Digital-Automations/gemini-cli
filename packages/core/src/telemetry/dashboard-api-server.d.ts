/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import EventEmitter from 'node:events';
import type { RealtimeTokenTracker } from './realtime-token-tracker.js';
import type { AnalyticsStorageEngine } from './analytics-storage-engine.js';
import type { AnalyticsIntelligenceEngine } from './analytics-intelligence-engine.js';
/**
 * Dashboard API configuration
 */
export interface DashboardConfig {
  readonly port: number;
  readonly host: string;
  readonly corsOrigins: string[];
  readonly maxRequestsPerMinute: number;
  readonly enableRealTimeUpdates: boolean;
  readonly enableCaching: boolean;
  readonly cacheTimeout: number;
  readonly enableAuthentication: boolean;
  readonly apiKey?: string;
}
/**
 * High-performance dashboard API server with real-time capabilities
 */
export declare class DashboardApiServer extends EventEmitter {
  private readonly config;
  private readonly tokenTracker;
  private readonly storageEngine;
  private readonly intelligenceEngine;
  private readonly server;
  private readonly rateLimiter;
  private readonly responseCache;
  private readonly sseManager;
  private isRunning;
  constructor(
    config: DashboardConfig,
    tokenTracker: RealtimeTokenTracker,
    storageEngine: AnalyticsStorageEngine,
    intelligenceEngine: AnalyticsIntelligenceEngine,
  );
  /**
   * Start the dashboard API server
   */
  start(): Promise<void>;
  /**
   * Stop the dashboard API server
   */
  stop(): Promise<void>;
  /**
   * Get server status
   */
  getStatus(): {
    isRunning: boolean;
    port: number;
    host: string;
    connectionsCount: number;
    cacheStats: {
      size: number;
      totalHits: number;
    };
    uptime: number;
  };
  private setupRequestHandler;
  private routeRequest;
  private handleDashboardInsights;
  private handleUsageStatistics;
  private handleUsageData;
  private handleUsagePatterns;
  private handleOptimizationRecommendations;
  private handlePerformancePrediction;
  private handleStorageStats;
  private handleExportUsage;
  private handleRealtimeEvents;
  private handleHealthCheck;
  private setupRealtimeUpdates;
  private setupPeriodicTasks;
  private getDashboardInsights;
  private setupCors;
  private isAuthenticated;
  private getClientId;
  private generateRequestId;
  private sendSuccess;
  private sendError;
}
/**
 * Create and configure a dashboard API server instance
 */
export declare function createDashboardServer(
  tokenTracker: RealtimeTokenTracker,
  storageEngine: AnalyticsStorageEngine,
  intelligenceEngine: AnalyticsIntelligenceEngine,
  config?: Partial<DashboardConfig>,
): DashboardApiServer;
