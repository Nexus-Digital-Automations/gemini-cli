/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  ValidationContext,
  ValidationResult,
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
export declare class BuildValidator {
  private readonly logger;
  private readonly config;
  constructor(config?: BuildValidationConfig);
  /**
   * Validate project build process
   */
  validate(context: ValidationContext): Promise<ValidationResult>;
  /**
   * Detect build configuration from project files
   */
  private detectBuildConfiguration;
  /**
   * Check if build is required based on artifacts
   */
  private checkIfBuildRequired;
  /**
   * Install project dependencies
   */
  private installDependencies;
  /**
   * Run the build process
   */
  private runBuild;
  /**
   * Validate build outputs
   */
  private validateBuildOutputs;
  /**
   * Find build output files
   */
  private findBuildOutputs;
  /**
   * Find files recursively in directory
   */
  private findFilesRecursively;
  /**
   * Parse build errors from output
   */
  private parseBuildErrors;
  /**
   * Parse build warnings from output
   */
  private parseBuildWarnings;
  /**
   * Analyze build results and generate summary
   */
  private analyzeBuildResults;
  /**
   * Count compiled files from build output
   */
  private countCompiledFiles;
  /**
   * Count skipped files from build output
   */
  private countSkippedFiles;
  /**
   * Extract bundle size from build output
   */
  private extractBundleSize;
  /**
   * Calculate build score
   */
  private calculateBuildScore;
  /**
   * Determine build validation status
   */
  private determineBuildStatus;
  /**
   * Generate build message
   */
  private generateBuildMessage;
  /**
   * Generate detailed build report
   */
  private generateBuildDetails;
  /**
   * Generate build improvement suggestions
   */
  private generateBuildSuggestions;
  /**
   * Run external command with options
   */
  private runCommand;
}
