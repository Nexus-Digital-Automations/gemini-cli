/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  ContextItem,
  CompressionConfig,
  CompressionResult,
} from './types.js';
/**
 * Default configuration for semantic compression
 */
export declare const DEFAULT_COMPRESSION_CONFIG: CompressionConfig;
/**
 * Semantic Context Compression Engine
 *
 * The SemanticCompressor reduces context size while preserving essential meaning
 * through various AI-powered compression techniques including summarization,
 * keyword extraction, semantic clustering, and progressive detail reduction.
 *
 * Compression Strategies:
 * - Summarization: Extract key points from lengthy content
 * - Keyword Extraction: Keep important keywords and remove filler
 * - Semantic Clustering: Group similar concepts together
 * - Progressive Detail: Remove less important details first
 *
 * @example
 * ```typescript
 * const compressor = new SemanticCompressor();
 * const result = await compressor.compress(contextItem);
 * console.log(`Compressed from ${result.originalTokens} to ${result.compressedTokens} tokens`);
 * console.log(`Compression ratio: ${result.compressionRatio.toFixed(2)}`);
 * ```
 */
export declare class SemanticCompressor {
  private config;
  private strategies;
  private compressionCache;
  constructor(config?: Partial<CompressionConfig>);
  /**
   * Compress a context item using the configured strategy
   *
   * @param item - Context item to compress
   * @param targetRatio - Optional target compression ratio (overrides config)
   * @returns Compression result with original and compressed content
   */
  compress(item: ContextItem, targetRatio?: number): Promise<CompressionResult>;
  /**
   * Batch compress multiple context items
   *
   * @param items - Context items to compress
   * @param targetRatio - Target compression ratio
   * @returns Map of item IDs to compression results
   */
  batchCompress(
    items: ContextItem[],
    targetRatio?: number,
  ): Promise<Map<string, CompressionResult>>;
  /**
   * Select the optimal compression strategy for a context item
   */
  private selectOptimalStrategy;
  /**
   * Initialize compression strategy implementations
   */
  private initializeStrategies;
  /**
   * Validate compression result meets quality requirements
   */
  private validateCompressionResult;
  /**
   * Utility function to chunk array into smaller batches
   */
  private chunkArray;
  /**
   * Clear compression cache
   */
  clearCache(): void;
  /**
   * Update configuration
   */
  updateConfig(config: Partial<CompressionConfig>): void;
  /**
   * Get current configuration
   */
  getConfig(): CompressionConfig;
}
/**
 * Create a semantic compressor instance with optional configuration
 */
export declare function createSemanticCompressor(
  config?: Partial<CompressionConfig>,
): SemanticCompressor;
