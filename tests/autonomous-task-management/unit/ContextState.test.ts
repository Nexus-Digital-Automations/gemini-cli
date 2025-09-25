/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ContextState } from '../../../packages/core/src/core/subagent.js';

describe('ContextState - Autonomous Task Management Tests', () => {
  let context: ContextState;

  beforeEach(() => {
    context = new ContextState();
  });

  describe('Basic Operations', () => {
    it('should store and retrieve values correctly', () => {
      context.set('string_key', 'test_value');
      context.set('number_key', 42);
      context.set('boolean_key', true);
      context.set('object_key', { nested: 'value' });
      context.set('array_key', [1, 2, 3]);

      expect(context.get('string_key')).toBe('test_value');
      expect(context.get('number_key')).toBe(42);
      expect(context.get('boolean_key')).toBe(true);
      expect(context.get('object_key')).toEqual({ nested: 'value' });
      expect(context.get('array_key')).toEqual([1, 2, 3]);
    });

    it('should return undefined for non-existent keys', () => {
      expect(context.get('non_existent')).toBeUndefined();
    });

    it('should list all keys correctly', () => {
      context.set('key1', 'value1');
      context.set('key2', 'value2');
      context.set('key3', 'value3');

      const keys = context.get_keys();
      expect(keys).toEqual(['key1', 'key2', 'key3']);
    });

    it('should handle empty context', () => {
      expect(context.get_keys()).toEqual([]);
    });
  });

  describe('Complex Data Types', () => {
    it('should handle nested objects', () => {
      const complexObject = {
        user: {
          id: 123,
          profile: {
            name: 'John Doe',
            settings: {
              theme: 'dark',
              notifications: true,
            },
          },
        },
        metadata: {
          created: new Date('2023-01-01'),
          tags: ['important', 'user'],
        },
      };

      context.set('complex_data', complexObject);
      const retrieved = context.get('complex_data') as typeof complexObject;

      expect(retrieved).toEqual(complexObject);
      expect(retrieved.user.profile.name).toBe('John Doe');
      expect(retrieved.metadata.tags).toContain('important');
    });

    it('should handle functions as values', () => {
      const testFunction = (x: number) => x * 2;
      context.set('function_key', testFunction);

      const retrievedFunction = context.get('function_key') as typeof testFunction;
      expect(typeof retrievedFunction).toBe('function');
      expect(retrievedFunction(5)).toBe(10);
    });

    it('should handle null and undefined values', () => {
      context.set('null_key', null);
      context.set('undefined_key', undefined);

      expect(context.get('null_key')).toBeNull();
      expect(context.get('undefined_key')).toBeUndefined();
      expect(context.get_keys()).toContain('null_key');
      expect(context.get_keys()).toContain('undefined_key');
    });
  });

  describe('Task Management Context', () => {
    it('should store task-related context variables', () => {
      // Simulate typical task management context
      context.set('task_id', 'task_001');
      context.set('task_type', 'code_generation');
      context.set('priority', 'high');
      context.set('dependencies', ['task_000']);
      context.set('timeout_minutes', 10);
      context.set('max_retries', 3);
      context.set('tools_available', ['read_file', 'write_file', 'execute_command']);
      context.set('expected_outputs', { result: 'Generated code', metrics: 'Performance data' });

      expect(context.get('task_id')).toBe('task_001');
      expect(context.get('task_type')).toBe('code_generation');
      expect(context.get('priority')).toBe('high');
      expect(context.get('dependencies')).toEqual(['task_000']);
      expect(context.get('timeout_minutes')).toBe(10);
      expect(context.get('max_retries')).toBe(3);
      expect(context.get('tools_available')).toEqual(['read_file', 'write_file', 'execute_command']);
      expect(context.get('expected_outputs')).toEqual({
        result: 'Generated code',
        metrics: 'Performance data',
      });
    });

    it('should handle agent coordination context', () => {
      // Context for multi-agent coordination
      context.set('agent_id', 'agent_001');
      context.set('coordinator_id', 'coordinator_main');
      context.set('other_agents', ['agent_002', 'agent_003']);
      context.set('shared_resources', { database: 'shared_db', file_system: '/shared' });
      context.set('communication_channel', 'ipc_queue');

      expect(context.get('agent_id')).toBe('agent_001');
      expect(context.get('coordinator_id')).toBe('coordinator_main');
      expect(context.get('other_agents')).toEqual(['agent_002', 'agent_003']);
      expect(context.get('shared_resources')).toEqual({
        database: 'shared_db',
        file_system: '/shared',
      });
      expect(context.get('communication_channel')).toBe('ipc_queue');
    });

    it('should handle execution environment context', () => {
      // Environment-specific context
      context.set('working_directory', '/projects/current');
      context.set('environment', 'development');
      context.set('git_branch', 'feature/autonomous-tasks');
      context.set('node_version', '18.17.0');
      context.set('available_memory_mb', 2048);
      context.set('cpu_cores', 8);
      context.set('platform', 'darwin');

      expect(context.get('working_directory')).toBe('/projects/current');
      expect(context.get('environment')).toBe('development');
      expect(context.get('git_branch')).toBe('feature/autonomous-tasks');
      expect(context.get('node_version')).toBe('18.17.0');
      expect(context.get('available_memory_mb')).toBe(2048);
      expect(context.get('cpu_cores')).toBe(8);
      expect(context.get('platform')).toBe('darwin');
    });
  });

  describe('Dynamic Context Updates', () => {
    it('should handle context updates during execution', () => {
      // Initial context
      context.set('status', 'starting');
      context.set('progress', 0);
      context.set('errors', []);

      // Simulate execution updates
      context.set('status', 'in_progress');
      context.set('progress', 50);
      context.set('current_step', 'code_generation');

      // Add an error
      const currentErrors = context.get('errors') as string[];
      currentErrors.push('Warning: deprecated API used');
      context.set('errors', currentErrors);

      expect(context.get('status')).toBe('in_progress');
      expect(context.get('progress')).toBe(50);
      expect(context.get('current_step')).toBe('code_generation');
      expect(context.get('errors')).toEqual(['Warning: deprecated API used']);

      // Final update
      context.set('status', 'completed');
      context.set('progress', 100);
      context.set('end_time', new Date().toISOString());

      expect(context.get('status')).toBe('completed');
      expect(context.get('progress')).toBe(100);
      expect(context.get('end_time')).toBeTruthy();
    });

    it('should preserve references for complex objects', () => {
      const sharedState = {
        counter: 0,
        flags: { processing: false, error: false },
        history: [] as string[],
      };

      context.set('shared_state', sharedState);

      // Modify the original object
      sharedState.counter = 5;
      sharedState.flags.processing = true;
      sharedState.history.push('step_1', 'step_2');

      const retrievedState = context.get('shared_state') as typeof sharedState;
      expect(retrievedState.counter).toBe(5);
      expect(retrievedState.flags.processing).toBe(true);
      expect(retrievedState.history).toEqual(['step_1', 'step_2']);
      expect(retrievedState === sharedState).toBe(true); // Same reference
    });
  });

  describe('Context Validation and Edge Cases', () => {
    it('should handle key overwriting', () => {
      context.set('key1', 'original_value');
      expect(context.get('key1')).toBe('original_value');

      context.set('key1', 'new_value');
      expect(context.get('key1')).toBe('new_value');

      // Keys should not duplicate
      expect(context.get_keys().filter(k => k === 'key1')).toHaveLength(1);
    });

    it('should handle special characters in keys', () => {
      context.set('key with spaces', 'value1');
      context.set('key-with-dashes', 'value2');
      context.set('key_with_underscores', 'value3');
      context.set('key.with.dots', 'value4');
      context.set('key/with/slashes', 'value5');

      expect(context.get('key with spaces')).toBe('value1');
      expect(context.get('key-with-dashes')).toBe('value2');
      expect(context.get('key_with_underscores')).toBe('value3');
      expect(context.get('key.with.dots')).toBe('value4');
      expect(context.get('key/with/slashes')).toBe('value5');
    });

    it('should handle empty string keys and values', () => {
      context.set('', 'empty_key_value');
      context.set('empty_value_key', '');

      expect(context.get('')).toBe('empty_key_value');
      expect(context.get('empty_value_key')).toBe('');
      expect(context.get_keys()).toContain('');
      expect(context.get_keys()).toContain('empty_value_key');
    });

    it('should handle very large data', () => {
      // Create a reasonably large object
      const largeArray = Array.from({ length: 10000 }, (_, i) => ({
        id: i,
        data: `item_${i}`,
        timestamp: Date.now(),
      }));

      context.set('large_data', largeArray);
      const retrieved = context.get('large_data') as typeof largeArray;

      expect(retrieved).toHaveLength(10000);
      expect(retrieved[0]).toEqual({ id: 0, data: 'item_0', timestamp: expect.any(Number) });
      expect(retrieved[9999]).toEqual({ id: 9999, data: 'item_9999', timestamp: expect.any(Number) });
    });
  });

  describe('Context State Introspection', () => {
    it('should provide accurate key count', () => {
      expect(context.get_keys().length).toBe(0);

      context.set('key1', 'value1');
      expect(context.get_keys().length).toBe(1);

      context.set('key2', 'value2');
      context.set('key3', 'value3');
      expect(context.get_keys().length).toBe(3);

      // Overwriting doesn't increase count
      context.set('key1', 'new_value1');
      expect(context.get_keys().length).toBe(3);
    });

    it('should provide consistent key ordering', () => {
      const keys = ['first', 'second', 'third', 'fourth', 'fifth'];

      // Set keys in order
      keys.forEach((key, index) => {
        context.set(key, `value_${index}`);
      });

      const retrievedKeys = context.get_keys();
      expect(retrievedKeys).toEqual(keys);

      // Order should remain consistent across multiple calls
      expect(context.get_keys()).toEqual(retrievedKeys);
    });

    it('should handle context serialization needs', () => {
      // Set various types of data
      context.set('string', 'test');
      context.set('number', 42);
      context.set('boolean', true);
      context.set('object', { nested: 'value' });
      context.set('array', [1, 2, 3]);
      context.set('null_value', null);

      // Verify we can extract serializable data
      const keys = context.get_keys();
      const serializableData: Record<string, unknown> = {};

      keys.forEach(key => {
        const value = context.get(key);
        // Only include serializable values
        if (typeof value !== 'function') {
          serializableData[key] = value;
        }
      });

      expect(serializableData).toEqual({
        string: 'test',
        number: 42,
        boolean: true,
        object: { nested: 'value' },
        array: [1, 2, 3],
        null_value: null,
      });

      // Should be JSON serializable
      expect(() => JSON.stringify(serializableData)).not.toThrow();
    });
  });

  describe('Multi-Agent Context Scenarios', () => {
    it('should support agent-specific namespacing patterns', () => {
      // Pattern: agent_id.variable_name
      context.set('agent_001.status', 'running');
      context.set('agent_001.progress', 0.3);
      context.set('agent_002.status', 'waiting');
      context.set('agent_002.progress', 0.0);
      context.set('shared.coordinator_status', 'active');

      expect(context.get('agent_001.status')).toBe('running');
      expect(context.get('agent_001.progress')).toBe(0.3);
      expect(context.get('agent_002.status')).toBe('waiting');
      expect(context.get('agent_002.progress')).toBe(0.0);
      expect(context.get('shared.coordinator_status')).toBe('active');

      // Can filter keys by agent
      const agent001Keys = context.get_keys().filter(key => key.startsWith('agent_001.'));
      expect(agent001Keys).toEqual(['agent_001.status', 'agent_001.progress']);
    });

    it('should handle task dependency chains in context', () => {
      // Complex dependency scenario
      context.set('task_A.status', 'completed');
      context.set('task_A.output', { data: 'result_A' });
      context.set('task_B.status', 'running');
      context.set('task_B.dependencies', ['task_A']);
      context.set('task_B.input', context.get('task_A.output'));
      context.set('task_C.status', 'waiting');
      context.set('task_C.dependencies', ['task_B']);

      expect(context.get('task_B.input')).toEqual({ data: 'result_A' });
      expect(context.get('task_C.dependencies')).toEqual(['task_B']);

      // Simulate task B completion
      context.set('task_B.status', 'completed');
      context.set('task_B.output', { data: 'result_B', source: 'result_A' });
      context.set('task_C.status', 'running');
      context.set('task_C.input', context.get('task_B.output'));

      expect(context.get('task_C.input')).toEqual({ data: 'result_B', source: 'result_A' });
    });
  });
});