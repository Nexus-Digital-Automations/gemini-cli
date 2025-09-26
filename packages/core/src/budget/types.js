/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Budget enforcement levels
 */
export let BudgetEnforcementLevel;
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
export let NotificationFrequency;
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
export let BudgetEventType;
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
export let EventSeverity;
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
export let BudgetPermission;
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
//# sourceMappingURL=types.js.map