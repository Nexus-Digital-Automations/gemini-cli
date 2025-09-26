/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { jest } from '@jest/globals';
import { collaborationCommand } from './collaboration.js';

describe('collaboration command', () => {
    test('should have correct command structure', () => {
        expect(collaborationCommand.command).toBe('collab');
        expect(collaborationCommand.describe).toContain('collaborative programming sessions');
        expect(collaborationCommand.builder).toBeDefined();
        expect(typeof collaborationCommand.builder).toBe('function');
        expect(collaborationCommand.handler).toBeDefined();
        expect(typeof collaborationCommand.handler).toBe('function');
    });

    test('should register subcommands correctly', () => {
        const mockYargs = {
            command: jest.fn().mockReturnThis(),
            demandCommand: jest.fn().mockReturnThis(),
            version: jest.fn().mockReturnThis(),
            example: jest.fn().mockReturnThis(),
            epilog: jest.fn().mockReturnThis(),
        };

        collaborationCommand.builder(mockYargs);

        // Should call command 8 times for all subcommands
        expect(mockYargs.command).toHaveBeenCalledTimes(8);
        expect(mockYargs.demandCommand).toHaveBeenCalledWith(1, 'You need at least one command before continuing.');
    });

    test('should include all required subcommands', () => {
        const mockYargs = {
            command: jest.fn().mockReturnThis(),
            demandCommand: jest.fn().mockReturnThis(),
            version: jest.fn().mockReturnThis(),
            example: jest.fn().mockReturnThis(),
            epilog: jest.fn().mockReturnThis(),
        };

        collaborationCommand.builder(mockYargs);

        const commandCalls = mockYargs.command.mock.calls;
        const commands = commandCalls.map(call => call[0]);

        // Check that all expected command objects are passed
        expect(commands).toHaveLength(8);

        // We can't easily test the command names since they're objects,
        // but we can verify the count matches our expected subcommands:
        // create, join, leave, status, share, record, playback, list
    });

    test('should have proper example usage', () => {
        const mockYargs = {
            command: jest.fn().mockReturnThis(),
            demandCommand: jest.fn().mockReturnThis(),
            version: jest.fn().mockReturnThis(),
            example: jest.fn().mockReturnThis(),
            epilog: jest.fn().mockReturnThis(),
        };

        collaborationCommand.builder(mockYargs);

        // Should include multiple examples
        expect(mockYargs.example).toHaveBeenCalled();
        const exampleCalls = mockYargs.example.mock.calls;

        // Check that examples include key functionality
        const examples = exampleCalls.map(call => call[0]);
        expect(examples.some(example => example.includes('create'))).toBe(true);
        expect(examples.some(example => example.includes('join'))).toBe(true);
        expect(examples.some(example => example.includes('share'))).toBe(true);
    });

    test('should have comprehensive help text', () => {
        const mockYargs = {
            command: jest.fn().mockReturnThis(),
            demandCommand: jest.fn().mockReturnThis(),
            version: jest.fn().mockReturnThis(),
            example: jest.fn().mockReturnThis(),
            epilog: jest.fn().mockReturnThis(),
        };

        collaborationCommand.builder(mockYargs);

        // Should have epilog with feature descriptions
        expect(mockYargs.epilog).toHaveBeenCalledTimes(1);
        const epilogText = mockYargs.epilog.mock.calls[0][0];

        expect(epilogText).toContain('Pair-Programming Mode');
        expect(epilogText).toContain('Real-time collaborative code editing');
        expect(epilogText).toContain('Session recording and playback');
        expect(epilogText).toContain('PAIR');
        expect(epilogText).toContain('MOB');
        expect(epilogText).toContain('REVIEW');
        expect(epilogText).toContain('MENTOR');
        expect(epilogText).toContain('ASYNC');
    });
});