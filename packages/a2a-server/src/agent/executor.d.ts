/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Task as SDKTask } from '@a2a-js/sdk';
import type {
  TaskStore,
  AgentExecutor,
  RequestContext,
  ExecutionEventBus,
} from '@a2a-js/sdk/server';
import type { AgentSettings } from '../types.js';
import type { Task } from './task.js';
/**
 * Provides a wrapper for Task. Passes data from Task to SDKTask.
 * The idea is to use this class inside CoderAgentExecutor to replace Task.
 *
 * This class acts as an adapter between the internal Task representation and the SDK Task format,
 * enabling seamless serialization and persistence of task state while maintaining runtime functionality.
 *
 * @example
 * ```typescript
 * const wrapper = new TaskWrapper(task, agentSettings);
 * const sdkTask = wrapper.toSDKTask();
 * ```
 */
export declare class TaskWrapper {
  task: Task;
  agentSettings: AgentSettings;
  constructor(task: Task, agentSettings: AgentSettings);
  /**
   * Gets the unique identifier of the wrapped task.
   *
   * @returns The task ID
   */
  get id(): string;
  /**
   * Converts the internal task representation to an SDK-compatible task format.
   *
   * This method serializes the task state, agent settings, and metadata into a format
   * that can be stored, transmitted, and reconstructed by the SDK.
   *
   * @returns The SDK task representation
   */
  toSDKTask(): SDKTask;
}
/**
 * CoderAgentExecutor implements the agent's core logic for code generation.
 *
 * This class serves as the primary execution engine for code generation tasks,
 * managing the full lifecycle of agent-to-agent (A2A) interactions including:
 * - Task creation and reconstruction from persistent storage
 * - Message processing and conversation state management
 * - Tool execution and response handling
 * - Error recovery and cancellation support
 * - Integration with the Gemini AI model for code generation
 *
 * The executor follows an event-driven architecture where user messages trigger
 * agent responses, which may invoke tools that produce results fed back to the model.
 * All state changes are persisted to enable task resumption across sessions.
 *
 * @example
 * ```typescript
 * const executor = new CoderAgentExecutor(taskStore);
 * await executor.execute(requestContext, eventBus);
 * ```
 */
export declare class CoderAgentExecutor implements AgentExecutor {
  private taskStore?;
  private tasks;
  private executingTasks;
  constructor(taskStore?: TaskStore | undefined);
  /**
   * Loads and initializes the configuration for a task execution.
   *
   * This method combines workspace settings, extensions, and environment variables
   * to create a complete configuration for the Gemini AI client and associated services.
   *
   * @param agentSettings - Agent-specific settings including workspace path
   * @param taskId - The unique identifier for the task
   * @returns Promise resolving to the initialized configuration
   */
  private getConfig;
  /**
   * Reconstructs TaskWrapper from SDKTask.
   *
   * This method deserializes a persisted SDK task back into a runtime TaskWrapper,
   * restoring the execution context, agent settings, and Gemini client state.
   * Used when resuming tasks from storage.
   *
   * @param sdkTask - The SDK task to reconstruct
   * @param eventBus - Optional event bus for publishing execution events
   * @returns Promise resolving to the reconstructed TaskWrapper
   * @throws {Error} When persisted state is missing or corrupted
   */
  reconstruct(
    sdkTask: SDKTask,
    eventBus?: ExecutionEventBus,
  ): Promise<TaskWrapper>;
  /**
   * Creates a new task with the specified configuration.
   *
   * Initializes a fresh task instance with the provided settings, loads the
   * configuration, and prepares the Gemini client for execution.
   *
   * @param taskId - Unique identifier for the new task
   * @param contextId - Context identifier for conversation grouping
   * @param agentSettingsInput - Optional agent-specific settings
   * @param eventBus - Optional event bus for publishing execution events
   * @returns Promise resolving to the new TaskWrapper
   */
  createTask(
    taskId: string,
    contextId: string,
    agentSettingsInput?: AgentSettings,
    eventBus?: ExecutionEventBus,
  ): Promise<TaskWrapper>;
  /**
   * Retrieves a task from the in-memory cache.
   *
   * @param taskId - The unique identifier of the task to retrieve
   * @returns The TaskWrapper if found, undefined otherwise
   */
  getTask(taskId: string): TaskWrapper | undefined;
  /**
   * Gets all tasks currently held in memory.
   *
   * @returns Array of all TaskWrapper instances
   */
  getAllTasks(): TaskWrapper[];
  /**
   * Cancels a running task and updates its state.
   *
   * This method gracefully terminates task execution, cancels any pending tool calls,
   * and updates the task state to 'canceled'. The final state is persisted to storage.
   *
   * @param taskId - The unique identifier of the task to cancel
   * @param eventBus - Event bus for publishing cancellation status updates
   * @returns Promise that resolves when cancellation is complete
   */
  cancelTask: (taskId: string, eventBus: ExecutionEventBus) => Promise<void>;
  /**
   * Executes the main agent workflow for processing user requests.
   *
   * This is the primary entry point for agent execution. It handles:
   * - Task loading/creation from request context
   * - User message processing and agent response generation
   * - Tool call execution and response handling
   * - State persistence and error recovery
   * - Client disconnection handling via abort signals
   *
   * The execution follows a turn-based conversation model where each user message
   * triggers an agent response that may include tool calls. The agent continues
   * processing until no more tool calls are generated, then waits for the next user input.
   *
   * @param requestContext - Contains user message, task, and metadata
   * @param eventBus - Event bus for publishing execution events and status updates
   * @returns Promise that resolves when execution is complete or paused
   */
  execute(
    requestContext: RequestContext,
    eventBus: ExecutionEventBus,
  ): Promise<void>;
}
