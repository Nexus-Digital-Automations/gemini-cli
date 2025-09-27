/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as winston from 'winston';
import {
  getLogger,
  getComponentLogger,
  LogLevel,
  createTimer,
  createLoggerConfigFromAppConfig,
  WinstonStructuredLogger,
} from './logger.js';

// Mock winston module
vi.mock('winston', async () => {
  const actual = await vi.importActual('winston');
  return {
    ...actual,
    createLogger: vi.fn(() => ({
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      child: vi.fn(() => ({
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      })),
    })),
  };
});

describe('Structured Logger', () => {
  let mockWinstonLogger: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockWinstonLogger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      child: vi.fn(() => ({
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      })),
    };
    (winston.createLogger as any).mockReturnValue(mockWinstonLogger);
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

    // Verify winston methods were called
    expect(mockWinstonLogger.debug).toHaveBeenCalledWith('Debug message', {});
    expect(mockWinstonLogger.info).toHaveBeenCalledWith('Info message', {});
    expect(mockWinstonLogger.warn).toHaveBeenCalledWith('Warning message', {});
    expect(mockWinstonLogger.error).toHaveBeenCalledWith('Error message', {});
  });

  it('should create child logger with inherited context', () => {
    const parentLogger = new WinstonStructuredLogger();
    const childLogger = parentLogger.child({ component: 'test-component' });

    childLogger.info('Test message');

    // Verify child logger was created and used
    expect(mockWinstonLogger.child).toHaveBeenCalledWith({
      component: 'test-component',
    });
    expect(mockWinstonLogger.child().info).toHaveBeenCalledWith(
      'Test message',
      {},
    );
  });

  it('should handle error objects properly', () => {
    const logger = new WinstonStructuredLogger();
    const testError = new Error('Test error');

    logger.error('Error occurred', { error: testError });

    // Verify error was logged with proper metadata
    expect(mockWinstonLogger.error).toHaveBeenCalledWith('Error occurred', {
      error: testError,
    });
  });

  it('should create timer utility correctly', async () => {
    const logger = new WinstonStructuredLogger({ level: LogLevel.DEBUG });
    const endTimer = createTimer(logger, 'test-operation');

    // Simulate some work
    await new Promise((resolve) => setTimeout(resolve, 10));

    endTimer();

    // Verify timer logged completion with duration metadata
    expect(mockWinstonLogger.debug).toHaveBeenCalledWith(
      'test-operation completed',
      expect.objectContaining({
        duration: expect.any(Number),
      }),
    );
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

    // Verify component logger was created with proper context
    expect(componentLogger).toBeDefined();
    expect(typeof componentLogger.info).toBe('function');
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
