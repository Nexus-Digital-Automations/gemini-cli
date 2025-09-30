/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { spawn } from 'node:child_process';
import type { HookEvent } from './types.js';
import type {
  HookConfig,
  HookPayload,
  HookResponse,
  HookExecutionResult,
  HookContext,
} from './types.js';

/**
 * Maximum time in milliseconds to wait for a hook to complete.
 * Hooks that exceed this timeout will be terminated.
 */
const HOOK_TIMEOUT_MS = 30000; // 30 seconds

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
export class HooksManager {
  private readonly hooks: HookConfig[];

  /**
   * Creates a new HooksManager with the provided hook configurations.
   *
   * @param hooks - Array of hook configurations to manage
   */
  constructor(hooks: HookConfig[]) {
    this.hooks = hooks.filter((h) => h.enabled !== false);
  }

  /**
   * Filters hooks by event type and matcher pattern.
   *
   * @param event - The event type to filter by
   * @param toolName - Optional tool name to match against hook matchers
   * @returns Array of matching hook configurations
   */
  private filterHooks(event: HookEvent, toolName?: string): HookConfig[] {
    return this.hooks.filter((hook) => {
      // Check if event matches
      if (hook.event !== event && hook.event !== event.toString()) {
        return false;
      }

      // If no matcher specified, hook matches all tools for this event
      if (!hook.matcher) {
        return true;
      }

      // If no tool name provided, we can't match against matcher
      if (!toolName) {
        return !hook.matcher; // Only match if no matcher specified
      }

      // Check if tool name matches the matcher pattern
      // Matcher can be: exact match "Bash" or pipe-separated alternatives "Bash|FileEdit"
      const patterns = hook.matcher.split('|').map((p) => p.trim());
      return patterns.some((pattern) => {
        if (pattern === '*') return true; // Wildcard matches all
        if (pattern === toolName) return true; // Exact match
        // Could add glob pattern matching here in the future
        return false;
      });
    });
  }

  /**
   * Constructs the JSON payload to send to hook commands via stdin.
   *
   * @param event - The event that triggered the hook
   * @param context - Contextual information for the event
   * @returns JSON payload object
   */
  private buildPayload(event: HookEvent, context: HookContext): HookPayload {
    return {
      event: event.toString(),
      tool_name: context.toolName,
      tool_input: context.toolInput,
      tool_output: context.toolOutput,
      session_id: context.sessionId,
      workspace_dir: context.workspaceDir,
      timestamp: new Date().toISOString(),
      context: context.context,
    };
  }

  /**
   * Executes a single hook command with the provided payload.
   *
   * @param hook - The hook configuration to execute
   * @param payload - The JSON payload to send to the hook command
   * @returns Promise resolving to the hook execution result
   */
  private async executeHook(
    hook: HookConfig,
    payload: HookPayload,
  ): Promise<HookExecutionResult> {
    const startTime = Date.now();

    return new Promise((resolve) => {
      let childProcess: ReturnType<typeof spawn> | null = null;

      const timeoutId = setTimeout(() => {
        if (childProcess && !childProcess.killed) {
          childProcess.kill();
        }
        resolve({
          success: false,
          error: `Hook timed out after ${HOOK_TIMEOUT_MS}ms`,
          duration_ms: Date.now() - startTime,
          hook,
        });
      }, HOOK_TIMEOUT_MS);

      // Parse command and arguments (simple split on spaces, could be enhanced)
      const [command, ...args] = hook.command.split(/\s+/);

      // Spawn the hook command
      childProcess = spawn(command, args, {
        shell: true,
        stdio: ['pipe', 'pipe', 'pipe'],
        env: {
          ...process.env,
          HOOK_EVENT: payload.event,
          HOOK_TOOL_NAME: payload.tool_name || '',
        },
      });

      let stdout = '';
      let stderr = '';

      // Collect stdout
      childProcess.stdout?.on('data', (data: Buffer) => {
        stdout += data.toString();
      });

      // Collect stderr
      childProcess.stderr?.on('data', (data: Buffer) => {
        stderr += data.toString();
      });

      // Handle process completion
      childProcess.on('close', (code) => {
        clearTimeout(timeoutId);
        const duration = Date.now() - startTime;

        // Try to parse JSON response from stdout
        let response: HookResponse | undefined;
        if (stdout.trim()) {
          try {
            response = JSON.parse(stdout) as HookResponse;
            if (response) {
              response.exit_code = code ?? 0;
            }
          } catch (_e) {
            // If stdout is not valid JSON, treat it as a message
            response = {
              message: stdout.trim(),
              exit_code: code ?? 0,
            };
          }
        }

        // Non-zero exit code indicates error
        if (code !== 0 && !response) {
          resolve({
            success: false,
            error: stderr || `Hook exited with code ${code}`,
            duration_ms: duration,
            hook,
          });
          return;
        }

        resolve({
          success: true,
          response,
          duration_ms: duration,
          hook,
        });
      });

      // Handle process error
      childProcess.on('error', (err) => {
        clearTimeout(timeoutId);
        resolve({
          success: false,
          error: err.message,
          duration_ms: Date.now() - startTime,
          hook,
        });
      });

      // Write payload to stdin and close
      try {
        childProcess.stdin?.write(JSON.stringify(payload, null, 2));
        childProcess.stdin?.end();
      } catch (err) {
        clearTimeout(timeoutId);
        resolve({
          success: false,
          error: `Failed to write payload to hook: ${err}`,
          duration_ms: Date.now() - startTime,
          hook,
        });
      }
    });
  }

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
  async executeHooks(
    event: HookEvent,
    context: HookContext,
  ): Promise<HookExecutionResult[]> {
    const matchingHooks = this.filterHooks(event, context.toolName);

    if (matchingHooks.length === 0) {
      return [];
    }

    const payload = this.buildPayload(event, context);
    const results: HookExecutionResult[] = [];

    // Execute hooks sequentially
    for (const hook of matchingHooks) {
      const result = await this.executeHook(hook, payload);
      results.push(result);

      // If a hook blocks, stop executing further hooks
      if (result.response?.block) {
        break;
      }
    }

    return results;
  }

  /**
   * Checks if any hook results indicate the operation should be blocked.
   *
   * @param results - Array of hook execution results
   * @returns Object with blocked status and optional message
   */
  static isBlocked(results: HookExecutionResult[]): {
    blocked: boolean;
    message?: string;
  } {
    const blockingResult = results.find((r) => r.success && r.response?.block);
    return {
      blocked: !!blockingResult,
      message: blockingResult?.response?.message,
    };
  }

  /**
   * Extracts modified tool input from hook results.
   * Returns the first modification found, or undefined if no modifications.
   *
   * @param results - Array of hook execution results
   * @returns Modified tool input, or undefined
   */
  static getModifiedInput(results: HookExecutionResult[]): unknown | undefined {
    const modification = results.find(
      (r) => r.success && r.response?.modify?.tool_input,
    );
    return modification?.response?.modify?.tool_input;
  }

  /**
   * Gets all messages from hook results.
   *
   * @param results - Array of hook execution results
   * @returns Array of messages from hooks
   */
  static getMessages(results: HookExecutionResult[]): string[] {
    return results
      .map((r) => r.response?.message || r.error)
      .filter((m): m is string => !!m);
  }
}
