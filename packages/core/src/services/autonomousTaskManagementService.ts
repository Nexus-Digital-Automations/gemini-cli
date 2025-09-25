/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Autonomous Task Management Service - Master Orchestrator
 *
 * This is the main service that coordinates all autonomous task management components:
 * - AutonomousTaskIntegrator: Core task orchestration
 * - IntegrationBridge: External system coordination
 * - SystemMonitor: Real-time monitoring and alerting
 * - SystemValidator: Comprehensive validation and readiness checks
 *
 * Provides a unified API for the complete autonomous task management system.
 */

import { EventEmitter } from 'node:events';
import type { Config } from '../index.js';
import { AutonomousTaskIntegrator, type AutonomousTask, type RegisteredAgent } from './autonomousTaskIntegrator.js';
import { IntegrationBridge, type IntegrationConfig } from './integrationBridge.js';
import { SystemMonitor, type SystemMetrics, type Alert, type MonitoringConfig } from './systemMonitor.js';
import { SystemValidator, type SystemReadinessReport } from './systemValidator.js';

export interface AutonomousTaskManagementConfig {
  integration?: Partial<IntegrationConfig>;
  monitoring?: Partial<MonitoringConfig>;
  autoStart?: boolean;
  validationOnStartup?: boolean;
  productionMode?: boolean;
}

export interface SystemStatus {
  status: 'initializing' | 'ready' | 'degraded' | 'failed';
  uptime: number;
  version: string;
  components: {
    integrator: 'active' | 'inactive' | 'error';
    bridge: 'active' | 'inactive' | 'error';
    monitor: 'active' | 'inactive' | 'error';
    validator: 'active' | 'inactive' | 'error';
  };
  metrics: SystemMetrics | null;
  alerts: Alert[];
  lastValidation?: SystemReadinessReport;
}

/**
 * Master service for autonomous task management system
 */
export class AutonomousTaskManagementService extends EventEmitter {
  private config: Config;
  private serviceConfig: AutonomousTaskManagementConfig;
  private taskIntegrator: AutonomousTaskIntegrator;
  private integrationBridge: IntegrationBridge;
  private systemMonitor: SystemMonitor;
  private systemValidator: SystemValidator;
  private isInitialized = false;
  private startTime = Date.now();
  private lastValidationReport?: SystemReadinessReport;

  constructor(config: Config, serviceConfig: AutonomousTaskManagementConfig = {}) {
    super();
    this.config = config;
    this.serviceConfig = {
      autoStart: true,
      validationOnStartup: true,
      productionMode: false,
      ...serviceConfig,
    };

    // Initialize core components
    this.taskIntegrator = new AutonomousTaskIntegrator(config);
    this.integrationBridge = new IntegrationBridge(config, serviceConfig.integration);
    this.systemMonitor = new SystemMonitor(config, serviceConfig.monitoring);
    this.systemValidator = new SystemValidator(config);

    this.setupEventHandlers();
  }

  /**
   * Initialize the complete autonomous task management system
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      throw new Error('Autonomous Task Management Service already initialized');
    }

    console.log('🚀 Initializing Autonomous Task Management System...');

    try {
      // Initialize components in dependency order
      console.log('  📋 Initializing Task Integrator...');
      await this.taskIntegrator.initialize();

      console.log('  🌉 Initializing Integration Bridge...');
      await this.integrationBridge.initialize();

      console.log('  📊 Initializing System Monitor...');
      await this.systemMonitor.initialize(this.taskIntegrator, this.integrationBridge);

      console.log('  🔧 Initializing System Validator...');
      await this.systemValidator.initialize(
        this.taskIntegrator,
        this.integrationBridge,
        this.systemMonitor
      );

      // Run initial validation if enabled
      if (this.serviceConfig.validationOnStartup) {
        console.log('  🔍 Running initial system validation...');
        this.lastValidationReport = await this.systemValidator.validateSystem();

        if (this.lastValidationReport.overallStatus === 'not_ready' && this.serviceConfig.productionMode) {
          throw new Error('System validation failed - not ready for production');
        }
      }

      this.isInitialized = true;
      this.emit('system_initialized', { timestamp: new Date() });

      console.log('✅ Autonomous Task Management System initialized successfully');
      console.log(`🎯 System Status: ${this.getSystemStatus().status.toUpperCase()}`);

      if (this.lastValidationReport) {
        console.log(`📊 Readiness Score: ${this.lastValidationReport.overallScore}/100`);
        console.log(`🏭 Readiness Level: ${this.lastValidationReport.readinessLevel.toUpperCase()}`);
      }

    } catch (error) {
      console.error('❌ Failed to initialize Autonomous Task Management System:', error);
      this.emit('system_initialization_failed', { error, timestamp: new Date() });
      throw error;
    }
  }

  /**
   * Shutdown the system gracefully
   */
  async shutdown(): Promise<void> {
    if (!this.isInitialized) {
      return;
    }

    console.log('🛑 Shutting down Autonomous Task Management System...');

    try {
      await this.systemMonitor.stopMonitoring();
      await this.integrationBridge.shutdown();
      // Task integrator doesn't need explicit shutdown

      this.isInitialized = false;
      this.emit('system_shutdown', { timestamp: new Date() });

      console.log('✅ System shutdown completed');
    } catch (error) {
      console.error('❌ Error during system shutdown:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive system status
   */
  getSystemStatus(): SystemStatus {
    const uptime = Date.now() - this.startTime;

    let status: SystemStatus['status'] = 'ready';
    const components: SystemStatus['components'] = {
      integrator: 'active',
      bridge: 'active',
      monitor: 'active',
      validator: 'active',
    };

    if (!this.isInitialized) {
      status = 'initializing';
      Object.keys(components).forEach(key => {
        components[key as keyof typeof components] = 'inactive';
      });
    }

    // Check for active critical alerts
    const alerts = this.systemMonitor.getActiveAlerts();
    const criticalAlerts = alerts.filter(a => a.severity === 'critical');

    if (criticalAlerts.length > 0) {
      status = 'degraded';
    }

    // Get current metrics
    let metrics: SystemMetrics | null = null;
    try {
      // Use async getCurrentMetrics if available, otherwise return null
      // In practice, this would be handled differently to avoid sync/async issues
    } catch (error) {
      console.warn('Could not fetch current metrics:', error.message);
    }

    return {
      status,
      uptime,
      version: '1.0.0',
      components,
      metrics,
      alerts,
      lastValidation: this.lastValidationReport,
    };
  }

  /**
   * Create a new autonomous task
   */
  async createTask(taskConfig: {
    title: string;
    description: string;
    type: 'implementation' | 'testing' | 'documentation' | 'validation' | 'deployment' | 'analysis';
    priority: 'critical' | 'high' | 'normal' | 'low';
    dependencies?: string[];
    requiredCapabilities?: string[];
    featureId?: string;
    metadata?: Record<string, unknown>;
  }): Promise<AutonomousTask> {
    if (!this.isInitialized) {
      throw new Error('System not initialized');
    }

    console.log(`📝 Creating autonomous task: ${taskConfig.title}`);

    const task = await this.taskIntegrator.createTask(taskConfig);
    this.emit('task_created', { task, timestamp: new Date() });

    return task;
  }

  /**
   * Register a new agent with the system
   */
  async registerAgent(agentConfig: {
    id: string;
    capabilities: string[];
    maxConcurrentTasks?: number;
  }): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('System not initialized');
    }

    console.log(`🤖 Registering agent: ${agentConfig.id}`);

    await this.integrationBridge.registerAgent(agentConfig);
    this.emit('agent_registered', { agentConfig, timestamp: new Date() });
  }

  /**
   * Create tasks from approved features
   */
  async generateTasksFromFeatures(): Promise<AutonomousTask[]> {
    if (!this.isInitialized) {
      throw new Error('System not initialized');
    }

    console.log('🔄 Generating tasks from approved features...');

    const tasks = await this.integrationBridge.generateTasksFromApprovedFeatures();
    this.emit('tasks_generated', { count: tasks.length, timestamp: new Date() });

    return tasks;
  }

  /**
   * Run comprehensive system validation
   */
  async validateSystem(): Promise<SystemReadinessReport> {
    if (!this.isInitialized) {
      throw new Error('System not initialized');
    }

    console.log('🔍 Running comprehensive system validation...');

    this.lastValidationReport = await this.systemValidator.validateSystem();
    this.emit('system_validated', { report: this.lastValidationReport, timestamp: new Date() });

    return this.lastValidationReport;
  }

  /**
   * Get system metrics for dashboard
   */
  async getMetrics(): Promise<SystemMetrics> {
    if (!this.isInitialized) {
      throw new Error('System not initialized');
    }

    return await this.systemMonitor.getCurrentMetrics();
  }

  /**
   * Get historical metrics
   */
  getHistoricalMetrics(period?: number): SystemMetrics[] {
    if (!this.isInitialized) {
      throw new Error('System not initialized');
    }

    return this.systemMonitor.getHistoricalMetrics(period);
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): Alert[] {
    if (!this.isInitialized) {
      return [];
    }

    return this.systemMonitor.getActiveAlerts();
  }

  /**
   * Get all tasks
   */
  getAllTasks(): AutonomousTask[] {
    if (!this.isInitialized) {
      throw new Error('System not initialized');
    }

    return this.taskIntegrator.getAllTasks();
  }

  /**
   * Get all registered agents
   */
  getAllAgents(): RegisteredAgent[] {
    if (!this.isInitialized) {
      throw new Error('System not initialized');
    }

    return this.taskIntegrator.getAllAgents();
  }

  /**
   * Execute CLI command with task context
   */
  async executeCommand(
    command: string,
    args: string[] = [],
    taskContext?: { taskId: string; agentId: string }
  ): Promise<{ success: boolean; output: string; error?: string }> {
    if (!this.isInitialized) {
      throw new Error('System not initialized');
    }

    return await this.integrationBridge.executeCliCommand(command, args, taskContext);
  }

  /**
   * Handle external API requests
   */
  async handleApiRequest(endpoint: string, params: any[] = []): Promise<any> {
    if (!this.isInitialized) {
      throw new Error('System not initialized');
    }

    return await this.integrationBridge.handleExternalApiRequest(endpoint, params);
  }

  /**
   * Get system health summary
   */
  getHealthSummary(): {
    status: 'healthy' | 'warning' | 'critical';
    score: number;
    issues: string[];
    uptime: number;
    lastCheck: Date;
  } {
    if (!this.isInitialized) {
      return {
        status: 'critical',
        score: 0,
        issues: ['System not initialized'],
        uptime: 0,
        lastCheck: new Date(),
      };
    }

    return this.systemMonitor.getHealthSummary();
  }

  // Private methods

  private setupEventHandlers(): void {
    // Task Integrator events
    this.taskIntegrator.on('task_created', (event) => {
      console.log(`📝 Task created: ${event.taskId}`);
      this.emit('task_created', event);
    });

    this.taskIntegrator.on('task_completed', (event) => {
      console.log(`✅ Task completed: ${event.taskId} by ${event.agentId}`);
      this.emit('task_completed', event);
    });

    this.taskIntegrator.on('task_failed', (event) => {
      console.error(`❌ Task failed: ${event.taskId} - ${event.data.error}`);
      this.emit('task_failed', event);
    });

    this.taskIntegrator.on('agent_registered', (event) => {
      console.log(`🤖 Agent registered: ${event.agentId}`);
      this.emit('agent_registered', event);
    });

    // Integration Bridge events
    this.integrationBridge.on('bridge_initialized', (event) => {
      console.log('🌉 Integration Bridge initialized');
      this.emit('bridge_initialized', event);
    });

    this.integrationBridge.on('task_created', (event) => {
      this.emit('task_created', event);
    });

    // System Monitor events
    this.systemMonitor.on('alert_created', (alert) => {
      const severity = alert.severity === 'critical' ? '🚨' : alert.severity === 'high' ? '⚠️' : 'ℹ️';
      console.log(`${severity} Alert: ${alert.title}`);
      this.emit('alert_created', alert);
    });

    this.systemMonitor.on('alert_resolved', (alert) => {
      console.log(`✅ Alert resolved: ${alert.title}`);
      this.emit('alert_resolved', alert);
    });

    this.systemMonitor.on('metrics_collected', (metrics) => {
      this.emit('metrics_collected', metrics);
    });

    // System Validator events
    this.systemValidator.on('validation_completed', (event) => {
      console.log('🔍 System validation completed');
      this.emit('validation_completed', event);
    });

    // Global error handling
    this.on('error', (error) => {
      console.error('🚨 System error:', error);
    });
  }
}