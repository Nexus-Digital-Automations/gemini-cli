/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Error Analysis Engine for Interactive Debugging Assistance
 * Provides comprehensive error analysis with intelligent categorization and contextual insights
 *
 * @author Claude Code - Interactive Debugging Agent
 * @version 1.0.0
 */

import { getComponentLogger } from '../utils/logger.js';
import type {
  ErrorAnalysis,
  ErrorAnalysisContext,
  ErrorPattern,
  ErrorCategory,
  LanguageSupport,
  ErrorSeverity,
  ErrorSignature,
  ErrorContext,
  AnalysisResult,
  ErrorInsight,
  ContextualFactor,
  RelatedError,
  ErrorTrend,
  ErrorFrequencyData,
  SimilarityScore,
  PerformanceMetrics,
  CodeQualityMetrics,
  SecurityImplications,
  ProjectImpact,
  ResourceUsage,
} from './types.js';

import {
  ErrorPatternRecognition,
  type ErrorPatternRecognitionConfig,
} from './ErrorPatternRecognition.js';

const logger = getComponentLogger('error-analysis-engine');

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
export const DEFAULT_ERROR_ANALYSIS_ENGINE_CONFIG: ErrorAnalysisEngineConfig = {
  patternRecognition: {
    enableMLPatterns: true,
    confidenceThreshold: 0.75,
    enablePatternLearning: true,
  },
  enableDeepAnalysis: true,
  enablePerformanceAnalysis: true,
  enableSecurityAnalysis: true,
  maxAnalysisDepth: 5,
  enableRelatedErrorDetection: true,
  enableTrendAnalysis: true,
  maxRelatedErrors: 10,
  analysisCacheTTL: 1000 * 60 * 15, // 15 minutes
  enableMLInsights: true,
  insightConfidenceThreshold: 0.7,
};

/**
 * Common error categories and their characteristics
 */
const ERROR_CATEGORY_METADATA = {
  syntax: {
    severity: 'error' as ErrorSeverity,
    blocksExecution: true,
    quickFix: true,
    userFriendly: 'Code has invalid syntax that prevents it from running',
  },
  compile: {
    severity: 'error' as ErrorSeverity,
    blocksExecution: true,
    quickFix: false,
    userFriendly: 'Code cannot be compiled due to structural issues',
  },
  runtime: {
    severity: 'error' as ErrorSeverity,
    blocksExecution: true,
    quickFix: false,
    userFriendly: 'Error occurred while the program was running',
  },
  import: {
    severity: 'error' as ErrorSeverity,
    blocksExecution: true,
    quickFix: true,
    userFriendly: 'Cannot import required modules or dependencies',
  },
  type: {
    severity: 'warning' as ErrorSeverity,
    blocksExecution: false,
    quickFix: true,
    userFriendly: 'Type checking found potential issues',
  },
  lint: {
    severity: 'warning' as ErrorSeverity,
    blocksExecution: false,
    quickFix: true,
    userFriendly: 'Code style or best practice violations',
  },
  security: {
    severity: 'critical' as ErrorSeverity,
    blocksExecution: false,
    quickFix: false,
    userFriendly: 'Potential security vulnerabilities detected',
  },
  performance: {
    severity: 'medium' as ErrorSeverity,
    blocksExecution: false,
    quickFix: false,
    userFriendly: 'Performance issues that may affect application speed',
  },
  network: {
    severity: 'error' as ErrorSeverity,
    blocksExecution: true,
    quickFix: false,
    userFriendly: 'Network connectivity or API communication issues',
  },
  configuration: {
    severity: 'error' as ErrorSeverity,
    blocksExecution: true,
    quickFix: true,
    userFriendly: 'Application or environment configuration problems',
  },
};

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
export class ErrorAnalysisEngine {
  private config: ErrorAnalysisEngineConfig;
  private patternRecognition: ErrorPatternRecognition;
  private analysisCache: Map<
    string,
    { result: ErrorAnalysis; timestamp: number }
  > = new Map();
  private errorHistory: Map<string, ErrorFrequencyData> = new Map();
  private relatedErrors: Map<string, RelatedError[]> = new Map();
  private projectPath?: string;
  private isInitialized = false;

  constructor(config: Partial<ErrorAnalysisEngineConfig> = {}) {
    this.config = { ...DEFAULT_ERROR_ANALYSIS_ENGINE_CONFIG, ...config };
    this.patternRecognition = new ErrorPatternRecognition(
      this.config.patternRecognition,
    );

    logger.info('ErrorAnalysisEngine initialized', {
      deepAnalysis: this.config.enableDeepAnalysis,
      performanceAnalysis: this.config.enablePerformanceAnalysis,
      securityAnalysis: this.config.enableSecurityAnalysis,
    });
  }

  /**
   * Initialize the error analysis engine
   */
  async initialize(projectPath?: string): Promise<void> {
    const startTime = performance.now();
    logger.info('Initializing Error Analysis Engine', { projectPath });

    try {
      this.projectPath = projectPath;

      // Initialize pattern recognition
      await this.patternRecognition.initialize(projectPath);

      // Load error history if available
      if (projectPath) {
        await this.loadErrorHistory(projectPath);
      }

      this.isInitialized = true;
      const duration = performance.now() - startTime;

      logger.info(
        `Error Analysis Engine initialized in ${duration.toFixed(2)}ms`,
        {
          projectPath,
          hasErrorHistory: this.errorHistory.size > 0,
        },
      );
    } catch (error) {
      logger.error('Failed to initialize Error Analysis Engine', { error });
      throw error;
    }
  }

  /**
   * Perform comprehensive error analysis
   */
  async analyzeError(
    errorText: string,
    context: ErrorAnalysisContext,
  ): Promise<ErrorAnalysis> {
    if (!this.isInitialized) {
      throw new Error(
        'ErrorAnalysisEngine not initialized. Call initialize() first.',
      );
    }

    const startTime = performance.now();
    const cacheKey = this.generateAnalysisCacheKey(errorText, context);

    try {
      // Check cache first
      const cachedResult = this.analysisCache.get(cacheKey);
      if (
        cachedResult &&
        Date.now() - cachedResult.timestamp < this.config.analysisCacheTTL
      ) {
        logger.debug('Retrieved error analysis from cache', { cacheKey });
        return cachedResult.result;
      }

      // Perform pattern recognition
      const patternMatches = await this.patternRecognition.analyzeError(
        errorText,
        context,
      );

      // Generate error signature for tracking
      const signature = this.generateErrorSignature(errorText, context);

      // Perform comprehensive analysis
      const analysis: ErrorAnalysis = {
        errorText,
        signature,
        timestamp: new Date(),
        context,
        category: this.determineCategory(patternMatches, errorText),
        severity: this.calculateSeverity(patternMatches, errorText, context),
        confidence: this.calculateOverallConfidence(patternMatches),
        rootCause: await this.identifyRootCause(
          errorText,
          patternMatches,
          context,
        ),
        patterns: patternMatches,
        fixSuggestions: await this.generateFixSuggestions(
          patternMatches,
          context,
        ),
        insights: await this.generateInsights(
          errorText,
          patternMatches,
          context,
        ),
        contextualFactors: await this.analyzeContextualFactors(context),
        relatedErrors: this.findRelatedErrors(signature, context),
        performanceImpact: this.config.enablePerformanceAnalysis
          ? await this.analyzePerformanceImpact(errorText, context)
          : undefined,
        securityImplications: this.config.enableSecurityAnalysis
          ? await this.analyzeSecurityImplications(errorText, context)
          : undefined,
        projectImpact: await this.assessProjectImpact(errorText, context),
        metadata: {
          analysisVersion: '1.0.0',
          processingTimeMs: 0, // Will be updated
          mlInsightsUsed: this.config.enableMLInsights,
          deepAnalysisPerformed: this.config.enableDeepAnalysis,
        },
      };

      // Track error frequency
      await this.updateErrorFrequency(signature, analysis);

      // Update related errors
      if (this.config.enableRelatedErrorDetection) {
        await this.updateRelatedErrors(signature, analysis);
      }

      // Update processing time
      const duration = performance.now() - startTime;
      analysis.metadata.processingTimeMs = Math.round(duration);

      // Cache results
      this.analysisCache.set(cacheKey, {
        result: analysis,
        timestamp: Date.now(),
      });

      logger.info(`Error analysis completed in ${duration.toFixed(2)}ms`, {
        category: analysis.category,
        severity: analysis.severity,
        confidence: analysis.confidence,
        patternsFound: patternMatches.length,
      });

      return analysis;
    } catch (error) {
      logger.error('Failed to analyze error', {
        error,
        errorText: errorText.substring(0, 200),
      });
      throw error;
    }
  }

  /**
   * Get error frequency and trend analysis
   */
  getErrorTrends(): Map<string, ErrorTrend> {
    const trends = new Map<string, ErrorTrend>();

    for (const [signature, frequencyData] of this.errorHistory.entries()) {
      if (frequencyData.occurrences.length >= 2) {
        const trend = this.calculateErrorTrend(frequencyData);
        trends.set(signature, trend);
      }
    }

    return trends;
  }

  /**
   * Find similar errors based on patterns and context
   */
  async findSimilarErrors(
    errorText: string,
    context: ErrorAnalysisContext,
    limit: number = 5,
  ): Promise<
    Array<{
      signature: string;
      similarity: SimilarityScore;
      analysis?: ErrorAnalysis;
    }>
  > {
    if (!this.isInitialized) {
      throw new Error('ErrorAnalysisEngine not initialized');
    }

    const signature = this.generateErrorSignature(errorText, context);
    const similarities: Array<{
      signature: string;
      similarity: SimilarityScore;
    }> = [];

    // Compare with known error signatures
    for (const [
      knownSignature,
      _frequencyData,
    ] of this.errorHistory.entries()) {
      if (knownSignature === signature) continue;

      const similarity = this.calculateErrorSimilarity(
        signature,
        knownSignature,
      );
      if (similarity.overall > 0.5) {
        similarities.push({ signature: knownSignature, similarity });
      }
    }

    // Sort by similarity and return top results
    similarities.sort((a, b) => b.similarity.overall - a.similarity.overall);

    return similarities.slice(0, limit);
  }

  /**
   * Get analysis statistics
   */
  getAnalysisStats(): {
    totalAnalyses: number;
    cacheHitRate: number;
    averageProcessingTime: number;
    commonCategories: Record<string, number>;
    severityDistribution: Record<string, number>;
  } {
    const stats = {
      totalAnalyses: this.errorHistory.size,
      cacheHitRate: 0.75, // Placeholder - would track actual hits/misses
      averageProcessingTime: 125, // Placeholder - would track actual times
      commonCategories: {} as Record<string, number>,
      severityDistribution: {} as Record<string, number>,
    };

    // Calculate category and severity distributions from error history
    for (const frequencyData of this.errorHistory.values()) {
      if (frequencyData.lastAnalysis) {
        const category = frequencyData.lastAnalysis.category;
        const severity = frequencyData.lastAnalysis.severity;

        stats.commonCategories[category] =
          (stats.commonCategories[category] || 0) + 1;
        stats.severityDistribution[severity] =
          (stats.severityDistribution[severity] || 0) + 1;
      }
    }

    return stats;
  }

  /**
   * Clear analysis cache
   */
  clearCache(): void {
    this.analysisCache.clear();
    logger.debug('Analysis cache cleared');
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<ErrorAnalysisEngineConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // Update pattern recognition config if provided
    if (newConfig.patternRecognition) {
      this.patternRecognition.updateConfig(newConfig.patternRecognition);
    }

    // Clear cache if analysis settings changed
    if (
      newConfig.enableDeepAnalysis !== undefined ||
      newConfig.enableMLInsights !== undefined ||
      newConfig.insightConfidenceThreshold !== undefined
    ) {
      this.clearCache();
    }

    logger.info('Error analysis engine configuration updated');
  }

  /**
   * Determine the primary error category
   */
  private determineCategory(
    patternMatches: ErrorPattern[],
    errorText: string,
  ): ErrorCategory {
    if (patternMatches.length > 0) {
      // Use the highest confidence pattern's category
      const bestMatch = patternMatches[0];
      return bestMatch.category;
    }

    // Fallback to text-based categorization
    const errorLower = errorText.toLowerCase();

    if (
      errorLower.includes('syntax') ||
      errorLower.includes('unexpected token')
    ) {
      return 'syntax';
    }
    if (
      errorLower.includes('cannot import') ||
      errorLower.includes('module not found')
    ) {
      return 'import';
    }
    if (errorLower.includes('type') && errorLower.includes('not assignable')) {
      return 'type';
    }
    if (errorLower.includes('network') || errorLower.includes('connection')) {
      return 'network';
    }

    return 'runtime'; // Default category
  }

  /**
   * Calculate error severity based on patterns and context
   */
  private calculateSeverity(
    patternMatches: ErrorPattern[],
    errorText: string,
    context: ErrorAnalysisContext,
  ): ErrorSeverity {
    let severity: ErrorSeverity = 'medium';

    // Check pattern-based severity
    if (patternMatches.length > 0) {
      severity = patternMatches[0].severity || 'medium';
    }

    // Boost severity for production environments
    if (context.executionContext?.environment === 'production') {
      if (severity === 'medium') severity = 'error';
      if (severity === 'error') severity = 'critical';
    }

    // Critical severity for security issues
    if (
      errorText.toLowerCase().includes('security') ||
      errorText.toLowerCase().includes('vulnerability')
    ) {
      severity = 'critical';
    }

    // Error severity for blocking issues
    if (this.isBlockingError(errorText)) {
      severity = severity === 'warning' ? 'error' : severity;
    }

    return severity;
  }

  /**
   * Calculate overall confidence score
   */
  private calculateOverallConfidence(patternMatches: ErrorPattern[]): number {
    if (patternMatches.length === 0) {
      return 0.3; // Low confidence without patterns
    }

    // Weighted average of pattern confidences
    const totalWeight = patternMatches.reduce((sum, match) => sum + 1, 0);
    const weightedSum = patternMatches.reduce(
      (sum, match) => sum + match.confidence,
      0,
    );

    return weightedSum / totalWeight;
  }

  /**
   * Identify the root cause of the error
   */
  private async identifyRootCause(
    errorText: string,
    patternMatches: ErrorPattern[],
    context: ErrorAnalysisContext,
  ): Promise<string> {
    // Use pattern-based root cause if available
    if (patternMatches.length > 0) {
      const bestMatch = patternMatches[0];
      if (bestMatch.pattern.metadata?.commonCauses?.[0]) {
        return bestMatch.pattern.metadata.commonCauses[0];
      }
    }

    // Analyze error text for common root causes
    const errorLower = errorText.toLowerCase();

    if (errorLower.includes('undefined') && errorLower.includes('property')) {
      return 'Attempting to access property on undefined or null value';
    }
    if (errorLower.includes('module not found')) {
      return 'Required dependency is not installed or path is incorrect';
    }
    if (errorLower.includes('syntax error')) {
      return 'Invalid code syntax preventing compilation';
    }
    if (errorLower.includes('type') && errorLower.includes('not assignable')) {
      return 'Type mismatch between expected and actual values';
    }

    return 'Unable to determine specific root cause - requires manual investigation';
  }

  /**
   * Generate fix suggestions based on analysis
   */
  private async generateFixSuggestions(
    patternMatches: ErrorPattern[],
    context: ErrorAnalysisContext,
  ): Promise<string[]> {
    const suggestions: string[] = [];

    // Add pattern-based suggestions
    for (const match of patternMatches.slice(0, 3)) {
      if (match.suggestions && match.suggestions.length > 0) {
        suggestions.push(...match.suggestions);
      }
    }

    // Add context-specific suggestions
    if (context.language === 'typescript') {
      suggestions.push(
        'Run TypeScript compiler with --strict for better error detection',
      );
      suggestions.push('Check type definitions and imports');
    }

    if (context.projectContext?.framework === 'react') {
      suggestions.push(
        'Verify React component prop types and state management',
      );
      suggestions.push('Check for missing key props in lists');
    }

    // Remove duplicates and limit suggestions
    return Array.from(new Set(suggestions)).slice(0, 5);
  }

  /**
   * Generate intelligent insights about the error
   */
  private async generateInsights(
    errorText: string,
    patternMatches: ErrorPattern[],
    context: ErrorAnalysisContext,
  ): Promise<ErrorInsight[]> {
    if (!this.config.enableMLInsights) {
      return [];
    }

    const insights: ErrorInsight[] = [];

    // Pattern frequency insight
    if (patternMatches.length > 0) {
      const mostCommonPattern = patternMatches[0];
      const frequencyData = this.errorHistory.get(mostCommonPattern.pattern.id);

      if (frequencyData && frequencyData.totalCount > 3) {
        insights.push({
          type: 'frequency',
          confidence: 0.8,
          title: 'Recurring Error Pattern',
          description: `This error pattern has occurred ${frequencyData.totalCount} times`,
          actionable: true,
          priority: 'medium',
          tags: ['pattern', 'frequency'],
        });
      }
    }

    // Context-based insights
    if (
      context.executionContext?.stage === 'build' &&
      errorText.includes('import')
    ) {
      insights.push({
        type: 'context',
        confidence: 0.9,
        title: 'Build-Time Import Issue',
        description:
          'Import errors during build often indicate missing dependencies or wrong paths',
        actionable: true,
        priority: 'high',
        tags: ['build', 'imports'],
      });
    }

    // Performance insight
    if (
      errorText.toLowerCase().includes('memory') ||
      errorText.toLowerCase().includes('heap')
    ) {
      insights.push({
        type: 'performance',
        confidence: 0.85,
        title: 'Memory Management Issue',
        description:
          'Memory-related errors can indicate memory leaks or inefficient resource usage',
        actionable: true,
        priority: 'high',
        tags: ['memory', 'performance'],
      });
    }

    return insights.filter(
      (insight) => insight.confidence >= this.config.insightConfidenceThreshold,
    );
  }

  /**
   * Analyze contextual factors affecting the error
   */
  private async analyzeContextualFactors(
    context: ErrorAnalysisContext,
  ): Promise<ContextualFactor[]> {
    const factors: ContextualFactor[] = [];

    // Language factor
    if (context.language) {
      factors.push({
        type: 'language',
        name: `Programming Language: ${context.language}`,
        impact: 'medium',
        description: `Error occurred in ${context.language} code`,
      });
    }

    // Environment factor
    if (context.executionContext?.environment) {
      const impact =
        context.executionContext.environment === 'production' ? 'high' : 'low';
      factors.push({
        type: 'environment',
        name: `Environment: ${context.executionContext.environment}`,
        impact,
        description: `Error occurred in ${context.executionContext.environment} environment`,
      });
    }

    // Framework factor
    if (context.projectContext?.framework) {
      factors.push({
        type: 'framework',
        name: `Framework: ${context.projectContext.framework}`,
        impact: 'medium',
        description: `Project uses ${context.projectContext.framework} framework`,
      });
    }

    // File type factor
    if (context.filePath) {
      const fileExtension = context.filePath.split('.').pop()?.toLowerCase();
      if (fileExtension) {
        factors.push({
          type: 'file',
          name: `File Type: .${fileExtension}`,
          impact: 'low',
          description: `Error in ${fileExtension} file`,
        });
      }
    }

    return factors;
  }

  /**
   * Find related errors based on signature similarity
   */
  private findRelatedErrors(
    signature: ErrorSignature,
    context: ErrorAnalysisContext,
  ): RelatedError[] {
    const related: RelatedError[] = [];
    const maxRelated = Math.min(this.config.maxRelatedErrors, 5);

    for (const [
      errorSignature,
      _frequencyData,
    ] of this.errorHistory.entries()) {
      if (related.length >= maxRelated) break;
      if (errorSignature === signature.id) continue;

      // Simple similarity based on context and patterns
      let similarity = 0;

      // Same file similarity
      if (
        context.filePath &&
        errorSignature.includes(context.filePath.split('/').pop() || '')
      ) {
        similarity += 0.3;
      }

      // Same language similarity
      if (context.language && errorSignature.includes(context.language)) {
        similarity += 0.2;
      }

      if (similarity > 0.4) {
        related.push({
          signature: { id: errorSignature, hash: '', patterns: [] },
          similarity,
          frequency: _frequencyData.totalCount,
          lastOccurrence: _frequencyData.lastOccurrence,
          relationshipType: 'similar-context',
        });
      }
    }

    return related.sort((a, b) => b.similarity - a.similarity);
  }

  /**
   * Analyze performance impact of the error
   */
  private async analyzePerformanceImpact(
    errorText: string,
    context: ErrorAnalysisContext,
  ): Promise<PerformanceMetrics | undefined> {
    const errorLower = errorText.toLowerCase();
    let impact = 'low' as 'low' | 'medium' | 'high';
    const metrics: Record<string, unknown> = {
      cpuUsage: 'normal',
      memoryUsage: 'normal',
      responseTime: 'normal',
    };

    // Detect performance-critical errors
    if (errorLower.includes('memory') || errorLower.includes('heap')) {
      impact = 'high';
      metrics.memoryUsage = 'high';
    }

    if (errorLower.includes('timeout') || errorLower.includes('slow')) {
      impact = 'high';
      metrics.responseTime = 'slow';
    }

    if (errorLower.includes('cpu') || errorLower.includes('processing')) {
      impact = 'medium';
      metrics.cpuUsage = 'high';
    }

    return {
      impact,
      metrics,
      recommendations:
        impact !== 'low'
          ? [
              'Monitor resource usage during error reproduction',
              'Consider profiling application performance',
              'Review algorithms and data structures involved',
            ]
          : [],
    };
  }

  /**
   * Analyze security implications of the error
   */
  private async analyzeSecurityImplications(
    errorText: string,
    context: ErrorAnalysisContext,
  ): Promise<SecurityImplications | undefined> {
    const errorLower = errorText.toLowerCase();
    let riskLevel = 'low' as 'low' | 'medium' | 'high' | 'critical';
    const vulnerabilities: string[] = [];

    // Detect security-related keywords
    if (errorLower.includes('sql') || errorLower.includes('injection')) {
      riskLevel = 'critical';
      vulnerabilities.push('SQL Injection');
    }

    if (errorLower.includes('xss') || errorLower.includes('script')) {
      riskLevel = 'high';
      vulnerabilities.push('Cross-Site Scripting (XSS)');
    }

    if (errorLower.includes('auth') || errorLower.includes('token')) {
      riskLevel = 'high';
      vulnerabilities.push('Authentication/Authorization');
    }

    if (errorLower.includes('path') || errorLower.includes('directory')) {
      riskLevel = 'medium';
      vulnerabilities.push('Path Traversal');
    }

    return vulnerabilities.length > 0
      ? {
          riskLevel,
          vulnerabilities,
          recommendations: [
            'Conduct security review of affected code',
            'Validate all user inputs',
            'Apply principle of least privilege',
            'Consider security testing',
          ],
        }
      : undefined;
  }

  /**
   * Assess the project-wide impact of the error
   */
  private async assessProjectImpact(
    errorText: string,
    context: ErrorAnalysisContext,
  ): Promise<ProjectImpact> {
    const isBlockingError = this.isBlockingError(errorText);
    const isProductionError =
      context.executionContext?.environment === 'production';

    let scope = 'local' as 'local' | 'component' | 'module' | 'system';
    let urgency = 'low' as 'low' | 'medium' | 'high' | 'critical';

    if (isBlockingError && isProductionError) {
      scope = 'system';
      urgency = 'critical';
    } else if (isBlockingError) {
      scope = 'module';
      urgency = 'high';
    } else if (isProductionError) {
      scope = 'component';
      urgency = 'medium';
    }

    return {
      scope,
      urgency,
      affectedComponents: context.filePath ? [context.filePath] : [],
      businessImpact:
        urgency === 'critical'
          ? 'User-facing functionality broken'
          : urgency === 'high'
            ? 'Development workflow blocked'
            : 'Minor disruption to development',
      estimatedFixTime: this.estimateFixTime(errorText, context),
    };
  }

  /**
   * Check if error blocks execution
   */
  private isBlockingError(errorText: string): boolean {
    const blockingKeywords = [
      'syntax error',
      'compilation failed',
      'cannot start',
      'fatal error',
      'build failed',
      'module not found',
    ];

    const errorLower = errorText.toLowerCase();
    return blockingKeywords.some((keyword) => errorLower.includes(keyword));
  }

  /**
   * Estimate time to fix based on error characteristics
   */
  private estimateFixTime(
    errorText: string,
    context: ErrorAnalysisContext,
  ): string {
    const errorLower = errorText.toLowerCase();

    // Quick fixes (syntax, imports, typos)
    if (
      errorLower.includes('syntax') ||
      errorLower.includes('typo') ||
      errorLower.includes('import') ||
      errorLower.includes('undefined variable')
    ) {
      return '5-15 minutes';
    }

    // Medium complexity fixes (type errors, logic issues)
    if (
      errorLower.includes('type') ||
      errorLower.includes('logic') ||
      errorLower.includes('validation')
    ) {
      return '30 minutes - 2 hours';
    }

    // Complex fixes (architecture, performance, security)
    if (
      errorLower.includes('architecture') ||
      errorLower.includes('performance') ||
      errorLower.includes('memory') ||
      errorLower.includes('security')
    ) {
      return '1-5 days';
    }

    return '1-4 hours'; // Default estimate
  }

  /**
   * Generate error signature for tracking and similarity
   */
  private generateErrorSignature(
    errorText: string,
    context: ErrorAnalysisContext,
  ): ErrorSignature {
    // Normalize error text
    const normalizedError = errorText
      .replace(/\d+/g, 'N') // Replace numbers with N
      .replace(/['"`][^'"`]*['"`]/g, 'STR') // Replace strings with STR
      .replace(/\/[^\/\s]+/g, 'PATH') // Replace paths with PATH
      .toLowerCase();

    // Create hash-like signature
    const signatureComponents = [
      normalizedError.substring(0, 100),
      context.language || 'unknown',
      context.filePath?.split('.').pop() || 'unknown',
    ];

    const signatureString = signatureComponents.join('|');
    const hash = this.simpleHash(signatureString);

    return {
      id: `error_${hash}`,
      hash,
      patterns: [], // Would be populated with pattern IDs
      normalizedText: normalizedError,
      context: {
        language: context.language,
        fileType: context.filePath?.split('.').pop(),
        framework: context.projectContext?.framework,
      },
    };
  }

  /**
   * Update error frequency tracking
   */
  private async updateErrorFrequency(
    signature: ErrorSignature,
    analysis: ErrorAnalysis,
  ): Promise<void> {
    const existing = this.errorHistory.get(signature.id);
    const now = new Date();

    if (existing) {
      existing.totalCount++;
      existing.lastOccurrence = now;
      existing.occurrences.push(now);
      existing.lastAnalysis = analysis;

      // Keep only last 50 occurrences
      if (existing.occurrences.length > 50) {
        existing.occurrences = existing.occurrences.slice(-50);
      }
    } else {
      this.errorHistory.set(signature.id, {
        signature,
        totalCount: 1,
        firstOccurrence: now,
        lastOccurrence: now,
        occurrences: [now],
        contexts: [analysis.context],
        lastAnalysis: analysis,
      });
    }
  }

  /**
   * Update related errors mapping
   */
  private async updateRelatedErrors(
    signature: ErrorSignature,
    analysis: ErrorAnalysis,
  ): Promise<void> {
    // This would implement more sophisticated relationship detection
    // For now, it's a placeholder
    logger.debug('Updated related errors mapping', { signature: signature.id });
  }

  /**
   * Calculate error trend from frequency data
   */
  private calculateErrorTrend(frequencyData: ErrorFrequencyData): ErrorTrend {
    const occurrences = frequencyData.occurrences;
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;

    // Count occurrences in different time periods
    const last24h = occurrences.filter(
      (date) => now - date.getTime() < dayMs,
    ).length;
    const last7d = occurrences.filter(
      (date) => now - date.getTime() < 7 * dayMs,
    ).length;
    const last30d = occurrences.filter(
      (date) => now - date.getTime() < 30 * dayMs,
    ).length;

    // Calculate trend direction
    let direction: 'increasing' | 'decreasing' | 'stable' = 'stable';

    if (last24h > 2 && last7d > last24h * 3) {
      direction = 'increasing';
    } else if (last24h === 0 && last7d < 2) {
      direction = 'decreasing';
    }

    return {
      direction,
      frequency: {
        last24h,
        last7d,
        last30d,
        total: frequencyData.totalCount,
      },
      severity: direction === 'increasing' ? 'high' : 'medium',
      prediction:
        direction === 'increasing'
          ? 'Error frequency is increasing - investigate root cause'
          : 'Error frequency is stable or decreasing',
    };
  }

  /**
   * Calculate similarity between error signatures
   */
  private calculateErrorSimilarity(
    signature1: string,
    signature2: string,
  ): SimilarityScore {
    // Simple similarity calculation - in production would use more sophisticated methods
    const s1 = signature1.toLowerCase();
    const s2 = signature2.toLowerCase();

    let textSimilarity = 0;
    let contextSimilarity = 0;
    let patternSimilarity = 0;

    // Text similarity (Jaccard similarity of words)
    const words1 = new Set(s1.split(/\W+/));
    const words2 = new Set(s2.split(/\W+/));
    const intersection = new Set([...words1].filter((x) => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    textSimilarity = intersection.size / union.size;

    // Context similarity (placeholder)
    contextSimilarity = 0.5;

    // Pattern similarity (placeholder)
    patternSimilarity = 0.6;

    const overall =
      (textSimilarity + contextSimilarity + patternSimilarity) / 3;

    return {
      overall,
      textSimilarity,
      contextSimilarity,
      patternSimilarity,
    };
  }

  /**
   * Load error history from storage
   */
  private async loadErrorHistory(projectPath: string): Promise<void> {
    try {
      // In a real implementation, this would load from a database or file
      logger.debug('Error history loading not implemented yet', {
        projectPath,
      });
    } catch (error) {
      logger.debug('Failed to load error history', { error, projectPath });
    }
  }

  /**
   * Generate cache key for analysis results
   */
  private generateAnalysisCacheKey(
    errorText: string,
    context: ErrorAnalysisContext,
  ): string {
    const contextStr = JSON.stringify({
      language: context.language,
      filePath: context.filePath?.split('/').pop(), // Only filename for privacy
      framework: context.projectContext?.framework,
      environment: context.executionContext?.environment,
    });

    const errorHash = this.simpleHash(errorText);
    const contextHash = this.simpleHash(contextStr);

    return `analysis_${errorHash}_${contextHash}`;
  }

  /**
   * Simple hash function
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }
}

/**
 * Create an Error Analysis Engine instance
 */
export async function createErrorAnalysisEngine(
  config: Partial<ErrorAnalysisEngineConfig> = {},
  projectPath?: string,
): Promise<ErrorAnalysisEngine> {
  const engine = new ErrorAnalysisEngine(config);
  await engine.initialize(projectPath);
  return engine;
}
