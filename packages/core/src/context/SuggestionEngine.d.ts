/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  ContextSuggestion,
  CodeContextSnapshot,
  SessionContext,
} from './types.js';
/**
 * Configuration for suggestion engine
 */
export interface SuggestionConfig {
  /** Minimum confidence threshold for suggestions */
  minConfidenceThreshold: number;
  /** Maximum suggestions to return */
  maxSuggestions: number;
  /** Enable pattern recognition learning */
  enablePatternLearning: boolean;
  /** Enable workflow optimization suggestions */
  enableWorkflowOptimization: boolean;
  /** Enable error prevention suggestions */
  enableErrorPrevention: boolean;
  /** Weight for historical context in scoring */
  historicalWeight: number;
  /** Weight for current context relevance */
  currentContextWeight: number;
  /** Weight for user interaction patterns */
  userPatternWeight: number;
}
/**
 * Default configuration for suggestion engine
 */
export declare const DEFAULT_SUGGESTION_CONFIG: SuggestionConfig;
/**
 * User interaction pattern
 */
export interface InteractionPattern {
  /** Pattern identifier */
  id: string;
  /** Pattern description */
  description: string;
  /** Commands or actions in the pattern */
  actions: string[];
  /** Frequency of occurrence */
  frequency: number;
  /** Success rate when followed */
  successRate: number;
  /** Context conditions for this pattern */
  contextConditions: string[];
  /** Last observed occurrence */
  lastObserved: Date;
}
/**
 * Workflow optimization opportunity
 */
export interface WorkflowOptimization {
  /** Optimization identifier */
  id: string;
  /** Description of the optimization */
  description: string;
  /** Current inefficient workflow */
  currentWorkflow: string[];
  /** Optimized workflow suggestion */
  optimizedWorkflow: string[];
  /** Estimated time savings */
  timeSavings: string;
  /** Confidence in the optimization */
  confidence: number;
}
/**
 * Error pattern for prevention
 */
export interface ErrorPattern {
  /** Error pattern identifier */
  id: string;
  /** Error description */
  description: string;
  /** Common causes */
  causes: string[];
  /** Context that leads to this error */
  errorContext: string[];
  /** Prevention suggestions */
  prevention: string[];
  /** Frequency of occurrence */
  frequency: number;
}
/**
 * Learning statistics
 */
export interface LearningStats {
  /** Total patterns learned */
  totalPatterns: number;
  /** Successful suggestions made */
  successfulSuggestions: number;
  /** Total suggestions made */
  totalSuggestions: number;
  /** Success rate */
  successRate: number;
  /** Active optimization opportunities */
  activeOptimizations: number;
  /** Prevented errors */
  preventedErrors: number;
}
/**
 * Context-Aware Suggestion Engine
 *
 * The SuggestionEngine leverages historical context to provide intelligent suggestions
 * for workflow optimization, error prevention, and task completion. It learns from
 * user interaction patterns and provides contextually relevant recommendations.
 *
 * Key Features:
 * - Pattern Recognition: Learns from past user interactions and workflows
 * - Contextual Completions: Provides suggestions based on current project context
 * - Workflow Optimization: Identifies and suggests more efficient task sequences
 * - Error Prevention: Warns about potential issues based on historical context
 * - Adaptive Learning: Continuously improves suggestions based on user feedback
 *
 * @example
 * ```typescript
 * const suggestionEngine = new SuggestionEngine();
 * await suggestionEngine.learnFromSession(sessionContext);
 * const suggestions = await suggestionEngine.getSuggestions(currentContext, 'code');
 * console.log(`Generated ${suggestions.length} suggestions`);
 * ```
 */
export declare class SuggestionEngine {
  private config;
  private interactionPatterns;
  private workflowOptimizations;
  private errorPatterns;
  private userFeedback;
  private contextPrioritizer;
  constructor(config?: Partial<SuggestionConfig>);
  /**
   * Generate contextual suggestions based on current state
   */
  getSuggestions(
    currentContext: string,
    contextType?: 'command' | 'code' | 'workflow' | 'optimization' | 'debug',
    codeContext?: CodeContextSnapshot,
  ): Promise<ContextSuggestion[]>;
  /**
   * Generate command suggestions based on current context
   */
  private generateCommandSuggestions;
  /**
   * Generate code suggestions based on current context
   */
  private generateCodeSuggestions;
  /**
   * Generate workflow optimization suggestions
   */
  private generateWorkflowSuggestions;
  /**
   * Generate optimization suggestions
   */
  private generateOptimizationSuggestions;
  /**
   * Generate debug suggestions
   */
  private generateDebugSuggestions;
  /**
   * Learn from user session to improve future suggestions
   */
  learnFromSession(session: SessionContext): Promise<void>;
  /**
   * Record user feedback on suggestions to improve future recommendations
   */
  recordFeedback(
    suggestionId: string,
    suggestion: ContextSuggestion,
    accepted: boolean,
  ): void;
  /**
   * Extract interaction patterns from session
   */
  private extractInteractionPatterns;
  /**
   * Extract command sequences from conversation summary
   */
  private extractCommandSequences;
  /**
   * Estimate session success based on conversation content
   */
  private estimateSessionSuccess;
  /**
   * Extract context conditions from session
   */
  private extractContextConditions;
  /**
   * Identify workflow optimizations from session
   */
  private identifyWorkflowOptimizations;
  /**
   * Suggest workflow optimization based on command sequence
   */
  private suggestWorkflowOptimization;
  /**
   * Extract error patterns from session
   */
  private extractErrorPatterns;
  /**
   * Generate pattern-based command suggestions
   */
  private generatePatternBasedCommandSuggestions;
  /**
   * Calculate pattern relevance to current context
   */
  private calculatePatternRelevance;
  /**
   * Predict next command in a pattern
   */
  private predictNextCommand;
  /**
   * Calculate context relevance for optimization
   */
  private calculateContextRelevance;
  /**
   * Get command success rate from historical data
   */
  private getCommandSuccessRate;
  /**
   * Get related historical commands
   */
  private getRelatedHistoricalCommands;
  /**
   * Estimate command benefit
   */
  private estimateCommandBenefit;
  /**
   * Generate performance suggestions
   */
  private generatePerformanceSuggestions;
  /**
   * Generate security suggestions
   */
  private generateSecuritySuggestions;
  /**
   * Identify development workflow optimizations
   */
  private identifyDevelopmentWorkflowOptimizations;
  /**
   * Identify testing workflow optimizations
   */
  private identifyTestingWorkflowOptimizations;
  /**
   * Identify deployment workflow optimizations
   */
  private identifyDeploymentWorkflowOptimizations;
  /**
   * Identify duplicated code patterns
   */
  private identifyDuplicatedCode;
  /**
   * Reinforce positive patterns based on user acceptance
   */
  private reinforcePositivePattern;
  /**
   * Reduce negative patterns based on user rejection
   */
  private reduceNegativePattern;
  /**
   * Get learning statistics
   */
  getLearningStats(): LearningStats;
  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<SuggestionConfig>): void;
  /**
   * Get current configuration
   */
  getConfig(): SuggestionConfig;
  /**
   * Clear all learned data (useful for testing or reset)
   */
  clearLearning(): void;
  /**
   * Export learning data for backup or analysis
   */
  exportLearningData(): Record<string, unknown>;
  /**
   * Import learning data from backup
   */
  importLearningData(data: Record<string, unknown>): void;
}
/**
 * Create a suggestion engine instance with optional configuration
 */
export declare function createSuggestionEngine(
  config?: Partial<SuggestionConfig>,
): SuggestionEngine;
