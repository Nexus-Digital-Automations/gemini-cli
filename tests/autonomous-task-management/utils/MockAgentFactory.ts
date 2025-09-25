/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { vi, type Mock } from 'vitest';
import {
  SubAgentScope,
  ContextState,
  SubagentTerminateMode,
  type OutputObject,
  type PromptConfig,
  type ModelConfig,
  type RunConfig,
  type ToolConfig,
  type OutputConfig,
  type SubAgentOptions,
} from '../../../packages/core/src/core/subagent.js';
import type { Config } from '../../../packages/core/src/config/config.js';

/**
 * Mock agent states for testing different scenarios
 */
export enum MockAgentState {
  SUCCESS = 'SUCCESS',
  FAILURE = 'FAILURE',
  TIMEOUT = 'TIMEOUT',
  MAX_TURNS = 'MAX_TURNS',
  PARTIAL_SUCCESS = 'PARTIAL_SUCCESS',
}

/**
 * Configuration for creating mock agents with specific behaviors
 */
export interface MockAgentConfig {
  name: string;
  state: MockAgentState;
  executionTime?: number; // milliseconds
  outputVars?: Record<string, string>;
  errorMessage?: string;
  toolCalls?: string[];
  maxTurns?: number;
  onMessage?: (message: string) => void;
}

/**
 * Factory for creating mock agents with predefined behaviors for testing
 */
export class MockAgentFactory {
  private static mockConfigs: Map<string, MockAgentConfig> = new Map();
  private static executionLogs: Map<string, string[]> = new Map();

  /**
   * Creates a mock SubAgentScope with predefined behavior
   */
  static async createMockAgent(
    config: MockAgentConfig,
    runtimeContext: Config,
    promptConfig: PromptConfig,
    modelConfig: ModelConfig,
    runConfig: RunConfig,
    options?: SubAgentOptions,
  ): Promise<SubAgentScope> {
    // Store config for later reference
    this.mockConfigs.set(config.name, config);
    this.executionLogs.set(config.name, []);

    // Create a mock scope with controlled behavior
    const mockScope = {
      name: config.name,
      runtimeContext,
      output: this.createMockOutput(config),
      runNonInteractive: vi
        .fn()
        .mockImplementation(async (context: ContextState) => {
          return this.simulateExecution(config, context);
        }),
    } as unknown as SubAgentScope;

    // Override the static create method temporarily
    const originalCreate = SubAgentScope.create;
    vi.spyOn(SubAgentScope, 'create').mockResolvedValue(mockScope);

    return mockScope;
  }

  /**
   * Creates multiple mock agents for concurrent testing
   */
  static async createMockAgentPool(
    configs: MockAgentConfig[],
    runtimeContext: Config,
  ): Promise<SubAgentScope[]> {
    const defaultPromptConfig: PromptConfig = { systemPrompt: 'Test agent' };
    const defaultModelConfig: ModelConfig = {
      model: 'gemini-1.5-flash',
      temp: 0.5,
      top_p: 1,
    };
    const defaultRunConfig: RunConfig = { max_time_minutes: 5, max_turns: 10 };

    return Promise.all(
      configs.map((config) =>
        this.createMockAgent(
          config,
          runtimeContext,
          defaultPromptConfig,
          defaultModelConfig,
          defaultRunConfig,
        ),
      ),
    );
  }

  /**
   * Simulates agent execution with controlled timing and outcomes
   */
  private static async simulateExecution(
    config: MockAgentConfig,
    context: ContextState,
  ): Promise<void> {
    const startTime = Date.now();
    this.logMessage(
      config.name,
      `Starting execution with state: ${config.state}`,
    );

    // Simulate execution time
    if (config.executionTime) {
      await new Promise((resolve) => setTimeout(resolve, config.executionTime));
    }

    // Log context variables
    const contextVars = context.get_keys();
    this.logMessage(
      config.name,
      `Context variables: ${contextVars.join(', ')}`,
    );

    // Simulate tool calls
    if (config.toolCalls) {
      for (const tool of config.toolCalls) {
        this.logMessage(config.name, `Calling tool: ${tool}`);
        await new Promise((resolve) => setTimeout(resolve, 100)); // Small delay per tool
      }
    }

    // Simulate message callbacks
    if (config.onMessage) {
      config.onMessage(`Agent ${config.name} is processing...`);
    }

    const executionTime = Date.now() - startTime;
    this.logMessage(config.name, `Execution completed in ${executionTime}ms`);

    // Handle different execution outcomes
    switch (config.state) {
      case MockAgentState.FAILURE:
        if (config.errorMessage) {
          throw new Error(config.errorMessage);
        }
        throw new Error(`Mock agent ${config.name} simulated failure`);

      case MockAgentState.TIMEOUT:
        // Timeout is handled by the mock output, not by throwing
        break;

      case MockAgentState.MAX_TURNS:
        // Max turns is handled by the mock output
        break;

      case MockAgentState.SUCCESS:
      case MockAgentState.PARTIAL_SUCCESS:
        // Success cases handled by mock output
        break;
    }
  }

  /**
   * Creates mock output based on agent configuration
   */
  private static createMockOutput(config: MockAgentConfig): OutputObject {
    let terminateReason: SubagentTerminateMode;
    let emittedVars: Record<string, string> = {};

    switch (config.state) {
      case MockAgentState.SUCCESS:
        terminateReason = SubagentTerminateMode.GOAL;
        emittedVars = config.outputVars || { result: 'success' };
        break;

      case MockAgentState.PARTIAL_SUCCESS:
        terminateReason = SubagentTerminateMode.GOAL;
        emittedVars = config.outputVars || { result: 'partial_success' };
        break;

      case MockAgentState.FAILURE:
        terminateReason = SubagentTerminateMode.ERROR;
        emittedVars = {};
        break;

      case MockAgentState.TIMEOUT:
        terminateReason = SubagentTerminateMode.TIMEOUT;
        emittedVars = config.outputVars || {};
        break;

      case MockAgentState.MAX_TURNS:
        terminateReason = SubagentTerminateMode.MAX_TURNS;
        emittedVars = config.outputVars || {};
        break;

      default:
        terminateReason = SubagentTerminateMode.ERROR;
        emittedVars = {};
    }

    return {
      terminate_reason: terminateReason,
      emitted_vars: emittedVars,
    };
  }

  /**
   * Logs messages for a specific agent
   */
  private static logMessage(agentName: string, message: string): void {
    const log = this.executionLogs.get(agentName) || [];
    log.push(`[${new Date().toISOString()}] ${message}`);
    this.executionLogs.set(agentName, log);
  }

  /**
   * Gets execution logs for an agent
   */
  static getExecutionLogs(agentName: string): string[] {
    return this.executionLogs.get(agentName) || [];
  }

  /**
   * Gets all execution logs
   */
  static getAllExecutionLogs(): Map<string, string[]> {
    return new Map(this.executionLogs);
  }

  /**
   * Clears all execution logs
   */
  static clearLogs(): void {
    this.executionLogs.clear();
  }

  /**
   * Gets mock configuration for an agent
   */
  static getMockConfig(agentName: string): MockAgentConfig | undefined {
    return this.mockConfigs.get(agentName);
  }

  /**
   * Creates predefined agent configurations for common test scenarios
   */
  static createStandardConfigurations(): Record<string, MockAgentConfig> {
    return {
      fastSuccessAgent: {
        name: 'fast-success',
        state: MockAgentState.SUCCESS,
        executionTime: 100,
        outputVars: { result: 'quick_success', execution_time: '100ms' },
      },

      slowSuccessAgent: {
        name: 'slow-success',
        state: MockAgentState.SUCCESS,
        executionTime: 2000,
        outputVars: { result: 'slow_success', execution_time: '2000ms' },
      },

      failureAgent: {
        name: 'failure-agent',
        state: MockAgentState.FAILURE,
        executionTime: 500,
        errorMessage: 'Simulated agent failure for testing',
      },

      timeoutAgent: {
        name: 'timeout-agent',
        state: MockAgentState.TIMEOUT,
        executionTime: 5000,
        outputVars: { partial_result: 'timeout_occurred' },
      },

      maxTurnsAgent: {
        name: 'max-turns-agent',
        state: MockAgentState.MAX_TURNS,
        executionTime: 1000,
        maxTurns: 3,
        outputVars: { turns_exhausted: 'true' },
      },

      toolHeavyAgent: {
        name: 'tool-heavy-agent',
        state: MockAgentState.SUCCESS,
        executionTime: 1500,
        toolCalls: ['read_file', 'write_file', 'execute_command', 'git_commit'],
        outputVars: { tools_used: '4', result: 'tool_heavy_success' },
      },

      partialSuccessAgent: {
        name: 'partial-success-agent',
        state: MockAgentState.PARTIAL_SUCCESS,
        executionTime: 800,
        outputVars: {
          completed_tasks: '3',
          failed_tasks: '1',
          result: 'partial_success',
        },
      },
    };
  }

  /**
   * Creates agents for performance testing with various characteristics
   */
  static createPerformanceTestAgents(count: number): MockAgentConfig[] {
    const configs: MockAgentConfig[] = [];
    const standard = this.createStandardConfigurations();
    const configKeys = Object.keys(standard);

    for (let i = 0; i < count; i++) {
      const baseConfig = standard[configKeys[i % configKeys.length]];
      configs.push({
        ...baseConfig,
        name: `${baseConfig.name}-${i}`,
        executionTime: Math.random() * 1000 + 200, // 200-1200ms random execution time
        outputVars: {
          ...baseConfig.outputVars,
          agent_id: `${baseConfig.name}-${i}`,
          execution_order: i.toString(),
        },
      });
    }

    return configs;
  }

  /**
   * Resets all mock configurations and logs
   */
  static reset(): void {
    this.mockConfigs.clear();
    this.clearLogs();
    vi.restoreAllMocks();
  }

  /**
   * Validates that an agent executed as expected
   */
  static validateAgentExecution(
    agentName: string,
    expectedState: MockAgentState,
    expectedOutputKeys?: string[],
  ): boolean {
    const config = this.getMockConfig(agentName);
    const logs = this.getExecutionLogs(agentName);

    if (!config) {
      throw new Error(`No mock configuration found for agent: ${agentName}`);
    }

    if (config.state !== expectedState) {
      return false;
    }

    if (expectedOutputKeys) {
      const outputKeys = Object.keys(config.outputVars || {});
      for (const key of expectedOutputKeys) {
        if (!outputKeys.includes(key)) {
          return false;
        }
      }
    }

    // Validate that agent actually executed (has logs)
    return logs.length > 0;
  }
}
