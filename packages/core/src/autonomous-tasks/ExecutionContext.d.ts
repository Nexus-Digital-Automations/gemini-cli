/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { EventEmitter } from 'node:events';
import type { TaskContext } from './interfaces/TaskInterfaces.js';
/**
 * Execution context configuration
 */
export interface ExecutionContextConfig {
    /** Task identifier */
    taskId: string;
    /** Engine identifier */
    engineId: string;
    /** Execution timeout in milliseconds */
    timeout: number;
    /** Enable sandbox isolation */
    enableSandbox: boolean;
    /** Maximum memory limit in bytes */
    memoryLimit?: number;
    /** Working directory override */
    workingDirectoryOverride?: string;
    /** Environment variable overrides */
    environmentOverrides?: Record<string, string>;
    /** Resource limits */
    resourceLimits?: ResourceLimits;
    /** Retry count for retried executions */
    retryCount?: number;
    /** Enable detailed logging */
    enableDetailedLogging?: boolean;
}
/**
 * Resource limits for task execution
 */
export interface ResourceLimits {
    /** Maximum CPU usage percentage */
    maxCpuUsage?: number;
    /** Maximum memory usage in bytes */
    maxMemoryUsage?: number;
    /** Maximum execution time in milliseconds */
    maxExecutionTime?: number;
    /** Maximum file system operations per second */
    maxFileOperations?: number;
    /** Maximum network requests per second */
    maxNetworkRequests?: number;
}
/**
 * Context isolation levels
 */
export declare enum IsolationLevel {
    NONE = "none",
    PROCESS = "process",
    SANDBOX = "sandbox",
    CONTAINER = "container"
}
/**
 * Context events for monitoring
 */
export declare enum ContextEvent {
    CREATED = "created",
    STARTED = "started",
    RESOURCE_WARNING = "resource_warning",
    RESOURCE_LIMIT_EXCEEDED = "resource_limit_exceeded",
    FILE_CREATED = "file_created",
    FILE_MODIFIED = "file_modified",
    FILE_DELETED = "file_deleted",
    ENVIRONMENT_CHANGED = "environment_changed",
    CLEANUP_STARTED = "cleanup_started",
    CLEANUP_COMPLETED = "cleanup_completed",
    ERROR = "error"
}
/**
 * Resource usage statistics
 */
export interface ResourceUsage {
    /** CPU usage percentage */
    cpuUsage: number;
    /** Memory usage in bytes */
    memoryUsage: number;
    /** Execution time in milliseconds */
    executionTime: number;
    /** File operations count */
    fileOperations: number;
    /** Network requests count */
    networkRequests: number;
    /** Peak memory usage */
    peakMemoryUsage: number;
    /** Last updated timestamp */
    lastUpdated: Date;
}
/**
 * Isolated execution context for tasks
 *
 * Provides secure and isolated execution environment with:
 * - Working directory isolation with temporary workspace
 * - Environment variable isolation and management
 * - Resource monitoring and limit enforcement
 * - File system tracking and cleanup
 * - Process isolation and sandboxing
 * - Context lifecycle management
 */
export declare class ExecutionContext extends EventEmitter {
    private readonly config;
    private readonly baseContext;
    private readonly logger;
    private isolatedContext?;
    private tempWorkingDir?;
    private isolatedEnvironment;
    private resourceUsage;
    private resourceMonitor?;
    private fileWatchers;
    private createdFiles;
    private isInitialized;
    private isCleanedUp;
    private startTime;
    constructor(baseContext: TaskContext, config: ExecutionContextConfig);
    /**
     * Initialize the execution context
     */
    initialize(): Promise<void>;
    /**
     * Get the isolated task context
     */
    getTaskContext(): TaskContext;
    /**
     * Start execution monitoring
     */
    startExecution(): void;
    /**
     * Create a file within the isolated context
     */
    createFile(relativePath: string, content: string): Promise<string>;
    /**
     * Read a file from the isolated context
     */
    readFile(relativePath: string): Promise<string>;
    /**
     * Check if file exists in isolated context
     */
    fileExists(relativePath: string): Promise<boolean>;
    /**
     * Set environment variable in isolated context
     */
    setEnvironmentVariable(key: string, value: string): void;
    /**
     * Get environment variable from isolated context
     */
    getEnvironmentVariable(key: string): string | undefined;
    /**
     * Get current resource usage
     */
    getResourceUsage(): ResourceUsage;
    /**
     * Check if resource limits are exceeded
     */
    checkResourceLimits(): {
        exceeded: boolean;
        limits: string[];
    };
    /**
     * Get execution statistics
     */
    getStats(): {
        executionTime: number;
        resourceUsage: ResourceUsage;
        fileOperations: number;
        createdFilesCount: number;
        isolatedDirectory: string | undefined;
        isInitialized: boolean;
        isCleanedUp: boolean;
    };
    /**
     * Clean up the execution context
     */
    cleanup(): Promise<void>;
    /**
     * Create isolated workspace directory
     */
    private createIsolatedWorkspace;
    /**
     * Start resource monitoring
     */
    private startResourceMonitoring;
    /**
     * Update resource usage statistics
     */
    private updateResourceUsage;
    /**
     * Check resource limits and emit warnings
     */
    private checkAndEmitResourceWarnings;
    /**
     * Get debug information about the context
     */
    getDebugInfo(): Record<string, unknown>;
}
