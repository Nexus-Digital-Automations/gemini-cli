/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  ArchiveStorage,
  CompressedBlock,
  CompressionAlgorithm,
  DataBlock,
} from './types.js';
/**
 * File-based archive storage implementation
 * Provides efficient compressed data storage with metadata indexing
 */
export declare class ArchiveStorageImpl implements ArchiveStorage {
  private readonly logger;
  private readonly storagePath;
  private readonly indexPath;
  private readonly maxFileSize;
  private index;
  private indexDirty;
  /**
   * Create a new archive storage instance
   */
  constructor(config: { storagePath: string; maxFileSize?: number });
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
  /**
   * Shutdown archive storage and save index
   */
  shutdown(): Promise<void>;
  /**
   * Initialize storage directory and load index
   */
  private initializeStorage;
  /**
   * Ensure storage directory exists
   */
  private ensureStorageDirectory;
  /**
   * Create empty index structure
   */
  private createEmptyIndex;
  /**
   * Load archive index from file
   */
  private loadIndex;
  /**
   * Save archive index to file
   */
  private saveIndex;
  /**
   * Update index with new archive metadata
   */
  private updateIndex;
  /**
   * Remove block from index
   */
  private removeFromIndex;
  /**
   * Generate time index key from timestamp
   */
  private getTimeIndexKey;
  /**
   * Generate file name for compressed block
   */
  private generateFileName;
}
/**
 * Factory function to create archive storage
 */
export declare function createArchiveStorage(config: {
  storagePath: string;
  maxFileSize?: number;
}): ArchiveStorage;
