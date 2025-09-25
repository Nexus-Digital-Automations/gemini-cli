/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { GeminiEventType } from '@google/gemini-cli-core';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger.js';
import {
  CoderAgentEvent,
  getPersistedState,
  setPersistedState,
} from '../types.js';
import { loadConfig, loadEnvironment, setTargetDir } from '../config/config.js';
import { loadSettings } from '../config/settings.js';
import { loadExtensions } from '../config/extension.js';
import { Task } from './task.js';
import { requestStorage } from '../http/index.js';
import { pushTaskStateFailed } from '../utils/executor_utils.js';
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
class TaskWrapper {
  task;
  agentSettings;
  constructor(task, agentSettings) {
    this.task = task;
    this.agentSettings = agentSettings;
  }
  /**
   * Gets the unique identifier of the wrapped task.
   *
   * @returns The task ID
   */
  get id() {
    return this.task.id;
  }
  /**
   * Converts the internal task representation to an SDK-compatible task format.
   *
   * This method serializes the task state, agent settings, and metadata into a format
   * that can be stored, transmitted, and reconstructed by the SDK.
   *
   * @returns The SDK task representation
   */
  toSDKTask() {
    const persistedState = {
      _agentSettings: this.agentSettings,
      _taskState: this.task.taskState,
    };
    const sdkTask = {
      id: this.task.id,
      contextId: this.task.contextId,
      kind: 'task',
      status: {
        state: this.task.taskState,
        timestamp: new Date().toISOString(),
      },
      metadata: setPersistedState({}, persistedState),
      history: [],
      artifacts: [],
    };
    sdkTask.metadata['_contextId'] = this.task.contextId;
    return sdkTask;
  }
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
export class CoderAgentExecutor {
  taskStore;
  tasks = new Map();
  // Track tasks with an active execution loop.
  executingTasks = new Set();
  constructor(taskStore) {
    this.taskStore = taskStore;
  }
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
  async getConfig(agentSettings, taskId) {
    const workspaceRoot = setTargetDir(agentSettings);
    loadEnvironment(); // Will override any global env with workspace envs
    const settings = loadSettings(workspaceRoot);
    const extensions = loadExtensions(workspaceRoot);
    return await loadConfig(settings, extensions, taskId);
  }
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
  async reconstruct(sdkTask, eventBus) {
    const metadata = sdkTask.metadata || {};
    const persistedState = getPersistedState(metadata);
    if (!persistedState) {
      throw new Error(
        `Cannot reconstruct task ${sdkTask.id}: missing persisted state in metadata.`,
      );
    }
    const agentSettings = persistedState._agentSettings;
    const config = await this.getConfig(agentSettings, sdkTask.id);
    const contextId = metadata['_contextId'] || sdkTask.contextId;
    const runtimeTask = await Task.create(
      sdkTask.id,
      contextId,
      config,
      eventBus,
    );
    runtimeTask.taskState = persistedState._taskState;
    await runtimeTask.geminiClient.initialize();
    const wrapper = new TaskWrapper(runtimeTask, agentSettings);
    this.tasks.set(sdkTask.id, wrapper);
    logger.info(`Task ${sdkTask.id} reconstructed from store.`);
    return wrapper;
  }
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
  async createTask(taskId, contextId, agentSettingsInput, eventBus) {
    const agentSettings = agentSettingsInput || {};
    const config = await this.getConfig(agentSettings, taskId);
    const runtimeTask = await Task.create(taskId, contextId, config, eventBus);
    await runtimeTask.geminiClient.initialize();
    const wrapper = new TaskWrapper(runtimeTask, agentSettings);
    this.tasks.set(taskId, wrapper);
    logger.info(`New task ${taskId} created.`);
    return wrapper;
  }
  /**
   * Retrieves a task from the in-memory cache.
   *
   * @param taskId - The unique identifier of the task to retrieve
   * @returns The TaskWrapper if found, undefined otherwise
   */
  getTask(taskId) {
    return this.tasks.get(taskId);
  }
  /**
   * Gets all tasks currently held in memory.
   *
   * @returns Array of all TaskWrapper instances
   */
  getAllTasks() {
    return Array.from(this.tasks.values());
  }
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
  cancelTask = async (taskId, eventBus) => {
    logger.info(
      `[CoderAgentExecutor] Received cancel request for task ${taskId}`,
    );
    const wrapper = this.tasks.get(taskId);
    if (!wrapper) {
      logger.warn(
        `[CoderAgentExecutor] Task ${taskId} not found for cancellation.`,
      );
      eventBus.publish({
        kind: 'status-update',
        taskId,
        contextId: uuidv4(),
        status: {
          state: 'failed',
          message: {
            kind: 'message',
            role: 'agent',
            parts: [{ kind: 'text', text: `Task ${taskId} not found.` }],
            messageId: uuidv4(),
            taskId,
          },
        },
        final: true,
      });
      return;
    }
    const { task } = wrapper;
    if (task.taskState === 'canceled' || task.taskState === 'failed') {
      logger.info(
        `[CoderAgentExecutor] Task ${taskId} is already in a final state: ${task.taskState}. No action needed for cancellation.`,
      );
      eventBus.publish({
        kind: 'status-update',
        taskId,
        contextId: task.contextId,
        status: {
          state: task.taskState,
          message: {
            kind: 'message',
            role: 'agent',
            parts: [
              {
                kind: 'text',
                text: `Task ${taskId} is already ${task.taskState}.`,
              },
            ],
            messageId: uuidv4(),
            taskId,
          },
        },
        final: true,
      });
      return;
    }
    try {
      logger.info(
        `[CoderAgentExecutor] Initiating cancellation for task ${taskId}.`,
      );
      task.cancelPendingTools('Task canceled by user request.');
      const stateChange = {
        kind: CoderAgentEvent.StateChangeEvent,
      };
      task.setTaskStateAndPublishUpdate(
        'canceled',
        stateChange,
        'Task canceled by user request.',
        undefined,
        true,
      );
      logger.info(
        `[CoderAgentExecutor] Task ${taskId} cancellation processed. Saving state.`,
      );
      await this.taskStore?.save(wrapper.toSDKTask());
      logger.info(`[CoderAgentExecutor] Task ${taskId} state CANCELED saved.`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      logger.error(
        `[CoderAgentExecutor] Error during task cancellation for ${taskId}: ${errorMessage}`,
        error,
      );
      eventBus.publish({
        kind: 'status-update',
        taskId,
        contextId: task.contextId,
        status: {
          state: 'failed',
          message: {
            kind: 'message',
            role: 'agent',
            parts: [
              {
                kind: 'text',
                text: `Failed to process cancellation for task ${taskId}: ${errorMessage}`,
              },
            ],
            messageId: uuidv4(),
            taskId,
          },
        },
        final: true,
      });
    }
  };
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
  async execute(requestContext, eventBus) {
    const userMessage = requestContext.userMessage;
    const sdkTask = requestContext.task;
    const taskId = sdkTask?.id || userMessage.taskId || uuidv4();
    const contextId =
      userMessage.contextId ||
      sdkTask?.contextId ||
      sdkTask?.metadata?.['_contextId'] ||
      uuidv4();
    logger.info(
      `[CoderAgentExecutor] Executing for taskId: ${taskId}, contextId: ${contextId}`,
    );
    logger.info(
      `[CoderAgentExecutor] userMessage: ${JSON.stringify(userMessage)}`,
    );
    eventBus.on('event', (event) => logger.info('[EventBus event]: ', event));
    const store = requestStorage.getStore();
    if (!store) {
      logger.error(
        '[CoderAgentExecutor] Could not get request from async local storage. Cancellation on socket close will not be handled for this request.',
      );
    }
    const abortController = new AbortController();
    const abortSignal = abortController.signal;
    if (store) {
      // Grab the raw socket from the request object
      const socket = store.req.socket;
      const onClientEnd = () => {
        logger.info(
          `[CoderAgentExecutor] Client socket closed for task ${taskId}. Cancelling execution.`,
        );
        if (!abortController.signal.aborted) {
          abortController.abort();
        }
        // Clean up the listener to prevent memory leaks
        socket.removeListener('close', onClientEnd);
      };
      // Listen on the socket's 'end' event (remote closed the connection)
      socket.on('end', onClientEnd);
      // It's also good practice to remove the listener if the task completes successfully
      abortSignal.addEventListener('abort', () => {
        socket.removeListener('end', onClientEnd);
      });
      logger.info(
        `[CoderAgentExecutor] Socket close handler set up for task ${taskId}.`,
      );
    }
    let wrapper = this.tasks.get(taskId);
    if (wrapper) {
      wrapper.task.eventBus = eventBus;
      logger.info(`[CoderAgentExecutor] Task ${taskId} found in memory cache.`);
    } else if (sdkTask) {
      logger.info(
        `[CoderAgentExecutor] Task ${taskId} found in TaskStore. Reconstructing...`,
      );
      try {
        wrapper = await this.reconstruct(sdkTask, eventBus);
      } catch (e) {
        logger.error(
          `[CoderAgentExecutor] Failed to hydrate task ${taskId}:`,
          e,
        );
        const stateChange = {
          kind: CoderAgentEvent.StateChangeEvent,
        };
        eventBus.publish({
          kind: 'status-update',
          taskId,
          contextId: sdkTask.contextId,
          status: {
            state: 'failed',
            message: {
              kind: 'message',
              role: 'agent',
              parts: [
                {
                  kind: 'text',
                  text: 'Internal error: Task state lost or corrupted.',
                },
              ],
              messageId: uuidv4(),
              taskId,
              contextId: sdkTask.contextId,
            },
          },
          final: true,
          metadata: { coderAgent: stateChange },
        });
        return;
      }
    } else {
      logger.info(`[CoderAgentExecutor] Creating new task ${taskId}.`);
      const agentSettings = userMessage.metadata?.['coderAgent'];
      try {
        wrapper = await this.createTask(
          taskId,
          contextId,
          agentSettings,
          eventBus,
        );
      } catch (error) {
        logger.error(
          `[CoderAgentExecutor] Error creating task ${taskId}:`,
          error,
        );
        pushTaskStateFailed(error, eventBus, taskId, contextId);
        return;
      }
      const newTaskSDK = wrapper.toSDKTask();
      eventBus.publish({
        ...newTaskSDK,
        kind: 'task',
        status: { state: 'submitted', timestamp: new Date().toISOString() },
        history: [userMessage],
      });
      try {
        await this.taskStore?.save(newTaskSDK);
        logger.info(`[CoderAgentExecutor] New task ${taskId} saved to store.`);
      } catch (saveError) {
        logger.error(
          `[CoderAgentExecutor] Failed to save new task ${taskId} to store:`,
          saveError,
        );
      }
    }
    if (!wrapper) {
      logger.error(
        `[CoderAgentExecutor] Task ${taskId} is unexpectedly undefined after load/create.`,
      );
      return;
    }
    const currentTask = wrapper.task;
    if (['canceled', 'failed', 'completed'].includes(currentTask.taskState)) {
      logger.warn(
        `[CoderAgentExecutor] Attempted to execute task ${taskId} which is already in state ${currentTask.taskState}. Ignoring.`,
      );
      return;
    }
    if (this.executingTasks.has(taskId)) {
      logger.info(
        `[CoderAgentExecutor] Task ${taskId} has a pending execution. Processing message and yielding.`,
      );
      currentTask.eventBus = eventBus;
      for await (const _ of currentTask.acceptUserMessage(
        requestContext,
        abortController.signal,
      )) {
        logger.info(
          `[CoderAgentExecutor] Processing user message ${userMessage.messageId} in secondary execution loop for task ${taskId}.`,
        );
      }
      // End this execution-- the original/source will be resumed.
      return;
    }
    logger.info(
      `[CoderAgentExecutor] Starting main execution for message ${userMessage.messageId} for task ${taskId}.`,
    );
    this.executingTasks.add(taskId);
    try {
      let agentTurnActive = true;
      logger.info(`[CoderAgentExecutor] Task ${taskId}: Processing user turn.`);
      let agentEvents = currentTask.acceptUserMessage(
        requestContext,
        abortSignal,
      );
      while (agentTurnActive) {
        logger.info(
          `[CoderAgentExecutor] Task ${taskId}: Processing agent turn (LLM stream).`,
        );
        const toolCallRequests = [];
        for await (const event of agentEvents) {
          if (abortSignal.aborted) {
            logger.warn(
              `[CoderAgentExecutor] Task ${taskId}: Abort signal received during agent event processing.`,
            );
            throw new Error('Execution aborted');
          }
          if (event.type === GeminiEventType.ToolCallRequest) {
            toolCallRequests.push(event.value);
            continue;
          }
          await currentTask.acceptAgentMessage(event);
        }
        if (abortSignal.aborted) throw new Error('Execution aborted');
        if (toolCallRequests.length > 0) {
          logger.info(
            `[CoderAgentExecutor] Task ${taskId}: Found ${toolCallRequests.length} tool call requests. Scheduling as a batch.`,
          );
          await currentTask.scheduleToolCalls(toolCallRequests, abortSignal);
        }
        logger.info(
          `[CoderAgentExecutor] Task ${taskId}: Waiting for pending tools if any.`,
        );
        await currentTask.waitForPendingTools();
        logger.info(
          `[CoderAgentExecutor] Task ${taskId}: All pending tools completed or none were pending.`,
        );
        if (abortSignal.aborted) throw new Error('Execution aborted');
        const completedTools = currentTask.getAndClearCompletedTools();
        if (completedTools.length > 0) {
          // If all completed tool calls were canceled, manually add them to history and set state to input-required, final:true
          if (completedTools.every((tool) => tool.status === 'cancelled')) {
            logger.info(
              `[CoderAgentExecutor] Task ${taskId}: All tool calls were cancelled. Updating history and ending agent turn.`,
            );
            currentTask.addToolResponsesToHistory(completedTools);
            agentTurnActive = false;
            const stateChange = {
              kind: CoderAgentEvent.StateChangeEvent,
            };
            currentTask.setTaskStateAndPublishUpdate(
              'input-required',
              stateChange,
              undefined,
              undefined,
              true,
            );
          } else {
            logger.info(
              `[CoderAgentExecutor] Task ${taskId}: Found ${completedTools.length} completed tool calls. Sending results back to LLM.`,
            );
            agentEvents = currentTask.sendCompletedToolsToLlm(
              completedTools,
              abortSignal,
            );
            // Continue the loop to process the LLM response to the tool results.
          }
        } else {
          logger.info(
            `[CoderAgentExecutor] Task ${taskId}: No more tool calls to process. Ending agent turn.`,
          );
          agentTurnActive = false;
        }
      }
      logger.info(
        `[CoderAgentExecutor] Task ${taskId}: Agent turn finished, setting to input-required.`,
      );
      const stateChange = {
        kind: CoderAgentEvent.StateChangeEvent,
      };
      currentTask.setTaskStateAndPublishUpdate(
        'input-required',
        stateChange,
        undefined,
        undefined,
        true,
      );
    } catch (error) {
      if (abortSignal.aborted) {
        logger.warn(`[CoderAgentExecutor] Task ${taskId} execution aborted.`);
        currentTask.cancelPendingTools('Execution aborted');
        if (
          currentTask.taskState !== 'canceled' &&
          currentTask.taskState !== 'failed'
        ) {
          currentTask.setTaskStateAndPublishUpdate(
            'input-required',
            { kind: CoderAgentEvent.StateChangeEvent },
            'Execution aborted by client.',
            undefined,
            true,
          );
        }
      } else {
        const errorMessage =
          error instanceof Error ? error.message : 'Agent execution error';
        logger.error(
          `[CoderAgentExecutor] Error executing agent for task ${taskId}:`,
          error,
        );
        currentTask.cancelPendingTools(errorMessage);
        if (currentTask.taskState !== 'failed') {
          const stateChange = {
            kind: CoderAgentEvent.StateChangeEvent,
          };
          currentTask.setTaskStateAndPublishUpdate(
            'failed',
            stateChange,
            errorMessage,
            undefined,
            true,
          );
        }
      }
    } finally {
      this.executingTasks.delete(taskId);
      logger.info(
        `[CoderAgentExecutor] Saving final state for task ${taskId}.`,
      );
      try {
        await this.taskStore?.save(wrapper.toSDKTask());
        logger.info(`[CoderAgentExecutor] Task ${taskId} state saved.`);
      } catch (saveError) {
        logger.error(
          `[CoderAgentExecutor] Failed to save task ${taskId} state in finally block:`,
          saveError,
        );
      }
    }
  }
}
//# sourceMappingURL=executor.js.map
