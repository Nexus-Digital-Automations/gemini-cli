/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ContextWindow, ContextSuggestion, ContextAnalysis } from './types.js';
import type { PrioritizationConfig, CompressionConfig, StorageConfig, ContextWindowConfig, CodeAnalysisConfig, SuggestionEngineConfig, UserInteraction } from './types.js';
/**
 * Configuration for the entire Advanced Context Retention System
 */
export interface AdvancedContextRetentionConfig {
    /** Project path for context management */
    projectPath: string;
    /** Context prioritization configuration */
    prioritization: Partial<PrioritizationConfig>;
    /** Semantic compression configuration */
    compression: Partial<CompressionConfig>;
    /** Cross-session storage configuration */
    storage: Partial<StorageConfig>;
    /** Context window management configuration */
    contextWindow: Partial<ContextWindowConfig>;
    /** Code analysis configuration */
    codeAnalysis: Partial<CodeAnalysisConfig>;
    /** Suggestion engine configuration */
    suggestions: Partial<SuggestionEngineConfig>;
    /** Enable automatic optimization */
    enableAutoOptimization: boolean;
    /** Auto-optimization interval in minutes */
    autoOptimizationInterval: number;
    /** Enable cross-session learning */
    enableCrossSessionLearning: boolean;
    /** Maximum context items to maintain */
    maxContextItems: number;
}
/**
 * Default configuration for Advanced Context Retention System
 */
export declare const DEFAULT_ADVANCED_CONTEXT_RETENTION_CONFIG: AdvancedContextRetentionConfig;
/**
 * System statistics and health metrics
 */
export interface SystemStats {
    /** Total context items managed */
    totalContextItems: number;
    /** Memory usage in MB */
    memoryUsageMB: number;
    /** Context window utilization rate */
    windowUtilization: number;
    /** Compression efficiency */
    compressionEfficiency: number;
    /** Cache hit rates */
    cacheHitRates: Record<string, number>;
    /** Suggestion acceptance rate */
    suggestionAcceptanceRate: number;
    /** Session count */
    sessionCount: number;
    /** Last optimization time */
    lastOptimization: Date;
    /** System uptime in hours */
    uptimeHours: number;
}
/**
 * Advanced Context Retention System
 *
 * The main orchestrator that integrates all context management components into a unified system.
 * Provides intelligent context window management, semantic compression, cross-session memory persistence,
 * and context-aware suggestions to enhance long-running project continuity.
 *
 * Key Features:
 * - **Intelligent Prioritization**: Automatically ranks context by importance and relevance
 * - **Semantic Compression**: AI-powered content compression while preserving meaning
 * - **Cross-Session Memory**: Persistent context storage and retrieval across CLI sessions
 * - **Dynamic Window Management**: Efficient allocation of limited context space
 * - **Code Understanding**: Deep project structure and relationship analysis
 * - **Smart Suggestions**: Context-aware recommendations and workflow optimization
 *
 * @example
 * ```typescript
 * const contextSystem = await AdvancedContextRetentionSystem.create({
 *   projectPath: '/path/to/project',
 *   enableAutoOptimization: true,
 * });
 *
 * // Add context items
 * await contextSystem.addContext('code', codeContent, { filePath: 'src/main.ts' });
 *
 * // Get intelligent suggestions
 * const suggestions = await contextSystem.getSuggestions();
 *
 * // Optimize context automatically
 * await contextSystem.optimize();
 * ```
 */
export declare class AdvancedContextRetentionSystem {
    private config;
    private prioritizer;
    private compressor;
    private storage;
    private windowManager;
    private codeAnalyzer;
    private suggestionEngine;
    private contextItems;
    private autoOptimizationTimer?;
    private systemStartTime;
    private isInitialized;
    private constructor();
    /**
     * Create and initialize an Advanced Context Retention System instance
     */
    static create(config?: Partial<AdvancedContextRetentionConfig>): Promise<AdvancedContextRetentionSystem>;
    /**
     * Initialize the system with historical data and start optimization
     */
    private initialize;
    /**
     * Add context to the system
     */
    addContext(type: string, content: string, metadata?: Record<string, unknown>): Promise<string>;
    /**
     * Get intelligent suggestions based on current context
     */
    getSuggestions(currentContext?: string): Promise<ContextSuggestion[]>;
    /**
     * Analyze current context for patterns and optimization opportunities
     */
    analyzeContext(): Promise<ContextAnalysis>;
    /**
     * Optimize the context system
     */
    optimize(): Promise<{
        itemsRemoved: number;
        itemsCompressed: number;
        tokensSaved: number;
    }>;
    /**
     * Save current session context
     */
    saveSession(): Promise<void>;
    /**
     * Load previous session context
     */
    private loadPreviousSession;
    /**
     * Track user interaction for learning
     */
    trackInteraction(interaction: UserInteraction): Promise<void>;
    /**
     * Get current context window state
     */
    getContextWindow(): ContextWindow;
    /**
     * Get system statistics and health metrics
     */
    getSystemStats(): SystemStats;
    /**
     * Update system configuration
     */
    updateConfig(newConfig: Partial<AdvancedContextRetentionConfig>): void;
    /**
     * Graceful shutdown of the system
     */
    shutdown(): Promise<void>;
    /**
     * Start automatic optimization
     */
    private startAutoOptimization;
    /**
     * Stop automatic optimization
     */
    private stopAutoOptimization;
    /**
     * Prune old context items when limit exceeded
     */
    private pruneOldContext;
    /**
     * Generate unique context ID
     */
    private generateContextId;
    /**
     * Generate unique session ID
     */
    private generateSessionId;
    /**
     * Estimate token count for content
     */
    private estimateTokenCount;
    /**
     * Extract tags from content
     */
    private extractTags;
    /**
     * Map context type to window section
     */
    private mapTypeToSection;
    /**
     * Get current context summary
     */
    private getCurrentContextSummary;
    /**
     * Generate conversation summary
     */
    private generateConversationSummary;
    /**
     * Extract user preferences from context
     */
    private extractUserPreferences;
}
/**
 * Create an Advanced Context Retention System instance
 */
export declare function createAdvancedContextRetentionSystem(config?: Partial<AdvancedContextRetentionConfig>): Promise<AdvancedContextRetentionSystem>;
