/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Graceful Fallback Mechanisms for Compression Failures
 * Comprehensive fallback strategies when primary compression fails
 *
 * @author Claude Code - Compression Resilience Specialist
 * @version 1.0.0
 */
import { getComponentLogger } from '../utils/logger.js';
import { SemanticCompressor } from './SemanticCompressor.js';
import { EnhancedCompressionAlgorithms } from './EnhancedCompressionAlgorithms.js';
import { CompressionStrategy, ContextPriority, } from './types.js';
import { performance } from 'node:perf_hooks';
const logger = getComponentLogger('compression-fallback-system');
/**
 * Fallback strategy types
 */
export var FallbackStrategy;
(function (FallbackStrategy) {
    // Compression fallbacks
    FallbackStrategy["SIMPLE_COMPRESSION"] = "simple_compression";
    FallbackStrategy["TEXT_TRUNCATION"] = "text_truncation";
    FallbackStrategy["LINE_REMOVAL"] = "line_removal";
    FallbackStrategy["WHITESPACE_COMPRESSION"] = "whitespace_compression";
    // Content removal fallbacks
    FallbackStrategy["LOW_PRIORITY_REMOVAL"] = "low_priority_removal";
    FallbackStrategy["OLDEST_CONTENT_REMOVAL"] = "oldest_content_removal";
    FallbackStrategy["REDUNDANT_CONTENT_REMOVAL"] = "redundant_content_removal";
    // Emergency fallbacks
    FallbackStrategy["AGGRESSIVE_TRUNCATION"] = "aggressive_truncation";
    FallbackStrategy["EMERGENCY_CONTENT_PURGE"] = "emergency_content_purge";
    FallbackStrategy["MINIMAL_CONTEXT_PRESERVATION"] = "minimal_context_preservation";
    // Recovery strategies
    FallbackStrategy["RETRY_WITH_DIFFERENT_ALGORITHM"] = "retry_with_different_algorithm";
    FallbackStrategy["CHUNK_BASED_PROCESSING"] = "chunk_based_processing";
    FallbackStrategy["MEMORY_OPTIMIZED_COMPRESSION"] = "memory_optimized_compression";
})(FallbackStrategy || (FallbackStrategy = {}));
/**
 * Default fallback configuration
 */
export const DEFAULT_FALLBACK_CONFIG = {
    maxFallbackAttempts: 3,
    enableEmergencyRemoval: true,
    minPreservationRatio: 0.1, // Preserve at least 10% of original content
    strategyPriorities: {
        [FallbackStrategy.SIMPLE_COMPRESSION]: 10,
        [FallbackStrategy.WHITESPACE_COMPRESSION]: 9,
        [FallbackStrategy.TEXT_TRUNCATION]: 8,
        [FallbackStrategy.LINE_REMOVAL]: 7,
        [FallbackStrategy.LOW_PRIORITY_REMOVAL]: 6,
        [FallbackStrategy.OLDEST_CONTENT_REMOVAL]: 5,
        [FallbackStrategy.REDUNDANT_CONTENT_REMOVAL]: 4,
        [FallbackStrategy.RETRY_WITH_DIFFERENT_ALGORITHM]: 8,
        [FallbackStrategy.CHUNK_BASED_PROCESSING]: 7,
        [FallbackStrategy.MEMORY_OPTIMIZED_COMPRESSION]: 6,
        [FallbackStrategy.AGGRESSIVE_TRUNCATION]: 3,
        [FallbackStrategy.EMERGENCY_CONTENT_PURGE]: 2,
        [FallbackStrategy.MINIMAL_CONTEXT_PRESERVATION]: 1,
    },
    fallbackTimeoutMs: 10000, // 10 seconds per fallback attempt
    enableAutoRecovery: true,
    recoveryRetryDelay: 2000, // 2 second delay between recovery attempts
};
/**
 * Compression error types for targeted fallback strategies
 */
export var CompressionErrorType;
(function (CompressionErrorType) {
    CompressionErrorType["MEMORY_EXHAUSTION"] = "memory_exhaustion";
    CompressionErrorType["TIMEOUT_EXCEEDED"] = "timeout_exceeded";
    CompressionErrorType["ALGORITHM_FAILURE"] = "algorithm_failure";
    CompressionErrorType["CONTENT_TYPE_UNKNOWN"] = "content_type_unknown";
    CompressionErrorType["PARSING_ERROR"] = "parsing_error";
    CompressionErrorType["INVALID_INPUT"] = "invalid_input";
    CompressionErrorType["SYSTEM_RESOURCE_LIMIT"] = "system_resource_limit";
    CompressionErrorType["UNEXPECTED_ERROR"] = "unexpected_error";
})(CompressionErrorType || (CompressionErrorType = {}));
/**
 * Comprehensive fallback system for compression failures
 */
export class CompressionFallbackSystem {
    config;
    basicCompressor;
    enhancedCompressor;
    fallbackAttempts = new Map();
    recoveryActions = new Map();
    constructor(config = {}) {
        this.config = { ...DEFAULT_FALLBACK_CONFIG, ...config };
        this.basicCompressor = new SemanticCompressor();
        this.enhancedCompressor = new EnhancedCompressionAlgorithms();
        logger.info('CompressionFallbackSystem initialized', {
            maxFallbackAttempts: this.config.maxFallbackAttempts,
            enableEmergencyRemoval: this.config.enableEmergencyRemoval,
            enableAutoRecovery: this.config.enableAutoRecovery,
        });
    }
    /**
     * Apply fallback compression when primary compression fails
     */
    async applyFallbackCompression(items, targetRatio, primaryError, isEmergency = false) {
        const startTime = performance.now();
        const sessionId = this.generateSessionId(items);
        logger.warn('Primary compression failed, applying fallback strategies', {
            itemCount: items.length,
            targetRatio,
            primaryError: primaryError.message,
            isEmergency,
            sessionId,
        });
        const fallbackErrors = [primaryError.message];
        const recoveryActions = [];
        let fallbackAttempts = 0;
        let emergencyMeasuresApplied = false;
        // Classify the primary error to determine best fallback strategy
        const errorType = this.classifyCompressionError(primaryError);
        const fallbackStrategies = this.selectFallbackStrategies(errorType, isEmergency);
        let bestResult = null;
        const workingItems = [...items]; // Work with a copy
        for (const strategy of fallbackStrategies) {
            if (fallbackAttempts >= this.config.maxFallbackAttempts) {
                logger.warn('Maximum fallback attempts reached', {
                    attempts: fallbackAttempts,
                    maxAttempts: this.config.maxFallbackAttempts,
                    sessionId,
                });
                break;
            }
            try {
                fallbackAttempts++;
                logger.info(`Attempting fallback strategy: ${strategy}`, {
                    attempt: fallbackAttempts,
                    sessionId,
                    remainingItems: workingItems.length,
                });
                const result = await this.applyFallbackStrategy(strategy, workingItems, targetRatio, isEmergency, sessionId);
                if (result.success) {
                    bestResult = {
                        ...result,
                        fallbackStrategy: strategy,
                        fallbackAttempts,
                        fallbackErrors,
                        emergencyMeasuresApplied,
                        recoveryActions,
                    };
                    logger.info('Fallback strategy succeeded', {
                        strategy,
                        attempt: fallbackAttempts,
                        compressionRatio: result.compressionRatio,
                        sessionId,
                    });
                    // If we achieved good compression, break out
                    if (result.compressionRatio <= targetRatio * 1.2) {
                        // Within 20% of target
                        break;
                    }
                }
                else {
                    fallbackErrors.push('Compression failed - success is false');
                }
            }
            catch (error) {
                logger.warn('Fallback strategy failed', {
                    strategy,
                    error: error,
                    attempt: fallbackAttempts,
                    sessionId,
                });
                fallbackErrors.push(error instanceof Error ? error.message : String(error));
            }
        }
        // Apply emergency measures if all fallbacks failed and emergency enabled
        if (!bestResult && isEmergency && this.config.enableEmergencyRemoval) {
            logger.error('All fallback strategies failed, applying emergency measures', { sessionId });
            try {
                const emergencyResult = await this.applyEmergencyMeasures(workingItems, targetRatio, sessionId);
                emergencyMeasuresApplied = true;
                recoveryActions.push('emergency_content_removal');
                bestResult = {
                    ...emergencyResult,
                    fallbackStrategy: FallbackStrategy.EMERGENCY_CONTENT_PURGE,
                    fallbackAttempts,
                    fallbackErrors,
                    emergencyMeasuresApplied,
                    recoveryActions,
                };
            }
            catch (emergencyError) {
                logger.error('Emergency measures failed', {
                    error: emergencyError,
                    sessionId,
                });
                fallbackErrors.push(emergencyError instanceof Error
                    ? emergencyError.message
                    : String(emergencyError));
            }
        }
        const duration = performance.now() - startTime;
        // Return final result or create failure result
        if (bestResult) {
            logger.info('Fallback compression completed', {
                strategy: bestResult.fallbackStrategy,
                attempts: fallbackAttempts,
                duration,
                success: true,
                sessionId,
            });
            return bestResult;
        }
        else {
            logger.error('All fallback strategies exhausted', {
                attempts: fallbackAttempts,
                duration,
                sessionId,
            });
            return this.createFailureResult(items, fallbackAttempts, fallbackErrors, emergencyMeasuresApplied, recoveryActions, duration);
        }
    }
    /**
     * Classify compression error to determine appropriate fallback strategy
     */
    classifyCompressionError(error) {
        const message = error.message.toLowerCase();
        const stack = error.stack?.toLowerCase() || '';
        if (message.includes('memory') ||
            message.includes('heap') ||
            stack.includes('memory')) {
            return CompressionErrorType.MEMORY_EXHAUSTION;
        }
        if (message.includes('timeout') ||
            message.includes('time') ||
            message.includes('slow')) {
            return CompressionErrorType.TIMEOUT_EXCEEDED;
        }
        if (message.includes('parse') ||
            message.includes('syntax') ||
            message.includes('json')) {
            return CompressionErrorType.PARSING_ERROR;
        }
        if (message.includes('unknown') ||
            message.includes('unsupported') ||
            message.includes('type')) {
            return CompressionErrorType.CONTENT_TYPE_UNKNOWN;
        }
        if (message.includes('invalid') ||
            message.includes('malformed') ||
            message.includes('corrupt')) {
            return CompressionErrorType.INVALID_INPUT;
        }
        if (message.includes('resource') ||
            message.includes('limit') ||
            message.includes('quota')) {
            return CompressionErrorType.SYSTEM_RESOURCE_LIMIT;
        }
        if (message.includes('algorithm') ||
            message.includes('compression') ||
            message.includes('strategy')) {
            return CompressionErrorType.ALGORITHM_FAILURE;
        }
        return CompressionErrorType.UNEXPECTED_ERROR;
    }
    /**
     * Select appropriate fallback strategies based on error type and emergency status
     */
    selectFallbackStrategies(errorType, isEmergency) {
        let strategies = [];
        switch (errorType) {
            case CompressionErrorType.MEMORY_EXHAUSTION:
                strategies = [
                    FallbackStrategy.CHUNK_BASED_PROCESSING,
                    FallbackStrategy.MEMORY_OPTIMIZED_COMPRESSION,
                    FallbackStrategy.SIMPLE_COMPRESSION,
                    FallbackStrategy.WHITESPACE_COMPRESSION,
                ];
                break;
            case CompressionErrorType.TIMEOUT_EXCEEDED:
                strategies = [
                    FallbackStrategy.SIMPLE_COMPRESSION,
                    FallbackStrategy.WHITESPACE_COMPRESSION,
                    FallbackStrategy.TEXT_TRUNCATION,
                    FallbackStrategy.LINE_REMOVAL,
                ];
                break;
            case CompressionErrorType.ALGORITHM_FAILURE:
                strategies = [
                    FallbackStrategy.RETRY_WITH_DIFFERENT_ALGORITHM,
                    FallbackStrategy.SIMPLE_COMPRESSION,
                    FallbackStrategy.TEXT_TRUNCATION,
                ];
                break;
            case CompressionErrorType.CONTENT_TYPE_UNKNOWN:
                strategies = [
                    FallbackStrategy.SIMPLE_COMPRESSION,
                    FallbackStrategy.WHITESPACE_COMPRESSION,
                    FallbackStrategy.LINE_REMOVAL,
                    FallbackStrategy.TEXT_TRUNCATION,
                ];
                break;
            case CompressionErrorType.PARSING_ERROR:
                strategies = [
                    FallbackStrategy.WHITESPACE_COMPRESSION,
                    FallbackStrategy.LINE_REMOVAL,
                    FallbackStrategy.TEXT_TRUNCATION,
                    FallbackStrategy.SIMPLE_COMPRESSION,
                ];
                break;
            default:
                strategies = [
                    FallbackStrategy.SIMPLE_COMPRESSION,
                    FallbackStrategy.WHITESPACE_COMPRESSION,
                    FallbackStrategy.TEXT_TRUNCATION,
                    FallbackStrategy.LOW_PRIORITY_REMOVAL,
                ];
        }
        // Add emergency strategies if in emergency mode
        if (isEmergency) {
            strategies.push(FallbackStrategy.LOW_PRIORITY_REMOVAL, FallbackStrategy.OLDEST_CONTENT_REMOVAL, FallbackStrategy.AGGRESSIVE_TRUNCATION);
        }
        // Sort by priority
        return strategies.sort((a, b) => this.config.strategyPriorities[b] - this.config.strategyPriorities[a]);
    }
    /**
     * Apply specific fallback strategy
     */
    async applyFallbackStrategy(strategy, items, targetRatio, _isEmergency, _sessionId) {
        const _startTime = performance.now();
        switch (strategy) {
            case FallbackStrategy.SIMPLE_COMPRESSION:
                return this.applySimpleCompression(items, targetRatio);
            case FallbackStrategy.WHITESPACE_COMPRESSION:
                return this.applyWhitespaceCompression(items, targetRatio);
            case FallbackStrategy.TEXT_TRUNCATION:
                return this.applyTextTruncation(items, targetRatio);
            case FallbackStrategy.LINE_REMOVAL:
                return this.applyLineRemoval(items, targetRatio);
            case FallbackStrategy.LOW_PRIORITY_REMOVAL:
                return this.applyLowPriorityRemoval(items, targetRatio);
            case FallbackStrategy.OLDEST_CONTENT_REMOVAL:
                return this.applyOldestContentRemoval(items, targetRatio);
            case FallbackStrategy.RETRY_WITH_DIFFERENT_ALGORITHM:
                return this.retryWithDifferentAlgorithm(items, targetRatio);
            case FallbackStrategy.CHUNK_BASED_PROCESSING:
                return this.applyChunkBasedProcessing(items, targetRatio);
            case FallbackStrategy.MEMORY_OPTIMIZED_COMPRESSION:
                return this.applyMemoryOptimizedCompression(items, targetRatio);
            case FallbackStrategy.AGGRESSIVE_TRUNCATION:
                return this.applyAggressiveTruncation(items, targetRatio);
            default:
                throw new Error(`Unsupported fallback strategy: ${strategy}`);
        }
    }
    /**
     * Apply simple character-based compression
     */
    async applySimpleCompression(items, _targetRatio) {
        let totalOriginalTokens = 0;
        let totalCompressedTokens = 0;
        const compressedItems = [];
        for (const item of items) {
            totalOriginalTokens += item.tokenCount;
            // Simple compression: remove extra whitespace, compress repeated characters
            const compressed = item.content
                .replace(/\s+/g, ' ') // Multiple spaces to single space
                .replace(/\n\s*\n/g, '\n') // Multiple newlines to single newline
                .replace(/(.)\1{3,}/g, '$1$1') // Repeated characters (keep max 2)
                .trim();
            const compressedTokenCount = this.estimateTokenCount(compressed);
            totalCompressedTokens += compressedTokenCount;
            compressedItems.push({
                ...item,
                content: compressed,
                tokenCount: compressedTokenCount,
            });
        }
        return {
            success: true,
            original: items.map((i) => i.content).join('\n'),
            compressed: compressedItems.map((i) => i.content).join('\n'),
            originalTokens: totalOriginalTokens,
            compressedTokens: totalCompressedTokens,
            compressionRatio: totalCompressedTokens / totalOriginalTokens,
            preservedConcepts: ['whitespace_normalized'],
            informationLoss: 0.1, // Minimal information loss
            strategy: CompressionStrategy.PROGRESSIVE_DETAIL,
        };
    }
    /**
     * Apply whitespace-only compression
     */
    async applyWhitespaceCompression(items, _targetRatio) {
        let totalOriginalTokens = 0;
        let totalCompressedTokens = 0;
        const compressedItems = [];
        for (const item of items) {
            totalOriginalTokens += item.tokenCount;
            // Only compress whitespace, preserve all content
            const compressed = item.content
                .replace(/[ \t]+/g, ' ') // Multiple spaces/tabs to single space
                .replace(/\n[ \t]+/g, '\n') // Remove leading whitespace on lines
                .replace(/[ \t]+\n/g, '\n') // Remove trailing whitespace on lines
                .replace(/\n{3,}/g, '\n\n'); // Max 2 consecutive newlines
            const compressedTokenCount = this.estimateTokenCount(compressed);
            totalCompressedTokens += compressedTokenCount;
            compressedItems.push({
                ...item,
                content: compressed,
                tokenCount: compressedTokenCount,
            });
        }
        return {
            success: true,
            original: items.map((i) => i.content).join('\n'),
            compressed: compressedItems.map((i) => i.content).join('\n'),
            originalTokens: totalOriginalTokens,
            compressedTokens: totalCompressedTokens,
            compressionRatio: totalCompressedTokens / totalOriginalTokens,
            preservedConcepts: ['content_preserved', 'whitespace_compressed'],
            informationLoss: 0.05, // Very minimal information loss
            strategy: CompressionStrategy.KEYWORD_EXTRACTION,
        };
    }
    /**
     * Apply text truncation based on priority
     */
    async applyTextTruncation(items, targetRatio) {
        let totalOriginalTokens = 0;
        let totalCompressedTokens = 0;
        const targetTotalTokens = items.reduce((sum, item) => sum + item.tokenCount, 0) * targetRatio;
        // Sort items by priority (critical items preserved fully)
        const prioritizedItems = items.sort((a, b) => {
            const priorityOrder = {
                [ContextPriority.CRITICAL]: 4,
                [ContextPriority.HIGH]: 3,
                [ContextPriority.MEDIUM]: 2,
                [ContextPriority.LOW]: 1,
                [ContextPriority.CACHED]: 0,
            };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        });
        const compressedItems = [];
        let currentTokens = 0;
        for (const item of prioritizedItems) {
            totalOriginalTokens += item.tokenCount;
            const remainingBudget = targetTotalTokens - currentTokens;
            if (item.priority === ContextPriority.CRITICAL ||
                remainingBudget >= item.tokenCount) {
                // Keep item fully
                compressedItems.push(item);
                currentTokens += item.tokenCount;
                totalCompressedTokens += item.tokenCount;
            }
            else if (remainingBudget > item.tokenCount * 0.3) {
                // Truncate item to fit remaining budget
                const truncationRatio = remainingBudget / item.tokenCount;
                const targetLength = Math.floor(item.content.length * truncationRatio);
                let truncated = item.content.substring(0, targetLength);
                // Try to end at a natural boundary (sentence, line, etc.)
                const lastSentence = truncated.lastIndexOf('.');
                const lastNewline = truncated.lastIndexOf('\n');
                const lastSpace = truncated.lastIndexOf(' ');
                const boundary = Math.max(lastSentence, lastNewline, lastSpace);
                if (boundary > targetLength * 0.8) {
                    truncated = truncated.substring(0, boundary + 1);
                }
                truncated += '... [truncated]';
                const compressedTokenCount = this.estimateTokenCount(truncated);
                compressedItems.push({
                    ...item,
                    content: truncated,
                    tokenCount: compressedTokenCount,
                });
                currentTokens += compressedTokenCount;
                totalCompressedTokens += compressedTokenCount;
            }
            // Else: skip item entirely (no remaining budget)
        }
        return {
            success: true,
            original: items.map((i) => i.content).join('\n'),
            compressed: compressedItems.map((i) => i.content).join('\n'),
            originalTokens: totalOriginalTokens,
            compressedTokens: totalCompressedTokens,
            compressionRatio: totalCompressedTokens / totalOriginalTokens,
            preservedConcepts: ['critical_content_preserved', 'natural_boundaries'],
            informationLoss: Math.max(0.2, 1 - totalCompressedTokens / totalOriginalTokens),
            strategy: CompressionStrategy.PROGRESSIVE_DETAIL,
        };
    }
    /**
     * Apply line-based removal
     */
    async applyLineRemoval(items, targetRatio) {
        let totalOriginalTokens = 0;
        let totalCompressedTokens = 0;
        const compressedItems = [];
        for (const item of items) {
            totalOriginalTokens += item.tokenCount;
            const lines = item.content.split('\n');
            const targetLines = Math.max(1, Math.floor(lines.length * targetRatio));
            // Keep first and last lines, sample from middle
            const selectedLines = [];
            if (lines.length <= targetLines) {
                selectedLines.push(...lines);
            }
            else {
                // Always keep first line
                selectedLines.push(lines[0]);
                // Sample from middle lines
                const middleLines = lines.slice(1, -1);
                const middleTarget = Math.max(0, targetLines - 2);
                const step = Math.max(1, Math.floor(middleLines.length / middleTarget));
                for (let i = 0; i < middleLines.length && selectedLines.length - 1 < middleTarget; i += step) {
                    selectedLines.push(middleLines[i]);
                }
                // Always keep last line if there's budget
                if (selectedLines.length < targetLines && lines.length > 1) {
                    selectedLines.push(lines[lines.length - 1]);
                }
            }
            const compressed = selectedLines.join('\n');
            const compressedTokenCount = this.estimateTokenCount(compressed);
            totalCompressedTokens += compressedTokenCount;
            compressedItems.push({
                ...item,
                content: compressed,
                tokenCount: compressedTokenCount,
            });
        }
        return {
            success: true,
            original: items.map((i) => i.content).join('\n'),
            compressed: compressedItems.map((i) => i.content).join('\n'),
            originalTokens: totalOriginalTokens,
            compressedTokens: totalCompressedTokens,
            compressionRatio: totalCompressedTokens / totalOriginalTokens,
            preservedConcepts: ['first_last_lines_preserved', 'sampled_content'],
            informationLoss: Math.max(0.3, 1 - totalCompressedTokens / totalOriginalTokens),
            strategy: CompressionStrategy.PROGRESSIVE_DETAIL,
        };
    }
    /**
     * Remove low priority items
     */
    async applyLowPriorityRemoval(items, targetRatio) {
        const totalOriginalTokens = items.reduce((sum, item) => sum + item.tokenCount, 0);
        const targetTokens = totalOriginalTokens * targetRatio;
        // Sort by priority (keep higher priority items)
        const prioritizedItems = items.sort((a, b) => {
            const priorityOrder = {
                [ContextPriority.CRITICAL]: 4,
                [ContextPriority.HIGH]: 3,
                [ContextPriority.MEDIUM]: 2,
                [ContextPriority.LOW]: 1,
                [ContextPriority.CACHED]: 0,
            };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        });
        const selectedItems = [];
        let currentTokens = 0;
        for (const item of prioritizedItems) {
            if (currentTokens + item.tokenCount <= targetTokens ||
                selectedItems.length === 0) {
                selectedItems.push(item);
                currentTokens += item.tokenCount;
            }
        }
        return {
            success: true,
            original: items.map((i) => i.content).join('\n'),
            compressed: selectedItems.map((i) => i.content).join('\n'),
            originalTokens: totalOriginalTokens,
            compressedTokens: currentTokens,
            compressionRatio: currentTokens / totalOriginalTokens,
            preservedConcepts: ['high_priority_items_preserved'],
            informationLoss: Math.max(0.2, 1 - currentTokens / totalOriginalTokens),
            strategy: CompressionStrategy.PROGRESSIVE_DETAIL,
        };
    }
    /**
     * Remove oldest content first
     */
    async applyOldestContentRemoval(items, targetRatio) {
        const totalOriginalTokens = items.reduce((sum, item) => sum + item.tokenCount, 0);
        const targetTokens = totalOriginalTokens * targetRatio;
        // Sort by timestamp (newest first)
        const sortedItems = items.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        const selectedItems = [];
        let currentTokens = 0;
        for (const item of sortedItems) {
            if (currentTokens + item.tokenCount <= targetTokens) {
                selectedItems.push(item);
                currentTokens += item.tokenCount;
            }
        }
        // Restore chronological order
        selectedItems.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
        return {
            success: true,
            original: items.map((i) => i.content).join('\n'),
            compressed: selectedItems.map((i) => i.content).join('\n'),
            originalTokens: totalOriginalTokens,
            compressedTokens: currentTokens,
            compressionRatio: currentTokens / totalOriginalTokens,
            preservedConcepts: ['recent_content_preserved'],
            informationLoss: Math.max(0.3, 1 - currentTokens / totalOriginalTokens),
            strategy: CompressionStrategy.PROGRESSIVE_DETAIL,
        };
    }
    /**
     * Retry with different compression algorithm
     */
    async retryWithDifferentAlgorithm(items, targetRatio) {
        // Try basic semantic compressor with different strategy
        try {
            const results = await this.basicCompressor.batchCompress(items, targetRatio);
            let totalOriginalTokens = 0;
            let totalCompressedTokens = 0;
            const compressedContent = [];
            for (const [_itemId, result] of results.entries()) {
                totalOriginalTokens += result.originalTokens;
                totalCompressedTokens += result.compressedTokens;
                compressedContent.push(result.compressed);
            }
            return {
                success: true,
                original: items.map((i) => i.content).join('\n'),
                compressed: compressedContent.join('\n'),
                originalTokens: totalOriginalTokens,
                compressedTokens: totalCompressedTokens,
                compressionRatio: totalCompressedTokens / totalOriginalTokens,
                preservedConcepts: ['semantic_compression_applied'],
                informationLoss: Math.max(0.15, 1 - (totalCompressedTokens / totalOriginalTokens) * 0.9),
                strategy: CompressionStrategy.SUMMARIZATION,
            };
        }
        catch (_error) {
            // Fall back to simple compression if semantic compression also fails
            return this.applySimpleCompression(items, targetRatio);
        }
    }
    /**
     * Process items in chunks to avoid memory issues
     */
    async applyChunkBasedProcessing(items, targetRatio) {
        const chunkSize = 10; // Process 10 items at a time
        const chunks = [];
        for (let i = 0; i < items.length; i += chunkSize) {
            chunks.push(items.slice(i, i + chunkSize));
        }
        let totalOriginalTokens = 0;
        let totalCompressedTokens = 0;
        const allCompressedContent = [];
        for (const chunk of chunks) {
            try {
                // Apply simple compression to each chunk
                const chunkResult = await this.applySimpleCompression(chunk, targetRatio);
                totalOriginalTokens += chunkResult.originalTokens;
                totalCompressedTokens += chunkResult.compressedTokens;
                allCompressedContent.push(chunkResult.compressed);
            }
            catch (_chunkError) {
                // If chunk fails, just use original content
                const chunkOriginal = chunk.map((item) => item.content).join('\n');
                const chunkTokens = chunk.reduce((sum, item) => sum + item.tokenCount, 0);
                totalOriginalTokens += chunkTokens;
                totalCompressedTokens += chunkTokens;
                allCompressedContent.push(chunkOriginal);
            }
        }
        return {
            success: true,
            original: items.map((i) => i.content).join('\n'),
            compressed: allCompressedContent.join('\n'),
            originalTokens: totalOriginalTokens,
            compressedTokens: totalCompressedTokens,
            compressionRatio: totalCompressedTokens / totalOriginalTokens,
            preservedConcepts: ['chunk_based_processing'],
            informationLoss: Math.max(0.1, 1 - (totalCompressedTokens / totalOriginalTokens) * 0.9),
            strategy: CompressionStrategy.PROGRESSIVE_DETAIL,
        };
    }
    /**
     * Apply memory-optimized compression
     */
    async applyMemoryOptimizedCompression(items, targetRatio) {
        // Process one item at a time to minimize memory usage
        let totalOriginalTokens = 0;
        let totalCompressedTokens = 0;
        const compressedContent = [];
        for (const item of items) {
            totalOriginalTokens += item.tokenCount;
            // Apply very simple compression to minimize memory usage
            let compressed = item.content;
            // Basic compressions that don't require much memory
            compressed = compressed
                .replace(/\s+/g, ' ') // Normalize whitespace
                .replace(/\n\s*/g, '\n') // Remove indentation
                .trim();
            // Truncate if still too long
            const targetLength = Math.floor(item.content.length * targetRatio);
            if (compressed.length > targetLength) {
                compressed = compressed.substring(0, targetLength) + '...';
            }
            const compressedTokenCount = this.estimateTokenCount(compressed);
            totalCompressedTokens += compressedTokenCount;
            compressedContent.push(compressed);
        }
        return {
            success: true,
            original: items.map((i) => i.content).join('\n'),
            compressed: compressedContent.join('\n'),
            originalTokens: totalOriginalTokens,
            compressedTokens: totalCompressedTokens,
            compressionRatio: totalCompressedTokens / totalOriginalTokens,
            preservedConcepts: ['memory_optimized'],
            informationLoss: Math.max(0.2, 1 - (totalCompressedTokens / totalOriginalTokens) * 0.9),
            strategy: CompressionStrategy.KEYWORD_EXTRACTION,
        };
    }
    /**
     * Apply aggressive truncation for emergency situations
     */
    async applyAggressiveTruncation(items, targetRatio) {
        const totalOriginalTokens = items.reduce((sum, item) => sum + item.tokenCount, 0);
        const targetTokens = totalOriginalTokens * targetRatio;
        // Keep only the most essential items and truncate heavily
        const criticalItems = items.filter((item) => item.priority === ContextPriority.CRITICAL);
        const highItems = items.filter((item) => item.priority === ContextPriority.HIGH);
        const otherItems = items.filter((item) => item.priority !== ContextPriority.CRITICAL &&
            item.priority !== ContextPriority.HIGH);
        const selectedItems = [];
        let currentTokens = 0;
        // Add critical items with minimal truncation
        for (const item of criticalItems) {
            const maxTokensForItem = Math.min(item.tokenCount, targetTokens * 0.3); // Max 30% of budget per critical item
            const targetLength = Math.floor(item.content.length * (maxTokensForItem / item.tokenCount));
            let content = item.content;
            if (content.length > targetLength) {
                content =
                    content.substring(0, targetLength) + '... [truncated - critical]';
            }
            const tokenCount = this.estimateTokenCount(content);
            selectedItems.push({ ...item, content, tokenCount });
            currentTokens += tokenCount;
        }
        // Add high priority items with more truncation
        for (const item of highItems) {
            if (currentTokens >= targetTokens * 0.8)
                break; // Reserve 20% for other items
            const remainingBudget = targetTokens * 0.8 - currentTokens;
            const maxTokensForItem = Math.min(item.tokenCount * 0.5, remainingBudget);
            const targetLength = Math.floor(item.content.length * (maxTokensForItem / item.tokenCount));
            let content = item.content;
            if (content.length > targetLength) {
                content = content.substring(0, targetLength) + '... [truncated - high]';
            }
            const tokenCount = this.estimateTokenCount(content);
            selectedItems.push({ ...item, content, tokenCount });
            currentTokens += tokenCount;
        }
        // Add other items if any budget remains
        for (const item of otherItems) {
            if (currentTokens >= targetTokens)
                break;
            const remainingBudget = targetTokens - currentTokens;
            if (remainingBudget > item.tokenCount * 0.2) {
                // Need at least 20% of original size
                const targetLength = Math.floor(item.content.length * (remainingBudget / item.tokenCount));
                const content = item.content.substring(0, targetLength) + '... [truncated]';
                const tokenCount = this.estimateTokenCount(content);
                selectedItems.push({ ...item, content, tokenCount });
                currentTokens += tokenCount;
            }
        }
        return {
            success: true,
            original: items.map((i) => i.content).join('\n'),
            compressed: selectedItems.map((i) => i.content).join('\n'),
            originalTokens: totalOriginalTokens,
            compressedTokens: currentTokens,
            compressionRatio: currentTokens / totalOriginalTokens,
            preservedConcepts: ['critical_items_preserved', 'aggressive_truncation'],
            informationLoss: Math.max(0.4, 1 - (currentTokens / totalOriginalTokens) * 0.8),
            strategy: CompressionStrategy.PROGRESSIVE_DETAIL,
        };
    }
    /**
     * Apply emergency measures when all else fails
     */
    async applyEmergencyMeasures(items, targetRatio, sessionId) {
        logger.error('Applying emergency content removal measures', { sessionId });
        const totalOriginalTokens = items.reduce((sum, item) => sum + item.tokenCount, 0);
        const targetTokens = Math.max(totalOriginalTokens * targetRatio, totalOriginalTokens * this.config.minPreservationRatio);
        // Keep only absolutely critical items
        const criticalItems = items.filter((item) => item.priority === ContextPriority.CRITICAL);
        // If no critical items, keep the most recent high priority items
        let selectedItems = criticalItems;
        if (criticalItems.length === 0) {
            const highPriorityItems = items
                .filter((item) => item.priority === ContextPriority.HIGH)
                .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                .slice(0, 3); // Keep max 3 high priority items
            selectedItems = highPriorityItems;
        }
        // If still over budget, truncate each item to fit
        const currentTokens = selectedItems.reduce((sum, item) => sum + item.tokenCount, 0);
        if (currentTokens > targetTokens && selectedItems.length > 0) {
            const tokensPerItem = Math.floor(targetTokens / selectedItems.length);
            selectedItems = selectedItems.map((item) => {
                if (item.tokenCount <= tokensPerItem) {
                    return item;
                }
                const targetLength = Math.floor(item.content.length * (tokensPerItem / item.tokenCount));
                const content = item.content.substring(0, targetLength) +
                    '... [EMERGENCY TRUNCATION]';
                const tokenCount = this.estimateTokenCount(content);
                return { ...item, content, tokenCount };
            });
        }
        const finalTokens = selectedItems.reduce((sum, item) => sum + item.tokenCount, 0);
        return {
            success: true,
            original: items.map((i) => i.content).join('\n'),
            compressed: selectedItems.map((i) => i.content).join('\n'),
            originalTokens: totalOriginalTokens,
            compressedTokens: finalTokens,
            compressionRatio: finalTokens / totalOriginalTokens,
            preservedConcepts: ['emergency_preservation_only'],
            informationLoss: Math.max(0.7, 1 - (finalTokens / totalOriginalTokens) * 0.5),
            strategy: CompressionStrategy.PROGRESSIVE_DETAIL,
        };
    }
    /**
     * Create failure result when all strategies fail
     */
    createFailureResult(items, fallbackAttempts, fallbackErrors, emergencyMeasuresApplied, recoveryActions, _duration) {
        const totalTokens = items.reduce((sum, item) => sum + item.tokenCount, 0);
        return {
            success: false,
            original: items.map((i) => i.content).join('\n'),
            compressed: items.map((i) => i.content).join('\n'),
            originalTokens: totalTokens,
            compressedTokens: totalTokens,
            compressionRatio: 1.0,
            preservedConcepts: ['no_compression_applied'],
            informationLoss: 0,
            strategy: CompressionStrategy.PROGRESSIVE_DETAIL,
            fallbackAttempts,
            fallbackErrors,
            emergencyMeasuresApplied,
            recoveryActions,
        };
    }
    /**
     * Generate session ID for tracking
     */
    generateSessionId(items) {
        const timestamp = Date.now();
        const itemCount = items.length;
        const totalTokens = items.reduce((sum, item) => sum + item.tokenCount, 0);
        return `fallback_${timestamp}_${itemCount}_${totalTokens}`;
    }
    /**
     * Estimate token count for text
     */
    estimateTokenCount(text) {
        return Math.ceil(text.length / 4); // Rough estimation: 4 characters per token
    }
    /**
     * Update configuration
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        logger.info('CompressionFallbackSystem configuration updated', {
            newConfig: this.config,
        });
    }
    /**
     * Get current configuration
     */
    getConfig() {
        return { ...this.config };
    }
}
/**
 * Create a compression fallback system instance
 */
export function createCompressionFallbackSystem(config) {
    return new CompressionFallbackSystem(config);
}
//# sourceMappingURL=CompressionFallbackSystem.js.map