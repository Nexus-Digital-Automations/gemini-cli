/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { EventEmitter } from 'node:events';
import { Logger } from '../logger/Logger.js';
import type { ValidationFramework, ValidationResult} from './ValidationFramework.js';
import { ValidationContext, ValidationStatus, ValidationSeverity, ValidationCategory } from './ValidationFramework.js';
import type { Task, TaskResult} from '../task-management/types.js';
import { TaskStatus, TaskPriority } from '../task-management/types.js';

/**
 * Quality assessment levels for different validation strictness
 */
export enum QualityAssessmentLevel {
  BASIC = 'basic',           // Basic quality checks
  STANDARD = 'standard',     // Standard industry quality checks
  RIGOROUS = 'rigorous',     // Rigorous quality assurance
  ENTERPRISE = 'enterprise'  // Enterprise-grade quality standards
}

/**
 * Quality metrics for comprehensive assessment
 */
export interface QualityMetrics {
  overallScore: number;           // Overall quality score (0-1)
  functionalScore: number;        // Functional correctness score (0-1)
  performanceScore: number;       // Performance quality score (0-1)
  securityScore: number;          // Security quality score (0-1)
  maintainabilityScore: number;   // Code maintainability score (0-1)
  reliabilityScore: number;       // System reliability score (0-1)
  testCoverage: number;           // Test coverage percentage (0-1)
  codeComplexity: number;         // Code complexity metric
  technicalDebt: number;          // Technical debt score (0-1)
  documentationQuality: number;   // Documentation completeness (0-1)
}

/**
 * Quality assessment criteria configuration
 */
export interface QualityAssessmentCriteria {
  // Score thresholds
  minimumOverallScore: number;
  minimumFunctionalScore: number;
  minimumPerformanceScore: number;
  minimumSecurityScore: number;
  minimumMaintainabilityScore: number;
  minimumReliabilityScore: number;

  // Coverage and complexity thresholds
  minimumTestCoverage: number;
  maximumCodeComplexity: number;
  maximumTechnicalDebt: number;
  minimumDocumentationQuality: number;

  // Validation requirements
  maxCriticalIssues: number;
  maxHighSeverityIssues: number;
  maxMediumSeverityIssues: number;

  // Performance thresholds
  maxExecutionTime: number;
  maxMemoryUsage: number;
  maxErrorRate: number;

  // Custom criteria
  customCriteria?: Map<string, (context: QualityAssessmentContext) => Promise<boolean>>;
}

/**
 * Quality assessment context
 */
export interface QualityAssessmentContext {
  task: Task;
  taskResult?: TaskResult;
  validationResults?: ValidationResult[];
  executionMetrics?: {
    duration: number;
    memoryUsage: number;
    cpuUsage: number;
    errorCount: number;
    warningCount: number;
  };
  testResults?: {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    coverage: number;
  };
  codeAnalysis?: {
    linesOfCode: number;
    cyclomaticComplexity: number;
    maintainabilityIndex: number;
    technicalDebtRatio: number;
  };
  securityScan?: {
    vulnerabilities: Array<{
      severity: 'low' | 'medium' | 'high' | 'critical';
      type: string;
      description: string;
    }>;
    complianceScore: number;
  };
  metadata?: Record<string, unknown>;
}

/**
 * Quality assessment result
 */
export interface QualityAssessmentResult {
  taskId: string;
  timestamp: Date;
  assessmentLevel: QualityAssessmentLevel;
  passed: boolean;
  metrics: QualityMetrics;
  issues: QualityIssue[];
  recommendations: QualityRecommendation[];
  improvementPlan?: QualityImprovementPlan;
  certification?: QualityCertification;
  metadata?: Record<string, unknown>;
}

/**
 * Quality issue identification
 */
export interface QualityIssue {
  id: string;
  category: 'functional' | 'performance' | 'security' | 'maintainability' | 'reliability' | 'testing';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  location?: {
    file?: string;
    line?: number;
    column?: number;
  };
  impact: string;
  remediation: string;
  effort: 'minimal' | 'low' | 'medium' | 'high' | 'significant';
  priority: number;
}

/**
 * Quality improvement recommendations
 */
export interface QualityRecommendation {
  type: 'immediate' | 'short_term' | 'long_term';
  category: 'functional' | 'performance' | 'security' | 'maintainability' | 'reliability' | 'testing';
  priority: number;
  title: string;
  description: string;
  actions: string[];
  expectedImpact: string;
  estimatedEffort: string;
  dependencies?: string[];
  success_criteria: string[];
}

/**
 * Quality improvement plan
 */
export interface QualityImprovementPlan {
  phases: Array<{
    name: string;
    duration: string;
    objectives: string[];
    deliverables: string[];
    resources: string[];
    risks: string[];
  }>;
  totalEstimatedDuration: string;
  priorityRecommendations: QualityRecommendation[];
  quickWins: QualityRecommendation[];
  longTermGoals: string[];
}

/**
 * Quality certification result
 */
export interface QualityCertification {
  level: 'bronze' | 'silver' | 'gold' | 'platinum';
  score: number;
  criteria_met: string[];
  criteria_missed: string[];
  valid_until?: Date;
  certified_by: string;
  certification_id: string;
}

/**
 * Quality assessor events
 */
export interface QualityAssessorEvents {
  assessmentStarted: [taskId: string, level: QualityAssessmentLevel];
  assessmentCompleted: [result: QualityAssessmentResult];
  assessmentFailed: [taskId: string, error: Error];
  qualityIssueDetected: [taskId: string, issue: QualityIssue];
  qualityImproved: [taskId: string, oldScore: number, newScore: number];
  certificationEarned: [taskId: string, certification: QualityCertification];
}

/**
 * Comprehensive Quality Assessor for Result Validation and Quality Assessment
 *
 * Provides advanced quality assessment capabilities including:
 * - Multi-dimensional quality scoring
 * - Quality issue detection and classification
 * - Improvement recommendations and planning
 * - Quality certification
 * - Continuous quality monitoring
 */
export class QualityAssessor extends EventEmitter {
  private readonly logger: Logger;
  private readonly validationFramework: ValidationFramework;
  private readonly assessmentCriteria: Map<QualityAssessmentLevel, QualityAssessmentCriteria> = new Map();
  private readonly activeAssessments: Map<string, Promise<QualityAssessmentResult>> = new Map();
  private readonly qualityHistory: Map<string, QualityMetrics[]> = new Map();
  private readonly customAssessors: Map<string, (context: QualityAssessmentContext) => Promise<Partial<QualityMetrics>>> = new Map();

  constructor(validationFramework: ValidationFramework) {
    super();

    this.logger = new Logger('QualityAssessor');
    this.validationFramework = validationFramework;

    this.initializeDefaultCriteria();
    this.registerDefaultAssessors();

    this.logger.info('QualityAssessor initialized', {
      assessmentLevels: Array.from(this.assessmentCriteria.keys()),
      customAssessors: this.customAssessors.size
    });
  }

  /**
   * Initialize default quality assessment criteria for each level
   */
  private initializeDefaultCriteria(): void {
    // Basic level criteria
    this.assessmentCriteria.set(QualityAssessmentLevel.BASIC, {
      minimumOverallScore: 0.6,
      minimumFunctionalScore: 0.7,
      minimumPerformanceScore: 0.5,
      minimumSecurityScore: 0.6,
      minimumMaintainabilityScore: 0.5,
      minimumReliabilityScore: 0.6,
      minimumTestCoverage: 0.5,
      maximumCodeComplexity: 15,
      maximumTechnicalDebt: 0.3,
      minimumDocumentationQuality: 0.4,
      maxCriticalIssues: 0,
      maxHighSeverityIssues: 2,
      maxMediumSeverityIssues: 5,
      maxExecutionTime: 30000,
      maxMemoryUsage: 512,
      maxErrorRate: 0.1
    });

    // Standard level criteria
    this.assessmentCriteria.set(QualityAssessmentLevel.STANDARD, {
      minimumOverallScore: 0.75,
      minimumFunctionalScore: 0.8,
      minimumPerformanceScore: 0.7,
      minimumSecurityScore: 0.8,
      minimumMaintainabilityScore: 0.7,
      minimumReliabilityScore: 0.8,
      minimumTestCoverage: 0.7,
      maximumCodeComplexity: 12,
      maximumTechnicalDebt: 0.2,
      minimumDocumentationQuality: 0.6,
      maxCriticalIssues: 0,
      maxHighSeverityIssues: 1,
      maxMediumSeverityIssues: 3,
      maxExecutionTime: 20000,
      maxMemoryUsage: 256,
      maxErrorRate: 0.05
    });

    // Rigorous level criteria
    this.assessmentCriteria.set(QualityAssessmentLevel.RIGOROUS, {
      minimumOverallScore: 0.85,
      minimumFunctionalScore: 0.9,
      minimumPerformanceScore: 0.8,
      minimumSecurityScore: 0.9,
      minimumMaintainabilityScore: 0.8,
      minimumReliabilityScore: 0.9,
      minimumTestCoverage: 0.85,
      maximumCodeComplexity: 10,
      maximumTechnicalDebt: 0.15,
      minimumDocumentationQuality: 0.8,
      maxCriticalIssues: 0,
      maxHighSeverityIssues: 0,
      maxMediumSeverityIssues: 2,
      maxExecutionTime: 15000,
      maxMemoryUsage: 128,
      maxErrorRate: 0.02
    });

    // Enterprise level criteria
    this.assessmentCriteria.set(QualityAssessmentLevel.ENTERPRISE, {
      minimumOverallScore: 0.95,
      minimumFunctionalScore: 0.95,
      minimumPerformanceScore: 0.9,
      minimumSecurityScore: 0.95,
      minimumMaintainabilityScore: 0.9,
      minimumReliabilityScore: 0.95,
      minimumTestCoverage: 0.9,
      maximumCodeComplexity: 8,
      maximumTechnicalDebt: 0.1,
      minimumDocumentationQuality: 0.9,
      maxCriticalIssues: 0,
      maxHighSeverityIssues: 0,
      maxMediumSeverityIssues: 1,
      maxExecutionTime: 10000,
      maxMemoryUsage: 64,
      maxErrorRate: 0.01
    });
  }

  /**
   * Register default quality assessors
   */
  private registerDefaultAssessors(): void {
    this.customAssessors.set('functional-assessment', this.assessFunctionalQuality.bind(this));
    this.customAssessors.set('performance-assessment', this.assessPerformanceQuality.bind(this));
    this.customAssessors.set('security-assessment', this.assessSecurityQuality.bind(this));
    this.customAssessors.set('maintainability-assessment', this.assessMaintainabilityQuality.bind(this));
    this.customAssessors.set('reliability-assessment', this.assessReliabilityQuality.bind(this));
  }

  /**
   * Perform comprehensive quality assessment
   */
  async assessQuality(
    context: QualityAssessmentContext,
    level: QualityAssessmentLevel = QualityAssessmentLevel.STANDARD
  ): Promise<QualityAssessmentResult> {
    const taskId = context.task.id;

    this.logger.info('Starting quality assessment', {
      taskId,
      level,
      hasValidationResults: !!context.validationResults,
      hasExecutionMetrics: !!context.executionMetrics
    });

    this.emit('assessmentStarted', taskId, level);

    try {
      // Check for active assessment
      if (this.activeAssessments.has(taskId)) {
        this.logger.warn(`Assessment already running for task: ${taskId}`);
        return await this.activeAssessments.get(taskId)!;
      }

      // Create assessment promise
      const assessmentPromise = this.executeQualityAssessment(context, level);
      this.activeAssessments.set(taskId, assessmentPromise);

      const result = await assessmentPromise;

      // Store quality metrics in history
      this.updateQualityHistory(taskId, result.metrics);

      this.emit('assessmentCompleted', result);
      return result;

    } catch (error) {
      this.logger.error(`Quality assessment failed: ${taskId}`, { error });
      this.emit('assessmentFailed', taskId, error as Error);
      throw error;
    } finally {
      this.activeAssessments.delete(taskId);
    }
  }

  /**
   * Execute comprehensive quality assessment cycle
   */
  private async executeQualityAssessment(
    context: QualityAssessmentContext,
    level: QualityAssessmentLevel
  ): Promise<QualityAssessmentResult> {
    const startTime = Date.now();
    const criteria = this.assessmentCriteria.get(level)!;

    // Calculate quality metrics from all assessors
    const metrics = await this.calculateQualityMetrics(context);

    // Detect quality issues
    const issues = await this.detectQualityIssues(context, metrics, criteria);

    // Generate improvement recommendations
    const recommendations = this.generateQualityRecommendations(issues, metrics, criteria);

    // Create improvement plan if needed
    const improvementPlan = this.shouldCreateImprovementPlan(metrics, criteria)
      ? this.createQualityImprovementPlan(recommendations, issues)
      : undefined;

    // Determine if quality assessment passed
    const passed = this.evaluateQualityPass(metrics, issues, criteria);

    // Generate quality certification if earned
    const certification = passed ? this.generateQualityCertification(metrics, level, context.task.id) : undefined;

    const result: QualityAssessmentResult = {
      taskId: context.task.id,
      timestamp: new Date(),
      assessmentLevel: level,
      passed,
      metrics,
      issues,
      recommendations,
      improvementPlan,
      certification,
      metadata: {
        assessmentDuration: Date.now() - startTime,
        criteriaUsed: level,
        assessorsUsed: Array.from(this.customAssessors.keys())
      }
    };

    // Emit events for significant results
    issues.forEach(issue => {
      if (issue.severity === 'high' || issue.severity === 'critical') {
        this.emit('qualityIssueDetected', context.task.id, issue);
      }
    });

    if (certification) {
      this.emit('certificationEarned', context.task.id, certification);
    }

    return result;
  }

  /**
   * Calculate comprehensive quality metrics
   */
  private async calculateQualityMetrics(context: QualityAssessmentContext): Promise<QualityMetrics> {
    const baseMetrics: QualityMetrics = {
      overallScore: 0,
      functionalScore: 0,
      performanceScore: 0,
      securityScore: 0,
      maintainabilityScore: 0,
      reliabilityScore: 0,
      testCoverage: context.testResults?.coverage || 0,
      codeComplexity: context.codeAnalysis?.cyclomaticComplexity || 0,
      technicalDebt: context.codeAnalysis?.technicalDebtRatio || 0,
      documentationQuality: 0
    };

    // Execute all custom assessors
    const assessorResults = await Promise.all(
      Array.from(this.customAssessors.entries()).map(async ([name, assessor]) => {
        try {
          const result = await assessor(context);
          this.logger.debug(`Assessor ${name} completed`, { result });
          return result;
        } catch (error) {
          this.logger.error(`Assessor ${name} failed`, { error });
          return {};
        }
      })
    );

    // Merge assessor results
    const metrics = assessorResults.reduce((acc, result) => ({
      ...acc,
      ...result
    }), baseMetrics);

    // Calculate overall score as weighted average
    metrics.overallScore = this.calculateOverallScore(metrics);

    return metrics;
  }

  /**
   * Calculate overall quality score from component metrics
   */
  private calculateOverallScore(metrics: QualityMetrics): number {
    const weights = {
      functional: 0.25,
      performance: 0.20,
      security: 0.20,
      maintainability: 0.15,
      reliability: 0.20
    };

    return (
      metrics.functionalScore * weights.functional +
      metrics.performanceScore * weights.performance +
      metrics.securityScore * weights.security +
      metrics.maintainabilityScore * weights.maintainability +
      metrics.reliabilityScore * weights.reliability
    );
  }

  /**
   * Detect quality issues based on metrics and criteria
   */
  private async detectQualityIssues(
    context: QualityAssessmentContext,
    metrics: QualityMetrics,
    criteria: QualityAssessmentCriteria
  ): Promise<QualityIssue[]> {
    const issues: QualityIssue[] = [];

    // Check functional quality issues
    if (metrics.functionalScore < criteria.minimumFunctionalScore) {
      issues.push({
        id: `functional-score-low-${Date.now()}`,
        category: 'functional',
        severity: metrics.functionalScore < 0.5 ? 'critical' : 'high',
        title: 'Low Functional Quality Score',
        description: `Functional quality score ${metrics.functionalScore.toFixed(2)} is below the required threshold ${criteria.minimumFunctionalScore.toFixed(2)}`,
        impact: 'May cause incorrect behavior or failed requirements',
        remediation: 'Review and improve functional correctness, fix failing tests, address requirement gaps',
        effort: metrics.functionalScore < 0.3 ? 'significant' : 'medium',
        priority: 1
      });
    }

    // Check performance quality issues
    if (metrics.performanceScore < criteria.minimumPerformanceScore) {
      issues.push({
        id: `performance-score-low-${Date.now()}`,
        category: 'performance',
        severity: metrics.performanceScore < 0.4 ? 'high' : 'medium',
        title: 'Performance Quality Below Standards',
        description: `Performance quality score ${metrics.performanceScore.toFixed(2)} is below the required threshold ${criteria.minimumPerformanceScore.toFixed(2)}`,
        impact: 'May cause slow response times, high resource usage, or poor user experience',
        remediation: 'Optimize algorithms, improve resource usage, add performance monitoring',
        effort: 'medium',
        priority: 2
      });
    }

    // Check security quality issues
    if (metrics.securityScore < criteria.minimumSecurityScore) {
      issues.push({
        id: `security-score-low-${Date.now()}`,
        category: 'security',
        severity: 'critical',
        title: 'Security Quality Below Standards',
        description: `Security quality score ${metrics.securityScore.toFixed(2)} is below the required threshold ${criteria.minimumSecurityScore.toFixed(2)}`,
        impact: 'May expose security vulnerabilities, data breaches, or compliance violations',
        remediation: 'Address security vulnerabilities, improve access controls, update dependencies',
        effort: 'high',
        priority: 1
      });
    }

    // Check test coverage issues
    if (metrics.testCoverage < criteria.minimumTestCoverage) {
      issues.push({
        id: `test-coverage-low-${Date.now()}`,
        category: 'testing',
        severity: metrics.testCoverage < 0.5 ? 'high' : 'medium',
        title: 'Insufficient Test Coverage',
        description: `Test coverage ${(metrics.testCoverage * 100).toFixed(1)}% is below the required threshold ${(criteria.minimumTestCoverage * 100).toFixed(1)}%`,
        impact: 'Increases risk of undetected bugs and regression issues',
        remediation: 'Add unit tests, integration tests, and improve test scenarios',
        effort: 'medium',
        priority: 3
      });
    }

    // Check code complexity issues
    if (metrics.codeComplexity > criteria.maximumCodeComplexity) {
      issues.push({
        id: `code-complexity-high-${Date.now()}`,
        category: 'maintainability',
        severity: metrics.codeComplexity > criteria.maximumCodeComplexity * 1.5 ? 'high' : 'medium',
        title: 'High Code Complexity',
        description: `Code complexity ${metrics.codeComplexity} exceeds the maximum threshold ${criteria.maximumCodeComplexity}`,
        impact: 'Makes code difficult to understand, test, and maintain',
        remediation: 'Refactor complex functions, extract smaller methods, simplify logic',
        effort: 'medium',
        priority: 4
      });
    }

    // Check technical debt issues
    if (metrics.technicalDebt > criteria.maximumTechnicalDebt) {
      issues.push({
        id: `technical-debt-high-${Date.now()}`,
        category: 'maintainability',
        severity: metrics.technicalDebt > criteria.maximumTechnicalDebt * 1.5 ? 'high' : 'medium',
        title: 'High Technical Debt',
        description: `Technical debt ratio ${(metrics.technicalDebt * 100).toFixed(1)}% exceeds the maximum threshold ${(criteria.maximumTechnicalDebt * 100).toFixed(1)}%`,
        impact: 'Slows down development, increases maintenance costs, reduces code quality',
        remediation: 'Address code smells, refactor legacy code, improve code structure',
        effort: 'high',
        priority: 5
      });
    }

    return issues.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Generate quality improvement recommendations
   */
  private generateQualityRecommendations(
    issues: QualityIssue[],
    metrics: QualityMetrics,
    criteria: QualityAssessmentCriteria
  ): QualityRecommendation[] {
    const recommendations: QualityRecommendation[] = [];

    // Generate immediate recommendations for critical issues
    const criticalIssues = issues.filter(i => i.severity === 'critical');
    if (criticalIssues.length > 0) {
      recommendations.push({
        type: 'immediate',
        category: 'reliability',
        priority: 1,
        title: 'Address Critical Quality Issues',
        description: 'Immediate action required to address critical quality issues that may impact system stability and security',
        actions: criticalIssues.map(issue => issue.remediation),
        expectedImpact: 'Prevent system failures, security breaches, and critical bugs',
        estimatedEffort: '1-2 days',
        success_criteria: ['All critical issues resolved', 'Quality score above minimum threshold']
      });
    }

    // Generate short-term recommendations for high-priority issues
    const highIssues = issues.filter(i => i.severity === 'high');
    if (highIssues.length > 0) {
      recommendations.push({
        type: 'short_term',
        category: 'quality',
        priority: 2,
        title: 'Improve Core Quality Metrics',
        description: 'Focus on improving fundamental quality aspects that significantly impact overall quality score',
        actions: [
          'Increase test coverage to meet minimum requirements',
          'Improve functional correctness through comprehensive testing',
          'Address performance bottlenecks and optimize critical paths'
        ],
        expectedImpact: 'Significantly improve overall quality score and system reliability',
        estimatedEffort: '1-2 weeks',
        success_criteria: [
          `Functional score above ${criteria.minimumFunctionalScore}`,
          `Test coverage above ${criteria.minimumTestCoverage * 100}%`,
          `Performance score above ${criteria.minimumPerformanceScore}`
        ]
      });
    }

    // Generate long-term recommendations for maintainability
    if (metrics.maintainabilityScore < criteria.minimumMaintainabilityScore || metrics.technicalDebt > criteria.maximumTechnicalDebt) {
      recommendations.push({
        type: 'long_term',
        category: 'maintainability',
        priority: 3,
        title: 'Improve Code Maintainability and Reduce Technical Debt',
        description: 'Long-term investment in code quality to improve maintainability and reduce future development costs',
        actions: [
          'Implement comprehensive code review processes',
          'Establish coding standards and automated enforcement',
          'Regular refactoring sessions to reduce technical debt',
          'Improve code documentation and inline comments'
        ],
        expectedImpact: 'Reduce future development time, improve code readability, easier onboarding',
        estimatedEffort: '1-3 months',
        success_criteria: [
          `Maintainability score above ${criteria.minimumMaintainabilityScore}`,
          `Technical debt below ${criteria.maximumTechnicalDebt * 100}%`,
          `Code complexity below ${criteria.maximumCodeComplexity}`
        ]
      });
    }

    return recommendations.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Create quality improvement plan
   */
  private createQualityImprovementPlan(
    recommendations: QualityRecommendation[],
    issues: QualityIssue[]
  ): QualityImprovementPlan {
    const phases = [];

    // Phase 1: Immediate fixes (critical issues)
    const criticalRecommendations = recommendations.filter(r => r.type === 'immediate');
    if (criticalRecommendations.length > 0) {
      phases.push({
        name: 'Critical Issue Resolution',
        duration: '1-3 days',
        objectives: ['Resolve all critical quality issues', 'Ensure system stability'],
        deliverables: ['Critical bug fixes', 'Security patches', 'Stability improvements'],
        resources: ['Senior developers', 'Security experts'],
        risks: ['System downtime during fixes', 'Potential regression issues']
      });
    }

    // Phase 2: Core quality improvements
    const shortTermRecommendations = recommendations.filter(r => r.type === 'short_term');
    if (shortTermRecommendations.length > 0) {
      phases.push({
        name: 'Core Quality Enhancement',
        duration: '1-2 weeks',
        objectives: ['Improve test coverage', 'Enhance functional quality', 'Optimize performance'],
        deliverables: ['Comprehensive test suite', 'Performance optimizations', 'Quality metrics dashboard'],
        resources: ['Development team', 'QA engineers', 'Performance specialists'],
        risks: ['Resource allocation conflicts', 'Timeline extensions']
      });
    }

    // Phase 3: Long-term maintainability
    const longTermRecommendations = recommendations.filter(r => r.type === 'long_term');
    if (longTermRecommendations.length > 0) {
      phases.push({
        name: 'Maintainability and Technical Debt Reduction',
        duration: '1-3 months',
        objectives: ['Reduce technical debt', 'Improve code maintainability', 'Establish quality processes'],
        deliverables: ['Refactored codebase', 'Quality standards documentation', 'Automated quality gates'],
        resources: ['Entire development team', 'Architecture team'],
        risks: ['Large-scale refactoring risks', 'Team coordination challenges']
      });
    }

    return {
      phases,
      totalEstimatedDuration: phases.length > 0 ? `${phases.length === 1 ? phases[0].duration : '1-4 months'}` : 'No phases needed',
      priorityRecommendations: recommendations.filter(r => r.priority <= 2),
      quickWins: recommendations.filter(r => r.estimatedEffort.includes('day') && r.expectedImpact.includes('Significantly')),
      longTermGoals: [
        'Achieve enterprise-level quality standards',
        'Establish continuous quality monitoring',
        'Build quality-first development culture',
        'Minimize technical debt accumulation'
      ]
    };
  }

  /**
   * Evaluate if quality assessment passes criteria
   */
  private evaluateQualityPass(
    metrics: QualityMetrics,
    issues: QualityIssue[],
    criteria: QualityAssessmentCriteria
  ): boolean {
    // Check critical issues
    const criticalIssues = issues.filter(i => i.severity === 'critical').length;
    if (criticalIssues > criteria.maxCriticalIssues) {
      return false;
    }

    // Check high severity issues
    const highIssues = issues.filter(i => i.severity === 'high').length;
    if (highIssues > criteria.maxHighSeverityIssues) {
      return false;
    }

    // Check overall score
    if (metrics.overallScore < criteria.minimumOverallScore) {
      return false;
    }

    // Check individual metric thresholds
    return (
      metrics.functionalScore >= criteria.minimumFunctionalScore &&
      metrics.performanceScore >= criteria.minimumPerformanceScore &&
      metrics.securityScore >= criteria.minimumSecurityScore &&
      metrics.maintainabilityScore >= criteria.minimumMaintainabilityScore &&
      metrics.reliabilityScore >= criteria.minimumReliabilityScore &&
      metrics.testCoverage >= criteria.minimumTestCoverage &&
      metrics.codeComplexity <= criteria.maximumCodeComplexity &&
      metrics.technicalDebt <= criteria.maximumTechnicalDebt
    );
  }

  /**
   * Generate quality certification
   */
  private generateQualityCertification(
    metrics: QualityMetrics,
    level: QualityAssessmentLevel,
    taskId: string
  ): QualityCertification {
    const certificationLevel = this.determineCertificationLevel(metrics, level);
    const criteriaUsed = this.assessmentCriteria.get(level)!;

    return {
      level: certificationLevel,
      score: Math.round(metrics.overallScore * 100),
      criteria_met: this.getCriteriaMet(metrics, criteriaUsed),
      criteria_missed: this.getCriteriaMissed(metrics, criteriaUsed),
      valid_until: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
      certified_by: 'QualityAssessor',
      certification_id: `cert-${taskId}-${Date.now()}`
    };
  }

  /**
   * Determine certification level based on quality score
   */
  private determineCertificationLevel(metrics: QualityMetrics, level: QualityAssessmentLevel): 'bronze' | 'silver' | 'gold' | 'platinum' {
    const score = metrics.overallScore;

    if (score >= 0.95 && level === QualityAssessmentLevel.ENTERPRISE) return 'platinum';
    if (score >= 0.90) return 'gold';
    if (score >= 0.80) return 'silver';
    return 'bronze';
  }

  /**
   * Get criteria that were met
   */
  private getCriteriaMet(metrics: QualityMetrics, criteria: QualityAssessmentCriteria): string[] {
    const met: string[] = [];

    if (metrics.functionalScore >= criteria.minimumFunctionalScore) met.push('Functional Quality');
    if (metrics.performanceScore >= criteria.minimumPerformanceScore) met.push('Performance Quality');
    if (metrics.securityScore >= criteria.minimumSecurityScore) met.push('Security Quality');
    if (metrics.maintainabilityScore >= criteria.minimumMaintainabilityScore) met.push('Maintainability Quality');
    if (metrics.reliabilityScore >= criteria.minimumReliabilityScore) met.push('Reliability Quality');
    if (metrics.testCoverage >= criteria.minimumTestCoverage) met.push('Test Coverage');
    if (metrics.codeComplexity <= criteria.maximumCodeComplexity) met.push('Code Complexity');
    if (metrics.technicalDebt <= criteria.maximumTechnicalDebt) met.push('Technical Debt');

    return met;
  }

  /**
   * Get criteria that were missed
   */
  private getCriteriaMissed(metrics: QualityMetrics, criteria: QualityAssessmentCriteria): string[] {
    const missed: string[] = [];

    if (metrics.functionalScore < criteria.minimumFunctionalScore) missed.push('Functional Quality');
    if (metrics.performanceScore < criteria.minimumPerformanceScore) missed.push('Performance Quality');
    if (metrics.securityScore < criteria.minimumSecurityScore) missed.push('Security Quality');
    if (metrics.maintainabilityScore < criteria.minimumMaintainabilityScore) missed.push('Maintainability Quality');
    if (metrics.reliabilityScore < criteria.minimumReliabilityScore) missed.push('Reliability Quality');
    if (metrics.testCoverage < criteria.minimumTestCoverage) missed.push('Test Coverage');
    if (metrics.codeComplexity > criteria.maximumCodeComplexity) missed.push('Code Complexity');
    if (metrics.technicalDebt > criteria.maximumTechnicalDebt) missed.push('Technical Debt');

    return missed;
  }

  /**
   * Individual quality assessors
   */

  /**
   * Assess functional quality
   */
  private async assessFunctionalQuality(context: QualityAssessmentContext): Promise<Partial<QualityMetrics>> {
    let functionalScore = 0.8; // Base score

    // Analyze validation results
    if (context.validationResults) {
      const functionalResults = context.validationResults.filter(r => r.category === ValidationCategory.FUNCTIONAL);
      const passedFunctional = functionalResults.filter(r => r.status === ValidationStatus.PASSED).length;
      const totalFunctional = functionalResults.length;

      if (totalFunctional > 0) {
        functionalScore = passedFunctional / totalFunctional;
      }
    }

    // Analyze test results
    if (context.testResults) {
      const testSuccessRate = context.testResults.passedTests / context.testResults.totalTests;
      functionalScore = (functionalScore + testSuccessRate) / 2;
    }

    // Adjust based on task completion status
    if (context.taskResult?.success === false) {
      functionalScore *= 0.5; // Significant penalty for failed tasks
    }

    return { functionalScore: Math.max(0, Math.min(1, functionalScore)) };
  }

  /**
   * Assess performance quality
   */
  private async assessPerformanceQuality(context: QualityAssessmentContext): Promise<Partial<QualityMetrics>> {
    let performanceScore = 0.8; // Base score

    if (context.executionMetrics) {
      const metrics = context.executionMetrics;

      // Assess execution time (normalize against acceptable thresholds)
      const timeScore = Math.max(0, 1 - (metrics.duration / 30000)); // 30 second baseline

      // Assess memory usage (normalize against acceptable thresholds)
      const memoryScore = Math.max(0, 1 - (metrics.memoryUsage / (512 * 1024 * 1024))); // 512MB baseline

      // Assess error rate
      const errorRate = metrics.errorCount / Math.max(1, metrics.errorCount + 10); // Assume 10 successful operations
      const errorScore = 1 - errorRate;

      performanceScore = (timeScore + memoryScore + errorScore) / 3;
    }

    // Analyze performance-related validation results
    if (context.validationResults) {
      const perfResults = context.validationResults.filter(r => r.category === ValidationCategory.PERFORMANCE);
      const passedPerf = perfResults.filter(r => r.status === ValidationStatus.PASSED).length;
      const totalPerf = perfResults.length;

      if (totalPerf > 0) {
        const validationScore = passedPerf / totalPerf;
        performanceScore = (performanceScore + validationScore) / 2;
      }
    }

    return { performanceScore: Math.max(0, Math.min(1, performanceScore)) };
  }

  /**
   * Assess security quality
   */
  private async assessSecurityQuality(context: QualityAssessmentContext): Promise<Partial<QualityMetrics>> {
    let securityScore = 0.8; // Base score

    // Analyze security scan results
    if (context.securityScan) {
      const scan = context.securityScan;
      securityScore = scan.complianceScore;

      // Apply penalties for vulnerabilities
      const criticalVulns = scan.vulnerabilities.filter(v => v.severity === 'critical').length;
      const highVulns = scan.vulnerabilities.filter(v => v.severity === 'high').length;
      const mediumVulns = scan.vulnerabilities.filter(v => v.severity === 'medium').length;

      securityScore -= (criticalVulns * 0.3 + highVulns * 0.2 + mediumVulns * 0.1);
    }

    // Analyze security-related validation results
    if (context.validationResults) {
      const secResults = context.validationResults.filter(r => r.category === ValidationCategory.SECURITY);
      const passedSec = secResults.filter(r => r.status === ValidationStatus.PASSED).length;
      const totalSec = secResults.length;

      if (totalSec > 0) {
        const validationScore = passedSec / totalSec;
        securityScore = (securityScore + validationScore) / 2;
      }
    }

    return { securityScore: Math.max(0, Math.min(1, securityScore)) };
  }

  /**
   * Assess maintainability quality
   */
  private async assessMaintainabilityQuality(context: QualityAssessmentContext): Promise<Partial<QualityMetrics>> {
    let maintainabilityScore = 0.7; // Base score

    if (context.codeAnalysis) {
      const analysis = context.codeAnalysis;

      // Use maintainability index if available
      if (analysis.maintainabilityIndex) {
        maintainabilityScore = analysis.maintainabilityIndex / 100; // Assuming 0-100 scale
      } else {
        // Calculate based on complexity and technical debt
        const complexityScore = Math.max(0, 1 - (analysis.cyclomaticComplexity / 20)); // 20 as max acceptable
        const debtScore = 1 - analysis.technicalDebtRatio;
        maintainabilityScore = (complexityScore + debtScore) / 2;
      }
    }

    return { maintainabilityScore: Math.max(0, Math.min(1, maintainabilityScore)) };
  }

  /**
   * Assess reliability quality
   */
  private async assessReliabilityQuality(context: QualityAssessmentContext): Promise<Partial<QualityMetrics>> {
    let reliabilityScore = 0.8; // Base score

    // Analyze task result success
    if (context.taskResult) {
      reliabilityScore = context.taskResult.success ? 1.0 : 0.3;
    }

    // Analyze execution metrics for reliability indicators
    if (context.executionMetrics) {
      const metrics = context.executionMetrics;

      // Lower score if there were errors or warnings
      const errorRate = metrics.errorCount / Math.max(1, metrics.errorCount + 10);
      const warningRate = metrics.warningCount / Math.max(1, metrics.warningCount + 20);

      const reliabilityFromMetrics = 1 - (errorRate * 0.6 + warningRate * 0.2);
      reliabilityScore = (reliabilityScore + reliabilityFromMetrics) / 2;
    }

    // Analyze test coverage as reliability indicator
    if (context.testResults) {
      const testReliability = context.testResults.coverage * 0.5 +
        (context.testResults.passedTests / context.testResults.totalTests) * 0.5;
      reliabilityScore = (reliabilityScore + testReliability) / 2;
    }

    return { reliabilityScore: Math.max(0, Math.min(1, reliabilityScore)) };
  }

  /**
   * Helper methods
   */

  private shouldCreateImprovementPlan(metrics: QualityMetrics, criteria: QualityAssessmentCriteria): boolean {
    return metrics.overallScore < criteria.minimumOverallScore * 0.9;
  }

  private updateQualityHistory(taskId: string, metrics: QualityMetrics): void {
    const history = this.qualityHistory.get(taskId) || [];
    history.push(metrics);

    // Keep only last 10 metrics
    if (history.length > 10) {
      history.shift();
    }

    this.qualityHistory.set(taskId, history);

    // Emit improvement event if score increased
    if (history.length > 1) {
      const previousScore = history[history.length - 2].overallScore;
      const currentScore = metrics.overallScore;

      if (currentScore > previousScore) {
        this.emit('qualityImproved', taskId, previousScore, currentScore);
      }
    }
  }

  /**
   * Public API methods
   */

  /**
   * Register custom quality assessor
   */
  registerCustomAssessor(
    name: string,
    assessor: (context: QualityAssessmentContext) => Promise<Partial<QualityMetrics>>
  ): void {
    this.customAssessors.set(name, assessor);
    this.logger.info('Custom quality assessor registered', { name });
  }

  /**
   * Update assessment criteria for a level
   */
  updateAssessmentCriteria(level: QualityAssessmentLevel, criteria: Partial<QualityAssessmentCriteria>): void {
    const currentCriteria = this.assessmentCriteria.get(level)!;
    this.assessmentCriteria.set(level, { ...currentCriteria, ...criteria });
    this.logger.info('Assessment criteria updated', { level, criteria });
  }

  /**
   * Get quality history for a task
   */
  getQualityHistory(taskId: string): QualityMetrics[] {
    return this.qualityHistory.get(taskId) || [];
  }

  /**
   * Get quality assessor statistics
   */
  getStatistics(): {
    activeAssessments: number;
    customAssessors: number;
    totalQualityHistoryEntries: number;
    assessmentLevels: QualityAssessmentLevel[];
  } {
    const totalEntries = Array.from(this.qualityHistory.values())
      .reduce((sum, history) => sum + history.length, 0);

    return {
      activeAssessments: this.activeAssessments.size,
      customAssessors: this.customAssessors.size,
      totalQualityHistoryEntries: totalEntries,
      assessmentLevels: Array.from(this.assessmentCriteria.keys())
    };
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    this.logger.info('Cleaning up QualityAssessor resources');

    // Cancel active assessments
    this.activeAssessments.clear();

    // Clear quality history
    this.qualityHistory.clear();

    this.removeAllListeners();
  }
}