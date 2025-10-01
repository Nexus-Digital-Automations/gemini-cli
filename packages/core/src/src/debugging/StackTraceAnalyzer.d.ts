/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { StackTraceAnalysis, LanguageSupport, StackTraceFrame, ContextLine, SourceLocation } from './types.js';
/**
 * Configuration for stack trace analyzer
 */
export interface StackTraceAnalyzerConfig {
    /** Enable source map resolution */
    enableSourceMaps: boolean;
    /** Enable context line extraction */
    enableContextLines: boolean;
    /** Number of context lines to extract around each frame */
    contextLineCount: number;
    /** Enable async call chain analysis */
    enableAsyncAnalysis: boolean;
    /** Enable recursion detection */
    enableRecursionDetection: boolean;
    /** Maximum stack trace depth to analyze */
    maxAnalysisDepth: number;
    /** Supported programming languages */
    supportedLanguages: LanguageSupport[];
    /** Enable third-party library detection */
    enableLibraryDetection: boolean;
    /** Known library patterns for filtering */
    libraryPatterns: string[];
    /** Enable performance optimizations */
    enableOptimizations: boolean;
    /** Cache TTL for source map data in milliseconds */
    sourceMapCacheTTL: number;
}
/**
 * Default configuration for stack trace analyzer
 */
export declare const DEFAULT_STACK_TRACE_ANALYZER_CONFIG: StackTraceAnalyzerConfig;
/**
 * Stack Trace Analyzer
 *
 * Intelligent system for parsing, analyzing, and understanding stack traces across
 * multiple programming languages with source mapping and contextual analysis.
 *
 * Key Features:
 * - **Multi-Language Support**: Parses stack traces from JavaScript, TypeScript, Python, Java, Go, and more
 * - **Source Map Resolution**: Resolves minified/compiled code back to original source
 * - **Context Extraction**: Extracts relevant code context around error locations
 * - **Call Chain Analysis**: Analyzes execution flow and identifies critical paths
 * - **Async Flow Tracking**: Understands asynchronous call chains and Promise flows
 * - **Recursion Detection**: Identifies infinite recursion and call stack issues
 * - **Library Classification**: Distinguishes between user code, libraries, and system code
 * - **Pattern Recognition**: Recognizes common error patterns and provides insights
 *
 * @example
 * ```typescript
 * const analyzer = new StackTraceAnalyzer({
 *   enableSourceMaps: true,
 *   enableAsyncAnalysis: true,
 * });
 *
 * await analyzer.initialize('/path/to/project');
 *
 * // Analyze a stack trace
 * const analysis = await analyzer.analyzeStackTrace(stackTraceText, {
 *   language: 'typescript',
 *   sourceRoot: '/src',
 *   includeContext: true,
 * });
 *
 * console.log('Root cause frame:', analysis.rootCause);
 * console.log('Call chain:', analysis.callChain);
 * console.log('User code frames:', analysis.userCodeFrames);
 * ```
 */
export declare class StackTraceAnalyzer {
    private config;
    private sourceMapCache;
    private contextCache;
    private projectPath?;
    private isInitialized;
    constructor(config?: Partial<StackTraceAnalyzerConfig>);
    /**
     * Initialize the stack trace analyzer
     */
    initialize(projectPath?: string): Promise<void>;
    /**
     * Analyze a complete stack trace
     */
    analyzeStackTrace(stackTraceText: string, options?: {
        language?: LanguageSupport;
        sourceRoot?: string;
        includeContext?: boolean;
        maxFrames?: number;
    }): Promise<StackTraceAnalysis>;
    /**
     * Parse individual stack trace frame
     */
    parseFrame(frameText: string, language: LanguageSupport): Promise<StackTraceFrame | null>;
    /**
     * Resolve source map for a given location
     */
    resolveSourceMap(filePath: string, line: number, column: number): Promise<SourceLocation | null>;
    /**
     * Extract context lines around a frame
     */
    extractContextLines(filePath: string, lineNumber: number, contextCount?: number): Promise<ContextLine[]>;
    /**
     * Get stack trace analysis statistics
     */
    getAnalysisStats(): {
        sourceMapsResolved: number;
        contextLinesExtracted: number;
        framesAnalyzed: number;
        cacheHitRate: number;
    };
    /**
     * Clear caches
     */
    clearCache(): void;
    /**
     * Update configuration
     */
    updateConfig(newConfig: Partial<StackTraceAnalyzerConfig>): void;
    /**
     * Parse stack trace text into frames
     */
    private parseStackTrace;
    /**
     * Create stack trace frame from regex match
     */
    private createFrameFromMatch;
    /**
     * Analyze individual frames for detailed insights
     */
    private analyzeFrames;
    /**
     * Analyze the call chain for patterns and flow
     */
    private analyzeCallChain;
    /**
     * Detect common error patterns in stack trace
     */
    private detectErrorPatterns;
    /**
     * Identify the root cause frame
     */
    private identifyRootCause;
    /**
     * Classify frames by their role and importance
     */
    private classifyFrames;
    /**
     * Detect recursion patterns in stack trace
     */
    private detectRecursion;
    /**
     * Analyze async call chains
     */
    private analyzeAsyncChain;
    /**
     * Generate analysis insights
     */
    private generateInsights;
    /**
     * Detect programming language from stack trace format
     */
    private detectLanguageFromStackTrace;
    /**
     * Check if frame represents user code
     */
    private isUserCodeFrame;
    /**
     * Check if frame represents third-party code
     */
    private isThirdPartyFrame;
    /**
     * Check if frame represents async operation
     */
    private isAsyncFrame;
    /**
     * Calculate frame importance for prioritization
     */
    private calculateFrameImportance;
    /**
     * Categorize frame by its role
     */
    private categorizeFrame;
    /**
     * Generate frame-specific insights
     */
    private generateFrameInsights;
    /**
     * Calculate confidence score for frame analysis
     */
    private calculateFrameConfidence;
    /**
     * Identify critical path through the call stack
     */
    private identifyCriticalPath;
    /**
     * Identify transitions between user code and libraries
     */
    private identifyLibraryTransitions;
    /**
     * Calculate promise chain depth from stack trace text
     */
    private calculatePromiseChainDepth;
    /**
     * Get recommendations for detected error patterns
     */
    private getPatternRecommendations;
    /**
     * Initialize source maps for the project
     */
    private initializeSourceMaps;
    /**
     * Get source map data for a file
     */
    private getSourceMapData;
}
/**
 * Create a Stack Trace Analyzer instance
 */
export declare function createStackTraceAnalyzer(config?: Partial<StackTraceAnalyzerConfig>, projectPath?: string): Promise<StackTraceAnalyzer>;
