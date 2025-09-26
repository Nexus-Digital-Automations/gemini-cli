/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { EventEmitter } from 'node:events';
/**
 * Progress tracking granularity levels
 */
export declare enum ProgressGranularity {
    TASK = "task",
    SUBTASK = "subtask",
    OPERATION = "operation",
    MILESTONE = "milestone"
}
/**
 * Progress checkpoint for detailed tracking
 */
export interface ProgressCheckpoint {
    id: string;
    taskId: string;
    name: string;
    description: string;
    granularity: ProgressGranularity;
    progress: number;
    timestamp: Date;
    duration?: number;
    metadata: Record<string, unknown>;
    children?: ProgressCheckpoint[];
    parentId?: string;
}
/**
 * Detailed progress metrics for comprehensive analysis
 */
export interface ProgressMetrics {
    taskId: string;
    overallProgress: number;
    estimatedTimeRemaining: number;
    actualTimeElapsed: number;
    estimatedTotalTime: number;
    velocity: number;
    efficiency: number;
    checkpoints: {
        completed: number;
        total: number;
        milestones: ProgressCheckpoint[];
    };
    trends: {
        velocityTrend: number[];
        progressTrend: number[];
        timeEstimateAccuracy: number;
    };
    bottlenecks: {
        slowestOperations: ProgressCheckpoint[];
        blockingIssues: string[];
        timeOverruns: ProgressCheckpoint[];
    };
}
/**
 * Progress tracking configuration
 */
export interface ProgressTrackingConfig {
    taskId: string;
    enableDetailedTracking: boolean;
    enableTimeEstimation: boolean;
    enableBottleneckDetection: boolean;
    checkpointThreshold: number;
    velocityWindowSize: number;
    alertThresholds: {
        slowProgress: number;
        timeOverrun: number;
        blockingDuration: number;
    };
}
/**
 * Progress tracking event types
 */
export declare enum ProgressEventType {
    CHECKPOINT_ADDED = "checkpoint:added",
    PROGRESS_UPDATED = "progress:updated",
    MILESTONE_REACHED = "milestone:reached",
    BOTTLENECK_DETECTED = "bottleneck:detected",
    TIME_OVERRUN = "time:overrun",
    VELOCITY_CHANGED = "velocity:changed"
}
/**
 * Progress Tracker - Advanced progress tracking with detailed metrics
 *
 * Provides comprehensive progress tracking capabilities including:
 * - Hierarchical progress checkpoints
 * - Real-time velocity and trend analysis
 * - Bottleneck detection and time overrun alerts
 * - Predictive time estimation
 * - Performance pattern analysis
 */
export declare class ProgressTracker extends EventEmitter {
    private readonly logger;
    private checkpoints;
    private taskConfigs;
    private taskMetrics;
    private velocityHistory;
    private timeEstimateCache;
    private monitoringInterval?;
    constructor();
    /**
     * Initialize progress tracking for a task
     */
    initializeTaskTracking(taskId: string, config?: Partial<ProgressTrackingConfig>): Promise<void>;
    /**
     * Add a progress checkpoint
     */
    addCheckpoint(taskId: string, checkpoint: Omit<ProgressCheckpoint, 'id' | 'taskId' | 'timestamp'>): Promise<string>;
    /**
     * Update progress for a specific checkpoint
     */
    updateCheckpointProgress(checkpointId: string, progress: number, metadata?: Record<string, unknown>): Promise<void>;
    /**
     * Get comprehensive progress metrics for a task
     */
    getTaskProgressMetrics(taskId: string): ProgressMetrics | undefined;
    /**
     * Get all checkpoints for a task
     */
    getTaskCheckpoints(taskId: string, filters?: {
        granularity?: ProgressGranularity;
        completed?: boolean;
        since?: Date;
    }): ProgressCheckpoint[];
    /**
     * Get velocity history for a task
     */
    getVelocityHistory(taskId: string): Array<{
        timestamp: Date;
        velocity: number;
    }>;
    /**
     * Predict completion time based on current velocity
     */
    predictCompletionTime(taskId: string): {
        estimatedCompletion: Date;
        confidence: number;
        basedOnVelocity: number;
    } | null;
    /**
     * Detect and analyze bottlenecks
     */
    analyzeBottlenecks(taskId: string): {
        bottlenecks: ProgressCheckpoint[];
        recommendations: string[];
        severity: 'low' | 'medium' | 'high';
    };
    /**
     * Get system-wide progress analytics
     */
    getSystemAnalytics(): {
        totalTasks: number;
        activelyTracked: number;
        averageVelocity: number;
        systemEfficiency: number;
        commonBottlenecks: string[];
        performanceDistribution: {
            fast: number;
            normal: number;
            slow: number;
        };
    };
    private updateTaskMetrics;
    private updateVelocity;
    private updateTimeEstimates;
    private updateTrends;
    private calculateVariance;
    private calculateAverageDuration;
    private generateCheckpointId;
    private setupPeriodicAnalysis;
    private performPeriodicAnalysis;
    /**
     * Cleanup resources
     */
    destroy(): void;
}
/**
 * Singleton instance for global access
 */
export declare const progressTracker: ProgressTracker;
