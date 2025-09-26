/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Deployment configuration for monitoring system
 */
export interface DeploymentConfig {
    environment: 'development' | 'staging' | 'production';
    enabledComponents: {
        realTimeMonitoring: boolean;
        dashboards: boolean;
        performanceAnalytics: boolean;
        alerting: boolean;
        dataExport: boolean;
        webhookIntegration: boolean;
    };
    performance: {
        updateIntervalMs: number;
        retentionHours: number;
        maxConcurrentConnections: number;
        alertCooldownMs: number;
    };
    infrastructure: {
        websocketPort: number;
        enableHttps: boolean;
        certificatePath?: string;
        privateKeyPath?: string;
        enableCors: boolean;
        corsOrigins: string[];
    };
    observability: {
        enableMetricsExport: boolean;
        prometheusEndpoint?: string;
        logLevel: 'debug' | 'info' | 'warn' | 'error';
        enableTracing: boolean;
    };
    security: {
        enableAuthentication: boolean;
        jwtSecret?: string;
        allowedApiKeys: string[];
        rateLimit: {
            windowMs: number;
            maxRequests: number;
        };
    };
}
/**
 * Health check configuration
 */
export interface HealthCheckConfig {
    endpoints: Array<{
        name: string;
        path: string;
        timeout: number;
        interval: number;
        healthyThreshold: number;
        unhealthyThreshold: number;
    }>;
    dependencies: Array<{
        name: string;
        type: 'database' | 'service' | 'filesystem' | 'network';
        config: Record<string, unknown>;
    }>;
}
/**
 * Operational procedures for monitoring system
 */
export interface OperationalProcedures {
    startup: {
        preflightChecks: string[];
        initializationOrder: string[];
        healthChecks: string[];
    };
    monitoring: {
        keyMetrics: string[];
        alertThresholds: Record<string, number>;
        escalationPaths: Array<{
            severity: string;
            contacts: string[];
            timeoutMinutes: number;
        }>;
    };
    maintenance: {
        dailyTasks: string[];
        weeklyTasks: string[];
        monthlyTasks: string[];
        backupProcedures: string[];
    };
    troubleshooting: {
        commonIssues: Array<{
            issue: string;
            symptoms: string[];
            resolution: string[];
        }>;
        diagnosticCommands: Record<string, string>;
    };
}
/**
 * Comprehensive Monitoring System Deployment Manager
 *
 * Handles complete deployment, configuration, and operational management:
 * - Environment-specific configuration deployment
 * - Component initialization and health validation
 * - Infrastructure setup and security configuration
 * - Monitoring dashboard deployment
 * - Operational procedure establishment
 * - Performance optimization and tuning
 * - Disaster recovery and backup procedures
 */
export declare class MonitoringDeploymentManager {
    private readonly logger;
    private deploymentConfig?;
    private healthCheckConfig?;
    private operationalProcedures?;
    private isDeployed;
    private deploymentPath;
    constructor();
    /**
     * Deploy monitoring system with comprehensive configuration
     */
    deployMonitoringSystem(config?: Partial<DeploymentConfig>, healthChecks?: Partial<HealthCheckConfig>): Promise<void>;
    /**
     * Get deployment status and health information
     */
    getDeploymentStatus(): {
        isDeployed: boolean;
        environment: string;
        components: Array<{
            name: string;
            enabled: boolean;
            status: 'healthy' | 'degraded' | 'unhealthy' | 'offline';
            uptime: number;
        }>;
        infrastructure: {
            websocketServer: boolean;
            dataExport: boolean;
            alerting: boolean;
        };
        performance: {
            updateInterval: number;
            retentionHours: number;
            activeConnections: number;
        };
        lastHealthCheck: Date;
    };
    /**
     * Generate deployment guide documentation
     */
    generateDeploymentGuide(): Promise<string>;
    /**
     * Execute system health check
     */
    executeHealthCheck(): Promise<{
        overall: 'healthy' | 'degraded' | 'unhealthy' | 'critical';
        components: Record<string, {
            status: string;
            responseTime: number;
            checks: Array<{
                name: string;
                status: string;
                message?: string;
            }>;
        }>;
        timestamp: Date;
    }>;
    private generateDeploymentConfig;
    private generateHealthCheckConfig;
    private generateOperationalProcedures;
    private saveConfigurationFiles;
    private executePreflightChecks;
    private executePreflightCheck;
    private initializeMonitoringComponents;
    private initializeComponent;
    private setupInfrastructure;
    private deployDashboards;
    private configureAlerting;
    private executePostDeploymentValidation;
    private rollbackDeployment;
    private generatePreDeploymentChecklist;
    private generateEnvironmentConfiguration;
    private generateComponentInitialization;
    private generateDashboardDeployment;
    private generateAlertingConfiguration;
    private generatePerformanceOptimization;
    private generateDailyOperations;
    private generateWeeklyMaintenance;
    private generateMonthlyTasks;
    private generateKeyMetrics;
    private generateAlertConfiguration;
    private generateEscalationProcedures;
    private generateTroubleshootingGuide;
    private generateDiagnosticCommands;
    private generatePerformanceDebugging;
    private generateSecurityConfiguration;
    private generateApiSecurityConfiguration;
    private generateDataProtectionConfiguration;
    private generateBackupProcedures;
    private generateDisasterRecoveryProcedures;
    private generateSystemRestoreProcedures;
    private generateScalingGuidelines;
}
/**
 * Singleton deployment manager instance
 */
export declare const monitoringDeploymentManager: MonitoringDeploymentManager;
