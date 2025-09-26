/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Advanced Context Retention System - Main Index
 * Unified API for intelligent context management in Gemini CLI
 *
 * @author Claude Code - Advanced Context Retention Agent
 * @version 1.0.0
 */
export type { ContextItem, ContextType, ContextPriority, ContextWindow, ContextSections, ContextSection, ContextSuggestion, SessionContext, CodeContextSnapshot, FileTree, FunctionSummary, CodeChange, DependencyMap, TestContextMap, ParameterInfo, PrioritizationConfig, PrioritizationResult, PrioritizationStats, CompressionConfig, CompressionResult, CompressionStrategy, ContextAnalysis, ContextPattern, ContextAnomaly, ContextOptimization, ContextUsageStats, } from './types.js';
export { ContextPrioritizer, createContextPrioritizer, DEFAULT_PRIORITIZATION_CONFIG, } from './ContextPrioritizer.js';
export { SemanticCompressor, createSemanticCompressor, DEFAULT_COMPRESSION_CONFIG, } from './SemanticCompressor.js';
export { CrossSessionStorage, createCrossSessionStorage, DEFAULT_STORAGE_CONFIG, } from './CrossSessionStorage.js';
export { ContextWindowManager, createContextWindowManager, DEFAULT_CONTEXT_WINDOW_CONFIG, } from './ContextWindowManager.js';
export { CodeContextAnalyzer, createCodeContextAnalyzer, DEFAULT_CODE_ANALYSIS_CONFIG, } from './CodeContextAnalyzer.js';
export { SuggestionEngine, createSuggestionEngine, DEFAULT_SUGGESTION_CONFIG, } from './SuggestionEngine.js';
export type { ContextWindowConfig, AllocationStats, } from './ContextWindowManager.js';
export type { CodeAnalysisConfig, AnalysisStats, } from './CodeContextAnalyzer.js';
export type { SuggestionConfig, InteractionPattern, WorkflowOptimization, ErrorPattern, LearningStats, } from './SuggestionEngine.js';
export type { StorageConfig, SessionIndex, StorageStats, } from './CrossSessionStorage.js';
import type { ContextItem, ContextSuggestion, SessionContext, ContextWindow, PrioritizationConfig, CompressionConfig, ContextWindowConfig, CodeAnalysisConfig, SuggestionConfig } from './types.js';
/**
 * Configuration for the entire context system
 */
export interface ContextSystemConfig {
    /** Project root path for analysis */
    projectPath: string;
    /** Configuration for context prioritization */
    prioritization?: Partial<PrioritizationConfig>;
    /** Configuration for semantic compression */
    compression?: Partial<CompressionConfig>;
    /** Configuration for cross-session storage */
    storage?: Partial<StorageConfig>;
    /** Configuration for context window management */
    window?: Partial<ContextWindowConfig>;
    /** Configuration for code analysis */
    codeAnalysis?: Partial<CodeAnalysisConfig>;
    /** Configuration for suggestion engine */
    suggestions?: Partial<SuggestionConfig>;
    /** Enable automatic optimization */
    autoOptimize?: boolean;
    /** Optimization interval in milliseconds */
    optimizationInterval?: number;
}
/**
 * Default configuration for the context system
 */
export declare const DEFAULT_CONTEXT_SYSTEM_CONFIG: Partial<ContextSystemConfig>;
/**
 * Unified Advanced Context Retention System
 *
 * The ContextSystem provides a unified interface to all context management
 * components, orchestrating intelligent context window management, semantic
 * compression, cross-session persistence, and intelligent suggestions.
 *
 * Key Features:
 * - Unified API for all context operations
 * - Automatic optimization and maintenance
 * - Intelligent context prioritization and compression
 * - Cross-session memory and learning
 * - Real-time suggestions and workflow optimization
 * - Comprehensive analytics and monitoring
 *
 * @example
 * ```typescript
 * const contextSystem = new ContextSystem({
 *   projectPath: '/path/to/project',
 *   autoOptimize: true,
 * });
 *
 * await contextSystem.initialize();
 * await contextSystem.addContext(contextItem);
 * const suggestions = await contextSystem.getSuggestions('current context');
 * await contextSystem.saveSession(sessionData);
 * ```
 */
export declare class ContextSystem {
    private config;
    private prioritizer;
    private compressor;
    private storage;
    private windowManager;
    private codeAnalyzer;
    private suggestionEngine;
    private optimizationTimer?;
    private initialized;
    constructor(config: ContextSystemConfig);
    /**
     * Initialize the context system and load historical data
     */
    initialize(): Promise<void>;
    /**
     * Add content to the context system
     */
    addContext(item: ContextItem, section?: keyof ContextSections): Promise<boolean>;
    /**
     * Get intelligent suggestions based on current context
     */
    getSuggestions(currentContext: string, suggestionType?: 'command' | 'code' | 'workflow' | 'optimization' | 'debug'): Promise<ContextSuggestion[]>;
    /**
     * Optimize the context system by compression and prioritization
     */
    optimizeContext(): Promise<void>;
    /**
     * Save current session data for cross-session learning
     */
    saveSession(session: SessionContext): Promise<void>;
    /**
     * Load and restore context from a previous session
     */
    loadSessionContext(sessionId: string): Promise<SessionContext | null>;
    /**
     * Search for relevant sessions based on query
     */
    searchSessions(query: string, limit?: number): Promise<SessionContext[]>;
    /**
     * Get current context window state
     */
    getCurrentContextWindow(): ContextWindow;
    /**
     * Record user feedback on a suggestion for learning
     */
    recordSuggestionFeedback(suggestionId: string, suggestion: ContextSuggestion, accepted: boolean): void;
    /**
     * Analyze code changes and their impact
     */
    analyzeCodeChanges(changedFiles: string[]): Promise<{
        affectedFiles: string[];
        impactAnalysis: Record<string, string[]>;
        suggestions: ContextSuggestion[];
    }>;
    /**
     * Get comprehensive system statistics
     */
    getSystemStats(): {
        window: AllocationStats;
        learning: LearningStats;
        analysis: AnalysisStats;
        storage: StorageStats;
    };
    /**
     * Update system configuration
     */
    updateConfig(newConfig: Partial<ContextSystemConfig>): Promise<void>;
    /**
     * Export all system data for backup
     */
    exportSystemData(): Promise<Record<string, unknown>>;
    /**
     * Import system data from backup
     */
    importSystemData(data: Record<string, unknown>): Promise<void>;
    /**
     * Shutdown the context system cleanly
     */
    shutdown(): Promise<void>;
    /**
     * Start automatic context optimization
     */
    private startAutoOptimization;
    /**
     * Stop automatic context optimization
     */
    private stopAutoOptimization;
    /**
     * Ensure the system is initialized
     */
    private ensureInitialized;
}
/**
 * Create and initialize a context system instance
 */
export declare function createContextSystem(config: ContextSystemConfig): Promise<ContextSystem>;
/**
 * Factory function to create a pre-configured context system for development
 */
export declare function createDevelopmentContextSystem(projectPath: string): Promise<ContextSystem>;
/**
 * Factory function to create a pre-configured context system for production
 */
export declare function createProductionContextSystem(projectPath: string): Promise<ContextSystem>;
