/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Enhanced Compression Algorithms - Content-Type Specific
 * Implements intelligent compression strategies optimized for different content types
 *
 * Addresses the 1,272,932 → 1,048,576 token limit issue with content-aware compression
 *
 * @author Claude Code - Auto-Compression Implementation Agent
 * @version 1.0.0
 */

import { getComponentLogger } from '../utils/logger.js';
import { CompressionStrategy, CompressionResult, ContextType, ContextItem } from './types.js';
import { performance } from 'node:perf_hooks';

const logger = getComponentLogger('enhanced-compression-algorithms');

/**
 * Enhanced compression configuration
 */
export interface EnhancedCompressionConfig {
  /** Target compression ratio (0-1) */
  targetRatio: number;
  /** Quality level for compression (1-10, higher = better quality) */
  qualityLevel: number;
  /** Use adaptive thresholds based on content analysis */
  adaptiveThresholds: boolean;
  /** Maximum processing time per item in ms */
  maxProcessingTime: number;
  /** Enable content-type specific optimizations */
  enableTypeOptimizations: boolean;
  /** Preserve critical keywords and concepts */
  preserveCriticalElements: boolean;
}

/**
 * Content type detection result
 */
export interface ContentTypeAnalysis {
  /** Detected primary content type */
  primaryType: ContentTypeCategory;
  /** Confidence in detection (0-1) */
  confidence: number;
  /** Secondary types found */
  secondaryTypes: ContentTypeCategory[];
  /** Content characteristics */
  characteristics: ContentCharacteristics;
  /** Recommended compression strategy */
  recommendedStrategy: CompressionStrategy;
}

/**
 * Extended content type categories for compression optimization
 */
export enum ContentTypeCategory {
  JAVASCRIPT_CODE = 'javascript_code',
  TYPESCRIPT_CODE = 'typescript_code',
  PYTHON_CODE = 'python_code',
  HTML_MARKUP = 'html_markup',
  CSS_STYLES = 'css_styles',
  JSON_DATA = 'json_data',
  XML_DATA = 'xml_data',
  MARKDOWN_TEXT = 'markdown_text',
  PLAIN_TEXT = 'plain_text',
  CONVERSATION_LOG = 'conversation_log',
  ERROR_LOG = 'error_log',
  BUILD_OUTPUT = 'build_output',
  FILE_LISTING = 'file_listing',
  CONFIGURATION = 'configuration',
  DOCUMENTATION = 'documentation',
  MIXED_CONTENT = 'mixed_content'
}

/**
 * Content characteristics for optimization
 */
export interface ContentCharacteristics {
  /** Estimated repetition ratio (0-1) */
  repetitionRatio: number;
  /** Average line length */
  averageLineLength: number;
  /** Number of unique tokens */
  uniqueTokens: number;
  /** Presence of structured data patterns */
  hasStructuredData: boolean;
  /** Presence of code patterns */
  hasCodePatterns: boolean;
  /** Estimated noise ratio (0-1) */
  noiseRatio: number;
  /** Key concepts identified */
  keyConcepts: string[];
}

/**
 * Compression result with enhanced metrics
 */
export interface EnhancedCompressionResult extends CompressionResult {
  /** Content type used for optimization */
  detectedContentType: ContentTypeCategory;
  /** Processing time in milliseconds */
  processingTime: number;
  /** Quality score of compression (0-1) */
  qualityScore: number;
  /** Critical elements preserved */
  criticalElementsPreserved: string[];
  /** Compression method details */
  methodDetails: CompressionMethodDetails;
}

/**
 * Compression method details
 */
export interface CompressionMethodDetails {
  /** Primary method used */
  primaryMethod: string;
  /** Fallback methods attempted */
  fallbackMethods: string[];
  /** Method-specific parameters */
  parameters: Record<string, unknown>;
  /** Success metrics for each method */
  methodMetrics: Record<string, number>;
}

/**
 * Default enhanced compression configuration
 */
const DEFAULT_ENHANCED_CONFIG: EnhancedCompressionConfig = {
  targetRatio: 0.65, // Compress to 65% of original size
  qualityLevel: 7, // High quality compression
  adaptiveThresholds: true,
  maxProcessingTime: 5000, // 5 seconds max per item
  enableTypeOptimizations: true,
  preserveCriticalElements: true
};

/**
 * Enhanced Compression Algorithms System
 *
 * Provides content-type-aware compression strategies that optimize for different
 * types of content to achieve maximum compression while preserving critical information.
 *
 * Key Features:
 * - Content Type Detection: Automatically identifies content types
 * - Specialized Algorithms: Different compression strategies per content type
 * - Quality Preservation: Maintains critical information during compression
 * - Performance Monitoring: Tracks compression effectiveness and timing
 * - Adaptive Processing: Adjusts strategies based on content characteristics
 *
 * @example
 * ```typescript
 * const algorithms = new EnhancedCompressionAlgorithms();
 * const result = await algorithms.compressWithTypeOptimization(item, 0.7);
 * ```
 */
export class EnhancedCompressionAlgorithms {
  private config: EnhancedCompressionConfig;
  private performanceMetrics: Map<string, number[]> = new Map();

  constructor(config: Partial<EnhancedCompressionConfig> = {}) {
    this.config = { ...DEFAULT_ENHANCED_CONFIG, ...config };

    logger.info('EnhancedCompressionAlgorithms initialized', {
      targetRatio: this.config.targetRatio,
      qualityLevel: this.config.qualityLevel,
      adaptiveThresholds: this.config.adaptiveThresholds,
      typeOptimizations: this.config.enableTypeOptimizations
    });
  }

  /**
   * Update configuration dynamically
   */
  updateConfig(updates: Partial<EnhancedCompressionConfig>): void {
    const oldConfig = { ...this.config };
    this.config = { ...this.config, ...updates };

    logger.info('EnhancedCompressionAlgorithms configuration updated', {
      oldConfig,
      newConfig: this.config
    });
  }

  /**
   * Compress content with type-specific optimization
   */
  async compressWithTypeOptimization(
    item: ContextItem,
    targetRatio: number = this.config.targetRatio
  ): Promise<EnhancedCompressionResult> {
    const startTime = performance.now();

    try {
      // Analyze content type
      const contentAnalysis = this.analyzeContentType(item.content);

      logger.debug('Content type analysis completed', {
        itemId: item.id,
        primaryType: contentAnalysis.primaryType,
        confidence: contentAnalysis.confidence,
        recommendedStrategy: contentAnalysis.recommendedStrategy
      });

      // Select and apply compression strategy
      const compressionResult = await this.applyTypeSpecificCompression(
        item,
        contentAnalysis,
        targetRatio
      );

      const processingTime = performance.now() - startTime;

      // Track performance metrics
      this.trackPerformanceMetrics(contentAnalysis.primaryType, processingTime);

      const enhancedResult: EnhancedCompressionResult = {
        ...compressionResult,
        detectedContentType: contentAnalysis.primaryType,
        processingTime,
        qualityScore: this.calculateQualityScore(compressionResult, contentAnalysis),
        criticalElementsPreserved: this.extractCriticalElements(item.content, compressionResult.compressed),
        methodDetails: {
          primaryMethod: contentAnalysis.recommendedStrategy,
          fallbackMethods: [],
          parameters: {
            targetRatio,
            qualityLevel: this.config.qualityLevel,
            contentType: contentAnalysis.primaryType
          },
          methodMetrics: {
            compressionRatio: compressionResult.compressionRatio,
            processingTime,
            qualityScore: this.calculateQualityScore(compressionResult, contentAnalysis)
          }
        }
      };

      logger.info('Type-optimized compression completed', {
        itemId: item.id,
        contentType: contentAnalysis.primaryType,
        originalTokens: compressionResult.originalTokens,
        compressedTokens: compressionResult.compressedTokens,
        compressionRatio: compressionResult.compressionRatio.toFixed(3),
        processingTime: processingTime.toFixed(2),
        qualityScore: enhancedResult.qualityScore.toFixed(3)
      });

      return enhancedResult;

    } catch (error) {
      const processingTime = performance.now() - startTime;

      logger.error('Type-optimized compression failed', {
        itemId: item.id,
        error: error instanceof Error ? error.message : String(error),
        processingTime: processingTime.toFixed(2)
      });

      // Return fallback result
      return {
        original: item.content,
        compressed: item.content,
        originalTokens: item.tokenCount,
        compressedTokens: item.tokenCount,
        compressionRatio: 1.0,
        preservedConcepts: [],
        informationLoss: 0,
        strategy: CompressionStrategy.PROGRESSIVE_DETAIL,
        detectedContentType: ContentTypeCategory.MIXED_CONTENT,
        processingTime,
        qualityScore: 0,
        criticalElementsPreserved: [],
        methodDetails: {
          primaryMethod: 'fallback',
          fallbackMethods: [],
          parameters: {},
          methodMetrics: {}
        }
      };
    }
  }

  /**
   * Analyze content type and characteristics
   */
  private analyzeContentType(content: string): ContentTypeAnalysis {
    const characteristics = this.analyzeContentCharacteristics(content);

    // Content type detection patterns
    const typePatterns: Array<{ type: ContentTypeCategory; patterns: RegExp[]; weight: number }> = [
      {
        type: ContentTypeCategory.JAVASCRIPT_CODE,
        patterns: [
          /\b(function|const|let|var|class|import|export|async|await)\b/g,
          /\{[\s\S]*\}/g,
          /\/\*[\s\S]*?\*\/|\/\/.*$/gm
        ],
        weight: 0.8
      },
      {
        type: ContentTypeCategory.TYPESCRIPT_CODE,
        patterns: [
          /:\s*(string|number|boolean|void|any|unknown)\b/g,
          /interface\s+\w+/g,
          /type\s+\w+\s*=/g
        ],
        weight: 0.9
      },
      {
        type: ContentTypeCategory.PYTHON_CODE,
        patterns: [
          /\b(def|class|import|from|if __name__|print)\b/g,
          /:\s*$/gm,
          /#.*$/gm
        ],
        weight: 0.8
      },
      {
        type: ContentTypeCategory.HTML_MARKUP,
        patterns: [
          /<[^>]+>/g,
          /<!DOCTYPE\s+html>/i,
          /&\w+;/g
        ],
        weight: 0.9
      },
      {
        type: ContentTypeCategory.JSON_DATA,
        patterns: [
          /^\s*[\{\[]/,
          /"\w+":\s*["\d\{\[]/g,
          /,\s*$/gm
        ],
        weight: 0.95
      },
      {
        type: ContentTypeCategory.ERROR_LOG,
        patterns: [
          /\b(ERROR|WARN|INFO|DEBUG|FATAL)\b/g,
          /\d{4}-\d{2}-\d{2}[\sT]\d{2}:\d{2}:\d{2}/g,
          /at\s+\w+\.\w+\(/g,
          /stack\s*trace/i
        ],
        weight: 0.85
      },
      {
        type: ContentTypeCategory.CONVERSATION_LOG,
        patterns: [
          /\b(user|assistant|system):/gi,
          /\d{2}:\d{2}:\d{2}/g,
          /^>\s+/gm
        ],
        weight: 0.8
      },
      {
        type: ContentTypeCategory.MARKDOWN_TEXT,
        patterns: [
          /^#{1,6}\s+/gm,
          /\*\*.*?\*\*|\*.*?\*/g,
          /\[.*?\]\(.*?\)/g,
          /```[\s\S]*?```/g
        ],
        weight: 0.8
      },
      {
        type: ContentTypeCategory.FILE_LISTING,
        patterns: [
          /^[\w.-]+\.(js|ts|py|html|css|json|md)$/gm,
          /^\s*[\w.-]+\/\s*$/gm,
          /\d+\s+bytes?/g
        ],
        weight: 0.9
      }
    ];

    // Calculate type scores
    const typeScores = new Map<ContentTypeCategory, number>();

    for (const { type, patterns, weight } of typePatterns) {
      let score = 0;
      for (const pattern of patterns) {
        const matches = content.match(pattern);
        if (matches) {
          score += (matches.length / content.length) * weight;
        }
      }
      typeScores.set(type, Math.min(score, 1.0));
    }

    // Find best match
    let bestType = ContentTypeCategory.PLAIN_TEXT;
    let bestScore = 0;
    let allScores: [ContentTypeCategory, number][] = [];

    for (const [type, score] of typeScores.entries()) {
      allScores.push([type, score]);
      if (score > bestScore) {
        bestScore = score;
        bestType = type;
      }
    }

    // Sort to find secondary types
    allScores.sort((a, b) => b[1] - a[1]);
    const secondaryTypes = allScores.slice(1, 3).map(([type]) => type);

    // Recommend compression strategy based on type
    const recommendedStrategy = this.getRecommendedStrategy(bestType, characteristics);

    return {
      primaryType: bestType,
      confidence: Math.min(bestScore, 1.0),
      secondaryTypes,
      characteristics,
      recommendedStrategy
    };
  }

  /**
   * Analyze content characteristics for optimization
   */
  private analyzeContentCharacteristics(content: string): ContentCharacteristics {
    const lines = content.split('\n');
    const words = content.split(/\s+/);
    const uniqueWords = new Set(words);

    // Calculate repetition ratio
    const wordCounts = new Map<string, number>();
    for (const word of words) {
      wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
    }

    let repetitiveWords = 0;
    for (const count of wordCounts.values()) {
      if (count > 2) repetitiveWords += count - 1;
    }
    const repetitionRatio = words.length > 0 ? repetitiveWords / words.length : 0;

    // Calculate average line length
    const averageLineLength = lines.length > 0 ?
      lines.reduce((sum, line) => sum + line.length, 0) / lines.length : 0;

    // Detect structured data patterns
    const hasStructuredData = /[\{\}\[\]"':,]/.test(content) &&
                              content.split(/[\{\}\[\]]/).length > 3;

    // Detect code patterns
    const hasCodePatterns = /[(){};=]/.test(content) &&
                           /\b(function|class|if|for|while|return)\b/.test(content);

    // Estimate noise ratio (whitespace, punctuation, etc.)
    const noiseCharacters = content.match(/[\s\n\r\t.,;:!?'"(){}[\]]/g) || [];
    const noiseRatio = content.length > 0 ? noiseCharacters.length / content.length : 0;

    // Extract key concepts (common meaningful words)
    const keyConcepts = this.extractKeyConcepts(content);

    return {
      repetitionRatio,
      averageLineLength,
      uniqueTokens: uniqueWords.size,
      hasStructuredData,
      hasCodePatterns,
      noiseRatio,
      keyConcepts
    };
  }

  /**
   * Extract key concepts from content
   */
  private extractKeyConcepts(content: string): string[] {
    const words = content.toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 3 && !/^\d+$/.test(word))
      .filter(word => !/^(the|and|for|are|but|not|you|all|can|has|had|her|was|one|our|out|day|get|use|man|new|now|old|see|him|two|how|its|who|oil|sit|did)$/.test(word));

    const wordCounts = new Map<string, number>();
    for (const word of words) {
      wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
    }

    return Array.from(wordCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);
  }

  /**
   * Get recommended compression strategy for content type
   */
  private getRecommendedStrategy(
    type: ContentTypeCategory,
    characteristics: ContentCharacteristics
  ): CompressionStrategy {
    switch (type) {
      case ContentTypeCategory.JAVASCRIPT_CODE:
      case ContentTypeCategory.TYPESCRIPT_CODE:
      case ContentTypeCategory.PYTHON_CODE:
        return characteristics.repetitionRatio > 0.3 ?
               CompressionStrategy.SEMANTIC_CLUSTERING :
               CompressionStrategy.PROGRESSIVE_DETAIL;

      case ContentTypeCategory.JSON_DATA:
      case ContentTypeCategory.XML_DATA:
        return CompressionStrategy.PROGRESSIVE_DETAIL;

      case ContentTypeCategory.ERROR_LOG:
      case ContentTypeCategory.BUILD_OUTPUT:
        return CompressionStrategy.KEYWORD_EXTRACTION;

      case ContentTypeCategory.CONVERSATION_LOG:
      case ContentTypeCategory.DOCUMENTATION:
      case ContentTypeCategory.MARKDOWN_TEXT:
        return CompressionStrategy.SUMMARIZATION;

      case ContentTypeCategory.FILE_LISTING:
        return CompressionStrategy.PROGRESSIVE_DETAIL;

      default:
        return characteristics.repetitionRatio > 0.4 ?
               CompressionStrategy.SEMANTIC_CLUSTERING :
               CompressionStrategy.SUMMARIZATION;
    }
  }

  /**
   * Apply type-specific compression
   */
  private async applyTypeSpecificCompression(
    item: ContextItem,
    analysis: ContentTypeAnalysis,
    targetRatio: number
  ): Promise<CompressionResult> {
    const { primaryType, characteristics, recommendedStrategy } = analysis;

    // Apply content-type specific compression
    switch (primaryType) {
      case ContentTypeCategory.JAVASCRIPT_CODE:
      case ContentTypeCategory.TYPESCRIPT_CODE:
        return this.compressCodeContent(item, characteristics, targetRatio);

      case ContentTypeCategory.JSON_DATA:
        return this.compressJsonContent(item, targetRatio);

      case ContentTypeCategory.ERROR_LOG:
        return this.compressErrorLog(item, targetRatio);

      case ContentTypeCategory.CONVERSATION_LOG:
        return this.compressConversationLog(item, targetRatio);

      case ContentTypeCategory.FILE_LISTING:
        return this.compressFileListings(item, targetRatio);

      case ContentTypeCategory.HTML_MARKUP:
        return this.compressHtmlContent(item, targetRatio);

      case ContentTypeCategory.MARKDOWN_TEXT:
      case ContentTypeCategory.DOCUMENTATION:
        return this.compressMarkdownContent(item, targetRatio);

      default:
        return this.compressGenericContent(item, recommendedStrategy, targetRatio);
    }
  }

  /**
   * Compress JavaScript/TypeScript code content
   */
  private compressCodeContent(
    item: ContextItem,
    characteristics: ContentCharacteristics,
    targetRatio: number
  ): CompressionResult {
    let compressed = item.content;
    const originalLength = compressed.length;

    // Step 1: Remove excessive whitespace while preserving structure
    compressed = compressed.replace(/\n\s*\n\s*\n/g, '\n\n'); // Max 2 consecutive newlines
    compressed = compressed.replace(/^\s+/gm, (match) => {
      // Preserve indentation but reduce excessive spaces
      const spaceCount = match.length;
      return spaceCount > 8 ? '        ' : match; // Cap at 8 spaces
    });

    // Step 2: Compress comments while preserving important ones
    const importantCommentPatterns = [
      /@param/, /@return/, /@throws/, /@description/,
      /TODO/, /FIXME/, /NOTE/, /WARNING/,
      /eslint-disable/, /prettier-ignore/
    ];

    compressed = compressed.replace(/\/\*[\s\S]*?\*\//g, (comment) => {
      const isImportant = importantCommentPatterns.some(pattern => pattern.test(comment));
      if (isImportant) return comment;

      // Compress non-important comments
      if (comment.length > 100) {
        const summary = comment.substring(0, 50).trim() + '...*/';
        return `/*${summary}`;
      }
      return comment;
    });

    compressed = compressed.replace(/\/\/.*$/gm, (comment) => {
      const isImportant = importantCommentPatterns.some(pattern => pattern.test(comment));
      return isImportant ? comment : '';
    });

    // Step 3: Semantic clustering of similar function patterns
    if (characteristics.repetitionRatio > 0.3) {
      compressed = this.clusterSimilarFunctions(compressed);
    }

    // Step 4: Calculate compression metrics
    const compressedTokens = this.estimateTokenCount(compressed);
    const compressionRatio = item.tokenCount > 0 ? compressedTokens / item.tokenCount : 1.0;

    // Step 5: If not compressed enough, apply progressive detail reduction
    if (compressionRatio > targetRatio) {
      compressed = this.applyProgressiveDetailReduction(compressed, targetRatio);
    }

    return {
      original: item.content,
      compressed,
      originalTokens: item.tokenCount,
      compressedTokens: this.estimateTokenCount(compressed),
      compressionRatio: this.estimateTokenCount(compressed) / item.tokenCount,
      preservedConcepts: characteristics.keyConcepts,
      informationLoss: this.calculateInformationLoss(item.content, compressed),
      strategy: CompressionStrategy.SEMANTIC_CLUSTERING
    };
  }

  /**
   * Compress JSON data content
   */
  private compressJsonContent(item: ContextItem, targetRatio: number): CompressionResult {
    try {
      const parsed = JSON.parse(item.content);
      let compressed = item.content;

      // Step 1: Minify JSON (remove formatting whitespace)
      compressed = JSON.stringify(parsed);

      // Step 2: If still too large, apply progressive field reduction
      if (this.estimateTokenCount(compressed) / item.tokenCount > targetRatio) {
        compressed = this.compressJsonProgressively(parsed, targetRatio, item.tokenCount);
      }

      return {
        original: item.content,
        compressed,
        originalTokens: item.tokenCount,
        compressedTokens: this.estimateTokenCount(compressed),
        compressionRatio: this.estimateTokenCount(compressed) / item.tokenCount,
        preservedConcepts: this.extractJsonConcepts(parsed),
        informationLoss: this.calculateInformationLoss(item.content, compressed),
        strategy: CompressionStrategy.PROGRESSIVE_DETAIL
      };
    } catch {
      // Fallback for invalid JSON
      return this.compressGenericContent(item, CompressionStrategy.PROGRESSIVE_DETAIL, targetRatio);
    }
  }

  /**
   * Compress error log content
   */
  private compressErrorLog(item: ContextItem, targetRatio: number): CompressionResult {
    let compressed = item.content;
    const lines = compressed.split('\n');

    // Step 1: Extract and prioritize error information
    const errorLines: string[] = [];
    const contextLines: string[] = [];
    const duplicates = new Map<string, number>();

    for (const line of lines) {
      if (/\b(ERROR|FATAL|CRITICAL)\b/i.test(line)) {
        errorLines.push(line);
      } else if (/\b(WARN|WARNING)\b/i.test(line)) {
        contextLines.push(line);
      } else if (/stack\s*trace|at\s+\w+/i.test(line)) {
        contextLines.push(line);
      }

      // Track duplicates
      const normalized = line.replace(/\d{4}-\d{2}-\d{2}[\sT]\d{2}:\d{2}:\d{2}/, '[TIMESTAMP]');
      duplicates.set(normalized, (duplicates.get(normalized) || 0) + 1);
    }

    // Step 2: Remove duplicate log entries
    const uniqueLines = Array.from(duplicates.entries())
      .map(([line, count]) => count > 1 ? `${line} (×${count})` : line);

    // Step 3: Prioritize critical errors and stack traces
    const keywordExtracted = [
      ...errorLines,
      ...contextLines.slice(0, Math.max(5, contextLines.length * 0.3)),
      ...uniqueLines.slice(0, Math.max(10, uniqueLines.length * 0.5))
    ];

    compressed = keywordExtracted.join('\n');

    // Step 4: Extract key error concepts
    const errorConcepts = this.extractErrorConcepts(item.content);

    return {
      original: item.content,
      compressed,
      originalTokens: item.tokenCount,
      compressedTokens: this.estimateTokenCount(compressed),
      compressionRatio: this.estimateTokenCount(compressed) / item.tokenCount,
      preservedConcepts: errorConcepts,
      informationLoss: this.calculateInformationLoss(item.content, compressed),
      strategy: CompressionStrategy.KEYWORD_EXTRACTION
    };
  }

  /**
   * Compress conversation log content
   */
  private compressConversationLog(item: ContextItem, targetRatio: number): CompressionResult {
    const lines = item.content.split('\n');
    const conversations: Array<{ speaker: string; content: string; timestamp?: string }> = [];

    // Parse conversation structure
    for (const line of lines) {
      const match = line.match(/^(user|assistant|system):\s*(.*)/i);
      if (match) {
        conversations.push({ speaker: match[1].toLowerCase(), content: match[2] });
      }
    }

    // Summarize conversations while preserving key exchanges
    let compressed = '';
    const batchSize = 3; // Summarize every 3 exchanges

    for (let i = 0; i < conversations.length; i += batchSize) {
      const batch = conversations.slice(i, i + batchSize);

      if (batch.length === 1 || this.isImportantExchange(batch)) {
        // Keep important exchanges full
        compressed += batch.map(conv => `${conv.speaker}: ${conv.content}`).join('\n') + '\n';
      } else {
        // Summarize routine exchanges
        const summary = this.summarizeConversationBatch(batch);
        compressed += `[Summary of ${batch.length} exchanges: ${summary}]\n`;
      }
    }

    return {
      original: item.content,
      compressed: compressed.trim(),
      originalTokens: item.tokenCount,
      compressedTokens: this.estimateTokenCount(compressed),
      compressionRatio: this.estimateTokenCount(compressed) / item.tokenCount,
      preservedConcepts: this.extractConversationConcepts(item.content),
      informationLoss: this.calculateInformationLoss(item.content, compressed),
      strategy: CompressionStrategy.SUMMARIZATION
    };
  }

  /**
   * Compress file listing content
   */
  private compressFileListings(item: ContextItem, targetRatio: number): CompressionResult {
    const lines = item.content.split('\n');
    const files: Array<{ path: string; size?: string; type: string }> = [];

    // Parse file listing
    for (const line of lines) {
      const match = line.match(/^(.+?)\s*(\d+\s*bytes?)?$/);
      if (match) {
        const path = match[1].trim();
        const size = match[2];
        const type = path.includes('.') ? path.split('.').pop() || 'unknown' : 'directory';
        files.push({ path, size, type });
      }
    }

    // Group by file type and directory
    const grouped = new Map<string, Array<{ path: string; size?: string }>>();
    for (const file of files) {
      const key = file.type === 'directory' ? 'directories' : file.type;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push({ path: file.path, size: file.size });
    }

    // Compress by showing representative samples and counts
    let compressed = '';
    for (const [type, fileList] of grouped.entries()) {
      if (fileList.length <= 3) {
        // Show all if few files
        compressed += fileList.map(f => `${f.path}${f.size ? ` ${f.size}` : ''}`).join('\n') + '\n';
      } else {
        // Show representative samples + count
        const samples = fileList.slice(0, 2);
        compressed += samples.map(f => `${f.path}${f.size ? ` ${f.size}` : ''}`).join('\n');
        compressed += `\n... and ${fileList.length - 2} more ${type} files\n`;
      }
    }

    return {
      original: item.content,
      compressed: compressed.trim(),
      originalTokens: item.tokenCount,
      compressedTokens: this.estimateTokenCount(compressed),
      compressionRatio: this.estimateTokenCount(compressed) / item.tokenCount,
      preservedConcepts: Array.from(grouped.keys()),
      informationLoss: this.calculateInformationLoss(item.content, compressed),
      strategy: CompressionStrategy.PROGRESSIVE_DETAIL
    };
  }

  /**
   * Compress HTML markup content
   */
  private compressHtmlContent(item: ContextItem, targetRatio: number): CompressionResult {
    let compressed = item.content;

    // Step 1: Remove excessive whitespace between tags
    compressed = compressed.replace(/>\s+</g, '><');

    // Step 2: Remove comments except important ones
    compressed = compressed.replace(/<!--[\s\S]*?-->/g, (comment) => {
      if (comment.includes('TODO') || comment.includes('FIXME') || comment.includes('NOTE')) {
        return comment;
      }
      return '';
    });

    // Step 3: Compress inline styles and scripts (preserve functionality)
    compressed = compressed.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, (styleBlock) => {
      const content = styleBlock.match(/<style[^>]*>([\s\S]*?)<\/style>/i)?.[1] || '';
      const compressed_css = content.replace(/\s+/g, ' ').trim();
      return `<style>${compressed_css}</style>`;
    });

    return {
      original: item.content,
      compressed,
      originalTokens: item.tokenCount,
      compressedTokens: this.estimateTokenCount(compressed),
      compressionRatio: this.estimateTokenCount(compressed) / item.tokenCount,
      preservedConcepts: this.extractHtmlConcepts(item.content),
      informationLoss: this.calculateInformationLoss(item.content, compressed),
      strategy: CompressionStrategy.PROGRESSIVE_DETAIL
    };
  }

  /**
   * Compress markdown content
   */
  private compressMarkdownContent(item: ContextItem, targetRatio: number): CompressionResult {
    const lines = item.content.split('\n');
    const sections: Array<{ level: number; title: string; content: string }> = [];
    let currentSection: { level: number; title: string; content: string } | null = null;

    // Parse markdown sections
    for (const line of lines) {
      const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
      if (headerMatch) {
        if (currentSection) {
          sections.push(currentSection);
        }
        currentSection = {
          level: headerMatch[1].length,
          title: headerMatch[2],
          content: ''
        };
      } else if (currentSection) {
        currentSection.content += line + '\n';
      }
    }
    if (currentSection) {
      sections.push(currentSection);
    }

    // Compress sections by summarizing content under each header
    let compressed = '';
    for (const section of sections) {
      const headerMarker = '#'.repeat(section.level);
      compressed += `${headerMarker} ${section.title}\n`;

      if (section.content.trim().length > 200) {
        // Summarize long sections
        const summary = this.summarizeMarkdownSection(section.content);
        compressed += summary + '\n\n';
      } else {
        // Keep short sections as-is
        compressed += section.content + '\n';
      }
    }

    return {
      original: item.content,
      compressed: compressed.trim(),
      originalTokens: item.tokenCount,
      compressedTokens: this.estimateTokenCount(compressed),
      compressionRatio: this.estimateTokenCount(compressed) / item.tokenCount,
      preservedConcepts: sections.map(s => s.title),
      informationLoss: this.calculateInformationLoss(item.content, compressed),
      strategy: CompressionStrategy.SUMMARIZATION
    };
  }

  /**
   * Compress generic content using specified strategy
   */
  private compressGenericContent(
    item: ContextItem,
    strategy: CompressionStrategy,
    targetRatio: number
  ): CompressionResult {
    let compressed = item.content;

    switch (strategy) {
      case CompressionStrategy.SUMMARIZATION:
        compressed = this.applySummarization(compressed, targetRatio);
        break;
      case CompressionStrategy.KEYWORD_EXTRACTION:
        compressed = this.applyKeywordExtraction(compressed, targetRatio);
        break;
      case CompressionStrategy.SEMANTIC_CLUSTERING:
        compressed = this.applySemanticClustering(compressed, targetRatio);
        break;
      case CompressionStrategy.PROGRESSIVE_DETAIL:
        compressed = this.applyProgressiveDetailReduction(compressed, targetRatio);
        break;
    }

    return {
      original: item.content,
      compressed,
      originalTokens: item.tokenCount,
      compressedTokens: this.estimateTokenCount(compressed),
      compressionRatio: this.estimateTokenCount(compressed) / item.tokenCount,
      preservedConcepts: this.extractKeyConcepts(compressed),
      informationLoss: this.calculateInformationLoss(item.content, compressed),
      strategy
    };
  }

  // Helper methods for specific compression techniques

  private clusterSimilarFunctions(code: string): string {
    // Group similar function patterns and represent them more efficiently
    const functions = code.match(/function\s+\w+\([^)]*\)\s*\{[^}]*\}/g) || [];
    const clusters = new Map<string, string[]>();

    for (const func of functions) {
      const signature = func.match(/function\s+(\w+)\(([^)]*)\)/)?.[0] || '';
      const pattern = signature.replace(/\w+/g, 'X'); // Generalize names

      if (!clusters.has(pattern)) clusters.set(pattern, []);
      clusters.get(pattern)!.push(func);
    }

    // Replace clustered functions with representatives
    let compressed = code;
    for (const [pattern, funcs] of clusters.entries()) {
      if (funcs.length > 2) {
        const representative = funcs[0];
        const others = funcs.slice(1);
        for (const func of others) {
          compressed = compressed.replace(func, `// Similar to above (${funcs.length} total)`);
        }
      }
    }

    return compressed;
  }

  private compressJsonProgressively(data: unknown, targetRatio: number, originalTokens: number): string {
    const priorityFields = ['id', 'name', 'type', 'value', 'error', 'message', 'status'];

    if (Array.isArray(data)) {
      // For arrays, keep representative samples
      const sampleSize = Math.max(2, Math.floor(data.length * targetRatio));
      const samples = data.slice(0, sampleSize);
      if (samples.length < data.length) {
        samples.push(`... ${data.length - samples.length} more items`);
      }
      return JSON.stringify(samples);
    } else if (typeof data === 'object' && data !== null) {
      // For objects, prioritize important fields
      const compressed: Record<string, unknown> = {};
      const entries = Object.entries(data);

      // Add priority fields first
      for (const [key, value] of entries) {
        if (priorityFields.includes(key.toLowerCase())) {
          compressed[key] = value;
        }
      }

      // Add remaining fields up to target ratio
      const remaining = entries.filter(([key]) => !priorityFields.includes(key.toLowerCase()));
      const remainingCount = Math.floor(remaining.length * targetRatio);

      for (let i = 0; i < remainingCount; i++) {
        const [key, value] = remaining[i];
        compressed[key] = value;
      }

      return JSON.stringify(compressed);
    }

    return JSON.stringify(data);
  }

  private extractJsonConcepts(data: unknown): string[] {
    const concepts: string[] = [];

    const extract = (obj: unknown, path = '') => {
      if (typeof obj === 'object' && obj !== null) {
        for (const [key, value] of Object.entries(obj)) {
          concepts.push(key);
          if (typeof value === 'object') {
            extract(value, `${path}.${key}`);
          }
        }
      }
    };

    extract(data);
    return Array.from(new Set(concepts));
  }

  private extractErrorConcepts(content: string): string[] {
    const errorPatterns = [
      /Error:\s*(.+)/gi,
      /Exception:\s*(.+)/gi,
      /Failed:\s*(.+)/gi,
      /\bat\s+([^(]+)/gi,
      /File\s+"([^"]+)"/gi
    ];

    const concepts: string[] = [];
    for (const pattern of errorPatterns) {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        if (match[1]) concepts.push(match[1].trim());
      }
    }

    return Array.from(new Set(concepts));
  }

  private isImportantExchange(conversations: Array<{ speaker: string; content: string }>): boolean {
    const importantKeywords = [
      'error', 'problem', 'issue', 'bug', 'fix', 'solution',
      'implement', 'create', 'build', 'test', 'deploy',
      'question', 'help', 'explain', 'how', 'what', 'why'
    ];

    const content = conversations.map(c => c.content.toLowerCase()).join(' ');
    return importantKeywords.some(keyword => content.includes(keyword));
  }

  private summarizeConversationBatch(conversations: Array<{ speaker: string; content: string }>): string {
    const topics = conversations.map(c => {
      const words = c.content.split(' ').filter(w => w.length > 4);
      return words.slice(0, 3).join(' ');
    });
    return `Discussion about ${topics.join(', ')}`;
  }

  private extractConversationConcepts(content: string): string[] {
    const actionWords = content.match(/\b(implement|create|fix|build|test|deploy|analyze|review|update|remove)\b/gi) || [];
    return Array.from(new Set(actionWords.map(word => word.toLowerCase())));
  }

  private extractHtmlConcepts(content: string): string[] {
    const tags = content.match(/<(\w+)[^>]*>/g) || [];
    const tagNames = tags.map(tag => tag.match(/<(\w+)/)?.[1] || '').filter(Boolean);
    return Array.from(new Set(tagNames));
  }

  private summarizeMarkdownSection(content: string): string {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
    if (sentences.length <= 2) return content.trim();

    // Keep first and last sentence, or most important ones
    const firstSentence = sentences[0].trim() + '.';
    const lastSentence = sentences[sentences.length - 1].trim() + '.';

    if (sentences.length > 3) {
      return `${firstSentence} ... ${lastSentence}`;
    } else {
      return sentences.join('. ').trim() + '.';
    }
  }

  private applySummarization(content: string, targetRatio: number): string {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 5);
    const targetCount = Math.max(1, Math.floor(sentences.length * targetRatio));

    // Keep most important sentences (first, last, and longest ones)
    const selected: string[] = [];
    if (sentences.length > 0) selected.push(sentences[0]);
    if (sentences.length > 1 && selected.length < targetCount) {
      selected.push(sentences[sentences.length - 1]);
    }

    // Add longest sentences up to target
    const remaining = sentences
      .filter(s => !selected.includes(s))
      .sort((a, b) => b.length - a.length);

    while (selected.length < targetCount && remaining.length > 0) {
      selected.push(remaining.shift()!);
    }

    return selected.join('. ').trim() + '.';
  }

  private applyKeywordExtraction(content: string, targetRatio: number): string {
    const words = content.split(/\s+/);
    const targetCount = Math.max(10, Math.floor(words.length * targetRatio));

    // Extract important words (longer, non-common words)
    const importantWords = words
      .filter(word => word.length > 3 && !/^(the|and|for|are|but|not|you|all|can|has|had|her|was|one|our|out|day|get|use|man|new|now|old|see|him|two|how|its|who|oil|sit|did)$/.test(word.toLowerCase()))
      .slice(0, targetCount);

    return importantWords.join(' ');
  }

  private applySemanticClustering(content: string, targetRatio: number): string {
    const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    const targetCount = Math.max(1, Math.floor(paragraphs.length * targetRatio));

    // Simple clustering by paragraph similarity (basic approach)
    const selected = paragraphs
      .sort((a, b) => b.length - a.length) // Prefer longer paragraphs
      .slice(0, targetCount);

    return selected.join('\n\n');
  }

  private applyProgressiveDetailReduction(content: string, targetRatio: number): string {
    let compressed = content;

    // Step 1: Remove extra whitespace
    compressed = compressed.replace(/\s+/g, ' ').trim();

    // Step 2: Remove parenthetical remarks
    compressed = compressed.replace(/\([^)]+\)/g, '');

    // Step 3: If still too long, truncate with summary
    const currentRatio = compressed.length / content.length;
    if (currentRatio > targetRatio) {
      const targetLength = Math.floor(content.length * targetRatio);
      compressed = compressed.substring(0, targetLength - 20) + '... [truncated]';
    }

    return compressed;
  }

  private calculateQualityScore(result: CompressionResult, analysis: ContentTypeAnalysis): number {
    let quality = 1.0;

    // Penalize high information loss
    quality -= result.informationLoss * 0.3;

    // Reward good compression ratio
    if (result.compressionRatio < 0.8) quality += 0.1;
    if (result.compressionRatio < 0.6) quality += 0.1;

    // Reward preserved concepts
    const conceptRatio = result.preservedConcepts.length / Math.max(1, analysis.characteristics.keyConcepts.length);
    quality += conceptRatio * 0.2;

    return Math.max(0, Math.min(1.0, quality));
  }

  private calculateInformationLoss(original: string, compressed: string): number {
    const originalWords = new Set(original.toLowerCase().split(/\s+/));
    const compressedWords = new Set(compressed.toLowerCase().split(/\s+/));

    let lostWords = 0;
    for (const word of originalWords) {
      if (!compressedWords.has(word)) lostWords++;
    }

    return originalWords.size > 0 ? lostWords / originalWords.size : 0;
  }

  private extractCriticalElements(original: string, compressed: string): string[] {
    const criticalPatterns = [
      /\b(error|exception|failed|success|warning|critical)\b/gi,
      /\b(function|class|interface|type)\s+\w+/gi,
      /\b(import|export|require)\b[^;]+/gi,
      /\b(TODO|FIXME|NOTE|WARNING)\b[^:\n]*/gi
    ];

    const elements: string[] = [];
    for (const pattern of criticalPatterns) {
      const matches = compressed.matchAll(pattern);
      for (const match of matches) {
        elements.push(match[0]);
      }
    }

    return Array.from(new Set(elements));
  }

  private estimateTokenCount(text: string): number {
    // Rough token estimation: ~4 characters per token on average
    return Math.ceil(text.length / 4);
  }

  private trackPerformanceMetrics(contentType: ContentTypeCategory, processingTime: number): void {
    const key = contentType;
    if (!this.performanceMetrics.has(key)) {
      this.performanceMetrics.set(key, []);
    }

    const metrics = this.performanceMetrics.get(key)!;
    metrics.push(processingTime);

    // Keep last 100 measurements
    if (metrics.length > 100) {
      metrics.shift();
    }

    // Log performance summary every 10 measurements
    if (metrics.length % 10 === 0) {
      const avg = metrics.reduce((sum, time) => sum + time, 0) / metrics.length;
      logger.debug('Performance metrics updated', {
        contentType,
        averageProcessingTime: avg.toFixed(2),
        measurements: metrics.length
      });
    }
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats(): Record<string, { average: number; count: number; latest: number }> {
    const stats: Record<string, { average: number; count: number; latest: number }> = {};

    for (const [type, measurements] of this.performanceMetrics.entries()) {
      if (measurements.length > 0) {
        const average = measurements.reduce((sum, time) => sum + time, 0) / measurements.length;
        stats[type] = {
          average: Number(average.toFixed(2)),
          count: measurements.length,
          latest: Number(measurements[measurements.length - 1].toFixed(2))
        };
      }
    }

    return stats;
  }
}