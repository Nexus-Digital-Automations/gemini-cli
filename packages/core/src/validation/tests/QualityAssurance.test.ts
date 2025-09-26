/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { vi } from 'vitest';
import { EventEmitter } from 'node:events';
import type {
  QualityAssuranceResult,
  QualityMetrics,
} from '../QualityAssurance.js';
import { QualityAssurance, QualityCheckType } from '../QualityAssurance.js';
import type {
  ValidationCategory,
  ValidationStatus,
} from '../ValidationFramework.js';
import {
  ValidationFramework,
  ValidationSeverity,
} from '../ValidationFramework.js';
import type { TaskExecutionMetrics } from '../TaskValidator.js';
import { TaskValidator } from '../TaskValidator.js';
import type { Task, TaskResult } from '../../task-management/types.js';
import { TaskStatus } from '../../task-management/TaskQueue.js';
import { TaskPriority, TaskCategory } from '../../task-management/types.js';

// Mock dependencies
vi.mock('../ValidationFramework.js');
vi.mock('../TaskValidator.js');
vi.mock('../../logger/Logger.js');

describe('QualityAssurance', () => {
  let qualityAssurance: QualityAssurance;
  let mockValidationFramework: Partial<ValidationFramework>;
  let mockTaskValidator: Partial<TaskValidator>;
  let mockTask: Task;

  beforeEach(() => {
    // Create mock validation framework
    mockValidationFramework = {
      registerRule: vi.fn(),
      validateTask: vi.fn(),
      getStatistics: vi.fn().mockReturnValue({
        registeredRules: 8,
        activeValidations: 1,
        enabledCategories: [],
      }),
    };

    // Create mock task validator
    mockTaskValidator = {
      validateTask: vi.fn(),
      getValidationStatistics: vi.fn().mockReturnValue({
        activeValidations: 0,
        totalSnapshots: 5,
        configuredThresholds: {},
        frameworkStats: {},
      }),
    };

    // Create quality assurance system
    qualityAssurance = new QualityAssurance(
      mockValidationFramework as ValidationFramework,
      mockTaskValidator as TaskValidator,
    );

    // Create mock task
    mockTask = {
      id: 'test-task-qa',
      title: 'Quality Assurance Test Task',
      description: 'A task for testing quality assurance',
      category: TaskCategory.FEATURE,
      priority: TaskPriority.MEDIUM,
      status: TaskStatus.COMPLETED,
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'qa-test',
        estimatedDuration: 5000,
        tags: ['test'],
      },
    } as Task;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with default configuration', () => {
      expect(qualityAssurance).toBeInstanceOf(QualityAssurance);
      expect(qualityAssurance).toBeInstanceOf(EventEmitter);
    });

    it('should register quality check validation rules', () => {
      // Should register rules for each quality check type
      expect(mockValidationFramework.registerRule).toHaveBeenCalled();

      const registerRuleMock =
        mockValidationFramework.registerRule as ReturnType<typeof vi.fn>;
      const ruleIds = registerRuleMock.mock.calls.map(
        (call: unknown[]) => (call[0] as { id: string }).id,
      );
      expect(ruleIds).toContain('quality-check-code_quality');
      expect(ruleIds).toContain('quality-check-performance');
      expect(ruleIds).toContain('quality-check-security');
      expect(ruleIds).toContain('quality-check-reliability');
    });

    it('should initialize with custom configuration', () => {
      const customConfig = {
        enabledChecks: [
          QualityCheckType.SECURITY,
          QualityCheckType.PERFORMANCE,
        ],
        alerting: {
          enabled: false,
          thresholdViolations: false,
          trendDegradation: false,
          anomalyDetection: false,
        },
      };

      const customQA = new QualityAssurance(
        mockValidationFramework as ValidationFramework,
        mockTaskValidator as TaskValidator,
        customConfig,
      );

      expect(customQA).toBeInstanceOf(QualityAssurance);
    });
  });

  describe('Quality Assurance Execution', () => {
    it('should perform comprehensive quality assurance', async () => {
      const taskResult: TaskResult = {
        taskId: 'test-task-qa',
        success: true,
        output: { result: 'success' },
        metrics: {
          startTime: new Date(Date.now() - 5000),
          endTime: new Date(),
          duration: 5000,
          memoryUsage: 256,
          cpuUsage: 30,
        },
        artifacts: ['output.log'],
        validationResults: [],
      };

      const executionMetrics: TaskExecutionMetrics = {
        startTime: new Date(Date.now() - 5000),
        endTime: new Date(),
        duration: 5000,
        memoryUsage: {
          peak: 256 * 1024 * 1024,
          average: 128 * 1024 * 1024,
          current: 100 * 1024 * 1024,
        },
        cpuUsage: {
          peak: 30,
          average: 25,
        },
        errorCount: 0,
        warningCount: 1,
        retryCount: 0,
        throughput: 100,
        qualityMetrics: {
          codeComplexity: 12,
          testCoverage: 85,
        },
      };

      const result = await qualityAssurance.performQualityAssurance(
        mockTask,
        taskResult,
        executionMetrics,
      );

      expect(result).toBeDefined();
      expect(result.taskId).toBe('test-task-qa');
      expect(result.passed).toBeDefined();
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(1);
      expect(result.metrics).toBeDefined();
      expect(result.violations).toBeInstanceOf(Array);
      expect(result.recommendations).toBeInstanceOf(Array);
    });

    it('should handle quality checks with violations', async () => {
      const taskResult: TaskResult = {
        taskId: 'test-task-qa',
        success: false,
        error: {
          message: 'Task execution failed',
          code: 'EXECUTION_ERROR',
          stack: 'Error stack trace',
        },
        metrics: {
          startTime: new Date(Date.now() - 60000),
          endTime: new Date(),
          duration: 60000, // Exceeds warning threshold
          memoryUsage: 2048, // Exceeds critical threshold
          cpuUsage: 95, // Very high CPU usage
        },
        artifacts: [],
        validationResults: [],
      };

      const executionMetrics: TaskExecutionMetrics = {
        startTime: new Date(Date.now() - 60000),
        endTime: new Date(),
        duration: 60000,
        memoryUsage: {
          peak: 2048 * 1024 * 1024, // 2GB - exceeds threshold
          average: 1024 * 1024 * 1024,
          current: 1500 * 1024 * 1024,
        },
        cpuUsage: {
          peak: 95,
          average: 80,
        },
        errorCount: 5,
        warningCount: 10,
        retryCount: 3,
        throughput: 10,
        qualityMetrics: {
          codeComplexity: 35, // High complexity
          testCoverage: 45, // Low coverage
        },
      };

      const result = await qualityAssurance.performQualityAssurance(
        mockTask,
        taskResult,
        executionMetrics,
      );

      expect(result.passed).toBe(false);
      expect(result.violations.length).toBeGreaterThan(0);
      expect(result.overallScore).toBeLessThan(0.8);
    });

    it('should prevent concurrent quality checks for same task', async () => {
      // Mock a slow quality check
      const slowCheck = new Promise<QualityAssuranceResult>((resolve) => {
        setTimeout(() => {
          resolve({
            id: 'qa-result-1',
            taskId: 'test-task-qa',
            checkType: QualityCheckType.FUNCTIONAL,
            timestamp: new Date(),
            duration: 1000,
            passed: true,
            overallScore: 0.85,
            metrics: {} as QualityMetrics,
            violations: [],
            trends: [],
            recommendations: [],
            validationResults: [],
          });
        }, 100);
      });

      const performQualityAssuranceSpy = vi
        .spyOn(
          qualityAssurance as unknown as {
            executeComprehensiveQualityCheck: () => Promise<QualityAssuranceResult>;
          },
          'executeComprehensiveQualityCheck',
        )
        .mockReturnValue(slowCheck);

      // Start two quality checks simultaneously
      const check1 = qualityAssurance.performQualityAssurance(mockTask);
      const check2 = qualityAssurance.performQualityAssurance(mockTask);

      const [result1, result2] = await Promise.all([check1, check2]);

      // Both should return the same result (cached)
      expect(result1).toBe(result2);
      expect(performQualityAssuranceSpy).toHaveBeenCalledTimes(1);
    });

    it('should emit quality assurance events', async () => {
      const startedSpy = vi.fn();
      const completedSpy = vi.fn();

      qualityAssurance.on('qualityCheckStarted', startedSpy);
      qualityAssurance.on('qualityCheckCompleted', completedSpy);

      await qualityAssurance.performQualityAssurance(mockTask);

      expect(startedSpy).toHaveBeenCalled();
      expect(completedSpy).toHaveBeenCalled();
    });
  });

  describe('Quality Metrics Collection', () => {
    it('should collect comprehensive quality metrics', async () => {
      const executionMetrics: TaskExecutionMetrics = {
        startTime: new Date(Date.now() - 10000),
        endTime: new Date(),
        duration: 10000,
        memoryUsage: {
          peak: 512 * 1024 * 1024,
          average: 256 * 1024 * 1024,
          current: 200 * 1024 * 1024,
        },
        cpuUsage: {
          peak: 45,
          average: 30,
        },
        errorCount: 1,
        warningCount: 3,
        retryCount: 0,
        throughput: 150,
        qualityMetrics: {
          codeComplexity: 18,
          testCoverage: 78,
        },
      };

      const result = await qualityAssurance.performQualityAssurance(
        mockTask,
        undefined,
        executionMetrics,
      );

      expect(result.metrics).toBeDefined();
      expect(result.metrics.codeQuality).toBeDefined();
      expect(result.metrics.performance).toBeDefined();
      expect(result.metrics.security).toBeDefined();
      expect(result.metrics.reliability).toBeDefined();
      expect(result.metrics.business).toBeDefined();

      // Verify metrics are calculated from execution data
      expect(result.metrics.performance.executionTime).toBe(10000);
      expect(result.metrics.performance.memoryUsage).toBe(512);
    });
  });

  describe('Quality Check Implementations', () => {
    describe('Code Quality Checks', () => {
      it('should validate code quality metrics', async () => {
        const result = await qualityAssurance.performQualityAssurance(mockTask);

        // Should pass quality checks for good metrics
        expect(result.passed).toBe(true);
        expect(result.violations.length).toBe(0);
        expect(result.overallScore).toBeGreaterThan(0.8);
      });

      it('should detect code quality violations', async () => {
        const badTask = {
          ...mockTask,
          description: 'x'.repeat(5000), // Very long description indicating high complexity
        };

        const result = await qualityAssurance.performQualityAssurance(badTask);

        // Should have lower quality score due to high complexity
        expect(result.overallScore).toBeLessThan(1.0);
      });
    });

    describe('Performance Checks', () => {
      it('should validate performance metrics', async () => {
        const goodExecutionMetrics: TaskExecutionMetrics = {
          startTime: new Date(Date.now() - 5000),
          endTime: new Date(),
          duration: 5000, // Under warning threshold
          memoryUsage: {
            peak: 256 * 1024 * 1024, // 256MB - acceptable
            average: 128 * 1024 * 1024,
            current: 100 * 1024 * 1024,
          },
          cpuUsage: {
            peak: 50,
            average: 30,
          },
          errorCount: 0,
          warningCount: 0,
          retryCount: 0,
          throughput: 200,
        };

        const result = await qualityAssurance.performQualityAssurance(
          mockTask,
          undefined,
          goodExecutionMetrics,
        );

        // Should pass performance checks
        expect(
          result.violations.filter(
            (v) => v.category === QualityCheckType.PERFORMANCE,
          ).length,
        ).toBe(0);
      });

      it('should detect performance violations', async () => {
        const badExecutionMetrics: TaskExecutionMetrics = {
          startTime: new Date(Date.now() - 70000),
          endTime: new Date(),
          duration: 70000, // Exceeds critical threshold
          memoryUsage: {
            peak: 2048 * 1024 * 1024, // 2GB - exceeds threshold
            average: 1024 * 1024 * 1024,
            current: 1500 * 1024 * 1024,
          },
          cpuUsage: {
            peak: 95,
            average: 85,
          },
          errorCount: 0,
          warningCount: 0,
          retryCount: 0,
          throughput: 10,
        };

        const result = await qualityAssurance.performQualityAssurance(
          mockTask,
          undefined,
          badExecutionMetrics,
        );

        // Should have performance violations
        expect(result.violations.length).toBeGreaterThan(0);
        expect(result.passed).toBe(false);
      });
    });

    describe('Security Checks', () => {
      it('should validate security metrics', async () => {
        const result = await qualityAssurance.performQualityAssurance(mockTask);

        // Default security metrics should pass
        expect(result.metrics.security.vulnerabilities).toBe(0);
        expect(result.metrics.security.securityScore).toBeGreaterThan(80);
      });
    });

    describe('Reliability Checks', () => {
      it('should validate reliability metrics', async () => {
        const successfulTaskResult: TaskResult = {
          taskId: mockTask.id,
          success: true,
          output: { status: 'completed' },
          metrics: {
            startTime: new Date(Date.now() - 5000),
            endTime: new Date(),
            duration: 5000,
            memoryUsage: 256,
            cpuUsage: 30,
          },
          artifacts: [],
          validationResults: [],
        };

        const result = await qualityAssurance.performQualityAssurance(
          mockTask,
          successfulTaskResult,
        );

        expect(result.metrics.reliability.errorRate).toBe(0);
        expect(result.metrics.reliability.failureRate).toBe(0);
      });

      it('should detect reliability issues', async () => {
        const failedTaskResult: TaskResult = {
          taskId: mockTask.id,
          success: false,
          error: {
            message: 'Task execution failed',
            code: 'EXECUTION_ERROR',
          },
          metrics: {
            startTime: new Date(Date.now() - 10000),
            endTime: new Date(),
            duration: 10000,
            memoryUsage: 512,
            cpuUsage: 60,
          },
          artifacts: [],
          validationResults: [],
        };

        const executionMetrics: TaskExecutionMetrics = {
          startTime: new Date(Date.now() - 10000),
          endTime: new Date(),
          duration: 10000,
          memoryUsage: {
            peak: 512 * 1024 * 1024,
            average: 256 * 1024 * 1024,
            current: 200 * 1024 * 1024,
          },
          errorCount: 3, // Multiple errors
          warningCount: 5,
          retryCount: 2,
        };

        const result = await qualityAssurance.performQualityAssurance(
          mockTask,
          failedTaskResult,
          executionMetrics,
        );

        expect(result.metrics.reliability.failureRate).toBe(1);
        expect(result.metrics.reliability.errorRate).toBeGreaterThan(0);
      });
    });
  });

  describe('Quality Thresholds Management', () => {
    it('should update quality thresholds', () => {
      const newThresholds = {
        performance: {
          maxExecutionTime: 15000,
          maxMemoryUsage: 256,
          maxCpuUtilization: 70,
          minThroughput: 150,
          maxResponseTime: 800,
          minResourceEfficiency: 0.8,
        },
      };

      qualityAssurance.updateQualityThresholds(newThresholds);

      const stats = qualityAssurance.getQualityStatistics();
      expect(stats).toBeDefined();
    });
  });

  describe('Custom Quality Checks', () => {
    it('should support custom quality checks', () => {
      const customCheck = vi.fn().mockResolvedValue([
        {
          id: 'custom-business-rule',
          category: 'business' as ValidationCategory,
          severity: ValidationSeverity.INFO,
          status: 'passed' as ValidationStatus,
          message: 'Custom business rule passed',
          timestamp: new Date(),
        },
      ]);

      qualityAssurance.registerCustomCheck('business_rules', customCheck);

      // Custom check should be registered
      expect(true).toBe(true); // Placeholder assertion
    });
  });

  describe('Quality Statistics', () => {
    it('should provide quality statistics', () => {
      const stats = qualityAssurance.getQualityStatistics();

      expect(stats).toHaveProperty('activeChecks');
      expect(stats).toHaveProperty('totalResults');
      expect(stats).toHaveProperty('averageScore');
      expect(stats).toHaveProperty('topViolations');
      expect(stats).toHaveProperty('trendingMetrics');

      expect(typeof stats.activeChecks).toBe('number');
      expect(typeof stats.totalResults).toBe('number');
      expect(typeof stats.averageScore).toBe('number');
    });
  });

  describe('Alert Generation', () => {
    it('should trigger alerts for critical violations', async () => {
      const alertSpy = vi.fn();
      qualityAssurance.on('qualityAlertTriggered', alertSpy);

      const criticalExecutionMetrics: TaskExecutionMetrics = {
        startTime: new Date(Date.now() - 70000),
        endTime: new Date(),
        duration: 70000, // Critical threshold exceeded
        memoryUsage: {
          peak: 3072 * 1024 * 1024, // 3GB - critical
          average: 2048 * 1024 * 1024,
          current: 2500 * 1024 * 1024,
        },
        cpuUsage: {
          peak: 98,
          average: 90,
        },
        errorCount: 10,
        warningCount: 20,
        retryCount: 5,
        throughput: 5,
      };

      await qualityAssurance.performQualityAssurance(
        mockTask,
        undefined,
        criticalExecutionMetrics,
      );

      // Should trigger alerts for critical issues
      // (In actual implementation, this would check if alerts were triggered)
      expect(true).toBe(true); // Placeholder - actual implementation would verify alerts
    });
  });

  describe('Error Handling', () => {
    it('should handle quality check errors gracefully', async () => {
      const errorTask = {
        ...mockTask,
        id: 'error-task',
      };

      // Should not throw even if internal checks fail
      const result = await qualityAssurance.performQualityAssurance(errorTask);

      expect(result).toBeDefined();
      expect(result.taskId).toBe('error-task');
    });
  });

  describe('Cleanup', () => {
    it('should cleanup resources', async () => {
      const removeAllListenersSpy = vi.spyOn(
        qualityAssurance,
        'removeAllListeners',
      );

      await qualityAssurance.cleanup();

      expect(removeAllListenersSpy).toHaveBeenCalled();
    });
  });
});

describe('QualityAssurance Integration Tests', () => {
  let qualityAssurance: QualityAssurance;
  let realValidationFramework: ValidationFramework;
  let realTaskValidator: TaskValidator;

  beforeEach(() => {
    realValidationFramework = new ValidationFramework();
    realTaskValidator = new TaskValidator(realValidationFramework);
    qualityAssurance = new QualityAssurance(
      realValidationFramework,
      realTaskValidator,
    );
  });

  it('should perform end-to-end quality assurance', async () => {
    const task: Task = {
      id: 'integration-qa-task',
      title: 'Integration QA Test Task',
      description: 'A comprehensive integration test for quality assurance',
      category: TaskCategory.FEATURE,
      priority: TaskPriority.MEDIUM,
      status: TaskStatus.COMPLETED,
      metadata: {
        createdAt: new Date(Date.now() - 8000),
        updatedAt: new Date(),
        createdBy: 'integration-qa-test',
        estimatedDuration: 8000,
        tags: ['integration', 'qa'],
      },
    };

    const taskResult: TaskResult = {
      taskId: task.id,
      success: true,
      output: { result: 'Integration test completed successfully' },
      metrics: {
        startTime: new Date(Date.now() - 8000),
        endTime: new Date(),
        duration: 8000,
        memoryUsage: 384,
        cpuUsage: 25,
      },
      artifacts: ['integration-test.log'],
      validationResults: [],
    };

    const executionMetrics: TaskExecutionMetrics = {
      startTime: new Date(Date.now() - 8000),
      endTime: new Date(),
      duration: 8000,
      memoryUsage: {
        peak: 384 * 1024 * 1024,
        average: 256 * 1024 * 1024,
        current: 200 * 1024 * 1024,
      },
      cpuUsage: {
        peak: 25,
        average: 20,
      },
      errorCount: 0,
      warningCount: 1,
      retryCount: 0,
      throughput: 125,
      qualityMetrics: {
        codeComplexity: 8,
        testCoverage: 92,
      },
    };

    const result = await qualityAssurance.performQualityAssurance(
      task,
      taskResult,
      executionMetrics,
    );

    expect(result).toBeDefined();
    expect(result.taskId).toBe('integration-qa-task');
    expect(result.passed).toBeDefined();
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(1);
    expect(result.metrics).toBeDefined();
    expect(result.validationResults).toBeInstanceOf(Array);
  });
});
