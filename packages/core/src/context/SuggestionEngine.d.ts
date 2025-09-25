/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  ContextItem,
  ContextSuggestion,
  ContextAnalysis,
  CodeContextSnapshot,
} from './types.js';
import type { CrossSessionStorage } from './CrossSessionStorage.js';
/**
 * Configuration for suggestion engine
 */
export interface SuggestionEngineConfig {
  /** Minimum confidence threshold for suggestions */
  minConfidenceThreshold: number;
  /** Maximum number of suggestions to return */
  maxSuggestions: number;
  /** Enable pattern learning from user interactions */
  enablePatternLearning: boolean;
  /** Weight for historical patterns in suggestions */
  historicalPatternWeight: number;
  /** Weight for current context in suggestions */
  currentContextWeight: number;
  /** Enable workflow optimization suggestions */
  enableWorkflowOptimization: boolean;
  /** Minimum pattern frequency for learning */
  minPatternFrequency: number;
  /** Cache size for suggestion patterns */
  patternCacheSize: number;
}
/**
 * Default configuration for suggestion engine
 */
export declare const DEFAULT_SUGGESTION_ENGINE_CONFIG: SuggestionEngineConfig;
/**
 * User interaction tracking
 */
export interface UserInteraction {
  /** Interaction timestamp */
  timestamp: Date;
  /** Type of interaction */
  type:
    | 'command'
    | 'code_edit'
    | 'file_open'
    | 'search'
    | 'debug'
    | 'suggestion_accepted'
    | 'suggestion_rejected';
  /** Context at time of interaction */
  context: string;
  /** Action taken by user */
  action: string;
  /** Files involved in interaction */
  files?: string[];
  /** Success/failure of interaction */
  success: boolean;
  /** Time taken for interaction */
  duration?: number;
  /** Additional metadata */
  metadata: Record<string, unknown>;
}
/**
 * Learned pattern from user behavior
 */
export interface LearnedPattern {
  /** Pattern identifier */
  id: string;
  /** Pattern description */
  description: string;
  /** Context triggers for this pattern */
  triggers: string[];
  /** Suggested action or sequence */
  suggestion: string;
  /** Confidence in pattern (0-1) */
  confidence: number;
  /** Frequency of occurrence */
  frequency: number;
  /** Last seen timestamp */
  lastSeen: Date;
  /** Success rate when suggested */
  successRate: number;
  /** User feedback on pattern */
  userFeedback: 'positive' | 'negative' | 'neutral';
}
/**
 * Workflow optimization recommendation
 */
export interface WorkflowOptimization {
  /** Optimization type */
  type:
    | 'sequence_optimization'
    | 'shortcut_suggestion'
    | 'automation_opportunity'
    | 'efficiency_improvement';
  /** Current workflow description */
  currentWorkflow: string;
  /** Optimized workflow suggestion */
  optimizedWorkflow: string;
  /** Estimated time savings */
  timeSavings: number;
  /** Effort required to implement */
  implementationEffort: 'low' | 'medium' | 'high';
  /** Supporting evidence */
  evidence: string[];
  /** Risk assessment */
  risks: string[];
}
/**
 * Context-Aware Suggestion Engine
 *
 * The SuggestionEngine leverages historical context to provide intelligent suggestions
 * and workflow optimizations. It learns from user interactions, recognizes patterns,
 * and provides contextual recommendations to improve productivity.
 *
 * Key Features:
 * - Pattern Recognition: Learns from past user interactions and behaviors
 * - Contextual Completions: Provides suggestions based on current project context
 * - Workflow Optimization: Identifies opportunities to streamline common tasks
 * - Error Prevention: Warns about potential issues based on historical context
 * - Learning from Mistakes: Remembers and helps avoid repeated errors
 *
 * @example
 * ```typescript
 * const suggestionEngine = new SuggestionEngine();
 * await suggestionEngine.trackInteraction(userInteraction);
 * const suggestions = await suggestionEngine.generateSuggestions(currentContext);
 * console.log(`Generated ${suggestions.length} suggestions`);
 * ```
 */
export declare class SuggestionEngine {
  private config;
  private prioritizer;
  private storage;
  private interactionHistory;
  private learnedPatterns;
  private suggestionCache;
  private workflowPatterns;
  constructor(
    storage: CrossSessionStorage,
    config?: Partial<SuggestionEngineConfig>,
  );
  /**
   * Initialize the suggestion engine with historical data
   */
  initialize(projectPath: string): Promise<void>;
  /**
   * Generate contextual suggestions based on current state
   */
  generateSuggestions(
    currentContext: string,
    codeContext?: CodeContextSnapshot,
    recentInteractions?: UserInteraction[],
  ): Promise<ContextSuggestion[]>;
  /**
   * Generate suggestions based on learned patterns
   */
  private generatePatternBasedSuggestions;
  /**
   * Generate code-specific suggestions
   */
  private generateCodeContextSuggestions;
  /**
   * Generate workflow optimization suggestions
   */
  private generateWorkflowSuggestions;
  /**
   * Generate error prevention suggestions
   */
  private generateErrorPreventionSuggestions;
  /**
   * Generate optimization suggestions
   */
  private generateOptimizationSuggestions;
  /**
   * Track user interaction for pattern learning
   */
  trackInteraction(interaction: UserInteraction): Promise<void>;
  /**
   * Learn patterns from successful interactions
   */
  private learnFromInteraction;
  /**
   * Extract patterns from a single interaction
   */
  private extractPatternsFromInteraction;
  /**
   * Extract patterns from historical sessions
   */
  private extractPatternsFromSessions;
  /**
   * Analyze conversation patterns from sessions
   */
  private analyzeConversationPatterns;
  /**
   * Analyze code patterns from code context
   */
  private analyzeCodePatterns;
  /**
   * Analyze workflow patterns from context items
   */
  private analyzeWorkflowPatterns;
  /**
   * Identify workflow sequences from context items
   */
  private identifyWorkflowSequences;
  /**
   * Calculate confidence for a learned pattern
   */
  private calculatePatternConfidence;
  /**
   * Generate cache key for suggestions
   */
  private generateCacheKey;
  /**
   * Simple hash function for cache keys
   */
  private simpleHash;
  /**
   * Find repeated command sequences
   */
  private findRepeatedSequences;
  /**
   * Calculate file access frequency
   */
  private calculateFileFrequency;
  /**
   * Group errors by similar patterns
   */
  private groupErrorsByPattern;
  /**
   * Clean up old or unused patterns
   */
  private cleanupOldPatterns;
  /**
   * Load learned patterns from storage
   */
  private loadLearnedPatterns;
  /**
   * Analyze context for patterns and anomalies
   */
  analyzeContext(contextItems: ContextItem[]): Promise<ContextAnalysis>;
  /**
   * Identify patterns in context items
   */
  private identifyContextPatterns;
  /**
   * Detect anomalies in context
   */
  private detectContextAnomalies;
  /**
   * Find optimization opportunities
   */
  private findContextOptimizations;
  /**
   * Calculate context usage statistics
   */
  private calculateContextStats;
  /**
   * Group context items by type
   */
  private groupItemsByType;
  /**
   * Calculate time spans between items
   */
  private calculateTimeSpans;
  /**
   * Find items with similar content
   */
  private findSimilarContent;
  /**
   * Find duplicate content items
   */
  private findDuplicateContent;
  /**
   * Calculate content similarity between two strings
   */
  private calculateContentSimilarity;
  /**
   * Provide feedback on a suggestion
   */
  provideFeedback(
    suggestionId: string,
    feedback: 'positive' | 'negative' | 'neutral',
  ): Promise<void>;
  /**
   * Get learned patterns for debugging/analysis
   */
  getLearnedPatterns(): LearnedPattern[];
  /**
   * Get interaction statistics
   */
  getInteractionStats(): {
    totalInteractions: number;
    byType: Record<string, number>;
    successRate: number;
    averageDuration: number;
  };
  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<SuggestionEngineConfig>): void;
  /**
   * Get current configuration
   */
  getConfig(): SuggestionEngineConfig;
  /**
   * Clear all caches and reset patterns
   */
  clearAllData(): void;
}
/**
 * Create a suggestion engine instance
 */
export declare function createSuggestionEngine(
  storage: CrossSessionStorage,
  config?: Partial<SuggestionEngineConfig>,
): SuggestionEngine;
