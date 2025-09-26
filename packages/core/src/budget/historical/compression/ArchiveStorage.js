/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Archive storage implementation for compressed historical data
 * Provides efficient long-term storage with metadata indexing and retrieval
 *
 * @author Historical Data Storage and Analysis Agent
 * @version 1.0.0
 */
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as crypto from 'node:crypto';
import { createLogger } from '../../../utils/logger.js';
/**
 * File-based archive storage implementation
 * Provides efficient compressed data storage with metadata indexing
 */
export class ArchiveStorageImpl {
    logger;
    storagePath;
    indexPath;
    maxFileSize;
    index;
    indexDirty = false;
    /**
     * Create a new archive storage instance
     */
    constructor(config) {
        this.logger = createLogger('ArchiveStorage');
        this.storagePath = path.resolve(config.storagePath);
        this.indexPath = path.join(this.storagePath, 'archive-index.json');
        this.maxFileSize = config.maxFileSize || 50 * 1024 * 1024; // 50MB default
        this.index = this.createEmptyIndex();
        this.logger.info('ArchiveStorage initialized', {
            storagePath: this.storagePath,
            maxFileSize: this.maxFileSize,
        });
        // Initialize storage and load index
        this.initializeStorage().catch((error) => {
            this.logger.error('Failed to initialize archive storage', {
                error: error.message,
            });
        });
    }
    /**
     * Store compressed block in archive
     */
    async storeBlock(compressedBlock) {
        const startTime = Date.now();
        this.logger.info('Storing compressed block in archive', {
            blockId: compressedBlock.id,
            compressedSize: compressedBlock.compression.compressedSize,
            algorithm: compressedBlock.compression.algorithm,
        });
        try {
            // Ensure storage directory exists
            await this.ensureStorageDirectory();
            // Generate file name and path
            const fileName = this.generateFileName(compressedBlock);
            const filePath = path.join(this.storagePath, fileName);
            // Prepare archive data
            const archiveData = {
                metadata: compressedBlock.metadata,
                compression: compressedBlock.compression,
                compressedAt: compressedBlock.compressedAt,
                compressedData: compressedBlock.compressedData.toString('base64'),
            };
            // Write compressed block to file
            const archiveContent = JSON.stringify(archiveData, null, 2);
            await fs.writeFile(filePath, archiveContent, 'utf8');
            // Calculate file checksum
            const fileChecksum = crypto
                .createHash('sha256')
                .update(archiveContent)
                .digest('hex');
            // Update index
            const archiveMetadata = {
                blockId: compressedBlock.id,
                fileName,
                metadata: compressedBlock.metadata,
                compression: compressedBlock.compression,
                archivedAt: Date.now(),
                fileSize: Buffer.byteLength(archiveContent),
                checksum: fileChecksum,
            };
            this.updateIndex(archiveMetadata);
            this.logger.info('Compressed block stored successfully', {
                blockId: compressedBlock.id,
                fileName,
                fileSize: archiveMetadata.fileSize,
                duration: Date.now() - startTime,
            });
            return fileName;
        }
        catch (error) {
            this.logger.error('Failed to store compressed block', {
                blockId: compressedBlock.id,
                error: error.message,
                duration: Date.now() - startTime,
            });
            throw error;
        }
    }
    /**
     * Retrieve compressed block from archive
     */
    async retrieveBlock(blockId) {
        const startTime = Date.now();
        this.logger.info('Retrieving compressed block from archive', {
            blockId,
        });
        try {
            // Check index for block metadata
            const archiveMetadata = this.index.blocks[blockId];
            if (!archiveMetadata) {
                this.logger.warn('Block not found in archive', { blockId });
                return null;
            }
            // Read archive file
            const filePath = path.join(this.storagePath, archiveMetadata.fileName);
            const archiveContent = await fs.readFile(filePath, 'utf8');
            // Verify file integrity
            const fileChecksum = crypto
                .createHash('sha256')
                .update(archiveContent)
                .digest('hex');
            if (fileChecksum !== archiveMetadata.checksum) {
                throw new Error(`Archive file integrity check failed for block ${blockId}`);
            }
            // Parse archive data
            const archiveData = JSON.parse(archiveContent);
            // Reconstruct compressed block
            const compressedBlock = {
                id: blockId,
                compressedData: Buffer.from(archiveData.compressedData, 'base64'),
                compression: archiveData.compression,
                metadata: archiveData.metadata,
                compressedAt: archiveData.compressedAt,
            };
            this.logger.info('Compressed block retrieved successfully', {
                blockId,
                fileSize: archiveMetadata.fileSize,
                duration: Date.now() - startTime,
            });
            return compressedBlock;
        }
        catch (error) {
            this.logger.error('Failed to retrieve compressed block', {
                blockId,
                error: error.message,
                duration: Date.now() - startTime,
            });
            if (error.code === 'ENOENT') {
                return null; // File not found
            }
            throw error;
        }
    }
    /**
     * List archived blocks with optional filtering
     */
    async listBlocks(filter) {
        this.logger.info('Listing archived blocks', { filter });
        try {
            let blockIds = Object.keys(this.index.blocks);
            // Apply time range filter
            if (filter?.startTime || filter?.endTime) {
                blockIds = blockIds.filter((blockId) => {
                    const block = this.index.blocks[blockId];
                    const blockStart = block.metadata.startTime;
                    const blockEnd = block.metadata.endTime;
                    if (filter.startTime && blockEnd < filter.startTime)
                        return false;
                    if (filter.endTime && blockStart > filter.endTime)
                        return false;
                    return true;
                });
            }
            // Apply algorithm filter
            if (filter?.algorithm) {
                blockIds = blockIds.filter((blockId) => {
                    const block = this.index.blocks[blockId];
                    return block.compression.algorithm === filter.algorithm;
                });
            }
            // Apply compression ratio filter
            if (filter?.minCompressionRatio) {
                blockIds = blockIds.filter((blockId) => {
                    const block = this.index.blocks[blockId];
                    return (block.compression.compressionRatio >= filter.minCompressionRatio);
                });
            }
            // Map to result format
            const results = blockIds.map((blockId) => {
                const block = this.index.blocks[blockId];
                return {
                    id: blockId,
                    metadata: block.metadata,
                    compression: block.compression,
                    archivedAt: block.archivedAt,
                };
            });
            // Sort by archived time (newest first)
            results.sort((a, b) => b.archivedAt - a.archivedAt);
            this.logger.info('Listed archived blocks', {
                totalBlocks: results.length,
                filterApplied: !!filter,
            });
            return results;
        }
        catch (error) {
            this.logger.error('Failed to list archived blocks', {
                error: error.message,
            });
            throw error;
        }
    }
    /**
     * Delete archived block
     */
    async deleteBlock(blockId) {
        const startTime = Date.now();
        this.logger.info('Deleting archived block', { blockId });
        try {
            // Check if block exists in index
            const archiveMetadata = this.index.blocks[blockId];
            if (!archiveMetadata) {
                this.logger.warn('Block not found for deletion', { blockId });
                return false;
            }
            // Delete archive file
            const filePath = path.join(this.storagePath, archiveMetadata.fileName);
            try {
                await fs.unlink(filePath);
            }
            catch (error) {
                if (error.code !== 'ENOENT') {
                    throw error; // Re-throw if not "file not found"
                }
                this.logger.warn('Archive file already deleted', { blockId, filePath });
            }
            // Remove from index
            this.removeFromIndex(blockId);
            this.logger.info('Archived block deleted successfully', {
                blockId,
                duration: Date.now() - startTime,
            });
            return true;
        }
        catch (error) {
            this.logger.error('Failed to delete archived block', {
                blockId,
                error: error.message,
                duration: Date.now() - startTime,
            });
            throw error;
        }
    }
    /**
     * Get archive storage statistics
     */
    async getStorageStats() {
        this.logger.info('Getting archive storage statistics');
        try {
            const blocks = Object.values(this.index.blocks);
            if (blocks.length === 0) {
                return {
                    totalBlocks: 0,
                    totalSize: 0,
                    totalCompressedSize: 0,
                    averageCompressionRatio: 0,
                    oldestBlock: 0,
                    newestBlock: 0,
                };
            }
            const totalBlocks = blocks.length;
            const totalSize = blocks.reduce((sum, block) => sum + block.fileSize, 0);
            const totalCompressedSize = blocks.reduce((sum, block) => sum + block.compression.compressedSize, 0);
            const totalOriginalSize = blocks.reduce((sum, block) => sum + block.compression.originalSize, 0);
            const averageCompressionRatio = totalOriginalSize > 0 ? totalCompressedSize / totalOriginalSize : 0;
            const timestamps = blocks.map((block) => block.metadata.startTime);
            const oldestBlock = Math.min(...timestamps);
            const newestBlock = Math.max(...timestamps);
            const stats = {
                totalBlocks,
                totalSize,
                totalCompressedSize,
                averageCompressionRatio,
                oldestBlock,
                newestBlock,
            };
            this.logger.info('Archive storage statistics computed', stats);
            return stats;
        }
        catch (error) {
            this.logger.error('Failed to get storage statistics', {
                error: error.message,
            });
            throw error;
        }
    }
    /**
     * Compact archive storage (remove fragmentation)
     */
    async compactStorage() {
        const startTime = Date.now();
        this.logger.info('Starting archive storage compaction');
        try {
            let blocksProcessed = 0;
            let spaceSaved = 0;
            // Get all archive files
            const files = await fs.readdir(this.storagePath);
            const archiveFiles = files.filter((file) => file.endsWith('.json') && file !== 'archive-index.json');
            for (const fileName of archiveFiles) {
                try {
                    const filePath = path.join(this.storagePath, fileName);
                    const stats = await fs.stat(filePath);
                    const originalSize = stats.size;
                    // Read and rewrite file to remove any fragmentation
                    const content = await fs.readFile(filePath, 'utf8');
                    const parsedContent = JSON.parse(content);
                    const compactContent = JSON.stringify(parsedContent);
                    if (compactContent.length < content.length) {
                        await fs.writeFile(filePath, compactContent, 'utf8');
                        const savedBytes = content.length - compactContent.length;
                        spaceSaved += savedBytes;
                        this.logger.debug('Compacted archive file', {
                            fileName,
                            originalSize,
                            newSize: compactContent.length,
                            spaceSaved: savedBytes,
                        });
                    }
                    blocksProcessed++;
                }
                catch (error) {
                    this.logger.warn('Failed to compact archive file', {
                        fileName,
                        error: error.message,
                    });
                    // Continue with other files
                }
            }
            // Rebuild and compact index
            await this.saveIndex();
            const duration = Date.now() - startTime;
            const result = { blocksProcessed, spaceSaved, duration };
            this.logger.info('Archive storage compaction completed', result);
            return result;
        }
        catch (error) {
            this.logger.error('Archive storage compaction failed', {
                error: error.message,
                duration: Date.now() - startTime,
            });
            throw error;
        }
    }
    /**
     * Shutdown archive storage and save index
     */
    async shutdown() {
        this.logger.info('Shutting down archive storage');
        try {
            await this.saveIndex();
            this.logger.info('Archive storage shutdown completed');
        }
        catch (error) {
            this.logger.error('Error during archive storage shutdown', {
                error: error.message,
            });
            throw error;
        }
    }
    /**
     * Initialize storage directory and load index
     */
    async initializeStorage() {
        try {
            await this.ensureStorageDirectory();
            await this.loadIndex();
        }
        catch (error) {
            this.logger.error('Storage initialization failed', {
                error: error.message,
            });
            throw error;
        }
    }
    /**
     * Ensure storage directory exists
     */
    async ensureStorageDirectory() {
        try {
            await fs.access(this.storagePath);
        }
        catch {
            await fs.mkdir(this.storagePath, { recursive: true });
            this.logger.info('Created storage directory', {
                path: this.storagePath,
            });
        }
    }
    /**
     * Create empty index structure
     */
    createEmptyIndex() {
        return {
            version: '1.0.0',
            lastUpdated: Date.now(),
            totalBlocks: 0,
            totalSize: 0,
            blocks: {},
            timeIndex: {},
            algorithmIndex: {},
        };
    }
    /**
     * Load archive index from file
     */
    async loadIndex() {
        try {
            const indexContent = await fs.readFile(this.indexPath, 'utf8');
            this.index = JSON.parse(indexContent);
            this.logger.info('Archive index loaded', {
                version: this.index.version,
                totalBlocks: this.index.totalBlocks,
                lastUpdated: new Date(this.index.lastUpdated).toISOString(),
            });
        }
        catch (error) {
            if (error.code === 'ENOENT') {
                this.logger.info('No existing index found, starting with empty index');
                this.index = this.createEmptyIndex();
                await this.saveIndex();
            }
            else {
                this.logger.error('Failed to load archive index', {
                    error: error.message,
                });
                throw error;
            }
        }
    }
    /**
     * Save archive index to file
     */
    async saveIndex() {
        if (!this.indexDirty)
            return;
        try {
            this.index.lastUpdated = Date.now();
            const indexContent = JSON.stringify(this.index, null, 2);
            await fs.writeFile(this.indexPath, indexContent, 'utf8');
            this.indexDirty = false;
            this.logger.debug('Archive index saved', {
                totalBlocks: this.index.totalBlocks,
            });
        }
        catch (error) {
            this.logger.error('Failed to save archive index', {
                error: error.message,
            });
            throw error;
        }
    }
    /**
     * Update index with new archive metadata
     */
    updateIndex(archiveMetadata) {
        const { blockId } = archiveMetadata;
        // Add to main blocks index
        this.index.blocks[blockId] = archiveMetadata;
        // Update counters
        this.index.totalBlocks = Object.keys(this.index.blocks).length;
        this.index.totalSize += archiveMetadata.fileSize;
        // Update time index
        const timeKey = this.getTimeIndexKey(archiveMetadata.metadata.startTime);
        if (!this.index.timeIndex[timeKey]) {
            this.index.timeIndex[timeKey] = [];
        }
        this.index.timeIndex[timeKey].push(blockId);
        // Update algorithm index
        const algorithm = archiveMetadata.compression.algorithm;
        if (!this.index.algorithmIndex[algorithm]) {
            this.index.algorithmIndex[algorithm] = [];
        }
        this.index.algorithmIndex[algorithm].push(blockId);
        this.indexDirty = true;
        // Save index periodically
        if (this.index.totalBlocks % 10 === 0) {
            this.saveIndex().catch((error) => {
                this.logger.error('Failed to save index during update', {
                    error: error.message,
                });
            });
        }
    }
    /**
     * Remove block from index
     */
    removeFromIndex(blockId) {
        const archiveMetadata = this.index.blocks[blockId];
        if (!archiveMetadata)
            return;
        // Remove from main blocks index
        delete this.index.blocks[blockId];
        // Update counters
        this.index.totalBlocks = Object.keys(this.index.blocks).length;
        this.index.totalSize -= archiveMetadata.fileSize;
        // Remove from time index
        const timeKey = this.getTimeIndexKey(archiveMetadata.metadata.startTime);
        const timeBlocks = this.index.timeIndex[timeKey];
        if (timeBlocks) {
            const index = timeBlocks.indexOf(blockId);
            if (index !== -1) {
                timeBlocks.splice(index, 1);
                if (timeBlocks.length === 0) {
                    delete this.index.timeIndex[timeKey];
                }
            }
        }
        // Remove from algorithm index
        const algorithm = archiveMetadata.compression.algorithm;
        const algorithmBlocks = this.index.algorithmIndex[algorithm];
        if (algorithmBlocks) {
            const index = algorithmBlocks.indexOf(blockId);
            if (index !== -1) {
                algorithmBlocks.splice(index, 1);
                if (algorithmBlocks.length === 0) {
                    delete this.index.algorithmIndex[algorithm];
                }
            }
        }
        this.indexDirty = true;
    }
    /**
     * Generate time index key from timestamp
     */
    getTimeIndexKey(timestamp) {
        // Group by day for time-based indexing
        const date = new Date(timestamp);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }
    /**
     * Generate file name for compressed block
     */
    generateFileName(compressedBlock) {
        const date = new Date(compressedBlock.metadata.startTime);
        const dateStr = date.toISOString().slice(0, 10); // YYYY-MM-DD
        const timestamp = compressedBlock.compressedAt;
        const algorithm = compressedBlock.compression.algorithm;
        return `${dateStr}_${timestamp}_${algorithm}_${compressedBlock.id}.json`;
    }
}
/**
 * Factory function to create archive storage
 */
export function createArchiveStorage(config) {
    return new ArchiveStorageImpl(config);
}
//# sourceMappingURL=ArchiveStorage.js.map