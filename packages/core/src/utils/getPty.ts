/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Type definition for PTY module interface
interface PtyModule {
  spawn?: (
    shell?: string,
    args?: string[],
    options?: Record<string, unknown>,
  ) => PtyProcess;
  [key: string]: unknown;
}

export type PtyImplementation = {
  module: PtyModule;
  name: 'lydell-node-pty' | 'node-pty';
} | null;

// Import IDisposable interface for proper typing
interface IDisposable {
  dispose(): void;
}

export interface PtyProcess {
  readonly pid: number;
  readonly cols: number;
  readonly rows: number;
  readonly process: string;
  handleFlowControl: boolean;
  onData(callback: (data: string) => void): IDisposable;
  onExit(
    callback: (e: { exitCode: number; signal?: number }) => void,
  ): IDisposable;
  resize(columns: number, rows: number): void;
  clear(): void;
  write(data: string): void;
  kill(signal?: string): void;
  pause(): void;
  resume(): void;
}

export const getPty = async (): Promise<PtyImplementation> => {
  try {
    const lydell = '@lydell/node-pty';
    const module = await import(lydell);
    return { module, name: 'lydell-node-pty' };
  } catch (_e) {
    try {
      const nodePty = 'node-pty';
      const module = await import(nodePty);
      return { module, name: 'node-pty' };
    } catch (_e2) {
      return null;
    }
  }
};
