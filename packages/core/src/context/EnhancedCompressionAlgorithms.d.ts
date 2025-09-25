/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { CompressionStrategy, CompressionResult, ContextItem } from './types.js';
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
export declare enum ContentTypeCategory {
    JAVASCRIPT_CODE = "javascript_code",
    TYPESCRIPT_CODE = "typescript_code",
    PYTHON_CODE = "python_code",
    HTML_MARKUP = "html_markup",
    CSS_STYLES = "css_styles",
    JSON_DATA = "json_data",
    XML_DATA = "xml_data",
    MARKDOWN_TEXT = "markdown_text",
    PLAIN_TEXT = "plain_text",
    CONVERSATION_LOG = "conversation_log",
    ERROR_LOG = "error_log",
    BUILD_OUTPUT = "build_output",
    FILE_LISTING = "file_listing",
    CONFIGURATION = "configuration",
    DOCUMENTATION = "documentation",
    MIXED_CONTENT = "mixed_content"
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
export declare class EnhancedCompressionAlgorithms {
    private config;
    private performanceMetrics;
    constructor(config?: Partial<EnhancedCompressionConfig>);
    /**
     * Update configuration dynamically
     */
    updateConfig(updates: Partial<EnhancedCompressionConfig>): void;
    /**
     * Compress content with type-specific optimization
     */
    compressWithTypeOptimization(item: ContextItem, targetRatio?: number): Promise<EnhancedCompressionResult>;
    /**
     * Analyze content type and characteristics
     */
    private analyzeContentType;
    /**
     * Analyze content characteristics for optimization
     */
    private analyzeContentCharacteristics;
    /**
     * Extract key concepts from content
     */
    private extractKeyConcepts;
    /**
     * Get recommended compression strategy for content type
     */
    private getRecommendedStrategy;
    /**
     * Apply type-specific compression
     */
    private applyTypeSpecificCompression;
    /**
     * Compress JavaScript/TypeScript code content
     */
    private compressCodeContent;
    /**
     * Compress JSON data content
     */
    private compressJsonContent;
    /**
     * Compress error log content
     */
    private compressErrorLog;
    /**
     * Compress conversation log content
     */
    private compressConversationLog;
    /**
     * Compress file listing content
     */
    private compressFileListings;
    /**
     * Compress HTML markup content
     */
    private compressHtmlContent;
    /**
     * Compress markdown content
     */
    private compressMarkdownContent;
    /**
     * Compress generic content using specified strategy
     */
    private compressGenericContent;
    private clusterSimilarFunctions;
    private compressJsonProgressively;
    private extractJsonConcepts;
    private extractErrorConcepts;
    private isImportantExchange;
    private summarizeConversationBatch;
    private extractConversationConcepts;
    private extractHtmlConcepts;
    private summarizeMarkdownSection;
    private applySummarization;
    private applyKeywordExtraction;
    private applySemanticClustering;
    private applyProgressiveDetailReduction;
    private calculateQualityScore;
    private calculateInformationLoss;
    private extractCriticalElements;
    private estimateTokenCount;
    private trackPerformanceMetrics;
    /**
     * Get performance statistics
     */
    getPerformanceStats(): Record<string, {
        average: number;
        count: number;
        latest: number;
    }>;
}
