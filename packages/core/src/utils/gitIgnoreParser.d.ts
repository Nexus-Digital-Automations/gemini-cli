/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

export interface GitIgnoreFilter {
    isIgnored(filePath: string): boolean;
    isIgnoredAsync(filePath: string): Promise<boolean>;
    initialize(): Promise<void>;
}
export declare class GitIgnoreParser implements GitIgnoreFilter {
    private projectRoot;
    private cache;
    private globalPatterns;
    private initialized;
    private initPromise;
    private fileCache;
    constructor(projectRoot: string);
    initialize(): Promise<void>;
    private initializeAsync;
    private loadPatternsForFileAsync;
    private loadPatternsForFile;
    isIgnored(filePath: string): boolean;
    isIgnoredAsync(filePath: string): Promise<boolean>;
}
