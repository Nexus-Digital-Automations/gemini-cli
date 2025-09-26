/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { CommitType } from './types.js';
import type { CommitMessage, CodeAnalysis, CommitGenerationOptions } from './types.js';
/**
 * Configuration for commit message generation
 */
export interface CommitMessageGeneratorConfig {
    /** Maximum description length */
    maxDescriptionLength: number;
    /** Include scope in messages */
    includeScope: boolean;
    /** Include issue references */
    includeIssueReferences: boolean;
    /** Custom commit type mappings */
    customCommitTypes: Record<string, string>;
    /** File patterns for scope detection */
    scopePatterns: Record<string, string>;
    /** Breaking change keywords */
    breakingChangeKeywords: string[];
    /** Maximum body length */
    maxBodyLength: number;
    /** Include co-authors */
    includeCoAuthors: boolean;
}
/**
 * Default configuration for commit message generator
 */
export declare const DEFAULT_COMMIT_MESSAGE_CONFIG: CommitMessageGeneratorConfig;
/**
 * Intelligent commit message generator
 */
export declare class CommitMessageGenerator {
    private config;
    constructor(config?: Partial<CommitMessageGeneratorConfig>);
    /**
     * Generate a commit message based on code analysis
     */
    generateCommitMessage(options?: CommitGenerationOptions): Promise<CommitMessage>;
    /**
     * Analyze code changes
     */
    analyzeChanges(options: CommitGenerationOptions): Promise<CodeAnalysis>;
    /**
     * Detect commit type based on analysis
     */
    detectCommitType(analysis: CodeAnalysis): CommitType;
    /**
     * Extract scope from analysis
     */
    extractScope(analysis: CodeAnalysis): string;
    /**
     * Generate commit description
     */
    generateDescription(type: CommitType, analysis: CodeAnalysis): string;
    /**
     * Generate commit body
     */
    generateBody(analysis: CodeAnalysis): string | null;
    /**
     * Detect breaking changes
     */
    detectBreakingChange(analysis: CodeAnalysis): boolean;
    /**
     * Extract issue references from commit messages or branch names
     */
    extractIssueReferences(analysis: CodeAnalysis): Array<{
        type: string;
        id: string;
        url: string;
    }>;
    /**
     * Generate footer with breaking changes and references
     */
    generateFooter(isBreakingChange: boolean, references: string[]): string | null;
    /**
     * Extract co-authors from git log
     */
    extractCoAuthors(): string[] | undefined;
    private getModifiedFiles;
    private getChangeStats;
    private analyzeFunctionChanges;
    private analyzeClassChanges;
    private analyzeImportChanges;
    private identifyTestFiles;
    private identifyDocumentationChanges;
    private identifyConfigurationChanges;
    private isOnlyTests;
    private isOnlyDocs;
    private isOnlyConfig;
    private hasPerformanceChanges;
    private isRefactoring;
    private isBugFix;
    private isStyleChange;
    private isCIChange;
    private isBuildChange;
    private generateFeatureDescription;
    private generateFixDescription;
    private generateDocsDescription;
    private generateRefactorDescription;
    private generateTestDescription;
    private generateChoreDescription;
    private generatePerfDescription;
    private generateGenericDescription;
    private getMostFrequent;
    /**
     * Get current Git user name
     */
    private getCurrentUser;
    /**
     * Get current Git user email
     */
    private getCurrentUserEmail;
    /**
     * Format commit message for git commit
     */
    formatCommitMessage(commitMessage: CommitMessage): string;
}
