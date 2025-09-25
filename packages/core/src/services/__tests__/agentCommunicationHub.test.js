/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AgentCommunicationHub } from '../agentCommunicationHub.js';
// Mock Config
const mockConfig = {
  getSessionId: vi.fn(() => 'test-session'),
};
describe('AgentCommunicationHub', () => {
  let communicationHub;
  let mockMessageHandler;
  beforeEach(() => {
    vi.clearAllMocks();
    communicationHub = new AgentCommunicationHub(mockConfig);
    mockMessageHandler = vi.fn().mockResolvedValue(true);
  });
  afterEach(async () => {
    await communicationHub.shutdown();
  });
  describe('Agent Registration', () => {
    it('should register an agent for communication', () => {
      communicationHub.registerAgent('agent-1');
      const registeredAgents = communicationHub.getRegisteredAgents();
      expect(registeredAgents).toContain('agent-1');
    });
    it('should handle duplicate agent registration', () => {
      communicationHub.registerAgent('agent-1');
      communicationHub.registerAgent('agent-1');
      const registeredAgents = communicationHub.getRegisteredAgents();
      expect(registeredAgents.filter((id) => id === 'agent-1')).toHaveLength(1);
    });
    it('should unregister an agent', () => {
      communicationHub.registerAgent('agent-1');
      communicationHub.registerAgent('agent-2');
      communicationHub.unregisterAgent('agent-1');
      const registeredAgents = communicationHub.getRegisteredAgents();
      expect(registeredAgents).not.toContain('agent-1');
      expect(registeredAgents).toContain('agent-2');
    });
    it('should handle unregistering non-existent agent gracefully', () => {
      expect(() => {
        communicationHub.unregisterAgent('non-existent');
      }).not.toThrow();
    });
  });
  describe('Direct Messaging', () => {
    beforeEach(() => {
      communicationHub.registerAgent('agent-1');
      communicationHub.registerAgent('agent-2');
    });
    it('should send direct message between agents', async () => {
      const message = {
        id: 'msg-1',
        senderId: 'agent-1',
        recipientId: 'agent-2',
        type: 'task_assignment',
        data: { taskId: 'task-1', description: 'Test task' },
        timestamp: new Date(),
        priority: 'normal',
      };
      const success = await communicationHub.sendMessage(message);
      expect(success).toBe(true);
    });
    it('should handle message to non-existent agent', async () => {
      const message = {
        id: 'msg-2',
        senderId: 'agent-1',
        recipientId: 'non-existent',
        type: 'status_update',
        data: { status: 'idle' },
        timestamp: new Date(),
        priority: 'normal',
      };
      const success = await communicationHub.sendMessage(message);
      expect(success).toBe(false);
    });
    it('should handle message from non-registered sender', async () => {
      const message = {
        id: 'msg-3',
        senderId: 'non-registered',
        recipientId: 'agent-1',
        type: 'status_update',
        data: { status: 'busy' },
        timestamp: new Date(),
        priority: 'normal',
      };
      const success = await communicationHub.sendMessage(message);
      expect(success).toBe(false);
    });
    it('should handle high priority messages', async () => {
      const urgentMessage = {
        id: 'urgent-msg',
        senderId: 'agent-1',
        recipientId: 'agent-2',
        type: 'emergency_stop',
        data: { reason: 'Critical error detected' },
        timestamp: new Date(),
        priority: 'high',
      };
      const success = await communicationHub.sendMessage(urgentMessage);
      expect(success).toBe(true);
    });
    it('should queue messages when recipient is busy', async () => {
      // Simulate agent-2 being busy
      communicationHub.setAgentStatus('agent-2', 'busy');
      const message = {
        id: 'queued-msg',
        senderId: 'agent-1',
        recipientId: 'agent-2',
        type: 'task_result',
        data: { result: 'completed' },
        timestamp: new Date(),
        priority: 'normal',
      };
      const success = await communicationHub.sendMessage(message);
      expect(success).toBe(true);
      // Check message queue
      const queuedMessages = communicationHub.getQueuedMessages('agent-2');
      expect(queuedMessages).toHaveLength(1);
      expect(queuedMessages[0].id).toBe('queued-msg');
    });
  });
  describe('Publish-Subscribe Pattern', () => {
    beforeEach(() => {
      communicationHub.registerAgent('agent-1');
      communicationHub.registerAgent('agent-2');
      communicationHub.registerAgent('agent-3');
    });
    it('should subscribe agent to channel', () => {
      communicationHub.subscribe(
        'agent-1',
        'system_events',
        mockMessageHandler,
      );
      const subscribers =
        communicationHub.getChannelSubscribers('system_events');
      expect(subscribers).toContain('agent-1');
    });
    it('should unsubscribe agent from channel', () => {
      communicationHub.subscribe(
        'agent-1',
        'system_events',
        mockMessageHandler,
      );
      communicationHub.unsubscribe('agent-1', 'system_events');
      const subscribers =
        communicationHub.getChannelSubscribers('system_events');
      expect(subscribers).not.toContain('agent-1');
    });
    it('should publish message to all subscribers', async () => {
      const handler1 = vi.fn().mockResolvedValue(true);
      const handler2 = vi.fn().mockResolvedValue(true);
      communicationHub.subscribe('agent-1', 'notifications', handler1);
      communicationHub.subscribe('agent-2', 'notifications', handler2);
      const broadcastMessage = {
        id: 'broadcast-1',
        senderId: 'system',
        recipientId: 'all',
        type: 'system_notification',
        data: { message: 'System maintenance scheduled' },
        timestamp: new Date(),
        priority: 'normal',
        channel: 'notifications',
      };
      await communicationHub.publish('notifications', broadcastMessage);
      expect(handler1).toHaveBeenCalledWith(broadcastMessage);
      expect(handler2).toHaveBeenCalledWith(broadcastMessage);
    });
    it('should handle subscriber errors gracefully', async () => {
      const failingHandler = vi
        .fn()
        .mockRejectedValue(new Error('Handler failed'));
      const workingHandler = vi.fn().mockResolvedValue(true);
      communicationHub.subscribe('agent-1', 'error_test', failingHandler);
      communicationHub.subscribe('agent-2', 'error_test', workingHandler);
      const message = {
        id: 'error-test',
        senderId: 'system',
        recipientId: 'all',
        type: 'test_message',
        data: {},
        timestamp: new Date(),
        priority: 'normal',
        channel: 'error_test',
      };
      await expect(
        communicationHub.publish('error_test', message),
      ).resolves.not.toThrow();
      expect(workingHandler).toHaveBeenCalled();
    });
    it('should support wildcard subscriptions', async () => {
      const wildcardHandler = vi.fn().mockResolvedValue(true);
      communicationHub.subscribe('agent-1', 'task.*', wildcardHandler);
      const taskMessage = {
        id: 'task-msg',
        senderId: 'system',
        recipientId: 'all',
        type: 'task_update',
        data: { taskId: 'task-1', status: 'completed' },
        timestamp: new Date(),
        priority: 'normal',
        channel: 'task.completed',
      };
      await communicationHub.publish('task.completed', taskMessage);
      expect(wildcardHandler).toHaveBeenCalledWith(taskMessage);
    });
  });
  describe('Synchronization Barriers', () => {
    beforeEach(() => {
      communicationHub.registerAgent('agent-1');
      communicationHub.registerAgent('agent-2');
      communicationHub.registerAgent('agent-3');
    });
    it('should create synchronization barrier', async () => {
      const barrier = await communicationHub.createSynchronizationBarrier(
        'test-barrier',
        ['agent-1', 'agent-2', 'agent-3'],
      );
      expect(barrier.id).toBe('test-barrier');
      expect(barrier.participantIds).toEqual(['agent-1', 'agent-2', 'agent-3']);
      expect(barrier.completed).toBe(false);
    });
    it('should wait for all agents to reach barrier', async () => {
      await communicationHub.createSynchronizationBarrier('sync-test', [
        'agent-1',
        'agent-2',
      ]);
      // First agent reaches barrier
      const promise1 = communicationHub.waitForBarrier('agent-1', 'sync-test');
      // Barrier should not be complete yet
      setTimeout(async () => {
        const barrier = communicationHub.getBarrier('sync-test');
        expect(barrier?.completed).toBe(false);
        // Second agent reaches barrier
        await communicationHub.waitForBarrier('agent-2', 'sync-test');
      }, 10);
      await promise1;
      const completedBarrier = communicationHub.getBarrier('sync-test');
      expect(completedBarrier?.completed).toBe(true);
    });
    it('should handle barrier timeout', async () => {
      await communicationHub.createSynchronizationBarrier(
        'timeout-barrier',
        ['agent-1', 'agent-2'],
        1000,
      );
      // Only one agent reaches barrier
      const barrierPromise = communicationHub.waitForBarrier(
        'agent-1',
        'timeout-barrier',
      );
      // Should timeout
      await expect(barrierPromise).rejects.toThrow('Barrier timeout');
    });
    it('should release barrier when all agents arrive', async () => {
      await communicationHub.createSynchronizationBarrier('release-test', [
        'agent-1',
        'agent-2',
      ]);
      const promises = [
        communicationHub.waitForBarrier('agent-1', 'release-test'),
        communicationHub.waitForBarrier('agent-2', 'release-test'),
      ];
      await Promise.all(promises);
      const barrier = communicationHub.getBarrier('release-test');
      expect(barrier?.completed).toBe(true);
    });
    it('should handle non-existent barrier gracefully', async () => {
      await expect(
        communicationHub.waitForBarrier('agent-1', 'non-existent'),
      ).rejects.toThrow('Barrier not found');
    });
    it('should handle agent not in barrier participants', async () => {
      await communicationHub.createSynchronizationBarrier('exclusive-barrier', [
        'agent-1',
        'agent-2',
      ]);
      await expect(
        communicationHub.waitForBarrier('agent-3', 'exclusive-barrier'),
      ).rejects.toThrow('not a participant');
    });
  });
  describe('Distributed Consensus', () => {
    beforeEach(() => {
      communicationHub.registerAgent('agent-1');
      communicationHub.registerAgent('agent-2');
      communicationHub.registerAgent('agent-3');
    });
    it('should start consensus operation', async () => {
      const consensusId = await communicationHub.startConsensusOperation(
        'leader-election',
        ['agent-1', 'agent-2', 'agent-3'],
        { candidates: ['agent-1', 'agent-2'] },
      );
      expect(consensusId).toBeDefined();
      const consensus = communicationHub.getConsensusOperation(consensusId);
      expect(consensus?.type).toBe('leader-election');
      expect(consensus?.participants).toEqual([
        'agent-1',
        'agent-2',
        'agent-3',
      ]);
    });
    it('should handle consensus voting', async () => {
      const consensusId = await communicationHub.startConsensusOperation(
        'configuration-change',
        ['agent-1', 'agent-2', 'agent-3'],
        { newConfig: { maxLoad: 0.8 } },
      );
      // Agents vote
      await communicationHub.submitConsensusVote(consensusId, 'agent-1', {
        vote: 'approve',
        reason: 'Good change',
      });
      await communicationHub.submitConsensusVote(consensusId, 'agent-2', {
        vote: 'approve',
        reason: 'Agree',
      });
      await communicationHub.submitConsensusVote(consensusId, 'agent-3', {
        vote: 'reject',
        reason: 'Too restrictive',
      });
      const consensus = communicationHub.getConsensusOperation(consensusId);
      expect(consensus?.votes).toHaveProperty('agent-1');
      expect(consensus?.votes).toHaveProperty('agent-2');
      expect(consensus?.votes).toHaveProperty('agent-3');
    });
    it('should determine consensus result based on majority', async () => {
      const consensusId = await communicationHub.startConsensusOperation(
        'task-priority',
        ['agent-1', 'agent-2', 'agent-3'],
        { taskId: 'task-1', newPriority: 'high' },
      );
      // Majority approval
      await communicationHub.submitConsensusVote(consensusId, 'agent-1', {
        vote: 'approve',
      });
      await communicationHub.submitConsensusVote(consensusId, 'agent-2', {
        vote: 'approve',
      });
      await communicationHub.submitConsensusVote(consensusId, 'agent-3', {
        vote: 'reject',
      });
      const result = await communicationHub.getConsensusResult(consensusId);
      expect(result.decision).toBe('approved');
      expect(result.approveCount).toBe(2);
      expect(result.rejectCount).toBe(1);
    });
    it('should handle consensus timeout', async () => {
      const consensusId = await communicationHub.startConsensusOperation(
        'slow-consensus',
        ['agent-1', 'agent-2', 'agent-3'],
        { timeout: 500 }, // Short timeout
        500,
      );
      // Only partial votes
      await communicationHub.submitConsensusVote(consensusId, 'agent-1', {
        vote: 'approve',
      });
      // Wait for timeout
      await new Promise((resolve) => setTimeout(resolve, 600));
      const result = await communicationHub.getConsensusResult(consensusId);
      expect(result.status).toBe('timeout');
    });
    it('should handle unanimous consensus requirement', async () => {
      const consensusId = await communicationHub.startConsensusOperation(
        'critical-change',
        ['agent-1', 'agent-2'],
        { requireUnanimous: true },
      );
      await communicationHub.submitConsensusVote(consensusId, 'agent-1', {
        vote: 'approve',
      });
      await communicationHub.submitConsensusVote(consensusId, 'agent-2', {
        vote: 'reject',
      });
      const result = await communicationHub.getConsensusResult(consensusId);
      expect(result.decision).toBe('rejected'); // Not unanimous
    });
  });
  describe('Message Routing and Filtering', () => {
    beforeEach(() => {
      communicationHub.registerAgent('frontend-agent');
      communicationHub.registerAgent('backend-agent');
      communicationHub.registerAgent('test-agent');
    });
    it('should route messages based on agent capabilities', async () => {
      // Set up capability-based routing
      communicationHub.setAgentCapabilities('frontend-agent', [
        'frontend',
        'ui',
      ]);
      communicationHub.setAgentCapabilities('backend-agent', [
        'backend',
        'database',
      ]);
      const frontendMessage = {
        id: 'fe-msg',
        senderId: 'system',
        recipientId: 'auto',
        type: 'task_assignment',
        data: { taskType: 'ui', description: 'Update button styling' },
        timestamp: new Date(),
        priority: 'normal',
        requiredCapabilities: ['frontend'],
      };
      const routed = await communicationHub.routeMessage(frontendMessage);
      expect(routed.recipientId).toBe('frontend-agent');
    });
    it('should filter messages based on content', () => {
      const filter = (message) => message.priority === 'high';
      communicationHub.addMessageFilter('high-priority-filter', filter);
      const highPriorityMessage = {
        id: 'high-msg',
        senderId: 'agent-1',
        recipientId: 'agent-2',
        type: 'urgent_task',
        data: {},
        timestamp: new Date(),
        priority: 'high',
      };
      const normalMessage = {
        id: 'normal-msg',
        senderId: 'agent-1',
        recipientId: 'agent-2',
        type: 'status_update',
        data: {},
        timestamp: new Date(),
        priority: 'normal',
      };
      expect(communicationHub.shouldMessagePass(highPriorityMessage)).toBe(
        true,
      );
      expect(communicationHub.shouldMessagePass(normalMessage)).toBe(true); // Filters don't block by default
    });
    it('should handle message transformation', () => {
      const transformer = (message) => ({
        ...message,
        data: { ...message.data, transformed: true },
      });
      communicationHub.addMessageTransformer('add-flag', transformer);
      const originalMessage = {
        id: 'transform-test',
        senderId: 'agent-1',
        recipientId: 'agent-2',
        type: 'test_message',
        data: { value: 42 },
        timestamp: new Date(),
        priority: 'normal',
      };
      const transformed = communicationHub.transformMessage(originalMessage);
      expect(transformed.data).toHaveProperty('transformed', true);
      expect(transformed.data).toHaveProperty('value', 42);
    });
  });
  describe('Communication Analytics', () => {
    beforeEach(() => {
      communicationHub.registerAgent('agent-1');
      communicationHub.registerAgent('agent-2');
      communicationHub.registerAgent('agent-3');
    });
    it('should track message statistics', async () => {
      const messages = [
        {
          id: 'msg-1',
          senderId: 'agent-1',
          recipientId: 'agent-2',
          type: 'task_assignment',
          data: {},
          timestamp: new Date(),
          priority: 'normal',
        },
        {
          id: 'msg-2',
          senderId: 'agent-2',
          recipientId: 'agent-3',
          type: 'status_update',
          data: {},
          timestamp: new Date(),
          priority: 'high',
        },
      ];
      for (const message of messages) {
        await communicationHub.sendMessage(message);
      }
      const stats = communicationHub.getCommunicationStats();
      expect(stats.totalMessages).toBe(2);
      expect(stats.messagesByType['task_assignment']).toBe(1);
      expect(stats.messagesByType['status_update']).toBe(1);
      expect(stats.messagesByPriority['normal']).toBe(1);
      expect(stats.messagesByPriority['high']).toBe(1);
    });
    it('should analyze communication patterns', () => {
      // Simulate communication history
      const history = [
        { senderId: 'agent-1', recipientId: 'agent-2', timestamp: new Date() },
        { senderId: 'agent-2', recipientId: 'agent-1', timestamp: new Date() },
        { senderId: 'agent-1', recipientId: 'agent-3', timestamp: new Date() },
      ];
      communicationHub.addToHistory(history);
      const patterns = communicationHub.analyzeCommunicationPatterns();
      expect(patterns.mostActiveAgent).toBe('agent-1');
      expect(patterns.communicationPairs).toContain('agent-1 ↔ agent-2');
      expect(patterns.networkDensity).toBeGreaterThan(0);
    });
    it('should identify communication bottlenecks', () => {
      // Simulate high communication load on one agent
      const heavyTraffic = Array.from({ length: 100 }, (_, i) => ({
        senderId: 'agent-1',
        recipientId: 'agent-2',
        timestamp: new Date(Date.now() - i * 1000),
        messageSize: 1024,
      }));
      communicationHub.addToHistory(heavyTraffic);
      const bottlenecks = communicationHub.identifyBottlenecks();
      expect(bottlenecks.overloadedAgents).toContain('agent-2');
      expect(bottlenecks.highTrafficRoutes).toContain('agent-1 → agent-2');
    });
  });
  describe('Error Handling and Recovery', () => {
    beforeEach(() => {
      communicationHub.registerAgent('agent-1');
      communicationHub.registerAgent('agent-2');
    });
    it('should handle message delivery failures', async () => {
      // Simulate agent offline
      communicationHub.setAgentStatus('agent-2', 'offline');
      const message = {
        id: 'failed-msg',
        senderId: 'agent-1',
        recipientId: 'agent-2',
        type: 'task_result',
        data: { result: 'completed' },
        timestamp: new Date(),
        priority: 'normal',
      };
      const success = await communicationHub.sendMessage(message);
      expect(success).toBe(false);
      // Message should be queued for retry
      const failedMessages = communicationHub.getFailedMessages();
      expect(failedMessages.some((msg) => msg.id === 'failed-msg')).toBe(true);
    });
    it('should retry failed messages when agent comes back online', async () => {
      // Set up failed message scenario
      communicationHub.setAgentStatus('agent-2', 'offline');
      const message = {
        id: 'retry-msg',
        senderId: 'agent-1',
        recipientId: 'agent-2',
        type: 'important_update',
        data: { info: 'critical data' },
        timestamp: new Date(),
        priority: 'high',
      };
      await communicationHub.sendMessage(message);
      // Agent comes back online
      communicationHub.setAgentStatus('agent-2', 'active');
      // Trigger retry mechanism
      await communicationHub.retryFailedMessages();
      const failedMessages = communicationHub.getFailedMessages();
      expect(failedMessages.some((msg) => msg.id === 'retry-msg')).toBe(false);
    });
    it('should handle corrupted messages gracefully', async () => {
      const corruptedMessage = {
        id: 'corrupted',
        senderId: null, // Invalid
        recipientId: 'agent-2',
        // Missing required fields
      };
      const success = await communicationHub.sendMessage(corruptedMessage);
      expect(success).toBe(false);
    });
    it('should implement circuit breaker for failed communication', async () => {
      const unreliableRecipient = 'unreliable-agent';
      // Simulate multiple failures
      for (let i = 0; i < 5; i++) {
        const message = {
          id: `fail-${i}`,
          senderId: 'agent-1',
          recipientId: unreliableRecipient,
          type: 'test_message',
          data: {},
          timestamp: new Date(),
          priority: 'normal',
        };
        await communicationHub.sendMessage(message);
      }
      const circuitBreakerStatus =
        communicationHub.getCircuitBreakerStatus(unreliableRecipient);
      expect(circuitBreakerStatus.state).toBe('open');
    });
  });
  describe('Performance Optimization', () => {
    it('should batch messages for efficiency', async () => {
      const messages = Array.from({ length: 10 }, (_, i) => ({
        id: `batch-${i}`,
        senderId: 'agent-1',
        recipientId: 'agent-2',
        type: 'batch_data',
        data: { index: i },
        timestamp: new Date(),
        priority: 'normal',
      }));
      const results = await communicationHub.sendMessageBatch(messages);
      expect(results.every((result) => result.success)).toBe(true);
      expect(results).toHaveLength(10);
    });
    it('should compress large messages', () => {
      const largeMessage = {
        id: 'large-msg',
        senderId: 'agent-1',
        recipientId: 'agent-2',
        type: 'large_dataset',
        data: { payload: 'x'.repeat(10000) }, // Large payload
        timestamp: new Date(),
        priority: 'normal',
      };
      const compressed = communicationHub.compressMessage(largeMessage);
      expect(compressed.size).toBeLessThan(JSON.stringify(largeMessage).length);
    });
    it('should maintain message ordering', async () => {
      const orderedMessages = Array.from({ length: 5 }, (_, i) => ({
        id: `ordered-${i}`,
        senderId: 'agent-1',
        recipientId: 'agent-2',
        type: 'sequential_task',
        data: { sequence: i },
        timestamp: new Date(),
        priority: 'normal',
        requiresOrdering: true,
      }));
      for (const message of orderedMessages) {
        await communicationHub.sendMessage(message);
      }
      const deliveredMessages =
        communicationHub.getDeliveredMessages('agent-2');
      const sequences = deliveredMessages
        .filter((msg) => msg.type === 'sequential_task')
        .map((msg) => msg.data.sequence);
      expect(sequences).toEqual([0, 1, 2, 3, 4]);
    });
  });
});
//# sourceMappingURL=agentCommunicationHub.test.js.map
