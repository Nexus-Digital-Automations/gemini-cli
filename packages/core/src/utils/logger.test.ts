/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  getLogger,
  getComponentLogger,
  LogLevel,
  createTimer,
  createLoggerConfigFromAppConfig,
  WinstonStructuredLogger,
} from './logger.js';

describe('Structured Logger', () => {
  let consoleSpy: Array<{ level: string; args: unknown[] }>;
  let originalConsole: {
    debug: typeof console.debug;
    info: typeof console.info;
    warn: typeof console.warn;
    error: typeof console.error;
  };

  beforeEach(() => {
    consoleSpy = [];

    // Store original console methods
    originalConsole = {
      debug: console.debug,
      info: console.info,
      warn: console.warn,
      error: console.error,
    };

    // Mock console methods to capture log output
    console.debug = (...args: unknown[]) =>
      consoleSpy.push({ level: 'debug', args });
    console.info = (...args: unknown[]) =>
      consoleSpy.push({ level: 'info', args });
    console.warn = (...args: unknown[]) =>
      consoleSpy.push({ level: 'warn', args });
    console.error = (...args: unknown[]) =>
      consoleSpy.push({ level: 'error', args });
  });

  afterEach(() => {
    // Restore original console methods
    console.debug = originalConsole.debug;
    console.info = originalConsole.info;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
  });

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

  it('should log messages at the appropriate level', () => {
    const logger = new WinstonStructuredLogger({ level: LogLevel.INFO });

    logger.debug('Debug message');
    logger.info('Info message');
    logger.warn('Warning message');
    logger.error('Error message');

    // Debug should be filtered out
    expect(consoleSpy.length).toBe(3);
    expect(consoleSpy.some((log) => log.level === 'info')).toBe(true);
    expect(consoleSpy.some((log) => log.level === 'warn')).toBe(true);
    expect(consoleSpy.some((log) => log.level === 'error')).toBe(true);
  });

  it('should create child logger with inherited context', () => {
    const parentLogger = new WinstonStructuredLogger();
    const childLogger = parentLogger.child({ component: 'test-component' });

    childLogger.info('Test message');

    expect(consoleSpy.length).toBe(1);
    expect(consoleSpy[0].args[0]).toContain('test-component');
  });

  it('should handle error objects properly', () => {
    const logger = new WinstonStructuredLogger();
    const testError = new Error('Test error');

    logger.error('Error occurred', { error: testError });

    expect(consoleSpy.length).toBe(1);
    expect(consoleSpy[0].args[0]).toContain('Test error');
  });

  it('should create timer utility correctly', async () => {
    const logger = new WinstonStructuredLogger({ level: LogLevel.DEBUG });
    const endTimer = createTimer(logger, 'test-operation');

    // Simulate some work
    await new Promise((resolve) => setTimeout(resolve, 10));

    endTimer();

    expect(consoleSpy.length).toBe(1);
    expect(consoleSpy[0].args[0]).toContain('test-operation completed');
    expect(consoleSpy[0].args[0]).toContain('duration');
  });

  it('should provide global logger access', () => {
    const logger1 = getLogger();
    const logger2 = getLogger();

    expect(logger1).toBe(logger2); // Should be same instance
  });

  it('should create component logger with context', () => {
    const componentLogger = getComponentLogger('tool-registry', {
      sessionId: 'test-123',
    });

    componentLogger.info('Component initialized');

    expect(consoleSpy.length).toBe(1);
    expect(consoleSpy[0].args[0]).toContain('tool-registry');
    expect(consoleSpy[0].args[0]).toContain('test-123');
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
});
