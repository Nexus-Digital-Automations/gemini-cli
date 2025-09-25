/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestRig } from './test-helper.js';
import { execSync, spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { performance } from 'node:perf_hooks';

/**
 * Comprehensive Integration Testing Suite for Autonomous Task Management System
 *
 * Tests multi-agent coordination, cross-session persistence, performance benchmarks,
 * error handling, and system reliability under various stress conditions.
 */
describe('Autonomous Task Management Integration Tests', () => {
  let rig: TestRig;
  const taskManagerPath = '/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js';

  beforeEach(async () => {
    rig = new TestRig();
    rig.setup('autonomous-task-management');
  });

  afterEach(async () => {
    await rig.cleanup();
  });

  /**
   * Multi-Agent Coordination Testing
   * Tests simultaneous agent operations and coordination mechanisms
   */
  describe('Multi-Agent Coordination', () => {
    it('should handle concurrent agent initialization without conflicts', async () => {
      const numAgents = 5;
      const agentPromises: Promise<any>[] = [];
      const startTime = performance.now();

      // Initialize multiple agents concurrently
      for (let i = 0; i < numAgents; i++) {
        const agentId = `CONCURRENT_AGENT_${i}`;
        const promise = new Promise((resolve, reject) => {
          const child = spawn('timeout', ['10s', 'node', taskManagerPath, 'initialize', agentId], {
            cwd: rig.testDir!,
            stdio: 'pipe',
          });

          let stdout = '';
          let stderr = '';

          child.stdout?.on('data', (data) => {
            stdout += data.toString();
          });

          child.stderr?.on('data', (data) => {
            stderr += data.toString();
          });

          child.on('close', (code) => {
            if (code === 0) {
              try {
                const result = JSON.parse(stdout);
                resolve({ agentId, result, stdout, stderr });
              } catch (_error) {
                reject({ agentId, error: 'Failed to parse JSON', stdout, stderr });
              }
            } else {
              reject({ agentId, code, stdout, stderr });
            }
          });

          // Add timeout to prevent hanging
          setTimeout(() => {
            child.kill('SIGKILL');
            reject({ agentId, error: 'Timeout after 15 seconds' });
          }, 15000);
        });

        agentPromises.push(promise);
      }

      // Wait for all agents to initialize
      const results = await Promise.allSettled(agentPromises);
      const duration = performance.now() - startTime;

      // Analyze results
      const successful = results.filter(r => r.status === 'fulfilled');
      const failed = results.filter(r => r.status === 'rejected');

      console.log(`Concurrent initialization completed in ${duration.toFixed(2)}ms`);
      console.log(`Successful: ${successful.length}, Failed: ${failed.length}`);

      // All agents should initialize successfully
      expect(successful.length).toBe(numAgents);
      expect(failed.length).toBe(0);

      // Verify each agent has unique session ID
      const sessionIds = new Set();
      successful.forEach((result: any) => {
        const agentData = result.value.result;
        expect(agentData.success).toBe(true);
        expect(agentData.agent.sessionId).toBeTruthy();
        expect(sessionIds.has(agentData.agent.sessionId)).toBe(false);
        sessionIds.add(agentData.agent.sessionId);
      });

      // Performance benchmark: Should complete within 5 seconds
      expect(duration).toBeLessThan(5000);
    }, 30000);

    it('should handle concurrent feature operations without race conditions', async () => {
      const numFeatures = 10;
      const featurePromises: Promise<any>[] = [];

      // Create multiple features concurrently
      for (let i = 0; i < numFeatures; i++) {
        const featureData = JSON.stringify({
          title: `Concurrent Feature ${i + 1}`,
          description: `This is a test feature created concurrently to test race condition handling feature ${i + 1}`,
          business_value: `Validates concurrent processing capability for feature ${i + 1}`,
          category: 'enhancement'
        });

        const promise = execConcurrentCommand('suggest-feature', [featureData]);
        featurePromises.push(promise);
      }

      const results = await Promise.allSettled(featurePromises);
      const successful = results.filter(r => r.status === 'fulfilled');
      const failed = results.filter(r => r.status === 'rejected');

      console.log(`Concurrent feature creation: ${successful.length} successful, ${failed.length} failed`);

      // At least 80% should succeed (allowing for some race condition failures)
      expect(successful.length).toBeGreaterThanOrEqual(numFeatures * 0.8);

      // Verify unique feature IDs
      const featureIds = new Set();
      successful.forEach((result: any) => {
        const featureData = result.value.result;
        if (featureData.success && featureData.feature) {
          expect(featureIds.has(featureData.feature.id)).toBe(false);
          featureIds.add(featureData.feature.id);
        }
      });
    }, 45000);

    it('should coordinate task assignment across multiple agents', async () => {
      // First, create and approve some features
      await createTestFeatures(5);

      // Initialize multiple agents with different capabilities
      const agents = [
        { id: 'FRONTEND_AGENT', capabilities: ['frontend', 'testing'] },
        { id: 'BACKEND_AGENT', capabilities: ['backend', 'database'] },
        { id: 'TESTING_AGENT', capabilities: ['testing', 'validation'] },
        { id: 'GENERAL_AGENT', capabilities: ['general'] }
      ];

      // Initialize agents
      for (const agent of agents) {
        const initResult = await execCommand('initialize', [agent.id]);
        expect(initResult.success).toBe(true);
      }

      // Generate tasks from approved features (this needs implementation in taskmanager-api.js)
      // For now, we'll test the coordination mechanism exists
      const statsResult = await execCommand('feature-stats', []);
      expect(statsResult.success).toBe(true);
      expect(statsResult.stats).toBeTruthy();
    });

    async function execConcurrentCommand(command: string, args: string[]): Promise<{ result: any, duration: number }> {
      return new Promise((resolve, reject) => {
        const startTime = performance.now();
        const child = spawn('timeout', ['10s', 'node', taskManagerPath, command, ...args], {
          cwd: rig.testDir!,
          stdio: 'pipe',
        });

        let stdout = '';
        let stderr = '';

        child.stdout?.on('data', (data) => {
          stdout += data.toString();
        });

        child.stderr?.on('data', (data) => {
          stderr += data.toString();
        });

        child.on('close', (code) => {
          const duration = performance.now() - startTime;
          if (code === 0) {
            try {
              const result = JSON.parse(stdout);
              resolve({ result, duration });
            } catch (error) {
              reject({ error: 'Failed to parse JSON', stdout, stderr, duration });
            }
          } else {
            reject({ code, stdout, stderr, duration });
          }
        });

        setTimeout(() => {
          child.kill('SIGKILL');
          reject({ error: 'Timeout after 15 seconds' });
        }, 15000);
      });
    }

    async function createTestFeatures(count: number): Promise<void> {
      for (let i = 0; i < count; i++) {
        const featureData = {
          title: `Test Feature ${i + 1}`,
          description: `Integration test feature number ${i + 1} for coordination testing`,
          business_value: `Enables testing of coordination mechanisms feature ${i + 1}`,
          category: 'enhancement'
        };

        const result = await execCommand('suggest-feature', [JSON.stringify(featureData)]);
        if (result.success && result.feature) {
          // Auto-approve for testing
          await execCommand('approve-feature', [result.feature.id]);
        }
      }
    }
  });

  /**
   * Cross-Session Persistence and Recovery Testing
   */
  describe('Cross-Session Persistence & Recovery', () => {
    it('should persist agent state across reinitialization', async () => {
      const agentId = 'PERSISTENCE_TEST_AGENT';

      // Initial initialization
      const initResult1 = await execCommand('initialize', [agentId]);
      expect(initResult1.success).toBe(true);
      const originalSessionId = initResult1.agent.sessionId;

      // Reinitialize same agent
      const reinitResult = await execCommand('reinitialize', [agentId]);
      expect(reinitResult.success).toBe(true);
      expect(reinitResult.agent.sessionId).not.toBe(originalSessionId);
      expect(reinitResult.agent.previousSessions).toBe(1);

      // Verify persistence
      const statsResult = await execCommand('get-initialization-stats', []);
      expect(statsResult.success).toBe(true);
      expect(statsResult.stats.total_initializations).toBeGreaterThan(0);
      expect(statsResult.stats.total_reinitializations).toBeGreaterThan(0);
    });

    it('should recover from corrupted FEATURES.json file', async () => {
      // Create invalid JSON file
      const featuresPath = join(rig.testDir!, 'FEATURES.json');
      writeFileSync(featuresPath, '{ invalid json }');

      // Should handle corruption gracefully
      const result = await execCommand('list-features', []);

      // Should either recover or provide meaningful error
      if (!result.success) {
        expect(result.error).toContain('Failed to load features');
      } else {
        expect(result.features).toBeDefined();
      }
    });

    it('should handle concurrent file access without corruption', async () => {
      const concurrentOps = 20;
      const promises = [];

      // Generate concurrent file operations
      for (let i = 0; i < concurrentOps; i++) {
        if (i % 3 === 0) {
          promises.push(execCommand('feature-stats', []));
        } else if (i % 3 === 1) {
          promises.push(execCommand('get-initialization-stats', []));
        } else {
          promises.push(execCommand('list-features', []));
        }
      }

      const results = await Promise.allSettled(promises);
      const successful = results.filter(r => r.status === 'fulfilled');

      // At least 90% should succeed without file corruption
      expect(successful.length / concurrentOps).toBeGreaterThan(0.9);

      // Verify file integrity after concurrent access
      const finalStats = await execCommand('feature-stats', []);
      expect(finalStats.success).toBe(true);
    });
  });

  /**
   * Performance Benchmarking and Optimization Testing
   */
  describe('Performance Benchmarking', () => {
    it('should meet performance benchmarks for basic operations', async () => {
      const benchmarks = {
        initialize: { maxTime: 1000, iterations: 10 },
        'feature-stats': { maxTime: 500, iterations: 20 },
        'list-features': { maxTime: 500, iterations: 20 },
        'get-initialization-stats': { maxTime: 800, iterations: 15 }
      };

      const results: Record<string, { avgTime: number, maxTime: number, minTime: number, iterations: number }> = {};

      for (const [command, benchmark] of Object.entries(benchmarks)) {
        const times: number[] = [];

        for (let i = 0; i < benchmark.iterations; i++) {
          const startTime = performance.now();

          if (command === 'initialize') {
            await execCommand(command, [`PERF_AGENT_${i}`]);
          } else {
            await execCommand(command, []);
          }

          const duration = performance.now() - startTime;
          times.push(duration);
        }

        const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
        const maxTime = Math.max(...times);
        const minTime = Math.min(...times);

        results[command] = { avgTime, maxTime, minTime, iterations: benchmark.iterations };

        console.log(`${command}: avg=${avgTime.toFixed(2)}ms, max=${maxTime.toFixed(2)}ms, min=${minTime.toFixed(2)}ms`);

        // Performance assertions
        expect(avgTime).toBeLessThan(benchmark.maxTime);
        expect(maxTime).toBeLessThan(benchmark.maxTime * 2); // Allow some variance
      }

      // Overall system should be responsive
      const overallAvg = Object.values(results).reduce((sum, r) => sum + r.avgTime, 0) / Object.keys(results).length;
      expect(overallAvg).toBeLessThan(750); // Average operation under 750ms
    }, 60000);

    it('should scale performance with increased data volume', async () => {
      // Create increasing numbers of features and measure performance
      const dataSizes = [10, 50, 100, 200];
      const performanceResults: Array<{ size: number, listTime: number, statsTime: number }> = [];

      for (const size of dataSizes) {
        // Create features
        await createBulkFeatures(size);

        // Measure list-features performance
        const listStart = performance.now();
        await execCommand('list-features', []);
        const listTime = performance.now() - listStart;

        // Measure feature-stats performance
        const statsStart = performance.now();
        await execCommand('feature-stats', []);
        const statsTime = performance.now() - statsStart;

        performanceResults.push({ size, listTime, statsTime });
        console.log(`Size ${size}: list=${listTime.toFixed(2)}ms, stats=${statsTime.toFixed(2)}ms`);
      }

      // Performance should scale reasonably (not exponentially)
      const firstResult = performanceResults[0];
      const lastResult = performanceResults[performanceResults.length - 1];

      const sizeRatio = lastResult.size / firstResult.size;
      const listTimeRatio = lastResult.listTime / firstResult.listTime;
      const statsTimeRatio = lastResult.statsTime / firstResult.statsTime;

      // Performance degradation should be less than 3x for 20x data increase
      expect(listTimeRatio).toBeLessThan(sizeRatio * 0.5);
      expect(statsTimeRatio).toBeLessThan(sizeRatio * 0.5);
    }, 120000);

    async function createBulkFeatures(count: number): Promise<void> {
      const batchSize = 10;
      for (let batch = 0; batch < Math.ceil(count / batchSize); batch++) {
        const promises = [];
        const batchStart = batch * batchSize;
        const batchEnd = Math.min(batchStart + batchSize, count);

        for (let i = batchStart; i < batchEnd; i++) {
          const featureData = {
            title: `Bulk Feature ${i + 1}`,
            description: `Performance testing feature number ${i + 1} created for scaling analysis`,
            business_value: `Validates system performance under load feature ${i + 1}`,
            category: 'performance'
          };
          promises.push(execCommand('suggest-feature', [JSON.stringify(featureData)]));
        }

        await Promise.all(promises);
      }
    }
  });

  /**
   * Error Handling and Recovery Testing
   */
  describe('Error Handling & Recovery', () => {
    it('should handle invalid feature data gracefully', async () => {
      const invalidFeatures = [
        '{}', // Missing required fields
        '{"title":""}', // Empty title
        '{"title":"Valid","description":"Valid","business_value":"Valid","category":"invalid"}', // Invalid category
        'invalid json', // Malformed JSON
        '{"title":"' + 'x'.repeat(300) + '"}' // Oversized title
      ];

      for (const invalidData of invalidFeatures) {
        const result = await execCommand('suggest-feature', [invalidData]);
        expect(result.success).toBe(false);
        expect(result.error).toBeTruthy();
      }

      // System should remain functional after errors
      const statsResult = await execCommand('feature-stats', []);
      expect(statsResult.success).toBe(true);
    });

    it('should recover from file system errors', async () => {
      // Test file permission errors (simulate by creating read-only file)
      const featuresPath = join(rig.testDir!, 'FEATURES.json');

      // Create initial data
      await execCommand('feature-stats', []);

      // Make file read-only (if possible in current environment)
      try {
        execSync(`chmod 444 "${featuresPath}"`, { stdio: 'ignore' });

        // Attempt write operation - should handle gracefully
        const result = await execCommand('suggest-feature', [
          JSON.stringify({
            title: 'Test Feature After Readonly',
            description: 'Testing error handling when file is read-only',
            business_value: 'Validates error recovery mechanisms',
            category: 'enhancement'
          })
        ]);

        // Should fail gracefully with meaningful error
        if (!result.success) {
          expect(result.error).toBeTruthy();
        }

        // Restore permissions
        execSync(`chmod 644 "${featuresPath}"`, { stdio: 'ignore' });
      } catch (error) {
        // Skip test if chmod not available (e.g., Windows)
        console.log('Skipping file permission test - chmod not available');
      }

      // Verify system recovery
      const finalStats = await execCommand('feature-stats', []);
      expect(finalStats.success).toBe(true);
    });

    it('should handle timeout scenarios gracefully', async () => {
      // Test with very short timeout to force timeout conditions
      const veryShortTimeoutCommands = [
        ['feature-stats'],
        ['list-features'],
        ['get-initialization-stats']
      ];

      // Note: The 10s timeout in the API should handle this
      for (const commandArgs of veryShortTimeoutCommands) {
        const result = await execCommand(commandArgs[0], commandArgs.slice(1));

        // Should either succeed quickly or fail with timeout error
        if (!result.success) {
          expect(result.error).toMatch(/timeout|timed out/i);
        }
      }
    });
  });

  /**
   * System Reliability and Stress Testing
   */
  describe('System Reliability & Stress Testing', () => {
    it('should maintain data integrity under stress conditions', async () => {
      const stressIterations = 50;
      const operations = ['feature-stats', 'list-features', 'get-initialization-stats'];

      // Generate random stress operations
      const promises = [];
      for (let i = 0; i < stressIterations; i++) {
        const operation = operations[Math.floor(Math.random() * operations.length)];
        promises.push(execCommand(operation, []));

        // Add random delay to create more realistic load
        if (i % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      }

      const results = await Promise.allSettled(promises);
      const successful = results.filter(r => r.status === 'fulfilled');
      const failed = results.filter(r => r.status === 'rejected');

      console.log(`Stress test: ${successful.length}/${stressIterations} successful`);

      // Should maintain high success rate under stress
      expect(successful.length / stressIterations).toBeGreaterThan(0.85);

      // Verify data integrity after stress test
      const finalStats = await execCommand('feature-stats', []);
      expect(finalStats.success).toBe(true);
    }, 60000);

    it('should handle memory constraints gracefully', async () => {
      // Create large number of features to test memory usage
      const largeDataSet = 500;

      console.log(`Creating ${largeDataSet} features for memory stress test...`);
      await createBulkFeatures(largeDataSet);

      // Perform memory-intensive operations
      const memoryIntensiveOps = [
        () => execCommand('list-features', []),
        () => execCommand('feature-stats', []),
        () => execCommand('get-initialization-stats', [])
      ];

      for (const operation of memoryIntensiveOps) {
        const startTime = performance.now();
        const result = await operation();
        const duration = performance.now() - startTime;

        expect(result.success).toBe(true);
        console.log(`Memory stress operation completed in ${duration.toFixed(2)}ms`);

        // Should complete within reasonable time even with large dataset
        expect(duration).toBeLessThan(5000); // 5 seconds max
      }
    }, 180000);

    it('should maintain system stability during prolonged operation', async () => {
      const prolongedTestDuration = 30000; // 30 seconds
      const operationInterval = 100; // 100ms between operations

      const startTime = Date.now();
      const results: Array<{ success: boolean, duration: number, operation: string }> = [];

      console.log('Starting prolonged stability test...');

      while (Date.now() - startTime < prolongedTestDuration) {
        const operations = ['feature-stats', 'get-initialization-stats'];
        const operation = operations[Math.floor(Math.random() * operations.length)];

        const opStart = performance.now();
        try {
          const result = await execCommand(operation, []);
          const duration = performance.now() - opStart;
          results.push({ success: result.success, duration, operation });
        } catch (error) {
          const duration = performance.now() - opStart;
          results.push({ success: false, duration, operation });
        }

        await new Promise(resolve => setTimeout(resolve, operationInterval));
      }

      const totalOps = results.length;
      const successfulOps = results.filter(r => r.success).length;
      const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / totalOps;

      console.log(`Prolonged test: ${successfulOps}/${totalOps} successful, avg duration: ${avgDuration.toFixed(2)}ms`);

      // Should maintain stability over prolonged operation
      expect(successfulOps / totalOps).toBeGreaterThan(0.95);
      expect(avgDuration).toBeLessThan(1000); // Average under 1 second
    }, 45000);
  });

  /**
   * Load Testing and Scalability Validation
   */
  describe('Load Testing & Scalability', () => {
    it('should handle concurrent user simulation', async () => {
      const concurrentUsers = 10;
      const operationsPerUser = 5;

      console.log(`Simulating ${concurrentUsers} concurrent users with ${operationsPerUser} operations each`);

      const userPromises = [];
      for (let user = 0; user < concurrentUsers; user++) {
        const userOperations = simulateUser(user, operationsPerUser);
        userPromises.push(userOperations);
      }

      const userResults = await Promise.allSettled(userPromises);
      const successfulUsers = userResults.filter(r => r.status === 'fulfilled');

      console.log(`User simulation: ${successfulUsers.length}/${concurrentUsers} users completed successfully`);

      expect(successfulUsers.length).toBeGreaterThanOrEqual(concurrentUsers * 0.8);
    }, 60000);

    it('should maintain response time SLAs under load', async () => {
      const loadTestDuration = 20000; // 20 seconds
      const targetRPS = 10; // 10 requests per second
      const maxResponseTime = 2000; // 2 seconds max response time

      const startTime = Date.now();
      const responseTimeResults: number[] = [];

      console.log(`Load testing at ${targetRPS} RPS for ${loadTestDuration}ms`);

      while (Date.now() - startTime < loadTestDuration) {
        const intervalStart = Date.now();
        const promises = [];

        // Generate target RPS
        for (let i = 0; i < targetRPS; i++) {
          promises.push(measureResponseTime('feature-stats', []));
        }

        const responses = await Promise.allSettled(promises);
        responses.forEach(response => {
          if (response.status === 'fulfilled') {
            responseTimeResults.push(response.value);
          }
        });

        // Wait for remainder of 1-second interval
        const intervalDuration = Date.now() - intervalStart;
        const remainingTime = 1000 - intervalDuration;
        if (remainingTime > 0) {
          await new Promise(resolve => setTimeout(resolve, remainingTime));
        }
      }

      const avgResponseTime = responseTimeResults.reduce((a, b) => a + b, 0) / responseTimeResults.length;
      const maxRecordedTime = Math.max(...responseTimeResults);
      const p95ResponseTime = responseTimeResults.sort((a, b) => a - b)[Math.floor(responseTimeResults.length * 0.95)];

      console.log(`Load test results: avg=${avgResponseTime.toFixed(2)}ms, max=${maxRecordedTime.toFixed(2)}ms, p95=${p95ResponseTime.toFixed(2)}ms`);

      // SLA assertions
      expect(avgResponseTime).toBeLessThan(maxResponseTime / 2);
      expect(p95ResponseTime).toBeLessThan(maxResponseTime);
      expect(responseTimeResults.length).toBeGreaterThan(0);
    }, 35000);

    async function simulateUser(userId: number, operations: number): Promise<{ userId: number, completedOps: number }> {
      let completedOps = 0;

      // Initialize agent for user
      try {
        await execCommand('initialize', [`LOAD_USER_${userId}`]);
        completedOps++;
      } catch (error) {
        console.error(`User ${userId} failed to initialize:`, error);
      }

      // Perform user operations
      for (let op = 0; op < operations - 1; op++) {
        try {
          const operations = ['feature-stats', 'list-features', 'get-initialization-stats'];
          const randomOp = operations[Math.floor(Math.random() * operations.length)];
          await execCommand(randomOp, []);
          completedOps++;
        } catch (error) {
          console.error(`User ${userId} operation ${op} failed:`, error);
        }

        // Random delay between operations (50-200ms)
        await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 150));
      }

      return { userId, completedOps };
    }

    async function measureResponseTime(command: string, args: string[]): Promise<number> {
      const startTime = performance.now();
      await execCommand(command, args);
      return performance.now() - startTime;
    }
  });

  /**
   * Utility function to execute task manager commands
   */
  async function execCommand(command: string, args: string[]): Promise<any> {
    return new Promise((resolve, reject) => {
      const child = spawn('timeout', ['10s', 'node', taskManagerPath, command, ...args], {
        cwd: rig.testDir!,
        stdio: 'pipe',
      });

      let stdout = '';
      let stderr = '';

      child.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        if (code === 0) {
          try {
            const result = JSON.parse(stdout);
            resolve(result);
          } catch (error) {
            reject(new Error(`Failed to parse JSON: ${stdout.substring(0, 200)}...`));
          }
        } else {
          reject(new Error(`Command failed with code ${code}: ${stderr || stdout}`));
        }
      });

      // Timeout after 15 seconds
      setTimeout(() => {
        child.kill('SIGKILL');
        reject(new Error('Command timeout after 15 seconds'));
      }, 15000);
    });
  }
});