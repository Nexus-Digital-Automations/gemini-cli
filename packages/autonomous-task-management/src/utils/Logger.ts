/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Logger utility for the Autonomous Task Management System
 *
 * Provides structured logging with different levels, formatting, and output options.
 */
export class Logger {
  private readonly config: LoggingConfig;

  constructor(config: LoggingConfig) {
    this.config = {
      level: 'info',
      output: 'console',
      ...config
    };
  }

  debug(message: string, meta?: Record<string, any>): void {
    this.log('debug', message, meta);
  }

  info(message: string, meta?: Record<string, any>): void {
    this.log('info', message, meta);
  }

  warn(message: string, meta?: Record<string, any>): void {
    this.log('warn', message, meta);
  }

  error(message: string, meta?: Record<string, any>): void {
    this.log('error', message, meta);
  }

  private log(level: LogLevel, message: string, meta?: Record<string, any>): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      message,
      ...meta
    };

    if (this.config.output === 'console') {
      console.log(JSON.stringify(logEntry));
    } else if (this.config.output === 'file' && this.config.filePath) {
      // File logging would be implemented here
      console.log(JSON.stringify(logEntry));
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.config.level);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= currentLevelIndex;
  }
}

export interface LoggingConfig {
  level: LogLevel;
  output: 'console' | 'file';
  filePath?: string;
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';