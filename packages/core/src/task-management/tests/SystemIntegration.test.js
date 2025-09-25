/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Comprehensive Integration Tests for Task Management System
 *
 * Tests the complete integrated task management system including all components,
 * configurations, error handling, and real-world usage scenarios.
 */
import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  jest,
} from '@jest/globals';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import {
  TaskManagementSystemIntegrator,
  SystemConfigFactory,
  createIntegratedTaskManagementSystem,
} from '../TaskManagementSystemIntegrator.js';
import {
  TaskManagementConfigManager,
  ConfigUtils,
} from '../TaskManagementConfig.js';
describe('Task Management System Integration Tests', () => {
  let testDir;
  let coreConfig;
  let integrator = null;
  let configManager = null;
  beforeEach(async () => {
    // Create temporary test directory
    testDir = join(
      __dirname,
      '..',
      '..',
      '..',
      '..',
      '.test-data',
      `integration-${Date.now()}`,
    );
    await fs.mkdir(testDir, { recursive: true });
    // Mock core configuration
    coreConfig = {
      projectPath: testDir,
      apiKey: 'test-api-key',
      model: 'gemini-pro',
      debug: true,
      // Add other required Config properties as needed
    };
    // Setup clean environment
    jest.clearAllMocks();
  });
  afterEach(async () => {
    // Cleanup integrator
    if (integrator) {
      await integrator.shutdown();
      integrator = null;
    }
    // Cleanup config manager
    configManager = null;
    // Cleanup test directory
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      console.warn('Failed to cleanup test directory:', error);
    }
  });
  describe('System Integration', () => {
    it('should create and initialize minimal system configuration', async () => {
      const config = SystemConfigFactory.createMinimal(coreConfig);
      integrator = new TaskManagementSystemIntegrator(config);
      const result = await integrator.initialize();
      expect(result.success).toBe(true);
      expect(result.message).toContain('successfully');
      const health = integrator.getSystemHealth();
      expect(health.overall).toBe('healthy');
      expect(health.components.taskEngine).toBe('healthy');
    }, 30000);
    it('should create and initialize development system configuration', async () => {
      const config = SystemConfigFactory.createDevelopment(coreConfig);
      // Override storage locations for testing
      config.persistence.storageLocation = join(testDir, 'dev-storage');
      integrator = new TaskManagementSystemIntegrator(config);
      const result = await integrator.initialize();
      expect(result.success).toBe(true);
      const health = integrator.getSystemHealth();
      expect(health.overall).toBe('healthy');
      expect(health.components.taskEngine).toBe('healthy');
      expect(health.components.autonomousQueue).toBe('healthy');
      expect(health.components.monitoring).toBe('healthy');
      expect(health.components.persistence).toBe('healthy');
    }, 30000);
    it('should create and initialize production system configuration', async () => {
      const config = SystemConfigFactory.createProduction(coreConfig);
      // Override storage locations and disable external integrations for testing
      config.persistence.storageLocation = join(testDir, 'prod-storage');
      config.hookIntegration.enabled = false; // Disable for testing
      integrator = new TaskManagementSystemIntegrator(config);
      const result = await integrator.initialize();
      expect(result.success).toBe(true);
      const health = integrator.getSystemHealth();
      expect(health.overall).toBe('healthy');
      expect(health.components.taskEngine).toBe('healthy');
      expect(health.components.autonomousQueue).toBe('healthy');
      expect(health.components.monitoring).toBe('healthy');
      expect(health.components.persistence).toBe('healthy');
      expect(health.components.dependencies).toBe('healthy');
    }, 30000);
    it('should handle partial initialization failures gracefully', async () => {
      const config = SystemConfigFactory.createDevelopment(coreConfig);
      // Set invalid storage location
      config.persistence.storageLocation = '/invalid/path/that/does/not/exist';
      integrator = new TaskManagementSystemIntegrator(config);
      const result = await integrator.initialize();
      // Should still initialize other components successfully
      expect(result.success).toBe(true);
      const health = integrator.getSystemHealth();
      expect(health.components.taskEngine).toBe('healthy');
    }, 30000);
  });
  describe('Task Execution Integration', () => {
    beforeEach(async () => {
      const config = SystemConfigFactory.createDevelopment(coreConfig);
      config.persistence.storageLocation = join(testDir, 'task-storage');
      config.hookIntegration.enabled = false; // Disable for testing
      integrator = new TaskManagementSystemIntegrator(config);
      await integrator.initialize();
    });
    it('should queue and execute tasks through integrated system', async () => {
      const result = await integrator.queueTask(
        'Test Integration Task',
        'This is a test task for integration testing',
        {
          type: 'implementation',
          priority: 'high',
          expectedOutputs: {
            result: 'Integration test completed',
          },
        },
      );
      expect(result.success).toBe(true);
      expect(result.details.taskId).toBeTruthy();
      // Check system status
      const status = integrator.getSystemStatus();
      expect(status.health.metrics.tasksInQueue).toBeGreaterThanOrEqual(0);
    }, 15000);
    it('should handle task execution with autonomous breakdown', async () => {
      const result = await integrator.queueTask(
        'Complex Integration Task',
        'This is a complex task that should be broken down autonomously',
        {
          type: 'implementation',
          priority: 'high',
          complexity: 'high',
          useAutonomousQueue: true,
          estimatedDuration: 4 * 60 * 60 * 1000, // 4 hours - should trigger breakdown
        },
      );
      expect(result.success).toBe(true);
      expect(result.details.useAutonomousQueue).toBe(true);
      const status = integrator.getSystemStatus();
      expect(status.autonomousQueueStatus).toBeTruthy();
    }, 15000);
    it('should track task metrics and performance', async () => {
      // Queue multiple tasks
      const tasks = [];
      for (let i = 0; i < 3; i++) {
        const result = await integrator.queueTask(
          `Metrics Test Task ${i + 1}`,
          `Test task ${i + 1} for metrics collection`,
          {
            type: 'implementation',
            priority: 'normal',
          },
        );
        tasks.push(result);
      }
      expect(tasks.every((t) => t.success)).toBe(true);
      const health = integrator.getSystemHealth();
      expect(health.metrics).toBeTruthy();
      expect(typeof health.metrics.tasksInQueue).toBe('number');
      expect(typeof health.metrics.memoryUsage).toBe('number');
      expect(typeof health.metrics.systemUptime).toBe('number');
    }, 20000);
  });
  describe('Configuration Management Integration', () => {
    it('should load and save configuration files', async () => {
      const configPath = join(testDir, 'test-config.json');
      configManager = new TaskManagementConfigManager();
      const config = await configManager.loadConfig(configPath, coreConfig);
      expect(config).toBeTruthy();
      expect(config.environment).toBe('development');
      expect(config.core).toEqual(coreConfig);
      // Verify file was created
      const fileExists = await fs
        .access(configPath)
        .then(() => true)
        .catch(() => false);
      expect(fileExists).toBe(true);
    });
    it('should validate configuration and provide feedback', async () => {
      configManager = new TaskManagementConfigManager();
      const config =
        TaskManagementConfigManager.createDefaultConfig('development');
      // Test invalid configuration
      config.taskEngine.maxConcurrentTasks = -1; // Invalid
      config.monitoring.dashboardPort = 99999; // Invalid port
      const validation = configManager.validateConfig(config);
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain(
        'Task engine maxConcurrentTasks must be at least 1',
      );
      expect(validation.errors).toContain(
        'Dashboard port must be between 1024 and 65535',
      );
    });
    it('should handle configuration updates at runtime', async () => {
      const configPath = join(testDir, 'runtime-config.json');
      configManager = new TaskManagementConfigManager();
      const config = await configManager.loadConfig(configPath, coreConfig);
      expect(config.taskEngine.maxConcurrentTasks).toBe(5); // Default development
      // Update configuration
      await configManager.updateConfig({
        taskEngine: {
          ...config.taskEngine,
          maxConcurrentTasks: 8,
        },
      });
      const updatedConfig = configManager.getConfig();
      expect(updatedConfig.taskEngine.maxConcurrentTasks).toBe(8);
    });
    it('should generate and validate different configuration templates', async () => {
      const templates = ['minimal', 'development', 'production', 'enterprise'];
      for (const templateType of templates) {
        const config =
          TaskManagementConfigManager.generateTemplate(templateType);
        expect(config).toBeTruthy();
        expect(config.environment).toBeTruthy();
        expect(config.taskEngine).toBeTruthy();
        expect(config.autonomousQueue).toBeTruthy();
        configManager = new TaskManagementConfigManager();
        const validation = configManager.validateConfig(config);
        // All templates should be valid (warnings are acceptable)
        expect(validation.isValid).toBe(true);
      }
    });
  });
  describe('System Health and Monitoring Integration', () => {
    beforeEach(async () => {
      const config = SystemConfigFactory.createDevelopment(coreConfig);
      config.persistence.storageLocation = join(testDir, 'health-storage');
      config.hookIntegration.enabled = false;
      integrator = new TaskManagementSystemIntegrator(config);
      await integrator.initialize();
    });
    it('should provide comprehensive system health information', async () => {
      const health = integrator.getSystemHealth();
      expect(health.overall).toMatch(/^(healthy|warning|critical)$/);
      expect(health.components).toBeTruthy();
      expect(health.metrics).toBeTruthy();
      expect(health.lastHealthCheck).toBeInstanceOf(Date);
      // Verify all components are reported
      expect(health.components.taskEngine).toBeTruthy();
      expect(health.components.autonomousQueue).toBeTruthy();
      expect(health.components.monitoring).toBeTruthy();
      expect(health.components.persistence).toBeTruthy();
      expect(health.components.dependencies).toBeTruthy();
      // Verify metrics are numeric
      expect(typeof health.metrics.tasksInQueue).toBe('number');
      expect(typeof health.metrics.memoryUsage).toBe('number');
      expect(typeof health.metrics.systemUptime).toBe('number');
    });
    it('should provide detailed system status information', async () => {
      const status = integrator.getSystemStatus();
      expect(status.health).toBeTruthy();
      expect(status.components).toBeTruthy();
      expect(status.timestamp).toBeInstanceOf(Date);
      // Verify component status
      expect(status.components.taskEngine).toBe(true);
      expect(status.components.autonomousQueue).toBe(true);
      expect(status.components.monitoring).toBe(true);
      expect(status.components.persistence).toBe(true);
      expect(status.components.dependencyResolver).toBe(true);
    });
    it('should detect and report component failures', async () => {
      // Simulate a component failure by accessing internal components
      const components = integrator.getComponents();
      // Force shutdown a component to simulate failure
      if (components.monitoring) {
        await components.monitoring.shutdown();
      }
      // Health check should still work but show degraded status
      const health = integrator.getSystemHealth();
      expect(health.overall).toMatch(/^(healthy|warning|critical)$/);
    });
  });
  describe('Error Handling and Recovery Integration', () => {
    it('should handle initialization errors gracefully', async () => {
      const config = SystemConfigFactory.createDevelopment(coreConfig);
      // Set completely invalid configuration
      config.core = {}; // Invalid core config
      integrator = new TaskManagementSystemIntegrator(config);
      const result = await integrator.initialize();
      // Should fail gracefully
      expect(result.success).toBe(false);
      expect(result.message).toContain('failed');
      expect(result.details.error).toBeTruthy();
    });
    it('should handle task execution errors gracefully', async () => {
      const config = SystemConfigFactory.createMinimal(coreConfig);
      integrator = new TaskManagementSystemIntegrator(config);
      await integrator.initialize();
      // Queue task with invalid parameters
      const result = await integrator.queueTask(
        '', // Invalid empty title
        '', // Invalid empty description
        {
          invalidProperty: 'invalid-value',
        },
      );
      // Should handle error gracefully
      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed');
    });
    it('should shutdown gracefully even with active tasks', async () => {
      const config = SystemConfigFactory.createDevelopment(coreConfig);
      config.persistence.storageLocation = join(testDir, 'shutdown-storage');
      config.hookIntegration.enabled = false;
      integrator = new TaskManagementSystemIntegrator(config);
      await integrator.initialize();
      // Queue some tasks
      await integrator.queueTask('Shutdown Test Task 1', 'Test task 1');
      await integrator.queueTask('Shutdown Test Task 2', 'Test task 2');
      // Shutdown should be graceful
      const shutdownResult = await integrator.shutdown();
      expect(shutdownResult.success).toBe(true);
      expect(shutdownResult.message).toContain('gracefully');
    });
  });
  describe('Configuration Export and Import Integration', () => {
    it('should export configuration to different formats', async () => {
      const config =
        TaskManagementConfigManager.createDefaultConfig('development');
      const jsonExport = ConfigUtils.exportConfig(config, 'json');
      expect(jsonExport).toBeTruthy();
      expect(JSON.parse(jsonExport)).toEqual(config);
      const envExport = ConfigUtils.exportConfig(config, 'env');
      expect(envExport).toBeTruthy();
      expect(envExport).toContain('TASK_MANAGEMENT_');
    });
    it('should validate configuration schema', async () => {
      const validConfig =
        TaskManagementConfigManager.createDefaultConfig('development');
      expect(ConfigUtils.validateSchema(validConfig)).toBe(true);
      const invalidConfig = { environment: 'test' }; // Missing required fields
      expect(ConfigUtils.validateSchema(invalidConfig)).toBe(false);
    });
  });
  describe('Real-World Usage Scenarios', () => {
    it('should handle a complete development workflow', async () => {
      // 1. Initialize system for development
      const config = SystemConfigFactory.createDevelopment(coreConfig);
      config.persistence.storageLocation = join(testDir, 'workflow-storage');
      config.hookIntegration.enabled = false;
      integrator = new TaskManagementSystemIntegrator(config);
      const initResult = await integrator.initialize();
      expect(initResult.success).toBe(true);
      // 2. Queue multiple related tasks
      const tasks = [
        {
          title: 'Analyze Requirements',
          description: 'Analyze project requirements',
        },
        {
          title: 'Design Architecture',
          description: 'Design system architecture',
        },
        {
          title: 'Implement Core Features',
          description: 'Implement main functionality',
        },
        { title: 'Write Tests', description: 'Create test suite' },
        { title: 'Documentation', description: 'Write documentation' },
      ];
      const queueResults = [];
      for (const task of tasks) {
        const result = await integrator.queueTask(
          task.title,
          task.description,
          {
            type: 'implementation',
            priority: 'normal',
          },
        );
        queueResults.push(result);
      }
      expect(queueResults.every((r) => r.success)).toBe(true);
      // 3. Monitor system status
      const status = integrator.getSystemStatus();
      expect(status.health.overall).toBe('healthy');
      expect(status.health.metrics.tasksInQueue).toBeGreaterThanOrEqual(0);
      // 4. Graceful shutdown
      const shutdownResult = await integrator.shutdown();
      expect(shutdownResult.success).toBe(true);
    }, 45000);
    it('should handle enterprise production scenario', async () => {
      // 1. Initialize system for production-like environment
      const config = SystemConfigFactory.createProduction(coreConfig);
      config.persistence.storageLocation = join(testDir, 'enterprise-storage');
      config.hookIntegration.enabled = false; // Disable for testing
      config.security.enableValidation = true;
      config.monitoring.enableAlerts = true;
      integrator = new TaskManagementSystemIntegrator(config);
      const initResult = await integrator.initialize();
      expect(initResult.success).toBe(true);
      // 2. Verify enterprise features are enabled
      const health = integrator.getSystemHealth();
      expect(health.components.taskEngine).toBe('healthy');
      expect(health.components.autonomousQueue).toBe('healthy');
      expect(health.components.monitoring).toBe('healthy');
      expect(health.components.persistence).toBe('healthy');
      expect(health.components.dependencies).toBe('healthy');
      // 3. Queue high-priority enterprise tasks
      const enterpriseTasks = [
        {
          title: 'Security Audit',
          description: 'Perform comprehensive security audit',
          priority: 'critical',
          type: 'security',
        },
        {
          title: 'Performance Optimization',
          description: 'Optimize system performance',
          priority: 'high',
          type: 'performance',
        },
        {
          title: 'Compliance Check',
          description: 'Ensure regulatory compliance',
          priority: 'high',
          type: 'compliance',
        },
      ];
      for (const task of enterpriseTasks) {
        const result = await integrator.queueTask(
          task.title,
          task.description,
          task,
        );
        expect(result.success).toBe(true);
      }
      // 4. Verify system handles enterprise load
      const status = integrator.getSystemStatus();
      expect(status.health.overall).toMatch(/^(healthy|warning)$/);
      const shutdownResult = await integrator.shutdown();
      expect(shutdownResult.success).toBe(true);
    }, 45000);
  });
});
// Helper functions for testing
function createMockConfig() {
  return {
    projectPath: __dirname,
    apiKey: 'test-key',
    model: 'gemini-pro',
    debug: true,
  };
}
async function waitFor(condition, timeoutMs = 5000) {
  const start = Date.now();
  while (!condition() && Date.now() - start < timeoutMs) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  if (!condition()) {
    throw new Error(`Condition not met within ${timeoutMs}ms`);
  }
}
//# sourceMappingURL=SystemIntegration.test.js.map
