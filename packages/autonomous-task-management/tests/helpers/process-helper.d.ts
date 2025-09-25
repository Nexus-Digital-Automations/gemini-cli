/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
export declare const mockProcess: {
    setup(): void;
    cleanup(): void;
    setEnv(key: string, value: string): void;
    setCwd(path: string): void;
    mockKill(mockFn: (pid: number, signal?: string | number) => boolean): void;
};
