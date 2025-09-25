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
export { ExecutionMonitoringSystem, ExecutionMetrics, TaskExecutionEvent, AlertConfig, BottleneckAnalysis, SystemHealthStatus } from './ExecutionMonitoringSystem.js';
export { InfiniteHookIntegration, TaskManagerAPI, HookIntegrationConfig } from './InfiniteHookIntegration.js';
import { TaskExecutionEngine } from './TaskExecutionEngine.complete.js';
import { ExecutionMonitoringSystem } from './ExecutionMonitoringSystem.js';
import { InfiniteHookIntegration } from './InfiniteHookIntegration.js';
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
}
/**
 * Convenience function to create a complete task management system
 */
export async function createTaskManagementSystem(config, options) {
    return TaskManagementSystemFactory.createComplete(config, options);
}
/**
 * Convenience function to create standalone task engine
 */
export function createTaskEngine(config) {
    return TaskManagementSystemFactory.createStandalone(config);
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
`
};
// Log successful module initialization
console.log('📦 Task Management System module loaded successfully');
console.log('🔧 Available components: TaskExecutionEngine, ExecutionMonitoringSystem, InfiniteHookIntegration');
console.log('🚀 Use createTaskManagementSystem() for complete integration');
//# sourceMappingURL=index.js.map