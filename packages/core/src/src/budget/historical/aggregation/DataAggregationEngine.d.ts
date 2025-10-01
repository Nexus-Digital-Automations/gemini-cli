/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { BudgetUsageTimeSeriesPoint } from '../storage/types.js';
import type { AggregationEngine, AggregationConfig, AggregationResult, AggregationWindow, AggregationHierarchy, RollupStrategy, AggregationJob } from './types.js';
/**
 * Comprehensive data aggregation engine for budget usage data
 *
 * Features:
 * - Multi-dimensional statistical aggregation
 * - Hierarchical time-window aggregation (minute -> hour -> day -> week -> month)
 * - Intelligent caching and invalidation
 * - Automated rollup strategies for data compression
 * - Parallel processing for large datasets
 * - Advanced pattern detection and analysis
 */
export declare class DataAggregationEngine implements AggregationEngine {
    private readonly cacheDir;
    private readonly cache;
    private readonly jobQueue;
    private jobIdCounter;
    constructor(baseDir: string);
    /**
     * Initialize aggregation engine
     */
    private initializeEngine;
    /**
     * Load existing cache from disk
     */
    private loadCache;
    /**
     * Save cache to disk
     */
    private saveCache;
    /**
     * Check if cache entry is still valid
     */
    private isCacheEntryValid;
    /**
     * Generate cache key for aggregation
     */
    private generateCacheKey;
    /**
     * Hash aggregation configuration for caching
     */
    private hashConfig;
    /**
     * Perform aggregation on raw data
     */
    aggregate(data: BudgetUsageTimeSeriesPoint[], config: AggregationConfig): Promise<AggregationResult[]>;
    /**
     * Validate and clean input data
     */
    private validateAndCleanData;
    /**
     * Aggregate data by specific time window
     */
    private aggregateByWindow;
    /**
     * Group data points by time window
     */
    private groupDataByTimeWindow;
    /**
     * Get window key for grouping data points
     */
    private getWindowKey;
    /**
     * Parse window key back to start and end timestamps
     */
    private parseWindowKey;
    /**
     * Get week number for date
     */
    private getWeekNumber;
    /**
     * Get date from year and week number
     */
    private getDateFromWeekNumber;
    /**
     * Get appropriate granularity for time window
     */
    private getGranularityForWindow;
    /**
     * Aggregate usage metrics
     */
    private aggregateUsageMetrics;
    /**
     * Aggregate cost metrics
     */
    private aggregateCostMetrics;
    /**
     * Aggregate request metrics
     */
    private aggregateRequestMetrics;
    /**
     * Aggregate usage percentage metrics
     */
    private aggregateUsagePercentageMetrics;
    /**
     * Calculate cost per request metrics
     */
    private calculateCostPerRequestMetrics;
    /**
     * Calculate requests per hour
     */
    private calculateRequestsPerHour;
    /**
     * Calculate feature distribution
     */
    private calculateFeatureDistribution;
    /**
     * Calculate unique session count
     */
    private calculateSessionCount;
    /**
     * Calculate unique user count (estimate based on sessions)
     */
    private calculateUniqueUsers;
    /**
     * Add time patterns to aggregation result
     */
    private addTimePatterns;
    /**
     * Add peak usage analysis
     */
    private addPeakUsageAnalysis;
    /**
     * Cache aggregation results
     */
    private cacheResults;
    /**
     * Create multi-level aggregation hierarchy
     */
    createHierarchy(baseWindow: AggregationWindow, levels: number): AggregationHierarchy;
    /**
     * Calculate rollup factor between two time windows
     */
    private calculateRollupFactor;
    /**
     * Execute rollup strategy
     */
    rollup(strategy: RollupStrategy): Promise<void>;
    /**
     * Execute time-based rollup strategy
     */
    private executeTimeBasedRollup;
    /**
     * Execute threshold-based rollup
     */
    private executeThresholdBasedRollup;
    /**
     * Execute hybrid rollup strategy
     */
    private executeHybridRollup;
    /**
     * Get or compute cached aggregation
     */
    getCachedAggregation(windowStart: number, windowEnd: number, window: AggregationWindow): Promise<AggregationResult | null>;
    /**
     * Invalidate cache entries
     */
    invalidateCache(dependencies: string[]): Promise<void>;
    /**
     * Schedule aggregation job
     */
    scheduleJob(job: AggregationJob): Promise<string>;
    /**
     * Execute job asynchronously
     */
    private executeJobAsync;
    /**
     * Get job status
     */
    getJobStatus(jobId: string): Promise<AggregationJob>;
    /**
     * Cancel running job
     */
    cancelJob(jobId: string): Promise<void>;
    /**
     * Get aggregation statistics
     */
    getStats(): Promise<{
        totalAggregations: number;
        cacheHitRatio: number;
        averageAggregationTime: number;
        pendingJobs: number;
        runningJobs: number;
    }>;
}
/**
 * Factory function to create a data aggregation engine
 */
export declare function createDataAggregationEngine(baseDir: string): DataAggregationEngine;
