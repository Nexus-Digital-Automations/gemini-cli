/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { type AnsiOutput } from '../utils/terminalSerializer.js';
/** A structured result from a shell command execution. */
export interface ShellExecutionResult {
    /** The raw, unprocessed output buffer. */
    rawOutput: Buffer;
    /** The combined, decoded output as a string. */
    output: string;
    /** The process exit code, or null if terminated by a signal. */
    exitCode: number | null;
    /** The signal that terminated the process, if any. */
    signal: number | null;
    /** An error object if the process failed to spawn. */
    error: Error | null;
    /** A boolean indicating if the command was aborted by the user. */
    aborted: boolean;
    /** The process ID of the spawned shell. */
    pid: number | undefined;
    /** The method used to execute the shell command. */
    executionMethod: 'lydell-node-pty' | 'node-pty' | 'child_process' | 'none';
}
/** A handle for an ongoing shell execution. */
export interface ShellExecutionHandle {
    /** The process ID of the spawned shell. */
    pid: number | undefined;
    /** A promise that resolves with the complete execution result. */
    result: Promise<ShellExecutionResult>;
}
export interface ShellExecutionConfig {
    terminalWidth?: number;
    terminalHeight?: number;
    pager?: string;
    showColor?: boolean;
    defaultFg?: string;
    defaultBg?: string;
}
/**
 * Describes a structured event emitted during shell command execution.
 */
export type ShellOutputEvent = {
    /** The event contains a chunk of output data. */
    type: 'data';
    /** The decoded string chunk. */
    chunk: string | AnsiOutput;
} | {
    /** Signals that the output stream has been identified as binary. */
    type: 'binary_detected';
} | {
    /** Provides progress updates for a binary stream. */
    type: 'binary_progress';
    /** The total number of bytes received so far. */
    bytesReceived: number;
};
/**
 * A centralized service for executing shell commands with robust process
 * management, cross-platform compatibility, and streaming output capabilities.
 *
 * This service provides enterprise-grade shell command execution with support for:
 * - Multiple execution backends (node-pty, lydell-node-pty, child_process)
 * - Real-time output streaming with ANSI terminal rendering
 * - Cross-platform process management and signal handling
 * - Binary content detection and progress reporting
 * - Terminal interaction capabilities (PTY write, resize, scroll)
 * - Graceful process termination and cleanup
 *
 * The service automatically selects the best available execution method based on
 * system capabilities and configuration, falling back to child_process if PTY
 * implementations are unavailable.
 *
 * @example
 * ```typescript
 * const result = await ShellExecutionService.execute(
 *   'npm install',
 *   '/path/to/project',
 *   (event) => console.log(event),
 *   abortSignal,
 *   true,
 *   { terminalWidth: 120, terminalHeight: 30 }
 * );
 * console.log(`Exit code: ${result.exitCode}`);
 * ```
 *
 * @remarks
 * This service is designed for high-throughput command execution in development
 * tools and supports advanced terminal features when PTY backends are available.
 * The service maintains a registry of active PTY processes for interaction.
 */
export declare class ShellExecutionService {
    private static activePtys;
    /**
     * Executes a shell command using `node-pty`, capturing all output and lifecycle events.
     *
     * @param commandToExecute The exact command string to run.
     * @param cwd The working directory to execute the command in.
     * @param onOutputEvent A callback for streaming structured events about the execution, including data chunks and status updates.
     * @param abortSignal An AbortSignal to terminate the process and its children.
     * @returns An object containing the process ID (pid) and a promise that
     *          resolves with the complete execution result.
     */
    static execute(commandToExecute: string, cwd: string, onOutputEvent: (event: ShellOutputEvent) => void, abortSignal: AbortSignal, shouldUseNodePty: boolean, shellExecutionConfig: ShellExecutionConfig): Promise<ShellExecutionHandle>;
    /**
     * Fallback execution method using Node.js child_process when PTY is unavailable.
     *
     * @param commandToExecute - The shell command to execute
     * @param cwd - The working directory for command execution
     * @param onOutputEvent - Callback for streaming output events
     * @param abortSignal - Signal for aborting the process
     * @returns A handle containing the process ID and result promise
     * @throws Error if the process fails to spawn
     *
     * @remarks
     * This method provides basic command execution without terminal features.
     * It uses cross-platform process spawning with proper signal handling
     * and output encoding detection.
     */
    private static childProcessFallback;
    /**
     * Primary execution method using pseudo-terminal (PTY) for full terminal features.
     *
     * @param commandToExecute - The shell command to execute
     * @param cwd - The working directory for command execution
     * @param onOutputEvent - Callback for streaming output events with ANSI support
     * @param abortSignal - Signal for aborting the process
     * @param shellExecutionConfig - Terminal configuration options
     * @param ptyInfo - PTY implementation details
     * @returns A handle containing the process ID and result promise
     * @throws Error if PTY initialization fails
     *
     * @remarks
     * This method provides full terminal emulation with ANSI color support,
     * interactive capabilities, and proper terminal sizing. It maintains
     * a headless terminal buffer for output capture and supports real-time
     * terminal interactions like scrolling and resizing.
     */
    private static executeWithPty;
    /**
     * Writes a string to the pseudo-terminal (PTY) of a running process.
     *
     * @param pid The process ID of the target PTY.
     * @param input The string to write to the terminal.
     */
    static writeToPty(pid: number, input: string): void;
    /**
     * Resizes the pseudo-terminal (PTY) of a running process.
     *
     * @param pid The process ID of the target PTY.
     * @param cols The new number of columns.
     * @param rows The new number of rows.
     */
    static resizePty(pid: number, cols: number, rows: number): void;
    /**
     * Scrolls the pseudo-terminal (PTY) of a running process.
     *
     * @param pid The process ID of the target PTY.
     * @param lines The number of lines to scroll.
     */
    static scrollPty(pid: number, lines: number): void;
}
