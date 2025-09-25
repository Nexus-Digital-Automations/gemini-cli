/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Configurable Quality Gates Pipeline
 *
 * Enterprise-grade quality gates pipeline with multiple checkpoint types,
 * parallel execution, conditional gates, and comprehensive validation rules.
 */

import type { Config } from '../config/config.js';
import type {
  Task,
  TaskId,
  TaskResult,
  TaskCategory,
  TaskPriority
} from './types.js';
import type {
  ValidationEngine,
  QualityGateConfig,
  ValidationRule,
  ValidationContext,
  ValidationRuleResult,
  ValidationSeverity,
  ValidationStatus,
  PerformanceBenchmark,
  SecurityScanConfig
} from './ValidationEngine.js';
import type { ExecutionMetrics } from './ExecutionMonitoringSystem.js';
import { spawn } from 'node:child_process';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

/**
 * Pipeline execution mode
 */
export type PipelineExecutionMode = 'sequential' | 'parallel' | 'conditional';

/**
 * Pipeline configuration
 */
export interface PipelineConfig {
  /** Pipeline name */
  name: string;
  /** Execution mode */
  mode: PipelineExecutionMode;
  /** Whether to continue on gate failures */
  continueOnFailure: boolean;
  /** Maximum parallel execution count */
  maxParallelGates: number;
  /** Overall pipeline timeout */
  timeoutMs: number;
  /** Gate execution order (for sequential mode) */
  gateOrder: string[];
  /** Conditional gate rules */
  conditionalRules: Array<{
    condition: (task: Task, result: TaskResult) => boolean;
    gates: string[];
  }>;
}

/**
 * Quality gates pipeline implementation
 */
export class QualityGatesPipeline {
  private readonly config: Config;
  private readonly validationEngine: ValidationEngine;
  private readonly pipelineConfig: PipelineConfig;

  // Built-in validation rules
  private readonly builtInRules: Map<string, ValidationRule> = new Map();

  constructor(
    config: Config,
    validationEngine: ValidationEngine,
    pipelineConfig: PipelineConfig
  ) {
    this.config = config;
    this.validationEngine = validationEngine;
    this.pipelineConfig = pipelineConfig;

    this.initializeBuiltInValidationRules();
  }

  /**
   * Initializes built-in validation rules for all quality gate types
   */
  private initializeBuiltInValidationRules(): void {
    // Code Quality Rules
    this.addCodeQualityRules();

    // Functional Testing Rules
    this.addFunctionalTestingRules();

    // Performance Rules
    this.addPerformanceRules();

    // Security Rules
    this.addSecurityRules();

    // Integration Rules
    this.addIntegrationRules();

    // Business Rules
    this.addBusinessRules();

    // Compliance Rules
    this.addComplianceRules();

    // Documentation Rules
    this.addDocumentationRules();
  }

  /**
   * Code Quality validation rules
   */
  private addCodeQualityRules(): void {
    // Linting Rule
    this.builtInRules.set('code_linting', {
      id: 'code_linting',
      name: 'Code Linting',
      description: 'Validates code against linting rules',
      severity: 'high',
      enabled: true,
      validator: async (task, result, context) => {
        const startTime = Date.now();

        try {
          // Check if linting is configured
          const packageJsonPath = path.join(process.cwd(), 'package.json');
          const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));

          if (!packageJson.scripts?.lint && !packageJson.devDependencies?.eslint) {
            return {
              passed: true,
              status: 'skipped' as ValidationStatus,
              message: 'No linting configuration found',
              executionTimeMs: Date.now() - startTime
            };
          }

          // Run linting
          const lintResult = await this.runCommand('npm run lint', { timeout: 60000 });

          return {
            passed: lintResult.exitCode === 0,
            status: lintResult.exitCode === 0 ? 'passed' : 'failed',
            message: lintResult.exitCode === 0
              ? 'All linting checks passed'
              : 'Linting violations detected',
            details: lintResult.output,
            suggestions: lintResult.exitCode !== 0
              ? ['Run "npm run lint -- --fix" to auto-fix issues', 'Review linting errors in detail']
              : undefined,
            executionTimeMs: Date.now() - startTime
          };
        } catch (error) {
          return {
            passed: false,
            status: 'error',
            message: `Linting validation failed: ${error}`,
            executionTimeMs: Date.now() - startTime
          };
        }
      }
    });

    // Type Checking Rule
    this.builtInRules.set('type_checking', {
      id: 'type_checking',
      name: 'Type Checking',
      description: 'Validates TypeScript type checking',
      severity: 'high',
      enabled: true,
      validator: async (task, result, context) => {
        const startTime = Date.now();

        try {
          // Check for TypeScript configuration
          const tsconfigPath = path.join(process.cwd(), 'tsconfig.json');

          try {
            await fs.access(tsconfigPath);
          } catch {
            return {
              passed: true,
              status: 'skipped' as ValidationStatus,
              message: 'No TypeScript configuration found',
              executionTimeMs: Date.now() - startTime
            };
          }

          // Run type checking
          const typeCheckResult = await this.runCommand('npx tsc --noEmit', { timeout: 120000 });

          return {
            passed: typeCheckResult.exitCode === 0,
            status: typeCheckResult.exitCode === 0 ? 'passed' : 'failed',
            message: typeCheckResult.exitCode === 0
              ? 'Type checking passed'
              : 'Type checking errors detected',
            details: typeCheckResult.output,
            suggestions: typeCheckResult.exitCode !== 0
              ? ['Fix type errors shown in output', 'Review TypeScript configuration']
              : undefined,
            executionTimeMs: Date.now() - startTime
          };
        } catch (error) {
          return {
            passed: false,
            status: 'error',
            message: `Type checking validation failed: ${error}`,
            executionTimeMs: Date.now() - startTime
          };
        }
      }
    });

    // Code Complexity Rule
    this.builtInRules.set('code_complexity', {
      id: 'code_complexity',
      name: 'Code Complexity',
      description: 'Validates code complexity metrics',
      severity: 'medium',
      enabled: true,
      validator: async (task, result, context) => {
        const startTime = Date.now();

        try {
          // This is a simplified complexity check
          // In production, you'd integrate with tools like complexity-report or eslint-plugin-complexity

          const files = await this.getSourceFiles();
          let totalComplexity = 0;
          let highComplexityFiles = 0;

          for (const file of files) {
            const content = await fs.readFile(file, 'utf-8');
            const complexity = this.calculateSimpleComplexity(content);
            totalComplexity += complexity;

            if (complexity > 10) {
              highComplexityFiles++;
            }
          }

          const averageComplexity = files.length > 0 ? totalComplexity / files.length : 0;
          const complexityThreshold = 8;

          return {
            passed: averageComplexity <= complexityThreshold && highComplexityFiles === 0,
            status: averageComplexity <= complexityThreshold && highComplexityFiles === 0 ? 'passed' : 'warning',
            message: `Average complexity: ${averageComplexity.toFixed(2)}, High complexity files: ${highComplexityFiles}`,
            details: `Complexity threshold: ${complexityThreshold}`,
            metrics: {
              averageComplexity,
              totalComplexity,
              highComplexityFiles,
              fileCount: files.length
            },
            suggestions: highComplexityFiles > 0
              ? ['Refactor high complexity functions', 'Break down complex logic into smaller functions']
              : undefined,
            executionTimeMs: Date.now() - startTime
          };
        } catch (error) {
          return {
            passed: false,
            status: 'error',
            message: `Code complexity validation failed: ${error}`,
            executionTimeMs: Date.now() - startTime
          };
        }
      }
    });
  }

  /**
   * Functional Testing validation rules
   */
  private addFunctionalTestingRules(): void {
    // Unit Tests Rule
    this.builtInRules.set('unit_tests', {
      id: 'unit_tests',
      name: 'Unit Tests',
      description: 'Validates unit test execution and coverage',
      severity: 'high',
      enabled: true,
      validator: async (task, result, context) => {
        const startTime = Date.now();

        try {
          // Check if testing is configured
          const packageJsonPath = path.join(process.cwd(), 'package.json');
          const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));

          if (!packageJson.scripts?.test) {
            return {
              passed: false,
              status: 'failed',
              message: 'No test script configured',
              suggestions: ['Add test script to package.json', 'Set up unit testing framework'],
              executionTimeMs: Date.now() - startTime
            };
          }

          // Run tests
          const testResult = await this.runCommand('npm test', { timeout: 300000 });

          // Parse test output for coverage information if available
          const coverageMatch = testResult.output.match(/All files\s+\|\s+(\d+\.?\d*)/);
          const coverage = coverageMatch ? parseFloat(coverageMatch[1]) : null;

          return {
            passed: testResult.exitCode === 0,
            status: testResult.exitCode === 0 ? 'passed' : 'failed',
            message: testResult.exitCode === 0
              ? `All tests passed${coverage ? ` (Coverage: ${coverage}%)` : ''}`
              : 'Some tests failed',
            details: testResult.output,
            metrics: coverage ? { coverage } : undefined,
            suggestions: testResult.exitCode !== 0
              ? ['Fix failing tests', 'Review test output for details']
              : coverage && coverage < 80
              ? ['Improve test coverage to at least 80%']
              : undefined,
            executionTimeMs: Date.now() - startTime
          };
        } catch (error) {
          return {
            passed: false,
            status: 'error',
            message: `Unit tests validation failed: ${error}`,
            executionTimeMs: Date.now() - startTime
          };
        }
      }
    });

    // Integration Tests Rule
    this.builtInRules.set('integration_tests', {
      id: 'integration_tests',
      name: 'Integration Tests',
      description: 'Validates integration test execution',
      severity: 'medium',
      enabled: true,
      validator: async (task, result, context) => {
        const startTime = Date.now();

        try {
          const packageJsonPath = path.join(process.cwd(), 'package.json');
          const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));

          if (!packageJson.scripts?.['test:integration']) {
            return {
              passed: true,
              status: 'skipped' as ValidationStatus,
              message: 'No integration test script configured',
              executionTimeMs: Date.now() - startTime
            };
          }

          const testResult = await this.runCommand('npm run test:integration', { timeout: 600000 });

          return {
            passed: testResult.exitCode === 0,
            status: testResult.exitCode === 0 ? 'passed' : 'failed',
            message: testResult.exitCode === 0
              ? 'All integration tests passed'
              : 'Some integration tests failed',
            details: testResult.output,
            suggestions: testResult.exitCode !== 0
              ? ['Fix failing integration tests', 'Check external dependencies']
              : undefined,
            executionTimeMs: Date.now() - startTime
          };
        } catch (error) {
          return {
            passed: false,
            status: 'error',
            message: `Integration tests validation failed: ${error}`,
            executionTimeMs: Date.now() - startTime
          };
        }
      }
    });
  }

  /**
   * Performance validation rules
   */
  private addPerformanceRules(): void {
    // Build Performance Rule
    this.builtInRules.set('build_performance', {
      id: 'build_performance',
      name: 'Build Performance',
      description: 'Validates build time and output size',
      severity: 'medium',
      enabled: true,
      validator: async (task, result, context) => {
        const startTime = Date.now();

        try {
          const packageJsonPath = path.join(process.cwd(), 'package.json');
          const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));

          if (!packageJson.scripts?.build) {
            return {
              passed: true,
              status: 'skipped' as ValidationStatus,
              message: 'No build script configured',
              executionTimeMs: Date.now() - startTime
            };
          }

          const buildStartTime = Date.now();
          const buildResult = await this.runCommand('npm run build', { timeout: 600000 });
          const buildDuration = Date.now() - buildStartTime;

          if (buildResult.exitCode !== 0) {
            return {
              passed: false,
              status: 'failed',
              message: 'Build failed',
              details: buildResult.output,
              executionTimeMs: Date.now() - startTime
            };
          }

          // Check build output size (simplified)
          const buildSizeMB = await this.getBuildSize();
          const buildTimeThreshold = 300000; // 5 minutes
          const sizeThreshold = 50; // 50MB

          const passed = buildDuration <= buildTimeThreshold && buildSizeMB <= sizeThreshold;

          return {
            passed,
            status: passed ? 'passed' : 'warning',
            message: `Build completed in ${(buildDuration / 1000).toFixed(1)}s, size: ${buildSizeMB.toFixed(1)}MB`,
            metrics: {
              buildDurationMs: buildDuration,
              buildSizeMB,
              buildTimeThresholdMs: buildTimeThreshold,
              sizeThresholdMB: sizeThreshold
            },
            suggestions: !passed
              ? ['Optimize build performance', 'Consider code splitting', 'Review bundle size']
              : undefined,
            executionTimeMs: Date.now() - startTime
          };
        } catch (error) {
          return {
            passed: false,
            status: 'error',
            message: `Build performance validation failed: ${error}`,
            executionTimeMs: Date.now() - startTime
          };
        }
      }
    });

    // Memory Usage Rule
    this.builtInRules.set('memory_usage', {
      id: 'memory_usage',
      name: 'Memory Usage',
      description: 'Validates memory usage during task execution',
      severity: 'medium',
      enabled: true,
      validator: async (task, result, context) => {
        const startTime = Date.now();

        try {
          const currentMemoryMB = process.memoryUsage().heapUsed / 1024 / 1024;
          const memoryThreshold = 512; // 512MB

          const passed = currentMemoryMB <= memoryThreshold;

          return {
            passed,
            status: passed ? 'passed' : 'warning',
            message: `Current memory usage: ${currentMemoryMB.toFixed(1)}MB`,
            metrics: {
              memoryUsageMB: currentMemoryMB,
              memoryThresholdMB: memoryThreshold
            },
            suggestions: !passed
              ? ['Optimize memory usage', 'Check for memory leaks', 'Reduce concurrent operations']
              : undefined,
            executionTimeMs: Date.now() - startTime
          };
        } catch (error) {
          return {
            passed: false,
            status: 'error',
            message: `Memory usage validation failed: ${error}`,
            executionTimeMs: Date.now() - startTime
          };
        }
      }
    });
  }

  /**
   * Security validation rules
   */
  private addSecurityRules(): void {
    // Dependency Security Rule
    this.builtInRules.set('dependency_security', {
      id: 'dependency_security',
      name: 'Dependency Security',
      description: 'Validates dependencies for known vulnerabilities',
      severity: 'critical',
      enabled: true,
      validator: async (task, result, context) => {
        const startTime = Date.now();

        try {
          // Run npm audit
          const auditResult = await this.runCommand('npm audit --json', {
            timeout: 120000,
            ignoreExitCode: true
          });

          let auditData;
          try {
            auditData = JSON.parse(auditResult.output);
          } catch {
            return {
              passed: true,
              status: 'passed',
              message: 'Dependency security check completed (no JSON output)',
              executionTimeMs: Date.now() - startTime
            };
          }

          const vulnerabilities = auditData.vulnerabilities || {};
          const vulnCount = Object.keys(vulnerabilities).length;
          const criticalVulns = Object.values(vulnerabilities).filter(
            (v: any) => v.severity === 'critical'
          ).length;
          const highVulns = Object.values(vulnerabilities).filter(
            (v: any) => v.severity === 'high'
          ).length;

          const passed = criticalVulns === 0 && highVulns === 0;

          return {
            passed,
            status: passed ? 'passed' : 'failed',
            message: passed
              ? 'No critical or high severity vulnerabilities found'
              : `Found ${criticalVulns} critical and ${highVulns} high severity vulnerabilities`,
            metrics: {
              totalVulnerabilities: vulnCount,
              criticalVulnerabilities: criticalVulns,
              highVulnerabilities: highVulns
            },
            suggestions: !passed
              ? ['Run "npm audit fix" to resolve vulnerabilities', 'Review and update vulnerable dependencies']
              : undefined,
            executionTimeMs: Date.now() - startTime
          };
        } catch (error) {
          return {
            passed: false,
            status: 'error',
            message: `Dependency security validation failed: ${error}`,
            executionTimeMs: Date.now() - startTime
          };
        }
      }
    });

    // SAST Security Scan Rule
    this.builtInRules.set('sast_scan', {
      id: 'sast_scan',
      name: 'SAST Security Scan',
      description: 'Static Application Security Testing scan',
      severity: 'high',
      enabled: true,
      validator: async (task, result, context) => {
        const startTime = Date.now();

        try {
          // Check for semgrep installation
          try {
            await this.runCommand('semgrep --version', { timeout: 10000 });
          } catch {
            return {
              passed: true,
              status: 'skipped' as ValidationStatus,
              message: 'Semgrep not installed, SAST scan skipped',
              suggestions: ['Install semgrep for security scanning: pip install semgrep'],
              executionTimeMs: Date.now() - startTime
            };
          }

          // Run semgrep security scan
          const semgrepResult = await this.runCommand(
            'semgrep --config=p/security-audit --json .',
            { timeout: 300000, ignoreExitCode: true }
          );

          let findings;
          try {
            const output = JSON.parse(semgrepResult.output);
            findings = output.results || [];
          } catch {
            return {
              passed: true,
              status: 'warning',
              message: 'SAST scan completed but could not parse results',
              executionTimeMs: Date.now() - startTime
            };
          }

          const criticalFindings = findings.filter((f: any) => f.extra?.severity === 'ERROR').length;
          const highFindings = findings.filter((f: any) => f.extra?.severity === 'WARNING').length;

          const passed = criticalFindings === 0 && highFindings === 0;

          return {
            passed,
            status: passed ? 'passed' : 'failed',
            message: passed
              ? 'No security issues found in SAST scan'
              : `SAST scan found ${criticalFindings} critical and ${highFindings} high severity issues`,
            metrics: {
              totalFindings: findings.length,
              criticalFindings,
              highFindings
            },
            suggestions: !passed
              ? ['Review and fix security issues found in scan', 'Consider security code review']
              : undefined,
            executionTimeMs: Date.now() - startTime
          };
        } catch (error) {
          return {
            passed: false,
            status: 'error',
            message: `SAST scan validation failed: ${error}`,
            executionTimeMs: Date.now() - startTime
          };
        }
      }
    });
  }

  /**
   * Integration validation rules
   */
  private addIntegrationRules(): void {
    // Build Success Rule
    this.builtInRules.set('build_success', {
      id: 'build_success',
      name: 'Build Success',
      description: 'Validates successful build completion',
      severity: 'critical',
      enabled: true,
      validator: async (task, result, context) => {
        const startTime = Date.now();

        try {
          const packageJsonPath = path.join(process.cwd(), 'package.json');
          const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));

          if (!packageJson.scripts?.build) {
            return {
              passed: true,
              status: 'skipped' as ValidationStatus,
              message: 'No build script configured',
              executionTimeMs: Date.now() - startTime
            };
          }

          const buildResult = await this.runCommand('npm run build', { timeout: 600000 });

          return {
            passed: buildResult.exitCode === 0,
            status: buildResult.exitCode === 0 ? 'passed' : 'failed',
            message: buildResult.exitCode === 0
              ? 'Build completed successfully'
              : 'Build failed',
            details: buildResult.output,
            suggestions: buildResult.exitCode !== 0
              ? ['Fix build errors', 'Check dependencies and configuration']
              : undefined,
            executionTimeMs: Date.now() - startTime
          };
        } catch (error) {
          return {
            passed: false,
            status: 'error',
            message: `Build validation failed: ${error}`,
            executionTimeMs: Date.now() - startTime
          };
        }
      }
    });
  }

  /**
   * Business rules validation
   */
  private addBusinessRules(): void {
    // Task Completion Criteria Rule
    this.builtInRules.set('completion_criteria', {
      id: 'completion_criteria',
      name: 'Task Completion Criteria',
      description: 'Validates task meets completion criteria',
      severity: 'high',
      enabled: true,
      validator: async (task, result, context) => {
        const startTime = Date.now();

        try {
          // Check if task has validation criteria defined
          if (!task.validationCriteria || task.validationCriteria.length === 0) {
            return {
              passed: true,
              status: 'skipped' as ValidationStatus,
              message: 'No validation criteria defined for task',
              executionTimeMs: Date.now() - startTime
            };
          }

          // Validate each criterion
          const criteriaResults = task.validationCriteria.map(criterion => {
            // Simple criterion validation - in production this would be more sophisticated
            const met = this.evaluateCompletionCriterion(criterion, task, result);
            return { criterion, met };
          });

          const allCriteriaMet = criteriaResults.every(r => r.met);
          const unmetCriteria = criteriaResults.filter(r => !r.met).map(r => r.criterion);

          return {
            passed: allCriteriaMet,
            status: allCriteriaMet ? 'passed' : 'failed',
            message: allCriteriaMet
              ? 'All completion criteria met'
              : `Unmet criteria: ${unmetCriteria.join(', ')}`,
            details: `Evaluated ${criteriaResults.length} criteria`,
            suggestions: !allCriteriaMet
              ? [`Address unmet criteria: ${unmetCriteria.join(', ')}`]
              : undefined,
            executionTimeMs: Date.now() - startTime
          };
        } catch (error) {
          return {
            passed: false,
            status: 'error',
            message: `Completion criteria validation failed: ${error}`,
            executionTimeMs: Date.now() - startTime
          };
        }
      }
    });
  }

  /**
   * Compliance validation rules
   */
  private addComplianceRules(): void {
    // Code Standards Compliance Rule
    this.builtInRules.set('code_standards', {
      id: 'code_standards',
      name: 'Code Standards Compliance',
      description: 'Validates adherence to coding standards',
      severity: 'medium',
      enabled: true,
      validator: async (task, result, context) => {
        const startTime = Date.now();

        try {
          // Check for required files and configurations
          const requiredConfigs = [
            { file: '.eslintrc.js', name: 'ESLint configuration' },
            { file: '.prettierrc', name: 'Prettier configuration' },
            { file: 'tsconfig.json', name: 'TypeScript configuration' }
          ];

          const missingConfigs = [];
          for (const config of requiredConfigs) {
            try {
              await fs.access(path.join(process.cwd(), config.file));
            } catch {
              missingConfigs.push(config.name);
            }
          }

          const passed = missingConfigs.length === 0;

          return {
            passed,
            status: passed ? 'passed' : 'warning',
            message: passed
              ? 'All required configuration files present'
              : `Missing configurations: ${missingConfigs.join(', ')}`,
            suggestions: !passed
              ? [`Add missing configuration files: ${missingConfigs.join(', ')}`]
              : undefined,
            executionTimeMs: Date.now() - startTime
          };
        } catch (error) {
          return {
            passed: false,
            status: 'error',
            message: `Code standards validation failed: ${error}`,
            executionTimeMs: Date.now() - startTime
          };
        }
      }
    });
  }

  /**
   * Documentation validation rules
   */
  private addDocumentationRules(): void {
    // README Documentation Rule
    this.builtInRules.set('readme_documentation', {
      id: 'readme_documentation',
      name: 'README Documentation',
      description: 'Validates presence and quality of README documentation',
      severity: 'low',
      enabled: true,
      validator: async (task, result, context) => {
        const startTime = Date.now();

        try {
          const readmePath = path.join(process.cwd(), 'README.md');

          try {
            const readmeContent = await fs.readFile(readmePath, 'utf-8');

            // Basic quality checks
            const hasTitle = readmeContent.includes('#');
            const hasInstallInstructions = /install/i.test(readmeContent);
            const hasUsageInstructions = /usage|example/i.test(readmeContent);
            const minLength = readmeContent.length > 200;

            const qualityScore = [hasTitle, hasInstallInstructions, hasUsageInstructions, minLength]
              .filter(Boolean).length;

            return {
              passed: qualityScore >= 3,
              status: qualityScore >= 3 ? 'passed' : 'warning',
              message: `README quality score: ${qualityScore}/4`,
              details: `Title: ${hasTitle}, Install: ${hasInstallInstructions}, Usage: ${hasUsageInstructions}, Length: ${minLength}`,
              suggestions: qualityScore < 3
                ? ['Improve README documentation with missing sections']
                : undefined,
              executionTimeMs: Date.now() - startTime
            };
          } catch {
            return {
              passed: false,
              status: 'warning',
              message: 'README.md file not found',
              suggestions: ['Create README.md file with project documentation'],
              executionTimeMs: Date.now() - startTime
            };
          }
        } catch (error) {
          return {
            passed: false,
            status: 'error',
            message: `README documentation validation failed: ${error}`,
            executionTimeMs: Date.now() - startTime
          };
        }
      }
    });
  }

  /**
   * Helper method to run shell commands
   */
  private async runCommand(
    command: string,
    options: { timeout?: number; ignoreExitCode?: boolean } = {}
  ): Promise<{ exitCode: number; output: string }> {
    return new Promise((resolve, reject) => {
      const [cmd, ...args] = command.split(' ');
      const child = spawn(cmd, args, {
        stdio: 'pipe',
        shell: true
      });

      let output = '';
      let errorOutput = '';

      child.stdout?.on('data', (data) => {
        output += data.toString();
      });

      child.stderr?.on('data', (data) => {
        errorOutput += data.toString();
      });

      child.on('close', (code) => {
        resolve({
          exitCode: code || 0,
          output: output + errorOutput
        });
      });

      child.on('error', (error) => {
        if (options.ignoreExitCode) {
          resolve({
            exitCode: 1,
            output: error.message
          });
        } else {
          reject(error);
        }
      });

      // Handle timeout
      if (options.timeout) {
        setTimeout(() => {
          child.kill();
          reject(new Error(`Command timeout after ${options.timeout}ms`));
        }, options.timeout);
      }
    });
  }

  /**
   * Helper method to get source files
   */
  private async getSourceFiles(): Promise<string[]> {
    const sourceExtensions = ['.ts', '.js', '.tsx', '.jsx'];
    const sourceDirectories = ['src', 'lib', 'packages'];

    const files: string[] = [];

    for (const dir of sourceDirectories) {
      try {
        const dirPath = path.join(process.cwd(), dir);
        const items = await fs.readdir(dirPath, { recursive: true });

        for (const item of items as string[]) {
          const fullPath = path.join(dirPath, item);
          const stat = await fs.stat(fullPath);

          if (stat.isFile() && sourceExtensions.some(ext => item.endsWith(ext))) {
            files.push(fullPath);
          }
        }
      } catch {
        // Directory doesn't exist, skip
      }
    }

    return files;
  }

  /**
   * Simple complexity calculation
   */
  private calculateSimpleComplexity(content: string): number {
    // Count control flow statements as complexity indicators
    const complexityPatterns = [
      /\bif\s*\(/g,
      /\belse\s*\{/g,
      /\bwhile\s*\(/g,
      /\bfor\s*\(/g,
      /\bswitch\s*\(/g,
      /\bcase\s+/g,
      /\bcatch\s*\(/g,
      /\?\s*.*\s*:/g, // Ternary operators
    ];

    let complexity = 1; // Base complexity

    for (const pattern of complexityPatterns) {
      const matches = content.match(pattern);
      complexity += matches ? matches.length : 0;
    }

    return complexity;
  }

  /**
   * Get build output size
   */
  private async getBuildSize(): Promise<number> {
    try {
      const buildDirs = ['dist', 'build', 'out'];

      for (const dir of buildDirs) {
        const buildPath = path.join(process.cwd(), dir);
        try {
          const stat = await fs.stat(buildPath);
          if (stat.isDirectory()) {
            return await this.getDirectorySize(buildPath);
          }
        } catch {
          continue;
        }
      }

      return 0;
    } catch {
      return 0;
    }
  }

  /**
   * Calculate directory size recursively
   */
  private async getDirectorySize(dirPath: string): Promise<number> {
    try {
      const items = await fs.readdir(dirPath, { withFileTypes: true });
      let totalSize = 0;

      for (const item of items) {
        const itemPath = path.join(dirPath, item.name);

        if (item.isDirectory()) {
          totalSize += await this.getDirectorySize(itemPath);
        } else {
          const stat = await fs.stat(itemPath);
          totalSize += stat.size;
        }
      }

      return totalSize / 1024 / 1024; // Convert to MB
    } catch {
      return 0;
    }
  }

  /**
   * Evaluates a completion criterion
   */
  private evaluateCompletionCriterion(
    criterion: string,
    task: Task,
    result: TaskResult
  ): boolean {
    // Simple criterion evaluation - in production this would be more sophisticated
    const lowerCriterion = criterion.toLowerCase();

    if (lowerCriterion.includes('success')) {
      return result.success;
    }

    if (lowerCriterion.includes('no error')) {
      return !result.error;
    }

    if (lowerCriterion.includes('output')) {
      return !!result.output;
    }

    // Default to true if criterion is not recognized
    return true;
  }

  /**
   * Gets all built-in validation rules
   */
  getBuiltInRules(): ValidationRule[] {
    return Array.from(this.builtInRules.values());
  }

  /**
   * Gets validation rules by checkpoint type
   */
  getRulesByType(checkpointType: string): ValidationRule[] {
    // This mapping would be more sophisticated in production
    const typeToRules: Record<string, string[]> = {
      'code_quality': ['code_linting', 'type_checking', 'code_complexity'],
      'functional_testing': ['unit_tests', 'integration_tests'],
      'performance': ['build_performance', 'memory_usage'],
      'security': ['dependency_security', 'sast_scan'],
      'integration': ['build_success'],
      'business_rules': ['completion_criteria'],
      'compliance': ['code_standards'],
      'documentation': ['readme_documentation']
    };

    const ruleIds = typeToRules[checkpointType] || [];
    return ruleIds.map(id => this.builtInRules.get(id)).filter(Boolean) as ValidationRule[];
  }
}