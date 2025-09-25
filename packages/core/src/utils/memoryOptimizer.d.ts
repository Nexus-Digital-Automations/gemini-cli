/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Memory usage metrics for monitoring and optimization
 */
export interface MemoryMetrics {
    heapUsed: number;
    heapTotal: number;
    external: number;
    arrayBuffers: number;
    timestamp: number;
    rss: number;
}
/**
 * Configuration for memory optimization behavior
 */
export interface MemoryOptimizerConfig {
    /** Maximum memory usage before triggering optimizations (bytes) */
    maxMemoryThreshold: number;
    /** Chunk size for streaming operations (bytes) */
    streamChunkSize: number;
    /** Enable garbage collection hints */
    enableGcHints: boolean;
    /** Context window sliding threshold */
    contextSlidingThreshold: number;
    /** Memory monitoring interval (ms) */
    monitoringInterval: number;
}
/**
 * Memory-efficient string builder using array concatenation strategy
 */
export declare class MemoryEfficientStringBuilder {
    private chunks;
    private totalLength;
    private readonly maxChunkSize;
    constructor(maxChunkSize?: number);
    /**
     * Append string content efficiently
     */
    append(content: string): void;
    /**
     * Build final string with memory optimization
     */
    build(): string;
    /**
     * Get current length without building the string
     */
    length(): number;
    /**
     * Clear all chunks and reset
     */
    clear(): void;
    private shouldConsolidate;
    private consolidateChunks;
}
/**
 * Stream-based token counter for memory-efficient processing
 */
export declare class StreamTokenCounter {
    private tokenCount;
    private config;
    constructor(config?: Partial<MemoryOptimizerConfig>);
    /**
     * Count tokens in a file without loading it entirely into memory
     */
    countTokensFromFile(filePath: string): Promise<number>;
    /**
     * Count tokens in string content with chunking for large texts
     */
    countTokensFromString(content: string): number;
    /**
     * Fast token estimation using character-based heuristics
     * This is much faster than exact tokenization for large texts
     */
    private estimateTokens;
}
/**
 * Context window manager with memory-efficient sliding
 */
export declare class ContextWindowManager {
    private config;
    private memoryMetrics;
    private monitoringInterval?;
    constructor(config?: Partial<MemoryOptimizerConfig>);
    /**
     * Slide context window by removing oldest content when memory pressure is high
     */
    slideContextWindow<T extends {
        parts?: Array<{
            text?: string;
        }>;
    }>(history: T[], maxTokens: number): T[];
    /**
     * Get current memory usage metrics
     */
    getCurrentMemoryMetrics(): MemoryMetrics;
    /**
     * Check if memory pressure is high based on configured thresholds
     */
    isMemoryPressureHigh(): boolean;
    /**
     * Get memory usage history for analysis
     */
    getMemoryHistory(): MemoryMetrics[];
    /**
     * Dispose of resources and stop monitoring
     */
    dispose(): void;
    private estimateEntryTokens;
    private truncateEntry;
    private truncateTextToTokens;
    private startMemoryMonitoring;
    private suggestGarbageCollection;
}
/**
 * Memory optimization utilities for various text processing operations
 */
export declare class MemoryOptimizationUtils {
    private static config;
    /**
     * Configure global memory optimization settings
     */
    static configure(config: Partial<MemoryOptimizerConfig>): void;
    /**
     * Optimize large string replacements using streaming approach
     */
    static optimizeStringReplace(text: string, searchValue: string | RegExp, replaceValue: string): string;
    /**
     * Memory-efficient array concatenation for large arrays
     */
    static optimizeArrayConcat<T>(...arrays: T[][]): T[];
    /**
     * Measure execution time and memory usage of a function
     */
    static measurePerformance<T>(operation: () => Promise<T> | T, label: string): Promise<{
        result: T;
        duration: number;
        memoryDelta: MemoryMetrics;
    }>;
}
/**
 * Global memory optimizer instance for convenience
 */
export declare const memoryOptimizer: {
    stringBuilder: () => MemoryEfficientStringBuilder;
    tokenCounter: (config?: Partial<MemoryOptimizerConfig>) => StreamTokenCounter;
    contextManager: (config?: Partial<MemoryOptimizerConfig>) => ContextWindowManager;
    utils: typeof MemoryOptimizationUtils;
};
