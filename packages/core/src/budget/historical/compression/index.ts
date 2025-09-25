/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Historical data compression system exports
 * Provides advanced data compression and archival storage capabilities
 *
 * @author Historical Data Storage and Analysis Agent
 * @version 1.0.0
 */

// Export core types and interfaces
export type {
  CompressionAlgorithm,
  CompressionLevel,
  CompressionStrategy,
  DataBlock,
  CompressedBlock,
  DecompressionResult,
  CompressionStats,
  CompressionConfig,
  CompressionEngine,
  ArchiveStorage,
  OptimizationResult,
  DataPatternAnalysis,
  AdaptiveCompressionManager,
  CreateCompressionEngine,
  CreateArchiveStorage,
} from './types.js';

// Export compression engine implementation
export {
  CompressionEngineImpl,
  createCompressionEngine,
} from './CompressionEngine.js';

// Export archive storage implementation
export { ArchiveStorageImpl, createArchiveStorage } from './ArchiveStorage.js';
