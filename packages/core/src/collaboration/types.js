/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Types of collaboration sessions
 */
export var SessionType;
(function (SessionType) {
    /** Real-time collaborative session with multiple active participants */
    SessionType["REALTIME"] = "realtime";
    /** Asynchronous session with context handoffs */
    SessionType["ASYNC"] = "async";
    /** Mentoring session with primary developer and observer */
    SessionType["MENTORING"] = "mentoring";
    /** Code review session */
    SessionType["REVIEW"] = "review";
    /** Debugging session focused on problem-solving */
    SessionType["DEBUG"] = "debug";
})(SessionType || (SessionType = {}));
/**
 * Participant roles in collaborative sessions
 */
export var ParticipantRole;
(function (ParticipantRole) {
    /** Primary driver with full edit access */
    ParticipantRole["DRIVER"] = "driver";
    /** Observer/navigator providing guidance */
    ParticipantRole["NAVIGATOR"] = "navigator";
    /** Session moderator managing the collaboration */
    ParticipantRole["MODERATOR"] = "moderator";
    /** Read-only observer */
    ParticipantRole["OBSERVER"] = "observer";
    /** Async participant who can receive/send context handoffs */
    ParticipantRole["ASYNC_PARTICIPANT"] = "async_participant";
})(ParticipantRole || (ParticipantRole = {}));
/**
 * Session status states
 */
export var SessionStatus;
(function (SessionStatus) {
    /** Session is being created */
    SessionStatus["INITIALIZING"] = "initializing";
    /** Session is active and accepting participants */
    SessionStatus["ACTIVE"] = "active";
    /** Session is paused temporarily */
    SessionStatus["PAUSED"] = "paused";
    /** Session is ending gracefully */
    SessionStatus["ENDING"] = "ending";
    /** Session has completed successfully */
    SessionStatus["COMPLETED"] = "completed";
    /** Session terminated due to error or timeout */
    SessionStatus["TERMINATED"] = "terminated";
})(SessionStatus || (SessionStatus = {}));
/**
 * Types of collaboration events
 */
export var CollaborationEventType;
(function (CollaborationEventType) {
    /** Participant joined the session */
    CollaborationEventType["PARTICIPANT_JOINED"] = "participant_joined";
    /** Participant left the session */
    CollaborationEventType["PARTICIPANT_LEFT"] = "participant_left";
    /** Code edit made by participant */
    CollaborationEventType["CODE_EDIT"] = "code_edit";
    /** Context shared between participants */
    CollaborationEventType["CONTEXT_SHARED"] = "context_shared";
    /** Conflict detected requiring resolution */
    CollaborationEventType["CONFLICT_DETECTED"] = "conflict_detected";
    /** Conflict resolved */
    CollaborationEventType["CONFLICT_RESOLVED"] = "conflict_resolved";
    /** Session role changed */
    CollaborationEventType["ROLE_CHANGED"] = "role_changed";
    /** Message sent in session */
    CollaborationEventType["MESSAGE_SENT"] = "message_sent";
    /** Session status changed */
    CollaborationEventType["STATUS_CHANGED"] = "status_changed";
    /** Recording started/stopped */
    CollaborationEventType["RECORDING_TOGGLED"] = "recording_toggled";
})(CollaborationEventType || (CollaborationEventType = {}));
/**
 * Conflict resolution strategies
 */
export var ConflictResolutionStrategy;
(function (ConflictResolutionStrategy) {
    /** Manual resolution required */
    ConflictResolutionStrategy["MANUAL"] = "manual";
    /** Automatic merge using last-write-wins */
    ConflictResolutionStrategy["LAST_WRITE_WINS"] = "last_write_wins";
    /** Automatic merge using most active participant */
    ConflictResolutionStrategy["MOST_ACTIVE_WINS"] = "most_active_wins";
    /** Automatic merge using role-based priority */
    ConflictResolutionStrategy["ROLE_PRIORITY"] = "role_priority";
    /** Create multiple versions for later resolution */
    ConflictResolutionStrategy["VERSION_BRANCHING"] = "version_branching";
})(ConflictResolutionStrategy || (ConflictResolutionStrategy = {}));
/**
 * Types of collaboration conflicts
 */
export var ConflictType;
(function (ConflictType) {
    /** Multiple edits to same code location */
    ConflictType["CODE_EDIT_CONFLICT"] = "code_edit_conflict";
    /** Context changes conflicting */
    ConflictType["CONTEXT_CONFLICT"] = "context_conflict";
    /** Role assignment conflicts */
    ConflictType["ROLE_CONFLICT"] = "role_conflict";
    /** Workspace access conflicts */
    ConflictType["WORKSPACE_CONFLICT"] = "workspace_conflict";
    /** Synchronization conflicts */
    ConflictType["SYNC_CONFLICT"] = "sync_conflict";
})(ConflictType || (ConflictType = {}));
/**
 * Conflict status
 */
export var ConflictStatus;
(function (ConflictStatus) {
    /** Conflict detected, pending resolution */
    ConflictStatus["PENDING"] = "pending";
    /** Resolution in progress */
    ConflictStatus["RESOLVING"] = "resolving";
    /** Conflict resolved successfully */
    ConflictStatus["RESOLVED"] = "resolved";
    /** Conflict resolution failed */
    ConflictStatus["FAILED"] = "failed";
})(ConflictStatus || (ConflictStatus = {}));
//# sourceMappingURL=types.js.map