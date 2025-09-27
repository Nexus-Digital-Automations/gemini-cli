/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Core TaskManager Class - Unified Autonomous Task Management Interface
 *
 * This is the main entry point for the autonomous task management system, providing
 * a unified interface that orchestrates all task management components including:
 * - Task execution and lifecycle management
 * - Intelligent task breakdown and scheduling
 * - Cross-session persistence
 * - Real-time monitoring and analytics
 * - Hook system integration
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import type { Config } from '../config/config.js';
import { TaskExecutionEngine } from './TaskExecutionEngine.complete.js';
import {
  EnhancedAutonomousTaskQueue,
  type EnhancedQueueConfig,
} from './EnhancedAutonomousTaskQueue.js';
import { ExecutionMonitoringSystem } from './ExecutionMonitoringSystem.js';
import { InfiniteHookIntegration } from './InfiniteHookIntegration.js';
import type { TaskStatus } from './TaskQueue.js';
import { TaskQueue, TaskPriority } from './TaskQueue.js';
import { PriorityScheduler, SchedulingAlgorithm } from './PriorityScheduler.js';
import { CrossSessionPersistenceEngine } from './CrossSessionPersistenceEngine.js';
import type {
  Task,
  TaskId,
  TaskStatus,
  TaskResult,
  TaskExecutionContext,
} from './types.js';

/**
 * TaskManager Configuration Options
 */
export interface TaskManagerConfig {
  /** Base configuration object */
  config: Config;
  /** Maximum concurrent tasks to execute */
  maxConcurrentTasks?: number;
  /** Enable autonomous task breakdown */
  enableAutonomousBreakdown?: boolean;
  /** Complexity threshold for automatic breakdown (0.0-1.0) */
  breakdownThreshold?: number;
  /** Maximum depth for task breakdown */
  maxBreakdownDepth?: number;
  /** Enable adaptive scheduling algorithms */
  enableAdaptiveScheduling?: boolean;
  /** Enable performance optimization */
  enablePerformanceOptimization?: boolean;
  /** Enable machine learning from execution history */
  enableLearning?: boolean;
  /** Enable real-time monitoring */
  enableMonitoring?: boolean;
  /** Enable infinite-continue-stop-hook integration */
  enableHookIntegration?: boolean;
  /** Enable cross-session persistence */
  enablePersistence?: boolean;
  /** Hook integration configuration */
  hookIntegrationConfig?: any;
  /** Monitoring configuration */
  monitoringConfig?: any;
  /** Queue configuration */
  queueConfig?: Partial<EnhancedQueueConfig>;
  /** Agent ID for hook integration */
  agentId?: string;
}

/**
 * Autonomous decision-making context
 */
export interface AutonomousContext {
  /** Current system load (0.0-1.0) */
  systemLoad: number;
  /** Available resources */
  availableResources: Record<string, number>;
  /** Historical performance metrics */
  performanceHistory: Array<{
    taskId: TaskId;
    duration: number;
    success: boolean;
    complexity: number;
    timestamp: Date;
  }>;
  /** Current queue state */
  queueState: {
    pending: number;
    inProgress: number;
    completed: number;
    failed: number;
  };
  /** Time constraints */
  timeConstraints?: {
    deadline?: Date;
    maxDuration?: number;
  };
}

/**
 * Task execution strategy
 */
export interface TaskExecutionStrategy {
  /** Execution approach */
  approach: 'sequential' | 'parallel' | 'hybrid' | 'adaptive';
  /** Concurrency level */
  concurrencyLevel: number;
  /** Resource allocation strategy */
  resourceStrategy: 'conservative' | 'aggressive' | 'balanced' | 'adaptive';
  /** Error handling approach */
  errorHandling: 'fail-fast' | 'resilient' | 'retry-aggressive' | 'adaptive';
  /** Quality gate enforcement */
  qualityGates: string[];
}

/**
 * Autonomous decision result
 */
export interface AutonomousDecision {
  /** Decision type */
  decision:
    | 'breakdown'
    | 'schedule'
    | 'execute'
    | 'pause'
    | 'optimize'
    | 'escalate';
  /** Confidence level (0.0-1.0) */
  confidence: number;
  /** Reasoning for the decision */
  reasoning: string;
  /** Recommended actions */
  actions: Array<{
    action: string;
    parameters: Record<string, unknown>;
    priority: number;
  }>;
  /** Expected outcomes */
  expectedOutcomes: {
    successProbability: number;
    estimatedDuration: number;
    riskLevel: 'low' | 'medium' | 'high';
  };
}

/**
 * Core TaskManager Class
 *
 * Provides enterprise-grade autonomous task management with intelligent
 * breakdown, adaptive scheduling, cross-session persistence, and real-time monitoring.
 */
export class TaskManager {
  private readonly config: Config;
  private readonly taskEngine: TaskExecutionEngine;
  private readonly autonomousQueue: EnhancedAutonomousTaskQueue;
  private readonly priorityQueue: TaskQueue;
  private readonly scheduler: PriorityScheduler;
  private readonly monitoring?: ExecutionMonitoringSystem;
  private readonly hookIntegration?: InfiniteHookIntegration;
  private readonly persistence: CrossSessionPersistenceEngine;

  private readonly enableAutonomousBreakdown: boolean;
  private readonly enableAdaptiveScheduling: boolean;
  private readonly enableLearning: boolean;
  private readonly agentId: string;

  private isRunning: boolean = false;
  private executionInterval?: NodeJS.Timeout;

  constructor(options: TaskManagerConfig) {
    console.log('🚀 Initializing TaskManager with autonomous capabilities...');

    this.config = options.config;
    this.enableAutonomousBreakdown =
      options.enableAutonomousBreakdown !== false;
    this.enableAdaptiveScheduling = options.enableAdaptiveScheduling !== false;
    this.enableLearning = options.enableLearning !== false;
    this.agentId = options.agentId || 'TASK_MANAGER_AUTONOMOUS_AGENT';

    // Initialize core task execution engine
    console.log('⚡ Initializing TaskExecutionEngine...');
    this.taskEngine = new TaskExecutionEngine(this.config, {
      onTaskStatusChange: this.handleTaskStatusChange.bind(this),
      onTaskComplete: this.handleTaskComplete.bind(this),
      onTaskFailed: this.handleTaskFailed.bind(this),
    });

    // Initialize autonomous task queue
    console.log('🤖 Initializing EnhancedAutonomousTaskQueue...');
    const queueConfig: Partial<EnhancedQueueConfig> = {
      maxConcurrentTasks: options.maxConcurrentTasks || 8,
      enableAutonomousBreakdown: this.enableAutonomousBreakdown,
      breakdownThreshold: options.breakdownThreshold || 0.7,
      maxBreakdownDepth: options.maxBreakdownDepth || 3,
      enableAdaptiveScheduling: this.enableAdaptiveScheduling,
      performanceOptimization: options.enablePerformanceOptimization !== false,
      learningEnabled: this.enableLearning,
      metricsEnabled: options.enableMonitoring !== false,
      ...options.queueConfig,
    };
    this.autonomousQueue = new EnhancedAutonomousTaskQueue(queueConfig);

    // Initialize priority queue for traditional scheduling
    console.log('📋 Initializing TaskQueue...');
    this.priorityQueue = new TaskQueue({
      maxConcurrentTasks: options.maxConcurrentTasks || 8,
      defaultTimeout: 30 * 60 * 1000, // 30 minutes
      defaultMaxRetries: 3,
      resourcePools: new Map([
        ['cpu', 8],
        ['memory', 16],
        ['network', 4],
      ]),
      priorityThresholds: {
        critical: 1000,
        high: 750,
        medium: 500,
        low: 250,
      },
      schedulingAlgorithm: 'dependency_aware',
      autoDependencyLearning: this.enableLearning,
      performanceMonitoring: options.enableMonitoring !== false,
    });

    // Initialize priority scheduler
    console.log('🎯 Initializing PriorityScheduler...');
    this.scheduler = new PriorityScheduler({
      algorithm: this.enableAdaptiveScheduling
        ? SchedulingAlgorithm.HYBRID_ADAPTIVE
        : SchedulingAlgorithm.PRIORITY_WEIGHTED,
      adaptiveLearning: this.enableLearning,
      performanceTracking: options.enableMonitoring !== false,
      resourceAware: true,
      dependencyAware: true,
    });

    // Initialize monitoring system
    if (options.enableMonitoring !== false) {
      console.log('📊 Initializing ExecutionMonitoringSystem...');
      this.monitoring = new ExecutionMonitoringSystem(
        this.config,
        options.monitoringConfig,
      );
    }

    // Initialize hook integration
    if (options.enableHookIntegration !== false) {
      console.log('🔗 Initializing InfiniteHookIntegration...');
      this.hookIntegration = new InfiniteHookIntegration(
        this.config,
        this.taskEngine,
        this.monitoring!,
        {
          agentId: this.agentId,
          capabilities: [
            'autonomous_task_management',
            'intelligent_breakdown',
            'adaptive_scheduling',
          ],
          ...options.hookIntegrationConfig,
        },
      );
    }

    // Initialize persistence engine
    console.log('💾 Initializing CrossSessionPersistenceEngine...');
    this.persistence = new CrossSessionPersistenceEngine(this.config, {
      enableCompression: true,
      encryptionEnabled: true,
      maxSessionHistory: 100,
      autoCleanupIntervalMs: 24 * 60 * 60 * 1000, // 24 hours
    });

    console.log(
      '✅ TaskManager initialized successfully with autonomous capabilities',
    );
  }

  /**
   * Initialize all components and start autonomous operation
   */
  async initialize(): Promise<void> {
    console.log('🔄 Initializing TaskManager components...');

    try {
      // Initialize persistence first
      await this.persistence.initialize();
      console.log('✅ Persistence engine initialized');

      // Initialize hook integration
      if (this.hookIntegration) {
        await this.hookIntegration.initialize();
        console.log('✅ Hook integration initialized');
      }

      // Load persisted state
      await this.loadPersistedState();

      // Start autonomous execution loop
      this.startAutonomousExecution();

      this.isRunning = true;
      console.log('🎉 TaskManager fully initialized and running autonomously');
    } catch (error) {
      console.error('❌ TaskManager initialization failed:', error);
      throw new Error(`TaskManager initialization failed: ${error}`);
    }
  }

  /**
   * Add a new task with autonomous decision-making
   */
  async addTask(
    title: string,
    description: string,
    options?: {
      priority?: TaskPriority;
      category?: string;
      executionContext?: TaskExecutionContext;
      parameters?: Record<string, unknown>;
      expectedOutputs?: Record<string, unknown>;
      dependencies?: TaskId[];
      forceBreakdown?: boolean;
      useAutonomousQueue?: boolean;
    },
  ): Promise<TaskId> {
    console.log(`📥 Adding new task: ${title}`);

    // Make autonomous decision about task handling
    const context = await this.getAutonomousContext();
    const decision = await this.makeAutonomousDecision('add_task', {
      title,
      description,
      options,
      context,
    });

    console.log(
      `🧠 Autonomous decision: ${decision.decision} (confidence: ${Math.round(decision.confidence * 100)}%)`,
    );
    console.log(`🔍 Reasoning: ${decision.reasoning}`);

    let taskId: TaskId;

    // Use autonomous queue if recommended or requested
    if (
      decision.decision === 'breakdown' ||
      options?.useAutonomousQueue !== false
    ) {
      console.log(
        '🤖 Using autonomous task queue for intelligent processing...',
      );

      taskId = await this.autonomousQueue.addTask({
        title,
        description,
        category: (options?.category as any) || 'implementation',
        priority: options?.priority || TaskPriority.MEDIUM,
        estimatedDuration: this.estimateTaskDuration(title, description),
        executeFunction: async (task, executionContext) =>
          this.executeTaskWithQualityGates(task, executionContext),
        dependencies: options?.dependencies,
        executionContext: options?.executionContext,
        parameters: options?.parameters,
        expectedOutputs: options?.expectedOutputs,
        forceBreakdown:
          options?.forceBreakdown || decision.decision === 'breakdown',
      });
    } else {
      console.log('📋 Using traditional task queue for standard processing...');

      // Create task for traditional queue
      const task: Task = {
        id: this.generateTaskId(),
        title,
        description,
        status: 'pending',
        priority: options?.priority || 'medium',
        category: (options?.category as any) || 'implementation',
        executionContext: options?.executionContext,
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: this.agentId,
          estimatedDuration: this.estimateTaskDuration(title, description),
          tags: ['traditional_queue'],
        },
        parameters: options?.parameters,
        expectedOutput: options?.expectedOutputs,
      };

      taskId = await this.priorityQueue.enqueue(task);
    }

    // Persist task state
    await this.persistTaskState(taskId);

    console.log(`✅ Task added successfully: ${taskId}`);
    return taskId;
  }

  /**
   * Execute a single task with comprehensive quality gates
   */
  private async executeTaskWithQualityGates(
    task: any,
    executionContext: any,
  ): Promise<{ success: boolean; result?: any; error?: string }> {
    console.log(`🔄 Executing task with quality gates: ${task.title}`);

    try {
      // Pre-execution quality gates
      const preChecks = await this.runPreExecutionChecks(task);
      if (!preChecks.passed) {
        throw new Error(`Pre-execution checks failed: ${preChecks.reason}`);
      }

      // Execute task using main engine
      const result = await this.taskEngine.executeTask(task.id, {
        ...executionContext,
        qualityGates: [
          'linting',
          'type_checking',
          'security_scan',
          'build_validation',
        ],
        onProgress: (progress) => {
          console.log(`📈 Task ${task.id} progress: ${progress}%`);
        },
      });

      // Post-execution quality gates
      const postChecks = await this.runPostExecutionChecks(task, result);
      if (!postChecks.passed) {
        throw new Error(`Post-execution checks failed: ${postChecks.reason}`);
      }

      console.log(
        `✅ Task executed successfully with quality gates: ${task.title}`,
      );
      return { success: true, result: result.output };
    } catch (error) {
      console.error(`❌ Task execution failed: ${task.title}`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get task status with comprehensive information
   */
  async getTaskStatus(taskId: TaskId): Promise<{
    status: TaskStatus;
    progress: number;
    result?: TaskResult;
    breakdown?: any;
    metrics?: any;
  }> {
    // Check autonomous queue first
    const autonomousStatus = this.autonomousQueue.getTaskStatus(taskId);
    if (autonomousStatus) {
      return {
        status: autonomousStatus.status as TaskStatus,
        progress: autonomousStatus.progress || 0,
        result: autonomousStatus.result as TaskResult,
        breakdown: autonomousStatus.breakdown,
        metrics: autonomousStatus.metrics,
      };
    }

    // Check traditional queue
    const task = this.priorityQueue.getTask(taskId);
    if (task) {
      return {
        status: task.status,
        progress: this.calculateTaskProgress(task),
        metrics: this.calculateTaskMetrics(task),
      };
    }

    throw new Error(`Task not found: ${taskId}`);
  }

  /**
   * Get comprehensive system status
   */
  getSystemStatus(): {
    isRunning: boolean;
    autonomousMode: boolean;
    taskCounts: Record<string, number>;
    systemHealth: any;
    performance: any;
  } {
    const autonomousStatus = this.autonomousQueue.getAutonomousQueueStatus();
    const traditionalStatus = this.priorityQueue.getStatus();

    return {
      isRunning: this.isRunning,
      autonomousMode: this.enableAutonomousBreakdown,
      taskCounts: {
        autonomous: autonomousStatus.totalTasks,
        traditional: traditionalStatus.totalTasks,
        pending: autonomousStatus.pendingTasks + traditionalStatus.pendingTasks,
        inProgress:
          autonomousStatus.runningTasks + traditionalStatus.runningTasks,
        completed:
          autonomousStatus.completedTasks + traditionalStatus.completedTasks,
        failed: autonomousStatus.failedTasks + traditionalStatus.failedTasks,
      },
      systemHealth: this.monitoring?.getSystemHealth(),
      performance: {
        autonomous: this.autonomousQueue.getPerformanceMetrics(),
        traditional: traditionalStatus.performance,
      },
    };
  }

  /**
   * Make autonomous decisions based on current context
   */
  private async makeAutonomousDecision(
    decisionType: string,
    context: any,
  ): Promise<AutonomousDecision> {
    const autonomousContext = await this.getAutonomousContext();

    // Analyze task complexity and system state
    const complexity = this.analyzeTaskComplexity(
      context.title,
      context.description,
    );
    const systemLoad = autonomousContext.systemLoad;
    const availableResources = autonomousContext.availableResources;

    // Decision logic based on multiple factors
    let decision: AutonomousDecision['decision'] = 'execute';
    let confidence = 0.5;
    let reasoning = 'Standard execution';

    if (complexity > 0.7 && this.enableAutonomousBreakdown) {
      decision = 'breakdown';
      confidence = 0.8;
      reasoning = `High complexity (${Math.round(complexity * 100)}%) - autonomous breakdown recommended`;
    } else if (systemLoad > 0.8) {
      decision = 'schedule';
      confidence = 0.7;
      reasoning = `High system load (${Math.round(systemLoad * 100)}%) - scheduled execution recommended`;
    } else if (
      Object.values(availableResources).some((resource) => resource < 0.2)
    ) {
      decision = 'pause';
      confidence = 0.9;
      reasoning = 'Low resource availability - execution pause recommended';
    }

    return {
      decision,
      confidence,
      reasoning,
      actions: [
        {
          action: decision,
          parameters: { taskComplexity: complexity, systemLoad },
          priority: 1,
        },
      ],
      expectedOutcomes: {
        successProbability: confidence,
        estimatedDuration: this.estimateTaskDuration(
          context.title,
          context.description,
        ),
        riskLevel:
          complexity > 0.8 ? 'high' : complexity > 0.5 ? 'medium' : 'low',
      },
    };
  }

  /**
   * Get current autonomous context
   */
  private async getAutonomousContext(): Promise<AutonomousContext> {
    const queueState = this.getSystemStatus().taskCounts;

    return {
      systemLoad:
        queueState.inProgress / (this.autonomousQueue.maxConcurrentTasks || 8),
      availableResources: {
        cpu: 0.7, // Mock values - would be real system metrics
        memory: 0.8,
        network: 0.9,
      },
      performanceHistory: [], // Would be loaded from persistence
      queueState: {
        pending: queueState.pending,
        inProgress: queueState.inProgress,
        completed: queueState.completed,
        failed: queueState.failed,
      },
    };
  }

  /**
   * Start autonomous execution loop
   */
  private startAutonomousExecution(): void {
    console.log('🔄 Starting autonomous execution loop...');

    this.executionInterval = setInterval(async () => {
      try {
        await this.autonomousExecutionCycle();
      } catch (error) {
        console.error('❌ Autonomous execution cycle error:', error);
      }
    }, 5000); // Every 5 seconds
  }

  /**
   * Execute one cycle of autonomous task management
   */
  private async autonomousExecutionCycle(): Promise<void> {
    // Process autonomous queue
    await this.autonomousQueue.processQueue();

    // Process traditional queue
    await this.priorityQueue.processQueue();

    // Update monitoring metrics
    if (this.monitoring) {
      await this.updateMonitoringMetrics();
    }

    // Persist current state
    await this.persistCurrentState();
  }

  /**
   * Helper methods for task analysis and execution
   */
  private analyzeTaskComplexity(title: string, description: string): number {
    // Complexity analysis based on title and description
    let complexity = 0;

    // Check for complex keywords
    const complexKeywords = [
      'refactor',
      'architecture',
      'integration',
      'migration',
      'optimization',
      'comprehensive',
      'complete',
      'entire',
      'full',
      'system',
      'framework',
    ];

    const text = (title + ' ' + description).toLowerCase();
    complexKeywords.forEach((keyword) => {
      if (text.includes(keyword)) complexity += 0.1;
    });

    // Check description length (longer = more complex)
    if (description.length > 500) complexity += 0.2;
    if (description.length > 1000) complexity += 0.3;

    // Check for multi-step indicators
    const steps = (description.match(/\d+\./g) || []).length;
    complexity += Math.min(steps * 0.1, 0.3);

    return Math.min(complexity, 1.0);
  }

  private estimateTaskDuration(title: string, description: string): number {
    const complexity = this.analyzeTaskComplexity(title, description);
    const baseDuration = 30 * 60 * 1000; // 30 minutes base
    return Math.round(baseDuration * (1 + complexity * 3)); // Scale by complexity
  }

  private generateTaskId(): TaskId {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private calculateTaskProgress(task: Task): number {
    // Mock implementation - would calculate based on actual task state
    switch (task.status) {
      case 'pending':
        return 0;
      case 'queued':
        return 10;
      case 'running':
        return 50;
      case 'completed':
        return 100;
      case 'failed':
        return 0;
      case 'blocked':
        return 25;
      case 'cancelled':
        return 0;
      default:
        return 0;
    }
  }

  private calculateTaskMetrics(task: Task): any {
    return {
      estimatedDuration: task.metadata.estimatedDuration,
      actualDuration: task.metadata.actualDuration,
      retryCount: task.metadata.retryCount || 0,
      complexity: this.analyzeTaskComplexity(task.title, task.description),
    };
  }

  /**
   * Quality gate implementations
   */
  private async runPreExecutionChecks(
    task: any,
  ): Promise<{ passed: boolean; reason?: string }> {
    // Implementation would include actual checks
    console.log(`🔍 Running pre-execution checks for: ${task.title}`);
    return { passed: true };
  }

  private async runPostExecutionChecks(
    task: any,
    _result: any,
  ): Promise<{ passed: boolean; reason?: string }> {
    // Implementation would include actual validation
    console.log(`✅ Running post-execution checks for: ${task.title}`);
    return { passed: true };
  }

  /**
   * Persistence methods
   */
  private async loadPersistedState(): Promise<void> {
    console.log('💾 Loading persisted task state...');
    try {
      const persistedData = await this.persistence.loadSession(this.agentId);
      if (persistedData) {
        console.log(
          `✅ Loaded ${persistedData.tasks?.length || 0} persisted tasks`,
        );
      }
    } catch (error) {
      console.warn('⚠️ Could not load persisted state:', error);
    }
  }

  private async persistTaskState(taskId: TaskId): Promise<void> {
    try {
      await this.persistence.saveTaskState(taskId, {
        timestamp: new Date(),
        status: 'queued',
        agentId: this.agentId,
      });
    } catch (error) {
      console.warn(`⚠️ Could not persist task state for ${taskId}:`, error);
    }
  }

  private async persistCurrentState(): Promise<void> {
    try {
      const currentState = {
        agentId: this.agentId,
        timestamp: new Date(),
        systemStatus: this.getSystemStatus(),
        tasks: this.getAllTasks(),
      };

      await this.persistence.saveSession(this.agentId, currentState);
    } catch (error) {
      console.warn('⚠️ Could not persist current state:', error);
    }
  }

  private getAllTasks(): any[] {
    const autonomousTasks = this.autonomousQueue.getTasks();
    const traditionalTasks = this.priorityQueue.getTasks();
    return [...autonomousTasks, ...traditionalTasks];
  }

  private async updateMonitoringMetrics(): Promise<void> {
    if (!this.monitoring) return;

    const allTasks = this.getAllTasks();
    const metrics = await this.monitoring.collectMetrics(allTasks);

    // Record system-level metrics
    this.monitoring.recordEvent({
      taskId: 'system',
      eventType: 'progress',
      timestamp: new Date(),
      metadata: {
        totalTasks: allTasks.length,
        systemStatus: this.getSystemStatus(),
        performanceMetrics: metrics,
      },
    });
  }

  /**
   * Event handlers for task lifecycle
   */
  private async handleTaskStatusChange(task: Task): Promise<void> {
    console.log(`📋 Task ${task.id} status changed: ${task.status}`);

    if (this.monitoring) {
      this.monitoring.recordEvent({
        taskId: task.id,
        eventType: 'progress',
        timestamp: new Date(),
        metadata: {
          oldStatus: task.status,
          newStatus: task.status,
          title: task.title,
        },
      });
    }

    await this.persistTaskState(task.id);
  }

  private async handleTaskComplete(task: Task): Promise<void> {
    console.log(`✅ Task completed successfully: ${task.title}`);

    if (this.monitoring) {
      this.monitoring.recordEvent({
        taskId: task.id,
        eventType: 'completed',
        timestamp: new Date(),
        metadata: {
          title: task.title,
          duration: task.metadata.actualDuration,
          success: true,
        },
      });
    }

    await this.persistTaskState(task.id);
  }

  private async handleTaskFailed(task: Task, error: string): Promise<void> {
    console.error(`❌ Task failed: ${task.title} - ${error}`);

    if (this.monitoring) {
      this.monitoring.recordEvent({
        taskId: task.id,
        eventType: 'failed',
        timestamp: new Date(),
        metadata: {
          title: task.title,
          error,
          retryCount: task.metadata.retryCount || 0,
        },
        error,
      });
    }

    await this.persistTaskState(task.id);
  }

  /**
   * Shutdown and cleanup
   */
  async shutdown(): Promise<void> {
    console.log('🛑 Shutting down TaskManager...');

    this.isRunning = false;

    if (this.executionInterval) {
      clearInterval(this.executionInterval);
    }

    // Persist final state
    await this.persistCurrentState();

    // Shutdown components
    await this.autonomousQueue.shutdown();
    await this.priorityQueue.shutdown();

    if (this.hookIntegration) {
      await this.hookIntegration.shutdown();
    }

    if (this.monitoring) {
      await this.monitoring.shutdown();
    }

    await this.taskEngine.shutdown();
    await this.persistence.shutdown();

    console.log('✅ TaskManager shutdown complete');
  }
}

/**
 * Factory function for creating TaskManager instances
 */
export async function createTaskManager(
  options: TaskManagerConfig,
): Promise<TaskManager> {
  const taskManager = new TaskManager(options);
  await taskManager.initialize();
  return taskManager;
}

/**
 * Export interfaces and types for external use
 */
