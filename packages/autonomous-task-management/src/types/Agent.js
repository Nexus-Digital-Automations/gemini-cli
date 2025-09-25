/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Agent status enumeration
 */
export var AgentStatus;
(function (AgentStatus) {
    AgentStatus["INITIALIZING"] = "initializing";
    AgentStatus["IDLE"] = "idle";
    AgentStatus["ACTIVE"] = "active";
    AgentStatus["BUSY"] = "busy";
    AgentStatus["BLOCKED"] = "blocked";
    AgentStatus["ERROR"] = "error";
    AgentStatus["OFFLINE"] = "offline";
    AgentStatus["TERMINATED"] = "terminated";
})(AgentStatus || (AgentStatus = {}));
/**
 * Agent specialization types
 */
export var AgentSpecialization;
(function (AgentSpecialization) {
    AgentSpecialization["GENERALIST"] = "generalist";
    AgentSpecialization["FRONTEND"] = "frontend";
    AgentSpecialization["BACKEND"] = "backend";
    AgentSpecialization["TESTING"] = "testing";
    AgentSpecialization["SECURITY"] = "security";
    AgentSpecialization["PERFORMANCE"] = "performance";
    AgentSpecialization["DOCUMENTATION"] = "documentation";
    AgentSpecialization["ARCHITECTURE"] = "architecture";
    AgentSpecialization["DEVOPS"] = "devops";
    AgentSpecialization["DATABASE"] = "database";
    AgentSpecialization["MONITORING"] = "monitoring";
    AgentSpecialization["VALIDATION"] = "validation";
    AgentSpecialization["INTEGRATION"] = "integration";
    AgentSpecialization["RESEARCH"] = "research";
})(AgentSpecialization || (AgentSpecialization = {}));
/**
 * Agent capability levels
 */
export var CapabilityLevel;
(function (CapabilityLevel) {
    CapabilityLevel["BASIC"] = "basic";
    CapabilityLevel["INTERMEDIATE"] = "intermediate";
    CapabilityLevel["ADVANCED"] = "advanced";
    CapabilityLevel["EXPERT"] = "expert";
    CapabilityLevel["SPECIALIST"] = "specialist";
})(CapabilityLevel || (CapabilityLevel = {}));
/**
 * Communication style enumeration
 */
export var CommunicationStyle;
(function (CommunicationStyle) {
    CommunicationStyle["MINIMAL"] = "minimal";
    CommunicationStyle["CONCISE"] = "concise";
    CommunicationStyle["DETAILED"] = "detailed";
    CommunicationStyle["VERBOSE"] = "verbose";
    CommunicationStyle["TECHNICAL"] = "technical";
    CommunicationStyle["CASUAL"] = "casual";
})(CommunicationStyle || (CommunicationStyle = {}));
/**
 * Agent actions for history tracking
 */
export var AgentAction;
(function (AgentAction) {
    AgentAction["INITIALIZED"] = "initialized";
    AgentAction["STARTED"] = "started";
    AgentAction["STOPPED"] = "stopped";
    AgentAction["TASK_ASSIGNED"] = "task_assigned";
    AgentAction["TASK_STARTED"] = "task_started";
    AgentAction["TASK_COMPLETED"] = "task_completed";
    AgentAction["TASK_FAILED"] = "task_failed";
    AgentAction["STATUS_CHANGED"] = "status_changed";
    AgentAction["ERROR_OCCURRED"] = "error_occurred";
    AgentAction["HEARTBEAT"] = "heartbeat";
    AgentAction["SESSION_EXPIRED"] = "session_expired";
    AgentAction["CONFIGURATION_CHANGED"] = "configuration_changed";
})(AgentAction || (AgentAction = {}));
/**
 * Agent sort fields
 */
export var AgentSortField;
(function (AgentSortField) {
    AgentSortField["NAME"] = "name";
    AgentSortField["STATUS"] = "status";
    AgentSortField["SPECIALIZATION"] = "specialization";
    AgentSortField["CREATED_AT"] = "createdAt";
    AgentSortField["LAST_ACTIVITY"] = "lastActivityAt";
    AgentSortField["SUCCESS_RATE"] = "successRate";
    AgentSortField["PERFORMANCE_RATING"] = "performanceRating";
})(AgentSortField || (AgentSortField = {}));
//# sourceMappingURL=Agent.js.map