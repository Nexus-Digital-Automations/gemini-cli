/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Semantic Context Compression Engine
 * AI-powered context compression while preserving essential meaning
 *
 * @author Claude Code - Advanced Context Retention Agent
 * @version 1.0.0
 */
import { getComponentLogger } from '../utils/logger.js';
import { CompressionStrategy, ContextType } from './types.js';
const logger = getComponentLogger('semantic-compressor');
/**
 * Default configuration for semantic compression
 */
export const DEFAULT_COMPRESSION_CONFIG = {
    targetRatio: 0.7,
    preserveConcepts: true,
    strategy: CompressionStrategy.PROGRESSIVE_DETAIL,
    maxInformationLoss: 0.15,
};
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
export class SemanticCompressor {
    config;
    strategies;
    compressionCache = new Map();
    constructor(config = {}) {
        this.config = { ...DEFAULT_COMPRESSION_CONFIG, ...config };
        this.strategies = this.initializeStrategies();
        logger.info('SemanticCompressor initialized', { config: this.config });
    }
    /**
     * Compress a context item using the configured strategy
     *
     * @param item - Context item to compress
     * @param targetRatio - Optional target compression ratio (overrides config)
     * @returns Compression result with original and compressed content
     */
    async compress(item, targetRatio) {
        const startTime = performance.now();
        const ratio = targetRatio ?? this.config.targetRatio;
        logger.debug(`Compressing context item ${item.id}`, {
            type: item.type,
            originalTokens: item.tokenCount,
            targetRatio: ratio,
            strategy: this.config.strategy,
        });
        try {
            // Check cache first
            const cacheKey = `${item.id}:${ratio}:${this.config.strategy}`;
            const cached = this.compressionCache.get(cacheKey);
            if (cached) {
                logger.debug(`Using cached compression for ${item.id}`);
                return cached;
            }
            // Select appropriate strategy based on context type and content
            const strategy = this.selectOptimalStrategy(item);
            const impl = this.strategies.get(strategy);
            if (!impl) {
                throw new Error(`No implementation found for strategy: ${strategy}`);
            }
            // Perform compression
            const result = await impl.compress(item.content, ratio);
            result.strategy = strategy;
            // Validate compression quality
            this.validateCompressionResult(result);
            // Cache the result
            this.compressionCache.set(cacheKey, result);
            const duration = performance.now() - startTime;
            logger.info(`Compression completed in ${duration.toFixed(2)}ms`, {
                itemId: item.id,
                strategy,
                compressionRatio: result.compressionRatio,
                informationLoss: result.informationLoss,
            });
            return result;
        }
        catch (error) {
            logger.error(`Failed to compress context item ${item.id}`, { error });
            throw error;
        }
    }
    /**
     * Batch compress multiple context items
     *
     * @param items - Context items to compress
     * @param targetRatio - Target compression ratio
     * @returns Map of item IDs to compression results
     */
    async batchCompress(items, targetRatio) {
        const startTime = performance.now();
        logger.info(`Batch compressing ${items.length} context items`);
        const results = new Map();
        try {
            // Process items in parallel (with concurrency limit)
            const concurrency = 5;
            const batches = this.chunkArray(items, concurrency);
            for (const batch of batches) {
                const batchPromises = batch.map(async (item) => {
                    const result = await this.compress(item, targetRatio);
                    results.set(item.id, result);
                });
                await Promise.all(batchPromises);
            }
            const duration = performance.now() - startTime;
            const totalOriginalTokens = Array.from(results.values()).reduce((sum, result) => sum + result.originalTokens, 0);
            const totalCompressedTokens = Array.from(results.values()).reduce((sum, result) => sum + result.compressedTokens, 0);
            logger.info(`Batch compression completed in ${duration.toFixed(2)}ms`, {
                itemCount: items.length,
                totalOriginalTokens,
                totalCompressedTokens,
                overallRatio: totalCompressedTokens / totalOriginalTokens,
            });
            return results;
        }
        catch (error) {
            logger.error('Batch compression failed', { error });
            throw error;
        }
    }
    /**
     * Select the optimal compression strategy for a context item
     */
    selectOptimalStrategy(item) {
        // Use configured strategy by default
        let strategy = this.config.strategy;
        // Override based on context type and content characteristics
        switch (item.type) {
            case ContextType.CONVERSATION:
                // Long conversations benefit from summarization
                strategy = CompressionStrategy.SUMMARIZATION;
                break;
            case ContextType.CODE:
                // Code benefits from semantic clustering (grouping related functions)
                if (item.content.length > 2000) {
                    strategy = CompressionStrategy.SEMANTIC_CLUSTERING;
                }
                else {
                    strategy = CompressionStrategy.KEYWORD_EXTRACTION;
                }
                break;
            case ContextType.ERROR:
                // Keep error context mostly intact
                strategy = CompressionStrategy.KEYWORD_EXTRACTION;
                break;
            case ContextType.FILE:
                // File listings can be heavily compressed
                strategy = CompressionStrategy.PROGRESSIVE_DETAIL;
                break;
            default:
                // Use configured strategy for other types
                break;
        }
        return strategy;
    }
    /**
     * Initialize compression strategy implementations
     */
    initializeStrategies() {
        const strategies = new Map();
        strategies.set(CompressionStrategy.SUMMARIZATION, new SummarizationStrategy());
        strategies.set(CompressionStrategy.KEYWORD_EXTRACTION, new KeywordExtractionStrategy());
        strategies.set(CompressionStrategy.SEMANTIC_CLUSTERING, new SemanticClusteringStrategy());
        strategies.set(CompressionStrategy.PROGRESSIVE_DETAIL, new ProgressiveDetailStrategy());
        return strategies;
    }
    /**
     * Validate compression result meets quality requirements
     */
    validateCompressionResult(result) {
        if (result.informationLoss > this.config.maxInformationLoss) {
            logger.warn('Compression result exceeds maximum information loss threshold', {
                actualLoss: result.informationLoss,
                maxLoss: this.config.maxInformationLoss,
            });
        }
        if (result.compressionRatio < 0.1) {
            logger.warn('Compression ratio is very low, may not be effective', {
                ratio: result.compressionRatio,
            });
        }
    }
    /**
     * Utility function to chunk array into smaller batches
     */
    chunkArray(array, size) {
        const chunks = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }
    /**
     * Clear compression cache
     */
    clearCache() {
        this.compressionCache.clear();
        logger.debug('Compression cache cleared');
    }
    /**
     * Update configuration
     */
    updateConfig(config) {
        this.config = { ...this.config, ...config };
        logger.info('Compression config updated', { config: this.config });
    }
    /**
     * Get current configuration
     */
    getConfig() {
        return { ...this.config };
    }
}
/**
 * Summarization strategy implementation
 * Extracts key points from lengthy content
 */
class SummarizationStrategy {
    async compress(content, targetRatio) {
        const original = content;
        const originalTokens = this.estimateTokenCount(original);
        // Split content into sentences
        const sentences = this.splitIntoSentences(content);
        if (sentences.length <= 2) {
            // Too short to summarize meaningfully
            return this.createResult(original, original, originalTokens, originalTokens);
        }
        // Score sentences by importance
        const scoredSentences = this.scoreSentences(sentences);
        // Select top sentences to meet target ratio
        const targetTokens = Math.floor(originalTokens * targetRatio);
        const selectedSentences = this.selectSentencesByToken(scoredSentences, targetTokens);
        // Reconstruct compressed content
        const compressed = selectedSentences
            .sort((a, b) => a.index - b.index) // Maintain original order
            .map((s) => s.sentence)
            .join(' ');
        const compressedTokens = this.estimateTokenCount(compressed);
        return this.createResult(original, compressed, originalTokens, compressedTokens);
    }
    splitIntoSentences(text) {
        // Simple sentence splitting (could be improved with NLP library)
        return text
            .split(/[.!?]+/)
            .map((s) => s.trim())
            .filter((s) => s.length > 0);
    }
    scoreSentences(sentences) {
        return sentences.map((sentence, index) => ({
            sentence,
            index,
            score: this.calculateSentenceScore(sentence, sentences),
        }));
    }
    calculateSentenceScore(sentence, allSentences) {
        let score = 0;
        // Length factor (moderate length sentences score higher)
        const wordCount = sentence.split(/\s+/).length;
        if (wordCount >= 5 && wordCount <= 30) {
            score += 0.3;
        }
        // Position factor (first and last sentences often important)
        const position = allSentences.indexOf(sentence);
        if (position === 0 || position === allSentences.length - 1) {
            score += 0.2;
        }
        // Keyword factor (sentences with important keywords score higher)
        const importantKeywords = [
            'error',
            'function',
            'class',
            'import',
            'export',
            'const',
            'let',
            'var',
        ];
        const keywordMatches = importantKeywords.filter((keyword) => sentence.toLowerCase().includes(keyword)).length;
        score += keywordMatches * 0.1;
        return score;
    }
    selectSentencesByToken(scoredSentences, targetTokens) {
        const sorted = [...scoredSentences].sort((a, b) => b.score - a.score);
        const selected = [];
        let currentTokens = 0;
        for (const item of sorted) {
            const tokenCount = this.estimateTokenCount(item.sentence);
            if (currentTokens + tokenCount <= targetTokens) {
                selected.push(item);
                currentTokens += tokenCount;
            }
        }
        return selected;
    }
    estimateTokenCount(text) {
        // Rough token estimation (4 characters per token on average)
        return Math.ceil(text.length / 4);
    }
    createResult(original, compressed, originalTokens, compressedTokens) {
        return {
            original,
            compressed,
            originalTokens,
            compressedTokens,
            compressionRatio: compressedTokens / originalTokens,
            preservedConcepts: [], // Would extract key concepts in full implementation
            informationLoss: Math.max(0, 1 - (compressedTokens / originalTokens) * 0.8), // Estimate
            strategy: CompressionStrategy.SUMMARIZATION,
        };
    }
}
/**
 * Keyword extraction strategy implementation
 * Keeps important keywords and removes filler content
 */
class KeywordExtractionStrategy {
    async compress(content, targetRatio) {
        const original = content;
        const originalTokens = this.estimateTokenCount(original);
        // Extract words and score them
        const words = this.extractWords(content);
        const scoredWords = this.scoreWords(words, content);
        // Select top words to meet target ratio
        const targetTokens = Math.floor(originalTokens * targetRatio);
        const selectedWords = this.selectTopWords(scoredWords, targetTokens);
        // Reconstruct compressed content
        const compressed = selectedWords.join(' ');
        const compressedTokens = this.estimateTokenCount(compressed);
        return {
            original,
            compressed,
            originalTokens,
            compressedTokens,
            compressionRatio: compressedTokens / originalTokens,
            preservedConcepts: selectedWords.slice(0, 10), // Top 10 words as concepts
            informationLoss: Math.max(0, 1 - (selectedWords.length / words.length) * 0.9),
            strategy: CompressionStrategy.KEYWORD_EXTRACTION,
        };
    }
    extractWords(content) {
        return content
            .toLowerCase()
            .split(/\s+/)
            .filter((word) => word.length > 2)
            .filter((word) => !/^\d+$/.test(word)) // Remove numbers
            .filter((word) => !this.isStopWord(word));
    }
    isStopWord(word) {
        const stopWords = new Set([
            'the',
            'a',
            'an',
            'and',
            'or',
            'but',
            'in',
            'on',
            'at',
            'to',
            'for',
            'of',
            'with',
            'by',
            'this',
            'that',
            'these',
            'those',
            'is',
            'are',
            'was',
            'were',
            'be',
            'been',
            'being',
            'have',
            'has',
            'had',
            'do',
            'does',
            'did',
            'will',
            'would',
            'could',
            'should',
            'may',
            'might',
        ]);
        return stopWords.has(word);
    }
    scoreWords(words, content) {
        const wordCounts = new Map();
        // Count word frequencies
        for (const word of words) {
            wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
        }
        return Array.from(wordCounts.entries()).map(([word, count]) => ({
            word,
            score: this.calculateWordScore(word, count, content),
        }));
    }
    calculateWordScore(word, frequency, content) {
        let score = 0;
        // Frequency factor (normalized)
        score += Math.min(frequency / 10, 1) * 0.4;
        // Length factor (longer words often more important)
        score += Math.min(word.length / 15, 1) * 0.2;
        // Technical term factor
        if (this.isTechnicalTerm(word)) {
            score += 0.3;
        }
        // Capital case factor (proper nouns, constants)
        if (content.includes(word.charAt(0).toUpperCase() + word.slice(1))) {
            score += 0.1;
        }
        return score;
    }
    isTechnicalTerm(word) {
        const technicalTerms = [
            'function',
            'class',
            'method',
            'variable',
            'parameter',
            'return',
            'import',
            'export',
            'module',
            'package',
            'library',
            'framework',
            'api',
            'http',
            'json',
            'xml',
            'database',
            'sql',
            'query',
            'algorithm',
            'data',
            'structure',
            'array',
            'object',
            'string',
            'error',
            'exception',
            'debug',
            'test',
            'unit',
            'integration',
        ];
        return technicalTerms.includes(word);
    }
    selectTopWords(scoredWords, targetTokens) {
        const sorted = [...scoredWords].sort((a, b) => b.score - a.score);
        return sorted.slice(0, targetTokens).map((item) => item.word);
    }
    estimateTokenCount(text) {
        return Math.ceil(text.length / 4);
    }
}
/**
 * Semantic clustering strategy implementation
 * Groups similar concepts together and compresses clusters
 */
class SemanticClusteringStrategy {
    async compress(content, targetRatio) {
        const original = content;
        const originalTokens = this.estimateTokenCount(original);
        // Split content into segments (paragraphs or logical blocks)
        const segments = this.segmentContent(content);
        // Group segments into semantic clusters
        const clusters = this.clusterSegments(segments);
        // Compress each cluster
        const compressedClusters = clusters.map((cluster) => this.compressCluster(cluster, targetRatio));
        // Reconstruct compressed content
        const compressed = compressedClusters.join('\n\n');
        const compressedTokens = this.estimateTokenCount(compressed);
        return {
            original,
            compressed,
            originalTokens,
            compressedTokens,
            compressionRatio: compressedTokens / originalTokens,
            preservedConcepts: clusters.map((_, i) => `cluster_${i}`),
            informationLoss: Math.max(0, 1 - (compressedTokens / originalTokens) * 0.85),
            strategy: CompressionStrategy.SEMANTIC_CLUSTERING,
        };
    }
    segmentContent(content) {
        // Split by double newlines (paragraphs) or logical code blocks
        return content
            .split(/\n\s*\n/)
            .map((segment) => segment.trim())
            .filter((segment) => segment.length > 0);
    }
    clusterSegments(segments) {
        // Simple clustering based on word overlap
        // In production, would use more sophisticated semantic similarity
        const clusters = [];
        const used = new Set();
        for (let i = 0; i < segments.length; i++) {
            if (used.has(i))
                continue;
            const cluster = [segments[i]];
            used.add(i);
            for (let j = i + 1; j < segments.length; j++) {
                if (used.has(j))
                    continue;
                if (this.calculateSimilarity(segments[i], segments[j]) > 0.3) {
                    cluster.push(segments[j]);
                    used.add(j);
                }
            }
            clusters.push(cluster);
        }
        return clusters;
    }
    calculateSimilarity(segment1, segment2) {
        const words1 = new Set(segment1.toLowerCase().split(/\s+/));
        const words2 = new Set(segment2.toLowerCase().split(/\s+/));
        const intersection = new Set([...words1].filter((word) => words2.has(word)));
        const union = new Set([...words1, ...words2]);
        return intersection.size / union.size; // Jaccard similarity
    }
    compressCluster(cluster, targetRatio) {
        if (cluster.length === 1) {
            // Single segment - apply simple compression
            const segment = cluster[0];
            const targetLength = Math.floor(segment.length * targetRatio);
            return segment.substring(0, targetLength);
        }
        // Multiple segments - create summary
        const combined = cluster.join(' ');
        const sentences = combined
            .split(/[.!?]+/)
            .filter((s) => s.trim().length > 0);
        const targetSentences = Math.max(1, Math.floor(sentences.length * targetRatio));
        return sentences.slice(0, targetSentences).join('. ') + '.';
    }
    estimateTokenCount(text) {
        return Math.ceil(text.length / 4);
    }
}
/**
 * Progressive detail strategy implementation
 * Removes less important details first
 */
class ProgressiveDetailStrategy {
    async compress(content, targetRatio) {
        const original = content;
        const originalTokens = this.estimateTokenCount(original);
        // Identify and score different types of content by importance
        const contentParts = this.analyzeContentParts(content);
        // Remove parts progressively until we reach target ratio
        const targetTokens = Math.floor(originalTokens * targetRatio);
        const selectedParts = this.selectPartsForTarget(contentParts, targetTokens);
        // Reconstruct compressed content
        const compressed = selectedParts
            .sort((a, b) => a.order - b.order)
            .map((part) => part.content)
            .join('');
        const compressedTokens = this.estimateTokenCount(compressed);
        return {
            original,
            compressed,
            originalTokens,
            compressedTokens,
            compressionRatio: compressedTokens / originalTokens,
            preservedConcepts: selectedParts.map((part) => part.type),
            informationLoss: Math.max(0, 1 - (selectedParts.length / contentParts.length) * 0.8),
            strategy: CompressionStrategy.PROGRESSIVE_DETAIL,
        };
    }
    analyzeContentParts(content) {
        const parts = [];
        let order = 0;
        // Split by lines and analyze each
        const lines = content.split('\n');
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.length === 0)
                continue;
            const importance = this.calculateLineImportance(trimmed);
            const type = this.identifyLineType(trimmed);
            parts.push({
                content: line + '\n',
                type,
                importance,
                order: order++,
            });
        }
        return parts;
    }
    calculateLineImportance(line) {
        let importance = 0.5; // Base importance
        // Code patterns (high importance)
        if (/^(function|class|interface|type|const|let|var|import|export)/.test(line)) {
            importance += 0.4;
        }
        // Error or warning patterns (very high importance)
        if (/error|exception|warning|fail/i.test(line)) {
            importance += 0.5;
        }
        // Documentation patterns (medium importance)
        if (/^\/\*|^\/\/|^\*/.test(line.trim())) {
            importance += 0.1;
        }
        // Empty or whitespace-only lines (low importance)
        if (line.trim().length === 0) {
            importance = 0.1;
        }
        // Very long lines might be less important (logs, generated code)
        if (line.length > 200) {
            importance -= 0.2;
        }
        return Math.max(0, Math.min(1, importance));
    }
    identifyLineType(line) {
        if (/^(function|class|interface|type)/.test(line))
            return 'declaration';
        if (/^(import|export)/.test(line))
            return 'import';
        if (/^(const|let|var)/.test(line))
            return 'variable';
        if (/^\/\*|^\/\/|^\*/.test(line.trim()))
            return 'comment';
        if (/error|exception|warning/i.test(line))
            return 'error';
        if (line.trim().length === 0)
            return 'whitespace';
        return 'code';
    }
    selectPartsForTarget(parts, targetTokens) {
        const sorted = [...parts].sort((a, b) => b.importance - a.importance);
        const selected = [];
        let currentTokens = 0;
        for (const part of sorted) {
            const partTokens = this.estimateTokenCount(part.content);
            if (currentTokens + partTokens <= targetTokens) {
                selected.push(part);
                currentTokens += partTokens;
            }
        }
        return selected;
    }
    estimateTokenCount(text) {
        return Math.ceil(text.length / 4);
    }
}
/**
 * Create a semantic compressor instance with optional configuration
 */
export function createSemanticCompressor(config) {
    return new SemanticCompressor(config);
}
//# sourceMappingURL=SemanticCompressor.js.map