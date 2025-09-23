/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {} from 'react';
export var AuthState;
(function (AuthState) {
    // Attemtping to authenticate or re-authenticate
    AuthState["Unauthenticated"] = "unauthenticated";
    // Auth dialog is open for user to select auth method
    AuthState["Updating"] = "updating";
    // Successfully authenticated
    AuthState["Authenticated"] = "authenticated";
})(AuthState || (AuthState = {}));
// Only defining the state enum needed by the UI
export var StreamingState;
(function (StreamingState) {
    StreamingState["Idle"] = "idle";
    StreamingState["Responding"] = "responding";
    StreamingState["WaitingForConfirmation"] = "waiting_for_confirmation";
})(StreamingState || (StreamingState = {}));
// Copied from server/src/core/turn.ts for CLI usage
export var GeminiEventType;
(function (GeminiEventType) {
    GeminiEventType["Content"] = "content";
    GeminiEventType["ToolCallRequest"] = "tool_call_request";
    // Add other event types if the UI hook needs to handle them
})(GeminiEventType || (GeminiEventType = {}));
export var ToolCallStatus;
(function (ToolCallStatus) {
    ToolCallStatus["Pending"] = "Pending";
    ToolCallStatus["Canceled"] = "Canceled";
    ToolCallStatus["Confirming"] = "Confirming";
    ToolCallStatus["Executing"] = "Executing";
    ToolCallStatus["Success"] = "Success";
    ToolCallStatus["Error"] = "Error";
})(ToolCallStatus || (ToolCallStatus = {}));
// Message types used by internal command feedback (subset of HistoryItem types)
export var MessageType;
(function (MessageType) {
    MessageType["INFO"] = "info";
    MessageType["ERROR"] = "error";
    MessageType["WARNING"] = "warning";
    MessageType["USER"] = "user";
    MessageType["ABOUT"] = "about";
    MessageType["HELP"] = "help";
    MessageType["STATS"] = "stats";
    MessageType["MODEL_STATS"] = "model_stats";
    MessageType["TOOL_STATS"] = "tool_stats";
    MessageType["QUIT"] = "quit";
    MessageType["GEMINI"] = "gemini";
    MessageType["COMPRESSION"] = "compression";
    MessageType["EXTENSIONS_LIST"] = "extensions_list";
})(MessageType || (MessageType = {}));
// Enhanced Progress Tracking Types
export var OperationType;
(function (OperationType) {
    OperationType["FileOperation"] = "file_operation";
    OperationType["NetworkOperation"] = "network_operation";
    OperationType["CodeAnalysis"] = "code_analysis";
    OperationType["BuildOperation"] = "build_operation";
    OperationType["TestOperation"] = "test_operation";
    OperationType["GitOperation"] = "git_operation";
    OperationType["PackageOperation"] = "package_operation";
    OperationType["SearchOperation"] = "search_operation";
    OperationType["GeneralOperation"] = "general_operation";
})(OperationType || (OperationType = {}));
export var ProgressState;
(function (ProgressState) {
    ProgressState["Initializing"] = "initializing";
    ProgressState["InProgress"] = "in_progress";
    ProgressState["Paused"] = "paused";
    ProgressState["Completing"] = "completing";
    ProgressState["Completed"] = "completed";
    ProgressState["Failed"] = "failed";
    ProgressState["Cancelled"] = "cancelled";
})(ProgressState || (ProgressState = {}));
//# sourceMappingURL=types.js.map