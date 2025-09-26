/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { ContextItem, ContextWindow, ContextSections } from './types.js';
/**
 * Configuration for context window management
 */
export interface ContextWindowConfig {
    /** Total context window size in tokens */
    totalTokens: number;
    /** Section allocation percentages (must sum to 1.0) */
    sectionAllocation: {
        system: number;
        conversation: number;
        code: number;
        project: number;
        memory: number;
    };
    /** Minimum tokens to reserve for each section */
    minTokensPerSection: number;
    /** Buffer percentage to maintain (0.1 = 10% buffer) */
    bufferPercentage: number;
    /** Enable dynamic allocation based on usage patterns */
    enableDynamicAllocation: boolean;
    /** Compression threshold (compress sections above this percentage) */
    compressionThreshold: number;
}
/**
 * Default configuration for context window management
 */
export declare const DEFAULT_CONTEXT_WINDOW_CONFIG: ContextWindowConfig;
/**
 * Context allocation statistics
 */
export interface AllocationStats {
    /** Total tokens allocated */
    totalAllocated: number;
    /** Tokens by section */
    bySections: Record<string, number>;
    /** Utilization rates by section */
    utilizationRates: Record<string, number>;
    /** Sections that need compression */
    needsCompression: string[];
    /** Sections that can be expanded */
    canExpand: string[];
    /** Wasted tokens (allocated but unused) */
    wastedTokens: number;
    /** Efficiency score (0-1) */
    efficiencyScore: number;
}
/**
 * Context Window Management Engine
 *
 * The ContextWindowManager efficiently manages limited context space with intelligent allocation.
 * It dynamically adjusts context sections based on current needs, tracks token usage, and performs
 * smart eviction when space is needed.
 *
 * Key Features:
 * - Dynamic Allocation: Adjusts context sections based on usage patterns
 * - Context Budget Management: Tracks token usage across all sections
 * - Smart Eviction: Removes least important content when space needed
 * - Context Chunking: Breaks large content into manageable pieces
 * - Real-time Monitoring: Continuous usage tracking and optimization
 *
 * @example
 * ```typescript
 * const windowManager = new ContextWindowManager();
 * await windowManager.addToSection('code', codeContextItem);
 * const window = windowManager.getCurrentWindow();
 * console.log(`Using ${window.usedTokens}/${window.totalTokens} tokens`);
 * ```
 */
export declare class ContextWindowManager {
    private config;
    private contextWindow;
    private prioritizer;
    private compressor;
    private usageHistory;
    private lastOptimization;
    constructor(config?: Partial<ContextWindowConfig>);
    /**
     * Initialize an empty context window with proper section allocation
     */
    private initializeContextWindow;
    /**
     * Create a new context section with default values
     */
    private createSection;
    /**
     * Allocate tokens to sections based on configuration
     */
    private allocateTokensToSections;
    /**
     * Add content to a specific section
     */
    addToSection(sectionName: keyof ContextSections, item: ContextItem): Promise<boolean>;
    /**
     * Remove specific items from a section
     */
    removeFromSection(sectionName: keyof ContextSections, itemIds: string[]): void;
    /**
     * Optimize a specific section by compression or eviction
     */
    private optimizeSection;
    /**
     * Compress specific items within a section
     */
    private compressItemsInSection;
    /**
     * Perform global context window optimization
     */
    optimizeContextWindow(): Promise<void>;
    /**
     * Perform dynamic allocation based on usage patterns
     */
    private performDynamicAllocation;
    /**
     * Analyze section usage patterns over time
     */
    private analyzeSectionUsage;
    /**
     * Calculate usage trend (positive = increasing, negative = decreasing)
     */
    private calculateUsageTrend;
    /**
     * Record section usage for dynamic allocation
     */
    private recordSectionUsage;
    /**
     * Update context window totals after section changes
     */
    private updateContextWindowTotals;
    /**
     * Determine if optimization should be triggered
     */
    private shouldOptimize;
    /**
     * Get current context window state
     */
    getCurrentWindow(): ContextWindow;
    /**
     * Get allocation statistics for monitoring
     */
    getAllocationStats(): AllocationStats;
    /**
     * Clear all content from a specific section
     */
    clearSection(sectionName: keyof ContextSections): void;
    /**
     * Clear all content from context window
     */
    clearAll(): void;
    /**
     * Update configuration
     */
    updateConfig(newConfig: Partial<ContextWindowConfig>): void;
    /**
     * Get current configuration
     */
    getConfig(): ContextWindowConfig;
    /**
     * Export context window state for debugging
     */
    exportState(): Record<string, unknown>;
}
/**
 * Create a context window manager instance with optional configuration
 */
export declare function createContextWindowManager(config?: Partial<ContextWindowConfig>): ContextWindowManager;
