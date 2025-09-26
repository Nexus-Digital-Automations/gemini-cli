/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Core budget infrastructure types and interfaces
 * Provides comprehensive type definitions for budget tracking, analytics, and management
 *
 * @author Claude Code - Budget Core Infrastructure Agent
 * @version 1.0.0
 */
/**
 * Budget configuration settings with enhanced options
 */
export interface BudgetSettings {
    /** Whether budget tracking is enabled */
    enabled?: boolean;
    /** Daily spending limit in dollars */
    dailyLimit?: number;
    /** Weekly spending limit in dollars */
    weeklyLimit?: number;
    /** Monthly spending limit in dollars */
    monthlyLimit?: number;
    /** Time when budget resets (HH:MM format) */
    resetTime?: string;
    /** Warning thresholds as percentages (0-100) */
    warningThresholds?: number[];
    /** Currency code (e.g., 'USD', 'EUR') */
    currency?: string;
    /** Enable automatic alerts */
    alertsEnabled?: boolean;
    /** Notification preferences */
    notifications?: NotificationSettings;
    /** Budget enforcement level */
    enforcement?: BudgetEnforcementLevel;
}
/**
 * Budget usage data stored in file system with enhanced tracking
 */
export interface BudgetUsageData {
    /** Current date (YYYY-MM-DD format) */
    date: string;
    /** Total number of API requests */
    requestCount: number;
    /** Total cost in dollars */
    totalCost: number;
    /** Token usage statistics */
    tokenUsage: TokenUsageData;
    /** Last reset timestamp */
    lastResetTime: string;
    /** Warning thresholds that have been shown */
    warningsShown: number[];
    /** Feature-specific cost breakdown */
    featureCosts?: Record<string, number>;
    /** Session-specific usage tracking */
    sessionUsage?: SessionUsageData[];
    /** Historical data points */
    history?: HistoricalDataPoint[];
}
/**
 * Enhanced token usage tracking
 */
export interface TokenUsageData {
    /** Input tokens used */
    inputTokens: number;
    /** Output tokens generated */
    outputTokens: number;
    /** Total tokens (input + output) */
    totalTokens: number;
    /** Cost per token type */
    tokenCosts: {
        input: number;
        output: number;
    };
    /** Model-specific usage */
    modelUsage?: Record<string, ModelUsageData>;
}
/**
 * Model-specific usage statistics
 */
export interface ModelUsageData {
    /** Number of requests to this model */
    requests: number;
    /** Input tokens for this model */
    inputTokens: number;
    /** Output tokens for this model */
    outputTokens: number;
    /** Total cost for this model */
    cost: number;
    /** Average response time in milliseconds */
    avgResponseTime?: number;
}
/**
 * Session-specific usage tracking
 */
export interface SessionUsageData {
    /** Unique session identifier */
    sessionId: string;
    /** Session start time */
    startTime: string;
    /** Session end time */
    endTime?: string;
    /** Total requests in session */
    requests: number;
    /** Total cost for session */
    cost: number;
    /** Token usage in session */
    tokens: TokenUsageData;
    /** Features used in session */
    featuresUsed: string[];
}
/**
 * Historical data point for trend analysis
 */
export interface HistoricalDataPoint {
    /** Timestamp of the data point */
    timestamp: string;
    /** Cost at this point */
    cost: number;
    /** Request count at this point */
    requests: number;
    /** Token usage at this point */
    tokens: number;
    /** Feature being used */
    feature?: string;
    /** Model being used */
    model?: string;
}
/**
 * Notification settings for budget alerts
 */
export interface NotificationSettings {
    /** Enable email notifications */
    email?: boolean;
    /** Email address for notifications */
    emailAddress?: string;
    /** Enable desktop notifications */
    desktop?: boolean;
    /** Enable webhook notifications */
    webhook?: boolean;
    /** Webhook URL */
    webhookUrl?: string;
    /** Notification frequency */
    frequency?: NotificationFrequency;
}
/**
 * Budget enforcement levels
 */
export declare enum BudgetEnforcementLevel {
    /** Only show warnings, don't block usage */
    WARNING_ONLY = "warning_only",
    /** Block usage at hard limits */
    STRICT = "strict",
    /** Allow brief overages with strong warnings */
    SOFT_LIMIT = "soft_limit",
    /** No enforcement, tracking only */
    TRACKING_ONLY = "tracking_only"
}
/**
 * Notification frequency options
 */
export declare enum NotificationFrequency {
    /** Immediate notifications */
    IMMEDIATE = "immediate",
    /** Hourly digest */
    HOURLY = "hourly",
    /** Daily digest */
    DAILY = "daily",
    /** Weekly digest */
    WEEKLY = "weekly"
}
/**
 * Budget calculation context for cost computations
 */
export interface BudgetCalculationContext {
    /** Model being used */
    model: string;
    /** Feature requesting calculation */
    feature: string;
    /** Session identifier */
    sessionId: string;
    /** User identifier */
    userId?: string;
    /** Additional metadata */
    metadata?: Record<string, any>;
}
/**
 * Cost calculation parameters
 */
export interface CostCalculationParams {
    /** Input token count */
    inputTokens: number;
    /** Output token count */
    outputTokens: number;
    /** Model identifier */
    model: string;
    /** Request timestamp */
    timestamp: Date;
    /** Additional context */
    context?: BudgetCalculationContext;
}
/**
 * Budget validation result
 */
export interface BudgetValidationResult {
    /** Whether the operation is allowed */
    allowed: boolean;
    /** Current usage amount */
    currentUsage: number;
    /** Budget limit */
    limit: number;
    /** Usage percentage */
    usagePercentage: number;
    /** Warning level (if any) */
    warningLevel?: number;
    /** Validation message */
    message?: string;
    /** Recommended actions */
    recommendations?: string[];
}
/**
 * Budget event types for the event system
 */
export declare enum BudgetEventType {
    /** Budget limit exceeded */
    LIMIT_EXCEEDED = "limit_exceeded",
    /** Warning threshold reached */
    WARNING_THRESHOLD = "warning_threshold",
    /** Budget reset occurred */
    BUDGET_RESET = "budget_reset",
    /** Usage updated */
    USAGE_UPDATED = "usage_updated",
    /** Settings changed */
    SETTINGS_CHANGED = "settings_changed",
    /** Cost calculated */
    COST_CALCULATED = "cost_calculated",
    /** Session started */
    SESSION_STARTED = "session_started",
    /** Session ended */
    SESSION_ENDED = "session_ended"
}
/**
 * Budget event data structure
 */
export interface BudgetEvent {
    /** Event type */
    type: BudgetEventType;
    /** Event timestamp */
    timestamp: Date;
    /** Event payload */
    data: Record<string, any>;
    /** Event source */
    source: string;
    /** Event severity level */
    severity: EventSeverity;
}
/**
 * Event severity levels
 */
export declare enum EventSeverity {
    /** Informational event */
    INFO = "info",
    /** Warning event */
    WARNING = "warning",
    /** Error event */
    ERROR = "error",
    /** Critical event */
    CRITICAL = "critical"
}
/**
 * Budget storage interface for persistence abstraction
 */
export interface BudgetStorage {
    /** Read usage data */
    readUsageData(): Promise<BudgetUsageData>;
    /** Write usage data */
    writeUsageData(data: BudgetUsageData): Promise<void>;
    /** Read settings */
    readSettings(): Promise<BudgetSettings>;
    /** Write settings */
    writeSettings(settings: BudgetSettings): Promise<void>;
    /** Check if storage is available */
    isAvailable(): Promise<boolean>;
    /** Initialize storage */
    initialize(): Promise<void>;
    /** Clear all data */
    clear(): Promise<void>;
}
/**
 * Budget security context for access control
 */
export interface BudgetSecurityContext {
    /** User identifier */
    userId?: string;
    /** Session identifier */
    sessionId: string;
    /** Required permissions */
    requiredPermissions: BudgetPermission[];
    /** Current user permissions */
    userPermissions: BudgetPermission[];
    /** IP address */
    ipAddress?: string;
    /** User agent */
    userAgent?: string;
}
/**
 * Budget permission levels
 */
export declare enum BudgetPermission {
    /** View budget information */
    VIEW_BUDGET = "view_budget",
    /** Modify budget settings */
    MODIFY_SETTINGS = "modify_settings",
    /** View usage statistics */
    VIEW_USAGE = "view_usage",
    /** Reset budget */
    RESET_BUDGET = "reset_budget",
    /** Access historical data */
    VIEW_HISTORY = "view_history",
    /** Administrative access */
    ADMIN = "admin"
}
