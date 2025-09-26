/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Context System Utilities
 * Helper functions and utilities for the Advanced Context Retention System
 *
 * @author Claude Code - Advanced Context Retention Agent
 * @version 1.0.0
 */
import type { ContextItem, ContextType, ContextPriority, SessionContext, ContextSuggestion } from '../types.js';
/**
 * Token estimation utilities
 */
export declare class TokenEstimator {
    /**
     * Estimate token count for text content
     * Uses a simple heuristic - more sophisticated models would use actual tokenizer
     */
    static estimateTokens(content: string): number;
    /**
     * Check if content appears to be code
     */
    private static appearsToBeCode;
    /**
     * Check if content appears to be markdown
     */
    private static appearsToBeMarkdown;
}
/**
 * Context item utilities
 */
export declare class ContextItemUtils {
    /**
     * Create a context item with smart defaults
     */
    static createContextItem(content: string, type: ContextType, metadata?: Record<string, unknown>): ContextItem;
    /**
     * Generate unique context ID
     */
    static generateContextId(): string;
    /**
     * Infer priority based on type and content
     */
    private static inferPriority;
    /**
     * Calculate initial relevance score
     */
    private static calculateInitialRelevance;
    /**
     * Extract dependencies from content
     */
    private static extractDependencies;
    /**
     * Extract tags from content and metadata
     */
    private static extractTags;
    /**
     * Check if content appears to be structured
     */
    private static appearsStructured;
    /**
     * Check if a word is a common keyword
     */
    private static isCommonKeyword;
}
/**
 * Context filtering and search utilities
 */
export declare class ContextSearchUtils {
    /**
     * Filter context items by criteria
     */
    static filterContextItems(items: ContextItem[], criteria: {
        types?: ContextType[];
        priorities?: ContextPriority[];
        tags?: string[];
        minRelevance?: number;
        maxAge?: number;
        hasContent?: string;
    }): ContextItem[];
    /**
     * Search context items using fuzzy matching
     */
    static searchContextItems(items: ContextItem[], query: string, limit?: number): ContextItem[];
    /**
     * Calculate search score for an item
     */
    private static calculateSearchScore;
    /**
     * Group context items by type
     */
    static groupByType(items: ContextItem[]): Map<ContextType, ContextItem[]>;
    /**
     * Group context items by tags
     */
    static groupByTags(items: ContextItem[]): Map<string, ContextItem[]>;
}
/**
 * Context formatting utilities
 */
export declare class ContextFormatUtils {
    /**
     * Format context item for display
     */
    static formatContextItem(item: ContextItem, options?: {
        includeMetadata?: boolean;
        maxContentLength?: number;
        includeTimestamps?: boolean;
    }): string;
    /**
     * Format system statistics
     */
    static formatSystemStats(stats: {
        totalItems: number;
        memoryUsage: number;
        windowUtilization: number;
        compressionEfficiency: number;
    }): string;
    /**
     * Format suggestions for display
     */
    static formatSuggestions(suggestions: ContextSuggestion[]): string;
}
/**
 * Session analysis utilities
 */
export declare class SessionAnalysisUtils {
    /**
     * Analyze session patterns
     */
    static analyzeSessionPatterns(sessions: SessionContext[]): {
        averageSessionLength: number;
        commonTags: string[];
        mostActiveFiles: string[];
        contextTrends: Record<string, number>;
    };
    /**
     * Compare sessions for similarity
     */
    static calculateSessionSimilarity(session1: SessionContext, session2: SessionContext): number;
    /**
     * Calculate Jaccard similarity between two sets
     */
    private static jaccardSimilarity;
}
/**
 * Performance monitoring utilities
 */
export declare class PerformanceMonitor {
    private static measurements;
    /**
     * Start timing an operation
     */
    static startTiming(operation: string): () => void;
    /**
     * Record a timing measurement
     */
    static recordTiming(operation: string, duration: number): void;
    /**
     * Get performance statistics
     */
    static getStats(operation: string): {
        count: number;
        average: number;
        min: number;
        max: number;
        median: number;
    } | null;
    /**
     * Get all performance statistics
     */
    static getAllStats(): Record<string, ReturnType<typeof PerformanceMonitor.getStats>>;
    /**
     * Clear all measurements
     */
    static clear(): void;
}
