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
export var VCSType;
(function (VCSType) {
    VCSType["GIT"] = "git";
    VCSType["SVN"] = "svn";
    VCSType["MERCURIAL"] = "mercurial";
    VCSType["PERFORCE"] = "perforce";
})(VCSType || (VCSType = {}));
/**
 * Commit message types following conventional commits
 */
export var CommitType;
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
})(CommitType || (CommitType = {}));
/**
 * Branch types for automated branch management
 */
export var BranchType;
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
export var ConflictResolutionStrategy;
(function (ConflictResolutionStrategy) {
    ConflictResolutionStrategy["OURS"] = "ours";
    ConflictResolutionStrategy["THEIRS"] = "theirs";
    ConflictResolutionStrategy["MANUAL"] = "manual";
    ConflictResolutionStrategy["INTELLIGENT"] = "intelligent";
    ConflictResolutionStrategy["CUSTOM"] = "custom";
})(ConflictResolutionStrategy || (ConflictResolutionStrategy = {}));
/**
 * Release types for semantic versioning
 */
export var ReleaseType;
(function (ReleaseType) {
    ReleaseType["MAJOR"] = "major";
    ReleaseType["MINOR"] = "minor";
    ReleaseType["PATCH"] = "patch";
    ReleaseType["PRERELEASE"] = "prerelease";
})(ReleaseType || (ReleaseType = {}));
/**
 * Conflict categories
 */
export var ConflictCategory;
(function (ConflictCategory) {
    ConflictCategory["CODE_LOGIC"] = "code_logic";
    ConflictCategory["IMPORT_STATEMENTS"] = "import_statements";
    ConflictCategory["CONFIGURATION"] = "configuration";
    ConflictCategory["DOCUMENTATION"] = "documentation";
    ConflictCategory["WHITESPACE"] = "whitespace";
    ConflictCategory["FORMATTING"] = "formatting";
})(ConflictCategory || (ConflictCategory = {}));
//# sourceMappingURL=types.js.map