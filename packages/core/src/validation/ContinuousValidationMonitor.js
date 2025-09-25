/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { EventEmitter } from 'node:events';
import { Logger } from '../logger/Logger.js';
/**
 * Monitoring trigger types
 */
export var MonitoringTrigger;
(function (MonitoringTrigger) {
    MonitoringTrigger["FILE_CHANGE"] = "file-change";
    MonitoringTrigger["TIME_BASED"] = "time-based";
    MonitoringTrigger["THRESHOLD_BREACH"] = "threshold-breach";
    MonitoringTrigger["EXTERNAL_EVENT"] = "external-event";
    MonitoringTrigger["MANUAL"] = "manual";
    MonitoringTrigger["GIT_HOOK"] = "git-hook";
    MonitoringTrigger["CI_CD_PIPELINE"] = "ci-cd-pipeline";
})(MonitoringTrigger || (MonitoringTrigger = {}));
/**
 * Monitoring scope
 */
export var MonitoringScope;
(function (MonitoringScope) {
    MonitoringScope["PROJECT"] = "project";
    MonitoringScope["WORKSPACE"] = "workspace";
    MonitoringScope["FILE"] = "file";
    MonitoringScope["DIRECTORY"] = "directory";
    MonitoringScope["DEPENDENCY"] = "dependency";
})(MonitoringScope || (MonitoringScope = {}));
/**
 * Health status
 */
export var HealthStatus;
(function (HealthStatus) {
    HealthStatus["HEALTHY"] = "healthy";
    HealthStatus["DEGRADED"] = "degraded";
    HealthStatus["UNHEALTHY"] = "unhealthy";
    HealthStatus["CRITICAL"] = "critical";
})(HealthStatus || (HealthStatus = {}));
/**
 * Continuous validation monitoring system (stub implementation)
 * Provides real-time monitoring, health checks, and automated validation triggers
 */
export class ContinuousValidationMonitor extends EventEmitter {
    logger;
    constructor(config, validationFramework, validationWorkflow, failureHandler, reporting) {
        super();
        this.logger = new Logger('ContinuousValidationMonitor');
        this.logger.info('ContinuousValidationMonitor initialized (stub implementation)');
    }
    async startMonitoring() {
        this.logger.info('Starting continuous validation monitoring');
    }
    async stopMonitoring() {
        this.logger.info('Stopping continuous validation monitoring');
    }
    queueValidation(context, trigger, priority = 0) {
        return `validation-${Date.now()}`;
    }
    async triggerValidation(context) {
        return `validation-${Date.now()}`;
    }
    getSystemHealth() {
        return {
            overall: HealthStatus.HEALTHY,
            timestamp: new Date(),
            components: {
                validation: HealthStatus.HEALTHY,
                workflow: HealthStatus.HEALTHY,
                reporting: HealthStatus.HEALTHY,
                fileSystem: HealthStatus.HEALTHY
            },
            metrics: {
                validationsPerHour: 0,
                averageResponseTime: 0,
                errorRate: 0,
                queueSize: 0,
                memoryUsage: 0,
                diskUsage: 0
            },
            alerts: [],
            uptime: 0
        };
    }
    addMonitoringRule(rule) {
        this.logger.info(`Added monitoring rule: ${rule.id}`);
    }
    addHealthCheck(healthCheck) {
        this.logger.info(`Added health check: ${healthCheck.id}`);
    }
    isWorkflowRunning(taskId, stage) {
        return false;
    }
    async cancelWorkflow(taskId, stage) {
        return false;
    }
    getStatistics() {
        return {
            enabled: false,
            queueSize: 0,
            activeValidations: 0,
            totalAlerts: 0,
            unresolvedAlerts: 0,
            monitoringRules: 0,
            healthChecks: 0,
            systemHealth: HealthStatus.HEALTHY
        };
    }
}
//# sourceMappingURL=ContinuousValidationMonitor.js.map