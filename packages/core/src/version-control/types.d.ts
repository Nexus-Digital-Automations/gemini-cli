/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Version Control Automation System - Core Types
 * Comprehensive type definitions for intelligent version control automation
 *
 * @author Claude Code - Version Control Automation Agent
 * @version 1.0.0
 */
/**
 * Supported version control systems
 */
export declare enum VCSType {
    GIT = "git",
    SVN = "svn",
    MERCURIAL = "mercurial",
    PERFORCE = "perforce"
}
/**
 * Commit message types following conventional commits
 */
export declare enum CommitType {
    FEAT = "feat",
    FIX = "fix",
    DOCS = "docs",
    STYLE = "style",
    REFACTOR = "refactor",
    TEST = "test",
    CHORE = "chore",
    PERF = "perf",
    CI = "ci",
    BUILD = "build",
    REVERT = "revert",
    MERGE = "merge"
}
/**
 * Branch types for automated branch management
 */
export declare enum BranchType {
    MAIN = "main",
    DEVELOP = "develop",
    FEATURE = "feature",
    HOTFIX = "hotfix",
    RELEASE = "release",
    BUGFIX = "bugfix",
    EXPERIMENTAL = "experimental"
}
/**
 * Merge conflict resolution strategies
 */
export declare enum ConflictResolutionStrategy {
    OURS = "ours",
    THEIRS = "theirs",
    MANUAL = "manual",
    INTELLIGENT = "intelligent",
    CUSTOM = "custom",
    AUTO_ONLY = "auto_only",
    AUTO_WITH_FALLBACK = "auto_with_fallback",
    INTERACTIVE = "interactive",
    MANUAL_REVIEW = "manual_review"
}
/**
 * Release types for semantic versioning
 */
export declare enum ReleaseType {
    MAJOR = "major",
    MINOR = "minor",
    PATCH = "patch",
    PRERELEASE = "prerelease"
}
/**
 * Commit message structure
 */
export interface CommitMessage {
    /** Commit hash */
    hash: string;
    /** Type of commit */
    type: string;
    /** Optional scope */
    scope?: string;
    /** Commit subject/title */
    subject: string;
    /** Commit body */
    body?: string;
    /** Commit author */
    author: string;
    /** Author email */
    email: string;
    /** Commit date */
    date: Date;
    /** Breaking change info */
    breakingChange?: {
        description: string;
        scope?: string;
        migration?: string;
    };
    /** Commit footers */
    footers: Record<string, string>;
    /** Issue/PR references */
    references: Array<{
        type: string;
        id: string;
        url: string;
    }>;
}
/**
 * Code analysis result for commit generation
 */
export interface CodeAnalysis {
    /** Files modified */
    modifiedFiles: string[];
    /** Lines added */
    linesAdded: number;
    /** Lines removed */
    linesRemoved: number;
    /** Functions modified */
    functionsModified: string[];
    /** Classes modified */
    classesModified: string[];
    /** Import changes */
    importChanges: ImportChange[];
    /** Test files affected */
    testFilesAffected: string[];
    /** Documentation changes */
    docChanges: string[];
    /** Configuration changes */
    configChanges: string[];
}
/**
 * Import change detection
 */
export interface ImportChange {
    /** File with import change */
    file: string;
    /** Type of change */
    changeType: 'added' | 'removed' | 'modified';
    /** Import statement */
    importStatement: string;
    /** Package/module name */
    packageName: string;
}
/**
 * Branch information
 */
export interface BranchInfo {
    /** Branch name */
    name: string;
    /** Branch type */
    type: BranchType;
    /** Base branch */
    baseBranch: string;
    /** Creation date */
    createdAt: Date;
    /** Last commit */
    lastCommit: string;
    /** Commits ahead of base */
    commitsAhead: number;
    /** Commits behind base */
    commitsBehind: number;
    /** Is protected */
    isProtected: boolean;
    /** Associated issue/ticket */
    associatedIssue?: string;
}
/**
 * Merge conflict information
 */
export interface MergeConflict {
    /** Conflict ID */
    id?: string;
    /** File with conflict */
    file: string;
    /** Conflict start line */
    startLine: number;
    /** Conflict end line */
    endLine: number;
    /** Our version */
    ourVersion: string;
    /** Their version */
    theirVersion: string;
    /** Our content */
    oursContent?: string | string[];
    /** Their content */
    theirsContent?: string | string[];
    /** Conflict type */
    type?: ConflictType;
    /** Conflict severity */
    severity?: 'low' | 'medium' | 'high';
    /** Module name */
    module?: string;
    /** Separator line index */
    separatorLine?: number;
    /** Conflict context */
    context: ConflictContext;
    /** Suggested resolution */
    suggestedResolution?: ConflictResolution;
    /** Our branch name */
    oursBranch?: string;
    /** Their branch name */
    theirsBranch?: string;
}
/**
 * Conflict context for intelligent resolution
 */
export interface ConflictContext {
    /** Function/method name if applicable */
    functionName?: string;
    /** Class name if applicable */
    className?: string;
    /** File type */
    fileType: string;
    /** Surrounding lines */
    contextLines: string[];
    /** Conflict category */
    category: ConflictCategory;
}
/**
 * Conflict categories
 */
export declare enum ConflictCategory {
    CODE_LOGIC = "code_logic",
    IMPORT_STATEMENTS = "import_statements",
    CONFIGURATION = "configuration",
    DOCUMENTATION = "documentation",
    WHITESPACE = "whitespace",
    FORMATTING = "formatting"
}
/**
 * Conflict resolution suggestion
 */
export interface ConflictResolution {
    /** Resolution strategy */
    strategy: ConflictResolutionStrategy;
    /** Resolved content */
    resolvedContent: string;
    /** Confidence score */
    confidence: number;
    /** Explanation */
    explanation: string;
    /** Alternative resolutions */
    alternatives?: ConflictResolution[];
}
/**
 * Pull request information
 */
export interface PullRequest {
    /** PR ID */
    id: string;
    /** PR number */
    number: number;
    /** PR title */
    title: string;
    /** PR description */
    description: string;
    /** Source branch */
    sourceBranch: string;
    /** Target branch */
    targetBranch: string;
    /** PR status */
    status: PRStatus;
    /** PR author */
    author: string;
    /** Reviewers with status */
    reviewers: Array<{
        username: string;
        status: ReviewStatus;
    }>;
    /** Assignees */
    assignees: string[];
    /** Labels */
    labels: string[];
    /** Created date */
    createdAt: Date;
    /** Updated date */
    updatedAt: Date;
    /** Merged date */
    mergedAt?: Date;
    /** Merge commit SHA */
    mergeCommit?: string;
    /** PR checks */
    checks: Array<{
        name: string;
        status: CheckStatus;
        description?: string;
        url?: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    /** PR comments */
    comments: any[];
    /** PR metrics */
    metrics: PRMetrics;
    /** PR analysis */
    analysis: PRAnalysis;
    /** Auto-merge configuration */
    autoMergeConfig?: AutoMergeConfig;
    /** Associated issues */
    linkedIssues: string[];
}
/**
 * Changelog entry
 */
export interface ChangelogEntry {
    /** Entry ID */
    id: string;
    /** Commit type */
    type: string;
    /** Scope */
    scope?: string;
    /** Subject */
    subject: string;
    /** Description */
    description?: string;
    /** Breaking change */
    breakingChange?: {
        description: string;
        scope?: string;
        migration?: string;
    };
    /** Author */
    author: string;
    /** Date */
    date: Date;
    /** Related commits */
    commits: CommitMessage[];
    /** Files changed */
    files: string[];
    /** Lines added */
    linesAdded: number;
    /** Lines deleted */
    linesDeleted: number;
    /** Impact level */
    impact: 'low' | 'medium' | 'high';
    /** Significance */
    significance: string;
    /** References */
    references: Array<{
        type: string;
        id: string;
        url: string;
    }>;
    /** Reviewers */
    reviewers: string[];
    /** Tags */
    tags: string[];
    /** Metadata */
    metadata: {
        complexity?: number;
        riskLevel?: string;
        testCoverage?: number;
        affectedModules?: string[];
    };
}
/**
 * Individual change item
 */
export interface ChangeItem {
    /** Description */
    description: string;
    /** Scope */
    scope?: string;
    /** Commit hash */
    commit: string;
    /** Author */
    author: string;
    /** Issue references */
    issues: string[];
}
/**
 * Breaking change information
 */
export interface BreakingChange {
    /** Description */
    description: string;
    /** Scope */
    scope?: string;
    /** Migration instructions */
    migration?: string;
    /** Migration guide */
    migrationGuide?: string;
    /** Affected APIs */
    affectedAPIs: string[];
    /** Commit hash */
    commit: string;
}
/**
 * Branch protection rules
 */
export interface BranchProtectionRule {
    /** Branch pattern */
    branchPattern: string;
    /** Require PR reviews */
    requirePullRequestReviews: boolean;
    /** Required reviewers count */
    requiredReviewerCount: number;
    /** Dismiss stale reviews */
    dismissStaleReviews: boolean;
    /** Require status checks */
    requireStatusChecks: boolean;
    /** Required status checks */
    requiredStatusChecks: string[];
    /** Enforce admins */
    enforceForAdmins: boolean;
    /** Allow force pushes */
    allowForcePushes: boolean;
}
/**
 * Version Control Automation configuration
 */
export interface VCAutomationConfig {
    /** VCS type */
    vcsType: VCSType;
    /** Repository path */
    repositoryPath: string;
    /** Default branch */
    defaultBranch: string;
    /** Commit message configuration */
    commitMessage: {
        /** Enable intelligent generation */
        enableIntelligentGeneration: boolean;
        /** Include scope in messages */
        includeScope: boolean;
        /** Maximum description length */
        maxDescriptionLength: number;
        /** Custom commit types */
        customCommitTypes?: Record<string, string>;
    };
    /** Branch management configuration */
    branchManagement: {
        /** Enable automated branch creation */
        enableAutomatedCreation: boolean;
        /** Branch naming convention */
        namingConvention: string;
        /** Auto-delete merged branches */
        autoDeleteMerged: boolean;
        /** Branch protection rules */
        protectionRules: BranchProtectionRule[];
    };
    /** Merge conflict resolution */
    conflictResolution: {
        /** Default strategy */
        defaultStrategy: ConflictResolutionStrategy;
        /** Enable intelligent resolution */
        enableIntelligentResolution: boolean;
        /** Confidence threshold for auto-resolution */
        confidenceThreshold: number;
        /** Auto-resolve threshold */
        autoResolveThreshold: number;
    };
    /** Pull request automation */
    pullRequestAutomation: {
        /** Enable automated PR creation */
        enableAutomatedCreation: boolean;
        /** Default reviewers */
        defaultReviewers: string[];
        /** Auto-assign labels */
        autoAssignLabels: boolean;
        /** Enable auto-merge */
        enableAutoMerge: boolean;
        /** Required reviewers */
        requiredReviewers: number;
        /** Maximum reviewers */
        maxReviewers: number;
        /** Exempt users */
        exemptUsers: string[];
        /** Default target branch */
        defaultTargetBranch: string;
    };
    /** Changelog generation */
    changelogGeneration: {
        /** Enable automated generation */
        enableAutomatedGeneration: boolean;
        /** Output file path */
        outputPath: string;
        /** Include all commit types */
        includeAllTypes: boolean;
        /** Group by type */
        groupByType: boolean;
        /** Default format */
        defaultFormat: ChangelogFormat;
        /** Default template */
        defaultTemplate: string;
        /** Include commit hashes */
        includeCommitHashes: boolean;
        /** Include authors */
        includeAuthors: boolean;
        /** Include descriptions */
        includeDescriptions: boolean;
        /** Include statistics */
        includeStatistics: boolean;
        /** Include merge commits */
        includeMergeCommits: boolean;
        /** Include internal commits */
        includeInternalCommits: boolean;
        /** Auto-resolve threshold */
        autoResolveThreshold: number;
    };
}
/**
 * Git repository status
 */
export interface RepositoryStatus {
    /** Current branch */
    currentBranch: string;
    /** Is clean (no uncommitted changes) */
    isClean: boolean;
    /** Staged files */
    stagedFiles: string[];
    /** Modified files */
    modifiedFiles: string[];
    /** Untracked files */
    untrackedFiles: string[];
    /** Commits ahead of remote */
    commitsAhead: number;
    /** Commits behind remote */
    commitsBehind: number;
    /** Remote URL */
    remoteUrl?: string;
}
/**
 * Commit generation options
 */
export interface CommitGenerationOptions {
    /** Include file analysis */
    includeFileAnalysis: boolean;
    /** Include test analysis */
    includeTestAnalysis: boolean;
    /** Include performance impact */
    includePerformanceImpact: boolean;
    /** Custom context */
    customContext?: Record<string, unknown>;
    /** Override type detection */
    overrideType?: CommitType;
    /** Additional reviewers */
    additionalReviewers?: string[];
}
/**
 * Branch creation options
 */
export interface BranchCreationOptions {
    /** Branch type */
    type: BranchType;
    /** Base branch */
    baseBranch?: string;
    /** Associated issue */
    associatedIssue?: string;
    /** Push to remote */
    pushToRemote: boolean;
    /** Set as upstream */
    setUpstream: boolean;
    /** Custom naming */
    customName?: string;
}
/**
 * Release preparation result
 */
export interface ReleasePreparation {
    /** Release version */
    version: string;
    /** Release type */
    type: ReleaseType;
    /** Release notes */
    notes: string;
    /** Changelog entries */
    changelogEntries: ChangelogEntry[];
    /** Files to update */
    filesToUpdate: string[];
    /** Pre-release checks */
    preReleaseChecks: PreReleaseCheck[];
}
/**
 * Pre-release check
 */
export interface PreReleaseCheck {
    /** Check name */
    name: string;
    /** Check status */
    status: 'passed' | 'failed' | 'warning';
    /** Check message */
    message: string;
    /** Suggested action */
    suggestedAction?: string;
}
/**
 * Changelog format options
 */
export declare enum ChangelogFormat {
    MARKDOWN = "markdown",
    JSON = "json",
    HTML = "html",
    XML = "xml"
}
/**
 * Release notes structure
 */
export interface ReleaseNotes {
    /** Release version */
    version: string;
    /** Previous version */
    previousVersion?: string | null;
    /** Release date */
    releaseDate: Date;
    /** Release summary */
    summary: string;
    /** Release sections */
    sections: Record<string, ReleaseSection[]>;
    /** Breaking changes */
    breakingChanges: BreakingChange[];
    /** Contributors */
    contributors: ContributorInfo[];
    /** Migration guide */
    migrationGuide?: MigrationGuide | null;
    /** Release impact */
    impact: ReleaseImpact;
    /** Release metadata */
    metadata: ReleaseMetadata;
    /** Release type */
    releaseType: ReleaseType;
    /** Release tags */
    tags: string[];
    /** Recommendations */
    recommendations: string[];
}
/**
 * Release section
 */
export interface ReleaseSection {
    /** Section title */
    title: string;
    /** Section description */
    description: string;
    /** Section type */
    type: 'feature' | 'fix' | 'improvement' | 'breaking' | 'deprecated';
    /** Impact level */
    impact: 'low' | 'medium' | 'high';
    /** Author */
    author: string;
    /** References */
    references: Array<{
        type: string;
        id: string;
        url: string;
    }>;
}
/**
 * Contributor information
 */
export interface ContributorInfo {
    /** Username */
    username: string;
    /** Email */
    email: string;
    /** Full name */
    name: string;
    /** Profile URL */
    profileUrl: string;
    /** Number of contributions */
    contributions: number;
    /** First contribution date */
    firstContribution: Date;
    /** Contributor role */
    role: 'maintainer' | 'contributor' | 'new';
}
/**
 * Migration guide
 */
export interface MigrationGuide {
    /** Overview */
    overview: string;
    /** Migration steps */
    steps: MigrationStep[];
    /** Estimated time */
    estimatedTime: number;
    /** Automation available */
    automationAvailable: boolean;
    /** Rollback instructions */
    rollbackInstructions: string;
}
/**
 * Migration step
 */
export interface MigrationStep {
    /** Step title */
    title: string;
    /** Step description */
    description: string;
    /** Step order */
    order: number;
    /** Code example */
    codeExample?: {
        language: string;
        before: string;
        after: string;
    };
}
/**
 * Release impact assessment
 */
export interface ReleaseImpact {
    /** Impact level */
    level: 'low' | 'medium' | 'high';
    /** Affected users estimate */
    affectedUsers: number;
    /** Migration effort */
    migrationEffort: 'none' | 'low' | 'medium' | 'high';
    /** Risk assessment */
    riskAssessment: 'low' | 'medium' | 'high';
    /** Rollback complexity */
    rollbackComplexity: 'simple' | 'moderate' | 'complex';
    /** Compatibility */
    compatibility: {
        backward: boolean;
        forward: boolean;
        apiVersion: string;
    };
}
/**
 * Release metadata
 */
export interface ReleaseMetadata {
    /** Total changes */
    totalChanges: number;
    /** Commit count */
    commitCount: number;
    /** Contributor count */
    contributorCount: number;
    /** Files changed */
    filesChanged: number;
    /** Lines changed */
    linesChanged: number;
}
/**
 * Changelog template
 */
export interface ChangelogTemplate {
    /** Template name */
    name: string;
    /** Template description */
    description: string;
    /** Header template */
    header: string;
    /** Section templates */
    sections: Record<string, string>;
    /** Footer template */
    footer: string;
}
/**
 * Changelog configuration
 */
export interface ChangelogConfig {
    /** Default format */
    defaultFormat: ChangelogFormat;
    /** Default template */
    defaultTemplate: string;
    /** Include commit hashes */
    includeCommitHashes: boolean;
    /** Include authors */
    includeAuthors: boolean;
    /** Include descriptions */
    includeDescriptions: boolean;
    /** Include statistics */
    includeStatistics: boolean;
    /** Include merge commits */
    includeMergeCommits: boolean;
    /** Include internal commits */
    includeInternalCommits: boolean;
}
/**
 * Release metrics
 */
export interface ReleaseMetrics {
    /** Total commits */
    totalCommits: number;
    /** Total changes */
    totalChanges: number;
    /** Contributor count */
    contributorCount: number;
    /** Files changed */
    filesChanged: number;
    /** Lines added */
    linesAdded: number;
    /** Lines deleted */
    linesDeleted: number;
    /** Breaking changes */
    breakingChanges: number;
    /** Features */
    features: number;
    /** Bug fixes */
    bugFixes: number;
    /** Performance improvements */
    performance: number;
    /** Documentation updates */
    documentation: number;
    /** Chores */
    chores: number;
    /** Average change size */
    averageChangeSize: number;
    /** Complexity score */
    complexityScore: number;
    /** Risk score */
    riskScore: number;
    /** Quality score */
    qualityScore: number;
    /** Development velocity */
    developmentVelocity: number;
}
/**
 * Changelog analytics
 */
export interface ChangelogAnalytics {
    /** Trends */
    trends: {
        commitFrequency: any;
        changeTypes: any;
        contributorActivity: any;
        complexity: any;
        quality: any;
    };
    /** Insights */
    insights: {
        mostActiveContributors: ContributorInfo[];
        hottestComponents: string[];
        qualityImprovements: string[];
        technicalDebt: any;
        riskFactors: string[];
    };
    /** Comparisons */
    comparisons: {
        previousRelease: any;
        averageRelease: any;
        benchmarks: any;
    };
    /** Predictions */
    predictions: {
        nextReleaseSize: string;
        qualityTrend: string;
        riskForecast: string;
    };
}
/**
 * Semantic version
 */
export interface SemanticVersion {
    /** Major version */
    major: number;
    /** Minor version */
    minor: number;
    /** Patch version */
    patch: number;
    /** Pre-release identifier */
    prerelease?: string;
    /** Build metadata */
    build?: string;
}
/**
 * Pull request status enum
 */
export declare enum PRStatus {
    DRAFT = "draft",
    OPEN = "open",
    REVIEW_REQUIRED = "review_required",
    CHANGES_REQUESTED = "changes_requested",
    APPROVED = "approved",
    CHECKS_FAILED = "checks_failed",
    MERGED = "merged",
    CLOSED = "closed",
    CONFLICTED = "conflicted"
}
/**
 * Review status enum
 */
export declare enum ReviewStatus {
    PENDING = "pending",
    APPROVED = "approved",
    CHANGES_REQUESTED = "changes_requested",
    DISMISSED = "dismissed"
}
/**
 * Check status enum
 */
export declare enum CheckStatus {
    PENDING = "pending",
    RUNNING = "running",
    SUCCESS = "success",
    FAILURE = "failure",
    CANCELLED = "cancelled"
}
/**
 * Merge strategy enum
 */
export declare enum MergeStrategy {
    MERGE_COMMIT = "merge",
    SQUASH = "squash",
    REBASE = "rebase"
}
/**
 * PR template
 */
export interface PRTemplate {
    /** Template name */
    name: string;
    /** Template description */
    description: string;
    /** Template content */
    content: string;
}
/**
 * PR metrics
 */
export interface PRMetrics {
    /** Total PRs */
    totalPRs: number;
    /** Open PRs */
    openPRs: number;
    /** Merged PRs */
    mergedPRs: number;
    /** Closed PRs */
    closedPRs: number;
    /** Average time to merge */
    averageTimeToMerge: number;
    /** Average review time */
    averageReviewTime: number;
    /** Merge throughput */
    mergeThroughput: number;
    /** Quality score */
    qualityScore: number;
    /** Automation efficiency */
    automationEfficiency: number;
}
/**
 * Auto-merge configuration
 */
export interface AutoMergeConfig {
    /** Enabled */
    enabled: boolean;
    /** Merge strategy */
    strategy: MergeStrategy;
    /** Delete source branch */
    deleteSourceBranch: boolean;
    /** Require all checks pass */
    requireAllChecksPass: boolean;
    /** Require review approval */
    requireReviewApproval: boolean;
    /** Minimum reviewers */
    minimumReviewers: number;
    /** Allowed merge hours */
    allowedMergeHours: {
        start: number;
        end: number;
    };
    /** Allowed merge days */
    allowedMergeDays: string[];
    /** Exempt users */
    exemptUsers: string[];
    /** Safety delay */
    safetyDelay: number;
}
/**
 * PR validation result
 */
export interface PRValidationResult {
    /** Is valid */
    isValid: boolean;
    /** Validation reasons */
    reasons: string[];
}
/**
 * Reviewer suggestion
 */
export interface ReviewerSuggestion {
    /** Username */
    username: string;
    /** Suggestion reason */
    reason: string;
    /** Confidence score */
    confidence: number;
    /** Expertise areas */
    expertise: string[];
    /** Availability */
    availability: boolean;
}
/**
 * PR analysis
 */
export interface PRAnalysis {
    /** Files changed */
    filesChanged: string[];
    /** Lines added */
    linesAdded: number;
    /** Lines deleted */
    linesDeleted: number;
    /** Lines modified */
    linesModified: number;
    /** Change type */
    changeType: string;
    /** Complexity score */
    complexity: number;
    /** Risk level */
    riskLevel: 'low' | 'medium' | 'high';
    /** Affected components */
    affectedComponents: string[];
    /** Test coverage */
    testCoverage?: {
        percentage: number;
        newTests: number;
    } | null;
    /** Has breaking changes */
    hasBreakingChanges: boolean;
    /** Has database changes */
    hasDatabaseChanges: boolean;
    /** Has security changes */
    hasSecurityChanges: boolean;
    /** Estimated review time */
    estimatedReviewTime: number;
}
/**
 * PR automation rule
 */
export interface PRAutomationRule {
    /** Rule ID */
    id: string;
    /** Rule name */
    name: string;
    /** Rule description */
    description: string;
    /** Trigger event */
    trigger: PRStatus;
    /** Rule conditions */
    conditions: string[];
    /** Rule actions */
    actions: string[];
    /** Enabled */
    enabled: boolean;
}
/**
 * PR workflow
 */
export interface PRWorkflow {
    /** PR ID */
    prId: string;
    /** Current stage */
    currentStage: string;
    /** Workflow stages */
    stages: Array<{
        name: string;
        status: string;
        requirements?: string[];
        completedAt?: Date;
    }>;
    /** Automation settings */
    automation: {
        autoAssignReviewers: boolean;
        autoLabelBasedOnChanges: boolean;
        autoRequestChangesOnFailure: boolean;
        autoMergeWhenReady: boolean;
    };
    /** Notification settings */
    notifications: {
        onStatusChange: boolean;
        onReviewRequired: boolean;
        onChecksFailure: boolean;
        onReadyToMerge: boolean;
    };
}
/**
 * Quality gate
 */
export interface QualityGate {
    /** Gate ID */
    id: string;
    /** Gate name */
    name: string;
    /** Gate description */
    description: string;
    /** Gate type */
    type: 'check' | 'coverage' | 'security' | 'quality';
    /** Required */
    required: boolean;
    /** Threshold */
    threshold?: number;
    /** URL */
    url?: string;
    /** Timeout */
    timeout?: number;
}
/**
 * PR notification
 */
export interface PRNotification {
    /** PR ID */
    prId: string;
    /** Event type */
    event: string;
    /** Recipients */
    recipients: string[];
    /** Message */
    message: string;
    /** Timestamp */
    timestamp: Date;
}
/**
 * Conflict type enum
 */
export declare enum ConflictType {
    CONTENT = "content",
    IMPORTS = "imports",
    FORMATTING = "formatting",
    LOGIC = "logic",
    DATA_STRUCTURE = "data_structure"
}
/**
 * Resolution result
 */
export interface ResolutionResult {
    /** Conflict ID */
    conflictId: string;
    /** Success */
    success: boolean;
    /** Resolution strategy */
    strategy: string;
    /** Resolved content */
    resolvedContent?: string;
    /** Confidence score */
    confidence: number;
    /** Reasoning */
    reasoning: string;
    /** Resolution time */
    resolutionTime: number;
    /** Suggestions */
    suggestions?: string[];
    /** Analysis */
    analysis?: any;
}
/**
 * Conflict analysis
 */
export interface ConflictAnalysis {
    /** Total conflicts */
    totalConflicts: number;
    /** Conflicts by type */
    conflictsByType: Record<string, number>;
    /** Complexity score */
    complexityScore: number;
    /** Auto-resolvable count */
    autoResolvableCount: number;
    /** High-risk count */
    highRiskCount: number;
    /** Estimated resolution time */
    estimatedResolutionTime: number;
    /** Recommended strategy */
    recommendedStrategy: ConflictResolutionStrategy;
    /** Requires expert review */
    requiresExpertReview: boolean;
    /** Semantic complexity */
    semanticComplexity: number;
    /** Affected modules */
    affectedModules: Set<string>;
    /** Risk assessment */
    riskAssessment: {
        dataLoss: 'low' | 'medium' | 'high';
        functionalBreakage: 'low' | 'medium' | 'high';
        securityImpact: 'none' | 'low' | 'medium' | 'high';
    };
}
/**
 * Auto-resolution rule
 */
export interface AutoResolutionRule {
    /** Rule ID */
    id: string;
    /** Rule name */
    name: string;
    /** Pattern to match */
    pattern: RegExp;
    /** Conflict types */
    conflictTypes: ConflictType[];
    /** Confidence score */
    confidence: number;
    /** Resolver function */
    resolver: (conflict: MergeConflict) => {
        content: string;
        confidence: number;
        reasoning: string;
    };
}
/**
 * Conflict context
 */
export interface ConflictContext {
    /** Lines before conflict */
    beforeLines: string[];
    /** Lines after conflict */
    afterLines: string[];
    /** Enclosing function */
    function?: string;
    /** Module name */
    module?: string;
}
/**
 * Code block
 */
export interface CodeBlock {
    /** Language */
    language: string;
    /** Code content */
    content: string;
    /** Line numbers */
    lines: {
        start: number;
        end: number;
    };
}
/**
 * Semantic analysis
 */
export interface SemanticAnalysis {
    /** Syntax validity */
    syntaxValid: {
        ours: boolean;
        theirs: boolean;
    };
    /** Semantic similarity */
    semanticSimilarity: number;
    /** Functional equivalence */
    functionalEquivalence: boolean;
    /** Risk factors */
    riskFactors: string[];
    /** Complexity */
    complexity: number;
    /** Dependencies */
    dependencies: string[];
}
/**
 * Resolution report
 */
export interface ResolutionReport {
    /** Timestamp */
    timestamp: Date;
    /** Conflicts */
    conflicts: {
        total: number;
        resolved: number;
        failed: number;
        byType: Record<string, number>;
    };
    /** Resolution */
    resolution: {
        strategy: ConflictResolutionStrategy;
        autoResolved: number;
        manualRequired: number;
        averageConfidence: number;
        totalTime: number;
    };
    /** Analysis */
    analysis: ConflictAnalysis;
    /** Recommendations */
    recommendations: string[];
    /** Next steps */
    nextSteps: string[];
    /** Metrics */
    metrics: {
        performanceScore: number;
        accuracyScore: number;
        efficiencyScore: number;
    };
}
