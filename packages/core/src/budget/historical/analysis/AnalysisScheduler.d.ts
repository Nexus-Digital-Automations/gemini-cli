/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { QueryBuilder } from '../querying/types.js';
import type { AnalysisScheduler, AnalysisJob, TrendAnalysisEngine } from './types.js';
/**
 * Analysis job scheduler with background processing capabilities
 * Manages long-running analysis tasks with progress tracking and cancellation
 */
export declare class AnalysisSchedulerImpl implements AnalysisScheduler {
    private readonly logger;
    private readonly trendEngine;
    private readonly dataQueryBuilder;
    private readonly jobs;
    private readonly runningJobs;
    private readonly jobQueue;
    private readonly maxConcurrentJobs;
    private readonly jobStoragePath;
    private readonly jobRetentionDays;
    private cleanupInterval?;
    /**
     * Create a new analysis scheduler
     */
    constructor(trendEngine: TrendAnalysisEngine, dataQueryBuilder: () => QueryBuilder, options?: {
        maxConcurrentJobs?: number;
        jobStoragePath?: string;
        jobRetentionDays?: number;
    });
    /**
     * Schedule analysis job
     */
    scheduleJob(jobRequest: Omit<AnalysisJob, 'id' | 'createdAt' | 'status' | 'progress'>): Promise<string>;
    /**
     * Get job status
     */
    getJobStatus(jobId: string): Promise<AnalysisJob | null>;
    /**
     * Cancel running job
     */
    cancelJob(jobId: string): Promise<boolean>;
    /**
     * List jobs with optional filtering
     */
    listJobs(filter?: {
        type?: AnalysisJob['type'];
        status?: AnalysisJob['status'];
        limit?: number;
    }): Promise<AnalysisJob[]>;
    /**
     * Clean up completed jobs
     */
    cleanupJobs(olderThan: number): Promise<number>;
    /**
     * Shutdown scheduler and cleanup resources
     */
    shutdown(): Promise<void>;
    /**
     * Validate job request configuration
     */
    private validateJobRequest;
    /**
     * Process job queue
     */
    private processJobQueue;
    /**
     * Start job execution
     */
    private startJobExecution;
    /**
     * Execute analysis job based on type
     */
    private executeJob;
    /**
     * Execute trend analysis
     */
    private executeTrendAnalysis;
    /**
     * Execute seasonal analysis
     */
    private executeSeasonalAnalysis;
    /**
     * Execute anomaly analysis
     */
    private executeAnomalyAnalysis;
    /**
     * Execute efficiency analysis
     */
    private executeEfficiencyAnalysis;
    /**
     * Execute forecast analysis
     */
    private executeForecastAnalysis;
    /**
     * Execute comprehensive insights analysis
     */
    private executeInsightsAnalysis;
    /**
     * Check for job cancellation
     */
    private checkCancellation;
    /**
     * Update job progress
     */
    private updateProgress;
    /**
     * Calculate estimated completion time
     */
    private calculateEstimatedCompletion;
    /**
     * Generate unique job ID
     */
    private generateJobId;
    /**
     * Start background cleanup scheduler
     */
    private startCleanupScheduler;
    /**
     * Persist job to storage
     */
    private persistJob;
    /**
     * Load persisted jobs from storage
     */
    private loadPersistedJobs;
    /**
     * Delete persisted job from storage
     */
    private deletePersistedJob;
}
/**
 * Factory function to create an analysis scheduler
 */
export declare function createAnalysisScheduler(trendEngine: TrendAnalysisEngine, dataQueryBuilder: () => QueryBuilder, options?: {
    maxConcurrentJobs?: number;
    jobStoragePath?: string;
    jobRetentionDays?: number;
}): AnalysisScheduler;
