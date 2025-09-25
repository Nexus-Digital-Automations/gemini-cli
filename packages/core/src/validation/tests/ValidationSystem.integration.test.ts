/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { vi } from 'vitest';
import { ValidationFramework } from '../ValidationFramework.js';
import { ValidationRules, RuleExecutionContext } from '../ValidationRules.js';
import { TaskValidator, TaskValidationType, TaskValidationLevel } from '../TaskValidator.js';
import { QualityAssurance, QualityCheckType } from '../QualityAssurance.js';
import { RollbackManager, RollbackTrigger, RollbackType } from '../RollbackManager.js';
import type { Task, TaskResult } from '../../task-management/types.js';
import { TaskStatus } from '../../task-management/TaskQueue.js';
import { TaskPriority } from '../../task-management/types.js';

// Mock logger to avoid console output during tests
vi.mock('../../logger/Logger.js');

describe('ValidationSystem Integration', () => {
  let validationFramework: ValidationFramework;
  let validationRules: ValidationRules;
  let taskValidator: TaskValidator;
  let qualityAssurance: QualityAssurance;
  let rollbackManager: RollbackManager;

  let testTask: Task;
  let testTaskResult: TaskResult;

  beforeEach(async () => {
    // Initialize all validation system components
    validationFramework = new ValidationFramework();
    validationRules = new ValidationRules();
    taskValidator = new TaskValidator(validationFramework);
    qualityAssurance = new QualityAssurance(validationFramework, taskValidator);
    rollbackManager = new RollbackManager();

    // Create test task
    testTask = {
      id: 'integration-test-task',
      title: 'Integration Test Task',
      description: 'A comprehensive task for testing the complete validation system',
      type: 'implementation' as any,
      priority: TaskPriority.HIGH,
      status: TaskStatus.PENDING,
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'integration-test-system',
        estimatedDuration: 3600000, // 1 hour
        tags: ['integration', 'validation', 'testing'],
        custom: {
          complexity: 'moderate',
          criticality: 'high'
        }
      },
      parameters: {
        validateOutput: true,
        requireQualityCheck: true,
        allowRollback: true
      },
      expectedOutput: {
        result: 'Task completed successfully with validation',
        artifacts: 'Generated test artifacts',
        qualityScore: 'Quality score above 0.8'
      },
      validationCriteria: [
        'All required fields present',
        'Dependencies satisfied',
        'Quality thresholds met',
        'Security compliance verified'
      ]
    } as Task;

    testTaskResult = {
      taskId: testTask.id,
      success: true,
      output: {
        result: 'Task completed successfully',
        processedItems: 150,
        generatedArtifacts: ['output.log', 'report.json', 'metrics.csv']
      },
      metrics: {
        startTime: new Date(Date.now() - 25000), // 25 seconds ago
        endTime: new Date(),
        duration: 25000,
        memoryUsage: 384, // 384MB
        cpuUsage: 35 // 35% CPU
      },
      artifacts: ['output.log', 'report.json', 'metrics.csv'],
      validationResults: []
    };
  });

  afterEach(async () => {
    // Cleanup all components
    await Promise.all([
      taskValidator.cleanup(),
      qualityAssurance.cleanup(),
      rollbackManager.cleanup()
    ]);
  });

  describe('Complete Validation Workflow', () => {
    it('should execute complete validation workflow successfully', async () => {
      // Step 1: Pre-execution validation
      console.log('Step 1: Pre-execution validation');

      const preExecutionContext = {
        task: testTask,
        validationType: TaskValidationType.PRE_EXECUTION,
        validationLevel: TaskValidationLevel.MODERATE,
        dependencies: [],
        dependencyResults: new Map(),
        previousSnapshots: [],
        executionMetrics: undefined,
        customValidators: [],
        skipValidations: [],
        metadata: {
          phase: 'pre-execution',
          validationRequired: true
        }
      };

      const preValidationResult = await taskValidator.validateTask(preExecutionContext);

      expect(preValidationResult).toBeDefined();
      expect(preValidationResult.taskId).toBe(testTask.id);
      expect(preValidationResult.validationType).toBe(TaskValidationType.PRE_EXECUTION);
      expect(preValidationResult.passed).toBe(true);
      expect(preValidationResult.qualityScore).toBeGreaterThan(0.5);
      expect(preValidationResult.rollbackRecommended).toBe(false);

      // Step 2: Create initial snapshot before execution
      console.log('Step 2: Creating initial snapshot');

      const initialSnapshot = await rollbackManager.createSnapshot(
        testTask,
        'Pre-execution snapshot for integration test',
        [RollbackType.TASK_STATE, RollbackType.ENVIRONMENT]
      );

      expect(initialSnapshot).toBeDefined();
      expect(initialSnapshot.taskId).toBe(testTask.id);
      expect(initialSnapshot.type).toContain(RollbackType.TASK_STATE);

      // Step 3: Simulate task execution and create execution metrics
      console.log('Step 3: Simulating task execution');

      const executionMetrics = {
        startTime: new Date(Date.now() - 25000),
        endTime: new Date(),
        duration: 25000,
        memoryUsage: {
          peak: 384 * 1024 * 1024, // 384MB
          average: 256 * 1024 * 1024,
          current: 200 * 1024 * 1024
        },
        cpuUsage: {
          peak: 35,
          average: 25
        },
        resourceUsage: new Map([
          ['memory', 384],
          ['cpu', 35],
          ['disk', 50]
        ]),
        errorCount: 0,
        warningCount: 2,
        retryCount: 0,
        throughput: 150,
        qualityMetrics: {
          codeComplexity: 12,
          testCoverage: 87,
          duplicateLines: 3,
          maintainabilityIndex: 78
        }
      };

      // Step 4: Post-execution validation
      console.log('Step 4: Post-execution validation');

      const completedTask = {
        ...testTask,
        status: TaskStatus.COMPLETED,
        metadata: {
          ...testTask.metadata,
          completedAt: new Date(),
          actualDuration: executionMetrics.duration
        }
      };

      const postExecutionContext = {
        task: completedTask,
        taskResult: testTaskResult,
        validationType: TaskValidationType.POST_EXECUTION,
        validationLevel: TaskValidationLevel.MODERATE,
        dependencies: [],
        dependencyResults: new Map(),
        previousSnapshots: [initialSnapshot],
        executionMetrics,
        customValidators: [],
        skipValidations: [],
        metadata: {
          phase: 'post-execution',
          validationRequired: true,
          qualityCheckRequired: true
        }
      };

      const postValidationResult = await taskValidator.validateTask(postExecutionContext);

      expect(postValidationResult).toBeDefined();
      expect(postValidationResult.passed).toBe(true);
      expect(postValidationResult.executionMetrics).toBeDefined();
      expect(postValidationResult.snapshot).toBeDefined();

      // Step 5: Comprehensive quality assurance
      console.log('Step 5: Quality assurance checks');

      const qualityResult = await qualityAssurance.performQualityAssurance(
        completedTask,
        testTaskResult,
        executionMetrics
      );

      expect(qualityResult).toBeDefined();
      expect(qualityResult.taskId).toBe(testTask.id);
      expect(qualityResult.passed).toBe(true);
      expect(qualityResult.overallScore).toBeGreaterThan(0.7);
      expect(qualityResult.metrics).toBeDefined();
      expect(qualityResult.violations).toBeInstanceOf(Array);
      expect(qualityResult.recommendations).toBeInstanceOf(Array);

      // Verify quality metrics
      expect(qualityResult.metrics.performance.executionTime).toBe(25000);
      expect(qualityResult.metrics.performance.memoryUsage).toBe(384);
      expect(qualityResult.metrics.reliability.errorRate).toBe(0);
      expect(qualityResult.metrics.business.featureCompleteness).toBe(100);

      // Step 6: Verify all validations passed
      console.log('Step 6: Verification complete');

      const allResults = [preValidationResult, postValidationResult];
      const allPassed = allResults.every(result => result.passed);
      const qualityPassed = qualityResult.passed;

      expect(allPassed).toBe(true);
      expect(qualityPassed).toBe(true);

      console.log('Integration test completed successfully');
    });

    it('should handle validation failure and trigger rollback', async () => {
      // Create a failing task scenario
      const failingTask: Task = {
        ...testTask,
        id: 'failing-integration-task',
        title: '', // Missing required field
        description: '', // Missing required field
        status: TaskStatus.FAILED
      };

      const failingTaskResult: TaskResult = {
        taskId: failingTask.id,
        success: false,
        error: {
          message: 'Task execution failed due to validation errors',
          code: 'VALIDATION_FAILURE',
          stack: 'Error stack trace...',
          details: {
            missingFields: ['title', 'description'],
            validationErrors: ['Required field validation failed']
          }
        },
        metrics: {
          startTime: new Date(Date.now() - 75000), // 75 seconds - exceeds warning threshold
          endTime: new Date(),
          duration: 75000,
          memoryUsage: 2048, // 2GB - exceeds critical threshold
          cpuUsage: 95 // 95% CPU - very high
        },
        artifacts: [],
        validationResults: []
      };

      const failingExecutionMetrics = {
        startTime: new Date(Date.now() - 75000),
        endTime: new Date(),
        duration: 75000, // Exceeds warning threshold (30s)
        memoryUsage: {
          peak: 2048 * 1024 * 1024, // 2GB - exceeds critical threshold (1GB)
          average: 1536 * 1024 * 1024,
          current: 1800 * 1024 * 1024
        },
        cpuUsage: {
          peak: 95,
          average: 85
        },
        errorCount: 8, // High error count
        warningCount: 15,
        retryCount: 5,
        throughput: 5, // Very low throughput
        qualityMetrics: {
          codeComplexity: 45, // Very high complexity
          testCoverage: 35, // Low test coverage
          duplicateLines: 25,
          maintainabilityIndex: 25
        }
      };

      // Step 1: Create snapshot before attempting execution
      const preFailureSnapshot = await rollbackManager.createSnapshot(
        failingTask,
        'Snapshot before attempting failing task execution'
      );

      // Step 2: Attempt validation (should fail)
      const failingValidationContext = {
        task: failingTask,
        taskResult: failingTaskResult,
        validationType: TaskValidationType.POST_EXECUTION,
        validationLevel: TaskValidationLevel.STRICT,
        dependencies: [],
        dependencyResults: new Map(),
        previousSnapshots: [preFailureSnapshot],
        executionMetrics: failingExecutionMetrics,
        customValidators: [],
        skipValidations: [],
        metadata: {
          phase: 'post-execution-failure',
          validationRequired: true
        }
      };

      const failedValidationResult = await taskValidator.validateTask(failingValidationContext);

      expect(failedValidationResult.passed).toBe(false);
      expect(failedValidationResult.rollbackRecommended).toBe(true);
      expect(failedValidationResult.rollbackReason).toBeDefined();

      // Step 3: Quality assurance should also detect issues
      const failingQualityResult = await qualityAssurance.performQualityAssurance(
        failingTask,
        failingTaskResult,
        failingExecutionMetrics
      );

      expect(failingQualityResult.passed).toBe(false);
      expect(failingQualityResult.violations.length).toBeGreaterThan(0);
      expect(failingQualityResult.overallScore).toBeLessThan(0.5);

      // Step 4: Execute rollback due to validation failure
      const rollbackOperation = rollbackManager.createRollbackOperation(
        failingTask.id,
        RollbackTrigger.VALIDATION_FAILURE,
        preFailureSnapshot.id,
        'Rollback due to critical validation failures and quality issues'
      );

      const rollbackResult = await rollbackManager.executeRollback(rollbackOperation);

      expect(rollbackResult.success).toBe(true);
      expect(rollbackResult.rollbackDetails.snapshotRestored).toBe(preFailureSnapshot.id);
      expect(rollbackResult.errors.length).toBe(0);

      // Step 5: Verify rollback statistics
      const rollbackStats = rollbackManager.getRollbackStatistics();
      expect(rollbackStats.completedRollbacks).toBeGreaterThan(0);
    });

    it('should handle concurrent validation requests efficiently', async () => {
      // Create multiple tasks for concurrent validation
      const concurrentTasks: Task[] = Array.from({ length: 5 }, (_, index) => ({
        ...testTask,
        id: `concurrent-task-${index + 1}`,
        title: `Concurrent Test Task ${index + 1}`,
        description: `Concurrent validation test task number ${index + 1}`
      }));

      const concurrentExecutionMetrics = concurrentTasks.map((task, index) => ({
        startTime: new Date(Date.now() - (10000 + index * 1000)),
        endTime: new Date(),
        duration: 10000 + index * 1000,
        memoryUsage: {
          peak: (200 + index * 50) * 1024 * 1024,
          average: (150 + index * 30) * 1024 * 1024,
          current: (120 + index * 20) * 1024 * 1024
        },
        cpuUsage: {
          peak: 20 + index * 5,
          average: 15 + index * 3
        },
        errorCount: index, // Increasing error count
        warningCount: index * 2,
        retryCount: 0,
        throughput: 100 - index * 10,
        qualityMetrics: {
          codeComplexity: 10 + index * 2,
          testCoverage: 90 - index * 5,
          duplicateLines: index,
          maintainabilityIndex: 85 - index * 3
        }
      }));

      // Execute all validations concurrently
      const concurrentValidations = concurrentTasks.map((task, index) => {
        const context = {
          task: { ...task, status: TaskStatus.COMPLETED },
          taskResult: {
            ...testTaskResult,
            taskId: task.id,
            success: index < 3 // First 3 succeed, last 2 fail
          },
          validationType: TaskValidationType.POST_EXECUTION,
          validationLevel: TaskValidationLevel.MODERATE,
          dependencies: [],
          dependencyResults: new Map(),
          previousSnapshots: [],
          executionMetrics: concurrentExecutionMetrics[index],
          customValidators: [],
          skipValidations: [],
          metadata: {
            phase: 'concurrent-validation',
            taskIndex: index
          }
        };

        return taskValidator.validateTask(context);
      });

      const concurrentResults = await Promise.all(concurrentValidations);

      // Verify all validations completed
      expect(concurrentResults.length).toBe(5);

      // Verify results match expected outcomes
      concurrentResults.forEach((result, index) => {
        expect(result.taskId).toBe(`concurrent-task-${index + 1}`);
        expect(result.validationType).toBe(TaskValidationType.POST_EXECUTION);

        if (index < 3) {
          // First 3 should pass (lower error counts, better metrics)
          expect(result.qualityScore).toBeGreaterThan(0.6);
        } else {
          // Last 2 might have lower scores due to higher error counts
          expect(result.qualityScore).toBeLessThanOrEqual(1.0);
        }
      });

      // Verify concurrent execution efficiency
      const validationStats = taskValidator.getValidationStatistics();
      expect(validationStats.totalSnapshots).toBeGreaterThanOrEqual(5);
    });
  });

  describe('Component Integration', () => {
    it('should integrate validation rules with framework correctly', async () => {
      // Get rules from validation rules system
      const preExecutionRules = validationRules.getApplicableRules(
        RuleExecutionContext.PRE_EXECUTION,
        'implementation',
        TaskStatus.PENDING
      );

      expect(preExecutionRules.length).toBeGreaterThan(0);

      // Register rules with validation framework
      preExecutionRules.forEach(rule => {
        validationFramework.registerRule(rule);
      });

      // Verify framework has the rules
      const frameworkRules = validationFramework.getRules();
      expect(frameworkRules.length).toBeGreaterThanOrEqual(preExecutionRules.length);

      // Execute validation through framework
      const context = {
        taskId: testTask.id,
        metadata: { task: testTask }
      };

      const frameworkReport = await validationFramework.validateTask(context);

      expect(frameworkReport).toBeDefined();
      expect(frameworkReport.results.length).toBeGreaterThan(0);
    });

    it('should coordinate quality assurance with task validation', async () => {
      // Create execution context
      const executionMetrics = {
        startTime: new Date(Date.now() - 20000),
        endTime: new Date(),
        duration: 20000,
        memoryUsage: {
          peak: 300 * 1024 * 1024,
          average: 200 * 1024 * 1024,
          current: 180 * 1024 * 1024
        },
        cpuUsage: {
          peak: 40,
          average: 30
        },
        errorCount: 1,
        warningCount: 3,
        retryCount: 0,
        throughput: 120
      };

      // Run task validation
      const validationContext = {
        task: { ...testTask, status: TaskStatus.COMPLETED },
        taskResult: testTaskResult,
        validationType: TaskValidationType.POST_EXECUTION,
        validationLevel: TaskValidationLevel.MODERATE,
        dependencies: [],
        dependencyResults: new Map(),
        previousSnapshots: [],
        executionMetrics,
        customValidators: [],
        skipValidations: [],
        metadata: {}
      };

      const validationResult = await taskValidator.validateTask(validationContext);

      // Run quality assurance
      const qaResult = await qualityAssurance.performQualityAssurance(
        { ...testTask, status: TaskStatus.COMPLETED },
        testTaskResult,
        executionMetrics
      );

      // Compare results for consistency
      expect(validationResult.passed).toBe(qaResult.passed);
      expect(validationResult.executionMetrics).toBe(executionMetrics);
      expect(qaResult.metrics.performance.executionTime).toBe(executionMetrics.duration);

      // Both should agree on overall quality assessment
      const validationQualityScore = validationResult.qualityScore;
      const qaQualityScore = qaResult.overallScore;

      // Should be reasonably close (within 0.2 points)
      expect(Math.abs(validationQualityScore - qaQualityScore)).toBeLessThan(0.2);
    });

    it('should integrate rollback manager with validation failures', async () => {
      // Create a scenario that should trigger rollback
      const criticalFailureTask: Task = {
        ...testTask,
        id: 'critical-failure-task',
        status: TaskStatus.FAILED
      };

      const criticalFailureMetrics = {
        startTime: new Date(Date.now() - 120000), // 2 minutes - exceeds critical threshold
        endTime: new Date(),
        duration: 120000,
        memoryUsage: {
          peak: 4096 * 1024 * 1024, // 4GB - critical
          average: 3072 * 1024 * 1024,
          current: 3500 * 1024 * 1024
        },
        cpuUsage: {
          peak: 98,
          average: 95
        },
        errorCount: 20, // Very high error count
        warningCount: 50,
        retryCount: 10,
        throughput: 1 // Extremely low throughput
      };

      // Step 1: Create snapshot
      const preFailureSnapshot = await rollbackManager.createSnapshot(
        criticalFailureTask,
        'Snapshot before critical failure'
      );

      // Step 2: Validate (should recommend rollback)
      const validationContext = {
        task: criticalFailureTask,
        taskResult: {
          ...testTaskResult,
          taskId: criticalFailureTask.id,
          success: false,
          error: {
            message: 'Critical system failure',
            code: 'CRITICAL_FAILURE'
          }
        },
        validationType: TaskValidationType.POST_EXECUTION,
        validationLevel: TaskValidationLevel.STRICT,
        dependencies: [],
        dependencyResults: new Map(),
        previousSnapshots: [preFailureSnapshot],
        executionMetrics: criticalFailureMetrics,
        customValidators: [],
        skipValidations: [],
        metadata: {}
      };

      const validationResult = await taskValidator.validateTask(validationContext);

      expect(validationResult.rollbackRecommended).toBe(true);
      expect(validationResult.snapshot).toBeDefined();

      // Step 3: Execute rollback based on validation recommendation
      if (validationResult.rollbackRecommended && validationResult.snapshot) {
        const rollbackOp = rollbackManager.createRollbackOperation(
          criticalFailureTask.id,
          RollbackTrigger.VALIDATION_FAILURE,
          validationResult.snapshot.id,
          validationResult.rollbackReason || 'Validation recommended rollback'
        );

        const rollbackResult = await rollbackManager.executeRollback(rollbackOp);
        expect(rollbackResult.success).toBe(true);
      }
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle large-scale validation efficiently', async () => {
      const startTime = Date.now();

      // Create a large number of validation tasks
      const largeBatch = Array.from({ length: 50 }, (_, index) => ({
        ...testTask,
        id: `scale-test-task-${index + 1}`,
        title: `Scale Test Task ${index + 1}`,
        description: `Large-scale validation test task ${index + 1}`
      }));

      // Execute validations in batches to avoid overwhelming the system
      const batchSize = 10;
      const results = [];

      for (let i = 0; i < largeBatch.length; i += batchSize) {
        const batch = largeBatch.slice(i, i + batchSize);
        const batchPromises = batch.map(task => {
          const context = {
            task: { ...task, status: TaskStatus.COMPLETED },
            taskResult: { ...testTaskResult, taskId: task.id },
            validationType: TaskValidationType.POST_EXECUTION,
            validationLevel: TaskValidationLevel.MODERATE,
            dependencies: [],
            dependencyResults: new Map(),
            previousSnapshots: [],
            executionMetrics: {
              startTime: new Date(Date.now() - 15000),
              endTime: new Date(),
              duration: 15000,
              memoryUsage: {
                peak: 300 * 1024 * 1024,
                average: 200 * 1024 * 1024,
                current: 180 * 1024 * 1024
              },
              errorCount: 0,
              warningCount: 1,
              retryCount: 0
            },
            customValidators: [],
            skipValidations: [],
            metadata: { batchIndex: Math.floor(i / batchSize) }
          };

          return taskValidator.validateTask(context);
        });

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
      }

      const endTime = Date.now();
      const totalDuration = endTime - startTime;

      // Verify all validations completed successfully
      expect(results.length).toBe(50);
      results.forEach((result, index) => {
        expect(result.taskId).toBe(`scale-test-task-${index + 1}`);
        expect(result.passed).toBe(true);
      });

      // Performance should be reasonable (less than 30 seconds for 50 validations)
      expect(totalDuration).toBeLessThan(30000);

      // Average validation time should be reasonable
      const avgValidationTime = totalDuration / results.length;
      expect(avgValidationTime).toBeLessThan(600); // Less than 600ms per validation

      console.log(`Large-scale validation completed: ${results.length} tasks in ${totalDuration}ms (avg: ${avgValidationTime.toFixed(2)}ms per task)`);
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('should recover gracefully from component failures', async () => {
      // Simulate validation framework failure
      const originalValidateTask = validationFramework.validateTask.bind(validationFramework);
      const frameworkFailureSpy = vi.spyOn(validationFramework, 'validateTask')
        .mockRejectedValueOnce(new Error('Validation framework temporary failure'))
        .mockImplementation(originalValidateTask);

      const context = {
        task: testTask,
        validationType: TaskValidationType.PRE_EXECUTION,
        validationLevel: TaskValidationLevel.MODERATE,
        dependencies: [],
        dependencyResults: new Map(),
        previousSnapshots: [],
        executionMetrics: undefined,
        customValidators: [],
        skipValidations: [],
        metadata: {}
      };

      // First attempt should fail
      await expect(taskValidator.validateTask(context)).rejects.toThrow('Validation framework temporary failure');

      // Second attempt should succeed
      const recoveryResult = await taskValidator.validateTask(context);
      expect(recoveryResult).toBeDefined();
      expect(recoveryResult.passed).toBe(true);

      frameworkFailureSpy.mockRestore();
    });
  });
});

describe('ValidationSystem End-to-End Scenarios', () => {
  it('should handle complete task lifecycle with validation', async () => {
    // This test simulates a complete task lifecycle from creation to completion
    // with validation at every stage

    const validationFramework = new ValidationFramework();
    const taskValidator = new TaskValidator(validationFramework);
    const qualityAssurance = new QualityAssurance(validationFramework, taskValidator);
    const rollbackManager = new RollbackManager();

    try {
      // Task creation and initial validation
      const newTask: Task = {
        id: 'e2e-lifecycle-task',
        title: 'End-to-End Lifecycle Test Task',
        description: 'A task that goes through the complete lifecycle with validation at every stage',
        type: 'implementation' as any,
        priority: TaskPriority.HIGH,
        status: TaskStatus.PENDING,
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'e2e-test-system'
        }
      } as Task;

      // Stage 1: Pre-execution validation
      console.log('Stage 1: Pre-execution validation and snapshot creation');

      const preExecSnapshot = await rollbackManager.createSnapshot(
        newTask,
        'Initial task state snapshot'
      );

      const preExecValidation = await taskValidator.validateTask({
        task: newTask,
        validationType: TaskValidationType.PRE_EXECUTION,
        validationLevel: TaskValidationLevel.MODERATE,
        dependencies: [],
        dependencyResults: new Map(),
        previousSnapshots: [preExecSnapshot],
        executionMetrics: undefined,
        customValidators: [],
        skipValidations: [],
        metadata: { stage: 'pre-execution' }
      });

      expect(preExecValidation.passed).toBe(true);

      // Stage 2: Task execution simulation
      console.log('Stage 2: Task execution simulation');

      const executingTask = { ...newTask, status: TaskStatus.IN_PROGRESS };
      const duringExecSnapshot = await rollbackManager.createSnapshot(
        executingTask,
        'Task execution started snapshot'
      );

      // Stage 3: During execution monitoring (simulated)
      console.log('Stage 3: During execution monitoring');

      const executionMetrics = {
        startTime: new Date(Date.now() - 30000),
        endTime: new Date(),
        duration: 30000,
        memoryUsage: {
          peak: 400 * 1024 * 1024,
          average: 300 * 1024 * 1024,
          current: 280 * 1024 * 1024
        },
        cpuUsage: {
          peak: 45,
          average: 30
        },
        errorCount: 0,
        warningCount: 1,
        retryCount: 0,
        throughput: 100
      };

      // Stage 4: Task completion and post-execution validation
      console.log('Stage 4: Post-execution validation');

      const completedTask = { ...newTask, status: TaskStatus.COMPLETED };
      const completionSnapshot = await rollbackManager.createSnapshot(
        completedTask,
        'Task completion snapshot'
      );

      const taskResult: TaskResult = {
        taskId: newTask.id,
        success: true,
        output: {
          result: 'E2E test completed successfully',
          metrics: 'All metrics within acceptable ranges'
        },
        metrics: {
          startTime: executionMetrics.startTime,
          endTime: executionMetrics.endTime,
          duration: executionMetrics.duration,
          memoryUsage: executionMetrics.memoryUsage.peak / (1024 * 1024),
          cpuUsage: executionMetrics.cpuUsage.average
        },
        artifacts: ['e2e-test-results.json'],
        validationResults: []
      };

      const postExecValidation = await taskValidator.validateTask({
        task: completedTask,
        taskResult,
        validationType: TaskValidationType.POST_EXECUTION,
        validationLevel: TaskValidationLevel.MODERATE,
        dependencies: [],
        dependencyResults: new Map(),
        previousSnapshots: [preExecSnapshot, duringExecSnapshot, completionSnapshot],
        executionMetrics,
        customValidators: [],
        skipValidations: [],
        metadata: { stage: 'post-execution' }
      });

      expect(postExecValidation.passed).toBe(true);
      expect(postExecValidation.qualityScore).toBeGreaterThan(0.7);

      // Stage 5: Quality assurance
      console.log('Stage 5: Final quality assurance');

      const finalQA = await qualityAssurance.performQualityAssurance(
        completedTask,
        taskResult,
        executionMetrics
      );

      expect(finalQA.passed).toBe(true);
      expect(finalQA.overallScore).toBeGreaterThan(0.7);

      // Stage 6: Verify all snapshots and history
      console.log('Stage 6: Verification and cleanup');

      const taskSnapshots = rollbackManager.getTaskSnapshots(newTask.id);
      expect(taskSnapshots.length).toBe(3); // Pre-exec, during-exec, completion

      const rollbackStats = rollbackManager.getRollbackStatistics();
      expect(rollbackStats.totalSnapshots).toBeGreaterThanOrEqual(3);

      const validationStats = taskValidator.getValidationStatistics();
      expect(validationStats.totalSnapshots).toBeGreaterThanOrEqual(3);

      const qualityStats = qualityAssurance.getQualityStatistics();
      expect(qualityStats.totalResults).toBeGreaterThan(0);

      console.log('End-to-end lifecycle test completed successfully');

    } finally {
      // Cleanup
      await Promise.all([
        taskValidator.cleanup(),
        qualityAssurance.cleanup(),
        rollbackManager.cleanup()
      ]);
    }
  });
});