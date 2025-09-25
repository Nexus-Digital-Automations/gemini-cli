/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CompositeStrategy } from './compositeStrategy.js';
import type {
  RoutingContext,
  RoutingDecision,
  RoutingStrategy,
  TerminalStrategy,
} from '../routingStrategy.js';
import type { Config } from '../../config/config.js';
import type { BaseLlmClient } from '../../core/baseLlmClient.js';
import { getComponentLogger } from '../../utils/logger.js';

vi.mock('../../utils/logger.js');

describe('CompositeStrategy', () => {
  let mockContext: RoutingContext;
  let mockConfig: Config;
  let mockBaseLlmClient: BaseLlmClient;
  let mockStrategy1: RoutingStrategy;
  let mockStrategy2: RoutingStrategy;
  let mockTerminalStrategy: TerminalStrategy;
  let mockLogger: { error: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock the logger
    mockLogger = { error: vi.fn() };
    vi.mocked(getComponentLogger).mockReturnValue(
      mockLogger as ReturnType<typeof getComponentLogger>,
    );

    mockContext = {} as RoutingContext;
    mockConfig = {} as Config;
    mockBaseLlmClient = {} as BaseLlmClient;

    mockStrategy1 = {
      name: 'strategy1',
      route: vi.fn().mockResolvedValue(null),
    };

    mockStrategy2 = {
      name: 'strategy2',
      route: vi.fn().mockResolvedValue(null),
    };

    mockTerminalStrategy = {
      name: 'terminal',
      route: vi.fn().mockResolvedValue({
        model: 'terminal-model',
        metadata: {
          source: 'terminal',
          latencyMs: 10,
          reasoning: 'Terminal decision',
        },
      }),
    };
  });

  it('should try strategies in order and return the first successful decision', async () => {
    const decision: RoutingDecision = {
      model: 'strategy2-model',
      metadata: {
        source: 'strategy2',
        latencyMs: 20,
        reasoning: 'Strategy 2 decided',
      },
    };
    vi.spyOn(mockStrategy2, 'route').mockResolvedValue(decision);

    const composite = new CompositeStrategy(
      [mockStrategy1, mockStrategy2, mockTerminalStrategy],
      'test-router',
    );

    const result = await composite.route(
      mockContext,
      mockConfig,
      mockBaseLlmClient,
    );

    expect(mockStrategy1.route).toHaveBeenCalledWith(
      mockContext,
      mockConfig,
      mockBaseLlmClient,
    );
    expect(mockStrategy2.route).toHaveBeenCalledWith(
      mockContext,
      mockConfig,
      mockBaseLlmClient,
    );
    expect(mockTerminalStrategy.route).not.toHaveBeenCalled();

    expect(result.model).toBe('strategy2-model');
    expect(result.metadata.source).toBe('test-router/strategy2');
  });

  it('should fall back to the terminal strategy if no other strategy provides a decision', async () => {
    const composite = new CompositeStrategy(
      [mockStrategy1, mockStrategy2, mockTerminalStrategy],
      'test-router',
    );

    const result = await composite.route(
      mockContext,
      mockConfig,
      mockBaseLlmClient,
    );

    expect(mockStrategy1.route).toHaveBeenCalledTimes(1);
    expect(mockStrategy2.route).toHaveBeenCalledTimes(1);
    expect(mockTerminalStrategy.route).toHaveBeenCalledTimes(1);

    expect(result.model).toBe('terminal-model');
    expect(result.metadata.source).toBe('test-router/terminal');
  });

  it('should handle errors in non-terminal strategies and continue', async () => {
    const testError = new Error('Strategy 1 failed');
    vi.spyOn(mockStrategy1, 'route').mockRejectedValue(testError);

    const composite = new CompositeStrategy(
      [mockStrategy1, mockTerminalStrategy],
      'test-router',
    );

    const result = await composite.route(
      mockContext,
      mockConfig,
      mockBaseLlmClient,
    );

    expect(mockLogger.error).toHaveBeenCalledWith(
      "Strategy 'strategy1' failed. Continuing to next strategy.",
      expect.objectContaining({
        error: testError,
        strategyName: 'strategy1',
      }),
    );
    expect(result.model).toBe('terminal-model');
  });

  it('should re-throw an error from the terminal strategy', async () => {
    const terminalError = new Error('Terminal strategy failed');
    vi.spyOn(mockTerminalStrategy, 'route').mockRejectedValue(terminalError);

    const composite = new CompositeStrategy([mockTerminalStrategy]);

    await expect(
      composite.route(mockContext, mockConfig, mockBaseLlmClient),
    ).rejects.toThrow(terminalError);

    expect(mockLogger.error).toHaveBeenCalledWith(
      "Critical Error: Terminal strategy 'terminal' failed. Routing cannot proceed.",
      expect.objectContaining({
        error: terminalError,
        terminalStrategyName: 'terminal',
      }),
    );
  });

  it('should correctly finalize the decision metadata', async () => {
    const decision: RoutingDecision = {
      model: 'some-model',
      metadata: {
        source: 'child-source',
        latencyMs: 50,
        reasoning: 'Child reasoning',
      },
    };
    vi.spyOn(mockStrategy1, 'route').mockResolvedValue(decision);

    const composite = new CompositeStrategy(
      [mockStrategy1, mockTerminalStrategy],
      'my-composite',
    );

    const result = await composite.route(
      mockContext,
      mockConfig,
      mockBaseLlmClient,
    );

    expect(result.model).toBe('some-model');
    expect(result.metadata.source).toBe('my-composite/child-source');
    expect(result.metadata.reasoning).toBe('Child reasoning');
    // It should keep the child's latency
    expect(result.metadata.latencyMs).toBe(50);
  });

  it('should calculate total latency if child latency is not provided', async () => {
    const decision: RoutingDecision = {
      model: 'some-model',
      metadata: {
        source: 'child-source',
        // No latencyMs here
        latencyMs: 0,
        reasoning: 'Child reasoning',
      },
    };
    vi.spyOn(mockStrategy1, 'route').mockResolvedValue(decision);

    const composite = new CompositeStrategy(
      [mockStrategy1, mockTerminalStrategy],
      'my-composite',
    );

    const result = await composite.route(
      mockContext,
      mockConfig,
      mockBaseLlmClient,
    );

    expect(result.metadata.latencyMs).toBeGreaterThanOrEqual(0);
  });
});
