/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

export declare function createToolCallErrorMessage(
  expectedTools: string | string[],
  foundTools: string[],
  result: string,
): string;
export declare function printDebugInfo(
  rig: TestRig,
  result: string,
  context?: Record<string, unknown>,
): {
  toolRequest: {
    name: string;
    args: string;
    success: boolean;
    duration_ms: number;
  };
}[];
export declare function validateModelOutput(
  result: string,
  expectedContent?: string | (string | RegExp)[] | null,
  testName?: string,
): boolean;
export declare class TestRig {
  bundlePath: string;
  testDir: string | null;
  testName?: string;
  _lastRunStdout?: string;
  constructor();
  getDefaultTimeout(): 30000 | 60000 | 15000;
  setup(
    testName: string,
    options?: {
      settings?: Record<string, unknown>;
    },
  ): void;
  createFile(fileName: string, content: string): string;
  mkdir(dir: string): void;
  sync(): void;
  run(
    promptOrOptions:
      | string
      | {
          prompt?: string;
          stdin?: string;
          stdinDoesNotEnd?: boolean;
        },
    ...args: string[]
  ): Promise<string>;
  readFile(fileName: string): string;
  cleanup(): Promise<void>;
  waitForTelemetryReady(): Promise<void>;
  waitForTelemetryEvent(eventName: string, timeout?: number): Promise<boolean>;
  waitForToolCall(toolName: string, timeout?: number): Promise<boolean>;
  waitForAnyToolCall(toolNames: string[], timeout?: number): Promise<boolean>;
  poll(
    predicate: () => boolean,
    timeout: number,
    interval: number,
  ): Promise<boolean>;
  _parseToolLogsFromStdout(stdout: string): {
    timestamp: number;
    toolRequest: {
      name: string;
      args: string;
      success: boolean;
      duration_ms: number;
    };
  }[];
  readToolLogs(): {
    toolRequest: {
      name: string;
      args: string;
      success: boolean;
      duration_ms: number;
    };
  }[];
  readLastApiRequest(): Record<string, unknown> | null;
}
