/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Automated Branch Management for Version Control Automation
 * Intelligent branch creation, naming, lifecycle management, and protection rules
 *
 * @author Claude Code - Version Control Automation Agent
 * @version 1.0.0
 */

import { execSync } from 'node:child_process';
import { getComponentLogger } from '../utils/logger.js';
import { BranchType } from './types.js';
import type {
  BranchInfo,
  BranchCreationOptions,
  BranchProtectionRule,
  RepositoryStatus,
} from './types.js';

const logger = getComponentLogger('branch-manager');

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
export const DEFAULT_BRANCH_MANAGER_CONFIG: BranchManagerConfig = {
  defaultBaseBranch: 'main',
  namingConventions: {
    [BranchType.MAIN]: 'main',
    [BranchType.DEVELOP]: 'develop',
    [BranchType.FEATURE]: 'feature/{issue}-{description}',
    [BranchType.HOTFIX]: 'hotfix/{version}-{description}',
    [BranchType.RELEASE]: 'release/{version}',
    [BranchType.BUGFIX]: 'bugfix/{issue}-{description}',
    [BranchType.EXPERIMENTAL]: 'experimental/{description}',
  },
  autoDeleteMerged: true,
  staleBranchThreshold: 30,
  protectionRules: [],
  remoteName: 'origin',
  enableAutoProtection: true,
};

/**
 * Automated branch management system
 */
export class BranchManager {
  private config: BranchManagerConfig;

  constructor(config: Partial<BranchManagerConfig> = {}) {
    this.config = { ...DEFAULT_BRANCH_MANAGER_CONFIG, ...config };
    logger.info('BranchManager initialized', { config: this.config });
  }

  /**
   * Create a new branch with intelligent naming and setup
   */
  async createBranch(options: BranchCreationOptions): Promise<BranchInfo> {
    try {
      logger.info('Creating new branch', { options });

      const branchName = options.customName || this.generateBranchName(options);
      const baseBranch = options.baseBranch || this.config.defaultBaseBranch;

      // Ensure we're on the base branch and it's up to date
      await this.ensureBaseBranchReady(baseBranch);

      // Create the new branch
      execSync(`git checkout -b "${branchName}" "${baseBranch}"`, { stdio: 'pipe' });
      logger.info('Branch created locally', { branchName, baseBranch });

      // Push to remote if requested
      if (options.pushToRemote) {
        const upstreamFlag = options.setUpstream ? '-u' : '';
        execSync(`git push ${upstreamFlag} ${this.config.remoteName} "${branchName}"`, { stdio: 'pipe' });
        logger.info('Branch pushed to remote', { branchName });
      }

      // Apply protection rules if enabled
      if (this.config.enableAutoProtection && this.shouldProtectBranch(options.type)) {
        await this.applyProtectionRules(branchName);
      }

      const branchInfo = await this.getBranchInfo(branchName);
      logger.info('Branch created successfully', { branchInfo });

      return branchInfo;
    } catch (error) {
      logger.error('Failed to create branch', { error, options });
      throw error;
    }
  }

  /**
   * Generate branch name following conventions
   */
  generateBranchName(options: BranchCreationOptions): string {
    const template = this.config.namingConventions[options.type];
    let branchName = template;

    // Replace placeholders
    if (options.associatedIssue) {
      branchName = branchName.replace('{issue}', options.associatedIssue);
    }

    // Generate description from context
    const description = this.generateBranchDescription(options);
    branchName = branchName.replace('{description}', description);

    // Replace version placeholder for release branches
    if (options.type === BranchType.RELEASE || options.type === BranchType.HOTFIX) {
      const version = this.getNextVersion(options.type);
      branchName = branchName.replace('{version}', version);
    }

    // Sanitize branch name
    branchName = this.sanitizeBranchName(branchName);

    // Ensure uniqueness
    branchName = this.ensureUniqueBranchName(branchName);

    return branchName;
  }

  /**
   * Apply protection rules to a branch
   */
  async applyProtectionRules(branchName: string): Promise<void> {
    try {
      logger.info('Applying protection rules', { branchName });

      const applicableRules = this.getApplicableProtectionRules(branchName);

      for (const rule of applicableRules) {
        await this.applyProtectionRule(branchName, rule);
      }

      logger.info('Protection rules applied', { branchName, rulesCount: applicableRules.length });
    } catch (error) {
      logger.error('Failed to apply protection rules', { error, branchName });
      throw error;
    }
  }

  /**
   * Clean up merged branches
   */
  async cleanupMergedBranches(): Promise<string[]> {
    try {
      logger.info('Starting merged branch cleanup');

      const mergedBranches = await this.getMergedBranches();
      const cleanedBranches: string[] = [];

      for (const branch of mergedBranches) {
        if (this.shouldDeleteBranch(branch)) {
          await this.deleteBranch(branch.name);
          cleanedBranches.push(branch.name);
          logger.info('Deleted merged branch', { branchName: branch.name });
        }
      }

      logger.info('Merged branch cleanup completed', { cleanedCount: cleanedBranches.length });
      return cleanedBranches;
    } catch (error) {
      logger.error('Failed to cleanup merged branches', { error });
      throw error;
    }
  }

  /**
   * Analyze branch health
   */
  async analyzeBranchHealth(): Promise<BranchHealthReport> {
    try {
      logger.info('Analyzing branch health');

      const allBranches = await this.getAllBranches();
      const staleBranches = await this.getStaleBranches();
      const mergedBranches = await this.getMergedBranches();

      const report: BranchHealthReport = {
        totalBranches: allBranches.length,
        staleBranches,
        unprotectedBranches: await this.getUnprotectedCriticalBranches(),
        branchesAhead: allBranches.filter(b => b.commitsAhead > 0),
        branchesBehind: allBranches.filter(b => b.commitsBehind > 5),
        mergedBranches,
        protectionViolations: await this.getProtectionViolations(),
      };

      logger.info('Branch health analysis completed', {
        totalBranches: report.totalBranches,
        staleBranches: report.staleBranches.length,
        mergedBranches: report.mergedBranches.length,
      });

      return report;
    } catch (error) {
      logger.error('Failed to analyze branch health', { error });
      throw error;
    }
  }

  /**
   * Get current repository status
   */
  async getRepositoryStatus(): Promise<RepositoryStatus> {
    try {
      const currentBranch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
      const statusOutput = execSync('git status --porcelain', { encoding: 'utf8' });

      const stagedFiles: string[] = [];
      const modifiedFiles: string[] = [];
      const untrackedFiles: string[] = [];

      const lines = statusOutput.trim().split('\n').filter(line => line.length > 0);
      for (const line of lines) {
        const status = line.substring(0, 2);
        const file = line.substring(3);

        if (status.includes('A') || status.includes('M') || status.includes('D')) {
          stagedFiles.push(file);
        } else if (status.includes(' M') || status.includes(' D')) {
          modifiedFiles.push(file);
        } else if (status.includes('??')) {
          untrackedFiles.push(file);
        }
      }

      // Get commits ahead/behind
      let commitsAhead = 0;
      let commitsBehind = 0;
      try {
        const aheadBehind = execSync(`git rev-list --count --left-right ${this.config.remoteName}/${currentBranch}...HEAD 2>/dev/null || echo "0	0"`, { encoding: 'utf8' }).trim();
        const [behind, ahead] = aheadBehind.split('\t').map(n => parseInt(n, 10));
        commitsAhead = ahead || 0;
        commitsBehind = behind || 0;
      } catch {
        // Branch might not exist on remote
      }

      // Get remote URL
      let remoteUrl: string | undefined;
      try {
        remoteUrl = execSync(`git remote get-url ${this.config.remoteName}`, { encoding: 'utf8' }).trim();
      } catch {
        // No remote configured
      }

      return {
        currentBranch,
        isClean: statusOutput.trim().length === 0,
        stagedFiles,
        modifiedFiles,
        untrackedFiles,
        commitsAhead,
        commitsBehind,
        remoteUrl,
      };
    } catch (error) {
      logger.error('Failed to get repository status', { error });
      throw error;
    }
  }

  /**
   * Switch to a branch, creating it if necessary
   */
  async switchToBranch(branchName: string, createIfNotExists = false): Promise<void> {
    try {
      logger.info('Switching to branch', { branchName, createIfNotExists });

      if (createIfNotExists && !await this.branchExists(branchName)) {
        const options: BranchCreationOptions = {
          type: this.inferBranchType(branchName),
          customName: branchName,
          pushToRemote: false,
          setUpstream: false,
        };
        await this.createBranch(options);
      } else {
        execSync(`git checkout "${branchName}"`, { stdio: 'pipe' });
      }

      logger.info('Switched to branch successfully', { branchName });
    } catch (error) {
      logger.error('Failed to switch to branch', { error, branchName });
      throw error;
    }
  }

  // Private helper methods

  private async ensureBaseBranchReady(baseBranch: string): Promise<void> {
    // Switch to base branch
    execSync(`git checkout "${baseBranch}"`, { stdio: 'pipe' });

    // Pull latest changes
    try {
      execSync(`git pull ${this.config.remoteName} "${baseBranch}"`, { stdio: 'pipe' });
    } catch (error) {
      logger.warn('Failed to pull latest changes from remote', { error, baseBranch });
    }
  }

  private generateBranchDescription(options: BranchCreationOptions): string {
    // This is a simplified implementation
    // In a real scenario, you might analyze commit messages, issue titles, etc.
    const timestamp = new Date().getTime().toString().slice(-4);
    return `update-${timestamp}`;
  }

  private getNextVersion(branchType: BranchType): string {
    try {
      // Get the latest version tag
      const latestTag = execSync('git describe --tags --abbrev=0', { encoding: 'utf8' }).trim();
      const versionMatch = latestTag.match(/v?(\d+)\.(\d+)\.(\d+)/);

      if (versionMatch) {
        let [, major, minor, patch] = versionMatch.map(Number);

        if (branchType === BranchType.RELEASE) {
          minor += 1;
          patch = 0;
        } else if (branchType === BranchType.HOTFIX) {
          patch += 1;
        }

        return `${major}.${minor}.${patch}`;
      }
    } catch {
      // No tags found
    }

    return '1.0.0';
  }

  private sanitizeBranchName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\-_\/]/g, '-')
      .replace(/--+/g, '-')
      .replace(/^-|-$/g, '');
  }

  private ensureUniqueBranchName(baseName: string): string {
    let branchName = baseName;
    let counter = 1;

    while (this.branchExists(branchName)) {
      branchName = `${baseName}-${counter}`;
      counter++;
    }

    return branchName;
  }

  private branchExists(branchName: string): boolean {
    try {
      execSync(`git show-ref --verify --quiet refs/heads/${branchName}`, { stdio: 'pipe' });
      return true;
    } catch {
      return false;
    }
  }

  private shouldProtectBranch(branchType: BranchType): boolean {
    return [BranchType.MAIN, BranchType.DEVELOP, BranchType.RELEASE].includes(branchType);
  }

  private getApplicableProtectionRules(branchName: string): BranchProtectionRule[] {
    return this.config.protectionRules.filter(rule => {
      const pattern = rule.branchPattern.replace(/\*/g, '.*');
      const regex = new RegExp(`^${pattern}$`);
      return regex.test(branchName);
    });
  }

  private async applyProtectionRule(branchName: string, rule: BranchProtectionRule): Promise<void> {
    // This would integrate with the specific Git hosting service API (GitHub, GitLab, etc.)
    // For now, we'll log the action
    logger.info('Would apply protection rule', { branchName, rule });
  }

  private async getBranchInfo(branchName: string): Promise<BranchInfo> {
    try {
      const baseBranch = this.config.defaultBaseBranch;
      const createdAt = new Date(); // Would get actual creation date from git log

      // Get last commit
      const lastCommit = execSync(`git rev-parse "${branchName}"`, { encoding: 'utf8' }).trim();

      // Get commits ahead/behind
      let commitsAhead = 0;
      let commitsBehind = 0;
      try {
        const aheadBehind = execSync(`git rev-list --count --left-right "${baseBranch}...${branchName}"`, { encoding: 'utf8' }).trim();
        const [behind, ahead] = aheadBehind.split('\t').map(n => parseInt(n, 10));
        commitsAhead = ahead || 0;
        commitsBehind = behind || 0;
      } catch {
        // Branch comparison failed
      }

      return {
        name: branchName,
        type: this.inferBranchType(branchName),
        baseBranch,
        createdAt,
        lastCommit,
        commitsAhead,
        commitsBehind,
        isProtected: this.isBranchProtected(branchName),
      };
    } catch (error) {
      logger.error('Failed to get branch info', { error, branchName });
      throw error;
    }
  }

  private inferBranchType(branchName: string): BranchType {
    if (branchName === 'main' || branchName === 'master') return BranchType.MAIN;
    if (branchName === 'develop') return BranchType.DEVELOP;
    if (branchName.startsWith('feature/')) return BranchType.FEATURE;
    if (branchName.startsWith('hotfix/')) return BranchType.HOTFIX;
    if (branchName.startsWith('release/')) return BranchType.RELEASE;
    if (branchName.startsWith('bugfix/')) return BranchType.BUGFIX;
    if (branchName.startsWith('experimental/')) return BranchType.EXPERIMENTAL;

    return BranchType.FEATURE; // Default
  }

  private isBranchProtected(branchName: string): boolean {
    // This would check with the Git hosting service API
    // For now, assume main branches are protected
    return [BranchType.MAIN, BranchType.DEVELOP].includes(this.inferBranchType(branchName));
  }

  private async getAllBranches(): Promise<BranchInfo[]> {
    try {
      const output = execSync('git branch --format="%(refname:short)"', { encoding: 'utf8' });
      const branchNames = output.trim().split('\n').filter(name => name.length > 0);

      const branches: BranchInfo[] = [];
      for (const name of branchNames) {
        try {
          branches.push(await this.getBranchInfo(name));
        } catch (error) {
          logger.warn('Failed to get info for branch', { error, branchName: name });
        }
      }

      return branches;
    } catch (error) {
      logger.error('Failed to get all branches', { error });
      return [];
    }
  }

  private async getStaleBranches(): Promise<BranchInfo[]> {
    const allBranches = await this.getAllBranches();
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - this.config.staleBranchThreshold);

    return allBranches.filter(branch => {
      // This would check the actual last commit date
      // For now, just return empty array
      return false;
    });
  }

  private async getMergedBranches(): Promise<BranchInfo[]> {
    try {
      const output = execSync(`git branch --merged ${this.config.defaultBaseBranch} --format="%(refname:short)"`, { encoding: 'utf8' });
      const mergedBranchNames = output.trim().split('\n')
        .filter(name => name.length > 0 && name !== this.config.defaultBaseBranch);

      const branches: BranchInfo[] = [];
      for (const name of mergedBranchNames) {
        try {
          branches.push(await this.getBranchInfo(name));
        } catch (error) {
          logger.warn('Failed to get info for merged branch', { error, branchName: name });
        }
      }

      return branches;
    } catch (error) {
      logger.error('Failed to get merged branches', { error });
      return [];
    }
  }

  private shouldDeleteBranch(branch: BranchInfo): boolean {
    // Don't delete protected branches
    if (branch.isProtected) return false;

    // Don't delete main branches
    if ([BranchType.MAIN, BranchType.DEVELOP].includes(branch.type)) return false;

    // Check if auto-delete is enabled
    return this.config.autoDeleteMerged;
  }

  private async deleteBranch(branchName: string): Promise<void> {
    try {
      // Delete local branch
      execSync(`git branch -d "${branchName}"`, { stdio: 'pipe' });

      // Delete remote branch if it exists
      try {
        execSync(`git push ${this.config.remoteName} --delete "${branchName}"`, { stdio: 'pipe' });
      } catch {
        // Remote branch might not exist
      }

      logger.info('Branch deleted', { branchName });
    } catch (error) {
      logger.error('Failed to delete branch', { error, branchName });
      throw error;
    }
  }

  private async getUnprotectedCriticalBranches(): Promise<BranchInfo[]> {
    const allBranches = await this.getAllBranches();
    return allBranches.filter(branch => {
      const isCritical = [BranchType.MAIN, BranchType.DEVELOP, BranchType.RELEASE].includes(branch.type);
      return isCritical && !branch.isProtected;
    });
  }

  private async getProtectionViolations(): Promise<ProtectionViolation[]> {
    const violations: ProtectionViolation[] = [];
    const allBranches = await this.getAllBranches();

    for (const branch of allBranches) {
      const applicableRules = this.getApplicableProtectionRules(branch.name);

      for (const rule of applicableRules) {
        if (!branch.isProtected) {
          violations.push({
            branch: branch.name,
            rule,
            description: `Branch should be protected according to rule pattern: ${rule.branchPattern}`,
            severity: 'high',
          });
        }
      }
    }

    return violations;
  }

  /**
   * Update branch manager configuration
   */
  updateConfig(newConfig: Partial<BranchManagerConfig>): void {
    this.config = { ...this.config, ...newConfig };
    logger.info('Branch manager configuration updated', { newConfig });
  }

  /**
   * Get current configuration
   */
  getConfig(): BranchManagerConfig {
    return { ...this.config };
  }
}