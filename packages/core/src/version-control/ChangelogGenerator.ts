/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import {
  type VCAutomationConfig,
  ReleaseType,
  type ChangelogEntry,
  type CommitMessage,
  type ReleaseNotes,
  ChangelogFormat,
  type ReleaseMetrics,
  type ChangelogTemplate,
  type ReleaseSection,
  type ContributorInfo,
  type BreakingChange,
  type MigrationGuide,
  type ChangelogAnalytics,
  type ReleaseImpact,
} from './types.js';

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
export class ChangelogGenerator {
  private config: VCAutomationConfig['changelogGeneration'];
  private workingDir: string;
  private templates: Map<string, ChangelogTemplate>;
  private releaseHistory: Map<string, ReleaseNotes>;
  private contributorCache: Map<string, ContributorInfo>;

  constructor(config: VCAutomationConfig, workingDir?: string) {
    this.config = config.changelogGeneration;
    this.workingDir = workingDir || process.cwd();
    this.templates = new Map();
    this.releaseHistory = new Map();
    this.contributorCache = new Map();
    this.initializeDefaultTemplates();
  }

  /**
   * Generate comprehensive changelog from git history
   */
  async generateChangelog(
    options: {
      fromVersion?: string;
      toVersion?: string;
      format?: ChangelogFormat;
      template?: string;
      includeUnreleased?: boolean;
      groupByType?: boolean;
      includeBreakingChanges?: boolean;
      includeContributors?: boolean;
      outputPath?: string;
    } = {},
  ): Promise<{
    changelog: string;
    releaseNotes: ReleaseNotes;
    metrics: ReleaseMetrics;
    analytics: ChangelogAnalytics;
  }> {
    try {
      // Determine version range
      const { fromVersion, toVersion } = await this.resolveVersionRange(
        options.fromVersion,
        options.toVersion,
      );

      // Parse commits in range
      const commits = await this.parseCommitsInRange(fromVersion, toVersion);

      // Analyze and categorize changes
      const entries = await this.analyzeCommits(commits);

      // Generate release notes
      const releaseNotes = await this.generateReleaseNotes(entries, toVersion);

      // Calculate metrics
      const metrics = this.calculateReleaseMetrics(entries, commits);

      // Generate analytics
      const analytics = await this.generateAnalytics(
        entries,
        releaseNotes,
        metrics,
      );

      // Generate changelog content
      const format = options.format || this.config.defaultFormat;
      const template = options.template || this.config.defaultTemplate;
      const changelog = await this.renderChangelog(
        entries,
        releaseNotes,
        format,
        template,
        options,
      );

      // Save to file if path provided
      if (options.outputPath) {
        writeFileSync(options.outputPath, changelog, 'utf-8');
      }

      // Update release history
      this.releaseHistory.set(toVersion || 'unreleased', releaseNotes);

      return { changelog, releaseNotes, metrics, analytics };
    } catch (error) {
      throw new Error(`Failed to generate changelog: ${error}`);
    }
  }

  /**
   * Generate release notes for a specific version
   */
  async generateReleaseNotes(
    entries: ChangelogEntry[],
    version?: string,
  ): Promise<ReleaseNotes> {
    const releaseVersion =
      version || (await this.calculateNextVersion(entries));
    const previousVersion = await this.getPreviousVersion(releaseVersion);

    // Group entries by type
    const groupedEntries = this.groupEntriesByType(entries);

    // Extract breaking changes
    const breakingChanges = this.extractBreakingChanges(entries);

    // Generate migration guide if needed
    const migrationGuide =
      breakingChanges.length > 0
        ? await this.generateMigrationGuide(breakingChanges)
        : null;

    // Get contributor information
    const contributors = await this.getContributors(entries);

    // Calculate release impact
    const impact = this.calculateReleaseImpact(entries, breakingChanges);

    // Generate sections
    const sections = this.generateReleaseSections(groupedEntries);

    return {
      version: releaseVersion,
      previousVersion,
      releaseDate: new Date(),
      summary: this.generateReleaseSummary(entries, impact),
      sections,
      breakingChanges,
      contributors,
      migrationGuide,
      impact,
      metadata: {
        totalChanges: entries.length,
        commitCount: entries.reduce((acc, e) => acc + e.commits.length, 0),
        contributorCount: contributors.length,
        filesChanged: [...new Set(entries.flatMap((e) => e.files))].length,
        linesChanged: entries.reduce(
          (acc, e) => acc + (e.linesAdded + e.linesDeleted),
          0,
        ),
      },
      releaseType: this.determineReleaseType(entries, breakingChanges),
      tags: this.generateReleaseTags(entries, impact),
      recommendations: this.generateReleaseRecommendations(entries, impact),
    };
  }

  /**
   * Analyze commits and create structured changelog entries
   */
  private async analyzeCommits(
    commits: CommitMessage[],
  ): Promise<ChangelogEntry[]> {
    const entries: ChangelogEntry[] = [];
    const processedCommits = new Set<string>();

    for (const commit of commits) {
      if (processedCommits.has(commit.hash)) continue;

      // Skip merge commits unless configured to include
      if (commit.type === 'merge' && !this.config.includeMergeCommits) {
        continue;
      }

      // Skip internal/maintenance commits unless configured
      if (
        this.isInternalCommit(commit) &&
        !this.config.includeInternalCommits
      ) {
        continue;
      }

      // Find related commits (fixes, reverts, etc.)
      const relatedCommits = this.findRelatedCommits(commit, commits);
      relatedCommits.forEach((c) => processedCommits.add(c.hash));

      // Get file changes for this commit
      const fileChanges = await this.getCommitFileChanges(commit.hash);

      // Analyze impact and significance
      const impact = await this.analyzeCommitImpact(commit, fileChanges);

      // Create changelog entry
      const entry: ChangelogEntry = {
        id: commit.hash,
        type: this.normalizeCommitType(commit.type),
        scope: commit.scope,
        subject: commit.subject,
        description: this.enhanceDescription(commit, impact),
        breakingChange: commit.breakingChange,
        author: commit.author,
        date: commit.date,
        commits: [commit, ...relatedCommits],
        files: fileChanges.files,
        linesAdded: fileChanges.additions,
        linesDeleted: fileChanges.deletions,
        impact: impact.level,
        significance: impact.significance,
        references: this.extractReferences(commit),
        reviewers: await this.getCommitReviewers(commit.hash),
        tags: this.generateCommitTags(commit, impact),
        metadata: {
          complexity: impact.complexity,
          riskLevel: impact.riskLevel,
          testCoverage: impact.testCoverage,
          affectedModules: impact.affectedModules,
        },
      };

      entries.push(entry);
      processedCommits.add(commit.hash);
    }

    // Sort entries by significance and date
    return entries.sort((a, b) => {
      if (a.significance !== b.significance) {
        return (
          this.getSignificanceWeight(b.significance) -
          this.getSignificanceWeight(a.significance)
        );
      }
      return b.date.getTime() - a.date.getTime();
    });
  }

  /**
   * Render changelog in specified format using templates
   */
  private async renderChangelog(
    entries: ChangelogEntry[],
    releaseNotes: ReleaseNotes,
    format: ChangelogFormat,
    templateName: string,
    options: any,
  ): Promise<string> {
    const template =
      this.templates.get(templateName) || this.templates.get('default')!;

    switch (format) {
      case ChangelogFormat.MARKDOWN:
        return this.renderMarkdown(entries, releaseNotes, template, options);
      case ChangelogFormat.JSON:
        return this.renderJSON(entries, releaseNotes, options);
      case ChangelogFormat.HTML:
        return this.renderHTML(entries, releaseNotes, template, options);
      case ChangelogFormat.XML:
        return this.renderXML(entries, releaseNotes, options);
      default:
        return this.renderMarkdown(entries, releaseNotes, template, options);
    }
  }

  /**
   * Render changelog as Markdown
   */
  private renderMarkdown(
    entries: ChangelogEntry[],
    releaseNotes: ReleaseNotes,
    template: ChangelogTemplate,
    options: any,
  ): string {
    let content = template.header
      .replace('{{version}}', releaseNotes.version)
      .replace('{{date}}', releaseNotes.releaseDate.toISOString().split('T')[0])
      .replace('{{summary}}', releaseNotes.summary);

    // Add release highlights
    if (
      releaseNotes.sections['highlights'] &&
      releaseNotes.sections['highlights'].length > 0
    ) {
      content += '\n\n## ✨ Highlights\n\n';
      for (const highlight of releaseNotes.sections['highlights']) {
        content += `- **${highlight.title}**: ${highlight.description}\n`;
      }
    }

    // Add breaking changes first (most important)
    if (releaseNotes.breakingChanges.length > 0) {
      content += '\n\n## 💥 BREAKING CHANGES\n\n';
      for (const breaking of releaseNotes.breakingChanges) {
        content += `- **${breaking.scope || 'general'}**: ${breaking.description}\n`;
        if (breaking.migration) {
          content += `  - Migration: ${breaking.migration}\n`;
        }
      }
    }

    // Add migration guide if present
    if (releaseNotes.migrationGuide) {
      content += '\n\n## 📖 Migration Guide\n\n';
      content += releaseNotes.migrationGuide.overview + '\n\n';

      for (const step of releaseNotes.migrationGuide.steps) {
        content += `### ${step.title}\n\n`;
        content += step.description + '\n\n';

        if (step.codeExample) {
          content += '```' + (step.codeExample.language || '') + '\n';
          content += step.codeExample.before + '\n';
          content += '```\n\n';
          content += 'becomes:\n\n';
          content += '```' + (step.codeExample.language || '') + '\n';
          content += step.codeExample.after + '\n';
          content += '```\n\n';
        }
      }
    }

    // Group entries by type and render
    const grouped = options.groupByType
      ? this.groupEntriesByType(entries)
      : { all: entries };

    for (const [type, typeEntries] of Object.entries(grouped)) {
      if (typeEntries.length === 0) continue;

      const sectionTitle = this.getSectionTitle(type);
      const sectionIcon = this.getSectionIcon(type);
      content += `\n\n## ${sectionIcon} ${sectionTitle}\n\n`;

      for (const entry of typeEntries) {
        let line = `- `;

        if (entry.scope) {
          line += `**${entry.scope}**: `;
        }

        line += entry.subject;

        // Add commit hash reference
        if (this.config.includeCommitHashes) {
          line += ` ([${entry.id.substring(0, 7)}](${this.getCommitUrl(entry.id)}))`;
        }

        // Add author if configured
        if (this.config.includeAuthors) {
          line += ` by @${entry.author}`;
        }

        content += line + '\n';

        // Add description if present and detailed output requested
        if (
          entry.description &&
          entry.description !== entry.subject &&
          this.config.includeDescriptions
        ) {
          content += `  ${entry.description}\n`;
        }

        // Add issue references
        if (entry.references.length > 0) {
          const refs = entry.references
            .map((ref) => `[${ref.type} ${ref.id}](${ref.url})`)
            .join(', ');
          content += `  References: ${refs}\n`;
        }
      }
    }

    // Add contributors section
    if (options.includeContributors && releaseNotes.contributors.length > 0) {
      content += '\n\n## 👥 Contributors\n\n';
      content +=
        'Thanks to all the contributors who made this release possible:\n\n';

      for (const contributor of releaseNotes.contributors) {
        content += `- [@${contributor.username}](${contributor.profileUrl}) (${contributor.contributions} contribution${contributor.contributions !== 1 ? 's' : ''})\n`;
      }
    }

    // Add release statistics
    if (this.config.includeStatistics) {
      const stats = releaseNotes.metadata;
      content += '\n\n## 📊 Release Statistics\n\n';
      content += `- **Total changes**: ${stats.totalChanges}\n`;
      content += `- **Commits**: ${stats.commitCount}\n`;
      content += `- **Contributors**: ${stats.contributorCount}\n`;
      content += `- **Files changed**: ${stats.filesChanged}\n`;
      content += `- **Lines changed**: ${stats.linesChanged}\n`;
    }

    // Add footer from template
    content +=
      '\n\n' +
      template.footer
        .replace('{{version}}', releaseNotes.version)
        .replace('{{date}}', releaseNotes.releaseDate.toISOString());

    return content;
  }

  /**
   * Render changelog as JSON
   */
  private renderJSON(
    entries: ChangelogEntry[],
    releaseNotes: ReleaseNotes,
    options: any,
  ): string {
    const data = {
      version: releaseNotes.version,
      releaseDate: releaseNotes.releaseDate.toISOString(),
      summary: releaseNotes.summary,
      releaseType: releaseNotes.releaseType,
      impact: releaseNotes.impact,
      breakingChanges: releaseNotes.breakingChanges,
      migrationGuide: releaseNotes.migrationGuide,
      sections: releaseNotes.sections,
      contributors: releaseNotes.contributors,
      metadata: releaseNotes.metadata,
      entries: entries.map((entry) => ({
        id: entry.id,
        type: entry.type,
        scope: entry.scope,
        subject: entry.subject,
        description: entry.description,
        author: entry.author,
        date: entry.date.toISOString(),
        breakingChange: entry.breakingChange,
        impact: entry.impact,
        significance: entry.significance,
        references: entry.references,
        files: entry.files,
        linesAdded: entry.linesAdded,
        linesDeleted: entry.linesDeleted,
        tags: entry.tags,
        metadata: entry.metadata,
      })),
    };

    return JSON.stringify(data, null, 2);
  }

  /**
   * Render changelog as HTML
   */
  private renderHTML(
    entries: ChangelogEntry[],
    releaseNotes: ReleaseNotes,
    template: ChangelogTemplate,
    options: any,
  ): string {
    // Convert markdown to HTML (simplified implementation)
    const markdownContent = this.renderMarkdown(
      entries,
      releaseNotes,
      template,
      options,
    );

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Changelog - ${releaseNotes.version}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1, h2, h3 { color: #333; }
        h1 { border-bottom: 2px solid #eee; padding-bottom: 10px; }
        h2 { border-bottom: 1px solid #eee; padding-bottom: 5px; margin-top: 2em; }
        code { background: #f4f4f4; padding: 2px 4px; border-radius: 3px; }
        pre { background: #f4f4f4; padding: 10px; border-radius: 5px; overflow-x: auto; }
        .breaking-changes { background: #fff3cd; border-left: 4px solid #856404; padding: 10px; margin: 10px 0; }
        .contributors { background: #f8f9fa; padding: 15px; border-radius: 5px; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; }
        .stat-item { background: #e9ecef; padding: 10px; border-radius: 5px; text-align: center; }
    </style>
</head>
<body>
    ${this.convertMarkdownToHTML(markdownContent)}
</body>
</html>`;

    return htmlContent;
  }

  /**
   * Render changelog as XML
   */
  private renderXML(
    entries: ChangelogEntry[],
    releaseNotes: ReleaseNotes,
    options: any,
  ): string {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += `<changelog version="${releaseNotes.version}" date="${releaseNotes.releaseDate.toISOString()}">\n`;
    xml += `  <summary>${this.escapeXml(releaseNotes.summary)}</summary>\n`;
    xml += `  <releaseType>${releaseNotes.releaseType}</releaseType>\n`;

    // Breaking changes
    if (releaseNotes.breakingChanges.length > 0) {
      xml += '  <breakingChanges>\n';
      for (const bc of releaseNotes.breakingChanges) {
        xml += `    <change scope="${this.escapeXml(bc.scope || '')}">\n`;
        xml += `      <description>${this.escapeXml(bc.description)}</description>\n`;
        if (bc.migration) {
          xml += `      <migration>${this.escapeXml(bc.migration)}</migration>\n`;
        }
        xml += '    </change>\n';
      }
      xml += '  </breakingChanges>\n';
    }

    // Entries
    xml += '  <entries>\n';
    for (const entry of entries) {
      xml += `    <entry id="${entry.id}" type="${entry.type}" impact="${entry.impact}">\n`;
      if (entry.scope)
        xml += `      <scope>${this.escapeXml(entry.scope)}</scope>\n`;
      xml += `      <subject>${this.escapeXml(entry.subject)}</subject>\n`;
      if (entry.description)
        xml += `      <description>${this.escapeXml(entry.description)}</description>\n`;
      xml += `      <author>${this.escapeXml(entry.author)}</author>\n`;
      xml += `      <date>${entry.date.toISOString()}</date>\n`;
      xml += `      <linesAdded>${entry.linesAdded}</linesAdded>\n`;
      xml += `      <linesDeleted>${entry.linesDeleted}</linesDeleted>\n`;
      xml += '    </entry>\n';
    }
    xml += '  </entries>\n';

    // Contributors
    xml += '  <contributors>\n';
    for (const contributor of releaseNotes.contributors) {
      xml += `    <contributor username="${this.escapeXml(contributor.username)}" contributions="${contributor.contributions}" />\n`;
    }
    xml += '  </contributors>\n';

    xml += '</changelog>';
    return xml;
  }

  // Utility and helper methods
  private async resolveVersionRange(
    fromVersion?: string,
    toVersion?: string,
  ): Promise<{
    fromVersion: string;
    toVersion: string;
  }> {
    if (!fromVersion) {
      fromVersion = (await this.getLastReleaseTag()) || 'HEAD~100';
    }

    if (!toVersion) {
      toVersion = 'HEAD';
    }

    return { fromVersion, toVersion };
  }

  private async parseCommitsInRange(
    fromVersion: string,
    toVersion: string,
  ): Promise<CommitMessage[]> {
    try {
      const gitLog = execSync(
        `git log ${fromVersion}..${toVersion} --pretty=format:"%H|%an|%ae|%ad|%s|%b" --date=iso`,
        { cwd: this.workingDir, encoding: 'utf-8' },
      );

      return gitLog
        .split('\n')
        .filter((line) => line.trim())
        .map((line) => this.parseCommitLine(line))
        .filter((commit) => commit !== null) as CommitMessage[];
    } catch (error) {
      throw new Error(`Failed to parse commits: ${error}`);
    }
  }

  private parseCommitLine(line: string): CommitMessage | null {
    const parts = line.split('|');
    if (parts.length < 5) return null;

    const [hash, author, email, date, subject, body] = parts;
    const fullMessage = subject + (body ? `\n\n${body}` : '');

    return this.parseConventionalCommit(fullMessage, {
      hash,
      author,
      email,
      date: new Date(date),
    });
  }

  private parseConventionalCommit(
    message: string,
    metadata: any,
  ): CommitMessage {
    const lines = message.split('\n');
    const header = lines[0];
    const body = lines.slice(2).join('\n').trim();

    // Parse conventional commit format
    const conventionalRegex = /^(\w+)(\([^)]+\))?(!)?: (.+)$/;
    const match = header.match(conventionalRegex);

    let type = 'other';
    let scope: string | undefined;
    let subject = header;
    let isBreaking = false;

    if (match) {
      type = match[1];
      scope = match[2]?.replace(/[()]/g, '');
      isBreaking = !!match[3];
      subject = match[4];
    }

    // Check for breaking change in body
    const breakingMatch = body.match(/BREAKING CHANGE:\s*(.+)/);
    const breakingDescription = breakingMatch?.[1];

    if (breakingMatch) {
      isBreaking = true;
    }

    return {
      hash: metadata.hash,
      type,
      scope,
      subject,
      body,
      author: metadata.author,
      email: metadata.email,
      date: metadata.date,
      breakingChange: isBreaking
        ? {
            description: breakingDescription || subject,
            scope,
            migration: this.extractMigrationInfo(body),
          }
        : undefined,
      footers: this.parseFooters(body),
      references: this.parseReferences(message),
    };
  }

  private async calculateNextVersion(
    entries: ChangelogEntry[],
  ): Promise<string> {
    const currentVersion = await this.getCurrentVersion();
    const hasBreaking = entries.some((e) => e.breakingChange);
    const hasFeatures = entries.some((e) => e.type === 'feat');
    const hasFixes = entries.some((e) => e.type === 'fix');

    if (hasBreaking) {
      return this.incrementVersion(currentVersion, 'major');
    } else if (hasFeatures) {
      return this.incrementVersion(currentVersion, 'minor');
    } else if (hasFixes) {
      return this.incrementVersion(currentVersion, 'patch');
    }

    return currentVersion;
  }

  private async getCurrentVersion(): Promise<string> {
    try {
      const packageJsonPath = join(this.workingDir, 'package.json');
      if (existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
        return packageJson.version || '0.0.0';
      }
    } catch {
      // Fallback to git tags
    }

    try {
      return execSync('git describe --tags --abbrev=0', {
        cwd: this.workingDir,
        encoding: 'utf-8',
      }).trim();
    } catch {
      return '0.0.0';
    }
  }

  private incrementVersion(
    version: string,
    type: 'major' | 'minor' | 'patch',
  ): string {
    const parts = version.replace(/^v/, '').split('.').map(Number);
    const [major, minor, patch] = parts;

    switch (type) {
      case 'major':
        return `${major + 1}.0.0`;
      case 'minor':
        return `${major}.${minor + 1}.0`;
      case 'patch':
        return `${major}.${minor}.${patch + 1}`;
      default:
        return version;
    }
  }

  private groupEntriesByType(
    entries: ChangelogEntry[],
  ): Record<string, ChangelogEntry[]> {
    return entries.reduce(
      (acc, entry) => {
        if (!acc[entry.type]) acc[entry.type] = [];
        acc[entry.type].push(entry);
        return acc;
      },
      {} as Record<string, ChangelogEntry[]>,
    );
  }

  private extractBreakingChanges(entries: ChangelogEntry[]): BreakingChange[] {
    return entries
      .filter((e) => e.breakingChange)
      .map((e) => ({
        description: e.breakingChange!.description,
        scope: e.breakingChange!.scope,
        migration: e.breakingChange!.migration,
        migrationGuide: e.breakingChange!.migration,
        affectedAPIs: [], // TODO: Extract from files or analysis
        commit: e.id,
      }))
      .filter(Boolean);
  }

  private async generateMigrationGuide(
    breakingChanges: BreakingChange[],
  ): Promise<MigrationGuide> {
    const steps = breakingChanges.map((change, index) => ({
      title: `Update ${change.scope || 'affected code'}`,
      description: change.migration || change.description,
      order: index + 1,
      codeExample: this.generateCodeExample(change),
    }));

    return {
      overview:
        'This release contains breaking changes that require code updates.',
      steps,
      estimatedTime: steps.length * 15, // 15 minutes per step
      automationAvailable: false,
      rollbackInstructions:
        'Revert to the previous version if issues occur during migration.',
    };
  }

  private generateCodeExample(change: BreakingChange): any {
    // Mock implementation - would analyze actual code changes
    return {
      language: 'typescript',
      before: '// Old API usage',
      after: '// New API usage',
    };
  }

  private async getContributors(
    entries: ChangelogEntry[],
  ): Promise<ContributorInfo[]> {
    const contributorMap = new Map<string, ContributorInfo>();

    for (const entry of entries) {
      const username = entry.author;
      if (!contributorMap.has(username)) {
        const info = await this.getContributorInfo(username);
        contributorMap.set(username, info);
      }

      const contributor = contributorMap.get(username)!;
      contributor.contributions++;
    }

    return Array.from(contributorMap.values()).sort(
      (a, b) => b.contributions - a.contributions,
    );
  }

  private async getContributorInfo(username: string): Promise<ContributorInfo> {
    if (this.contributorCache.has(username)) {
      return { ...this.contributorCache.get(username)!, contributions: 0 };
    }

    // Mock implementation - would fetch from Git platform API
    const info: ContributorInfo = {
      username,
      email: `${username}@example.com`,
      name: username,
      profileUrl: `https://github.com/${username}`,
      contributions: 0,
      firstContribution: new Date(),
      role: 'contributor',
    };

    this.contributorCache.set(username, info);
    return info;
  }

  private calculateReleaseImpact(
    entries: ChangelogEntry[],
    breakingChanges: BreakingChange[],
  ): ReleaseImpact {
    const totalLines = entries.reduce(
      (acc, e) => acc + e.linesAdded + e.linesDeleted,
      0,
    );
    const highImpactChanges = entries.filter((e) => e.impact === 'high').length;

    let level: ReleaseImpact['level'] = 'low';
    if (
      breakingChanges.length > 0 ||
      totalLines > 1000 ||
      highImpactChanges > 5
    ) {
      level = 'high';
    } else if (totalLines > 200 || highImpactChanges > 2) {
      level = 'medium';
    }

    return {
      level,
      affectedUsers: this.estimateAffectedUsers(level, entries),
      migrationEffort: this.estimateMigrationEffort(breakingChanges),
      riskAssessment: this.assessReleaseRisk(entries, breakingChanges),
      rollbackComplexity: this.assessRollbackComplexity(entries),
      compatibility: this.assessCompatibility(entries, breakingChanges),
    };
  }

  private generateReleaseSections(
    groupedEntries: Record<string, ChangelogEntry[]>,
  ): Record<string, ReleaseSection[]> {
    const sections: Record<string, ReleaseSection[]> = {};

    // Generate highlights
    sections['highlights'] = this.generateHighlights(groupedEntries);

    // Generate feature sections
    if (groupedEntries['feat']) {
      sections['features'] = groupedEntries['feat'].map((entry) => ({
        title: entry.subject,
        description: entry.description || entry.subject,
        type: 'feature',
        impact: entry.impact,
        author: entry.author,
        references: entry.references,
      }));
    }

    // Generate bug fix sections
    if (groupedEntries['fix']) {
      sections['fixes'] = groupedEntries['fix'].map((entry) => ({
        title: entry.subject,
        description: entry.description || entry.subject,
        type: 'fix',
        impact: entry.impact,
        author: entry.author,
        references: entry.references,
      }));
    }

    return sections;
  }

  private generateHighlights(
    groupedEntries: Record<string, ChangelogEntry[]>,
  ): ReleaseSection[] {
    const highlights: ReleaseSection[] = [];

    // Find most significant changes
    const significantChanges = Object.values(groupedEntries)
      .flat()
      .filter((e) => e.significance === 'high' || e.impact === 'high')
      .slice(0, 5);

    for (const change of significantChanges) {
      highlights.push({
        title: change.subject,
        description:
          change.description ||
          `${change.type} improvement in ${change.scope || 'core functionality'}`,
        type: change.type as any,
        impact: change.impact,
        author: change.author,
        references: change.references,
      });
    }

    return highlights;
  }

  private calculateReleaseMetrics(
    entries: ChangelogEntry[],
    commits: CommitMessage[],
  ): ReleaseMetrics {
    return {
      totalCommits: commits.length,
      totalChanges: entries.length,
      contributorCount: [...new Set(entries.map((e) => e.author))].length,
      filesChanged: [...new Set(entries.flatMap((e) => e.files))].length,
      linesAdded: entries.reduce((acc, e) => acc + e.linesAdded, 0),
      linesDeleted: entries.reduce((acc, e) => acc + e.linesDeleted, 0),
      breakingChanges: entries.filter((e) => e.breakingChange).length,
      features: entries.filter((e) => e.type === 'feat').length,
      bugFixes: entries.filter((e) => e.type === 'fix').length,
      performance: entries.filter((e) => e.type === 'perf').length,
      documentation: entries.filter((e) => e.type === 'docs').length,
      chores: entries.filter((e) => e.type === 'chore').length,
      averageChangeSize:
        entries.reduce((acc, e) => acc + e.linesAdded + e.linesDeleted, 0) /
        entries.length,
      complexityScore:
        entries.reduce((acc, e) => acc + (e.metadata.complexity || 1), 0) /
        entries.length,
      riskScore: this.calculateRiskScore(entries),
      qualityScore: this.calculateQualityScore(entries),
      developmentVelocity: this.calculateDevelopmentVelocity(commits),
    };
  }

  private async generateAnalytics(
    entries: ChangelogEntry[],
    releaseNotes: ReleaseNotes,
    metrics: ReleaseMetrics,
  ): Promise<ChangelogAnalytics> {
    return {
      trends: {
        commitFrequency: this.analyzeCommitFrequency(entries),
        changeTypes: this.analyzeChangeTypes(entries),
        contributorActivity: this.analyzeContributorActivity(
          releaseNotes.contributors,
        ),
        complexity: this.analyzeComplexityTrends(entries),
        quality: this.analyzeQualityTrends(entries),
      },
      insights: {
        mostActiveContributors: releaseNotes.contributors.slice(0, 5),
        hottestComponents: this.identifyHottestComponents(entries),
        qualityImprovements: this.identifyQualityImprovements(entries),
        technicalDebt: this.analyzeTechnicalDebt(entries),
        riskFactors: this.identifyRiskFactors(entries),
      },
      comparisons: {
        previousRelease: await this.compareToPreviousRelease(metrics),
        averageRelease: this.compareToAverage(metrics),
        benchmarks: this.compareToBenchmarks(metrics),
      },
      predictions: {
        nextReleaseSize: this.predictNextReleaseSize(entries),
        qualityTrend: this.predictQualityTrend(entries),
        riskForecast: this.forecastRisk(entries),
      },
    };
  }

  // Helper methods for analysis and formatting
  private normalizeCommitType(type: string): string {
    const typeMap: Record<string, string> = {
      feature: 'feat',
      bugfix: 'fix',
      hotfix: 'fix',
      documentation: 'docs',
      style: 'style',
      refactor: 'refactor',
      performance: 'perf',
      test: 'test',
      chore: 'chore',
      build: 'build',
      ci: 'ci',
    };

    return typeMap[type.toLowerCase()] || type.toLowerCase();
  }

  private getSectionTitle(type: string): string {
    const titles: Record<string, string> = {
      feat: 'Features',
      fix: 'Bug Fixes',
      docs: 'Documentation',
      style: 'Styles',
      refactor: 'Code Refactoring',
      perf: 'Performance Improvements',
      test: 'Tests',
      build: 'Build System',
      ci: 'Continuous Integration',
      chore: 'Chores',
      revert: 'Reverts',
      all: 'All Changes',
    };

    return titles[type] || type.charAt(0).toUpperCase() + type.slice(1);
  }

  private getSectionIcon(type: string): string {
    const icons: Record<string, string> = {
      feat: '✨',
      fix: '🐛',
      docs: '📚',
      style: '💎',
      refactor: '📦',
      perf: '🚀',
      test: '🚨',
      build: '🛠',
      ci: '⚙️',
      chore: '♻️',
      revert: '⏪',
      all: '📋',
    };

    return icons[type] || '📝';
  }

  private getCommitUrl(hash: string): string {
    // Mock implementation - would generate actual URL based on repository
    return `https://github.com/repo/commit/${hash}`;
  }

  private convertMarkdownToHTML(markdown: string): string {
    // Simplified markdown to HTML conversion
    return markdown
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em>$1</em>')
      .replace(/^\- (.*$)/gim, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
      .replace(/\n/gim, '<br>');
  }

  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  // Mock implementations for various analysis methods
  private isInternalCommit(commit: CommitMessage): boolean {
    return (
      commit.type === 'chore' ||
      commit.subject.includes('[skip ci]') ||
      commit.subject.includes('[internal]')
    );
  }

  private findRelatedCommits(
    commit: CommitMessage,
    allCommits: CommitMessage[],
  ): CommitMessage[] {
    // Find fixup commits, reverts, etc.
    return allCommits.filter(
      (c) =>
        c.hash !== commit.hash &&
        (c.subject.includes(`fixup! ${commit.subject}`) ||
          c.subject.includes(`revert: ${commit.subject}`)),
    );
  }

  private async getCommitFileChanges(hash: string): Promise<{
    files: string[];
    additions: number;
    deletions: number;
  }> {
    try {
      const numstat = execSync(`git show --numstat ${hash}`, {
        cwd: this.workingDir,
        encoding: 'utf-8',
      });

      let additions = 0;
      let deletions = 0;
      const files: string[] = [];

      numstat.split('\n').forEach((line) => {
        const parts = line.split('\t');
        if (parts.length === 3) {
          additions += parseInt(parts[0]) || 0;
          deletions += parseInt(parts[1]) || 0;
          files.push(parts[2]);
        }
      });

      return { files, additions, deletions };
    } catch {
      return { files: [], additions: 0, deletions: 0 };
    }
  }

  private async analyzeCommitImpact(
    commit: CommitMessage,
    fileChanges: any,
  ): Promise<any> {
    // Mock implementation for impact analysis
    return {
      level: fileChanges.files.length > 5 ? 'high' : 'low',
      significance: commit.type === 'feat' ? 'high' : 'medium',
      complexity:
        fileChanges.files.length +
        (fileChanges.additions + fileChanges.deletions) / 100,
      riskLevel: commit.breakingChange ? 'high' : 'low',
      testCoverage: 85,
      affectedModules: [
        ...new Set(fileChanges.files.map((f: string) => f.split('/')[0])),
      ],
    };
  }

  private enhanceDescription(commit: CommitMessage, impact: any): string {
    let description = commit.body || commit.subject;

    if (impact.level === 'high') {
      description += ' (High impact change)';
    }

    return description;
  }

  private extractReferences(
    commit: CommitMessage,
  ): Array<{ type: string; id: string; url: string }> {
    const refs: Array<{ type: string; id: string; url: string }> = [];
    const message = commit.subject + ' ' + commit.body;

    // Extract issue references
    const issueMatches = message.match(/(closes?|fixes?|resolves?)\s+#(\d+)/gi);
    if (issueMatches) {
      for (const match of issueMatches) {
        const id = match.match(/#(\d+)/)?.[1];
        if (id) {
          refs.push({
            type: 'issue',
            id,
            url: `https://github.com/repo/issues/${id}`,
          });
        }
      }
    }

    return refs;
  }

  private async getCommitReviewers(hash: string): Promise<string[]> {
    // Mock implementation - would fetch PR reviewers
    return [];
  }

  private generateCommitTags(commit: CommitMessage, impact: any): string[] {
    const tags: string[] = [];

    if (commit.breakingChange) tags.push('breaking');
    if (impact.level === 'high') tags.push('high-impact');
    if (impact.riskLevel === 'high') tags.push('high-risk');
    if (commit.type === 'feat') tags.push('feature');
    if (commit.type === 'fix') tags.push('bugfix');

    return tags;
  }

  private getSignificanceWeight(significance: string): number {
    const weights: Record<string, number> = {
      critical: 5,
      high: 4,
      medium: 3,
      low: 2,
      minimal: 1,
    };
    return weights[significance] || 1;
  }

  private determineReleaseType(
    entries: ChangelogEntry[],
    breakingChanges: BreakingChange[],
  ): ReleaseType {
    if (breakingChanges.length > 0) return ReleaseType.MAJOR;
    if (entries.some((e) => e.type === 'feat')) return ReleaseType.MINOR;
    return ReleaseType.PATCH;
  }

  private generateReleaseTags(
    entries: ChangelogEntry[],
    impact: ReleaseImpact,
  ): string[] {
    const tags: string[] = [];

    if (impact.level === 'high') tags.push('major-release');
    if (entries.some((e) => e.type === 'perf')) tags.push('performance');
    if (entries.some((e) => e.type === 'feat')) tags.push('features');
    if (entries.some((e) => e.type === 'fix')) tags.push('bugfixes');
    if (entries.some((e) => e.breakingChange)) tags.push('breaking-changes');

    return tags;
  }

  private generateReleaseRecommendations(
    entries: ChangelogEntry[],
    impact: ReleaseImpact,
  ): string[] {
    const recommendations: string[] = [];

    if (impact.level === 'high') {
      recommendations.push('Test thoroughly before deploying to production');
      recommendations.push('Consider a phased rollout strategy');
    }

    if (impact.migrationEffort === 'high') {
      recommendations.push('Schedule dedicated time for migration');
      recommendations.push('Prepare rollback procedures');
    }

    if (entries.some((e) => e.type === 'perf')) {
      recommendations.push('Monitor performance metrics after deployment');
    }

    return recommendations;
  }

  private generateReleaseSummary(
    entries: ChangelogEntry[],
    impact: ReleaseImpact,
  ): string {
    const features = entries.filter((e) => e.type === 'feat').length;
    const fixes = entries.filter((e) => e.type === 'fix').length;
    const total = entries.length;

    let summary = `This release includes ${total} changes`;

    if (features > 0) {
      summary += ` with ${features} new feature${features !== 1 ? 's' : ''}`;
    }

    if (fixes > 0) {
      summary += `${features > 0 ? ' and' : ' with'} ${fixes} bug fix${fixes !== 1 ? 'es' : ''}`;
    }

    if (impact.level === 'high') {
      summary += '. This is a significant release with high impact changes.';
    } else {
      summary += '.';
    }

    return summary;
  }

  // Additional helper methods for metrics and analysis
  private calculateRiskScore(entries: ChangelogEntry[]): number {
    const riskFactors = entries.reduce((acc, e) => {
      if (e.breakingChange) acc += 3;
      if (e.impact === 'high') acc += 2;
      if (e.metadata.riskLevel === 'high') acc += 1;
      return acc;
    }, 0);

    return Math.min((riskFactors / entries.length) * 20, 100);
  }

  private calculateQualityScore(entries: ChangelogEntry[]): number {
    const qualityMetrics = entries.reduce((acc, e) => {
      acc += e.metadata.testCoverage || 0;
      return acc;
    }, 0);

    return qualityMetrics / entries.length;
  }

  private calculateDevelopmentVelocity(commits: CommitMessage[]): number {
    // Calculate commits per day over the release period
    if (commits.length < 2) return 0;

    const oldestCommit = commits[commits.length - 1].date;
    const newestCommit = commits[0].date;
    const daysDiff =
      (newestCommit.getTime() - oldestCommit.getTime()) / (1000 * 60 * 60 * 24);

    return daysDiff > 0 ? commits.length / daysDiff : commits.length;
  }

  // Mock implementations for advanced analytics
  private analyzeCommitFrequency(entries: ChangelogEntry[]): any {
    return { trend: 'stable', average: 2.5 };
  }

  private analyzeChangeTypes(entries: ChangelogEntry[]): any {
    const types = entries.reduce(
      (acc, e) => {
        acc[e.type] = (acc[e.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return { distribution: types, trend: 'more_features' };
  }

  private analyzeContributorActivity(contributors: ContributorInfo[]): any {
    return {
      newContributors: contributors.filter((c) => c.role === 'new').length,
      activeContributors: contributors.length,
      trend: 'increasing',
    };
  }

  private analyzeComplexityTrends(entries: ChangelogEntry[]): any {
    const avgComplexity =
      entries.reduce((acc, e) => acc + (e.metadata.complexity || 1), 0) /
      entries.length;
    return { average: avgComplexity, trend: 'stable' };
  }

  private analyzeQualityTrends(entries: ChangelogEntry[]): any {
    const avgQuality =
      entries.reduce((acc, e) => acc + (e.metadata.testCoverage || 80), 0) /
      entries.length;
    return { average: avgQuality, trend: 'improving' };
  }

  private identifyHottestComponents(entries: ChangelogEntry[]): string[] {
    const componentChanges = new Map<string, number>();

    entries.forEach((e) => {
      e.metadata.affectedModules?.forEach((module) => {
        componentChanges.set(module, (componentChanges.get(module) || 0) + 1);
      });
    });

    return Array.from(componentChanges.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([component]) => component);
  }

  private identifyQualityImprovements(entries: ChangelogEntry[]): string[] {
    return entries
      .filter((e) => e.type === 'test' || e.type === 'refactor')
      .map((e) => e.subject)
      .slice(0, 5);
  }

  private analyzeTechnicalDebt(entries: ChangelogEntry[]): any {
    const debtReduction = entries.filter(
      (e) =>
        e.type === 'refactor' ||
        e.subject.toLowerCase().includes('debt') ||
        e.subject.toLowerCase().includes('cleanup'),
    ).length;

    return {
      reductionEfforts: debtReduction,
      trend: debtReduction > 2 ? 'decreasing' : 'stable',
    };
  }

  private identifyRiskFactors(entries: ChangelogEntry[]): string[] {
    const risks: string[] = [];

    if (entries.some((e) => e.breakingChange)) {
      risks.push('Breaking changes present');
    }

    const highRiskChanges = entries.filter(
      (e) => e.metadata.riskLevel === 'high',
    ).length;
    if (highRiskChanges > 3) {
      risks.push(`${highRiskChanges} high-risk changes`);
    }

    return risks;
  }

  // Additional mock methods for comprehensive analytics
  private async compareToPreviousRelease(
    metrics: ReleaseMetrics,
  ): Promise<any> {
    return { changeInCommits: '+15%', changeInContributors: '+20%' };
  }

  private compareToAverage(metrics: ReleaseMetrics): any {
    return { commitsVsAverage: '+5%', qualityVsAverage: '+10%' };
  }

  private compareToBenchmarks(metrics: ReleaseMetrics): any {
    return { industryRanking: 'above_average' };
  }

  private predictNextReleaseSize(entries: ChangelogEntry[]): string {
    return entries.length > 20
      ? 'large'
      : entries.length > 10
        ? 'medium'
        : 'small';
  }

  private predictQualityTrend(entries: ChangelogEntry[]): string {
    const qualityChanges = entries.filter(
      (e) => e.type === 'test' || e.type === 'refactor',
    ).length;
    return qualityChanges > 3 ? 'improving' : 'stable';
  }

  private forecastRisk(entries: ChangelogEntry[]): string {
    const riskScore = this.calculateRiskScore(entries);
    return riskScore > 50 ? 'high' : riskScore > 25 ? 'medium' : 'low';
  }

  // Helper methods for release impact calculation
  private estimateAffectedUsers(
    level: ReleaseImpact['level'],
    entries: ChangelogEntry[],
  ): number {
    const baseUsers = 1000; // Mock base user count

    switch (level) {
      case 'high':
        return Math.floor(baseUsers * 0.8);
      case 'medium':
        return Math.floor(baseUsers * 0.4);
      case 'low':
        return Math.floor(baseUsers * 0.1);
      default:
        return 0;
    }
  }

  private estimateMigrationEffort(
    breakingChanges: BreakingChange[],
  ): 'none' | 'low' | 'medium' | 'high' {
    if (breakingChanges.length === 0) return 'none';
    if (breakingChanges.length <= 2) return 'low';
    if (breakingChanges.length <= 5) return 'medium';
    return 'high';
  }

  private assessReleaseRisk(
    entries: ChangelogEntry[],
    breakingChanges: BreakingChange[],
  ): 'low' | 'medium' | 'high' {
    const riskScore = this.calculateRiskScore(entries);
    if (breakingChanges.length > 0 || riskScore > 70) return 'high';
    if (riskScore > 30) return 'medium';
    return 'low';
  }

  private assessRollbackComplexity(
    entries: ChangelogEntry[],
  ): 'simple' | 'moderate' | 'complex' {
    const dbChanges = entries.filter((e) =>
      e.files.some((f) => f.includes('migration')),
    ).length;
    const schemaChanges = entries.filter((e) =>
      e.files.some((f) => f.includes('schema')),
    ).length;

    if (dbChanges > 0 || schemaChanges > 0) return 'complex';
    if (entries.length > 20) return 'moderate';
    return 'simple';
  }

  private assessCompatibility(
    entries: ChangelogEntry[],
    breakingChanges: BreakingChange[],
  ): {
    backward: boolean;
    forward: boolean;
    apiVersion: string;
  } {
    return {
      backward: breakingChanges.length === 0,
      forward: true, // Assume forward compatibility unless breaking changes
      apiVersion: breakingChanges.length > 0 ? 'v2' : 'v1',
    };
  }

  // Template and footer parsing helpers
  private parseFooters(body: string): Record<string, string> {
    const footers: Record<string, string> = {};
    const footerRegex = /^([A-Za-z-]+): (.+)$/gm;
    let match;

    while ((match = footerRegex.exec(body)) !== null) {
      footers[match[1]] = match[2];
    }

    return footers;
  }

  private parseReferences(
    message: string,
  ): Array<{ type: string; id: string; url: string }> {
    const refs: Array<{ type: string; id: string; url: string }> = [];

    // Parse various reference patterns
    const patterns = [
      { pattern: /(closes?|fixes?|resolves?)\s+#(\d+)/gi, type: 'closes' },
      { pattern: /(refs?|references?)\s+#(\d+)/gi, type: 'references' },
      { pattern: /(relates? to|see also)\s+#(\d+)/gi, type: 'related' },
    ];

    patterns.forEach(({ pattern, type }) => {
      let match;
      pattern.lastIndex = 0; // Reset regex
      while ((match = pattern.exec(message)) !== null) {
        const id = match[2];
        refs.push({
          type,
          id,
          url: this.generateReferenceUrl(type, id),
        });
      }
    });

    return refs;
  }

  private generateReferenceUrl(type: string, id: string): string {
    // Mock implementation - would generate actual URLs based on repository
    return `https://github.com/repo/issues/${id}`;
  }

  private extractMigrationInfo(body: string): string | undefined {
    const migrationMatch = body.match(/MIGRATION:\s*(.+)/i);
    return migrationMatch?.[1];
  }

  private async getLastReleaseTag(): Promise<string | null> {
    try {
      return execSync('git describe --tags --abbrev=0', {
        cwd: this.workingDir,
        encoding: 'utf-8',
      }).trim();
    } catch {
      return null;
    }
  }

  private async getPreviousVersion(
    currentVersion: string,
  ): Promise<string | null> {
    try {
      const tags = execSync('git tag --sort=-version:refname', {
        cwd: this.workingDir,
        encoding: 'utf-8',
      })
        .trim()
        .split('\n');

      const currentIndex = tags.indexOf(currentVersion);
      return currentIndex > 0 ? tags[currentIndex + 1] : null;
    } catch {
      return null;
    }
  }

  /**
   * Initialize default changelog templates
   */
  private initializeDefaultTemplates(): void {
    this.templates.set('default', {
      name: 'Default Template',
      description: 'Standard changelog template',
      header:
        '# Changelog - {{version}}\n\n**Release Date**: {{date}}\n\n{{summary}}',
      sections: {
        breaking: '## 💥 BREAKING CHANGES',
        features: '## ✨ Features',
        fixes: '## 🐛 Bug Fixes',
        docs: '## 📚 Documentation',
        refactor: '## 📦 Code Refactoring',
        perf: '## 🚀 Performance',
        test: '## 🚨 Tests',
        chore: '## ♻️ Chores',
      },
      footer: '\n---\n\nGenerated on {{date}} for version {{version}}',
    });

    this.templates.set('minimal', {
      name: 'Minimal Template',
      description: 'Minimal changelog template',
      header: '## {{version}} ({{date}})\n\n{{summary}}',
      sections: {
        features: '### Features',
        fixes: '### Bug Fixes',
        other: '### Other Changes',
      },
      footer: '',
    });

    this.templates.set('detailed', {
      name: 'Detailed Template',
      description: 'Comprehensive changelog template',
      header:
        '# Release {{version}}\n\n**Date**: {{date}}\n**Summary**: {{summary}}\n',
      sections: {
        highlights: '## 🌟 Release Highlights',
        breaking: '## 💥 BREAKING CHANGES',
        features: '## ✨ New Features',
        fixes: '## 🐛 Bug Fixes',
        improvements: '## 🔧 Improvements',
        performance: '## 🚀 Performance',
        security: '## 🔒 Security',
        docs: '## 📚 Documentation',
        refactor: '## 📦 Refactoring',
        test: '## 🚨 Testing',
        build: '## 🛠 Build System',
        ci: '## ⚙️ CI/CD',
        chore: '## ♻️ Maintenance',
      },
      footer:
        '\n\n---\n\n**Full Changelog**: [{{version}}]({{compareUrl}})\n\n*This release was generated automatically on {{date}}*',
    });
  }
}
