/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Budget enforcement levels
 */
export var BudgetEnforcementLevel;
(function (BudgetEnforcementLevel) {
    /** Only show warnings, don't block usage */
    BudgetEnforcementLevel["WARNING_ONLY"] = "warning_only";
    /** Block usage at hard limits */
    BudgetEnforcementLevel["STRICT"] = "strict";
    /** Allow brief overages with strong warnings */
    BudgetEnforcementLevel["SOFT_LIMIT"] = "soft_limit";
    /** No enforcement, tracking only */
    BudgetEnforcementLevel["TRACKING_ONLY"] = "tracking_only";
})(BudgetEnforcementLevel || (BudgetEnforcementLevel = {}));
/**
 * Notification frequency options
 */
export var NotificationFrequency;
(function (NotificationFrequency) {
    /** Immediate notifications */
    NotificationFrequency["IMMEDIATE"] = "immediate";
    /** Hourly digest */
    NotificationFrequency["HOURLY"] = "hourly";
    /** Daily digest */
    NotificationFrequency["DAILY"] = "daily";
    /** Weekly digest */
    NotificationFrequency["WEEKLY"] = "weekly";
})(NotificationFrequency || (NotificationFrequency = {}));
/**
 * Budget event types for the event system
 */
export var BudgetEventType;
(function (BudgetEventType) {
    /** Budget limit exceeded */
    BudgetEventType["LIMIT_EXCEEDED"] = "limit_exceeded";
    /** Warning threshold reached */
    BudgetEventType["WARNING_THRESHOLD"] = "warning_threshold";
    /** Budget reset occurred */
    BudgetEventType["BUDGET_RESET"] = "budget_reset";
    /** Usage updated */
    BudgetEventType["USAGE_UPDATED"] = "usage_updated";
    /** Settings changed */
    BudgetEventType["SETTINGS_CHANGED"] = "settings_changed";
    /** Cost calculated */
    BudgetEventType["COST_CALCULATED"] = "cost_calculated";
    /** Session started */
    BudgetEventType["SESSION_STARTED"] = "session_started";
    /** Session ended */
    BudgetEventType["SESSION_ENDED"] = "session_ended";
})(BudgetEventType || (BudgetEventType = {}));
/**
 * Event severity levels
 */
export var EventSeverity;
(function (EventSeverity) {
    /** Informational event */
    EventSeverity["INFO"] = "info";
    /** Warning event */
    EventSeverity["WARNING"] = "warning";
    /** Error event */
    EventSeverity["ERROR"] = "error";
    /** Critical event */
    EventSeverity["CRITICAL"] = "critical";
})(EventSeverity || (EventSeverity = {}));
/**
 * Budget permission levels
 */
export var BudgetPermission;
(function (BudgetPermission) {
    /** View budget information */
    BudgetPermission["VIEW_BUDGET"] = "view_budget";
    /** Modify budget settings */
    BudgetPermission["MODIFY_SETTINGS"] = "modify_settings";
    /** View usage statistics */
    BudgetPermission["VIEW_USAGE"] = "view_usage";
    /** Reset budget */
    BudgetPermission["RESET_BUDGET"] = "reset_budget";
    /** Access historical data */
    BudgetPermission["VIEW_HISTORY"] = "view_history";
    /** Administrative access */
    BudgetPermission["ADMIN"] = "admin";
})(BudgetPermission || (BudgetPermission = {}));
/**
 * Budget recommendation types
 */
export var BudgetRecommendationType;
(function (BudgetRecommendationType) {
    /** Reduce spending in specific area */
    BudgetRecommendationType["COST_REDUCTION"] = "cost_reduction";
    /** Optimize resource allocation */
    BudgetRecommendationType["OPTIMIZATION"] = "optimization";
    /** Increase budget limit */
    BudgetRecommendationType["BUDGET_INCREASE"] = "budget_increase";
    /** Change usage patterns */
    BudgetRecommendationType["USAGE_PATTERN"] = "usage_pattern";
    /** Emergency action required */
    BudgetRecommendationType["EMERGENCY"] = "emergency";
    /** Performance improvement */
    BudgetRecommendationType["PERFORMANCE"] = "performance";
    /** Security related */
    BudgetRecommendationType["SECURITY"] = "security";
})(BudgetRecommendationType || (BudgetRecommendationType = {}));
/**
 * Budget risk categories
 */
export var BudgetRiskCategory;
(function (BudgetRiskCategory) {
    /** Low risk situation */
    BudgetRiskCategory["LOW"] = "low";
    /** Medium risk situation */
    BudgetRiskCategory["MEDIUM"] = "medium";
    /** High risk situation */
    BudgetRiskCategory["HIGH"] = "high";
    /** Critical risk situation */
    BudgetRiskCategory["CRITICAL"] = "critical";
    /** Unknown risk level */
    BudgetRiskCategory["UNKNOWN"] = "unknown";
})(BudgetRiskCategory || (BudgetRiskCategory = {}));
//# sourceMappingURL=types.js.map