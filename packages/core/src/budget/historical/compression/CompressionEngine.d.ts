/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { BudgetUsageTimeSeriesPoint } from '../storage/types.js';
import type {
  CompressionEngine,
  CompressionConfig,
  CompressionAlgorithm,
  CompressionLevel,
  CompressionStrategy,
  DataBlock,
  CompressedBlock,
  DecompressionResult,
  CompressionStats,
} from './types.js';
/**
 * High-performance compression engine with multiple algorithms
 * Supports adaptive algorithm selection and parallel processing
 */
export declare class CompressionEngineImpl implements CompressionEngine {
  private readonly logger;
  private readonly config;
  private readonly stats;
  private readonly compressionCache;
  /**
   * Create a new compression engine
   */
  constructor(config?: Partial<CompressionConfig>);
  /**
   * Create default compression configuration
   */
  private createDefaultConfig;
  /**
   * Initialize compression statistics
   */
  private initializeStats;
  /**
   * Compress a data block
   */
  compressBlock(
    block: DataBlock,
    options?: {
      algorithm?: CompressionAlgorithm;
      level?: CompressionLevel;
      strategy?: CompressionStrategy;
    },
  ): Promise<CompressedBlock>;
  /**
   * Decompress a compressed block
   */
  decompressBlock(
    compressedBlock: CompressedBlock,
  ): Promise<DecompressionResult>;
  /**
   * Compress multiple blocks in parallel
   */
  compressBlocks(
    blocks: DataBlock[],
    options?: {
      algorithm?: CompressionAlgorithm;
      level?: CompressionLevel;
      strategy?: CompressionStrategy;
      maxConcurrency?: number;
    },
  ): Promise<CompressedBlock[]>;
  /**
   * Test compression algorithms on sample data
   */
  benchmarkAlgorithms(
    sampleData: BudgetUsageTimeSeriesPoint[],
    algorithms?: CompressionAlgorithm[],
  ): Promise<
    Map<
      CompressionAlgorithm,
      {
        compressionRatio: number;
        compressionTime: number;
        decompressionTime: number;
        memoryUsage: number;
      }
    >
  >;
  /**
   * Get compression statistics
   */
  getCompressionStats(): Promise<CompressionStats>;
  /**
   * Optimize compression settings based on data patterns
   */
  optimizeSettings(
    sampleData: BudgetUsageTimeSeriesPoint[],
  ): Promise<Partial<CompressionConfig>>;
  /**
   * Verify compressed data integrity
   */
  verifyIntegrity(compressedBlock: CompressedBlock): Promise<boolean>;
  /**
   * Serialize data for compression
   */
  private serializeData;
  /**
   * Deserialize data after decompression
   */
  private deserializeData;
  /**
   * Compress data using specified algorithm
   */
  private compressData;
  /**
   * Decompress data using specified algorithm
   */
  private decompressData;
  /**
   * Simple delta compression implementation
   */
  private deltaCompress;
  /**
   * Simple delta decompression implementation
   */
  private deltaDecompress;
  /**
   * Simple run-length encoding implementation
   */
  private runLengthEncode;
  /**
   * Simple run-length decoding implementation
   */
  private runLengthDecode;
  /**
   * Select optimal algorithm based on data characteristics
   */
  private selectOptimalAlgorithm;
  /**
   * Check if data has temporal patterns suitable for delta compression
   */
  private hasTemporalPatterns;
  /**
   * Check if data has repetitive patterns suitable for RLE
   */
  private hasRepetitivePatterns;
  /**
   * Analyze data to determine optimal compression strategy
   */
  private analyzeDataStrategy;
  /**
   * Calculate optimal block size based on data characteristics
   */
  private calculateOptimalBlockSize;
  /**
   * Update compression statistics
   */
  private updateStats;
  /**
   * Generate cache key for compression results
   */
  private generateCacheKey;
  /**
   * Add compressed block to cache
   */
  private addToCache;
  /**
   * Create batches for parallel processing
   */
  private createBatches;
}
/**
 * Factory function to create a compression engine
 */
export declare function createCompressionEngine(
  config?: Partial<CompressionConfig>,
): CompressionEngine;
