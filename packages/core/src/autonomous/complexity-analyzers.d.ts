/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { ComplexityAnalyzer, ComplexityAnalysisResult, TaskBreakdownContext } from './task-breakdown-engine.js';
/**
 * Analyzes task complexity based on linguistic patterns and keywords
 */
export declare class LinguisticComplexityAnalyzer implements ComplexityAnalyzer {
    name: string;
    analyze(request: string, _context: TaskBreakdownContext): Promise<ComplexityAnalysisResult>;
    private estimateDurationFromLinguistics;
}
/**
 * Analyzes task complexity based on filesystem and workspace context
 */
export declare class WorkspaceComplexityAnalyzer implements ComplexityAnalyzer {
    name: string;
    analyze(request: string, context: TaskBreakdownContext): Promise<ComplexityAnalysisResult>;
    private estimateDurationFromWorkspace;
}
/**
 * Analyzes task complexity based on available tools and required operations
 */
export declare class ToolComplexityAnalyzer implements ComplexityAnalyzer {
    name: string;
    analyze(request: string, context: TaskBreakdownContext): Promise<ComplexityAnalysisResult>;
    private estimateDurationFromTools;
}
/**
 * Analyzes task complexity based on dependencies and constraints
 */
export declare class DependencyComplexityAnalyzer implements ComplexityAnalyzer {
    name: string;
    analyze(request: string, context: TaskBreakdownContext): Promise<ComplexityAnalysisResult>;
    private estimateDurationFromDependencies;
}
/**
 * Creates and configures default complexity analyzers
 */
export declare function createDefaultComplexityAnalyzers(): ComplexityAnalyzer[];
