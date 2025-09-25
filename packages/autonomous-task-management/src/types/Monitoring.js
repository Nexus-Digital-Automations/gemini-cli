/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Metric types enumeration
 */
export var MetricType;
(function (MetricType) {
    MetricType["COUNTER"] = "counter";
    MetricType["GAUGE"] = "gauge";
    MetricType["HISTOGRAM"] = "histogram";
    MetricType["TIMER"] = "timer";
    MetricType["RATE"] = "rate";
    MetricType["PERCENTAGE"] = "percentage";
})(MetricType || (MetricType = {}));
/**
 * Metric severity levels
 */
export var MetricSeverity;
(function (MetricSeverity) {
    MetricSeverity["INFO"] = "info";
    MetricSeverity["WARNING"] = "warning";
    MetricSeverity["CRITICAL"] = "critical";
    MetricSeverity["EMERGENCY"] = "emergency";
})(MetricSeverity || (MetricSeverity = {}));
/**
 * Alert status enumeration
 */
export var AlertStatus;
(function (AlertStatus) {
    AlertStatus["ACTIVE"] = "active";
    AlertStatus["ACKNOWLEDGED"] = "acknowledged";
    AlertStatus["RESOLVED"] = "resolved";
    AlertStatus["SUPPRESSED"] = "suppressed";
})(AlertStatus || (AlertStatus = {}));
/**
 * Source types
 */
export var SourceType;
(function (SourceType) {
    SourceType["SYSTEM"] = "system";
    SourceType["TASK"] = "task";
    SourceType["AGENT"] = "agent";
    SourceType["QUEUE"] = "queue";
    SourceType["EXECUTION"] = "execution";
    SourceType["APPLICATION"] = "application";
    SourceType["CUSTOM"] = "custom";
})(SourceType || (SourceType = {}));
/**
 * Aggregation methods
 */
export var AggregationMethod;
(function (AggregationMethod) {
    AggregationMethod["AVERAGE"] = "average";
    AggregationMethod["SUM"] = "sum";
    AggregationMethod["MIN"] = "min";
    AggregationMethod["MAX"] = "max";
    AggregationMethod["COUNT"] = "count";
    AggregationMethod["RATE"] = "rate";
    AggregationMethod["PERCENTILE"] = "percentile";
})(AggregationMethod || (AggregationMethod = {}));
/**
 * Comparison operators
 */
export var ComparisonOperator;
(function (ComparisonOperator) {
    ComparisonOperator["GREATER_THAN"] = "gt";
    ComparisonOperator["GREATER_THAN_OR_EQUAL"] = "gte";
    ComparisonOperator["LESS_THAN"] = "lt";
    ComparisonOperator["LESS_THAN_OR_EQUAL"] = "lte";
    ComparisonOperator["EQUALS"] = "eq";
    ComparisonOperator["NOT_EQUALS"] = "ne";
    ComparisonOperator["CONTAINS"] = "contains";
    ComparisonOperator["MATCHES"] = "matches";
})(ComparisonOperator || (ComparisonOperator = {}));
/**
 * Resolution methods
 */
export var ResolutionMethod;
(function (ResolutionMethod) {
    ResolutionMethod["MANUAL"] = "manual";
    ResolutionMethod["AUTOMATIC"] = "automatic";
    ResolutionMethod["TIMEOUT"] = "timeout";
    ResolutionMethod["SYSTEM"] = "system";
})(ResolutionMethod || (ResolutionMethod = {}));
/**
 * Widget types
 */
export var WidgetType;
(function (WidgetType) {
    WidgetType["LINE_CHART"] = "line_chart";
    WidgetType["BAR_CHART"] = "bar_chart";
    WidgetType["PIE_CHART"] = "pie_chart";
    WidgetType["GAUGE"] = "gauge";
    WidgetType["TABLE"] = "table";
    WidgetType["STAT"] = "stat";
    WidgetType["LOG_PANEL"] = "log_panel";
    WidgetType["ALERT_LIST"] = "alert_list";
    WidgetType["HEATMAP"] = "heatmap";
})(WidgetType || (WidgetType = {}));
/**
 * Data source types
 */
export var DataSourceType;
(function (DataSourceType) {
    DataSourceType["METRICS"] = "metrics";
    DataSourceType["LOGS"] = "logs";
    DataSourceType["TRACES"] = "traces";
    DataSourceType["EVENTS"] = "events";
    DataSourceType["EXTERNAL"] = "external";
})(DataSourceType || (DataSourceType = {}));
/**
 * Authentication types
 */
export var AuthenticationType;
(function (AuthenticationType) {
    AuthenticationType["NONE"] = "none";
    AuthenticationType["BASIC"] = "basic";
    AuthenticationType["BEARER"] = "bearer";
    AuthenticationType["API_KEY"] = "api_key";
    AuthenticationType["OAUTH"] = "oauth";
})(AuthenticationType || (AuthenticationType = {}));
/**
 * Time units
 */
export var TimeUnit;
(function (TimeUnit) {
    TimeUnit["SECOND"] = "second";
    TimeUnit["MINUTE"] = "minute";
    TimeUnit["HOUR"] = "hour";
    TimeUnit["DAY"] = "day";
    TimeUnit["WEEK"] = "week";
    TimeUnit["MONTH"] = "month";
    TimeUnit["YEAR"] = "year";
})(TimeUnit || (TimeUnit = {}));
/**
 * Layout types
 */
export var LayoutType;
(function (LayoutType) {
    LayoutType["GRID"] = "grid";
    LayoutType["FLOW"] = "flow";
    LayoutType["FIXED"] = "fixed";
})(LayoutType || (LayoutType = {}));
/**
 * Permission levels
 */
export var PermissionLevel;
(function (PermissionLevel) {
    PermissionLevel["VIEW"] = "view";
    PermissionLevel["EDIT"] = "edit";
    PermissionLevel["ADMIN"] = "admin";
})(PermissionLevel || (PermissionLevel = {}));
/**
 * Filter actions
 */
export var FilterAction;
(function (FilterAction) {
    FilterAction["INCLUDE"] = "include";
    FilterAction["EXCLUDE"] = "exclude";
    FilterAction["TRANSFORM"] = "transform";
})(FilterAction || (FilterAction = {}));
/**
 * Channel types
 */
export var ChannelType;
(function (ChannelType) {
    ChannelType["EMAIL"] = "email";
    ChannelType["SLACK"] = "slack";
    ChannelType["WEBHOOK"] = "webhook";
    ChannelType["SMS"] = "sms";
    ChannelType["CONSOLE"] = "console";
})(ChannelType || (ChannelType = {}));
//# sourceMappingURL=Monitoring.js.map