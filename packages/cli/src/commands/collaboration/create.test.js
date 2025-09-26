/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { jest } from '@jest/globals';
import { createCommand } from './create.js';

// Mock the SessionManager
jest.mock('@gemini-cli/core/src/collaboration/SessionManager.js', () => ({
  SessionManager: jest.fn().mockImplementation(() => ({
    createSession: jest.fn().mockResolvedValue({
      id: 'test_session_123',
      name: 'Test Session',
      status: 'ACTIVE',
      host: {
        id: 'user1',
        name: 'Test User',
        role: 'DRIVER',
      },
      config: {
        sessionType: 'PAIR',
        recording: { enabled: false },
      },
      createdAt: new Date('2025-01-01T12:00:00Z'),
    }),
  })),
}));

// Mock filesystem operations
jest.mock('node:fs/promises', () => ({
  mkdir: jest.fn().mockResolvedValue(undefined),
  writeFile: jest.fn().mockResolvedValue(undefined),
}));

describe('collaboration create command', () => {
  let mockConsoleLog; let mockConsoleError; let mockProcessExit;

  beforeEach(() => {
    mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
    mockConsoleError = jest.spyOn(console, 'error').mockImplementation();
    mockProcessExit = jest.spyOn(process, 'exit').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('should have correct command structure', () => {
    expect(createCommand.command).toBe('create [name]');
    expect(createCommand.describe).toContain(
      'Create a new collaborative programming session',
    );
    expect(createCommand.builder).toBeDefined();
    expect(typeof createCommand.builder).toBe('function');
    expect(createCommand.handler).toBeDefined();
    expect(typeof createCommand.handler).toBe('function');
  });

  test('should configure yargs options correctly', () => {
    const mockYargs = {
      positional: jest.fn().mockReturnThis(),
      option: jest.fn().mockReturnThis(),
      example: jest.fn().mockReturnThis(),
    };

    createCommand.builder(mockYargs);

    // Check that name positional is configured
    expect(mockYargs.positional).toHaveBeenCalledWith('name', {
      describe: 'Name for the collaboration session',
      type: 'string',
      default: expect.stringMatching(/^Session-\d+$/),
    });

    // Check that key options are configured
    const optionCalls = mockYargs.option.mock.calls;
    const optionNames = optionCalls.map((call) => call[0]);

    expect(optionNames).toContain('type');
    expect(optionNames).toContain('description');
    expect(optionNames).toContain('max-participants');
    expect(optionNames).toContain('auto-record');
    expect(optionNames).toContain('conflict-strategy');
    expect(optionNames).toContain('sync-frequency');

    // Check that examples are provided
    expect(mockYargs.example).toHaveBeenCalled();
  });

  test('should create session with default options', async () => {
    const argv = {
      name: 'Test Session',
      type: 'PAIR',
      maxParticipants: 8,
      autoRecord: false,
      conflictStrategy: 'ROLE_PRIORITY',
      syncFrequency: 5000,
    };

    await createCommand.handler(argv);

    expect(mockConsoleLog).toHaveBeenCalledWith(
      expect.stringContaining('🚀 Creating new collaboration session...'),
    );
    expect(mockConsoleLog).toHaveBeenCalledWith(
      expect.stringContaining('✅ Session created successfully!'),
    );
    expect(mockConsoleLog).toHaveBeenCalledWith(
      expect.stringContaining('test_session_123'),
    );
  });

  test('should create session with custom options', async () => {
    const argv = {
      name: 'MOB Session',
      type: 'MOB',
      description: 'Team mob programming',
      maxParticipants: 10,
      autoRecord: true,
      conflictStrategy: 'LAST_WRITE_WINS',
      syncFrequency: 3000,
    };

    await createCommand.handler(argv);

    expect(mockConsoleLog).toHaveBeenCalledWith(
      expect.stringContaining('🚀 Creating new collaboration session...'),
    );
    expect(mockConsoleLog).toHaveBeenCalledWith(
      expect.stringContaining('✅ Session created successfully!'),
    );
    expect(mockConsoleLog).toHaveBeenCalledWith(
      expect.stringContaining('📹 Recording: ENABLED'),
    );
  });

  test('should handle session creation errors gracefully', async () => {
    // Mock SessionManager to throw error
    const { SessionManager } = await import(
      '@gemini-cli/core/src/collaboration/SessionManager.js'
    );
    SessionManager.mockImplementation(() => ({
      createSession: jest.fn().mockRejectedValue(new Error('Network error')),
    }));

    const argv = {
      name: 'Test Session',
      type: 'PAIR',
      maxParticipants: 8,
      autoRecord: false,
      conflictStrategy: 'ROLE_PRIORITY',
      syncFrequency: 5000,
    };

    await createCommand.handler(argv);

    expect(mockConsoleError).toHaveBeenCalledWith(
      expect.stringContaining('❌ Failed to create collaboration session:'),
    );
    expect(mockConsoleError).toHaveBeenCalledWith(
      expect.stringContaining('Network error'),
    );
    expect(mockProcessExit).toHaveBeenCalledWith(1);
  });

  test('should provide helpful troubleshooting information', async () => {
    // Mock SessionManager to throw error
    const { SessionManager } = await import(
      '@gemini-cli/core/src/collaboration/SessionManager.js'
    );
    SessionManager.mockImplementation(() => ({
      createSession: jest
        .fn()
        .mockRejectedValue(new Error('Permission denied')),
    }));

    const argv = {
      name: 'Test Session',
      type: 'PAIR',
      maxParticipants: 8,
      autoRecord: false,
      conflictStrategy: 'ROLE_PRIORITY',
      syncFrequency: 5000,
    };

    await createCommand.handler(argv);

    expect(mockConsoleLog).toHaveBeenCalledWith(
      expect.stringContaining('💡 Troubleshooting:'),
    );
    expect(mockConsoleLog).toHaveBeenCalledWith(
      expect.stringContaining('Ensure you have proper permissions'),
    );
  });

  test('should validate session type choices', () => {
    const mockYargs = {
      positional: jest.fn().mockReturnThis(),
      option: jest.fn().mockReturnThis(),
      example: jest.fn().mockReturnThis(),
    };

    createCommand.builder(mockYargs);

    const typeOption = mockYargs.option.mock.calls.find(
      (call) => call[0] === 'type',
    );
    expect(typeOption).toBeDefined();
    expect(typeOption[1].choices).toEqual([
      'PAIR',
      'MOB',
      'REVIEW',
      'MENTOR',
      'ASYNC',
    ]);
    expect(typeOption[1].default).toBe('PAIR');
  });

  test('should validate conflict strategy choices', () => {
    const mockYargs = {
      positional: jest.fn().mockReturnThis(),
      option: jest.fn().mockReturnThis(),
      example: jest.fn().mockReturnThis(),
    };

    createCommand.builder(mockYargs);

    const strategyOption = mockYargs.option.mock.calls.find(
      (call) => call[0] === 'conflict-strategy',
    );
    expect(strategyOption).toBeDefined();
    expect(strategyOption[1].choices).toEqual([
      'LAST_WRITE_WINS',
      'ROLE_PRIORITY',
      'MANUAL',
      'VERSION_BRANCHING',
    ]);
    expect(strategyOption[1].default).toBe('ROLE_PRIORITY');
  });
});
