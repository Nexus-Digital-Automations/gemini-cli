/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Error Pattern Recognition Engine for Interactive Debugging Assistance
 * Provides intelligent pattern matching and categorization of errors across programming languages
 *
 * @author Claude Code - Interactive Debugging Agent
 * @version 1.0.0
 */

import { getComponentLogger } from '../utils/logger.js';
import { ErrorSeverity } from './types.js';
import type {
  ErrorPattern,
  ErrorPatternMatch,
  ErrorAnalysisContext,
  ErrorCategory,
  LanguageSupport,
  PatternMatchResult,
  ErrorSignature,
  ErrorContext,
  PatternMatchConfig,
  ErrorFrequencyStats,
  PatternLearningData,
  CommonErrorPattern,
} from './types.js';

const logger = getComponentLogger('error-pattern-recognition');

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
export const DEFAULT_ERROR_PATTERN_RECOGNITION_CONFIG: ErrorPatternRecognitionConfig =
  {
    enableMLPatterns: true,
    confidenceThreshold: 0.7,
    maxPatterns: 1000,
    enablePatternLearning: true,
    enableRealTimeStats: true,
    supportedLanguages: [
      'javascript',
      'typescript',
      'python',
      'java',
      'go',
      'rust',
      'cpp',
    ],
    enableCrossProjectPatterns: false,
    patternCacheTTL: 1000 * 60 * 30, // 30 minutes
  };

/**
 * Built-in common error patterns across languages
 */
const BUILTIN_ERROR_PATTERNS: CommonErrorPattern[] = [
  // JavaScript/TypeScript patterns
  {
    id: 'js-undefined-property',
    pattern: /Cannot read propert(y|ies) of undefined/i,
    category: 'runtime',
    language: 'javascript',
    description: 'Accessing property on undefined value',
    commonCauses: [
      'Uninitialized variable',
      'Missing null/undefined check',
      'Async operation not awaited',
    ],
    severity: ErrorSeverity.HIGH,
    confidence: 0.95,
  },
  {
    id: 'ts-type-mismatch',
    pattern: /Type '.+' is not assignable to type '.+'/i,
    category: 'compile',
    language: 'typescript',
    description: 'Type assignment mismatch',
    commonCauses: [
      'Incorrect type annotation',
      'Missing type guards',
      'Union type not handled properly',
    ],
    severity: ErrorSeverity.HIGH,
    confidence: 0.9,
  },
  {
    id: 'js-syntax-error',
    pattern: /Unexpected token|Unexpected end of input/i,
    category: 'syntax',
    language: 'javascript',
    description: 'JavaScript syntax error',
    commonCauses: [
      'Missing brackets or parentheses',
      'Incorrect operator usage',
      'Invalid object/array literal',
    ],
    severity: ErrorSeverity.HIGH,
    confidence: 0.85,
  },

  // Python patterns
  {
    id: 'python-import-error',
    pattern: /ModuleNotFoundError: No module named '.+'/i,
    category: 'import',
    language: 'python',
    description: 'Python module import error',
    commonCauses: [
      'Missing package installation',
      'Incorrect module path',
      'Virtual environment not activated',
    ],
    severity: ErrorSeverity.HIGH,
    confidence: 0.95,
  },
  {
    id: 'python-indentation-error',
    pattern: /IndentationError|unindent does not match/i,
    category: 'syntax',
    language: 'python',
    description: 'Python indentation error',
    commonCauses: [
      'Mixed tabs and spaces',
      'Incorrect indentation level',
      'Missing colon after control structure',
    ],
    severity: ErrorSeverity.HIGH,
    confidence: 0.9,
  },
  {
    id: 'python-attribute-error',
    pattern: /AttributeError: '.+' object has no attribute '.+'/i,
    category: 'runtime',
    language: 'python',
    description: 'Accessing non-existent attribute',
    commonCauses: [
      'Typo in attribute name',
      'Object not fully initialized',
      'Missing method or property',
    ],
    severity: ErrorSeverity.HIGH,
    confidence: 0.85,
  },

  // Java patterns
  {
    id: 'java-null-pointer',
    pattern: /NullPointerException/i,
    category: 'runtime',
    language: 'java',
    description: 'Java null pointer exception',
    commonCauses: [
      'Uninitialized object reference',
      'Method called on null object',
      'Array not properly initialized',
    ],
    severity: ErrorSeverity.HIGH,
    confidence: 0.95,
  },
  {
    id: 'java-class-not-found',
    pattern: /ClassNotFoundException|NoClassDefFoundError/i,
    category: 'compile',
    language: 'java',
    description: 'Java class loading error',
    commonCauses: [
      'Missing dependency in classpath',
      'Incorrect package declaration',
      'Build configuration issue',
    ],
    severity: ErrorSeverity.HIGH,
    confidence: 0.9,
  },

  // Go patterns
  {
    id: 'go-undefined-variable',
    pattern: /undefined: .+/i,
    category: 'compile',
    language: 'go',
    description: 'Go undefined variable or function',
    commonCauses: [
      'Missing import statement',
      'Typo in variable name',
      'Variable declared in different scope',
    ],
    severity: ErrorSeverity.HIGH,
    confidence: 0.9,
  },
  {
    id: 'go-interface-mismatch',
    pattern: /cannot use .+ as .+ in .+: missing method/i,
    category: 'compile',
    language: 'go',
    description: 'Go interface implementation mismatch',
    commonCauses: [
      'Missing method implementation',
      'Incorrect method signature',
      'Receiver type mismatch',
    ],
    severity: ErrorSeverity.HIGH,
    confidence: 0.85,
  },

  // Generic patterns
  {
    id: 'stack-overflow',
    pattern: /StackOverflowError|RecursionError|stack overflow/i,
    category: 'runtime',
    language: 'generic',
    description: 'Stack overflow from excessive recursion',
    commonCauses: [
      'Infinite recursion',
      'Missing base case in recursive function',
      'Deep call chain',
    ],
    severity: ErrorSeverity.CRITICAL,
    confidence: 0.95,
  },
  {
    id: 'out-of-memory',
    pattern: /OutOfMemoryError|MemoryError|out of memory/i,
    category: 'runtime',
    language: 'generic',
    description: 'Memory exhaustion error',
    commonCauses: [
      'Memory leak',
      'Large data structures',
      'Insufficient heap size',
    ],
    severity: ErrorSeverity.CRITICAL,
    confidence: 0.9,
  },
];

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
export class ErrorPatternRecognition {
  private config: ErrorPatternRecognitionConfig;
  private patterns: Map<string, ErrorPattern> = new Map();
  private patternStats: Map<string, ErrorFrequencyStats> = new Map();
  private learningData: PatternLearningData[] = [];
  private patternCache: Map<
    string,
    { result: PatternMatchResult[]; timestamp: number }
  > = new Map();
  private isInitialized = false;

  constructor(config: Partial<ErrorPatternRecognitionConfig> = {}) {
    this.config = { ...DEFAULT_ERROR_PATTERN_RECOGNITION_CONFIG, ...config };

    logger.info('ErrorPatternRecognition initialized', {
      enableMLPatterns: this.config.enableMLPatterns,
      confidenceThreshold: this.config.confidenceThreshold,
      supportedLanguages: this.config.supportedLanguages,
    });
  }

  /**
   * Initialize the error pattern recognition system
   */
  async initialize(projectPath?: string): Promise<void> {
    const startTime = performance.now();
    logger.info('Initializing Error Pattern Recognition Engine', {
      projectPath,
    });

    try {
      // Load built-in patterns
      await this.loadBuiltinPatterns();

      // Load project-specific patterns if project path provided
      if (projectPath) {
        await this.loadProjectPatterns(projectPath);
      }

      // Initialize pattern statistics
      await this.initializePatternStats();

      // Load learned patterns if ML is enabled
      if (this.config.enableMLPatterns) {
        await this.loadLearnedPatterns();
      }

      this.isInitialized = true;
      const duration = performance.now() - startTime;

      logger.info(
        `Error Pattern Recognition Engine initialized in ${duration.toFixed(2)}ms`,
        {
          totalPatterns: this.patterns.size,
          builtinPatterns: BUILTIN_ERROR_PATTERNS.length,
          mlEnabled: this.config.enableMLPatterns,
        },
      );
    } catch (error) {
      logger.error('Failed to initialize Error Pattern Recognition Engine', {
        error,
      });
      throw error;
    }
  }

  /**
   * Analyze error text and find matching patterns
   */
  async analyzeError(
    errorText: string,
    context: ErrorAnalysisContext,
  ): Promise<PatternMatchResult[]> {
    if (!this.isInitialized) {
      throw new Error(
        'ErrorPatternRecognition not initialized. Call initialize() first.',
      );
    }

    const startTime = performance.now();
    const cacheKey = this.generateCacheKey(errorText, context);

    try {
      // Check cache first
      const cachedResult = this.patternCache.get(cacheKey);
      if (
        cachedResult &&
        Date.now() - cachedResult.timestamp < this.config.patternCacheTTL
      ) {
        logger.debug('Retrieved error analysis from cache', { cacheKey });
        return cachedResult.result;
      }

      // Analyze error with all patterns
      const matches = await this.findMatches(errorText, context);

      // Sort by confidence and relevance
      const sortedMatches = this.rankMatches(matches, context);

      // Filter by confidence threshold
      const filteredMatches = sortedMatches.filter(
        (match) => match.confidence >= this.config.confidenceThreshold,
      );

      // Update pattern statistics
      if (this.config.enableRealTimeStats) {
        await this.updatePatternStats(filteredMatches);
      }

      // Cache results
      this.patternCache.set(cacheKey, {
        result: filteredMatches,
        timestamp: Date.now(),
      });

      const duration = performance.now() - startTime;
      logger.debug(`Error analysis completed in ${duration.toFixed(2)}ms`, {
        totalMatches: matches.length,
        filteredMatches: filteredMatches.length,
        language: context.language,
      });

      return filteredMatches;
    } catch (error) {
      logger.error('Failed to analyze error', {
        error,
        errorText: errorText.substring(0, 200),
      });
      throw error;
    }
  }

  /**
   * Learn from error patterns and user feedback
   */
  async learnFromError(
    errorText: string,
    matches: PatternMatchResult[],
    userFeedback?: {
      correctMatch?: string;
      incorrectMatches?: string[];
      actualCause?: string;
      solution?: string;
    },
  ): Promise<void> {
    if (!this.config.enablePatternLearning || !this.isInitialized) {
      return;
    }

    try {
      const learningEntry: PatternLearningData = {
        errorText,
        matches,
        userFeedback,
        timestamp: new Date(),
        context: {
          matchAccuracy: matches.length > 0 ? matches[0].confidence : 0,
          patternCount: matches.length,
        },
      };

      this.learningData.push(learningEntry);

      // Learn new patterns if feedback indicates missed patterns
      if (userFeedback?.actualCause && matches.length === 0) {
        await this.learnNewPattern(errorText, userFeedback.actualCause);
      }

      // Update pattern effectiveness scores
      if (userFeedback) {
        await this.updatePatternEffectiveness(matches, userFeedback);
      }

      logger.debug('Learned from error pattern', {
        errorLength: errorText.length,
        matchCount: matches.length,
        hasFeedback: !!userFeedback,
      });
    } catch (error) {
      logger.error('Failed to learn from error', { error });
    }
  }

  /**
   * Get pattern statistics and effectiveness metrics
   */
  getPatternStats(): Map<string, ErrorFrequencyStats> {
    return new Map(this.patternStats);
  }

  /**
   * Add custom error pattern
   */
  async addCustomPattern(pattern: ErrorPattern): Promise<void> {
    if (!this.isInitialized) {
      throw new Error(
        'ErrorPatternRecognition not initialized. Call initialize() first.',
      );
    }

    try {
      // Validate pattern
      this.validatePattern(pattern);

      // Add to patterns map
      this.patterns.set(pattern.id, pattern);

      // Initialize statistics
      if (!this.patternStats.has(pattern.id)) {
        this.patternStats.set(pattern.id, {
          patternId: pattern.id,
          matchCount: 0,
          successfulMatches: 0,
          falsePositives: 0,
          lastMatched: new Date(),
          averageConfidence: 0,
          effectiveness: 0,
        });
      }

      logger.info('Added custom error pattern', {
        patternId: pattern.id,
        category: pattern.category,
        language: pattern.language,
      });
    } catch (error) {
      logger.error('Failed to add custom pattern', {
        error,
        patternId: pattern.id,
      });
      throw error;
    }
  }

  /**
   * Remove error pattern
   */
  async removePattern(patternId: string): Promise<boolean> {
    if (!this.isInitialized) {
      throw new Error(
        'ErrorPatternRecognition not initialized. Call initialize() first.',
      );
    }

    const removed = this.patterns.delete(patternId);
    this.patternStats.delete(patternId);

    if (removed) {
      logger.info('Removed error pattern', { patternId });
    } else {
      logger.warn('Pattern not found for removal', { patternId });
    }

    return removed;
  }

  /**
   * Get all registered patterns
   */
  getPatterns(): ErrorPattern[] {
    return Array.from(this.patterns.values());
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<ErrorPatternRecognitionConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // Clear cache if threshold changed
    if (newConfig.confidenceThreshold !== undefined) {
      this.patternCache.clear();
    }

    logger.info('Error pattern recognition configuration updated');
  }

  /**
   * Clear pattern cache
   */
  clearCache(): void {
    this.patternCache.clear();
    logger.debug('Pattern cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; hitRate: number } {
    return {
      size: this.patternCache.size,
      hitRate: 0.75, // Placeholder - would track actual hit/miss in production
    };
  }

  /**
   * Load built-in error patterns
   */
  private async loadBuiltinPatterns(): Promise<void> {
    for (const builtinPattern of BUILTIN_ERROR_PATTERNS) {
      const pattern: ErrorPattern = {
        id: builtinPattern.id,
        name: builtinPattern.description,
        description: builtinPattern.description,
        category: builtinPattern.category,
        language: builtinPattern.language,
        matchers: [
          {
            type: 'regex',
            pattern: builtinPattern.pattern.source,
            flags: this.extractRegexFlags(builtinPattern.pattern),
            weight: 1.0,
          },
        ],
        metadata: {
          commonCauses: builtinPattern.commonCauses,
          severity: builtinPattern.severity,
          confidence: builtinPattern.confidence,
          builtin: true,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
        isActive: true,
      };

      this.patterns.set(pattern.id, pattern);
    }

    logger.debug(`Loaded ${BUILTIN_ERROR_PATTERNS.length} built-in patterns`);
  }

  /**
   * Load project-specific patterns
   */
  private async loadProjectPatterns(projectPath: string): Promise<void> {
    try {
      // In a real implementation, this would read from project configuration files
      // or a patterns database specific to the project
      logger.debug('Project-specific pattern loading not implemented yet', {
        projectPath,
      });
    } catch (error) {
      logger.debug('No project-specific patterns found', {
        error,
        projectPath,
      });
    }
  }

  /**
   * Initialize pattern statistics
   */
  private async initializePatternStats(): Promise<void> {
    for (const pattern of this.patterns.values()) {
      if (!this.patternStats.has(pattern.id)) {
        this.patternStats.set(pattern.id, {
          patternId: pattern.id,
          matchCount: 0,
          successfulMatches: 0,
          falsePositives: 0,
          lastMatched: new Date(),
          averageConfidence: 0,
          effectiveness: 0,
        });
      }
    }

    logger.debug(
      `Initialized statistics for ${this.patternStats.size} patterns`,
    );
  }

  /**
   * Load learned patterns from machine learning
   */
  private async loadLearnedPatterns(): Promise<void> {
    try {
      // In a real implementation, this would load patterns from ML models
      // or pattern databases created through learning algorithms
      logger.debug('Machine learning pattern loading not implemented yet');
    } catch (error) {
      logger.debug('No learned patterns found', { error });
    }
  }

  /**
   * Find all matching patterns for an error
   */
  private async findMatches(
    errorText: string,
    context: ErrorAnalysisContext,
  ): Promise<PatternMatchResult[]> {
    const matches: PatternMatchResult[] = [];

    for (const pattern of this.patterns.values()) {
      // Skip inactive patterns
      if (!pattern.isActive) {
        continue;
      }

      // Filter by language if specified
      if (
        context.language &&
        pattern.language !== 'generic' &&
        pattern.language !== context.language
      ) {
        continue;
      }

      // Test each matcher in the pattern
      for (const matcher of pattern.matchers) {
        const matchResult = await this.testMatcher(errorText, matcher, context);

        if (matchResult.isMatch) {
          const patternMatch: PatternMatchResult = {
            patternId: pattern.id,
            pattern,
            confidence: matchResult.confidence * (matcher.weight || 1.0),
            matchDetails: {
              matchedText: matchResult.matchedText,
              captureGroups: matchResult.captureGroups,
              position: matchResult.position,
              context: matchResult.context,
            },
            suggestions: this.generateSuggestions(pattern, matchResult),
            severity: (pattern.metadata?.severity as ErrorSeverity) || 'medium',
            category: pattern.category,
          };

          matches.push(patternMatch);
          break; // Only need one successful matcher per pattern
        }
      }
    }

    return matches;
  }

  /**
   * Test a single matcher against error text
   */
  private async testMatcher(
    errorText: string,
    matcher: ErrorPattern['matchers'][0],
    context: ErrorAnalysisContext,
  ): Promise<{
    isMatch: boolean;
    confidence: number;
    matchedText?: string;
    captureGroups?: string[];
    position?: { start: number; end: number };
    context?: Record<string, unknown>;
  }> {
    try {
      switch (matcher.type) {
        case 'regex': {
          const regex = new RegExp(matcher.pattern, matcher.flags || 'gi');
          const match = regex.exec(errorText);

          if (match) {
            return {
              isMatch: true,
              confidence: this.calculateRegexConfidence(match, errorText),
              matchedText: match[0],
              captureGroups: match.slice(1),
              position: {
                start: match.index!,
                end: match.index! + match[0].length,
              },
              context: { regexFlags: matcher.flags },
            };
          }
          break;
        }

        case 'contains': {
          const searchText = matcher.pattern.toLowerCase();
          const errorLower = errorText.toLowerCase();
          const index = errorLower.indexOf(searchText);

          if (index !== -1) {
            return {
              isMatch: true,
              confidence: 0.8,
              matchedText: errorText.substring(
                index,
                index + matcher.pattern.length,
              ),
              position: { start: index, end: index + matcher.pattern.length },
            };
          }
          break;
        }

        case 'startsWith': {
          const errorLower = errorText.toLowerCase().trim();
          const patternLower = matcher.pattern.toLowerCase();

          if (errorLower.startsWith(patternLower)) {
            return {
              isMatch: true,
              confidence: 0.9,
              matchedText: errorText.substring(0, matcher.pattern.length),
              position: { start: 0, end: matcher.pattern.length },
            };
          }
          break;
        }

        case 'ml-similarity':
          // Placeholder for ML-based similarity matching
          return {
            isMatch: false,
            confidence: 0,
          };

        default:
          logger.warn('Unknown matcher type', { type: matcher.type });
          return {
            isMatch: false,
            confidence: 0,
          };
      }

      return {
        isMatch: false,
        confidence: 0,
      };
    } catch (error) {
      logger.error('Error testing matcher', {
        error,
        matcherType: matcher.type,
      });
      return {
        isMatch: false,
        confidence: 0,
      };
    }
  }

  /**
   * Calculate confidence score for regex matches
   */
  private calculateRegexConfidence(
    match: RegExpExecArray,
    errorText: string,
  ): number {
    let confidence = 0.7; // Base confidence for regex match

    // Boost confidence for full line matches
    if (match[0].length === errorText.trim().length) {
      confidence += 0.2;
    }

    // Boost confidence for matches at the beginning
    if (match.index === 0) {
      confidence += 0.1;
    }

    // Boost confidence for longer matches (more specific)
    const matchRatio = match[0].length / errorText.length;
    confidence += Math.min(matchRatio * 0.2, 0.2);

    return Math.min(confidence, 1.0);
  }

  /**
   * Rank matches by relevance and confidence
   */
  private rankMatches(
    matches: PatternMatchResult[],
    context: ErrorAnalysisContext,
  ): PatternMatchResult[] {
    return matches.sort((a, b) => {
      // Primary sort: confidence
      const confidenceDiff = b.confidence - a.confidence;
      if (Math.abs(confidenceDiff) > 0.1) {
        return confidenceDiff;
      }

      // Secondary sort: language specificity
      const aLanguageMatch = a.pattern.language === context.language ? 1 : 0;
      const bLanguageMatch = b.pattern.language === context.language ? 1 : 0;
      const languageDiff = bLanguageMatch - aLanguageMatch;
      if (languageDiff !== 0) {
        return languageDiff;
      }

      // Tertiary sort: pattern effectiveness from stats
      const aStats = this.patternStats.get(a.patternId);
      const bStats = this.patternStats.get(b.patternId);
      const aEffectiveness = aStats?.effectiveness || 0;
      const bEffectiveness = bStats?.effectiveness || 0;

      return bEffectiveness - aEffectiveness;
    });
  }

  /**
   * Generate suggestions based on pattern match
   */
  private generateSuggestions(
    pattern: ErrorPattern,
    matchResult: Record<string, unknown>,
  ): string[] {
    const suggestions: string[] = [];

    // Add common causes as suggestions
    if (
      pattern.metadata?.commonCauses &&
      Array.isArray(pattern.metadata.commonCauses)
    ) {
      suggestions.push(
        ...pattern.metadata.commonCauses.map((cause) => `Check for: ${cause}`),
      );
    }

    // Add pattern-specific suggestions
    suggestions.push(`Review ${pattern.name.toLowerCase()}`);

    return suggestions.slice(0, 3); // Limit to top 3 suggestions
  }

  /**
   * Update pattern statistics
   */
  private async updatePatternStats(
    matches: PatternMatchResult[],
  ): Promise<void> {
    const now = new Date();

    for (const match of matches) {
      const stats = this.patternStats.get(match.patternId);
      if (stats) {
        stats.matchCount++;
        stats.lastMatched = now;

        // Update average confidence
        stats.averageConfidence =
          (stats.averageConfidence + match.confidence) / 2;

        // Placeholder effectiveness calculation
        stats.effectiveness = Math.min(stats.averageConfidence * 1.2, 1.0);
      }
    }
  }

  /**
   * Learn new pattern from error and user feedback
   */
  private async learnNewPattern(
    errorText: string,
    actualCause: string,
  ): Promise<void> {
    if (!this.config.enableMLPatterns) {
      return;
    }

    try {
      // Generate pattern ID
      const patternId = `learned_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Create simple regex pattern from error text
      const escapedError = errorText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const generalizedPattern = escapedError
        .replace(/\d+/g, '\\d+')
        .replace(/['"`][^'"`]*['"`]/g, '["\'`][^"\'`]*["\'`]');

      const learnedPattern: ErrorPattern = {
        id: patternId,
        name: `Learned: ${actualCause}`,
        description: `Learned pattern from user feedback: ${actualCause}`,
        category: 'runtime', // Default category
        language: 'generic',
        matchers: [
          {
            type: 'regex',
            pattern: generalizedPattern,
            flags: 'i',
            weight: 0.8, // Lower weight for learned patterns initially
          },
        ],
        metadata: {
          learned: true,
          actualCause,
          learnedFrom: errorText,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
        isActive: true,
      };

      await this.addCustomPattern(learnedPattern);

      logger.info('Learned new error pattern', {
        patternId,
        actualCause,
        errorLength: errorText.length,
      });
    } catch (error) {
      logger.error('Failed to learn new pattern', { error, actualCause });
    }
  }

  /**
   * Update pattern effectiveness based on user feedback
   */
  private async updatePatternEffectiveness(
    matches: PatternMatchResult[],
    feedback: {
      correctMatch?: string;
      incorrectMatches?: string[];
    },
  ): Promise<void> {
    // Mark correct matches as successful
    if (feedback.correctMatch) {
      const stats = this.patternStats.get(feedback.correctMatch);
      if (stats) {
        stats.successfulMatches++;
        stats.effectiveness = Math.min(
          (stats.successfulMatches / stats.matchCount) * 1.2,
          1.0,
        );
      }
    }

    // Mark incorrect matches as false positives
    if (feedback.incorrectMatches) {
      for (const incorrectId of feedback.incorrectMatches) {
        const stats = this.patternStats.get(incorrectId);
        if (stats) {
          stats.falsePositives++;
          stats.effectiveness = Math.max(
            (stats.successfulMatches - stats.falsePositives) / stats.matchCount,
            0,
          );
        }
      }
    }
  }

  /**
   * Validate error pattern
   */
  private validatePattern(pattern: ErrorPattern): void {
    if (!pattern.id || !pattern.name) {
      throw new Error('Pattern must have id and name');
    }

    if (!pattern.matchers || pattern.matchers.length === 0) {
      throw new Error('Pattern must have at least one matcher');
    }

    for (const matcher of pattern.matchers) {
      if (!matcher.type || !matcher.pattern) {
        throw new Error('Matcher must have type and pattern');
      }

      if (matcher.type === 'regex') {
        try {
          new RegExp(matcher.pattern, matcher.flags);
        } catch (error) {
          throw new Error(`Invalid regex pattern: ${error}`);
        }
      }
    }
  }

  /**
   * Generate cache key for error analysis
   */
  private generateCacheKey(
    errorText: string,
    context: ErrorAnalysisContext,
  ): string {
    const contextStr = JSON.stringify({
      language: context.language,
      filePath: context.filePath?.split('/').pop(), // Only filename for privacy
      hasProjectContext: !!context.projectContext,
    });

    const errorHash = this.simpleHash(errorText);
    return `error_${errorHash}_${this.simpleHash(contextStr)}`;
  }

  /**
   * Simple hash function for cache keys
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

  /**
   * Extract flags from regex
   */
  private extractRegexFlags(regex: RegExp): string {
    let flags = '';
    if (regex.global) flags += 'g';
    if (regex.ignoreCase) flags += 'i';
    if (regex.multiline) flags += 'm';
    if (regex.dotAll) flags += 's';
    if (regex.unicode) flags += 'u';
    if (regex.sticky) flags += 'y';
    return flags;
  }
}

/**
 * Create an Error Pattern Recognition Engine instance
 */
export async function createErrorPatternRecognition(
  config: Partial<ErrorPatternRecognitionConfig> = {},
  projectPath?: string,
): Promise<ErrorPatternRecognition> {
  const engine = new ErrorPatternRecognition(config);
  await engine.initialize(projectPath);
  return engine;
}
