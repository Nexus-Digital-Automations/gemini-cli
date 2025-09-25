/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

export interface CompatibilityCheck {
  name: string;
  description: string;
  critical: boolean;
  check: () => Promise<boolean>;
  remediation?: string;
}
export interface CompatibilityReport {
  passed: number;
  failed: number;
  warnings: number;
  criticalFailures: number;
  checks: Array<{
    name: string;
    status: 'PASS' | 'FAIL' | 'WARN';
    message: string;
    remediation?: string;
  }>;
}
/**
 * Core compatibility checks for autonomous task management integration
 */
export declare class CompatibilityValidator {
  private checks;
  constructor();
  private initializeChecks;
  /**
   * Run all compatibility checks
   */
  runAllChecks(): Promise<CompatibilityReport>;
  /**
   * Generate compatibility report
   */
  generateReport(report: CompatibilityReport): void;
  private getScoreColor;
  /**
   * Quick health check - just critical systems
   */
  quickHealthCheck(): Promise<boolean>;
}
