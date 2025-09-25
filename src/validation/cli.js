#!/usr/bin/env node

/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ValidationCLI,
  ValidationCommand,
  ValidationCommandArgs,
} from './ValidationIntegration.js';
import { resolve } from 'node:path';
import { cwd } from 'node:process';
/**
 * Command-line interface for the Automatic Validation System.
 *
 * Usage:
 *   validation-cli validate-task --description "Fix authentication bug" --category "bug-fix"
 *   validation-cli validate-feature --feature-id "auth-system"
 *   validation-cli validate-project
 *   validation-cli validate-commit --commit-message "feat: add user authentication"
 */
async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    displayUsage();
    process.exit(1);
  }
  const command = args[0];
  const commandArgs = parseArgs(args.slice(1));
  // Determine project root
  const projectRoot = commandArgs.root || findProjectRoot() || cwd();
  try {
    const cli = new ValidationCLI(projectRoot);
    await cli.executeCommand(command, commandArgs);
  } catch (error) {
    console.error('❌ Validation CLI Error:', error.message);
    process.exit(1);
  }
}
/**
 * Parse command-line arguments into structured format.
 */
function parseArgs(args) {
  const parsed = {};
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i];
    const value = args[i + 1];
    if (!key?.startsWith('--') || !value) {
      continue;
    }
    const cleanKey = key.replace('--', '').replace('-', '');
    switch (cleanKey) {
      case 'description':
      case 'desc':
        parsed.description = value;
        break;
      case 'category':
      case 'cat':
        parsed.category = value;
        break;
      case 'featureid':
      case 'feature':
        parsed.featureId = value;
        break;
      case 'commitmessage':
      case 'message':
        parsed.commitMessage = value;
        break;
      case 'root':
      case 'projectroot':
        parsed.root = value;
        break;
      default:
        parsed[cleanKey] = value;
    }
  }
  return parsed;
}
/**
 * Find project root by looking for package.json or git repository.
 */
function findProjectRoot() {
  let currentDir = cwd();
  while (currentDir !== '/') {
    try {
      // Check for package.json
      require.resolve(resolve(currentDir, 'package.json'));
      return currentDir;
    } catch {
      // Check for .git directory
      try {
        const fs = require('node:fs');
        fs.accessSync(resolve(currentDir, '.git'));
        return currentDir;
      } catch {
        // Move up one directory
        currentDir = resolve(currentDir, '..');
      }
    }
  }
  return null;
}
/**
 * Display usage information.
 */
function displayUsage() {
  console.log(`
🚀 Automatic Validation System CLI

USAGE:
  validation-cli <command> [options]

COMMANDS:
  validate-task       Validate task completion with quality gates
  validate-feature    Validate feature implementation completion
  validate-project    Validate entire project for completion readiness
  validate-commit     Validate commit readiness with pre-commit checks

OPTIONS:
  --description <text>     Task description for validation context
  --category <type>        Task category: feature|bug-fix|refactoring|testing|documentation
  --feature-id <id>        Feature ID from FEATURES.json
  --commit-message <msg>   Commit message for commit validation
  --root <path>           Project root directory (auto-detected if not specified)

EXAMPLES:

  # Validate task completion with specific category
  validation-cli validate-task --description "Implement user authentication" --category "feature"

  # Validate specific feature from FEATURES.json
  validation-cli validate-feature --feature-id "user-auth-system"

  # Validate project completion readiness
  validation-cli validate-project

  # Validate commit readiness with message analysis
  validation-cli validate-commit --commit-message "fix: resolve login validation bug"

  # Validate bug fix completion
  validation-cli validate-task --description "Fix memory leak in data processor" --category "bug-fix"

  # Validate refactoring completion
  validation-cli validate-task --description "Refactor authentication module" --category "refactoring"

QUALITY GATES:

The validation system executes different quality gates based on task type:

Feature Implementation:
  ✅ Linting validation (ESLint)
  ✅ Type checking (TypeScript)
  ✅ Build validation
  ✅ Unit test execution
  ✅ Integration tests
  ✅ Security scanning
  ✅ Git status check
  ✅ File integrity check

Bug Fix:
  ✅ Linting validation
  ✅ Type checking
  ✅ Regression testing
  ✅ Affected component tests
  ✅ Git status check

Refactoring:
  ✅ Full linting validation
  ✅ Comprehensive type checking
  ✅ Complete test suite
  ✅ Performance validation
  ✅ Git status check

Testing:
  ✅ Test syntax validation
  ✅ Test execution
  ✅ Coverage validation
  ✅ Git status check

Documentation:
  ✅ Markdown validation
  ✅ Link checking
  ✅ Spell checking
  ✅ Git status check

EXIT CODES:
  0  All quality gates passed
  1  Quality gate failures or validation error

INTEGRATION:

The validation system integrates with:
- TodoWrite task management
- FEATURES.json feature tracking
- Git workflow and commit validation
- CI/CD pipelines via standardized reports
- Existing project tooling (ESLint, TypeScript, npm scripts)

For more information, see the project documentation.
`);
}
// Handle uncaught exceptions gracefully
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error.message);
  process.exit(1);
});
process.on('unhandledRejection', (reason) => {
  console.error('❌ Unhandled Rejection:', reason);
  process.exit(1);
});
// Execute main function
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ CLI Error:', error.message);
    process.exit(1);
  });
}
//# sourceMappingURL=cli.js.map
