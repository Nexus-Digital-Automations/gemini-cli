/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import EventEmitter from 'node:events';
import type { TokenUsageData } from './realtime-token-tracker.js';
/**
 * Time-series partitioning configuration
 */
export interface PartitionConfig {
    readonly strategy: 'hourly' | 'daily' | 'weekly';
    readonly compressionLevel: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
    readonly maxPartitionSizeMB: number;
    readonly enableIndexing: boolean;
    readonly retentionDays: number;
}
/**
 * Query parameters for analytics data retrieval
 */
export interface AnalyticsQuery {
    readonly sessionId?: string;
    readonly model?: string;
    readonly authType?: string;
    readonly command?: string;
    readonly feature?: string;
    readonly userId?: string;
    readonly startTime?: number;
    readonly endTime?: number;
    readonly minTokens?: number;
    readonly maxTokens?: number;
    readonly minCost?: number;
    readonly maxCost?: number;
    readonly limit?: number;
    readonly offset?: number;
    readonly sortBy?: keyof TokenUsageData;
    readonly sortOrder?: 'asc' | 'desc';
    readonly aggregateBy?: 'hour' | 'day' | 'session' | 'model' | 'command';
}
/**
 * Query result with pagination and metadata
 */
export interface QueryResult {
    readonly data: TokenUsageData[];
    readonly totalCount: number;
    readonly hasMore: boolean;
    readonly queryTimeMs: number;
    readonly partitionsScanned: number;
    readonly metadata: {
        readonly cacheHit: boolean;
        readonly compressionRatio?: number;
        readonly indexUsed: boolean;
    };
}
/**
 * Aggregated query result for analytics
 */
export interface AggregatedResult {
    readonly groupKey: string;
    readonly totalTokens: number;
    readonly totalCost: number;
    readonly requestCount: number;
    readonly averageLatency: number;
    readonly errorRate: number;
    readonly timeRange: {
        start: number;
        end: number;
    };
}
/**
 * High-performance analytics storage engine optimized for time-series token usage data
 */
export declare class AnalyticsStorageEngine extends EventEmitter {
    private readonly config;
    private readonly basePath;
    private readonly partitionMetadata;
    private readonly queryCache;
    private readonly writeBuffer;
    private writeTimeout;
    private readonly writeBufferMaxSize;
    private readonly writeBufferTimeoutMs;
    constructor(config: PartitionConfig, basePath?: string);
    /**
     * Store token usage data with automatic partitioning and compression
     */
    storeTokenUsage(data: TokenUsageData | TokenUsageData[]): Promise<void>;
    /**
     * Query token usage data with advanced filtering and aggregation
     */
    queryTokenUsage(query: AnalyticsQuery): Promise<QueryResult>;
    /**
     * Get aggregated statistics for analytics dashboard
     */
    getAggregatedStatistics(query: AnalyticsQuery): Promise<AggregatedResult[]>;
    /**
     * Export data for external analytics tools
     */
    exportData(query: AnalyticsQuery, format?: 'json' | 'csv' | 'ndjson'): Promise<NodeJS.ReadableStream>;
    /**
     * Get storage engine statistics
     */
    getStorageStats(): {
        totalPartitions: number;
        totalRecords: number;
        compressedSizeBytes: number;
        uncompressedSizeBytes: number;
        compressionRatio: number;
        cacheStats: {
            size: number;
            hitRate: number;
        };
        oldestRecord: number;
        newestRecord: number;
    };
    /**
     * Cleanup old partitions based on retention policy
     */
    cleanup(): Promise<{
        deletedPartitions: number;
        freedBytes: number;
    }>;
    private flushWriteBuffer;
    private writeToPartition;
    private readPartition;
    private buildIndexes;
    private getPartitionId;
    private findRelevantPartitions;
    private canUseIndexForQuery;
    private queryPartition;
    private applyQueryFilters;
    private applySorting;
    private calculateCompressionRatio;
    private generateCacheKey;
    private createCsvStream;
    private createNdjsonStream;
    private ensureDirectoryExists;
    private loadPartitionMetadata;
    private savePartitionMetadata;
    private setupMaintenanceTasks;
}
/**
 * Get or create the global AnalyticsStorageEngine instance
 */
export declare function getGlobalStorageEngine(config?: Partial<PartitionConfig>): AnalyticsStorageEngine;
/**
 * Reset the global storage engine (mainly for testing)
 */
export declare function resetGlobalStorageEngine(): void;
