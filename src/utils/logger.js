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
export var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["DEBUG"] = 0] = "DEBUG";
    LogLevel[LogLevel["INFO"] = 1] = "INFO";
    LogLevel[LogLevel["WARN"] = 2] = "WARN";
    LogLevel[LogLevel["ERROR"] = 3] = "ERROR";
})(LogLevel || (LogLevel = {}));
/**
 * Structured logger with support for different log levels and contexts
 */
export class Logger {
    component;
    logLevel;
    constructor(component, logLevel = LogLevel.INFO) {
        this.component = component;
        this.logLevel = logLevel;
    }
    /**
     * Log debug message
     */
    debug(message, context) {
        if (this.logLevel <= LogLevel.DEBUG) {
            this.log(LogLevel.DEBUG, message, context);
        }
    }
    /**
     * Log info message
     */
    info(message, context) {
        if (this.logLevel <= LogLevel.INFO) {
            this.log(LogLevel.INFO, message, context);
        }
    }
    /**
     * Log warning message
     */
    warn(message, context) {
        if (this.logLevel <= LogLevel.WARN) {
            this.log(LogLevel.WARN, message, context);
        }
    }
    /**
     * Log error message
     */
    error(message, contextOrError) {
        if (this.logLevel <= LogLevel.ERROR) {
            let context;
            let error;
            if (contextOrError instanceof Error) {
                error = contextOrError;
            }
            else {
                context = contextOrError;
                error = context?.['error'];
            }
            this.log(LogLevel.ERROR, message, context, error);
        }
    }
    /**
     * Internal log method
     */
    log(level, message, context, error) {
        const entry = {
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
            default:
                // Fallback for unknown log levels
                console.log(logMessage);
                break;
        }
    }
    /**
     * Create child logger with additional context
     */
    child(childComponent) {
        return new Logger(`${this.component}:${childComponent}`, this.logLevel);
    }
}
//# sourceMappingURL=logger.js.map