/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { ValidationContext, ValidationResult } from '../core/ValidationEngine.js';
/**
 * Performance validation configuration
 */
export interface PerformanceValidationConfig {
    thresholds: {
        bundleSize: {
            maxSizeKB: number;
            warningSizeKB: number;
        };
        buildTime: {
            maxDurationMs: number;
            warningDurationMs: number;
        };
        testExecution: {
            maxDurationMs: number;
            warningDurationMs: number;
        };
        memoryUsage: {
            maxMB: number;
            warningMB: number;
        };
        codeComplexity: {
            maxCyclomaticComplexity: number;
            warningCyclomaticComplexity: number;
        };
    };
    enabledMetrics: {
        bundleAnalysis: boolean;
        buildPerformance: boolean;
        testPerformance: boolean;
        memoryProfiling: boolean;
        codeComplexity: boolean;
        dependencyAnalysis: boolean;
    };
    bundleAnalyzer: {
        enabled: boolean;
        outputPath: string;
    };
    benchmarkSuites: string[];
    timeout: number;
}
/**
 * Bundle analysis result
 */
export interface BundleAnalysisResult {
    totalSize: number;
    gzippedSize: number;
    modules: BundleModule[];
    chunks: BundleChunk[];
    assets: BundleAsset[];
    duplicates: DuplicateModule[];
    treeShakingOpportunities: TreeShakingOpportunity[];
}
/**
 * Bundle module
 */
export interface BundleModule {
    name: string;
    size: number;
    path: string;
    reasons: string[];
}
/**
 * Bundle chunk
 */
export interface BundleChunk {
    name: string;
    size: number;
    modules: string[];
    initial: boolean;
}
/**
 * Bundle asset
 */
export interface BundleAsset {
    name: string;
    size: number;
    type: string;
}
/**
 * Duplicate module
 */
export interface DuplicateModule {
    name: string;
    versions: string[];
    totalSize: number;
}
/**
 * Tree shaking opportunity
 */
export interface TreeShakingOpportunity {
    module: string;
    unusedExports: string[];
    potentialSavingsKB: number;
}
/**
 * Build performance metrics
 */
export interface BuildPerformanceMetrics {
    totalDuration: number;
    phases: BuildPhaseMetric[];
    parallelization: number;
    cacheHitRate: number;
    bottlenecks: PerformanceBottleneck[];
}
/**
 * Build phase metric
 */
export interface BuildPhaseMetric {
    name: string;
    duration: number;
    percentage: number;
}
/**
 * Performance bottleneck
 */
export interface PerformanceBottleneck {
    phase: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
    recommendation: string;
}
/**
 * Memory profiling result
 */
export interface MemoryProfilingResult {
    peakUsage: number;
    averageUsage: number;
    leaks: MemoryLeak[];
    gcPressure: number;
    recommendations: string[];
}
/**
 * Memory leak
 */
export interface MemoryLeak {
    location: string;
    size: number;
    type: string;
    description: string;
}
/**
 * Code complexity metrics
 */
export interface CodeComplexityMetrics {
    cyclomaticComplexity: number;
    maintainabilityIndex: number;
    linesOfCode: number;
    functions: FunctionComplexity[];
    hotspots: ComplexityHotspot[];
}
/**
 * Function complexity
 */
export interface FunctionComplexity {
    name: string;
    file: string;
    line: number;
    complexity: number;
    maintainability: number;
}
/**
 * Complexity hotspot
 */
export interface ComplexityHotspot {
    file: string;
    complexity: number;
    maintainability: number;
    recommendations: string[];
}
/**
 * Dependency analysis result
 */
export interface DependencyAnalysisResult {
    totalDependencies: number;
    productionDependencies: number;
    devDependencies: number;
    outdatedDependencies: OutdatedDependency[];
    securityVulnerabilities: number;
    licensesIssues: string[];
    bundleImpact: DependencyBundleImpact[];
}
/**
 * Outdated dependency
 */
export interface OutdatedDependency {
    name: string;
    current: string;
    wanted: string;
    latest: string;
    impactLevel: 'high' | 'medium' | 'low';
}
/**
 * Dependency bundle impact
 */
export interface DependencyBundleImpact {
    name: string;
    sizeKB: number;
    usagePercentage: number;
    alternatives: string[];
}
/**
 * Performance summary
 */
export interface PerformanceSummary {
    overallScore: number;
    bundleAnalysis?: BundleAnalysisResult;
    buildPerformance?: BuildPerformanceMetrics;
    memoryProfiling?: MemoryProfilingResult;
    codeComplexity?: CodeComplexityMetrics;
    dependencyAnalysis?: DependencyAnalysisResult;
    issues: PerformanceIssue[];
    recommendations: PerformanceRecommendation[];
}
/**
 * Performance issue
 */
export interface PerformanceIssue {
    category: 'bundle' | 'build' | 'memory' | 'complexity' | 'dependency';
    severity: 'critical' | 'high' | 'medium' | 'low';
    title: string;
    description: string;
    file?: string;
    metric: string;
    value: number;
    threshold: number;
    recommendation: string;
}
/**
 * Performance recommendation
 */
export interface PerformanceRecommendation {
    category: string;
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    estimatedImpact: string;
    effort: 'low' | 'medium' | 'high';
}
/**
 * Comprehensive performance validation system
 *
 * Features:
 * - Bundle size analysis and optimization suggestions
 * - Build performance profiling
 * - Memory usage monitoring
 * - Code complexity analysis
 * - Dependency impact assessment
 * - Performance regression detection
 * - Runtime performance benchmarking
 */
export declare class PerformanceValidator {
    private readonly logger;
    private readonly config;
    constructor(config?: Partial<PerformanceValidationConfig>);
    /**
     * Execute comprehensive performance validation
     */
    validate(context: ValidationContext): Promise<ValidationResult>;
    /**
     * Gather performance metrics based on enabled metrics
     */
    private gatherPerformanceMetrics;
    /**
     * Analyze bundle size and composition
     */
    private analyzeBundleSize;
    /**
     * Run build to generate bundle files
     */
    private runBuild;
    /**
     * Detect build command from package.json
     */
    private detectBuildCommand;
    /**
     * Find bundle files in output directory
     */
    private findBundleFiles;
    /**
     * Calculate total size of bundle files
     */
    private calculateTotalSize;
    /**
     * Run webpack bundle analyzer if available
     */
    private runWebpackBundleAnalyzer;
    /**
     * Analyze build performance
     */
    private analyzeBuildPerformance;
    /**
     * Analyze code complexity
     */
    private analyzeCodeComplexity;
    /**
     * Get source files for analysis
     */
    private getSourceFiles;
    /**
     * Calculate basic file complexity
     */
    private calculateFileComplexity;
    /**
     * Extract functions from file content
     */
    private extractFunctions;
    /**
     * Calculate function-specific complexity
     */
    private calculateFunctionComplexity;
    /**
     * Analyze dependencies
     */
    private analyzeDependencies;
    /**
     * Check for outdated dependencies
     */
    private checkOutdatedDependencies;
    /**
     * Assess impact of dependency update
     */
    private assessUpdateImpact;
    /**
     * Profile memory usage (requires special setup)
     */
    private profileMemoryUsage;
    /**
     * Analyze performance results and generate summary
     */
    private analyzePerformanceResults;
    /**
     * Calculate overall performance score
     */
    private calculateOverallPerformanceScore;
    /**
     * Calculate performance validation score
     */
    private calculatePerformanceScore;
    /**
     * Determine performance validation status
     */
    private determinePerformanceStatus;
    /**
     * Determine performance validation severity
     */
    private determinePerformanceSeverity;
    /**
     * Generate performance validation message
     */
    private generatePerformanceMessage;
    /**
     * Generate detailed performance report
     */
    private generatePerformanceDetails;
    /**
     * Generate performance improvement suggestions
     */
    private generatePerformanceSuggestions;
    /**
     * Create performance evidence artifacts
     */
    private createPerformanceEvidence;
}
