/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Config } from '../config/config.js';
import type { TaskType } from '../task-management/TaskExecutionEngine.js';
import { TaskExecutionEngine, TaskComplexity, TaskStatus } from '../task-management/TaskExecutionEngine.js';
import { TaskQueue } from '../task-management/TaskQueue.js';
import { logger } from '../utils/logger.js';
import { EventEmitter } from 'node:events';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

/**
 * @fileoverview System Initializer for Autonomous Task Management
 *
 * This module provides comprehensive initialization and management of the autonomous
 * task management system, handling startup, shutdown, persistence, and coordination
 * of all system components.
 */

/**
 * System configuration interface
 */
export interface SystemConfig {
  /** Persistence configuration */
  persistenceConfig: {
    type: 'file' | 'database' | 'memory';
    path?: string;
    connectionString?: string;
  };

  /** Logging configuration */
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    output: 'console' | 'file';
    filePath?: string;
  };

  /** Agent coordination settings */
  agentConfig?: {
    maxConcurrentAgents: number;
    heartbeatInterval: number;
    sessionTimeout: number;
  };

  /** Quality gates configuration */
  qualityConfig?: {
    enableLinting: boolean;
    enableTesting: boolean;
    enableSecurity: boolean;
    enablePerformance: boolean;
  };

  /** Feature integration settings */
  featureConfig?: {
    featuresFilePath: string;
    requireApproval: boolean;
    autoRejectTimeout: number;
  };

  /** Monitoring configuration */
  monitoring?: {
    enableMetrics: boolean;
    metricsInterval: number;
    alertThresholds: Record<string, number>;
  };
}

/**
 * System status information
 */
export interface SystemStatus {
  isRunning: boolean;
  pid?: number;
  startTime: Date;
  uptime: number;
  activeAgents: number;
  taskQueue: {
    queued: number;
    running: number;
    completed: number;
    failed: number;
  };
  resources: {
    memoryUsage: NodeJS.MemoryUsage;
    cpuUsage: NodeJS.CpuUsage;
  };
  health: 'healthy' | 'degraded' | 'critical';
  lastHeartbeat: Date;
}

/**
 * Agent information
 */
export interface AgentInfo {
  id: string;
  type: string;
  status: 'active' | 'idle' | 'busy' | 'error';
  currentTask?: string;
  capabilities: string[];
  lastHeartbeat: Date;
  sessionId: string;
}

/**
 * Comprehensive System Initializer for Autonomous Task Management
 *
 * Manages the complete lifecycle of the autonomous task management system,
 * including initialization, monitoring, persistence, and graceful shutdown.
 */
export class SystemInitializer extends EventEmitter {
  private readonly coreConfig: Config;
  private readonly systemConfig: SystemConfig;
  private taskExecutionEngine?: TaskExecutionEngine;
  private taskQueue?: TaskQueue;
  private isRunning = false;
  private startTime?: Date;
  private lastCpuUsage?: NodeJS.CpuUsage;

  // System monitoring
  private heartbeatTimer?: NodeJS.Timeout;
  private metricsTimer?: NodeJS.Timeout;
  private statusFile?: string;
  private pidFile?: string;

  // Agent tracking
  private activeAgents = new Map<string, AgentInfo>();
  private agentTimeouts = new Map<string, NodeJS.Timeout>();

  constructor(coreConfig: Config, systemConfig: SystemConfig) {
    super();
    this.coreConfig = coreConfig;
    this.systemConfig = systemConfig;

    // Set up file paths
    this.statusFile = path.join(process.cwd(), '.autonomous-system.state');
    this.pidFile = path.join(process.cwd(), '.autonomous-system.pid');

    // Set up process signal handlers
    this.setupSignalHandlers();

    logger.info('SystemInitializer created', {
      persistenceType: systemConfig.persistenceConfig.type,
      maxAgents: systemConfig.agentConfig?.maxConcurrentAgents || 10
    });
  }

  /**
   * Initialize the autonomous task management system
   */
  async initialize(): Promise<void> {
    if (this.isRunning) {
      throw new Error('System is already running');
    }

    logger.info('Initializing Autonomous Task Management System...');
    this.startTime = new Date();
    this.lastCpuUsage = process.cpuUsage();

    try {
      // 1. Initialize core components
      await this.initializeCoreComponents();

      // 2. Load persisted state
      await this.loadPersistedState();

      // 3. Start monitoring systems
      this.startMonitoring();

      // 4. Write PID file
      await this.writePidFile();

      // 5. Emit initialization event
      this.isRunning = true;
      this.emit('systemInitialized', this.getSystemStatus());

      logger.info('Autonomous Task Management System initialized successfully', {
        startTime: this.startTime.toISOString(),
        pid: process.pid
      });

    } catch (error) {
      logger.error('Failed to initialize system', { error: (error as Error).message });
      await this.cleanup();
      throw error;
    }
  }

  /**
   * Initialize core system components
   */
  private async initializeCoreComponents(): Promise<void> {
    logger.info('Initializing core components...');

    // Initialize Task Queue with configuration
    this.taskQueue = new TaskQueue({
      maxConcurrentTasks: this.systemConfig.agentConfig?.maxConcurrentAgents || 10,
      maxRetries: 3,
      defaultTimeout: 300000, // 5 minutes
      enableBatching: true,
      enableParallelExecution: true,
      enableSmartScheduling: true,
      enableQueueOptimization: true,
      persistenceEnabled: this.systemConfig.persistenceConfig.type !== 'memory',
      metricsEnabled: this.systemConfig.monitoring?.enableMetrics ?? true
    });

    // Initialize Task Execution Engine with event handlers
    this.taskExecutionEngine = new TaskExecutionEngine(this.coreConfig, {
      onTaskStatusChange: (task) => {
        this.emit('taskStatusChanged', task);
        this.updateSystemState();
      },
      onTaskComplete: (task) => {
        logger.info(`Task completed: ${task.title}`, { taskId: task.id });
        this.emit('taskCompleted', task);
        this.updateSystemState();
      },
      onTaskFailed: (task, error) => {
        logger.error(`Task failed: ${task.title}`, { taskId: task.id, error });
        this.emit('taskFailed', task, error);
        this.updateSystemState();
      }
    });

    // Set up task queue event handlers
    this.taskQueue.on('taskAdded', (task) => {
      logger.debug(`Task added to queue: ${task.title}`, { taskId: task.id });
      this.emit('taskQueued', task);
    });

    this.taskQueue.on('taskStarted', (task) => {
      logger.info(`Task started: ${task.title}`, { taskId: task.id });
      this.emit('taskStarted', task);
    });

    logger.info('Core components initialized successfully');
  }

  /**
   * Load persisted system state
   */
  private async loadPersistedState(): Promise<void> {
    if (this.systemConfig.persistenceConfig.type === 'memory') {
      logger.info('Using memory persistence - no state to load');
      return;
    }

    try {
      if (this.statusFile && await this.fileExists(this.statusFile)) {
        const stateData = await fs.readFile(this.statusFile, 'utf-8');
        const systemState = JSON.parse(stateData);

        logger.info('Loaded persisted system state', {
          lastShutdown: systemState.lastShutdown,
          totalTasks: systemState.taskQueue?.total || 0
        });

        // Restore task queue state if available
        // In a real implementation, this would restore actual task objects
      }
    } catch (error) {
      logger.warn('Failed to load persisted state', { error: (error as Error).message });
    }
  }

  /**
   * Start system monitoring
   */
  private startMonitoring(): void {
    const heartbeatInterval = this.systemConfig.agentConfig?.heartbeatInterval || 30000;
    const metricsInterval = this.systemConfig.monitoring?.metricsInterval || 60000;

    // Start heartbeat monitoring
    this.heartbeatTimer = setInterval(() => {
      this.updateSystemState();
      this.checkAgentTimeouts();
      this.emit('heartbeat', this.getSystemStatus());
    }, heartbeatInterval);

    // Start metrics collection
    if (this.systemConfig.monitoring?.enableMetrics) {
      this.metricsTimer = setInterval(() => {
        this.collectMetrics();
      }, metricsInterval);
    }

    logger.info('System monitoring started', {
      heartbeatInterval,
      metricsInterval: this.systemConfig.monitoring?.enableMetrics ? metricsInterval : 'disabled'
    });
  }

  /**
   * Register a new agent with the system
   */
  async registerAgent(agentId: string, type: string, capabilities: string[], sessionId: string): Promise<void> {
    const agentInfo: AgentInfo = {
      id: agentId,
      type,
      status: 'active',
      capabilities,
      lastHeartbeat: new Date(),
      sessionId
    };

    this.activeAgents.set(agentId, agentInfo);

    // Set up timeout monitoring for this agent
    this.resetAgentTimeout(agentId);

    logger.info(`Agent registered: ${agentId}`, {
      type,
      capabilities,
      sessionId,
      totalAgents: this.activeAgents.size
    });

    this.emit('agentRegistered', agentInfo);
    this.updateSystemState();
  }

  /**
   * Update agent heartbeat
   */
  async agentHeartbeat(agentId: string, status?: 'active' | 'idle' | 'busy' | 'error', currentTask?: string): Promise<void> {
    const agent = this.activeAgents.get(agentId);
    if (!agent) {
      logger.warn(`Heartbeat from unknown agent: ${agentId}`);
      return;
    }

    agent.lastHeartbeat = new Date();
    if (status) agent.status = status;
    if (currentTask !== undefined) agent.currentTask = currentTask;

    this.resetAgentTimeout(agentId);
    this.emit('agentHeartbeat', agent);
  }

  /**
   * Unregister an agent
   */
  async unregisterAgent(agentId: string, reason = 'Normal shutdown'): Promise<void> {
    const agent = this.activeAgents.get(agentId);
    if (!agent) {
      return;
    }

    // Clean up timeout
    const timeout = this.agentTimeouts.get(agentId);
    if (timeout) {
      clearTimeout(timeout);
      this.agentTimeouts.delete(agentId);
    }

    this.activeAgents.delete(agentId);

    logger.info(`Agent unregistered: ${agentId}`, {
      reason,
      totalAgents: this.activeAgents.size
    });

    this.emit('agentUnregistered', agent, reason);
    this.updateSystemState();
  }

  /**
   * Queue a new task for autonomous execution
   */
  async queueTask(title: string, description: string, options?: {
    type?: TaskType;
    priority?: number;
    expectedOutputs?: Record<string, string>;
    context?: Record<string, unknown>;
    maxExecutionTimeMinutes?: number;
  }): Promise<string> {
    if (!this.taskExecutionEngine) {
      throw new Error('Task execution engine not initialized');
    }

    const taskId = await this.taskExecutionEngine.queueTask(title, description, {
      type: options?.type,
      expectedOutputs: options?.expectedOutputs,
      context: options?.context,
      maxExecutionTimeMinutes: options?.maxExecutionTimeMinutes
    });

    logger.info(`Task queued: ${title}`, { taskId });
    this.emit('taskQueued', { id: taskId, title, description });

    return taskId;
  }

  /**
   * Get current system status
   */
  getSystemStatus(): SystemStatus {
    const now = new Date();
    const uptime = this.startTime ? now.getTime() - this.startTime.getTime() : 0;

    const taskMetrics = this.taskQueue?.getMetrics() || {
      pendingTasks: 0,
      runningTasks: 0,
      completedTasks: 0,
      failedTasks: 0
    };

    let health: 'healthy' | 'degraded' | 'critical' = 'healthy';

    // Determine health based on various factors
    const totalTasks = taskMetrics.completedTasks + taskMetrics.failedTasks;
    const failureRate = totalTasks > 0 ? taskMetrics.failedTasks / totalTasks : 0;

    if (failureRate > 0.5 || taskMetrics.pendingTasks > 200) {
      health = 'critical';
    } else if (failureRate > 0.2 || taskMetrics.pendingTasks > 100) {
      health = 'degraded';
    }

    return {
      isRunning: this.isRunning,
      pid: process.pid,
      startTime: this.startTime || now,
      uptime,
      activeAgents: this.activeAgents.size,
      taskQueue: {
        queued: taskMetrics.pendingTasks,
        running: taskMetrics.runningTasks,
        completed: taskMetrics.completedTasks,
        failed: taskMetrics.failedTasks
      },
      resources: {
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage(this.lastCpuUsage)
      },
      health,
      lastHeartbeat: now
    };
  }

  /**
   * Get list of active agents
   */
  getActiveAgents(): AgentInfo[] {
    return Array.from(this.activeAgents.values());
  }

  /**
   * Gracefully shutdown the system
   */
  async shutdown(timeoutMs = 30000): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    logger.info('Initiating system shutdown...');
    this.emit('systemShutdown', 'initiated');

    try {
      // Stop accepting new tasks
      this.isRunning = false;

      // Stop monitoring
      this.stopMonitoring();

      // Notify all agents to shutdown
      for (const [agentId, agent] of this.activeAgents) {
        this.emit('agentShutdownRequest', agent);
      }

      // Wait for graceful shutdown with timeout
      const shutdownStart = Date.now();
      while (this.activeAgents.size > 0 && (Date.now() - shutdownStart) < timeoutMs) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Force unregister remaining agents
      for (const agentId of this.activeAgents.keys()) {
        await this.unregisterAgent(agentId, 'Force shutdown');
      }

      // Shutdown task queue
      if (this.taskQueue) {
        await this.taskQueue.shutdown(timeoutMs);
      }

      // Save final state
      await this.saveSystemState();

      // Cleanup
      await this.cleanup();

      logger.info('System shutdown completed');
      this.emit('systemShutdown', 'completed');

    } catch (error) {
      logger.error('Error during system shutdown', { error: (error as Error).message });
      this.emit('systemShutdown', 'error', error);
    }
  }

  /**
   * Setup signal handlers for graceful shutdown
   */
  private setupSignalHandlers(): void {
    process.on('SIGTERM', async () => {
      logger.info('Received SIGTERM, initiating graceful shutdown');
      await this.shutdown();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      logger.info('Received SIGINT, initiating graceful shutdown');
      await this.shutdown();
      process.exit(0);
    });

    process.on('SIGUSR1', async () => {
      logger.info('Received SIGUSR1, saving system state');
      await this.saveSystemState();
    });

    process.on('SIGUSR2', () => {
      logger.info('Received SIGUSR2, logging system status');
      const status = this.getSystemStatus();
      logger.info('Current system status', status);
    });

    process.on('uncaughtException', async (error) => {
      logger.error('Uncaught exception, shutting down', { error: error.message, stack: error.stack });
      await this.shutdown(5000); // Quick shutdown on uncaught exception
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled promise rejection', { reason, promise });
      // Don't exit on unhandled rejection, just log it
    });
  }

  /**
   * Reset agent timeout
   */
  private resetAgentTimeout(agentId: string): void {
    const existingTimeout = this.agentTimeouts.get(agentId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    const timeoutMs = this.systemConfig.agentConfig?.sessionTimeout || 300000; // 5 minutes
    const timeout = setTimeout(() => {
      this.handleAgentTimeout(agentId);
    }, timeoutMs);

    this.agentTimeouts.set(agentId, timeout);
  }

  /**
   * Handle agent timeout
   */
  private handleAgentTimeout(agentId: string): void {
    logger.warn(`Agent timeout: ${agentId}`);
    this.unregisterAgent(agentId, 'Timeout');
  }

  /**
   * Check for agent timeouts
   */
  private checkAgentTimeouts(): void {
    const now = Date.now();
    const timeoutMs = this.systemConfig.agentConfig?.sessionTimeout || 300000;

    for (const [agentId, agent] of this.activeAgents) {
      const timeSinceHeartbeat = now - agent.lastHeartbeat.getTime();
      if (timeSinceHeartbeat > timeoutMs) {
        this.handleAgentTimeout(agentId);
      }
    }
  }

  /**
   * Update system state file
   */
  private async updateSystemState(): Promise<void> {
    if (!this.statusFile) return;

    try {
      const status = this.getSystemStatus();
      const stateData = {
        ...status,
        agents: Array.from(this.activeAgents.values()),
        lastUpdated: new Date().toISOString()
      };

      await fs.writeFile(this.statusFile, JSON.stringify(stateData, null, 2));
    } catch (error) {
      logger.warn('Failed to update system state file', { error: (error as Error).message });
    }
  }

  /**
   * Save system state for persistence
   */
  private async saveSystemState(): Promise<void> {
    logger.info('Saving system state...');

    try {
      const status = this.getSystemStatus();
      const stateData = {
        ...status,
        agents: Array.from(this.activeAgents.values()),
        lastShutdown: new Date().toISOString(),
        shutdownReason: 'normal'
      };

      if (this.statusFile) {
        await fs.writeFile(this.statusFile, JSON.stringify(stateData, null, 2));
      }

      // Save task queue state if persistence is enabled
      if (this.systemConfig.persistenceConfig.type === 'file' && this.systemConfig.persistenceConfig.path) {
        const taskData = {
          tasks: this.taskQueue?.getTasks() || [],
          lastSaved: new Date().toISOString()
        };
        await fs.writeFile(this.systemConfig.persistenceConfig.path, JSON.stringify(taskData, null, 2));
      }

      logger.info('System state saved successfully');
    } catch (error) {
      logger.error('Failed to save system state', { error: (error as Error).message });
    }
  }

  /**
   * Collect system metrics
   */
  private collectMetrics(): void {
    const status = this.getSystemStatus();

    // Check alert thresholds
    const thresholds = this.systemConfig.monitoring?.alertThresholds || {};

    if (thresholds.taskQueueSize && status.taskQueue.queued > thresholds.taskQueueSize) {
      logger.warn('Task queue size threshold exceeded', {
        current: status.taskQueue.queued,
        threshold: thresholds.taskQueueSize
      });
      this.emit('alert', 'taskQueueSize', status.taskQueue.queued, thresholds.taskQueueSize);
    }

    // Update CPU usage baseline
    this.lastCpuUsage = process.cpuUsage(this.lastCpuUsage);

    this.emit('metricsCollected', status);
  }

  /**
   * Stop monitoring systems
   */
  private stopMonitoring(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = undefined;
    }

    if (this.metricsTimer) {
      clearInterval(this.metricsTimer);
      this.metricsTimer = undefined;
    }

    logger.info('System monitoring stopped');
  }

  /**
   * Write PID file
   */
  private async writePidFile(): Promise<void> {
    if (!this.pidFile) return;

    try {
      await fs.writeFile(this.pidFile, process.pid.toString());
      logger.debug('PID file written', { pid: process.pid, file: this.pidFile });
    } catch (error) {
      logger.warn('Failed to write PID file', { error: (error as Error).message });
    }
  }

  /**
   * Cleanup system resources
   */
  private async cleanup(): Promise<void> {
    try {
      // Clean up timers
      for (const timeout of this.agentTimeouts.values()) {
        clearTimeout(timeout);
      }
      this.agentTimeouts.clear();

      // Remove PID file
      if (this.pidFile) {
        await fs.unlink(this.pidFile).catch(() => {});
      }

      logger.info('System cleanup completed');
    } catch (error) {
      logger.warn('Error during cleanup', { error: (error as Error).message });
    }
  }

  /**
   * Check if file exists
   */
  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}