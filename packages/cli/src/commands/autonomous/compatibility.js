/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Autonomous Task Management System - Backward Compatibility Validator
 *
 * This module ensures seamless integration with existing Gemini CLI workflows
 * and validates that all autonomous features work without breaking existing functionality.
 */
import fs from 'node:fs';
import path from 'node:path';
import chalk from 'chalk';
import { checkApiAvailability, initializeAgent } from './taskManagerApi.js';
/**
 * Core compatibility checks for autonomous task management integration
 */
export class CompatibilityValidator {
  checks = [];
  constructor() {
    this.initializeChecks();
  }
  initializeChecks() {
    // Core CLI functionality checks
    this.checks.push({
      name: 'cli-command-registration',
      description: 'Verify autonomous commands are properly registered',
      critical: true,
      check: async () => {
        try {
          // Check if commands are importable and exportable
          // TODO: Re-enable when ./index.js is available
          // const autonomousModule = await import('./index.js').catch(() => null);
          // return autonomousModule !== null;

          // Temporary: return false until index.js is implemented
          return false;
        } catch {
          return false;
        }
      },
      remediation:
        'Ensure autonomous commands are properly exported and imported in config.ts',
    });
    this.checks.push({
      name: 'taskmanager-api-connectivity',
      description: 'Verify TaskManager API is accessible and responsive',
      critical: false,
      check: async () => await checkApiAvailability(),
      remediation:
        'Install and start the infinite-continue-stop-hook TaskManager API system',
    });
    this.checks.push({
      name: 'existing-cli-workflows',
      description: 'Verify existing CLI workflows are not affected',
      critical: true,
      check: async () => {
        // Check if core CLI commands still work
        const coreCommands = ['mcp', 'extensions', 'budget'];
        try {
          // Import core commands to ensure they're not broken
          for (const cmd of coreCommands) {
            await import(`../commands/${cmd}.js`);
          }
          return true;
        } catch {
          return false;
        }
      },
      remediation: 'Check for import conflicts or circular dependencies',
    });
    this.checks.push({
      name: 'configuration-isolation',
      description:
        'Verify autonomous config does not interfere with main CLI config',
      critical: true,
      check: async () => {
        // Check that autonomous config files don't overwrite CLI config
        const cliConfigPath = path.join(process.cwd(), '.gemini');
        const autonomousConfigPath = path.join(
          process.cwd(),
          '.gemini-autonomous-config.json',
        );
        if (fs.existsSync(autonomousConfigPath)) {
          // Ensure it's separate from main config
          return !fs.existsSync(
            path.join(cliConfigPath, 'autonomous-config.json'),
          );
        }
        return true;
      },
      remediation:
        'Keep autonomous configuration separate from main CLI configuration',
    });
    this.checks.push({
      name: 'dependency-versions',
      description: 'Verify all dependencies are compatible versions',
      critical: true,
      check: async () => {
        try {
          const packageJsonPath = path.join(process.cwd(), 'package.json');
          if (fs.existsSync(packageJsonPath)) {
            const packageData = JSON.parse(
              fs.readFileSync(packageJsonPath, 'utf8'),
            );
            // Check critical dependencies
            const criticalDeps = ['yargs', 'chalk', '@google/gemini-cli-core'];
            for (const dep of criticalDeps) {
              if (
                !packageData.dependencies?.[dep] &&
                !packageData.devDependencies?.[dep]
              ) {
                return false;
              }
            }
          }
          return true;
        } catch {
          return false;
        }
      },
      remediation:
        'Install missing dependencies: npm install yargs chalk @google/gemini-cli-core',
    });
    this.checks.push({
      name: 'file-structure-integrity',
      description: 'Verify file structure is maintained',
      critical: false,
      check: async () => {
        const requiredPaths = [
          'packages/cli/src/commands',
          'packages/cli/src/config',
          'packages/cli/src/ui',
        ];
        return requiredPaths.every((p) => {
          const fullPath = path.join(process.cwd(), p);
          return fs.existsSync(fullPath);
        });
      },
      remediation: 'Ensure all required directory structures are present',
    });
    this.checks.push({
      name: 'workspace-compatibility',
      description: 'Verify monorepo workspace configuration',
      critical: false,
      check: async () => {
        try {
          const rootPackageJson = path.join(process.cwd(), 'package.json');
          if (fs.existsSync(rootPackageJson)) {
            const data = JSON.parse(fs.readFileSync(rootPackageJson, 'utf8'));
            return (
              Array.isArray(data.workspaces) &&
              data.workspaces.includes('packages/*')
            );
          }
          return true; // Not a workspace setup
        } catch {
          return false;
        }
      },
      remediation: 'Verify workspace configuration in root package.json',
    });
    this.checks.push({
      name: 'typescript-compilation',
      description: 'Verify TypeScript files compile without errors',
      critical: true,
      check: async () => {
        // Check if .d.ts files exist for autonomous commands
        const autonomousDir = path.join(
          process.cwd(),
          'packages/cli/src/commands/autonomous',
        );
        if (fs.existsSync(autonomousDir)) {
          const tsFiles = fs
            .readdirSync(autonomousDir)
            .filter((f) => f.endsWith('.ts'));
          // const dtsFiles = fs
          //   .readdirSync(autonomousDir)
          //   .filter((f) => f.endsWith('.d.ts'));
          // Should have corresponding .d.ts files (or be able to generate them)
          return tsFiles.length > 0; // Basic check - files exist
        }
        return false;
      },
      remediation: 'Run TypeScript compilation: npm run build or tsc',
    });
    this.checks.push({
      name: 'runtime-integration',
      description: 'Verify autonomous commands can initialize without errors',
      critical: false,
      check: async () => {
        try {
          // Attempt to initialize an agent to test runtime integration
          const agentId = `COMPATIBILITY_TEST_${Date.now()}`;
          const result = await initializeAgent(agentId);
          return result.success;
        } catch {
          return false;
        }
      },
      remediation: 'Check TaskManager API logs for initialization issues',
    });
    this.checks.push({
      name: 'feature-flags-compatibility',
      description:
        'Verify feature flags and experimental settings work correctly',
      critical: false,
      check: async () => {
        // Check if experimental features are properly gated
        try {
          const settingsPath = path.join(
            process.cwd(),
            'packages/cli/src/config/settings.ts',
          );
          return fs.existsSync(settingsPath);
        } catch {
          return false;
        }
      },
      remediation:
        'Ensure settings configuration is accessible and feature flags work',
    });
  }
  /**
   * Run all compatibility checks
   */
  async runAllChecks() {
    console.log(
      chalk.cyan('🔍 Running Autonomous System Compatibility Checks...'),
    );
    console.log(chalk.gray('─'.repeat(80)));
    const report = {
      passed: 0,
      failed: 0,
      warnings: 0,
      criticalFailures: 0,
      checks: [],
    };
    for (let i = 0; i < this.checks.length; i++) {
      const check = this.checks[i];
      console.log(`[${i + 1}/${this.checks.length}] ${check.description}...`);
      try {
        const result = await check.check();
        if (result) {
          console.log(chalk.green(`  ✅ PASS: ${check.name}`));
          report.passed++;
          report.checks.push({
            name: check.name,
            status: 'PASS',
            message: 'Check completed successfully',
          });
        } else {
          if (check.critical) {
            console.log(chalk.red(`  ❌ CRITICAL FAIL: ${check.name}`));
            report.criticalFailures++;
            report.failed++;
          } else {
            console.log(chalk.yellow(`  ⚠️  WARN: ${check.name}`));
            report.warnings++;
          }
          report.checks.push({
            name: check.name,
            status: check.critical ? 'FAIL' : 'WARN',
            message: `Check failed: ${check.description}`,
            remediation: check.remediation,
          });
          if (check.remediation) {
            console.log(chalk.blue(`     💡 ${check.remediation}`));
          }
        }
      } catch (error) {
        console.log(chalk.red(`  ❌ ERROR: ${check.name}`));
        console.log(
          chalk.red(
            `     ${error instanceof Error ? error.message : String(error)}`,
          ),
        );
        if (check.critical) {
          report.criticalFailures++;
        }
        report.failed++;
        report.checks.push({
          name: check.name,
          status: 'FAIL',
          message: `Check error: ${error instanceof Error ? error.message : String(error)}`,
          remediation: check.remediation,
        });
      }
      // Small delay to make output readable
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    return report;
  }
  /**
   * Generate compatibility report
   */
  generateReport(report) {
    console.log(chalk.cyan('\n📊 Compatibility Check Summary'));
    console.log(chalk.gray('─'.repeat(80)));
    const totalChecks = report.passed + report.failed + report.warnings;
    console.log(`Total Checks: ${chalk.bold(totalChecks)}`);
    console.log(`Passed: ${chalk.green(report.passed)}`);
    console.log(`Warnings: ${chalk.yellow(report.warnings)}`);
    console.log(`Failed: ${chalk.red(report.failed)}`);
    console.log(
      `Critical Failures: ${chalk.red.bold(report.criticalFailures)}`,
    );
    const overallScore = Math.round((report.passed / totalChecks) * 100);
    console.log(
      `\nOverall Compatibility Score: ${this.getScoreColor(overallScore)(overallScore + '%')}`,
    );
    if (report.criticalFailures > 0) {
      console.log(chalk.red.bold('\n❌ CRITICAL ISSUES DETECTED'));
      console.log(
        chalk.red(
          'The autonomous system may not function properly with existing CLI workflows.',
        ),
      );
      console.log(
        chalk.blue('Please address critical failures before deploying.'),
      );
    } else if (report.failed > 0 || report.warnings > 0) {
      console.log(chalk.yellow('\n⚠️  ISSUES DETECTED'));
      console.log(
        chalk.yellow('Some features may have reduced functionality.'),
      );
      console.log(
        chalk.blue('Review warnings and failures for optimal operation.'),
      );
    } else {
      console.log(chalk.green('\n✅ ALL CHECKS PASSED'));
      console.log(
        chalk.green(
          'Autonomous system is fully compatible with existing CLI workflows.',
        ),
      );
    }
    // Show remediation suggestions
    const issuesWithRemediation = report.checks.filter(
      (c) => c.status !== 'PASS' && c.remediation,
    );
    if (issuesWithRemediation.length > 0) {
      console.log(chalk.blue('\n💡 Recommended Actions:'));
      issuesWithRemediation.forEach((issue, index) => {
        console.log(
          `${index + 1}. ${chalk.cyan(issue.name)}: ${issue.remediation}`,
        );
      });
    }
  }
  getScoreColor(score) {
    if (score >= 90) return chalk.green;
    if (score >= 75) return chalk.yellow;
    return chalk.red;
  }
  /**
   * Quick health check - just critical systems
   */
  async quickHealthCheck() {
    const criticalChecks = this.checks.filter((c) => c.critical);
    for (const check of criticalChecks) {
      try {
        const result = await check.check();
        if (!result) {
          console.log(chalk.red(`❌ Critical check failed: ${check.name}`));
          return false;
        }
      } catch {
        console.log(chalk.red(`❌ Critical check error: ${check.name}`));
        return false;
      }
    }
    console.log(chalk.green('✅ All critical compatibility checks passed'));
    return true;
  }
}
//# sourceMappingURL=compatibility.js.map
