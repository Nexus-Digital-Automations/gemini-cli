/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Config } from '../config/config.js';
import type {
  ToolInvocation,
  ToolResult,
  ToolCallConfirmationDetails,
} from './tools.js';
import { BaseDeclarativeTool, BaseToolInvocation } from './tools.js';
import type { ShellExecutionConfig } from '../services/shellExecutionService.js';
import type { AnsiOutput } from '../utils/terminalSerializer.js';
/** Interval for updating shell command output in milliseconds */
export declare const OUTPUT_UPDATE_INTERVAL_MS = 1000;
/**
 * Parameters for the Shell tool execution
 */
export interface ShellToolParams {
  /** The shell command to execute */
  command: string;
  /** Optional description of what the command does */
  description?: string;
  /** Optional absolute path to the directory where the command should run */
  directory?: string;
}
/**
 * Implementation of shell command execution logic
 *
 * This class handles the execution of shell commands with proper validation,
 * confirmation, output streaming, and process management including background
 * process tracking.
 */
export declare class ShellToolInvocation extends BaseToolInvocation<
  ShellToolParams,
  ToolResult
> {
  private readonly config;
  private readonly allowlist;
  /**
   * Creates a new shell tool invocation
   * @param config - The configuration object
   * @param params - Shell execution parameters
   * @param allowlist - Set of approved commands that don't require confirmation
   */
  constructor(config: Config, params: ShellToolParams, allowlist: Set<string>);
  /**
   * Gets a human-readable description of the command to be executed
   * @returns Formatted description including command, directory, and optional description
   */
  getDescription(): string;
  /**
   * Determines if user confirmation is required for command execution
   *
   * Commands that haven't been previously approved require user confirmation.
   * Once approved, commands can be added to the allowlist to skip future confirmations.
   *
   * @param _abortSignal - Abort signal for cancellation (not used in this implementation)
   * @returns Confirmation details if confirmation is needed, false otherwise
   */
  shouldConfirmExecute(
    _abortSignal: AbortSignal,
  ): Promise<ToolCallConfirmationDetails | false>;
  /**
   * Executes the shell command with comprehensive monitoring and output handling
   *
   * This method handles the complete execution lifecycle including:
   * - Command validation and preprocessing
   * - Process group management and background process tracking
   * - Real-time output streaming with binary detection
   * - Error handling and result formatting
   * - Cleanup of temporary resources
   *
   * @param signal - Abort signal for cancellation
   * @param updateOutput - Optional callback for streaming output updates
   * @param shellExecutionConfig - Optional shell execution configuration
   * @param setPidCallback - Optional callback to receive the process ID
   * @returns Promise resolving to tool execution result
   *
   * @example
   * ```typescript
   * const result = await invocation.execute(
   *   abortSignal,
   *   (output) => console.log(output),
   *   { timeout: 30000 },
   *   (pid) => console.log(`Process started: ${pid}`)
   * );
   * ```
   */
  execute(
    signal: AbortSignal,
    updateOutput?: (output: string | AnsiOutput) => void,
    shellExecutionConfig?: ShellExecutionConfig,
    setPidCallback?: (pid: number) => void,
  ): Promise<ToolResult>;
}
/**
 * Shell command execution tool for the Gemini CLI
 *
 * This tool provides secure shell command execution with the following features:
 * - Cross-platform support (Windows cmd.exe and Unix/Linux bash)
 * - Command allowlisting and user confirmation for security
 * - Real-time output streaming with binary detection
 * - Background process tracking and management
 * - Process group handling for proper cleanup
 * - Workspace directory validation and sandboxing
 * - Comprehensive error handling and reporting
 *
 * Commands are executed with proper isolation and monitoring to ensure
 * safe operation within the configured workspace boundaries.
 */
export declare class ShellTool extends BaseDeclarativeTool<
  ShellToolParams,
  ToolResult
> {
  private readonly config;
  /** Tool identifier for registration and configuration */
  static Name: string;
  /** Set of command roots that have been approved by the user */
  private allowlist;
  /**
   * Creates a new shell tool instance
   * @param config - Configuration object containing workspace and security settings
   */
  constructor(config: Config);
  /**
   * Validates shell tool parameters for security and correctness
   *
   * Performs comprehensive validation including:
   * - Command allowlist checking against security policies
   * - Directory path validation and workspace boundary enforcement
   * - Command root extraction for permission management
   *
   * @param params - Shell tool parameters to validate
   * @returns Error message if validation fails, null if parameters are valid
   */
  protected validateToolParamValues(params: ShellToolParams): string | null;
  /**
   * Creates a shell tool invocation instance for command execution
   * @param params - Validated shell tool parameters
   * @returns Configured shell tool invocation ready for execution
   */
  protected createInvocation(
    params: ShellToolParams,
  ): ToolInvocation<ShellToolParams, ToolResult>;
}
