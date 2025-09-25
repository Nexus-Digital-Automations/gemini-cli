/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { TaskExecutionEngine } from './TaskExecutionEngine.complete.js';
import { EnhancedAutonomousTaskQueue } from './EnhancedAutonomousTaskQueue.js';
import { ExecutionMonitoringSystem } from './ExecutionMonitoringSystem.js';
import { InfiniteHookIntegration } from './InfiniteHookIntegration.js';
import { CrossSessionPersistenceEngine } from './CrossSessionPersistenceEngine.js';
import { DependencyResolver } from './DependencyResolver.js';
/**
 * Unified Task Management System Integrator
 *
 * Provides a single entry point for all task management operations,
 * coordinating between different components and ensuring consistency.
 */
export class TaskManagementSystemIntegrator {
  taskEngine;
  autonomousQueue;
  monitoring;
  persistence;
  hookIntegration;
  dependencyResolver;
  config;
  isInitialized = false;
  shutdownHandlers = [];
  constructor(config) {
    this.config = config;
  }
  /**
   * Initialize the complete integrated system
   */
  async initialize() {
    try {
      console.log('🚀 Initializing Integrated Task Management System...');
      // Initialize persistence engine first (if enabled)
      if (this.config.persistence?.enabled !== false) {
        console.log('💾 Initializing persistence engine...');
        this.persistence = new CrossSessionPersistenceEngine(
          this.config.persistence?.storageLocation || '.task-management-data',
          {
            compressionEnabled:
              this.config.persistence?.compressionEnabled ?? true,
            encryptionEnabled:
              this.config.persistence?.encryptionEnabled ?? false,
            retentionDays: this.config.persistence?.retentionDays ?? 30,
          },
        );
        await this.persistence.initialize();
        this.shutdownHandlers.push(() => this.persistence.shutdown());
      }
      // Initialize monitoring system (if enabled)
      if (this.config.monitoring?.enabled !== false) {
        console.log('📊 Initializing monitoring system...');
        this.monitoring = new ExecutionMonitoringSystem(this.config.core);
        this.shutdownHandlers.push(() => this.monitoring.shutdown());
      }
      // Initialize dependency resolver (if enabled)
      if (this.config.dependencies?.enableAnalysis !== false) {
        console.log('🔗 Initializing dependency resolver...');
        this.dependencyResolver = new DependencyResolver({
          maxResolutionDepth:
            this.config.dependencies?.maxResolutionDepth ?? 10,
          allowCircularDependencies:
            this.config.dependencies?.allowCircularDependencies ?? false,
        });
      }
      // Initialize task execution engine
      console.log('⚡ Initializing task execution engine...');
      this.taskEngine = new TaskExecutionEngine(this.config.core, {
        onTaskStatusChange: this.handleTaskStatusChange.bind(this),
        onTaskComplete: this.handleTaskComplete.bind(this),
        onTaskFailed: this.handleTaskFailed.bind(this),
        persistence: this.persistence,
        monitoring: this.monitoring,
      });
      this.shutdownHandlers.push(() => this.taskEngine.shutdown());
      // Initialize autonomous task queue (if enabled)
      if (this.config.autonomousQueue) {
        console.log('🤖 Initializing autonomous task queue...');
        this.autonomousQueue = new EnhancedAutonomousTaskQueue({
          maxConcurrentTasks:
            this.config.autonomousQueue.maxConcurrentTasks ?? 8,
          enableAutonomousBreakdown:
            this.config.autonomousQueue.enableAutonomousBreakdown ?? true,
          breakdownThreshold:
            this.config.autonomousQueue.breakdownThreshold ?? 0.7,
          maxBreakdownDepth: this.config.autonomousQueue.maxBreakdownDepth ?? 3,
          enableAdaptiveScheduling:
            this.config.autonomousQueue.enableAdaptiveScheduling ?? true,
          performanceOptimization:
            this.config.autonomousQueue.performanceOptimization ?? true,
          learningEnabled: this.config.autonomousQueue.learningEnabled ?? true,
          metricsEnabled: true,
        });
        this.shutdownHandlers.push(() => this.autonomousQueue.shutdown());
      }
      // Initialize hook integration (if enabled)
      if (this.config.hookIntegration?.enabled !== false) {
        console.log(
          '🔗 Initializing infinite-continue-stop-hook integration...',
        );
        try {
          this.hookIntegration = new InfiniteHookIntegration(
            this.config.core,
            this.taskEngine,
            this.monitoring,
            {
              agentId:
                this.config.hookIntegration?.agentId || 'INTEGRATED_SYSTEM',
              capabilities: this.config.hookIntegration?.capabilities || [
                'autonomous_execution',
              ],
              progressReportingIntervalMs:
                this.config.hookIntegration?.progressReportingIntervalMs ??
                30000,
              autoStopEnabled:
                this.config.hookIntegration?.autoStopEnabled ?? true,
            },
          );
          await this.hookIntegration.initialize();
          this.shutdownHandlers.push(() => this.hookIntegration.shutdown());
        } catch (error) {
          console.warn(
            '⚠️ Hook integration initialization failed, continuing without it:',
            error,
          );
          this.hookIntegration = undefined;
        }
      }
      this.isInitialized = true;
      console.log(
        '✅ Integrated Task Management System initialized successfully!',
      );
      console.log(
        `📋 Task Engine: ${this.taskEngine ? 'Enabled' : 'Disabled'}`,
      );
      console.log(
        `🤖 Autonomous Queue: ${this.autonomousQueue ? 'Enabled' : 'Disabled'}`,
      );
      console.log(`📊 Monitoring: ${this.monitoring ? 'Enabled' : 'Disabled'}`);
      console.log(
        `💾 Persistence: ${this.persistence ? 'Enabled' : 'Disabled'}`,
      );
      console.log(
        `🔗 Hook Integration: ${this.hookIntegration ? 'Enabled' : 'Disabled'}`,
      );
      console.log(
        `🔗 Dependency Resolution: ${this.dependencyResolver ? 'Enabled' : 'Disabled'}`,
      );
      return {
        success: true,
        message: 'Integrated Task Management System initialized successfully',
        details: {
          components: {
            taskEngine: !!this.taskEngine,
            autonomousQueue: !!this.autonomousQueue,
            monitoring: !!this.monitoring,
            persistence: !!this.persistence,
            hookIntegration: !!this.hookIntegration,
            dependencyResolver: !!this.dependencyResolver,
          },
        },
        timestamp: new Date(),
      };
    } catch (error) {
      console.error(
        '❌ Failed to initialize Integrated Task Management System:',
        error,
      );
      return {
        success: false,
        message: `Initialization failed: ${error instanceof Error ? error.message : String(error)}`,
        details: { error },
        timestamp: new Date(),
      };
    }
  }
  /**
   * Get system health status and metrics
   */
  getSystemHealth() {
    if (!this.isInitialized) {
      throw new Error('System not initialized. Call initialize() first.');
    }
    const metrics = this.taskEngine?.getExecutionStats() || {
      totalTasksProcessed: 0,
      currentlyExecutingTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      averageExecutionTime: 0,
      systemUptime: 0,
    };
    // Calculate component health
    const taskEngineHealth = this.taskEngine ? 'healthy' : 'disabled';
    const autonomousQueueHealth = this.autonomousQueue ? 'healthy' : 'disabled';
    const monitoringHealth = this.monitoring ? 'healthy' : 'disabled';
    const persistenceHealth = this.persistence ? 'healthy' : 'disabled';
    const hookIntegrationHealth = this.hookIntegration ? 'healthy' : 'disabled';
    const dependenciesHealth = this.dependencyResolver ? 'healthy' : 'disabled';
    // Calculate overall health
    const healthyComponents = [
      taskEngineHealth,
      autonomousQueueHealth,
      monitoringHealth,
      persistenceHealth,
      hookIntegrationHealth,
      dependenciesHealth,
    ].filter((status) => status === 'healthy').length;
    const totalComponents = 6;
    let overall;
    if (healthyComponents >= 4) {
      overall = 'healthy';
    } else if (healthyComponents >= 2) {
      overall = 'warning';
    } else {
      overall = 'critical';
    }
    return {
      overall,
      components: {
        taskEngine: taskEngineHealth,
        autonomousQueue: autonomousQueueHealth,
        monitoring: monitoringHealth,
        persistence: persistenceHealth,
        hookIntegration: hookIntegrationHealth,
        dependencies: dependenciesHealth,
      },
      metrics: {
        tasksInQueue: this.autonomousQueue?.getQueueSize() || 0,
        tasksInProgress: metrics.currentlyExecutingTasks,
        tasksCompleted: metrics.completedTasks,
        tasksFailed: metrics.failedTasks,
        systemUptime: metrics.systemUptime,
        memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024, // MB
        cpuUsage: process.cpuUsage().user / 1000000, // seconds
        avgTaskDuration: metrics.averageExecutionTime,
        taskThroughput:
          metrics.completedTasks /
          Math.max(metrics.systemUptime / 1000 / 60, 1), // tasks per minute
      },
      lastHealthCheck: new Date(),
    };
  }
  /**
   * Queue a new task for execution
   */
  async queueTask(title, description, options = {}) {
    if (!this.isInitialized) {
      throw new Error('System not initialized. Call initialize() first.');
    }
    try {
      let taskId;
      if (this.autonomousQueue && options.useAutonomousQueue !== false) {
        // Use autonomous queue for intelligent breakdown and scheduling
        taskId = await this.autonomousQueue.addTask({
          title,
          description,
          ...options,
        });
      } else if (this.taskEngine) {
        // Use traditional task engine
        taskId = await this.taskEngine.queueTask(title, description, options);
      } else {
        throw new Error('No task execution system available');
      }
      // Log to persistence if enabled
      if (this.persistence) {
        await this.persistence.persistTask({
          id: taskId,
          title,
          description,
          status: 'queued',
          createdAt: new Date(),
          ...options,
        });
      }
      return {
        success: true,
        message: 'Task queued successfully',
        details: { taskId, title, useAutonomousQueue: !!this.autonomousQueue },
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('❌ Failed to queue task:', error);
      return {
        success: false,
        message: `Failed to queue task: ${error instanceof Error ? error.message : String(error)}`,
        details: { error, title, description },
        timestamp: new Date(),
      };
    }
  }
  /**
   * Get comprehensive system status
   */
  getSystemStatus() {
    if (!this.isInitialized) {
      throw new Error('System not initialized. Call initialize() first.');
    }
    const health = this.getSystemHealth();
    const taskEngineStats = this.taskEngine?.getExecutionStats();
    const autonomousQueueStatus =
      this.autonomousQueue?.getAutonomousQueueStatus();
    const monitoringMetrics = this.monitoring?.getSystemHealth(
      this.monitoring.collectMetrics(this.taskEngine?.getAllTasks() || []),
    );
    return {
      health,
      taskEngineStats,
      autonomousQueueStatus,
      monitoringMetrics,
      components: {
        taskEngine: !!this.taskEngine,
        autonomousQueue: !!this.autonomousQueue,
        monitoring: !!this.monitoring,
        persistence: !!this.persistence,
        hookIntegration: !!this.hookIntegration,
        dependencyResolver: !!this.dependencyResolver,
      },
      timestamp: new Date(),
    };
  }
  /**
   * Gracefully shutdown the entire system
   */
  async shutdown() {
    try {
      console.log('🛑 Shutting down Integrated Task Management System...');
      // Execute all shutdown handlers in reverse order
      for (const handler of this.shutdownHandlers.reverse()) {
        await handler();
      }
      this.isInitialized = false;
      this.shutdownHandlers = [];
      console.log('✅ Integrated Task Management System shut down gracefully');
      return {
        success: true,
        message: 'System shut down gracefully',
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('❌ Error during system shutdown:', error);
      return {
        success: false,
        message: `Shutdown error: ${error instanceof Error ? error.message : String(error)}`,
        details: { error },
        timestamp: new Date(),
      };
    }
  }
  /**
   * Get access to individual components (for advanced usage)
   */
  getComponents() {
    return {
      taskEngine: this.taskEngine,
      autonomousQueue: this.autonomousQueue,
      monitoring: this.monitoring,
      persistence: this.persistence,
      hookIntegration: this.hookIntegration,
      dependencyResolver: this.dependencyResolver,
    };
  }
  // Private event handlers
  async handleTaskStatusChange(task) {
    console.log(
      `📋 Task ${task.id} status changed: ${task.status} (${task.progress}%)`,
    );
    // Record monitoring event
    if (this.monitoring) {
      this.monitoring.recordEvent({
        taskId: task.id,
        eventType:
          task.status === 'in_progress'
            ? 'started'
            : task.status === 'completed'
              ? 'completed'
              : task.status === 'failed'
                ? 'failed'
                : 'progress',
        timestamp: new Date(),
        metadata: {
          title: task.title,
          type: task.type,
          complexity: task.complexity,
          priority: task.priority,
          progress: task.progress,
          integrated: true,
        },
      });
    }
    // Update persistence
    if (this.persistence) {
      await this.persistence.updateTaskStatus(task.id, task.status, {
        progress: task.progress,
        lastUpdate: new Date(),
      });
    }
  }
  async handleTaskComplete(task) {
    console.log(`✅ Task completed successfully: ${task.title}`);
    // Record completion metrics
    if (this.monitoring) {
      this.monitoring.recordEvent({
        taskId: task.id,
        eventType: 'completed',
        timestamp: new Date(),
        metadata: {
          title: task.title,
          duration: task.metrics?.durationMs,
          outputs: task.outputs,
          integrated: true,
        },
        duration: task.metrics?.durationMs,
      });
    }
    // Update persistence
    if (this.persistence) {
      await this.persistence.completeTask(task.id, {
        completedAt: new Date(),
        outputs: task.outputs,
        metrics: task.metrics,
      });
    }
  }
  async handleTaskFailed(task, error) {
    console.error(`❌ Task failed: ${task.title} - ${error}`);
    // Record failure
    if (this.monitoring) {
      this.monitoring.recordEvent({
        taskId: task.id,
        eventType: 'failed',
        timestamp: new Date(),
        metadata: {
          title: task.title,
          error: task.lastError,
          retryCount: task.retryCount,
          integrated: true,
        },
        error,
      });
    }
    // Update persistence
    if (this.persistence) {
      await this.persistence.failTask(task.id, {
        failedAt: new Date(),
        error: task.lastError,
        retryCount: task.retryCount,
      });
    }
  }
}
/**
 * Default system configuration factory
 */
export class SystemConfigFactory {
  /**
   * Create a minimal configuration for basic task execution
   */
  static createMinimal(coreConfig) {
    return {
      core: coreConfig,
      taskEngine: {
        maxConcurrentTasks: 3,
        defaultRetryCount: 1,
        timeoutMs: 300000, // 5 minutes
        enableMetrics: true,
      },
      monitoring: { enabled: false },
      persistence: { enabled: false },
      hookIntegration: { enabled: false },
      dependencies: { enableAnalysis: false },
    };
  }
  /**
   * Create a development configuration with monitoring and autonomous features
   */
  static createDevelopment(coreConfig) {
    return {
      core: coreConfig,
      taskEngine: {
        maxConcurrentTasks: 5,
        defaultRetryCount: 2,
        timeoutMs: 600000, // 10 minutes
        enableMetrics: true,
      },
      autonomousQueue: {
        maxConcurrentTasks: 8,
        enableAutonomousBreakdown: true,
        breakdownThreshold: 0.7,
        maxBreakdownDepth: 3,
        enableAdaptiveScheduling: true,
        performanceOptimization: true,
        learningEnabled: true,
      },
      monitoring: {
        enabled: true,
        realTimeUpdates: true,
        metricsRetentionHours: 24,
        alertThresholds: {
          taskFailureRate: 0.2,
          averageExecutionTime: 300000,
          systemMemoryUsage: 0.8,
        },
      },
      persistence: {
        enabled: true,
        storageLocation: '.dev-task-management',
        compressionEnabled: true,
        encryptionEnabled: false,
        retentionDays: 7,
      },
      hookIntegration: {
        enabled: true,
        agentId: 'DEV_INTEGRATED_SYSTEM',
        capabilities: ['autonomous_execution', 'monitoring', 'persistence'],
        progressReportingIntervalMs: 15000,
        autoStopEnabled: true,
      },
      dependencies: {
        enableAnalysis: true,
        enableResolution: true,
        maxResolutionDepth: 10,
        allowCircularDependencies: false,
      },
    };
  }
  /**
   * Create a production configuration with full features and security
   */
  static createProduction(coreConfig) {
    return {
      core: coreConfig,
      taskEngine: {
        maxConcurrentTasks: 10,
        defaultRetryCount: 3,
        timeoutMs: 900000, // 15 minutes
        enableMetrics: true,
      },
      autonomousQueue: {
        maxConcurrentTasks: 15,
        enableAutonomousBreakdown: true,
        breakdownThreshold: 0.6,
        maxBreakdownDepth: 4,
        enableAdaptiveScheduling: true,
        performanceOptimization: true,
        learningEnabled: true,
      },
      monitoring: {
        enabled: true,
        realTimeUpdates: true,
        metricsRetentionHours: 168, // 7 days
        alertThresholds: {
          taskFailureRate: 0.1,
          averageExecutionTime: 600000,
          systemMemoryUsage: 0.7,
        },
      },
      persistence: {
        enabled: true,
        storageLocation: '.prod-task-management',
        compressionEnabled: true,
        encryptionEnabled: true,
        retentionDays: 90,
      },
      hookIntegration: {
        enabled: true,
        agentId: 'PROD_INTEGRATED_SYSTEM',
        capabilities: [
          'autonomous_execution',
          'monitoring',
          'persistence',
          'security',
        ],
        progressReportingIntervalMs: 60000,
        autoStopEnabled: true,
      },
      dependencies: {
        enableAnalysis: true,
        enableResolution: true,
        maxResolutionDepth: 15,
        allowCircularDependencies: false,
      },
    };
  }
}
/**
 * Convenience function to create and initialize the integrated system
 */
export async function createIntegratedTaskManagementSystem(config) {
  const system = new TaskManagementSystemIntegrator(config);
  const result = await system.initialize();
  return { system, result };
}
//# sourceMappingURL=TaskManagementSystemIntegrator.js.map
