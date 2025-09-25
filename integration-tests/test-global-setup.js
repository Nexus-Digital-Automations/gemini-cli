/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { promises as fs } from 'node:fs';
import { join } from 'node:path';
/**
 * Global Setup for Integration Tests
 *
 * Runs once before all test suites to prepare the testing environment.
 * This includes validating the task manager API, creating test directories,
 * and setting up shared resources for all integration tests.
 */
const TASK_MANAGER_API =
  process.env.TASK_MANAGER_API_PATH ||
  '/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js';
const TEST_DIR =
  process.env.INTEGRATION_TEST_FILE_DIR || '/tmp/autonomous-tests';
export default async function globalSetup() {
  console.log('🔧 Starting Integration Test Global Setup...');
  try {
    // 1. Validate Task Manager API exists
    console.log(`📋 Validating Task Manager API at: ${TASK_MANAGER_API}`);
    try {
      await fs.access(TASK_MANAGER_API);
      console.log('✅ Task Manager API validated');
    } catch (_error) {
      throw new Error(`Task Manager API not found at: ${TASK_MANAGER_API}`);
    }
    // 2. Create and prepare test directories
    console.log(`📁 Setting up test directory: ${TEST_DIR}`);
    await fs.mkdir(TEST_DIR, { recursive: true });
    // Create subdirectories for different test types
    const testSubDirs = [
      'autonomous-tasks',
      'workflows',
      'performance',
      'ci-cd',
      'reliability',
      'temp',
    ];
    for (const subDir of testSubDirs) {
      await fs.mkdir(join(TEST_DIR, subDir), { recursive: true });
    }
    console.log('✅ Test directories created');
    // 3. Clean up any previous test artifacts
    console.log('🧹 Cleaning up previous test artifacts...');
    const tempFiles = await fs.readdir(TEST_DIR);
    for (const file of tempFiles) {
      if (file.startsWith('test-') || file.endsWith('.temp')) {
        try {
          await fs.unlink(join(TEST_DIR, file));
        } catch (_error) {
          // Ignore cleanup errors
        }
      }
    }
    // 4. Set environment variables for test consistency
    process.env.NODE_ENV = 'test';
    process.env.VITEST_ENVIRONMENT = 'autonomous-testing';
    process.env.TASK_MANAGER_TIMEOUT = '10000';
    // 5. Validate system resources
    console.log('💾 Checking system resources...');
    const memUsage = process.memoryUsage();
    const freeMem = Math.round(memUsage.heapUsed / 1024 / 1024);
    console.log(`📊 Initial memory usage: ${freeMem}MB heap`);
    if (freeMem > 1000) {
      console.warn(
        '⚠️ High initial memory usage detected - may affect test results',
      );
    }
    // 6. Create test results directory
    const resultsDir = join(TEST_DIR, 'test-results');
    await fs.mkdir(resultsDir, { recursive: true });
    await fs.mkdir(join(resultsDir, 'coverage'), { recursive: true });
    // 7. Log setup completion
    const setupSummary = {
      taskManagerApi: TASK_MANAGER_API,
      testDirectory: TEST_DIR,
      resultsDirectory: resultsDir,
      subDirectories: testSubDirs,
      initialMemoryMB: freeMem,
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
    };
    console.log(
      '📋 Global Setup Summary:',
      JSON.stringify(setupSummary, null, 2),
    );
    console.log('✅ Integration Test Global Setup Complete');
    // Store setup info for teardown
    await fs.writeFile(
      join(TEST_DIR, 'setup-info.json'),
      JSON.stringify(setupSummary, null, 2),
    );
  } catch (error) {
    console.error('❌ Global Setup Failed:', error);
    throw error;
  }
}
/**
 * Global Teardown
 *
 * Runs once after all test suites complete to clean up resources.
 */
export async function globalTeardown() {
  console.log('🧹 Starting Integration Test Global Teardown...');
  try {
    // Read setup info
    const setupInfoPath = join(TEST_DIR, 'setup-info.json');
    let _setupInfo = {};
    try {
      const setupData = await fs.readFile(setupInfoPath, 'utf8');
      _setupInfo = JSON.parse(setupData);
    } catch (_error) {
      console.log('ℹ️ No setup info found, proceeding with default cleanup');
    }
    // Clean up test directories (but preserve results)
    const preserveDirs = ['test-results'];
    const testDirs = await fs.readdir(TEST_DIR);
    for (const dir of testDirs) {
      if (!preserveDirs.includes(dir) && dir !== 'setup-info.json') {
        const dirPath = join(TEST_DIR, dir);
        try {
          const stat = await fs.stat(dirPath);
          if (stat.isDirectory()) {
            await fs.rmdir(dirPath, { recursive: true });
          } else {
            await fs.unlink(dirPath);
          }
        } catch (_error) {
          console.log(`⚠️ Could not clean up ${dirPath}:`, _error.message);
        }
      }
    }
    // Log memory usage at end
    const finalMemUsage = process.memoryUsage();
    const finalMem = Math.round(finalMemUsage.heapUsed / 1024 / 1024);
    console.log(`📊 Final memory usage: ${finalMem}MB heap`);
    // Generate teardown summary
    const teardownSummary = {
      testDirectory: TEST_DIR,
      finalMemoryMB: finalMem,
      preservedDirectories: preserveDirs,
      timestamp: new Date().toISOString(),
    };
    console.log(
      '📋 Global Teardown Summary:',
      JSON.stringify(teardownSummary, null, 2),
    );
    console.log('✅ Integration Test Global Teardown Complete');
  } catch (error) {
    console.error('❌ Global Teardown Failed:', error);
    // Don't throw during teardown to avoid masking test failures
  }
}
//# sourceMappingURL=test-global-setup.js.map
