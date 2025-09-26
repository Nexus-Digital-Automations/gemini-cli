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
export type { CompressionAlgorithm, CompressionLevel, CompressionStrategy, DataBlock, CompressedBlock, DecompressionResult, CompressionStats, CompressionConfig, CompressionEngine, ArchiveStorage, OptimizationResult, DataPatternAnalysis, AdaptiveCompressionManager, CreateCompressionEngine, CreateArchiveStorage, } from './types.js';
export { CompressionEngineImpl, createCompressionEngine, } from './CompressionEngine.js';
export { ArchiveStorageImpl, createArchiveStorage } from './ArchiveStorage.js';
