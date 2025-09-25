/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Test Coverage Reporting and Validation Suite
 *
 * Comprehensive coverage analysis, reporting, and validation for the
 * autonomous task management system. Ensures all critical code paths,
 * error scenarios, and edge cases are thoroughly tested.
 *
 * Coverage areas:
 * - Code coverage analysis (line, branch, function, statement)
 * - Path coverage validation
 * - Error scenario coverage
 * - Performance benchmark coverage
 * - Security testing coverage
 * - Documentation coverage
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TaskFactories, MockTaskStore, TestUtilities, PerformanceMetrics, CoverageAnalyzer, ReportGenerator, } from './utils/TestFactories';
import fs from 'node:fs/promises';
import path from 'node:path';
describe('Test Coverage Reporting and Validation', () => {
    let taskStore;
    let performanceMetrics;
    let coverageAnalyzer;
    let reportGenerator;
    beforeEach(() => {
        taskStore = new MockTaskStore();
        performanceMetrics = new PerformanceMetrics();
        coverageAnalyzer = new CoverageAnalyzer();
        reportGenerator = new ReportGenerator();
        vi.clearAllMocks();
    });
    afterEach(() => {
        performanceMetrics.stop();
        coverageAnalyzer.cleanup();
    });
    describe('Code Coverage Analysis', () => {
        it('should achieve >95% line coverage for core components', async () => {
            const coreComponents = [
                'TaskExecutionEngine',
                'TaskPersistence',
                'DependencyResolver',
                'TaskPriorityScheduler',
                'ExecutionMonitoringSystem',
            ];
            const coverageResults = await Promise.all(coreComponents.map((component) => coverageAnalyzer.analyzeLineCoverage(component)));
            coverageResults.forEach((coverage, index) => {
                const component = coreComponents[index];
                expect(coverage.lineCoverage).toBeGreaterThan(95);
                expect(coverage.uncoveredLines.length).toBeLessThan(coverage.totalLines * 0.05);
                // Log coverage details for manual review
                console.log(`${component} Line Coverage:`, {
                    coverage: `${coverage.lineCoverage}%`,
                    lines: `${coverage.coveredLines}/${coverage.totalLines}`,
                    uncovered: coverage.uncoveredLines.slice(0, 5), // First 5 uncovered lines
                });
            });
        });
        it('should achieve >90% branch coverage for decision points', async () => {
            const branchCoverageAnalysis = await coverageAnalyzer.analyzeBranchCoverage({
                components: ['TaskExecutionEngine', 'DependencyResolver'],
                includeErrorPaths: true,
                includeEdgeCases: true,
            });
            expect(branchCoverageAnalysis.overallBranchCoverage).toBeGreaterThan(90);
            branchCoverageAnalysis.componentCoverage.forEach((component) => {
                expect(component.branchCoverage).toBeGreaterThan(85);
                expect(component.uncoveredBranches.length).toBeLessThan(component.totalBranches * 0.15);
                // Verify critical decision points are covered
                component.criticalBranches.forEach((branch) => {
                    expect(branch.covered).toBe(true);
                });
            });
        });
        it('should achieve 100% function coverage for public APIs', async () => {
            const publicApiFunctions = await coverageAnalyzer.identifyPublicApiFunctions();
            const functionCoverage = await coverageAnalyzer.analyzeFunctionCoverage({
                functions: publicApiFunctions,
                includePrivateMethods: false,
            });
            expect(functionCoverage.overallCoverage).toBe(100);
            functionCoverage.uncoveredFunctions.forEach((func) => {
                // All uncovered functions should be documented exceptions
                expect(func.isDeprecated || func.isInternal || func.isTesting).toBe(true);
            });
        });
        it('should validate statement coverage for complex operations', async () => {
            const complexOperations = [
                'TaskDependencyResolution',
                'ResourceAllocationAlgorithm',
                'TaskPriorityScheduling',
                'ErrorRecoveryMechanisms',
            ];
            const statementCoverage = await coverageAnalyzer.analyzeStatementCoverage({
                operations: complexOperations,
                includeAsyncPaths: true,
                includeErrorHandling: true,
            });
            complexOperations.forEach((operation) => {
                const coverage = statementCoverage.find((c) => c.operation === operation);
                expect(coverage.statementCoverage).toBeGreaterThan(92);
                expect(coverage.asyncPathsCovered).toBeGreaterThan(85);
                expect(coverage.errorHandlingCovered).toBeGreaterThan(95);
            });
        });
    });
    describe('Path Coverage Validation', () => {
        it('should validate all critical execution paths are tested', async () => {
            const criticalPaths = [
                'task_creation_to_completion',
                'dependency_resolution_chain',
                'error_recovery_workflow',
                'resource_allocation_lifecycle',
                'priority_scheduling_algorithm',
            ];
            const pathCoverage = await coverageAnalyzer.analyzePathCoverage({
                paths: criticalPaths,
                includeExceptionPaths: true,
                validateEndToEnd: true,
            });
            criticalPaths.forEach((path) => {
                const coverage = pathCoverage.find((p) => p.path === path);
                expect(coverage.covered).toBe(true);
                expect(coverage.testCases.length).toBeGreaterThan(0);
                expect(coverage.endToEndValidation).toBe(true);
                // Verify exception paths are also covered
                coverage.exceptionPaths.forEach((exceptionPath) => {
                    expect(exceptionPath.covered).toBe(true);
                });
            });
        });
        it('should identify and test rare execution paths', async () => {
            const rarePathAnalysis = await coverageAnalyzer.identifyRarePaths({
                minExecutionProbability: 0.01, // Paths that occur <1% of time
                includeErrorScenarios: true,
                includeEdgeCases: true,
            });
            expect(rarePathAnalysis.identifiedPaths.length).toBeGreaterThan(0);
            for (const rarePath of rarePathAnalysis.identifiedPaths) {
                const pathTestResult = await coverageAnalyzer.testRarePath(rarePath.pathId);
                expect(pathTestResult.tested).toBe(true);
                expect(pathTestResult.testCases.length).toBeGreaterThan(0);
                // Rare paths should have at least one specific test
                expect(pathTestResult.dedicatedTests.length).toBeGreaterThan(0);
            }
        });
        it('should validate complex state transition coverage', async () => {
            const stateTransitions = [
                { from: 'pending', to: 'in_progress' },
                { from: 'in_progress', to: 'completed' },
                { from: 'in_progress', to: 'failed' },
                { from: 'in_progress', to: 'paused' },
                { from: 'paused', to: 'in_progress' },
                { from: 'failed', to: 'pending' }, // Retry
                { from: 'completed', to: 'archived' },
            ];
            const transitionCoverage = await coverageAnalyzer.analyzeStateTransitionCoverage({
                transitions: stateTransitions,
                includeInvalidTransitions: true,
                validateTransitionConditions: true,
            });
            stateTransitions.forEach((transition) => {
                const coverage = transitionCoverage.validTransitions.find((t) => t.from === transition.from && t.to === transition.to);
                expect(coverage).toBeDefined();
                expect(coverage.tested).toBe(true);
                expect(coverage.testCases.length).toBeGreaterThan(0);
            });
            // Verify invalid transitions are also tested
            expect(transitionCoverage.invalidTransitions.length).toBeGreaterThan(0);
            transitionCoverage.invalidTransitions.forEach((invalidTransition) => {
                expect(invalidTransition.tested).toBe(true);
                expect(invalidTransition.properlyRejected).toBe(true);
            });
        });
    });
    describe('Error Scenario Coverage', () => {
        it('should validate all error conditions are tested', async () => {
            const errorScenarios = [
                'task_creation_failure',
                'dependency_resolution_error',
                'resource_allocation_failure',
                'execution_timeout',
                'memory_exhaustion',
                'disk_space_shortage',
                'network_connectivity_loss',
                'database_connection_failure',
                'circular_dependency_detection',
                'invalid_task_configuration',
            ];
            const errorCoverage = await coverageAnalyzer.analyzeErrorScenarioCoverage({
                scenarios: errorScenarios,
                includeRecoveryMechanisms: true,
                validateErrorMessages: true,
            });
            errorScenarios.forEach((scenario) => {
                const coverage = errorCoverage.find((c) => c.scenario === scenario);
                expect(coverage.tested).toBe(true);
                expect(coverage.testCases.length).toBeGreaterThan(0);
                expect(coverage.recoveryTested).toBe(true);
                expect(coverage.errorMessageValidated).toBe(true);
            });
            // Overall error coverage should be comprehensive
            expect(errorCoverage.length).toBe(errorScenarios.length);
            expect(errorCoverage.every((c) => c.tested)).toBe(true);
        });
        it('should validate exception handling coverage', async () => {
            const exceptionTypes = [
                'TypeError',
                'ReferenceError',
                'RangeError',
                'OutOfMemoryError',
                'TimeoutError',
                'NetworkError',
                'ValidationError',
                'ConfigurationError',
            ];
            const exceptionCoverage = await coverageAnalyzer.analyzeExceptionHandling({
                exceptionTypes,
                includeNestedExceptions: true,
                validateCleanup: true,
            });
            exceptionTypes.forEach((exceptionType) => {
                const coverage = exceptionCoverage.find((c) => c.type === exceptionType);
                expect(coverage.caught).toBe(true);
                expect(coverage.handledGracefully).toBe(true);
                expect(coverage.resourcesCleanedUp).toBe(true);
                expect(coverage.testCases.length).toBeGreaterThan(0);
            });
        });
        it('should validate edge case error combinations', async () => {
            const errorCombinations = [
                ['memory_exhaustion', 'disk_space_shortage'],
                ['network_failure', 'database_unavailable'],
                ['timeout', 'resource_contention'],
                ['circular_dependency', 'invalid_configuration'],
            ];
            const combinationCoverage = await coverageAnalyzer.analyzeErrorCombinations({
                combinations: errorCombinations,
                simulateRealWorldScenarios: true,
            });
            errorCombinations.forEach((combination) => {
                const coverage = combinationCoverage.find((c) => c.combination.every((error) => combination.includes(error)));
                expect(coverage.tested).toBe(true);
                expect(coverage.systemRemainedStable).toBe(true);
                expect(coverage.gracefulDegradation).toBe(true);
            });
        });
    });
    describe('Performance Benchmark Coverage', () => {
        it('should validate performance testing completeness', async () => {
            const performanceScenarios = [
                'single_task_execution',
                'concurrent_task_execution',
                'bulk_task_operations',
                'dependency_resolution_performance',
                'memory_usage_optimization',
                'cpu_utilization_efficiency',
                'io_throughput_benchmarks',
            ];
            const performanceCoverage = await coverageAnalyzer.analyzePerformanceTestCoverage({
                scenarios: performanceScenarios,
                requireBenchmarks: true,
                requireOptimizationTests: true,
            });
            performanceScenarios.forEach((scenario) => {
                const coverage = performanceCoverage.find((c) => c.scenario === scenario);
                expect(coverage.benchmarked).toBe(true);
                expect(coverage.optimizationTested).toBe(true);
                expect(coverage.regressionTests.length).toBeGreaterThan(0);
                expect(coverage.performanceThresholds).toBeDefined();
            });
        });
        it('should validate stress test coverage', async () => {
            const stressTestScenarios = [
                'high_task_volume',
                'memory_pressure',
                'cpu_saturation',
                'io_bottlenecks',
                'concurrent_user_simulation',
                'resource_exhaustion',
            ];
            const stressTestCoverage = await coverageAnalyzer.analyzeStressTestCoverage({
                scenarios: stressTestScenarios,
                requireBreakingPoints: true,
                requireRecoveryTests: true,
            });
            stressTestScenarios.forEach((scenario) => {
                const coverage = stressTestCoverage.find((c) => c.scenario === scenario);
                expect(coverage.breakingPointFound).toBe(true);
                expect(coverage.recoveryTested).toBe(true);
                expect(coverage.gracefulDegradationValidated).toBe(true);
                expect(coverage.monitoringVerified).toBe(true);
            });
        });
    });
    describe('Security Testing Coverage', () => {
        it('should validate security vulnerability testing', async () => {
            const securityVulnerabilities = [
                'sql_injection',
                'xss_attacks',
                'privilege_escalation',
                'resource_exhaustion_attacks',
                'timing_attacks',
                'data_exposure',
                'unauthorized_access',
            ];
            const securityCoverage = await coverageAnalyzer.analyzeSecurityTestCoverage({
                vulnerabilities: securityVulnerabilities,
                includeDefenseMechanisms: true,
                validateSecurityControls: true,
            });
            securityVulnerabilities.forEach((vulnerability) => {
                const coverage = securityCoverage.find((c) => c.vulnerability === vulnerability);
                expect(coverage.tested).toBe(true);
                expect(coverage.defenseMechanismValidated).toBe(true);
                expect(coverage.securityControlsVerified).toBe(true);
                expect(coverage.penetrationTested).toBe(true);
            });
        });
        it('should validate access control testing coverage', async () => {
            const accessControlScenarios = [
                'unauthorized_task_creation',
                'unauthorized_task_modification',
                'unauthorized_data_access',
                'privilege_escalation_attempts',
                'session_management_attacks',
            ];
            const accessControlCoverage = await coverageAnalyzer.analyzeAccessControlCoverage({
                scenarios: accessControlScenarios,
                includeRoleBasedTests: true,
                validatePermissionBoundaries: true,
            });
            accessControlScenarios.forEach((scenario) => {
                const coverage = accessControlCoverage.find((c) => c.scenario === scenario);
                expect(coverage.tested).toBe(true);
                expect(coverage.properlyBlocked).toBe(true);
                expect(coverage.auditLogCreated).toBe(true);
                expect(coverage.alertGenerated).toBe(true);
            });
        });
    });
    describe('Documentation Coverage', () => {
        it('should validate API documentation coverage', async () => {
            const publicApiFunctions = await coverageAnalyzer.identifyPublicApiFunctions();
            const documentationCoverage = await coverageAnalyzer.analyzeDocumentationCoverage({
                functions: publicApiFunctions,
                requireExamples: true,
                requireParameterDocs: true,
                requireReturnValueDocs: true,
            });
            expect(documentationCoverage.overallCoverage).toBeGreaterThan(95);
            documentationCoverage.functions.forEach((func) => {
                expect(func.documented).toBe(true);
                expect(func.hasExamples).toBe(true);
                expect(func.parametersDocumented).toBe(true);
                expect(func.returnValueDocumented).toBe(true);
            });
        });
        it('should validate test documentation coverage', async () => {
            const testSuites = [
                'TaskExecutionEngine.test.ts',
                'TaskPersistence.test.ts',
                'DependencyResolver.test.ts',
                'TaskPriorityScheduler.test.ts',
                'ExecutionMonitoringSystem.test.ts',
            ];
            const testDocCoverage = await coverageAnalyzer.analyzeTestDocumentation({
                testSuites,
                requireTestDescriptions: true,
                requireSetupDocumentation: true,
                requireAssertionExplanations: true,
            });
            testSuites.forEach((suite) => {
                const coverage = testDocCoverage.find((c) => c.suite === suite);
                expect(coverage.testDescriptionsComplete).toBe(true);
                expect(coverage.setupDocumented).toBe(true);
                expect(coverage.assertionsExplained).toBe(true);
                expect(coverage.overallDocumentationScore).toBeGreaterThan(90);
            });
        });
    });
    describe('Coverage Report Generation', () => {
        it('should generate comprehensive HTML coverage reports', async () => {
            const htmlReport = await reportGenerator.generateHTMLReport({
                includeLineCoverage: true,
                includeBranchCoverage: true,
                includeFunctionCoverage: true,
                includePathCoverage: true,
                includePerformanceMetrics: true,
                includeSecurityAnalysis: true,
            });
            expect(htmlReport.generated).toBe(true);
            expect(htmlReport.filePath).toMatch(/\.html$/);
            // Verify report content
            const reportContent = await fs.readFile(htmlReport.filePath, 'utf-8');
            expect(reportContent).toContain('<html');
            expect(reportContent).toContain('Coverage Report');
            expect(reportContent).toContain('Line Coverage');
            expect(reportContent).toContain('Branch Coverage');
            expect(reportContent).toContain('Performance Metrics');
            expect(reportContent).toContain('Security Analysis');
        });
        it('should generate detailed JSON coverage reports', async () => {
            const jsonReport = await reportGenerator.generateJSONReport({
                includeRawData: true,
                includeMetadata: true,
                includeTimestamps: true,
                includeEnvironmentInfo: true,
            });
            expect(jsonReport.generated).toBe(true);
            expect(jsonReport.filePath).toMatch(/\.json$/);
            // Verify report structure
            const reportData = JSON.parse(await fs.readFile(jsonReport.filePath, 'utf-8'));
            expect(reportData).toHaveProperty('metadata');
            expect(reportData).toHaveProperty('coverage');
            expect(reportData).toHaveProperty('performance');
            expect(reportData).toHaveProperty('security');
            expect(reportData).toHaveProperty('timestamp');
            expect(reportData).toHaveProperty('environment');
            expect(reportData.coverage.line.overall).toBeGreaterThan(95);
            expect(reportData.coverage.branch.overall).toBeGreaterThan(90);
            expect(reportData.coverage.function.overall).toBe(100);
        });
        it('should generate executive summary reports', async () => {
            const executiveSummary = await reportGenerator.generateExecutiveSummary({
                includeHighlights: true,
                includeRecommendations: true,
                includeRiskAssessment: true,
                includeQualityMetrics: true,
            });
            expect(executiveSummary.generated).toBe(true);
            const summary = executiveSummary.data;
            expect(summary.overallTestingScore).toBeGreaterThan(95);
            expect(summary.criticalIssues).toHaveLength(0);
            expect(summary.riskLevel).toBe('LOW');
            expect(summary.recommendations).toBeInstanceOf(Array);
            expect(summary.qualityMetrics.defectDetectionRate).toBeGreaterThan(95);
            expect(summary.qualityMetrics.testReliability).toBeGreaterThan(99);
        });
        it('should generate trend analysis reports', async () => {
            // Simulate historical coverage data
            const historicalData = Array.from({ length: 30 }, (_, i) => ({
                date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000),
                lineCoverage: 90 + Math.random() * 10,
                branchCoverage: 85 + Math.random() * 10,
                testCount: 100 + i * 2,
                passRate: 95 + Math.random() * 5,
            }));
            const trendReport = await reportGenerator.generateTrendAnalysis({
                historicalData,
                analyzePeriod: 30, // 30 days
                includeProjections: true,
                identifyPatterns: true,
            });
            expect(trendReport.generated).toBe(true);
            expect(trendReport.trends.coverageImprovement).toBeDefined();
            expect(trendReport.trends.testGrowth).toBeDefined();
            expect(trendReport.patterns.length).toBeGreaterThan(0);
            expect(trendReport.projections.nextMonthCoverage).toBeGreaterThan(95);
        });
    });
    describe('Coverage Validation and Thresholds', () => {
        it('should enforce minimum coverage thresholds', async () => {
            const coverageThresholds = {
                line: 95,
                branch: 90,
                function: 100,
                statement: 95,
                path: 85,
            };
            const thresholdValidation = await coverageAnalyzer.validateThresholds({
                thresholds: coverageThresholds,
                strictMode: true,
                failOnViolation: false, // For testing
            });
            Object.entries(coverageThresholds).forEach(([type, threshold]) => {
                const validation = thresholdValidation.results.find((r) => r.type === type);
                expect(validation.currentCoverage).toBeGreaterThanOrEqual(threshold);
                expect(validation.thresholdMet).toBe(true);
                expect(validation.status).toBe('PASS');
            });
            expect(thresholdValidation.allThresholdsMet).toBe(true);
            expect(thresholdValidation.overallStatus).toBe('PASS');
        });
        it('should identify coverage gaps and provide recommendations', async () => {
            const gapAnalysis = await coverageAnalyzer.analyzeCoverageGaps({
                identifyUncoveredCode: true,
                prioritizeByRisk: true,
                suggestTestCases: true,
                estimateEffort: true,
            });
            expect(gapAnalysis.completed).toBe(true);
            if (gapAnalysis.gaps.length > 0) {
                gapAnalysis.gaps.forEach((gap) => {
                    expect(gap).toHaveProperty('location');
                    expect(gap).toHaveProperty('riskLevel');
                    expect(gap).toHaveProperty('suggestedTests');
                    expect(gap).toHaveProperty('estimatedEffort');
                    expect(gap.riskLevel).toMatch(/^(LOW|MEDIUM|HIGH|CRITICAL)$/);
                });
            }
            expect(gapAnalysis.recommendations).toBeInstanceOf(Array);
            expect(gapAnalysis.totalEstimatedEffort).toBeGreaterThanOrEqual(0);
        });
        it('should validate test quality metrics', async () => {
            const qualityMetrics = await coverageAnalyzer.analyzeTestQuality({
                evaluateTestMaintainability: true,
                evaluateTestReliability: true,
                evaluateTestPerformance: true,
                evaluateTestCoverage: true,
            });
            expect(qualityMetrics.overallScore).toBeGreaterThan(90);
            expect(qualityMetrics.maintainabilityScore).toBeGreaterThan(85);
            expect(qualityMetrics.reliabilityScore).toBeGreaterThan(95);
            expect(qualityMetrics.performanceScore).toBeGreaterThan(80);
            expect(qualityMetrics.coverageScore).toBeGreaterThan(95);
            // Quality should meet enterprise standards
            expect(qualityMetrics.meetsEnterpriseStandards).toBe(true);
            expect(qualityMetrics.productionReadiness).toBe(true);
        });
    });
    describe('Integration with CI/CD Pipeline', () => {
        it('should generate pipeline-compatible coverage reports', async () => {
            const pipelineReport = await reportGenerator.generatePipelineReport({
                format: 'junit',
                includeFailures: true,
                includeCoverage: true,
                includeMetrics: true,
            });
            expect(pipelineReport.generated).toBe(true);
            expect(pipelineReport.format).toBe('junit');
            // Verify JUnit XML format
            const xmlContent = await fs.readFile(pipelineReport.filePath, 'utf-8');
            expect(xmlContent).toContain('<testsuite');
            expect(xmlContent).toContain('<testcase');
            expect(xmlContent).toContain('coverage=');
        });
        it('should provide coverage gates for deployment', async () => {
            const coverageGates = await coverageAnalyzer.evaluateCoverageGates({
                gates: [
                    { type: 'line', threshold: 95, blocking: true },
                    { type: 'branch', threshold: 90, blocking: true },
                    { type: 'function', threshold: 100, blocking: true },
                    { type: 'security', threshold: 100, blocking: true },
                    { type: 'performance', threshold: 90, blocking: false },
                ],
            });
            expect(coverageGates.allBlockingGatesPassed).toBe(true);
            expect(coverageGates.deploymentApproved).toBe(true);
            coverageGates.results.forEach((gate) => {
                if (gate.blocking) {
                    expect(gate.passed).toBe(true);
                }
            });
        });
        it('should support multiple reporting formats for different tools', async () => {
            const formats = ['json', 'xml', 'html', 'lcov', 'cobertura'];
            const multiFormatReports = await Promise.all(formats.map((format) => reportGenerator.generateReport({
                format,
                outputPath: `coverage/report.${format}`,
            })));
            multiFormatReports.forEach((report, index) => {
                const format = formats[index];
                expect(report.generated).toBe(true);
                expect(report.format).toBe(format);
                expect(report.filePath).toContain(format);
            });
            // Verify all formats contain equivalent coverage data
            const coverageValues = multiFormatReports.map((r) => r.data.overallCoverage);
            const uniqueValues = [...new Set(coverageValues)];
            expect(uniqueValues.length).toBe(1); // All should have same coverage value
        });
    });
});
// Additional utility functions for coverage testing
export class CoverageTestUtilities {
    static async validateMinimumCoverageRequirements() {
        const requirements = {
            lineCoverage: 95,
            branchCoverage: 90,
            functionCoverage: 100,
            pathCoverage: 85,
            errorScenarioCoverage: 100,
            securityTestCoverage: 100,
        };
        const coverageAnalyzer = new CoverageAnalyzer();
        const results = await coverageAnalyzer.validateThresholds({
            thresholds: requirements,
            strictMode: true,
        });
        return results.allThresholdsMet;
    }
    static async generateFinalCoverageReport() {
        const reportGenerator = new ReportGenerator();
        const finalReport = await reportGenerator.generateComprehensiveReport({
            includeAllMetrics: true,
            includeExecutiveSummary: true,
            includeRecommendations: true,
            includeHistoricalComparison: true,
            generateCharts: true,
        });
        return finalReport.filePath;
    }
    static async validateProductionReadiness() {
        const coverageAnalyzer = new CoverageAnalyzer();
        const readinessCheck = await coverageAnalyzer.assessProductionReadiness({
            requireFullCoverage: true,
            requirePerformanceTests: true,
            requireSecurityTests: true,
            requireStressTests: true,
            requireDocumentation: true,
        });
        return {
            ready: readinessCheck.ready,
            blockers: readinessCheck.blockers || [],
            recommendations: readinessCheck.recommendations || [],
        };
    }
}
//# sourceMappingURL=CoverageReporting.test.js.map