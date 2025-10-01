/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Lifecycle events that can trigger hooks.
 * These events occur at key points during tool execution and application lifecycle.
 */
export var HookEvent;
(function (HookEvent) {
    /**
     * Triggered before a tool is executed.
     * Hooks can validate, modify, or block the tool call.
     */
    HookEvent["PreToolUse"] = "PreToolUse";
    /**
     * Triggered after a tool has successfully executed.
     * Hooks can process the output, log results, or trigger follow-up actions.
     */
    HookEvent["PostToolUse"] = "PostToolUse";
    /**
     * Triggered when the application requires user attention.
     * For example, when a confirmation prompt is shown.
     */
    HookEvent["Notification"] = "Notification";
    /**
     * Triggered when the agent has completed its task and is about to exit.
     * Hooks can perform cleanup, validation, or prevent exit.
     */
    HookEvent["Stop"] = "Stop";
})(HookEvent || (HookEvent = {}));
//# sourceMappingURL=types.js.map