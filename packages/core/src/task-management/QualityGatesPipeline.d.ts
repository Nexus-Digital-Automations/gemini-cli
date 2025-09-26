/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Configurable Quality Gates Pipeline
 *
 * Enterprise-grade quality gates pipeline with multiple checkpoint types,
 * parallel execution, conditional gates, and comprehensive validation rules.
 */
import type { Config } from '../config/config.js';
import type { Task, TaskResult } from './types.js';
import type { ValidationEngine, ValidationRule } from './ValidationEngine.js';
/**
 * Pipeline execution mode
 */
export type PipelineExecutionMode = 'sequential' | 'parallel' | 'conditional';
/**
 * Pipeline configuration
 */
export interface PipelineConfig {
    /** Pipeline name */
    name: string;
    /** Execution mode */
    mode: PipelineExecutionMode;
    /** Whether to continue on gate failures */
    continueOnFailure: boolean;
    /** Maximum parallel execution count */
    maxParallelGates: number;
    /** Overall pipeline timeout */
    timeoutMs: number;
    /** Gate execution order (for sequential mode) */
    gateOrder: string[];
    /** Conditional gate rules */
    conditionalRules: Array<{
        condition: (task: Task, result: TaskResult) => boolean;
        gates: string[];
    }>;
}
/**
 * Quality gates pipeline implementation
 */
export declare class QualityGatesPipeline {
    private readonly config;
    private readonly validationEngine;
    private readonly pipelineConfig;
    private readonly builtInRules;
    constructor(config: Config, validationEngine: ValidationEngine, pipelineConfig: PipelineConfig);
    /**
     * Initializes built-in validation rules for all quality gate types
     */
    private initializeBuiltInValidationRules;
    /**
     * Code Quality validation rules
     */
    private addCodeQualityRules;
    /**
     * Functional Testing validation rules
     */
    private addFunctionalTestingRules;
    /**
     * Performance validation rules
     */
    private addPerformanceRules;
    /**
     * Security validation rules
     */
    private addSecurityRules;
    /**
     * Integration validation rules
     */
    private addIntegrationRules;
    /**
     * Business rules validation
     */
    private addBusinessRules;
    /**
     * Compliance validation rules
     */
    private addComplianceRules;
    /**
     * Documentation validation rules
     */
    private addDocumentationRules;
    /**
     * Helper method to run shell commands
     */
    private runCommand;
    /**
     * Helper method to get source files
     */
    private getSourceFiles;
    /**
     * Simple complexity calculation
     */
    private calculateSimpleComplexity;
    /**
     * Get build output size
     */
    private getBuildSize;
    /**
     * Calculate directory size recursively
     */
    private getDirectorySize;
    /**
     * Evaluates a completion criterion
     */
    private evaluateCompletionCriterion;
    /**
     * Gets all built-in validation rules
     */
    getBuiltInRules(): ValidationRule[];
    /**
     * Gets validation rules by checkpoint type
     */
    getRulesByType(checkpointType: string): ValidationRule[];
}
