/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { CodeContextSnapshot } from './types.js';
/**
 * Configuration for code analysis
 */
export interface CodeAnalysisConfig {
    /** Maximum depth to analyze file tree */
    maxFileTreeDepth: number;
    /** File extensions to analyze for functions/classes */
    supportedExtensions: string[];
    /** Directories to exclude from analysis */
    excludedDirectories: string[];
    /** Files to exclude from analysis */
    excludedFiles: string[];
    /** Maximum file size to analyze (in bytes) */
    maxFileSize: number;
    /** Enable AST parsing for detailed analysis */
    enableAstParsing: boolean;
    /** Maximum functions to track per file */
    maxFunctionsPerFile: number;
    /** Enable test correlation analysis */
    enableTestCorrelation: boolean;
}
/**
 * Default configuration for code analysis
 */
export declare const DEFAULT_CODE_ANALYSIS_CONFIG: CodeAnalysisConfig;
/**
 * Analysis statistics
 */
export interface AnalysisStats {
    /** Total files analyzed */
    totalFiles: number;
    /** Files by extension */
    byExtension: Record<string, number>;
    /** Total functions/classes found */
    totalFunctions: number;
    /** Dependencies mapped */
    dependencyCount: number;
    /** Test files correlated */
    testFilesCorrelated: number;
    /** Analysis duration in ms */
    analysisDuration: number;
    /** Memory usage during analysis */
    memoryUsage: number;
}
/**
 * Code Context Analysis Engine
 *
 * The CodeContextAnalyzer provides deep understanding of project structure and code relationships.
 * It maps dependencies, summarizes functions/classes, tracks code changes, and correlates tests
 * with implementation for intelligent context management.
 *
 * Key Features:
 * - Dependency Graph Analysis: Maps code relationships and imports
 * - Function/Class Summarization: Generates concise summaries of code structures
 * - Change Impact Analysis: Tracks how modifications affect related code
 * - Test-Code Correlation: Links test files with implementation files
 * - Documentation Integration: Identifies and includes relevant documentation
 *
 * @example
 * ```typescript
 * const analyzer = new CodeContextAnalyzer('/path/to/project');
 * const snapshot = await analyzer.analyzeProject();
 * console.log(`Found ${snapshot.activeFunctions.length} functions`);
 * console.log(`Mapped ${Object.keys(snapshot.dependencies).length} dependencies`);
 * ```
 */
export declare class CodeContextAnalyzer {
    private config;
    private projectPath;
    private fileChangeCache;
    private dependencyCache;
    private functionCache;
    constructor(projectPath: string, config?: Partial<CodeAnalysisConfig>);
    /**
     * Analyze the entire project and create a code context snapshot
     */
    analyzeProject(): Promise<CodeContextSnapshot>;
    /**
     * Build file tree structure recursively
     */
    private buildFileTree;
    /**
     * Calculate file relevance score based on various factors
     */
    private calculateFileRelevance;
    /**
     * Extract functions and classes from the project
     */
    private extractFunctions;
    /**
     * Recursively traverse file tree to extract functions
     */
    private traverseTreeForFunctions;
    /**
     * Analyze functions in a specific file
     */
    private analyzeFunctionsInFile;
    /**
     * Parse JavaScript/TypeScript functions and classes
     */
    private parseJavaScriptFunctions;
    /**
     * Parse Python functions and classes
     */
    private parsePythonFunctions;
    /**
     * Parse Java functions and classes (simplified)
     */
    private parseJavaFunctions;
    /**
     * Parse Go functions (simplified)
     */
    private parseGoFunctions;
    /**
     * Extract parameters from function signature
     */
    private extractParameters;
    /**
     * Extract Python parameters from function signature
     */
    private extractPythonParameters;
    /**
     * Extract Go parameters from function signature
     */
    private extractGoParameters;
    /**
     * Extract nearby comments for documentation
     */
    private extractNearbyComment;
    /**
     * Extract dependencies from function context
     */
    private extractDependenciesFromFunction;
    /**
     * Extract dependencies from class context
     */
    private extractDependenciesFromClass;
    /**
     * Find the end of a function/class block
     */
    private findFunctionEnd;
    /**
     * Estimate usage count of a function/class by counting references
     */
    private estimateUsageCount;
    /**
     * Estimate line count of a function
     */
    private estimateLineCount;
    /**
     * Estimate line count of a class
     */
    private estimateClassLineCount;
    /**
     * Calculate complexity score based on code patterns
     */
    private calculateComplexity;
    /**
     * Analyze dependencies between files
     */
    private analyzeDependencies;
    /**
     * Traverse file tree to extract dependencies
     */
    private traverseTreeForDependencies;
    /**
     * Extract dependencies from a specific file
     */
    private extractFileDependencies;
    /**
     * Track recent code changes using git or file system
     */
    private trackRecentChanges;
    /**
     * Find recently modified files
     */
    private findRecentlyModifiedFiles;
    /**
     * Correlate test files with source files
     */
    private correlateTestFiles;
    /**
     * Collect files by type (test vs source)
     */
    private collectFilesByType;
    /**
     * Find source files that correlate with a test file
     */
    private findCorrelatedSourceFiles;
    /**
     * Identify currently active/relevant files
     */
    private identifyActiveFiles;
    /**
     * Find important files matching patterns
     */
    private findImportantFiles;
    /**
     * Analyze changes that affect other parts of the codebase
     */
    analyzeChangeImpact(changedFiles: string[]): Promise<{
        affectedFiles: string[];
        impactAnalysis: Record<string, string[]>;
    }>;
    /**
     * Check if a dependency is related to a changed file
     */
    private isRelatedDependency;
    /**
     * Update configuration
     */
    updateConfig(newConfig: Partial<CodeAnalysisConfig>): void;
    /**
     * Clear analysis caches
     */
    clearCaches(): void;
    /**
     * Get analysis statistics
     */
    getAnalysisStats(): AnalysisStats;
    /**
     * Get current configuration
     */
    getConfig(): CodeAnalysisConfig;
}
/**
 * Create a code context analyzer instance
 */
export declare function createCodeContextAnalyzer(projectPath: string, config?: Partial<CodeAnalysisConfig>): CodeContextAnalyzer;
