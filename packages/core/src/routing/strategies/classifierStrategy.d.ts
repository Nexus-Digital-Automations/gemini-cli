/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { BaseLlmClient } from '../../core/baseLlmClient.js';
import type {
  RoutingContext,
  RoutingDecision,
  RoutingStrategy,
} from '../routingStrategy.js';
import type { Config } from '../../config/config.js';
/**
 * AI-powered routing strategy that classifies requests by complexity.
 *
 * The ClassifierStrategy uses a lightweight Gemini Flash model to analyze incoming
 * requests and determine whether they require a simple, fast model (Flash) or a
 * more powerful, advanced model (Pro) based on complexity analysis.
 *
 * Classification Criteria:
 * - **Simple (Flash)**: Well-defined, bounded tasks requiring 1-3 tool calls
 * - **Complex (Pro)**: Multi-step tasks requiring planning, debugging, or strategic thinking
 *
 * The classifier considers:
 * - Operational complexity (estimated number of steps/tool calls)
 * - Strategic planning requirements ("how" or "why" questions)
 * - Scope and ambiguity level
 * - Debugging complexity and root cause analysis needs
 *
 * Recent conversation history is provided as context to improve classification
 * accuracy, with tool calls filtered out to focus on user intent.
 *
 * @example
 * ```typescript
 * const classifier = new ClassifierStrategy();
 * const decision = await classifier.route(context, config, client);
 * // Returns routing decision with Flash or Pro model selection
 * ```
 */
export declare class ClassifierStrategy implements RoutingStrategy {
  readonly name = 'classifier';
  /**
   * Route the request by classifying its complexity using AI.
   *
   * Analyzes the user request and conversation history to determine appropriate
   * model selection. Uses a structured JSON response with reasoning to ensure
   * transparent and debuggable routing decisions.
   *
   * The method:
   * 1. Extracts recent conversation history for context
   * 2. Filters out tool calls to focus on user intent
   * 3. Sends request to classifier model with structured schema
   * 4. Parses response and maps to appropriate model
   * 5. Returns null on failure to allow fallback strategies
   *
   * @param context - Routing context with request and conversation history
   * @param _config - Application configuration (unused)
   * @param baseLlmClient - LLM client for classification requests
   * @returns Promise resolving to routing decision or null if classification fails
   */
  route(
    context: RoutingContext,
    _config: Config,
    baseLlmClient: BaseLlmClient,
  ): Promise<RoutingDecision | null>;
}
