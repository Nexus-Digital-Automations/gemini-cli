/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { type VCAutomationConfig, type ChangelogEntry, type ReleaseNotes, ChangelogFormat, type ReleaseMetrics, type ChangelogAnalytics } from './types.js';
/**
 * ChangelogGenerator - Intelligent automated changelog and release notes generation
 *
 * Core features:
 * - Semantic versioning with conventional commits
 * - Multi-format changelog generation (Markdown, JSON, HTML)
 * - Intelligent change categorization and grouping
 * - Comprehensive release notes with migration guides
 * - Contributor recognition and statistics
 * - Breaking change detection and documentation
 * - Release impact analysis and metrics
 * - Template-driven customizable output
 * - Historical release analysis and trends
 * - Stakeholder-specific documentation
 */
export declare class ChangelogGenerator {
    private config;
    private workingDir;
    private templates;
    private releaseHistory;
    private contributorCache;
    constructor(config: VCAutomationConfig, workingDir?: string);
    /**
     * Generate comprehensive changelog from git history
     */
    generateChangelog(options?: {
        fromVersion?: string;
        toVersion?: string;
        format?: ChangelogFormat;
        template?: string;
        includeUnreleased?: boolean;
        groupByType?: boolean;
        includeBreakingChanges?: boolean;
        includeContributors?: boolean;
        outputPath?: string;
    }): Promise<{
        changelog: string;
        releaseNotes: ReleaseNotes;
        metrics: ReleaseMetrics;
        analytics: ChangelogAnalytics;
    }>;
    /**
     * Generate release notes for a specific version
     */
    generateReleaseNotes(entries: ChangelogEntry[], version?: string): Promise<ReleaseNotes>;
    /**
     * Analyze commits and create structured changelog entries
     */
    private analyzeCommits;
    /**
     * Render changelog in specified format using templates
     */
    private renderChangelog;
    /**
     * Render changelog as Markdown
     */
    private renderMarkdown;
    /**
     * Render changelog as JSON
     */
    private renderJSON;
    /**
     * Render changelog as HTML
     */
    private renderHTML;
    /**
     * Render changelog as XML
     */
    private renderXML;
    private resolveVersionRange;
    private parseCommitsInRange;
    private parseCommitLine;
    private parseConventionalCommit;
    private calculateNextVersion;
    private getCurrentVersion;
    private incrementVersion;
    private groupEntriesByType;
    private extractBreakingChanges;
    private generateMigrationGuide;
    private generateCodeExample;
    private getContributors;
    private getContributorInfo;
    private calculateReleaseImpact;
    private generateReleaseSections;
    private generateHighlights;
    private calculateReleaseMetrics;
    private generateAnalytics;
    private normalizeCommitType;
    private getSectionTitle;
    private getSectionIcon;
    private getCommitUrl;
    private convertMarkdownToHTML;
    private escapeXml;
    private isInternalCommit;
    private findRelatedCommits;
    private getCommitFileChanges;
    private analyzeCommitImpact;
    private enhanceDescription;
    private extractReferences;
    private getCommitReviewers;
    private generateCommitTags;
    private getSignificanceWeight;
    private determineReleaseType;
    private generateReleaseTags;
    private generateReleaseRecommendations;
    private generateReleaseSummary;
    private calculateRiskScore;
    private calculateQualityScore;
    private calculateDevelopmentVelocity;
    private analyzeCommitFrequency;
    private analyzeChangeTypes;
    private analyzeContributorActivity;
    private analyzeComplexityTrends;
    private analyzeQualityTrends;
    private identifyHottestComponents;
    private identifyQualityImprovements;
    private analyzeTechnicalDebt;
    private identifyRiskFactors;
    private compareToPreviousRelease;
    private compareToAverage;
    private compareToBenchmarks;
    private predictNextReleaseSize;
    private predictQualityTrend;
    private forecastRisk;
    private estimateAffectedUsers;
    private estimateMigrationEffort;
    private assessReleaseRisk;
    private assessRollbackComplexity;
    private assessCompatibility;
    private parseFooters;
    private parseReferences;
    private generateReferenceUrl;
    private extractMigrationInfo;
    private getLastReleaseTag;
    private getPreviousVersion;
    /**
     * Initialize default changelog templates
     */
    private initializeDefaultTemplates;
}
