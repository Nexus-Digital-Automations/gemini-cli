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
export declare class Logger {
    private readonly config;
    constructor(config: LoggingConfig);
    debug(message: string, meta?: Record<string, any>): void;
    info(message: string, meta?: Record<string, any>): void;
    warn(message: string, meta?: Record<string, any>): void;
    error(message: string, meta?: Record<string, any>): void;
    private log;
    private shouldLog;
}
export interface LoggingConfig {
    level: LogLevel;
    output: 'console' | 'file';
    filePath?: string;
}
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
