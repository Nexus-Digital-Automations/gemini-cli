/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
export interface GeminiIgnoreFilter {
    isIgnored(filePath: string): boolean;
    getPatterns(): string[];
    initialize(): Promise<void>;
}
export declare class GeminiIgnoreParser implements GeminiIgnoreFilter {
    private projectRoot;
    private patterns;
    private ig;
    private initialized;
    private initPromise;
    constructor(projectRoot: string);
    initialize(): Promise<void>;
    private loadPatternsAsync;
    isIgnored(filePath: string): boolean;
    getPatterns(): string[];
}
