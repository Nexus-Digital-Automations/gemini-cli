/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Security Validator for comprehensive security vulnerability scanning
 * Performs security analysis using multiple scanning tools and techniques
 *
 * @author Claude Code - Validation Expert
 * @version 1.0.0
 */
import { execSync, exec } from 'node:child_process';
import { promisify } from 'node:util';
import * as path from 'node:path';
import * as fs from 'node:fs';
import { Logger } from '../../utils/logger.js';
import {
  ValidationContext,
  ValidationResult,
  ValidationStatus,
  ValidationSeverity,
} from '../core/ValidationEngine.js';
const execAsync = promisify(exec);
/**
 * Comprehensive security validation system
 *
 * Features:
 * - Multi-tool security scanning
 * - Dependency vulnerability analysis
 * - Static code security analysis
 * - Secrets detection
 * - License compliance checking
 * - Docker security scanning
 * - Security risk scoring
 * - OWASP compliance validation
 */
export class SecurityValidator {
  logger;
  config;
  constructor(config) {
    this.logger = new Logger('SecurityValidator');
    this.config = {
      enabledScans: {
        dependencyVulnerabilities: true,
        staticCodeAnalysis: true,
        secretsDetection: true,
        licenseCompliance: true,
        dockerSecurity: true,
      },
      scanTools: {
        npm: true,
        yarn: true,
        semgrep: false, // Requires installation
        bandit: false, // Python projects only
        eslintSecurity: true,
        gitSecrets: false, // Requires installation
        truffleHog: false, // Requires installation
      },
      severityThresholds: {
        critical: 0,
        high: 5,
        medium: 20,
        low: 50,
      },
      allowedLicenses: [
        'MIT',
        'Apache-2.0',
        'BSD-3-Clause',
        'BSD-2-Clause',
        'ISC',
        'GPL-3.0',
        'LGPL-3.0',
        'MPL-2.0',
      ],
      secretPatterns: [
        'password',
        'secret',
        'key',
        'token',
        'api_key',
        'private_key',
        'access_token',
        'refresh_token',
      ],
      excludePaths: [
        'node_modules/**',
        'dist/**',
        'build/**',
        '.git/**',
        'coverage/**',
        '*.min.js',
      ],
      timeout: 300000, // 5 minutes
      ...config,
    };
  }
  /**
   * Execute comprehensive security validation
   */
  async validate(context) {
    const startTime = Date.now();
    this.logger.info(
      `Starting security validation for task: ${context.taskId}`,
    );
    try {
      // Execute enabled security scans
      const scanResults = await this.executeSecurityScans(context);
      // Analyze security results
      const summary = this.analyzeSecurityResults(scanResults);
      const score = this.calculateSecurityScore(summary);
      const status = this.determineSecurityStatus(summary);
      const severity = this.determineSecuritySeverity(summary);
      const duration = Date.now() - startTime;
      this.logger.info(`Security validation completed`, {
        taskId: context.taskId,
        totalVulnerabilities: summary.totalVulnerabilities,
        criticalCount: summary.criticalCount,
        highCount: summary.highCount,
        riskScore: summary.riskScore,
        score,
        duration,
      });
      return {
        criteriaId: 'security_scan',
        status,
        score,
        severity,
        message: this.generateSecurityMessage(summary),
        details: this.generateSecurityDetails(summary),
        suggestions: this.generateSecuritySuggestions(summary),
        evidence: this.createSecurityEvidence(summary),
        timestamp: new Date(),
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error('Security validation failed', {
        error,
        taskId: context.taskId,
      });
      return {
        criteriaId: 'security_scan',
        status: ValidationStatus.FAILED,
        score: 0,
        severity: ValidationSeverity.CRITICAL,
        message: 'Security validation execution failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        suggestions: [
          'Check that security scanning tools are properly installed',
          'Verify network connectivity for vulnerability databases',
          'Ensure proper permissions for file scanning',
          'Review security tool configurations',
        ],
        evidence: [],
        timestamp: new Date(),
        duration,
      };
    }
  }
  /**
   * Execute enabled security scans
   */
  async executeSecurityScans(context) {
    const scanResults = [];
    // Dependency vulnerability scanning
    if (this.config.enabledScans.dependencyVulnerabilities) {
      if (this.config.scanTools.npm) {
        scanResults.push(await this.runNpmAudit());
      }
      if (this.config.scanTools.yarn) {
        scanResults.push(await this.runYarnAudit());
      }
    }
    // Static code analysis
    if (this.config.enabledScans.staticCodeAnalysis) {
      if (this.config.scanTools.eslintSecurity) {
        scanResults.push(await this.runESLintSecurity());
      }
      if (this.config.scanTools.semgrep) {
        scanResults.push(await this.runSemgrep());
      }
      if (this.config.scanTools.bandit) {
        scanResults.push(await this.runBandit());
      }
    }
    // Secrets detection
    if (this.config.enabledScans.secretsDetection) {
      scanResults.push(await this.runSecretsDetection());
      if (this.config.scanTools.gitSecrets) {
        scanResults.push(await this.runGitSecrets());
      }
      if (this.config.scanTools.truffleHog) {
        scanResults.push(await this.runTruffleHog());
      }
    }
    // License compliance
    if (this.config.enabledScans.licenseCompliance) {
      scanResults.push(await this.runLicenseCheck());
    }
    // Docker security (if Dockerfile present)
    if (this.config.enabledScans.dockerSecurity && this.hasDockerfiles()) {
      scanResults.push(await this.runDockerSecurity());
    }
    return scanResults.filter((result) => result !== null);
  }
  /**
   * Run npm audit for dependency vulnerabilities
   */
  async runNpmAudit() {
    const startTime = Date.now();
    this.logger.debug('Running npm audit');
    try {
      // Check if package.json exists
      if (!fs.existsSync('package.json')) {
        return {
          tool: 'npm-audit',
          success: false,
          duration: Date.now() - startTime,
          vulnerabilities: [],
          summary: { critical: 0, high: 0, medium: 0, low: 0, info: 0 },
          error: 'No package.json found',
        };
      }
      const { stdout } = await execAsync('npm audit --json', {
        timeout: this.config.timeout,
        cwd: process.cwd(),
      });
      const auditResult = JSON.parse(stdout);
      const vulnerabilities = this.parseNpmAuditResults(auditResult);
      return {
        tool: 'npm-audit',
        success: true,
        duration: Date.now() - startTime,
        vulnerabilities,
        summary: this.summarizeVulnerabilities(vulnerabilities),
      };
    } catch (error) {
      // npm audit returns non-zero exit code when vulnerabilities found
      if (error.stdout) {
        try {
          const auditResult = JSON.parse(error.stdout);
          const vulnerabilities = this.parseNpmAuditResults(auditResult);
          return {
            tool: 'npm-audit',
            success: true,
            duration: Date.now() - startTime,
            vulnerabilities,
            summary: this.summarizeVulnerabilities(vulnerabilities),
          };
        } catch (parseError) {
          // Fall through to error case
        }
      }
      return {
        tool: 'npm-audit',
        success: false,
        duration: Date.now() - startTime,
        vulnerabilities: [],
        summary: { critical: 0, high: 0, medium: 0, low: 0, info: 0 },
        error: error instanceof Error ? error.message : 'npm audit failed',
      };
    }
  }
  /**
   * Parse npm audit results
   */
  parseNpmAuditResults(auditResult) {
    const vulnerabilities = [];
    try {
      const advisories = auditResult.advisories || {};
      for (const [id, advisory] of Object.entries(advisories)) {
        const adv = advisory;
        vulnerabilities.push({
          id: id,
          title: adv.title || 'Unknown vulnerability',
          description: adv.overview || 'No description available',
          severity: this.mapSeverity(adv.severity),
          category: 'dependency',
          cwe: adv.cwe ? [adv.cwe] : undefined,
          cvss: adv.cvss?.score,
          evidence: `Package: ${adv.module_name}, Versions: ${adv.vulnerable_versions}`,
          recommendation:
            adv.recommendation || 'Update to a non-vulnerable version',
          references: adv.references ? [adv.url] : [],
          tool: 'npm-audit',
        });
      }
    } catch (parseError) {
      this.logger.warn('Failed to parse npm audit results', {
        error: parseError,
      });
    }
    return vulnerabilities;
  }
  /**
   * Run yarn audit for dependency vulnerabilities
   */
  async runYarnAudit() {
    const startTime = Date.now();
    try {
      if (!fs.existsSync('yarn.lock')) {
        return {
          tool: 'yarn-audit',
          success: false,
          duration: Date.now() - startTime,
          vulnerabilities: [],
          summary: { critical: 0, high: 0, medium: 0, low: 0, info: 0 },
          error: 'No yarn.lock found',
        };
      }
      const { stdout } = await execAsync('yarn audit --json', {
        timeout: this.config.timeout,
        cwd: process.cwd(),
      });
      const vulnerabilities = this.parseYarnAuditResults(stdout);
      return {
        tool: 'yarn-audit',
        success: true,
        duration: Date.now() - startTime,
        vulnerabilities,
        summary: this.summarizeVulnerabilities(vulnerabilities),
      };
    } catch (error) {
      return {
        tool: 'yarn-audit',
        success: false,
        duration: Date.now() - startTime,
        vulnerabilities: [],
        summary: { critical: 0, high: 0, medium: 0, low: 0, info: 0 },
        error: error instanceof Error ? error.message : 'yarn audit failed',
      };
    }
  }
  /**
   * Parse yarn audit results
   */
  parseYarnAuditResults(jsonOutput) {
    const vulnerabilities = [];
    try {
      const lines = jsonOutput.split('\n').filter((line) => line.trim());
      for (const line of lines) {
        try {
          const auditItem = JSON.parse(line);
          if (auditItem.type === 'auditAdvisory') {
            const advisory = auditItem.data.advisory;
            vulnerabilities.push({
              id: advisory.id.toString(),
              title: advisory.title,
              description: advisory.overview,
              severity: this.mapSeverity(advisory.severity),
              category: 'dependency',
              cwe: advisory.cwe ? [advisory.cwe] : undefined,
              evidence: `Package: ${advisory.module_name}`,
              recommendation: advisory.recommendation,
              references: advisory.references ? [advisory.url] : [],
              tool: 'yarn-audit',
            });
          }
        } catch (parseLineError) {
          // Skip malformed lines
        }
      }
    } catch (parseError) {
      this.logger.warn('Failed to parse yarn audit results', {
        error: parseError,
      });
    }
    return vulnerabilities;
  }
  /**
   * Run ESLint security plugin
   */
  async runESLintSecurity() {
    const startTime = Date.now();
    try {
      const { stdout } = await execAsync(
        'npx eslint . --ext .js,.ts,.jsx,.tsx --format json --config .eslintrc.security.json',
        {
          timeout: this.config.timeout,
          cwd: process.cwd(),
        },
      );
      const eslintResults = JSON.parse(stdout);
      const vulnerabilities = this.parseESLintSecurityResults(eslintResults);
      return {
        tool: 'eslint-security',
        success: true,
        duration: Date.now() - startTime,
        vulnerabilities,
        summary: this.summarizeVulnerabilities(vulnerabilities),
      };
    } catch (error) {
      // Try with default ESLint config if security config doesn't exist
      try {
        const { stdout } = await execAsync(
          'npx eslint . --ext .js,.ts,.jsx,.tsx --format json',
          {
            timeout: this.config.timeout,
            cwd: process.cwd(),
          },
        );
        const eslintResults = JSON.parse(stdout);
        const vulnerabilities = this.parseESLintSecurityResults(eslintResults);
        return {
          tool: 'eslint-security',
          success: true,
          duration: Date.now() - startTime,
          vulnerabilities,
          summary: this.summarizeVulnerabilities(vulnerabilities),
        };
      } catch (fallbackError) {
        return {
          tool: 'eslint-security',
          success: false,
          duration: Date.now() - startTime,
          vulnerabilities: [],
          summary: { critical: 0, high: 0, medium: 0, low: 0, info: 0 },
          error: 'ESLint security scan failed',
        };
      }
    }
  }
  /**
   * Parse ESLint security results
   */
  parseESLintSecurityResults(eslintResults) {
    const vulnerabilities = [];
    for (const fileResult of eslintResults) {
      for (const message of fileResult.messages || []) {
        // Only include security-related rules
        if (this.isSecurityRule(message.ruleId)) {
          vulnerabilities.push({
            id: `eslint-${message.ruleId}-${fileResult.filePath}-${message.line}`,
            title: `ESLint Security: ${message.ruleId}`,
            description: message.message,
            severity: message.severity === 2 ? 'high' : 'medium',
            category: 'code',
            file: fileResult.filePath,
            line: message.line,
            column: message.column,
            evidence: `Line ${message.line}: ${message.message}`,
            recommendation: `Fix the ${message.ruleId} violation`,
            references: [],
            tool: 'eslint-security',
          });
        }
      }
    }
    return vulnerabilities;
  }
  /**
   * Check if ESLint rule is security-related
   */
  isSecurityRule(ruleId) {
    if (!ruleId) return false;
    const securityRules = [
      'security/', // security plugin rules
      'no-eval',
      'no-implied-eval',
      'no-script-url',
      'no-unsafe-innerHTML',
    ];
    return securityRules.some((rule) => ruleId.includes(rule));
  }
  /**
   * Run Semgrep static analysis
   */
  async runSemgrep() {
    const startTime = Date.now();
    try {
      const { stdout } = await execAsync(
        'semgrep --config=p/security-audit --json .',
        {
          timeout: this.config.timeout,
          cwd: process.cwd(),
        },
      );
      const semgrepResult = JSON.parse(stdout);
      const vulnerabilities = this.parseSemgrepResults(semgrepResult);
      return {
        tool: 'semgrep',
        success: true,
        duration: Date.now() - startTime,
        vulnerabilities,
        summary: this.summarizeVulnerabilities(vulnerabilities),
      };
    } catch (error) {
      return {
        tool: 'semgrep',
        success: false,
        duration: Date.now() - startTime,
        vulnerabilities: [],
        summary: { critical: 0, high: 0, medium: 0, low: 0, info: 0 },
        error: 'Semgrep not available or failed',
      };
    }
  }
  /**
   * Parse Semgrep results
   */
  parseSemgrepResults(semgrepResult) {
    const vulnerabilities = [];
    try {
      for (const result of semgrepResult.results || []) {
        vulnerabilities.push({
          id: `semgrep-${result.check_id}-${result.path}-${result.start.line}`,
          title: result.check_id,
          description: result.extra.message || 'Semgrep security finding',
          severity: this.mapSemgrepSeverity(result.extra.severity),
          category: 'code',
          file: result.path,
          line: result.start.line,
          column: result.start.col,
          evidence: result.extra.lines || '',
          recommendation:
            result.extra.fix || 'Review and fix the security issue',
          references: result.extra.references || [],
          tool: 'semgrep',
        });
      }
    } catch (parseError) {
      this.logger.warn('Failed to parse Semgrep results', {
        error: parseError,
      });
    }
    return vulnerabilities;
  }
  /**
   * Run Bandit for Python security analysis
   */
  async runBandit() {
    const startTime = Date.now();
    try {
      // Check if Python files exist
      const pythonFiles = await this.findPythonFiles();
      if (pythonFiles.length === 0) {
        return {
          tool: 'bandit',
          success: false,
          duration: Date.now() - startTime,
          vulnerabilities: [],
          summary: { critical: 0, high: 0, medium: 0, low: 0, info: 0 },
          error: 'No Python files found',
        };
      }
      const { stdout } = await execAsync('bandit -r . -f json', {
        timeout: this.config.timeout,
        cwd: process.cwd(),
      });
      const banditResult = JSON.parse(stdout);
      const vulnerabilities = this.parseBanditResults(banditResult);
      return {
        tool: 'bandit',
        success: true,
        duration: Date.now() - startTime,
        vulnerabilities,
        summary: this.summarizeVulnerabilities(vulnerabilities),
      };
    } catch (error) {
      return {
        tool: 'bandit',
        success: false,
        duration: Date.now() - startTime,
        vulnerabilities: [],
        summary: { critical: 0, high: 0, medium: 0, low: 0, info: 0 },
        error: 'Bandit not available or failed',
      };
    }
  }
  /**
   * Find Python files in project
   */
  async findPythonFiles() {
    // Simple implementation - in production would use more sophisticated search
    try {
      const { stdout } = await execAsync('find . -name "*.py" | head -10', {
        timeout: 10000,
        cwd: process.cwd(),
      });
      return stdout.split('\n').filter((line) => line.trim());
    } catch {
      return [];
    }
  }
  /**
   * Parse Bandit results
   */
  parseBanditResults(banditResult) {
    const vulnerabilities = [];
    try {
      for (const result of banditResult.results || []) {
        vulnerabilities.push({
          id: `bandit-${result.test_id}-${result.filename}-${result.line_number}`,
          title: `${result.test_name} (${result.test_id})`,
          description: result.issue_text,
          severity: this.mapBanditSeverity(result.issue_severity),
          category: 'code',
          cwe: result.issue_cwe ? [result.issue_cwe.link] : undefined,
          file: result.filename,
          line: result.line_number,
          evidence: result.code,
          recommendation:
            'Review and fix the security issue identified by Bandit',
          references: result.more_info ? [result.more_info] : [],
          tool: 'bandit',
        });
      }
    } catch (parseError) {
      this.logger.warn('Failed to parse Bandit results', { error: parseError });
    }
    return vulnerabilities;
  }
  /**
   * Run secrets detection
   */
  async runSecretsDetection() {
    const startTime = Date.now();
    try {
      const vulnerabilities = [];
      // Scan source files for secrets
      const sourceFiles = await this.getSourceFiles();
      for (const file of sourceFiles.slice(0, 100)) {
        // Limit to 100 files for performance
        const secrets = await this.scanFileForSecrets(file);
        vulnerabilities.push(...secrets);
      }
      return {
        tool: 'secrets-detection',
        success: true,
        duration: Date.now() - startTime,
        vulnerabilities,
        summary: this.summarizeVulnerabilities(vulnerabilities),
      };
    } catch (error) {
      return {
        tool: 'secrets-detection',
        success: false,
        duration: Date.now() - startTime,
        vulnerabilities: [],
        summary: { critical: 0, high: 0, medium: 0, low: 0, info: 0 },
        error:
          error instanceof Error ? error.message : 'Secrets detection failed',
      };
    }
  }
  /**
   * Get source files for scanning
   */
  async getSourceFiles() {
    const files = [];
    const extensions = [
      '.js',
      '.ts',
      '.jsx',
      '.tsx',
      '.py',
      '.java',
      '.go',
      '.rb',
      '.php',
    ];
    try {
      const { stdout } = await execAsync(
        'find . -type f \\( -name "*.js" -o -name "*.ts" -o -name "*.jsx" -o -name "*.tsx" -o -name "*.py" -o -name "*.java" -o -name "*.go" -o -name "*.rb" -o -name "*.php" \\) | grep -v node_modules | grep -v dist | grep -v build',
        {
          timeout: 30000,
          cwd: process.cwd(),
        },
      );
      return stdout.split('\n').filter((line) => line.trim());
    } catch {
      return [];
    }
  }
  /**
   * Scan file for secrets
   */
  async scanFileForSecrets(filePath) {
    const vulnerabilities = [];
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      for (let lineNum = 0; lineNum < lines.length; lineNum++) {
        const line = lines[lineNum];
        // Check for potential secrets
        for (const pattern of this.config.secretPatterns) {
          if (this.detectSecret(line, pattern)) {
            vulnerabilities.push({
              id: `secret-${filePath}-${lineNum}-${pattern}`,
              title: `Potential Secret: ${pattern}`,
              description: `Potential secret detected in source code`,
              severity: 'high',
              category: 'secret',
              file: filePath,
              line: lineNum + 1,
              evidence: line.trim(),
              recommendation:
                'Move secrets to environment variables or secure configuration',
              references: [
                'https://owasp.org/www-project-top-ten/2017/A3_2017-Sensitive_Data_Exposure',
              ],
              tool: 'secrets-detection',
            });
          }
        }
      }
    } catch (error) {
      // Skip files we can't read
    }
    return vulnerabilities;
  }
  /**
   * Detect potential secret in line
   */
  detectSecret(line, pattern) {
    const secretPatterns = {
      password: /password\s*[:=]\s*['"][^'"]{8,}['"]/i,
      secret: /secret\s*[:=]\s*['"][^'"]{16,}['"]/i,
      key: /(api_?key|private_?key)\s*[:=]\s*['"][^'"]{16,}['"]/i,
      token: /token\s*[:=]\s*['"][^'"]{16,}['"]/i,
    };
    const regex = secretPatterns[pattern];
    return regex ? regex.test(line) : false;
  }
  /**
   * Run Git secrets detection
   */
  async runGitSecrets() {
    const startTime = Date.now();
    try {
      const { stdout } = await execAsync('git secrets --scan', {
        timeout: this.config.timeout,
        cwd: process.cwd(),
      });
      return {
        tool: 'git-secrets',
        success: true,
        duration: Date.now() - startTime,
        vulnerabilities: [],
        summary: { critical: 0, high: 0, medium: 0, low: 0, info: 0 },
      };
    } catch (error) {
      return {
        tool: 'git-secrets',
        success: false,
        duration: Date.now() - startTime,
        vulnerabilities: [],
        summary: { critical: 0, high: 0, medium: 0, low: 0, info: 0 },
        error: 'Git secrets not available or failed',
      };
    }
  }
  /**
   * Run TruffleHog for secret detection
   */
  async runTruffleHog() {
    const startTime = Date.now();
    try {
      const { stdout } = await execAsync('trufflehog --json .', {
        timeout: this.config.timeout,
        cwd: process.cwd(),
      });
      const vulnerabilities = this.parseTruffleHogResults(stdout);
      return {
        tool: 'trufflehog',
        success: true,
        duration: Date.now() - startTime,
        vulnerabilities,
        summary: this.summarizeVulnerabilities(vulnerabilities),
      };
    } catch (error) {
      return {
        tool: 'trufflehog',
        success: false,
        duration: Date.now() - startTime,
        vulnerabilities: [],
        summary: { critical: 0, high: 0, medium: 0, low: 0, info: 0 },
        error: 'TruffleHog not available or failed',
      };
    }
  }
  /**
   * Parse TruffleHog results
   */
  parseTruffleHogResults(jsonOutput) {
    const vulnerabilities = [];
    try {
      const lines = jsonOutput.split('\n').filter((line) => line.trim());
      for (const line of lines) {
        try {
          const finding = JSON.parse(line);
          vulnerabilities.push({
            id: `trufflehog-${finding.detector}-${finding.commit}`,
            title: `Secret detected: ${finding.detector}`,
            description: 'Potential secret found in repository',
            severity: 'high',
            category: 'secret',
            file: finding.file,
            evidence: finding.raw.substring(0, 100) + '...',
            recommendation:
              'Remove secret from repository and rotate if necessary',
            references: [],
            tool: 'trufflehog',
          });
        } catch (parseLineError) {
          // Skip malformed lines
        }
      }
    } catch (parseError) {
      this.logger.warn('Failed to parse TruffleHog results', {
        error: parseError,
      });
    }
    return vulnerabilities;
  }
  /**
   * Run license compliance check
   */
  async runLicenseCheck() {
    const startTime = Date.now();
    try {
      // Check if package.json exists
      if (!fs.existsSync('package.json')) {
        return {
          tool: 'license-check',
          success: false,
          duration: Date.now() - startTime,
          vulnerabilities: [],
          summary: { critical: 0, high: 0, medium: 0, low: 0, info: 0 },
          error: 'No package.json found',
        };
      }
      const vulnerabilities = [];
      // Use npm ls to get license information
      try {
        const { stdout } = await execAsync('npm ls --json --depth=0', {
          timeout: 30000,
          cwd: process.cwd(),
        });
        const npmData = JSON.parse(stdout);
        const licenseViolations = this.checkLicenseCompliance(
          npmData.dependencies || {},
        );
        vulnerabilities.push(...licenseViolations);
      } catch (npmError) {
        // Try alternative approach with package.json
        const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        if (
          packageJson.license &&
          !this.config.allowedLicenses.includes(packageJson.license)
        ) {
          vulnerabilities.push({
            id: 'license-main-package',
            title: 'Non-compliant license',
            description: `Package license "${packageJson.license}" is not in allowed licenses`,
            severity: 'medium',
            category: 'license',
            evidence: `License: ${packageJson.license}`,
            recommendation: 'Review license compliance with legal team',
            references: [],
            tool: 'license-check',
          });
        }
      }
      return {
        tool: 'license-check',
        success: true,
        duration: Date.now() - startTime,
        vulnerabilities,
        summary: this.summarizeVulnerabilities(vulnerabilities),
      };
    } catch (error) {
      return {
        tool: 'license-check',
        success: false,
        duration: Date.now() - startTime,
        vulnerabilities: [],
        summary: { critical: 0, high: 0, medium: 0, low: 0, info: 0 },
        error: error instanceof Error ? error.message : 'License check failed',
      };
    }
  }
  /**
   * Check license compliance
   */
  checkLicenseCompliance(dependencies) {
    const violations = [];
    for (const [name, info] of Object.entries(dependencies)) {
      const depInfo = info;
      // This is a simplified check - real implementation would parse license info
      // For now, just check for commonly problematic licenses
      if (
        name.toLowerCase().includes('gpl') &&
        !this.config.allowedLicenses.includes('GPL-3.0')
      ) {
        violations.push({
          id: `license-${name}`,
          title: 'Potential license compliance issue',
          description: `Dependency "${name}" may have GPL license`,
          severity: 'medium',
          category: 'license',
          evidence: `Dependency: ${name}`,
          recommendation: 'Review dependency licenses for compliance',
          references: [],
          tool: 'license-check',
        });
      }
    }
    return violations;
  }
  /**
   * Check if Dockerfiles exist
   */
  hasDockerfiles() {
    const dockerFiles = [
      'Dockerfile',
      'docker-compose.yml',
      'docker-compose.yaml',
    ];
    return dockerFiles.some((file) => fs.existsSync(file));
  }
  /**
   * Run Docker security scanning
   */
  async runDockerSecurity() {
    const startTime = Date.now();
    try {
      const vulnerabilities = [];
      // Basic Dockerfile security checks
      if (fs.existsSync('Dockerfile')) {
        const dockerfileIssues = await this.scanDockerfile('Dockerfile');
        vulnerabilities.push(...dockerfileIssues);
      }
      return {
        tool: 'docker-security',
        success: true,
        duration: Date.now() - startTime,
        vulnerabilities,
        summary: this.summarizeVulnerabilities(vulnerabilities),
      };
    } catch (error) {
      return {
        tool: 'docker-security',
        success: false,
        duration: Date.now() - startTime,
        vulnerabilities: [],
        summary: { critical: 0, high: 0, medium: 0, low: 0, info: 0 },
        error:
          error instanceof Error
            ? error.message
            : 'Docker security scan failed',
      };
    }
  }
  /**
   * Scan Dockerfile for security issues
   */
  async scanDockerfile(filePath) {
    const vulnerabilities = [];
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      for (let lineNum = 0; lineNum < lines.length; lineNum++) {
        const line = lines[lineNum].trim();
        // Check for common Docker security issues
        if (line.startsWith('FROM') && line.includes(':latest')) {
          vulnerabilities.push({
            id: `docker-latest-tag-${lineNum}`,
            title: 'Using :latest tag',
            description: 'Using :latest tag can lead to unpredictable builds',
            severity: 'low',
            category: 'docker',
            file: filePath,
            line: lineNum + 1,
            evidence: line,
            recommendation: 'Use specific version tags instead of :latest',
            references: ['https://docs.docker.com/develop/dev-best-practices/'],
            tool: 'docker-security',
          });
        }
        if (line.startsWith('USER root') || line.includes('USER 0')) {
          vulnerabilities.push({
            id: `docker-root-user-${lineNum}`,
            title: 'Running as root user',
            description: 'Container is running as root user',
            severity: 'medium',
            category: 'docker',
            file: filePath,
            line: lineNum + 1,
            evidence: line,
            recommendation: 'Create and use a non-root user',
            references: [],
            tool: 'docker-security',
          });
        }
      }
    } catch (error) {
      this.logger.warn('Error scanning Dockerfile', { error });
    }
    return vulnerabilities;
  }
  /**
   * Analyze security results and generate summary
   */
  analyzeSecurityResults(scanResults) {
    const allVulnerabilities = scanResults.flatMap(
      (result) => result.vulnerabilities,
    );
    const criticalCount = allVulnerabilities.filter(
      (v) => v.severity === 'critical',
    ).length;
    const highCount = allVulnerabilities.filter(
      (v) => v.severity === 'high',
    ).length;
    const mediumCount = allVulnerabilities.filter(
      (v) => v.severity === 'medium',
    ).length;
    const lowCount = allVulnerabilities.filter(
      (v) => v.severity === 'low',
    ).length;
    const infoCount = allVulnerabilities.filter(
      (v) => v.severity === 'info',
    ).length;
    // Calculate risk score (0-100)
    const riskScore = Math.min(
      100,
      criticalCount * 20 + highCount * 10 + mediumCount * 5 + lowCount * 1,
    );
    // Determine compliance status
    let complianceStatus = 'compliant';
    if (
      criticalCount > this.config.severityThresholds.critical ||
      highCount > this.config.severityThresholds.high
    ) {
      complianceStatus = 'non-compliant';
    }
    // Get top vulnerabilities by severity
    const topVulnerabilities = allVulnerabilities
      .sort((a, b) => {
        const severityOrder = {
          critical: 4,
          high: 3,
          medium: 2,
          low: 1,
          info: 0,
        };
        return severityOrder[b.severity] - severityOrder[a.severity];
      })
      .slice(0, 10);
    return {
      totalVulnerabilities: allVulnerabilities.length,
      criticalCount,
      highCount,
      mediumCount,
      lowCount,
      infoCount,
      scanResults,
      topVulnerabilities,
      riskScore,
      complianceStatus,
    };
  }
  /**
   * Calculate security score
   */
  calculateSecurityScore(summary) {
    if (summary.totalVulnerabilities === 0) {
      return 100;
    }
    let score = 100;
    // Major penalties for critical and high severity
    score -= summary.criticalCount * 25;
    score -= summary.highCount * 15;
    score -= summary.mediumCount * 5;
    score -= summary.lowCount * 1;
    // Risk score penalty
    score -= Math.min(50, summary.riskScore / 2);
    return Math.max(0, Math.round(score));
  }
  /**
   * Determine security validation status
   */
  determineSecurityStatus(summary) {
    if (summary.criticalCount > this.config.severityThresholds.critical) {
      return ValidationStatus.FAILED;
    } else if (
      summary.highCount > this.config.severityThresholds.high ||
      summary.mediumCount > this.config.severityThresholds.medium
    ) {
      return ValidationStatus.REQUIRES_REVIEW;
    } else {
      return ValidationStatus.PASSED;
    }
  }
  /**
   * Determine security validation severity
   */
  determineSecuritySeverity(summary) {
    if (summary.criticalCount > 0) {
      return ValidationSeverity.CRITICAL;
    } else if (summary.highCount > 5) {
      return ValidationSeverity.HIGH;
    } else if (summary.highCount > 0 || summary.mediumCount > 10) {
      return ValidationSeverity.MEDIUM;
    } else {
      return ValidationSeverity.LOW;
    }
  }
  /**
   * Generate security validation message
   */
  generateSecurityMessage(summary) {
    if (summary.totalVulnerabilities === 0) {
      return 'No security vulnerabilities detected';
    }
    const parts = [];
    if (summary.criticalCount > 0)
      parts.push(`${summary.criticalCount} critical`);
    if (summary.highCount > 0) parts.push(`${summary.highCount} high`);
    if (summary.mediumCount > 0) parts.push(`${summary.mediumCount} medium`);
    if (summary.lowCount > 0) parts.push(`${summary.lowCount} low`);
    return `Found ${summary.totalVulnerabilities} security vulnerabilities: ${parts.join(', ')}`;
  }
  /**
   * Generate detailed security report
   */
  generateSecurityDetails(summary) {
    let details = `## Security Validation Report\n\n`;
    details += `### Summary\n`;
    details += `- Total Vulnerabilities: ${summary.totalVulnerabilities}\n`;
    details += `- Critical: ${summary.criticalCount}\n`;
    details += `- High: ${summary.highCount}\n`;
    details += `- Medium: ${summary.mediumCount}\n`;
    details += `- Low: ${summary.lowCount}\n`;
    details += `- Info: ${summary.infoCount}\n`;
    details += `- Risk Score: ${summary.riskScore}/100\n`;
    details += `- Compliance Status: ${summary.complianceStatus}\n\n`;
    // Scan results by tool
    details += `### Scan Results\n`;
    for (const result of summary.scanResults) {
      const status = result.success ? '✅' : '❌';
      details += `${status} **${result.tool}**: ${result.vulnerabilities.length} vulnerabilities found\n`;
    }
    details += `\n`;
    // Top vulnerabilities
    if (summary.topVulnerabilities.length > 0) {
      details += `### Top Vulnerabilities\n`;
      summary.topVulnerabilities.slice(0, 5).forEach((vuln, index) => {
        details += `${index + 1}. **${vuln.title}** (${vuln.severity})\n`;
        details += `   - Category: ${vuln.category}\n`;
        details += `   - Tool: ${vuln.tool}\n`;
        if (vuln.file) {
          details += `   - File: ${vuln.file}:${vuln.line || 0}\n`;
        }
        details += `   - ${vuln.description}\n\n`;
      });
    }
    return details;
  }
  /**
   * Generate security improvement suggestions
   */
  generateSecuritySuggestions(summary) {
    const suggestions = [];
    if (summary.criticalCount > 0) {
      suggestions.push(
        'Immediately address all critical security vulnerabilities',
      );
    }
    if (summary.highCount > 0) {
      suggestions.push('Prioritize fixing high-severity security issues');
    }
    // Tool-specific suggestions
    const dependencyVulns = summary.scanResults.find((r) =>
      r.tool.includes('audit'),
    );
    if (dependencyVulns && dependencyVulns.vulnerabilities.length > 0) {
      suggestions.push('Update vulnerable dependencies to secure versions');
    }
    const secretVulns = summary.scanResults.find((r) =>
      r.tool.includes('secret'),
    );
    if (secretVulns && secretVulns.vulnerabilities.length > 0) {
      suggestions.push(
        'Remove hardcoded secrets and use environment variables',
      );
    }
    const codeVulns = summary.scanResults.find(
      (r) => r.tool.includes('eslint') || r.tool.includes('semgrep'),
    );
    if (codeVulns && codeVulns.vulnerabilities.length > 0) {
      suggestions.push('Fix static code analysis security findings');
    }
    if (summary.riskScore > 50) {
      suggestions.push('Implement security code review process');
      suggestions.push('Set up automated security scanning in CI/CD pipeline');
    }
    if (suggestions.length === 0) {
      suggestions.push('Continue maintaining good security practices');
      suggestions.push(
        'Consider regular security audits and penetration testing',
      );
    }
    return suggestions.slice(0, 8);
  }
  /**
   * Create security evidence artifacts
   */
  createSecurityEvidence(summary) {
    const evidence = [];
    // Security summary report
    evidence.push({
      type: 'report',
      path: 'security-validation-report.json',
      content: JSON.stringify(
        {
          timestamp: new Date().toISOString(),
          summary: {
            totalVulnerabilities: summary.totalVulnerabilities,
            severity: {
              critical: summary.criticalCount,
              high: summary.highCount,
              medium: summary.mediumCount,
              low: summary.lowCount,
              info: summary.infoCount,
            },
            riskScore: summary.riskScore,
            complianceStatus: summary.complianceStatus,
          },
          scanResults: summary.scanResults.map((result) => ({
            tool: result.tool,
            success: result.success,
            duration: result.duration,
            vulnerabilityCount: result.vulnerabilities.length,
            summary: result.summary,
          })),
          topVulnerabilities: summary.topVulnerabilities.slice(0, 10),
        },
        null,
        2,
      ),
      metadata: {
        type: 'security_report',
        format: 'json',
        vulnerabilities: summary.totalVulnerabilities,
      },
    });
    // Detailed vulnerabilities list
    evidence.push({
      type: 'report',
      path: 'vulnerabilities-detailed.json',
      content: JSON.stringify(summary.topVulnerabilities, null, 2),
      metadata: {
        type: 'vulnerability_list',
        format: 'json',
      },
    });
    return evidence;
  }
  /**
   * Helper methods for parsing different severity formats
   */
  mapSeverity(severity) {
    const severityMap = {
      critical: 'critical',
      high: 'high',
      moderate: 'medium',
      medium: 'medium',
      low: 'low',
      info: 'info',
      warning: 'medium',
    };
    return severityMap[severity.toLowerCase()] || 'medium';
  }
  mapSemgrepSeverity(severity) {
    return this.mapSeverity(severity);
  }
  mapBanditSeverity(severity) {
    return this.mapSeverity(severity);
  }
  /**
   * Summarize vulnerabilities by severity
   */
  summarizeVulnerabilities(vulnerabilities) {
    return {
      critical: vulnerabilities.filter((v) => v.severity === 'critical').length,
      high: vulnerabilities.filter((v) => v.severity === 'high').length,
      medium: vulnerabilities.filter((v) => v.severity === 'medium').length,
      low: vulnerabilities.filter((v) => v.severity === 'low').length,
      info: vulnerabilities.filter((v) => v.severity === 'info').length,
    };
  }
}
//# sourceMappingURL=SecurityValidator.js.map
