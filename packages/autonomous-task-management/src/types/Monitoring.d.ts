/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { TaskId } from './Task';
import type { AgentId } from './Agent';
import type { ExecutionId } from './Execution';
/**
 * Unique identifier for monitoring sessions
 */
export type MonitoringId = string;
/**
 * Metric types enumeration
 */
export declare enum MetricType {
    COUNTER = "counter",
    GAUGE = "gauge",
    HISTOGRAM = "histogram",
    TIMER = "timer",
    RATE = "rate",
    PERCENTAGE = "percentage"
}
/**
 * Metric severity levels
 */
export declare enum MetricSeverity {
    INFO = "info",
    WARNING = "warning",
    CRITICAL = "critical",
    EMERGENCY = "emergency"
}
/**
 * Alert status enumeration
 */
export declare enum AlertStatus {
    ACTIVE = "active",
    ACKNOWLEDGED = "acknowledged",
    RESOLVED = "resolved",
    SUPPRESSED = "suppressed"
}
/**
 * Core metric interface
 */
export interface Metric {
    /** Unique metric identifier */
    id: string;
    /** Metric name */
    name: string;
    /** Metric type */
    type: MetricType;
    /** Metric value */
    value: number;
    /** Metric unit */
    unit: string;
    /** Metric description */
    description: string;
    /** Metric tags */
    tags: Record<string, string>;
    /** Metric timestamp */
    timestamp: Date;
    /** Metric source */
    source: MetricSource;
    /** Metric metadata */
    metadata: Record<string, any>;
}
/**
 * Metric source information
 */
export interface MetricSource {
    /** Source type */
    type: SourceType;
    /** Source identifier */
    id: string;
    /** Source name */
    name: string;
    /** Source location */
    location?: string;
}
/**
 * Source types
 */
export declare enum SourceType {
    SYSTEM = "system",
    TASK = "task",
    AGENT = "agent",
    QUEUE = "queue",
    EXECUTION = "execution",
    APPLICATION = "application",
    CUSTOM = "custom"
}
/**
 * Time series data point
 */
export interface DataPoint {
    /** Data point timestamp */
    timestamp: Date;
    /** Data point value */
    value: number;
    /** Data point tags */
    tags?: Record<string, string>;
}
/**
 * Time series interface
 */
export interface TimeSeries {
    /** Series name */
    name: string;
    /** Series data points */
    dataPoints: DataPoint[];
    /** Series metadata */
    metadata: TimeSeriesMetadata;
}
/**
 * Time series metadata
 */
export interface TimeSeriesMetadata {
    /** Series unit */
    unit: string;
    /** Series description */
    description: string;
    /** Aggregation method */
    aggregation: AggregationMethod;
    /** Retention period in days */
    retentionPeriod: number;
    /** Sample interval in milliseconds */
    sampleInterval: number;
}
/**
 * Aggregation methods
 */
export declare enum AggregationMethod {
    AVERAGE = "average",
    SUM = "sum",
    MIN = "min",
    MAX = "max",
    COUNT = "count",
    RATE = "rate",
    PERCENTILE = "percentile"
}
/**
 * Alert rule interface
 */
export interface AlertRule {
    /** Rule identifier */
    id: string;
    /** Rule name */
    name: string;
    /** Rule description */
    description: string;
    /** Rule enabled */
    enabled: boolean;
    /** Alert condition */
    condition: AlertCondition;
    /** Alert severity */
    severity: MetricSeverity;
    /** Alert channels */
    channels: string[];
    /** Alert configuration */
    config: AlertConfiguration;
    /** Rule metadata */
    metadata: Record<string, any>;
}
/**
 * Alert condition
 */
export interface AlertCondition {
    /** Metric to monitor */
    metric: string;
    /** Comparison operator */
    operator: ComparisonOperator;
    /** Threshold value */
    threshold: number;
    /** Time window in milliseconds */
    timeWindow: number;
    /** Evaluation frequency in milliseconds */
    evaluationFrequency: number;
    /** Data aggregation method */
    aggregation: AggregationMethod;
}
/**
 * Comparison operators
 */
export declare enum ComparisonOperator {
    GREATER_THAN = "gt",
    GREATER_THAN_OR_EQUAL = "gte",
    LESS_THAN = "lt",
    LESS_THAN_OR_EQUAL = "lte",
    EQUALS = "eq",
    NOT_EQUALS = "ne",
    CONTAINS = "contains",
    MATCHES = "matches"
}
/**
 * Alert configuration
 */
export interface AlertConfiguration {
    /** Cooldown period in milliseconds */
    cooldownPeriod: number;
    /** Maximum alerts per time window */
    maxAlertsPerWindow: number;
    /** Alert grouping settings */
    grouping: AlertGrouping;
    /** Auto-resolution settings */
    autoResolution: AutoResolution;
    /** Escalation settings */
    escalation: EscalationSettings;
}
/**
 * Alert grouping settings
 */
export interface AlertGrouping {
    /** Enable alert grouping */
    enabled: boolean;
    /** Grouping keys */
    keys: string[];
    /** Group timeout in milliseconds */
    timeout: number;
    /** Maximum group size */
    maxSize: number;
}
/**
 * Auto-resolution settings
 */
export interface AutoResolution {
    /** Enable auto-resolution */
    enabled: boolean;
    /** Resolution timeout in milliseconds */
    timeout: number;
    /** Resolution condition */
    condition?: AlertCondition;
}
/**
 * Escalation settings
 */
export interface EscalationSettings {
    /** Enable escalation */
    enabled: boolean;
    /** Escalation steps */
    steps: EscalationStep[];
    /** Maximum escalation level */
    maxLevel: number;
}
/**
 * Escalation step
 */
export interface EscalationStep {
    /** Step level */
    level: number;
    /** Step delay in milliseconds */
    delay: number;
    /** Step channels */
    channels: string[];
    /** Step condition */
    condition?: AlertCondition;
}
/**
 * Alert instance
 */
export interface Alert {
    /** Alert identifier */
    id: string;
    /** Alert rule ID */
    ruleId: string;
    /** Alert status */
    status: AlertStatus;
    /** Alert severity */
    severity: MetricSeverity;
    /** Alert message */
    message: string;
    /** Alert details */
    details: AlertDetails;
    /** Alert timestamps */
    timestamps: AlertTimestamps;
    /** Alert acknowledgment */
    acknowledgment?: AlertAcknowledgment;
    /** Alert resolution */
    resolution?: AlertResolution;
}
/**
 * Alert details
 */
export interface AlertDetails {
    /** Triggering metric */
    metric: Metric;
    /** Alert context */
    context: AlertContext;
    /** Related entities */
    relatedEntities: RelatedEntity[];
    /** Alert annotations */
    annotations: Record<string, string>;
}
/**
 * Alert context
 */
export interface AlertContext {
    /** Task ID if alert is task-related */
    taskId?: TaskId;
    /** Agent ID if alert is agent-related */
    agentId?: AgentId;
    /** Execution ID if alert is execution-related */
    executionId?: ExecutionId;
    /** System component */
    component?: string;
    /** Alert environment */
    environment: string;
}
/**
 * Related entity
 */
export interface RelatedEntity {
    /** Entity type */
    type: string;
    /** Entity ID */
    id: string;
    /** Entity name */
    name: string;
    /** Relationship type */
    relationship: string;
}
/**
 * Alert timestamps
 */
export interface AlertTimestamps {
    /** Alert creation time */
    createdAt: Date;
    /** Alert trigger time */
    triggeredAt: Date;
    /** Alert acknowledgment time */
    acknowledgedAt?: Date;
    /** Alert resolution time */
    resolvedAt?: Date;
    /** Alert last update time */
    updatedAt: Date;
}
/**
 * Alert acknowledgment
 */
export interface AlertAcknowledgment {
    /** Who acknowledged the alert */
    acknowledgedBy: string;
    /** Acknowledgment timestamp */
    acknowledgedAt: Date;
    /** Acknowledgment notes */
    notes?: string;
    /** Acknowledgment timeout */
    timeout?: number;
}
/**
 * Alert resolution
 */
export interface AlertResolution {
    /** Who resolved the alert */
    resolvedBy: string;
    /** Resolution timestamp */
    resolvedAt: Date;
    /** Resolution method */
    method: ResolutionMethod;
    /** Resolution notes */
    notes?: string;
    /** Resolution actions taken */
    actions?: string[];
}
/**
 * Resolution methods
 */
export declare enum ResolutionMethod {
    MANUAL = "manual",
    AUTOMATIC = "automatic",
    TIMEOUT = "timeout",
    SYSTEM = "system"
}
/**
 * Dashboard interface
 */
export interface Dashboard {
    /** Dashboard identifier */
    id: string;
    /** Dashboard name */
    name: string;
    /** Dashboard description */
    description: string;
    /** Dashboard widgets */
    widgets: Widget[];
    /** Dashboard layout */
    layout: DashboardLayout;
    /** Dashboard configuration */
    config: DashboardConfiguration;
    /** Dashboard metadata */
    metadata: Record<string, any>;
}
/**
 * Dashboard widget
 */
export interface Widget {
    /** Widget identifier */
    id: string;
    /** Widget type */
    type: WidgetType;
    /** Widget title */
    title: string;
    /** Widget configuration */
    config: WidgetConfiguration;
    /** Widget position */
    position: WidgetPosition;
    /** Widget data source */
    dataSource: DataSource;
}
/**
 * Widget types
 */
export declare enum WidgetType {
    LINE_CHART = "line_chart",
    BAR_CHART = "bar_chart",
    PIE_CHART = "pie_chart",
    GAUGE = "gauge",
    TABLE = "table",
    STAT = "stat",
    LOG_PANEL = "log_panel",
    ALERT_LIST = "alert_list",
    HEATMAP = "heatmap"
}
/**
 * Widget configuration
 */
export interface WidgetConfiguration {
    /** Widget height */
    height: number;
    /** Widget width */
    width: number;
    /** Refresh interval in milliseconds */
    refreshInterval: number;
    /** Time range */
    timeRange: TimeRange;
    /** Display options */
    displayOptions: DisplayOptions;
    /** Custom configuration */
    customConfig: Record<string, any>;
}
/**
 * Widget position
 */
export interface WidgetPosition {
    /** X coordinate */
    x: number;
    /** Y coordinate */
    y: number;
    /** Grid width */
    w: number;
    /** Grid height */
    h: number;
}
/**
 * Data source
 */
export interface DataSource {
    /** Data source type */
    type: DataSourceType;
    /** Data source configuration */
    config: DataSourceConfiguration;
    /** Data query */
    query: DataQuery;
}
/**
 * Data source types
 */
export declare enum DataSourceType {
    METRICS = "metrics",
    LOGS = "logs",
    TRACES = "traces",
    EVENTS = "events",
    EXTERNAL = "external"
}
/**
 * Data source configuration
 */
export interface DataSourceConfiguration {
    /** Connection settings */
    connection: ConnectionSettings;
    /** Authentication settings */
    authentication: AuthenticationSettings;
    /** Caching settings */
    caching: CachingSettings;
}
/**
 * Connection settings
 */
export interface ConnectionSettings {
    /** Connection URL */
    url: string;
    /** Connection timeout in milliseconds */
    timeout: number;
    /** Retry settings */
    retry: RetrySettings;
}
/**
 * Authentication settings
 */
export interface AuthenticationSettings {
    /** Authentication type */
    type: AuthenticationType;
    /** Credentials */
    credentials: Record<string, string>;
    /** Token settings */
    tokenSettings?: TokenSettings;
}
/**
 * Authentication types
 */
export declare enum AuthenticationType {
    NONE = "none",
    BASIC = "basic",
    BEARER = "bearer",
    API_KEY = "api_key",
    OAUTH = "oauth"
}
/**
 * Token settings
 */
export interface TokenSettings {
    /** Token refresh interval in milliseconds */
    refreshInterval: number;
    /** Token expiry buffer in milliseconds */
    expiryBuffer: number;
}
/**
 * Caching settings
 */
export interface CachingSettings {
    /** Enable caching */
    enabled: boolean;
    /** Cache TTL in milliseconds */
    ttl: number;
    /** Maximum cache size */
    maxSize: number;
}
/**
 * Retry settings
 */
export interface RetrySettings {
    /** Maximum retry attempts */
    maxAttempts: number;
    /** Initial delay in milliseconds */
    initialDelay: number;
    /** Delay multiplier */
    delayMultiplier: number;
    /** Maximum delay in milliseconds */
    maxDelay: number;
}
/**
 * Data query
 */
export interface DataQuery {
    /** Query expression */
    expression: string;
    /** Query parameters */
    parameters: Record<string, any>;
    /** Time range */
    timeRange: TimeRange;
    /** Aggregation settings */
    aggregation?: AggregationSettings;
}
/**
 * Time range
 */
export interface TimeRange {
    /** Start time */
    from: Date;
    /** End time */
    to: Date;
    /** Relative time range */
    relative?: RelativeTimeRange;
}
/**
 * Relative time range
 */
export interface RelativeTimeRange {
    /** Duration value */
    value: number;
    /** Duration unit */
    unit: TimeUnit;
    /** From now */
    fromNow: boolean;
}
/**
 * Time units
 */
export declare enum TimeUnit {
    SECOND = "second",
    MINUTE = "minute",
    HOUR = "hour",
    DAY = "day",
    WEEK = "week",
    MONTH = "month",
    YEAR = "year"
}
/**
 * Aggregation settings
 */
export interface AggregationSettings {
    /** Aggregation method */
    method: AggregationMethod;
    /** Aggregation interval */
    interval: string;
    /** Group by fields */
    groupBy: string[];
}
/**
 * Dashboard layout
 */
export interface DashboardLayout {
    /** Layout type */
    type: LayoutType;
    /** Grid settings */
    grid: GridSettings;
    /** Responsive settings */
    responsive: ResponsiveSettings;
}
/**
 * Layout types
 */
export declare enum LayoutType {
    GRID = "grid",
    FLOW = "flow",
    FIXED = "fixed"
}
/**
 * Grid settings
 */
export interface GridSettings {
    /** Grid columns */
    columns: number;
    /** Grid rows */
    rows: number;
    /** Grid gap */
    gap: number;
}
/**
 * Responsive settings
 */
export interface ResponsiveSettings {
    /** Enable responsive layout */
    enabled: boolean;
    /** Breakpoints */
    breakpoints: Breakpoint[];
}
/**
 * Breakpoint
 */
export interface Breakpoint {
    /** Breakpoint name */
    name: string;
    /** Breakpoint width */
    width: number;
    /** Breakpoint columns */
    columns: number;
}
/**
 * Dashboard configuration
 */
export interface DashboardConfiguration {
    /** Auto-refresh enabled */
    autoRefresh: boolean;
    /** Default refresh interval in milliseconds */
    defaultRefreshInterval: number;
    /** Time zone */
    timeZone: string;
    /** Theme */
    theme: string;
    /** Sharing settings */
    sharing: SharingSettings;
}
/**
 * Sharing settings
 */
export interface SharingSettings {
    /** Public access enabled */
    publicAccess: boolean;
    /** Access permissions */
    permissions: AccessPermission[];
    /** Share links */
    shareLinks: ShareLink[];
}
/**
 * Access permission
 */
export interface AccessPermission {
    /** User or role */
    principal: string;
    /** Permission level */
    level: PermissionLevel;
}
/**
 * Permission levels
 */
export declare enum PermissionLevel {
    VIEW = "view",
    EDIT = "edit",
    ADMIN = "admin"
}
/**
 * Share link
 */
export interface ShareLink {
    /** Link identifier */
    id: string;
    /** Link URL */
    url: string;
    /** Link expiry */
    expiresAt?: Date;
    /** Link permissions */
    permissions: PermissionLevel;
}
/**
 * Display options
 */
export interface DisplayOptions {
    /** Show legend */
    showLegend: boolean;
    /** Show tooltips */
    showTooltips: boolean;
    /** Color scheme */
    colorScheme: string;
    /** Animation enabled */
    animation: boolean;
    /** Custom styling */
    styling: Record<string, any>;
}
/**
 * Monitoring configuration
 */
export interface MonitoringConfiguration {
    /** Metrics collection settings */
    metrics: MetricsConfiguration;
    /** Alerting settings */
    alerting: AlertingConfiguration;
    /** Dashboard settings */
    dashboards: DashboardsConfiguration;
    /** Retention settings */
    retention: RetentionConfiguration;
}
/**
 * Metrics configuration
 */
export interface MetricsConfiguration {
    /** Collection interval in milliseconds */
    collectionInterval: number;
    /** Enabled metric types */
    enabledMetrics: MetricType[];
    /** Custom metrics */
    customMetrics: CustomMetric[];
    /** Metric filters */
    filters: MetricFilter[];
}
/**
 * Custom metric
 */
export interface CustomMetric {
    /** Metric name */
    name: string;
    /** Metric type */
    type: MetricType;
    /** Collection function */
    collector: () => Promise<number>;
    /** Collection interval in milliseconds */
    interval: number;
}
/**
 * Metric filter
 */
export interface MetricFilter {
    /** Filter name */
    name: string;
    /** Filter pattern */
    pattern: string;
    /** Filter action */
    action: FilterAction;
}
/**
 * Filter actions
 */
export declare enum FilterAction {
    INCLUDE = "include",
    EXCLUDE = "exclude",
    TRANSFORM = "transform"
}
/**
 * Alerting configuration
 */
export interface AlertingConfiguration {
    /** Alert evaluation interval in milliseconds */
    evaluationInterval: number;
    /** Default alert channels */
    defaultChannels: string[];
    /** Alert history retention in days */
    historyRetention: number;
    /** Notification settings */
    notifications: NotificationConfiguration;
}
/**
 * Notification configuration
 */
export interface NotificationConfiguration {
    /** Notification channels */
    channels: NotificationChannel[];
    /** Rate limiting settings */
    rateLimiting: RateLimitingConfiguration;
}
/**
 * Notification channel
 */
export interface NotificationChannel {
    /** Channel name */
    name: string;
    /** Channel type */
    type: ChannelType;
    /** Channel configuration */
    config: Record<string, any>;
    /** Channel enabled */
    enabled: boolean;
}
/**
 * Channel types
 */
export declare enum ChannelType {
    EMAIL = "email",
    SLACK = "slack",
    WEBHOOK = "webhook",
    SMS = "sms",
    CONSOLE = "console"
}
/**
 * Rate limiting configuration
 */
export interface RateLimitingConfiguration {
    /** Enable rate limiting */
    enabled: boolean;
    /** Maximum notifications per hour */
    maxPerHour: number;
    /** Burst allowance */
    burstAllowance: number;
}
/**
 * Dashboards configuration
 */
export interface DashboardsConfiguration {
    /** Default dashboard */
    defaultDashboard: string;
    /** Auto-save enabled */
    autoSave: boolean;
    /** Dashboard versioning */
    versioning: boolean;
}
/**
 * Retention configuration
 */
export interface RetentionConfiguration {
    /** Metrics retention in days */
    metrics: number;
    /** Alerts retention in days */
    alerts: number;
    /** Logs retention in days */
    logs: number;
    /** Traces retention in days */
    traces: number;
}
