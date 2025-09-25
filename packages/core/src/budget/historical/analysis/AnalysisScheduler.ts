/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Background analysis job scheduler implementation
 * Manages and executes analysis tasks asynchronously with progress tracking
 *
 * @author Historical Data Storage and Analysis Agent
 * @version 1.0.0
 */

import { createLogger } from '../../../utils/logger.js';
import type { Logger } from '../../../types/common.js';
import type { BudgetUsageTimeSeriesPoint } from '../storage/types.js';
import type { QueryBuilder } from '../querying/types.js';
import type {
  AnalysisScheduler,
  AnalysisJob,
  AnalysisConfig,
  TrendAnalysisEngine,
  InsightsReport,
  TrendAnalysis,
  AnomalyDetection,
} from './types.js';

/**
 * Job execution context
 */
interface JobExecutionContext {
  job: AnalysisJob;
  startTime: number;
  cancelRequested: boolean;
  progressCallback?: (progress: number) => void;
}

/**
 * Analysis job scheduler with background processing capabilities
 * Manages long-running analysis tasks with progress tracking and cancellation
 */
export class AnalysisSchedulerImpl implements AnalysisScheduler {
  private readonly logger: Logger;
  private readonly trendEngine: TrendAnalysisEngine;
  private readonly dataQueryBuilder: () => QueryBuilder;

  // Job management
  private readonly jobs = new Map<string, AnalysisJob>();
  private readonly runningJobs = new Map<string, JobExecutionContext>();
  private readonly jobQueue: string[] = [];
  private readonly maxConcurrentJobs: number;

  // Job persistence and cleanup
  private readonly jobStoragePath: string;
  private readonly jobRetentionDays: number;
  private cleanupInterval?: NodeJS.Timeout;

  /**
   * Create a new analysis scheduler
   */
  constructor(
    trendEngine: TrendAnalysisEngine,
    dataQueryBuilder: () => QueryBuilder,
    options: {
      maxConcurrentJobs?: number;
      jobStoragePath?: string;
      jobRetentionDays?: number;
    } = {},
  ) {
    this.logger = createLogger('AnalysisScheduler');
    this.trendEngine = trendEngine;
    this.dataQueryBuilder = dataQueryBuilder;

    this.maxConcurrentJobs = options.maxConcurrentJobs || 3;
    this.jobStoragePath = options.jobStoragePath || './data/analysis-jobs';
    this.jobRetentionDays = options.jobRetentionDays || 7;

    this.logger.info('AnalysisScheduler initialized', {
      maxConcurrentJobs: this.maxConcurrentJobs,
      jobStoragePath: this.jobStoragePath,
      jobRetentionDays: this.jobRetentionDays,
    });

    // Start background cleanup
    this.startCleanupScheduler();

    // Load existing jobs
    this.loadPersistedJobs().catch((error) => {
      this.logger.warn('Failed to load persisted jobs', {
        error: error.message,
      });
    });
  }

  /**
   * Schedule analysis job
   */
  async scheduleJob(
    jobRequest: Omit<AnalysisJob, 'id' | 'createdAt' | 'status' | 'progress'>,
  ): Promise<string> {
    const startTime = Date.now();
    const jobId = this.generateJobId();

    const job: AnalysisJob = {
      id: jobId,
      createdAt: Date.now(),
      status: 'pending',
      progress: 0,
      ...jobRequest,
    };

    this.logger.info('Scheduling analysis job', {
      jobId,
      type: job.type,
      dataQuery: job.dataQuery,
    });

    try {
      // Validate job configuration
      this.validateJobRequest(job);

      // Store job
      this.jobs.set(jobId, job);
      this.jobQueue.push(jobId);

      // Persist job
      await this.persistJob(job);

      // Start processing if slots available
      this.processJobQueue();

      this.logger.info('Job scheduled successfully', {
        jobId,
        queuePosition: this.jobQueue.length,
        duration: Date.now() - startTime,
      });

      return jobId;
    } catch (error) {
      this.logger.error('Failed to schedule job', {
        jobId,
        error: error.message,
        duration: Date.now() - startTime,
      });
      throw error;
    }
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId: string): Promise<AnalysisJob | null> {
    const job = this.jobs.get(jobId);

    if (!job) {
      this.logger.warn('Job not found', { jobId });
      return null;
    }

    // Update progress for running jobs
    const runningContext = this.runningJobs.get(jobId);
    if (runningContext) {
      job.estimatedCompletion =
        this.calculateEstimatedCompletion(runningContext);
    }

    return { ...job }; // Return copy to prevent external mutation
  }

  /**
   * Cancel running job
   */
  async cancelJob(jobId: string): Promise<boolean> {
    this.logger.info('Canceling job', { jobId });

    const job = this.jobs.get(jobId);
    if (!job) {
      this.logger.warn('Job not found for cancellation', { jobId });
      return false;
    }

    try {
      // Remove from queue if pending
      const queueIndex = this.jobQueue.indexOf(jobId);
      if (queueIndex !== -1) {
        this.jobQueue.splice(queueIndex, 1);
        job.status = 'failed';
        job.error = {
          message: 'Job cancelled before execution',
          code: 'JOB_CANCELLED',
          details: { cancelledAt: Date.now() },
        };

        await this.persistJob(job);
        this.logger.info('Pending job cancelled', { jobId });
        return true;
      }

      // Cancel running job
      const runningContext = this.runningJobs.get(jobId);
      if (runningContext) {
        runningContext.cancelRequested = true;
        this.logger.info('Running job cancellation requested', { jobId });
        return true;
      }

      this.logger.warn('Job not in cancellable state', {
        jobId,
        status: job.status,
      });
      return false;
    } catch (error) {
      this.logger.error('Failed to cancel job', {
        jobId,
        error: error.message,
      });
      return false;
    }
  }

  /**
   * List jobs with optional filtering
   */
  async listJobs(filter?: {
    type?: AnalysisJob['type'];
    status?: AnalysisJob['status'];
    limit?: number;
  }): Promise<AnalysisJob[]> {
    let jobs = Array.from(this.jobs.values());

    // Apply filters
    if (filter?.type) {
      jobs = jobs.filter((job) => job.type === filter.type);
    }

    if (filter?.status) {
      jobs = jobs.filter((job) => job.status === filter.status);
    }

    // Sort by creation time (newest first)
    jobs.sort((a, b) => b.createdAt - a.createdAt);

    // Apply limit
    if (filter?.limit && filter.limit > 0) {
      jobs = jobs.slice(0, filter.limit);
    }

    return jobs.map((job) => ({ ...job })); // Return copies
  }

  /**
   * Clean up completed jobs
   */
  async cleanupJobs(olderThan: number): Promise<number> {
    const startTime = Date.now();
    this.logger.info('Starting job cleanup', { olderThan });

    try {
      const cutoffTime = Date.now() - olderThan;
      const jobsToDelete: string[] = [];

      for (const [jobId, job] of this.jobs.entries()) {
        if (
          (job.status === 'completed' || job.status === 'failed') &&
          job.createdAt < cutoffTime
        ) {
          jobsToDelete.push(jobId);
        }
      }

      // Remove from memory and storage
      for (const jobId of jobsToDelete) {
        this.jobs.delete(jobId);
        await this.deletePersistedJob(jobId);
      }

      this.logger.info('Job cleanup completed', {
        deletedCount: jobsToDelete.length,
        duration: Date.now() - startTime,
      });

      return jobsToDelete.length;
    } catch (error) {
      this.logger.error('Job cleanup failed', {
        error: error.message,
        duration: Date.now() - startTime,
      });
      throw error;
    }
  }

  /**
   * Shutdown scheduler and cleanup resources
   */
  async shutdown(): Promise<void> {
    this.logger.info('Shutting down analysis scheduler');

    try {
      // Stop cleanup scheduler
      if (this.cleanupInterval) {
        clearInterval(this.cleanupInterval);
        this.cleanupInterval = undefined;
      }

      // Cancel all running jobs
      const cancelPromises: Array<Promise<boolean>> = [];
      for (const jobId of this.runningJobs.keys()) {
        cancelPromises.push(this.cancelJob(jobId));
      }

      await Promise.allSettled(cancelPromises);

      // Persist final job states
      const persistPromises: Array<Promise<void>> = [];
      for (const job of this.jobs.values()) {
        persistPromises.push(this.persistJob(job));
      }

      await Promise.allSettled(persistPromises);

      this.logger.info('Analysis scheduler shutdown completed');
    } catch (error) {
      this.logger.error('Error during scheduler shutdown', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Validate job request configuration
   */
  private validateJobRequest(job: AnalysisJob): void {
    if (!job.type) {
      throw new Error('Job type is required');
    }

    if (!job.dataQuery || !job.dataQuery.startTime || !job.dataQuery.endTime) {
      throw new Error('Valid data query with start and end time is required');
    }

    if (job.dataQuery.startTime >= job.dataQuery.endTime) {
      throw new Error('Data query start time must be before end time');
    }

    if (!job.config) {
      throw new Error('Analysis configuration is required');
    }

    // Validate analysis config based on job type
    if (job.type === 'forecast' && !job.config.forecastHorizon) {
      throw new Error('Forecast horizon is required for forecast jobs');
    }

    if (job.type === 'seasonal' && !job.config.includeSeasonality) {
      throw new Error('Seasonality analysis must be enabled for seasonal jobs');
    }
  }

  /**
   * Process job queue
   */
  private processJobQueue(): void {
    // Start jobs up to the concurrent limit
    while (
      this.runningJobs.size < this.maxConcurrentJobs &&
      this.jobQueue.length > 0
    ) {
      const jobId = this.jobQueue.shift();
      if (jobId) {
        this.startJobExecution(jobId).catch((error) => {
          this.logger.error('Failed to start job execution', {
            jobId,
            error: error.message,
          });
        });
      }
    }
  }

  /**
   * Start job execution
   */
  private async startJobExecution(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) {
      this.logger.error('Job not found for execution', { jobId });
      return;
    }

    const context: JobExecutionContext = {
      job,
      startTime: Date.now(),
      cancelRequested: false,
    };

    this.runningJobs.set(jobId, context);

    this.logger.info('Starting job execution', {
      jobId,
      type: job.type,
    });

    try {
      // Update job status
      job.status = 'running';
      job.startedAt = context.startTime;
      job.progress = 0;
      await this.persistJob(job);

      // Execute the job
      const result = await this.executeJob(context);

      // Handle successful completion
      if (!context.cancelRequested) {
        job.status = 'completed';
        job.completedAt = Date.now();
        job.progress = 100;
        job.result = result;
        await this.persistJob(job);

        this.logger.info('Job completed successfully', {
          jobId,
          duration: Date.now() - context.startTime,
        });
      }
    } catch (error) {
      // Handle job failure
      job.status = 'failed';
      job.completedAt = Date.now();
      job.error = {
        message: error.message,
        code: error.code || 'EXECUTION_ERROR',
        details: {
          timestamp: Date.now(),
          stack: error.stack,
        },
      };
      await this.persistJob(job);

      this.logger.error('Job execution failed', {
        jobId,
        error: error.message,
        duration: Date.now() - context.startTime,
      });
    } finally {
      // Cleanup and process next job
      this.runningJobs.delete(jobId);
      this.processJobQueue();
    }
  }

  /**
   * Execute analysis job based on type
   */
  private async executeJob(
    context: JobExecutionContext,
  ): Promise<InsightsReport | TrendAnalysis[] | AnomalyDetection> {
    const { job } = context;

    // Check for cancellation
    this.checkCancellation(context);

    // Fetch data
    const queryBuilder = this.dataQueryBuilder().timeRange(
      job.dataQuery.startTime,
      job.dataQuery.endTime,
    );

    // Apply filters if specified
    if (job.dataQuery.filters) {
      Object.entries(job.dataQuery.filters).forEach(([field, value]) => {
        queryBuilder.where(field, 'equals', value);
      });
    }

    const data = await queryBuilder.execute();
    this.updateProgress(context, 20);

    this.checkCancellation(context);

    if (data.length === 0) {
      throw new Error('No data found for the specified time range');
    }

    // Execute analysis based on job type
    switch (job.type) {
      case 'trend':
        return await this.executeTrendAnalysis(context, data);
      case 'seasonal':
        return await this.executeSeasonalAnalysis(context, data);
      case 'anomaly':
        return await this.executeAnomalyAnalysis(context, data);
      case 'efficiency':
        return await this.executeEfficiencyAnalysis(context, data);
      case 'forecast':
        return await this.executeForecastAnalysis(context, data);
      case 'insights':
        return await this.executeInsightsAnalysis(context, data);
      default:
        throw new Error(`Unknown job type: ${job.type}`);
    }
  }

  /**
   * Execute trend analysis
   */
  private async executeTrendAnalysis(
    context: JobExecutionContext,
    data: BudgetUsageTimeSeriesPoint[],
  ): Promise<TrendAnalysis[]> {
    this.updateProgress(context, 30);
    this.checkCancellation(context);

    const result = await this.trendEngine.analyzeTrends(
      data,
      context.job.config,
    );
    this.updateProgress(context, 90);

    return result;
  }

  /**
   * Execute seasonal analysis
   */
  private async executeSeasonalAnalysis(
    context: JobExecutionContext,
    data: BudgetUsageTimeSeriesPoint[],
  ): Promise<TrendAnalysis[]> {
    this.updateProgress(context, 30);
    this.checkCancellation(context);

    const seasonalPatterns = await this.trendEngine.detectSeasonality(
      data,
      'cost',
    );
    this.updateProgress(context, 90);

    // Convert seasonal patterns to trend analysis format for consistency
    const trends: TrendAnalysis[] = seasonalPatterns.map((pattern) => ({
      metric: 'cost',
      period: pattern.patternType as any,
      startTime: context.job.dataQuery.startTime,
      endTime: context.job.dataQuery.endTime,
      direction: 'stable',
      strength: pattern.seasonalStrength,
      confidence: pattern.confidence,
      changeRate: 0,
      currentValue: 0,
      predictedValue: pattern.nextPeak?.predictedValue || 0,
      correlation: pattern.seasonalStrength,
      pValue: pattern.confidence === 'high' ? 0.01 : 0.05,
      dataPointCount: data.length,
      variance: 0,
      standardDeviation: 0,
    }));

    return trends;
  }

  /**
   * Execute anomaly analysis
   */
  private async executeAnomalyAnalysis(
    context: JobExecutionContext,
    data: BudgetUsageTimeSeriesPoint[],
  ): Promise<AnomalyDetection> {
    this.updateProgress(context, 30);
    this.checkCancellation(context);

    const result = await this.trendEngine.detectAnomalies(
      data,
      context.job.config.anomalySensitivity,
    );
    this.updateProgress(context, 90);

    return result;
  }

  /**
   * Execute efficiency analysis
   */
  private async executeEfficiencyAnalysis(
    context: JobExecutionContext,
    data: BudgetUsageTimeSeriesPoint[],
  ): Promise<TrendAnalysis[]> {
    this.updateProgress(context, 30);
    this.checkCancellation(context);

    const efficiency = await this.trendEngine.analyzeEfficiency(data);
    this.updateProgress(context, 90);

    // Convert to trend analysis format
    return [efficiency.trend];
  }

  /**
   * Execute forecast analysis
   */
  private async executeForecastAnalysis(
    context: JobExecutionContext,
    data: BudgetUsageTimeSeriesPoint[],
  ): Promise<TrendAnalysis[]> {
    this.updateProgress(context, 30);
    this.checkCancellation(context);

    const forecasts = await this.trendEngine.forecast(
      data,
      'cost',
      context.job.config.forecastHorizon || 30,
    );
    this.updateProgress(context, 90);

    // Convert to trend analysis format
    const trend: TrendAnalysis = {
      metric: 'cost',
      period: 'daily',
      startTime: context.job.dataQuery.startTime,
      endTime: context.job.dataQuery.endTime,
      direction: 'stable',
      strength:
        forecasts.reduce((sum, f) => sum + f.confidence, 0) / forecasts.length,
      confidence: 'medium',
      changeRate: 0,
      currentValue: data[data.length - 1]?.totalCost || 0,
      predictedValue: forecasts[0]?.predictedValue || 0,
      correlation: 0.5,
      pValue: 0.05,
      dataPointCount: data.length,
      variance: 0,
      standardDeviation: 0,
    };

    return [trend];
  }

  /**
   * Execute comprehensive insights analysis
   */
  private async executeInsightsAnalysis(
    context: JobExecutionContext,
    data: BudgetUsageTimeSeriesPoint[],
  ): Promise<InsightsReport> {
    this.updateProgress(context, 30);
    this.checkCancellation(context);

    const result = await this.trendEngine.generateInsights(
      data,
      context.job.config,
    );
    this.updateProgress(context, 90);

    return result;
  }

  /**
   * Check for job cancellation
   */
  private checkCancellation(context: JobExecutionContext): void {
    if (context.cancelRequested) {
      const job = context.job;
      job.status = 'failed';
      job.completedAt = Date.now();
      job.error = {
        message: 'Job cancelled by user request',
        code: 'JOB_CANCELLED',
        details: { cancelledAt: Date.now() },
      };

      throw new Error('Job cancelled by user request');
    }
  }

  /**
   * Update job progress
   */
  private updateProgress(context: JobExecutionContext, progress: number): void {
    context.job.progress = Math.min(100, Math.max(0, progress));

    // Update estimated completion
    if (progress > 0 && progress < 100) {
      const elapsed = Date.now() - context.startTime;
      const estimatedTotal = (elapsed / progress) * 100;
      context.job.estimatedCompletion = context.startTime + estimatedTotal;
    }

    // Call progress callback if provided
    if (context.progressCallback) {
      context.progressCallback(context.job.progress);
    }
  }

  /**
   * Calculate estimated completion time
   */
  private calculateEstimatedCompletion(
    context: JobExecutionContext,
  ): number | undefined {
    const { job, startTime } = context;

    if (job.progress <= 0) return undefined;
    if (job.progress >= 100) return startTime;

    const elapsed = Date.now() - startTime;
    const estimatedTotal = (elapsed / job.progress) * 100;

    return startTime + estimatedTotal;
  }

  /**
   * Generate unique job ID
   */
  private generateJobId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `job_${timestamp}_${random}`;
  }

  /**
   * Start background cleanup scheduler
   */
  private startCleanupScheduler(): void {
    // Run cleanup every hour
    this.cleanupInterval = setInterval(
      async () => {
        try {
          const olderThan = this.jobRetentionDays * 24 * 60 * 60 * 1000;
          const cleanedCount = await this.cleanupJobs(olderThan);

          if (cleanedCount > 0) {
            this.logger.info('Automatic cleanup completed', {
              cleanedJobs: cleanedCount,
            });
          }
        } catch (error) {
          this.logger.error('Automatic cleanup failed', {
            error: error.message,
          });
        }
      },
      60 * 60 * 1000,
    ); // 1 hour
  }

  /**
   * Persist job to storage
   */
  private async persistJob(job: AnalysisJob): Promise<void> {
    // In a real implementation, this would save to a database or file system
    // For now, we'll just log the persistence action
    this.logger.debug('Persisting job', {
      jobId: job.id,
      status: job.status,
      progress: job.progress,
    });
  }

  /**
   * Load persisted jobs from storage
   */
  private async loadPersistedJobs(): Promise<void> {
    // In a real implementation, this would load from a database or file system
    // For now, we'll just log the action
    this.logger.debug('Loading persisted jobs from storage');
  }

  /**
   * Delete persisted job from storage
   */
  private async deletePersistedJob(jobId: string): Promise<void> {
    // In a real implementation, this would delete from a database or file system
    this.logger.debug('Deleting persisted job', { jobId });
  }
}

/**
 * Factory function to create an analysis scheduler
 */
export function createAnalysisScheduler(
  trendEngine: TrendAnalysisEngine,
  dataQueryBuilder: () => QueryBuilder,
  options?: {
    maxConcurrentJobs?: number;
    jobStoragePath?: string;
    jobRetentionDays?: number;
  },
): AnalysisScheduler {
  return new AnalysisSchedulerImpl(trendEngine, dataQueryBuilder, options);
}
