/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { FixSuggestion, ErrorAnalysis, LanguageSupport, FixResult } from './types.js';
import { FixPriority } from './types.js';
import { type ErrorAnalysisEngineConfig } from './ErrorAnalysisEngine.js';
/**
 * Configuration for fix suggestion engine
 */
export interface FixSuggestionEngineConfig {
    /** Error analysis engine configuration */
    errorAnalysis: Partial<ErrorAnalysisEngineConfig>;
    /** Enable automated fix generation */
    enableAutomatedFixes: boolean;
    /** Enable ML-based fix suggestions */
    enableMLSuggestions: boolean;
    /** Enable code transformation suggestions */
    enableCodeTransformations: boolean;
    /** Maximum number of suggestions per error */
    maxSuggestionsPerError: number;
    /** Minimum confidence threshold for suggestions */
    minConfidenceThreshold: number;
    /** Enable learning from user feedback */
    enableLearningFromFeedback: boolean;
    /** Supported programming languages for fixes */
    supportedLanguages: LanguageSupport[];
    /** Enable quick fix generation */
    enableQuickFixes: boolean;
    /** Cache TTL for fix suggestions in milliseconds */
    fixCacheTTL: number;
    /** Enable validation of suggested fixes */
    enableFixValidation: boolean;
}
/**
 * Default configuration for fix suggestion engine
 */
export declare const DEFAULT_FIX_SUGGESTION_ENGINE_CONFIG: FixSuggestionEngineConfig;
/**
 * Fix Suggestion Engine
 *
 * Intelligent system for generating automated fix suggestions and resolution strategies
 * based on error analysis patterns and contextual information.
 *
 * Key Features:
 * - **Pattern-Based Fixes**: Generates fixes based on recognized error patterns
 * - **Language-Specific Solutions**: Provides language-appropriate fix strategies
 * - **Automated Code Generation**: Creates ready-to-apply code transformations
 * - **Quick Fix Suggestions**: Offers simple, one-click fixes for common issues
 * - **Configuration Fixes**: Suggests configuration and dependency changes
 * - **Learning from Feedback**: Improves suggestions based on user acceptance
 * - **Validation and Testing**: Validates fix suggestions before presenting them
 *
 * @example
 * ```typescript
 * const fixEngine = new FixSuggestionEngine({
 *   enableAutomatedFixes: true,
 *   enableMLSuggestions: true,
 * });
 *
 * await fixEngine.initialize('/path/to/project');
 *
 * // Generate fix suggestions for an error
 * const suggestions = await fixEngine.generateFixSuggestions(errorAnalysis, {
 *   includeAutomatedFixes: true,
 *   includeQuickFixes: true,
 *   maxSuggestions: 5,
 * });
 *
 * // Apply a specific fix
 * const result = await fixEngine.applyFix(suggestions[0], {
 *   validateBeforeApply: true,
 *   createBackup: true,
 * });
 * ```
 */
export declare class FixSuggestionEngine {
    private config;
    private errorAnalysisEngine?;
    private fixCache;
    private fixTemplates;
    private userFeedback;
    private isInitialized;
    constructor(config?: Partial<FixSuggestionEngineConfig>);
    /**
     * Initialize the fix suggestion engine
     */
    initialize(projectPath?: string): Promise<void>;
    /**
     * Generate fix suggestions for an error
     */
    generateFixSuggestions(errorAnalysis: ErrorAnalysis, options?: {
        includeAutomatedFixes?: boolean;
        includeQuickFixes?: boolean;
        includeCodeTransformations?: boolean;
        maxSuggestions?: number;
        priorityFilter?: FixPriority[];
    }): Promise<FixSuggestion[]>;
    /**
     * Apply a fix suggestion
     */
    applyFix(suggestion: FixSuggestion, options?: {
        validateBeforeApply?: boolean;
        createBackup?: boolean;
        dryRun?: boolean;
    }): Promise<FixResult>;
    /**
     * Record user feedback on fix suggestions
     */
    recordFeedback(fixId: string, feedback: {
        accepted: boolean;
        effectiveness?: number;
        comments?: string;
    }): Promise<void>;
    /**
     * Get statistics about fix suggestions and their effectiveness
     */
    getFixStats(): {
        totalSuggestions: number;
        acceptanceRate: number;
        averageEffectiveness: number;
        topCategories: Array<{
            category: string;
            count: number;
        }>;
        cacheHitRate: number;
    };
    /**
     * Clear fix cache
     */
    clearCache(): void;
    /**
     * Update configuration
     */
    updateConfig(newConfig: Partial<FixSuggestionEngineConfig>): void;
    /**
     * Generate pattern-based fixes using error analysis
     */
    private generatePatternBasedFixes;
    /**
     * Generate quick fixes for simple, common issues
     */
    private generateQuickFixes;
    /**
     * Generate automated fixes that can be applied without user intervention
     */
    private generateAutomatedFixes;
    /**
     * Generate code transformation suggestions
     */
    private generateCodeTransformations;
    /**
     * Generate command-based suggestions
     */
    private generateCommandSuggestions;
    /**
     * Generate configuration-based fixes
     */
    private generateConfigurationFixes;
    /**
     * Load built-in fix templates
     */
    private loadBuiltinFixTemplates;
    /**
     * Load user feedback from storage
     */
    private loadUserFeedback;
    /**
     * Check if a template is applicable to the current context
     */
    private isTemplateApplicable;
    /**
     * Determine fix priority based on template and error analysis
     */
    private determinePriority;
    /**
     * Extract parameters for template substitution
     */
    private extractTemplateParameters;
    /**
     * Filter suggestions based on options and configuration
     */
    private filterSuggestions;
    /**
     * Rank suggestions by relevance and effectiveness
     */
    private rankSuggestions;
    /**
     * Validate a fix suggestion
     */
    private validateFixSuggestion;
    /**
     * Calculate safety score for a fix suggestion
     */
    private calculateSafetyScore;
    /**
     * Estimate the impact of applying a fix
     */
    private estimateFixImpact;
    /**
     * Extract module hint from error analysis
     */
    private extractModuleHint;
    /**
     * Get appropriate lint fix command for a language
     */
    private getLintFixCommand;
    /**
     * Generate cache key for fix suggestions
     */
    private generateFixCacheKey;
    /**
     * Simple hash function
     */
    private simpleHash;
    /**
     * Create backup before applying fix
     */
    private createBackup;
    /**
     * Apply code transformation
     */
    private applyCodeTransformation;
    /**
     * Execute command
     */
    private executeCommand;
    /**
     * Apply configuration change
     */
    private applyConfigurationChange;
    /**
     * Apply dependency change
     */
    private applyDependencyChange;
}
/**
 * Create a Fix Suggestion Engine instance
 */
export declare function createFixSuggestionEngine(config?: Partial<FixSuggestionEngineConfig>, projectPath?: string): Promise<FixSuggestionEngine>;
