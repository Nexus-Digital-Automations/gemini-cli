/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { getComponentLogger } from '../../utils/logger.js';
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
export class CompositeStrategy {
    name;
    strategies;
    /**
     * Initializes the CompositeStrategy.
     *
     * @param strategies - The strategies to try, in order of priority. The last strategy must be terminal.
     * @param name - The name of this composite configuration (e.g., 'router' or 'composite').
     */
    constructor(strategies, name = 'composite') {
        this.strategies = strategies;
        this.name = name;
    }
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
    async route(context, config, baseLlmClient) {
        const startTime = performance.now();
        // Separate non-terminal strategies from the terminal one.
        // This separation allows TypeScript to understand the control flow guarantees.
        const nonTerminalStrategies = this.strategies.slice(0, -1);
        const terminalStrategy = this.strategies[this.strategies.length - 1];
        // Try non-terminal strategies, allowing them to fail gracefully.
        for (const strategy of nonTerminalStrategies) {
            try {
                const decision = await strategy.route(context, config, baseLlmClient);
                if (decision) {
                    return this.finalizeDecision(decision, startTime);
                }
            }
            catch (error) {
                const logger = getComponentLogger('CompositeStrategy');
                logger.error(`Strategy '${strategy.name}' failed. Continuing to next strategy.`, { error: error, strategyName: strategy.name });
            }
        }
        // If no other strategy matched, execute the terminal strategy.
        try {
            const decision = await terminalStrategy.route(context, config, baseLlmClient);
            return this.finalizeDecision(decision, startTime);
        }
        catch (error) {
            const logger = getComponentLogger('CompositeStrategy');
            logger.error(`Critical Error: Terminal strategy '${terminalStrategy.name}' failed. Routing cannot proceed.`, { error: error, terminalStrategyName: terminalStrategy.name });
            throw error;
        }
    }
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
    finalizeDecision(decision, startTime) {
        const endTime = performance.now();
        const totalLatency = endTime - startTime;
        // Combine the source paths: composite_name/child_source (e.g. 'router/default')
        const compositeSource = `${this.name}/${decision.metadata.source}`;
        return {
            ...decision,
            metadata: {
                ...decision.metadata,
                source: compositeSource,
                latencyMs: decision.metadata.latencyMs || totalLatency,
            },
        };
    }
}
//# sourceMappingURL=compositeStrategy.js.map