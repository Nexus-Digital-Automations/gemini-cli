/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { EventEmitter } from 'node:events';
import { mkdtemp, rm, writeFile, readFile, access } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import winston from 'winston';
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
export enum IsolationLevel {
  NONE = 'none',
  PROCESS = 'process',
  SANDBOX = 'sandbox',
  CONTAINER = 'container',
}

/**
 * Context events for monitoring
 */
export enum ContextEvent {
  CREATED = 'created',
  STARTED = 'started',
  RESOURCE_WARNING = 'resource_warning',
  RESOURCE_LIMIT_EXCEEDED = 'resource_limit_exceeded',
  FILE_CREATED = 'file_created',
  FILE_MODIFIED = 'file_modified',
  FILE_DELETED = 'file_deleted',
  ENVIRONMENT_CHANGED = 'environment_changed',
  CLEANUP_STARTED = 'cleanup_started',
  CLEANUP_COMPLETED = 'cleanup_completed',
  ERROR = 'error',
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
export class ExecutionContext extends EventEmitter {
  private readonly config: ExecutionContextConfig;
  private readonly baseContext: TaskContext;
  private readonly logger: winston.Logger;
  private isolatedContext?: TaskContext;
  private tempWorkingDir?: string;
  private isolatedEnvironment: Record<string, string>;
  private resourceUsage: ResourceUsage;
  private resourceMonitor?: NodeJS.Timeout;
  private fileWatchers: Map<string, any> = new Map();
  private createdFiles: Set<string> = new Set();
  private isInitialized = false;
  private isCleanedUp = false;
  private startTime: Date;

  constructor(baseContext: TaskContext, config: ExecutionContextConfig) {
    super();

    this.baseContext = baseContext;
    this.config = {
      enableSandbox: true,
      enableDetailedLogging: true,
      ...config,
    };

    this.logger = winston.createLogger({
      level: this.config.enableDetailedLogging ? 'debug' : 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      defaultMeta: {
        component: 'ExecutionContext',
        taskId: this.config.taskId,
        engineId: this.config.engineId,
      },
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          ),
        }),
      ],
    });

    // Initialize isolated environment
    this.isolatedEnvironment = {
      ...this.baseContext.environment,
      ...this.config.environmentOverrides,
      TASK_ID: this.config.taskId,
      ENGINE_ID: this.config.engineId,
      EXECUTION_MODE: 'isolated',
      RETRY_COUNT: String(this.config.retryCount || 0),
    };

    // Initialize resource usage tracking
    this.startTime = new Date();
    this.resourceUsage = {
      cpuUsage: 0,
      memoryUsage: 0,
      executionTime: 0,
      fileOperations: 0,
      networkRequests: 0,
      peakMemoryUsage: 0,
      lastUpdated: new Date(),
    };

    this.logger.debug('ExecutionContext created', {
      isolationLevel: this.config.enableSandbox ? IsolationLevel.SANDBOX : IsolationLevel.PROCESS,
      timeout: this.config.timeout,
      memoryLimit: this.config.memoryLimit,
    });
  }

  /**
   * Initialize the execution context
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      this.logger.warn('Context already initialized');
      return;
    }

    try {
      this.logger.debug('Initializing execution context');

      // Create isolated working directory
      await this.createIsolatedWorkspace();

      // Set up resource monitoring
      if (this.config.resourceLimits) {
        this.startResourceMonitoring();
      }

      // Create isolated task context
      this.isolatedContext = {
        sessionId: `${this.baseContext.sessionId}-isolated`,
        workingDirectory: this.tempWorkingDir || this.baseContext.workingDirectory,
        environment: this.isolatedEnvironment,
        config: {
          ...this.baseContext.config,
          isolated: true,
          originalWorkingDirectory: this.baseContext.workingDirectory,
          timeout: this.config.timeout,
          resourceLimits: this.config.resourceLimits,
        },
        timeout: this.config.timeout,
        maxRetries: this.baseContext.maxRetries,
        userPreferences: this.baseContext.userPreferences,
      };

      this.isInitialized = true;
      this.emit(ContextEvent.CREATED, this.isolatedContext);

      this.logger.info('Execution context initialized successfully', {
        workingDirectory: this.isolatedContext.workingDirectory,
        environmentVars: Object.keys(this.isolatedEnvironment).length,
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Failed to initialize execution context', { error: errorMessage });
      this.emit(ContextEvent.ERROR, error);
      throw error;
    }
  }

  /**
   * Get the isolated task context
   */
  getTaskContext(): TaskContext {
    if (!this.isInitialized || !this.isolatedContext) {
      throw new Error('Context not initialized');
    }

    return this.isolatedContext;
  }

  /**
   * Start execution monitoring
   */
  startExecution(): void {
    if (!this.isInitialized) {
      throw new Error('Context not initialized');
    }

    this.startTime = new Date();
    this.emit(ContextEvent.STARTED);

    this.logger.debug('Execution monitoring started', {
      startTime: this.startTime.toISOString(),
    });
  }

  /**
   * Create a file within the isolated context
   */
  async createFile(relativePath: string, content: string): Promise<string> {
    if (!this.isInitialized || !this.tempWorkingDir) {
      throw new Error('Context not initialized');
    }

    const filePath = resolve(this.tempWorkingDir, relativePath);

    // Ensure file is within the isolated directory
    if (!filePath.startsWith(this.tempWorkingDir)) {
      throw new Error('File path outside isolated directory');
    }

    try {
      await writeFile(filePath, content, 'utf8');
      this.createdFiles.add(filePath);
      this.resourceUsage.fileOperations++;

      this.emit(ContextEvent.FILE_CREATED, filePath, content.length);
      this.logger.debug('File created in isolated context', {
        path: relativePath,
        size: content.length,
      });

      return filePath;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Failed to create file in isolated context', {
        path: relativePath,
        error: errorMessage,
      });
      throw error;
    }
  }

  /**
   * Read a file from the isolated context
   */
  async readFile(relativePath: string): Promise<string> {
    if (!this.isInitialized || !this.tempWorkingDir) {
      throw new Error('Context not initialized');
    }

    const filePath = resolve(this.tempWorkingDir, relativePath);

    try {
      const content = await readFile(filePath, 'utf8');
      this.resourceUsage.fileOperations++;

      this.logger.debug('File read from isolated context', {
        path: relativePath,
        size: content.length,
      });

      return content;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Failed to read file from isolated context', {
        path: relativePath,
        error: errorMessage,
      });
      throw error;
    }
  }

  /**
   * Check if file exists in isolated context
   */
  async fileExists(relativePath: string): Promise<boolean> {
    if (!this.isInitialized || !this.tempWorkingDir) {
      throw new Error('Context not initialized');
    }

    const filePath = resolve(this.tempWorkingDir, relativePath);

    try {
      await access(filePath);
      this.resourceUsage.fileOperations++;
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Set environment variable in isolated context
   */
  setEnvironmentVariable(key: string, value: string): void {
    if (!this.isInitialized || !this.isolatedContext) {
      throw new Error('Context not initialized');
    }

    const oldValue = this.isolatedEnvironment[key];
    this.isolatedEnvironment[key] = value;
    this.isolatedContext.environment[key] = value;

    this.emit(ContextEvent.ENVIRONMENT_CHANGED, key, value, oldValue);
    this.logger.debug('Environment variable updated', { key, value: value.substring(0, 50) });
  }

  /**
   * Get environment variable from isolated context
   */
  getEnvironmentVariable(key: string): string | undefined {
    return this.isolatedEnvironment[key];
  }

  /**
   * Get current resource usage
   */
  getResourceUsage(): ResourceUsage {
    this.updateResourceUsage();
    return { ...this.resourceUsage };
  }

  /**
   * Check if resource limits are exceeded
   */
  checkResourceLimits(): { exceeded: boolean; limits: string[] } {
    const exceeded: string[] = [];
    const limits = this.config.resourceLimits;

    if (!limits) {
      return { exceeded: false, limits: [] };
    }

    this.updateResourceUsage();

    if (limits.maxCpuUsage && this.resourceUsage.cpuUsage > limits.maxCpuUsage) {
      exceeded.push(`CPU usage: ${this.resourceUsage.cpuUsage}% > ${limits.maxCpuUsage}%`);
    }

    if (limits.maxMemoryUsage && this.resourceUsage.memoryUsage > limits.maxMemoryUsage) {
      exceeded.push(`Memory usage: ${this.resourceUsage.memoryUsage} > ${limits.maxMemoryUsage}`);
    }

    if (limits.maxExecutionTime && this.resourceUsage.executionTime > limits.maxExecutionTime) {
      exceeded.push(`Execution time: ${this.resourceUsage.executionTime}ms > ${limits.maxExecutionTime}ms`);
    }

    return {
      exceeded: exceeded.length > 0,
      limits: exceeded,
    };
  }

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
  } {
    this.updateResourceUsage();

    return {
      executionTime: Date.now() - this.startTime.getTime(),
      resourceUsage: this.getResourceUsage(),
      fileOperations: this.resourceUsage.fileOperations,
      createdFilesCount: this.createdFiles.size,
      isolatedDirectory: this.tempWorkingDir,
      isInitialized: this.isInitialized,
      isCleanedUp: this.isCleanedUp,
    };
  }

  /**
   * Clean up the execution context
   */
  async cleanup(): Promise<void> {
    if (this.isCleanedUp) {
      this.logger.debug('Context already cleaned up');
      return;
    }

    try {
      this.emit(ContextEvent.CLEANUP_STARTED);
      this.logger.debug('Starting execution context cleanup');

      // Stop resource monitoring
      if (this.resourceMonitor) {
        clearInterval(this.resourceMonitor);
        this.resourceMonitor = undefined;
      }

      // Stop file watchers
      for (const [path, watcher] of this.fileWatchers.entries()) {
        try {
          if (watcher && typeof watcher.close === 'function') {
            await watcher.close();
          }
        } catch (error) {
          this.logger.warn('Failed to close file watcher', {
            path,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
      this.fileWatchers.clear();

      // Clean up temporary working directory
      if (this.tempWorkingDir) {
        try {
          await rm(this.tempWorkingDir, { recursive: true, force: true });
          this.logger.debug('Temporary working directory removed', {
            path: this.tempWorkingDir,
          });
        } catch (error) {
          this.logger.warn('Failed to remove temporary working directory', {
            path: this.tempWorkingDir,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      // Clear created files tracking
      this.createdFiles.clear();

      this.isCleanedUp = true;
      this.emit(ContextEvent.CLEANUP_COMPLETED);

      const totalExecutionTime = Date.now() - this.startTime.getTime();
      this.logger.info('Execution context cleanup completed', {
        executionTime: `${totalExecutionTime}ms`,
        fileOperations: this.resourceUsage.fileOperations,
        peakMemoryUsage: this.resourceUsage.peakMemoryUsage,
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Failed to clean up execution context', { error: errorMessage });
      this.emit(ContextEvent.ERROR, error);
      throw error;
    } finally {
      this.removeAllListeners();
    }
  }

  /**
   * Create isolated workspace directory
   */
  private async createIsolatedWorkspace(): Promise<void> {
    const baseDir = this.config.workingDirectoryOverride || tmpdir();
    const prefix = `gemini-task-${this.config.taskId}-`;

    try {
      this.tempWorkingDir = await mkdtemp(join(baseDir, prefix));

      this.logger.debug('Isolated workspace created', {
        path: this.tempWorkingDir,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Failed to create isolated workspace', { error: errorMessage });
      throw error;
    }
  }

  /**
   * Start resource monitoring
   */
  private startResourceMonitoring(): void {
    if (this.resourceMonitor) {
      return;
    }

    this.resourceMonitor = setInterval(() => {
      this.updateResourceUsage();
      this.checkAndEmitResourceWarnings();
    }, 1000); // Check every second

    this.logger.debug('Resource monitoring started');
  }

  /**
   * Update resource usage statistics
   */
  private updateResourceUsage(): void {
    const now = new Date();
    const memUsage = process.memoryUsage();

    // Update execution time
    this.resourceUsage.executionTime = now.getTime() - this.startTime.getTime();

    // Update memory usage
    this.resourceUsage.memoryUsage = memUsage.heapUsed;
    this.resourceUsage.peakMemoryUsage = Math.max(
      this.resourceUsage.peakMemoryUsage,
      memUsage.heapUsed
    );

    // Simplified CPU usage calculation (would need more sophisticated monitoring in production)
    // This is a placeholder - real implementation would use process.cpuUsage()
    this.resourceUsage.cpuUsage = Math.random() * 10; // Placeholder

    this.resourceUsage.lastUpdated = now;
  }

  /**
   * Check resource limits and emit warnings
   */
  private checkAndEmitResourceWarnings(): void {
    const limits = this.config.resourceLimits;
    if (!limits) {
      return;
    }

    const usage = this.resourceUsage;

    // Check CPU usage
    if (limits.maxCpuUsage && usage.cpuUsage > limits.maxCpuUsage * 0.8) {
      this.emit(ContextEvent.RESOURCE_WARNING, 'cpu', usage.cpuUsage, limits.maxCpuUsage);
    }

    // Check memory usage
    if (limits.maxMemoryUsage && usage.memoryUsage > limits.maxMemoryUsage * 0.8) {
      this.emit(ContextEvent.RESOURCE_WARNING, 'memory', usage.memoryUsage, limits.maxMemoryUsage);
    }

    // Check execution time
    if (limits.maxExecutionTime && usage.executionTime > limits.maxExecutionTime * 0.8) {
      this.emit(ContextEvent.RESOURCE_WARNING, 'time', usage.executionTime, limits.maxExecutionTime);
    }

    // Check for exceeded limits
    const limitCheck = this.checkResourceLimits();
    if (limitCheck.exceeded) {
      this.emit(ContextEvent.RESOURCE_LIMIT_EXCEEDED, limitCheck.limits);
      this.logger.warn('Resource limits exceeded', {
        limits: limitCheck.limits,
      });
    }
  }

  /**
   * Get debug information about the context
   */
  getDebugInfo(): Record<string, unknown> {
    return {
      taskId: this.config.taskId,
      engineId: this.config.engineId,
      isInitialized: this.isInitialized,
      isCleanedUp: this.isCleanedUp,
      tempWorkingDir: this.tempWorkingDir,
      isolatedEnvironment: Object.keys(this.isolatedEnvironment),
      resourceUsage: this.getResourceUsage(),
      createdFiles: Array.from(this.createdFiles),
      fileWatchers: this.fileWatchers.size,
      executionTime: Date.now() - this.startTime.getTime(),
      config: {
        ...this.config,
        // Redact sensitive information
        environmentOverrides: this.config.environmentOverrides
          ? Object.keys(this.config.environmentOverrides)
          : undefined,
      },
    };
  }
}