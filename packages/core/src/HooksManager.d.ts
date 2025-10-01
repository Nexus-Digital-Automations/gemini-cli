/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { HookEvent } from './types.js';
import type { HookConfig, HookExecutionResult, HookContext } from './types.js';
/**
 * Manager for executing lifecycle hooks at key points in the application.
 * Handles hook configuration, filtering, execution, and response processing.
 *
 * @example
 * ```typescript
 * const manager = new HooksManager(settings.hooks?.hooks || []);
 *
 * // Execute PreToolUse hooks
 * const results = await manager.executeHooks(HookEvent.PreToolUse, {
 *   sessionId: 'session-123',
 *   workspaceDir: '/workspace',
 *   toolName: 'Bash',
 *   toolInput: { command: 'ls' }
 * });
 *
 * // Check if any hook blocked execution
 * const blocked = results.some(r => r.response?.block);
 * ```
 */
export declare class HooksManager {
    private readonly hooks;
    /**
     * Creates a new HooksManager with the provided hook configurations.
     *
     * @param hooks - Array of hook configurations to manage
     */
    constructor(hooks: HookConfig[]);
    /**
     * Filters hooks by event type and matcher pattern.
     *
     * @param event - The event type to filter by
     * @param toolName - Optional tool name to match against hook matchers
     * @returns Array of matching hook configurations
     */
    private filterHooks;
    /**
     * Constructs the JSON payload to send to hook commands via stdin.
     *
     * @param event - The event that triggered the hook
     * @param context - Contextual information for the event
     * @returns JSON payload object
     */
    private buildPayload;
    /**
     * Executes a single hook command with the provided payload.
     *
     * @param hook - The hook configuration to execute
     * @param payload - The JSON payload to send to the hook command
     * @returns Promise resolving to the hook execution result
     */
    private executeHook;
    /**
     * Executes all hooks that match the given event and context.
     * Runs hooks sequentially in the order they are configured.
     *
     * @param event - The lifecycle event that occurred
     * @param context - Contextual information about the event
     * @returns Promise resolving to array of execution results
     *
     * @example
     * ```typescript
     * const results = await manager.executeHooks(HookEvent.PreToolUse, {
     *   sessionId: 'abc123',
     *   workspaceDir: '/project',
     *   toolName: 'Bash',
     *   toolInput: { command: 'npm test' }
     * });
     *
     * // Check if any hook blocked the operation
     * const blocked = results.some(r => r.success && r.response?.block);
     * if (blocked) {
     *   const blockMessage = results.find(r => r.response?.block)?.response?.message;
     *   throw new Error(`Operation blocked by hook: ${blockMessage}`);
     * }
     * ```
     */
    executeHooks(event: HookEvent, context: HookContext): Promise<HookExecutionResult[]>;
    /**
     * Checks if any hook results indicate the operation should be blocked.
     *
     * @param results - Array of hook execution results
     * @returns Object with blocked status and optional message
     */
    static isBlocked(results: HookExecutionResult[]): {
        blocked: boolean;
        message?: string;
    };
    /**
     * Extracts modified tool input from hook results.
     * Returns the first modification found, or undefined if no modifications.
     *
     * @param results - Array of hook execution results
     * @returns Modified tool input, or undefined
     */
    static getModifiedInput(results: HookExecutionResult[]): unknown | undefined;
    /**
     * Gets all messages from hook results.
     *
     * @param results - Array of hook execution results
     * @returns Array of messages from hooks
     */
    static getMessages(results: HookExecutionResult[]): string[];
}
