/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Master Dependency Orchestrator for autonomous task management
 * Provides unified coordination and health management across all dependency components
 *
 * @author DEPENDENCY_ANALYST
 * @version 1.0.0
 */
import { EventEmitter } from 'node:events';
import { TaskNode, TaskDependency, DependencyAnalysisResult } from './DependencyAnalyzer.js';
import { SchedulingResult } from './IntelligentTaskScheduler.js';
import { VisualizationNode } from './DependencyVisualizationEngine.js';
import { DependencySystemSnapshot } from './DependencyPersistenceIntegration.js';
/**
 * Orchestrator configuration interface
 */
export interface OrchestratorConfiguration {
    system: {
        enableAutoStart: boolean;
        enableHealthMonitoring: boolean;
        enablePerformanceOptimization: boolean;
        enableConflictResolution: boolean;
        healthCheckInterval: number;
        performanceOptimizationInterval: number;
        maxRecoveryAttempts: number;
    };
    scheduler: {
        resourceConstraints: {
            maxConcurrentTasks: number;
            memoryThreshold: number;
            cpuThreshold: number;
        };
        strategy: {
            algorithm: 'critical_path' | 'shortest_processing' | 'earliest_deadline' | 'adaptive';
            parallelizationEnabled: boolean;
            resourceOptimization: boolean;
            loadBalancing: boolean;
        };
        performance: {
            enablePredictiveOptimization: boolean;
            learningEnabled: boolean;
            adaptiveThreshold: number;
        };
    };
    visualization: {
        enableVisualization: boolean;
        enableRealTimeUpdates: boolean;
        updateInterval: number;
        layoutConfiguration: {
            algorithm: 'force_directed' | 'hierarchical' | 'circular' | 'tree';
            nodeSpacing: number;
            edgeStyle: 'straight' | 'curved' | 'orthogonal';
        };
        alerts: {
            enableAutomaticAlerts: boolean;
            severityThreshold: 'low' | 'medium' | 'high' | 'critical';
        };
    };
    persistence: {
        enablePersistence: boolean;
        snapshotInterval: number;
        retentionPeriod: number;
        compressionEnabled: boolean;
        backupConfiguration: {
            enableBackups: boolean;
            backupInterval: number;
            maxBackups: number;
        };
    };
    recovery: {
        enableAutoRecovery: boolean;
        maxRecoveryAttempts: number;
        recoveryTimeout: number;
        escalationPolicy: 'immediate' | 'gradual' | 'exponential';
    };
}
/**
 * System health status enumeration
 */
export declare enum SystemHealthStatus {
    OPTIMAL = "optimal",
    DEGRADED = "degraded",
    CRITICAL = "critical",
    FAILED = "failed",
    RECOVERING = "recovering"
}
/**
 * Recovery action types
 */
export declare enum RecoveryAction {
    RESTART_COMPONENT = "restart_component",
    CLEAR_CACHE = "clear_cache",
    RESET_CONFIGURATION = "reset_configuration",
    EMERGENCY_SHUTDOWN = "emergency_shutdown",
    ESCALATE_TO_ADMIN = "escalate_to_admin"
}
/**
 * Comprehensive system status interface
 */
export interface SystemStatus {
    overall: SystemHealthStatus;
    components: {
        analyzer: SystemHealthStatus;
        scheduler: SystemHealthStatus;
        visualization: SystemHealthStatus;
        persistence: SystemHealthStatus;
    };
    metrics: {
        uptime: number;
        tasksProcessed: number;
        activeConnections: number;
        memoryUsage: number;
        cpuUsage: number;
        errorRate: number;
        averageResponseTime: number;
    };
    alerts: Array<{
        id: string;
        severity: 'low' | 'medium' | 'high' | 'critical';
        message: string;
        timestamp: Date;
        component: string;
        acknowledged: boolean;
    }>;
    lastHealthCheck: Date;
}
/**
 * Master Dependency Orchestrator
 *
 * Provides unified coordination and management for the complete dependency system:
 * - Component lifecycle management
 * - Health monitoring and automatic recovery
 * - Performance optimization and load balancing
 * - Cross-component communication and event coordination
 * - Enterprise-grade reliability and fault tolerance
 */
export declare class DependencyOrchestrator extends EventEmitter {
    private readonly logger;
    private readonly config;
    private readonly analyzer;
    private readonly scheduler;
    private readonly visualization;
    private readonly persistence;
    private isInitialized;
    private healthCheckTimer;
    private performanceTimer;
    private recoveryAttempts;
    private systemMetrics;
    constructor(config: OrchestratorConfiguration);
    /**
     * Initialize the orchestrator and all components
     */
    initialize(): Promise<void>;
    /**
     * Submit a task for dependency analysis and scheduling
     */
    submitTask(taskNode: TaskNode, dependencies?: TaskDependency[]): Promise<{
        analysis: DependencyAnalysisResult;
        scheduling: SchedulingResult;
        visualization: VisualizationNode;
    }>;
    /**
     * Get comprehensive system status
     */
    getSystemStatus(): Promise<SystemStatus>;
    /**
     * Optimize system performance
     */
    optimizePerformance(): Promise<{
        optimizations: string[];
        performanceGain: number;
        recommendations: string[];
    }>;
    /**
     * Create system snapshot for backup and analysis
     */
    createSystemSnapshot(): Promise<DependencySystemSnapshot>;
    /**
     * Shutdown orchestrator gracefully
     */
    shutdown(): Promise<void>;
    /**
     * Initialize all components
     */
    private initializeComponents;
    /**
     * Setup event handlers for cross-component communication
     */
    private setupEventHandlers;
    /**
     * Start health monitoring
     */
    private startHealthMonitoring;
    /**
     * Start performance optimization
     */
    private startPerformanceOptimization;
    /**
     * Attempt system recovery
     */
    private attemptRecovery;
    /**
     * Helper methods for recovery
     */
    private recoverTaskSubmission;
    private recoverHealthCheck;
    private performGeneralRecovery;
    /**
     * Utility methods
     */
    private summarizeConfig;
    private getStatusColor;
    private calculateNodeSize;
    private getNodeShape;
    private getComponentHealth;
    private calculateOverallHealth;
    private getCpuUsage;
    private getAverageResponseTime;
    private getActiveAlerts;
    private optimizeMemoryUsage;
    private generatePerformanceRecommendations;
}
/**
 * Factory function to create and initialize a DependencyOrchestrator
 */
export declare function createDependencyOrchestrator(config?: Partial<OrchestratorConfiguration>): Promise<DependencyOrchestrator>;
/**
 * Default export
 */
export default DependencyOrchestrator;
