/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Build validation implementation for project compilation validation
 * Executes build processes and validates successful compilation
 *
 * @author Claude Code - Validation Agent
 * @version 1.0.0
 */

import { spawn } from 'node:child_process';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { Logger } from '../../utils/logger.js';
import type {
  ValidationContext,
  ValidationResult,
  ValidationStatus,
} from '../core/ValidationEngine.js';

/**
 * Build validation configuration
 */
export interface BuildValidationConfig {
  buildCommand?: string;
  buildArgs?: string[];
  workingDirectory?: string;
  timeout?: number;
  expectedOutputs?: string[];
  buildScript?: string;
  packageManager?: 'npm' | 'yarn' | 'pnpm';
  typeCheck?: boolean;
  skipDependencyInstall?: boolean;
}

/**
 * Build process result
 */
interface BuildResult {
  success: boolean;
  exitCode: number;
  stdout: string;
  stderr: string;
  duration: number;
  outputFiles: string[];
  errors: BuildError[];
  warnings: BuildWarning[];
}

/**
 * Build error details
 */
interface BuildError {
  file?: string;
  line?: number;
  column?: number;
  message: string;
  code?: string;
  severity: 'error' | 'fatal';
}

/**
 * Build warning details
 */
interface BuildWarning {
  file?: string;
  line?: number;
  column?: number;
  message: string;
  code?: string;
}

/**
 * Build summary metrics
 */
interface BuildSummary {
  success: boolean;
  duration: number;
  outputFiles: number;
  errors: number;
  warnings: number;
  compiledFiles: number;
  skippedFiles: number;
  bundleSize?: number;
}

/**
 * Comprehensive build validation system
 *
 * Features:
 * - Multi-package manager support (npm, yarn, pnpm)
 * - TypeScript compilation validation
 * - Bundle output verification
 * - Dependency resolution checking
 * - Build performance metrics
 * - Incremental build support
 * - Error analysis and reporting
 */
export class BuildValidator {
  private readonly logger: Logger;
  private readonly config: BuildValidationConfig;

  constructor(config: BuildValidationConfig = {}) {
    this.logger = new Logger('BuildValidator');
    this.config = {
      buildCommand: 'npm',
      buildArgs: ['run', 'build'],
      workingDirectory: process.cwd(),
      timeout: 300000, // 5 minutes
      packageManager: 'npm',
      typeCheck: true,
      skipDependencyInstall: false,
      ...config,
    };
  }

  /**
   * Validate project build process
   */
  public async validate(context: ValidationContext): Promise<ValidationResult> {
    const startTime = Date.now();
    this.logger.info(`Starting build validation for task: ${context.taskId}`);

    try {
      // Detect build configuration
      const buildConfig = await this.detectBuildConfiguration();

      // Check if build is required
      const requiresBuild = await this.checkIfBuildRequired(context.artifacts);

      if (!requiresBuild) {
        return {
          criteriaId: 'build_check',
          status: 'skipped' as ValidationStatus,
          score: 100,
          severity: 'info',
          message: 'Build validation skipped - no buildable artifacts detected',
          details: 'No package.json with build script or buildable files found',
          suggestions: [
            'Add build scripts to package.json if project requires compilation',
          ],
          evidence: [],
          timestamp: new Date(),
          duration: Date.now() - startTime,
        };
      }

      // Install dependencies if needed
      if (!this.config.skipDependencyInstall) {
        await this.installDependencies();
      }

      // Run build process
      const buildResult = await this.runBuild();

      // Validate build outputs
      const outputValidation = await this.validateBuildOutputs(buildResult);

      // Analyze build results
      const summary = this.analyzeBuildResults(buildResult, outputValidation);
      const score = this.calculateBuildScore(summary);
      const status = this.determineBuildStatus(summary);

      const result: ValidationResult = {
        criteriaId: 'build_check',
        status,
        score,
        severity:
          summary.errors > 0
            ? 'critical'
            : summary.warnings > 0
              ? 'medium'
              : 'info',
        message: this.generateBuildMessage(summary),
        details: this.generateBuildDetails(summary, buildResult),
        suggestions: this.generateBuildSuggestions(summary, buildResult),
        evidence: [
          {
            type: 'log',
            path: 'build-output.log',
            content: `STDOUT:\n${buildResult.stdout}\n\nSTDERR:\n${buildResult.stderr}`,
            metadata: {
              exitCode: buildResult.exitCode,
              duration: buildResult.duration,
            },
          },
          {
            type: 'report',
            path: 'build-summary.json',
            content: JSON.stringify(summary, null, 2),
            metadata: { outputFiles: buildResult.outputFiles.length },
          },
        ],
        timestamp: new Date(),
        duration: Date.now() - startTime,
      };

      this.logger.info(`Build validation completed`, {
        taskId: context.taskId,
        success: summary.success,
        score,
        errors: summary.errors,
        warnings: summary.warnings,
        duration: result.duration,
      });

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Unknown build validation error';

      this.logger.error(`Build validation failed for task: ${context.taskId}`, {
        error,
      });

      return {
        criteriaId: 'build_check',
        status: 'failed' as ValidationStatus,
        score: 0,
        severity: 'critical',
        message: 'Build validation execution failed',
        details: `Error: ${errorMessage}`,
        suggestions: [
          'Check that build tools are properly installed',
          'Verify package.json build scripts are correct',
          'Ensure all dependencies are available',
          'Check for syntax errors in source files',
        ],
        evidence: [],
        timestamp: new Date(),
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Detect build configuration from project files
   */
  private async detectBuildConfiguration(): Promise<any> {
    const configFiles = [
      'package.json',
      'tsconfig.json',
      'webpack.config.js',
      'vite.config.js',
      'rollup.config.js',
      'esbuild.config.js',
    ];

    const config: any = {};

    for (const file of configFiles) {
      try {
        const filePath = join(this.config.workingDirectory!, file);
        const content = await fs.readFile(filePath, 'utf-8');

        if (file === 'package.json') {
          const packageJson = JSON.parse(content);
          config.packageJson = packageJson;
          config.hasTypeScript =
            !!packageJson.devDependencies?.typescript ||
            !!packageJson.dependencies?.typescript;
          config.buildScript = packageJson.scripts?.build;
        } else if (file === 'tsconfig.json') {
          config.tsconfig = JSON.parse(content);
        } else {
          config[file.replace('.', '_')] = true;
        }
      } catch {
        // File doesn't exist or isn't readable
      }
    }

    return config;
  }

  /**
   * Check if build is required based on artifacts
   */
  private async checkIfBuildRequired(artifacts: any[]): Promise<boolean> {
    // Check for package.json with build script
    try {
      const packageJsonPath = join(
        this.config.workingDirectory!,
        'package.json',
      );
      const packageJson = JSON.parse(
        await fs.readFile(packageJsonPath, 'utf-8'),
      );

      if (packageJson.scripts?.build) {
        return true;
      }
    } catch {
      // No package.json or no build script
    }

    // Check for TypeScript files
    const hasTypeScript = artifacts.some(
      (artifact) => artifact.type === 'file' && artifact.path.endsWith('.ts'),
    );

    // Check for common build tool configs
    const buildConfigs = [
      'webpack.config.js',
      'vite.config.js',
      'rollup.config.js',
      'esbuild.config.js',
      'tsconfig.json',
    ];

    const hasBuildConfig = await Promise.all(
      buildConfigs.map(async (config) => {
        try {
          await fs.access(join(this.config.workingDirectory!, config));
          return true;
        } catch {
          return false;
        }
      }),
    ).then((results) => results.some(Boolean));

    return hasTypeScript || hasBuildConfig;
  }

  /**
   * Install project dependencies
   */
  private async installDependencies(): Promise<void> {
    this.logger.info('Installing dependencies...');

    const packageManager = this.config.packageManager!;
    const installArgs =
      packageManager === 'npm' ? ['ci'] : ['install', '--frozen-lockfile'];

    try {
      await this.runCommand(packageManager, installArgs, {
        timeout: 120000, // 2 minutes for dependency installation
        cwd: this.config.workingDirectory,
      });

      this.logger.info('Dependencies installed successfully');
    } catch (error) {
      throw new Error(`Failed to install dependencies: ${error}`);
    }
  }

  /**
   * Run the build process
   */
  private async runBuild(): Promise<BuildResult> {
    this.logger.info('Running build process...');

    const buildStartTime = Date.now();
    const command = this.config.buildCommand!;
    const args = this.config.buildArgs!;

    try {
      const { stdout, stderr, exitCode } = await this.runCommand(
        command,
        args,
        {
          timeout: this.config.timeout,
          cwd: this.config.workingDirectory,
        },
      );

      const duration = Date.now() - buildStartTime;
      const success = exitCode === 0;

      // Parse build output for errors and warnings
      const errors = this.parseBuildErrors(stderr + stdout);
      const warnings = this.parseBuildWarnings(stderr + stdout);

      // Find output files
      const outputFiles = await this.findBuildOutputs();

      return {
        success,
        exitCode,
        stdout,
        stderr,
        duration,
        outputFiles,
        errors,
        warnings,
      };
    } catch (error) {
      const duration = Date.now() - buildStartTime;

      return {
        success: false,
        exitCode:
          error && typeof error === 'object' && 'code' in error
            ? (error as any).code
            : 1,
        stdout:
          error && typeof error === 'object' && 'stdout' in error
            ? (error as any).stdout
            : '',
        stderr:
          error && typeof error === 'object' && 'stderr' in error
            ? (error as any).stderr
            : String(error),
        duration,
        outputFiles: [],
        errors: [
          {
            message: error instanceof Error ? error.message : String(error),
            severity: 'fatal' as const,
          },
        ],
        warnings: [],
      };
    }
  }

  /**
   * Validate build outputs
   */
  private async validateBuildOutputs(buildResult: BuildResult): Promise<{
    expectedFound: string[];
    expectedMissing: string[];
    unexpectedFiles: string[];
  }> {
    const expectedOutputs = this.config.expectedOutputs || [];
    const actualOutputs = buildResult.outputFiles;

    const expectedFound = expectedOutputs.filter((expected) =>
      actualOutputs.some((actual) => actual.includes(expected)),
    );

    const expectedMissing = expectedOutputs.filter(
      (expected) => !actualOutputs.some((actual) => actual.includes(expected)),
    );

    // Common output directories to check for unexpected files
    const outputDirs = ['dist', 'build', 'out', '.next'];
    const unexpectedFiles: string[] = [];

    for (const dir of outputDirs) {
      try {
        const dirPath = join(this.config.workingDirectory!, dir);
        const files = await fs.readdir(dirPath, { recursive: true });
        unexpectedFiles.push(...files.map((file) => join(dir, String(file))));
      } catch {
        // Directory doesn't exist
      }
    }

    return {
      expectedFound,
      expectedMissing,
      unexpectedFiles,
    };
  }

  /**
   * Find build output files
   */
  private async findBuildOutputs(): Promise<string[]> {
    const outputDirs = ['dist', 'build', 'out', '.next', 'lib'];
    const outputFiles: string[] = [];

    for (const dir of outputDirs) {
      try {
        const dirPath = join(this.config.workingDirectory!, dir);
        await fs.access(dirPath);

        const files = await this.findFilesRecursively(dirPath);
        outputFiles.push(...files);
      } catch {
        // Directory doesn't exist
      }
    }

    return outputFiles;
  }

  /**
   * Find files recursively in directory
   */
  private async findFilesRecursively(dirPath: string): Promise<string[]> {
    const files: string[] = [];
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dirPath, entry.name);

      if (entry.isDirectory()) {
        const subFiles = await this.findFilesRecursively(fullPath);
        files.push(...subFiles);
      } else {
        files.push(fullPath);
      }
    }

    return files;
  }

  /**
   * Parse build errors from output
   */
  private parseBuildErrors(output: string): BuildError[] {
    const errors: BuildError[] = [];

    // TypeScript error pattern
    const tsErrorPattern = /^(.+)\((\d+),(\d+)\): error TS(\d+): (.+)$/gm;
    let match;

    while ((match = tsErrorPattern.exec(output)) !== null) {
      errors.push({
        file: match[1],
        line: parseInt(match[2]),
        column: parseInt(match[3]),
        code: match[4],
        message: match[5],
        severity: 'error',
      });
    }

    // Generic error patterns
    const genericErrorPatterns = [
      /ERROR\s+(.+)/gi,
      /Error:\s+(.+)/gi,
      /✘\s+(.+)/gi,
      /Failed to compile/gi,
    ];

    for (const pattern of genericErrorPatterns) {
      pattern.lastIndex = 0; // Reset regex
      while ((match = pattern.exec(output)) !== null) {
        errors.push({
          message: match[1] || match[0],
          severity: 'error',
        });
      }
    }

    return errors;
  }

  /**
   * Parse build warnings from output
   */
  private parseBuildWarnings(output: string): BuildWarning[] {
    const warnings: BuildWarning[] = [];

    // TypeScript warning pattern
    const tsWarningPattern = /^(.+)\((\d+),(\d+)\): warning TS(\d+): (.+)$/gm;
    let match;

    while ((match = tsWarningPattern.exec(output)) !== null) {
      warnings.push({
        file: match[1],
        line: parseInt(match[2]),
        column: parseInt(match[3]),
        code: match[4],
        message: match[5],
      });
    }

    // Generic warning patterns
    const genericWarningPatterns = [
      /WARNING\s+(.+)/gi,
      /Warning:\s+(.+)/gi,
      /⚠\s+(.+)/gi,
    ];

    for (const pattern of genericWarningPatterns) {
      pattern.lastIndex = 0; // Reset regex
      while ((match = pattern.exec(output)) !== null) {
        warnings.push({
          message: match[1] || match[0],
        });
      }
    }

    return warnings;
  }

  /**
   * Analyze build results and generate summary
   */
  private analyzeBuildResults(
    buildResult: BuildResult,
    outputValidation: any,
  ): BuildSummary {
    return {
      success: buildResult.success,
      duration: buildResult.duration,
      outputFiles: buildResult.outputFiles.length,
      errors: buildResult.errors.length,
      warnings: buildResult.warnings.length,
      compiledFiles: this.countCompiledFiles(buildResult.stdout),
      skippedFiles: this.countSkippedFiles(buildResult.stdout),
      bundleSize: this.extractBundleSize(buildResult.stdout),
    };
  }

  /**
   * Count compiled files from build output
   */
  private countCompiledFiles(stdout: string): number {
    const patterns = [
      /compiled (\d+) files?/i,
      /(\d+) files? compiled/i,
      /built (\d+) files?/i,
    ];

    for (const pattern of patterns) {
      const match = pattern.exec(stdout);
      if (match) {
        return parseInt(match[1]);
      }
    }

    return 0;
  }

  /**
   * Count skipped files from build output
   */
  private countSkippedFiles(stdout: string): number {
    const patterns = [/skipped (\d+) files?/i, /(\d+) files? skipped/i];

    for (const pattern of patterns) {
      const match = pattern.exec(stdout);
      if (match) {
        return parseInt(match[1]);
      }
    }

    return 0;
  }

  /**
   * Extract bundle size from build output
   */
  private extractBundleSize(stdout: string): number | undefined {
    const patterns = [
      /bundle size:\s*(\d+(?:\.\d+)?)\s*(kb|mb)/i,
      /total size:\s*(\d+(?:\.\d+)?)\s*(kb|mb)/i,
      /(\d+(?:\.\d+)?)\s*(kb|mb)\s*total/i,
    ];

    for (const pattern of patterns) {
      const match = pattern.exec(stdout);
      if (match) {
        const size = parseFloat(match[1]);
        const unit = match[2].toLowerCase();
        return unit === 'mb' ? size * 1024 : size; // Convert to KB
      }
    }

    return undefined;
  }

  /**
   * Calculate build score
   */
  private calculateBuildScore(summary: BuildSummary): number {
    if (!summary.success) return 0;

    let score = 100;

    // Deduct for errors (critical)
    score -= summary.errors * 20;

    // Deduct for warnings (less critical)
    score -= summary.warnings * 5;

    // Performance bonus/penalty based on build time
    if (summary.duration < 30000) {
      // < 30 seconds
      score += 5;
    } else if (summary.duration > 120000) {
      // > 2 minutes
      score -= 10;
    }

    // Output files bonus
    if (summary.outputFiles > 0) {
      score += 5;
    }

    return Math.max(0, Math.min(100, Math.round(score * 100) / 100));
  }

  /**
   * Determine build validation status
   */
  private determineBuildStatus(summary: BuildSummary): ValidationStatus {
    if (!summary.success || summary.errors > 0) {
      return 'failed';
    } else if (summary.warnings > 0) {
      return 'requires_review';
    } else {
      return 'passed';
    }
  }

  /**
   * Generate build message
   */
  private generateBuildMessage(summary: BuildSummary): string {
    if (summary.success && summary.errors === 0) {
      return `Build completed successfully in ${Math.round(summary.duration / 1000)}s with ${summary.outputFiles} output files`;
    }

    if (!summary.success) {
      return `Build failed with ${summary.errors} errors and ${summary.warnings} warnings`;
    }

    return `Build completed with issues: ${summary.errors} errors, ${summary.warnings} warnings`;
  }

  /**
   * Generate detailed build report
   */
  private generateBuildDetails(
    summary: BuildSummary,
    buildResult: BuildResult,
  ): string {
    let details = `## Build Validation Report\n\n`;

    details += `### Summary\n`;
    details += `- Success: ${summary.success}\n`;
    details += `- Duration: ${Math.round(summary.duration / 1000)}s\n`;
    details += `- Output Files: ${summary.outputFiles}\n`;
    details += `- Errors: ${summary.errors}\n`;
    details += `- Warnings: ${summary.warnings}\n`;
    details += `- Compiled Files: ${summary.compiledFiles}\n`;
    if (summary.bundleSize) {
      details += `- Bundle Size: ${summary.bundleSize}KB\n`;
    }
    details += `\n`;

    if (buildResult.errors.length > 0) {
      details += `### Errors\n`;
      for (const error of buildResult.errors.slice(0, 10)) {
        details += `- **${error.file || 'Unknown'}**: ${error.message}\n`;
      }
      details += `\n`;
    }

    if (buildResult.warnings.length > 0) {
      details += `### Warnings\n`;
      for (const warning of buildResult.warnings.slice(0, 5)) {
        details += `- **${warning.file || 'Unknown'}**: ${warning.message}\n`;
      }
      details += `\n`;
    }

    return details;
  }

  /**
   * Generate build improvement suggestions
   */
  private generateBuildSuggestions(
    summary: BuildSummary,
    buildResult: BuildResult,
  ): string[] {
    const suggestions: string[] = [];

    if (!summary.success) {
      suggestions.push('Fix build errors to ensure successful compilation');
    }

    if (summary.errors > 0) {
      suggestions.push('Address compilation errors in source files');
    }

    if (summary.warnings > 0) {
      suggestions.push('Resolve build warnings to improve code quality');
    }

    if (summary.duration > 120000) {
      // > 2 minutes
      suggestions.push(
        'Consider optimizing build performance with caching or parallel builds',
      );
    }

    if (summary.outputFiles === 0 && summary.success) {
      suggestions.push('Verify build output directory and file generation');
    }

    // Analyze specific error types
    const tsErrors = buildResult.errors.filter((e) => e.code?.startsWith('TS'));
    if (tsErrors.length > 0) {
      suggestions.push('Review TypeScript configuration and type definitions');
    }

    if (suggestions.length === 0) {
      suggestions.push(
        'Build validation passed - maintain current build configuration',
      );
    }

    return suggestions.slice(0, 5);
  }

  /**
   * Run external command with options
   */
  private runCommand(
    command: string,
    args: string[],
    options: { timeout?: number; cwd?: string } = {},
  ): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, {
        cwd: options.cwd || process.cwd(),
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      let stdout = '';
      let stderr = '';
      let timeout: NodeJS.Timeout | null = null;

      if (options.timeout) {
        timeout = setTimeout(() => {
          child.kill('SIGTERM');
          reject(
            new Error(
              `Command '${command}' timed out after ${options.timeout}ms`,
            ),
          );
        }, options.timeout);
      }

      child.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        if (timeout) clearTimeout(timeout);

        resolve({
          stdout,
          stderr,
          exitCode: code || 0,
        });
      });

      child.on('error', (error) => {
        if (timeout) clearTimeout(timeout);
        reject(
          new Error(`Failed to start command '${command}': ${error.message}`),
        );
      });
    });
  }
}
