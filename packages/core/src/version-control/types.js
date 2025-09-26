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
export let VCSType;
(function (VCSType) {
    VCSType["GIT"] = "git";
    VCSType["SVN"] = "svn";
    VCSType["MERCURIAL"] = "mercurial";
    VCSType["PERFORCE"] = "perforce";
})(VCSType || (VCSType = {}));
/**
 * Commit message types following conventional commits
 */
export let CommitType;
(function (CommitType) {
    CommitType["FEAT"] = "feat";
    CommitType["FIX"] = "fix";
    CommitType["DOCS"] = "docs";
    CommitType["STYLE"] = "style";
    CommitType["REFACTOR"] = "refactor";
    CommitType["TEST"] = "test";
    CommitType["CHORE"] = "chore";
    CommitType["PERF"] = "perf";
    CommitType["CI"] = "ci";
    CommitType["BUILD"] = "build";
    CommitType["REVERT"] = "revert";
    CommitType["MERGE"] = "merge";
})(CommitType || (CommitType = {}));
/**
 * Branch types for automated branch management
 */
export let BranchType;
(function (BranchType) {
    BranchType["MAIN"] = "main";
    BranchType["DEVELOP"] = "develop";
    BranchType["FEATURE"] = "feature";
    BranchType["HOTFIX"] = "hotfix";
    BranchType["RELEASE"] = "release";
    BranchType["BUGFIX"] = "bugfix";
    BranchType["EXPERIMENTAL"] = "experimental";
})(BranchType || (BranchType = {}));
/**
 * Merge conflict resolution strategies
 */
export let ConflictResolutionStrategy;
(function (ConflictResolutionStrategy) {
    ConflictResolutionStrategy["OURS"] = "ours";
    ConflictResolutionStrategy["THEIRS"] = "theirs";
    ConflictResolutionStrategy["MANUAL"] = "manual";
    ConflictResolutionStrategy["INTELLIGENT"] = "intelligent";
    ConflictResolutionStrategy["CUSTOM"] = "custom";
    ConflictResolutionStrategy["AUTO_ONLY"] = "auto_only";
    ConflictResolutionStrategy["AUTO_WITH_FALLBACK"] = "auto_with_fallback";
    ConflictResolutionStrategy["INTERACTIVE"] = "interactive";
    ConflictResolutionStrategy["MANUAL_REVIEW"] = "manual_review";
})(ConflictResolutionStrategy || (ConflictResolutionStrategy = {}));
/**
 * Release types for semantic versioning
 */
export let ReleaseType;
(function (ReleaseType) {
    ReleaseType["MAJOR"] = "major";
    ReleaseType["MINOR"] = "minor";
    ReleaseType["PATCH"] = "patch";
    ReleaseType["PRERELEASE"] = "prerelease";
})(ReleaseType || (ReleaseType = {}));
/**
 * Conflict categories
 */
export let ConflictCategory;
(function (ConflictCategory) {
    ConflictCategory["CODE_LOGIC"] = "code_logic";
    ConflictCategory["IMPORT_STATEMENTS"] = "import_statements";
    ConflictCategory["CONFIGURATION"] = "configuration";
    ConflictCategory["DOCUMENTATION"] = "documentation";
    ConflictCategory["WHITESPACE"] = "whitespace";
    ConflictCategory["FORMATTING"] = "formatting";
})(ConflictCategory || (ConflictCategory = {}));
/**
 * Changelog format options
 */
export let ChangelogFormat;
(function (ChangelogFormat) {
    ChangelogFormat["MARKDOWN"] = "markdown";
    ChangelogFormat["JSON"] = "json";
    ChangelogFormat["HTML"] = "html";
    ChangelogFormat["XML"] = "xml";
})(ChangelogFormat || (ChangelogFormat = {}));
/**
 * Pull request status enum
 */
export let PRStatus;
(function (PRStatus) {
    PRStatus["DRAFT"] = "draft";
    PRStatus["OPEN"] = "open";
    PRStatus["REVIEW_REQUIRED"] = "review_required";
    PRStatus["CHANGES_REQUESTED"] = "changes_requested";
    PRStatus["APPROVED"] = "approved";
    PRStatus["CHECKS_FAILED"] = "checks_failed";
    PRStatus["MERGED"] = "merged";
    PRStatus["CLOSED"] = "closed";
    PRStatus["CONFLICTED"] = "conflicted";
})(PRStatus || (PRStatus = {}));
/**
 * Review status enum
 */
export let ReviewStatus;
(function (ReviewStatus) {
    ReviewStatus["PENDING"] = "pending";
    ReviewStatus["APPROVED"] = "approved";
    ReviewStatus["CHANGES_REQUESTED"] = "changes_requested";
    ReviewStatus["DISMISSED"] = "dismissed";
})(ReviewStatus || (ReviewStatus = {}));
/**
 * Check status enum
 */
export let CheckStatus;
(function (CheckStatus) {
    CheckStatus["PENDING"] = "pending";
    CheckStatus["RUNNING"] = "running";
    CheckStatus["SUCCESS"] = "success";
    CheckStatus["FAILURE"] = "failure";
    CheckStatus["CANCELLED"] = "cancelled";
})(CheckStatus || (CheckStatus = {}));
/**
 * Merge strategy enum
 */
export let MergeStrategy;
(function (MergeStrategy) {
    MergeStrategy["MERGE_COMMIT"] = "merge";
    MergeStrategy["SQUASH"] = "squash";
    MergeStrategy["REBASE"] = "rebase";
})(MergeStrategy || (MergeStrategy = {}));
/**
 * Conflict type enum
 */
export let ConflictType;
(function (ConflictType) {
    ConflictType["CONTENT"] = "content";
    ConflictType["IMPORTS"] = "imports";
    ConflictType["FORMATTING"] = "formatting";
    ConflictType["LOGIC"] = "logic";
    ConflictType["DATA_STRUCTURE"] = "data_structure";
})(ConflictType || (ConflictType = {}));
//# sourceMappingURL=types.js.map