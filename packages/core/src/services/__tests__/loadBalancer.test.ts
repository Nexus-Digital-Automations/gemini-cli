/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LoadBalancer, type LoadBalancingStrategy, type AgentLoad } from '../loadBalancer.js';
import type { Config } from '../../index.js';
import type { RegisteredAgent, AutonomousTask } from '../autonomousTaskIntegrator.js';

// Mock Config
const mockConfig: Config = {
  getSessionId: vi.fn(() => 'test-session'),
} as any;

// Mock agents
const createMockAgent = (id: string, currentLoad = 0, maxCapacity = 10): RegisteredAgent => ({
  id,
  capabilities: ['frontend', 'testing'],
  sessionId: 'session-1',
  status: currentLoad > maxCapacity * 0.8 ? 'busy' : 'active',
  lastHeartbeat: new Date(),
  currentTasks: Array.from({ length: currentLoad }, (_, i) => `task-${i}`),
  maxConcurrentTasks: maxCapacity,
  performance: {
    completedTasks: Math.floor(Math.random() * 100),
    averageCompletionTime: 3000 + Math.floor(Math.random() * 2000),
    successRate: 0.9 + Math.random() * 0.1,
  },
});

const mockTask: AutonomousTask = {
  id: 'task-1',
  title: 'Test Task',
  description: 'A test task for load balancing',
  type: 'implementation',
  priority: 'normal',
  status: 'queued',
  dependencies: [],
  requiredCapabilities: ['frontend'],
  createdAt: new Date(),
  updatedAt: new Date(),
  metadata: {
    estimatedDuration: 5000,
    complexity: 'medium',
  },
};

const mockHighPriorityTask: AutonomousTask = {
  ...mockTask,
  id: 'urgent-task',
  priority: 'high',
  metadata: {
    estimatedDuration: 2000,
    complexity: 'low',
  },
};

describe('LoadBalancer', () => {
  let loadBalancer: LoadBalancer;
  let mockAgents: RegisteredAgent[];

  beforeEach(() => {
    vi.clearAllMocks();
    loadBalancer = new LoadBalancer(mockConfig);

    // Create mock agents with different load levels
    mockAgents = [
      createMockAgent('agent-1', 2, 10), // 20% load
      createMockAgent('agent-2', 5, 10), // 50% load
      createMockAgent('agent-3', 8, 10), // 80% load (busy)
      createMockAgent('agent-4', 1, 10), // 10% load
    ];
  });

  afterEach(async () => {
    await loadBalancer.shutdown();
  });

  describe('Strategy Selection', () => {
    it('should set load balancing strategy', () => {
      loadBalancer.setStrategy('weighted');

      const status = loadBalancer.getLoadBalancerStatus();
      expect(status.currentStrategy).toBe('weighted');
    });

    it('should default to round-robin strategy', () => {
      const status = loadBalancer.getLoadBalancerStatus();
      expect(status.currentStrategy).toBe('round-robin');
    });

    it('should handle invalid strategy by keeping current', () => {
      loadBalancer.setStrategy('weighted');
      loadBalancer.setStrategy('invalid' as LoadBalancingStrategy);

      const status = loadBalancer.getLoadBalancerStatus();
      expect(status.currentStrategy).toBe('weighted');
    });
  });

  describe('Round-Robin Strategy', () => {
    beforeEach(() => {
      loadBalancer.setStrategy('round-robin');
    });

    it('should distribute tasks in round-robin fashion', async () => {
      const selectedAgents: string[] = [];

      for (let i = 0; i < 8; i++) {
        const agent = await loadBalancer.selectAgent(mockAgents, mockTask);
        if (agent) {
          selectedAgents.push(agent.id);
        }
      }

      // Should cycle through all agents twice
      expect(selectedAgents).toEqual([
        'agent-1', 'agent-2', 'agent-3', 'agent-4',
        'agent-1', 'agent-2', 'agent-3', 'agent-4'
      ]);
    });

    it('should handle empty agent list', async () => {
      const agent = await loadBalancer.selectAgent([], mockTask);
      expect(agent).toBeNull();
    });

    it('should reset round-robin index after agent list changes', async () => {
      // Select first agent
      let agent = await loadBalancer.selectAgent(mockAgents, mockTask);
      expect(agent?.id).toBe('agent-1');

      // Select with different agent list
      agent = await loadBalancer.selectAgent([mockAgents[2], mockAgents[3]], mockTask);
      expect(agent?.id).toBe('agent-3'); // Should start from beginning
    });
  });

  describe('Least-Loaded Strategy', () => {
    beforeEach(() => {
      loadBalancer.setStrategy('least-loaded');
    });

    it('should select agent with lowest load', async () => {
      const agent = await loadBalancer.selectAgent(mockAgents, mockTask);

      expect(agent?.id).toBe('agent-4'); // 10% load
    });

    it('should consider task complexity in load calculation', async () => {
      const complexTask: AutonomousTask = {
        ...mockTask,
        metadata: {
          ...mockTask.metadata,
          complexity: 'high',
        },
      };

      const agent = await loadBalancer.selectAgent(mockAgents, complexTask);

      // Should still prefer least loaded, but with complexity consideration
      expect(agent?.id).toBe('agent-4');
    });

    it('should handle agents with same load consistently', async () => {
      const sameLoadAgents = [
        createMockAgent('equal-1', 3, 10),
        createMockAgent('equal-2', 3, 10),
        createMockAgent('equal-3', 3, 10),
      ];

      const agent = await loadBalancer.selectAgent(sameLoadAgents, mockTask);
      expect(['equal-1', 'equal-2', 'equal-3']).toContain(agent?.id);
    });
  });

  describe('Performance-Based Strategy', () => {
    beforeEach(() => {
      loadBalancer.setStrategy('performance-based');

      // Set specific performance metrics
      mockAgents[0].performance = { completedTasks: 100, averageCompletionTime: 2000, successRate: 0.95 };
      mockAgents[1].performance = { completedTasks: 80, averageCompletionTime: 3000, successRate: 0.90 };
      mockAgents[2].performance = { completedTasks: 120, averageCompletionTime: 1500, successRate: 0.98 };
      mockAgents[3].performance = { completedTasks: 60, averageCompletionTime: 4000, successRate: 0.85 };
    });

    it('should select agent with best performance score', async () => {
      const agent = await loadBalancer.selectAgent(mockAgents, mockTask);

      // Agent-3 should have best performance score (high success rate, fast completion)
      expect(agent?.id).toBe('agent-3');
    });

    it('should consider both speed and success rate', async () => {
      // Modify one agent to have very high success rate but slow speed
      mockAgents[1].performance = {
        completedTasks: 80,
        averageCompletionTime: 8000, // Very slow
        successRate: 0.99 // Very high success rate
      };

      const agent = await loadBalancer.selectAgent(mockAgents, mockTask);

      // Should balance speed vs success rate
      expect(agent).not.toBeNull();
    });
  });

  describe('Adaptive Strategy', () => {
    beforeEach(() => {
      loadBalancer.setStrategy('adaptive');
    });

    it('should use performance-based for high priority tasks', async () => {
      const agent = await loadBalancer.selectAgent(mockAgents, mockHighPriorityTask);

      expect(agent).not.toBeNull();
      // Should prioritize performance for high-priority tasks
    });

    it('should use least-loaded for normal priority tasks', async () => {
      const agent = await loadBalancer.selectAgent(mockAgents, mockTask);

      expect(agent?.id).toBe('agent-4'); // Least loaded
    });

    it('should adapt based on system load', async () => {
      // Simulate high system load
      const highLoadAgents = mockAgents.map(agent => ({
        ...agent,
        currentTasks: Array.from({ length: 8 }, (_, i) => `task-${i}`), // High load
      }));

      const agent = await loadBalancer.selectAgent(highLoadAgents, mockTask);

      // Should still select an agent even under high load
      expect(agent).not.toBeNull();
    });
  });

  describe('Weighted Strategy', () => {
    beforeEach(() => {
      loadBalancer.setStrategy('weighted');
    });

    it('should respect agent capacity weights', async () => {
      // Agents with different max capacities
      const weightedAgents = [
        createMockAgent('small-agent', 1, 5),   // 20% load, small capacity
        createMockAgent('medium-agent', 3, 10), // 30% load, medium capacity
        createMockAgent('large-agent', 5, 20),  // 25% load, large capacity
      ];

      const agent = await loadBalancer.selectAgent(weightedAgents, mockTask);

      // Should prefer agent with better load-to-capacity ratio
      expect(agent?.id).toBe('large-agent'); // Best capacity utilization
    });

    it('should handle zero capacity agents', async () => {
      const mixedAgents = [
        createMockAgent('zero-capacity', 0, 0), // Zero capacity
        createMockAgent('normal-agent', 2, 10),
      ];

      const agent = await loadBalancer.selectAgent(mixedAgents, mockTask);

      expect(agent?.id).toBe('normal-agent');
    });
  });

  describe('Circuit Breaker Pattern', () => {
    it('should exclude failed agents from selection', async () => {
      // Simulate agent failure
      await loadBalancer.recordAgentFailure('agent-2', new Error('Test failure'));

      const agent = await loadBalancer.selectAgent(mockAgents, mockTask);

      expect(agent?.id).not.toBe('agent-2'); // Should exclude failed agent
    });

    it('should track failure count and implement circuit breaker', async () => {
      const agentId = 'agent-2';

      // Record multiple failures
      for (let i = 0; i < 3; i++) {
        await loadBalancer.recordAgentFailure(agentId, new Error(`Failure ${i + 1}`));
      }

      const status = loadBalancer.getLoadBalancerStatus();
      expect(status.circuitBreakers[agentId]).toBeDefined();
      expect(status.circuitBreakers[agentId].state).toBe('open');
    });

    it('should attempt recovery after timeout', async () => {
      const agentId = 'agent-3';

      // Trigger circuit breaker
      for (let i = 0; i < 5; i++) {
        await loadBalancer.recordAgentFailure(agentId, new Error(`Failure ${i + 1}`));
      }

      // Mock time passage for recovery
      vi.useFakeTimers();
      vi.advanceTimersByTime(60000); // 1 minute

      const agent = await loadBalancer.selectAgent(mockAgents, mockTask);

      // Agent should be available for half-open testing
      expect(agent).not.toBeNull();

      vi.useRealTimers();
    });

    it('should record successful operations and reset failures', async () => {
      const agentId = 'agent-1';

      // Record some failures
      await loadBalancer.recordAgentFailure(agentId, new Error('Test failure'));

      // Record success
      await loadBalancer.recordAgentSuccess(agentId);

      const status = loadBalancer.getLoadBalancerStatus();
      expect(status.circuitBreakers[agentId]?.state).toBe('closed');
    });
  });

  describe('Load Rebalancing', () => {
    it('should identify overloaded agents', async () => {
      const overloadedAgents = await loadBalancer.identifyOverloadedAgents(mockAgents);

      expect(overloadedAgents).toHaveLength(1);
      expect(overloadedAgents[0].id).toBe('agent-3'); // 80% load
    });

    it('should identify underutilized agents', async () => {
      const underutilizedAgents = await loadBalancer.identifyUnderutilizedAgents(mockAgents);

      expect(underutilizedAgents.length).toBeGreaterThan(0);
      expect(underutilizedAgents.some(agent => agent.id === 'agent-4')).toBe(true); // 10% load
    });

    it('should suggest task redistribution', async () => {
      const suggestions = await loadBalancer.suggestTaskRedistribution(mockAgents);

      expect(suggestions).toHaveLength(1);
      expect(suggestions[0].sourceAgent).toBe('agent-3');
      expect(['agent-1', 'agent-4']).toContain(suggestions[0].targetAgent);
    });

    it('should rebalance load automatically', async () => {
      const rebalanceResult = await loadBalancer.rebalanceLoad(mockAgents);

      expect(rebalanceResult.rebalanced).toBe(true);
      expect(rebalanceResult.movedTasks).toBeGreaterThan(0);
    });
  });

  describe('Predictive Load Balancing', () => {
    it('should predict agent load based on historical data', async () => {
      // Add some historical data
      for (let i = 0; i < 10; i++) {
        await loadBalancer.recordTaskCompletion('agent-1', mockTask, 3000);
        await loadBalancer.recordTaskCompletion('agent-2', mockTask, 4000);
      }

      const predictions = await loadBalancer.predictAgentLoad(mockAgents, [mockTask, mockHighPriorityTask]);

      expect(predictions['agent-1']).toBeDefined();
      expect(predictions['agent-2']).toBeDefined();
      expect(predictions['agent-1'].estimatedLoad).toBeGreaterThan(0);
    });

    it('should recommend optimal agent based on predictions', async () => {
      // Simulate different performance patterns
      await loadBalancer.recordTaskCompletion('agent-1', mockTask, 2000); // Fast
      await loadBalancer.recordTaskCompletion('agent-2', mockTask, 6000); // Slow

      const recommendation = await loadBalancer.getOptimalAgentRecommendation(
        mockAgents,
        mockHighPriorityTask
      );

      expect(recommendation).not.toBeNull();
      expect(recommendation?.reasoning).toContain('performance');
    });
  });

  describe('Load Metrics and Monitoring', () => {
    it('should calculate current system load', () => {
      const systemLoad = loadBalancer.calculateSystemLoad(mockAgents);

      expect(systemLoad.totalAgents).toBe(4);
      expect(systemLoad.averageLoad).toBeGreaterThan(0);
      expect(systemLoad.peakLoad).toBe(0.8); // Agent-3 has 80% load
    });

    it('should get agent load information', async () => {
      const agentLoad = await loadBalancer.getAgentLoad('agent-1');

      expect(agentLoad).not.toBeNull();
      expect(agentLoad?.agentId).toBe('agent-1');
      expect(agentLoad?.currentLoad).toBeGreaterThanOrEqual(0);
      expect(agentLoad?.currentLoad).toBeLessThanOrEqual(1);
    });

    it('should provide load balancer status', () => {
      const status = loadBalancer.getLoadBalancerStatus();

      expect(status.currentStrategy).toBeDefined();
      expect(status.totalRequests).toBeGreaterThanOrEqual(0);
      expect(status.circuitBreakers).toBeDefined();
      expect(status.lastRebalance).toBeDefined();
    });

    it('should track request distribution over time', async () => {
      // Make several selections
      for (let i = 0; i < 10; i++) {
        await loadBalancer.selectAgent(mockAgents, mockTask);
      }

      const status = loadBalancer.getLoadBalancerStatus();
      expect(status.totalRequests).toBe(10);
      expect(Object.keys(status.agentRequestCounts)).toHaveLength(mockAgents.length);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle empty agent list gracefully', async () => {
      const agent = await loadBalancer.selectAgent([], mockTask);
      expect(agent).toBeNull();
    });

    it('should handle null task gracefully', async () => {
      const agent = await loadBalancer.selectAgent(mockAgents, null as any);
      expect(agent).toBeNull();
    });

    it('should handle agents with no performance data', async () => {
      const agentsWithoutPerf = mockAgents.map(agent => ({
        ...agent,
        performance: undefined as any,
      }));

      loadBalancer.setStrategy('performance-based');
      const agent = await loadBalancer.selectAgent(agentsWithoutPerf, mockTask);

      // Should fallback gracefully
      expect(agent).not.toBeNull();
    });

    it('should handle invalid strategy gracefully', () => {
      expect(() => {
        loadBalancer.setStrategy('invalid' as LoadBalancingStrategy);
      }).not.toThrow();
    });

    it('should handle circuit breaker edge cases', async () => {
      // Test rapid failure/success cycles
      for (let i = 0; i < 10; i++) {
        if (i % 2 === 0) {
          await loadBalancer.recordAgentFailure('agent-1', new Error('Test'));
        } else {
          await loadBalancer.recordAgentSuccess('agent-1');
        }
      }

      const status = loadBalancer.getLoadBalancerStatus();
      expect(status.circuitBreakers['agent-1']).toBeDefined();
    });
  });

  describe('Integration with Task Scheduling', () => {
    it('should consider task dependencies in selection', async () => {
      const dependentTask: AutonomousTask = {
        ...mockTask,
        id: 'dependent-task',
        dependencies: ['task-1'],
      };

      const agent = await loadBalancer.selectAgent(mockAgents, dependentTask);
      expect(agent).not.toBeNull();
    });

    it('should handle batch task assignment', async () => {
      const tasks: AutonomousTask[] = [
        { ...mockTask, id: 'batch-1' },
        { ...mockTask, id: 'batch-2' },
        { ...mockTask, id: 'batch-3' },
      ];

      const assignments = await loadBalancer.assignBatchTasks(mockAgents, tasks);

      expect(assignments).toHaveLength(3);
      expect(assignments.every(assignment => assignment.agent && assignment.task)).toBe(true);
    });

    it('should optimize for batch processing efficiency', async () => {
      const batchTasks = Array.from({ length: 20 }, (_, i) => ({
        ...mockTask,
        id: `batch-task-${i}`,
      }));

      const assignments = await loadBalancer.assignBatchTasks(mockAgents, batchTasks);

      // Should distribute tasks efficiently across all agents
      const agentTaskCounts = assignments.reduce((acc, assignment) => {
        const agentId = assignment.agent?.id || 'unknown';
        acc[agentId] = (acc[agentId] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // All agents should get some tasks (assuming they're capable)
      expect(Object.keys(agentTaskCounts).length).toBeGreaterThan(1);
    });
  });
});