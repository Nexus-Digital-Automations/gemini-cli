/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { AutomaticValidationSystem, ValidationIntegration, TaskType, validateTaskCompletion, isProjectReadyForCompletion, getStopAuthorizationStatus, } from './index.js';
/**
 * Comprehensive examples demonstrating the Automatic Validation System usage.
 *
 * These examples show how to integrate the validation system into various
 * development workflows and automation scenarios.
 */
/**
 * Example 1: Basic Task Completion Validation
 *
 * Use case: Validate that a feature implementation task is complete
 * and meets all quality standards before marking as done.
 */
export async function exampleBasicTaskValidation() {
    console.log('🔍 Example 1: Basic Task Completion Validation');
    console.log('━'.repeat(60));
    const projectRoot = '/path/to/your/project';
    const taskDescription = 'Implement user authentication system';
    try {
        const result = await validateTaskCompletion(projectRoot, taskDescription, 'feature');
        console.log(`✨ Validation Result: ${result.status}`);
        console.log(`📊 Summary: ${result.summary}`);
        console.log(`⏱️  Duration: ${result.executionTime}ms`);
        if (result.passed) {
            console.log('✅ Task is ready for completion!');
        }
        else {
            console.log('❌ Task has issues that need to be resolved:');
            result.qualityGateResults
                .filter((gate) => !gate.passed)
                .forEach((gate) => {
                console.log(`   • ${gate.gateName}: ${gate.message}`);
            });
        }
    }
    catch (error) {
        console.error('❌ Validation failed:', error.message);
    }
    console.log('');
}
/**
 * Example 2: Feature Implementation Validation
 *
 * Use case: Validate a specific feature from FEATURES.json is complete
 * and ready to be marked as implemented.
 */
export async function exampleFeatureValidation() {
    console.log('🔍 Example 2: Feature Implementation Validation');
    console.log('━'.repeat(60));
    const projectRoot = '/path/to/your/project';
    const integration = new ValidationIntegration(projectRoot);
    try {
        // Validate specific feature by ID
        const result = await integration.validateFeatureCompletion('user-auth-system');
        console.log(`🎯 Feature Validation: ${result.status}`);
        console.log(`📋 Gates Executed: ${result.qualityGateResults.length}`);
        console.log(`✅ Gates Passed: ${result.qualityGateResults.filter((g) => g.passed).length}`);
        // Check if feature is ready for marking as implemented
        if (result.passed) {
            console.log('🚀 Feature is ready to be marked as implemented!');
            // Generate recommendations for next steps
            if (result.report.recommendations.length > 0) {
                console.log('💡 Optional improvements:');
                result.report.recommendations.forEach((rec) => {
                    if (rec.priority === 'low') {
                        console.log(`   • ${rec.title}: ${rec.description}`);
                    }
                });
            }
        }
        else {
            console.log('⚠️  Feature implementation incomplete:');
            result.report.recommendations
                .filter((rec) => rec.priority === 'high')
                .forEach((rec) => {
                console.log(`   🔴 ${rec.title}`);
                rec.actionItems.forEach((action) => {
                    console.log(`      - ${action}`);
                });
            });
        }
    }
    catch (error) {
        console.error('❌ Feature validation failed:', error.message);
    }
    console.log('');
}
/**
 * Example 3: Project Completion Readiness Check
 *
 * Use case: Before authorizing agent stop, ensure the entire project
 * meets completion criteria with comprehensive validation.
 */
export async function exampleProjectCompletionCheck() {
    console.log('🔍 Example 3: Project Completion Readiness Check');
    console.log('━'.repeat(60));
    const projectRoot = '/path/to/your/project';
    try {
        // Check if project is ready for completion
        const isReady = await isProjectReadyForCompletion(projectRoot);
        if (isReady) {
            console.log('🎉 Project is ready for completion!');
            // Get detailed stop authorization status
            const stopAuth = await getStopAuthorizationStatus(projectRoot);
            console.log(`🚦 Stop Authorization: ${stopAuth.canAuthorizeStop ? 'APPROVED' : 'BLOCKED'}`);
            console.log(`📝 Reason: ${stopAuth.reason}`);
            if (stopAuth.canAuthorizeStop) {
                console.log('✅ Ready to execute stop authorization');
                console.log('   Command: node taskmanager-api.js authorize-stop AGENT_ID "Project validation passed"');
            }
        }
        else {
            console.log('⏸️  Project is not ready for completion');
            const stopAuth = await getStopAuthorizationStatus(projectRoot);
            console.log(`📋 Issues to resolve (${stopAuth.issues.length}):`);
            stopAuth.issues.forEach((issue) => {
                console.log(`   • ${issue}`);
            });
            console.log('📝 Next actions:');
            stopAuth.nextActions.slice(0, 5).forEach((action) => {
                console.log(`   • ${action}`);
            });
        }
    }
    catch (error) {
        console.error('❌ Project completion check failed:', error.message);
    }
    console.log('');
}
/**
 * Example 4: Advanced Validation with Custom Context
 *
 * Use case: Validate a complex refactoring task with custom validation
 * parameters and comprehensive quality gates.
 */
export async function exampleAdvancedValidation() {
    console.log('🔍 Example 4: Advanced Validation with Custom Context');
    console.log('━'.repeat(60));
    const projectRoot = '/path/to/your/project';
    const validationSystem = new AutomaticValidationSystem(projectRoot);
    const context = {
        changedFiles: [
            'src/auth/AuthService.ts',
            'src/auth/AuthController.ts',
            'src/auth/types.ts',
        ],
        affectedComponents: ['authentication', 'user-management', 'api-gateway'],
        customGates: ['performance-validation', 'security-scan'],
        taskDescription: 'Refactor authentication system for improved performance',
        triggeredBy: 'refactoring-completion',
        comprehensive: true,
    };
    try {
        const result = await validationSystem.validateTaskCompletion(TaskType.REFACTORING, context);
        console.log(`🔧 Refactoring Validation: ${result.status}`);
        console.log(`📊 Comprehensive Report Generated: ${result.report.id}`);
        console.log(`⏱️  Total Execution Time: ${result.executionTime}ms`);
        // Analyze performance metrics
        const metrics = result.report.metrics;
        console.log(`📈 Performance Metrics:`);
        console.log(`   • Average gate time: ${Math.round(metrics.averageGateExecutionTime)}ms`);
        console.log(`   • Success rate: ${metrics.successRate.toFixed(1)}%`);
        console.log(`   • Slow gates: ${metrics.performanceMetrics.slowGatesCount}`);
        // Show detailed gate breakdown
        console.log('📋 Quality Gate Breakdown:');
        const gatesByType = result.qualityGateResults.reduce((acc, gate) => {
            acc[gate.gateType] = (acc[gate.gateType] || 0) + (gate.passed ? 1 : 0);
            return acc;
        }, {});
        Object.entries(gatesByType).forEach(([type, passed]) => {
            const total = result.qualityGateResults.filter((g) => g.gateType === type).length;
            console.log(`   • ${type}: ${passed}/${total} passed`);
        });
        // Evidence collection summary
        if (result.evidence.size > 0) {
            console.log(`📁 Evidence Collected: ${result.evidence.size} items`);
            const evidenceTypes = Array.from(result.evidence.values()).reduce((acc, evidence) => {
                acc[evidence.type] = (acc[evidence.type] || 0) + 1;
                return acc;
            }, {});
            Object.entries(evidenceTypes).forEach(([type, count]) => {
                console.log(`   • ${type}: ${count} items`);
            });
        }
    }
    catch (error) {
        console.error('❌ Advanced validation failed:', error.message);
    }
    console.log('');
}
/**
 * Example 5: CI/CD Integration
 *
 * Use case: Generate validation reports for CI/CD pipeline consumption
 * with structured output for automated decision making.
 */
export async function exampleCICDIntegration() {
    console.log('🔍 Example 5: CI/CD Integration');
    console.log('━'.repeat(60));
    const projectRoot = '/path/to/your/project';
    const integration = new ValidationIntegration(projectRoot);
    try {
        // Validate commit readiness (typical CI/CD use case)
        const result = await integration.validateCommitReadiness('feat: add comprehensive user authentication with OAuth2 support');
        // Generate CI/CD-compatible report
        const cicdReport = integration.generateCICDReport(result);
        console.log('🤖 CI/CD Report Generated:');
        console.log(JSON.stringify(cicdReport, null, 2));
        // Example CI/CD decision logic
        if (cicdReport.success) {
            console.log('✅ CI/CD Pipeline: PROCEED to next stage');
            console.log(`   • All quality gates passed in ${cicdReport.duration}ms`);
            console.log(`   • Success rate: ${((cicdReport.gates.filter((g) => g.passed).length / cicdReport.gates.length) * 100).toFixed(1)}%`);
        }
        else {
            console.log('❌ CI/CD Pipeline: BLOCK deployment');
            const failedGates = cicdReport.gates.filter((gate) => !gate.passed);
            console.log(`   • ${failedGates.length} quality gates failed`);
            failedGates.forEach((gate) => {
                console.log(`   • ${gate.name}: ${gate.message} (${gate.severity})`);
            });
            // Set CI/CD environment variables for downstream jobs
            console.log('\n🔧 Recommended CI/CD Actions:');
            console.log('export VALIDATION_STATUS=FAILED');
            console.log('export VALIDATION_SESSION_ID=' + cicdReport.sessionId);
            console.log('export FAILED_GATES="' +
                failedGates.map((g) => g.name).join(',') +
                '"');
        }
        // Generate artifacts for CI/CD system
        if (result.report.artifacts.length > 0) {
            console.log('\n📄 Generated Artifacts:');
            result.report.artifacts.forEach((artifact) => {
                console.log(`   • ${artifact.name} (${artifact.type})`);
                // In real CI/CD, you would save these to artifact storage
                const artifactPath = `/tmp/validation-artifacts/${artifact.name}`;
                console.log(`   → Would save to: ${artifactPath}`);
            });
        }
    }
    catch (error) {
        console.error('❌ CI/CD integration failed:', error.message);
        console.log('export VALIDATION_STATUS=ERROR');
    }
    console.log('');
}
/**
 * Example 6: TodoWrite Integration
 *
 * Use case: Integrate with TodoWrite task management system to
 * automatically validate task completion before marking as done.
 */
export async function exampleTodoWriteIntegration() {
    console.log('🔍 Example 6: TodoWrite Integration');
    console.log('━'.repeat(60));
    const projectRoot = '/path/to/your/project';
    const integration = new ValidationIntegration(projectRoot);
    // Simulate TodoWrite task completion scenarios
    const todoTasks = [
        {
            description: 'Implement user authentication API',
            category: 'feature',
        },
        {
            description: 'Fix memory leak in data processor',
            category: 'bug-fix',
        },
        {
            description: 'Refactor database connection pooling',
            category: 'refactoring',
        },
        {
            description: 'Add unit tests for payment service',
            category: 'testing',
        },
        {
            description: 'Update API documentation for v2.0',
            category: 'documentation',
        },
    ];
    console.log(`📋 Validating ${todoTasks.length} TodoWrite tasks:`);
    console.log('');
    for (const [index, task] of todoTasks.entries()) {
        console.log(`📝 Task ${index + 1}: ${task.description}`);
        console.log(`   Category: ${task.category}`);
        try {
            const result = await integration.validateTaskCompletion(task.description, task.category);
            const statusIcon = result.passed ? '✅' : '❌';
            console.log(`   ${statusIcon} Status: ${result.status}`);
            console.log(`   ⏱️  Validation time: ${result.executionTime}ms`);
            if (result.passed) {
                console.log('   🎉 Task ready for TodoWrite completion!');
            }
            else {
                const criticalIssues = result.qualityGateResults.filter((gate) => !gate.passed && gate.severity === 'error').length;
                console.log(`   ⚠️  ${criticalIssues} critical issues must be resolved`);
                // Show top 3 most important action items
                const topActions = result.report.recommendations
                    .filter((rec) => rec.priority === 'high')
                    .flatMap((rec) => rec.actionItems)
                    .slice(0, 3);
                topActions.forEach((action) => {
                    console.log(`      • ${action}`);
                });
            }
        }
        catch (error) {
            console.log(`   ❌ Validation error: ${error.message}`);
        }
        console.log('');
    }
    console.log('💡 Integration Recommendation:');
    console.log('   Add validation check to TodoWrite completion workflow:');
    console.log('   - Before marking task as complete, run validation');
    console.log('   - Block completion if critical quality gates fail');
    console.log('   - Provide specific action items for task resolution');
    console.log('');
}
/**
 * Example 7: Performance and Metrics Analysis
 *
 * Use case: Analyze validation system performance and collect metrics
 * for continuous improvement and optimization.
 */
export async function examplePerformanceAnalysis() {
    console.log('🔍 Example 7: Performance and Metrics Analysis');
    console.log('━'.repeat(60));
    const projectRoot = '/path/to/your/project';
    const validationSystem = new AutomaticValidationSystem(projectRoot);
    // Run multiple validation scenarios to collect performance data
    const scenarios = [
        {
            type: TaskType.FEATURE_IMPLEMENTATION,
            context: { scope: 'small-feature' },
        },
        { type: TaskType.BUG_FIX, context: { scope: 'critical-bug' } },
        {
            type: TaskType.REFACTORING,
            context: { scope: 'major-refactor', comprehensive: true },
        },
        { type: TaskType.TESTING, context: { scope: 'test-suite-addition' } },
    ];
    const performanceData = [];
    for (const scenario of scenarios) {
        try {
            const startTime = Date.now();
            const result = await validationSystem.validateTaskCompletion(scenario.type, scenario.context);
            const totalDuration = Date.now() - startTime;
            const data = {
                scenario: scenario.type,
                duration: totalDuration,
                gateCount: result.qualityGateResults.length,
                successRate: result.report.metrics.successRate,
                slowGates: result.report.metrics.performanceMetrics.slowGatesCount,
            };
            performanceData.push(data);
            console.log(`📊 ${scenario.type}:`);
            console.log(`   • Duration: ${data.duration}ms`);
            console.log(`   • Gates: ${data.gateCount}`);
            console.log(`   • Success rate: ${data.successRate.toFixed(1)}%`);
            console.log(`   • Slow gates: ${data.slowGates}`);
        }
        catch (error) {
            console.log(`❌ ${scenario.type} failed: ${error.message}`);
        }
    }
    // Analyze performance trends
    console.log('\n📈 Performance Analysis:');
    console.log('━'.repeat(40));
    const avgDuration = performanceData.reduce((sum, d) => sum + d.duration, 0) /
        performanceData.length;
    const avgGates = performanceData.reduce((sum, d) => sum + d.gateCount, 0) /
        performanceData.length;
    const avgSuccessRate = performanceData.reduce((sum, d) => sum + d.successRate, 0) /
        performanceData.length;
    console.log(`📊 Average validation duration: ${Math.round(avgDuration)}ms`);
    console.log(`📊 Average gates per validation: ${Math.round(avgGates)}`);
    console.log(`📊 Average success rate: ${avgSuccessRate.toFixed(1)}%`);
    // Identify optimization opportunities
    const slowScenarios = performanceData
        .filter((d) => d.duration > avgDuration * 1.5)
        .sort((a, b) => b.duration - a.duration);
    if (slowScenarios.length > 0) {
        console.log('\n🐌 Optimization Opportunities:');
        slowScenarios.forEach((scenario) => {
            console.log(`   • ${scenario.scenario}: ${scenario.duration}ms (${scenario.slowGates} slow gates)`);
        });
    }
    // Performance recommendations
    console.log('\n💡 Performance Recommendations:');
    console.log('   • Consider parallel gate execution for long-running validations');
    console.log('   • Cache validation results for unchanged components');
    console.log('   • Implement incremental validation for large projects');
    console.log('   • Optimize slow quality gates with specific attention to build and test phases');
    console.log('');
}
/**
 * Main function to run all examples.
 *
 * Execute with: npx tsx src/validation/examples.ts
 */
export async function runAllExamples() {
    console.log('🚀 Automatic Validation System - Comprehensive Examples');
    console.log('='.repeat(80));
    console.log('');
    const examples = [
        exampleBasicTaskValidation,
        exampleFeatureValidation,
        exampleProjectCompletionCheck,
        exampleAdvancedValidation,
        exampleCICDIntegration,
        exampleTodoWriteIntegration,
        examplePerformanceAnalysis,
    ];
    for (const example of examples) {
        try {
            await example();
            console.log('✅ Example completed successfully\n');
        }
        catch (error) {
            console.error(`❌ Example failed: ${error.message}\n`);
        }
        // Add delay between examples for readability
        await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    console.log('🎉 All examples completed!');
    console.log('');
    console.log('Next steps:');
    console.log('• Integrate validation system into your development workflow');
    console.log('• Configure quality gates for your specific project needs');
    console.log('• Set up CI/CD pipeline integration for automated validation');
    console.log('• Customize validation rules and thresholds as needed');
}
// Export all examples for individual use
export const examples = {
    basicTaskValidation: exampleBasicTaskValidation,
    featureValidation: exampleFeatureValidation,
    projectCompletionCheck: exampleProjectCompletionCheck,
    advancedValidation: exampleAdvancedValidation,
    cicdIntegration: exampleCICDIntegration,
    todoWriteIntegration: exampleTodoWriteIntegration,
    performanceAnalysis: examplePerformanceAnalysis,
};
// Run examples if executed directly
if (require.main === module) {
    runAllExamples().catch(console.error);
}
//# sourceMappingURL=examples.js.map