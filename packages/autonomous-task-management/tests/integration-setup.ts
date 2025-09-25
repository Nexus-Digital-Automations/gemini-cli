/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { vol } from 'memfs';
import { fsHelper } from './helpers/fs-helper';

// Integration test environment setup
beforeAll(() => {
  // Set integration test environment
  process.env.NODE_ENV = 'integration-test';
  process.env.GEMINI_CLI_INTEGRATION_TEST = 'true';

  // Extended timeout for integration tests
  global.integrationTestTimeout = 60000;
});

afterAll(() => {
  // Clean up integration test environment
  delete process.env.GEMINI_CLI_INTEGRATION_TEST;
});

beforeEach(() => {
  // Reset virtual file system for each integration test
  vol.reset();

  // Create multiple test projects for integration testing
  fsHelper.createBasicProjectStructure('/integration-test-project-1');
  fsHelper.createBasicProjectStructure('/integration-test-project-2');

  // Set up cross-project shared resources
  fsHelper.createMockFs({
    'shared-config': {
      'taskmanager.config.json': JSON.stringify({
        default_timeout: 10000,
        max_concurrent_tasks: 10,
        agent_heartbeat_interval: 5000,
        task_queue_batch_size: 5
      }, null, 2)
    }
  });
});

afterEach(() => {
  // Clean up after each integration test
  vol.reset();
});