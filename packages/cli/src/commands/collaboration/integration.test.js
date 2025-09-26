/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { jest } from '@jest/globals';
import { SessionManager } from '@gemini-cli/core/src/collaboration/SessionManager.js';
import { CollaborationEventBus } from '@gemini-cli/core/src/collaboration/CollaborationEventBus.js';
import { ContextSynchronizer } from '@gemini-cli/core/src/collaboration/ContextSynchronizer.js';
import { ConflictResolver } from '@gemini-cli/core/src/collaboration/ConflictResolver.js';
import { SessionRecorder } from '@gemini-cli/core/src/collaboration/SessionRecorder.js';

describe('Collaboration System Integration', () => {
    let sessionManager, eventBus, contextSync, conflictResolver, recorder;

    beforeEach(() => {
        sessionManager = new SessionManager();
        eventBus = new CollaborationEventBus();
        contextSync = new ContextSynchronizer();
        conflictResolver = new ConflictResolver();
        recorder = new SessionRecorder();
    });

    afterEach(() => {
        // Clean up resources
        if (sessionManager.destroy) sessionManager.destroy();
        if (eventBus.destroy) eventBus.destroy();
        if (contextSync.destroy) contextSync.destroy();
        if (recorder.destroy) recorder.destroy();
    });

    test('should create and manage collaboration session lifecycle', async () => {
        // Create a session
        const sessionConfig = {
            sessionType: 'PAIR',
            maxParticipants: 4,
            autoRecord: false,
            conflictResolution: {
                defaultStrategy: 'ROLE_PRIORITY',
                autoResolve: true
            },
            sharedContext: {
                enableSharing: true,
                syncFrequencyMs: 1000,
                maxContextItems: 100
            }
        };

        const session = await sessionManager.createSession(
            'Integration Test Session',
            sessionConfig,
            'Test session for integration testing'
        );

        expect(session).toBeDefined();
        expect(session.id).toBeDefined();
        expect(session.name).toBe('Integration Test Session');
        expect(session.status).toBe('ACTIVE');
        expect(session.participants).toHaveLength(1); // Host participant
        expect(session.host).toBeDefined();
    });

    test('should handle participant joining and leaving', async () => {
        // Create a session
        const session = await sessionManager.createSession('Test Session', {
            sessionType: 'PAIR',
            maxParticipants: 4
        });

        // Join session as a participant
        const updatedSession = await sessionManager.joinSession(
            session.id,
            'TestParticipant',
            {
                name: 'Test Participant',
                role: 'NAVIGATOR',
                preferences: {
                    autoSync: true,
                    notificationLevel: 'IMPORTANT'
                }
            }
        );

        expect(updatedSession.participants).toHaveLength(2);

        const participant = updatedSession.participants.find(p => p.name === 'Test Participant');
        expect(participant).toBeDefined();
        expect(participant.role).toBe('NAVIGATOR');

        // Leave session
        const finalSession = await sessionManager.leaveSession(
            session.id,
            participant.id,
            'Test completed'
        );

        expect(finalSession.participants).toHaveLength(1); // Only host remains
    });

    test('should manage shared context synchronization', async () => {
        const sessionId = 'test-session-sync';

        // Create shared context
        const sharedContext = await contextSync.createSharedContext(sessionId, {
            sharedContext: {
                syncFrequencyMs: 100,
                maxContextItems: 50
            }
        });

        expect(sharedContext).toBeDefined();
        expect(sharedContext.items).toBeDefined();
        expect(sharedContext.syncState).toBeDefined();

        // Add context item
        const contextItem = {
            id: 'test-item-1',
            type: 'FILE',
            source: 'test.js',
            content: 'console.log("Hello World");',
            priority: 'MEDIUM',
            lastAccessed: new Date(),
            description: 'Test file for integration',
            metadata: {
                filePath: '/test/test.js',
                size: 26
            }
        };

        await contextSync.addContextItem(sessionId, contextItem, 'participant1');

        const participantContext = contextSync.getContextForParticipant(sessionId, 'participant1');
        expect(participantContext).toHaveLength(1);
        expect(participantContext[0].id).toBe('test-item-1');
    });

    test('should handle conflict detection and resolution', async () => {
        const sessionId = 'test-session-conflicts';

        // Create conflicting changes
        const changes = [
            {
                id: 'change-1',
                participantId: 'participant1',
                timestamp: new Date(),
                content: { location: 'file:test.js', newCode: 'version 1' },
                description: 'file:test.js modified by participant1'
            },
            {
                id: 'change-2',
                participantId: 'participant2',
                timestamp: new Date(Date.now() + 1000),
                content: { location: 'file:test.js', newCode: 'version 2' },
                description: 'file:test.js modified by participant2'
            }
        ];

        const participants = [
            {
                id: 'participant1',
                name: 'Alice',
                role: 'DRIVER'
            },
            {
                id: 'participant2',
                name: 'Bob',
                role: 'NAVIGATOR'
            }
        ];

        // Detect conflicts
        const conflicts = await conflictResolver.detectConflicts(sessionId, changes, participants);
        expect(conflicts).toHaveLength(1);

        const conflict = conflicts[0];
        expect(conflict.type).toBe('CODE_EDIT_CONFLICT');
        expect(conflict.participants).toHaveLength(2);
        expect(conflict.status).toBe('PENDING');

        // Resolve conflict using role priority
        const resolution = await conflictResolver.resolveConflict(
            conflict.id,
            'ROLE_PRIORITY',
            'system',
            { participants }
        );

        expect(resolution).toBeDefined();
        expect(resolution.strategy).toBe('ROLE_PRIORITY');
        expect(resolution.resolvedBy).toBe('system');
        expect(resolution.resolvedContent).toBe('version 1'); // DRIVER wins
    });

    test('should record and play back session events', async () => {
        const sessionId = 'test-session-recording';

        // Start recording
        await recorder.startRecording(sessionId, {
            testMode: true,
            description: 'Integration test recording'
        });

        // Record some events
        const testEvent = {
            id: 'event-1',
            type: 'CODE_EDIT',
            sessionId,
            participantId: 'participant1',
            timestamp: new Date(),
            data: {
                file: 'test.js',
                action: 'edit',
                content: 'new code'
            }
        };

        await recorder.recordEvent(sessionId, testEvent);

        // Stop recording
        const recording = await recorder.stopRecording(sessionId, 'Test completed');

        expect(recording).toBeDefined();
        expect(recording.id).toBeDefined();
        expect(recording.sessionId).toBe(sessionId);
        expect(recording.events).toHaveLength(1);
        expect(recording.metadata.eventCount).toBe(1);
        expect(recording.metadata.durationMs).toBeGreaterThan(0);

        // Load and verify recording
        const loadedRecording = await recorder.loadRecording(recording.id);
        expect(loadedRecording.id).toBe(recording.id);
        expect(loadedRecording.events).toHaveLength(1);
        expect(loadedRecording.events[0].type).toBe('CODE_EDIT');
    });

    test('should handle event bus communication', async () => {
        let receivedEvents = [];

        // Subscribe to events
        eventBus.on('collaborationEvent', (event) => {
            receivedEvents.push(event);
        });

        // Publish test event
        const testEvent = {
            id: 'event-bus-test-1',
            type: 'PARTICIPANT_JOINED',
            sessionId: 'test-session',
            participantId: 'participant1',
            timestamp: new Date(),
            data: {
                participantName: 'Test User',
                role: 'NAVIGATOR'
            }
        };

        await eventBus.publishEvent(testEvent);

        // Verify event was received
        expect(receivedEvents).toHaveLength(1);
        expect(receivedEvents[0].id).toBe('event-bus-test-1');
        expect(receivedEvents[0].type).toBe('PARTICIPANT_JOINED');
    });

    test('should integrate all components in complete workflow', async () => {
        const sessionId = 'complete-workflow-test';

        // 1. Create session with recording
        const session = await sessionManager.createSession('Complete Workflow Test', {
            sessionType: 'PAIR',
            maxParticipants: 4,
            autoRecord: true,
            conflictResolution: {
                defaultStrategy: 'ROLE_PRIORITY',
                autoResolve: false
            }
        });

        // 2. Set up shared context
        const sharedContext = await contextSync.createSharedContext(session.id);

        // 3. Start recording (should be automatic but verify)
        const activeRecordings = recorder.getActiveRecordings();
        const sessionRecording = activeRecordings.find(r => r.sessionId === session.id);
        expect(sessionRecording).toBeDefined();

        // 4. Add participants
        const updatedSession = await sessionManager.joinSession(
            session.id,
            'Participant1',
            { name: 'Alice', role: 'NAVIGATOR' }
        );

        // 5. Share context
        const contextItem = {
            id: 'workflow-item',
            type: 'CODE',
            source: 'workflow.js',
            content: 'function test() { return true; }',
            priority: 'HIGH',
            lastAccessed: new Date(),
            description: 'Workflow test function'
        };

        await contextSync.addContextItem(session.id, contextItem, 'host');

        // 6. Verify complete integration
        expect(updatedSession.participants).toHaveLength(2);
        expect(updatedSession.sharedContext.items.size).toBe(1);

        const participantContext = contextSync.getContextForParticipant(session.id, 'host');
        expect(participantContext).toHaveLength(1);
        expect(participantContext[0].id).toBe('workflow-item');

        // 7. Clean up
        await sessionManager.leaveSession(session.id, 'host', 'Workflow test completed');

        // Session should now be ended or have minimal participants
        const stats = eventBus.getEventStats(session.id);
        expect(stats.totalEvents).toBeGreaterThan(0);
    });
});