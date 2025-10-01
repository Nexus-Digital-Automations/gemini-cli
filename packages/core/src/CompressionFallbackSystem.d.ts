/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { type CompressionResult as BaseCompressionResult, type ContextItem } from './types.js';
/**
 * Extended compression result with fallback information
 */
export interface FallbackCompressionResult extends BaseCompressionResult {
    /** Fallback strategy used */
    fallbackStrategy?: FallbackStrategy;
    /** Number of fallback attempts made */
    fallbackAttempts: number;
    /** Errors encountered during fallback process */
    fallbackErrors: string[];
    /** Whether emergency measures were applied */
    emergencyMeasuresApplied: boolean;
    /** Recovery actions taken */
    recoveryActions: string[];
}
/**
 * Fallback strategy types
 */
export declare enum FallbackStrategy {
    SIMPLE_COMPRESSION = "simple_compression",
    TEXT_TRUNCATION = "text_truncation",
    LINE_REMOVAL = "line_removal",
    WHITESPACE_COMPRESSION = "whitespace_compression",
    LOW_PRIORITY_REMOVAL = "low_priority_removal",
    OLDEST_CONTENT_REMOVAL = "oldest_content_removal",
    REDUNDANT_CONTENT_REMOVAL = "redundant_content_removal",
    AGGRESSIVE_TRUNCATION = "aggressive_truncation",
    EMERGENCY_CONTENT_PURGE = "emergency_content_purge",
    MINIMAL_CONTEXT_PRESERVATION = "minimal_context_preservation",
    RETRY_WITH_DIFFERENT_ALGORITHM = "retry_with_different_algorithm",
    CHUNK_BASED_PROCESSING = "chunk_based_processing",
    MEMORY_OPTIMIZED_COMPRESSION = "memory_optimized_compression"
}
/**
 * Fallback configuration options
 */
export interface FallbackConfig {
    /** Maximum number of fallback attempts */
    maxFallbackAttempts: number;
    /** Enable emergency content removal */
    enableEmergencyRemoval: boolean;
    /** Minimum context preservation ratio */
    minPreservationRatio: number;
    /** Fallback strategy priorities (higher = preferred) */
    strategyPriorities: Record<FallbackStrategy, number>;
    /** Timeout for individual fallback attempts (ms) */
    fallbackTimeoutMs: number;
    /** Enable automatic recovery */
    enableAutoRecovery: boolean;
    /** Recovery retry delay (ms) */
    recoveryRetryDelay: number;
}
/**
 * Default fallback configuration
 */
export declare const DEFAULT_FALLBACK_CONFIG: FallbackConfig;
/**
 * Compression error types for targeted fallback strategies
 */
export declare enum CompressionErrorType {
    MEMORY_EXHAUSTION = "memory_exhaustion",
    TIMEOUT_EXCEEDED = "timeout_exceeded",
    ALGORITHM_FAILURE = "algorithm_failure",
    CONTENT_TYPE_UNKNOWN = "content_type_unknown",
    PARSING_ERROR = "parsing_error",
    INVALID_INPUT = "invalid_input",
    SYSTEM_RESOURCE_LIMIT = "system_resource_limit",
    UNEXPECTED_ERROR = "unexpected_error"
}
/**
 * Comprehensive fallback system for compression failures
 */
export declare class CompressionFallbackSystem {
    private config;
    private basicCompressor;
    private enhancedCompressor;
    private fallbackAttempts;
    private recoveryActions;
    constructor(config?: Partial<FallbackConfig>);
    /**
     * Apply fallback compression when primary compression fails
     */
    applyFallbackCompression(items: ContextItem[], targetRatio: number, primaryError: Error, isEmergency?: boolean): Promise<FallbackCompressionResult>;
    /**
     * Classify compression error to determine appropriate fallback strategy
     */
    private classifyCompressionError;
    /**
     * Select appropriate fallback strategies based on error type and emergency status
     */
    private selectFallbackStrategies;
    /**
     * Apply specific fallback strategy
     */
    private applyFallbackStrategy;
    /**
     * Apply simple character-based compression
     */
    private applySimpleCompression;
    /**
     * Apply whitespace-only compression
     */
    private applyWhitespaceCompression;
    /**
     * Apply text truncation based on priority
     */
    private applyTextTruncation;
    /**
     * Apply line-based removal
     */
    private applyLineRemoval;
    /**
     * Remove low priority items
     */
    private applyLowPriorityRemoval;
    /**
     * Remove oldest content first
     */
    private applyOldestContentRemoval;
    /**
     * Retry with different compression algorithm
     */
    private retryWithDifferentAlgorithm;
    /**
     * Process items in chunks to avoid memory issues
     */
    private applyChunkBasedProcessing;
    /**
     * Apply memory-optimized compression
     */
    private applyMemoryOptimizedCompression;
    /**
     * Apply aggressive truncation for emergency situations
     */
    private applyAggressiveTruncation;
    /**
     * Apply emergency measures when all else fails
     */
    private applyEmergencyMeasures;
    /**
     * Create failure result when all strategies fail
     */
    private createFailureResult;
    /**
     * Generate session ID for tracking
     */
    private generateSessionId;
    /**
     * Estimate token count for text
     */
    private estimateTokenCount;
    /**
     * Update configuration
     */
    updateConfig(newConfig: Partial<FallbackConfig>): void;
    /**
     * Get current configuration
     */
    getConfig(): FallbackConfig;
}
/**
 * Create a compression fallback system instance
 */
export declare function createCompressionFallbackSystem(config?: Partial<FallbackConfig>): CompressionFallbackSystem;
