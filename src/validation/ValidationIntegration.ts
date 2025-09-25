/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { AutomaticValidationSystem, TaskType, ValidationContext, ValidationResult } from './AutomaticValidationSystem';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * Integration utilities for the Automatic Validation System.
 *
 * This module provides:
 * - TodoWrite task completion validation
 * - CI/CD pipeline integration
 * - Feature completion verification
 * - Git workflow integration
 */
export class ValidationIntegration {
  private readonly validationSystem: AutomaticValidationSystem;
  private readonly projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
    this.validationSystem = new AutomaticValidationSystem(projectRoot);
  }

  /**
   * Validate TodoWrite task completion with comprehensive quality gates.
   *
   * @param taskDescription - Description of the completed task
   * @param taskCategory - Category/type of task for appropriate validation
   * @returns Promise resolving to validation result
   */
  async validateTaskCompletion(
    taskDescription: string,
    taskCategory: 'feature' | 'bug-fix' | 'refactoring' | 'testing' | 'documentation' = 'feature'
  ): Promise<ValidationResult> {
    const taskType = this.mapTaskCategoryToType(taskCategory);

    const context: ValidationContext = {
      taskDescription,
      timestamp: new Date().toISOString(),
      triggeredBy: 'todowrite-completion'
    };

    return await this.validationSystem.validateTaskCompletion(taskType, context);
  }

  /**
   * Validate feature implementation completion from FEATURES.json.
   *
   * @param featureId - ID of the completed feature
   * @returns Promise resolving to validation result
   */
  async validateFeatureCompletion(featureId: string): Promise<ValidationResult> {
    try {
      const featuresPath = join(this.projectRoot, 'FEATURES.json');
      const featuresContent = await readFile(featuresPath, 'utf-8');
      const features = JSON.parse(featuresContent);

      const feature = features.features?.find((f: any) => f.id === featureId);
      if (!feature) {
        throw new Error(`Feature ${featureId} not found in FEATURES.json`);
      }

      const context: ValidationContext = {
        featureId,
        featureTitle: feature.title,
        featureDescription: feature.description,
        featureCategory: feature.category,
        triggeredBy: 'feature-completion'
      };

      return await this.validationSystem.validateTaskCompletion(
        TaskType.FEATURE_IMPLEMENTATION,
        context
      );
    } catch (error) {
      throw new Error(`Failed to validate feature completion: ${(error as Error).message}`);
    }
  }

  /**
   * Validate project completion readiness with comprehensive checks.
   *
   * @returns Promise resolving to validation result
   */
  async validateProjectCompletion(): Promise<ValidationResult> {
    const context: ValidationContext = {
      scope: 'full-project',
      triggeredBy: 'project-completion-check',
      comprehensive: true
    };

    // Use refactoring validation as it includes the most comprehensive checks
    return await this.validationSystem.validateTaskCompletion(
      TaskType.REFACTORING,
      context
    );
  }

  /**
   * Validate commit readiness before git operations.
   *
   * @param commitMessage - Planned commit message
   * @returns Promise resolving to validation result
   */
  async validateCommitReadiness(commitMessage: string): Promise<ValidationResult> {
    const context: ValidationContext = {
      commitMessage,
      triggeredBy: 'pre-commit-validation'
    };

    // Determine task type based on commit message patterns
    const taskType = this.inferTaskTypeFromCommitMessage(commitMessage);

    return await this.validationSystem.validateTaskCompletion(taskType, context);
  }

  /**
   * Generate validation report for CI/CD integration.
   *
   * @param validationResult - Result from validation system
   * @returns Formatted report for CI/CD consumption
   */
  generateCICDReport(validationResult: ValidationResult): CICDReport {
    const { status, passed, qualityGateResults, summary, executionTime } = validationResult;

    return {
      success: passed,
      status: status,
      summary,
      duration: executionTime,
      gates: qualityGateResults.map(gate => ({
        name: gate.gateName,
        passed: gate.passed,
        message: gate.message,
        duration: gate.executionTime,
        severity: gate.severity
      })),
      recommendations: validationResult.report.recommendations.map(rec => ({
        type: rec.type,
        priority: rec.priority,
        title: rec.title,
        description: rec.description,
        actionItems: rec.actionItems
      })),
      artifacts: validationResult.report.artifacts.map(artifact => ({
        name: artifact.name,
        type: artifact.type,
        size: artifact.content.length
      })),
      timestamp: validationResult.timestamp.toISOString(),
      sessionId: validationResult.sessionId
    };
  }

  /**
   * Check if validation should block continuation based on results.
   *
   * @param validationResult - Result from validation system
   * @returns True if validation should block, false if can proceed
   */
  shouldBlockContinuation(validationResult: ValidationResult): boolean {
    // Block if any ERROR severity gates failed
    const errorGatesFailed = validationResult.qualityGateResults.some(
      gate => !gate.passed && gate.severity === 'error'
    );

    return errorGatesFailed;
  }

  /**
   * Generate stop authorization recommendation based on validation.
   *
   * @param validationResult - Result from validation system
   * @returns Stop authorization recommendation
   */
  generateStopAuthorizationRecommendation(validationResult: ValidationResult): StopAuthorizationRecommendation {
    const canAuthorizeStop = validationResult.passed && !this.shouldBlockContinuation(validationResult);

    const issues = validationResult.qualityGateResults
      .filter(gate => !gate.passed)
      .map(gate => `${gate.gateName}: ${gate.message}`);

    return {
      canAuthorizeStop,
      reason: canAuthorizeStop
        ? 'All quality gates passed or only warnings present'
        : `${issues.length} quality gate failures must be resolved`,
      issues,
      nextActions: canAuthorizeStop
        ? ['Ready to authorize stop - all quality gates satisfied']
        : validationResult.report.recommendations.flatMap(rec => rec.actionItems),
      validationSummary: validationResult.summary
    };
  }

  /**
   * Map task category to internal TaskType enum.
   */
  private mapTaskCategoryToType(category: string): TaskType {
    switch (category.toLowerCase()) {
      case 'feature':
      case 'feature-implementation':
        return TaskType.FEATURE_IMPLEMENTATION;
      case 'bug-fix':
      case 'bugfix':
        return TaskType.BUG_FIX;
      case 'refactoring':
      case 'refactor':
        return TaskType.REFACTORING;
      case 'testing':
      case 'test':
        return TaskType.TESTING;
      case 'documentation':
      case 'docs':
        return TaskType.DOCUMENTATION;
      case 'configuration':
      case 'config':
        return TaskType.CONFIGURATION;
      default:
        return TaskType.FEATURE_IMPLEMENTATION; // Default to most comprehensive
    }
  }

  /**
   * Infer task type from git commit message patterns.
   */
  private inferTaskTypeFromCommitMessage(commitMessage: string): TaskType {
    const message = commitMessage.toLowerCase();

    if (message.startsWith('fix:') || message.includes('bug') || message.includes('error')) {
      return TaskType.BUG_FIX;
    }

    if (message.startsWith('refactor:') || message.includes('refactor') || message.includes('cleanup')) {
      return TaskType.REFACTORING;
    }

    if (message.startsWith('test:') || message.includes('test') || message.includes('spec')) {
      return TaskType.TESTING;
    }

    if (message.startsWith('docs:') || message.includes('documentation') || message.includes('readme')) {
      return TaskType.DOCUMENTATION;
    }

    if (message.startsWith('config:') || message.includes('configuration') || message.includes('setup')) {
      return TaskType.CONFIGURATION;
    }

    // Default to feature implementation for feat: or unknown patterns
    return TaskType.FEATURE_IMPLEMENTATION;
  }
}

/**
 * Command-line interface for the validation system.
 */
export class ValidationCLI {
  private readonly integration: ValidationIntegration;

  constructor(projectRoot: string) {
    this.integration = new ValidationIntegration(projectRoot);
  }

  /**
   * Execute validation command with formatted output.
   *
   * @param command - Validation command to execute
   * @param args - Command arguments
   */
  async executeCommand(command: ValidationCommand, args: ValidationCommandArgs): Promise<void> {
    try {
      let result: ValidationResult;

      switch (command) {
        case 'validate-task':
          result = await this.integration.validateTaskCompletion(
            args.description || 'Task completion validation',
            args.category as any || 'feature'
          );
          break;

        case 'validate-feature':
          if (!args.featureId) {
            throw new Error('Feature ID is required for feature validation');
          }
          result = await this.integration.validateFeatureCompletion(args.featureId);
          break;

        case 'validate-project':
          result = await this.integration.validateProjectCompletion();
          break;

        case 'validate-commit':
          result = await this.integration.validateCommitReadiness(
            args.commitMessage || 'feat: task completion'
          );
          break;

        default:
          throw new Error(`Unknown validation command: ${command}`);
      }

      this.outputResult(result);

      // Exit with appropriate code
      process.exit(result.passed ? 0 : 1);

    } catch (error) {
      console.error('❌ Validation Error:', (error as Error).message);
      process.exit(1);
    }
  }

  /**
   * Output validation result in formatted manner.
   */
  private outputResult(result: ValidationResult): void {
    const statusIcon = result.passed ? '✅' : '❌';
    const statusColor = result.passed ? '\x1b[32m' : '\x1b[31m'; // Green or Red
    const resetColor = '\x1b[0m';

    console.log(`\n${statusIcon} ${statusColor}VALIDATION ${result.status.toUpperCase()}${resetColor}`);
    console.log(`📊 ${result.summary}`);
    console.log(`⏱️  Execution Time: ${result.executionTime}ms`);
    console.log(`🆔 Session ID: ${result.sessionId}`);

    if (result.qualityGateResults.length > 0) {
      console.log('\n📋 Quality Gate Results:');
      console.log('━'.repeat(50));

      result.qualityGateResults.forEach(gate => {
        const gateIcon = gate.passed ? '✅' : '❌';
        const severityBadge = this.getSeverityBadge(gate.severity);
        console.log(`${gateIcon} ${gate.gateName} ${severityBadge}`);

        if (!gate.passed) {
          console.log(`   └── ${gate.message}`);
        }

        console.log(`   └── ${gate.executionTime}ms`);
      });
    }

    if (result.report.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      console.log('━'.repeat(50));

      result.report.recommendations.forEach(rec => {
        const priorityBadge = this.getPriorityBadge(rec.priority);
        console.log(`${priorityBadge} ${rec.title}`);
        console.log(`   ${rec.description}`);

        if (rec.actionItems.length > 0) {
          rec.actionItems.forEach(item => {
            console.log(`   • ${item}`);
          });
        }
        console.log('');
      });
    }

    // Generate stop authorization recommendation
    const stopRecommendation = this.integration.generateStopAuthorizationRecommendation(result);
    console.log('\n🚦 Stop Authorization Status:');
    console.log('━'.repeat(50));

    const authIcon = stopRecommendation.canAuthorizeStop ? '✅' : '⏸️';
    console.log(`${authIcon} ${stopRecommendation.reason}`);

    if (stopRecommendation.issues.length > 0) {
      console.log('\n🔧 Issues to resolve:');
      stopRecommendation.issues.forEach(issue => {
        console.log(`   • ${issue}`);
      });
    }

    if (stopRecommendation.nextActions.length > 0) {
      console.log('\n📝 Next actions:');
      stopRecommendation.nextActions.forEach(action => {
        console.log(`   • ${action}`);
      });
    }
  }

  /**
   * Get colored severity badge for output.
   */
  private getSeverityBadge(severity: string): string {
    switch (severity) {
      case 'error':
        return '\x1b[41m ERROR \x1b[0m'; // Red background
      case 'warning':
        return '\x1b[43m WARN \x1b[0m';  // Yellow background
      case 'info':
        return '\x1b[44m INFO \x1b[0m';  // Blue background
      default:
        return `[${severity.toUpperCase()}]`;
    }
  }

  /**
   * Get colored priority badge for output.
   */
  private getPriorityBadge(priority: string): string {
    switch (priority) {
      case 'high':
        return '\x1b[31m🔴 HIGH\x1b[0m';     // Red
      case 'medium':
        return '\x1b[33m🟡 MEDIUM\x1b[0m';   // Yellow
      case 'low':
        return '\x1b[32m🟢 LOW\x1b[0m';      // Green
      default:
        return `🔵 ${priority.toUpperCase()}`;
    }
  }
}

// Type definitions for integration

export interface CICDReport {
  success: boolean;
  status: string;
  summary: string;
  duration: number;
  gates: Array<{
    name: string;
    passed: boolean;
    message: string;
    duration: number;
    severity: string;
  }>;
  recommendations: Array<{
    type: string;
    priority: string;
    title: string;
    description: string;
    actionItems: string[];
  }>;
  artifacts: Array<{
    name: string;
    type: string;
    size: number;
  }>;
  timestamp: string;
  sessionId: string;
}

export interface StopAuthorizationRecommendation {
  canAuthorizeStop: boolean;
  reason: string;
  issues: string[];
  nextActions: string[];
  validationSummary: string;
}

export type ValidationCommand =
  | 'validate-task'
  | 'validate-feature'
  | 'validate-project'
  | 'validate-commit';

export interface ValidationCommandArgs {
  description?: string;
  category?: string;
  featureId?: string;
  commitMessage?: string;
  [key: string]: string | undefined;
}

/**
 * Factory function to create validation integration instance.
 */
export function createValidationIntegration(projectRoot: string): ValidationIntegration {
  return new ValidationIntegration(projectRoot);
}

/**
 * Factory function to create validation CLI instance.
 */
export function createValidationCLI(projectRoot: string): ValidationCLI {
  return new ValidationCLI(projectRoot);
}

/**
 * Main validation entry point for programmatic use.
 */
export async function validateTaskCompletion(
  projectRoot: string,
  taskDescription: string,
  taskCategory: 'feature' | 'bug-fix' | 'refactoring' | 'testing' | 'documentation' = 'feature'
): Promise<ValidationResult> {
  const integration = new ValidationIntegration(projectRoot);
  return await integration.validateTaskCompletion(taskDescription, taskCategory);
}

/**
 * Utility function to check if project is ready for completion.
 */
export async function isProjectReadyForCompletion(projectRoot: string): Promise<boolean> {
  try {
    const integration = new ValidationIntegration(projectRoot);
    const result = await integration.validateProjectCompletion();
    return !integration.shouldBlockContinuation(result);
  } catch (error) {
    console.error('Project completion validation failed:', (error as Error).message);
    return false;
  }
}

/**
 * Utility function to get stop authorization status.
 */
export async function getStopAuthorizationStatus(
  projectRoot: string,
  taskDescription: string = 'Project completion check'
): Promise<StopAuthorizationRecommendation> {
  const integration = new ValidationIntegration(projectRoot);
  const result = await integration.validateTaskCompletion(taskDescription);
  return integration.generateStopAuthorizationRecommendation(result);
}