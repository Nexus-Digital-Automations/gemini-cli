/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import {
  getLogger,
  getComponentLogger,
  LogLevel,
  createLoggerConfigFromAppConfig,
  WinstonStructuredLogger,
} from './logger.js';

describe('Structured Logger API', () => {
  it('should create a logger with default configuration', () => {
    const logger = new WinstonStructuredLogger();
    expect(logger.getLevel()).toBe(LogLevel.INFO);
    expect(logger.isLevelEnabled(LogLevel.INFO)).toBe(true);
    expect(logger.isLevelEnabled(LogLevel.DEBUG)).toBe(false);
  });

  it('should create a logger with custom configuration', () => {
    const logger = new WinstonStructuredLogger({
      level: LogLevel.DEBUG,
      debugMode: true,
    });
    expect(logger.getLevel()).toBe(LogLevel.DEBUG);
    expect(logger.isLevelEnabled(LogLevel.DEBUG)).toBe(true);
  });

  it('should support setting and getting log levels', () => {
    const logger = new WinstonStructuredLogger();
    expect(logger.getLevel()).toBe(LogLevel.INFO);

    logger.setLevel(LogLevel.DEBUG);
    expect(logger.getLevel()).toBe(LogLevel.DEBUG);
    expect(logger.isLevelEnabled(LogLevel.DEBUG)).toBe(true);
  });

  it('should create child logger with inherited context', () => {
    const parentLogger = new WinstonStructuredLogger();
    const childLogger = parentLogger.child({ component: 'test-component' });

    // Should not throw and should return a logger instance
    expect(childLogger).toBeDefined();
    expect(typeof childLogger.info).toBe('function');
    expect(typeof childLogger.error).toBe('function');
  });

  it('should provide global logger access', () => {
    const logger1 = getLogger();
    const logger2 = getLogger();

    expect(logger1).toBe(logger2); // Should be same instance
    expect(typeof logger1.info).toBe('function');
  });

  it('should create component logger with context', () => {
    const componentLogger = getComponentLogger('tool-registry', {
      sessionId: 'test-123',
    });

    expect(componentLogger).toBeDefined();
    expect(typeof componentLogger.info).toBe('function');
    expect(typeof componentLogger.error).toBe('function');
  });

  it('should create config from app config', () => {
    const config = createLoggerConfigFromAppConfig(
      true,
      'session-123',
      '/custom/logs',
    );

    expect(config.debugMode).toBe(true);
    expect(config.level).toBe(LogLevel.DEBUG);
    expect(config.logDir).toBe('/custom/logs');
    expect(config.defaultMeta?.['sessionId']).toBe('session-123');
  });

  it('should handle different log levels correctly', () => {
    const logger = new WinstonStructuredLogger({ level: LogLevel.INFO });

    expect(logger.isLevelEnabled(LogLevel.DEBUG)).toBe(false);
    expect(logger.isLevelEnabled(LogLevel.INFO)).toBe(true);
    expect(logger.isLevelEnabled(LogLevel.WARN)).toBe(true);
    expect(logger.isLevelEnabled(LogLevel.ERROR)).toBe(true);

    // Should not throw when calling log methods
    expect(() => {
      logger.debug('Debug message');
      logger.info('Info message');
      logger.warn('Warning message');
      logger.error('Error message');
    }).not.toThrow();
  });

  it('should accept metadata in log calls', () => {
    const logger = new WinstonStructuredLogger();

    // Should not throw when called with metadata
    expect(() => {
      logger.info('Test message', { component: 'test', count: 42 });
      logger.error('Error message', {
        error: new Error('test'),
        module: 'testing',
      });
    }).not.toThrow();
  });
});
