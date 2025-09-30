/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Lifecycle events that can trigger hooks.
 * These events occur at key points during tool execution and application lifecycle.
 */
export enum HookEvent {
  /**
   * Triggered before a tool is executed.
   * Hooks can validate, modify, or block the tool call.
   */
  PreToolUse = 'PreToolUse',

  /**
   * Triggered after a tool has successfully executed.
   * Hooks can process the output, log results, or trigger follow-up actions.
   */
  PostToolUse = 'PostToolUse',

  /**
   * Triggered when the application requires user attention.
   * For example, when a confirmation prompt is shown.
   */
  Notification = 'Notification',

  /**
   * Triggered when the agent has completed its task and is about to exit.
   * Hooks can perform cleanup, validation, or prevent exit.
   */
  Stop = 'Stop',
}

/**
 * Configuration for a single hook.
 * Defines when the hook should run and what command to execute.
 */
export interface HookConfig {
  /** The lifecycle event that triggers this hook */
  event: HookEvent | string;

  /**
   * Optional matcher pattern for filtering when hooks run.
   * For tool events, this matches against the tool name (e.g., "Bash", "FileEdit", "Bash|FileEdit").
   * Supports exact matches and pipe-separated alternatives.
   */
  matcher?: string;

  /**
   * Shell command to execute when the hook is triggered.
   * The command receives a JSON payload on stdin and can return JSON on stdout.
   */
  command: string;

  /**
   * Whether this hook is currently enabled.
   * Disabled hooks are not executed.
   * @default true
   */
  enabled?: boolean;

  /**
   * Optional description of what this hook does.
   * Used for documentation and debugging.
   */
  description?: string;
}

/**
 * Complete hooks configuration for settings.
 * Contains all hooks defined at a particular settings scope.
 */
export interface HooksSettings {
  /** Array of hook configurations */
  hooks?: HookConfig[];
}

/**
 * Payload sent to hook commands via stdin.
 * Contains contextual information about the event that triggered the hook.
 */
export interface HookPayload {
  /** The event that triggered this hook */
  event: string;

  /** Name of the tool being executed (for tool events) */
  tool_name?: string;

  /** Parameters passed to the tool (for PreToolUse) */
  tool_input?: unknown;

  /** Result returned by the tool (for PostToolUse) */
  tool_output?: unknown;

  /** Unique identifier for the current session */
  session_id: string;

  /** Current working directory / workspace root */
  workspace_dir: string;

  /** ISO timestamp of when the event occurred */
  timestamp: string;

  /** Additional context specific to the event type */
  context?: Record<string, unknown>;
}

/**
 * Response returned by hook commands via stdout.
 * Hooks can return instructions to modify behavior or provide feedback.
 */
export interface HookResponse {
  /**
   * Whether to block the operation that triggered this hook.
   * For PreToolUse: prevents tool execution.
   * For Stop: prevents application exit.
   */
  block?: boolean;

  /**
   * Modifications to apply to the operation.
   */
  modify?: {
    /** Modified tool input parameters (for PreToolUse hooks) */
    tool_input?: unknown;
  };

  /**
   * Optional message to display to the user or log.
   * Used for errors, warnings, or informational messages.
   */
  message?: string;

  /**
   * Exit code from the hook command.
   * Non-zero exit codes can be interpreted as errors.
   */
  exit_code?: number;
}

/**
 * Result of executing a hook.
 * Contains the parsed response and execution metadata.
 */
export interface HookExecutionResult {
  /** Whether the hook executed successfully */
  success: boolean;

  /** Parsed response from the hook (if any) */
  response?: HookResponse;

  /** Error message if execution failed */
  error?: string;

  /** Execution time in milliseconds */
  duration_ms: number;

  /** The hook configuration that was executed */
  hook: HookConfig;
}

/**
 * Context passed to hook execution.
 * Provides all necessary information for constructing the hook payload.
 */
export interface HookContext {
  /** Current session identifier */
  sessionId: string;

  /** Current workspace directory */
  workspaceDir: string;

  /** Tool name (for tool events) */
  toolName?: string;

  /** Tool input parameters (for PreToolUse) */
  toolInput?: unknown;

  /** Tool output result (for PostToolUse) */
  toolOutput?: unknown;

  /** Additional contextual data */
  context?: Record<string, unknown>;
}
