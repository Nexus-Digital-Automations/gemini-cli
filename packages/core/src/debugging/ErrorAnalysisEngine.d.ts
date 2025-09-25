/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  ErrorAnalysis,
  ErrorAnalysisContext,
  ErrorPattern,
  ErrorCategory,
  ErrorTrend,
  SimilarityScore,
} from './types.js';
import { type ErrorPatternRecognitionConfig } from './ErrorPatternRecognition.js';
/**
 * Pattern match result interface
 */
export interface PatternMatch {
  category: ErrorCategory;
  confidence: number;
  pattern: ErrorPattern;
  matchData: Record<string, unknown>;
}
/**
 * Configuration for error analysis engine
 */
export interface ErrorAnalysisEngineConfig {
  /** Error pattern recognition configuration */
  patternRecognition: Partial<ErrorPatternRecognitionConfig>;
  /** Enable deep context analysis */
  enableDeepAnalysis: boolean;
  /** Enable performance impact analysis */
  enablePerformanceAnalysis: boolean;
  /** Enable security implication analysis */
  enableSecurityAnalysis: boolean;
  /** Maximum analysis depth */
  maxAnalysisDepth: number;
  /** Enable related error detection */
  enableRelatedErrorDetection: boolean;
  /** Enable trend analysis */
  enableTrendAnalysis: boolean;
  /** Maximum related errors to track */
  maxRelatedErrors: number;
  /** Analysis cache TTL in milliseconds */
  analysisCacheTTL: number;
  /** Enable ML-based insights */
  enableMLInsights: boolean;
  /** Confidence threshold for insights */
  insightConfidenceThreshold: number;
}
/**
 * Default configuration for error analysis engine
 */
export declare const DEFAULT_ERROR_ANALYSIS_ENGINE_CONFIG: ErrorAnalysisEngineConfig;
/**
 * Error Analysis Engine
 *
 * Comprehensive system for analyzing errors with intelligent categorization, contextual insights,
 * and multi-dimensional analysis including performance, security, and project impact assessment.
 *
 * Key Features:
 * - **Pattern-Based Analysis**: Uses advanced pattern recognition for accurate error identification
 * - **Contextual Intelligence**: Considers project context, file relationships, and execution environment
 * - **Multi-Dimensional Analysis**: Evaluates performance, security, maintainability, and project impact
 * - **Related Error Detection**: Identifies patterns and relationships between different errors
 * - **Trend Analysis**: Tracks error frequency and patterns over time
 * - **ML-Powered Insights**: Provides intelligent suggestions based on learned patterns
 * - **Language-Agnostic**: Supports multiple programming languages with specialized analysis
 *
 * @example
 * ```typescript
 * const analysisEngine = new ErrorAnalysisEngine({
 *   enableDeepAnalysis: true,
 *   enableMLInsights: true,
 * });
 *
 * await analysisEngine.initialize('/path/to/project');
 *
 * // Analyze error with context
 * const analysis = await analysisEngine.analyzeError(errorMessage, {
 *   language: 'typescript',
 *   filePath: 'src/components/UserForm.tsx',
 *   projectContext: { framework: 'react', buildTool: 'vite' },
 *   executionContext: { stage: 'build', environment: 'development' },
 * });
 *
 * // Get insights and suggestions
 * console.log('Category:', analysis.category);
 * console.log('Severity:', analysis.severity);
 * console.log('Root Cause:', analysis.rootCause);
 * console.log('Fix Suggestions:', analysis.fixSuggestions);
 * ```
 */
export declare class ErrorAnalysisEngine {
  private config;
  private patternRecognition;
  private analysisCache;
  private errorHistory;
  private relatedErrors;
  private projectPath?;
  private isInitialized;
  constructor(config?: Partial<ErrorAnalysisEngineConfig>);
  /**
   * Initialize the error analysis engine
   */
  initialize(projectPath?: string): Promise<void>;
  /**
   * Perform comprehensive error analysis
   */
  analyzeError(
    errorText: string,
    context: ErrorAnalysisContext,
  ): Promise<ErrorAnalysis>;
  /**
   * Get error frequency and trend analysis
   */
  getErrorTrends(): Map<string, ErrorTrend>;
  /**
   * Find similar errors based on patterns and context
   */
  findSimilarErrors(
    errorText: string,
    context: ErrorAnalysisContext,
    limit?: number,
  ): Promise<
    Array<{
      signature: string;
      similarity: SimilarityScore;
      analysis?: ErrorAnalysis;
    }>
  >;
  /**
   * Get analysis statistics
   */
  getAnalysisStats(): {
    totalAnalyses: number;
    cacheHitRate: number;
    averageProcessingTime: number;
    commonCategories: Record<string, number>;
    severityDistribution: Record<string, number>;
  };
  /**
   * Clear analysis cache
   */
  clearCache(): void;
  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<ErrorAnalysisEngineConfig>): void;
  /**
   * Determine the primary error category
   */
  private determineCategory;
  /**
   * Calculate error severity based on patterns and context
   */
  private calculateSeverity;
  /**
   * Calculate overall confidence score
   */
  private calculateOverallConfidence;
  /**
   * Identify the root cause of the error
   */
  private identifyRootCause;
  /**
   * Generate fix suggestions based on analysis
   */
  private generateFixSuggestions;
  /**
   * Generate intelligent insights about the error
   */
  private generateInsights;
  /**
   * Analyze contextual factors affecting the error
   */
  private analyzeContextualFactors;
  /**
   * Find related errors based on signature similarity
   */
  private findRelatedErrors;
  /**
   * Analyze performance impact of the error
   */
  private analyzePerformanceImpact;
  /**
   * Analyze security implications of the error
   */
  private analyzeSecurityImplications;
  /**
   * Assess the project-wide impact of the error
   */
  private assessProjectImpact;
  /**
   * Check if error blocks execution
   */
  private isBlockingError;
  /**
   * Estimate time to fix based on error characteristics
   */
  private estimateFixTime;
  /**
   * Generate error signature for tracking and similarity
   */
  private generateErrorSignature;
  /**
   * Update error frequency tracking
   */
  private updateErrorFrequency;
  /**
   * Update related errors mapping
   */
  private updateRelatedErrors;
  /**
   * Calculate error trend from frequency data
   */
  private calculateErrorTrend;
  /**
   * Calculate similarity between error signatures
   */
  private calculateErrorSimilarity;
  /**
   * Load error history from storage
   */
  private loadErrorHistory;
  /**
   * Generate cache key for analysis results
   */
  private generateAnalysisCacheKey;
  /**
   * Simple hash function
   */
  private simpleHash;
}
/**
 * Create an Error Analysis Engine instance
 */
export declare function createErrorAnalysisEngine(
  config?: Partial<ErrorAnalysisEngineConfig>,
  projectPath?: string,
): Promise<ErrorAnalysisEngine>;
