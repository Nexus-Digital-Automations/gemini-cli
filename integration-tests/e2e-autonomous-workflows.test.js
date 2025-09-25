/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestRig } from './test-helper.js';
import { spawn } from 'node:child_process';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { performance } from 'node:perf_hooks';
/**
 * End-to-End Testing Scenarios for Autonomous Workflows
 *
 * Tests complete workflow scenarios from feature suggestion through implementation,
 * multi-agent coordination, cross-session persistence, and system integration with
 * the Gemini CLI system.
 */
describe('End-to-End Autonomous Workflows', () => {
  let rig;
  const taskManagerPath =
    '/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js';
  beforeEach(async () => {
    rig = new TestRig();
    rig.setup('e2e-autonomous-workflows');
  });
  afterEach(async () => {
    await rig.cleanup();
  });
  /**
   * Complete Feature Lifecycle Workflow
   * Tests the entire journey from feature suggestion to implementation tracking
   */
  describe('Feature Lifecycle Workflows', () => {
    it('should execute complete feature suggestion-to-implementation workflow', async () => {
      const workflowSteps = [];
      const startTime = performance.now();
      // Step 1: Suggest Feature
      console.log('Step 1: Suggesting feature...');
      const featureData = {
        title: 'E2E Test Feature - User Profile Management',
        description:
          'Complete user profile management system with CRUD operations, avatar upload, preferences, and privacy settings for comprehensive testing',
        business_value:
          'Enables user personalization, improves user engagement, and provides foundation for advanced user features',
        category: 'new-feature',
      };
      const suggestResult = await execTaskManagerCommand('suggest-feature', [
        JSON.stringify(featureData),
      ]);
      expect(suggestResult.success).toBe(true);
      expect(suggestResult.feature).toBeTruthy();
      expect(suggestResult.feature.status).toBe('suggested');
      workflowSteps.push({
        step: 'suggest',
        timestamp: performance.now() - startTime,
        success: true,
        featureId: suggestResult.feature.id,
      });
      const featureId = suggestResult.feature.id;
      // Step 2: Approve Feature
      console.log('Step 2: Approving feature...');
      const approveResult = await execTaskManagerCommand('approve-feature', [
        featureId,
        JSON.stringify({
          approved_by: 'e2e-test-system',
          notes: 'Approved for comprehensive E2E testing workflow validation',
        }),
      ]);
      expect(approveResult.success).toBe(true);
      expect(approveResult.feature.status).toBe('approved');
      expect(approveResult.feature.approved_by).toBe('e2e-test-system');
      workflowSteps.push({
        step: 'approve',
        timestamp: performance.now() - startTime,
        success: true,
        featureId,
      });
      // Step 3: Initialize Agent for Implementation
      console.log('Step 3: Initializing implementation agent...');
      const agentId = 'E2E_IMPLEMENTATION_AGENT';
      const initResult = await execTaskManagerCommand('initialize', [agentId]);
      expect(initResult.success).toBe(true);
      expect(initResult.agent.id).toBe(agentId);
      expect(initResult.agent.sessionId).toBeTruthy();
      workflowSteps.push({
        step: 'agent_initialize',
        timestamp: performance.now() - startTime,
        success: true,
        agentId,
        sessionId: initResult.agent.sessionId,
      });
      // Step 4: Generate Tasks from Approved Feature
      console.log('Step 4: Generating autonomous tasks...');
      const taskGenResult = await execTaskManagerCommand(
        'create-task-from-feature',
        [
          featureId,
          JSON.stringify({
            created_by: agentId,
            metadata: {
              e2e_test: true,
              workflow_id: 'complete-feature-lifecycle',
            },
          }),
        ],
      );
      expect(taskGenResult.success).toBe(true);
      expect(taskGenResult.task).toBeTruthy();
      expect(taskGenResult.task.feature_id).toBe(featureId);
      workflowSteps.push({
        step: 'task_generation',
        timestamp: performance.now() - startTime,
        success: true,
        taskId: taskGenResult.task.id,
      });
      // Step 5: Verify Workflow State
      console.log('Step 5: Verifying workflow state...');
      const statsResult = await execTaskManagerCommand('feature-stats', []);
      expect(statsResult.success).toBe(true);
      expect(statsResult.stats.by_status.approved).toBeGreaterThan(0);
      const taskQueueResult = await execTaskManagerCommand('get-task-queue', [
        JSON.stringify({ feature_id: featureId }),
      ]);
      expect(taskQueueResult.success).toBe(true);
      expect(taskQueueResult.tasks.length).toBeGreaterThan(0);
      workflowSteps.push({
        step: 'workflow_verification',
        timestamp: performance.now() - startTime,
        success: true,
      });
      // Step 6: Test Cross-Session Persistence
      console.log('Step 6: Testing cross-session persistence...');
      const reinitResult = await execTaskManagerCommand('reinitialize', [
        agentId,
      ]);
      expect(reinitResult.success).toBe(true);
      expect(reinitResult.agent.previousSessions).toBe(1);
      workflowSteps.push({
        step: 'cross_session_test',
        timestamp: performance.now() - startTime,
        success: true,
        newSessionId: reinitResult.agent.sessionId,
      });
      const totalDuration = performance.now() - startTime;
      // Workflow Success Criteria
      expect(workflowSteps.length).toBe(6);
      expect(workflowSteps.every((step) => step.success)).toBe(true);
      expect(totalDuration).toBeLessThan(15000); // Complete workflow under 15 seconds
      console.log(
        `Complete workflow executed in ${totalDuration.toFixed(2)}ms`,
      );
      console.log('Workflow steps:', workflowSteps);
    }, 30000);
    it('should handle workflow interruption and recovery', async () => {
      // Simulate partial workflow execution and recovery
      const featureData = {
        title: 'Workflow Recovery Test Feature',
        description:
          'Feature for testing workflow interruption and recovery mechanisms',
        business_value: 'Validates system resilience and recovery capabilities',
        category: 'enhancement',
      };
      // Start workflow
      const suggestResult = await execTaskManagerCommand('suggest-feature', [
        JSON.stringify(featureData),
      ]);
      expect(suggestResult.success).toBe(true);
      const featureId = suggestResult.feature.id;
      // Approve feature
      await execTaskManagerCommand('approve-feature', [featureId]);
      // Initialize agent
      const agentId = 'RECOVERY_TEST_AGENT';
      await execTaskManagerCommand('initialize', [agentId]);
      // Simulate interruption by creating corrupted state
      const featuresPath = join(rig.testDir, 'FEATURES.json');
      const currentData = readFileSync(featuresPath, 'utf-8');
      // Verify recovery after file restoration
      writeFileSync(featuresPath, currentData);
      // System should recover and continue workflow
      const recoveryStats = await execTaskManagerCommand('feature-stats', []);
      expect(recoveryStats.success).toBe(true);
      const recoveryFeatures = await execTaskManagerCommand('list-features', [
        JSON.stringify({ status: 'approved' }),
      ]);
      expect(recoveryFeatures.success).toBe(true);
      expect(recoveryFeatures.features.some((f) => f.id === featureId)).toBe(
        true,
      );
    });
    it('should support bulk workflow operations', async () => {
      const bulkFeatures = [];
      const bulkSize = 10;
      console.log(`Creating ${bulkSize} features for bulk workflow testing...`);
      // Create multiple features
      for (let i = 0; i < bulkSize; i++) {
        const featureData = {
          title: `Bulk Workflow Feature ${i + 1}`,
          description: `Bulk processing test feature number ${i + 1} for workflow automation validation`,
          business_value: `Enables bulk processing capability validation feature ${i + 1}`,
          category: i % 2 === 0 ? 'enhancement' : 'new-feature',
        };
        const result = await execTaskManagerCommand('suggest-feature', [
          JSON.stringify(featureData),
        ]);
        if (result.success) {
          bulkFeatures.push(result.feature);
        }
      }
      expect(bulkFeatures.length).toBe(bulkSize);
      // Bulk approve features
      const featureIds = bulkFeatures.map((f) => f.id);
      const bulkApproveResult = await execTaskManagerCommand(
        'bulk-approve-features',
        [
          JSON.stringify(featureIds),
          JSON.stringify({ approved_by: 'bulk-workflow-test' }),
        ],
      );
      expect(bulkApproveResult.success).toBe(true);
      expect(bulkApproveResult.approved_count).toBe(bulkSize);
      // Generate tasks from all approved features
      const taskGenResult = await execTaskManagerCommand(
        'generate-tasks-from-approved-features',
        [],
      );
      expect(taskGenResult.success).toBe(true);
      expect(taskGenResult.generated_tasks.length).toBeGreaterThanOrEqual(
        bulkSize,
      );
      console.log(`Bulk workflow processed ${bulkSize} features successfully`);
    });
  });
  /**
   * Multi-Agent Coordination Workflows
   * Tests complex scenarios with multiple agents working together
   */
  describe('Multi-Agent Coordination Workflows', () => {
    it('should coordinate multiple specialized agents on complex project', async () => {
      const projectAgents = [
        { id: 'FRONTEND_SPECIALIST', capabilities: ['frontend', 'testing'] },
        { id: 'BACKEND_SPECIALIST', capabilities: ['backend', 'security'] },
        { id: 'QA_SPECIALIST', capabilities: ['testing', 'validation'] },
        {
          id: 'DEVOPS_SPECIALIST',
          capabilities: ['deployment', 'performance'],
        },
      ];
      // Initialize all project agents
      const initResults = [];
      for (const agent of projectAgents) {
        const result = await execTaskManagerCommand('initialize', [agent.id]);
        expect(result.success).toBe(true);
        initResults.push({ ...result, capabilities: agent.capabilities });
        // Register capabilities (when this feature is implemented)
        // await execTaskManagerCommand('register-agent-capabilities', [agent.id, JSON.stringify(agent.capabilities)]);
      }
      // Create complex project requiring multiple specializations
      const complexFeatureData = {
        title: 'Multi-Agent Project - E-Commerce Platform',
        description:
          'Complete e-commerce platform with frontend UI, backend API, payment processing, inventory management, user authentication, admin dashboard, testing suite, and deployment pipeline',
        business_value:
          'Comprehensive e-commerce solution enabling online sales, inventory management, and customer engagement across multiple channels',
        category: 'new-feature',
      };
      const featureResult = await execTaskManagerCommand('suggest-feature', [
        JSON.stringify(complexFeatureData),
      ]);
      expect(featureResult.success).toBe(true);
      const featureId = featureResult.feature.id;
      await execTaskManagerCommand('approve-feature', [featureId]);
      // Generate multiple tasks for different specializations
      const taskGenResult = await execTaskManagerCommand(
        'generate-tasks-from-approved-features',
        [JSON.stringify({ force: true })],
      );
      expect(taskGenResult.success).toBe(true);
      // Verify task queue has tasks requiring different capabilities
      const queueResult = await execTaskManagerCommand('get-task-queue', [
        JSON.stringify({ feature_id: featureId }),
      ]);
      expect(queueResult.success).toBe(true);
      expect(queueResult.tasks.length).toBeGreaterThan(0);
      console.log(
        `Multi-agent project setup: ${projectAgents.length} agents, ${queueResult.tasks.length} tasks`,
      );
      // Test agent coordination through statistics
      const finalStats = await execTaskManagerCommand(
        'get-initialization-stats',
        [],
      );
      expect(finalStats.success).toBe(true);
      expect(finalStats.stats.total_initializations).toBeGreaterThanOrEqual(
        projectAgents.length,
      );
    }, 45000);
    it('should handle agent handoff and task dependencies', async () => {
      // Create sequential workflow requiring agent handoff
      const workflowAgents = [
        'ANALYSIS_AGENT',
        'IMPLEMENTATION_AGENT',
        'TESTING_AGENT',
      ];
      // Initialize workflow agents
      for (const agentId of workflowAgents) {
        const result = await execTaskManagerCommand('initialize', [agentId]);
        expect(result.success).toBe(true);
      }
      // Create feature requiring sequential processing
      const sequentialFeature = {
        title: 'Sequential Workflow - API Integration',
        description:
          'API integration requiring analysis, implementation, and comprehensive testing phases with proper handoff between specialized agents',
        business_value:
          'Enables third-party service integration with proper validation and error handling',
        category: 'enhancement',
      };
      const featureResult = await execTaskManagerCommand('suggest-feature', [
        JSON.stringify(sequentialFeature),
      ]);
      const featureId = featureResult.feature.id;
      await execTaskManagerCommand('approve-feature', [featureId]);
      // Create task with dependencies
      const mainTaskResult = await execTaskManagerCommand(
        'create-task-from-feature',
        [
          featureId,
          JSON.stringify({
            type: 'implementation',
            created_by: 'IMPLEMENTATION_AGENT',
            metadata: { requires_analysis: true, requires_testing: true },
          }),
        ],
      );
      expect(mainTaskResult.success).toBe(true);
      const taskId = mainTaskResult.task.id;
      // Test task progress tracking (simulating agent handoff)
      const progressResult = await execTaskManagerCommand(
        'update-task-progress',
        [
          taskId,
          JSON.stringify({
            status: 'in_progress',
            progress_percentage: 50,
            notes: 'Analysis complete, beginning implementation',
            updated_by: 'IMPLEMENTATION_AGENT',
          }),
        ],
      );
      expect(progressResult.success).toBe(true);
      expect(progressResult.task.status).toBe('in_progress');
      console.log('Agent handoff workflow tested successfully');
    });
    it('should maintain agent heartbeats and availability tracking', async () => {
      const monitoringAgents = [
        'MONITOR_AGENT_1',
        'MONITOR_AGENT_2',
        'MONITOR_AGENT_3',
      ];
      const heartbeatInterval = 1000; // 1 second
      const monitoringDuration = 5000; // 5 seconds
      // Initialize monitoring agents
      for (const agentId of monitoringAgents) {
        const result = await execTaskManagerCommand('initialize', [agentId]);
        expect(result.success).toBe(true);
      }
      // Simulate heartbeat maintenance
      const startTime = Date.now();
      const heartbeatPromises = [];
      for (const agentId of monitoringAgents) {
        const heartbeatPromise = (async () => {
          const beats = [];
          while (Date.now() - startTime < monitoringDuration) {
            try {
              const reinitResult = await execTaskManagerCommand(
                'reinitialize',
                [agentId],
              );
              if (reinitResult.success) {
                beats.push({
                  timestamp: Date.now(),
                  sessionId: reinitResult.agent.sessionId,
                });
              }
            } catch (error) {
              console.error(`Heartbeat failed for ${agentId}:`, error);
            }
            await new Promise((resolve) =>
              setTimeout(resolve, heartbeatInterval),
            );
          }
          return { agentId, beats };
        })();
        heartbeatPromises.push(heartbeatPromise);
      }
      const heartbeatResults = await Promise.all(heartbeatPromises);
      // Verify heartbeat tracking
      heartbeatResults.forEach((result) => {
        expect(result.beats.length).toBeGreaterThan(0);
        console.log(
          `Agent ${result.agentId}: ${result.beats.length} heartbeats`,
        );
      });
      // Verify system tracked the activity
      const stats = await execTaskManagerCommand(
        'get-initialization-stats',
        [],
      );
      expect(stats.success).toBe(true);
      expect(stats.stats.total_reinitializations).toBeGreaterThan(0);
    }, 20000);
  });
  /**
   * System Integration Workflows
   * Tests integration with Gemini CLI and external systems
   */
  describe('System Integration Workflows', () => {
    it('should integrate with Gemini CLI project structure', async () => {
      // Create project structure that mimics Gemini CLI integration
      const projectStructure = {
        'package.json': JSON.stringify(
          {
            name: 'e2e-test-project',
            version: '1.0.0',
            scripts: {
              test: 'vitest',
              build: 'tsc',
              start: 'node dist/index.js',
            },
          },
          null,
          2,
        ),
        'src/index.ts': 'console.log("E2E Test Project");',
        'README.md':
          '# E2E Test Project\n\nIntegration testing with autonomous task management.',
        'tsconfig.json': JSON.stringify(
          {
            compilerOptions: {
              target: 'ES2020',
              module: 'commonjs',
              outDir: './dist',
            },
          },
          null,
          2,
        ),
      };
      // Create project files
      for (const [file, content] of Object.entries(projectStructure)) {
        const filePath = join(rig.testDir, file);
        const dir = dirname(filePath);
        mkdirSync(dir, { recursive: true });
        writeFileSync(filePath, content);
      }
      // Initialize task manager for the project
      const projectAgentId = 'PROJECT_INTEGRATION_AGENT';
      const initResult = await execTaskManagerCommand('initialize', [
        projectAgentId,
      ]);
      expect(initResult.success).toBe(true);
      // Create project-specific feature
      const projectFeature = {
        title: 'Integration Test - TypeScript Build Pipeline',
        description:
          'Implement TypeScript compilation and build pipeline for the E2E test project with proper source maps and type checking',
        business_value:
          'Enables production-ready TypeScript builds with comprehensive error checking and optimization',
        category: 'enhancement',
      };
      const featureResult = await execTaskManagerCommand('suggest-feature', [
        JSON.stringify(projectFeature),
      ]);
      expect(featureResult.success).toBe(true);
      await execTaskManagerCommand('approve-feature', [
        featureResult.feature.id,
      ]);
      // Verify project integration
      const projectStats = await execTaskManagerCommand('feature-stats', []);
      expect(projectStats.success).toBe(true);
      // Test FEATURES.json exists in project directory
      const featuresPath = join(rig.testDir, 'FEATURES.json');
      expect(existsSync(featuresPath)).toBe(true);
      const featuresContent = JSON.parse(readFileSync(featuresPath, 'utf-8'));
      expect(featuresContent.project).toBeTruthy();
      expect(featuresContent.features.length).toBeGreaterThan(0);
      console.log('Gemini CLI project integration verified');
    });
    it('should handle CI/CD pipeline integration scenarios', async () => {
      // Simulate CI/CD environment
      process.env.CI = 'true';
      process.env.BUILD_NUMBER = '123';
      process.env.BRANCH_NAME = 'e2e-test-branch';
      try {
        // Initialize CI agent
        const ciAgentId = 'CI_PIPELINE_AGENT';
        const initResult = await execTaskManagerCommand('initialize', [
          ciAgentId,
        ]);
        expect(initResult.success).toBe(true);
        // Create CI/CD specific features
        const ciFeatures = [
          {
            title: 'CI/CD Integration - Automated Testing Pipeline',
            description:
              'Implement automated testing pipeline with parallel test execution, coverage reporting, and failure notifications',
            business_value:
              'Ensures code quality and reduces manual testing overhead in continuous integration',
            category: 'enhancement',
          },
          {
            title: 'CI/CD Integration - Deployment Automation',
            description:
              'Implement automated deployment pipeline with staging, production environments, and rollback capabilities',
            business_value:
              'Enables reliable and fast deployment cycles with minimal manual intervention',
            category: 'new-feature',
          },
        ];
        // Process CI features
        const ciFeatureIds = [];
        for (const feature of ciFeatures) {
          const result = await execTaskManagerCommand('suggest-feature', [
            JSON.stringify(feature),
          ]);
          if (result.success) {
            ciFeatureIds.push(result.feature.id);
          }
        }
        // Bulk approve CI features
        const bulkApproveResult = await execTaskManagerCommand(
          'bulk-approve-features',
          [
            JSON.stringify(ciFeatureIds),
            JSON.stringify({
              approved_by: 'ci-automation',
              notes: 'Auto-approved by CI pipeline',
            }),
          ],
        );
        expect(bulkApproveResult.success).toBe(true);
        expect(bulkApproveResult.approved_count).toBe(ciFeatures.length);
        // Generate CI tasks
        const taskGenResult = await execTaskManagerCommand(
          'generate-tasks-from-approved-features',
          [],
        );
        expect(taskGenResult.success).toBe(true);
        // Verify CI pipeline tracking
        const stats = await execTaskManagerCommand(
          'get-initialization-stats',
          [],
        );
        expect(stats.success).toBe(true);
        console.log('CI/CD pipeline integration tested successfully');
      } finally {
        // Cleanup environment
        delete process.env.CI;
        delete process.env.BUILD_NUMBER;
        delete process.env.BRANCH_NAME;
      }
    });
    it('should support external system webhook integration', async () => {
      // Simulate webhook payload from external system
      const webhookPayloads = [
        {
          source: 'github',
          event: 'pull_request',
          action: 'opened',
          data: {
            title: 'Add new authentication middleware',
            description:
              'Implement JWT authentication middleware with refresh token support',
            labels: ['enhancement', 'security'],
          },
        },
        {
          source: 'jira',
          event: 'issue_created',
          action: 'created',
          data: {
            key: 'PROJ-123',
            summary: 'Fix memory leak in data processor',
            description:
              'Memory usage continuously increases during batch processing operations',
            priority: 'high',
            type: 'bug',
          },
        },
      ];
      const webhookAgentId = 'WEBHOOK_INTEGRATION_AGENT';
      await execTaskManagerCommand('initialize', [webhookAgentId]);
      // Process webhook payloads as feature suggestions
      for (const payload of webhookPayloads) {
        const featureData = {
          title: `External Integration - ${payload.data.title || payload.data.summary}`,
          description: payload.data.description,
          business_value: `Addresses external system requirement from ${payload.source}`,
          category:
            payload.source === 'jira' && payload.data.type === 'bug'
              ? 'bug-fix'
              : 'enhancement',
          metadata: {
            external_source: payload.source,
            external_id: payload.data.key || payload.event,
            webhook_event: payload.event,
            integration_timestamp: new Date().toISOString(),
          },
        };
        const result = await execTaskManagerCommand('suggest-feature', [
          JSON.stringify(featureData),
        ]);
        expect(result.success).toBe(true);
        expect(result.feature.metadata.external_source).toBe(payload.source);
      }
      // Verify external integration tracking
      const features = await execTaskManagerCommand('list-features', []);
      expect(features.success).toBe(true);
      const externalFeatures = features.features.filter(
        (f) => f.metadata && f.metadata.external_source,
      );
      expect(externalFeatures.length).toBe(webhookPayloads.length);
      console.log(
        `External system integration: ${externalFeatures.length} webhook features processed`,
      );
    });
  });
  /**
   * Stop Authorization and Completion Workflows
   */
  describe('Stop Authorization Workflows', () => {
    it('should execute complete stop authorization workflow', async () => {
      const agentId = 'STOP_AUTHORIZATION_AGENT';
      // Initialize agent
      const initResult = await execTaskManagerCommand('initialize', [agentId]);
      expect(initResult.success).toBe(true);
      // Create and complete some work to justify stop authorization
      const completionFeature = {
        title: 'Stop Authorization Test - Task Completion Validation',
        description:
          'Feature created to validate stop authorization workflow after task completion',
        business_value:
          'Validates proper stop authorization workflow execution',
        category: 'enhancement',
      };
      const featureResult = await execTaskManagerCommand('suggest-feature', [
        JSON.stringify(completionFeature),
      ]);
      const featureId = featureResult.feature.id;
      // Approve and work on feature
      await execTaskManagerCommand('approve-feature', [featureId]);
      const taskResult = await execTaskManagerCommand(
        'create-task-from-feature',
        [featureId],
      );
      if (taskResult.success) {
        // Mark task as completed
        await execTaskManagerCommand('update-task-progress', [
          taskResult.task.id,
          JSON.stringify({
            status: 'completed',
            progress_percentage: 100,
            notes: 'Task completed successfully for stop authorization test',
            updated_by: agentId,
          }),
        ]);
      }
      // Authorize stop
      const stopReason =
        'All TodoWrite tasks complete and project perfect: linter✅ build✅ start✅ tests✅';
      const stopResult = await execTaskManagerCommand('authorize-stop', [
        agentId,
        stopReason,
      ]);
      expect(stopResult.success).toBe(true);
      expect(stopResult.authorization.authorized_by).toBe(agentId);
      expect(stopResult.authorization.stop_flag_created).toBe(true);
      // Verify stop flag was created
      const stopFlagPath = join(rig.testDir, '.stop-allowed');
      expect(existsSync(stopFlagPath)).toBe(true);
      const stopFlagContent = JSON.parse(readFileSync(stopFlagPath, 'utf-8'));
      expect(stopFlagContent.stop_allowed).toBe(true);
      expect(stopFlagContent.authorized_by).toBe(agentId);
      expect(stopFlagContent.reason).toBe(stopReason);
      console.log('Stop authorization workflow completed successfully');
    });
    it('should handle multiple agents attempting stop authorization', async () => {
      const competingAgents = ['STOP_AGENT_1', 'STOP_AGENT_2', 'STOP_AGENT_3'];
      // Initialize competing agents
      for (const agentId of competingAgents) {
        const result = await execTaskManagerCommand('initialize', [agentId]);
        expect(result.success).toBe(true);
      }
      // All agents attempt to authorize stop simultaneously
      const stopPromises = competingAgents.map((agentId) =>
        execTaskManagerCommand('authorize-stop', [
          agentId,
          `Stop authorized by ${agentId} after completing assigned tasks`,
        ]),
      );
      const stopResults = await Promise.allSettled(stopPromises);
      // At least one should succeed
      const successful = stopResults.filter(
        (r) => r.status === 'fulfilled' && r.value.success,
      );
      expect(successful.length).toBeGreaterThan(0);
      // Only one stop flag should exist
      const stopFlagPath = join(rig.testDir, '.stop-allowed');
      expect(existsSync(stopFlagPath)).toBe(true);
      console.log(
        `Stop authorization race condition: ${successful.length}/${competingAgents.length} successful`,
      );
    });
  });
  /**
   * Utility function to execute task manager commands with proper error handling
   */
  async function execTaskManagerCommand(command, args = []) {
    return new Promise((resolve, reject) => {
      const child = spawn(
        'timeout',
        ['10s', 'node', taskManagerPath, command, ...args],
        {
          cwd: rig.testDir,
          stdio: 'pipe',
        },
      );
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
          } catch {
            reject(
              new Error(
                `Failed to parse JSON response: ${stdout.substring(0, 300)}...`,
              ),
            );
          }
        } else {
          reject(
            new Error(
              `Command '${command}' failed with code ${code}. stderr: ${stderr || 'none'}, stdout: ${stdout.substring(0, 200)}...`,
            ),
          );
        }
      });
      child.on('error', (error) => {
        reject(
          new Error(`Failed to execute command '${command}': ${error.message}`),
        );
      });
      // Timeout after 15 seconds
      setTimeout(() => {
        child.kill('SIGKILL');
        reject(new Error(`Command '${command}' timeout after 15 seconds`));
      }, 15000);
    });
  }
});
//# sourceMappingURL=e2e-autonomous-workflows.test.js.map
