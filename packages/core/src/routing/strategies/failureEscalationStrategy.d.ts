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
} from '../routingStrategy.js';
/**
 * Configuration options for failure escalation behavior.
 */
interface FailureEscalationConfig {
  /** Number of Flash failures before escalating to Pro for similar requests */
  failureThreshold: number;
  /** Maximum time in milliseconds to wait for Flash before escalating */
  timeoutThreshold: number;
  /** Whether to remember escalation decisions for the session */
  enableSessionMemory: boolean;
  /** Whether failure escalation is enabled */
  enabled: boolean;
}
/**
 * Failure-based escalation strategy that monitors Flash model performance
 * and escalates to Pro when Flash consistently fails or underperforms.
 *
 * This strategy implements intelligent escalation based on actual performance
 * rather than just task complexity analysis. It tracks patterns of Flash
 * failures and automatically routes similar requests to Pro model when
 * Flash has proven inadequate.
 *
 * Key Features:
 * - Tracks Flash failure patterns by request type
 * - Session-based memory of escalation decisions
 * - Timeout detection for slow Flash responses
 * - Configurable thresholds and behavior
 * - Performance monitoring and metrics collection
 *
 * Escalation Triggers:
 * - Flash model API errors or failures
 * - Flash timeouts exceeding threshold
 * - Repeated failures for similar request patterns
 * - User feedback indicating Flash inadequacy
 *
 * @example
 * ```typescript
 * const escalationStrategy = new FailureEscalationStrategy();
 * const decision = await escalationStrategy.route(context, config, client);
 * // Returns Pro model if Flash has failed for similar requests
 * ```
 */
export declare class FailureEscalationStrategy implements RoutingStrategy {
  readonly name = 'failure-escalation';
  private config;
  private failurePatterns;
  private logger;
  constructor(config?: Partial<FailureEscalationConfig>);
  /**
   * Routes requests based on failure history and performance patterns.
   *
   * Analyzes the request context to determine if similar requests have
   * consistently failed with Flash model. If a pattern of failures is
   * detected, escalates to Pro model to ensure reliable task completion.
   *
   * The strategy uses request hashing to identify similar requests and
   * maintains session memory of escalation decisions to avoid repeated
   * Flash failures for known problematic patterns.
   *
   * @param context - Routing context with request details and history
   * @param config - Application configuration
   * @param _baseLlmClient - LLM client (unused in this strategy)
   * @returns Promise resolving to routing decision or null if no escalation needed
   */
  route(
    context: RoutingContext,
    _config: Config,
    _baseLlmClient: BaseLlmClient,
  ): Promise<RoutingDecision | null>;
  /**
   * Records a failure for the Flash model to update escalation patterns.
   *
   * This method should be called when Flash model fails to complete a request
   * successfully. It updates the failure patterns and determines if future
   * similar requests should be escalated to Pro model.
   *
   * @param requestContext - The request context that failed
   * @param failureReason - Reason for the failure (timeout, error, etc.)
   */
  recordFailure(requestContext: string, failureReason: string): void;
  /**
   * Records a successful completion for pattern learning.
   *
   * This method should be called when Flash model successfully completes
   * a request. It helps balance the failure tracking with success tracking
   * for more accurate pattern recognition.
   *
   * @param requestContext - The request context that succeeded
   */
  recordSuccess(requestContext: string): void;
  /**
   * Clears failure patterns for session reset.
   *
   * This method can be called to reset the failure tracking state,
   * useful for new sessions or when resetting the escalation behavior.
   */
  clearFailurePatterns(): void;
  /**
   * Gets current failure statistics for monitoring and debugging.
   *
   * @returns Object containing current failure pattern statistics
   */
  getFailureStats(): {
    totalPatterns: number;
    escalatingPatterns: number;
    patterns: Array<{
      hash: string;
      failures: number;
      shouldEscalate: boolean;
      lastFailure: number;
    }>;
  };
  /**
   * Converts PartListUnion request to string for processing.
   *
   * Extracts text content from the request parts for pattern matching.
   * Handles various part types and creates a unified string representation.
   *
   * @param request - The request parts to convert
   * @returns String representation of the request
   */
  private convertRequestToString;
  /**
   * Generates a hash for request pattern matching.
   *
   * Creates a simplified hash of the request to identify similar requests
   * for failure pattern tracking. This is a basic implementation that could
   * be enhanced with more sophisticated pattern matching algorithms.
   *
   * @param request - The request content to hash
   * @returns Hash string for pattern matching
   */
  private generateRequestHash;
}
export {};
