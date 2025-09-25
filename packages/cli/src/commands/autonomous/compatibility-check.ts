/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { CommandModule } from 'yargs';
import chalk from 'chalk';
import { CompatibilityValidator } from './compatibility.js';

interface CompatibilityCheckOptions {
  quick?: boolean;
  json?: boolean;
  'fix-issues'?: boolean;
  verbose?: boolean;
}

export const compatibilityCheckCommand: CommandModule<
  {},
  CompatibilityCheckOptions
> = {
  command: 'compatibility-check',
  aliases: ['compat', 'check'],
  describe:
    'Run backward compatibility checks for autonomous task management integration',
  builder: (yargs) =>
    yargs
      .option('quick', {
        type: 'boolean',
        describe: 'Run only critical compatibility checks',
        default: false,
        alias: 'q',
      })
      .option('json', {
        type: 'boolean',
        describe: 'Output results in JSON format',
        default: false,
        alias: 'j',
      })
      .option('fix-issues', {
        type: 'boolean',
        describe: 'Attempt to automatically fix detected issues',
        default: false,
        alias: 'f',
      })
      .option('verbose', {
        type: 'boolean',
        describe: 'Show detailed information for each check',
        default: false,
        alias: 'v',
      })
      .example(
        'gemini autonomous compatibility-check',
        'Run all compatibility checks',
      )
      .example('gemini autonomous compat --quick', 'Run only critical checks')
      .example('gemini autonomous check --json', 'Output results as JSON')
      .example(
        'gemini autonomous compat --fix-issues',
        'Attempt to fix issues automatically',
      ),

  handler: async (argv) => {
    try {
      const validator = new CompatibilityValidator();

      if (argv.quick) {
        console.log(
          chalk.cyan('🚀 Running Quick Compatibility Check (Critical Only)...'),
        );
        console.log(chalk.gray('─'.repeat(60)));

        const success = await validator.quickHealthCheck();

        if (argv.json) {
          console.log(
            JSON.stringify(
              {
                success,
                message: success
                  ? 'All critical checks passed'
                  : 'Critical issues detected',
                timestamp: new Date().toISOString(),
              },
              null,
              2,
            ),
          );
        } else {
          if (success) {
            console.log(chalk.green('\n✅ Quick compatibility check passed!'));
            console.log(
              chalk.blue('Autonomous system is ready for basic operation.'),
            );
          } else {
            console.log(chalk.red('\n❌ Quick compatibility check failed!'));
            console.log(
              chalk.blue(
                'Run full compatibility check for detailed information.',
              ),
            );
            process.exit(1);
          }
        }
        return;
      }

      // Run full compatibility check
      const report = await validator.runAllChecks();

      if (argv.json) {
        // Output JSON report
        console.log(
          JSON.stringify(
            {
              summary: {
                totalChecks: report.passed + report.failed + report.warnings,
                passed: report.passed,
                failed: report.failed,
                warnings: report.warnings,
                criticalFailures: report.criticalFailures,
                overallScore: Math.round(
                  (report.passed /
                    (report.passed + report.failed + report.warnings)) *
                    100,
                ),
              },
              checks: report.checks,
              timestamp: new Date().toISOString(),
              success: report.criticalFailures === 0,
            },
            null,
            2,
          ),
        );
      } else {
        // Generate human-readable report
        validator.generateReport(report);

        // Show next steps
        console.log(chalk.blue('\n🔄 Next Steps:'));

        if (report.criticalFailures > 0) {
          console.log(
            '   • Address critical failures before using autonomous features',
          );
          console.log(
            '   • Run: gemini autonomous compatibility-check --fix-issues',
          );
          console.log('   • Check system logs for detailed error information');
        } else if (report.failed > 0 || report.warnings > 0) {
          console.log('   • Review warnings for optimal performance');
          console.log(
            '   • Consider fixing non-critical issues when convenient',
          );
          console.log('   • Monitor system performance after deployment');
        } else {
          console.log('   • Autonomous system is ready for full operation');
          console.log('   • Start the system: gemini autonomous start');
          console.log(
            '   • Add your first task: gemini autonomous tasks add "Your task"',
          );
        }

        // Show documentation links
        console.log(chalk.blue('\n📚 Documentation:'));
        console.log(
          '   • Integration Guide: docs/autonomous-task-management-architecture.md',
        );
        console.log(
          '   • Troubleshooting: development/essentials/troubleshooting.md',
        );
        console.log('   • API Reference: gemini autonomous help');
      }

      // Attempt to fix issues if requested
      if (argv['fix-issues']) {
        console.log(chalk.cyan('\n🔧 Attempting to fix detected issues...'));

        const fixableIssues = report.checks.filter(
          (c) =>
            c.status !== 'PASS' &&
            c.remediation &&
            (c.name.includes('dependency') || c.name.includes('configuration')),
        );

        if (fixableIssues.length > 0) {
          console.log(
            chalk.yellow(
              '⚠️  Automatic issue fixing is limited in this version.',
            ),
          );
          console.log(
            chalk.blue('Please manually address the following issues:'),
          );

          fixableIssues.forEach((issue, index) => {
            console.log(`${index + 1}. ${chalk.cyan(issue.name)}`);
            console.log(`   Action: ${issue.remediation}`);
          });
        } else {
          console.log(
            chalk.green('✅ No automatically fixable issues detected.'),
          );
        }
      }

      // Exit with appropriate code
      if (report.criticalFailures > 0) {
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red('❌ Compatibility check failed:'));
      console.error(
        chalk.red(error instanceof Error ? error.message : String(error)),
      );

      if (argv.verbose) {
        console.error(chalk.gray('Stack trace:'));
        console.error(
          chalk.gray(
            error instanceof Error ? error.stack : 'No stack trace available',
          ),
        );
      }

      process.exit(1);
    }
  },
};
