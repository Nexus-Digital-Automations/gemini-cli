/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Logger utility for validation system
 * Provides structured logging with different levels and contexts
 *
 * @author Claude Code - Validation Expert
 * @version 1.0.0
 */
export declare enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}
export interface LogContext {
  [key: string]: unknown;
}
export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  component: string;
  message: string;
  context?: LogContext;
  error?: Error;
}
/**
 * Structured logger with support for different log levels and contexts
 */
export declare class Logger {
  private readonly component;
  private readonly logLevel;
  constructor(component: string, logLevel?: LogLevel);
  /**
   * Log debug message
   */
  debug(message: string, context?: LogContext): void;
  /**
   * Log info message
   */
  info(message: string, context?: LogContext): void;
  /**
   * Log warning message
   */
  warn(message: string, context?: LogContext): void;
  /**
   * Log error message
   */
  error(message: string, contextOrError?: LogContext | Error): void;
  /**
   * Internal log method
   */
  private log;
  /**
   * Create child logger with additional context
   */
  child(childComponent: string): Logger;
}
