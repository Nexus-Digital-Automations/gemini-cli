/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { BranchType } from './types.js';
import type { BranchInfo, BranchCreationOptions, BranchProtectionRule, RepositoryStatus } from './types.js';
/**
 * Branch health report
 */
export interface BranchHealthReport {
    /** Total branches */
    totalBranches: number;
    /** Stale branches (no activity for X days) */
    staleBranches: BranchInfo[];
    /** Unprotected critical branches */
    unprotectedBranches: BranchInfo[];
    /** Branches ahead of main */
    branchesAhead: BranchInfo[];
    /** Branches behind main */
    branchesBehind: BranchInfo[];
    /** Merged branches ready for cleanup */
    mergedBranches: BranchInfo[];
    /** Protection rule violations */
    protectionViolations: ProtectionViolation[];
}
/**
 * Protection rule violation
 */
export interface ProtectionViolation {
    /** Branch name */
    branch: string;
    /** Rule that was violated */
    rule: BranchProtectionRule;
    /** Violation description */
    description: string;
    /** Severity level */
    severity: 'high' | 'medium' | 'low';
}
/**
 * Branch Manager configuration
 */
export interface BranchManagerConfig {
    /** Default base branch */
    defaultBaseBranch: string;
    /** Branch naming conventions */
    namingConventions: Record<BranchType, string>;
    /** Auto-delete merged branches */
    autoDeleteMerged: boolean;
    /** Stale branch threshold in days */
    staleBranchThreshold: number;
    /** Branch protection rules */
    protectionRules: BranchProtectionRule[];
    /** Remote name */
    remoteName: string;
    /** Enable automatic protection rule application */
    enableAutoProtection: boolean;
}
/**
 * Default branch manager configuration
 */
export declare const DEFAULT_BRANCH_MANAGER_CONFIG: BranchManagerConfig;
/**
 * Automated branch management system
 */
export declare class BranchManager {
    private config;
    constructor(config?: Partial<BranchManagerConfig>);
    /**
     * Create a new branch with intelligent naming and setup
     */
    createBranch(options: BranchCreationOptions): Promise<BranchInfo>;
    /**
     * Generate branch name following conventions
     */
    generateBranchName(options: BranchCreationOptions): string;
    /**
     * Apply protection rules to a branch
     */
    applyProtectionRules(branchName: string): Promise<void>;
    /**
     * Clean up merged branches
     */
    cleanupMergedBranches(): Promise<string[]>;
    /**
     * Analyze branch health
     */
    analyzeBranchHealth(): Promise<BranchHealthReport>;
    /**
     * Get current repository status
     */
    getRepositoryStatus(): Promise<RepositoryStatus>;
    /**
     * Switch to a branch, creating it if necessary
     */
    switchToBranch(branchName: string, createIfNotExists?: boolean): Promise<void>;
    private ensureBaseBranchReady;
    private generateBranchDescription;
    private getNextVersion;
    private sanitizeBranchName;
    private ensureUniqueBranchName;
    private branchExists;
    private shouldProtectBranch;
    private getApplicableProtectionRules;
    private applyProtectionRule;
    private getBranchInfo;
    private inferBranchType;
    private isBranchProtected;
    private getAllBranches;
    private getStaleBranches;
    private getMergedBranches;
    private shouldDeleteBranch;
    private deleteBranch;
    private getUnprotectedCriticalBranches;
    private getProtectionViolations;
    /**
     * Update branch manager configuration
     */
    updateConfig(newConfig: Partial<BranchManagerConfig>): void;
    /**
     * Get current configuration
     */
    getConfig(): BranchManagerConfig;
}
