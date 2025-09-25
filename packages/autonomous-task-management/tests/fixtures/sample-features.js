/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Sample feature data for testing autonomous task management components
 */
export const sampleFeatures = {
    suggested: {
        id: 'feature_1700000000000_abc123def456',
        title: 'Add dark mode toggle to user interface',
        description: 'Implement a toggle switch that allows users to switch between light and dark themes. The toggle should be persistent across browser sessions and provide smooth transitions between themes.',
        business_value: 'Improves user experience and accessibility by providing a preferred viewing mode for users, potentially reducing eye strain and increasing user engagement during extended usage sessions.',
        category: 'enhancement',
        status: 'suggested',
        created_at: '2025-09-25T00:00:00.000Z',
        updated_at: '2025-09-25T00:00:00.000Z',
        suggested_by: 'product_team',
        metadata: {
            estimated_effort: 'medium',
            target_version: '1.2.0'
        }
    },
    approved: {
        id: 'feature_1700000001000_def456ghi789',
        title: 'Implement user authentication system',
        description: 'Create a comprehensive user authentication system with login, logout, registration, password reset, and session management. Include OAuth integration for Google and GitHub providers.',
        business_value: 'Enables user-specific features, data personalization, and security controls. Essential for user data protection and compliance with privacy regulations.',
        category: 'new-feature',
        status: 'approved',
        created_at: '2025-09-24T00:00:00.000Z',
        updated_at: '2025-09-24T12:00:00.000Z',
        suggested_by: 'security_team',
        approved_by: 'tech_lead',
        approval_date: '2025-09-24T12:00:00.000Z',
        approval_notes: 'Critical security feature - high priority for implementation',
        metadata: {
            estimated_effort: 'high',
            target_version: '1.1.0',
            security_review_required: true
        }
    },
    rejected: {
        id: 'feature_1700000002000_ghi789jkl012',
        title: 'Add cryptocurrency payment integration',
        description: 'Integrate cryptocurrency payment options including Bitcoin, Ethereum, and other major cryptocurrencies for premium features.',
        business_value: 'Provides alternative payment methods for users who prefer cryptocurrency transactions and may increase conversion rates in certain demographics.',
        category: 'new-feature',
        status: 'rejected',
        created_at: '2025-09-23T00:00:00.000Z',
        updated_at: '2025-09-23T16:00:00.000Z',
        suggested_by: 'marketing_team',
        rejected_by: 'compliance_team',
        rejection_date: '2025-09-23T16:00:00.000Z',
        rejection_reason: 'Regulatory complexity and compliance requirements exceed current capacity',
        metadata: {
            estimated_effort: 'very_high',
            compliance_review: 'failed'
        }
    },
    implemented: {
        id: 'feature_1700000003000_jkl012mno345',
        title: 'Add real-time notifications system',
        description: 'Implement WebSocket-based real-time notifications for user actions, system updates, and important alerts. Include both in-app notifications and email notifications.',
        business_value: 'Improves user engagement by providing immediate feedback on actions and keeping users informed of important updates and system changes.',
        category: 'enhancement',
        status: 'implemented',
        created_at: '2025-09-20T00:00:00.000Z',
        updated_at: '2025-09-22T14:30:00.000Z',
        suggested_by: 'user_experience_team',
        approved_by: 'product_manager',
        approval_date: '2025-09-20T10:00:00.000Z',
        approval_notes: 'Excellent user experience enhancement',
        implemented_date: '2025-09-22T14:30:00.000Z',
        implementation_notes: 'Successfully implemented with WebSocket and email notification support',
        metadata: {
            estimated_effort: 'medium',
            target_version: '1.0.0',
            implementation_time_days: 2
        }
    },
    complexFeature: {
        id: 'feature_1700000004000_mno345pqr678',
        title: 'Advanced Analytics Dashboard with ML Insights',
        description: 'Create a comprehensive analytics dashboard with machine learning-powered insights, data visualization, real-time metrics, custom report generation, and predictive analytics capabilities.',
        business_value: 'Provides deep insights into user behavior and system performance, enables data-driven decision making, and offers competitive advantage through predictive analytics.',
        category: 'new-feature',
        status: 'approved',
        created_at: '2025-09-25T00:00:00.000Z',
        updated_at: '2025-09-25T08:00:00.000Z',
        suggested_by: 'data_team',
        approved_by: 'cto',
        approval_date: '2025-09-25T08:00:00.000Z',
        approval_notes: 'Strategic feature for competitive positioning',
        metadata: {
            estimated_effort: 'very_high',
            complexity: 'high',
            requires_ml_expertise: true,
            target_version: '2.0.0',
            epic: true
        }
    }
};
export const sampleTasks = {
    queued: {
        id: 'task_1700000000000_abc123def456',
        feature_id: 'feature_1700000001000_def456ghi789',
        title: 'Implement: User authentication system',
        description: 'Create a comprehensive user authentication system with login, logout, registration, password reset, and session management.',
        type: 'implementation',
        priority: 'high',
        status: 'queued',
        dependencies: [],
        estimated_effort: 'high',
        required_capabilities: ['backend', 'security'],
        created_at: '2025-09-25T00:00:00.000Z',
        updated_at: '2025-09-25T00:00:00.000Z',
        created_by: 'autonomous_system',
        metadata: {
            auto_generated: true,
            feature_category: 'new-feature',
            business_value: 'Enables user-specific features and security controls'
        }
    },
    assigned: {
        id: 'task_1700000001000_def456ghi789',
        feature_id: 'feature_1700000000000_abc123def456',
        title: 'Implement: Dark mode toggle',
        description: 'Implement a toggle switch that allows users to switch between light and dark themes.',
        type: 'implementation',
        priority: 'normal',
        status: 'assigned',
        assigned_to: 'FRONTEND_AGENT_001',
        assigned_at: '2025-09-25T01:00:00.000Z',
        dependencies: [],
        estimated_effort: 'medium',
        required_capabilities: ['frontend'],
        created_at: '2025-09-25T00:30:00.000Z',
        updated_at: '2025-09-25T01:00:00.000Z',
        created_by: 'autonomous_system',
        assignment_metadata: {
            forced: false,
            assignment_reason: 'capability_match'
        },
        metadata: {
            auto_generated: true,
            feature_category: 'enhancement'
        }
    },
    inProgress: {
        id: 'task_1700000002000_ghi789jkl012',
        feature_id: 'feature_1700000001000_def456ghi789',
        title: 'Write unit tests for authentication system',
        description: 'Create comprehensive unit tests for all authentication components including login, registration, and session management.',
        type: 'testing',
        priority: 'high',
        status: 'in_progress',
        assigned_to: 'TESTING_AGENT_001',
        assigned_at: '2025-09-25T02:00:00.000Z',
        dependencies: ['task_1700000000000_abc123def456'],
        estimated_effort: 'medium',
        required_capabilities: ['testing', 'backend'],
        created_at: '2025-09-25T00:45:00.000Z',
        updated_at: '2025-09-25T02:30:00.000Z',
        created_by: 'autonomous_system',
        progress_history: [
            {
                timestamp: '2025-09-25T02:00:00.000Z',
                status: 'assigned',
                progress_percentage: 0,
                notes: 'Task assigned to testing agent',
                updated_by: 'autonomous_system'
            },
            {
                timestamp: '2025-09-25T02:30:00.000Z',
                status: 'in_progress',
                progress_percentage: 25,
                notes: 'Started writing login tests',
                updated_by: 'TESTING_AGENT_001'
            }
        ],
        metadata: {
            auto_generated: true,
            feature_category: 'new-feature'
        }
    },
    completed: {
        id: 'task_1700000003000_jkl012mno345',
        feature_id: 'feature_1700000003000_jkl012mno345',
        title: 'Implement: Real-time notifications system',
        description: 'Implement WebSocket-based real-time notifications for user actions and system updates.',
        type: 'implementation',
        priority: 'normal',
        status: 'completed',
        assigned_to: 'BACKEND_AGENT_001',
        assigned_at: '2025-09-22T08:00:00.000Z',
        completed_at: '2025-09-22T14:30:00.000Z',
        dependencies: [],
        estimated_effort: 'medium',
        required_capabilities: ['backend', 'frontend'],
        created_at: '2025-09-22T07:00:00.000Z',
        updated_at: '2025-09-22T14:30:00.000Z',
        created_by: 'autonomous_system',
        progress_percentage: 100,
        progress_history: [
            {
                timestamp: '2025-09-22T08:00:00.000Z',
                status: 'assigned',
                progress_percentage: 0,
                notes: 'Task assigned to backend agent',
                updated_by: 'autonomous_system'
            },
            {
                timestamp: '2025-09-22T10:00:00.000Z',
                status: 'in_progress',
                progress_percentage: 30,
                notes: 'WebSocket server implementation started',
                updated_by: 'BACKEND_AGENT_001'
            },
            {
                timestamp: '2025-09-22T14:30:00.000Z',
                status: 'completed',
                progress_percentage: 100,
                notes: 'Real-time notifications fully implemented and tested',
                updated_by: 'BACKEND_AGENT_001'
            }
        ],
        metadata: {
            auto_generated: true,
            feature_category: 'enhancement',
            implementation_time_hours: 6.5
        }
    }
};
export const sampleAgents = {
    frontend: {
        id: 'FRONTEND_AGENT_001',
        lastHeartbeat: '2025-09-25T00:00:00.000Z',
        status: 'active',
        initialized: '2025-09-25T00:00:00.000Z',
        sessionId: 'abc123def456ghi789',
        capabilities: ['frontend', 'testing'],
        capabilities_registered_at: '2025-09-25T00:05:00.000Z',
        assigned_tasks: ['task_1700000001000_def456ghi789']
    },
    backend: {
        id: 'BACKEND_AGENT_001',
        lastHeartbeat: '2025-09-25T00:00:00.000Z',
        status: 'active',
        initialized: '2025-09-25T00:00:00.000Z',
        sessionId: 'def456ghi789jkl012',
        capabilities: ['backend', 'security', 'database'],
        capabilities_registered_at: '2025-09-25T00:05:00.000Z',
        assigned_tasks: []
    },
    testing: {
        id: 'TESTING_AGENT_001',
        lastHeartbeat: '2025-09-25T00:00:00.000Z',
        status: 'active',
        initialized: '2025-09-25T00:00:00.000Z',
        sessionId: 'ghi789jkl012mno345',
        capabilities: ['testing', 'performance', 'frontend', 'backend'],
        capabilities_registered_at: '2025-09-25T00:05:00.000Z',
        assigned_tasks: ['task_1700000002000_ghi789jkl012']
    },
    general: {
        id: 'GENERAL_AGENT_001',
        lastHeartbeat: '2025-09-25T00:00:00.000Z',
        status: 'active',
        initialized: '2025-09-25T00:00:00.000Z',
        sessionId: 'jkl012mno345pqr678',
        capabilities: ['general'],
        capabilities_registered_at: '2025-09-25T00:05:00.000Z',
        assigned_tasks: []
    }
};
export const sampleProjectStructure = {
    project: 'test-autonomous-task-management',
    features: [
        sampleFeatures.suggested,
        sampleFeatures.approved,
        sampleFeatures.rejected,
        sampleFeatures.implemented
    ],
    metadata: {
        version: '1.0.0',
        created: '2025-09-25T00:00:00.000Z',
        updated: '2025-09-25T00:00:00.000Z',
        total_features: 4,
        approval_history: [
            {
                feature_id: 'feature_1700000001000_def456ghi789',
                action: 'approved',
                timestamp: '2025-09-24T12:00:00.000Z',
                approved_by: 'tech_lead',
                notes: 'Critical security feature - high priority for implementation'
            },
            {
                feature_id: 'feature_1700000002000_ghi789jkl012',
                action: 'rejected',
                timestamp: '2025-09-23T16:00:00.000Z',
                rejected_by: 'compliance_team',
                reason: 'Regulatory complexity and compliance requirements exceed current capacity'
            }
        ],
        initialization_stats: {
            total_initializations: 10,
            total_reinitializations: 5,
            current_day: '2025-09-25',
            time_buckets: {
                '08:00-12:59': { init: 3, reinit: 1 },
                '13:00-17:59': { init: 4, reinit: 2 },
                '18:00-22:59': { init: 2, reinit: 1 },
                '23:00-03:59': { init: 1, reinit: 1 },
                '04:00-07:59': { init: 0, reinit: 0 }
            },
            daily_history: [],
            last_reset: '2025-09-25T00:00:00.000Z',
            last_updated: '2025-09-25T00:00:00.000Z'
        }
    },
    workflow_config: {
        require_approval: true,
        auto_reject_timeout_hours: 168,
        allowed_statuses: ['suggested', 'approved', 'rejected', 'implemented'],
        required_fields: ['title', 'description', 'business_value', 'category']
    },
    agents: sampleAgents,
    tasks: [
        sampleTasks.queued,
        sampleTasks.assigned,
        sampleTasks.inProgress,
        sampleTasks.completed
    ],
    completed_tasks: [
        {
            task_id: 'task_1700000003000_jkl012mno345',
            completed_at: '2025-09-22T14:30:00.000Z',
            assigned_to: 'BACKEND_AGENT_001',
            feature_id: 'feature_1700000003000_jkl012mno345'
        }
    ]
};
//# sourceMappingURL=sample-features.js.map