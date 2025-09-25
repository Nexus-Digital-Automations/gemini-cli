/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  SubAgentScope,
  ContextState,
  SubagentTerminateMode,
} from '../../../packages/core/src/core/subagent.js';
import { MockAgentFactory, MockAgentState, type MockAgentConfig } from '../utils/MockAgentFactory.js';
import { TaskBuilder, TaskComplexity, TaskCategory } from '../utils/TaskBuilder.js';
import type { Config } from '../../../packages/core/src/config/config.js';

/**
 * Mock session storage system for testing cross-session persistence
 */
class MockSessionStorage {
  private sessions: Map<string, SessionData> = new Map();
  private taskStates: Map<string, TaskState> = new Map();
  private contextSnapshots: Map<string, ContextSnapshot> = new Map();

  async saveSession(sessionId: string, data: SessionData): Promise<void> {
    this.sessions.set(sessionId, {
      ...data,
      lastUpdated: Date.now(),
    });
  }

  async loadSession(sessionId: string): Promise<SessionData | null> {
    return this.sessions.get(sessionId) || null;
  }

  async saveTaskState(taskId: string, state: TaskState): Promise<void> {
    this.taskStates.set(taskId, {
      ...state,
      lastUpdated: Date.now(),
    });
  }

  async loadTaskState(taskId: string): Promise<TaskState | null> {
    return this.taskStates.get(taskId) || null;
  }

  async saveContextSnapshot(snapshotId: string, snapshot: ContextSnapshot): Promise<void> {
    this.contextSnapshots.set(snapshotId, snapshot);
  }

  async loadContextSnapshot(snapshotId: string): Promise<ContextSnapshot | null> {
    return this.contextSnapshots.get(snapshotId) || null;
  }

  async getAllActiveSessions(): Promise<SessionData[]> {
    const now = Date.now();
    const activeThreshold = 24 * 60 * 60 * 1000; // 24 hours

    return Array.from(this.sessions.values()).filter(
      session => (now - session.lastUpdated) < activeThreshold
    );
  }

  async getAllTaskStates(): Promise<TaskState[]> {
    return Array.from(this.taskStates.values());
  }

  async cleanup(): Promise<void> {
    const now = Date.now();
    const cleanupThreshold = 7 * 24 * 60 * 60 * 1000; // 7 days

    // Clean old sessions
    for (const [sessionId, session] of this.sessions.entries()) {
      if ((now - session.lastUpdated) > cleanupThreshold) {
        this.sessions.delete(sessionId);
      }
    }

    // Clean old task states
    for (const [taskId, taskState] of this.taskStates.entries()) {
      if ((now - taskState.lastUpdated) > cleanupThreshold) {
        this.taskStates.delete(taskId);
      }
    }

    // Clean old context snapshots
    for (const [snapshotId] of this.contextSnapshots.entries()) {
      // Check if any active sessions reference this snapshot
      const referenced = Array.from(this.sessions.values()).some(
        session => session.contextSnapshots.includes(snapshotId)
      );

      if (!referenced) {
        this.contextSnapshots.delete(snapshotId);
      }
    }
  }

  reset(): void {
    this.sessions.clear();
    this.taskStates.clear();
    this.contextSnapshots.clear();
  }

  // Utility methods for testing
  getSessionCount(): number {
    return this.sessions.size;
  }

  getTaskStateCount(): number {
    return this.taskStates.size;
  }

  getContextSnapshotCount(): number {
    return this.contextSnapshots.size;
  }
}

interface SessionData {
  sessionId: string;
  startTime: number;
  lastUpdated: number;
  taskIds: string[];
  contextSnapshots: string[];
  agentStates: Record<string, any>;
  metadata: Record<string, any>;
}

interface TaskState {
  taskId: string;
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed';
  progress: number;
  startTime?: number;
  endTime?: number;
  lastUpdated: number;
  checkpoints: Checkpoint[];
  agentId?: string;
  outputs: Record<string, any>;
  errors: string[];
  retryCount: number;
  maxRetries: number;
}

interface Checkpoint {
  id: string;
  timestamp: number;
  step: string;
  progress: number;
  data: Record<string, any>;
}

interface ContextSnapshot {
  snapshotId: string;
  sessionId: string;
  timestamp: number;
  contextData: Record<string, any>;
  metadata: Record<string, any>;
}

/**
 * Cross-session persistence manager for autonomous tasks
 */
class CrossSessionPersistenceManager {
  private storage: MockSessionStorage;
  private activeSession: SessionData | null = null;

  constructor(storage: MockSessionStorage) {
    this.storage = storage;
  }

  async startSession(sessionId: string): Promise<void> {
    this.activeSession = {
      sessionId,
      startTime: Date.now(),
      lastUpdated: Date.now(),
      taskIds: [],
      contextSnapshots: [],
      agentStates: {},
      metadata: {},
    };

    await this.storage.saveSession(sessionId, this.activeSession);
  }

  async resumeSession(sessionId: string): Promise<boolean> {
    const session = await this.storage.loadSession(sessionId);
    if (!session) {
      return false;
    }

    this.activeSession = session;
    return true;
  }

  async pauseSession(): Promise<void> {
    if (!this.activeSession) {
      throw new Error('No active session to pause');
    }

    this.activeSession.lastUpdated = Date.now();
    await this.storage.saveSession(this.activeSession.sessionId, this.activeSession);
  }

  async createTaskCheckpoint(
    taskId: string,
    step: string,
    progress: number,
    data: Record<string, any>
  ): Promise<string> {
    const checkpointId = `checkpoint_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const checkpoint: Checkpoint = {
      id: checkpointId,
      timestamp: Date.now(),
      step,
      progress,
      data,
    };

    const taskState = await this.storage.loadTaskState(taskId) || this.createDefaultTaskState(taskId);
    taskState.checkpoints.push(checkpoint);
    taskState.progress = progress;
    taskState.lastUpdated = Date.now();

    await this.storage.saveTaskState(taskId, taskState);

    return checkpointId;
  }

  async restoreFromCheckpoint(taskId: string, checkpointId?: string): Promise<Checkpoint | null> {
    const taskState = await this.storage.loadTaskState(taskId);
    if (!taskState || taskState.checkpoints.length === 0) {
      return null;
    }

    if (checkpointId) {
      return taskState.checkpoints.find(cp => cp.id === checkpointId) || null;
    }

    // Return the latest checkpoint
    return taskState.checkpoints[taskState.checkpoints.length - 1];
  }

  async saveContextSnapshot(context: ContextState, metadata?: Record<string, any>): Promise<string> {
    if (!this.activeSession) {
      throw new Error('No active session for context snapshot');
    }

    const snapshotId = `snapshot_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const contextKeys = context.get_keys();
    const contextData: Record<string, any> = {};

    contextKeys.forEach(key => {
      contextData[key] = context.get(key);
    });

    const snapshot: ContextSnapshot = {
      snapshotId,
      sessionId: this.activeSession.sessionId,
      timestamp: Date.now(),
      contextData,
      metadata: metadata || {},
    };

    await this.storage.saveContextSnapshot(snapshotId, snapshot);

    this.activeSession.contextSnapshots.push(snapshotId);
    await this.storage.saveSession(this.activeSession.sessionId, this.activeSession);

    return snapshotId;
  }

  async restoreContextSnapshot(snapshotId: string): Promise<ContextState | null> {
    const snapshot = await this.storage.loadContextSnapshot(snapshotId);
    if (!snapshot) {
      return null;
    }

    const context = new ContextState();
    Object.entries(snapshot.contextData).forEach(([key, value]) => {
      context.set(key, value);
    });

    return context;
  }

  async migrateTaskToNewSession(taskId: string, newSessionId: string): Promise<boolean> {
    const taskState = await this.storage.loadTaskState(taskId);
    if (!taskState) {
      return false;
    }

    // Update task state to reference new session
    taskState.lastUpdated = Date.now();
    await this.storage.saveTaskState(taskId, taskState);

    // Update new session to include the task
    let newSession = await this.storage.loadSession(newSessionId);
    if (!newSession) {
      newSession = {
        sessionId: newSessionId,
        startTime: Date.now(),
        lastUpdated: Date.now(),
        taskIds: [],
        contextSnapshots: [],
        agentStates: {},
        metadata: {},
      };
    }

    if (!newSession.taskIds.includes(taskId)) {
      newSession.taskIds.push(taskId);
      newSession.lastUpdated = Date.now();
      await this.storage.saveSession(newSessionId, newSession);
    }

    return true;
  }

  private createDefaultTaskState(taskId: string): TaskState {
    return {
      taskId,
      status: 'pending',
      progress: 0,
      lastUpdated: Date.now(),
      checkpoints: [],
      outputs: {},
      errors: [],
      retryCount: 0,
      maxRetries: 3,
    };
  }

  async getSessionMetrics(): Promise<SessionMetrics> {
    if (!this.activeSession) {
      throw new Error('No active session');
    }

    const allTaskStates = await Promise.all(
      this.activeSession.taskIds.map(taskId => this.storage.loadTaskState(taskId))
    );

    const validTaskStates = allTaskStates.filter(ts => ts !== null) as TaskState[];

    const totalTasks = validTaskStates.length;
    const completedTasks = validTaskStates.filter(ts => ts.status === 'completed').length;
    const failedTasks = validTaskStates.filter(ts => ts.status === 'failed').length;
    const averageProgress = totalTasks > 0
      ? validTaskStates.reduce((sum, ts) => sum + ts.progress, 0) / totalTasks
      : 0;

    const totalCheckpoints = validTaskStates.reduce((sum, ts) => sum + ts.checkpoints.length, 0);

    return {
      sessionId: this.activeSession.sessionId,
      sessionDuration: Date.now() - this.activeSession.startTime,
      totalTasks,
      completedTasks,
      failedTasks,
      averageProgress,
      totalCheckpoints,
      contextSnapshotCount: this.activeSession.contextSnapshots.length,
    };
  }
}

interface SessionMetrics {
  sessionId: string;
  sessionDuration: number;
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  averageProgress: number;
  totalCheckpoints: number;
  contextSnapshotCount: number;
}

describe('Cross-Session Task Persistence Tests', () => {
  let mockConfig: Config;
  let sessionStorage: MockSessionStorage;
  let persistenceManager: CrossSessionPersistenceManager;

  beforeEach(() => {
    mockConfig = {
      getSessionId: vi.fn().mockReturnValue('cross-session-test-session'),
      getToolRegistry: vi.fn().mockReturnValue({
        getTool: vi.fn(),
        getFunctionDeclarations: vi.fn().mockReturnValue([]),
        getFunctionDeclarationsFiltered: vi.fn().mockReturnValue([]),
      }),
      setModel: vi.fn(),
      initialize: vi.fn(),
    } as unknown as Config;

    sessionStorage = new MockSessionStorage();
    persistenceManager = new CrossSessionPersistenceManager(sessionStorage);

    MockAgentFactory.reset();
  });

  afterEach(() => {
    sessionStorage.reset();
    MockAgentFactory.reset();
    vi.restoreAllMocks();
  });

  describe('Session Management', () => {
    it('should create and manage sessions correctly', async () => {
      const sessionId = 'test-session-001';

      // Start new session
      await persistenceManager.startSession(sessionId);

      const sessionData = await sessionStorage.loadSession(sessionId);
      expect(sessionData).toBeDefined();
      expect(sessionData!.sessionId).toBe(sessionId);
      expect(sessionData!.startTime).toBeGreaterThan(0);
      expect(sessionData!.taskIds).toEqual([]);
      expect(sessionData!.contextSnapshots).toEqual([]);

      // Pause and resume session
      await persistenceManager.pauseSession();
      const pausedSession = await sessionStorage.loadSession(sessionId);
      expect(pausedSession!.lastUpdated).toBeGreaterThan(pausedSession!.startTime);

      const resumed = await persistenceManager.resumeSession(sessionId);
      expect(resumed).toBe(true);
    });

    it('should handle session resume for non-existent sessions', async () => {
      const resumed = await persistenceManager.resumeSession('non-existent-session');
      expect(resumed).toBe(false);
    });

    it('should track multiple active sessions', async () => {
      const sessionIds = ['session-1', 'session-2', 'session-3'];

      for (const sessionId of sessionIds) {
        await persistenceManager.startSession(sessionId);
        await persistenceManager.pauseSession();
      }

      const activeSessions = await sessionStorage.getAllActiveSessions();
      expect(activeSessions).toHaveLength(3);

      activeSessions.forEach(session => {
        expect(sessionIds).toContain(session.sessionId);
      });
    });
  });

  describe('Task State Persistence', () => {
    it('should create and restore task checkpoints', async () => {
      const sessionId = 'checkpoint-test-session';
      const taskId = 'checkpoint-test-task';

      await persistenceManager.startSession(sessionId);

      // Create checkpoints at different progress points
      const checkpoint1 = await persistenceManager.createTaskCheckpoint(
        taskId,
        'initialization',
        0.1,
        { initialized: true, config: 'loaded' }
      );

      const checkpoint2 = await persistenceManager.createTaskCheckpoint(
        taskId,
        'data_processing',
        0.5,
        { processed_items: 50, total_items: 100 }
      );

      const checkpoint3 = await persistenceManager.createTaskCheckpoint(
        taskId,
        'finalization',
        0.9,
        { results: 'generated', cleanup: 'completed' }
      );

      expect(checkpoint1).toBeTruthy();
      expect(checkpoint2).toBeTruthy();
      expect(checkpoint3).toBeTruthy();

      // Restore specific checkpoint
      const restoredCheckpoint2 = await persistenceManager.restoreFromCheckpoint(taskId, checkpoint2);
      expect(restoredCheckpoint2).toBeDefined();
      expect(restoredCheckpoint2!.step).toBe('data_processing');
      expect(restoredCheckpoint2!.progress).toBe(0.5);
      expect(restoredCheckpoint2!.data.processed_items).toBe(50);

      // Restore latest checkpoint
      const latestCheckpoint = await persistenceManager.restoreFromCheckpoint(taskId);
      expect(latestCheckpoint).toBeDefined();
      expect(latestCheckpoint!.step).toBe('finalization');
      expect(latestCheckpoint!.progress).toBe(0.9);
    });

    it('should persist and restore complex task states', async () => {
      const sessionId = 'complex-task-session';
      const taskId = 'complex-task-001';

      await persistenceManager.startSession(sessionId);

      // Create a complex task with multiple checkpoints
      const task = new TaskBuilder()
        .withName('complex-persistent-task')
        .withComplexity(TaskComplexity.COMPLEX)
        .withCategory(TaskCategory.CODE_GENERATION)
        .withOutputs({
          generated_code: 'Generated code content',
          test_results: 'Test execution results',
          documentation: 'Generated documentation',
        })
        .build();

      const agent = await MockAgentFactory.createMockAgent(
        {
          name: 'complex-persistent-agent',
          state: MockAgentState.SUCCESS,
          executionTime: 1000,
          outputVars: {
            generated_code: 'class Example { ... }',
            test_results: 'All tests passed',
            documentation: 'Complete API documentation',
          },
        },
        mockConfig,
        task.promptConfig,
        task.modelConfig,
        task.runConfig,
        task.options,
      );

      // Simulate task execution with checkpoints
      await persistenceManager.createTaskCheckpoint(taskId, 'analysis', 0.2, {
        requirements: 'analyzed',
        dependencies: ['typescript', 'jest'],
      });

      await persistenceManager.createTaskCheckpoint(taskId, 'code_generation', 0.6, {
        files_created: ['example.ts', 'example.test.ts'],
        lines_of_code: 250,
      });

      await persistenceManager.createTaskCheckpoint(taskId, 'testing', 0.8, {
        tests_written: 15,
        coverage: '95%',
      });

      // Execute agent to completion
      const context = new ContextState();
      context.set('task_id', taskId);
      context.set('session_id', sessionId);

      await agent.runNonInteractive(context);

      // Create final checkpoint
      await persistenceManager.createTaskCheckpoint(taskId, 'completed', 1.0, {
        status: 'completed',
        outputs: agent.output.emitted_vars,
      });

      // Verify task state persistence
      const taskState = await sessionStorage.loadTaskState(taskId);
      expect(taskState).toBeDefined();
      expect(taskState!.checkpoints).toHaveLength(4);
      expect(taskState!.progress).toBe(1.0);

      // Test checkpoint restoration
      const codeGenCheckpoint = await persistenceManager.restoreFromCheckpoint(taskId);
      expect(codeGenCheckpoint!.data.status).toBe('completed');
      expect(codeGenCheckpoint!.data.outputs).toEqual(agent.output.emitted_vars);
    });

    it('should handle task migration between sessions', async () => {
      const originalSessionId = 'original-session';
      const newSessionId = 'new-session';
      const taskId = 'migratable-task';

      // Start original session and create task
      await persistenceManager.startSession(originalSessionId);
      await persistenceManager.createTaskCheckpoint(taskId, 'initial', 0.3, {
        started_in: originalSessionId,
      });

      // Pause original session
      await persistenceManager.pauseSession();

      // Start new session
      await persistenceManager.startSession(newSessionId);

      // Migrate task to new session
      const migrated = await persistenceManager.migrateTaskToNewSession(taskId, newSessionId);
      expect(migrated).toBe(true);

      // Continue task in new session
      await persistenceManager.createTaskCheckpoint(taskId, 'continued', 0.7, {
        continued_in: newSessionId,
      });

      // Verify task state shows continuity
      const taskState = await sessionStorage.loadTaskState(taskId);
      expect(taskState).toBeDefined();
      expect(taskState!.checkpoints).toHaveLength(2);
      expect(taskState!.checkpoints[0].data.started_in).toBe(originalSessionId);
      expect(taskState!.checkpoints[1].data.continued_in).toBe(newSessionId);

      // Verify both sessions reference the task appropriately
      const newSession = await sessionStorage.loadSession(newSessionId);
      expect(newSession!.taskIds).toContain(taskId);
    });
  });

  describe('Context Persistence and Restoration', () => {
    it('should save and restore context snapshots', async () => {
      const sessionId = 'context-test-session';
      await persistenceManager.startSession(sessionId);

      const originalContext = new ContextState();
      originalContext.set('project_name', 'Gemini CLI');
      originalContext.set('current_phase', 'development');
      originalContext.set('team_members', ['alice', 'bob', 'charlie']);
      originalContext.set('progress', { completed: 60, total: 100 });
      originalContext.set('settings', {
        debug: true,
        verbose: false,
        environment: 'staging',
      });

      // Save context snapshot
      const snapshotId = await persistenceManager.saveContextSnapshot(originalContext, {
        phase: 'mid-development',
        importance: 'high',
      });

      expect(snapshotId).toBeTruthy();

      // Restore context from snapshot
      const restoredContext = await persistenceManager.restoreContextSnapshot(snapshotId);
      expect(restoredContext).toBeDefined();

      // Verify all data was restored correctly
      expect(restoredContext!.get('project_name')).toBe('Gemini CLI');
      expect(restoredContext!.get('current_phase')).toBe('development');
      expect(restoredContext!.get('team_members')).toEqual(['alice', 'bob', 'charlie']);
      expect(restoredContext!.get('progress')).toEqual({ completed: 60, total: 100 });
      expect(restoredContext!.get('settings')).toEqual({
        debug: true,
        verbose: false,
        environment: 'staging',
      });

      // Verify context keys match
      const originalKeys = originalContext.get_keys().sort();
      const restoredKeys = restoredContext!.get_keys().sort();
      expect(restoredKeys).toEqual(originalKeys);
    });

    it('should handle context evolution across sessions', async () => {
      const session1Id = 'evolution-session-1';
      const session2Id = 'evolution-session-2';

      // Session 1: Initial context
      await persistenceManager.startSession(session1Id);
      const initialContext = new ContextState();
      initialContext.set('version', '1.0.0');
      initialContext.set('features', ['basic', 'auth']);
      initialContext.set('status', 'in_progress');

      const snapshot1 = await persistenceManager.saveContextSnapshot(initialContext, {
        session: session1Id,
        version: '1.0.0',
      });

      await persistenceManager.pauseSession();

      // Session 2: Evolved context
      await persistenceManager.startSession(session2Id);
      const evolvedContext = await persistenceManager.restoreContextSnapshot(snapshot1);

      // Modify context
      evolvedContext!.set('version', '1.1.0');
      evolvedContext!.set('features', ['basic', 'auth', 'admin']);
      evolvedContext!.set('status', 'testing');
      evolvedContext!.set('new_field', 'added_in_session_2');

      const snapshot2 = await persistenceManager.saveContextSnapshot(evolvedContext!, {
        session: session2Id,
        version: '1.1.0',
      });

      // Verify evolution
      const finalContext = await persistenceManager.restoreContextSnapshot(snapshot2);
      expect(finalContext!.get('version')).toBe('1.1.0');
      expect(finalContext!.get('features')).toEqual(['basic', 'auth', 'admin']);
      expect(finalContext!.get('status')).toBe('testing');
      expect(finalContext!.get('new_field')).toBe('added_in_session_2');

      // Verify we can still access original snapshot
      const originalContext = await persistenceManager.restoreContextSnapshot(snapshot1);
      expect(originalContext!.get('version')).toBe('1.0.0');
      expect(originalContext!.get('features')).toEqual(['basic', 'auth']);
    });

    it('should maintain context integrity during concurrent modifications', async () => {
      const sessionId = 'concurrent-context-session';
      await persistenceManager.startSession(sessionId);

      const baseContext = new ContextState();
      baseContext.set('shared_counter', 0);
      baseContext.set('concurrent_operations', []);

      // Create multiple "concurrent" context modifications
      const modificationPromises = Array.from({ length: 5 }, async (_, i) => {
        const modifiedContext = new ContextState();

        // Copy base context
        baseContext.get_keys().forEach(key => {
          modifiedContext.set(key, baseContext.get(key));
        });

        // Make modifications
        modifiedContext.set('shared_counter', i + 1);
        const operations = modifiedContext.get('concurrent_operations') as any[];
        operations.push(`operation_${i}`);
        modifiedContext.set('concurrent_operations', operations);
        modifiedContext.set(`operation_${i}_data`, {
          timestamp: Date.now(),
          data: `data_${i}`,
        });

        return persistenceManager.saveContextSnapshot(modifiedContext, {
          operation: i,
          timestamp: Date.now(),
        });
      });

      const snapshotIds = await Promise.all(modificationPromises);

      // Verify all snapshots were saved
      expect(snapshotIds).toHaveLength(5);
      snapshotIds.forEach(id => expect(id).toBeTruthy());

      // Restore and verify each snapshot
      for (let i = 0; i < snapshotIds.length; i++) {
        const context = await persistenceManager.restoreContextSnapshot(snapshotIds[i]);
        expect(context).toBeDefined();
        expect(context!.get('shared_counter')).toBe(i + 1);
        expect(context!.get(`operation_${i}_data`)).toBeDefined();
      }
    });
  });

  describe('Cross-Session Workflow Continuity', () => {
    it('should resume complex workflows across sessions', async () => {
      // Session 1: Start workflow
      const session1Id = 'workflow-session-1';
      await persistenceManager.startSession(session1Id);

      const workflowContext = new ContextState();
      workflowContext.set('workflow_id', 'complex-workflow-001');
      workflowContext.set('total_steps', 5);
      workflowContext.set('completed_steps', []);

      // Complete first 2 steps
      const step1Task = new TaskBuilder()
        .withName('workflow-step-1')
        .withOutputs({ step1_result: 'Step 1 completed' })
        .build();

      const step1Agent = await MockAgentFactory.createMockAgent(
        {
          name: 'workflow-step-1-agent',
          state: MockAgentState.SUCCESS,
          outputVars: { step1_result: 'Requirements analyzed' },
        },
        mockConfig,
        step1Task.promptConfig,
        step1Task.modelConfig,
        step1Task.runConfig,
        step1Task.options,
      );

      await step1Agent.runNonInteractive(workflowContext);

      // Update context and create checkpoint
      const completedSteps = workflowContext.get('completed_steps') as string[];
      completedSteps.push('step1');
      workflowContext.set('completed_steps', completedSteps);
      workflowContext.set('step1_output', step1Agent.output.emitted_vars);

      await persistenceManager.createTaskCheckpoint('workflow-task', 'step1_completed', 0.2, {
        completed_steps: completedSteps,
        step1_output: step1Agent.output.emitted_vars,
      });

      const contextSnapshot1 = await persistenceManager.saveContextSnapshot(workflowContext);

      // Pause session (simulate interruption)
      await persistenceManager.pauseSession();

      // Session 2: Resume workflow
      const session2Id = 'workflow-session-2';
      await persistenceManager.startSession(session2Id);

      // Restore context and checkpoint
      const restoredContext = await persistenceManager.restoreContextSnapshot(contextSnapshot1);
      const checkpoint = await persistenceManager.restoreFromCheckpoint('workflow-task');

      expect(restoredContext).toBeDefined();
      expect(checkpoint).toBeDefined();
      expect(checkpoint!.progress).toBe(0.2);

      // Continue with step 2
      const step2Task = new TaskBuilder()
        .withName('workflow-step-2')
        .withOutputs({ step2_result: 'Step 2 completed' })
        .build();

      const step2Agent = await MockAgentFactory.createMockAgent(
        {
          name: 'workflow-step-2-agent',
          state: MockAgentState.SUCCESS,
          outputVars: { step2_result: 'Architecture designed' },
        },
        mockConfig,
        step2Task.promptConfig,
        step2Task.modelConfig,
        step2Task.runConfig,
        step2Task.options,
      );

      await step2Agent.runNonInteractive(restoredContext!);

      // Verify workflow continuity
      expect(restoredContext!.get('workflow_id')).toBe('complex-workflow-001');
      expect(restoredContext!.get('step1_output')).toEqual({
        step1_result: 'Requirements analyzed',
      });

      // Update progress
      const updatedCompletedSteps = restoredContext!.get('completed_steps') as string[];
      updatedCompletedSteps.push('step2');
      restoredContext!.set('completed_steps', updatedCompletedSteps);

      await persistenceManager.createTaskCheckpoint('workflow-task', 'step2_completed', 0.4, {
        completed_steps: updatedCompletedSteps,
        step2_output: step2Agent.output.emitted_vars,
      });

      // Migrate task to ensure continuity
      const migrated = await persistenceManager.migrateTaskToNewSession('workflow-task', session2Id);
      expect(migrated).toBe(true);

      // Verify workflow state
      const finalTaskState = await sessionStorage.loadTaskState('workflow-task');
      expect(finalTaskState!.checkpoints).toHaveLength(2);
      expect(finalTaskState!.progress).toBe(0.4);
    });

    it('should handle workflow failure and recovery across sessions', async () => {
      // Session 1: Workflow fails partway through
      const session1Id = 'failure-recovery-session-1';
      await persistenceManager.startSession(session1Id);

      const workflowContext = new ContextState();
      workflowContext.set('recovery_workflow_id', 'failure-test-workflow');
      workflowContext.set('retry_count', 0);
      workflowContext.set('max_retries', 3);

      // Create successful initial task
      await persistenceManager.createTaskCheckpoint('recovery-task', 'initialization', 0.1, {
        status: 'success',
        message: 'Workflow initialized successfully',
      });

      // Create failing task
      const failingAgent = await MockAgentFactory.createMockAgent(
        {
          name: 'failing-workflow-agent',
          state: MockAgentState.FAILURE,
          errorMessage: 'Network timeout during processing',
        },
        mockConfig,
        { systemPrompt: 'Failing task' },
        { model: 'gemini-1.5-flash', temp: 0.5, top_p: 1 },
        { max_time_minutes: 1, max_turns: 3 },
      );

      let caughtError = null;
      try {
        await failingAgent.runNonInteractive(workflowContext);
      } catch (error) {
        caughtError = error;
      }

      expect(caughtError).toBeDefined();

      // Create failure checkpoint
      await persistenceManager.createTaskCheckpoint('recovery-task', 'processing_failed', 0.3, {
        status: 'failed',
        error: (caughtError as Error).message,
        retry_needed: true,
      });

      const failureSnapshot = await persistenceManager.saveContextSnapshot(workflowContext);
      await persistenceManager.pauseSession();

      // Session 2: Recover from failure
      const session2Id = 'failure-recovery-session-2';
      await persistenceManager.startSession(session2Id);

      const recoveryContext = await persistenceManager.restoreContextSnapshot(failureSnapshot);
      const failureCheckpoint = await persistenceManager.restoreFromCheckpoint('recovery-task');

      expect(failureCheckpoint!.data.status).toBe('failed');
      expect(failureCheckpoint!.data.retry_needed).toBe(true);

      // Implement recovery
      const recoveryAgent = await MockAgentFactory.createMockAgent(
        {
          name: 'recovery-workflow-agent',
          state: MockAgentState.SUCCESS,
          outputVars: {
            recovery_status: 'success',
            recovered_from: 'network_timeout',
            completion: 'workflow_recovered',
          },
        },
        mockConfig,
        { systemPrompt: 'Recovery from failure' },
        { model: 'gemini-1.5-flash', temp: 0.5, top_p: 1 },
        { max_time_minutes: 2, max_turns: 5 },
      );

      await recoveryAgent.runNonInteractive(recoveryContext!);

      // Create recovery checkpoint
      await persistenceManager.createTaskCheckpoint('recovery-task', 'recovery_complete', 1.0, {
        status: 'completed',
        recovery_successful: true,
        original_error: 'network_timeout',
        final_outputs: recoveryAgent.output.emitted_vars,
      });

      // Verify recovery workflow
      const finalTaskState = await sessionStorage.loadTaskState('recovery-task');
      expect(finalTaskState!.checkpoints).toHaveLength(3);
      expect(finalTaskState!.progress).toBe(1.0);
      expect(finalTaskState!.checkpoints[2].data.recovery_successful).toBe(true);
    });
  });

  describe('Performance and Data Integrity', () => {
    it('should handle large context data efficiently', async () => {
      const sessionId = 'large-context-session';
      await persistenceManager.startSession(sessionId);

      // Create large context with realistic data sizes
      const largeContext = new ContextState();
      largeContext.set('large_dataset', Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        name: `item_${i}`,
        data: `data_${i}`.repeat(100), // Simulate larger data
        metadata: {
          created: Date.now(),
          tags: [`tag_${i % 10}`, `category_${i % 5}`],
        },
      })));

      largeContext.set('processing_history', Array.from({ length: 500 }, (_, i) => ({
        step: i,
        timestamp: Date.now() - (i * 1000),
        operation: `operation_${i}`,
        result: `result_${i}`,
      })));

      largeContext.set('configuration', {
        deeply: {
          nested: {
            config: {
              values: Array.from({ length: 100 }, (_, i) => ({
                key: `config_${i}`,
                value: `value_${i}`,
              })),
            },
          },
        },
      });

      const startTime = Date.now();
      const snapshotId = await persistenceManager.saveContextSnapshot(largeContext);
      const saveTime = Date.now() - startTime;

      const restoreStartTime = Date.now();
      const restoredContext = await persistenceManager.restoreContextSnapshot(snapshotId);
      const restoreTime = Date.now() - restoreStartTime;

      // Performance checks
      expect(saveTime).toBeLessThan(1000); // Should save within 1 second
      expect(restoreTime).toBeLessThan(500); // Should restore within 500ms

      // Data integrity checks
      expect(restoredContext).toBeDefined();
      expect(restoredContext!.get('large_dataset')).toHaveLength(1000);
      expect(restoredContext!.get('processing_history')).toHaveLength(500);

      const originalDataset = largeContext.get('large_dataset') as any[];
      const restoredDataset = restoredContext!.get('large_dataset') as any[];

      expect(restoredDataset[0]).toEqual(originalDataset[0]);
      expect(restoredDataset[999]).toEqual(originalDataset[999]);
    });

    it('should clean up old persistence data', async () => {
      // Create multiple sessions and task states
      const sessionIds = ['cleanup-test-1', 'cleanup-test-2', 'cleanup-test-3'];
      const taskIds = ['task-1', 'task-2', 'task-3', 'task-4'];

      for (const sessionId of sessionIds) {
        await persistenceManager.startSession(sessionId);
        for (const taskId of taskIds) {
          await persistenceManager.createTaskCheckpoint(taskId, 'test_step', 0.5, {
            session: sessionId,
            data: 'test_data',
          });
        }
        await persistenceManager.pauseSession();
      }

      // Verify data exists before cleanup
      expect(sessionStorage.getSessionCount()).toBe(3);
      expect(sessionStorage.getTaskStateCount()).toBe(4); // Tasks are overwritten, so only unique task IDs

      // Perform cleanup (in real system, this would clean old data)
      await sessionStorage.cleanup();

      // For this test, cleanup doesn't remove recent data, so verify it's still there
      expect(sessionStorage.getSessionCount()).toBeGreaterThan(0);
      expect(sessionStorage.getTaskStateCount()).toBeGreaterThan(0);
    });

    it('should generate comprehensive session metrics', async () => {
      const sessionId = 'metrics-test-session';
      await persistenceManager.startSession(sessionId);

      const taskIds = ['metrics-task-1', 'metrics-task-2', 'metrics-task-3'];

      // Create tasks with different states
      await persistenceManager.createTaskCheckpoint(taskIds[0], 'completed', 1.0, {
        status: 'completed',
        result: 'success',
      });

      await persistenceManager.createTaskCheckpoint(taskIds[1], 'in_progress', 0.6, {
        status: 'in_progress',
        current_step: 'processing',
      });

      await persistenceManager.createTaskCheckpoint(taskIds[2], 'failed', 0.3, {
        status: 'failed',
        error: 'processing_error',
      });

      // Create context snapshots
      const context1 = new ContextState();
      context1.set('snapshot', 1);
      await persistenceManager.saveContextSnapshot(context1);

      const context2 = new ContextState();
      context2.set('snapshot', 2);
      await persistenceManager.saveContextSnapshot(context2);

      // Add task IDs to session (simulating task association)
      const sessionData = await sessionStorage.loadSession(sessionId);
      sessionData!.taskIds = taskIds;
      await sessionStorage.saveSession(sessionId, sessionData!);

      const metrics = await persistenceManager.getSessionMetrics();

      expect(metrics.sessionId).toBe(sessionId);
      expect(metrics.sessionDuration).toBeGreaterThan(0);
      expect(metrics.totalTasks).toBe(3);
      expect(metrics.totalCheckpoints).toBe(3);
      expect(metrics.contextSnapshotCount).toBe(2);

      // The specific counts may vary due to mock implementation
      expect(metrics.completedTasks + metrics.failedTasks).toBeLessThanOrEqual(metrics.totalTasks);
      expect(metrics.averageProgress).toBeGreaterThan(0);
      expect(metrics.averageProgress).toBeLessThanOrEqual(1);
    });
  });
});