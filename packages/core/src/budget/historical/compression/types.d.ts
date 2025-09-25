/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Historical data compression type definitions
 * Provides optimized storage and retrieval for budget usage historical data
 *
 * @author Historical Data Storage and Analysis Agent
 * @version 1.0.0
 */
import type { BudgetUsageTimeSeriesPoint } from '../storage/types.js';
/**
 * Compression algorithm types
 */
export type CompressionAlgorithm =
  | 'gzip'
  | 'brotli'
  | 'lz4'
  | 'snappy'
  | 'delta'
  | 'rle'
  | 'huffman'
  | 'adaptive';
/**
 * Compression level for algorithms that support it
 */
export type CompressionLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
/**
 * Compression strategy for different data patterns
 */
export type CompressionStrategy = 'speed' | 'ratio' | 'balanced' | 'adaptive';
/**
 * Data block for compression operations
 */
export interface DataBlock {
  /** Unique block identifier */
  id: string;
  /** Original data points */
  data: BudgetUsageTimeSeriesPoint[];
  /** Block metadata */
  metadata: {
    startTime: number;
    endTime: number;
    pointCount: number;
    originalSize: number;
    dataType: 'timeseries' | 'aggregated' | 'raw';
    version: string;
  };
}
/**
 * Compressed data block
 */
export interface CompressedBlock {
  /** Block identifier */
  id: string;
  /** Compressed data buffer */
  compressedData: Buffer;
  /** Compression metadata */
  compression: {
    algorithm: CompressionAlgorithm;
    level?: CompressionLevel;
    strategy: CompressionStrategy;
    originalSize: number;
    compressedSize: number;
    compressionRatio: number;
    compressionTime: number;
    checksum: string;
  };
  /** Block metadata */
  metadata: DataBlock['metadata'];
  /** Compression timestamp */
  compressedAt: number;
}
/**
 * Compression statistics
 */
export interface CompressionStats {
  /** Total blocks processed */
  totalBlocks: number;
  /** Total original size in bytes */
  totalOriginalSize: number;
  /** Total compressed size in bytes */
  totalCompressedSize: number;
  /** Overall compression ratio */
  overallCompressionRatio: number;
  /** Average compression time per block */
  averageCompressionTime: number;
  /** Algorithm performance breakdown */
  algorithmStats: Map<
    CompressionAlgorithm,
    {
      blocksProcessed: number;
      totalOriginalSize: number;
      totalCompressedSize: number;
      averageRatio: number;
      averageTime: number;
    }
  >;
  /** Time range of compressed data */
  timeRange: {
    startTime: number;
    endTime: number;
  };
  /** Space saved in bytes */
  spaceSaved: number;
  /** Compression efficiency percentage */
  efficiency: number;
}
/**
 * Compression configuration options
 */
export interface CompressionConfig {
  /** Default compression algorithm */
  defaultAlgorithm: CompressionAlgorithm;
  /** Default compression level */
  defaultLevel: CompressionLevel;
  /** Default compression strategy */
  defaultStrategy: CompressionStrategy;
  /** Enable adaptive algorithm selection */
  adaptiveSelection: boolean;
  /** Block size for compression (number of data points) */
  blockSize: number;
  /** Maximum memory usage for compression operations */
  maxMemoryUsage: number;
  /** Enable compression verification */
  verifyCompression: boolean;
  /** Enable compression statistics collection */
  collectStats: boolean;
  /** Compression quality threshold (reject if ratio > threshold) */
  qualityThreshold: number;
  /** Parallel compression workers */
  maxWorkers: number;
  /** Compression cache settings */
  cacheSettings: {
    enabled: boolean;
    maxCacheSize: number;
    ttl: number;
  };
}
/**
 * Decompression result
 */
export interface DecompressionResult {
  /** Decompressed data points */
  data: BudgetUsageTimeSeriesPoint[];
  /** Decompression metadata */
  decompression: {
    algorithm: CompressionAlgorithm;
    decompressionTime: number;
    originalSize: number;
    verificationPassed: boolean;
  };
  /** Block metadata */
  metadata: DataBlock['metadata'];
}
/**
 * Compression engine interface
 */
export interface CompressionEngine {
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
}
/**
 * Archive storage interface
 */
export interface ArchiveStorage {
  /**
   * Store compressed block in archive
   */
  storeBlock(compressedBlock: CompressedBlock): Promise<string>;
  /**
   * Retrieve compressed block from archive
   */
  retrieveBlock(blockId: string): Promise<CompressedBlock | null>;
  /**
   * List archived blocks with optional filtering
   */
  listBlocks(filter?: {
    startTime?: number;
    endTime?: number;
    algorithm?: CompressionAlgorithm;
    minCompressionRatio?: number;
  }): Promise<
    Array<{
      id: string;
      metadata: DataBlock['metadata'];
      compression: CompressedBlock['compression'];
      archivedAt: number;
    }>
  >;
  /**
   * Delete archived block
   */
  deleteBlock(blockId: string): Promise<boolean>;
  /**
   * Get archive storage statistics
   */
  getStorageStats(): Promise<{
    totalBlocks: number;
    totalSize: number;
    totalCompressedSize: number;
    averageCompressionRatio: number;
    oldestBlock: number;
    newestBlock: number;
  }>;
  /**
   * Compact archive storage (remove fragmentation)
   */
  compactStorage(): Promise<{
    blocksProcessed: number;
    spaceSaved: number;
    duration: number;
  }>;
}
/**
 * Compression optimization result
 */
export interface OptimizationResult {
  /** Recommended algorithm */
  algorithm: CompressionAlgorithm;
  /** Recommended level */
  level: CompressionLevel;
  /** Recommended strategy */
  strategy: CompressionStrategy;
  /** Expected compression ratio */
  expectedRatio: number;
  /** Expected compression time */
  expectedTime: number;
  /** Memory usage estimate */
  memoryUsage: number;
  /** Confidence in recommendation (0-1) */
  confidence: number;
  /** Reasoning for recommendation */
  reasoning: string[];
}
/**
 * Data pattern analysis for compression optimization
 */
export interface DataPatternAnalysis {
  /** Data characteristics */
  characteristics: {
    entropy: number;
    repetition: number;
    deltaCompressibility: number;
    temporalPattern: 'regular' | 'irregular' | 'bursty';
    valueDistribution: 'uniform' | 'normal' | 'skewed' | 'bimodal';
  };
  /** Recommended compression approaches */
  recommendations: Array<{
    algorithm: CompressionAlgorithm;
    suitabilityScore: number;
    expectedPerformance: {
      ratio: number;
      speed: number;
      memoryEfficiency: number;
    };
  }>;
  /** Analysis metadata */
  analysis: {
    sampleSize: number;
    analysisTime: number;
    confidenceLevel: number;
  };
}
/**
 * Adaptive compression manager
 */
export interface AdaptiveCompressionManager {
  /**
   * Analyze data patterns and recommend compression settings
   */
  analyzeAndRecommend(
    data: BudgetUsageTimeSeriesPoint[],
  ): Promise<OptimizationResult>;
  /**
   * Learn from compression results and improve recommendations
   */
  learnFromResults(
    data: BudgetUsageTimeSeriesPoint[],
    compressionResults: Map<
      CompressionAlgorithm,
      {
        ratio: number;
        time: number;
        success: boolean;
      }
    >,
  ): Promise<void>;
  /**
   * Get current optimization model performance
   */
  getModelPerformance(): Promise<{
    accuracy: number;
    totalPredictions: number;
    correctPredictions: number;
    averageError: number;
  }>;
  /**
   * Reset learning model
   */
  resetModel(): Promise<void>;
}
/**
 * Factory function type for creating compression engines
 */
export type CreateCompressionEngine = (
  config?: Partial<CompressionConfig>,
) => CompressionEngine;
/**
 * Factory function type for creating archive storage
 */
export type CreateArchiveStorage = (config?: {
  storagePath: string;
  maxFileSize?: number;
  compressionLevel?: CompressionLevel;
}) => ArchiveStorage;
