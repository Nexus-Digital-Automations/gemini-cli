/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import winston from 'winston';
import path from 'node:path';
import { existsSync, mkdirSync } from 'node:fs';
import process from 'node:process';
/**
 * Log level enumeration defining the severity hierarchy.
 * Used to filter log messages by importance and control verbosity.
 */
export let LogLevel;
(function (LogLevel) {
  /** Detailed debugging information for development */
  LogLevel['DEBUG'] = 'debug';
  /** General information about application flow */
  LogLevel['INFO'] = 'info';
  /** Warning conditions that should be noted */
  LogLevel['WARN'] = 'warn';
  /** Error conditions that require attention */
  LogLevel['ERROR'] = 'error';

})(LogLevel || (LogLevel = {}));
/**
 * Default configuration values for the logger.
 * Provides sensible defaults for different environments.
 */
const DEFAULT_CONFIG = {
  level: LogLevel.INFO,
  enableConsole: true,
  enableFile: false,
  logDir: './.logs',
  logFileName: 'gemini-cli',
  colorize: process.stdout.isTTY ?? true,
  debugMode: false,

};
/**
 * Winston-based structured logger implementation.
 * Provides centralized logging with consistent formatting and metadata support.
 *
 * Features:
 * - Multiple output destinations (console, file)
 * - Structured metadata support
 * - Context-aware child loggers
 * - Performance timing utilities
 * - Error object serialization
 * - Environment-aware configuration
 *
 * @example
 * ```typescript
 * // Basic usage
 * const logger = new WinstonStructuredLogger({ debugMode: true });
 * logger.info('Application started', { component: 'main', version: '1.0.0' });
 *
 * // Child logger with context
 * const toolLogger = logger.child({ component: 'tool-registry' });
 * toolLogger.debug('Registering tool', { toolName: 'grep' });
 *
 * // Error logging
 * try {
 *   await riskyOperation();
 * } catch (error) {
 *   logger.error('Operation failed', { error, component: 'processor' });
 * }
 *
 * // Performance timing
 * const start = Date.now();
 * await longRunningTask();
 * logger.info('Task completed', {
 *   component: 'worker',
 *   duration: Date.now() - start
 * });
 * ```
 */
export class WinstonStructuredLogger {
  winston;
  config;
  /**
   * Creates a new structured logger instance.
   *
   * @param config - Configuration options for the logger
   * @throws Error if log directory cannot be created
   */
  constructor(config = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    // Ensure log directory exists if file logging is enabled
    if (this.config.enableFile && !existsSync(this.config.logDir)) {
      try {
        mkdirSync(this.config.logDir, { recursive: true });
      } catch (error) {
        throw new Error(
          `Failed to create log directory ${this.config.logDir}: ${error}`,
        );
      }
    }
    // Create winston logger with configured transports
    this.winston = winston.createLogger({
      level: this.config.level,
      format: this.createLogFormat(),
      defaultMeta: this.config.defaultMeta || {},
      transports: this.createTransports(),
      // Prevent winston from exiting process on uncaught exceptions
      exitOnError: false,
    });
  }
  /**
   * Creates the winston log format with timestamp and structured output.
   * Handles error serialization and metadata formatting.
   */
  createLogFormat() {
    return winston.format.combine(
      winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss.SSS',
      }),
      winston.format.errors({ stack: true }),
      winston.format.printf((info) => {
        const { level, timestamp, message, ...meta } = info;
        // Extract error from meta if present
        const errorInfo =
          meta['error'] instanceof Error
            ? {
                name: meta['error'].name,
                message: meta['error'].message,
                stack: meta['error'].stack,
              }
            : meta['error'];
        const metaWithError = errorInfo ? { ...meta, error: errorInfo } : meta;
        // Format metadata for display
        const metaString =
          Object.keys(metaWithError).length > 0
            ? ` ${JSON.stringify(metaWithError, null, 2)}`
            : '';
        return `[${level.toUpperCase()}] ${timestamp} -- ${message}${metaString}`;
      }),
    );
  }
  /**
   * Creates winston transport instances based on configuration.
   * Supports console and file outputs with appropriate formatting.
   */
  createTransports() {
    const transports = [];
    // Console transport
    if (this.config.enableConsole) {
      const consoleFormat = this.config.colorize
        ? winston.format.combine(
            winston.format.colorize(),
            this.createLogFormat(),
          )
        : this.createLogFormat();
      transports.push(
        new winston.transports.Console({
          format: consoleFormat,
          stderrLevels: ['error'],
        }),
      );
    }
    // File transport
    if (this.config.enableFile) {
      const logFilePath = path.join(
        this.config.logDir,
        `${this.config.logFileName}.log`,
      );
      transports.push(
        new winston.transports.File({
          filename: logFilePath,
          format: this.createLogFormat(),
          maxsize: 10 * 1024 * 1024, // 10MB
          maxFiles: 5,
          tailable: true,
        }),
      );
      // Separate error log file
      const errorLogPath = path.join(
        this.config.logDir,
        `${this.config.logFileName}-error.log`,
      );
      transports.push(
        new winston.transports.File({
          filename: errorLogPath,
          level: 'error',
          format: this.createLogFormat(),
          maxsize: 10 * 1024 * 1024, // 10MB
          maxFiles: 5,
          tailable: true,
        }),
      );
    }
    return transports;
  }
  /**
   * Log a debug-level message with optional metadata.
   * Debug messages are typically used for detailed troubleshooting.
   *
   * @param message - The log message
   * @param meta - Optional structured metadata
   */
  debug(message, meta = {}) {
    this.winston.debug(message, meta);
  }
  /**
   * Log an info-level message with optional metadata.
   * Info messages represent normal application flow.
   *
   * @param message - The log message
   * @param meta - Optional structured metadata
   */
  info(message, meta = {}) {
    this.winston.info(message, meta);
  }
  /**
   * Log a warning-level message with optional metadata.
   * Warnings indicate conditions that should be noted but don't prevent operation.
   *
   * @param message - The log message
   * @param meta - Optional structured metadata
   */
  warn(message, meta = {}) {
    this.winston.warn(message, meta);
  }
  /**
   * Log an error-level message with optional metadata.
   * Error messages indicate conditions that require attention.
   *
   * @param message - The log message
   * @param meta - Optional structured metadata including error objects
   */
  error(message, meta = {}) {
    this.winston.error(message, meta);
  }
  /**
   * Create a child logger that inherits context from the parent.
   * Child loggers automatically include the provided context in all log messages.
   *
   * @param context - Additional context to include in all child logger messages
   * @returns A new logger instance with the inherited context
   *
   * @example
   * ```typescript
   * const mainLogger = createLogger();
   * const toolLogger = mainLogger.child({ component: 'tool-registry' });
   * toolLogger.info('Tool registered'); // Includes component: 'tool-registry'
   * ```
   */
  child(context) {
    return new WinstonStructuredLogger({
      ...this.config,
      defaultMeta: { ...this.config.defaultMeta, ...context },
    });
  }
  /**
   * Update the minimum log level dynamically.
   * Messages below this level will be filtered out.
   *
   * @param level - The new minimum log level
   */
  setLevel(level) {
    this.winston.level = level;
  }
  /**
   * Get the current minimum log level.
   *
   * @returns The current log level
   */
  getLevel() {
    return this.winston.level;
  }
  /**
   * Check if a specific log level is enabled.
   * Useful for avoiding expensive log message construction.
   *
   * @param level - The log level to check
   * @returns True if the level would be logged
   *
   * @example
   * ```typescript
   * if (logger.isLevelEnabled(LogLevel.DEBUG)) {
   *   logger.debug('Expensive debug info', { data: expensiveCalculation() });
   * }
   * ```
   */
  isLevelEnabled(level) {
    return this.winston.isLevelEnabled(level);
  }

}
/**
 * Global logger instance for application-wide use.
 * Initialized with default configuration and can be reconfigured.
 */
let globalLogger = null;
/**
 * Create and configure the global logger instance.
 * This should be called once during application initialization.
 *
 * @param config - Configuration options for the global logger
 * @returns The configured global logger instance
 *
 * @example
 * ```typescript
 * // Initialize during app startup
 * const logger = createLogger({
 *   debugMode: process.env.NODE_ENV === 'development',
 *   enableFile: process.env.NODE_ENV === 'production',
 *   level: process.env.LOG_LEVEL as LogLevel || LogLevel.INFO
 * });
 * ```
 */
export function createLogger(config = {}) {
  // Determine configuration based on environment
  const envConfig = {
    debugMode:
      process.env['NODE_ENV'] === 'development' || !!process.env['DEBUG'],
    level:
      process.env['LOG_LEVEL'] ||
      (process.env['DEBUG'] ? LogLevel.DEBUG : LogLevel.INFO),
    enableFile: process.env['NODE_ENV'] === 'production',
    ...config,
  };
  globalLogger = new WinstonStructuredLogger(envConfig);
  return globalLogger;

}
/**
 * Get the global logger instance.
 * Creates a default logger if none has been configured.
 *
 * @returns The global logger instance
 *
 * @example
 * ```typescript
 * // Use anywhere in the application
 * const logger = getLogger();
 * logger.info('Something happened');
 * ```
 */
export function getLogger() {
  if (!globalLogger) {
    globalLogger = createLogger();
  }
  return globalLogger;

}
/**
 * Create a logger with specific context for a component or module.
 * This is a convenience function for creating child loggers.
 *
 * @param component - The component name to include in log context
 * @param additionalContext - Additional context metadata
 * @returns A context-aware logger instance
 *
 * @example
 * ```typescript
 * const logger = getComponentLogger('tool-registry', { sessionId: 'abc123' });
 * logger.info('Tools loaded'); // Includes component and sessionId
 * ```
 */
export function getComponentLogger(component, additionalContext = {}) {
  return getLogger().child({ component, ...additionalContext });

}
/**
 * Performance timing utility for measuring operation duration.
 * Returns a function that logs the elapsed time when called.
 *
 * @param logger - Logger instance to use for timing output
 * @param operation - Name of the operation being timed
 * @param level - Log level for the timing message (defaults to DEBUG)
 * @returns Function to call when operation completes
 *
 * @example
 * ```typescript
 * const logger = getLogger();
 * const endTimer = createTimer(logger, 'file-processing');
 *
 * await processFiles();
 *
 * endTimer(); // Logs: "file-processing completed in 1234ms"
 * ```
 */
export function createTimer(logger, operation, level = LogLevel.DEBUG) {
  const startTime = Date.now();
  return () => {
    const duration = Date.now() - startTime;
    const message = `${operation} completed`;
    switch (level) {
      case LogLevel.DEBUG:
        logger.debug(message, { duration, operation });
        break;
      case LogLevel.INFO:
        logger.info(message, { duration, operation });
        break;
      case LogLevel.WARN:
        logger.warn(message, { duration, operation });
        break;
      case LogLevel.ERROR:
        logger.error(message, { duration, operation });
        break;
      default:
        logger.info(message, { duration, operation });
        break;
    }
  };

}
/**
 * Configuration helper for integrating with existing Config system.
 * Extracts logging configuration from the application config.
 *
 * @param debugMode - Whether debug mode is enabled
 * @param sessionId - Session identifier for request correlation
 * @param logDir - Optional custom log directory
 * @returns Logger configuration object
 */
export function createLoggerConfigFromAppConfig(debugMode, sessionId, logDir) {
  return {
    debugMode,
    level: debugMode ? LogLevel.DEBUG : LogLevel.INFO,
    enableConsole: true,
    enableFile: !debugMode, // Enable file logging in production
    logDir: logDir || './.logs',
    defaultMeta: sessionId ? { sessionId } : undefined,
  };

}
// Global logger instance (for backwards compatibility)
export const logger = () => getLogger();
