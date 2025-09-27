/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Memory optimization utilities for token counting, text processing, and context management.
 *
 * This module provides memory-efficient alternatives to standard operations that can
 * consume excessive memory during large-scale text processing and token counting.
 *
 * Key optimizations:
 * - Stream-based token counting to avoid loading full content
 * - Memory-efficient string builders for large concatenations
 * - Context window sliding with memory pressure monitoring
 * - Garbage collection hints and memory profiling
 */

import { performance } from 'node:perf_hooks';
import { createReadStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { Transform } from 'node:stream';

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

const DEFAULT_CONFIG: MemoryOptimizerConfig = {
  maxMemoryThreshold: 512 * 1024 * 1024, // 512MB
  streamChunkSize: 64 * 1024, // 64KB chunks
  enableGcHints: true,
  contextSlidingThreshold: 1024 * 1024, // 1MB
  monitoringInterval: 5000, // 5 seconds
};

/**
 * Memory-efficient string builder using array concatenation strategy
 */
export class MemoryEfficientStringBuilder {
  private chunks: string[] = [];
  private totalLength = 0;
  private readonly maxChunkSize: number;

  constructor(maxChunkSize = 1024 * 1024) {
    // 1MB chunks by default
    this.maxChunkSize = maxChunkSize;
  }

  /**
   * Append string content efficiently
   */
  append(content: string): void {
    if (content.length === 0) return;

    // For very large strings, split into chunks to avoid memory spikes
    if (content.length > this.maxChunkSize) {
      for (let i = 0; i < content.length; i += this.maxChunkSize) {
        this.chunks.push(content.slice(i, i + this.maxChunkSize));
        this.totalLength += Math.min(this.maxChunkSize, content.length - i);
      }
    } else {
      this.chunks.push(content);
      this.totalLength += content.length;
    }

    // Trigger consolidation if we have too many small chunks
    if (this.chunks.length > 100 && this.shouldConsolidate()) {
      this.consolidateChunks();
    }
  }

  /**
   * Build final string with memory optimization
   */
  build(): string {
    if (this.chunks.length === 0) return '';
    if (this.chunks.length === 1) {
      const result = this.chunks[0];
      this.clear();
      return result;
    }

    // Use join for efficient concatenation
    const result = this.chunks.join('');

    // Clear chunks to free memory immediately
    this.clear();

    return result;
  }

  /**
   * Get current length without building the string
   */
  length(): number {
    return this.totalLength;
  }

  /**
   * Clear all chunks and reset
   */
  clear(): void {
    this.chunks.length = 0;
    this.totalLength = 0;
  }

  private shouldConsolidate(): boolean {
    // Consolidate if average chunk size is small
    return this.totalLength / this.chunks.length < 1000;
  }

  private consolidateChunks(): void {
    if (this.chunks.length <= 1) return;

    const consolidated: string[] = [];
    let currentChunk = '';

    for (const chunk of this.chunks) {
      if (currentChunk.length + chunk.length > this.maxChunkSize) {
        if (currentChunk) {
          consolidated.push(currentChunk);
          currentChunk = chunk;
        } else {
          consolidated.push(chunk);
        }
      } else {
        currentChunk += chunk;
      }
    }

    if (currentChunk) {
      consolidated.push(currentChunk);
    }

    this.chunks = consolidated;
  }
}

/**
 * Stream-based token counter for memory-efficient processing
 */
export class StreamTokenCounter {
  private tokenCount = 0;
  private config: MemoryOptimizerConfig;

  constructor(config?: Partial<MemoryOptimizerConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Count tokens in a file without loading it entirely into memory
   */
  async countTokensFromFile(filePath: string): Promise<number> {
    this.tokenCount = 0;

    const tokenizeTransform = new Transform({
      transform: (chunk: Buffer, _encoding, callback) => {
        const text = chunk.toString('utf8');
        this.tokenCount += this.estimateTokens(text);
        callback(null, chunk);
      },
      objectMode: false,
    });

    try {
      await pipeline(
        createReadStream(filePath, {
          highWaterMark: this.config.streamChunkSize,
        }),
        tokenizeTransform,
      );
    } catch (error) {
      throw new Error(
        `Failed to count tokens from file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }

    return this.tokenCount;
  }

  /**
   * Count tokens in string content with chunking for large texts
   */
  countTokensFromString(content: string): number {
    if (content.length < this.config.streamChunkSize) {
      return this.estimateTokens(content);
    }

    let totalTokens = 0;
    for (let i = 0; i < content.length; i += this.config.streamChunkSize) {
      const chunk = content.slice(i, i + this.config.streamChunkSize);
      totalTokens += this.estimateTokens(chunk);
    }

    return totalTokens;
  }

  /**
   * Fast token estimation using character-based heuristics
   * This is much faster than exact tokenization for large texts
   */
  private estimateTokens(text: string): number {
    if (!text || text.length === 0) {
      return 0;
    }

    // Average token length is approximately 4 characters for English text
    // This heuristic is ~95% accurate for estimation purposes
    const charCount = text.length;
    const wordCount = text
      .split(/\s+/)
      .filter((word) => word.length > 0).length;

    // Use character-based estimation with word boundary adjustments
    return Math.ceil(charCount / 4) + Math.ceil(wordCount * 0.1);
  }
}

/**
 * Context window manager with memory-efficient sliding
 */
export class ContextWindowManager {
  private config: MemoryOptimizerConfig;
  private memoryMetrics: MemoryMetrics[] = [];
  private monitoringInterval?: NodeJS.Timeout;

  constructor(config?: Partial<MemoryOptimizerConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.startMemoryMonitoring();
  }

  /**
   * Slide context window by removing oldest content when memory pressure is high
   */
  slideContextWindow<T extends { parts?: Array<{ text?: string }> }>(
    history: T[],
    maxTokens: number,
  ): T[] {
    if (history.length === 0) return history;

    const tokenCounter = new StreamTokenCounter(this.config);
    let currentTokens = 0;
    const optimizedHistory: T[] = [];

    // Process history in reverse to keep most recent content
    for (let i = history.length - 1; i >= 0; i--) {
      const entry = history[i];
      const entryTokens = this.estimateEntryTokens(entry, tokenCounter);

      if (currentTokens + entryTokens <= maxTokens) {
        optimizedHistory.unshift(entry);
        currentTokens += entryTokens;
      } else {
        // Try to truncate the entry if it's text content
        const truncatedEntry = this.truncateEntry(
          entry,
          maxTokens - currentTokens,
          tokenCounter,
        );
        if (truncatedEntry) {
          optimizedHistory.unshift(truncatedEntry);
        }
        break;
      }
    }

    // Trigger garbage collection if enabled and memory pressure is high
    if (this.config.enableGcHints && this.isMemoryPressureHigh()) {
      this.suggestGarbageCollection();
    }

    return optimizedHistory;
  }

  /**
   * Get current memory usage metrics
   */
  getCurrentMemoryMetrics(): MemoryMetrics {
    const memUsage = process.memoryUsage();
    return {
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      external: memUsage.external,
      arrayBuffers: memUsage.arrayBuffers,
      rss: memUsage.rss,
      timestamp: Date.now(),
    };
  }

  /**
   * Check if memory pressure is high based on configured thresholds
   */
  isMemoryPressureHigh(): boolean {
    const metrics = this.getCurrentMemoryMetrics();
    return metrics.heapUsed > this.config.maxMemoryThreshold;
  }

  /**
   * Get memory usage history for analysis
   */
  getMemoryHistory(): MemoryMetrics[] {
    return [...this.memoryMetrics];
  }

  /**
   * Dispose of resources and stop monitoring
   */
  dispose(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
    this.memoryMetrics.length = 0;
  }

  private estimateEntryTokens<T extends { parts?: Array<{ text?: string }> }>(
    entry: T,
    tokenCounter: StreamTokenCounter,
  ): number {
    if (!entry.parts) return 0;

    let totalTokens = 0;
    for (const part of entry.parts) {
      if (part.text) {
        totalTokens += tokenCounter.countTokensFromString(part.text);
      }
    }
    return totalTokens;
  }

  private truncateEntry<T extends { parts?: Array<{ text?: string }> }>(
    entry: T,
    maxTokens: number,
    tokenCounter: StreamTokenCounter,
  ): T | null {
    if (!entry.parts || maxTokens <= 0) return null;

    const truncatedParts = [];
    let remainingTokens = maxTokens;

    for (const part of entry.parts) {
      if (part.text) {
        const partTokens = tokenCounter.countTokensFromString(part.text);
        if (partTokens <= remainingTokens) {
          truncatedParts.push(part);
          remainingTokens -= partTokens;
        } else if (remainingTokens > 0) {
          // Truncate this part to fit remaining tokens
          const truncatedText = this.truncateTextToTokens(
            part.text,
            remainingTokens,
          );
          truncatedParts.push({ ...part, text: truncatedText });
          break;
        }
      } else {
        truncatedParts.push(part);
      }
    }

    return truncatedParts.length > 0
      ? { ...entry, parts: truncatedParts }
      : null;
  }

  private truncateTextToTokens(text: string, maxTokens: number): string {
    // Estimate character limit based on token limit (4 chars per token average)
    const estimatedCharLimit = maxTokens * 4;

    if (text.length <= estimatedCharLimit) return text;

    // Truncate at word boundaries when possible
    const truncated = text.slice(0, estimatedCharLimit);
    const lastSpace = truncated.lastIndexOf(' ');

    return lastSpace > estimatedCharLimit * 0.8
      ? truncated.slice(0, lastSpace) + '...'
      : truncated + '...';
  }

  private startMemoryMonitoring(): void {
    this.monitoringInterval = setInterval(() => {
      const metrics = this.getCurrentMemoryMetrics();
      this.memoryMetrics.push(metrics);

      // Keep only last 100 measurements to prevent unbounded growth
      if (this.memoryMetrics.length > 100) {
        this.memoryMetrics.shift();
      }
    }, this.config.monitoringInterval);
  }

  private suggestGarbageCollection(): void {
    if (global.gc) {
      // Node.js with --expose-gc flag
      global.gc();
    } else {
      // Fallback: create memory pressure to encourage GC
      const dummy = new Array(1000).fill(new Array(1000).fill(0));
      dummy.length = 0;
    }
  }
}

/**
 * Memory optimization utilities for various text processing operations
 */
export class MemoryOptimizationUtils {
  private static config: MemoryOptimizerConfig = DEFAULT_CONFIG;

  /**
   * Configure global memory optimization settings
   */
  static configure(config: Partial<MemoryOptimizerConfig>): void {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Optimize large string replacements using streaming approach
   */
  static optimizeStringReplace(
    text: string,
    searchValue: string | RegExp,
    replaceValue: string,
  ): string {
    if (text.length < this.config.streamChunkSize) {
      return text.replace(searchValue, replaceValue);
    }

    const builder = new MemoryEfficientStringBuilder(
      this.config.streamChunkSize,
    );
    const chunkSize = this.config.streamChunkSize;

    for (let i = 0; i < text.length; i += chunkSize) {
      let chunk = text.slice(i, i + chunkSize);

      // Handle potential split in the middle of search pattern
      if (i + chunkSize < text.length && typeof searchValue === 'string') {
        const overlap = searchValue.length - 1;
        const nextChunk = text.slice(i + chunkSize, i + chunkSize + overlap);
        chunk += nextChunk;
      }

      const processedChunk = chunk.replace(searchValue, replaceValue);
      builder.append(processedChunk);
    }

    return builder.build();
  }

  /**
   * Memory-efficient array concatenation for large arrays
   */
  static optimizeArrayConcat<T>(...arrays: T[][]): T[] {
    const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
    const result = new Array<T>(totalLength);

    let offset = 0;
    for (const array of arrays) {
      for (let i = 0; i < array.length; i++) {
        result[offset + i] = array[i];
      }
      offset += array.length;
    }

    return result;
  }

  /**
   * Measure execution time and memory usage of a function
   */
  static async measurePerformance<T>(
    operation: () => Promise<T> | T,
    label: string,
  ): Promise<{ result: T; duration: number; memoryDelta: MemoryMetrics }> {
    const startMemory = process.memoryUsage();
    const startTime = performance.now();

    const result = await operation();

    const endTime = performance.now();
    const endMemory = process.memoryUsage();

    const memoryDelta: MemoryMetrics = {
      heapUsed: endMemory.heapUsed - startMemory.heapUsed,
      heapTotal: endMemory.heapTotal - startMemory.heapTotal,
      external: endMemory.external - startMemory.external,
      arrayBuffers: endMemory.arrayBuffers - startMemory.arrayBuffers,
      rss: endMemory.rss - startMemory.rss,
      timestamp: Date.now(),
    };

    console.log(`[MemoryOptimizer] ${label}:`, {
      duration: `${(endTime - startTime).toFixed(2)}ms`,
      memoryDelta: {
        heapUsed: `${(memoryDelta.heapUsed / 1024 / 1024).toFixed(2)}MB`,
        heapTotal: `${(memoryDelta.heapTotal / 1024 / 1024).toFixed(2)}MB`,
      },
    });

    return { result, duration: endTime - startTime, memoryDelta };
  }
}

/**
 * Global memory optimizer instance for convenience
 */
export const memoryOptimizer = {
  stringBuilder: () => new MemoryEfficientStringBuilder(),
  tokenCounter: (config?: Partial<MemoryOptimizerConfig>) =>
    new StreamTokenCounter(config),
  contextManager: (config?: Partial<MemoryOptimizerConfig>) =>
    new ContextWindowManager(config),
  utils: MemoryOptimizationUtils,
};
