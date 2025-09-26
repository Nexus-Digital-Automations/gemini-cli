/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { OperationContext } from './types.js';
export interface ToolCallInfo {
    name: string;
    args: Record<string, unknown>;
    description?: string;
}
/**
 * Detects the operation type and creates context based on tool call information
 */
export declare class OperationDetector {
    /**
     * Analyze a tool call and determine its operation type and context
     */
    static detectOperation(toolCall: ToolCallInfo): OperationContext;
    /**
     * Detect the operation type based on tool name and parameters
     */
    private static detectOperationType;
    /**
     * Generate a human-readable description of the operation
     */
    private static generateDescription;
    /**
     * Extract target files from tool call arguments
     */
    private static extractTargetFiles;
    /**
     * Estimate operation duration based on tool type and parameters
     */
    private static estimateDuration;
    /**
     * Extract additional metadata from tool call
     */
    private static extractMetadata;
    private static isFileOperation;
    private static isNetworkOperation;
    private static isCodeAnalysisOperation;
    private static isBuildOperation;
    private static isTestOperation;
    private static isGitOperation;
    private static isPackageOperation;
    private static isSearchOperation;
    private static isFileCommand;
    private static isNetworkCommand;
    private static isCodeAnalysisCommand;
    private static isBuildCommand;
    private static isTestCommand;
    private static isGitCommand;
    private static isPackageCommand;
    private static isSearchCommand;
    private static isCodePattern;
    private static getFileName;
    private static getDomain;
}
