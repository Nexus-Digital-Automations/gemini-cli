/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Comprehensive Task Management System Integration
 *
 * This module provides the complete task execution engine with intelligent
 * breakdown, autonomous execution, real-time monitoring, and cross-session
 * persistence integrated with the infinite-continue-stop-hook system.
 */
// Core TaskManager - Main Entry Point
export { TaskManager, createTaskManager } from './TaskManager.js';
// Core exports
export { 
// Types and enums
TaskComplexity, TaskStatus, TaskPriority, TaskType, DependencyType, AgentCapability, SubagentTerminateMode, 
// Interfaces
Task, TaskDependency, TaskBreakdown, TaskMetrics, TaskExecutionContext, 
// Core classes
TaskBreakdownAnalyzer, ContextState } from './TaskExecutionEngine.js';
export { TaskExecutionEngine } from './TaskExecutionEngine.complete.js';
export { TaskExecutionUtils } from './TaskExecutionEngine.utils.js';
// Enhanced Autonomous Task Management
export { TaskQueue, TaskPriority as QueueTaskPriority, TaskStatus as QueueTaskStatus, TaskCategory, DependencyType as QueueDependencyType } from './TaskQueue.js';
// Unified System Integration
export { TaskManagementSystemIntegrator, SystemConfigFactory, createIntegratedTaskManagementSystem } from './TaskManagementSystemIntegrator.js';
export { TaskManagementConfigManager, ConfigUtils } from './TaskManagementConfig.js';
export { PriorityScheduler, SchedulingAlgorithm } from './PriorityScheduler.js';
export { QueueOptimizer, OptimizationStrategy } from './QueueOptimizer.js';
export { AutonomousTaskBreakdown, BreakdownStrategy } from './AutonomousTaskBreakdown.js';
export { EnhancedAutonomousTaskQueue } from './EnhancedAutonomousTaskQueue.js';
export { ExecutionMonitoringSystem, ExecutionMetrics, TaskExecutionEvent, AlertConfig, BottleneckAnalysis, SystemHealthStatus } from './ExecutionMonitoringSystem.js';
export { InfiniteHookIntegration, TaskManagerAPI, HookIntegrationConfig } from './InfiniteHookIntegration.js';
import { TaskExecutionEngine } from './TaskExecutionEngine.complete.js';
import { ExecutionMonitoringSystem } from './ExecutionMonitoringSystem.js';
import { InfiniteHookIntegration } from './InfiniteHookIntegration.js';
import { EnhancedAutonomousTaskQueue } from './EnhancedAutonomousTaskQueue.js';
/**
 * Complete Task Management System Factory
 *
 * Creates and configures the entire task management ecosystem with all components
 * properly integrated and ready for autonomous operation.
 */
export class TaskManagementSystemFactory {
    /**
     * Creates a complete task management system with all components integrated
     */
    static async createComplete(config, options) {
        const enableMonitoring = options?.enableMonitoring !== false;
        const enableHookIntegration = options?.enableHookIntegration !== false;
        console.log('🚀 Initializing Comprehensive Task Management System...');
        // Initialize monitoring system
        let monitoring;
        if (enableMonitoring) {
            console.log('📊 Setting up execution monitoring system...');
            monitoring = new ExecutionMonitoringSystem(config);
        }
        // Initialize task execution engine with monitoring integration
        console.log('⚡ Initializing task execution engine...');
        const taskEngine = new TaskExecutionEngine(config, {
            onTaskStatusChange: (task) => {
                console.log(`📋 Task ${task.id} status changed: ${task.status} (${task.progress}%)`);
                if (monitoring) {
                    monitoring.recordEvent({
                        taskId: task.id,
                        eventType: task.status === 'in_progress' ? 'started' :
                            task.status === 'completed' ? 'completed' :
                                task.status === 'failed' ? 'failed' : 'progress',
                        timestamp: new Date(),
                        metadata: {
                            title: task.title,
                            type: task.type,
                            complexity: task.complexity,
                            priority: task.priority,
                            progress: task.progress
                        }
                    });
                }
            },
            onTaskComplete: (task) => {
                console.log(`✅ Task completed successfully: ${task.title}`);
                if (monitoring) {
                    monitoring.recordEvent({
                        taskId: task.id,
                        eventType: 'completed',
                        timestamp: new Date(),
                        metadata: {
                            title: task.title,
                            duration: task.metrics?.durationMs,
                            outputs: task.outputs
                        },
                        duration: task.metrics?.durationMs
                    });
                }
            },
            onTaskFailed: (task, error) => {
                console.error(`❌ Task failed: ${task.title} - ${error}`);
                if (monitoring) {
                    monitoring.recordEvent({
                        taskId: task.id,
                        eventType: 'failed',
                        timestamp: new Date(),
                        metadata: {
                            title: task.title,
                            error: task.lastError,
                            retryCount: task.retryCount
                        },
                        error
                    });
                }
            }
        });
        // Initialize hook integration
        let hookIntegration;
        if (enableHookIntegration) {
            console.log('🔗 Setting up infinite-continue-stop-hook integration...');
            hookIntegration = new InfiniteHookIntegration(config, taskEngine, monitoring, options?.hookIntegrationConfig);
            try {
                await hookIntegration.initialize();
                console.log('✅ Hook integration initialized successfully');
            }
            catch (error) {
                console.warn('⚠️  Hook integration failed, continuing without it:', error);
                hookIntegration = undefined;
            }
        }
        // Create shutdown function
        const shutdown = async () => {
            console.log('🛑 Shutting down Task Management System...');
            if (hookIntegration) {
                await hookIntegration.shutdown();
            }
            if (monitoring) {
                await monitoring.shutdown();
            }
            await taskEngine.shutdown();
            console.log('✅ Task Management System shut down gracefully');
        };
        console.log('🎉 Task Management System initialized successfully!');
        console.log(`📊 Monitoring: ${enableMonitoring ? 'Enabled' : 'Disabled'}`);
        console.log(`🔗 Hook Integration: ${hookIntegration ? 'Enabled' : 'Disabled'}`);
        return {
            taskEngine,
            monitoring,
            hookIntegration,
            shutdown
        };
    }
    /**
     * Creates a standalone task execution engine (for testing or simple use cases)
     */
    static createStandalone(config) {
        return new TaskExecutionEngine(config, {
            onTaskStatusChange: (task) => {
                console.log(`Task ${task.id} (${task.title}): ${task.status} - ${task.progress}%`);
            },
            onTaskComplete: (task) => {
                console.log(`✅ Completed: ${task.title}`);
            },
            onTaskFailed: (task, error) => {
                console.error(`❌ Failed: ${task.title} - ${error}`);
            }
        });
    }
    /**
     * Creates monitoring system only
     */
    static createMonitoringOnly(config) {
        return new ExecutionMonitoringSystem(config);
    }
    /**
     * Creates an autonomous task queue with intelligent breakdown and optimization
     */
    static createAutonomousQueue(config) {
        console.log('🤖 Creating Enhanced Autonomous Task Queue...');
        const defaultConfig = {
            maxConcurrentTasks: 8,
            enableAutonomousBreakdown: true,
            breakdownThreshold: 0.7,
            maxBreakdownDepth: 3,
            enableAdaptiveScheduling: true,
            performanceOptimization: true,
            learningEnabled: true,
            metricsEnabled: true
        };
        const queue = new EnhancedAutonomousTaskQueue({
            ...defaultConfig,
            ...config
        });
        console.log('✅ Autonomous Task Queue created with intelligent breakdown and optimization');
        return queue;
    }
    /**
     * Creates a complete system with autonomous task queue integration
     */
    static async createCompleteWithAutonomousQueue(config, queueConfig, options) {
        const enableMonitoring = options?.enableMonitoring !== false;
        const enableHookIntegration = options?.enableHookIntegration !== false;
        console.log('🚀 Initializing Complete System with Autonomous Task Queue...');
        // Create autonomous task queue
        const autonomousQueue = TaskManagementSystemFactory.createAutonomousQueue(queueConfig);
        // Initialize monitoring system
        let monitoring;
        if (enableMonitoring) {
            console.log('📊 Setting up execution monitoring system...');
            monitoring = new ExecutionMonitoringSystem(config);
        }
        // Initialize task execution engine
        console.log('⚡ Initializing task execution engine with autonomous integration...');
        const taskEngine = new TaskExecutionEngine(config, {
            onTaskStatusChange: (task) => {
                console.log(`📋 Task ${task.id} status changed: ${task.status} (${task.progress}%)`);
                if (monitoring) {
                    monitoring.recordEvent({
                        taskId: task.id,
                        eventType: task.status === 'in_progress' ? 'started' :
                            task.status === 'completed' ? 'completed' :
                                task.status === 'failed' ? 'failed' : 'progress',
                        timestamp: new Date(),
                        metadata: {
                            title: task.title,
                            type: task.type,
                            complexity: task.complexity,
                            priority: task.priority,
                            progress: task.progress,
                            autonomouslyProcessed: true
                        }
                    });
                }
            },
            onTaskComplete: (task) => {
                console.log(`✅ Task completed successfully: ${task.title}`);
                if (monitoring) {
                    monitoring.recordEvent({
                        taskId: task.id,
                        eventType: 'completed',
                        timestamp: new Date(),
                        metadata: {
                            title: task.title,
                            duration: task.metrics?.durationMs,
                            outputs: task.outputs,
                            autonomouslyProcessed: true
                        },
                        duration: task.metrics?.durationMs
                    });
                }
            },
            onTaskFailed: (task, error) => {
                console.error(`❌ Task failed: ${task.title} - ${error}`);
                if (monitoring) {
                    monitoring.recordEvent({
                        taskId: task.id,
                        eventType: 'failed',
                        timestamp: new Date(),
                        metadata: {
                            title: task.title,
                            error: task.lastError,
                            retryCount: task.retryCount,
                            autonomouslyProcessed: true
                        },
                        error
                    });
                }
            }
        });
        // Initialize hook integration
        let hookIntegration;
        if (enableHookIntegration) {
            console.log('🔗 Setting up infinite-continue-stop-hook integration...');
            hookIntegration = new InfiniteHookIntegration(config, taskEngine, monitoring, options?.hookIntegrationConfig);
            try {
                await hookIntegration.initialize();
                console.log('✅ Hook integration initialized successfully');
            }
            catch (error) {
                console.warn('⚠️  Hook integration failed, continuing without it:', error);
                hookIntegration = undefined;
            }
        }
        // Create shutdown function
        const shutdown = async () => {
            console.log('🛑 Shutting down Complete System with Autonomous Queue...');
            if (hookIntegration) {
                await hookIntegration.shutdown();
            }
            if (monitoring) {
                await monitoring.shutdown();
            }
            await autonomousQueue.shutdown();
            await taskEngine.shutdown();
            console.log('✅ Complete System with Autonomous Queue shut down gracefully');
        };
        console.log('🎉 Complete System with Autonomous Task Queue initialized successfully!');
        console.log(`🤖 Autonomous Queue: Enabled with breakdown and optimization`);
        console.log(`📊 Monitoring: ${enableMonitoring ? 'Enabled' : 'Disabled'}`);
        console.log(`🔗 Hook Integration: ${hookIntegration ? 'Enabled' : 'Disabled'}`);
        return {
            taskEngine,
            autonomousQueue,
            monitoring,
            hookIntegration,
            shutdown
        };
    }
}
/**
 * Convenience function to create a complete task management system
 * (Uses new unified TaskManager for autonomous capabilities)
 */
export async function createTaskManagementSystem(config, options) {
    return createTaskManager({
        config,
        enableAutonomousBreakdown: true,
        enableAdaptiveScheduling: true,
        enableLearning: true,
        enableMonitoring: true,
        enableHookIntegration: true,
        enablePersistence: true,
        ...options
    });
}
/**
 * Convenience function to create standalone task engine
 */
export function createTaskEngine(config) {
    return TaskManagementSystemFactory.createStandalone(config);
}
/**
 * Convenience function to create autonomous task queue
 */
export function createAutonomousTaskQueue(config) {
    return TaskManagementSystemFactory.createAutonomousQueue(config);
}
/**
 * Convenience function to create complete system with autonomous queue
 */
export async function createCompleteWithAutonomousQueue(config, queueConfig, options) {
    return TaskManagementSystemFactory.createCompleteWithAutonomousQueue(config, queueConfig, options);
}
/**
 * Example usage patterns and integration guides
 */
export const INTEGRATION_EXAMPLES = {
    /**
     * Basic usage example
     */
    basicUsage: `
// Initialize the complete system
import { createTaskManagementSystem } from '@google/gemini-cli/task-management';

const system = await createTaskManagementSystem(config);

// Queue a new task
const taskId = await system.taskEngine.queueTask(
  'Implement user authentication',
  'Add secure login/logout functionality with JWT tokens',
  {
    type: 'implementation',
    priority: 'high',
    expectedOutputs: {
      'auth_system': 'Complete authentication system',
      'tests': 'Comprehensive test suite'
    }
  }
);

// Monitor progress
const stats = system.taskEngine.getExecutionStats();
console.log('Execution Stats:', stats);

// Graceful shutdown
await system.shutdown();
`,
    /**
     * Advanced monitoring example
     */
    monitoringExample: `
// Access monitoring system
const monitoring = system.monitoring;

// Get real-time dashboard data
const dashboardData = monitoring.getDashboardData(
  await monitoring.collectMetrics(system.taskEngine.getAllTasks()),
  system.taskEngine.getAllTasks()
);

// Check system health
const health = monitoring.getSystemHealth(dashboardData.metrics);
console.log('System Health:', health.overall);

// Analyze bottlenecks
const bottlenecks = monitoring.analyzeBottlenecks(
  dashboardData.metrics,
  system.taskEngine.getAllTasks()
);
`,
    /**
     * Hook integration example
     */
    hookIntegrationExample: `
// The hook integration automatically:
// 1. Monitors approved features in FEATURES.json
// 2. Creates tasks for new approved features
// 3. Reports progress back to the hook system
// 4. Authorizes stop when all tasks complete

// Custom hook configuration
const system = await createTaskManagementSystem(config, {
  hookIntegrationConfig: {
    agentId: 'MY_CUSTOM_AGENT',
    capabilities: ['frontend', 'backend', 'testing'],
    maxConcurrentTasks: 3,
    progressReportingIntervalMs: 30000 // 30 seconds
  }
});
`,
    /**
     * Autonomous task queue example
     */
    autonomousQueueExample: `
// Create autonomous task queue with intelligent breakdown
import { createAutonomousTaskQueue } from '@google/gemini-cli/task-management';

const autonomousQueue = createAutonomousTaskQueue({
  maxConcurrentTasks: 8,
  enableAutonomousBreakdown: true,
  breakdownThreshold: 0.7,        // Break down tasks with complexity > 0.7
  maxBreakdownDepth: 3,           // Maximum 3 levels of breakdown
  enableAdaptiveScheduling: true,  // Self-optimizing scheduling
  performanceOptimization: true,   // Continuous optimization
  learningEnabled: true           // Machine learning from execution history
});

// Add a complex task - it will be automatically analyzed and potentially broken down
const taskId = await autonomousQueue.addTask({
  title: 'Implement complete user management system',
  description: 'Full CRUD operations with authentication, authorization, and audit trail',
  category: 'feature',
  priority: TaskPriority.HIGH,
  estimatedDuration: 4 * 60 * 60 * 1000, // 4 hours - likely to be broken down
  executeFunction: async (task, context) => {
    // Implementation logic here
    return { success: true, result: 'User management system implemented' };
  }
});

// Monitor autonomous queue status
const status = autonomousQueue.getAutonomousQueueStatus();
console.log('Autonomy Level:', status.autonomyLevel);
console.log('Tasks Broken Down:', status.tasksBrokenDown);
console.log('Average Breakdown Improvement:', status.averageBreakdownImprovement);

// Get breakdown and optimization metrics
const breakdownMetrics = autonomousQueue.getBreakdownMetrics();
const schedulerMetrics = autonomousQueue.getSchedulerMetrics();

console.log('Breakdown Success Rate:', breakdownMetrics.successRate);
console.log('Scheduler Algorithm:', schedulerMetrics.currentAlgorithm);
`,
    /**
     * Complete system with autonomous queue example
     */
    completeAutonomousExample: `
// Create complete system with autonomous queue integration
import { createCompleteWithAutonomousQueue } from '@google/gemini-cli/task-management';

const system = await createCompleteWithAutonomousQueue(
  config,
  // Autonomous queue configuration
  {
    maxConcurrentTasks: 10,
    enableAutonomousBreakdown: true,
    breakdownThreshold: 0.6,
    breakdownStrategies: ['functional', 'temporal', 'dependency', 'hybrid'],
    schedulingAlgorithm: 'hybrid_adaptive',
    optimizationStrategy: 'balanced',
    enableAdaptiveScheduling: true,
    performanceOptimization: true,
    learningEnabled: true
  },
  // System options
  {
    enableMonitoring: true,
    enableHookIntegration: true
  }
);

// The system now includes:
// - TaskExecutionEngine (traditional task execution)
// - EnhancedAutonomousTaskQueue (intelligent breakdown and optimization)
// - ExecutionMonitoringSystem (real-time monitoring)
// - InfiniteHookIntegration (hook system integration)

// Complex tasks are automatically broken down
await system.autonomousQueue.addTask({
  title: 'Refactor entire authentication system',
  description: 'Complete overhaul of auth with modern patterns',
  category: 'refactor',
  priority: TaskPriority.HIGH,
  estimatedDuration: 8 * 60 * 60 * 1000, // 8 hours - will be broken down
  executeFunction: async (task, context) => {
    // This complex task will be autonomously broken down into:
    // - Analysis subtask
    // - Refactoring subtask
    // - Validation subtask
    // Each with appropriate dependencies and parallel execution where possible
    return { success: true };
  }
});

// Monitor the complete system
const queueStatus = system.autonomousQueue.getAutonomousQueueStatus();
const adaptationHistory = system.autonomousQueue.getAdaptationHistory();

console.log('System Autonomy Level:', queueStatus.autonomyLevel);
console.log('Recent Adaptations:', adaptationHistory);

// Graceful shutdown of all components
await system.shutdown();
`
};
// Log successful module initialization
console.log('📦 Enhanced Task Management System module loaded successfully');
console.log('🔧 Available components: TaskExecutionEngine, ExecutionMonitoringSystem, InfiniteHookIntegration');
console.log('🤖 Autonomous components: EnhancedAutonomousTaskQueue, AutonomousTaskBreakdown, PriorityScheduler, QueueOptimizer');
console.log('🚀 Use createTaskManagementSystem() for traditional integration');
console.log('🚀 Use createCompleteWithAutonomousQueue() for autonomous task breakdown and optimization');
//# sourceMappingURL=index.js.map