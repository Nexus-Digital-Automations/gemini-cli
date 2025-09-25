/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Config } from '../../config/config.js';
import type { BaseLlmClient } from '../../core/baseLlmClient.js';
import type {
  RoutingContext,
  RoutingDecision,
  RoutingStrategy,
  TerminalStrategy,
} from '../routingStrategy.js';
/**
 * A strategy that attempts a list of child strategies in order (Chain of Responsibility).
 *
 * The CompositeStrategy implements the Chain of Responsibility pattern for model routing,
 * allowing multiple routing strategies to be tried in sequence until one succeeds.
 * This enables sophisticated routing logic by combining simpler strategies.
 *
 * Key features:
 * - Sequential strategy execution with graceful failure handling
 * - Guaranteed terminal strategy as fallback
 * - Latency tracking across the entire strategy chain
 * - Composite source path tracking for debugging
 *
 * The last strategy in the chain must be terminal (guaranteed to return a decision)
 * to ensure that routing always produces a result.
 *
 * @example
 * ```typescript
 * const composite = new CompositeStrategy([
 *   new OverrideStrategy(),
 *   new ClassifierStrategy(),
 *   new DefaultStrategy() // Terminal strategy
 * ], 'main-router');
 *
 * const decision = await composite.route(context, config, client);
 * // decision.metadata.source might be 'main-router/classifier'
 * ```
 */
export declare class CompositeStrategy implements TerminalStrategy {
  readonly name: string;
  private strategies;
  /**
   * Initializes the CompositeStrategy.
   *
   * @param strategies - The strategies to try, in order of priority. The last strategy must be terminal.
   * @param name - The name of this composite configuration (e.g., 'router' or 'composite').
   */
  constructor(
    strategies: [...RoutingStrategy[], TerminalStrategy],
    name?: string,
  );
  /**
   * Execute the routing strategy chain.
   *
   * Attempts each strategy in sequence, allowing non-terminal strategies to fail
   * gracefully. If all non-terminal strategies fail or return null, the terminal
   * strategy is executed as a guaranteed fallback.
   *
   * @param context - The routing context containing request information
   * @param config - The application configuration
   * @param baseLlmClient - The base LLM client for model interaction
   * @returns Promise resolving to a routing decision
   * @throws {Error} When the terminal strategy fails (should never happen in practice)
   */
  route(
    context: RoutingContext,
    config: Config,
    baseLlmClient: BaseLlmClient,
  ): Promise<RoutingDecision>;
  /**
   * Helper function to enhance the decision metadata with composite information.
   *
   * Combines the composite strategy name with the child strategy source to create
   * a hierarchical source path. Also adds latency information for the entire
   * strategy chain execution.
   *
   * @param decision - The routing decision from a child strategy
   * @param startTime - The timestamp when strategy execution began
   * @returns Enhanced routing decision with composite metadata
   * @private
   */
  private finalizeDecision;
}
