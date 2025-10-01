/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { ErrorPattern, ErrorAnalysisContext, LanguageSupport, PatternMatchResult, PatternStats } from './types.js';
/**
 * Configuration for error pattern recognition
 */
export interface ErrorPatternRecognitionConfig {
    /** Enable machine learning-based pattern detection */
    enableMLPatterns: boolean;
    /** Minimum confidence threshold for pattern matches */
    confidenceThreshold: number;
    /** Maximum number of patterns to maintain in memory */
    maxPatterns: number;
    /** Enable automatic pattern learning from new errors */
    enablePatternLearning: boolean;
    /** Update pattern statistics in real-time */
    enableRealTimeStats: boolean;
    /** Supported programming languages */
    supportedLanguages: LanguageSupport[];
    /** Enable cross-project pattern sharing */
    enableCrossProjectPatterns: boolean;
    /** Pattern cache TTL in milliseconds */
    patternCacheTTL: number;
}
/**
 * Default configuration for error pattern recognition
 */
export declare const DEFAULT_ERROR_PATTERN_RECOGNITION_CONFIG: ErrorPatternRecognitionConfig;
/**
 * Error Pattern Recognition Engine
 *
 * Intelligent system for recognizing, categorizing, and learning from error patterns
 * across multiple programming languages and execution contexts.
 *
 * Key Features:
 * - **Multi-Language Support**: Recognizes patterns across JavaScript, TypeScript, Python, Java, Go, and more
 * - **Built-in Pattern Library**: Comprehensive collection of common error patterns
 * - **Machine Learning Integration**: Learns new patterns from error frequency and context
 * - **Real-Time Statistics**: Tracks error frequency and pattern effectiveness
 * - **Context-Aware Matching**: Considers file context, project type, and execution environment
 * - **Cross-Project Learning**: Optionally shares patterns across different projects
 *
 * @example
 * ```typescript
 * const patternEngine = new ErrorPatternRecognition({
 *   enableMLPatterns: true,
 *   confidenceThreshold: 0.8,
 * });
 *
 * await patternEngine.initialize('/path/to/project');
 *
 * // Analyze error
 * const matches = await patternEngine.analyzeError(errorText, {
 *   language: 'typescript',
 *   filePath: 'src/main.ts',
 *   projectContext: { framework: 'react' },
 * });
 *
 * // Learn from new error
 * await patternEngine.learnFromError(errorText, matches, userFeedback);
 * ```
 */
export declare class ErrorPatternRecognition {
    private config;
    private patterns;
    private patternStats;
    private learningData;
    private patternCache;
    private isInitialized;
    constructor(config?: Partial<ErrorPatternRecognitionConfig>);
    /**
     * Initialize the error pattern recognition system
     */
    initialize(projectPath?: string): Promise<void>;
    /**
     * Analyze error text and find matching patterns
     */
    analyzeError(errorText: string, context: ErrorAnalysisContext): Promise<PatternMatchResult[]>;
    /**
     * Learn from error patterns and user feedback
     */
    learnFromError(errorText: string, matches: PatternMatchResult[], userFeedback?: {
        correctMatch?: string;
        incorrectMatches?: string[];
        actualCause?: string;
        solution?: string;
    }): Promise<void>;
    /**
     * Get pattern statistics and effectiveness metrics
     */
    getPatternStats(): Map<string, PatternStats>;
    /**
     * Add custom error pattern
     */
    addCustomPattern(pattern: ErrorPattern): Promise<void>;
    /**
     * Remove error pattern
     */
    removePattern(patternId: string): Promise<boolean>;
    /**
     * Get all registered patterns
     */
    getPatterns(): ErrorPattern[];
    /**
     * Update configuration
     */
    updateConfig(newConfig: Partial<ErrorPatternRecognitionConfig>): void;
    /**
     * Clear pattern cache
     */
    clearCache(): void;
    /**
     * Get cache statistics
     */
    getCacheStats(): {
        size: number;
        hitRate: number;
    };
    /**
     * Load built-in error patterns
     */
    private loadBuiltinPatterns;
    /**
     * Load project-specific patterns
     */
    private loadProjectPatterns;
    /**
     * Initialize pattern statistics
     */
    private initializePatternStats;
    /**
     * Load learned patterns from machine learning
     */
    private loadLearnedPatterns;
    /**
     * Find all matching patterns for an error
     */
    private findMatches;
    /**
     * Test a pattern against error text
     */
    private testPattern;
    /**
     * Test a single matcher against error text (legacy method)
     */
    private testMatcher;
    /**
     * Calculate confidence score for regex matches
     */
    private calculateRegexConfidence;
    /**
     * Rank matches by relevance and confidence
     */
    private rankMatches;
    /**
     * Generate suggestions based on pattern match
     */
    private generateSuggestions;
    /**
     * Update pattern statistics
     */
    private updatePatternStats;
    /**
     * Learn new pattern from error and user feedback
     */
    private learnNewPattern;
    /**
     * Update pattern effectiveness based on user feedback
     */
    private updatePatternEffectiveness;
    /**
     * Validate error pattern
     */
    private validatePattern;
    /**
     * Generate cache key for error analysis
     */
    private generateCacheKey;
    /**
     * Simple hash function for cache keys
     */
    private simpleHash;
    /**
     * Extract flags from regex
     */
    private extractRegexFlags;
}
/**
 * Create an Error Pattern Recognition Engine instance
 */
export declare function createErrorPatternRecognition(config?: Partial<ErrorPatternRecognitionConfig>, projectPath?: string): Promise<ErrorPatternRecognition>;
