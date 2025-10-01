/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
// Models are imported as string literals to avoid dependencies
import { getComponentLogger } from '../../utils/logger.js';
import { FlashEscalationEvent } from '../../telemetry/types.js';
import { logFlashEscalation } from '../../telemetry/loggers.js';
/**
 * Default configuration for failure escalation.
 */
const DEFAULT_ESCALATION_CONFIG = {
    failureThreshold: 2,
    timeoutThreshold: 30000, // 30 seconds
    enableSessionMemory: true,
    enabled: true,
};
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
export class FailureEscalationStrategy {
    name = 'failure-escalation';
    config;
    failurePatterns = new Map();
    logger = getComponentLogger('FailureEscalationStrategy');
    constructor(config) {
        this.config = { ...DEFAULT_ESCALATION_CONFIG, ...config };
    }
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
    async route(context, _config, _baseLlmClient) {
        if (!this.config.enabled) {
            return null;
        }
        const startTime = Date.now();
        try {
            // Generate request hash for pattern matching
            const requestString = this.convertRequestToString(context.request);
            const requestHash = this.generateRequestHash(requestString);
            // Check if this request pattern has previous failures
            const pattern = this.failurePatterns.get(requestHash);
            if (pattern && pattern.shouldEscalate) {
                this.logger.info(`Escalating to Pro due to failure pattern`, {
                    requestHash,
                    failureCount: pattern.failureCount,
                    lastFailure: pattern.lastFailure,
                });
                // Log telemetry for Flash escalation
                const escalationEvent = new FlashEscalationEvent(requestHash, pattern.failureCount.toString(), 'threshold_reached');
                logFlashEscalation(_config, escalationEvent);
                return {
                    model: 'gemini-2.5-pro', // Escalate to Pro model for failed Flash patterns
                    metadata: {
                        source: this.name,
                        latencyMs: Date.now() - startTime,
                        reasoning: `Escalating to Pro model due to ${pattern.failureCount} previous Flash failures for similar requests`,
                    },
                };
            }
            // Check for timeout patterns (would require integration with actual request execution)
            // For now, return null to allow other strategies to handle routing
            return null;
        }
        catch (error) {
            this.logger.warn('FailureEscalationStrategy failed', {
                error: error instanceof Error ? error : new Error(String(error)),
            });
            return null;
        }
    }
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
    recordFailure(requestContext, failureReason) {
        if (!this.config.enabled) {
            return;
        }
        const requestHash = this.generateRequestHash(requestContext);
        const now = Date.now();
        const pattern = this.failurePatterns.get(requestHash) || {
            requestHash,
            failureCount: 0,
            lastFailure: 0,
            shouldEscalate: false,
        };
        pattern.failureCount++;
        pattern.lastFailure = now;
        pattern.shouldEscalate =
            pattern.failureCount >= this.config.failureThreshold;
        this.failurePatterns.set(requestHash, pattern);
        this.logger.info(`Recorded Flash failure`, {
            requestHash,
            failureCount: pattern.failureCount,
            failureReason,
            shouldEscalate: pattern.shouldEscalate,
        });
    }
    /**
     * Records a successful completion for pattern learning.
     *
     * This method should be called when Flash model successfully completes
     * a request. It helps balance the failure tracking with success tracking
     * for more accurate pattern recognition.
     *
     * @param requestContext - The request context that succeeded
     */
    recordSuccess(requestContext) {
        if (!this.config.enabled) {
            return;
        }
        const requestHash = this.generateRequestHash(requestContext);
        const pattern = this.failurePatterns.get(requestHash);
        if (pattern && pattern.failureCount > 0) {
            // Reduce failure count on success to allow recovery
            pattern.failureCount = Math.max(0, pattern.failureCount - 1);
            pattern.shouldEscalate =
                pattern.failureCount >= this.config.failureThreshold;
            this.failurePatterns.set(requestHash, pattern);
            this.logger.debug(`Recorded Flash success, reduced failure count`, {
                requestHash,
                failureCount: pattern.failureCount,
                shouldEscalate: pattern.shouldEscalate,
            });
        }
    }
    /**
     * Clears failure patterns for session reset.
     *
     * This method can be called to reset the failure tracking state,
     * useful for new sessions or when resetting the escalation behavior.
     */
    clearFailurePatterns() {
        this.failurePatterns.clear();
        this.logger.info('Cleared all failure patterns');
    }
    /**
     * Gets current failure statistics for monitoring and debugging.
     *
     * @returns Object containing current failure pattern statistics
     */
    getFailureStats() {
        const patterns = Array.from(this.failurePatterns.values()).map((pattern) => ({
            hash: pattern.requestHash,
            failures: pattern.failureCount,
            shouldEscalate: pattern.shouldEscalate,
            lastFailure: pattern.lastFailure,
        }));
        return {
            totalPatterns: patterns.length,
            escalatingPatterns: patterns.filter((p) => p.shouldEscalate).length,
            patterns,
        };
    }
    /**
     * Converts PartListUnion request to string for processing.
     *
     * Extracts text content from the request parts for pattern matching.
     * Handles various part types and creates a unified string representation.
     *
     * @param request - The request parts to convert
     * @returns String representation of the request
     */
    convertRequestToString(request) {
        if (typeof request === 'string') {
            return request;
        }
        if (Array.isArray(request)) {
            return request
                .map((part) => {
                if (typeof part === 'string') {
                    return part;
                }
                if (part && typeof part === 'object' && part.text) {
                    return part.text;
                }
                return JSON.stringify(part);
            })
                .join(' ');
        }
        if (request && typeof request === 'object' && request.text) {
            return request.text;
        }
        return JSON.stringify(request);
    }
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
    generateRequestHash(request) {
        // Simple hash based on request length and key words
        // In a production system, this could use more sophisticated NLP or embedding-based similarity
        const words = request
            .toLowerCase()
            .split(/\s+/)
            .filter((w) => w.length > 3);
        const keyWords = words.slice(0, 5).sort().join('|');
        const lengthCategory = Math.floor(request.length / 100) * 100; // Bucket by length
        return `${lengthCategory}:${keyWords}`;
    }
}
//# sourceMappingURL=failureEscalationStrategy.js.map