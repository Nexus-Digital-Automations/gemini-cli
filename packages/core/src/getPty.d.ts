/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
interface PtyModule {
    spawn?: (shell?: string, args?: string[], options?: Record<string, unknown>) => PtyProcess;
    [key: string]: unknown;
}
export type PtyImplementation = {
    module: PtyModule;
    name: 'lydell-node-pty' | 'node-pty';
} | null;
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
    onExit(callback: (e: {
        exitCode: number;
        signal?: number;
    }) => void): IDisposable;
    resize(columns: number, rows: number): void;
    clear(): void;
    write(data: string): void;
    kill(signal?: string): void;
    pause(): void;
    resume(): void;
}
export declare const getPty: () => Promise<PtyImplementation>;
export {};
