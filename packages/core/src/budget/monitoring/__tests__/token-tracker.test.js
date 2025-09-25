/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Unit tests for TokenTracker component
 * Tests core token tracking functionality, event emission, and statistics
 *
 * @author Claude Code - Real-Time Token Usage Monitoring Agent
 * @version 1.0.0
 */
import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  jest,
} from '@jest/globals';
import { TokenTracker } from '../token-tracker.js';
describe('TokenTracker', () => {
  let tokenTracker;
  let config;
  beforeEach(() => {
    config = {
      enableDetailedTracking: true,
      trackCosts: true,
      trackPerformance: true,
      enableLogging: false,
      sessionId: 'test-session-123',
    };
    tokenTracker = new TokenTracker(config);
  });
  describe('Initialization', () => {
    it('should initialize with correct configuration', () => {
      expect(tokenTracker).toBeDefined();
      const stats = tokenTracker.getUsageStats();
      expect(stats).toBeDefined();
      expect(stats.totalRequests).toBe(0);
      expect(stats.totalTokens).toBe(0);
    });
    it('should use default configuration when none provided', () => {
      const defaultTracker = new TokenTracker();
      const stats = defaultTracker.getUsageStats();
      expect(stats).toBeDefined();
      expect(stats.totalRequests).toBe(0);
    });
    it('should generate session ID when not provided', () => {
      const configWithoutSession = { ...config };
      delete configWithoutSession.sessionId;
      const tracker = new TokenTracker(configWithoutSession);
      const stats = tracker.getUsageStats();
      expect(stats.sessionId).toBeDefined();
      expect(typeof stats.sessionId).toBe('string');
    });
  });
  describe('Request Tracking', () => {
    it('should track request start', () => {
      const requestId = 'req-123';
      const model = 'gemini-2.5-flash';
      const feature = 'chat';
      const sessionId = 'session-123';
      tokenTracker.startRequest(requestId, model, feature, sessionId);
      const stats = tokenTracker.getUsageStats();
      expect(Object.keys(stats.activeRequests)).toContain(requestId);
      expect(stats.totalRequests).toBe(1);
      expect(stats.successfulRequests).toBe(0); // Not completed yet
    });
    it('should emit request-started event', (done) => {
      const requestId = 'req-123';
      const model = 'gemini-2.5-flash';
      const feature = 'chat';
      const sessionId = 'session-123';
      tokenTracker.on('request-started', (event) => {
        expect(event.requestId).toBe(requestId);
        expect(event.model).toBe(model);
        expect(event.feature).toBe(feature);
        expect(event.sessionId).toBe(sessionId);
        expect(event.timestamp).toBeDefined();
        done();
      });
      tokenTracker.startRequest(requestId, model, feature, sessionId);
    });
    it('should complete request successfully with response', async () => {
      const requestId = 'req-123';
      const model = 'gemini-2.5-flash';
      const feature = 'chat';
      const sessionId = 'session-123';
      const mockResponse = {
        candidates: [
          {
            content: {
              parts: [{ text: 'Test response' }],
              role: 'model',
            },
            finishReason: 'STOP',
          },
        ],
        usageMetadata: {
          promptTokenCount: 10,
          candidatesTokenCount: 15,
          totalTokenCount: 25,
        },
      };
      tokenTracker.startRequest(requestId, model, feature, sessionId);
      await tokenTracker.completeRequest(requestId, mockResponse);
      const stats = tokenTracker.getUsageStats();
      expect(stats.successfulRequests).toBe(1);
      expect(stats.totalTokens).toBe(25);
      expect(stats.inputTokens).toBe(10);
      expect(stats.outputTokens).toBe(15);
      expect(Object.keys(stats.activeRequests)).not.toContain(requestId);
    });
    it('should complete request with error', async () => {
      const requestId = 'req-123';
      const model = 'gemini-2.5-flash';
      const feature = 'chat';
      const sessionId = 'session-123';
      const error = new Error('API Error');
      tokenTracker.startRequest(requestId, model, feature, sessionId);
      await tokenTracker.completeRequest(requestId, undefined, error);
      const stats = tokenTracker.getUsageStats();
      expect(stats.failedRequests).toBe(1);
      expect(stats.successfulRequests).toBe(0);
      expect(Object.keys(stats.activeRequests)).not.toContain(requestId);
    });
    it('should emit request-completed event', async (done) => {
      const requestId = 'req-123';
      const model = 'gemini-2.5-flash';
      const feature = 'chat';
      const sessionId = 'session-123';
      tokenTracker.on('request-completed', (event) => {
        expect(event.requestId).toBe(requestId);
        expect(event.success).toBe(true);
        expect(event.inputTokens).toBe(10);
        expect(event.outputTokens).toBe(15);
        expect(event.responseTime).toBeGreaterThan(0);
        done();
      });
      tokenTracker.startRequest(requestId, model, feature, sessionId);
      const mockResponse = {
        candidates: [
          {
            content: {
              parts: [{ text: 'Test response' }],
              role: 'model',
            },
            finishReason: 'STOP',
          },
        ],
        usageMetadata: {
          promptTokenCount: 10,
          candidatesTokenCount: 15,
          totalTokenCount: 25,
        },
      };
      await tokenTracker.completeRequest(requestId, mockResponse);
    });
  });
  describe('Statistics Tracking', () => {
    it('should accumulate statistics across multiple requests', async () => {
      const requests = [
        { id: 'req-1', inputTokens: 10, outputTokens: 5 },
        { id: 'req-2', inputTokens: 15, outputTokens: 8 },
        { id: 'req-3', inputTokens: 20, outputTokens: 12 },
      ];
      for (const req of requests) {
        tokenTracker.startRequest(req.id, 'test-model', 'chat', 'session-123');
        const mockResponse = {
          candidates: [
            {
              content: { parts: [{ text: 'Response' }], role: 'model' },
              finishReason: 'STOP',
            },
          ],
          usageMetadata: {
            promptTokenCount: req.inputTokens,
            candidatesTokenCount: req.outputTokens,
            totalTokenCount: req.inputTokens + req.outputTokens,
          },
        };
        await tokenTracker.completeRequest(req.id, mockResponse);
      }
      const stats = tokenTracker.getUsageStats();
      expect(stats.totalRequests).toBe(3);
      expect(stats.successfulRequests).toBe(3);
      expect(stats.inputTokens).toBe(45); // 10 + 15 + 20
      expect(stats.outputTokens).toBe(25); // 5 + 8 + 12
      expect(stats.totalTokens).toBe(70);
    });
    it('should track model-specific usage', async () => {
      const models = ['gemini-2.5-flash', 'gemini-2.5-pro'];
      for (let i = 0; i < models.length; i++) {
        const requestId = `req-${i}`;
        const model = models[i];
        tokenTracker.startRequest(requestId, model, 'chat', 'session-123');
        const mockResponse = {
          candidates: [
            {
              content: { parts: [{ text: 'Response' }], role: 'model' },
              finishReason: 'STOP',
            },
          ],
          usageMetadata: {
            promptTokenCount: 10,
            candidatesTokenCount: 5,
            totalTokenCount: 15,
          },
        };
        await tokenTracker.completeRequest(requestId, mockResponse);
      }
      const stats = tokenTracker.getUsageStats();
      expect(Object.keys(stats.modelUsage)).toContain('gemini-2.5-flash');
      expect(Object.keys(stats.modelUsage)).toContain('gemini-2.5-pro');
      expect(stats.modelUsage['gemini-2.5-flash'].requests).toBe(1);
      expect(stats.modelUsage['gemini-2.5-pro'].requests).toBe(1);
    });
    it('should track feature-specific usage', async () => {
      const features = ['chat', 'function-calling', 'embed'];
      for (let i = 0; i < features.length; i++) {
        const requestId = `req-${i}`;
        const feature = features[i];
        tokenTracker.startRequest(
          requestId,
          'test-model',
          feature,
          'session-123',
        );
        const mockResponse = {
          candidates: [
            {
              content: { parts: [{ text: 'Response' }], role: 'model' },
              finishReason: 'STOP',
            },
          ],
          usageMetadata: {
            promptTokenCount: 10,
            candidatesTokenCount: 5,
            totalTokenCount: 15,
          },
        };
        await tokenTracker.completeRequest(requestId, mockResponse);
      }
      const stats = tokenTracker.getUsageStats();
      expect(Object.keys(stats.featureUsage)).toContain('chat');
      expect(Object.keys(stats.featureUsage)).toContain('function-calling');
      expect(Object.keys(stats.featureUsage)).toContain('embed');
    });
    it('should calculate average response time', async () => {
      const requestId = 'req-123';
      tokenTracker.startRequest(requestId, 'test-model', 'chat', 'session-123');
      // Simulate some processing time
      await new Promise((resolve) => setTimeout(resolve, 10));
      const mockResponse = {
        candidates: [
          {
            content: { parts: [{ text: 'Response' }], role: 'model' },
            finishReason: 'STOP',
          },
        ],
        usageMetadata: {
          promptTokenCount: 10,
          candidatesTokenCount: 5,
          totalTokenCount: 15,
        },
      };
      await tokenTracker.completeRequest(requestId, mockResponse);
      const stats = tokenTracker.getUsageStats();
      expect(stats.averageResponseTime).toBeGreaterThan(0);
    });
  });
  describe('Error Handling', () => {
    it('should handle completion of non-existent request', async () => {
      const nonExistentId = 'non-existent-req';
      await expect(
        tokenTracker.completeRequest(nonExistentId),
      ).resolves.not.toThrow();
      const stats = tokenTracker.getUsageStats();
      expect(stats.failedRequests).toBe(0); // Should not count as failed
    });
    it('should handle multiple completions of same request', async () => {
      const requestId = 'req-123';
      tokenTracker.startRequest(requestId, 'test-model', 'chat', 'session-123');
      const mockResponse = {
        candidates: [
          {
            content: { parts: [{ text: 'Response' }], role: 'model' },
            finishReason: 'STOP',
          },
        ],
        usageMetadata: {
          promptTokenCount: 10,
          candidatesTokenCount: 5,
          totalTokenCount: 15,
        },
      };
      await tokenTracker.completeRequest(requestId, mockResponse);
      await tokenTracker.completeRequest(requestId, mockResponse); // Second completion
      const stats = tokenTracker.getUsageStats();
      expect(stats.successfulRequests).toBe(1); // Should not double count
    });
    it('should handle response without usage metadata', async () => {
      const requestId = 'req-123';
      tokenTracker.startRequest(requestId, 'test-model', 'chat', 'session-123');
      const mockResponse = {
        candidates: [
          {
            content: { parts: [{ text: 'Response' }], role: 'model' },
            finishReason: 'STOP',
          },
        ],
        // No usageMetadata
      };
      await tokenTracker.completeRequest(requestId, mockResponse);
      const stats = tokenTracker.getUsageStats();
      expect(stats.successfulRequests).toBe(1);
      expect(stats.totalTokens).toBe(0); // No tokens counted without metadata
    });
  });
  describe('Configuration Options', () => {
    it('should respect cost tracking configuration', async () => {
      const noCostConfig = {
        ...config,
        trackCosts: false,
      };
      const tracker = new TokenTracker(noCostConfig);
      tracker.startRequest('req-123', 'test-model', 'chat', 'session-123');
      const mockResponse = {
        candidates: [
          {
            content: { parts: [{ text: 'Response' }], role: 'model' },
            finishReason: 'STOP',
          },
        ],
        usageMetadata: {
          promptTokenCount: 10,
          candidatesTokenCount: 5,
          totalTokenCount: 15,
        },
      };
      await tracker.completeRequest('req-123', mockResponse);
      const stats = tracker.getUsageStats();
      expect(stats.totalCost).toBe(0); // Cost tracking disabled
    });
    it('should respect performance tracking configuration', async () => {
      const noPerformanceConfig = {
        ...config,
        trackPerformance: false,
      };
      const tracker = new TokenTracker(noPerformanceConfig);
      tracker.startRequest('req-123', 'test-model', 'chat', 'session-123');
      const mockResponse = {
        candidates: [
          {
            content: { parts: [{ text: 'Response' }], role: 'model' },
            finishReason: 'STOP',
          },
        ],
        usageMetadata: {
          promptTokenCount: 10,
          candidatesTokenCount: 5,
          totalTokenCount: 15,
        },
      };
      await tracker.completeRequest('req-123', mockResponse);
      const stats = tracker.getUsageStats();
      expect(stats.averageResponseTime).toBe(0); // Performance tracking disabled
    });
  });
  describe('Session Management', () => {
    it('should track session-specific statistics', async () => {
      const session1 = 'session-1';
      const session2 = 'session-2';
      // Session 1 requests
      tokenTracker.startRequest('req-1', 'test-model', 'chat', session1);
      tokenTracker.startRequest('req-2', 'test-model', 'chat', session1);
      // Session 2 request
      tokenTracker.startRequest('req-3', 'test-model', 'chat', session2);
      const mockResponse = {
        candidates: [
          {
            content: { parts: [{ text: 'Response' }], role: 'model' },
            finishReason: 'STOP',
          },
        ],
        usageMetadata: {
          promptTokenCount: 10,
          candidatesTokenCount: 5,
          totalTokenCount: 15,
        },
      };
      await tokenTracker.completeRequest('req-1', mockResponse);
      await tokenTracker.completeRequest('req-2', mockResponse);
      await tokenTracker.completeRequest('req-3', mockResponse);
      const stats = tokenTracker.getUsageStats();
      expect(stats.sessionUsage).toBeDefined();
      expect(Object.keys(stats.sessionUsage)).toContain(session1);
      expect(Object.keys(stats.sessionUsage)).toContain(session2);
      expect(stats.sessionUsage[session1].requests).toBe(2);
      expect(stats.sessionUsage[session2].requests).toBe(1);
    });
  });
});
//# sourceMappingURL=token-tracker.test.js.map
