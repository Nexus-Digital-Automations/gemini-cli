/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
// Component Exports
export { ContextPrioritizer, createContextPrioritizer, DEFAULT_PRIORITIZATION_CONFIG, } from './ContextPrioritizer.js';
export { SemanticCompressor, createSemanticCompressor, DEFAULT_COMPRESSION_CONFIG, } from './SemanticCompressor.js';
export { CrossSessionStorage, createCrossSessionStorage, DEFAULT_STORAGE_CONFIG, } from './CrossSessionStorage.js';
export { ContextWindowManager, createContextWindowManager, DEFAULT_CONTEXT_WINDOW_CONFIG, } from './ContextWindowManager.js';
export { CodeContextAnalyzer, createCodeContextAnalyzer, DEFAULT_CODE_ANALYSIS_CONFIG, } from './CodeContextAnalyzer.js';
export { SuggestionEngine, createSuggestionEngine, DEFAULT_SUGGESTION_CONFIG, } from './SuggestionEngine.js';
import { getComponentLogger } from '../utils/logger.js';
import { ContextPrioritizer, DEFAULT_PRIORITIZATION_CONFIG, } from './ContextPrioritizer.js';
import { SemanticCompressor, DEFAULT_COMPRESSION_CONFIG, } from './SemanticCompressor.js';
import { CrossSessionStorage } from './CrossSessionStorage.js';
import { ContextWindowManager, DEFAULT_CONTEXT_WINDOW_CONFIG, } from './ContextWindowManager.js';
import { CodeContextAnalyzer, DEFAULT_CODE_ANALYSIS_CONFIG, } from './CodeContextAnalyzer.js';
import { SuggestionEngine, DEFAULT_SUGGESTION_CONFIG, } from './SuggestionEngine.js';
const logger = getComponentLogger('context-system');
/**
 * Default configuration for the context system
 */
export const DEFAULT_CONTEXT_SYSTEM_CONFIG = {
    autoOptimize: true,
    optimizationInterval: 300000, // 5 minutes
};
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
export class ContextSystem {
    config;
    prioritizer;
    compressor;
    storage;
    windowManager;
    codeAnalyzer;
    suggestionEngine;
    optimizationTimer;
    initialized = false;
    constructor(config) {
        this.config = {
            ...DEFAULT_CONTEXT_SYSTEM_CONFIG,
            ...config,
        };
        // Initialize all components
        this.prioritizer = new ContextPrioritizer(this.config.prioritization);
        this.compressor = new SemanticCompressor(this.config.compression);
        this.storage = new CrossSessionStorage(this.config.storage);
        this.windowManager = new ContextWindowManager(this.config.window);
        this.codeAnalyzer = new CodeContextAnalyzer(this.config.projectPath, this.config.codeAnalysis);
        this.suggestionEngine = new SuggestionEngine(this.config.suggestions);
        logger.info('ContextSystem created', {
            projectPath: this.config.projectPath,
            autoOptimize: this.config.autoOptimize,
        });
    }
    /**
     * Initialize the context system and load historical data
     */
    async initialize() {
        if (this.initialized) {
            logger.warn('ContextSystem already initialized');
            return;
        }
        const startTime = performance.now();
        logger.info('Initializing Advanced Context Retention System');
        try {
            // Initialize storage and load historical sessions
            await this.storage.initialize();
            const recentSessions = await this.storage.getRelatedSessions(this.config.projectPath, 5);
            // Learn from recent sessions
            for (const session of recentSessions) {
                await this.suggestionEngine.learnFromSession(session);
            }
            // Perform initial code analysis
            const codeContext = await this.codeAnalyzer.analyzeProject();
            logger.debug('Initial code analysis completed', {
                functions: codeContext.activeFunctions.length,
                dependencies: Object.keys(codeContext.dependencies).length,
            });
            // Start automatic optimization if enabled
            if (this.config.autoOptimize) {
                this.startAutoOptimization();
            }
            this.initialized = true;
            const duration = performance.now() - startTime;
            logger.info(`ContextSystem initialized successfully in ${duration.toFixed(2)}ms`, {
                historicalSessions: recentSessions.length,
                autoOptimize: this.config.autoOptimize,
            });
        }
        catch (error) {
            logger.error('Failed to initialize ContextSystem', { error });
            throw error;
        }
    }
    /**
     * Add content to the context system
     */
    async addContext(item, section = 'conversation') {
        this.ensureInitialized();
        logger.debug(`Adding context item to ${section}`, {
            itemId: item.id,
            tokenCount: item.tokenCount,
        });
        try {
            // Record interaction for learning
            this.prioritizer.recordInteraction(item.id);
            // Add to context window
            const added = await this.windowManager.addToSection(section, item);
            if (added) {
                logger.info(`Context item added to ${section}`, { itemId: item.id });
            }
            else {
                logger.warn(`Failed to add context item to ${section}`, {
                    itemId: item.id,
                });
            }
            return added;
        }
        catch (error) {
            logger.error('Failed to add context', { error, itemId: item.id });
            return false;
        }
    }
    /**
     * Get intelligent suggestions based on current context
     */
    async getSuggestions(currentContext, suggestionType = 'workflow') {
        this.ensureInitialized();
        logger.debug(`Generating ${suggestionType} suggestions`);
        try {
            // Get current code context for more informed suggestions
            const codeContext = await this.codeAnalyzer.analyzeProject();
            // Generate suggestions using the suggestion engine
            const suggestions = await this.suggestionEngine.getSuggestions(currentContext, suggestionType, codeContext);
            logger.info(`Generated ${suggestions.length} suggestions`, {
                type: suggestionType,
                avgConfidence: suggestions.reduce((sum, s) => sum + s.confidence, 0) /
                    suggestions.length || 0,
            });
            return suggestions;
        }
        catch (error) {
            logger.error('Failed to generate suggestions', { error, suggestionType });
            return [];
        }
    }
    /**
     * Optimize the context system by compression and prioritization
     */
    async optimizeContext() {
        this.ensureInitialized();
        logger.info('Starting context optimization');
        try {
            const startTime = performance.now();
            // Optimize context window
            await this.windowManager.optimizeContextWindow();
            // Get allocation statistics
            const stats = this.windowManager.getAllocationStats();
            const duration = performance.now() - startTime;
            logger.info(`Context optimization completed in ${duration.toFixed(2)}ms`, {
                efficiencyScore: stats.efficiencyScore,
                wastedTokens: stats.wastedTokens,
            });
        }
        catch (error) {
            logger.error('Failed to optimize context', { error });
        }
    }
    /**
     * Save current session data for cross-session learning
     */
    async saveSession(session) {
        this.ensureInitialized();
        logger.debug('Saving session', { sessionId: session.sessionId });
        try {
            // Save session to storage
            await this.storage.saveSession(session);
            // Learn from this session
            await this.suggestionEngine.learnFromSession(session);
            logger.info('Session saved successfully', {
                sessionId: session.sessionId,
            });
        }
        catch (error) {
            logger.error('Failed to save session', {
                error,
                sessionId: session.sessionId,
            });
            throw error;
        }
    }
    /**
     * Load and restore context from a previous session
     */
    async loadSessionContext(sessionId) {
        this.ensureInitialized();
        logger.debug('Loading session context', { sessionId });
        try {
            const session = await this.storage.loadSession(sessionId);
            if (session) {
                // Restore context items to the window manager
                for (const item of session.contextItems) {
                    await this.addContext(item);
                }
                logger.info('Session context loaded and restored', {
                    sessionId,
                    contextItems: session.contextItems.length,
                });
            }
            return session;
        }
        catch (error) {
            logger.error('Failed to load session context', { error, sessionId });
            return null;
        }
    }
    /**
     * Search for relevant sessions based on query
     */
    async searchSessions(query, limit = 10) {
        this.ensureInitialized();
        logger.debug('Searching sessions', { query, limit });
        try {
            const sessions = await this.storage.searchSessions(query, limit);
            logger.info(`Found ${sessions.length} matching sessions`, { query });
            return sessions;
        }
        catch (error) {
            logger.error('Failed to search sessions', { error, query });
            return [];
        }
    }
    /**
     * Get current context window state
     */
    getCurrentContextWindow() {
        this.ensureInitialized();
        return this.windowManager.getCurrentWindow();
    }
    /**
     * Record user feedback on a suggestion for learning
     */
    recordSuggestionFeedback(suggestionId, suggestion, accepted) {
        this.ensureInitialized();
        this.suggestionEngine.recordFeedback(suggestionId, suggestion, accepted);
        logger.debug('Suggestion feedback recorded', { suggestionId, accepted });
    }
    /**
     * Analyze code changes and their impact
     */
    async analyzeCodeChanges(changedFiles) {
        this.ensureInitialized();
        logger.debug('Analyzing code changes', { changedFiles });
        try {
            const impactResult = await this.codeAnalyzer.analyzeChangeImpact(changedFiles);
            const suggestions = await this.getSuggestions(`Code changes in: ${changedFiles.join(', ')}`, 'code');
            logger.info('Code change analysis completed', {
                changedFiles: changedFiles.length,
                affectedFiles: impactResult.affectedFiles.length,
                suggestions: suggestions.length,
            });
            return {
                ...impactResult,
                suggestions,
            };
        }
        catch (error) {
            logger.error('Failed to analyze code changes', { error, changedFiles });
            return {
                affectedFiles: [],
                impactAnalysis: {},
                suggestions: [],
            };
        }
    }
    /**
     * Get comprehensive system statistics
     */
    getSystemStats() {
        this.ensureInitialized();
        return {
            window: this.windowManager.getAllocationStats(),
            learning: this.suggestionEngine.getLearningStats(),
            analysis: this.codeAnalyzer.getAnalysisStats(),
            storage: this.storage.getStorageStats(),
        };
    }
    /**
     * Update system configuration
     */
    async updateConfig(newConfig) {
        logger.info('Updating context system configuration', { newConfig });
        this.config = { ...this.config, ...newConfig };
        // Update component configurations
        if (newConfig.prioritization) {
            this.prioritizer.updateConfig(newConfig.prioritization);
        }
        if (newConfig.compression) {
            this.compressor.updateConfig(newConfig.compression);
        }
        if (newConfig.window) {
            this.windowManager.updateConfig(newConfig.window);
        }
        if (newConfig.codeAnalysis) {
            this.codeAnalyzer.updateConfig(newConfig.codeAnalysis);
        }
        if (newConfig.suggestions) {
            this.suggestionEngine.updateConfig(newConfig.suggestions);
        }
        // Restart auto-optimization with new interval if changed
        if (newConfig.optimizationInterval && this.optimizationTimer) {
            this.stopAutoOptimization();
            this.startAutoOptimization();
        }
        logger.info('Context system configuration updated');
    }
    /**
     * Export all system data for backup
     */
    async exportSystemData() {
        this.ensureInitialized();
        logger.info('Exporting context system data');
        try {
            const data = {
                config: this.config,
                window: this.windowManager.exportState(),
                learning: this.suggestionEngine.exportLearningData(),
                analysis: this.codeAnalyzer.getAnalysisStats(),
                storage: await this.storage.exportData(),
                exportTimestamp: new Date().toISOString(),
            };
            logger.info('Context system data exported successfully');
            return data;
        }
        catch (error) {
            logger.error('Failed to export system data', { error });
            throw error;
        }
    }
    /**
     * Import system data from backup
     */
    async importSystemData(data) {
        logger.info('Importing context system data');
        try {
            // Import learning data
            if (data.learning) {
                this.suggestionEngine.importLearningData(data.learning);
            }
            // Import storage data
            if (data.storage) {
                await this.storage.importData(data.storage);
            }
            logger.info('Context system data imported successfully');
        }
        catch (error) {
            logger.error('Failed to import system data', { error });
            throw error;
        }
    }
    /**
     * Shutdown the context system cleanly
     */
    async shutdown() {
        logger.info('Shutting down context system');
        try {
            // Stop auto-optimization
            this.stopAutoOptimization();
            // Cleanup storage
            await this.storage.cleanup();
            // Clear caches
            this.codeAnalyzer.clearCaches();
            this.prioritizer.clearCaches();
            this.initialized = false;
            logger.info('Context system shutdown completed');
        }
        catch (error) {
            logger.error('Error during context system shutdown', { error });
            throw error;
        }
    }
    /**
     * Start automatic context optimization
     */
    startAutoOptimization() {
        if (this.optimizationTimer) {
            return; // Already running
        }
        const interval = this.config.optimizationInterval || 300000; // 5 minutes default
        this.optimizationTimer = setInterval(async () => {
            try {
                await this.optimizeContext();
            }
            catch (error) {
                logger.error('Auto-optimization failed', { error });
            }
        }, interval);
        logger.info('Auto-optimization started', { interval });
    }
    /**
     * Stop automatic context optimization
     */
    stopAutoOptimization() {
        if (this.optimizationTimer) {
            clearInterval(this.optimizationTimer);
            this.optimizationTimer = undefined;
            logger.info('Auto-optimization stopped');
        }
    }
    /**
     * Ensure the system is initialized
     */
    ensureInitialized() {
        if (!this.initialized) {
            throw new Error('ContextSystem not initialized. Call initialize() first.');
        }
    }
}
/**
 * Create and initialize a context system instance
 */
export async function createContextSystem(config) {
    const system = new ContextSystem(config);
    await system.initialize();
    return system;
}
/**
 * Factory function to create a pre-configured context system for development
 */
export async function createDevelopmentContextSystem(projectPath) {
    return createContextSystem({
        projectPath,
        autoOptimize: true,
        prioritization: {
            ...DEFAULT_PRIORITIZATION_CONFIG,
            recencyWeight: 0.4, // Boost recent items for development
        },
        compression: {
            ...DEFAULT_COMPRESSION_CONFIG,
            targetRatio: 0.7, // More aggressive compression for development
        },
        window: {
            ...DEFAULT_CONTEXT_WINDOW_CONFIG,
            enableDynamicAllocation: true,
        },
        codeAnalysis: {
            ...DEFAULT_CODE_ANALYSIS_CONFIG,
            enableTestCorrelation: true,
        },
        suggestions: {
            ...DEFAULT_SUGGESTION_CONFIG,
            enablePatternLearning: true,
            enableWorkflowOptimization: true,
        },
    });
}
/**
 * Factory function to create a pre-configured context system for production
 */
export async function createProductionContextSystem(projectPath) {
    return createContextSystem({
        projectPath,
        autoOptimize: true,
        optimizationInterval: 600000, // 10 minutes for production
        prioritization: {
            ...DEFAULT_PRIORITIZATION_CONFIG,
            minRelevanceThreshold: 0.2, // Higher threshold for production
        },
        compression: {
            ...DEFAULT_COMPRESSION_CONFIG,
            targetRatio: 0.8, // Conservative compression for production
        },
        window: {
            ...DEFAULT_CONTEXT_WINDOW_CONFIG,
            totalTokens: 64000, // Larger context window for production
            bufferPercentage: 0.1, // Larger buffer for production stability
        },
        suggestions: {
            ...DEFAULT_SUGGESTION_CONFIG,
            minConfidenceThreshold: 0.5, // Higher confidence threshold for production
        },
    });
}
//# sourceMappingURL=index.js.map