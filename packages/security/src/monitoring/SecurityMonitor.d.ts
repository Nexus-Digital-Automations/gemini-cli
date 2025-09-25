/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { EventEmitter } from 'node:events';
export interface SecurityEvent {
    readonly id: string;
    readonly timestamp: Date;
    readonly type: SecurityEventType;
    readonly severity: SecuritySeverity;
    readonly source: string;
    readonly description: string;
    readonly metadata: Record<string, unknown>;
    readonly riskScore: number;
    readonly correlationId?: string;
}
export type SecurityEventType = 'authentication_failure' | 'authorization_denied' | 'suspicious_access' | 'data_breach_attempt' | 'malware_detected' | 'vulnerability_exploit' | 'policy_violation' | 'anomalous_behavior' | 'system_compromise' | 'privilege_escalation' | 'data_exfiltration' | 'brute_force_attack' | 'injection_attempt' | 'file_integrity_violation';
export type SecuritySeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export interface ThreatIntelligence {
    readonly indicators: ThreatIndicator[];
    readonly campaigns: ThreatCampaign[];
    readonly lastUpdated: Date;
}
export interface ThreatIndicator {
    readonly id: string;
    readonly type: 'ip' | 'domain' | 'hash' | 'pattern' | 'signature';
    readonly value: string;
    readonly confidence: number;
    readonly severity: SecuritySeverity;
    readonly description: string;
    readonly source: string;
    readonly firstSeen: Date;
    readonly lastSeen: Date;
}
export interface ThreatCampaign {
    readonly id: string;
    readonly name: string;
    readonly description: string;
    readonly tactics: string[];
    readonly indicators: ThreatIndicator[];
    readonly mitigation: string[];
}
export interface SecurityMetrics {
    readonly totalEvents: number;
    readonly eventsByType: Map<SecurityEventType, number>;
    readonly eventsBySeverity: Map<SecuritySeverity, number>;
    readonly averageRiskScore: number;
    readonly falsePositiveRate: number;
    readonly responseTime: number;
    readonly topThreats: ThreatIndicator[];
}
export interface AlertRule {
    readonly id: string;
    readonly name: string;
    readonly description: string;
    readonly eventTypes: SecurityEventType[];
    readonly conditions: AlertCondition[];
    readonly severity: SecuritySeverity;
    readonly isActive: boolean;
}
export interface AlertCondition {
    readonly field: string;
    readonly operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'regex';
    readonly value: unknown;
}
export interface SecurityAlert {
    readonly id: string;
    readonly ruleId: string;
    readonly timestamp: Date;
    readonly severity: SecuritySeverity;
    readonly title: string;
    readonly description: string;
    readonly events: SecurityEvent[];
    readonly recommendations: string[];
    readonly status: 'open' | 'investigating' | 'resolved' | 'false_positive';
}
/**
 * Advanced security monitoring and threat detection system with ML-powered analytics.
 *
 * Features:
 * - Real-time security event detection and correlation
 * - Behavioral anomaly detection with machine learning
 * - Threat intelligence integration and IOC matching
 * - Automated incident response and alerting
 * - Security metrics and KPI dashboards
 * - SIEM integration and log aggregation
 * - Attack pattern recognition and attribution
 * - Risk scoring and prioritization
 * - Forensic analysis and evidence collection
 */
export declare class SecurityMonitor extends EventEmitter {
    private readonly configPath?;
    private events;
    private alerts;
    private alertRules;
    private threatIntelligence;
    private readonly anomalyDetector;
    private readonly incidentResponse;
    private readonly auditLogger;
    private readonly metricsCollector;
    constructor(configPath?: string | undefined);
    /**
     * Initialize the security monitoring system.
     */
    initialize(): Promise<void>;
    /**
     * Process and analyze a security event.
     */
    processSecurityEvent(event: Omit<SecurityEvent, 'id' | 'timestamp' | 'riskScore'>): Promise<SecurityEvent>;
    /**
     * Create a new alert rule.
     */
    createAlertRule(rule: Omit<AlertRule, 'id'>): Promise<AlertRule>;
    /**
     * Get security events with filtering options.
     */
    getSecurityEvents(options?: {
        type?: SecurityEventType;
        severity?: SecuritySeverity;
        timeRange?: {
            start: Date;
            end: Date;
        };
        limit?: number;
    }): SecurityEvent[];
    /**
     * Get active security alerts.
     */
    getActiveAlerts(): SecurityAlert[];
    /**
     * Update alert status.
     */
    updateAlertStatus(alertId: string, status: SecurityAlert['status']): Promise<void>;
    /**
     * Get comprehensive security metrics.
     */
    getSecurityMetrics(): Promise<SecurityMetrics>;
    /**
     * Perform security incident investigation.
     */
    investigateIncident(eventIds: string[]): Promise<InvestigationResult>;
    /**
     * Generate security dashboard data.
     */
    getSecurityDashboard(): Promise<SecurityDashboard>;
    /**
     * Private implementation methods
     */
    private calculateRiskScore;
    private matchThreatIntelligence;
    private matchesIndicator;
    private containsIP;
    private containsDomain;
    private containsHash;
    private matchesPattern;
    private matchesSignature;
    private evaluateAlertRules;
    private evaluateAlertCondition;
    private generateRecommendations;
    private handleAlert;
    private performInvestigation;
    private correlateEvents;
    private analyzeAttackPatterns;
    private generateTimeline;
    private assessImpact;
    private generateInvestigationRecommendations;
    private estimateIncidentCost;
    private assessComplianceImpact;
    private calculateDailyTrends;
    private calculateHourlyTrends;
    private getTopThreats;
    private getSystemHealthMetrics;
    private initializeDefaultRules;
    private loadConfiguration;
    private saveAlertRules;
    private loadThreatIntelligence;
    private startMonitoring;
    private startPeriodicTasks;
}
interface InvestigationResult {
    id: string;
    timestamp: Date;
    events: SecurityEvent[];
    attackPatterns: AttackPattern[];
    timeline: TimelineEntry[];
    impact: ImpactAssessment;
    recommendations: string[];
    status: 'active' | 'completed' | 'archived';
}
interface AttackPattern {
    id: string;
    name: string;
    confidence: number;
    tactics: string[];
    description: string;
}
interface TimelineEntry {
    timestamp: Date;
    event: string;
    description: string;
    severity: SecuritySeverity;
}
interface ImpactAssessment {
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    systemsAffected: number;
    dataAtRisk: boolean;
    estimatedCost: number;
    complianceImpact: string[];
}
interface SecurityDashboard {
    timestamp: Date;
    summary: {
        totalEventsToday: number;
        criticalEventsToday: number;
        activeAlerts: number;
        averageRiskScore: number;
    };
    eventTrends: {
        daily: Map<string, number>;
        hourly: Map<string, number>;
    };
    topThreats: ThreatIndicator[];
    systemHealth: Record<string, unknown>;
}
export {};
