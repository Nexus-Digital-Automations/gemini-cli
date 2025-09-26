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
  GIT = 'git',
  SVN = 'svn',
  MERCURIAL = 'mercurial',
  PERFORCE = 'perforce',
}
/**
 * Commit message types following conventional commits
 */
export declare enum CommitType {
  FEAT = 'feat',
  FIX = 'fix',
  DOCS = 'docs',
  STYLE = 'style',
  REFACTOR = 'refactor',
  TEST = 'test',
  CHORE = 'chore',
  PERF = 'perf',
  CI = 'ci',
  BUILD = 'build',
  REVERT = 'revert',
}
/**
 * Branch types for automated branch management
 */
export declare enum BranchType {
  MAIN = 'main',
  DEVELOP = 'develop',
  FEATURE = 'feature',
  HOTFIX = 'hotfix',
  RELEASE = 'release',
  BUGFIX = 'bugfix',
  EXPERIMENTAL = 'experimental',
}
/**
 * Merge conflict resolution strategies
 */
export declare enum ConflictResolutionStrategy {
  OURS = 'ours',
  THEIRS = 'theirs',
  MANUAL = 'manual',
  INTELLIGENT = 'intelligent',
  CUSTOM = 'custom',
}
/**
 * Release types for semantic versioning
 */
export declare enum ReleaseType {
  MAJOR = 'major',
  MINOR = 'minor',
  PATCH = 'patch',
  PRERELEASE = 'prerelease',
}
/**
 * Commit message structure
 */
export interface CommitMessage {
  /** Type of commit */
  type: CommitType;
  /** Optional scope */
  scope?: string;
  /** Short description */
  description: string;
  /** Optional body */
  body?: string;
  /** Optional footer */
  footer?: string;
  /** Breaking change indicator */
  isBreakingChange: boolean;
  /** Issue references */
  references?: string[];
  /** Co-authors */
  coAuthors?: string[];
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
  /** Conflict context */
  context: ConflictContext;
  /** Suggested resolution */
  suggestedResolution?: ConflictResolution;
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
  CODE_LOGIC = 'code_logic',
  IMPORT_STATEMENTS = 'import_statements',
  CONFIGURATION = 'configuration',
  DOCUMENTATION = 'documentation',
  WHITESPACE = 'whitespace',
  FORMATTING = 'formatting',
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
  /** PR title */
  title: string;
  /** PR description */
  description: string;
  /** Source branch */
  sourceBranch: string;
  /** Target branch */
  targetBranch: string;
  /** Labels */
  labels: string[];
  /** Assignees */
  assignees: string[];
  /** Reviewers */
  reviewers: string[];
  /** Is draft */
  isDraft: boolean;
  /** Auto-merge enabled */
  autoMerge: boolean;
  /** Associated issues */
  linkedIssues: string[];
}
/**
 * Changelog entry
 */
export interface ChangelogEntry {
  /** Version */
  version: string;
  /** Release date */
  date: Date;
  /** Changes by type */
  changes: Record<CommitType, ChangeItem[]>;
  /** Breaking changes */
  breakingChanges: BreakingChange[];
  /** Contributors */
  contributors: string[];
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
