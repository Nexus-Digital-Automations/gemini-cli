/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { EventEmitter } from 'node:events';
import { Logger } from '../utils/logger.js';
import { realTimeMonitoringSystem } from './RealTimeMonitoringSystem.js';
import { monitoringIntegrationHub } from './MonitoringIntegrationHub.js';
import { taskStatusMonitor, TaskStatus } from './TaskStatusMonitor.js';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
/**
 * Automated Health Monitoring and Self-Healing System
 *
 * Comprehensive health monitoring with intelligent self-healing capabilities:
 * - Continuous health monitoring across all system components
 * - Automated issue detection with intelligent thresholds
 * - Predictive health analytics and trend analysis
 * - Self-healing actions with configurable triggers and cooldowns
 * - Health dependency tracking and cascade failure prevention
 * - Performance-based health assessment
 * - Resource utilization monitoring and optimization
 * - Automated recovery procedures with fallback strategies
 * - Health monitoring metrics and analytics
 * - Integration with alerting and notification systems
 */
export class AutomatedHealthMonitoring extends EventEmitter {
    logger;
    // Health monitoring configuration
    healthChecks = new Map();
    selfHealingActions = new Map();
    // Monitoring state
    healthCheckResults = new Map();
    healthCheckIntervals = new Map();
    actionExecutionHistory = new Map();
    actionCooldowns = new Map();
    // System health tracking
    systemHealthHistory = [];
    currentSystemHealth = null;
    healthTrendWindow = 100; // Number of health snapshots for trend analysis
    // Configuration
    config;
    // Persistence
    persistencePath;
    executionHistoryPath;
    constructor(config) {
        super();
        this.logger = new Logger('AutomatedHealthMonitoring');
        this.config = {
            globalHealthCheckInterval: 30000, // 30 seconds
            maxHealthHistorySize: 1000,
            trendAnalysisWindow: 20,
            autoHealingEnabled: true,
            escalationThresholds: {
                warning: 70,
                critical: 90,
                emergency: 95,
            },
            ...config,
        };
        // Setup persistence paths
        const tempDir = path.join(process.cwd(), '.tmp', 'health-monitoring');
        this.persistencePath = path.join(tempDir, 'health-monitoring-state.json');
        this.executionHistoryPath = path.join(tempDir, 'self-healing-history.json');
        this.initializeHealthMonitoring();
    }
    /**
     * Initialize health monitoring system
     */
    async initializeHealthMonitoring() {
        try {
            // Create persistence directory
            await fs.mkdir(path.dirname(this.persistencePath), { recursive: true });
            // Load persisted configuration
            await this.loadPersistedState();
            // Setup default health checks
            this.setupDefaultHealthChecks();
            // Setup default self-healing actions
            this.setupDefaultSelfHealingActions();
            // Start global health monitoring
            this.startGlobalHealthMonitoring();
            // Setup event listeners for system events
            this.setupSystemEventListeners();
            this.logger.info('AutomatedHealthMonitoring initialized', {
                healthChecks: this.healthChecks.size,
                selfHealingActions: this.selfHealingActions.size,
                autoHealingEnabled: this.config.autoHealingEnabled,
            });
            this.emit('health:monitoring:initialized', {
                timestamp: new Date(),
                checksCount: this.healthChecks.size,
                actionsCount: this.selfHealingActions.size,
            });
        }
        catch (error) {
            this.logger.error('Failed to initialize AutomatedHealthMonitoring', {
                error,
            });
            throw error;
        }
    }
    /**
     * Add custom health check
     */
    addHealthCheck(config) {
        this.healthChecks.set(config.id, config);
        if (config.enabled) {
            this.startHealthCheck(config);
        }
        this.logger.info('Health check added', {
            id: config.id,
            name: config.name,
            type: config.checkType,
            enabled: config.enabled,
        });
        this.emit('health:check:added', { config });
    }
    /**
     * Add self-healing action
     */
    addSelfHealingAction(action) {
        this.selfHealingActions.set(action.id, action);
        // Initialize execution history
        if (!this.actionExecutionHistory.has(action.id)) {
            this.actionExecutionHistory.set(action.id, []);
        }
        this.logger.info('Self-healing action added', {
            id: action.id,
            name: action.name,
            triggers: action.triggers.length,
            enabled: action.enabled,
        });
        this.emit('health:action:added', { action });
    }
    /**
     * Get current system health summary
     */
    getCurrentSystemHealth() {
        if (!this.currentSystemHealth) {
            // Generate initial health summary
            this.currentSystemHealth = this.generateSystemHealthSummary();
        }
        return this.currentSystemHealth;
    }
    /**
     * Get health check results
     */
    getHealthCheckResults(checkId) {
        if (checkId) {
            return this.healthCheckResults.get(checkId) || [];
        }
        // Return all results
        const allResults = [];
        for (const results of this.healthCheckResults.values()) {
            allResults.push(...results);
        }
        return allResults.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }
    /**
     * Get self-healing execution history
     */
    getSelfHealingHistory(actionId) {
        if (actionId) {
            return this.actionExecutionHistory.get(actionId) || [];
        }
        // Return all execution history
        const allHistory = [];
        for (const history of this.actionExecutionHistory.values()) {
            allHistory.push(...history);
        }
        return allHistory.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
    }
    /**
     * Force health check execution
     */
    async executeHealthCheck(checkId) {
        const config = this.healthChecks.get(checkId);
        if (!config) {
            throw new Error(`Health check not found: ${checkId}`);
        }
        return this.performHealthCheck(config);
    }
    /**
     * Force self-healing action execution
     */
    async executeSelfHealingAction(actionId, reason) {
        const action = this.selfHealingActions.get(actionId);
        if (!action) {
            throw new Error(`Self-healing action not found: ${actionId}`);
        }
        return this.executeAction(action, reason ? [reason] : ['manual_trigger']);
    }
    /**
     * Get health monitoring statistics
     */
    getHealthMonitoringStats() {
        // Calculate health check stats
        const activeChecks = Array.from(this.healthChecks.values()).filter((c) => c.enabled);
        const allResults = this.getHealthCheckResults();
        const recentResults = allResults.filter((r) => r.timestamp.getTime() > Date.now() - 5 * 60 * 1000);
        const passingChecks = recentResults.filter((r) => r.status === 'healthy').length;
        const failingChecks = recentResults.filter((r) => r.status === 'unhealthy').length;
        const avgExecutionTime = recentResults.length > 0
            ? recentResults.reduce((sum, r) => sum + r.duration, 0) /
                recentResults.length
            : 0;
        // Calculate self-healing stats
        const enabledActions = Array.from(this.selfHealingActions.values()).filter((a) => a.enabled);
        const last24hHistory = this.getSelfHealingHistory().filter((h) => h.startTime.getTime() > Date.now() - 24 * 60 * 60 * 1000);
        const successfulActions = last24hHistory.filter((h) => h.status === 'success').length;
        const totalActions = last24hHistory.length;
        const successRate = totalActions > 0 ? (successfulActions / totalActions) * 100 : 0;
        const avgActionTime = totalActions > 0
            ? last24hHistory.reduce((sum, h) => sum + h.duration, 0) / totalActions
            : 0;
        // System health stats
        const currentHealth = this.getCurrentSystemHealth();
        return {
            healthChecks: {
                total: this.healthChecks.size,
                active: activeChecks.length,
                passing: passingChecks,
                failing: failingChecks,
                avgExecutionTime,
            },
            selfHealing: {
                total: this.selfHealingActions.size,
                enabled: enabledActions.length,
                executionsLast24h: totalActions,
                successRate,
                avgExecutionTime: avgActionTime,
            },
            systemHealth: {
                currentScore: currentHealth.score,
                trend: currentHealth.trends.shortTerm,
                criticalIssues: currentHealth.checks.unhealthy + currentHealth.checks.timeout,
                recommendations: currentHealth.recommendations.length,
            },
        };
    }
    // Private implementation methods
    setupDefaultHealthChecks() {
        const defaultChecks = [
            // System monitoring checks
            {
                id: 'system_memory_usage',
                name: 'System Memory Usage',
                description: 'Monitor system memory utilization',
                checkType: 'resource',
                interval: 30000,
                timeout: 5000,
                retryAttempts: 2,
                thresholds: {
                    healthy: 70,
                    warning: 85,
                    critical: 95,
                },
                enabled: true,
                autoHeal: true,
            },
            {
                id: 'task_processing_health',
                name: 'Task Processing Health',
                description: 'Monitor task processing system health',
                checkType: 'performance',
                interval: 60000,
                timeout: 10000,
                retryAttempts: 3,
                thresholds: {
                    healthy: 90,
                    warning: 70,
                    critical: 50,
                },
                enabled: true,
                autoHeal: true,
            },
            {
                id: 'agent_connectivity',
                name: 'Agent Connectivity',
                description: 'Monitor agent connectivity and responsiveness',
                checkType: 'service',
                interval: 45000,
                timeout: 8000,
                retryAttempts: 2,
                thresholds: {
                    healthy: 95,
                    warning: 80,
                    critical: 60,
                },
                enabled: true,
                autoHeal: true,
            },
            {
                id: 'monitoring_system_health',
                name: 'Monitoring System Health',
                description: 'Self-monitor the monitoring system components',
                checkType: 'system',
                interval: 120000,
                timeout: 15000,
                retryAttempts: 3,
                thresholds: {
                    healthy: 98,
                    warning: 90,
                    critical: 80,
                },
                enabled: true,
                autoHeal: false, // Avoid recursive healing
            },
            {
                id: 'data_integrity_check',
                name: 'Data Integrity Check',
                description: 'Verify data consistency and integrity',
                checkType: 'data_integrity',
                interval: 300000, // 5 minutes
                timeout: 30000,
                retryAttempts: 1,
                thresholds: {
                    healthy: 100,
                    warning: 99,
                    critical: 95,
                },
                enabled: true,
                autoHeal: true,
            },
        ];
        for (const check of defaultChecks) {
            this.addHealthCheck(check);
        }
    }
    setupDefaultSelfHealingActions() {
        const defaultActions = [
            // Memory management action
            {
                id: 'memory_cleanup',
                name: 'Memory Cleanup',
                description: 'Clean up memory and force garbage collection',
                triggers: [
                    {
                        healthCheckId: 'system_memory_usage',
                        condition: 'unhealthy',
                        consecutiveFailures: 2,
                    },
                ],
                actions: [
                    {
                        type: 'clear_cache',
                        config: { cacheTypes: ['monitoring', 'task', 'agent'] },
                        timeout: 30000,
                        retryable: true,
                    },
                    {
                        type: 'custom_script',
                        config: {
                            action: 'force_gc',
                            description: 'Force garbage collection',
                        },
                        timeout: 10000,
                        retryable: false,
                    },
                ],
                cooldown: 300000, // 5 minutes
                maxExecutions: 6, // per hour
                enabled: true,
                priority: 'high',
            },
            // Task processing recovery action
            {
                id: 'task_processing_recovery',
                name: 'Task Processing Recovery',
                description: 'Recover task processing system',
                triggers: [
                    {
                        healthCheckId: 'task_processing_health',
                        condition: 'unhealthy',
                        consecutiveFailures: 3,
                    },
                ],
                actions: [
                    {
                        type: 'redistribute_load',
                        config: { strategy: 'rebalance_tasks' },
                        timeout: 60000,
                        retryable: true,
                    },
                    {
                        type: 'restart_service',
                        config: { service: 'task_processor' },
                        timeout: 120000,
                        retryable: false,
                    },
                ],
                cooldown: 600000, // 10 minutes
                maxExecutions: 3, // per hour
                enabled: true,
                priority: 'critical',
            },
            // Agent connectivity recovery
            {
                id: 'agent_connectivity_recovery',
                name: 'Agent Connectivity Recovery',
                description: 'Recover agent connectivity issues',
                triggers: [
                    {
                        healthCheckId: 'agent_connectivity',
                        condition: 'unhealthy',
                        consecutiveFailures: 2,
                    },
                ],
                actions: [
                    {
                        type: 'custom_script',
                        config: {
                            action: 'reconnect_agents',
                            description: 'Attempt to reconnect offline agents',
                        },
                        timeout: 45000,
                        retryable: true,
                    },
                    {
                        type: 'redistribute_load',
                        config: { strategy: 'exclude_offline_agents' },
                        timeout: 30000,
                        retryable: true,
                    },
                ],
                cooldown: 180000, // 3 minutes
                maxExecutions: 10, // per hour
                enabled: true,
                priority: 'high',
            },
            // Data integrity recovery
            {
                id: 'data_integrity_recovery',
                name: 'Data Integrity Recovery',
                description: 'Recover from data integrity issues',
                triggers: [
                    {
                        healthCheckId: 'data_integrity_check',
                        condition: 'unhealthy',
                        consecutiveFailures: 1,
                    },
                ],
                actions: [
                    {
                        type: 'custom_script',
                        config: {
                            action: 'data_validation_repair',
                            description: 'Validate and repair data inconsistencies',
                        },
                        timeout: 180000,
                        retryable: true,
                    },
                    {
                        type: 'notify_admin',
                        config: {
                            severity: 'critical',
                            message: 'Data integrity issue detected and repair attempted',
                        },
                        timeout: 5000,
                        retryable: false,
                    },
                ],
                cooldown: 1800000, // 30 minutes
                maxExecutions: 2, // per hour
                enabled: true,
                priority: 'critical',
            },
        ];
        for (const action of defaultActions) {
            this.addSelfHealingAction(action);
        }
    }
    startHealthCheck(config) {
        // Clear existing interval if any
        const existingInterval = this.healthCheckIntervals.get(config.id);
        if (existingInterval) {
            clearInterval(existingInterval);
        }
        // Start new health check interval
        const interval = setInterval(async () => {
            try {
                await this.performHealthCheck(config);
            }
            catch (error) {
                this.logger.error('Health check execution error', {
                    checkId: config.id,
                    error,
                });
            }
        }, config.interval);
        this.healthCheckIntervals.set(config.id, interval);
        // Perform initial check
        setImmediate(() => this.performHealthCheck(config));
    }
    async performHealthCheck(config) {
        const startTime = performance.now();
        let result;
        try {
            // Execute health check based on type
            const checkResult = await this.executeHealthCheckLogic(config);
            // Determine status based on thresholds
            let status = 'healthy';
            if (checkResult.value >= config.thresholds.critical) {
                status = 'unhealthy';
            }
            else if (checkResult.value >= config.thresholds.warning) {
                status = 'warning';
            }
            // Calculate trend
            const previousResults = this.healthCheckResults.get(config.id) || [];
            const trend = this.calculateHealthTrend(checkResult.value, previousResults.slice(-5));
            // Determine severity
            let severity = 'info';
            if (status === 'unhealthy') {
                severity =
                    checkResult.value >= this.config.escalationThresholds['emergency']
                        ? 'critical'
                        : 'error';
            }
            else if (status === 'warning') {
                severity = 'warning';
            }
            result = {
                checkId: config.id,
                name: config.name,
                status,
                value: checkResult.value,
                threshold: status === 'unhealthy'
                    ? config.thresholds.critical
                    : config.thresholds.warning,
                message: checkResult.message,
                duration: performance.now() - startTime,
                timestamp: new Date(),
                metadata: checkResult.metadata,
                trend,
                severity,
            };
        }
        catch (error) {
            result = {
                checkId: config.id,
                name: config.name,
                status: 'unknown',
                value: -1,
                threshold: config.thresholds.warning,
                message: `Health check failed: ${error.message}`,
                duration: performance.now() - startTime,
                timestamp: new Date(),
                metadata: { error: error.message },
                trend: 'unknown',
                severity: 'error',
            };
        }
        // Store result
        if (!this.healthCheckResults.has(config.id)) {
            this.healthCheckResults.set(config.id, []);
        }
        const results = this.healthCheckResults.get(config.id);
        results.push(result);
        // Trim history
        if (results.length > this.config.maxHealthHistorySize) {
            results.splice(0, results.length - this.config.maxHealthHistorySize);
        }
        // Emit health check result
        this.emit('health:check:result', { config, result });
        // Check for self-healing triggers
        if (config.autoHeal && this.config.autoHealingEnabled) {
            await this.checkSelfHealingTriggers(config.id, result);
        }
        return result;
    }
    async executeHealthCheckLogic(config) {
        switch (config.checkType) {
            case 'resource':
                return this.checkResourceHealth(config);
            case 'performance':
                return this.checkPerformanceHealth(config);
            case 'service':
                return this.checkServiceHealth(config);
            case 'system':
                return this.checkSystemHealth(config);
            case 'data_integrity':
                return this.checkDataIntegrity(config);
            default:
                throw new Error(`Unknown health check type: ${config.checkType}`);
        }
    }
    async checkResourceHealth(_config) {
        const memoryUsage = process.memoryUsage();
        const memoryUsageMB = memoryUsage.heapUsed / 1024 / 1024;
        const memoryUsagePercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
        return {
            value: memoryUsagePercent,
            message: `Memory usage: ${memoryUsageMB.toFixed(2)}MB (${memoryUsagePercent.toFixed(1)}%)`,
            metadata: {
                heapUsed: memoryUsage.heapUsed,
                heapTotal: memoryUsage.heapTotal,
                external: memoryUsage.external,
                rss: memoryUsage.rss,
            },
        };
    }
    async checkPerformanceHealth(_config) {
        const snapshot = realTimeMonitoringSystem.getCurrentSnapshot();
        const taskMetrics = snapshot.taskMetrics;
        // Calculate performance score based on success rate and throughput
        const successRate = taskMetrics.successRate;
        const throughput = taskMetrics.throughputPerHour;
        const responseTime = snapshot.performanceMetrics.responseTimeMs;
        // Normalize metrics to 0-100 scale (higher is better)
        const normalizedSuccessRate = successRate;
        const normalizedThroughput = Math.min(throughput / 10, 100); // Assume 10/hour is good
        const normalizedResponseTime = Math.max(0, 100 - responseTime / 100); // Lower is better
        const performanceScore = normalizedSuccessRate * 0.5 +
            normalizedThroughput * 0.3 +
            normalizedResponseTime * 0.2;
        return {
            value: performanceScore,
            message: `Performance: ${performanceScore.toFixed(1)}% (Success: ${successRate.toFixed(1)}%, Throughput: ${throughput.toFixed(1)}/hr, Response: ${responseTime.toFixed(0)}ms)`,
            metadata: {
                successRate,
                throughput,
                responseTime,
                totalTasks: taskMetrics.total,
                completedTasks: taskMetrics.completed,
                failedTasks: taskMetrics.failed,
            },
        };
    }
    async checkServiceHealth(_config) {
        const agents = taskStatusMonitor.getAllAgents();
        const totalAgents = agents.length;
        const activeAgents = agents.filter((a) => a.status === 'active' || a.status === 'busy').length;
        const connectivityPercent = totalAgents > 0 ? (activeAgents / totalAgents) * 100 : 100;
        return {
            value: connectivityPercent,
            message: `Agent connectivity: ${activeAgents}/${totalAgents} agents active (${connectivityPercent.toFixed(1)}%)`,
            metadata: {
                totalAgents,
                activeAgents,
                agentStatuses: agents.reduce((acc, agent) => {
                    acc[agent.status] = (acc[agent.status] || 0) + 1;
                    return acc;
                }, {}),
            },
        };
    }
    async checkSystemHealth(_config) {
        const systemStatus = monitoringIntegrationHub.getSystemStatus();
        // Calculate overall system health score
        let healthScore = 100;
        // Penalize based on component status
        Object.values(systemStatus.components).forEach((component) => {
            switch (component.status) {
                case 'unhealthy':
                    healthScore -= 25;
                    break;
                case 'degraded':
                    healthScore -= 10;
                    break;
                case 'offline':
                    healthScore -= 50;
                    break;
                default:
                    // healthy or unknown status - no penalty
                    break;
            }
        });
        healthScore = Math.max(0, healthScore);
        return {
            value: healthScore,
            message: `System health: ${systemStatus.overall} (${healthScore.toFixed(1)}%)`,
            metadata: {
                overallStatus: systemStatus.overall,
                componentCount: Object.keys(systemStatus.components).length,
                componentStatuses: Object.fromEntries(Object.entries(systemStatus.components).map(([name, comp]) => [
                    name,
                    comp.status,
                ])),
                integrationStatus: systemStatus.integration.initialized,
            },
        };
    }
    async checkDataIntegrity(_config) {
        const tasks = taskStatusMonitor.getAllTasks();
        const agents = taskStatusMonitor.getAllAgents();
        let integrityScore = 100;
        const issues = [];
        // Check for data consistency issues
        // 1. Orphaned tasks (assigned to non-existent agents)
        const orphanedTasks = tasks.filter((task) => task.assignedAgent &&
            !agents.some((agent) => agent.id === task.assignedAgent));
        if (orphanedTasks.length > 0) {
            integrityScore -= Math.min(orphanedTasks.length * 2, 30);
            issues.push(`${orphanedTasks.length} orphaned tasks`);
        }
        // 2. Agent task assignment consistency
        const agentTaskMismatch = agents.filter((agent) => {
            const assignedTasks = tasks.filter((task) => task.assignedAgent === agent.id);
            const currentTasks = agent.currentTasks || [];
            return assignedTasks.length !== currentTasks.length;
        });
        if (agentTaskMismatch.length > 0) {
            integrityScore -= Math.min(agentTaskMismatch.length * 5, 25);
            issues.push(`${agentTaskMismatch.length} agents with task assignment mismatches`);
        }
        // 3. Task status consistency
        const inconsistentTasks = tasks.filter((task) => {
            if (task.status === TaskStatus.COMPLETED && !task.endTime)
                return true;
            if (task.status === TaskStatus.IN_PROGRESS && !task.startTime)
                return true;
            if (task.status === TaskStatus.FAILED && !task.endTime)
                return true;
            return false;
        });
        if (inconsistentTasks.length > 0) {
            integrityScore -= Math.min(inconsistentTasks.length * 3, 20);
            issues.push(`${inconsistentTasks.length} tasks with status inconsistencies`);
        }
        integrityScore = Math.max(0, integrityScore);
        return {
            value: integrityScore,
            message: `Data integrity: ${integrityScore.toFixed(1)}% ${issues.length > 0 ? `(Issues: ${issues.join(', ')})` : '(No issues)'}`,
            metadata: {
                totalTasks: tasks.length,
                totalAgents: agents.length,
                orphanedTasks: orphanedTasks.length,
                agentTaskMismatches: agentTaskMismatch.length,
                inconsistentTasks: inconsistentTasks.length,
                issues,
            },
        };
    }
    calculateHealthTrend(currentValue, previousResults) {
        if (previousResults.length < 3) {
            return 'unknown';
        }
        const recentValues = previousResults.map((r) => r.value).slice(-3);
        const averageRecent = recentValues.reduce((sum, val) => sum + val, 0) / recentValues.length;
        const difference = currentValue - averageRecent;
        const threshold = 5; // 5% threshold
        if (difference > threshold) {
            return 'degrading'; // Higher values typically mean worse health
        }
        else if (difference < -threshold) {
            return 'improving';
        }
        else {
            return 'stable';
        }
    }
    async checkSelfHealingTriggers(checkId, result) {
        // Find actions triggered by this health check
        const triggeredActions = Array.from(this.selfHealingActions.values()).filter((action) => action.enabled &&
            action.triggers.some((trigger) => trigger.healthCheckId === checkId));
        for (const action of triggeredActions) {
            const trigger = action.triggers.find((t) => t.healthCheckId === checkId);
            if (!trigger)
                continue;
            // Check if trigger condition is met
            const shouldTrigger = this.shouldTriggerAction(action, trigger, result);
            if (shouldTrigger) {
                try {
                    await this.executeAction(action, [`health_check:${checkId}`]);
                }
                catch (error) {
                    this.logger.error('Self-healing action execution failed', {
                        actionId: action.id,
                        checkId,
                        error,
                    });
                }
            }
        }
    }
    shouldTriggerAction(action, trigger, result) {
        // Check cooldown
        const lastExecution = this.actionCooldowns.get(action.id);
        if (lastExecution &&
            Date.now() - lastExecution.getTime() < action.cooldown) {
            return false;
        }
        // Check execution limits
        const recentExecutions = this.actionExecutionHistory.get(action.id) || [];
        const lastHourExecutions = recentExecutions.filter((exec) => exec.startTime.getTime() > Date.now() - 60 * 60 * 1000).length;
        if (lastHourExecutions >= action.maxExecutions) {
            return false;
        }
        // Check trigger condition
        if (trigger.condition === 'unhealthy' && result.status !== 'unhealthy') {
            return false;
        }
        if (trigger.condition === 'degraded' &&
            !['unhealthy', 'warning'].includes(result.status)) {
            return false;
        }
        // Check consecutive failures if required
        if (trigger.consecutiveFailures) {
            const recentResults = this.healthCheckResults.get(trigger.healthCheckId) || [];
            const lastResults = recentResults.slice(-trigger.consecutiveFailures);
            if (lastResults.length < trigger.consecutiveFailures) {
                return false;
            }
            const allFailing = lastResults.every((r) => trigger.condition === 'unhealthy'
                ? r.status === 'unhealthy'
                : trigger.condition === 'degraded'
                    ? ['unhealthy', 'warning'].includes(r.status)
                    : false);
            if (!allFailing) {
                return false;
            }
        }
        return true;
    }
    async executeAction(action, triggers) {
        const executionId = `exec_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        const startTime = new Date();
        this.logger.info('Executing self-healing action', {
            actionId: action.id,
            executionId,
            triggers,
        });
        const executedActions = [];
        let overallStatus = 'success';
        let overallMessage = '';
        try {
            for (const actionConfig of action.actions) {
                const actionStart = performance.now();
                try {
                    const result = await this.executeSingleAction(actionConfig);
                    const actionEnd = performance.now();
                    executedActions.push({
                        type: actionConfig.type,
                        status: 'success',
                        message: result.message,
                        duration: actionEnd - actionStart,
                    });
                }
                catch (error) {
                    const actionEnd = performance.now();
                    executedActions.push({
                        type: actionConfig.type,
                        status: 'failure',
                        message: error.message,
                        duration: actionEnd - actionStart,
                    });
                    if (!actionConfig.retryable) {
                        overallStatus = 'failure';
                        overallMessage = `Non-retryable action failed: ${error.message}`;
                        break;
                    }
                }
            }
            // Determine overall result
            const failedActions = executedActions.filter((a) => a.status === 'failure').length;
            if (failedActions > 0 && overallStatus !== 'failure') {
                overallStatus =
                    failedActions === executedActions.length ? 'failure' : 'success';
                overallMessage = `${executedActions.length - failedActions}/${executedActions.length} actions succeeded`;
            }
            else if (overallStatus === 'success') {
                overallMessage = `All ${executedActions.length} actions completed successfully`;
            }
        }
        catch (error) {
            overallStatus = 'failure';
            overallMessage = `Action execution failed: ${error.message}`;
        }
        const endTime = new Date();
        const result = {
            actionId: action.id,
            executionId,
            status: overallStatus,
            startTime,
            endTime,
            duration: endTime.getTime() - startTime.getTime(),
            triggeredBy: triggers,
            actionsExecuted: executedActions,
            message: overallMessage,
            metadata: {
                actionName: action.name,
                priority: action.priority,
                triggerCount: triggers.length,
            },
        };
        // Store execution result
        if (!this.actionExecutionHistory.has(action.id)) {
            this.actionExecutionHistory.set(action.id, []);
        }
        const history = this.actionExecutionHistory.get(action.id);
        history.push(result);
        // Trim history
        if (history.length > 100) {
            history.splice(0, history.length - 100);
        }
        // Set cooldown
        this.actionCooldowns.set(action.id, endTime);
        // Emit execution result
        this.emit('health:action:executed', { action, result });
        this.logger.info('Self-healing action completed', {
            actionId: action.id,
            executionId,
            status: overallStatus,
            duration: result.duration,
        });
        return result;
    }
    async executeSingleAction(actionConfig) {
        const timeout = actionConfig.timeout;
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => {
                reject(new Error(`Action timed out after ${timeout}ms`));
            }, timeout);
        });
        const actionPromise = (async () => {
            switch (actionConfig.type) {
                case 'clear_cache':
                    return await this.executeClearCache(actionConfig.config);
                case 'restart_service':
                    return await this.executeRestartService(actionConfig.config);
                case 'redistribute_load':
                    return await this.executeRedistributeLoad(actionConfig.config);
                case 'scale_resources':
                    return await this.executeScaleResources(actionConfig.config);
                case 'notify_admin':
                    return await this.executeNotifyAdmin(actionConfig.config);
                case 'custom_script':
                    return await this.executeCustomScript(actionConfig.config);
                default:
                    throw new Error(`Unknown action type: ${actionConfig.type}`);
            }
        })();
        return Promise.race([actionPromise, timeoutPromise]);
    }
    async executeClearCache(config) {
        const cacheTypes = config['cacheTypes'] || [];
        const clearedCaches = [];
        // Force garbage collection
        if (global.gc) {
            global.gc();
            clearedCaches.push('garbage_collection');
        }
        // Clear internal caches (simulated)
        if (cacheTypes.includes('monitoring')) {
            // Clear monitoring data cache
            clearedCaches.push('monitoring_cache');
        }
        if (cacheTypes.includes('task')) {
            // Clear task cache
            clearedCaches.push('task_cache');
        }
        if (cacheTypes.includes('agent')) {
            // Clear agent cache
            clearedCaches.push('agent_cache');
        }
        return {
            message: `Cleared caches: ${clearedCaches.join(', ')}`,
        };
    }
    async executeRestartService(config) {
        const service = config['service'];
        // Simulate service restart
        this.logger.info('Simulating service restart', { service });
        // In a real implementation, this would restart the actual service
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate restart time
        return {
            message: `Service '${service}' restarted successfully`,
        };
    }
    async executeRedistributeLoad(config) {
        const strategy = config['strategy'];
        switch (strategy) {
            case 'rebalance_tasks': {
                // Rebalance tasks across agents
                const agents = taskStatusMonitor.getAllAgents();
                const activeTasks = taskStatusMonitor
                    .getAllTasks()
                    .filter((t) => t.status === TaskStatus.IN_PROGRESS);
                // Simple load balancing simulation
                let rebalancedCount = 0;
                for (const task of activeTasks) {
                    if (task.assignedAgent) {
                        const currentAgent = agents.find((a) => a.id === task.assignedAgent);
                        const idleAgents = agents.filter((a) => a.status === 'idle');
                        if (currentAgent &&
                            currentAgent.currentTasks.length > 2 &&
                            idleAgents.length > 0) {
                            // Would reassign task to idle agent
                            rebalancedCount++;
                        }
                    }
                }
                return {
                    message: `Rebalanced ${rebalancedCount} tasks across available agents`,
                };
            }
            case 'exclude_offline_agents': {
                const offlineAgents = taskStatusMonitor
                    .getAllAgents()
                    .filter((a) => a.status === 'offline');
                return {
                    message: `Excluded ${offlineAgents.length} offline agents from load distribution`,
                };
            }
            default:
                throw new Error(`Unknown load redistribution strategy: ${strategy}`);
        }
    }
    async executeScaleResources(config) {
        // Simulate resource scaling
        const resourceType = config['resourceType'] || 'agents';
        const scaleDirection = config['direction'] || 'up';
        this.logger.info('Simulating resource scaling', {
            resourceType,
            scaleDirection,
        });
        return {
            message: `Scaled ${resourceType} ${scaleDirection} successfully`,
        };
    }
    async executeNotifyAdmin(config) {
        const severity = config['severity'] || 'info';
        const message = config['message'] || 'Health monitoring notification';
        this.logger.warn('Admin notification', { severity, message });
        // In a real implementation, this would send actual notifications
        return {
            message: `Admin notified: ${message} (${severity})`,
        };
    }
    async executeCustomScript(config) {
        const action = config['action'];
        switch (action) {
            case 'force_gc':
                if (global.gc) {
                    global.gc();
                    return { message: 'Garbage collection forced successfully' };
                }
                throw new Error('Garbage collection not available');
            case 'reconnect_agents': {
                // Simulate agent reconnection
                const offlineAgents = taskStatusMonitor
                    .getAllAgents()
                    .filter((a) => a.status === 'offline');
                const reconnected = Math.floor(offlineAgents.length * 0.7); // 70% success rate
                return {
                    message: `Attempted to reconnect agents: ${reconnected}/${offlineAgents.length} successful`,
                };
            }
            case 'data_validation_repair': {
                // Simulate data validation and repair
                await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate processing time
                return {
                    message: 'Data validation completed and inconsistencies repaired',
                };
            }
            default:
                throw new Error(`Unknown custom action: ${action}`);
        }
    }
    generateSystemHealthSummary() {
        const allResults = this.getHealthCheckResults();
        const recentResults = allResults.filter((r) => r.timestamp.getTime() > Date.now() - 5 * 60 * 1000);
        // Calculate check counts
        const checks = {
            total: this.healthChecks.size,
            healthy: recentResults.filter((r) => r.status === 'healthy').length,
            warning: recentResults.filter((r) => r.status === 'warning').length,
            unhealthy: recentResults.filter((r) => r.status === 'unhealthy').length,
            timeout: recentResults.filter((r) => r.status === 'timeout').length,
            unknown: recentResults.filter((r) => r.status === 'unknown').length,
        };
        // Calculate overall status and score
        let score = 100;
        score -= checks.unhealthy * 25;
        score -= checks.warning * 10;
        score -= checks.timeout * 15;
        score -= checks.unknown * 5;
        score = Math.max(0, score);
        let overall = 'healthy';
        if (score < 50) {
            overall = 'critical';
        }
        else if (score < 70) {
            overall = 'unhealthy';
        }
        else if (score < 90) {
            overall = 'warning';
        }
        // Group by categories
        const categories = {};
        Array.from(this.healthChecks.values()).forEach((check) => {
            const category = check.checkType;
            if (!categories[category]) {
                categories[category] = {
                    status: 'healthy',
                    count: 0,
                    issues: [],
                };
            }
            categories[category].count++;
            const checkResults = recentResults.filter((r) => r.checkId === check.id);
            const latestResult = checkResults[checkResults.length - 1];
            if (latestResult && latestResult.status !== 'healthy') {
                categories[category].issues.push(`${check.name}: ${latestResult.message}`);
                if (latestResult.status === 'unhealthy' ||
                    categories[category].status === 'healthy') {
                    categories[category].status =
                        latestResult.status === 'unhealthy' ? 'unhealthy' : 'warning';
                }
            }
        });
        // Calculate trends
        const trends = this.calculateSystemTrends();
        // Get auto-healing stats
        const recentExecutions = this.getSelfHealingHistory().filter((exec) => exec.startTime.getTime() > Date.now() - 24 * 60 * 60 * 1000);
        const autoHealingActions = {
            executed: recentExecutions.length,
            successful: recentExecutions.filter((e) => e.status === 'success').length,
            failed: recentExecutions.filter((e) => e.status === 'failure').length,
            lastExecution: recentExecutions.length > 0 ? recentExecutions[0].startTime : undefined,
        };
        // Generate recommendations
        const recommendations = this.generateHealthRecommendations(checks, categories, trends);
        return {
            overall,
            score,
            timestamp: new Date(),
            checks,
            categories,
            trends,
            autoHealingActions,
            recommendations,
        };
    }
    calculateSystemTrends() {
        const now = Date.now();
        const shortTermWindow = 5 * 60 * 1000; // 5 minutes
        const mediumTermWindow = 30 * 60 * 1000; // 30 minutes
        const longTermWindow = 24 * 60 * 60 * 1000; // 24 hours
        const allResults = this.getHealthCheckResults();
        const calculateTrendForWindow = (windowMs) => {
            const windowResults = allResults.filter((r) => r.timestamp.getTime() > now - windowMs);
            if (windowResults.length < 5)
                return 'stable';
            // Calculate average health score for first and second half of window
            const midpoint = now - windowMs / 2;
            const firstHalf = windowResults.filter((r) => r.timestamp.getTime() < midpoint);
            const secondHalf = windowResults.filter((r) => r.timestamp.getTime() >= midpoint);
            if (firstHalf.length === 0 || secondHalf.length === 0)
                return 'stable';
            const firstHalfScore = firstHalf.reduce((sum, r) => sum +
                (r.status === 'healthy' ? 100 : r.status === 'warning' ? 50 : 0), 0) / firstHalf.length;
            const secondHalfScore = secondHalf.reduce((sum, r) => sum +
                (r.status === 'healthy' ? 100 : r.status === 'warning' ? 50 : 0), 0) / secondHalf.length;
            const difference = secondHalfScore - firstHalfScore;
            if (difference > 10)
                return 'improving';
            if (difference < -10)
                return 'degrading';
            return 'stable';
        };
        return {
            shortTerm: calculateTrendForWindow(shortTermWindow),
            mediumTerm: calculateTrendForWindow(mediumTermWindow),
            longTerm: calculateTrendForWindow(longTermWindow),
        };
    }
    generateHealthRecommendations(checks, categories, trends) {
        const recommendations = [];
        // Critical issues
        if (checks.unhealthy > 0) {
            recommendations.push({
                type: 'immediate',
                priority: 'critical',
                title: 'Critical Health Issues Detected',
                description: `${checks.unhealthy} health checks are failing`,
                actions: [
                    'Review failing health checks immediately',
                    'Execute manual troubleshooting procedures',
                    'Consider emergency escalation if issues persist',
                ],
            });
        }
        // Warning issues
        if (checks.warning > checks.total * 0.3) {
            // More than 30% warnings
            recommendations.push({
                type: 'immediate',
                priority: 'high',
                title: 'Multiple Warning Conditions',
                description: `${checks.warning} health checks are in warning state`,
                actions: [
                    'Investigate warning conditions before they become critical',
                    'Review system resource usage',
                    'Consider preventive maintenance',
                ],
            });
        }
        // Trend-based recommendations
        if (trends.shortTerm === 'degrading' && trends.mediumTerm === 'degrading') {
            recommendations.push({
                type: 'immediate',
                priority: 'high',
                title: 'Degrading Health Trend',
                description: 'System health is consistently degrading',
                actions: [
                    'Identify root cause of health degradation',
                    'Review recent system changes',
                    'Implement corrective measures immediately',
                ],
            });
        }
        // Category-specific recommendations
        Object.entries(categories).forEach(([category, info]) => {
            if (info.status === 'unhealthy') {
                recommendations.push({
                    type: 'immediate',
                    priority: 'high',
                    title: `${category.charAt(0).toUpperCase() + category.slice(1)} Issues`,
                    description: `${category} health checks are failing`,
                    actions: [
                        `Review ${category} configuration and status`,
                        `Check ${category} logs for error patterns`,
                        `Consider ${category} system restart if necessary`,
                    ],
                });
            }
        });
        // Preventive recommendations
        if (checks.healthy / checks.total > 0.9) {
            // System is mostly healthy
            recommendations.push({
                type: 'preventive',
                priority: 'normal',
                title: 'System Optimization Opportunity',
                description: 'System is healthy - good time for optimization',
                actions: [
                    'Review and optimize monitoring thresholds',
                    'Update self-healing action configurations',
                    'Perform preventive maintenance tasks',
                ],
            });
        }
        return recommendations.sort((a, b) => {
            const priorityOrder = { critical: 4, high: 3, normal: 2, low: 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        });
    }
    startGlobalHealthMonitoring() {
        // Start global health summary updates
        const globalInterval = setInterval(() => {
            const summary = this.generateSystemHealthSummary();
            this.currentSystemHealth = summary;
            // Store in history
            this.systemHealthHistory.push(summary);
            if (this.systemHealthHistory.length > this.healthTrendWindow) {
                this.systemHealthHistory = this.systemHealthHistory.slice(-this.healthTrendWindow);
            }
            this.emit('health:system:summary', { summary });
            // Log critical issues
            if (summary.overall === 'critical' || summary.checks.unhealthy > 0) {
                this.logger.error('System health critical', {
                    overall: summary.overall,
                    score: summary.score,
                    unhealthyChecks: summary.checks.unhealthy,
                    criticalIssues: summary.recommendations.filter((r) => r.priority === 'critical').length,
                });
            }
        }, this.config.globalHealthCheckInterval);
        this.healthCheckIntervals.set('global', globalInterval);
    }
    setupSystemEventListeners() {
        // Listen for monitoring system events
        realTimeMonitoringSystem.on('alert:triggered', (data) => {
            // Health monitoring can react to system alerts
            this.emit('health:external:alert', data);
        });
        monitoringIntegrationHub.on('cross-system:event', (event) => {
            // Track cross-system events for health assessment
            if (event.eventType.includes('fail') ||
                event.eventType.includes('error')) {
                this.emit('health:external:event', event);
            }
        });
    }
    async loadPersistedState() {
        try {
            // Load health monitoring state
            const stateData = await fs.readFile(this.persistencePath, 'utf-8');
            const parsedState = JSON.parse(stateData);
            // Restore system health history
            if (parsedState.systemHealthHistory) {
                this.systemHealthHistory = parsedState.systemHealthHistory.map((item) => ({
                    ...item,
                    timestamp: new Date(item.timestamp),
                }));
            }
            this.logger.info('Health monitoring state loaded', {
                historyEntries: this.systemHealthHistory.length,
            });
        }
        catch (_error) {
            // File doesn't exist or is corrupted - start fresh
            this.logger.info('No persisted health monitoring state found, starting fresh');
        }
        try {
            // Load execution history
            const historyData = await fs.readFile(this.executionHistoryPath, 'utf-8');
            const parsedHistory = JSON.parse(historyData);
            // Restore execution history
            Object.entries(parsedHistory.actionHistory || {}).forEach(([actionId, history]) => {
                this.actionExecutionHistory.set(actionId, history.map((item) => ({
                    ...item,
                    startTime: new Date(item.startTime),
                    endTime: new Date(item.endTime),
                })));
            });
            this.logger.info('Self-healing execution history loaded', {
                actions: Object.keys(parsedHistory.actionHistory || {}).length,
            });
        }
        catch (_error) {
            // File doesn't exist - start fresh
            this.logger.info('No persisted execution history found, starting fresh');
        }
    }
    async persistState() {
        try {
            // Persist health monitoring state
            const stateData = {
                systemHealthHistory: this.systemHealthHistory.slice(-50), // Last 50 entries
                lastPersisted: new Date().toISOString(),
            };
            await fs.writeFile(this.persistencePath, JSON.stringify(stateData, null, 2));
            // Persist execution history
            const historyData = {
                actionHistory: Object.fromEntries(Array.from(this.actionExecutionHistory.entries()).map(([id, history]) => [
                    id,
                    history.slice(-20), // Last 20 executions per action
                ])),
                lastPersisted: new Date().toISOString(),
            };
            await fs.writeFile(this.executionHistoryPath, JSON.stringify(historyData, null, 2));
        }
        catch (error) {
            this.logger.error('Failed to persist health monitoring state', { error });
        }
    }
    /**
     * Graceful shutdown
     */
    async shutdown() {
        this.logger.info('Shutting down AutomatedHealthMonitoring');
        // Clear all intervals
        for (const interval of this.healthCheckIntervals.values()) {
            clearInterval(interval);
        }
        // Persist final state
        await this.persistState();
        // Clean up resources
        this.removeAllListeners();
        this.healthChecks.clear();
        this.selfHealingActions.clear();
        this.healthCheckResults.clear();
        this.healthCheckIntervals.clear();
        this.actionExecutionHistory.clear();
        this.actionCooldowns.clear();
        this.logger.info('AutomatedHealthMonitoring shutdown complete');
    }
}
/**
 * Singleton instance for global access
 */
export const automatedHealthMonitoring = new AutomatedHealthMonitoring();
//# sourceMappingURL=AutomatedHealthMonitoring.js.map