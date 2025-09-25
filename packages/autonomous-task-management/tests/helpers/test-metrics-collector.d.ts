/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Advanced Test Metrics Collector
 *
 * This class provides comprehensive test metrics collection capabilities including:
 * - Test execution metrics (duration, success rate, failure patterns)
 * - Performance metrics (memory usage, CPU utilization, throughput)
 * - Quality metrics (coverage, code complexity, maintainability)
 * - Trend analysis over time
 * - Anomaly detection
 * - Automated insights and recommendations
 */
export declare class TestMetricsCollector {
    private outputDir;
    private metrics;
    private startTime;
    private memorySnapshots;
    private performanceMarkers;
    private testResults;
    constructor(outputDir?: string);
    private ensureOutputDirectory;
    private getEnvironmentInfo;
    private startMonitoring;
    /**
     * Mark the start of a test execution
     */
    markTestStart(testName: string, metadata?: any): void;
    /**
     * Mark the end of a test execution
     */
    markTestEnd(testName: string, status: 'passed' | 'failed' | 'skipped', error?: Error): void;
    /**
     * Record performance benchmark results
     */
    recordBenchmark(name: string, results: BenchmarkResult): void;
    /**
     * Record coverage information
     */
    recordCoverage(coverage: CoverageData): void;
    /**
     * Record code complexity metrics
     */
    recordComplexity(complexity: ComplexityData): void;
    /**
     * Add custom insight or observation
     */
    addInsight(insight: Insight): void;
    /**
     * Add performance anomaly
     */
    addAnomaly(anomaly: Anomaly): void;
    /**
     * Generate automated recommendations based on collected metrics
     */
    private generateRecommendations;
    /**
     * Detect performance anomalies
     */
    private detectAnomalies;
    /**
     * Load historical metrics for trend analysis
     */
    private loadHistoricalMetrics;
    /**
     * Analyze trends in metrics over time
     */
    private analyzeTrends;
    /**
     * Calculate trend (positive = improving, negative = degrading)
     */
    private calculateTrend;
    /**
     * Finalize metrics collection and generate insights
     */
    private finalizeMetrics;
    /**
     * Save metrics to file
     */
    saveMetrics(filename?: string): Promise<void>;
    /**
     * Generate comprehensive metrics dashboard HTML
     */
    generateDashboard(): Promise<void>;
    /**
     * Get current metrics snapshot
     */
    getMetrics(): TestMetrics;
}
export interface TestMetrics {
    timestamp: string;
    environment: EnvironmentInfo;
    execution: ExecutionMetrics;
    performance: PerformanceMetrics;
    quality: QualityMetrics;
    trends: TrendAnalysis;
    anomalies: Anomaly[];
    insights: Insight[];
    recommendations: Recommendation[];
    benchmarks?: Record<string, BenchmarkResult & {
        timestamp: string;
    }>;
}
export interface EnvironmentInfo {
    nodeVersion: string;
    platform: string;
    architecture: string;
    cpuCount: number;
    totalMemory: number;
    freeMemory: number;
    ci: boolean;
    testEnvironment: string;
}
export interface ExecutionMetrics {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    skippedTests: number;
    totalDuration: number;
    averageDuration: number;
    slowestTest: TestTiming | null;
    fastestTest: TestTiming | null;
}
export interface PerformanceMetrics {
    memoryUsage: {
        initial: number;
        peak: number;
        final: number;
        average: number;
    };
    cpuUsage: {
        average: number;
        peak: number;
    };
    throughput: {
        testsPerSecond: number;
        operationsPerSecond: number;
    };
}
export interface QualityMetrics {
    coverage: {
        statements: number;
        branches: number;
        functions: number;
        lines: number;
    };
    complexity: {
        average: number;
        highest: number;
        distribution: Record<string, number>;
    };
    maintainability: {
        score: number;
        issues: string[];
    };
}
export interface TrendAnalysis {
    historical: TestMetrics[];
    predictions: {
        testCount: TrendPrediction;
        averageDuration: TrendPrediction;
        failureRate: TrendPrediction;
        coverage: TrendPrediction;
    } | null;
}
export interface TrendPrediction {
    direction: 'improving' | 'degrading' | 'stable';
    confidence: number;
    change: number;
}
export interface TestTiming {
    name: string;
    duration: number;
}
export interface TestResult {
    name: string;
    startTime: number;
    endTime: number;
    duration: number;
    status: 'running' | 'passed' | 'failed' | 'skipped';
    memoryBefore: number;
    memoryAfter: number;
    metadata: any;
    error?: Error;
}
export interface BenchmarkResult {
    throughput?: number;
    latency?: number;
    memoryUsage?: number;
    iterations?: number;
    duration?: number;
}
export interface CoverageData {
    statements?: {
        pct: number;
    };
    branches?: {
        pct: number;
    };
    functions?: {
        pct: number;
    };
    lines?: {
        pct: number;
    };
}
export interface ComplexityData {
    average?: number;
    highest?: number;
    distribution?: Record<string, number>;
}
export interface Insight {
    type: 'performance' | 'quality' | 'reliability' | 'trend';
    severity: 'low' | 'medium' | 'high';
    category: string;
    message: string;
    data?: any;
    timestamp?: string;
}
export interface Anomaly {
    type: 'performance' | 'memory' | 'reliability';
    severity: 'low' | 'medium' | 'high' | 'critical';
    category: string;
    description: string;
    value: number;
    threshold: number;
    timestamp?: string;
}
export interface Recommendation {
    type: 'performance' | 'memory' | 'quality' | 'reliability';
    severity: 'low' | 'medium' | 'high' | 'critical';
    category: string;
    message: string;
    suggestion: string;
    impact: string;
}
