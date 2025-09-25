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

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogContext {
  [key: string]: any;
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
export class Logger {
  private readonly component: string;
  private readonly logLevel: LogLevel;

  constructor(component: string, logLevel: LogLevel = LogLevel.INFO) {
    this.component = component;
    this.logLevel = logLevel;
  }

  /**
   * Log debug message
   */
  public debug(message: string, context?: LogContext): void {
    if (this.logLevel <= LogLevel.DEBUG) {
      this.log(LogLevel.DEBUG, message, context);
    }
  }

  /**
   * Log info message
   */
  public info(message: string, context?: LogContext): void {
    if (this.logLevel <= LogLevel.INFO) {
      this.log(LogLevel.INFO, message, context);
    }
  }

  /**
   * Log warning message
   */
  public warn(message: string, context?: LogContext): void {
    if (this.logLevel <= LogLevel.WARN) {
      this.log(LogLevel.WARN, message, context);
    }
  }

  /**
   * Log error message
   */
  public error(message: string, contextOrError?: LogContext | Error): void {
    if (this.logLevel <= LogLevel.ERROR) {
      let context: LogContext | undefined;
      let error: Error | undefined;

      if (contextOrError instanceof Error) {
        error = contextOrError;
      } else {
        context = contextOrError;
        error = context?.['error'] as Error;
      }

      this.log(LogLevel.ERROR, message, context, error);
    }
  }

  /**
   * Internal log method
   */
  private log(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error,
  ): void {
    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      component: this.component,
      message,
      context,
      error,
    };

    // Format and output log entry
    const levelName = LogLevel[level];
    const timestamp = entry.timestamp.toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    const errorStr = error ? ` Error: ${error.message}` : '';

    const logMessage = `[${timestamp}] ${levelName} [${this.component}] ${message}${contextStr}${errorStr}`;

    switch (level) {
      case LogLevel.DEBUG:
        console.debug(logMessage);
        break;
      case LogLevel.INFO:
        console.log(logMessage);
        break;
      case LogLevel.WARN:
        console.warn(logMessage);
        break;
      case LogLevel.ERROR:
        console.error(logMessage);
        if (error?.stack) {
          console.error(error.stack);
        }
        break;
    }
  }

  /**
   * Create child logger with additional context
   */
  public child(childComponent: string): Logger {
    return new Logger(`${this.component}:${childComponent}`, this.logLevel);
  }
}
