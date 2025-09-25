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
import { Logger } from '../../utils/logger.js';
import {
  DependencyAnalyzer,
  TaskNode,
  TaskDependency,
  DependencyAnalysisResult,
} from './DependencyAnalyzer.js';
import {
  IntelligentTaskScheduler,
  SchedulingResult,
  ExecutionContext,
} from './IntelligentTaskScheduler.js';
import {
  DependencyVisualizationEngine,
  VisualizationNode,
  TimelineEvent,
} from './DependencyVisualizationEngine.js';
import {
  DependencyPersistenceIntegration,
  DependencySystemSnapshot,
} from './DependencyPersistenceIntegration.js';

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
      algorithm:
        | 'critical_path'
        | 'shortest_processing'
        | 'earliest_deadline'
        | 'adaptive';
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
export enum SystemHealthStatus {
  OPTIMAL = 'optimal',
  DEGRADED = 'degraded',
  CRITICAL = 'critical',
  FAILED = 'failed',
  RECOVERING = 'recovering',
}

/**
 * Recovery action types
 */
export enum RecoveryAction {
  RESTART_COMPONENT = 'restart_component',
  CLEAR_CACHE = 'clear_cache',
  RESET_CONFIGURATION = 'reset_configuration',
  EMERGENCY_SHUTDOWN = 'emergency_shutdown',
  ESCALATE_TO_ADMIN = 'escalate_to_admin',
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
export class DependencyOrchestrator extends EventEmitter {
  private readonly logger: Logger;
  private readonly config: OrchestratorConfiguration;

  // Core components
  private readonly analyzer: DependencyAnalyzer;
  private readonly scheduler: IntelligentTaskScheduler;
  private readonly visualization: DependencyVisualizationEngine;
  private readonly persistence: DependencyPersistenceIntegration;

  // System state
  private isInitialized: boolean = false;
  private healthCheckTimer: NodeJS.Timeout | null = null;
  private performanceTimer: NodeJS.Timeout | null = null;
  private recoveryAttempts: Map<string, number> = new Map();
  private systemMetrics: {
    startTime: Date;
    tasksProcessed: number;
    errors: number;
    lastHealthCheck: Date;
  };

  constructor(config: OrchestratorConfiguration) {
    super();
    this.logger = new Logger('DependencyOrchestrator');
    this.config = config;

    this.systemMetrics = {
      startTime: new Date(),
      tasksProcessed: 0,
      errors: 0,
      lastHealthCheck: new Date(),
    };

    // Initialize core components
    this.analyzer = new DependencyAnalyzer();
    this.scheduler = new IntelligentTaskScheduler();
    this.visualization = new DependencyVisualizationEngine();
    this.persistence = new DependencyPersistenceIntegration();

    this.setupEventHandlers();
    this.logger.info('DependencyOrchestrator initialized', {
      config: this.summarizeConfig(),
    });
  }

  /**
   * Initialize the orchestrator and all components
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      this.logger.warn('Orchestrator already initialized');
      return;
    }

    try {
      this.logger.info('Initializing DependencyOrchestrator...');

      // Initialize components in order
      await this.initializeComponents();

      // Start monitoring and optimization if enabled
      if (this.config.system.enableHealthMonitoring) {
        this.startHealthMonitoring();
      }

      if (this.config.system.enablePerformanceOptimization) {
        this.startPerformanceOptimization();
      }

      // Start persistence if enabled
      if (this.config.persistence.enablePersistence) {
        await this.persistence.initialize();
      }

      this.isInitialized = true;
      this.emit('orchestratorInitialized');

      this.logger.info('DependencyOrchestrator initialization complete');
    } catch (error) {
      this.logger.error('Failed to initialize DependencyOrchestrator', {
        error,
      });
      throw error;
    }
  }

  /**
   * Submit a task for dependency analysis and scheduling
   */
  public async submitTask(
    taskNode: TaskNode,
    dependencies: TaskDependency[] = [],
  ): Promise<{
    analysis: DependencyAnalysisResult;
    scheduling: SchedulingResult;
    visualization: VisualizationNode;
  }> {
    if (!this.isInitialized) {
      throw new Error('Orchestrator not initialized');
    }

    const taskId = taskNode.id;
    this.logger.info(`Submitting task for orchestration: ${taskId}`, {
      taskType: taskNode.type,
      dependencyCount: dependencies.length,
    });

    try {
      this.systemMetrics.tasksProcessed++;

      // Step 1: Dependency Analysis
      const analysis = await this.analyzer.analyzeTask(taskNode, dependencies);
      this.logger.debug(`Dependency analysis complete for ${taskId}`, {
        readiness: analysis.readiness,
        conflicts: analysis.conflicts.length,
      });

      // Step 2: Intelligent Scheduling
      const executionContext: ExecutionContext = {
        taskId,
        priority: taskNode.priority,
        estimatedDuration: taskNode.estimatedDuration,
        resourceRequirements: taskNode.resourceRequirements || {},
        dependencies: analysis.prerequisiteChain,
        constraints: {},
        metadata: taskNode.metadata || {},
      };

      const scheduling = await this.scheduler.scheduleTask(executionContext);
      this.logger.debug(`Task scheduling complete for ${taskId}`, {
        scheduledTime: scheduling.scheduledTime,
        expectedCompletion: scheduling.expectedCompletion,
      });

      // Step 3: Visualization Update
      const visualizationNode: VisualizationNode = {
        id: taskId,
        label: taskNode.name || taskId,
        type: taskNode.type,
        status: taskNode.status,
        position: { x: 0, y: 0 }, // Will be calculated by layout algorithm
        style: {
          color: this.getStatusColor(taskNode.status),
          size: this.calculateNodeSize(taskNode),
          shape: this.getNodeShape(taskNode.type),
        },
        metadata: {
          priority: taskNode.priority,
          estimatedDuration: taskNode.estimatedDuration,
          scheduledTime: scheduling.scheduledTime,
          ...taskNode.metadata,
        },
      };

      if (this.config.visualization.enableVisualization) {
        await this.visualization.updateNode(visualizationNode);
      }

      // Step 4: Persistence
      if (this.config.persistence.enablePersistence) {
        await this.persistence.storeTaskData({
          taskId,
          taskData: taskNode,
          dependencies,
          analysis,
          scheduling,
          timestamp: new Date(),
        });
      }

      this.emit('taskSubmitted', {
        taskId,
        analysis,
        scheduling,
        visualization: visualizationNode,
      });

      return { analysis, scheduling, visualization: visualizationNode };
    } catch (error) {
      this.systemMetrics.errors++;
      this.logger.error(`Failed to orchestrate task ${taskId}`, { error });

      if (this.config.recovery.enableAutoRecovery) {
        await this.attemptRecovery('task_submission', error);
      }

      throw error;
    }
  }

  /**
   * Get comprehensive system status
   */
  public async getSystemStatus(): Promise<SystemStatus> {
    const now = new Date();
    const uptime = now.getTime() - this.systemMetrics.startTime.getTime();

    // Get component statuses
    const componentStatuses = await Promise.allSettled([
      this.getComponentHealth('analyzer'),
      this.getComponentHealth('scheduler'),
      this.getComponentHealth('visualization'),
      this.getComponentHealth('persistence'),
    ]);

    const components = {
      analyzer:
        componentStatuses[0].status === 'fulfilled'
          ? componentStatuses[0].value
          : SystemHealthStatus.FAILED,
      scheduler:
        componentStatuses[1].status === 'fulfilled'
          ? componentStatuses[1].value
          : SystemHealthStatus.FAILED,
      visualization:
        componentStatuses[2].status === 'fulfilled'
          ? componentStatuses[2].value
          : SystemHealthStatus.FAILED,
      persistence:
        componentStatuses[3].status === 'fulfilled'
          ? componentStatuses[3].value
          : SystemHealthStatus.FAILED,
    };

    // Calculate overall status
    const overall = this.calculateOverallHealth(components);

    // Get system metrics
    const memoryUsage = process.memoryUsage();
    const metrics = {
      uptime,
      tasksProcessed: this.systemMetrics.tasksProcessed,
      activeConnections: this.listenerCount('taskSubmitted'),
      memoryUsage: memoryUsage.heapUsed / memoryUsage.heapTotal,
      cpuUsage: await this.getCpuUsage(),
      errorRate:
        this.systemMetrics.tasksProcessed > 0
          ? this.systemMetrics.errors / this.systemMetrics.tasksProcessed
          : 0,
      averageResponseTime: await this.getAverageResponseTime(),
    };

    // Get active alerts
    const alerts = await this.getActiveAlerts();

    this.systemMetrics.lastHealthCheck = now;

    return {
      overall,
      components,
      metrics,
      alerts,
      lastHealthCheck: now,
    };
  }

  /**
   * Optimize system performance
   */
  public async optimizePerformance(): Promise<{
    optimizations: string[];
    performanceGain: number;
    recommendations: string[];
  }> {
    this.logger.info('Starting performance optimization...');

    const optimizations: string[] = [];
    let performanceGain = 0;

    try {
      // Optimize scheduler
      const schedulerOptimization = await this.scheduler.optimizePerformance();
      if (schedulerOptimization.applied) {
        optimizations.push('Scheduler algorithm optimization');
        performanceGain += schedulerOptimization.performanceGain;
      }

      // Optimize memory usage
      const memoryOptimized = await this.optimizeMemoryUsage();
      if (memoryOptimized > 0) {
        optimizations.push('Memory usage optimization');
        performanceGain += memoryOptimized;
      }

      // Optimize visualization rendering
      if (this.config.visualization.enableVisualization) {
        const visualizationOptimized =
          await this.visualization.optimizeRendering();
        if (visualizationOptimized.applied) {
          optimizations.push('Visualization rendering optimization');
          performanceGain += visualizationOptimized.performanceGain;
        }
      }

      // Generate recommendations
      const recommendations = await this.generatePerformanceRecommendations();

      this.logger.info('Performance optimization complete', {
        optimizations: optimizations.length,
        performanceGain,
        recommendations: recommendations.length,
      });

      return { optimizations, performanceGain, recommendations };
    } catch (error) {
      this.logger.error('Performance optimization failed', { error });
      throw error;
    }
  }

  /**
   * Create system snapshot for backup and analysis
   */
  public async createSystemSnapshot(): Promise<DependencySystemSnapshot> {
    this.logger.info('Creating system snapshot...');

    try {
      const systemStatus = await this.getSystemStatus();

      const snapshot: DependencySystemSnapshot = {
        id: `snapshot_${Date.now()}`,
        timestamp: new Date(),
        version: '1.0.0',
        systemStatus,
        configuration: this.config,
        taskData: await this.persistence.getAllTaskData(),
        visualizationState: this.config.visualization.enableVisualization
          ? await this.visualization.exportState()
          : null,
        schedulerState: await this.scheduler.getSchedulerStatus(),
        analyzerMetrics: this.analyzer.getMetrics(),
        metadata: {
          uptime: systemStatus.metrics.uptime,
          tasksProcessed: systemStatus.metrics.tasksProcessed,
          memoryUsage: systemStatus.metrics.memoryUsage,
          errorRate: systemStatus.metrics.errorRate,
        },
      };

      if (this.config.persistence.enablePersistence) {
        await this.persistence.storeSnapshot(snapshot);
      }

      this.emit('snapshotCreated', snapshot);
      this.logger.info('System snapshot created successfully', {
        snapshotId: snapshot.id,
      });

      return snapshot;
    } catch (error) {
      this.logger.error('Failed to create system snapshot', { error });
      throw error;
    }
  }

  /**
   * Shutdown orchestrator gracefully
   */
  public async shutdown(): Promise<void> {
    this.logger.info('Shutting down DependencyOrchestrator...');

    try {
      // Stop monitoring timers
      if (this.healthCheckTimer) {
        clearInterval(this.healthCheckTimer);
        this.healthCheckTimer = null;
      }

      if (this.performanceTimer) {
        clearInterval(this.performanceTimer);
        this.performanceTimer = null;
      }

      // Create final snapshot
      if (this.config.persistence.enablePersistence) {
        await this.createSystemSnapshot();
      }

      // Shutdown components
      await Promise.allSettled([
        this.scheduler.shutdown(),
        this.visualization.shutdown(),
        this.persistence.shutdown(),
      ]);

      this.isInitialized = false;
      this.emit('orchestratorShutdown');

      this.logger.info('DependencyOrchestrator shutdown complete');
    } catch (error) {
      this.logger.error('Error during shutdown', { error });
      throw error;
    }
  }

  /**
   * Initialize all components
   */
  private async initializeComponents(): Promise<void> {
    const componentInitializations = [
      this.analyzer.initialize(),
      this.scheduler.initialize(),
      this.visualization.initialize(),
      this.persistence.initialize(),
    ];

    const results = await Promise.allSettled(componentInitializations);

    for (let i = 0; i < results.length; i++) {
      if (results[i].status === 'rejected') {
        const componentNames = [
          'analyzer',
          'scheduler',
          'visualization',
          'persistence',
        ];
        this.logger.error(`Failed to initialize ${componentNames[i]}`, {
          error: (results[i] as PromiseRejectedResult).reason,
        });
      }
    }
  }

  /**
   * Setup event handlers for cross-component communication
   */
  private setupEventHandlers(): void {
    // Analyzer events
    this.analyzer.on('dependencyViolation', (event) => {
      this.logger.warn('Dependency violation detected', event);
      this.emit('systemAlert', {
        severity: 'high',
        message: `Dependency violation: ${event.message}`,
        component: 'analyzer',
      });
    });

    // Scheduler events
    this.scheduler.on('resourceConstraintViolation', (event) => {
      this.logger.warn('Resource constraint violation', event);
      this.emit('systemAlert', {
        severity: 'high',
        message: `Resource constraint: ${event.message}`,
        component: 'scheduler',
      });
    });

    // Visualization events
    this.visualization.on('renderingError', (event) => {
      this.logger.error('Visualization rendering error', event);
      this.emit('systemAlert', {
        severity: 'medium',
        message: `Visualization error: ${event.message}`,
        component: 'visualization',
      });
    });

    // Persistence events
    this.persistence.on('dataIntegrityIssue', (event) => {
      this.logger.error('Data integrity issue', event);
      this.emit('systemAlert', {
        severity: 'critical',
        message: `Data integrity: ${event.message}`,
        component: 'persistence',
      });
    });
  }

  /**
   * Start health monitoring
   */
  private startHealthMonitoring(): void {
    this.healthCheckTimer = setInterval(async () => {
      try {
        const status = await this.getSystemStatus();

        if (
          status.overall === SystemHealthStatus.CRITICAL ||
          status.overall === SystemHealthStatus.FAILED
        ) {
          this.logger.error('System health critical', { status });

          if (this.config.recovery.enableAutoRecovery) {
            await this.attemptRecovery(
              'health_check',
              new Error('System health critical'),
            );
          }
        }

        this.emit('healthCheckComplete', status);
      } catch (error) {
        this.logger.error('Health check failed', { error });
      }
    }, this.config.system.healthCheckInterval);
  }

  /**
   * Start performance optimization
   */
  private startPerformanceOptimization(): void {
    this.performanceTimer = setInterval(async () => {
      try {
        await this.optimizePerformance();
      } catch (error) {
        this.logger.error('Automatic performance optimization failed', {
          error,
        });
      }
    }, this.config.system.performanceOptimizationInterval);
  }

  /**
   * Attempt system recovery
   */
  private async attemptRecovery(context: string, error: Error): Promise<void> {
    const attempts = this.recoveryAttempts.get(context) || 0;

    if (attempts >= this.config.recovery.maxRecoveryAttempts) {
      this.logger.error(`Maximum recovery attempts reached for ${context}`, {
        attempts,
        error,
      });
      this.emit('recoveryFailed', { context, error, attempts });
      return;
    }

    this.recoveryAttempts.set(context, attempts + 1);

    this.logger.info(`Attempting recovery for ${context}`, {
      attempt: attempts + 1,
      maxAttempts: this.config.recovery.maxRecoveryAttempts,
    });

    try {
      // Implement recovery strategies based on context
      switch (context) {
        case 'task_submission':
          await this.recoverTaskSubmission();
          break;
        case 'health_check':
          await this.recoverHealthCheck();
          break;
        default:
          await this.performGeneralRecovery();
      }

      this.recoveryAttempts.delete(context);
      this.emit('recoverySuccessful', { context, attempts: attempts + 1 });
    } catch (recoveryError) {
      this.logger.error(`Recovery attempt failed for ${context}`, {
        recoveryError,
        originalError: error,
      });

      // Try again with exponential backoff
      setTimeout(
        () => {
          this.attemptRecovery(context, error);
        },
        Math.pow(2, attempts) * 1000,
      );
    }
  }

  /**
   * Helper methods for recovery
   */
  private async recoverTaskSubmission(): Promise<void> {
    // Clear scheduler queue and restart
    await this.scheduler.clearQueue();
    this.logger.info('Task submission recovery: Scheduler queue cleared');
  }

  private async recoverHealthCheck(): Promise<void> {
    // Reset component connections
    await this.initializeComponents();
    this.logger.info('Health check recovery: Components reinitialized');
  }

  private async performGeneralRecovery(): Promise<void> {
    // General recovery actions
    await this.optimizeMemoryUsage();
    this.logger.info('General recovery: Memory optimized');
  }

  /**
   * Utility methods
   */
  private summarizeConfig(): any {
    return {
      autoStart: this.config.system.enableAutoStart,
      healthMonitoring: this.config.system.enableHealthMonitoring,
      performanceOptimization: this.config.system.enablePerformanceOptimization,
      maxConcurrentTasks:
        this.config.scheduler.resourceConstraints.maxConcurrentTasks,
      schedulingAlgorithm: this.config.scheduler.strategy.algorithm,
      visualizationEnabled: this.config.visualization.enableVisualization,
      persistenceEnabled: this.config.persistence.enablePersistence,
    };
  }

  private getStatusColor(status: string): string {
    const colorMap = {
      pending: '#FFA500',
      running: '#0000FF',
      completed: '#008000',
      failed: '#FF0000',
      blocked: '#800080',
    };
    return colorMap[status] || '#808080';
  }

  private calculateNodeSize(taskNode: TaskNode): number {
    const baseSize = 20;
    const priorityMultiplier =
      taskNode.priority === 'high'
        ? 1.5
        : taskNode.priority === 'medium'
          ? 1.2
          : 1.0;
    return baseSize * priorityMultiplier;
  }

  private getNodeShape(taskType: string): string {
    const shapeMap = {
      computation: 'circle',
      io: 'rectangle',
      network: 'diamond',
      database: 'hexagon',
    };
    return shapeMap[taskType] || 'circle';
  }

  private async getComponentHealth(
    component: string,
  ): Promise<SystemHealthStatus> {
    try {
      switch (component) {
        case 'analyzer':
          return this.analyzer.isHealthy()
            ? SystemHealthStatus.OPTIMAL
            : SystemHealthStatus.DEGRADED;
        case 'scheduler':
          const schedulerStatus = await this.scheduler.getSchedulerStatus();
          return schedulerStatus.health;
        case 'visualization':
          return this.visualization.isHealthy()
            ? SystemHealthStatus.OPTIMAL
            : SystemHealthStatus.DEGRADED;
        case 'persistence':
          return (await this.persistence.checkHealth())
            ? SystemHealthStatus.OPTIMAL
            : SystemHealthStatus.DEGRADED;
        default:
          return SystemHealthStatus.FAILED;
      }
    } catch (error) {
      return SystemHealthStatus.FAILED;
    }
  }

  private calculateOverallHealth(components: any): SystemHealthStatus {
    const statuses = Object.values(components) as SystemHealthStatus[];

    if (statuses.includes(SystemHealthStatus.FAILED)) {
      return SystemHealthStatus.FAILED;
    } else if (statuses.includes(SystemHealthStatus.CRITICAL)) {
      return SystemHealthStatus.CRITICAL;
    } else if (statuses.includes(SystemHealthStatus.DEGRADED)) {
      return SystemHealthStatus.DEGRADED;
    } else {
      return SystemHealthStatus.OPTIMAL;
    }
  }

  private async getCpuUsage(): Promise<number> {
    // Simple CPU usage approximation
    return new Promise((resolve) => {
      const start = process.hrtime();
      setImmediate(() => {
        const delta = process.hrtime(start);
        const nanosec = delta[0] * 1e9 + delta[1];
        const usage = nanosec / 1e6; // Convert to milliseconds
        resolve(Math.min(usage / 100, 1)); // Normalize to 0-1
      });
    });
  }

  private async getAverageResponseTime(): Promise<number> {
    // Placeholder implementation - would track actual response times
    return Math.random() * 100 + 50; // 50-150ms mock response time
  }

  private async getActiveAlerts(): Promise<any[]> {
    // Placeholder implementation - would return real alerts
    return [];
  }

  private async optimizeMemoryUsage(): Promise<number> {
    const before = process.memoryUsage().heapUsed;

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }

    const after = process.memoryUsage().heapUsed;
    const freed = before - after;

    if (freed > 0) {
      this.logger.info('Memory optimization completed', {
        freedBytes: freed,
        freedMB: (freed / 1024 / 1024).toFixed(2),
      });
    }

    return freed > 0 ? (freed / before) * 100 : 0; // Return percentage improvement
  }

  private async generatePerformanceRecommendations(): Promise<string[]> {
    const recommendations: string[] = [];
    const status = await this.getSystemStatus();

    if (status.metrics.memoryUsage > 0.8) {
      recommendations.push(
        'High memory usage detected - consider increasing memory allocation',
      );
    }

    if (status.metrics.cpuUsage > 0.8) {
      recommendations.push(
        'High CPU usage detected - consider load balancing or scaling',
      );
    }

    if (status.metrics.errorRate > 0.05) {
      recommendations.push(
        'High error rate detected - review error handling and system stability',
      );
    }

    return recommendations;
  }
}

/**
 * Factory function to create and initialize a DependencyOrchestrator
 */
export async function createDependencyOrchestrator(
  config: Partial<OrchestratorConfiguration> = {},
): Promise<DependencyOrchestrator> {
  const defaultConfig: OrchestratorConfiguration = {
    system: {
      enableAutoStart: true,
      enableHealthMonitoring: true,
      enablePerformanceOptimization: true,
      enableConflictResolution: true,
      healthCheckInterval: 30000,
      performanceOptimizationInterval: 300000,
      maxRecoveryAttempts: 3,
    },
    scheduler: {
      resourceConstraints: {
        maxConcurrentTasks: 10,
        memoryThreshold: 0.8,
        cpuThreshold: 0.8,
      },
      strategy: {
        algorithm: 'adaptive',
        parallelizationEnabled: true,
        resourceOptimization: true,
        loadBalancing: true,
      },
      performance: {
        enablePredictiveOptimization: true,
        learningEnabled: true,
        adaptiveThreshold: 0.1,
      },
    },
    visualization: {
      enableVisualization: true,
      enableRealTimeUpdates: true,
      updateInterval: 1000,
      layoutConfiguration: {
        algorithm: 'force_directed',
        nodeSpacing: 50,
        edgeStyle: 'curved',
      },
      alerts: {
        enableAutomaticAlerts: true,
        severityThreshold: 'medium',
      },
    },
    persistence: {
      enablePersistence: true,
      snapshotInterval: 600000,
      retentionPeriod: 2592000000,
      compressionEnabled: true,
      backupConfiguration: {
        enableBackups: true,
        backupInterval: 3600000,
        maxBackups: 24,
      },
    },
    recovery: {
      enableAutoRecovery: true,
      maxRecoveryAttempts: 3,
      recoveryTimeout: 30000,
      escalationPolicy: 'exponential',
    },
  };

  const mergedConfig = {
    system: { ...defaultConfig.system, ...config.system },
    scheduler: {
      ...defaultConfig.scheduler,
      ...config.scheduler,
      resourceConstraints: {
        ...defaultConfig.scheduler.resourceConstraints,
        ...config.scheduler?.resourceConstraints,
      },
      strategy: {
        ...defaultConfig.scheduler.strategy,
        ...config.scheduler?.strategy,
      },
      performance: {
        ...defaultConfig.scheduler.performance,
        ...config.scheduler?.performance,
      },
    },
    visualization: {
      ...defaultConfig.visualization,
      ...config.visualization,
      layoutConfiguration: {
        ...defaultConfig.visualization.layoutConfiguration,
        ...config.visualization?.layoutConfiguration,
      },
      alerts: {
        ...defaultConfig.visualization.alerts,
        ...config.visualization?.alerts,
      },
    },
    persistence: {
      ...defaultConfig.persistence,
      ...config.persistence,
      backupConfiguration: {
        ...defaultConfig.persistence.backupConfiguration,
        ...config.persistence?.backupConfiguration,
      },
    },
    recovery: { ...defaultConfig.recovery, ...config.recovery },
  };

  const orchestrator = new DependencyOrchestrator(mergedConfig);

  if (mergedConfig.system.enableAutoStart) {
    await orchestrator.initialize();
  }

  return orchestrator;
}

/**
 * Default export
 */
export default DependencyOrchestrator;
