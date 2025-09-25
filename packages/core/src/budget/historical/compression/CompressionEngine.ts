/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Advanced compression engine implementation
 * Provides optimized data compression with multiple algorithms and adaptive selection
 *
 * @author Historical Data Storage and Analysis Agent
 * @version 1.0.0
 */

import * as zlib from 'node:zlib';
import * as crypto from 'node:crypto';
import { promisify } from 'node:util';
import { createLogger } from '../../../utils/logger.js';
import type { Logger } from '../../../types/common.js';
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

// Promisify compression functions
const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);
const brotliCompress = promisify(zlib.brotliCompress);
const brotliDecompress = promisify(zlib.brotliDecompress);

/**
 * High-performance compression engine with multiple algorithms
 * Supports adaptive algorithm selection and parallel processing
 */
export class CompressionEngineImpl implements CompressionEngine {
  private readonly logger: Logger;
  private readonly config: CompressionConfig;
  private readonly stats: CompressionStats;
  private readonly compressionCache = new Map<string, CompressedBlock>();

  /**
   * Create a new compression engine
   */
  constructor(config: Partial<CompressionConfig> = {}) {
    this.logger = createLogger('CompressionEngine');
    this.config = this.createDefaultConfig(config);
    this.stats = this.initializeStats();

    this.logger.info('CompressionEngine initialized', {
      algorithm: this.config.defaultAlgorithm,
      level: this.config.defaultLevel,
      strategy: this.config.defaultStrategy,
      blockSize: this.config.blockSize,
      adaptiveSelection: this.config.adaptiveSelection,
    });
  }

  /**
   * Create default compression configuration
   */
  private createDefaultConfig(
    overrides: Partial<CompressionConfig>,
  ): CompressionConfig {
    return {
      defaultAlgorithm: 'gzip',
      defaultLevel: 6,
      defaultStrategy: 'balanced',
      adaptiveSelection: true,
      blockSize: 1000,
      maxMemoryUsage: 256 * 1024 * 1024, // 256MB
      verifyCompression: true,
      collectStats: true,
      qualityThreshold: 0.95, // Reject if compression ratio > 95%
      maxWorkers: 4,
      cacheSettings: {
        enabled: true,
        maxCacheSize: 100,
        ttl: 300000, // 5 minutes
      },
      ...overrides,
    };
  }

  /**
   * Initialize compression statistics
   */
  private initializeStats(): CompressionStats {
    return {
      totalBlocks: 0,
      totalOriginalSize: 0,
      totalCompressedSize: 0,
      overallCompressionRatio: 0,
      averageCompressionTime: 0,
      algorithmStats: new Map(),
      timeRange: { startTime: 0, endTime: 0 },
      spaceSaved: 0,
      efficiency: 0,
    };
  }

  /**
   * Compress a data block
   */
  async compressBlock(
    block: DataBlock,
    options?: {
      algorithm?: CompressionAlgorithm;
      level?: CompressionLevel;
      strategy?: CompressionStrategy;
    },
  ): Promise<CompressedBlock> {
    const startTime = Date.now();
    const algorithm = options?.algorithm || this.config.defaultAlgorithm;
    const level = options?.level || this.config.defaultLevel;
    const strategy = options?.strategy || this.config.defaultStrategy;

    this.logger.info('Starting block compression', {
      blockId: block.id,
      algorithm,
      level,
      strategy,
      dataPoints: block.data.length,
    });

    try {
      // Check cache first
      const cacheKey = this.generateCacheKey(block, algorithm, level);
      if (
        this.config.cacheSettings.enabled &&
        this.compressionCache.has(cacheKey)
      ) {
        const cached = this.compressionCache.get(cacheKey)!;
        this.logger.info('Returning cached compression result', {
          blockId: block.id,
          cacheHit: true,
        });
        return cached;
      }

      // Select optimal algorithm if adaptive
      const selectedAlgorithm = this.config.adaptiveSelection
        ? await this.selectOptimalAlgorithm(block.data)
        : algorithm;

      // Serialize data for compression
      const serializedData = this.serializeData(block.data);
      const originalSize = Buffer.byteLength(serializedData);

      // Compress using selected algorithm
      const compressedBuffer = await this.compressData(
        serializedData,
        selectedAlgorithm,
        level,
        strategy,
      );

      const compressedSize = compressedBuffer.length;
      const compressionRatio = compressedSize / originalSize;
      const compressionTime = Date.now() - startTime;

      // Check compression quality
      if (compressionRatio > this.config.qualityThreshold) {
        this.logger.warn('Poor compression ratio detected', {
          blockId: block.id,
          algorithm: selectedAlgorithm,
          ratio: compressionRatio,
          threshold: this.config.qualityThreshold,
        });
      }

      // Generate checksum
      const checksum = crypto
        .createHash('sha256')
        .update(compressedBuffer)
        .digest('hex');

      // Create compressed block
      const compressedBlock: CompressedBlock = {
        id: block.id,
        compressedData: compressedBuffer,
        compression: {
          algorithm: selectedAlgorithm,
          level,
          strategy,
          originalSize,
          compressedSize,
          compressionRatio,
          compressionTime,
          checksum,
        },
        metadata: { ...block.metadata },
        compressedAt: Date.now(),
      };

      // Verify compression if enabled
      if (this.config.verifyCompression) {
        const verified = await this.verifyIntegrity(compressedBlock);
        if (!verified) {
          throw new Error('Compression verification failed');
        }
      }

      // Update statistics
      if (this.config.collectStats) {
        this.updateStats(compressedBlock);
      }

      // Cache result
      if (this.config.cacheSettings.enabled) {
        this.addToCache(cacheKey, compressedBlock);
      }

      this.logger.info('Block compression completed', {
        blockId: block.id,
        algorithm: selectedAlgorithm,
        originalSize,
        compressedSize,
        ratio: compressionRatio.toFixed(3),
        duration: compressionTime,
        spaceSaved: originalSize - compressedSize,
      });

      return compressedBlock;
    } catch (error) {
      this.logger.error('Block compression failed', {
        blockId: block.id,
        error: error.message,
        duration: Date.now() - startTime,
      });
      throw error;
    }
  }

  /**
   * Decompress a compressed block
   */
  async decompressBlock(
    compressedBlock: CompressedBlock,
  ): Promise<DecompressionResult> {
    const startTime = Date.now();

    this.logger.info('Starting block decompression', {
      blockId: compressedBlock.id,
      algorithm: compressedBlock.compression.algorithm,
      compressedSize: compressedBlock.compression.compressedSize,
    });

    try {
      // Verify integrity before decompression
      if (this.config.verifyCompression) {
        const verified = await this.verifyIntegrity(compressedBlock);
        if (!verified) {
          throw new Error('Compressed block integrity verification failed');
        }
      }

      // Decompress data
      const decompressedBuffer = await this.decompressData(
        compressedBlock.compressedData,
        compressedBlock.compression.algorithm,
      );

      // Deserialize data
      const data = this.deserializeData(decompressedBuffer.toString());
      const decompressionTime = Date.now() - startTime;

      // Create decompression result
      const result: DecompressionResult = {
        data,
        decompression: {
          algorithm: compressedBlock.compression.algorithm,
          decompressionTime,
          originalSize: compressedBlock.compression.originalSize,
          verificationPassed: this.config.verifyCompression,
        },
        metadata: { ...compressedBlock.metadata },
      };

      this.logger.info('Block decompression completed', {
        blockId: compressedBlock.id,
        dataPoints: data.length,
        duration: decompressionTime,
      });

      return result;
    } catch (error) {
      this.logger.error('Block decompression failed', {
        blockId: compressedBlock.id,
        error: error.message,
        duration: Date.now() - startTime,
      });
      throw error;
    }
  }

  /**
   * Compress multiple blocks in parallel
   */
  async compressBlocks(
    blocks: DataBlock[],
    options?: {
      algorithm?: CompressionAlgorithm;
      level?: CompressionLevel;
      strategy?: CompressionStrategy;
      maxConcurrency?: number;
    },
  ): Promise<CompressedBlock[]> {
    const startTime = Date.now();
    const maxConcurrency = options?.maxConcurrency || this.config.maxWorkers;

    this.logger.info('Starting parallel block compression', {
      blockCount: blocks.length,
      maxConcurrency,
      algorithm: options?.algorithm || this.config.defaultAlgorithm,
    });

    try {
      // Process blocks in batches to control concurrency
      const results: CompressedBlock[] = [];
      const batches = this.createBatches(blocks, maxConcurrency);

      for (const batch of batches) {
        const batchPromises = batch.map((block) =>
          this.compressBlock(block, options),
        );

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);

        // Log progress
        this.logger.info('Batch compression completed', {
          batchSize: batch.length,
          completedBlocks: results.length,
          totalBlocks: blocks.length,
        });
      }

      this.logger.info('Parallel block compression completed', {
        blockCount: blocks.length,
        duration: Date.now() - startTime,
        averageRatio:
          results.reduce(
            (sum, block) => sum + block.compression.compressionRatio,
            0,
          ) / results.length,
      });

      return results;
    } catch (error) {
      this.logger.error('Parallel block compression failed', {
        error: error.message,
        duration: Date.now() - startTime,
      });
      throw error;
    }
  }

  /**
   * Test compression algorithms on sample data
   */
  async benchmarkAlgorithms(
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
  > {
    const testAlgorithms = algorithms || ['gzip', 'brotli', 'lz4', 'delta'];
    const results = new Map();

    this.logger.info('Starting algorithm benchmark', {
      algorithms: testAlgorithms,
      sampleSize: sampleData.length,
    });

    // Create test block
    const testBlock: DataBlock = {
      id: 'benchmark-test',
      data: sampleData,
      metadata: {
        startTime: sampleData[0]?.timestamp || 0,
        endTime: sampleData[sampleData.length - 1]?.timestamp || 0,
        pointCount: sampleData.length,
        originalSize: Buffer.byteLength(JSON.stringify(sampleData)),
        dataType: 'timeseries',
        version: '1.0.0',
      },
    };

    for (const algorithm of testAlgorithms) {
      try {
        // Measure compression
        const compressionStart = Date.now();
        const memoryBefore = process.memoryUsage().heapUsed;

        const compressedBlock = await this.compressBlock(testBlock, {
          algorithm,
          level: 6, // Standard level for fair comparison
          strategy: 'balanced',
        });

        const compressionTime = Date.now() - compressionStart;
        const memoryAfterCompression = process.memoryUsage().heapUsed;

        // Measure decompression
        const decompressionStart = Date.now();
        await this.decompressBlock(compressedBlock);
        const decompressionTime = Date.now() - decompressionStart;

        const memoryUsage = memoryAfterCompression - memoryBefore;

        results.set(algorithm, {
          compressionRatio: compressedBlock.compression.compressionRatio,
          compressionTime,
          decompressionTime,
          memoryUsage: Math.max(0, memoryUsage),
        });

        this.logger.info('Algorithm benchmark completed', {
          algorithm,
          ratio: compressedBlock.compression.compressionRatio.toFixed(3),
          compressionTime,
          decompressionTime,
          memoryUsage,
        });
      } catch (error) {
        this.logger.error('Algorithm benchmark failed', {
          algorithm,
          error: error.message,
        });

        results.set(algorithm, {
          compressionRatio: 1.0, // No compression
          compressionTime: 0,
          decompressionTime: 0,
          memoryUsage: 0,
        });
      }
    }

    return results;
  }

  /**
   * Get compression statistics
   */
  async getCompressionStats(): Promise<CompressionStats> {
    return { ...this.stats };
  }

  /**
   * Optimize compression settings based on data patterns
   */
  async optimizeSettings(
    sampleData: BudgetUsageTimeSeriesPoint[],
  ): Promise<Partial<CompressionConfig>> {
    this.logger.info('Optimizing compression settings', {
      sampleSize: sampleData.length,
    });

    try {
      // Benchmark different algorithms
      const benchmarkResults = await this.benchmarkAlgorithms(sampleData);

      // Find optimal algorithm based on balanced score
      let bestAlgorithm: CompressionAlgorithm = 'gzip';
      let bestScore = 0;

      for (const [algorithm, metrics] of benchmarkResults.entries()) {
        // Calculate balanced score (lower is better)
        const compressionScore = metrics.compressionRatio; // Lower is better
        const speedScore = metrics.compressionTime / 1000; // Normalize to seconds
        const memoryScore = metrics.memoryUsage / (1024 * 1024); // Normalize to MB

        // Weighted score (prioritize compression ratio)
        const balancedScore =
          compressionScore * 0.6 + speedScore * 0.2 + memoryScore * 0.2;

        if (bestScore === 0 || balancedScore < bestScore) {
          bestScore = balancedScore;
          bestAlgorithm = algorithm;
        }
      }

      // Determine optimal strategy based on data characteristics
      const strategy = this.analyzeDataStrategy(sampleData);

      // Determine optimal block size
      const optimalBlockSize = this.calculateOptimalBlockSize(sampleData);

      const optimizedConfig: Partial<CompressionConfig> = {
        defaultAlgorithm: bestAlgorithm,
        defaultStrategy: strategy,
        blockSize: optimalBlockSize,
        adaptiveSelection: true,
      };

      this.logger.info('Compression settings optimized', {
        algorithm: bestAlgorithm,
        strategy,
        blockSize: optimalBlockSize,
        bestScore: bestScore.toFixed(3),
      });

      return optimizedConfig;
    } catch (error) {
      this.logger.error('Compression optimization failed', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Verify compressed data integrity
   */
  async verifyIntegrity(compressedBlock: CompressedBlock): Promise<boolean> {
    try {
      // Verify checksum
      const actualChecksum = crypto
        .createHash('sha256')
        .update(compressedBlock.compressedData)
        .digest('hex');

      if (actualChecksum !== compressedBlock.compression.checksum) {
        this.logger.error('Checksum verification failed', {
          blockId: compressedBlock.id,
          expected: compressedBlock.compression.checksum,
          actual: actualChecksum,
        });
        return false;
      }

      // Verify decompression works
      const decompressed = await this.decompressData(
        compressedBlock.compressedData,
        compressedBlock.compression.algorithm,
      );

      // Verify size matches
      if (decompressed.length !== compressedBlock.compression.originalSize) {
        this.logger.error('Decompressed size mismatch', {
          blockId: compressedBlock.id,
          expected: compressedBlock.compression.originalSize,
          actual: decompressed.length,
        });
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error('Integrity verification failed', {
        blockId: compressedBlock.id,
        error: error.message,
      });
      return false;
    }
  }

  /**
   * Serialize data for compression
   */
  private serializeData(data: BudgetUsageTimeSeriesPoint[]): string {
    return JSON.stringify(data);
  }

  /**
   * Deserialize data after decompression
   */
  private deserializeData(
    serializedData: string,
  ): BudgetUsageTimeSeriesPoint[] {
    return JSON.parse(serializedData);
  }

  /**
   * Compress data using specified algorithm
   */
  private async compressData(
    data: string,
    algorithm: CompressionAlgorithm,
    level: CompressionLevel,
    strategy: CompressionStrategy,
  ): Promise<Buffer> {
    const dataBuffer = Buffer.from(data, 'utf8');

    switch (algorithm) {
      case 'gzip':
        return await gzip(dataBuffer, { level });

      case 'brotli':
        return await brotliCompress(dataBuffer, {
          params: {
            [zlib.constants.BROTLI_PARAM_QUALITY]: level,
            [zlib.constants.BROTLI_PARAM_MODE]:
              strategy === 'speed'
                ? zlib.constants.BROTLI_MODE_GENERIC
                : strategy === 'ratio'
                  ? zlib.constants.BROTLI_MODE_TEXT
                  : zlib.constants.BROTLI_MODE_GENERIC,
          },
        });

      case 'delta':
        return this.deltaCompress(dataBuffer);

      case 'rle':
        return this.runLengthEncode(dataBuffer);

      case 'lz4':
      case 'snappy':
      case 'huffman':
        // Fallback to gzip for unsupported algorithms
        this.logger.warn('Algorithm not implemented, falling back to gzip', {
          algorithm,
        });
        return await gzip(dataBuffer, { level });

      default:
        throw new Error(`Unsupported compression algorithm: ${algorithm}`);
    }
  }

  /**
   * Decompress data using specified algorithm
   */
  private async decompressData(
    compressedData: Buffer,
    algorithm: CompressionAlgorithm,
  ): Promise<Buffer> {
    switch (algorithm) {
      case 'gzip':
        return await gunzip(compressedData);

      case 'brotli':
        return await brotliDecompress(compressedData);

      case 'delta':
        return this.deltaDecompress(compressedData);

      case 'rle':
        return this.runLengthDecode(compressedData);

      case 'lz4':
      case 'snappy':
      case 'huffman':
        // Fallback to gzip for unsupported algorithms
        return await gunzip(compressedData);

      default:
        throw new Error(`Unsupported compression algorithm: ${algorithm}`);
    }
  }

  /**
   * Simple delta compression implementation
   */
  private deltaCompress(data: Buffer): Buffer {
    if (data.length === 0) return data;

    const deltas: number[] = [data[0]]; // First byte as-is
    for (let i = 1; i < data.length; i++) {
      deltas.push(data[i] - data[i - 1]);
    }

    return Buffer.from(deltas);
  }

  /**
   * Simple delta decompression implementation
   */
  private deltaDecompress(compressed: Buffer): Buffer {
    if (compressed.length === 0) return compressed;

    const result = Buffer.alloc(compressed.length);
    result[0] = compressed[0]; // First byte as-is

    for (let i = 1; i < compressed.length; i++) {
      result[i] = result[i - 1] + compressed[i];
    }

    return result;
  }

  /**
   * Simple run-length encoding implementation
   */
  private runLengthEncode(data: Buffer): Buffer {
    if (data.length === 0) return data;

    const encoded: number[] = [];
    let count = 1;
    let current = data[0];

    for (let i = 1; i < data.length; i++) {
      if (data[i] === current && count < 255) {
        count++;
      } else {
        encoded.push(current, count);
        current = data[i];
        count = 1;
      }
    }

    encoded.push(current, count);
    return Buffer.from(encoded);
  }

  /**
   * Simple run-length decoding implementation
   */
  private runLengthDecode(encoded: Buffer): Buffer {
    const decoded: number[] = [];

    for (let i = 0; i < encoded.length; i += 2) {
      const value = encoded[i];
      const count = encoded[i + 1];

      for (let j = 0; j < count; j++) {
        decoded.push(value);
      }
    }

    return Buffer.from(decoded);
  }

  /**
   * Select optimal algorithm based on data characteristics
   */
  private async selectOptimalAlgorithm(
    data: BudgetUsageTimeSeriesPoint[],
  ): Promise<CompressionAlgorithm> {
    // Simple heuristics for algorithm selection
    const dataSize = Buffer.byteLength(JSON.stringify(data));

    // For small data, use fast algorithms
    if (dataSize < 1024) {
      return 'gzip';
    }

    // For time series data, delta compression might be effective
    if (this.hasTemporalPatterns(data)) {
      return 'delta';
    }

    // For highly repetitive data, RLE might work well
    if (this.hasRepetitivePatterns(data)) {
      return 'rle';
    }

    // Default to balanced general-purpose algorithm
    return 'gzip';
  }

  /**
   * Check if data has temporal patterns suitable for delta compression
   */
  private hasTemporalPatterns(data: BudgetUsageTimeSeriesPoint[]): boolean {
    if (data.length < 3) return false;

    // Check if timestamps are regularly spaced
    const intervals: number[] = [];
    for (let i = 1; i < Math.min(10, data.length); i++) {
      intervals.push(data[i].timestamp - data[i - 1].timestamp);
    }

    const avgInterval =
      intervals.reduce((sum, val) => sum + val, 0) / intervals.length;
    const variance =
      intervals.reduce((sum, val) => sum + Math.pow(val - avgInterval, 2), 0) /
      intervals.length;

    // Low variance indicates regular temporal patterns
    return variance < avgInterval * 0.1;
  }

  /**
   * Check if data has repetitive patterns suitable for RLE
   */
  private hasRepetitivePatterns(data: BudgetUsageTimeSeriesPoint[]): boolean {
    if (data.length < 5) return false;

    // Count consecutive identical values
    let consecutiveCount = 0;
    let totalConsecutive = 0;

    for (let i = 1; i < data.length; i++) {
      if (
        data[i].totalCost === data[i - 1].totalCost &&
        data[i].requestCount === data[i - 1].requestCount
      ) {
        consecutiveCount++;
      } else {
        if (consecutiveCount > 1) {
          totalConsecutive += consecutiveCount;
        }
        consecutiveCount = 0;
      }
    }

    // High repetition ratio indicates suitability for RLE
    return totalConsecutive / data.length > 0.3;
  }

  /**
   * Analyze data to determine optimal compression strategy
   */
  private analyzeDataStrategy(
    data: BudgetUsageTimeSeriesPoint[],
  ): CompressionStrategy {
    const dataSize = Buffer.byteLength(JSON.stringify(data));

    // For large datasets, prioritize compression ratio
    if (dataSize > 1024 * 1024) {
      // 1MB
      return 'ratio';
    }

    // For small datasets, prioritize speed
    if (dataSize < 10 * 1024) {
      // 10KB
      return 'speed';
    }

    // For medium datasets, use balanced approach
    return 'balanced';
  }

  /**
   * Calculate optimal block size based on data characteristics
   */
  private calculateOptimalBlockSize(
    data: BudgetUsageTimeSeriesPoint[],
  ): number {
    // Base block size on data point density and memory constraints
    const avgPointSize = Buffer.byteLength(JSON.stringify(data)) / data.length;
    const maxBlockSize = this.config.maxMemoryUsage / (4 * avgPointSize); // 4x buffer for processing

    // Ensure reasonable bounds
    return Math.max(100, Math.min(10000, Math.floor(maxBlockSize)));
  }

  /**
   * Update compression statistics
   */
  private updateStats(compressedBlock: CompressedBlock): void {
    const { compression, metadata } = compressedBlock;

    this.stats.totalBlocks++;
    this.stats.totalOriginalSize += compression.originalSize;
    this.stats.totalCompressedSize += compression.compressedSize;

    // Update overall compression ratio
    this.stats.overallCompressionRatio =
      this.stats.totalCompressedSize / this.stats.totalOriginalSize;

    // Update average compression time
    this.stats.averageCompressionTime =
      (this.stats.averageCompressionTime * (this.stats.totalBlocks - 1) +
        compression.compressionTime) /
      this.stats.totalBlocks;

    // Update algorithm-specific stats
    const algorithmStats = this.stats.algorithmStats.get(
      compression.algorithm,
    ) || {
      blocksProcessed: 0,
      totalOriginalSize: 0,
      totalCompressedSize: 0,
      averageRatio: 0,
      averageTime: 0,
    };

    algorithmStats.blocksProcessed++;
    algorithmStats.totalOriginalSize += compression.originalSize;
    algorithmStats.totalCompressedSize += compression.compressedSize;
    algorithmStats.averageRatio =
      algorithmStats.totalCompressedSize / algorithmStats.totalOriginalSize;
    algorithmStats.averageTime =
      (algorithmStats.averageTime * (algorithmStats.blocksProcessed - 1) +
        compression.compressionTime) /
      algorithmStats.blocksProcessed;

    this.stats.algorithmStats.set(compression.algorithm, algorithmStats);

    // Update time range
    if (
      this.stats.timeRange.startTime === 0 ||
      metadata.startTime < this.stats.timeRange.startTime
    ) {
      this.stats.timeRange.startTime = metadata.startTime;
    }
    if (metadata.endTime > this.stats.timeRange.endTime) {
      this.stats.timeRange.endTime = metadata.endTime;
    }

    // Update space saved and efficiency
    this.stats.spaceSaved =
      this.stats.totalOriginalSize - this.stats.totalCompressedSize;
    this.stats.efficiency =
      (this.stats.spaceSaved / this.stats.totalOriginalSize) * 100;
  }

  /**
   * Generate cache key for compression results
   */
  private generateCacheKey(
    block: DataBlock,
    algorithm: CompressionAlgorithm,
    level: CompressionLevel,
  ): string {
    const hash = crypto.createHash('md5');
    hash.update(JSON.stringify(block.data));
    hash.update(algorithm);
    hash.update(level.toString());
    return hash.digest('hex');
  }

  /**
   * Add compressed block to cache
   */
  private addToCache(key: string, compressedBlock: CompressedBlock): void {
    if (this.compressionCache.size >= this.config.cacheSettings.maxCacheSize) {
      // Remove oldest entry (simple LRU)
      const firstKey = this.compressionCache.keys().next().value;
      this.compressionCache.delete(firstKey);
    }

    this.compressionCache.set(key, compressedBlock);

    // Set TTL cleanup
    setTimeout(() => {
      this.compressionCache.delete(key);
    }, this.config.cacheSettings.ttl);
  }

  /**
   * Create batches for parallel processing
   */
  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }
}

/**
 * Factory function to create a compression engine
 */
export function createCompressionEngine(
  config?: Partial<CompressionConfig>,
): CompressionEngine {
  return new CompressionEngineImpl(config);
}
