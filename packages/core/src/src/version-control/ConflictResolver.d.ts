/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { ConflictResolutionStrategy } from './types.js';
import type { MergeConflict, VCAutomationConfig, ResolutionResult, ConflictAnalysis, ResolutionReport } from './types.js';
/**
 * ConflictResolver - Intelligent merge conflict detection and resolution
 *
 * Core features:
 * - Automatic conflict detection and classification
 * - Intelligent resolution strategy selection
 * - Semantic code analysis for smart merging
 * - Custom resolution rule engine
 * - Comprehensive conflict reporting
 * - Integration with git workflows
 */
export declare class ConflictResolver {
    private config;
    private workingDir;
    private autoResolutionRules;
    private conflictHistory;
    constructor(config: VCAutomationConfig, workingDir?: string);
    /**
     * Detect and analyze all merge conflicts in the repository
     */
    detectConflicts(): Promise<MergeConflict[]>;
    /**
     * Resolve conflicts using intelligent strategies
     */
    resolveConflicts(conflicts: MergeConflict[], strategy?: ConflictResolutionStrategy): Promise<ResolutionResult[]>;
    /**
     * Analyze conflict complexity and suggest optimal resolution strategy
     */
    analyzeConflicts(conflicts: MergeConflict[]): Promise<ConflictAnalysis>;
    /**
     * Generate comprehensive conflict resolution report
     */
    generateResolutionReport(conflicts: MergeConflict[], results: ResolutionResult[], analysis: ConflictAnalysis): ResolutionReport;
    /**
     * Parse conflicts from a specific file
     */
    private parseFileConflicts;
    /**
     * Classify conflict type and determine severity
     */
    private classifyConflict;
    /**
     * Perform semantic analysis on conflict
     */
    private analyzeSemantics;
    /**
     * Automatically resolve a conflict using AI and pattern matching
     */
    private autoResolveConflict;
    /**
     * Interactive conflict resolution with user guidance
     */
    private interactiveResolveConflict;
    /**
     * Prepare manual resolution with detailed analysis
     */
    private prepareManualResolution;
    /**
     * Apply resolved content to file
     */
    private applyResolution;
    /**
     * Initialize default auto-resolution rules
     */
    private initializeDefaultRules;
    /**
     * Helper methods for conflict analysis and resolution
     */
    private extractContext;
    private findEnclosingFunction;
    private findModuleName;
    private getRepositoryId;
    private groupConflictsByType;
    private calculateConflictComplexity;
    private estimateResolutionTime;
    private selectOptimalStrategy;
    private requiresExpertReview;
    private generateRecommendations;
    private generateNextSteps;
    private calculatePerformanceScore;
    private calculateAccuracyScore;
    private calculateEfficiencyScore;
    private isImportConflict;
    private isFormatOnlyConflict;
    private isLogicConflict;
    private isDataStructureConflict;
    private calculateSeverity;
    private validateSyntax;
    private calculateSemanticSimilarity;
    private checkFunctionalEquivalence;
    private identifyRiskFactors;
    private calculateCodeComplexity;
    private analyzeDependencies;
    private findMatchingRule;
    private applyResolutionRule;
    private semanticResolution;
    private patternBasedResolution;
    private generateManualResolutionGuidance;
    private mergeImportStatements;
    private normalizeFormatting;
    private selectLatestVersion;
    private calculateFormattingScore;
    private extractVersion;
    private compareVersions;
}
