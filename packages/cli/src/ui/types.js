/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {} from 'react';
/**
 * Represents the current authentication state of the user.
 * Used to track the user's authentication status throughout the application lifecycle.
 */
export let AuthState = {};
(function (AuthState) {
    /** User is not authenticated or authentication has failed */
    AuthState["Unauthenticated"] = "unauthenticated";
    /** Authentication dialog is open for user to select auth method */
    AuthState["Updating"] = "updating";
    /** User is successfully authenticated and ready to use the application */
    AuthState["Authenticated"] = "authenticated";
})(AuthState || (AuthState = {}));
/**
 * Represents the current streaming state of the LLM response.
 * Used to track the real-time status of conversation with the model.
 */
export let StreamingState = {};
(function (StreamingState) {
    /** No active streaming, ready for new input */
    StreamingState["Idle"] = "idle";
    /** LLM is currently generating and streaming a response */
    StreamingState["Responding"] = "responding";
    /** LLM response is complete but waiting for user confirmation before executing tools */
    StreamingState["WaitingForConfirmation"] = "waiting_for_confirmation";
})(StreamingState || (StreamingState = {}));
/**
 * Represents different types of events that can occur during Gemini model interaction.
 * Copied from server/src/core/turn.ts for CLI usage.
 */
export let GeminiEventType = {};
(function (GeminiEventType) {
    /** Standard content response from the model */
    GeminiEventType["Content"] = "content";
    /** Model is requesting to execute a tool/function call */
    GeminiEventType["ToolCallRequest"] = "tool_call_request";
    // Add other event types if the UI hook needs to handle them
})(GeminiEventType || (GeminiEventType = {}));
/**
 * Represents the current status of a tool call execution.
 * Used to track the lifecycle of tool/function calls from request to completion.
 */
export let ToolCallStatus = {};
(function (ToolCallStatus) {
    /** Tool call has been requested but not yet processed */
    ToolCallStatus["Pending"] = "Pending";
    /** Tool call was canceled before execution */
    ToolCallStatus["Canceled"] = "Canceled";
    /** Tool call is awaiting user confirmation before execution */
    ToolCallStatus["Confirming"] = "Confirming";
    /** Tool call is currently being executed */
    ToolCallStatus["Executing"] = "Executing";
    /** Tool call completed successfully */
    ToolCallStatus["Success"] = "Success";
    /** Tool call failed with an error */
    ToolCallStatus["Error"] = "Error";
})(ToolCallStatus || (ToolCallStatus = {}));
// Message types used by internal command feedback (subset of HistoryItem types)
export let MessageType = {};
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
// Enhanced Progress Tracking Types - re-exported from core package
export { OperationType, ProgressState, } from '@google/gemini-cli-core';
//# sourceMappingURL=types.js.map