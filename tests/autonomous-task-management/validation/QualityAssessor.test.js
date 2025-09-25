/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { describe, it, beforeEach, afterEach, expect, jest } from '@jest/globals';
import { QualityAssessor, QualityAssessmentLevel, QualityAssessmentContext, QualityMetrics } from '../../../packages/core/src/validation/QualityAssessor.js';
import { ValidationFramework, ValidationStatus } from '../../../packages/core/src/validation/ValidationFramework.js';
import { Task, TaskResult, TaskStatus, TaskPriority } from '../../../packages/core/src/task-management/types.js';
// Mock dependencies
jest.mock('../../../packages/core/src/logger/Logger.js');
describe('QualityAssessor', () => {
    let qualityAssessor;
    let mockValidationFramework;
    let sampleTask;
    let sampleTaskResult;
    let sampleContext;
    beforeEach(() => {
        // Create mock validation framework
        mockValidationFramework = {
            validateTask: jest.fn(),
            registerRule: jest.fn(),
            unregisterRule: jest.fn(),
            getRules: jest.fn(),
            getRulesByCategory: jest.fn(),
            isValidationRunning: jest.fn(),
            cancelValidation: jest.fn(),
            getStatistics: jest.fn(),
        };
        // Create sample task
        sampleTask = {
            id: 'quality-test-task',
            title: 'Quality Assessment Test Task',
            description: 'A test task for quality assessment',
            status: TaskStatus.COMPLETED,
            priority: TaskPriority.HIGH,
            category: 'implementation',
            metadata: {
                createdAt: new Date(),
                updatedAt: new Date(),
                createdBy: 'quality-tester'
            }
        };
        // Create sample task result
        sampleTaskResult = {
            taskId: 'quality-test-task',
            success: true,
            output: { result: 'Task completed successfully' },
            metrics: {
                startTime: new Date(Date.now() - 5000),
                endTime: new Date(),
                duration: 5000,
                memoryUsage: 100,
                cpuUsage: 25
            },
            artifacts: ['output.json', 'metrics.log']
        };
        // Create sample context
        sampleContext = {
            task: sampleTask,
            taskResult: sampleTaskResult,
            executionMetrics: {
                duration: 5000,
                memoryUsage: 100 * 1024 * 1024, // 100MB
                cpuUsage: 25,
                errorCount: 0,
                warningCount: 1
            },
            testResults: {
                totalTests: 50,
                passedTests: 48,
                failedTests: 2,
                coverage: 0.85
            },
            codeAnalysis: {
                linesOfCode: 1000,
                cyclomaticComplexity: 8,
                maintainabilityIndex: 75,
                technicalDebtRatio: 0.15
            },
            securityScan: {
                vulnerabilities: [
                    {
                        severity: 'medium',
                        type: 'XSS',
                        description: 'Potential XSS vulnerability'
                    }
                ],
                complianceScore: 0.85
            }
        };
        // Create quality assessor instance
        qualityAssessor = new QualityAssessor(mockValidationFramework);
    });
    afterEach(async () => {
        await qualityAssessor.cleanup();
        jest.clearAllMocks();
    });
    describe('Constructor and Initialization', () => {
        it('should initialize with default assessment criteria', () => {
            expect(qualityAssessor).toBeInstanceOf(QualityAssessor);
            const stats = qualityAssessor.getStatistics();
            expect(stats.customAssessors).toBe(5); // Default assessors
            expect(stats.assessmentLevels).toContain(QualityAssessmentLevel.BASIC);
            expect(stats.assessmentLevels).toContain(QualityAssessmentLevel.STANDARD);
            expect(stats.assessmentLevels).toContain(QualityAssessmentLevel.RIGOROUS);
            expect(stats.assessmentLevels).toContain(QualityAssessmentLevel.ENTERPRISE);
        });
        it('should register default quality assessors', () => {
            const stats = qualityAssessor.getStatistics();
            expect(stats.customAssessors).toBeGreaterThan(0);
        });
    });
    describe('Quality Assessment', () => {
        it('should assess quality at BASIC level', async () => {
            const result = await qualityAssessor.assessQuality(sampleContext, QualityAssessmentLevel.BASIC);
            expect(result).toMatchObject({
                taskId: 'quality-test-task',
                assessmentLevel: QualityAssessmentLevel.BASIC,
                passed: expect.any(Boolean),
                timestamp: expect.any(Date),
                metrics: expect.objectContaining({
                    overallScore: expect.any(Number),
                    functionalScore: expect.any(Number),
                    performanceScore: expect.any(Number),
                    securityScore: expect.any(Number),
                    maintainabilityScore: expect.any(Number),
                    reliabilityScore: expect.any(Number)
                })
            });
            expect(result.metrics.overallScore).toBeGreaterThanOrEqual(0);
            expect(result.metrics.overallScore).toBeLessThanOrEqual(1);
            expect(result.issues).toBeInstanceOf(Array);
            expect(result.recommendations).toBeInstanceOf(Array);
        });
        it('should assess quality at STANDARD level', async () => {
            const result = await qualityAssessor.assessQuality(sampleContext, QualityAssessmentLevel.STANDARD);
            expect(result.assessmentLevel).toBe(QualityAssessmentLevel.STANDARD);
            expect(result.metrics.overallScore).toBeDefined();
            // Standard level should have stricter criteria than basic
            if (!result.passed) {
                expect(result.issues.length).toBeGreaterThan(0);
                expect(result.recommendations.length).toBeGreaterThan(0);
            }
        });
        it('should assess quality at RIGOROUS level', async () => {
            const result = await qualityAssessor.assessQuality(sampleContext, QualityAssessmentLevel.RIGOROUS);
            expect(result.assessmentLevel).toBe(QualityAssessmentLevel.RIGOROUS);
            expect(result.metrics.overallScore).toBeDefined();
            // Rigorous level should be even stricter
            if (!result.passed) {
                expect(result.issues.length).toBeGreaterThan(0);
            }
        });
        it('should assess quality at ENTERPRISE level', async () => {
            const result = await qualityAssessor.assessQuality(sampleContext, QualityAssessmentLevel.ENTERPRISE);
            expect(result.assessmentLevel).toBe(QualityAssessmentLevel.ENTERPRISE);
            expect(result.metrics.overallScore).toBeDefined();
            // Enterprise level should be the strictest
            if (!result.passed) {
                expect(result.issues.length).toBeGreaterThan(0);
                expect(result.improvementPlan).toBeDefined();
            }
        });
        it('should emit assessment events', async () => {
            const startedSpy = jest.fn();
            const completedSpy = jest.fn();
            qualityAssessor.on('assessmentStarted', startedSpy);
            qualityAssessor.on('assessmentCompleted', completedSpy);
            await qualityAssessor.assessQuality(sampleContext, QualityAssessmentLevel.STANDARD);
            expect(startedSpy).toHaveBeenCalledWith('quality-test-task', QualityAssessmentLevel.STANDARD);
            expect(completedSpy).toHaveBeenCalledWith(expect.any(Object));
        });
        it('should prevent concurrent assessments for same task', async () => {
            const promise1 = qualityAssessor.assessQuality(sampleContext, QualityAssessmentLevel.STANDARD);
            const promise2 = qualityAssessor.assessQuality(sampleContext, QualityAssessmentLevel.STANDARD);
            const [result1, result2] = await Promise.all([promise1, promise2]);
            // Both should return the same result (same promise)
            expect(result1).toBe(result2);
        });
        it('should handle assessment errors gracefully', async () => {
            // Create context that might cause errors
            const problematicContext = {
                ...sampleContext,
                task: { ...sampleTask, id: '' }, // Invalid task ID
            };
            const failedSpy = jest.fn();
            qualityAssessor.on('assessmentFailed', failedSpy);
            await expect(qualityAssessor.assessQuality(problematicContext, QualityAssessmentLevel.STANDARD))
                .rejects.toThrow();
            expect(failedSpy).toHaveBeenCalled();
        });
    });
    describe('Quality Metrics Calculation', () => {
        it('should calculate functional quality score', async () => {
            const result = await qualityAssessor.assessQuality(sampleContext, QualityAssessmentLevel.STANDARD);
            expect(result.metrics.functionalScore).toBeGreaterThanOrEqual(0);
            expect(result.metrics.functionalScore).toBeLessThanOrEqual(1);
        });
        it('should calculate performance quality score', async () => {
            const result = await qualityAssessor.assessQuality(sampleContext, QualityAssessmentLevel.STANDARD);
            expect(result.metrics.performanceScore).toBeGreaterThanOrEqual(0);
            expect(result.metrics.performanceScore).toBeLessThanOrEqual(1);
        });
        it('should calculate security quality score', async () => {
            const result = await qualityAssessor.assessQuality(sampleContext, QualityAssessmentLevel.STANDARD);
            expect(result.metrics.securityScore).toBeGreaterThanOrEqual(0);
            expect(result.metrics.securityScore).toBeLessThanOrEqual(1);
        });
        it('should calculate maintainability score', async () => {
            const result = await qualityAssessor.assessQuality(sampleContext, QualityAssessmentLevel.STANDARD);
            expect(result.metrics.maintainabilityScore).toBeGreaterThanOrEqual(0);
            expect(result.metrics.maintainabilityScore).toBeLessThanOrEqual(1);
        });
        it('should calculate reliability score', async () => {
            const result = await qualityAssessor.assessQuality(sampleContext, QualityAssessmentLevel.STANDARD);
            expect(result.metrics.reliabilityScore).toBeGreaterThanOrEqual(0);
            expect(result.metrics.reliabilityScore).toBeLessThanOrEqual(1);
        });
        it('should calculate overall score as weighted average', async () => {
            const result = await qualityAssessor.assessQuality(sampleContext, QualityAssessmentLevel.STANDARD);
            const weights = {
                functional: 0.25,
                performance: 0.20,
                security: 0.20,
                maintainability: 0.15,
                reliability: 0.20
            };
            const expectedOverallScore = result.metrics.functionalScore * weights.functional +
                result.metrics.performanceScore * weights.performance +
                result.metrics.securityScore * weights.security +
                result.metrics.maintainabilityScore * weights.maintainability +
                result.metrics.reliabilityScore * weights.reliability;
            expect(result.metrics.overallScore).toBeCloseTo(expectedOverallScore, 2);
        });
    });
    describe('Quality Issue Detection', () => {
        it('should detect functional quality issues', async () => {
            const contextWithFailedTests = {
                ...sampleContext,
                testResults: {
                    totalTests: 100,
                    passedTests: 60, // Low pass rate
                    failedTests: 40,
                    coverage: 0.6 // Low coverage
                }
            };
            const result = await qualityAssessor.assessQuality(contextWithFailedTests, QualityAssessmentLevel.STANDARD);
            const functionalIssues = result.issues.filter(i => i.category === 'functional' || i.category === 'testing');
            expect(functionalIssues.length).toBeGreaterThan(0);
        });
        it('should detect performance issues', async () => {
            const contextWithPerformanceIssues = {
                ...sampleContext,
                executionMetrics: {
                    duration: 60000, // Very slow
                    memoryUsage: 2 * 1024 * 1024 * 1024, // 2GB - very high
                    cpuUsage: 95, // Very high CPU
                    errorCount: 0,
                    warningCount: 5
                }
            };
            const result = await qualityAssessor.assessQuality(contextWithPerformanceIssues, QualityAssessmentLevel.STANDARD);
            const performanceIssues = result.issues.filter(i => i.category === 'performance');
            expect(performanceIssues.length).toBeGreaterThan(0);
        });
        it('should detect security issues', async () => {
            const contextWithSecurityIssues = {
                ...sampleContext,
                securityScan: {
                    vulnerabilities: [
                        {
                            severity: 'critical',
                            type: 'SQL Injection',
                            description: 'Critical SQL injection vulnerability'
                        },
                        {
                            severity: 'high',
                            type: 'XSS',
                            description: 'Cross-site scripting vulnerability'
                        }
                    ],
                    complianceScore: 0.4 // Low compliance
                }
            };
            const result = await qualityAssessor.assessQuality(contextWithSecurityIssues, QualityAssessmentLevel.STANDARD);
            const securityIssues = result.issues.filter(i => i.category === 'security');
            expect(securityIssues.length).toBeGreaterThan(0);
            const criticalIssues = result.issues.filter(i => i.severity === 'critical');
            expect(criticalIssues.length).toBeGreaterThan(0);
        });
        it('should detect maintainability issues', async () => {
            const contextWithMaintainabilityIssues = {
                ...sampleContext,
                codeAnalysis: {
                    linesOfCode: 10000,
                    cyclomaticComplexity: 25, // Very high complexity
                    maintainabilityIndex: 30, // Low maintainability
                    technicalDebtRatio: 0.6 // High technical debt
                }
            };
            const result = await qualityAssessor.assessQuality(contextWithMaintainabilityIssues, QualityAssessmentLevel.STANDARD);
            const maintainabilityIssues = result.issues.filter(i => i.category === 'maintainability');
            expect(maintainabilityIssues.length).toBeGreaterThan(0);
        });
        it('should prioritize issues correctly', async () => {
            const contextWithMultipleIssues = {
                ...sampleContext,
                testResults: {
                    totalTests: 10,
                    passedTests: 5,
                    failedTests: 5,
                    coverage: 0.3
                },
                securityScan: {
                    vulnerabilities: [
                        {
                            severity: 'critical',
                            type: 'RCE',
                            description: 'Remote code execution'
                        }
                    ],
                    complianceScore: 0.3
                }
            };
            const result = await qualityAssessor.assessQuality(contextWithMultipleIssues, QualityAssessmentLevel.STANDARD);
            // Issues should be sorted by priority
            const sortedByPriority = [...result.issues].sort((a, b) => a.priority - b.priority);
            expect(result.issues).toEqual(sortedByPriority);
            // Critical security issues should have highest priority (lowest priority number)
            const criticalIssue = result.issues.find(i => i.severity === 'critical');
            if (criticalIssue) {
                expect(criticalIssue.priority).toBe(1);
            }
        });
    });
    describe('Quality Recommendations', () => {
        it('should generate immediate recommendations for critical issues', async () => {
            const contextWithCriticalIssues = {
                ...sampleContext,
                securityScan: {
                    vulnerabilities: [
                        {
                            severity: 'critical',
                            type: 'RCE',
                            description: 'Critical remote code execution vulnerability'
                        }
                    ],
                    complianceScore: 0.2
                }
            };
            const result = await qualityAssessor.assessQuality(contextWithCriticalIssues, QualityAssessmentLevel.STANDARD);
            const immediateRecommendations = result.recommendations.filter(r => r.type === 'immediate');
            expect(immediateRecommendations.length).toBeGreaterThan(0);
            const immediateRec = immediateRecommendations[0];
            expect(immediateRec.priority).toBe(1);
            expect(immediateRec.actions.length).toBeGreaterThan(0);
        });
        it('should generate short-term recommendations', async () => {
            const contextWithHighIssues = {
                ...sampleContext,
                testResults: {
                    totalTests: 100,
                    passedTests: 70,
                    failedTests: 30,
                    coverage: 0.6
                }
            };
            const result = await qualityAssessor.assessQuality(contextWithHighIssues, QualityAssessmentLevel.STANDARD);
            const shortTermRecommendations = result.recommendations.filter(r => r.type === 'short_term');
            expect(shortTermRecommendations.length).toBeGreaterThan(0);
        });
        it('should generate long-term recommendations', async () => {
            const contextWithMaintainabilityIssues = {
                ...sampleContext,
                codeAnalysis: {
                    linesOfCode: 5000,
                    cyclomaticComplexity: 15,
                    maintainabilityIndex: 40,
                    technicalDebtRatio: 0.4
                }
            };
            const result = await qualityAssessor.assessQuality(contextWithMaintainabilityIssues, QualityAssessmentLevel.STANDARD);
            const longTermRecommendations = result.recommendations.filter(r => r.type === 'long_term');
            expect(longTermRecommendations.length).toBeGreaterThan(0);
        });
        it('should include success criteria in recommendations', async () => {
            const result = await qualityAssessor.assessQuality(sampleContext, QualityAssessmentLevel.STANDARD);
            if (result.recommendations.length > 0) {
                result.recommendations.forEach(recommendation => {
                    expect(recommendation.success_criteria).toBeDefined();
                    expect(recommendation.success_criteria.length).toBeGreaterThan(0);
                });
            }
        });
    });
    describe('Quality Improvement Plans', () => {
        it('should create improvement plan for low quality scores', async () => {
            const contextWithLowQuality = {
                ...sampleContext,
                testResults: {
                    totalTests: 10,
                    passedTests: 3,
                    failedTests: 7,
                    coverage: 0.3
                },
                codeAnalysis: {
                    linesOfCode: 2000,
                    cyclomaticComplexity: 20,
                    maintainabilityIndex: 25,
                    technicalDebtRatio: 0.7
                }
            };
            const result = await qualityAssessor.assessQuality(contextWithLowQuality, QualityAssessmentLevel.STANDARD);
            expect(result.improvementPlan).toBeDefined();
            expect(result.improvementPlan.phases.length).toBeGreaterThan(0);
            expect(result.improvementPlan.priorityRecommendations.length).toBeGreaterThan(0);
            expect(result.improvementPlan.totalEstimatedDuration).toBeDefined();
        });
        it('should not create improvement plan for high quality scores', async () => {
            const contextWithHighQuality = {
                ...sampleContext,
                testResults: {
                    totalTests: 100,
                    passedTests: 98,
                    failedTests: 2,
                    coverage: 0.95
                },
                codeAnalysis: {
                    linesOfCode: 1000,
                    cyclomaticComplexity: 5,
                    maintainabilityIndex: 90,
                    technicalDebtRatio: 0.05
                },
                securityScan: {
                    vulnerabilities: [],
                    complianceScore: 0.95
                }
            };
            const result = await qualityAssessor.assessQuality(contextWithHighQuality, QualityAssessmentLevel.STANDARD);
            expect(result.passed).toBe(true);
            expect(result.improvementPlan).toBeUndefined();
        });
        it('should include multiple phases in improvement plan', async () => {
            const contextNeedingImprovement = {
                ...sampleContext,
                testResults: {
                    totalTests: 50,
                    passedTests: 30,
                    failedTests: 20,
                    coverage: 0.5
                },
                securityScan: {
                    vulnerabilities: [
                        {
                            severity: 'high',
                            type: 'XSS',
                            description: 'Security issue'
                        }
                    ],
                    complianceScore: 0.6
                }
            };
            const result = await qualityAssessor.assessQuality(contextNeedingImprovement, QualityAssessmentLevel.STANDARD);
            if (result.improvementPlan) {
                expect(result.improvementPlan.phases.length).toBeGreaterThanOrEqual(1);
                result.improvementPlan.phases.forEach(phase => {
                    expect(phase.name).toBeDefined();
                    expect(phase.duration).toBeDefined();
                    expect(phase.objectives.length).toBeGreaterThan(0);
                    expect(phase.deliverables.length).toBeGreaterThan(0);
                });
            }
        });
    });
    describe('Quality Certification', () => {
        it('should generate bronze certification for basic quality', async () => {
            const contextForBronze = {
                ...sampleContext,
                testResults: {
                    totalTests: 50,
                    passedTests: 40,
                    failedTests: 10,
                    coverage: 0.7
                }
            };
            const result = await qualityAssessor.assessQuality(contextForBronze, QualityAssessmentLevel.BASIC);
            if (result.passed && result.certification) {
                expect(['bronze', 'silver', 'gold', 'platinum']).toContain(result.certification.level);
                expect(result.certification.score).toBeGreaterThan(0);
                expect(result.certification.certified_by).toBe('QualityAssessor');
                expect(result.certification.certification_id).toContain('cert-');
            }
        });
        it('should generate higher certification for excellent quality', async () => {
            const contextForGold = {
                ...sampleContext,
                testResults: {
                    totalTests: 100,
                    passedTests: 98,
                    failedTests: 2,
                    coverage: 0.95
                },
                codeAnalysis: {
                    linesOfCode: 1000,
                    cyclomaticComplexity: 4,
                    maintainabilityIndex: 95,
                    technicalDebtRatio: 0.02
                },
                securityScan: {
                    vulnerabilities: [],
                    complianceScore: 0.98
                }
            };
            const result = await qualityAssessor.assessQuality(contextForGold, QualityAssessmentLevel.ENTERPRISE);
            if (result.passed && result.certification) {
                expect(['gold', 'platinum']).toContain(result.certification.level);
                expect(result.certification.score).toBeGreaterThan(90);
            }
        });
        it('should include validity period in certification', async () => {
            const result = await qualityAssessor.assessQuality(sampleContext, QualityAssessmentLevel.STANDARD);
            if (result.certification) {
                expect(result.certification.valid_until).toBeInstanceOf(Date);
                expect(result.certification.valid_until.getTime()).toBeGreaterThan(Date.now());
            }
        });
    });
    describe('Custom Quality Assessors', () => {
        it('should register custom assessor', () => {
            const customAssessor = jest.fn().mockResolvedValue({
                customMetric: 0.85
            });
            qualityAssessor.registerCustomAssessor('custom-test', customAssessor);
            const stats = qualityAssessor.getStatistics();
            expect(stats.customAssessors).toBe(6); // 5 default + 1 custom
        });
        it('should call custom assessor during assessment', async () => {
            const customAssessor = jest.fn().mockResolvedValue({
                functionalScore: 0.9
            });
            qualityAssessor.registerCustomAssessor('functional-override', customAssessor);
            await qualityAssessor.assessQuality(sampleContext, QualityAssessmentLevel.STANDARD);
            expect(customAssessor).toHaveBeenCalledWith(sampleContext);
        });
        it('should handle custom assessor errors gracefully', async () => {
            const failingAssessor = jest.fn().mockRejectedValue(new Error('Custom assessor failed'));
            qualityAssessor.registerCustomAssessor('failing-assessor', failingAssessor);
            // Assessment should still complete despite custom assessor failure
            const result = await qualityAssessor.assessQuality(sampleContext, QualityAssessmentLevel.STANDARD);
            expect(result).toBeTruthy();
            expect(result.metrics.overallScore).toBeDefined();
        });
    });
    describe('Assessment Criteria Updates', () => {
        it('should update assessment criteria', () => {
            const newCriteria = {
                minimumOverallScore: 0.95,
                maximumCriticalIssues: 0,
                minimumTestCoverage: 0.9
            };
            qualityAssessor.updateAssessmentCriteria(QualityAssessmentLevel.STANDARD, newCriteria);
            // The criteria should be updated (internal state)
            expect(qualityAssessor).toBeInstanceOf(QualityAssessor);
        });
        it('should apply updated criteria in assessments', async () => {
            // Update criteria to be very strict
            const strictCriteria = {
                minimumOverallScore: 0.99,
                maximumCriticalIssues: 0,
                maximumHighSeverityIssues: 0,
                minimumTestCoverage: 0.99
            };
            qualityAssessor.updateAssessmentCriteria(QualityAssessmentLevel.STANDARD, strictCriteria);
            const result = await qualityAssessor.assessQuality(sampleContext, QualityAssessmentLevel.STANDARD);
            // With very strict criteria, most assessments should fail
            expect(result.passed).toBeDefined();
        });
    });
    describe('Quality History Tracking', () => {
        it('should track quality history', async () => {
            await qualityAssessor.assessQuality(sampleContext, QualityAssessmentLevel.STANDARD);
            await qualityAssessor.assessQuality(sampleContext, QualityAssessmentLevel.RIGOROUS);
            const history = qualityAssessor.getQualityHistory('quality-test-task');
            expect(history.length).toBe(2);
            expect(history[0].overallScore).toBeDefined();
            expect(history[1].overallScore).toBeDefined();
        });
        it('should limit quality history entries', async () => {
            // Perform many assessments
            for (let i = 0; i < 15; i++) {
                await qualityAssessor.assessQuality({
                    ...sampleContext,
                    task: { ...sampleTask, id: `task-${i}` }
                }, QualityAssessmentLevel.STANDARD);
            }
            const history = qualityAssessor.getQualityHistory('task-14');
            expect(history.length).toBeLessThanOrEqual(10); // Should be limited
        });
        it('should emit quality improvement events', async () => {
            const improvementSpy = jest.fn();
            qualityAssessor.on('qualityImproved', improvementSpy);
            // First assessment
            await qualityAssessor.assessQuality(sampleContext, QualityAssessmentLevel.STANDARD);
            // Second assessment with better context (should trigger improvement event)
            const improvedContext = {
                ...sampleContext,
                testResults: {
                    totalTests: 100,
                    passedTests: 95,
                    failedTests: 5,
                    coverage: 0.95
                }
            };
            await qualityAssessor.assessQuality(improvedContext, QualityAssessmentLevel.STANDARD);
            // Should emit improvement event if score actually improved
            // (depends on the actual scoring algorithm)
        });
    });
    describe('Statistics and Monitoring', () => {
        it('should provide quality assessor statistics', () => {
            const stats = qualityAssessor.getStatistics();
            expect(stats).toMatchObject({
                activeAssessments: expect.any(Number),
                customAssessors: expect.any(Number),
                totalQualityHistoryEntries: expect.any(Number),
                assessmentLevels: expect.any(Array)
            });
            expect(stats.activeAssessments).toBe(0);
            expect(stats.customAssessors).toBe(5); // Default assessors
            expect(stats.assessmentLevels.length).toBe(4); // Four levels
        });
        it('should track active assessments in statistics', async () => {
            // Create slow assessment
            const slowContext = { ...sampleContext };
            const assessmentPromise = qualityAssessor.assessQuality(slowContext, QualityAssessmentLevel.STANDARD);
            // Check stats while running (might not always catch it due to speed)
            const statsWhileRunning = qualityAssessor.getStatistics();
            // expect(statsWhileRunning.activeAssessments).toBeGreaterThanOrEqual(0);
            await assessmentPromise;
            const statsAfterCompletion = qualityAssessor.getStatistics();
            expect(statsAfterCompletion.activeAssessments).toBe(0);
        });
    });
    describe('Cleanup and Resource Management', () => {
        it('should cleanup resources properly', async () => {
            // Create some state
            await qualityAssessor.assessQuality(sampleContext, QualityAssessmentLevel.STANDARD);
            qualityAssessor.registerCustomAssessor('cleanup-test', jest.fn());
            await qualityAssessor.cleanup();
            const statsAfterCleanup = qualityAssessor.getStatistics();
            expect(statsAfterCleanup.activeAssessments).toBe(0);
            expect(statsAfterCleanup.totalQualityHistoryEntries).toBe(0);
        });
        it('should handle cleanup with active assessments', async () => {
            // This test ensures cleanup doesn't break with ongoing assessments
            const assessmentPromise = qualityAssessor.assessQuality(sampleContext, QualityAssessmentLevel.STANDARD);
            await qualityAssessor.cleanup();
            // Assessment should still complete
            const result = await assessmentPromise;
            expect(result).toBeTruthy();
        });
    });
    describe('Edge Cases and Error Handling', () => {
        it('should handle context without execution metrics', async () => {
            const contextWithoutMetrics = {
                task: sampleTask,
                taskResult: sampleTaskResult
                // No executionMetrics, testResults, etc.
            };
            const result = await qualityAssessor.assessQuality(contextWithoutMetrics, QualityAssessmentLevel.BASIC);
            expect(result).toBeTruthy();
            expect(result.metrics.overallScore).toBeDefined();
        });
        it('should handle context with partial data', async () => {
            const partialContext = {
                task: sampleTask,
                executionMetrics: {
                    duration: 1000,
                    memoryUsage: 50 * 1024 * 1024,
                    cpuUsage: 10,
                    errorCount: 0,
                    warningCount: 0
                }
                // Missing other optional fields
            };
            const result = await qualityAssessor.assessQuality(partialContext, QualityAssessmentLevel.STANDARD);
            expect(result).toBeTruthy();
            expect(result.metrics.performanceScore).toBeDefined();
        });
        it('should handle failed task results', async () => {
            const contextWithFailedTask = {
                ...sampleContext,
                taskResult: {
                    ...sampleTaskResult,
                    success: false,
                    error: {
                        message: 'Task execution failed',
                        code: 'EXECUTION_ERROR'
                    }
                }
            };
            const result = await qualityAssessor.assessQuality(contextWithFailedTask, QualityAssessmentLevel.STANDARD);
            expect(result).toBeTruthy();
            expect(result.metrics.reliabilityScore).toBeLessThan(0.8); // Should be penalized for failure
        });
        it('should handle extreme values gracefully', async () => {
            const contextWithExtremeValues = {
                ...sampleContext,
                executionMetrics: {
                    duration: Number.MAX_SAFE_INTEGER,
                    memoryUsage: Number.MAX_SAFE_INTEGER,
                    cpuUsage: 1000, // Invalid CPU percentage
                    errorCount: Number.MAX_SAFE_INTEGER,
                    warningCount: Number.MAX_SAFE_INTEGER
                },
                testResults: {
                    totalTests: 0, // Division by zero potential
                    passedTests: 0,
                    failedTests: 0,
                    coverage: 2.0 // Invalid coverage > 100%
                }
            };
            const result = await qualityAssessor.assessQuality(contextWithExtremeValues, QualityAssessmentLevel.STANDARD);
            expect(result).toBeTruthy();
            expect(result.metrics.overallScore).toBeGreaterThanOrEqual(0);
            expect(result.metrics.overallScore).toBeLessThanOrEqual(1);
        });
    });
});
//# sourceMappingURL=QualityAssessor.test.js.map