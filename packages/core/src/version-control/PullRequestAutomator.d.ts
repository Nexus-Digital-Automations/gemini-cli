/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { PRStatus } from './types.js';
import type { PullRequest, VCAutomationConfig, PRMetrics, ReviewerSuggestion, PRAnalysis } from './types.js';
/**
 * PullRequestAutomator - Intelligent pull request lifecycle management
 *
 * Core features:
 * - Automated PR creation with intelligent templates
 * - Smart reviewer assignment based on code changes
 * - Continuous status monitoring and updates
 * - Quality gate validation and enforcement
 * - Auto-merge capabilities with safety checks
 * - Integration with CI/CD pipelines
 * - Comprehensive PR analytics and reporting
 */
export declare class PullRequestAutomator {
    private config;
    private workingDir;
    private prTemplates;
    private automationRules;
    private activeWorkflows;
    private qualityGates;
    constructor(config: VCAutomationConfig, workingDir?: string);
    /**
     * Create a new pull request with intelligent automation
     */
    createPullRequest(options: {
        title?: string;
        description?: string;
        sourceBranch?: string;
        targetBranch?: string;
        template?: string;
        autoAssignReviewers?: boolean;
        enableAutoMerge?: boolean;
        labels?: string[];
        assignees?: string[];
    }): Promise<PullRequest>;
    /**
     * Monitor and update PR status with intelligent automation
     */
    monitorPullRequest(prId: string): Promise<PRStatus>;
    /**
     * Validate pull request against quality gates
     */
    validateQualityGates(pr: PullRequest): Promise<Map<string, boolean>>;
    /**
     * Attempt automated merge with comprehensive safety checks
     */
    attemptAutoMerge(pr: PullRequest): Promise<boolean>;
    /**
     * Generate intelligent PR analytics and metrics
     */
    generatePRMetrics(prs: PullRequest[]): Promise<{
        summary: PRMetrics;
        trends: any;
        insights: any;
        recommendations: string[];
    }>;
    /**
     * Suggest optimal reviewers based on code changes and history
     */
    suggestReviewers(analysis: PRAnalysis): Promise<ReviewerSuggestion[]>;
    /**
     * Analyze PR changes for intelligent automation decisions
     */
    private analyzePRChanges;
    /**
     * Generate intelligent PR title based on change analysis
     */
    private generatePRTitle;
    /**
     * Generate comprehensive PR description using templates
     */
    private generatePRDescription;
    /**
     * Initialize PR workflow monitoring
     */
    private initializePRWorkflow;
    /**
     * Platform-specific implementations
     */
    private executeGitPlatformCommand;
    private getPullRequest;
    private updatePRStatus;
    private calculatePRStatus;
    private handleStatusChange;
    private updateWorkflowStage;
    private executeAutomationRules;
    private evaluateRuleCondition;
    private executeRuleAction;
    private sendPRNotifications;
    private sendMergeFailureNotification;
    private getCurrentBranch;
    private getCurrentUser;
    private generatePRId;
    private getAutoMergeConfig;
    private initializePRMetrics;
    private updatePRMetrics;
    private validateGate;
    private performPreMergeValidation;
    private executeMerge;
    private buildMergeCommand;
    private performPostMergeActions;
    private checkForConflicts;
    private updateRelatedIssues;
    private triggerDeployment;
    private parseDiffOutput;
    private calculateLinesChanged;
    private calculateChangeComplexity;
    private detectChangeType;
    private assessRiskLevel;
    private identifyAffectedComponents;
    private analyzeTestCoverage;
    private detectBreakingChanges;
    private detectDatabaseChanges;
    private detectSecurityChanges;
    private estimateReviewTime;
    private getLastCommitMessage;
    private extractSubjectFromCommit;
    private selectBestTemplate;
    private generateBasicDescription;
    private generateLabels;
    private extractLinkedIssues;
    private categorizeSize;
    private categorizeComplexity;
    private calculateAverageTimeToMerge;
    private calculateAverageReviewTime;
    private calculateMergeThroughput;
    private calculateQualityScore;
    private calculateAutomationEfficiency;
    private analyzeTrends;
    private generateInsights;
    private generateRecommendations;
    private getCodeOwners;
    private suggestByExpertise;
    private suggestByHistory;
    private checkReviewerAvailability;
    private initializeDefaultTemplates;
    private initializeAutomationRules;
    private initializeQualityGates;
}
