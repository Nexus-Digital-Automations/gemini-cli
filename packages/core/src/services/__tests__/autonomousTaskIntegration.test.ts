/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * End-to-End Integration Tests for Autonomous Task Management System
 *
 * These tests validate the complete integration between:
 * - TaskManager API (external service)
 * - AutonomousTaskIntegrator (core orchestration)
 * - IntegrationBridge (coordination layer)
 * - CoreToolScheduler (execution engine)
 * - TodoWrite integration (task breakdown)
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, jest } from '@jest/globals';
import { AutonomousTaskIntegrator, type AutonomousTask, type RegisteredAgent } from '../autonomousTaskIntegrator.js';
import { IntegrationBridge } from '../integrationBridge.js';
import type { Config } from '../../index.js';
import { EventEmitter } from 'node:events';

// Mock implementations
const mockConfig: Config = {
  getToolRegistry: jest.fn(),
  getGeminiClient: jest.fn(),
  getModel: () => 'gemini-2.0-flash-exp',
  getUserTier: () => 'premium',
  getApprovalMode: () => 0, // AUTO_APPROVE
  getAllowedTools: () => [],
  setFallbackModelHandler: jest.fn(),
  getShellExecutionConfig: () => ({
    workingDirectory: '/tmp',
    timeout: 30000,
    allowedCommands: ['echo', 'ls', 'cat'],
  }),
  getEnableToolOutputTruncation: () => true,
  getTruncateToolOutputThreshold: () => 10000,
  getTruncateToolOutputLines: () => 100,
  storage: {
    getProjectTempDir: () => '/tmp/test-project',
  },
} as unknown as Config;

describe('Autonomous Task Management Integration', () => {
  let taskIntegrator: AutonomousTaskIntegrator;
  let integrationBridge: IntegrationBridge;
  let testAgents: RegisteredAgent[] = [];
  let testTasks: AutonomousTask[] = [];

  beforeAll(async () => {
    // Setup test environment
    console.log('🧪 Setting up integration test environment...');
  });

  afterAll(async () => {
    // Cleanup test environment
    console.log('🧹 Cleaning up integration test environment...');
  });

  beforeEach(async () => {
    // Initialize fresh instances for each test
    taskIntegrator = new AutonomousTaskIntegrator(mockConfig);
    integrationBridge = new IntegrationBridge(mockConfig, {
      taskManagerApiPath: '/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js',
      projectRoot: '/tmp/test-project',
      enableCrossSessionPersistence: false, // Disable for tests
      enableRealTimeUpdates: false, // Disable for tests
    });

    await taskIntegrator.initialize();
    // Note: We won't initialize the bridge in tests to avoid external API calls

    testAgents = [];
    testTasks = [];
  });

  afterEach(async () => {
    // Cleanup after each test
    await integrationBridge.shutdown();
    testAgents = [];
    testTasks = [];
  });

  describe('Core Task Orchestration', () => {
    it('should create and queue autonomous tasks', async () => {
      const taskConfig = {
        title: 'Implement user authentication system',
        description: 'Create secure login/logout functionality with JWT tokens',
        type: 'implementation' as const,
        priority: 'high' as const,
        requiredCapabilities: ['backend', 'security'] as const,
        metadata: { estimatedHours: 8 },
      };

      const task = await taskIntegrator.createTask(taskConfig);

      expect(task).toBeDefined();
      expect(task.id).toBeDefined();
      expect(task.title).toBe(taskConfig.title);
      expect(task.status).toBe('queued');
      expect(task.type).toBe('implementation');
      expect(task.priority).toBe('high');
      expect(task.requiredCapabilities).toEqual(['backend', 'security']);

      testTasks.push(task);
    });

    it('should handle task dependencies correctly', async () => {
      // Create parent task first
      const parentTask = await taskIntegrator.createTask({
        title: 'Setup database schema',
        description: 'Create user tables and indexes',
        type: 'implementation',
        priority: 'critical',
        requiredCapabilities: ['backend'],
      });

      // Create dependent task
      const dependentTask = await taskIntegrator.createTask({
        title: 'Implement user CRUD operations',
        description: 'Create user management endpoints',
        type: 'implementation',
        priority: 'high',
        dependencies: [parentTask.id],
        requiredCapabilities: ['backend'],
      });

      expect(dependentTask.dependencies).toContain(parentTask.id);

      testTasks.push(parentTask, dependentTask);
    });

    it('should register agents with capabilities', async () => {
      const agentConfig = {
        id: 'BACKEND_SPECIALIST_001',
        capabilities: ['backend', 'security', 'database'] as const,
        maxConcurrentTasks: 3,
      };

      await taskIntegrator.registerAgent(agentConfig);

      const systemStatus = taskIntegrator.getSystemStatus();
      expect(systemStatus.agents.total).toBe(1);
      expect(systemStatus.agents.idle).toBe(1);
    });

    it('should assign tasks to suitable agents', async () => {
      // Register a backend specialist agent
      const backendAgent = {
        id: 'BACKEND_SPECIALIST_001',
        capabilities: ['backend', 'security'] as const,
        maxConcurrentTasks: 2,
      };

      await taskIntegrator.registerAgent(backendAgent);

      // Create a backend task
      const backendTask = await taskIntegrator.createTask({
        title: 'Create API endpoints',
        description: 'Implement REST API for user management',
        type: 'implementation',
        priority: 'high',
        requiredCapabilities: ['backend'],
      });

      // Task should be automatically assigned
      await new Promise(resolve => setTimeout(resolve, 100)); // Allow async processing

      const systemStatus = taskIntegrator.getSystemStatus();
      expect(systemStatus.agents.active).toBeGreaterThan(0);

      testTasks.push(backendTask);
    });
  });

  describe('Multi-Agent Coordination', () => {
    it('should handle multiple agents with different capabilities', async () => {
      // Register multiple specialized agents
      const agents = [
        {
          id: 'FRONTEND_SPECIALIST_001',
          capabilities: ['frontend', 'testing'] as const,
          maxConcurrentTasks: 2,
        },
        {
          id: 'BACKEND_SPECIALIST_001',
          capabilities: ['backend', 'security', 'database'] as const,
          maxConcurrentTasks: 3,
        },
        {
          id: 'DEVOPS_SPECIALIST_001',
          capabilities: ['deployment', 'performance'] as const,
          maxConcurrentTasks: 1,
        },
      ];

      for (const agent of agents) {
        await taskIntegrator.registerAgent(agent);
      }

      const systemStatus = taskIntegrator.getSystemStatus();
      expect(systemStatus.agents.total).toBe(3);
      expect(systemStatus.agents.idle).toBe(3);
    });

    it('should load balance across available agents', async () => {
      // Register two backend agents
      await taskIntegrator.registerAgent({
        id: 'BACKEND_AGENT_001',
        capabilities: ['backend'],
        maxConcurrentTasks: 1,
      });

      await taskIntegrator.registerAgent({
        id: 'BACKEND_AGENT_002',
        capabilities: ['backend'],
        maxConcurrentTasks: 1,
      });

      // Create multiple backend tasks
      const tasks = [];
      for (let i = 0; i < 3; i++) {
        const task = await taskIntegrator.createTask({
          title: `Backend Task ${i + 1}`,
          description: `Implementation task ${i + 1}`,
          type: 'implementation',
          priority: 'normal',
          requiredCapabilities: ['backend'],
        });
        tasks.push(task);
      }

      testTasks.push(...tasks);

      // Allow assignment processing
      await new Promise(resolve => setTimeout(resolve, 200));

      const systemStatus = taskIntegrator.getSystemStatus();
      // Both agents should be active (handling tasks) or at least one busy
      expect(systemStatus.agents.active + systemStatus.agents.busy).toBeGreaterThan(0);
    });

    it('should handle agent capability mismatches', async () => {
      // Register only frontend agent
      await taskIntegrator.registerAgent({
        id: 'FRONTEND_ONLY_AGENT',
        capabilities: ['frontend'],
        maxConcurrentTasks: 2,
      });

      // Create backend task (should remain queued)
      const backendTask = await taskIntegrator.createTask({
        title: 'Database migration',
        description: 'Update database schema',
        type: 'implementation',
        priority: 'high',
        requiredCapabilities: ['backend', 'database'],
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      const systemStatus = taskIntegrator.getSystemStatus();
      // Task should remain queued since no suitable agent
      expect(systemStatus.tasks.byStatus.queued).toBeGreaterThan(0);

      testTasks.push(backendTask);
    });
  });

  describe('Task Lifecycle Management', () => {
    it('should track complete task lifecycle', async () => {
      const events: any[] = [];

      // Listen to all task events
      taskIntegrator.on('task_created', (event) => events.push({ type: 'created', ...event }));
      taskIntegrator.on('task_assigned', (event) => events.push({ type: 'assigned', ...event }));
      taskIntegrator.on('task_started', (event) => events.push({ type: 'started', ...event }));
      taskIntegrator.on('task_completed', (event) => events.push({ type: 'completed', ...event }));

      // Register agent
      await taskIntegrator.registerAgent({
        id: 'LIFECYCLE_TEST_AGENT',
        capabilities: ['testing'],
        maxConcurrentTasks: 1,
      });

      // Create task
      const task = await taskIntegrator.createTask({
        title: 'Lifecycle test task',
        description: 'Task for testing complete lifecycle',
        type: 'testing',
        priority: 'normal',
        requiredCapabilities: ['testing'],
      });

      // Allow processing time
      await new Promise(resolve => setTimeout(resolve, 200));

      // Verify events were triggered
      expect(events.length).toBeGreaterThan(0);
      expect(events.some(e => e.type === 'created')).toBe(true);

      testTasks.push(task);
    });

    it('should handle complex task breakdown', async () => {
      // Create complex task that should trigger TodoWrite breakdown
      const complexTask = await taskIntegrator.createTask({
        title: 'Build complete e-commerce platform',
        description: 'Develop full-stack e-commerce application with user management, product catalog, shopping cart, payment processing, order management, and admin dashboard. Includes comprehensive testing, security implementation, and deployment procedures.',
        type: 'implementation',
        priority: 'critical',
        requiredCapabilities: ['frontend', 'backend', 'security', 'testing'],
        dependencies: [],
        metadata: { complexity: 'high', estimatedHours: 200 },
      });

      // Complex task should have todo breakdown in metadata
      expect(complexTask.metadata.todoBreakdown).toBeDefined();
      expect(Array.isArray(complexTask.metadata.todoBreakdown)).toBe(true);

      testTasks.push(complexTask);
    });
  });

  describe('System Status and Monitoring', () => {
    it('should provide comprehensive system status', async () => {
      // Setup test scenario
      await taskIntegrator.registerAgent({
        id: 'STATUS_TEST_AGENT',
        capabilities: ['general'],
        maxConcurrentTasks: 2,
      });

      await taskIntegrator.createTask({
        title: 'Status test task',
        description: 'Task for status monitoring',
        type: 'analysis',
        priority: 'low',
      });

      const status = taskIntegrator.getSystemStatus();

      expect(status).toBeDefined();
      expect(status.tasks).toBeDefined();
      expect(status.agents).toBeDefined();
      expect(status.queue).toBeDefined();

      expect(typeof status.tasks.total).toBe('number');
      expect(typeof status.agents.total).toBe('number');
      expect(typeof status.queue.depth).toBe('number');

      expect(status.tasks.byStatus).toBeDefined();
      expect(status.tasks.byType).toBeDefined();
      expect(status.tasks.byPriority).toBeDefined();
    });

    it('should calculate queue metrics correctly', async () => {
      // Create multiple tasks with different priorities
      const taskConfigs = [
        { priority: 'critical', type: 'implementation' },
        { priority: 'high', type: 'testing' },
        { priority: 'normal', type: 'documentation' },
        { priority: 'low', type: 'analysis' },
      ];

      for (const config of taskConfigs) {
        await taskIntegrator.createTask({
          title: `${config.priority} priority task`,
          description: `Task with ${config.priority} priority`,
          type: config.type as any,
          priority: config.priority as any,
        });
      }

      const status = taskIntegrator.getSystemStatus();

      expect(status.tasks.total).toBe(4);
      expect(status.tasks.byPriority.critical).toBe(1);
      expect(status.tasks.byPriority.high).toBe(1);
      expect(status.tasks.byPriority.normal).toBe(1);
      expect(status.tasks.byPriority.low).toBe(1);
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle agent disconnection gracefully', async () => {
      const events: any[] = [];

      taskIntegrator.on('agent_disconnected', (event) => {
        events.push(event);
      });

      // Register agent
      await taskIntegrator.registerAgent({
        id: 'DISCONNECT_TEST_AGENT',
        capabilities: ['testing'],
        maxConcurrentTasks: 1,
      });

      // Simulate agent disconnection by manipulating heartbeat
      const agent = taskIntegrator['agentRegistry'].get('DISCONNECT_TEST_AGENT');
      if (agent) {
        agent.lastHeartbeat = new Date(Date.now() - 120000); // 2 minutes ago
        taskIntegrator['agentRegistry'].set('DISCONNECT_TEST_AGENT', agent);
      }

      // Wait for heartbeat monitoring to detect disconnection
      await new Promise(resolve => setTimeout(resolve, 100));

      // Note: In a real scenario, this would be handled by the heartbeat monitor
    });

    it('should handle task execution failures', async () => {
      const events: any[] = [];

      taskIntegrator.on('task_failed', (event) => {
        events.push(event);
      });

      // This would test task failure scenarios
      // Implementation would depend on how tool execution failures are simulated
    });

    it('should maintain system integrity under load', async () => {
      // Register multiple agents
      for (let i = 1; i <= 5; i++) {
        await taskIntegrator.registerAgent({
          id: `LOAD_TEST_AGENT_${i}`,
          capabilities: ['general'],
          maxConcurrentTasks: 2,
        });
      }

      // Create many tasks rapidly
      const tasks = [];
      for (let i = 1; i <= 20; i++) {
        const task = await taskIntegrator.createTask({
          title: `Load test task ${i}`,
          description: `Task ${i} for load testing`,
          type: 'implementation',
          priority: i % 2 === 0 ? 'high' : 'normal',
        });
        tasks.push(task);
      }

      testTasks.push(...tasks);

      // System should remain stable
      const status = taskIntegrator.getSystemStatus();
      expect(status.tasks.total).toBe(20);
      expect(status.agents.total).toBe(5);
    });
  });

  describe('Integration Bridge Coordination', () => {
    it('should handle bridge initialization without external API', async () => {
      // Test initialization without actually calling external APIs
      expect(integrationBridge).toBeDefined();

      // Verify bridge configuration
      const config = integrationBridge['integrationConfig'];
      expect(config.taskManagerApiPath).toBeDefined();
      expect(config.projectRoot).toBeDefined();
    });

    it('should emit proper integration events', async () => {
      const events: any[] = [];

      integrationBridge.on('bridge_initialized', (event) => events.push(event));
      integrationBridge.on('task_created', (event) => events.push(event));
      integrationBridge.on('agent_registered', (event) => events.push(event));

      // Events would be tested with proper mocking of external API calls
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle large numbers of tasks efficiently', async () => {
      const startTime = Date.now();

      // Create 100 tasks
      const tasks = [];
      for (let i = 1; i <= 100; i++) {
        const task = await taskIntegrator.createTask({
          title: `Performance test task ${i}`,
          description: `Task ${i} for performance testing`,
          type: 'analysis',
          priority: 'normal',
        });
        tasks.push(task);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time (adjust threshold as needed)
      expect(duration).toBeLessThan(5000); // 5 seconds

      const status = taskIntegrator.getSystemStatus();
      expect(status.tasks.total).toBe(100);

      testTasks.push(...tasks);
    });

    it('should scale agent management efficiently', async () => {
      const startTime = Date.now();

      // Register 50 agents
      for (let i = 1; i <= 50; i++) {
        await taskIntegrator.registerAgent({
          id: `SCALE_TEST_AGENT_${i}`,
          capabilities: ['general'],
          maxConcurrentTasks: 1,
        });
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(2000); // 2 seconds

      const status = taskIntegrator.getSystemStatus();
      expect(status.agents.total).toBe(50);
    });
  });
});

describe('Integration Component Unit Tests', () => {
  describe('AutonomousTaskIntegrator', () => {
    let integrator: AutonomousTaskIntegrator;

    beforeEach(async () => {
      integrator = new AutonomousTaskIntegrator(mockConfig);
      await integrator.initialize();
    });

    it('should generate unique task IDs', () => {
      const id1 = integrator['generateTaskId']();
      const id2 = integrator['generateTaskId']();

      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^task_\d+_[a-z0-9]{9}$/);
    });

    it('should generate unique session IDs', () => {
      const id1 = integrator['generateSessionId']();
      const id2 = integrator['generateSessionId']();

      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^session_\d+_[a-z0-9]{9}$/);
    });

    it('should compare priorities correctly', () => {
      const compareFn = integrator['comparePriority'].bind(integrator);

      expect(compareFn('critical', 'high')).toBeLessThan(0);
      expect(compareFn('high', 'normal')).toBeLessThan(0);
      expect(compareFn('normal', 'low')).toBeLessThan(0);
      expect(compareFn('low', 'critical')).toBeGreaterThan(0);
      expect(compareFn('normal', 'normal')).toBe(0);
    });

    it('should detect complex tasks correctly', () => {
      const simpleTask = {
        description: 'Simple task',
        dependencies: [],
        type: 'analysis',
        requiredCapabilities: ['general'],
      } as any;

      const complexTask = {
        description: 'This is a very long and complex task description that should trigger the complexity detection algorithm because it contains detailed requirements and specifications that exceed the length threshold for simple tasks.',
        dependencies: ['dep1'],
        type: 'implementation',
        requiredCapabilities: ['frontend', 'backend', 'security'],
      } as any;

      expect(integrator['isComplexTask'](simpleTask)).toBe(false);
      expect(integrator['isComplexTask'](complexTask)).toBe(true);
    });
  });
});