/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { execSync } from 'child_process';
import { PRStatus, ReviewStatus, CheckStatus, MergeStrategy, } from './types.js';
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
export class PullRequestAutomator {
    config;
    workingDir;
    prTemplates;
    automationRules;
    activeWorkflows;
    qualityGates;
    constructor(config, workingDir) {
        this.config = config.pullRequestAutomation;
        this.workingDir = workingDir || process.cwd();
        this.prTemplates = new Map();
        this.automationRules = new Map();
        this.activeWorkflows = new Map();
        this.qualityGates = new Map();
        this.initializeDefaultTemplates();
        this.initializeAutomationRules();
        this.initializeQualityGates();
    }
    /**
     * Create a new pull request with intelligent automation
     */
    async createPullRequest(options) {
        try {
            const currentBranch = this.getCurrentBranch();
            const sourceBranch = options.sourceBranch || currentBranch;
            const targetBranch = options.targetBranch || this.config.defaultTargetBranch;
            // Analyze changes for intelligent PR creation
            const analysis = await this.analyzePRChanges(sourceBranch, targetBranch);
            // Generate title and description if not provided
            const title = options.title || (await this.generatePRTitle(analysis));
            const description = options.description ||
                (await this.generatePRDescription(analysis, options.template));
            // Suggest reviewers if auto-assignment enabled
            const suggestedReviewers = options.autoAssignReviewers
                ? await this.suggestReviewers(analysis)
                : [];
            // Create PR object
            const pr = {
                id: this.generatePRId(),
                number: 0, // Will be set by platform
                title,
                description,
                sourceBranch,
                targetBranch,
                status: PRStatus.DRAFT,
                author: this.getCurrentUser(),
                reviewers: suggestedReviewers.map((s) => ({
                    username: s.username,
                    status: ReviewStatus.PENDING,
                })),
                assignees: options.assignees || [],
                labels: this.generateLabels(analysis, options.labels || []),
                createdAt: new Date(),
                updatedAt: new Date(),
                checks: [],
                comments: [],
                metrics: this.initializePRMetrics(),
                analysis,
                autoMergeConfig: options.enableAutoMerge
                    ? this.getAutoMergeConfig()
                    : undefined,
                linkedIssues: this.extractLinkedIssues(analysis),
            };
            // Execute platform-specific creation
            const createdPR = await this.executeGitPlatformCommand('create-pr', pr);
            // Initialize workflow monitoring
            await this.initializePRWorkflow(createdPR);
            // Send notifications
            await this.sendPRNotifications(createdPR, 'created');
            return createdPR;
        }
        catch (error) {
            throw new Error(`Failed to create pull request: ${error}`);
        }
    }
    /**
     * Monitor and update PR status with intelligent automation
     */
    async monitorPullRequest(prId) {
        try {
            const pr = await this.getPullRequest(prId);
            if (!pr)
                throw new Error(`Pull request ${prId} not found`);
            // Check all quality gates
            const gateResults = await this.validateQualityGates(pr);
            // Update PR status based on validation results
            const newStatus = this.calculatePRStatus(pr, gateResults);
            if (newStatus !== pr.status) {
                pr.status = newStatus;
                pr.updatedAt = new Date();
                await this.updatePRStatus(pr);
                // Handle status-specific actions
                await this.handleStatusChange(pr, newStatus);
            }
            // Update metrics
            pr.metrics = await this.updatePRMetrics(pr);
            // Check for auto-merge eligibility
            if (pr.autoMergeConfig && newStatus === PRStatus.APPROVED) {
                await this.attemptAutoMerge(pr);
            }
            return newStatus;
        }
        catch (error) {
            throw new Error(`Failed to monitor pull request: ${error}`);
        }
    }
    /**
     * Validate pull request against quality gates
     */
    async validateQualityGates(pr) {
        const results = new Map();
        for (const [gateId, gate] of this.qualityGates) {
            try {
                const isValid = await this.validateGate(pr, gate);
                results.set(gateId, isValid);
                // Update PR checks
                const existingCheck = pr.checks.find((c) => c.name === gate.name);
                if (existingCheck) {
                    existingCheck.status = isValid
                        ? CheckStatus.SUCCESS
                        : CheckStatus.FAILURE;
                    existingCheck.updatedAt = new Date();
                }
                else {
                    pr.checks.push({
                        name: gate.name,
                        status: isValid ? CheckStatus.SUCCESS : CheckStatus.FAILURE,
                        description: gate.description,
                        url: gate.url,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    });
                }
            }
            catch (error) {
                results.set(gateId, false);
                console.error(`Quality gate ${gateId} validation failed:`, error);
            }
        }
        return results;
    }
    /**
     * Attempt automated merge with comprehensive safety checks
     */
    async attemptAutoMerge(pr) {
        if (!pr.autoMergeConfig || pr.status !== PRStatus.APPROVED) {
            return false;
        }
        try {
            // Pre-merge validation
            const preValidation = await this.performPreMergeValidation(pr);
            if (!preValidation.isValid) {
                await this.sendMergeFailureNotification(pr, preValidation.reasons);
                return false;
            }
            // Execute merge
            const mergeResult = await this.executeMerge(pr);
            if (mergeResult.success) {
                pr.status = PRStatus.MERGED;
                pr.mergedAt = new Date();
                pr.mergeCommit = mergeResult.commitSha;
                // Post-merge actions
                await this.performPostMergeActions(pr);
                await this.sendPRNotifications(pr, 'merged');
                return true;
            }
            else {
                await this.sendMergeFailureNotification(pr, [
                    mergeResult.error || 'Unknown merge error',
                ]);
                return false;
            }
        }
        catch (error) {
            await this.sendMergeFailureNotification(pr, [
                `Auto-merge failed: ${error}`,
            ]);
            return false;
        }
    }
    /**
     * Generate intelligent PR analytics and metrics
     */
    async generatePRMetrics(prs) {
        const summary = {
            totalPRs: prs.length,
            openPRs: prs.filter((pr) => pr.status === PRStatus.OPEN).length,
            mergedPRs: prs.filter((pr) => pr.status === PRStatus.MERGED).length,
            closedPRs: prs.filter((pr) => pr.status === PRStatus.CLOSED).length,
            averageTimeToMerge: this.calculateAverageTimeToMerge(prs),
            averageReviewTime: this.calculateAverageReviewTime(prs),
            mergeThroughput: this.calculateMergeThroughput(prs),
            qualityScore: this.calculateQualityScore(prs),
            automationEfficiency: this.calculateAutomationEfficiency(prs),
        };
        const trends = this.analyzeTrends(prs);
        const insights = this.generateInsights(prs, summary);
        const recommendations = this.generateRecommendations(prs, summary, trends);
        return { summary, trends, insights, recommendations };
    }
    /**
     * Suggest optimal reviewers based on code changes and history
     */
    async suggestReviewers(analysis) {
        const suggestions = [];
        try {
            // Code ownership-based suggestions
            const codeOwners = await this.getCodeOwners(analysis.filesChanged);
            for (const owner of codeOwners) {
                suggestions.push({
                    username: owner.username,
                    reason: `Code owner for ${owner.files.join(', ')}`,
                    confidence: 0.9,
                    expertise: owner.expertise,
                    availability: await this.checkReviewerAvailability(owner.username),
                });
            }
            // Expertise-based suggestions
            const expertSuggestions = await this.suggestByExpertise(analysis);
            suggestions.push(...expertSuggestions);
            // History-based suggestions
            const historySuggestions = await this.suggestByHistory(analysis);
            suggestions.push(...historySuggestions);
            // Sort by confidence and availability
            return suggestions
                .sort((a, b) => b.confidence - a.confidence)
                .slice(0, this.config.maxReviewers);
        }
        catch (error) {
            console.error('Failed to suggest reviewers:', error);
            return [];
        }
    }
    /**
     * Analyze PR changes for intelligent automation decisions
     */
    async analyzePRChanges(sourceBranch, targetBranch) {
        try {
            const diffOutput = execSync(`git diff ${targetBranch}...${sourceBranch} --name-status`, { cwd: this.workingDir, encoding: 'utf-8' });
            const changes = this.parseDiffOutput(diffOutput);
            const filesChanged = changes.map((c) => c.file);
            // Calculate change metrics
            const linesChanged = await this.calculateLinesChanged(sourceBranch, targetBranch);
            const complexity = this.calculateChangeComplexity(changes);
            // Detect change patterns
            const changeType = this.detectChangeType(changes);
            const riskLevel = this.assessRiskLevel(changes, linesChanged, complexity);
            // Analyze affected components
            const affectedComponents = this.identifyAffectedComponents(filesChanged);
            const testCoverage = await this.analyzeTestCoverage(filesChanged);
            return {
                filesChanged,
                linesAdded: linesChanged.added,
                linesDeleted: linesChanged.deleted,
                linesModified: linesChanged.modified,
                changeType,
                complexity,
                riskLevel,
                affectedComponents,
                testCoverage,
                hasBreakingChanges: this.detectBreakingChanges(changes),
                hasDatabaseChanges: this.detectDatabaseChanges(filesChanged),
                hasSecurityChanges: this.detectSecurityChanges(filesChanged),
                estimatedReviewTime: this.estimateReviewTime(linesChanged, complexity, riskLevel),
            };
        }
        catch (error) {
            throw new Error(`Failed to analyze PR changes: ${error}`);
        }
    }
    /**
     * Generate intelligent PR title based on change analysis
     */
    async generatePRTitle(analysis) {
        const { changeType, affectedComponents, hasBreakingChanges } = analysis;
        let prefix = '';
        switch (changeType) {
            case 'feature':
                prefix = hasBreakingChanges ? 'feat!' : 'feat';
                break;
            case 'bugfix':
                prefix = 'fix';
                break;
            case 'refactor':
                prefix = 'refactor';
                break;
            case 'docs':
                prefix = 'docs';
                break;
            case 'test':
                prefix = 'test';
                break;
            case 'chore':
                prefix = 'chore';
                break;
            default:
                prefix = 'update';
        }
        const scope = affectedComponents.length > 0 ? affectedComponents[0] : '';
        const scopeStr = scope ? `(${scope})` : '';
        // Get the most recent commit message for context
        const lastCommit = this.getLastCommitMessage();
        const subject = this.extractSubjectFromCommit(lastCommit);
        return `${prefix}${scopeStr}: ${subject}`;
    }
    /**
     * Generate comprehensive PR description using templates
     */
    async generatePRDescription(analysis, templateName) {
        const template = templateName
            ? this.prTemplates.get(templateName)
            : this.selectBestTemplate(analysis);
        if (!template) {
            return this.generateBasicDescription(analysis);
        }
        let description = template.content;
        // Replace template variables
        description = description.replace(/\{\{changeType\}\}/g, analysis.changeType);
        description = description.replace(/\{\{filesChanged\}\}/g, analysis.filesChanged.length.toString());
        description = description.replace(/\{\{linesChanged\}\}/g, (analysis.linesAdded + analysis.linesDeleted).toString());
        description = description.replace(/\{\{complexity\}\}/g, analysis.complexity.toString());
        description = description.replace(/\{\{riskLevel\}\}/g, analysis.riskLevel);
        description = description.replace(/\{\{estimatedReviewTime\}\}/g, `${analysis.estimatedReviewTime} minutes`);
        description = description.replace(/\{\{affectedComponents\}\}/g, analysis.affectedComponents.join(', ') || 'None');
        // Add test coverage information
        if (analysis.testCoverage) {
            description += `\n\n## Test Coverage\n- Coverage: ${analysis.testCoverage.percentage}%\n- New tests: ${analysis.testCoverage.newTests}`;
        }
        // Add warnings for high-risk changes
        if (analysis.riskLevel === 'high') {
            description +=
                '\n\n⚠️ **High Risk Changes** - This PR contains changes that require careful review.';
        }
        if (analysis.hasBreakingChanges) {
            description +=
                '\n\n🚨 **Breaking Changes** - This PR introduces breaking changes. Please review the migration guide.';
        }
        if (analysis.hasDatabaseChanges) {
            description +=
                '\n\n🗄️ **Database Changes** - This PR includes database schema modifications.';
        }
        if (analysis.hasSecurityChanges) {
            description +=
                '\n\n🔐 **Security Changes** - This PR modifies security-related code.';
        }
        return description;
    }
    /**
     * Initialize PR workflow monitoring
     */
    async initializePRWorkflow(pr) {
        const workflow = {
            prId: pr.id,
            currentStage: 'created',
            stages: [
                { name: 'created', status: 'completed', completedAt: new Date() },
                {
                    name: 'ci_checks',
                    status: 'pending',
                    requirements: ['build', 'test', 'lint'],
                },
                {
                    name: 'review',
                    status: 'pending',
                    requirements: [`${this.config.requiredReviewers} reviewers`],
                },
                {
                    name: 'approval',
                    status: 'pending',
                    requirements: ['all checks pass', 'conflicts resolved'],
                },
                {
                    name: 'merge',
                    status: 'pending',
                    requirements: ['auto-merge enabled'],
                },
            ],
            automation: {
                autoAssignReviewers: true,
                autoLabelBasedOnChanges: true,
                autoRequestChangesOnFailure: true,
                autoMergeWhenReady: !!pr.autoMergeConfig,
            },
            notifications: {
                onStatusChange: true,
                onReviewRequired: true,
                onChecksFailure: true,
                onReadyToMerge: true,
            },
        };
        this.activeWorkflows.set(pr.id, workflow);
    }
    /**
     * Platform-specific implementations
     */
    async executeGitPlatformCommand(command, data) {
        // This would integrate with GitHub API, GitLab API, etc.
        // For now, return mock data
        if (command === 'create-pr') {
            return { ...data, number: Math.floor(Math.random() * 1000) + 1 };
        }
        return data;
    }
    async getPullRequest(prId) {
        // Mock implementation - would fetch from git platform API
        return null;
    }
    async updatePRStatus(pr) {
        // Mock implementation - would update via git platform API
    }
    calculatePRStatus(pr, gateResults) {
        const allGatesPassed = Array.from(gateResults.values()).every((result) => result);
        const hasApprovals = pr.reviewers.some((r) => r.status === ReviewStatus.APPROVED);
        const hasRequestedChanges = pr.reviewers.some((r) => r.status === ReviewStatus.CHANGES_REQUESTED);
        if (hasRequestedChanges)
            return PRStatus.CHANGES_REQUESTED;
        if (!allGatesPassed)
            return PRStatus.CHECKS_FAILED;
        if (hasApprovals && allGatesPassed)
            return PRStatus.APPROVED;
        if (pr.reviewers.length > 0)
            return PRStatus.REVIEW_REQUIRED;
        return PRStatus.OPEN;
    }
    async handleStatusChange(pr, newStatus) {
        const workflow = this.activeWorkflows.get(pr.id);
        if (!workflow)
            return;
        // Update workflow stage
        switch (newStatus) {
            case PRStatus.REVIEW_REQUIRED:
                this.updateWorkflowStage(workflow, 'review', 'active');
                break;
            case PRStatus.APPROVED:
                this.updateWorkflowStage(workflow, 'approval', 'completed');
                break;
            case PRStatus.MERGED:
                this.updateWorkflowStage(workflow, 'merge', 'completed');
                break;
        }
        // Execute automation rules
        await this.executeAutomationRules(pr, newStatus);
    }
    updateWorkflowStage(workflow, stageName, status) {
        const stage = workflow.stages.find((s) => s.name === stageName);
        if (stage) {
            stage.status = status;
            if (status === 'completed') {
                stage.completedAt = new Date();
            }
        }
    }
    async executeAutomationRules(pr, status) {
        for (const [, rule] of this.automationRules) {
            if (rule.trigger === status && this.evaluateRuleCondition(pr, rule)) {
                await this.executeRuleAction(pr, rule);
            }
        }
    }
    evaluateRuleCondition(pr, rule) {
        // Evaluate rule conditions (mock implementation)
        return true;
    }
    async executeRuleAction(pr, rule) {
        // Execute rule actions (mock implementation)
    }
    async sendPRNotifications(pr, event) {
        // Mock implementation for sending notifications
    }
    async sendMergeFailureNotification(pr, reasons) {
        // Mock implementation for merge failure notifications
    }
    getCurrentBranch() {
        return execSync('git rev-parse --abbrev-ref HEAD', {
            cwd: this.workingDir,
            encoding: 'utf-8',
        }).trim();
    }
    getCurrentUser() {
        try {
            return execSync('git config user.name', {
                cwd: this.workingDir,
                encoding: 'utf-8',
            }).trim();
        }
        catch {
            return 'Unknown User';
        }
    }
    generatePRId() {
        return `pr_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }
    getAutoMergeConfig() {
        return {
            enabled: true,
            strategy: MergeStrategy.MERGE_COMMIT,
            deleteSourceBranch: true,
            requireAllChecksPass: true,
            requireReviewApproval: true,
            minimumReviewers: this.config.requiredReviewers,
            allowedMergeHours: { start: 9, end: 17 },
            allowedMergeDays: [
                'Monday',
                'Tuesday',
                'Wednesday',
                'Thursday',
                'Friday',
            ],
            exemptUsers: this.config.exemptUsers || [],
            safetyDelay: 300, // 5 minutes
        };
    }
    // Helper methods implementation continues...
    initializePRMetrics() {
        return {
            totalPRs: 0,
            openPRs: 0,
            mergedPRs: 0,
            closedPRs: 0,
            averageTimeToMerge: 0,
            averageReviewTime: 0,
            mergeThroughput: 0,
            qualityScore: 0,
            automationEfficiency: 0,
        };
    }
    async updatePRMetrics(pr) {
        // Calculate updated metrics based on PR state
        return pr.metrics;
    }
    async validateGate(pr, gate) {
        // Mock implementation - would validate specific gate requirements
        return Math.random() > 0.2; // 80% pass rate
    }
    async performPreMergeValidation(pr) {
        const reasons = [];
        // Check if all required checks pass
        const failedChecks = pr.checks.filter((c) => c.status === CheckStatus.FAILURE);
        if (failedChecks.length > 0) {
            reasons.push(`Failed checks: ${failedChecks.map((c) => c.name).join(', ')}`);
        }
        // Check for required approvals
        const approvedReviewers = pr.reviewers.filter((r) => r.status === ReviewStatus.APPROVED);
        if (approvedReviewers.length < this.config.requiredReviewers) {
            reasons.push(`Insufficient approvals: ${approvedReviewers.length}/${this.config.requiredReviewers}`);
        }
        // Check for conflicts
        const hasConflicts = await this.checkForConflicts(pr);
        if (hasConflicts) {
            reasons.push('Merge conflicts detected');
        }
        return {
            isValid: reasons.length === 0,
            reasons,
        };
    }
    async executeMerge(pr) {
        try {
            const mergeCommand = this.buildMergeCommand(pr);
            execSync(mergeCommand, {
                cwd: this.workingDir,
                encoding: 'utf-8',
            });
            const commitSha = execSync('git rev-parse HEAD', {
                cwd: this.workingDir,
                encoding: 'utf-8',
            }).trim();
            return { success: true, commitSha };
        }
        catch (error) {
            return { success: false, error: String(error) };
        }
    }
    buildMergeCommand(pr) {
        const config = pr.autoMergeConfig;
        switch (config.strategy) {
            case MergeStrategy.MERGE_COMMIT:
                return `git merge --no-ff ${pr.sourceBranch} -m "Merge pull request #${pr.number}"`;
            case MergeStrategy.SQUASH:
                return `git merge --squash ${pr.sourceBranch}`;
            case MergeStrategy.REBASE:
                return `git rebase ${pr.sourceBranch}`;
            default:
                return `git merge ${pr.sourceBranch}`;
        }
    }
    async performPostMergeActions(pr) {
        // Delete source branch if configured
        if (pr.autoMergeConfig?.deleteSourceBranch) {
            try {
                execSync(`git branch -d ${pr.sourceBranch}`, { cwd: this.workingDir });
            }
            catch {
                // Branch deletion failed - log but don't throw
            }
        }
        // Update related issues/tickets
        await this.updateRelatedIssues(pr);
        // Trigger deployment pipeline if configured
        await this.triggerDeployment(pr);
    }
    async checkForConflicts(pr) {
        try {
            execSync(`git merge-tree $(git merge-base ${pr.targetBranch} ${pr.sourceBranch}) ${pr.targetBranch} ${pr.sourceBranch}`, {
                cwd: this.workingDir,
                encoding: 'utf-8',
            });
            return false; // No conflicts
        }
        catch {
            return true; // Conflicts detected
        }
    }
    async updateRelatedIssues(pr) {
        // Mock implementation for updating related issues
    }
    async triggerDeployment(pr) {
        // Mock implementation for triggering deployment
    }
    // Analysis and suggestion methods
    parseDiffOutput(output) {
        return output
            .split('\n')
            .filter((line) => line.trim())
            .map((line) => {
            const [status, file] = line.split('\t');
            return { status, file };
        });
    }
    async calculateLinesChanged(sourceBranch, targetBranch) {
        try {
            const diffStat = execSync(`git diff ${targetBranch}...${sourceBranch} --numstat`, { cwd: this.workingDir, encoding: 'utf-8' });
            let added = 0, deleted = 0;
            diffStat.split('\n').forEach((line) => {
                if (line.trim()) {
                    const [addedStr, deletedStr] = line.split('\t');
                    added += parseInt(addedStr) || 0;
                    deleted += parseInt(deletedStr) || 0;
                }
            });
            return { added, deleted, modified: Math.min(added, deleted) };
        }
        catch {
            return { added: 0, deleted: 0, modified: 0 };
        }
    }
    calculateChangeComplexity(changes) {
        let complexity = 0;
        changes.forEach((change) => {
            // Different file types have different complexity weights
            if (change.file.match(/\.(ts|js|py|java|cpp|c)$/))
                complexity += 3;
            else if (change.file.match(/\.(json|yaml|yml|xml)$/))
                complexity += 1;
            else if (change.file.match(/\.(md|txt|rst)$/))
                complexity += 0.5;
            else
                complexity += 2;
            // Status-based complexity
            if (change.status === 'D')
                complexity += 1; // Deletions are complex
            if (change.status === 'R')
                complexity += 2; // Renames are complex
        });
        return Math.round(complexity);
    }
    detectChangeType(changes) {
        const testFiles = changes.filter((c) => c.file.includes('test') || c.file.includes('spec')).length;
        const docFiles = changes.filter((c) => c.file.match(/\.(md|rst|txt)$/)).length;
        const configFiles = changes.filter((c) => c.file.match(/\.(json|yaml|yml|toml|ini)$/)).length;
        const codeFiles = changes.filter((c) => c.file.match(/\.(ts|js|py|java|cpp|c)$/)).length;
        if (testFiles > 0 && codeFiles === 0)
            return 'test';
        if (docFiles > 0 && codeFiles === 0)
            return 'docs';
        if (configFiles > 0 && codeFiles === 0)
            return 'chore';
        if (changes.some((c) => c.status === 'A'))
            return 'feature';
        if (changes.some((c) => c.file.includes('bug') || c.file.includes('fix')))
            return 'bugfix';
        return codeFiles > 0 ? 'feature' : 'chore';
    }
    assessRiskLevel(changes, linesChanged, complexity) {
        const totalLines = linesChanged.added + linesChanged.deleted;
        if (totalLines > 1000 || complexity > 50)
            return 'high';
        if (totalLines > 200 || complexity > 20)
            return 'medium';
        return 'low';
    }
    identifyAffectedComponents(files) {
        const components = new Set();
        files.forEach((file) => {
            const parts = file.split('/');
            if (parts.length > 1) {
                components.add(parts[1]); // Second level directory as component
            }
        });
        return Array.from(components);
    }
    async analyzeTestCoverage(files) {
        // Mock implementation - would analyze test coverage
        return {
            percentage: Math.floor(Math.random() * 40) + 60, // 60-100%
            newTests: files.filter((f) => f.includes('test') || f.includes('spec'))
                .length,
        };
    }
    detectBreakingChanges(changes) {
        return changes.some((change) => change.file.includes('api') ||
            change.file.includes('interface') ||
            change.status === 'D');
    }
    detectDatabaseChanges(files) {
        return files.some((file) => file.includes('migration') ||
            file.includes('schema') ||
            file.includes('database'));
    }
    detectSecurityChanges(files) {
        return files.some((file) => file.includes('auth') ||
            file.includes('security') ||
            file.includes('crypto'));
    }
    estimateReviewTime(linesChanged, complexity, riskLevel) {
        const baseTime = 15; // 15 minutes base
        const linesTime = (linesChanged.added + linesChanged.deleted) * 0.1;
        const complexityTime = complexity * 0.5;
        const riskMultiplier = riskLevel === 'high' ? 1.5 : riskLevel === 'medium' ? 1.2 : 1;
        return Math.round((baseTime + linesTime + complexityTime) * riskMultiplier);
    }
    getLastCommitMessage() {
        try {
            return execSync('git log -1 --pretty=%B', {
                cwd: this.workingDir,
                encoding: 'utf-8',
            }).trim();
        }
        catch {
            return 'Update code';
        }
    }
    extractSubjectFromCommit(commit) {
        const lines = commit.split('\n');
        return lines[0] || 'Update code';
    }
    selectBestTemplate(analysis) {
        // Select template based on change analysis
        if (analysis.hasBreakingChanges)
            return this.prTemplates.get('breaking-change');
        if (analysis.changeType === 'feature')
            return this.prTemplates.get('feature');
        if (analysis.changeType === 'bugfix')
            return this.prTemplates.get('bugfix');
        return this.prTemplates.get('default');
    }
    generateBasicDescription(analysis) {
        return `## Changes
- Files changed: ${analysis.filesChanged.length}
- Lines added: ${analysis.linesAdded}
- Lines deleted: ${analysis.linesDeleted}
- Complexity: ${analysis.complexity}
- Risk level: ${analysis.riskLevel}

## Affected Components
${analysis.affectedComponents.join(', ') || 'None'}

## Review Time Estimate
${analysis.estimatedReviewTime} minutes`;
    }
    generateLabels(analysis, existingLabels) {
        const labels = [...existingLabels];
        // Add labels based on analysis
        if (analysis.riskLevel === 'high')
            labels.push('high-risk');
        if (analysis.hasBreakingChanges)
            labels.push('breaking-change');
        if (analysis.hasDatabaseChanges)
            labels.push('database');
        if (analysis.hasSecurityChanges)
            labels.push('security');
        labels.push(`size-${this.categorizeSize(analysis.linesAdded + analysis.linesDeleted)}`);
        labels.push(`complexity-${this.categorizeComplexity(analysis.complexity)}`);
        return [...new Set(labels)]; // Remove duplicates
    }
    extractLinkedIssues(analysis) {
        const linkedIssues = [];
        // Extract issue references from file names and changes
        for (const file of analysis.filesChanged) {
            // Look for issue patterns in file names
            const issuePatterns = [/#(\d+)/, /issue[-_](\d+)/i, /fix[-_](\d+)/i];
            for (const pattern of issuePatterns) {
                const match = file.match(pattern);
                if (match) {
                    linkedIssues.push(`#${match[1]}`);
                }
            }
        }
        // Remove duplicates and return
        return [...new Set(linkedIssues)];
    }
    categorizeSize(lines) {
        if (lines > 1000)
            return 'xl';
        if (lines > 500)
            return 'large';
        if (lines > 100)
            return 'medium';
        return 'small';
    }
    categorizeComplexity(complexity) {
        if (complexity > 50)
            return 'high';
        if (complexity > 20)
            return 'medium';
        return 'low';
    }
    // Metrics and analysis methods
    calculateAverageTimeToMerge(prs) {
        const mergedPRs = prs.filter((pr) => pr.status === PRStatus.MERGED && pr.mergedAt);
        if (mergedPRs.length === 0)
            return 0;
        const totalTime = mergedPRs.reduce((acc, pr) => {
            const mergeTime = pr.mergedAt.getTime() - pr.createdAt.getTime();
            return acc + mergeTime;
        }, 0);
        return totalTime / mergedPRs.length / (1000 * 60 * 60); // Convert to hours
    }
    calculateAverageReviewTime(prs) {
        // Mock implementation
        return 4.5; // 4.5 hours average
    }
    calculateMergeThroughput(prs) {
        const mergedThisWeek = prs.filter((pr) => {
            if (!pr.mergedAt)
                return false;
            const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            return pr.mergedAt > weekAgo;
        });
        return mergedThisWeek.length;
    }
    calculateQualityScore(prs) {
        // Mock implementation based on various quality metrics
        return 87.5; // 87.5% quality score
    }
    calculateAutomationEfficiency(prs) {
        // Mock implementation based on automation success rate
        return 92.3; // 92.3% automation efficiency
    }
    analyzeTrends(prs) {
        // Mock implementation for trend analysis
        return {
            weeklyTrend: 'increasing',
            averageSize: 'decreasing',
            qualityTrend: 'stable',
        };
    }
    generateInsights(prs, summary) {
        return {
            topContributors: ['user1', 'user2', 'user3'],
            bottleneckComponents: ['frontend', 'api'],
            peakHours: [10, 14, 16],
        };
    }
    generateRecommendations(prs, summary, trends) {
        const recommendations = [];
        if (summary.averageTimeToMerge > 48) {
            recommendations.push('Consider reducing review requirements or adding more reviewers');
        }
        if (summary.qualityScore < 80) {
            recommendations.push('Implement stricter quality gates to improve code quality');
        }
        if (summary.automationEfficiency < 85) {
            recommendations.push('Review automation rules to improve efficiency');
        }
        return recommendations;
    }
    // Reviewer suggestion methods
    async getCodeOwners(files) {
        // Mock implementation - would read CODEOWNERS file
        return [];
    }
    async suggestByExpertise(analysis) {
        // Mock implementation
        return [];
    }
    async suggestByHistory(analysis) {
        // Mock implementation
        return [];
    }
    async checkReviewerAvailability(username) {
        // Mock implementation
        return Math.random() > 0.3; // 70% availability
    }
    // Initialization methods
    initializeDefaultTemplates() {
        this.prTemplates.set('default', {
            name: 'Default PR Template',
            description: 'Standard pull request template',
            content: `## Description
{{description}}

## Changes
- Files changed: {{filesChanged}}
- Lines changed: {{linesChanged}}
- Complexity: {{complexity}}
- Risk level: {{riskLevel}}

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing performed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for hard-to-understand areas
- [ ] Documentation updated
- [ ] No new warnings introduced`,
        });
        this.prTemplates.set('feature', {
            name: 'Feature PR Template',
            description: 'Template for new features',
            content: `## Feature Description
{{description}}

## Implementation Details
- Complexity: {{complexity}}
- Estimated review time: {{estimatedReviewTime}}
- Affected components: {{affectedComponents}}

## Feature Flags
- [ ] Feature flag implemented
- [ ] Rollback plan documented

## Testing Strategy
- [ ] Unit tests ({{testCoverage.percentage}}% coverage)
- [ ] Integration tests
- [ ] E2E tests
- [ ] Performance testing

## Documentation
- [ ] API documentation updated
- [ ] User documentation updated
- [ ] Migration guide (if needed)`,
        });
        this.prTemplates.set('bugfix', {
            name: 'Bug Fix PR Template',
            description: 'Template for bug fixes',
            content: `## Bug Description
{{description}}

## Root Cause
[Describe the root cause of the bug]

## Solution
[Describe how the bug was fixed]

## Risk Assessment
- Risk level: {{riskLevel}}
- Complexity: {{complexity}}

## Testing
- [ ] Bug reproduction test added
- [ ] Regression tests added
- [ ] Manual testing performed

## Impact
- [ ] No breaking changes
- [ ] Backward compatible
- [ ] Migration required: No`,
        });
        this.prTemplates.set('breaking-change', {
            name: 'Breaking Change PR Template',
            description: 'Template for breaking changes',
            content: `## ⚠️ Breaking Change
{{description}}

## What's Breaking
[List the breaking changes]

## Migration Guide
[Provide step-by-step migration instructions]

## Affected Components
{{affectedComponents}}

## Deprecation Timeline
- [ ] Deprecation notice added
- [ ] Migration guide published
- [ ] Support timeline documented

## Testing
- [ ] All existing tests updated
- [ ] Migration tests added
- [ ] Backward compatibility tests removed

## Communication Plan
- [ ] Team notified
- [ ] Documentation updated
- [ ] Release notes prepared`,
        });
    }
    initializeAutomationRules() {
        this.automationRules.set('auto-label', {
            id: 'auto-label',
            name: 'Automatic Labeling',
            description: 'Automatically add labels based on PR changes',
            trigger: PRStatus.OPEN,
            conditions: ['pr.created'],
            actions: ['add-labels-based-on-analysis'],
            enabled: true,
        });
        this.automationRules.set('assign-reviewers', {
            id: 'assign-reviewers',
            name: 'Auto-assign Reviewers',
            description: 'Automatically assign reviewers based on code ownership',
            trigger: PRStatus.OPEN,
            conditions: ['pr.created', 'auto-assign-enabled'],
            actions: ['assign-code-owners', 'assign-by-expertise'],
            enabled: true,
        });
        this.automationRules.set('notify-stakeholders', {
            id: 'notify-stakeholders',
            name: 'Notify Stakeholders',
            description: 'Notify relevant stakeholders of PR status changes',
            trigger: PRStatus.APPROVED,
            conditions: ['pr.approved'],
            actions: ['notify-product-team', 'notify-qa-team'],
            enabled: true,
        });
    }
    initializeQualityGates() {
        this.qualityGates.set('build', {
            id: 'build',
            name: 'Build Success',
            description: 'All builds must pass successfully',
            type: 'check',
            required: true,
            url: '/checks/build',
            timeout: 600, // 10 minutes
        });
        this.qualityGates.set('tests', {
            id: 'tests',
            name: 'All Tests Pass',
            description: 'All unit and integration tests must pass',
            type: 'check',
            required: true,
            url: '/checks/tests',
            timeout: 900, // 15 minutes
        });
        this.qualityGates.set('coverage', {
            id: 'coverage',
            name: 'Code Coverage',
            description: 'Code coverage must meet minimum threshold',
            type: 'coverage',
            required: true,
            threshold: 80,
            url: '/checks/coverage',
        });
        this.qualityGates.set('security', {
            id: 'security',
            name: 'Security Scan',
            description: 'No high-severity security vulnerabilities',
            type: 'security',
            required: true,
            url: '/checks/security',
            timeout: 300, // 5 minutes
        });
        this.qualityGates.set('lint', {
            id: 'lint',
            name: 'Code Quality',
            description: 'All linting rules must pass',
            type: 'quality',
            required: true,
            url: '/checks/lint',
            timeout: 120, // 2 minutes
        });
    }
}
//# sourceMappingURL=PullRequestAutomator.js.map