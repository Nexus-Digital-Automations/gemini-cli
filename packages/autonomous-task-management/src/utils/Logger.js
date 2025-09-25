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
    config;
    constructor(config) {
        this.config = {
            level: 'info',
            output: 'console',
            ...config
        };
    }
    debug(message, meta) {
        this.log('debug', message, meta);
    }
    info(message, meta) {
        this.log('info', message, meta);
    }
    warn(message, meta) {
        this.log('warn', message, meta);
    }
    error(message, meta) {
        this.log('error', message, meta);
    }
    log(level, message, meta) {
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
        }
        else if (this.config.output === 'file' && this.config.filePath) {
            // File logging would be implemented here
            console.log(JSON.stringify(logEntry));
        }
    }
    shouldLog(level) {
        const levels = ['debug', 'info', 'warn', 'error'];
        const currentLevelIndex = levels.indexOf(this.config.level);
        const messageLevelIndex = levels.indexOf(level);
        return messageLevelIndex >= currentLevelIndex;
    }
}
//# sourceMappingURL=Logger.js.map